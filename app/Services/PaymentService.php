<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\PaymentRepository;
use Yatra\Repositories\PaymentNoteRepository;
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
    private PaymentNoteRepository $noteRepository;

    public function __construct()
    {
        $this->paymentRepository = new PaymentRepository();
        $this->bookingRepository = new BookingRepository();
        $this->noteRepository = new PaymentNoteRepository();
    }

    /**
     * A payment's note history, oldest first.
     *
     * The payments table's own single `notes` column is included as the first
     * entry when it holds anything, so a note recorded before there was a
     * history — including the reason stored against a refund — is not lost from
     * the view. It is marked `legacy` because there is no author or timestamp
     * for it: the column never recorded either.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getPaymentNotes(int $paymentId): array
    {
        $payment = $this->paymentRepository->find($paymentId);

        if (!$payment) {
            return [];
        }

        $entries = [];
        $legacy = trim((string) ($payment->notes ?? ''));

        if ($legacy !== '') {
            $entries[] = [
                'id' => 0,
                'note' => $legacy,
                'author_id' => null,
                'author_name' => '',
                'created_at' => (string) ($payment->created_at ?? ''),
                'legacy' => true,
            ];
        }

        foreach ($this->noteRepository->findByPaymentId($paymentId) as $row) {
            $entries[] = [
                'id' => (int) $row->id,
                'note' => (string) $row->note,
                'author_id' => $row->author_id !== null ? (int) $row->author_id : null,
                'author_name' => (string) ($row->author_name ?? ''),
                'created_at' => (string) $row->created_at,
                'legacy' => false,
            ];
        }

        return $entries;
    }

    /**
     * Add a note to a payment's history.
     *
     * Deliberately additive: the payment's own `notes` column is never
     * rewritten, so nothing that was already recorded is overwritten or lost —
     * which is the whole point of keeping a history rather than one field.
     *
     * @return array{success: bool, message: string, notes?: array<int, array<string, mixed>>}
     */
    public function addPaymentNote(int $paymentId, string $note): array
    {
        $note = trim($note);

        if ($note === '') {
            return ['success' => false, 'message' => __('Please write a note before saving.', 'yatra')];
        }

        $payment = $this->paymentRepository->find($paymentId);

        if (!$payment) {
            return ['success' => false, 'message' => __('Payment not found.', 'yatra')];
        }

        if (!$this->noteRepository->tableExists()) {
            return [
                'success' => false,
                'message' => __('Payment notes are not available yet. Open any Yatra admin page once and try again.', 'yatra'),
            ];
        }

        $noteId = $this->noteRepository->add(
            $paymentId,
            $note,
            (int) ($payment->booking_id ?? 0)
        );

        if ($noteId <= 0) {
            return ['success' => false, 'message' => __('Failed to save the note.', 'yatra')];
        }

        return [
            'success' => true,
            'message' => __('Note added.', 'yatra'),
            'notes' => $this->getPaymentNotes($paymentId),
        ];
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

        // Marking a payment refunded by hand reverses money just as a recorded
        // refund does, so the booking's status has to follow — otherwise a fully
        // reversed booking reads as 'pending', which is what a booking that
        // never paid at all reads as.
        $this->syncBookingPaymentState((int) $payment->booking_id);

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

        $refundAmount = round((float) ($amount ?? $payment->amount), 2);

        if ($refundAmount <= 0) {
            return ['success' => false, 'message' => __('Refund amount must be greater than zero.', 'yatra')];
        }

        if ($refundAmount > round((float) $payment->amount, 2)) {
            return ['success' => false, 'message' => __('Refund amount exceeds payment amount.', 'yatra')];
        }

        // The original payment is no longer flipped to 'refunded' (see below),
        // so "already refunded?" can no longer be inferred from its status.
        // Guard on the booking's ledger instead: you can never send back more
        // than came in, however the refunds are split across payments. Refund
        // rows carry no link to the payment they reverse, so this is the
        // strongest guarantee available — and it is the one that matters.
        $totals = $this->paymentRepository->getBookingPaymentTotals((int) $payment->booking_id);
        $refundable = round($totals['successful'] - $totals['refunded'], 2);

        if ($refundAmount > $refundable) {
            return [
                'success' => false,
                'message' => $refundable > 0
                    ? sprintf(
                        /* translators: %s: the largest amount still available to refund, already formatted with the site currency. */
                        __('That is more than remains to be refunded on this booking (%s).', 'yatra'),
                        \Yatra\Helpers\FormatHelper::formatPrice(
                            $refundable,
                            (string) ($payment->currency ?: \Yatra\Services\SettingsService::getCurrency())
                        )
                    )
                    : __('Everything received on this booking has already been refunded.', 'yatra'),
            ];
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

        // The original payment deliberately keeps its 'completed' status. It did
        // succeed, and the negative row above is the record of the money going
        // back — flipping it as well removed the same money twice from every
        // total derived from the ledger, and destroyed the only evidence of what
        // had been successfully collected. Keeping both rows is also what lets
        // "total received" and "total refunded" be reported separately, and lets
        // a second partial refund be taken against the same payment.
        $this->syncBookingPaymentState((int) $payment->booking_id);

        return [
            'success' => true,
            'refund_id' => $refundId,
            'message' => __('Refund processed successfully.', 'yatra'),
        ];
    }

    /**
     * Push the booking's stored money columns back in step with its payment
     * ledger: amount_paid, amount_due and payment_status.
     *
     * updateAmountPaid() alone decides the status from the amount only, which
     * reads a fully refunded booking as 'pending' — indistinguishable from one
     * that never paid. A booking whose money has been sent back is 'refunded'.
     */
    private function syncBookingPaymentState(int $bookingId): void
    {
        if ($bookingId <= 0) {
            return;
        }

        $totals = $this->paymentRepository->getBookingPaymentTotals($bookingId);
        $this->bookingRepository->updateAmountPaid($bookingId, max(0.0, $totals['net']));

        // 'reversed' covers a payment an operator marked refunded by hand, which
        // writes no refund row — without it such a booking reported 'pending',
        // the same as one that never paid at all.
        $wasReversed = $totals['refunded'] > 0 || ($totals['reversed'] ?? 0) > 0;

        if ($wasReversed && $totals['net'] <= 0.009) {
            $this->bookingRepository->update($bookingId, ['payment_status' => 'refunded']);
        }
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

