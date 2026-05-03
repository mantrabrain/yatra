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
        $target_date = date('Y-m-d', strtotime("+{$reminder_days} days"));

        // Get confirmed bookings with travel date matching the target
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
                . '<p>' . esc_html(sprintf(__('Outstanding balance: %s — please pay before travel.', 'yatra'), yatra_format_price($amount_due))) . '</p>';
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

        $bookingRepository = self::getBookingRepository();
        $tripRepository = self::getTripRepository();

        // Calculate the expiry threshold
        $expiry_threshold = date('Y-m-d H:i:s', strtotime("-{$expiry_hours} hours"));

        // Get pending bookings that are older than the expiry threshold
        $expired_bookings = $bookingRepository->getExpiredPendingBookings($expiry_threshold);

        if (empty($expired_bookings)) {
            return;
        }

        foreach ($expired_bookings as $booking) {
            // Update booking status to expired/cancelled
            $bookingRepository->expireBooking(
                $booking->id,
                __('Booking expired due to non-payment', 'yatra')
            );

            do_action('yatra_booking_status_changed', (int) $booking->id, 'pending', 'cancelled');

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

