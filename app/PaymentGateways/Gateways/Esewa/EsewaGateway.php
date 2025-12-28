<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways\Gateways\Esewa;

use Yatra\Database\Tables\BookingsTable;
use Yatra\Database\Tables\BookingPaymentsTable;
use Yatra\PaymentGateways\AbstractPaymentGateway;

class EsewaGateway extends AbstractPaymentGateway
{
    protected string $id = 'esewa';
    protected string $title = 'eSewa';
    protected string $description = 'Accept payments via eSewa (Nepal)';
    protected string $icon = 'esewa.svg';
    protected string $sandboxUrl = 'https://developer.esewa.com.np/pages/Epay';
    protected array $supports = ['wallet'];

    public function getConfigFields(): array
    {
        return [
            [
                'id' => 'merchant_code',
                'type' => 'text',
                'label' => __('Merchant Code', 'yatra'),
                'description' => __('Your eSewa merchant code', 'yatra'),
                'placeholder' => 'EPAYTEST',
                'default' => '',
                'help_url_test' => 'https://developer.esewa.com.np/pages/Epay',
                'help_url_live' => 'https://esewa.com.np/merchant',
                'help_text' => __('Get your Merchant Code from eSewa Merchant Portal', 'yatra'),
            ],
            [
                'id' => 'secret_key',
                'type' => 'password',
                'label' => __('Secret Key', 'yatra'),
                'description' => __('Your eSewa secret key for verification', 'yatra'),
                'default' => '',
                'help_url_test' => 'https://developer.esewa.com.np/pages/Epay',
                'help_url_live' => 'https://esewa.com.np/merchant',
                'help_text' => __('Get your Secret Key from eSewa Merchant Portal', 'yatra'),
            ],
        ];
    }

    private function getBaseUrl(): string
    {
        return \Yatra\Services\SettingsService::isPaymentTestMode()
            ? 'https://uat.esewa.com.np/epay/main' 
            : 'https://esewa.com.np/epay/main';
    }
    
    private function getVerifyUrl(): string
    {
        return \Yatra\Services\SettingsService::isPaymentTestMode()
            ? 'https://uat.esewa.com.np/epay/transrec' 
            : 'https://esewa.com.np/epay/transrec';
    }

    public function processPayment(array $paymentData): array
    {
        $amount = (float) ($paymentData['amount'] ?? 0);
        $bookingId = $paymentData['booking_id'] ?? 0;
        $reference = $paymentData['reference'] ?? $bookingId;
        $returnUrl = $paymentData['return_url'] ?? home_url('/booking-confirmation/' . $reference . '/');

        // Build eSewa payment URL with form data
        $params = [
            'amt' => $amount,
            'pdc' => 0,
            'psc' => 0,
            'txAmt' => 0,
            'tAmt' => $amount,
            'pid' => 'booking_' . $bookingId,
            'scd' => $this->config['merchant_code'] ?? 'EPAYTEST',
            'su' => add_query_arg(['esewa' => 'success', 'oid' => 'booking_' . $bookingId, 'amt' => $amount], $returnUrl),
            'fu' => add_query_arg(['esewa' => 'failed'], $returnUrl),
        ];
        
        $redirectUrl = $this->getBaseUrl() . '?' . http_build_query($params);
        
        $this->log('eSewa payment initiated', [
            'booking_id' => $bookingId,
            'amount' => $amount,
        ]);

        return [
            'success' => true,
            'redirect_url' => $redirectUrl,
            'transaction_id' => 'booking_' . $bookingId,
        ];
    }

    public function verifyPayment(string $transactionId): array
    {
        $amount = $_GET['amt'] ?? 0;
        
        $response = $this->makeRequest($this->getVerifyUrl(), [
            'method' => 'POST',
            'headers' => ['Content-Type' => 'application/x-www-form-urlencoded'],
            'body' => http_build_query([
                'amt' => $amount,
                'scd' => $this->config['merchant_code'] ?? 'EPAYTEST',
                'pid' => $transactionId,
                'rid' => $_GET['refId'] ?? '',
            ]),
        ]);
        
        // eSewa returns XML response
        $isSuccess = strpos($response['body'] ?? '', '<response_code>Success</response_code>') !== false;
        
        return [
            'success' => $isSuccess,
            'status' => $isSuccess ? 'completed' : 'failed',
            'amount' => (float) $amount,
        ];
    }
    
    /**
     * Check if this gateway should handle the return request
     */
    public function shouldHandleReturn(array $params): bool
    {
        return isset($params['esewa']) && $params['esewa'] === 'success';
    }
    
    /**
     * Handle payment return from eSewa
     */
    public function handlePaymentReturn($booking, $bookingRepository): void
    {
        $oid = sanitize_text_field($_GET['oid'] ?? '');
        $refId = sanitize_text_field($_GET['refId'] ?? '');
        $amount = sanitize_text_field($_GET['amt'] ?? '');
        
        if (empty($oid) || empty($refId)) {
            return;
        }
        
        // Verify payment with eSewa
        $result = $this->verifyPayment($oid);
        
        if ($result['success']) {
            $this->completePayment($booking, $bookingRepository, $refId, [
                'amount' => (float) $amount,
            ]);
        }
    }
    
    /**
     * Complete the payment and update booking status
     */
    private function completePayment($booking, $bookingRepository, string $transactionId, array $paymentData = []): void
    {
        global $wpdb;
        
        $bookingId = (int) $booking->id;
        $amountDue = (float) ($booking->amount_due ?? ($booking->total_amount - $booking->amount_paid));
        $amount = $paymentData['amount'] ?? $amountDue;
        $currency = $booking->currency ?? 'NPR';
        
        // Update booking payment status
        $bookings_table = BookingsTable::getTableName();
        $wpdb->update(
            $bookings_table,
            [
                'payment_status' => 'paid',
                'amount_paid' => $booking->total_amount,
                'amount_due' => 0,
                'status' => 'confirmed',
                'confirmed_at' => current_time('mysql'),
            ],
            ['id' => $bookingId],
            ['%s', '%f', '%f', '%s', '%s'],
            ['%d']
        );
        
        // Record the payment
        $payments_table = BookingPaymentsTable::getTableName();
        $wpdb->insert(
            $payments_table,
            [
                'booking_id' => $bookingId,
                'amount' => $amount,
                'currency' => $currency,
                'payment_gateway' => 'esewa',
                'transaction_id' => $transactionId,
                'status' => 'completed',
                'created_at' => current_time('mysql'),
            ],
            ['%d', '%f', '%s', '%s', '%s', '%s', '%s']
        );
        
        $this->log('eSewa payment completed', [
            'booking_id' => $bookingId,
            'transaction_id' => $transactionId,
            'amount' => $amount,
        ]);
        
        do_action('yatra_payment_completed', [
            'booking_id' => $bookingId,
            'transaction_id' => $transactionId,
            'amount' => $amount,
            'currency' => $currency,
            'gateway' => 'esewa',
        ]);
    }
}

