<?php
/**
 * Notification Service
 * 
 * Handles all notification sending (email, SMS, push)
 * 
 * @package Yatra\Services
 * @since 3.0.0
 */

declare(strict_types=1);

namespace Yatra\Services;

class NotificationService
{
    /**
     * Send booking created notification
     */
    public static function sendBookingCreatedNotification(int $bookingId, $bookingData): void
    {
        // Notify admin if enabled
        if (SettingsService::isEnabled('notify_new_booking') && SettingsService::isEnabled('notify_admin')) {
            self::notifyAdminNewBooking($bookingId, $bookingData);
        }
        
        // Notify customer if enabled
        if (SettingsService::isEnabled('notify_customer_booking')) {
            self::notifyCustomerBookingCreated($bookingId, $bookingData);
        }
    }
    
    /**
     * Send payment completed notification
     */
    public static function sendPaymentCompletedNotification(array $paymentData): void
    {
        // Notify admin if enabled
        if (SettingsService::isEnabled('notify_payment') && SettingsService::isEnabled('notify_admin')) {
            self::notifyAdminPaymentReceived($paymentData);
        }
        
        // Notify customer if enabled
        if (SettingsService::isEnabled('notify_customer_payment')) {
            self::notifyCustomerPaymentReceived($paymentData);
        }
    }
    
    /**
     * Send booking cancellation notification
     */
    public static function sendCancellationNotification(int $bookingId, $bookingData): void
    {
        if (!SettingsService::isEnabled('notify_cancellation')) {
            return;
        }
        
        // Notify admin
        if (SettingsService::isEnabled('notify_admin')) {
            self::notifyAdminCancellation($bookingId, $bookingData);
        }
        
        // Notify customer
        self::notifyCustomerCancellation($bookingId, $bookingData);
    }
    
    /**
     * Notify admin of new booking
     */
    private static function notifyAdminNewBooking(int $bookingId, $bookingData): void
    {
        $admin_email = get_option('admin_email');
        $subject = sprintf(__('[%s] New Booking Received - #%d', 'yatra'), get_bloginfo('name'), $bookingId);
        
        $message = sprintf(
            __("A new booking has been received.\n\nBooking ID: %d\nTrip: %s\nCustomer: %s %s\nEmail: %s\nTotal Amount: %s\n\nView booking details in admin panel.", 'yatra'),
            $bookingId,
            $bookingData['trip_name'] ?? '',
            $bookingData['first_name'] ?? '',
            $bookingData['last_name'] ?? '',
            $bookingData['email'] ?? '',
            yatra_format_price($bookingData['total_amount'] ?? 0)
        );
        
        EmailService::send($admin_email, $subject, $message);
    }
    
    /**
     * Notify customer of booking creation
     */
    private static function notifyCustomerBookingCreated(int $bookingId, $bookingData): void
    {
        $customer_email = $bookingData['email'] ?? '';
        if (empty($customer_email)) {
            return;
        }
        
        $subject = sprintf(__('[%s] Booking Confirmation - #%d', 'yatra'), get_bloginfo('name'), $bookingId);
        
        $message = sprintf(
            __("Dear %s,\n\nThank you for your booking!\n\nBooking ID: %d\nTrip: %s\nTotal Amount: %s\n\nWe will send you further details shortly.\n\nBest regards,\n%s", 'yatra'),
            $bookingData['first_name'] ?? 'Customer',
            $bookingId,
            $bookingData['trip_name'] ?? '',
            yatra_format_price($bookingData['total_amount'] ?? 0),
            get_bloginfo('name')
        );
        
        EmailService::send($customer_email, $subject, $message);
    }
    
    /**
     * Notify admin of payment received
     */
    private static function notifyAdminPaymentReceived(array $paymentData): void
    {
        $admin_email = get_option('admin_email');
        $subject = sprintf(__('[%s] Payment Received - Booking #%d', 'yatra'), get_bloginfo('name'), $paymentData['booking_id'] ?? 0);
        
        $message = sprintf(
            __("Payment has been received.\n\nBooking ID: %d\nAmount: %s\nPayment Method: %s\nTransaction ID: %s", 'yatra'),
            $paymentData['booking_id'] ?? 0,
            yatra_format_price($paymentData['amount'] ?? 0),
            $paymentData['payment_method'] ?? 'N/A',
            $paymentData['transaction_id'] ?? 'N/A'
        );
        
        EmailService::send($admin_email, $subject, $message);
    }
    
    /**
     * Notify customer of payment received
     */
    private static function notifyCustomerPaymentReceived(array $paymentData): void
    {
        // Get booking to get customer email
        $bookingRepository = new \Yatra\Repositories\BookingRepository();
        $booking = $bookingRepository->find($paymentData['booking_id'] ?? 0);
        
        if (!$booking || empty($booking->email)) {
            return;
        }
        
        $subject = sprintf(__('[%s] Payment Confirmation - Booking #%d', 'yatra'), get_bloginfo('name'), $booking->id);
        
        $message = sprintf(
            __("Dear %s,\n\nYour payment has been received successfully!\n\nBooking ID: %d\nAmount Paid: %s\nPayment Method: %s\n\nThank you for your payment.\n\nBest regards,\n%s", 'yatra'),
            $booking->first_name ?? 'Customer',
            $booking->id,
            yatra_format_price($paymentData['amount'] ?? 0),
            $paymentData['payment_method'] ?? 'N/A',
            get_bloginfo('name')
        );
        
        EmailService::send($booking->email, $subject, $message);
    }
    
    /**
     * Notify admin of cancellation
     */
    private static function notifyAdminCancellation(int $bookingId, $bookingData): void
    {
        $admin_email = get_option('admin_email');
        $subject = sprintf(__('[%s] Booking Cancelled - #%d', 'yatra'), get_bloginfo('name'), $bookingId);
        
        $message = sprintf(
            __("A booking has been cancelled.\n\nBooking ID: %d\nTrip: %s\nCustomer: %s %s", 'yatra'),
            $bookingId,
            $bookingData['trip_name'] ?? '',
            $bookingData['first_name'] ?? '',
            $bookingData['last_name'] ?? ''
        );
        
        EmailService::send($admin_email, $subject, $message);
    }
    
    /**
     * Notify customer of cancellation
     */
    private static function notifyCustomerCancellation(int $bookingId, $bookingData): void
    {
        $customer_email = $bookingData['email'] ?? '';
        if (empty($customer_email)) {
            return;
        }
        
        $subject = sprintf(__('[%s] Booking Cancelled - #%d', 'yatra'), get_bloginfo('name'), $bookingId);
        
        $message = sprintf(
            __("Dear %s,\n\nYour booking has been cancelled.\n\nBooking ID: %d\nTrip: %s\n\nIf you have any questions, please contact us.\n\nBest regards,\n%s", 'yatra'),
            $bookingData['first_name'] ?? 'Customer',
            $bookingId,
            $bookingData['trip_name'] ?? '',
            get_bloginfo('name')
        );
        
        EmailService::send($customer_email, $subject, $message);
    }
}
