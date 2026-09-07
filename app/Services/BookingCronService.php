<?php

namespace Yatra\Services;

use Yatra\Repositories\BookingRepository;
use Yatra\Repositories\TripRepository;

/**
 * Handles scheduled booking tasks:
 * - Sending reminder emails before departure
 * - Auto-cancelling expired pending bookings
 */
class BookingCronService
{
    /**
     * Get BookingRepository instance
     *
     * @return BookingRepository
     */
    private static function getBookingRepository(): BookingRepository
    {
        static $repository = null;
        if ($repository === null) {
            $repository = new BookingRepository();
        }
        return $repository;
    }

    /**
     * Get TripRepository instance
     *
     * @return TripRepository
     */
    private static function getTripRepository(): TripRepository
    {
        static $repository = null;
        if ($repository === null) {
            $repository = new TripRepository();
        }
        return $repository;
    }

    /**
     * Departure service, wired the same way BookingService wires it, so the
     * expiry sweep releases inventory through exactly the same code path an
     * admin cancellation uses.
     */
    private static function getDepartureService(): \Yatra\Services\DepartureService
    {
        static $service = null;
        if ($service === null) {
            $service = new \Yatra\Services\DepartureService(
                new \Yatra\Repositories\DepartureRepository(),
                new \Yatra\Repositories\BookingDepartureRepository(),
                self::getBookingRepository(),
                self::getTripRepository()
            );
        }
        return $service;
    }

    /**
     * Register cron hooks
     */
    public static function register(): void
    {
        // Register cron hooks
        add_action('yatra_booking_reminder', [self::class, 'sendBookingReminders']);
        add_action('yatra_booking_expiry', [self::class, 'expirePendingBookings']);

        // Schedule events if not already scheduled
        self::scheduleEvents();
    }

    /**
     * Schedule cron events
     */
    public static function scheduleEvents(): void
    {
        // Schedule reminder emails - run daily
        if (!wp_next_scheduled('yatra_booking_reminder')) {
            wp_schedule_event(time(), 'daily', 'yatra_booking_reminder');
        }

        // Schedule expiry check - run hourly
        if (!wp_next_scheduled('yatra_booking_expiry')) {
            wp_schedule_event(time(), 'hourly', 'yatra_booking_expiry');
        }
    }

    /**
     * Unschedule cron events (on plugin deactivation)
     */
    public static function unscheduleEvents(): void
    {
        $timestamp = wp_next_scheduled('yatra_booking_reminder');
        if ($timestamp) {
            wp_unschedule_event($timestamp, 'yatra_booking_reminder');
        }

        $timestamp = wp_next_scheduled('yatra_booking_expiry');
        if ($timestamp) {
            wp_unschedule_event($timestamp, 'yatra_booking_expiry');
        }
    }

    /**
     * Send reminder emails for upcoming trips
     */
    public static function sendBookingReminders(): void
    {
        $reminder_days = (int) SettingsService::get('booking_reminder_days', 3);

        if ($reminder_days <= 0) {
            return; // Reminders disabled
        }

        $bookingRepository = self::getBookingRepository();

        // Calculate the target date (X days from now)
        // Site-local for the same reason as the expiry threshold: travel dates
        // are the operator's local dates, so near midnight a UTC-derived target
        // picked the wrong day on any site with an offset.
        $target_date = date('Y-m-d', current_time('timestamp') + ($reminder_days * DAY_IN_SECONDS));

        // Confirmed bookings — plus pending ones that have paid a deposit (see
        // BookingRepository::getBookingsForReminder) — travelling on the target date
        $bookings = $bookingRepository->getBookingsForReminder($target_date);

        if (empty($bookings)) {
            return;
        }

        foreach ($bookings as $booking) {
            if (self::sendReminderEmail($booking)) {
                $bookingRepository->markReminderSent($booking->id);
            }
        }

        // Log the operation
        if (defined('WP_DEBUG') && WP_DEBUG) {
            }
    }

    /**
     * Ensure the daily booking-completion sweep is scheduled.
     *
     * Wired from CronHooks (the plugin's live cron bootstrap) rather than the
     * legacy register()/scheduleEvents() path above, which is not invoked. Only
     * the completion event is scheduled here — the reminder/expiry events are
     * intentionally left as-is to avoid changing their (separate) behavior.
     */
    public static function registerCompletionCron(): void
    {
        if (!wp_next_scheduled('yatra_booking_completion')) {
            wp_schedule_event(time(), 'daily', 'yatra_booking_completion');
        }
    }

    /**
     * Ensure the unpaid-booking expiry and pre-trip reminder sweeps are scheduled.
     *
     * Both events existed but nothing ever scheduled them or attached a
     * callback: register() — which does both — is not called anywhere, so
     * `Settings → Booking → Booking Expiry (hours)` never expired anything and
     * the reminder email never went out on its own. Wired from CronHooks
     * alongside the completion sweep.
     *
     * Expiry is guarded by an activation floor (see expirePendingBookings), so
     * switching this on cannot retroactively cancel a site's existing pending
     * bookings.
     */
    public static function registerMaintenanceCrons(): void
    {
        if (!wp_next_scheduled('yatra_booking_expiry')) {
            wp_schedule_event(time(), 'hourly', 'yatra_booking_expiry');
        }

        if (!wp_next_scheduled('yatra_booking_reminder')) {
            wp_schedule_event(time(), 'daily', 'yatra_booking_reminder');
        }
    }

    /**
     * Unschedule the booking-completion sweep (plugin deactivation).
     */
    public static function unregisterCompletionCron(): void
    {
        $timestamp = wp_next_scheduled('yatra_booking_completion');
        if ($timestamp) {
            wp_unschedule_event($timestamp, 'yatra_booking_completion');
        }
    }

    /**
     * Mark confirmed bookings 'completed' once their tour has taken place.
     *
     * Nothing previously transitioned a booking to 'completed' automatically —
     * the status (and therefore the booking.completed email / Email Automation
     * sequence) only changed when an operator edited each booking by hand. So
     * the post-tour email was effectively never sent. This daily sweep does
     * what an operator would: for every confirmed booking whose tour date has
     * passed, it calls the same updateStatus() path the admin UI uses, which
     * fires the notification, the yatra_booking_status_changed action (Pro
     * sequences), and schedules the review reminder.
     *
     * Backward-compat: an activation floor (yatra_booking_autocomplete_since) is
     * stamped on the first run so we never retroactively complete — and email
     * the customers of — tours that ended before this automation shipped. Only
     * tours finishing from activation onward are auto-completed. Operators can
     * disable the sweep entirely via the yatra_auto_complete_bookings filter,
     * and the email itself still respects its own template on/off setting.
     */
    public static function completeFinishedBookings(): void
    {
        /**
         * Allow disabling automatic booking completion entirely.
         *
         * @param bool $enabled Default true.
         */
        if (!apply_filters('yatra_auto_complete_bookings', true)) {
            return;
        }

        $floorOption = 'yatra_booking_autocomplete_since';
        $today = current_time('Y-m-d');

        $floor = (string) get_option($floorOption, '');
        if ($floor === '') {
            // First run on this site: establish the floor at today so historical
            // bookings are never retroactively completed/emailed. Tours finishing
            // from now on are picked up on subsequent runs.
            update_option($floorOption, $today);

            return;
        }

        $bookingRepository = self::getBookingRepository();
        $ids = $bookingRepository->getConfirmedBookingIdsPastTour($today, $floor, 500);

        if (empty($ids)) {
            return;
        }

        $bookingService = new BookingService();

        foreach ($ids as $id) {
            // Same entry point the admin "change status" action uses, so all
            // side effects (notification, status-changed hook, review reminder,
            // departure booked_count handling) stay identical to a manual mark.
            $bookingService->updateStatus((int) $id, 'completed');
        }
    }

    /**
     * Send a reminder email to the customer
     */
    private static function sendReminderEmail(object $booking): bool
    {
        $customer_email = $booking->contact_email;

        if (empty($customer_email)) {
            return false;
        }

        $reminder_days = (int) SettingsService::get('booking_reminder_days', 3);
        $vars = TransactionalEmailTemplateService::variablesFromBooking($booking);
        $vars['reminder_days'] = (string) $reminder_days;
        $vars['days_until_trip'] = (string) $reminder_days;

        $amount_due = (float) $booking->amount_due;
        $extra = '';
        if ($amount_due > 0) {
            $extra = '<p><strong>' . esc_html__('Payment reminder', 'yatra') . '</strong></p>'
                . '<p>' . esc_html(sprintf(
                    /* translators: %s: formatted outstanding balance amount. */
                    __('Outstanding balance: %s — please pay before travel.', 'yatra'),
                    yatra_format_price($amount_due)
                )) . '</p>';
        }
        $extra .= '<p><strong>' . esc_html__('Preparation checklist', 'yatra') . '</strong></p><ul>'
            . '<li>' . esc_html__('Valid government-issued ID', 'yatra') . '</li>'
            . '<li>' . esc_html__('Travel insurance', 'yatra') . '</li>'
            . '<li>' . esc_html__('Emergency contacts', 'yatra') . '</li>'
            . '</ul>';
        $vars['reminder_extra_html'] = $extra;

        return TransactionalEmailTemplateService::sendIfEnabled(
            TransactionalEmailTemplateService::TYPE_BOOKING_REMINDER,
            $customer_email,
            $vars
        );
    }

    /**
     * Expire pending bookings that have passed the expiry time
     */
    public static function expirePendingBookings(): void
    {
        $expiry_hours = (int) SettingsService::get('booking_expiry_hours', 24);

        if ($expiry_hours <= 0) {
            return; // Expiry disabled
        }

        /**
         * Allow disabling automatic expiry of unpaid bookings entirely.
         *
         * @param bool $enabled Default true.
         */
        if (!apply_filters('yatra_auto_expire_bookings', true)) {
            return;
        }

        // Activation floor, mirroring the completion sweep: the first run only
        // records "from here on". Without it, a site whose expiry cron starts
        // running would cancel — and email about — every historical unpaid
        // booking in one go.
        $floorOption = 'yatra_booking_expiry_since';
        $floor = (string) get_option($floorOption, '');
        if ($floor === '') {
            update_option($floorOption, current_time('mysql'));

            return;
        }

        $bookingRepository = self::getBookingRepository();
        $tripRepository = self::getTripRepository();

        // Calculate the expiry threshold
        // Site-local, because `created_at` is written with current_time('mysql').
        // Deriving the threshold from PHP's clock (UTC in WordPress) compared a
        // local timestamp against a UTC one, so a site at UTC-5 expired bookings
        // five hours EARLY and a site at UTC+2 two hours late. Matches the
        // current_time() basis the completion sweep above already uses.
        $expiry_threshold = date('Y-m-d H:i:s', current_time('timestamp') - ($expiry_hours * HOUR_IN_SECONDS));

        // Get pending bookings that are older than the expiry threshold
        $expired_bookings = $bookingRepository->getExpiredPendingBookings($expiry_threshold, $floor);

        if (empty($expired_bookings)) {
            return;
        }

        $departureService = self::getDepartureService();

        foreach ($expired_bookings as $booking) {
            // Update booking status to expired/cancelled
            $bookingRepository->expireBooking(
                $booking->id,
                __('Booking expired due to non-payment', 'yatra')
            );

            // Give the seat back. expireBooking() writes the row directly rather
            // than going through BookingService::updateStatus(), which is what
            // normally unlinks the departure and decrements its booked_count —
            // so without this an expired booking held its seat forever and the
            // departure slowly "sold out" to bookings nobody ever paid for.
            try {
                $departure = $departureService->getDepartureForBooking((int) $booking->id);
                if ($departure && !empty($departure->id)) {
                    $departureService->unlinkBookingFromDeparture((int) $booking->id, (int) $departure->id);
                }
            } catch (\Throwable $e) {
                // Never let inventory bookkeeping stop the sweep.
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log('[Yatra] expiry: releasing the departure seat failed - ' . $e->getMessage());
                }
            }

            do_action('yatra_booking_status_changed', (int) $booking->id, 'pending', 'cancelled');

            // An expiry IS a cancellation, so announce it like one (Google
            // Calendar, WhatsApp and the `booking.cancelled` webhook all listen
            // here) …
            if (function_exists('yatra_trigger_booking_cancelled')) {
                \yatra_trigger_booking_cancelled((int) $booking->id, 'pending');
            }

            /**
             * … and separately, that this particular cancellation was an
             * automatic expiry. Distinct from `yatra_booking_cancelled` so an
             * integration can tell "the customer never paid" apart from "someone
             * cancelled this booking".
             *
             * @param int $bookingId Booking ID.
             */
            do_action('yatra_booking_expired', (int) $booking->id);

            // Get trip title for email
            $trip = $tripRepository->find($booking->trip_id);

            // Send expiry notification email
            self::sendExpiryEmail($booking, $trip);
        }

        // Log the operation
        if (defined('WP_DEBUG') && WP_DEBUG) {
            }
    }

    /**
     * Send expiry notification email
     */
    private static function sendExpiryEmail(object $booking, ?object $trip): void
    {
        $customer_email = $booking->contact_email;

        if (empty($customer_email)) {
            return;
        }

        $expiry_hours = (int) SettingsService::get('booking_expiry_hours', 24);
        $full = self::getBookingRepository()->findWithTrip((int) $booking->id) ?: $booking;

        $vars = TransactionalEmailTemplateService::variablesFromBooking($full);
        if ($trip && !empty($trip->title)) {
            $vars['trip_name'] = (string) $trip->title;
        }
        $vars['expiry_policy_note'] = sprintf(
            /* translators: %d: hours until unpaid booking expires */
            __('Unpaid bookings are released after %d hours.', 'yatra'),
            $expiry_hours
        );

        TransactionalEmailTemplateService::sendIfEnabled(
            TransactionalEmailTemplateService::TYPE_BOOKING_EXPIRED_CUSTOMER,
            (string) $customer_email,
            $vars
        );

        $admin_email = sanitize_email((string) SettingsService::getString('admin_email', (string) get_option('admin_email', '')));
        if ($admin_email !== '' && is_email($admin_email)) {
            TransactionalEmailTemplateService::sendIfEnabled(
                TransactionalEmailTemplateService::TYPE_ADMIN_BOOKING_EXPIRED,
                $admin_email,
                $vars
            );
        }
    }
}

