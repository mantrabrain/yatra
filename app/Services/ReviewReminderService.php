<?php
/**
 * Review Reminder Service
 * 
 * Handles sending review reminders to customers
 * 
 * @package Yatra\Services
 * @since 3.0.0
 */

declare(strict_types=1);

namespace Yatra\Services;

class ReviewReminderService
{
    public const CRON_HOOK = 'yatra_send_review_reminder';

    /**
     * Days after the tour ends before the review request goes out.
     */
    public static function reminderDays(): int
    {
        $days = SettingsService::getInt('review_reminder_days', 3);

        return (int) apply_filters('yatra_review_reminder_days', $days);
    }

    /**
     * How stale a trip may be and still be worth asking about.
     *
     * Measured from the tour's end, not from the booking being marked
     * completed — see {@see scheduleReminder()} for why that distinction is the
     * whole point of this class.
     */
    public static function maxTourAgeDays(): int
    {
        $days = SettingsService::getInt('review_reminder_max_age_days', 14);

        return (int) apply_filters('yatra_review_reminder_max_age_days', $days);
    }

    /**
     * Schedule review reminder for a booking
     *
     * The reminder is anchored to the date the trip ended, never to the moment
     * the booking happened to be marked completed. Those two used to be the
     * same thing — the reminder was simply "now + N days" — which was fine when
     * an operator completed a booking the week its tour finished, and wrong in
     * every other case. The daily auto-completion sweep can mark a long backlog
     * of finished tours complete in one run, and each of those scheduled a
     * review request N days out: customers whose trips had ended months earlier
     * were all asked to review on the same night, in one batch.
     *
     * So: the request is due at tour_end + N. If that moment is still ahead,
     * it is scheduled for then. If it has already passed the trip is not
     * automatically written off — an operator completing a booking a few days
     * late, or a site whose cron slept, should still reach the customer — but
     * only while the trip is recent enough to be worth asking about; past
     * {@see maxTourAgeDays()} nothing is sent at all.
     *
     * @param int $bookingId Booking ID
     */
    public static function scheduleReminder(int $bookingId): void
    {
        // Check if reviews are enabled
        if (!SettingsService::reviewsEnabled()) {
            return;
        }

        $reminder_days = self::reminderDays();

        if ($reminder_days <= 0) {
            return;
        }

        $tourEnd = self::tourEndTimestamp($bookingId);
        if ($tourEnd === null) {
            // No usable travel date: there is nothing to anchor to, and "now"
            // is exactly the anchor that caused the mass send.
            return;
        }

        $now = time();
        $due = $tourEnd + ($reminder_days * DAY_IN_SECONDS);

        if ($due <= $now) {
            if (!self::tourIsRecentEnough($tourEnd, $now)) {
                return;
            }
            // Overdue but still fresh: shortly from now rather than instantly,
            // so a sweep that completes a run of bookings does not fire them
            // all in the same second.
            $due = $now + (5 * MINUTE_IN_SECONDS);
        }

        $due = self::spreadWithinHour($due, $bookingId);

        if (!wp_next_scheduled(self::CRON_HOOK, [$bookingId])) {
            wp_schedule_single_event($due, self::CRON_HOOK, [$bookingId]);
        }
    }
    
    /**
     * Send review reminder email
     * 
     * @param int $bookingId Booking ID
     */
    public static function sendReminder(int $bookingId): void
    {
        // Checked again at fire time, not only when scheduling: events queued
        // by an older release carry no window of their own, and an install that
        // upgrades with a backlog already in wp_cron would otherwise send it.
        $tourEnd = self::tourEndTimestamp($bookingId);
        if ($tourEnd === null || !self::tourIsRecentEnough($tourEnd, time())) {
            return;
        }

        $bookingRepository = new \Yatra\Repositories\BookingRepository();
        $booking = $bookingRepository->findWithTrip($bookingId);

        if (!$booking || empty($booking->contact_email)) {
            return;
        }

        // Check if customer has already reviewed
        if (self::hasReviewedTrip($booking)) {
            return;
        }

        // Get trip details
        $tripRepository = new \Yatra\Repositories\TripRepository();
        $trip = $tripRepository->find((int) ($booking->trip_id ?? 0));

        if (!$trip) {
            return;
        }

        // A trip is a row in Yatra's own table, so $trip->id is NOT a WordPress
        // post ID: get_permalink() on it returns whatever unrelated post happens
        // to carry that ID, or false when nothing does — which is how customers
        // ended up with review links pointing at a stray page, or at a bare
        // "#reviews" that goes nowhere. yatra_get_trip_permalink() builds the
        // link from the trip's slug and the configured trip base.
        $review_url = function_exists('yatra_get_trip_permalink')
            ? yatra_get_trip_permalink((int) $trip->id)
            : '';
        if ($review_url === '') {
            // No usable trip URL: a review request whose whole purpose is the
            // link is not worth sending.
            return;
        }
        $review_url .= '#reviews';

        $vars = TransactionalEmailTemplateService::variablesFromBooking($booking);
        $vars['review_url'] = esc_url($review_url);
        $vars['completion_date'] = date_i18n(get_option('date_format'));

        TransactionalEmailTemplateService::sendIfEnabled(
            TransactionalEmailTemplateService::TYPE_REVIEW_REQUEST,
            (string) $booking->contact_email,
            $vars
        );
    }

    /**
     * When the trip ended, as a timestamp, or null when it cannot be told.
     *
     * Mirrors the COALESCE in
     * {@see \Yatra\Repositories\BookingRepository::getConfirmedBookingIdsPastTour()}
     * so the sweep that completes a booking and the reminder it schedules agree
     * on which date the trip ended. Day trips carry no end_date, hence the
     * fallbacks.
     */
    private static function tourEndTimestamp(int $bookingId): ?int
    {
        global $wpdb;

        $table = \Yatra\Database\Tables\BookingsTable::getTableName();

        $row = $wpdb->get_row($wpdb->prepare(
            // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name from a constant.
            "SELECT end_date, start_date, travel_date FROM {$table} WHERE id = %d",
            $bookingId
        ));

        if (!$row) {
            return null;
        }

        foreach ([$row->end_date ?? null, $row->start_date ?? null, $row->travel_date ?? null] as $value) {
            $value = (string) $value;
            if ($value === '' || strpos($value, '0000-00-00') === 0) {
                continue;
            }

            // End of that day: a trip finishing today is not "over" at 00:00.
            $ts = strtotime($value . ' 23:59:59');
            if ($ts !== false) {
                return $ts;
            }
        }

        return null;
    }

    /**
     * Is the trip still recent enough to ask about?
     */
    private static function tourIsRecentEnough(int $tourEnd, int $now): bool
    {
        $maxAge = self::maxTourAgeDays();

        if ($maxAge <= 0) {
            return false;
        }

        return ($now - $tourEnd) <= ($maxAge * DAY_IN_SECONDS);
    }

    /**
     * Nudge the due time to a quiet, spread-out moment.
     *
     * Every trip ending on the same day resolves to the same tour_end + N, so
     * without this a busy departure day still lands its whole batch on one
     * timestamp — a volume spike from a domain with no history of one, which is
     * what mail providers throttle. The offset is derived from the booking id
     * rather than randomised so a reschedule of the same booking is stable.
     */
    private static function spreadWithinHour(int $due, int $bookingId): int
    {
        return $due + (($bookingId % 60) * MINUTE_IN_SECONDS);
    }

    /**
     * Drop queued reminders for trips that are now too old to ask about.
     *
     * Reminders are individual one-off cron events, so changing the rules above
     * does nothing for events an earlier release already queued. Without this,
     * the sites that hit the mass send would simply receive it again.
     *
     * @return int number of events unscheduled
     */
    public static function purgeStaleScheduledReminders(): int
    {
        $crons = _get_cron_array();
        if (!is_array($crons)) {
            return 0;
        }

        $now = time();
        $removed = 0;

        foreach ($crons as $timestamp => $hooks) {
            if (!isset($hooks[self::CRON_HOOK]) || !is_array($hooks[self::CRON_HOOK])) {
                continue;
            }

            foreach ($hooks[self::CRON_HOOK] as $event) {
                $args = $event['args'] ?? [];
                $bookingId = (int) ($args[0] ?? 0);
                if ($bookingId <= 0) {
                    continue;
                }

                $tourEnd = self::tourEndTimestamp($bookingId);
                if ($tourEnd !== null && self::tourIsRecentEnough($tourEnd, $now)) {
                    continue;
                }

                wp_unschedule_event((int) $timestamp, self::CRON_HOOK, $args);
                $removed++;
            }
        }

        return $removed;
    }

    /**
     * Has this customer already reviewed the trip they are about to be asked about?
     *
     * This used to query `booking_id` and `customer_id` on the reviews table.
     * Neither column exists — reviews carry `trip_id`, `user_id` and
     * `author_email` — so every call raised "Unknown column" and returned null,
     * which is not greater than zero, so the guard never once held. Customers
     * who had already written a review were asked for another one anyway.
     *
     * The value passed in was wrong as well: `bookings.customer_id` points at
     * `yatra_customers.id`, while a review's `user_id` is a WordPress user ID.
     * So the match is made on what the two tables genuinely share — the trip,
     * plus either the WordPress account or the email address on the booking.
     *
     * Spam and trashed reviews do not count as having reviewed.
     */
    private static function hasReviewedTrip(object $booking): bool
    {
        global $wpdb;

        $tripId = (int) ($booking->trip_id ?? 0);
        if ($tripId <= 0) {
            return false;
        }

        $reviewsTable = \Yatra\Database\Tables\ReviewsTable::getTableName();

        $userId = (int) ($booking->user_id ?? 0);
        $email = trim((string) ($booking->contact_email ?? ''));

        $clauses = [];
        $params = [$tripId];

        if ($userId > 0) {
            $clauses[] = 'user_id = %d';
            $params[] = $userId;
        }

        if ($email !== '') {
            $clauses[] = 'author_email = %s';
            $params[] = $email;
        }

        if ($clauses === []) {
            // Nothing identifies the reviewer, so nothing can be matched.
            return false;
        }

        $sql = "SELECT COUNT(*) FROM {$reviewsTable}
             WHERE trip_id = %d
               AND status NOT IN ('spam', 'trash')
               AND (" . implode(' OR ', $clauses) . ')';

        // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- placeholders only; values passed to prepare().
        $count = $wpdb->get_var($wpdb->prepare($sql, ...$params));

        return (int) $count > 0;
    }
    
    /**
     * Initialize review reminder cron
     */
    public static function init(): void
    {
        add_action(self::CRON_HOOK, [self::class, 'sendReminder']);
    }
}
