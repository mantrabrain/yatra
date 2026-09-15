<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\PaymentRepository;
use Yatra\Repositories\BookingRepository;

/**
 * Payment Service
 * 
 * Contains business logic for payments.
 * 
 * @package Yatra\Services
 */
class PaymentService
{
    private PaymentRepository $paymentRepository;
    private BookingRepository $bookingRepository;

    public function __construct()
    {
        $this->paymentRepository = new PaymentRepository();
        $this->bookingRepository = new BookingRepository();
    }

    /**
     * Get paginated payments
     * 
     * @param array $filters Filters
     * @return array
     */
    public function getPayments(array $filters = []): array
    {
        $result = $this->paymentRepository->paginate($filters);

        $result['data'] = array_map([$this, 'formatPayment'], $result['data']);

        return $result;
    }

    /**
     * Get single payment
     * 
     * @param int $id Payment ID
     * @return array|null
     */
    public function getPayment(int $id): ?array
    {
        $payment = $this->paymentRepository->findWithBooking($id);

        if (!$payment) {
            return null;
        }

        return $this->formatPayment($payment);
    }

    /**
     * Get payments for a booking
     * 
     * @param int $bookingId Booking ID
     * @return array
     */
    public function getBookingPayments(int $bookingId): array
    {
        $payments = $this->paymentRepository->findByBookingId($bookingId);

        return array_map([$this, 'formatPayment'], $payments);
    }

    /**
     * Create a new payment
     * 
     * @param array $data Payment data
     * @return array {success: bool, payment_id?: int, message: string}
     */
    public function createPayment(array $data): array
    {
        // Validate booking exists
        $booking = $this->bookingRepository->find((int) $data['booking_id']);

        if (!$booking) {
            return ['success' => false, 'message' => __('Booking not found.', 'yatra')];
        }

        // The payments table's status column is an enum; a value outside it
        // (the admin form used to offer "partial") was stored as '' on lenient
        // MySQL and rejected outright on strict mode — either way the payment
        // never counted towards the booking. Refuse it up front instead.
        $data = self::normalizeStatus($data);
        if (isset($data['status']) && !self::isValidStatus($data['status'])) {
            return ['success' => false, 'message' => __('Invalid status.', 'yatra')];
        }

        // A payment recorded by hand carries no currency, and both the payments and
        // bookings tables declare `currency char(3) DEFAULT 'USD'` — so on a Euro
        // store a manual payment was saved as USD and listed with a dollar sign
        // beside correctly-formatted euro rows.
        //
        // The store currency is the source of truth here, not the booking's own
        // column: that column is only written when a caller passes it, so it silently
        // inherits the same 'USD' default and would just propagate the wrong value.
        // Multi-currency is not a shipped feature, so every amount is in the store
        // currency by definition.
        if (empty($data['currency'])) {
            $data['currency'] = SettingsService::getCurrency();
        }

        // Create payment
        $paymentId = $this->paymentRepository->create($data);

        if (!$paymentId) {
            return ['success' => false, 'message' => __('Failed to create payment.', 'yatra')];
        }

        // Update booking amount paid (also refreshes amount_due + payment_status,
        // so the notification below picks the correct part/full template).
        $totalPaid = $this->paymentRepository->getTotalPaidForBooking((int) $data['booking_id']);
        $this->bookingRepository->updateAmountPaid((int) $data['booking_id'], $totalPaid);

        // A payment recorded as completed is money actually received: dispatch
        // it exactly like a gateway capture (emails + payment.received /
        // payment.partial_received automations, webhooks, …). Pending / failed /
        // refunded records are bookkeeping only.
        if (($data['status'] ?? '') === 'completed') {
            $this->dispatchPaymentCompleted((int) $paymentId, $data);
        }

        return [
            'success' => true,
            'payment_id' => $paymentId,
            'message' => __('Payment recorded successfully.', 'yatra'),
        ];
    }

    /**
     * Statuses the payments table accepts (its `status` enum).
     */
    public static function isValidStatus(string $status): bool
    {
        return in_array($status, ['pending', 'completed', 'failed', 'refunded', 'cancelled'], true);
    }

    /**
     * A null / blank status means "not specified": drop the key so the table
     * default (create) or the current value (update) applies, instead of the
     * repository writing '' into the enum column. Otherwise lower-case it.
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private static function normalizeStatus(array $data): array
    {
        if (!array_key_exists('status', $data)) {
            return $data;
        }
        $status = strtolower(trim((string) $data['status']));
        if ($status === '') {
            unset($data['status']);
        } else {
            $data['status'] = $status;
        }

        return $data;
    }

    /**
     * Fire `yatra_payment_completed` for a manually recorded payment.
     *
     * Same action and array payload the gateways fire after a capture, so the
     * existing listeners do the rest: core sends the customer/admin "payment
     * received" emails (NotificationHooks), Pro Email Automation fires
     * `payment.partial_received` or `payment.received` from the booking's
     * remaining balance, webhooks / WhatsApp deliver the matching event, and
     * Scheduled Payments retires pending charges when this settles the balance.
     * Called only when a payment BECOMES completed, never on a re-save, so
     * nothing is sent twice. The pre-existing `yatra_send_manual_payment_emails`
     * filter still lets an operator keep the emails off; the event itself is
     * always fired.
     *
     * @param array<string, mixed> $data The payment row (or the create payload).
     */
    private function dispatchPaymentCompleted(int $paymentId, array $data): void
    {
        $bookingId = (int) ($data['booking_id'] ?? 0);
        if ($bookingId <= 0) {
            return;
        }

        $sendEmails = (bool) apply_filters('yatra_send_manual_payment_emails', true, $bookingId, $data);
        $gateway = (string) ($data['gateway'] ?? ($data['payment_method'] ?? ''));

        do_action('yatra_payment_completed', [
            'booking_id' => $bookingId,
            'payment_id' => $paymentId,
            'amount' => (float) ($data['amount'] ?? 0),
            'currency' => (string) ($data['currency'] ?? SettingsService::getCurrency()),
            'gateway' => $gateway,
            'payment_method' => $gateway,
            'transaction_id' => (string) ($data['transaction_id'] ?? ''),
            'source' => 'manual',
            'send_emails' => $sendEmails,
        ]);
    }

    /**
     * Update a payment
     * 
     * @param int   $id   Payment ID
     * @param array $data Payment data
     * @return array {success: bool, message: string}
     */
    public function updatePayment(int $id, array $data): array
    {
        $payment = $this->paymentRepository->find($id);

        if (!$payment) {
            return ['success' => false, 'message' => __('Payment not found.', 'yatra')];
        }

        $data = self::normalizeStatus($data);
        if (isset($data['status']) && !self::isValidStatus($data['status'])) {
            return ['success' => false, 'message' => __('Invalid status.', 'yatra')];
        }

        $updated = $this->paymentRepository->update($id, $data);

        if (!$updated) {
            return ['success' => false, 'message' => __('Failed to update payment.', 'yatra')];
        }

        // Recalculate booking amount paid
        $totalPaid = $this->paymentRepository->getTotalPaidForBooking((int) $payment->booking_id);
        $this->bookingRepository->updateAmountPaid((int) $payment->booking_id, $totalPaid);

        // Edited from pending/failed/… to completed → the money has now been
        // received; dispatch once, on that transition only.
        $wasCompleted = (string) ($payment->status ?? '') === 'completed';
        $isCompleted = (string) ($data['status'] ?? $payment->status ?? '') === 'completed';
        if ($isCompleted && !$wasCompleted) {
            $updatedRow = $this->paymentRepository->find($id);
            $this->dispatchPaymentCompleted($id, $updatedRow ? (array) $updatedRow : array_merge((array) $payment, $data));
        }

        return [
            'success' => true,
            'message' => __('Payment updated successfully.', 'yatra'),
        ];
    }

    /**
     * Update payment status
     * 
     * @param int    $id     Payment ID
     * @param string $status New status
     * @return array {success: bool, message: string}
     */
    public function updateStatus(int $id, string $status): array
    {
        $validStatuses = ['pending', 'completed', 'failed', 'refunded', 'cancelled'];

        if (!in_array($status, $validStatuses, true)) {
            return ['success' => false, 'message' => __('Invalid status.', 'yatra')];
        }

        $payment = $this->paymentRepository->find($id);

        if (!$payment) {
            return ['success' => false, 'message' => __('Payment not found.', 'yatra')];
        }

        $updated = $this->paymentRepository->updateStatus($id, $status);

        if (!$updated) {
            return ['success' => false, 'message' => __('Failed to update status.', 'yatra')];
        }

        // Recalculate booking amount paid
        $totalPaid = $this->paymentRepository->getTotalPaidForBooking((int) $payment->booking_id);
        $this->bookingRepository->updateAmountPaid((int) $payment->booking_id, $totalPaid);

        // "Mark as Completed" on a pending payment = the money arrived.
        if ($status === 'completed' && (string) ($payment->status ?? '') !== 'completed') {
            $this->dispatchPaymentCompleted($id, (array) $payment);
        }

        return [
            'success' => true,
            'message' => sprintf(
                /* translators: %s: new payment status. */
                __('Payment status updated to %s.', 'yatra'),
                $status
            ),
        ];
    }

    /**
     * Delete a payment
     * 
     * @param int $id Payment ID
     * @return array {success: bool, message: string}
     */
    public function deletePayment(int $id): array
    {
        $payment = $this->paymentRepository->find($id);

        if (!$payment) {
            return ['success' => false, 'message' => __('Payment not found.', 'yatra')];
        }

        $bookingId = (int) $payment->booking_id;

        $deleted = $this->paymentRepository->delete($id);

        if (!$deleted) {
            return ['success' => false, 'message' => __('Failed to delete payment.', 'yatra')];
        }

        // Recalculate booking amount paid
        $totalPaid = $this->paymentRepository->getTotalPaidForBooking($bookingId);
        $this->bookingRepository->updateAmountPaid($bookingId, $totalPaid);

        return [
            'success' => true,
            'message' => __('Payment deleted successfully.', 'yatra'),
        ];
    }

    /**
     * Get payment statistics
     * 
     * @return array
     */
    public function getStats(): array
    {
        return $this->paymentRepository->getStats();
    }

    /**
     * Admin toolbar: counts per payment status.
     */
    public function getAdminStatusCounts(): array
    {
        return $this->paymentRepository->getAdminStatusCounts();
    }

    /**
     * Process refund
     * 
     * @param int    $paymentId Payment ID to refund
     * @param float  $amount    Refund amount (optional, full refund if not provided)
     * @param string $reason    Refund reason
     * @return array {success: bool, refund_id?: int, message: string}
     */
    public function processRefund(int $paymentId, ?float $amount = null, string $reason = ''): array
    {
        $payment = $this->paymentRepository->find($paymentId);

        if (!$payment) {
            return ['success' => false, 'message' => __('Payment not found.', 'yatra')];
        }

        if ($payment->status !== 'completed') {
            return ['success' => false, 'message' => __('Only completed payments can be refunded.', 'yatra')];
        }

        $refundAmount = $amount ?? (float) $payment->amount;

        if ($refundAmount > (float) $payment->amount) {
            return ['success' => false, 'message' => __('Refund amount exceeds payment amount.', 'yatra')];
        }

        // Create refund record
        $refundId = $this->paymentRepository->create([
            'booking_id' => $payment->booking_id,
            'gateway' => $payment->gateway,
            'amount' => -$refundAmount, // Negative for refund
            'currency' => $payment->currency,
            'status' => 'completed',
            'payment_type' => 'refund',
            'notes' => $reason,
        ]);

        if (!$refundId) {
            return ['success' => false, 'message' => __('Failed to process refund.', 'yatra')];
        }

        // Update original payment status
        $this->paymentRepository->updateStatus($paymentId, 'refunded');

        // Recalculate booking amount paid
        $totalPaid = $this->paymentRepository->getTotalPaidForBooking((int) $payment->booking_id);
        $this->bookingRepository->updateAmountPaid((int) $payment->booking_id, $totalPaid);

        return [
            'success' => true,
            'refund_id' => $refundId,
            'message' => __('Refund processed successfully.', 'yatra'),
        ];
    }

    /**
     * Format payment for API response
     * 
     * @param object $payment Raw payment data
     * @return array
     */
    /**
     * Format a raw payment row for the REST API.
     *
     * `public` so other services (notably {@see \Yatra\Services\CustomerService::getPaymentsForBookingIds()})
     * can share the same formatter and we don't end up with two competing
     * shapes — that's how the Account → Payments tab used to render
     * blank/N/A for `date`, `method`, `reference`, and `type` even after the
     * formatter here was updated.
     */
    public function formatPayment(object $payment): array
    {
        $contactName = isset($payment->contact_first_name)
            ? trim($payment->contact_first_name . ' ' . ($payment->contact_last_name ?? ''))
            : null;

        $status = (string) ($payment->status ?? 'pending');
        $gateway = (string) ($payment->gateway ?? '');
        $bookingRef = $payment->booking_reference ?? null;
        $processedAt = $payment->processed_at ?? null;
        $createdAt = $payment->created_at ?? null;
        $paymentDate = ($processedAt !== null && $processedAt !== '') ? $processedAt : ($createdAt ?? '');

        // Build a human-readable payment reference once, then expose it under
        // both `payment_number` (canonical) and `reference` (what the React
        // Payment type at resources/js/pages/account/types.ts expects).
        $reference = sprintf('PAY-%06d', (int) $payment->id);

        return [
            'id' => (int) $payment->id,
            'booking_id' => (int) $payment->booking_id,
            'booking_reference' => $bookingRef,
            'booking_number' => ($bookingRef !== null && $bookingRef !== '')
                ? (string) $bookingRef
                : '#' . (int) ($payment->booking_id ?? 0),
            'contact_email' => $payment->contact_email ?? null,
            'contact_name' => $contactName,
            'customer_name' => $contactName,
            'customer_email' => $payment->contact_email ?? null,
            'trip_title' => $payment->trip_title ?? null,
            'transaction_id' => $payment->transaction_id,
            'gateway' => $payment->gateway,
            'payment_method' => $gateway,
            // Display label resolved from the gateway registry. `payment_method`
            // stays the raw stored value because the list filter posts it back as
            // `gateway`; this is purely what the UI should print. Without it the
            // list mixed registry slugs ("paypal") with whatever a manually added
            // payment happened to store ("PayPal", "Credit Card").
            'payment_method_label' => self::gatewayLabel($gateway),
            'amount' => (float) $payment->amount,
            'currency' => $payment->currency,
            'status' => $payment->status,
            'payment_status' => $status,
            'payment_type' => $payment->payment_type,
            'notes' => $payment->notes,
            'processed_at' => $payment->processed_at,
            'created_at' => $payment->created_at,
            'payment_date' => $paymentDate,
            'payment_number' => $reference,
            // Aliases for the React Payment interface (account page).
            // Without these, the payments tab rendered:
            //  - reference: undefined  → blank line above "Booking:" label
            //  - method: undefined     → blank under "Payment Method"
            //  - date: undefined       → formatDate(undefined) → "N/A"
            //  - type: undefined       → paymentTypeLabel(undefined) → empty
            // Keeping the existing payment_* fields preserves any other
            // consumer that reads them.
            'reference' => $reference,
            'method' => $gateway,
            'method_label' => self::gatewayLabel($gateway),
            'date' => $paymentDate,
            'type' => $payment->payment_type,
        ];
    }

    /**
     * Human label for a stored gateway value.
     *
     * Resolves through the gateway registry first so the wording matches what the
     * customer saw at checkout (and what the payment emails print — see
     * BookingEmailRichMergeTags::gatewayLabel). Values recorded by hand may already
     * be human ("Credit Card"), so anything unregistered is title-cased rather than
     * discarded.
     *
     * @param string $gateway
     * @return string
     */
    private static function gatewayLabel(string $gateway): string
    {
        $gateway = trim($gateway);
        if ($gateway === '') {
            return '';
        }

        if (class_exists(\Yatra\PaymentGateways\PaymentGatewayRegistry::class)) {
            try {
                $registered = \Yatra\PaymentGateways\PaymentGatewayRegistry::getInstance()->get(strtolower($gateway));
                if ($registered !== null) {
                    $title = trim((string) $registered->getTitle());
                    if ($title !== '') {
                        return $title;
                    }
                }
            } catch (\Throwable $e) {
                // Registry unavailable (e.g. called before gateways register) —
                // fall through to the humanized form rather than failing the list.
            }
        }

        return ucwords(str_replace(['_', '-'], ' ', $gateway));
    }
}

