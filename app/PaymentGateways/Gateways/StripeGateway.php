<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways\Gateways;

use Yatra\PaymentGateways\AbstractPaymentGateway;

class StripeGateway extends AbstractPaymentGateway
{
    protected string $id = 'stripe';
    protected string $title = 'Stripe';
    protected string $description = 'Accept credit and debit cards via Stripe';
    protected string $icon = 'stripe.svg';
    protected array $supports = ['credit_card', 'debit_card', 'refunds', 'recurring'];

    public function getConfigFields(): array
    {
        return [
            [
                'id' => 'api_key',
                'type' => 'text',
                'label' => __('Publishable Key', 'yatra'),
                'description' => __('Your Stripe publishable API key', 'yatra'),
                'placeholder' => 'pk_test_...',
                'default' => '',
            ],
            [
                'id' => 'api_secret',
                'type' => 'password',
                'label' => __('Secret Key', 'yatra'),
                'description' => __('Your Stripe secret API key (keep this secure)', 'yatra'),
                'placeholder' => 'sk_test_...',
                'default' => '',
            ],
            [
                'id' => 'webhook_secret',
                'type' => 'password',
                'label' => __('Webhook Secret', 'yatra'),
                'description' => __('Stripe webhook signing secret for payment verification', 'yatra'),
                'placeholder' => 'whsec_...',
                'default' => '',
            ],
            [
                'id' => 'test_mode',
                'type' => 'checkbox',
                'label' => __('Test Mode', 'yatra'),
                'description' => __('Use test API keys for development', 'yatra'),
                'default' => true,
            ],
        ];
    }

    public function processPayment(array $paymentData): array
    {
        $amount = (int) (($paymentData['amount'] ?? 0) * 100); // Convert to cents
        $currency = strtolower($paymentData['currency'] ?? 'usd');
        $bookingId = $paymentData['booking_id'] ?? 0;
        $customerEmail = $paymentData['customer_email'] ?? '';

        $response = $this->makeRequest('https://api.stripe.com/v1/payment_intents', [
            'method' => 'POST',
            'headers' => [
                'Authorization' => 'Bearer ' . ($this->config['api_secret'] ?? ''),
                'Content-Type' => 'application/x-www-form-urlencoded',
            ],
            'body' => [
                'amount' => $amount,
                'currency' => $currency,
                'metadata[booking_id]' => $bookingId,
                'receipt_email' => $customerEmail,
                'automatic_payment_methods[enabled]' => 'true',
            ],
        ]);

        if (!$response['success']) {
            return [
                'success' => false,
                'error' => $response['body']['error']['message'] ?? __('Failed to create payment intent', 'yatra'),
            ];
        }

        return [
            'success' => true,
            'client_secret' => $response['body']['client_secret'],
            'payment_intent_id' => $response['body']['id'],
            'publishable_key' => $this->config['api_key'] ?? '',
        ];
    }

    public function verifyPayment(string $transactionId): array
    {
        $response = $this->makeRequest("https://api.stripe.com/v1/payment_intents/{$transactionId}", [
            'method' => 'GET',
            'headers' => [
                'Authorization' => 'Bearer ' . ($this->config['api_secret'] ?? ''),
            ],
        ]);

        if (!$response['success']) {
            return ['success' => false, 'error' => 'Verification failed'];
        }

        return [
            'success' => $response['body']['status'] === 'succeeded',
            'status' => $response['body']['status'],
            'amount' => ($response['body']['amount'] ?? 0) / 100,
            'currency' => strtoupper($response['body']['currency'] ?? 'USD'),
        ];
    }

    public function processRefund(string $transactionId, float $amount): array
    {
        $response = $this->makeRequest('https://api.stripe.com/v1/refunds', [
            'method' => 'POST',
            'headers' => [
                'Authorization' => 'Bearer ' . ($this->config['api_secret'] ?? ''),
                'Content-Type' => 'application/x-www-form-urlencoded',
            ],
            'body' => [
                'payment_intent' => $transactionId,
                'amount' => (int) ($amount * 100),
            ],
        ]);

        return [
            'success' => $response['success'],
            'refund_id' => $response['body']['id'] ?? null,
            'error' => $response['body']['error']['message'] ?? null,
        ];
    }
}

