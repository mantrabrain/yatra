<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\BookingActivityRepository;
use Yatra\Repositories\BookingRepository;

/**
 * Change and cancellation requests a customer sends from their account.
 *
 * A request does not change the booking: it is recorded on the booking
 * (meta `customer_requests` and the booking's history), the operator is
 * emailed, and the operator acts on it in the booking screen (cancel,
 * refund, edit) and marks it resolved. Operators keep full control of
 * their own cancellation policy and refunds.
 *
 * Settings: `customer_requests_enabled` (on by default) and
 * `customer_request_cutoff_days` (0 = until the travel date).
 */
class CustomerRequestService
{
    public const TYPE_ACTIVITY = 'customer_request';
    public const TYPES = ['cancel', 'change'];
    private const MAX_MESSAGE = 2000;

    /** Booking statuses a customer can still ask about. */
    private const OPEN_STATUSES = ['pending', 'confirmed', 'on_hold', 'processing'];

    /**
     * May the customer send a request for this booking now? Reason when not.
     *
     * @return array{allowed:bool, reason:string, cutoff_days:int}
     */
    public static function eligibility(object $booking): array
    {
        $cutoffDays = max(0, (int) SettingsService::get('customer_request_cutoff_days', 0));
        $out = ['allowed' => false, 'reason' => '', 'cutoff_days' => $cutoffDays];

        if (!SettingsService::isEnabled('customer_requests_enabled')) {
            $out['reason'] = __('Please contact us to change or cancel this booking.', 'yatra');
            return $out;
        }
        if (!in_array((string) ($booking->status ?? ''), self::OPEN_STATUSES, true)) {
            $out['reason'] = __('This booking can no longer be changed online.', 'yatra');
            return $out;
        }
        $travel = strtotime((string) ($booking->travel_date ?? '') . ' 00:00:00');
        $today = strtotime(current_time('Y-m-d') . ' 00:00:00');
        if ($travel === false || $today === false || $travel <= $today) {
            $out['reason'] = __('This trip has already started.', 'yatra');
            return $out;
        }
        if ($cutoffDays > 0 && $travel - $today < $cutoffDays * DAY_IN_SECONDS) {
            $out['reason'] = sprintf(
                /* translators: %d: number of days before travel. */
                _n(
                    'Requests can be sent online up to %d day before travel. Please contact us.',
                    'Requests can be sent online up to %d days before travel. Please contact us.',
                    $cutoffDays,
                    'yatra'
                ),
                $cutoffDays
            );
            return $out;
        }
        $out['allowed'] = true;

        return $out;
    }

    /** @return array<int, array<string, mixed>> */
    public static function requestsOf(object $booking): array
    {
        $meta = json_decode((string) ($booking->meta ?? ''), true);

        return is_array($meta) && isset($meta['customer_requests']) && is_array($meta['customer_requests'])
            ? array_values($meta['customer_requests'])
            : [];
    }

    /**
     * @return array{success:bool, message:string, request?:array<string, mixed>}
     */
    public function submit(int $bookingId, string $type, string $message, int $userId): array
    {
        $type = sanitize_key($type);
        $message = trim(sanitize_textarea_field($message));
        if (!in_array($type, self::TYPES, true)) {
            return ['success' => false, 'message' => __('Please choose what you would like to do.', 'yatra')];
        }
        if ($message === '') {
            return ['success' => false, 'message' => __('Please tell us what you would like to change, or why you are cancelling.', 'yatra')];
        }
        if (function_exists('mb_substr')) {
            $message = mb_substr($message, 0, self::MAX_MESSAGE);
        } else {
            $message = substr($message, 0, self::MAX_MESSAGE);
        }

        $repo = new BookingRepository();
        $booking = $repo->find($bookingId);
        if (!$booking) {
            return ['success' => false, 'message' => __('Booking not found.', 'yatra')];
        }
        $eligibility = self::eligibility($booking);
        if (!$eligibility['allowed']) {
            return ['success' => false, 'message' => $eligibility['reason']];
        }
        foreach (self::requestsOf($booking) as $existing) {
            if (($existing['status'] ?? '') === 'open' && ($existing['type'] ?? '') === $type) {
                return ['success' => false, 'message' => __('We already have your request and will get back to you soon.', 'yatra')];
            }
        }

        $request = [
            'id' => wp_generate_uuid4(),
            'type' => $type,
            'message' => $message,
            'status' => 'open',
            'created_at' => current_time('mysql'),
            'user_id' => $userId,
        ];
        $meta = json_decode((string) ($booking->meta ?? ''), true);
        $meta = is_array($meta) ? $meta : [];
        $meta['customer_requests'] = array_merge(self::requestsOf($booking), [$request]);
        if (!$repo->update($bookingId, ['meta' => wp_json_encode($meta)])) {
            return ['success' => false, 'message' => __('Your request could not be saved. Please try again or contact us.', 'yatra')];
        }

        (new BookingActivityRepository())->add(
            $bookingId,
            self::TYPE_ACTIVITY,
            sprintf(
                /* translators: 1: "Cancellation requested" or "Change requested", 2: the customer's message. */
                __('%1$s by the customer: %2$s', 'yatra'),
                self::typeLabel($type),
                $message
            ),
            ['request_id' => $request['id'], 'request_type' => $type],
            $userId
        );

        $this->notifyOperator($booking, $request);

        /**
         * A customer asked to change or cancel a booking from their account.
         *
         * @param int                  $bookingId
         * @param array<string, mixed> $request   id, type (cancel|change), message, status, created_at, user_id
         */
        do_action('yatra_customer_booking_request', $bookingId, $request);

        return [
            'success' => true,
            'message' => $type === 'cancel'
                ? __('Your cancellation request has been sent. We will confirm it by email.', 'yatra')
                : __('Your change request has been sent. We will get back to you by email.', 'yatra'),
            'request' => self::forCustomer($request),
        ];
    }

    /**
     * The operator marks a request as handled.
     *
     * @return array{success:bool, message:string}
     */
    public function resolve(int $bookingId, string $requestId): array
    {
        $repo = new BookingRepository();
        $booking = $repo->find($bookingId);
        if (!$booking) {
            return ['success' => false, 'message' => __('Booking not found.', 'yatra')];
        }
        $requests = self::requestsOf($booking);
        $found = null;
        foreach ($requests as $i => $request) {
            if (($request['id'] ?? '') === $requestId) {
                if (($request['status'] ?? '') !== 'open') {
                    return ['success' => false, 'message' => __('This request is already resolved.', 'yatra')];
                }
                $requests[$i]['status'] = 'resolved';
                $requests[$i]['resolved_at'] = current_time('mysql');
                $requests[$i]['resolved_by'] = get_current_user_id();
                $found = $requests[$i];
            }
        }
        if ($found === null) {
            return ['success' => false, 'message' => __('Request not found.', 'yatra')];
        }
        $meta = json_decode((string) ($booking->meta ?? ''), true);
        $meta = is_array($meta) ? $meta : [];
        $meta['customer_requests'] = $requests;
        if (!$repo->update($bookingId, ['meta' => wp_json_encode($meta)])) {
            return ['success' => false, 'message' => __('The request could not be updated.', 'yatra')];
        }
        (new BookingActivityRepository())->add(
            $bookingId,
            self::TYPE_ACTIVITY,
            sprintf(
                /* translators: %s: "Cancellation requested" or "Change requested". */
                __('%s — marked as resolved', 'yatra'),
                self::typeLabel((string) $found['type'])
            ),
            ['request_id' => $requestId, 'resolved' => true]
        );

        return ['success' => true, 'message' => __('Request marked as resolved.', 'yatra')];
    }

    public static function typeLabel(string $type): string
    {
        return $type === 'cancel' ? __('Cancellation requested', 'yatra') : __('Change requested', 'yatra');
    }

    /**
     * What the customer sees of a request (no internal ids of staff).
     *
     * @param array<string, mixed> $request
     * @return array<string, mixed>
     */
    public static function forCustomer(array $request): array
    {
        return [
            'id' => (string) ($request['id'] ?? ''),
            'type' => (string) ($request['type'] ?? ''),
            'type_label' => self::typeLabel((string) ($request['type'] ?? '')),
            'message' => (string) ($request['message'] ?? ''),
            'status' => (string) ($request['status'] ?? 'open'),
            'created_at' => (string) ($request['created_at'] ?? ''),
        ];
    }

    /**
     * @param array<string, mixed> $request
     */
    private function notifyOperator(object $booking, array $request): void
    {
        if (!SettingsService::isEnabled('enable_admin_notifications')) {
            return;
        }
        $to = sanitize_email((string) SettingsService::getString('admin_email', (string) get_option('admin_email', '')));
        if ($to === '' || !is_email($to)) {
            return;
        }
        $reference = (string) ($booking->reference ?? $booking->id);
        $customer = trim((string) ($booking->contact_first_name ?? '') . ' ' . (string) ($booking->contact_last_name ?? ''));
        $link = admin_url('admin.php?page=yatra&subpage=bookings&action=view&id=' . (int) $booking->id);
        $subject = sprintf(
            /* translators: 1: "Cancellation requested" / "Change requested", 2: booking reference. */
            __('%1$s · %2$s', 'yatra'),
            self::typeLabel((string) $request['type']),
            $reference
        );
        $body = '<p>' . esc_html(sprintf(
            /* translators: 1: customer name, 2: booking reference, 3: travel date. */
            __('%1$s sent a request about booking %2$s (travel date %3$s):', 'yatra'),
            $customer !== '' ? $customer : (string) ($booking->contact_email ?? ''),
            $reference,
            (string) ($booking->travel_date ?? '')
        )) . '</p>'
            . '<blockquote style="border-left:3px solid #e5e7eb;margin:12px 0;padding:4px 12px;">' . nl2br(esc_html((string) $request['message'])) . '</blockquote>'
            . '<p><a href="' . esc_url($link) . '">' . esc_html__('Open the booking', 'yatra') . '</a></p>'
            . '<p style="color:#6b7280;font-size:12px;">' . esc_html__('Nothing has been changed yet: cancel, refund or edit the booking as your policy allows, then mark the request as resolved.', 'yatra') . '</p>';

        $headers = ['Content-Type: text/html; charset=UTF-8'];
        $replyTo = sanitize_email((string) ($booking->contact_email ?? ''));
        if ($replyTo !== '' && is_email($replyTo)) {
            $headers[] = 'Reply-To: ' . $replyTo;
        }
        EmailService::send($to, $subject, $body, $headers);
    }
}
