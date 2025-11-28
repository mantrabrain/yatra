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
            self::sendReminderEmail($booking);

            // Mark reminder as sent
            $bookingRepository->markReminderSent($booking->id);
        }

        // Log the operation
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(sprintf('Yatra: Sent %d booking reminders for travel date %s', count($bookings), $target_date));
        }
    }

    /**
     * Send a reminder email to the customer
     */
    private static function sendReminderEmail(object $booking): void
    {
        $customer_email = $booking->contact_email;
        $customer_name = trim($booking->contact_first_name . ' ' . $booking->contact_last_name);
        
        if (empty($customer_email)) {
            return;
        }

        $reminder_days = (int) SettingsService::get('booking_reminder_days', 3);
        $currency = $booking->currency ?: 'USD';
        
        $subject = sprintf(
            __('[%s] Trip Reminder - Your adventure is %d days away!', 'yatra'),
            get_bloginfo('name'),
            $reminder_days
        );

        $body = sprintf(__("Dear %s,\n\n", 'yatra'), $customer_name ?: 'Traveler');
        $body .= sprintf(__("This is a friendly reminder that your trip is just %d days away!\n\n", 'yatra'), $reminder_days);
        
        $body .= "═══════════════════════════════════════\n";
        $body .= sprintf(__("Booking Reference: %s\n", 'yatra'), $booking->reference);
        $body .= "═══════════════════════════════════════\n\n";
        
        $body .= sprintf(__("Trip: %s\n", 'yatra'), $booking->trip_title);
        $body .= sprintf(__("Travel Date: %s\n", 'yatra'), date_i18n(get_option('date_format'), strtotime($booking->travel_date)));
        $body .= sprintf(__("Travelers: %d\n\n", 'yatra'), $booking->travelers_count);

        // Check payment status
        $amount_due = (float) $booking->amount_due;
        if ($amount_due > 0) {
            $body .= "⚠️ " . __("PAYMENT REMINDER\n", 'yatra');
            $body .= "───────────────────────────────────────\n";
            $body .= sprintf(__("Outstanding Balance: %s\n", 'yatra'), yatra_format_price($amount_due, $currency));
            $body .= __("Please ensure payment is completed before your travel date.\n\n", 'yatra');
        }

        $body .= __("PREPARATION CHECKLIST\n", 'yatra');
        $body .= "───────────────────────────────────────\n";
        $body .= __("□ Valid passport (at least 6 months validity)\n", 'yatra');
        $body .= __("□ Travel insurance documents\n", 'yatra');
        $body .= __("□ Emergency contact information\n", 'yatra');
        $body .= __("□ Any required medications\n", 'yatra');
        $body .= __("□ Appropriate clothing for your destination\n\n", 'yatra');

        $body .= __("If you have any questions or need to make changes, please contact us.\n\n", 'yatra');
        $body .= sprintf(__("Have a wonderful trip!\n\n%s Team\n", 'yatra'), get_bloginfo('name'));
        $body .= home_url() . "\n";

        $headers = ['Content-Type: text/plain; charset=UTF-8'];
        
        wp_mail($customer_email, $subject, $body, $headers);
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

            // Get trip title for email
            $trip = $tripRepository->find($booking->trip_id);

            // Send expiry notification email
            self::sendExpiryEmail($booking, $trip);
        }

        // Log the operation
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(sprintf('Yatra: Expired %d pending bookings', count($expired_bookings)));
        }
    }

    /**
     * Send expiry notification email
     */
    private static function sendExpiryEmail(object $booking, ?object $trip): void
    {
        $customer_email = $booking->contact_email;
        $customer_name = trim($booking->contact_first_name . ' ' . $booking->contact_last_name);
        
        if (empty($customer_email)) {
            return;
        }

        $expiry_hours = (int) SettingsService::get('booking_expiry_hours', 24);

        $subject = sprintf(
            __('[%s] Booking Expired - %s', 'yatra'),
            get_bloginfo('name'),
            $booking->reference
        );

        $body = sprintf(__("Dear %s,\n\n", 'yatra'), $customer_name ?: 'Customer');
        $body .= __("We regret to inform you that your booking has been automatically cancelled due to non-payment.\n\n", 'yatra');
        
        $body .= "═══════════════════════════════════════\n";
        $body .= sprintf(__("Booking Reference: %s\n", 'yatra'), $booking->reference);
        $body .= sprintf(__("Trip: %s\n", 'yatra'), $trip ? $trip->title : 'N/A');
        $body .= "═══════════════════════════════════════\n\n";
        
        $body .= sprintf(
            __("Bookings that are not paid within %d hours are automatically cancelled to maintain availability for other travelers.\n\n", 'yatra'),
            $expiry_hours
        );

        $body .= __("If you still wish to book this trip, please visit our website to create a new booking.\n\n", 'yatra');
        $body .= __("If you believe this is an error or have already made a payment, please contact us immediately.\n\n", 'yatra');
        
        $body .= sprintf(__("Best regards,\n%s Team\n", 'yatra'), get_bloginfo('name'));
        $body .= home_url() . "\n";

        $headers = ['Content-Type: text/plain; charset=UTF-8'];
        
        wp_mail($customer_email, $subject, $body, $headers);

        // Also notify admin
        $admin_email = get_option('admin_email');
        $admin_subject = sprintf(__('[%s] Booking Expired - %s', 'yatra'), get_bloginfo('name'), $booking->reference);
        
        $admin_body = sprintf(__("Booking %s has been automatically cancelled due to non-payment.\n\n", 'yatra'), $booking->reference);
        $admin_body .= sprintf(__("Customer: %s (%s)\n", 'yatra'), $customer_name, $customer_email);
        $admin_body .= sprintf(__("Trip: %s\n", 'yatra'), $trip ? $trip->title : 'N/A');
        $admin_body .= sprintf(__("View: %s\n", 'yatra'), admin_url('admin.php?page=yatra&subpage=bookings&action=view&id=' . $booking->id));

        wp_mail($admin_email, $admin_subject, $admin_body, $headers);
    }
}

