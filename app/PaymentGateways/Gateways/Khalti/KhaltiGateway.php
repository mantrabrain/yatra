<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways\Gateways\Khalti;

use Yatra\Database\Tables\BookingsTable;
use Yatra\PaymentGateways\AbstractPaymentGateway;

class KhaltiGateway extends AbstractPaymentGateway
{
    protected string $id = 'khalti';
    protected string $title = 'Khalti';
    protected string $description = 'Accept payments via Khalti (Nepal)';
    protected string $icon = 'khalti.svg';
    protected string $sandboxUrl = 'https://docs.khalti.com/khalti-epayment/';
    protected array $supports = ['wallet', 'mobile_banking'];

    public function getConfigFields(): array
    {
        return [
            [
                'id' => 'public_key',
                'type' => 'text',
                'label' => __('Public Key', 'yatra'),
                'description' => __('Your Khalti public key', 'yatra'),
                'placeholder' => 'test_public_key_...',
                'default' => '',
                'help_url_test' => 'https://docs.khalti.com/khalti-epayment/',
                'help_url_live' => 'https://admin.khalti.com/',
                'help_text' => __('Get your API keys from Khalti Merchant Dashboard', 'yatra'),
            ],
            [
                'id' => 'secret_key',
                'type' => 'password',
                'label' => __('Secret Key', 'yatra'),
                'description' => __('Your Khalti secret key', 'yatra'),
                'placeholder' => 'test_secret_key_...',
                'default' => '',
                'help_url_test' => 'https://docs.khalti.com/khalti-epayment/',
                'help_url_live' => 'https://admin.khalti.com/',
                'help_text' => __('Get your API keys from Khalti Merchant Dashboard', 'yatra'),
            ],
        ];
    }

    private function getBaseUrl(): string
    {
        return \Yatra\Services\SettingsService::isPaymentTestMode()
            ? 'https://a.khalti.com/api/v2/epayment/initiate/' 
            : 'https://khalti.com/api/v2/epayment/initiate/';
    }

    public function processPayment(array $paymentData): array
    {
        $amount = (int) (($paymentData['amount'] ?? 0) * 100); // Convert to paisa
        $bookingId = $paymentData['booking_id'] ?? 0;
        $reference = $paymentData['reference'] ?? $bookingId;
        $returnUrl = $paymentData['return_url'] ?? home_url('/booking-confirmation/' . $reference . '/');

        $response = $this->makeRequest($this->getBaseUrl(), [
            'method' => 'POST',
            'headers' => [
                'Authorization' => 'Key ' . ($this->config['secret_key'] ?? ''),
                'Content-Type' => 'application/json',
            ],
            'body' => json_encode([
                'return_url' => add_query_arg(['khalti' => 'success'], $returnUrl),
                'website_url' => home_url(),
                'amount' => $amount,
                'purchase_order_id' => 'booking_' . $bookingId,
                'purchase_order_name' => $paymentData['description'] ?? ('Trip Booking #' . $bookingId),
            ]),
        ]);

        if (!$response['success'] || empty($response['body']['payment_url'])) {
            $this->log('Khalti payment initiation failed', ['response' => $response]);
            return ['success' => false, 'error' => $response['body']['detail'] ?? __('Failed to initiate payment', 'yatra')];
        }
        
        $this->log('Khalti payment initiated', [
            'booking_id' => $bookingId,
            'pidx' => $response['body']['pidx'],
        ]);

        return [
            'success' => true,
            'redirect_url' => $response['body']['payment_url'],
            'transaction_id' => $response['body']['pidx'],
        ];
    }

    private function getVerifyUrl(): string
    {
        return \Yatra\Services\SettingsService::isPaymentTestMode()
            ? 'https://a.khalti.com/api/v2/epayment/lookup/' 
            : 'https://khalti.com/api/v2/epayment/lookup/';
    }

    public function verifyPayment(string $transactionId): array
    {
        $response = $this->makeRequest($this->getVerifyUrl(), [
            'method' => 'POST',
            'headers' => [
                'Authorization' => 'Key ' . ($this->config['secret_key'] ?? ''),
                'Content-Type' => 'application/json',
            ],
            'body' => json_encode(['pidx' => $transactionId]),
        ]);

        return [
            'success' => ($response['body']['status'] ?? '') === 'Completed',
            'status' => $response['body']['status'] ?? 'unknown',
            'amount' => (($response['body']['total_amount'] ?? 0) / 100),
            'transaction_id' => $response['body']['transaction_id'] ?? $transactionId,
        ];
    }
    
    /**
     * Check if this gateway should handle the return request
     */
    public function shouldHandleReturn(array $params): bool
    {
        return isset($params['khalti']) && $params['khalti'] === 'success' && !empty($params['pidx']);
    }
    
    /**
     * Handle payment return from Khalti
     */
    public function handlePaymentReturn($booking, $bookingRepository): void
    {
        $pidx = sanitize_text_field($_GET['pidx'] ?? '');
        $transactionId = sanitize_text_field($_GET['transaction_id'] ?? '');
        $amount = sanitize_text_field($_GET['amount'] ?? '');
        
        if (empty($pidx)) {
            return;
        }
        
        // Verify payment with Khalti
        $result = $this->verifyPayment($pidx);
        
        if ($result['success'] && $result['status'] === 'Completed') {
            $this->completePayment($booking, $bookingRepository, $result['transaction_id'] ?? $pidx, [
                'amount' => $result['amount'] ?? ((float) $amount / 100),
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
        $payments_table = $wpdb->prefix . 'yatra_payments';
        $wpdb->insert(
            $payments_table,
            [
                'booking_id' => $bookingId,
                'amount' => $amount,
                'currency' => $currency,
                'payment_gateway' => 'khalti',
                'transaction_id' => $transactionId,
                'status' => 'completed',
                'created_at' => current_time('mysql'),
            ],
            ['%d', '%f', '%s', '%s', '%s', '%s', '%s']
        );
        
        $this->log('Khalti payment completed', [
            'booking_id' => $bookingId,
            'transaction_id' => $transactionId,
            'amount' => $amount,
        ]);
        
        do_action('yatra_payment_completed', [
            'booking_id' => $bookingId,
            'transaction_id' => $transactionId,
            'amount' => $amount,
            'currency' => $currency,
            'gateway' => 'khalti',
        ]);
    }
}

