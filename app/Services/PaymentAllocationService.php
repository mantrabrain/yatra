<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\BookingRepository;
use Yatra\Repositories\PaymentRepository;

/**
 * One gateway payment that pays for several bookings.
 *
 * A checkout normally pays one booking. Yatra Pro's multi-trip cart creates
 * one booking per trip and takes ONE payment for all of them, bound to the
 * first ("lead") booking — the gateway only knows that booking's id. When the
 * payment is recorded, each place that records a gateway payment asks this
 * service how to split it:
 *
 *   $shares = PaymentAllocationService::allocate($leadId, $amount);
 *   $amount = $shares[$leadId];               // the lead's own part
 *   … record the lead's payment as before …
 *   PaymentAllocationService::creditOthers($shares, $leadId, $gateway, $txn, $currency);
 *
 * Every booking still gets its own payment row (same transaction id, its own
 * amount), so each booking's ledger, receipt and refund stay per booking.
 *
 * Without a listener on `yatra_payment_allocation` the whole amount stays on
 * the booking that was paid — exactly the previous behaviour.
 *
 * @since 3.2.0
 */
final class PaymentAllocationService
{
    /**
     * @return array<int, float> booking id => amount; always contains $leadId.
     */
    public static function allocate(int $leadId, float $amount): array
    {
        $default = [$leadId => $amount];
        if ($leadId <= 0 || $amount <= 0) {
            return $default;
        }

        /**
         * Split a gateway payment of the lead booking across linked bookings.
         *
         * @param array<int, float> $shares Empty: no split.
         * @param int   $leadId The booking the gateway payment is bound to.
         * @param float $amount The amount the gateway reported as paid.
         */
        $shares = apply_filters('yatra_payment_allocation', [], $leadId, $amount);
        if (!is_array($shares) || $shares === []) {
            return $default;
        }

        $clean = [];
        foreach ($shares as $bookingId => $share) {
            $bookingId = (int) $bookingId;
            $share = round((float) $share, 2);
            if ($bookingId <= 0 || $share < 0) {
                return $default;
            }
            $clean[$bookingId] = $share;
        }

        // Never invent or lose money: the parts must add up to what was paid.
        if (!isset($clean[$leadId]) || abs(array_sum($clean) - $amount) > 0.01) {
            return $default;
        }

        return $clean;
    }

    /**
     * Record the parts of a split payment that belong to the other bookings.
     *
     * Idempotent per booking and transaction: a part already recorded is
     * skipped, so a replayed webhook never pays a booking twice.
     *
     * @param array<int, float> $shares From allocate().
     */
    public static function creditOthers(array $shares, int $leadId, string $gateway, string $transactionId, string $currency, array $extra = []): void
    {
        if (count($shares) < 2) {
            return;
        }

        $bookings = new BookingRepository();
        $payments = new PaymentRepository();
        $lead = $bookings->find($leadId);
        $leadReference = (string) (($lead->reference ?? '') ?: ('#' . $leadId));

        foreach ($shares as $bookingId => $amount) {
            $bookingId = (int) $bookingId;
            $amount = (float) $amount;
            if ($bookingId === $leadId || $amount <= 0) {
                continue;
            }

            try {
                $booking = $bookings->find($bookingId);
                if (!$booking) {
                    continue;
                }
                if ($transactionId !== '' && self::alreadyRecorded($bookingId, $transactionId)) {
                    continue;
                }

                $payments->create([
                    'booking_id' => $bookingId,
                    'gateway' => $gateway,
                    'transaction_id' => $transactionId,
                    'amount' => $amount,
                    'currency' => $currency !== '' ? $currency : (string) ($booking->currency ?? ''),
                    'status' => 'completed',
                    'customer_id' => !empty($booking->customer_id) ? (int) $booking->customer_id : null,
                    'notes' => sprintf(
                        /* translators: %s: reference of the booking the payment was made with. */
                        __('Paid together with booking %s in one checkout.', 'yatra'),
                        $leadReference
                    ),
                    'meta' => ['allocated_from' => $leadId],
                ]);

                $newPaid = (float) ($booking->amount_paid ?? 0) + $amount;
                $newDue = max(0.0, (float) ($booking->total_amount ?? 0) - $newPaid);
                $previousStatus = (string) ($booking->status ?? 'pending');
                $shouldConfirm = function_exists('yatra_should_confirm_booking_on_payment')
                    ? \yatra_should_confirm_booking_on_payment($newDue <= 0.01, $bookingId)
                    : false;

                $update = [
                    'amount_paid' => $newPaid,
                    'amount_due' => $newDue,
                    'payment_status' => $newDue <= 0.01 ? 'paid' : 'partial',
                    'payment_transaction_id' => $transactionId,
                ];
                if ($shouldConfirm) {
                    $update['status'] = 'confirmed';
                }
                $bookings->update($bookingId, $update);

                if ($shouldConfirm && function_exists('yatra_trigger_booking_confirmed')) {
                    \yatra_trigger_booking_confirmed($bookingId, $previousStatus, true);
                }

                // $extra: e.g. the saved card (customer_id, payment_method_id),
                // so a deposit's balance can be scheduled for every booking.
                do_action('yatra_payment_completed', $bookingId, $gateway, $transactionId, array_merge($extra, [
                    'amount' => $amount,
                    'remaining' => $newDue,
                    'allocated_from' => $leadId,
                ]));
            } catch (\Throwable $e) {
                \Yatra\Utils\Logger::error('Could not record the linked part of a payment', [
                    'lead_booking_id' => $leadId,
                    'booking_id' => $bookingId,
                    'transaction_id' => $transactionId,
                    'amount' => $amount,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    private static function alreadyRecorded(int $bookingId, string $transactionId): bool
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_booking_payments';

        return (bool) $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$table} WHERE booking_id = %d AND transaction_id = %s LIMIT 1",
            $bookingId,
            $transactionId
        ));
    }
}
