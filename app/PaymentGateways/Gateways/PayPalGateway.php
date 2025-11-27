<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways\Gateways;

use Yatra\PaymentGateways\AbstractPaymentGateway;

class PayPalGateway extends AbstractPaymentGateway
{
    protected string $id = 'paypal';
    protected string $title = 'PayPal';
    protected string $description = 'Accept PayPal and credit card payments';
    protected string $icon = 'paypal.svg';
    protected array $supports = ['paypal', 'credit_card', 'refunds'];

    public function getConfigFields(): array
    {
        return [
            [
                'id' => 'client_id',
                'type' => 'text',
                'label' => __('Client ID', 'yatra'),
                'description' => __('Your PayPal application client ID', 'yatra'),
                'placeholder' => 'AeA1QIZXiflr1...',
                'default' => '',
            ],
            [
                'id' => 'client_secret',
                'type' => 'password',
                'label' => __('Client Secret', 'yatra'),
                'description' => __('Your PayPal application client secret', 'yatra'),
                'placeholder' => 'EC...',
                'default' => '',
            ],
            [
                'id' => 'sandbox',
                'type' => 'checkbox',
                'label' => __('Sandbox Mode', 'yatra'),
                'description' => __('Use PayPal sandbox for testing', 'yatra'),
                'default' => true,
            ],
        ];
    }

    private function getBaseUrl(): string
    {
        return !empty($this->config['sandbox']) 
            ? 'https://api-m.sandbox.paypal.com' 
            : 'https://api-m.paypal.com';
    }

    private function getAccessToken(): ?string
    {
        $response = $this->makeRequest($this->getBaseUrl() . '/v1/oauth2/token', [
            'method' => 'POST',
            'headers' => [
                'Authorization' => 'Basic ' . base64_encode(($this->config['client_id'] ?? '') . ':' . ($this->config['client_secret'] ?? '')),
                'Content-Type' => 'application/x-www-form-urlencoded',
            ],
            'body' => 'grant_type=client_credentials',
        ]);

        return $response['body']['access_token'] ?? null;
    }

    public function processPayment(array $paymentData): array
    {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return ['success' => false, 'error' => __('Failed to authenticate with PayPal', 'yatra')];
        }

        $amount = number_format((float) ($paymentData['amount'] ?? 0), 2, '.', '');
        $currency = $paymentData['currency'] ?? 'USD';
        $bookingId = $paymentData['booking_id'] ?? 0;
        $returnUrl = $paymentData['return_url'] ?? home_url('/booking-success/');

        $response = $this->makeRequest($this->getBaseUrl() . '/v2/checkout/orders', [
            'method' => 'POST',
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'application/json',
            ],
            'body' => json_encode([
                'intent' => 'CAPTURE',
                'purchase_units' => [[
                    'custom_id' => (string) $bookingId,
                    'amount' => [
                        'currency_code' => $currency,
                        'value' => $amount,
                    ],
                ]],
                'application_context' => [
                    'return_url' => $returnUrl . '?success=true',
                    'cancel_url' => $returnUrl . '?cancelled=true',
                ],
            ]),
        ]);

        if (!$response['success'] || empty($response['body']['id'])) {
            return ['success' => false, 'error' => __('Failed to create PayPal order', 'yatra')];
        }

        return [
            'success' => true,
            'order_id' => $response['body']['id'],
            'client_id' => $this->config['client_id'] ?? '',
            'sandbox' => !empty($this->config['sandbox']),
        ];
    }

    public function verifyPayment(string $transactionId): array
    {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return ['success' => false, 'error' => 'Authentication failed'];
        }

        // Capture the order
        $response = $this->makeRequest($this->getBaseUrl() . "/v2/checkout/orders/{$transactionId}/capture", [
            'method' => 'POST',
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'application/json',
            ],
        ]);

        $status = $response['body']['status'] ?? '';
        
        return [
            'success' => $status === 'COMPLETED',
            'status' => $status,
            'capture_id' => $response['body']['purchase_units'][0]['payments']['captures'][0]['id'] ?? null,
        ];
    }

    public function processRefund(string $transactionId, float $amount): array
    {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return ['success' => false, 'error' => 'Authentication failed'];
        }

        $response = $this->makeRequest($this->getBaseUrl() . "/v2/payments/captures/{$transactionId}/refund", [
            'method' => 'POST',
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'application/json',
            ],
            'body' => json_encode([
                'amount' => [
                    'value' => number_format($amount, 2, '.', ''),
                    'currency_code' => 'USD',
                ],
            ]),
        ]);

        return [
            'success' => $response['success'],
            'refund_id' => $response['body']['id'] ?? null,
        ];
    }
}

