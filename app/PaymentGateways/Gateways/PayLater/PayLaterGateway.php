<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways\Gateways\Square;

use Yatra\PaymentGateways\AbstractPaymentGateway;

class PayLaterGateway extends AbstractPaymentGateway
{
    protected string $id = 'pay_later';
    protected string $title = 'Book Now, Pay Later';
    protected string $description = 'Reserve now and pay before the trip';
    protected string $icon = 'pay-later.svg';
    protected bool $isOffline = true;
    protected array $supports = ['pay_later', 'reservation'];

    public function getConfigFields(): array
    {
        return [
            [
                'id' => 'payment_deadline_days',
                'type' => 'number',
                'label' => __('Payment Deadline (Days Before Trip)', 'yatra'),
                'description' => __('Number of days before the trip when full payment is required', 'yatra'),
                'placeholder' => '7',
                'default' => '7',
                'min' => 1,
                'max' => 60,
            ],
            [
                'id' => 'auto_cancel_days',
                'type' => 'number',
                'label' => __('Auto-Cancel After (Days)', 'yatra'),
                'description' => __('Automatically cancel unpaid bookings after this many days (0 to disable)', 'yatra'),
                'placeholder' => '3',
                'default' => '3',
                'min' => 0,
                'max' => 30,
            ],
            [
                'id' => 'require_deposit',
                'type' => 'checkbox',
                'label' => __('Require Small Deposit', 'yatra'),
                'description' => __('Collect a small deposit to confirm the booking', 'yatra'),
                'default' => false,
            ],
            [
                'id' => 'deposit_amount',
                'type' => 'number',
                'label' => __('Deposit Amount (%)', 'yatra'),
                'description' => __('Percentage of total amount required as deposit', 'yatra'),
                'placeholder' => '10',
                'default' => '10',
                'min' => 1,
                'max' => 50,
                'condition' => 'require_deposit',
            ],
            [
                'id' => 'reminder_days',
                'type' => 'text',
                'label' => __('Payment Reminder Days', 'yatra'),
                'description' => __('Send payment reminders X days before deadline (comma-separated, e.g., 7,3,1)', 'yatra'),
                'placeholder' => '7,3,1',
                'default' => '7,3,1',
            ],
        ];
    }

    public function processPayment(array $paymentData): array
    {
        $bookingId = $paymentData['booking_id'] ?? 0;
        $tripDate = $paymentData['trip_date'] ?? '';
        $amount = (float) ($paymentData['amount'] ?? 0);
        
        $deadlineDays = (int) ($this->config['payment_deadline_days'] ?? 7);
        $requireDeposit = !empty($this->config['require_deposit']);
        $depositPercentage = (int) ($this->config['deposit_amount'] ?? 10);

        // Calculate payment deadline
        $paymentDeadline = null;
        if (!empty($tripDate)) {
            $tripDateTime = strtotime($tripDate);
            $paymentDeadline = date('Y-m-d', strtotime("-{$deadlineDays} days", $tripDateTime));
        }

        $depositAmount = 0;
        if ($requireDeposit) {
            $depositAmount = ($amount * $depositPercentage) / 100;
        }

        return [
            'success' => true,
            'payment_method' => 'pay_later',
            'status' => $requireDeposit ? 'deposit_required' : 'reserved',
            'booking_id' => $bookingId,
            'total_amount' => $amount,
            'deposit_required' => $requireDeposit,
            'deposit_amount' => $depositAmount,
            'remaining_amount' => $amount - $depositAmount,
            'payment_deadline' => $paymentDeadline,
            'deadline_days' => $deadlineDays,
            'message' => $requireDeposit 
                ? sprintf(__('A deposit of %s is required to confirm your booking. Full payment is due %d days before your trip.', 'yatra'), 
                    number_format($depositAmount, 2), $deadlineDays)
                : sprintf(__('Your booking is reserved! Full payment of %s is due %d days before your trip.', 'yatra'), 
                    number_format($amount, 2), $deadlineDays),
        ];
    }

    public function verifyPayment(string $transactionId): array
    {
        // Pay later doesn't need verification at checkout
        return ['success' => true, 'status' => 'reserved'];
    }

    /**
     * Get auto-cancel days setting
     */
    public function getAutoCancelDays(): int
    {
        return (int) ($this->config['auto_cancel_days'] ?? 3);
    }

    /**
     * Get reminder days as array
     */
    public function getReminderDays(): array
    {
        $reminderStr = $this->config['reminder_days'] ?? '7,3,1';
        return array_map('intval', array_filter(explode(',', $reminderStr)));
    }
}

