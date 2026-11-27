<?php
/**
 * Notification Hooks
 * 
 * Registers hooks for notification system
 * 
 * @package Yatra\Hooks
 * @since 3.0.0
 */

declare(strict_types=1);

namespace Yatra\Hooks;

use Yatra\Services\NotificationService;

class NotificationHooks
{
    /**
     * Initialize notification hooks
     */
    public static function init(): void
    {
        // Booking notifications
        add_action('yatra_booking_created', [self::class, 'onBookingCreated'], 10, 2);
        add_action('yatra_payment_completed', [self::class, 'onPaymentCompleted'], 10, 4);
        add_action('yatra_booking_status_changed', [self::class, 'onBookingStatusChanged'], 10, 3);
    }
    
    /**
     * Handle booking created event
     */
    public static function onBookingCreated(int $bookingId, $bookingData): void
    {
        // Sent once the request is done: checkout confirms the booking (auto-
        // confirm, payment) right after creating it, and the email read the
        // row too early — "Booking status: pending" for a confirmed booking.
        if (self::$pendingCreated === []) {
            add_action('shutdown', [self::class, 'flushCreatedNotifications'], 1);
        }
        self::$pendingCreated[$bookingId] = $bookingData;
    }

    /** @var array<int, mixed> Bookings created in this request, waiting for their admin email. */
    private static array $pendingCreated = [];

    public static function flushCreatedNotifications(): void
    {
        $pending = self::$pendingCreated;
        self::$pendingCreated = [];
        foreach ($pending as $bookingId => $bookingData) {
            try {
                NotificationService::sendBookingCreatedNotification((int) $bookingId, $bookingData);
            } catch (\Throwable $e) {
                if (class_exists('\\Yatra\\Utils\\Logger')) {
                    \Yatra\Utils\Logger::error('Admin new-booking email failed', ['booking_id' => $bookingId, 'error' => $e->getMessage()]);
                }
            }
        }
    }
    
    /**
     * Handle payment completed event
     */
    public static function onPaymentCompleted(...$args): void
    {
        $paymentData = [];
        
        if (!empty($args)) {
            // Format A: array payload
            if (is_array($args[0])) {
                $paymentData = $args[0];
            }
            // Format B: multiple args with array at end
            elseif (isset($args[3]) && is_array($args[3])) {
                $paymentData = $args[3];
                if (!empty($args[0]) && is_numeric($args[0])) {
                    $paymentData['booking_id'] = $paymentData['booking_id'] ?? (int) $args[0];
                }
                if (!empty($args[1]) && is_string($args[1])) {
                    $paymentData['payment_method'] = $paymentData['payment_method'] ?? $args[1];
                }
                if (!empty($args[2])) {
                    $paymentData['transaction_id'] = $paymentData['transaction_id'] ?? $args[2];
                }
            }
        }
        
        // A manually recorded payment (PaymentService) fires this same action
        // with `send_emails` => false when an operator opted out via the
        // `yatra_send_manual_payment_emails` filter; the event still reaches
        // every other listener (automations, webhooks, …).
        if (isset($paymentData['send_emails']) && !$paymentData['send_emails']) {
            return;
        }

        if (!empty($paymentData)) {
            NotificationService::sendPaymentCompletedNotification($paymentData);
        }
    }
    
    /**
     * Handle booking status changed event
     */
    public static function onBookingStatusChanged(int $bookingId, string $oldStatus, string $newStatus): void
    {
        // Send cancellation notification if status changed to cancelled
        if ($newStatus === 'cancelled') {
            $bookingRepository = new \Yatra\Repositories\BookingRepository();
            $booking = $bookingRepository->find($bookingId);
            
            if ($booking) {
                NotificationService::sendCancellationNotification($bookingId, (array) $booking);
            }
        }
    }
}
