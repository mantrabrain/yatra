<?php

declare(strict_types=1);

namespace Yatra\Services;

/**
 * Notification service for handling notifications
 */
class NotificationService
{
    /**
     * Send notification
     */
    public function sendNotification(string $type, array $data): bool
    {
        try {
            switch ($type) {
                case 'booking_confirmation':
                    return $this->sendBookingConfirmation($data);
                case 'payment_received':
                    return $this->sendPaymentReceived($data);
                case 'trip_reminder':
                    return $this->sendTripReminder($data);
                default:
                    return false;
            }
        } catch (\Exception $e) {
            error_log('Yatra notification error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send booking confirmation
     */
    private function sendBookingConfirmation(array $data): bool
    {
        $to = $data['email'] ?? '';
        $subject = __('Booking Confirmation - Yatra', 'yatra');
        $message = $this->getBookingConfirmationMessage($data);
        
        return wp_mail($to, $subject, $message, [
            'Content-Type: text/html; charset=UTF-8'
        ]);
    }

    /**
     * Send payment received notification
     */
    private function sendPaymentReceived(array $data): bool
    {
        $to = $data['email'] ?? '';
        $subject = __('Payment Received - Yatra', 'yatra');
        $message = $this->getPaymentReceivedMessage($data);
        
        return wp_mail($to, $subject, $message, [
            'Content-Type: text/html; charset=UTF-8'
        ]);
    }

    /**
     * Send trip reminder
     */
    private function sendTripReminder(array $data): bool
    {
        $to = $data['email'] ?? '';
        $subject = __('Trip Reminder - Yatra', 'yatra');
        $message = $this->getTripReminderMessage($data);
        
        return wp_mail($to, $subject, $message, [
            'Content-Type: text/html; charset=UTF-8'
        ]);
    }

    /**
     * Get booking confirmation message
     */
    private function getBookingConfirmationMessage(array $data): string
    {
        $bookingNumber = $data['booking_number'] ?? '';
        $tripName = $data['trip_name'] ?? '';
        $startDate = $data['start_date'] ?? '';
        $amount = $data['amount'] ?? '';

        return "
        <h2>" . __('Booking Confirmation', 'yatra') . "</h2>
        <p>" . __('Thank you for your booking!', 'yatra') . "</p>
        <p><strong>" . __('Booking Number:', 'yatra') . "</strong> {$bookingNumber}</p>
        <p><strong>" . __('Trip:', 'yatra') . "</strong> {$tripName}</p>
        <p><strong>" . __('Start Date:', 'yatra') . "</strong> {$startDate}</p>
        <p><strong>" . __('Amount:', 'yatra') . "</strong> {$amount}</p>
        ";
    }

    /**
     * Get payment received message
     */
    private function getPaymentReceivedMessage(array $data): string
    {
        $amount = $data['amount'] ?? '';
        $transactionId = $data['transaction_id'] ?? '';

        return "
        <h2>" . __('Payment Received', 'yatra') . "</h2>
        <p>" . __('We have received your payment.', 'yatra') . "</p>
        <p><strong>" . __('Amount:', 'yatra') . "</strong> {$amount}</p>
        <p><strong>" . __('Transaction ID:', 'yatra') . "</strong> {$transactionId}</p>
        ";
    }

    /**
     * Get trip reminder message
     */
    private function getTripReminderMessage(array $data): string
    {
        $tripName = $data['trip_name'] ?? '';
        $startDate = $data['start_date'] ?? '';
        $meetingPoint = $data['meeting_point'] ?? '';

        return "
        <h2>" . __('Trip Reminder', 'yatra') . "</h2>
        <p>" . __('Your trip is coming up soon!', 'yatra') . "</p>
        <p><strong>" . __('Trip:', 'yatra') . "</strong> {$tripName}</p>
        <p><strong>" . __('Start Date:', 'yatra') . "</strong> {$startDate}</p>
        <p><strong>" . __('Meeting Point:', 'yatra') . "</strong> {$meetingPoint}</p>
        ";
    }
} 