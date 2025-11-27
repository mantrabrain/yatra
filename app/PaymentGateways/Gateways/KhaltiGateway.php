<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways\Gateways;

use Yatra\PaymentGateways\AbstractPaymentGateway;

class KhaltiGateway extends AbstractPaymentGateway
{
    protected string $id = 'khalti';
    protected string $title = 'Khalti';
    protected string $description = 'Accept payments via Khalti (Nepal)';
    protected string $icon = 'khalti.svg';
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
            ],
            [
                'id' => 'secret_key',
                'type' => 'password',
                'label' => __('Secret Key', 'yatra'),
                'description' => __('Your Khalti secret key', 'yatra'),
                'placeholder' => 'test_secret_key_...',
                'default' => '',
            ],
            [
                'id' => 'test_mode',
                'type' => 'checkbox',
                'label' => __('Test Mode', 'yatra'),
                'description' => __('Use Khalti sandbox for testing', 'yatra'),
                'default' => true,
            ],
        ];
    }

    private function getBaseUrl(): string
    {
        return !empty($this->config['test_mode']) 
            ? 'https://a.khalti.com/api/v2/epayment/initiate/' 
            : 'https://khalti.com/api/v2/epayment/initiate/';
    }

    public function processPayment(array $paymentData): array
    {
        $amount = (int) (($paymentData['amount'] ?? 0) * 100); // Convert to paisa
        $bookingId = $paymentData['booking_id'] ?? 0;
        $callbackUrl = rest_url('yatra/v1/payment/callback/khalti');

        $response = $this->makeRequest($this->getBaseUrl(), [
            'method' => 'POST',
            'headers' => [
                'Authorization' => 'Key ' . ($this->config['secret_key'] ?? ''),
                'Content-Type' => 'application/json',
            ],
            'body' => json_encode([
                'return_url' => $callbackUrl . '?booking_id=' . $bookingId,
                'website_url' => home_url(),
                'amount' => $amount,
                'purchase_order_id' => 'booking_' . $bookingId,
                'purchase_order_name' => 'Trip Booking #' . $bookingId,
            ]),
        ]);

        if (!$response['success'] || empty($response['body']['payment_url'])) {
            return ['success' => false, 'error' => $response['body']['detail'] ?? __('Failed to initiate payment', 'yatra')];
        }

        return [
            'success' => true,
            'redirect' => true,
            'payment_url' => $response['body']['payment_url'],
            'pidx' => $response['body']['pidx'],
        ];
    }

    public function verifyPayment(string $transactionId): array
    {
        $verifyUrl = !empty($this->config['test_mode']) 
            ? 'https://a.khalti.com/api/v2/epayment/lookup/' 
            : 'https://khalti.com/api/v2/epayment/lookup/';

        $response = $this->makeRequest($verifyUrl, [
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
        ];
    }
}

