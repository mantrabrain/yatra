<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways\Gateways;

use Yatra\PaymentGateways\AbstractPaymentGateway;

class RazorpayGateway extends AbstractPaymentGateway
{
    protected string $id = 'razorpay';
    protected string $title = 'Razorpay';
    protected string $description = 'Accept payments via Razorpay (India)';
    protected string $icon = 'razorpay.svg';
    protected array $supports = ['credit_card', 'debit_card', 'upi', 'netbanking', 'wallet'];

    public function getConfigFields(): array
    {
        return [
            [
                'id' => 'key_id',
                'type' => 'text',
                'label' => __('Key ID', 'yatra'),
                'description' => __('Your Razorpay key ID', 'yatra'),
                'placeholder' => 'rzp_test_...',
                'default' => '',
            ],
            [
                'id' => 'key_secret',
                'type' => 'password',
                'label' => __('Key Secret', 'yatra'),
                'description' => __('Your Razorpay key secret', 'yatra'),
                'placeholder' => '...',
                'default' => '',
            ],
            [
                'id' => 'test_mode',
                'type' => 'checkbox',
                'label' => __('Test Mode', 'yatra'),
                'description' => __('Use Razorpay test keys', 'yatra'),
                'default' => true,
            ],
        ];
    }

    public function processPayment(array $paymentData): array
    {
        $amount = (int) (($paymentData['amount'] ?? 0) * 100);
        $currency = $paymentData['currency'] ?? 'INR';
        $bookingId = $paymentData['booking_id'] ?? 0;

        $response = $this->makeRequest('https://api.razorpay.com/v1/orders', [
            'method' => 'POST',
            'headers' => [
                'Authorization' => 'Basic ' . base64_encode(($this->config['key_id'] ?? '') . ':' . ($this->config['key_secret'] ?? '')),
                'Content-Type' => 'application/json',
            ],
            'body' => json_encode([
                'amount' => $amount,
                'currency' => $currency,
                'receipt' => 'booking_' . $bookingId,
                'notes' => ['booking_id' => $bookingId],
            ]),
        ]);

        if (!$response['success'] || empty($response['body']['id'])) {
            return ['success' => false, 'error' => $response['body']['error']['description'] ?? __('Failed to create order', 'yatra')];
        }

        return [
            'success' => true,
            'order_id' => $response['body']['id'],
            'key_id' => $this->config['key_id'] ?? '',
            'amount' => $amount,
            'currency' => $currency,
        ];
    }

    public function verifyPayment(string $transactionId): array
    {
        $response = $this->makeRequest("https://api.razorpay.com/v1/payments/{$transactionId}", [
            'method' => 'GET',
            'headers' => [
                'Authorization' => 'Basic ' . base64_encode(($this->config['key_id'] ?? '') . ':' . ($this->config['key_secret'] ?? '')),
            ],
        ]);

        return [
            'success' => ($response['body']['status'] ?? '') === 'captured',
            'status' => $response['body']['status'] ?? 'unknown',
            'amount' => ($response['body']['amount'] ?? 0) / 100,
        ];
    }
}

