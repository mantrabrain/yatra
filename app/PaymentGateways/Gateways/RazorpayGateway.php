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
    protected array $supports = ['credit_card', 'debit_card', 'upi', 'netbanking', 'wallet', 'recurring', 'tokenization', 'scheduled_payments'];

    private string $apiBase = 'https://api.razorpay.com/v1';

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
            [
                'id' => 'save_cards',
                'type' => 'checkbox',
                'label' => __('Save Cards for Recurring', 'yatra'),
                'description' => __('Allow customers to save cards for future payments (requires Razorpay Tokens)', 'yatra'),
                'default' => true,
            ],
        ];
    }

    private function getHeaders(): array
    {
        return [
            'Authorization' => 'Basic ' . base64_encode(($this->config['key_id'] ?? '') . ':' . ($this->config['key_secret'] ?? '')),
            'Content-Type' => 'application/json',
        ];
    }

    public function processPayment(array $paymentData): array
    {
        $amount = (int) (($paymentData['amount'] ?? 0) * 100);
        $currency = $paymentData['currency'] ?? 'INR';
        $bookingId = $paymentData['booking_id'] ?? 0;
        $customerEmail = $paymentData['customer_email'] ?? '';
        $customerName = $paymentData['customer_name'] ?? '';
        $saveCard = !empty($paymentData['save_card']) && !empty($this->config['save_cards']);

        $orderData = [
            'amount' => $amount,
            'currency' => $currency,
            'receipt' => 'booking_' . $bookingId,
            'notes' => [
                'booking_id' => $bookingId,
                'customer_email' => $customerEmail,
            ],
        ];

        $response = $this->makeRequest("{$this->apiBase}/orders", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
            'body' => wp_json_encode($orderData),
        ]);

        if (!$response['success'] || empty($response['body']['id'])) {
            return [
                'success' => false,
                'error' => $response['body']['error']['description'] ?? __('Failed to create order', 'yatra'),
            ];
        }

        $customerId = null;
        if ($saveCard && $customerEmail) {
            $customerResult = $this->createCustomer([
                'email' => $customerEmail,
                'name' => $customerName,
            ]);
            if ($customerResult['success']) {
                $customerId = $customerResult['customer_id'];
            }
        }

        return [
            'success' => true,
            'order_id' => $response['body']['id'],
            'key_id' => $this->config['key_id'] ?? '',
            'amount' => $amount,
            'currency' => $currency,
            'customer_id' => $customerId,
            'save_card' => $saveCard,
        ];
    }

    /**
     * Create Razorpay customer
     */
    public function createCustomer(array $customerData): array
    {
        $email = $customerData['email'] ?? '';
        
        if (empty($email)) {
            return ['success' => false, 'error' => __('Email is required', 'yatra')];
        }

        // Check if customer exists
        $existingResponse = $this->makeRequest("{$this->apiBase}/customers", [
            'method' => 'GET',
            'headers' => $this->getHeaders(),
        ]);

        if ($existingResponse['success'] && !empty($existingResponse['body']['items'])) {
            foreach ($existingResponse['body']['items'] as $customer) {
                if (($customer['email'] ?? '') === $email) {
                    return [
                        'success' => true,
                        'customer_id' => $customer['id'],
                        'existing' => true,
                    ];
                }
            }
        }

        // Create new customer
        $response = $this->makeRequest("{$this->apiBase}/customers", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
            'body' => wp_json_encode([
                'name' => $customerData['name'] ?? '',
                'email' => $email,
                'contact' => $customerData['phone'] ?? '',
                'fail_existing' => 0, // Don't fail if customer exists
            ]),
        ]);

        if (!$response['success'] || empty($response['body']['id'])) {
            return [
                'success' => false,
                'error' => $response['body']['error']['description'] ?? __('Failed to create customer', 'yatra'),
            ];
        }

        return [
            'success' => true,
            'customer_id' => $response['body']['id'],
        ];
    }

    /**
     * Save token after payment (called after successful payment with token)
     */
    public function savePaymentMethod(string $customerId, array $paymentMethodData): array
    {
        $token = $paymentMethodData['token'] ?? '';
        
        if (empty($token)) {
            return ['success' => false, 'error' => __('Token is required', 'yatra')];
        }

        // Fetch token details
        $response = $this->makeRequest("{$this->apiBase}/tokens/{$token}", [
            'method' => 'GET',
            'headers' => $this->getHeaders(),
        ]);

        if (!$response['success'] || empty($response['body']['id'])) {
            return [
                'success' => false,
                'error' => $response['body']['error']['description'] ?? __('Failed to fetch token details', 'yatra'),
            ];
        }

        $tokenData = $response['body'];
        $card = $tokenData['card'] ?? [];

        return [
            'success' => true,
            'payment_method_id' => $tokenData['id'],
            'card_brand' => $card['network'] ?? $card['issuer'] ?? 'unknown',
            'card_last4' => $card['last4'] ?? '',
            'card_exp_month' => null,
            'card_exp_year' => null,
            'type' => $tokenData['method'] ?? 'card',
        ];
    }

    /**
     * Charge using saved token (recurring payment)
     */
    public function chargePaymentMethod(string $customerId, string $paymentMethodId, array $paymentData): array
    {
        $amount = (int) (($paymentData['amount'] ?? 0) * 100);
        $currency = $paymentData['currency'] ?? 'INR';
        $bookingId = $paymentData['booking_id'] ?? 0;

        // Create order first
        $orderResponse = $this->makeRequest("{$this->apiBase}/orders", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
            'body' => wp_json_encode([
                'amount' => $amount,
                'currency' => $currency,
                'receipt' => 'recurring_' . $bookingId . '_' . time(),
                'notes' => [
                    'booking_id' => $bookingId,
                    'payment_type' => 'recurring',
                    'scheduled_payment_id' => $paymentData['metadata']['scheduled_payment_id'] ?? null,
                ],
            ]),
        ]);

        if (!$orderResponse['success'] || empty($orderResponse['body']['id'])) {
            return [
                'success' => false,
                'error' => $orderResponse['body']['error']['description'] ?? __('Failed to create order', 'yatra'),
            ];
        }

        $orderId = $orderResponse['body']['id'];

        // Create recurring payment
        $paymentResponse = $this->makeRequest("{$this->apiBase}/payments/create/recurring", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
            'body' => wp_json_encode([
                'email' => $paymentData['customer_email'] ?? '',
                'contact' => $paymentData['customer_phone'] ?? '',
                'amount' => $amount,
                'currency' => $currency,
                'order_id' => $orderId,
                'customer_id' => $customerId,
                'token' => $paymentMethodId,
                'recurring' => '1',
                'description' => $paymentData['description'] ?? 'Scheduled Payment',
                'notes' => [
                    'booking_id' => $bookingId,
                ],
            ]),
        ]);

        if (!$paymentResponse['success']) {
            return [
                'success' => false,
                'error' => $paymentResponse['body']['error']['description'] ?? __('Payment failed', 'yatra'),
            ];
        }

        $payment = $paymentResponse['body'];
        
        if (($payment['status'] ?? '') === 'captured') {
            return [
                'success' => true,
                'transaction_id' => $payment['id'],
                'order_id' => $orderId,
                'amount' => $amount / 100,
                'currency' => $currency,
                'status' => 'completed',
            ];
        }

        // If payment requires capture
        if (($payment['status'] ?? '') === 'authorized') {
            $captureResponse = $this->makeRequest("{$this->apiBase}/payments/{$payment['id']}/capture", [
                'method' => 'POST',
                'headers' => $this->getHeaders(),
                'body' => wp_json_encode(['amount' => $amount]),
            ]);

            if ($captureResponse['success'] && ($captureResponse['body']['status'] ?? '') === 'captured') {
                return [
                    'success' => true,
                    'transaction_id' => $payment['id'],
                    'order_id' => $orderId,
                    'amount' => $amount / 100,
                    'currency' => $currency,
                    'status' => 'completed',
                ];
            }
        }

        return [
            'success' => false,
            'error' => __('Payment was not captured', 'yatra'),
            'status' => $payment['status'] ?? 'unknown',
        ];
    }

    /**
     * Get customer's saved tokens
     */
    public function getPaymentMethods(string $customerId): array
    {
        $response = $this->makeRequest("{$this->apiBase}/customers/{$customerId}/tokens", [
            'method' => 'GET',
            'headers' => $this->getHeaders(),
        ]);

        if (!$response['success']) {
            return [];
        }

        $methods = [];
        foreach ($response['body']['items'] ?? [] as $token) {
            $card = $token['card'] ?? [];
            $methods[] = [
                'id' => $token['id'],
                'type' => $token['method'] ?? 'card',
                'brand' => $card['network'] ?? 'unknown',
                'last4' => $card['last4'] ?? '',
                'exp_month' => null,
                'exp_year' => null,
            ];
        }

        return $methods;
    }

    /**
     * Delete saved token
     */
    public function deletePaymentMethod(string $paymentMethodId): array
    {
        $response = $this->makeRequest("{$this->apiBase}/tokens/{$paymentMethodId}", [
            'method' => 'DELETE',
            'headers' => $this->getHeaders(),
        ]);

        return [
            'success' => $response['success'],
            'error' => $response['body']['error']['description'] ?? null,
        ];
    }

    public function verifyPayment(string $transactionId): array
    {
        $response = $this->makeRequest("{$this->apiBase}/payments/{$transactionId}", [
            'method' => 'GET',
            'headers' => $this->getHeaders(),
        ]);

        if (!$response['success']) {
            return ['success' => false, 'error' => 'Verification failed'];
        }

        $payment = $response['body'];
        $tokenId = null;

        // Check for token if card was saved
        if (!empty($payment['token_id'])) {
            $tokenId = $payment['token_id'];
        }

        return [
            'success' => ($payment['status'] ?? '') === 'captured',
            'status' => $payment['status'] ?? 'unknown',
            'amount' => ($payment['amount'] ?? 0) / 100,
            'currency' => strtoupper($payment['currency'] ?? 'INR'),
            'customer_id' => $payment['customer_id'] ?? null,
            'token_id' => $tokenId,
        ];
    }

    /**
     * Process refund
     */
    public function processRefund(string $transactionId, float $amount): array
    {
        $response = $this->makeRequest("{$this->apiBase}/payments/{$transactionId}/refund", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
            'body' => wp_json_encode([
                'amount' => (int) ($amount * 100),
            ]),
        ]);

        return [
            'success' => $response['success'],
            'refund_id' => $response['body']['id'] ?? null,
            'error' => $response['body']['error']['description'] ?? null,
        ];
    }

    /**
     * Handle Razorpay webhook
     */
    public function handleWebhook(array $data): array
    {
        $payload = $data['raw_body'] ?? '';
        $event = json_decode($payload, true);
        $eventType = $event['event'] ?? '';

        switch ($eventType) {
            case 'payment.captured':
                do_action('yatra_razorpay_payment_captured', $event['payload']['payment']['entity'] ?? []);
                break;
                
            case 'payment.failed':
                do_action('yatra_razorpay_payment_failed', $event['payload']['payment']['entity'] ?? []);
                break;
                
            case 'refund.created':
                do_action('yatra_razorpay_refund_created', $event['payload']['refund']['entity'] ?? []);
                break;
                
            case 'token.confirmed':
                do_action('yatra_razorpay_token_confirmed', $event['payload']['token']['entity'] ?? []);
                break;
        }

        return ['success' => true, 'event_type' => $eventType];
    }
}

