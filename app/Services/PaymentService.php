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

        // Create payment
        $paymentId = $this->paymentRepository->create($data);

        if (!$paymentId) {
            return ['success' => false, 'message' => __('Failed to create payment.', 'yatra')];
        }

        // Update booking amount paid
        $totalPaid = $this->paymentRepository->getTotalPaidForBooking((int) $data['booking_id']);
        $this->bookingRepository->updateAmountPaid((int) $data['booking_id'], $totalPaid);

        return [
            'success' => true,
            'payment_id' => $paymentId,
            'message' => __('Payment recorded successfully.', 'yatra'),
        ];
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

        $updated = $this->paymentRepository->update($id, $data);

        if (!$updated) {
            return ['success' => false, 'message' => __('Failed to update payment.', 'yatra')];
        }

        // Recalculate booking amount paid
        $totalPaid = $this->paymentRepository->getTotalPaidForBooking((int) $payment->booking_id);
        $this->bookingRepository->updateAmountPaid((int) $payment->booking_id, $totalPaid);

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

        return [
            'success' => true,
            'message' => sprintf(__('Payment status updated to %s.', 'yatra'), $status),
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
            'date' => $paymentDate,
            'type' => $payment->payment_type,
        ];
    }
}

