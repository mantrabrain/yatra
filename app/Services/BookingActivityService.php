<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\BookingActivityRepository;
use Yatra\Repositories\BookingRepository;
use Yatra\Repositories\PaymentRepository;

/**
 * The booking workspace's history and day-to-day actions.
 *
 * Records what happens to a booking (status changes, emails, notes, price
 * adjustments, edits, expiry) by listening to the actions Yatra already
 * fires, and builds one timeline from that log, the booking's creation and its
 * payment ledger. Payments are read from the payments table rather than copied
 * into the log, so the timeline can never disagree with the money records.
 */
class BookingActivityService
{
    public const TYPE_STATUS = 'status_changed';
    public const TYPE_EMAIL = 'email_sent';
    public const TYPE_NOTE = 'note';
    public const TYPE_ADJUSTMENT = 'price_adjusted';
    public const TYPE_EDIT = 'edited';
    public const TYPE_EXPIRED = 'expired';

    private BookingActivityRepository $activity;

    public function __construct(?BookingActivityRepository $activity = null)
    {
        $this->activity = $activity ?? new BookingActivityRepository();
    }

    public static function init(): void
    {
        add_action('yatra_booking_status_changed', [self::class, 'onStatusChanged'], 20, 3);
        add_action('yatra_booking_expired', [self::class, 'onExpired'], 20, 1);
        add_action('yatra_transactional_email_sent', [self::class, 'onEmailSent'], 20, 6);
        add_action('yatra_transactional_email_handled', [self::class, 'onEmailHandled'], 20, 4);
        add_action('yatra_booking_deleted', [self::class, 'onBookingDeleted'], 20, 1);
    }

    /** @param int|string $bookingId */
    public static function onBookingDeleted($bookingId): void
    {
        (new BookingActivityRepository())->deleteByBookingId((int) $bookingId);
    }

    /**
     * An email sent by Yatra Pro in core's place (its own wording): the
     * subject isn't known here, so the log names the email type.
     *
     * @param mixed $type
     * @param mixed $to
     * @param mixed $sent
     * @param mixed $variables
     */
    public static function onEmailHandled($type, $to, $sent, $variables): void
    {
        // false = Pro deliberately didn't send (its template is switched
        // off), not a failure; nothing went out, so nothing to record.
        if ($sent !== true) {
            return;
        }
        self::onEmailSent($type, $to, self::emailTypeLabel((string) $type), '', $sent, $variables);
    }

    private static function emailTypeLabel(string $type): string
    {
        $labels = [
            'booking_confirmation' => __('Booking confirmation', 'yatra'),
            'booking_confirmed' => __('Booking confirmed', 'yatra'),
            'booking_cancelled' => __('Booking cancelled', 'yatra'),
            'booking_completed' => __('Booking completed', 'yatra'),
            'payment_received' => __('Payment received', 'yatra'),
            'partial_payment_received' => __('Partial payment received', 'yatra'),
            'trip_reminder' => __('Trip reminder', 'yatra'),
            'review_request' => __('Review request', 'yatra'),
            'scheduled_payment_reminder' => __('Payment reminder', 'yatra'),
            'scheduled_payment_succeeded' => __('Scheduled payment received', 'yatra'),
            'scheduled_payment_failed' => __('Scheduled payment failed', 'yatra'),
            'booking_expired_customer' => __('Booking expired', 'yatra'),
            'trip_consent_request' => __('Consent request', 'yatra'),
            'payment_confirmation' => __('Payment received', 'yatra'),
            'booking_cancellation' => __('Booking cancelled', 'yatra'),
            'booking_cancellation_by_operator' => __('Booking cancelled by you', 'yatra'),
            'booking_reminder' => __('Trip reminder', 'yatra'),
            'admin_new_booking' => __('New booking (to you)', 'yatra'),
            'admin_payment_received' => __('Payment received (to you)', 'yatra'),
            'admin_booking_cancelled_notice' => __('Booking cancelled (to you)', 'yatra'),
            'admin_booking_expired' => __('Booking expired (to you)', 'yatra'),
            'admin_scheduled_payment_failed' => __('Scheduled payment failed (to you)', 'yatra'),
            'customer_email_verification' => __('Email verification', 'yatra'),
            'guest_email_verification' => __('Email verification', 'yatra'),
            'new_booking' => __('Booking confirmation', 'yatra'),
            'payment_reminder' => __('Payment reminder', 'yatra'),
        ];

        return $labels[$type] ?? __('Email', 'yatra');
    }

    /** Readable name of a payment method: a gateway's title, or a manual method. */
    public static function paymentMethodLabel(string $id): string
    {
        if ($id === '') {
            return '';
        }
        $manual = [
            'cash' => __('Cash', 'yatra'),
            'card_terminal' => __('Card (terminal)', 'yatra'),
            'cheque' => __('Cheque', 'yatra'),
            'other' => __('Other', 'yatra'),
            'manual' => __('Manual', 'yatra'),
            // Paid on the marketplace (Yatra Pro Channel Manager).
            'getyourguide' => 'GetYourGuide',
        ];
        if (isset($manual[$id])) {
            return $manual[$id];
        }
        if (class_exists('\\Yatra\\PaymentGateways\\PaymentGatewayRegistry')) {
            $label = \Yatra\PaymentGateways\PaymentGatewayRegistry::getInstance()->resolveGatewayTitle($id);
            if ($label !== '') {
                return $label;
            }
        }

        return $id;
    }

    // ------------------------------------------------------------------
    // Automatic entries
    // ------------------------------------------------------------------

    /**
     * @param int|string $bookingId
     * @param mixed      $old
     * @param mixed      $new
     */
    public static function onStatusChanged($bookingId, $old, $new): void
    {
        $old = (string) $old;
        $new = (string) $new;
        if ((int) $bookingId <= 0 || $old === $new || $new === '') {
            return;
        }

        (new self())->activity->add((int) $bookingId, self::TYPE_STATUS, sprintf(
            /* translators: 1: previous booking status, 2: new booking status. */
            __('Status changed from %1$s to %2$s', 'yatra'),
            self::statusLabel($old),
            self::statusLabel($new)
        ), ['from' => $old, 'to' => $new]);
    }

    /** @param int|string $bookingId */
    public static function onExpired($bookingId): void
    {
        (new self())->activity->add((int) $bookingId, self::TYPE_EXPIRED, __('Cancelled automatically: not paid in time', 'yatra'), [], 0);
    }

    /**
     * @param mixed $type
     * @param mixed $to
     * @param mixed $subject
     * @param mixed $body
     * @param mixed $sent
     * @param mixed $variables
     */
    public static function onEmailSent($type, $to, $subject, $body, $sent, $variables): void
    {
        $vars = is_array($variables) ? $variables : [];
        $bookingId = (int) ($vars['booking_id'] ?? 0);
        if ($bookingId <= 0) {
            return;
        }

        $recipient = is_array($to) ? implode(', ', array_map('strval', $to)) : (string) $to;
        $subject = wp_strip_all_tags((string) $subject);

        (new self())->activity->add($bookingId, self::TYPE_EMAIL, $sent
            ? sprintf(
                /* translators: 1: email subject, 2: recipient address. */
                __('Email sent: "%1$s" to %2$s', 'yatra'),
                $subject,
                $recipient
            )
            : sprintf(
                /* translators: 1: email subject, 2: recipient address. */
                __('Email could not be sent: "%1$s" to %2$s', 'yatra'),
                $subject,
                $recipient
            ), ['email_type' => (string) $type, 'to' => $recipient, 'sent' => (bool) $sent]);
    }

    // ------------------------------------------------------------------
    // Operator actions
    // ------------------------------------------------------------------

    /**
     * @return array{success:bool, message:string, entry_id?:int}
     */
    public function addNote(int $bookingId, string $note): array
    {
        $note = trim(sanitize_textarea_field($note));
        if ($note === '') {
            return ['success' => false, 'message' => __('Write a note first.', 'yatra')];
        }
        if (!(new BookingRepository())->find($bookingId)) {
            return ['success' => false, 'message' => __('Booking not found.', 'yatra')];
        }

        $id = $this->activity->add($bookingId, self::TYPE_NOTE, $note);
        if ($id <= 0) {
            return ['success' => false, 'message' => __('The note could not be saved.', 'yatra')];
        }

        return ['success' => true, 'message' => __('Note added.', 'yatra'), 'entry_id' => $id];
    }

    /**
     * Change what the customer owes: a discount (lowers the total) or a
     * surcharge (raises it), with a reason. The booking's total, amount due
     * and payment status are recomputed from its payment ledger, and each
     * adjustment is kept in the booking's meta and in the log.
     *
     * @return array{success:bool, message:string, booking?:array<string,mixed>}
     */
    public function adjustPrice(int $bookingId, string $kind, float $amount, string $reason): array
    {
        $kind = $kind === 'surcharge' ? 'surcharge' : ($kind === 'discount' ? 'discount' : '');
        $amount = round($amount, 2);
        $reason = trim(sanitize_text_field($reason));

        if ($kind === '') {
            return ['success' => false, 'message' => __('Choose a discount or a surcharge.', 'yatra')];
        }
        if ($amount <= 0) {
            return ['success' => false, 'message' => __('Enter an amount greater than zero.', 'yatra')];
        }
        if ($reason === '') {
            return ['success' => false, 'message' => __('Say why the price changed — it is kept in the booking history.', 'yatra')];
        }

        $bookings = new BookingRepository();
        $booking = $bookings->find($bookingId);
        if (!$booking) {
            return ['success' => false, 'message' => __('Booking not found.', 'yatra')];
        }
        if (in_array((string) ($booking->status ?? ''), ['cancelled', 'refunded'], true)) {
            return ['success' => false, 'message' => __('A cancelled booking can\'t be re-priced.', 'yatra')];
        }

        $oldTotal = round((float) ($booking->total_amount ?? 0), 2);
        if ($kind === 'discount' && $amount > $oldTotal) {
            return ['success' => false, 'message' => __('The discount is larger than the booking total.', 'yatra')];
        }
        $newTotal = round($kind === 'discount' ? $oldTotal - $amount : $oldTotal + $amount, 2);
        $received = round(max(0.0, (float) ($booking->amount_paid ?? 0)), 2);
        if ($kind === 'discount' && $newTotal < $received) {
            return ['success' => false, 'message' => sprintf(
                /* translators: 1: amount already received, 2: largest discount possible now. */
                __('The customer has already paid %1$s, so the discount can be at most %2$s. To give back more, record a refund on the payment.', 'yatra'),
                yatra_format_price($received, SettingsService::getCurrency(), false),
                yatra_format_price(max(0.0, $oldTotal - $received), SettingsService::getCurrency(), false)
            )];
        }

        $meta = json_decode((string) ($booking->meta ?? ''), true);
        $meta = is_array($meta) ? $meta : [];
        $adjustments = isset($meta['price_adjustments']) && is_array($meta['price_adjustments']) ? $meta['price_adjustments'] : [];
        $adjustments[] = [
            'type' => $kind,
            'amount' => $amount,
            'reason' => $reason,
            'previous_total' => $oldTotal,
            'new_total' => $newTotal,
            'at' => current_time('mysql'),
            'by' => get_current_user_id(),
        ];
        $meta['price_adjustments'] = $adjustments;

        if (!$bookings->update($bookingId, ['total_amount' => $newTotal, 'meta' => wp_json_encode($meta)])) {
            return ['success' => false, 'message' => __('The price could not be changed.', 'yatra')];
        }

        // Due and payment status follow the ledger, exactly as after a payment.
        $paid = (new PaymentRepository())->getTotalPaidForBooking($bookingId);
        $bookings->updateAmountPaid($bookingId, $paid);

        $currency = SettingsService::getCurrency();
        $this->activity->add($bookingId, self::TYPE_ADJUSTMENT, sprintf(
            $kind === 'discount'
                /* translators: 1: discount amount, 2: new total, 3: reason given by the operator. */
                ? __('Discount of %1$s applied — new total %2$s. Reason: %3$s', 'yatra')
                /* translators: 1: surcharge amount, 2: new total, 3: reason given by the operator. */
                : __('Surcharge of %1$s added — new total %2$s. Reason: %3$s', 'yatra'),
            yatra_format_price($amount, $currency, false),
            yatra_format_price($newTotal, $currency, false),
            $reason
        ), ['kind' => $kind, 'amount' => $amount, 'from' => $oldTotal, 'to' => $newTotal]);

        /**
         * Fires after an operator changes a booking's price from the booking screen.
         *
         * @param int    $bookingId
         * @param string $kind      discount|surcharge
         * @param float  $amount
         * @param float  $newTotal
         */
        do_action('yatra_booking_price_adjusted', $bookingId, $kind, $amount, $newTotal);

        $after = $bookings->find($bookingId);

        return [
            'success' => true,
            'message' => $kind === 'discount' ? __('Discount applied.', 'yatra') : __('Surcharge added.', 'yatra'),
            'booking' => [
                'total_amount' => (float) ($after->total_amount ?? $newTotal),
                'amount_paid' => (float) ($after->amount_paid ?? 0),
                'amount_due' => (float) ($after->amount_due ?? 0),
                'payment_status' => (string) ($after->payment_status ?? ''),
            ],
        ];
    }

    /**
     * Log an edit made from the booking form: which details changed.
     *
     * @param object $before Booking row before the edit.
     * @param object $after  Booking row after it.
     */
    public function recordEdit(int $bookingId, object $before, object $after): void
    {
        $labels = [
            'travel_date' => __('travel date', 'yatra'),
            'travelers_count' => __('travellers', 'yatra'),
            'contact_first_name' => __('first name', 'yatra'),
            'contact_last_name' => __('last name', 'yatra'),
            'contact_email' => __('email', 'yatra'),
            'contact_phone' => __('phone', 'yatra'),
            'total_amount' => __('total', 'yatra'),
            'special_requests' => __('special requests', 'yatra'),
            'internal_notes' => __('internal notes', 'yatra'),
            'trip_id' => __('trip', 'yatra'),
        ];
        $changed = [];
        $meta = [];
        foreach ($labels as $field => $label) {
            $old = (string) ($before->$field ?? '');
            $new = (string) ($after->$field ?? '');
            if ($field === 'total_amount') {
                $old = number_format((float) $old, 2, '.', '');
                $new = number_format((float) $new, 2, '.', '');
            }
            if ($old !== $new) {
                $changed[] = $label;
                $meta[$field] = ['from' => $old, 'to' => $new];
            }
        }
        if ($changed === []) {
            return;
        }

        $this->activity->add($bookingId, self::TYPE_EDIT, sprintf(
            /* translators: %s: comma-separated list of changed booking details. */
            __('Booking edited: %s', 'yatra'),
            implode(', ', $changed)
        ), $meta);
    }

    // ------------------------------------------------------------------
    // Timeline
    // ------------------------------------------------------------------

    /**
     * Everything that happened to a booking, newest first: its creation, every
     * payment and refund, and every log entry.
     *
     * @return array<int, array<string, mixed>>
     */
    public function timeline(int $bookingId): array
    {
        $booking = (new BookingRepository())->find($bookingId);
        if (!$booking) {
            return [];
        }

        $events = [];
        $events[] = [
            'id' => 'created',
            'type' => 'created',
            'message' => __('Booking created', 'yatra'),
            'author' => '',
            'at' => (string) ($booking->created_at ?? ''),
            'meta' => ['reference' => (string) ($booking->reference ?? '')],
        ];

        // The store currency: a booking's own currency column defaults to USD.
        $currencyDefault = SettingsService::getCurrency();
        foreach ((new PaymentRepository())->findByBookingId($bookingId) as $p) {
            $amount = (float) ($p->amount ?? 0);
            $currency = (string) ($p->currency ?: $currencyDefault);
            $isRefund = $amount < 0 || (string) ($p->payment_type ?? '') === 'refund';
            $gateway = (string) ($p->gateway ?? '');
            $via = self::paymentMethodLabel($gateway);
            $status = (string) ($p->status ?? '');

            if ($isRefund) {
                $message = sprintf(
                    /* translators: %s: refunded amount. */
                    __('Refund of %s recorded', 'yatra'),
                    yatra_format_price(abs($amount), $currency, false)
                );
            } elseif ($status === 'completed') {
                $message = $via !== ''
                    /* translators: 1: amount, 2: payment method. */
                    ? sprintf(__('Payment of %1$s received (%2$s)', 'yatra'), yatra_format_price($amount, $currency, false), $via)
                    /* translators: %s: amount. */
                    : sprintf(__('Payment of %s received', 'yatra'), yatra_format_price($amount, $currency, false));
            } else {
                $message = sprintf(
                    /* translators: 1: amount, 2: payment status. */
                    __('Payment of %1$s — %2$s', 'yatra'),
                    yatra_format_price($amount, $currency, false),
                    $status !== '' ? $status : __('pending', 'yatra')
                );
            }
            $note = trim((string) ($p->notes ?? ''));
            if ($note !== '') {
                $message .= ' — ' . $note;
            }

            $events[] = [
                'id' => 'payment-' . (int) $p->id,
                'type' => $isRefund ? 'refund' : 'payment',
                'message' => $message,
                'author' => '',
                'at' => (string) ($p->created_at ?? ''),
                'meta' => [
                    'payment_id' => (int) $p->id,
                    'amount' => $amount,
                    'status' => $status,
                    'gateway' => $gateway,
                    'transaction_id' => (string) ($p->transaction_id ?? ''),
                ],
            ];
        }

        foreach ($this->activity->findByBookingId($bookingId) as $row) {
            $meta = json_decode((string) ($row->meta ?? ''), true);
            $events[] = [
                'id' => 'activity-' . (int) $row->id,
                'type' => (string) $row->type,
                'message' => (string) $row->message,
                'author' => (string) ($row->author_name ?? ''),
                'at' => (string) ($row->created_at ?? ''),
                'meta' => is_array($meta) ? $meta : [],
            ];
        }

        usort($events, static function (array $a, array $b): int {
            $cmp = strcmp((string) $b['at'], (string) $a['at']);
            if ($cmp !== 0) {
                return $cmp;
            }
            // Same second: the booking's creation is always the oldest.
            return ($a['type'] === 'created' ? 1 : 0) <=> ($b['type'] === 'created' ? 1 : 0);
        });

        return $events;
    }

    public static function statusLabel(string $status): string
    {
        $labels = [
            'paid' => __('Paid', 'yatra'),
            'partial' => __('Partially paid', 'yatra'),
            'processing' => __('Processing', 'yatra'),
            'failed' => __('Failed', 'yatra'),
            'on_hold' => __('On hold', 'yatra'),
            'pending' => __('Pending', 'yatra'),
            'confirmed' => __('Confirmed', 'yatra'),
            'cancelled' => __('Cancelled', 'yatra'),
            'completed' => __('Completed', 'yatra'),
            'refunded' => __('Refunded', 'yatra'),
            'waitlist' => __('Waitlist', 'yatra'),
            'pending_verification' => __('Pending verification', 'yatra'),
        ];

        return $labels[$status] ?? $status;
    }
}
