<?php
/**
 * Notification Service
 *
 * Admin / customer emails for booking lifecycle events. Enable/disable and copy are controlled
 * under Yatra → Email → Templates (settings-backed flags), not Settings → Notifications.
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
     * Send booking created notification (admin: {@see TransactionalEmailTemplateService::TYPE_ADMIN_NEW_BOOKING}).
     */
    public static function sendBookingCreatedNotification(int $bookingId, $bookingData): void
    {
        self::notifyAdminNewBooking($bookingId, $bookingData);
    }

    /**
     * Send payment completed notification (admin + customer templates).
     */
    public static function sendPaymentCompletedNotification(array $paymentData): void
    {
        self::notifyAdminPaymentReceived($paymentData);
        self::notifyCustomerPaymentReceived($paymentData);
    }

    /**
     * Send booking cancellation notification (admin template; customer email uses transactional templates from BookingService).
     */
    public static function sendCancellationNotification(int $bookingId, $bookingData): void
    {
        self::notifyAdminCancellation($bookingId, $bookingData);
    }

    /**
     * Notify admin of new booking
     */
    private static function notifyAdminNewBooking(int $bookingId, $bookingData): void
    {
        if (!apply_filters('yatra_notify_admin_new_booking', true, $bookingId, $bookingData)) {
            return;
        }

        $admin_email = SettingsService::getString('admin_email', (string) get_option('admin_email', ''));
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
     * Notify admin of payment received (template: admin_payment_received).
     */
    private static function notifyAdminPaymentReceived(array $paymentData): void
    {
        $admin_email = SettingsService::getString('admin_email', (string) get_option('admin_email', ''));
        if ($admin_email === '' || !is_email($admin_email)) {
            return;
        }

        $bookingRepository = new BookingRepository();
        $booking = $bookingRepository->findWithTrip((int) ($paymentData['booking_id'] ?? 0));
        if (!$booking) {
            return;
        }

        $vars = TransactionalEmailTemplateService::variablesFromBooking($booking);
        $vars['payment_amount_formatted'] = yatra_format_price((float) ($paymentData['amount'] ?? 0));
        $vars['payment_method'] = (string) ($paymentData['payment_method'] ?? __('Online payment', 'yatra'));
        $vars['transaction_id'] = (string) ($paymentData['transaction_id'] ?? '');

        TransactionalEmailTemplateService::sendIfEnabled(
            TransactionalEmailTemplateService::TYPE_ADMIN_PAYMENT_RECEIVED,
            $admin_email,
            $vars
        );
    }

    /**
     * Notify customer of payment received
     */
    private static function notifyCustomerPaymentReceived(array $paymentData): void
    {
        $bookingRepository = new BookingRepository();
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
        $admin_email = SettingsService::getString('admin_email', (string) get_option('admin_email', ''));
        if ($admin_email === '' || !is_email($admin_email)) {
            return;
        }

        $repository = new BookingRepository();
        $booking = $repository->findWithTrip($bookingId);
        if (!$booking) {
            return;
        }

        $variables = TransactionalEmailTemplateService::variablesFromBooking($booking);

        TransactionalEmailTemplateService::sendIfEnabled(
            TransactionalEmailTemplateService::TYPE_ADMIN_BOOKING_CANCELLED,
            $admin_email,
            $variables
        );
    }
}
