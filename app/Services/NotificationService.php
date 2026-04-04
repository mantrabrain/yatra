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

use Yatra\Repositories\BookingRepository;

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

        // Customer booking confirmation is sent by checkout / BookingService (TransactionalEmailTemplateService)
        // to avoid duplicate emails and to respect Settings → Email templates.
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

        // Notify admin only — customer cancellation email is sent from BookingService (TransactionalEmailTemplateService).
        if (SettingsService::isEnabled('notify_admin')) {
            self::notifyAdminCancellation($bookingId, $bookingData);
        }
    }
    
    /**
     * Notify admin of new booking
     */
    private static function notifyAdminNewBooking(int $bookingId, $bookingData): void
    {
        if (!apply_filters('yatra_notify_admin_new_booking', true, $bookingId, $bookingData)) {
            return;
        }

        $admin_email = SettingsService::getString('admin_email', get_option('admin_email'));
        if ($admin_email === '' || !is_email($admin_email)) {
            return;
        }

        $repository = new BookingRepository();
        $booking = $repository->findWithTrip($bookingId);
        if (!$booking) {
            return;
        }

        $adminNotifyContext = [
            'booking_id' => $bookingId,
            'reference' => $booking->reference ?? '',
            'source' => 'yatra_booking_created',
        ];
        if (!apply_filters('yatra_send_checkout_admin_notification', true, $adminNotifyContext)) {
            return;
        }

        $variables = TransactionalEmailTemplateService::variablesFromBooking($booking);

        TransactionalEmailTemplateService::sendIfEnabled(
            TransactionalEmailTemplateService::TYPE_ADMIN_NEW_BOOKING,
            $admin_email,
            $variables
        );
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
        $bookingRepository = new \Yatra\Repositories\BookingRepository();
        $booking = $bookingRepository->findWithTrip((int) ($paymentData['booking_id'] ?? 0));

        if (!$booking || empty($booking->contact_email)) {
            return;
        }

        $vars = TransactionalEmailTemplateService::variablesFromBooking($booking);
        $vars['payment_amount_formatted'] = yatra_format_price((float) ($paymentData['amount'] ?? 0));
        $vars['payment_method'] = (string) ($paymentData['payment_method'] ?? __('Online payment', 'yatra'));
        $vars['transaction_id'] = (string) ($paymentData['transaction_id'] ?? '');

        TransactionalEmailTemplateService::sendIfEnabled(
            TransactionalEmailTemplateService::TYPE_PAYMENT_CONFIRMATION,
            $booking->contact_email,
            $vars
        );
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
            $bookingData->trip_name ?? '',
            $bookingData->first_name ?? '',
            $bookingData->last_name ?? ''
        );
        
        EmailService::send($admin_email, $subject, $message);
    }
    
}
