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
        NotificationService::sendBookingCreatedNotification($bookingId, $bookingData);
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
