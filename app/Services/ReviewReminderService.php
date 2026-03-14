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
    /**
     * Schedule review reminder for a booking
     * 
     * @param int $bookingId Booking ID
     */
    public static function scheduleReminder(int $bookingId): void
    {
        // Check if reviews are enabled
        if (!SettingsService::reviewsEnabled()) {
            return;
        }
        
        $reminder_days = SettingsService::getInt('review_reminder_days', 7);
        
        if ($reminder_days <= 0) {
            return;
        }
        
        // Schedule reminder using WordPress cron
        $timestamp = time() + ($reminder_days * DAY_IN_SECONDS);
        
        if (!wp_next_scheduled('yatra_send_review_reminder', [$bookingId])) {
            wp_schedule_single_event($timestamp, 'yatra_send_review_reminder', [$bookingId]);
        }
    }
    
    /**
     * Send review reminder email
     * 
     * @param int $bookingId Booking ID
     */
    public static function sendReminder(int $bookingId): void
    {
        $bookingRepository = new \Yatra\Repositories\BookingRepository();
        $booking = $bookingRepository->find($bookingId);
        
        if (!$booking || empty($booking->email)) {
            return;
        }
        
        // Check if customer has already reviewed
        if (self::hasCustomerReviewed($bookingId, $booking->customer_id)) {
            return;
        }
        
        // Get trip details
        $tripRepository = new \Yatra\Repositories\TripRepository();
        $trip = $tripRepository->find($booking->trip_id);
        
        if (!$trip) {
            return;
        }
        
        $subject = sprintf(
            __('[%s] How was your trip? Share your experience!', 'yatra'),
            get_bloginfo('name')
        );
        
        $review_url = get_permalink($trip->id) . '#reviews';
        
        $message = sprintf(
            __("Dear %s,\n\nWe hope you enjoyed your trip to %s!\n\nWe'd love to hear about your experience. Your feedback helps other travelers and helps us improve our services.\n\nPlease take a moment to leave a review:\n%s\n\nThank you for choosing %s!\n\nBest regards,\n%s", 'yatra'),
            $booking->first_name ?? 'Customer',
            $trip->title ?? 'your destination',
            $review_url,
            get_bloginfo('name'),
            get_bloginfo('name')
        );
        
        EmailService::send($booking->email, $subject, $message);
    }
    
    /**
     * Check if customer has already reviewed the trip
     * 
     * @param int $bookingId Booking ID
     * @param int $customerId Customer ID
     * @return bool
     */
    private static function hasCustomerReviewed(int $bookingId, int $customerId): bool
    {
        global $wpdb;
        
        $reviewsTable = \Yatra\Database\Tables\ReviewsTable::getTableName();
        
        $count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$reviewsTable} 
             WHERE booking_id = %d OR customer_id = %d",
            $bookingId,
            $customerId
        ));
        
        return $count > 0;
    }
    
    /**
     * Initialize review reminder cron
     */
    public static function init(): void
    {
        add_action('yatra_send_review_reminder', [self::class, 'sendReminder']);
    }
}
