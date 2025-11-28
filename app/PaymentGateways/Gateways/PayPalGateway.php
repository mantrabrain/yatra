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
    protected array $supports = ['paypal', 'credit_card', 'refunds', 'recurring', 'tokenization', 'scheduled_payments'];

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
            [
                'id' => 'save_payment_methods',
                'type' => 'checkbox',
                'label' => __('Save Payment Methods', 'yatra'),
                'description' => __('Allow saving PayPal accounts for future payments', 'yatra'),
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

    private function getHeaders(): array
    {
        $accessToken = $this->getAccessToken();
        return [
            'Authorization' => 'Bearer ' . $accessToken,
            'Content-Type' => 'application/json',
        ];
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
        $savePayment = !empty($paymentData['save_payment']) && !empty($this->config['save_payment_methods']);

        $orderData = [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'custom_id' => (string) $bookingId,
                'amount' => [
                    'currency_code' => $currency,
                    'value' => $amount,
                ],
            ]],
            'application_context' => [
                'return_url' => $returnUrl . '?success=true&booking_id=' . $bookingId,
                'cancel_url' => $returnUrl . '?cancelled=true&booking_id=' . $bookingId,
                'user_action' => 'PAY_NOW',
            ],
        ];

        // Enable vault for saving payment method
        if ($savePayment) {
            $orderData['payment_source'] = [
                'paypal' => [
                    'experience_context' => [
                        'payment_method_preference' => 'IMMEDIATE_PAYMENT_REQUIRED',
                        'return_url' => $returnUrl . '?success=true&booking_id=' . $bookingId,
                        'cancel_url' => $returnUrl . '?cancelled=true&booking_id=' . $bookingId,
                    ],
                    'attributes' => [
                        'vault' => [
                            'store_in_vault' => 'ON_SUCCESS',
                            'usage_type' => 'MERCHANT',
                        ],
                    ],
                ],
            ];
        }

        $response = $this->makeRequest($this->getBaseUrl() . '/v2/checkout/orders', [
            'method' => 'POST',
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'application/json',
            ],
            'body' => wp_json_encode($orderData),
        ]);

        if (!$response['success'] || empty($response['body']['id'])) {
            return ['success' => false, 'error' => __('Failed to create PayPal order', 'yatra')];
        }

        // Get approval URL
        $approvalUrl = null;
        foreach ($response['body']['links'] ?? [] as $link) {
            if ($link['rel'] === 'approve') {
                $approvalUrl = $link['href'];
                break;
            }
        }

        return [
            'success' => true,
            'order_id' => $response['body']['id'],
            'approval_url' => $approvalUrl,
            'client_id' => $this->config['client_id'] ?? '',
            'sandbox' => !empty($this->config['sandbox']),
        ];
    }

    /**
     * Create PayPal customer (for vault)
     */
    public function createCustomer(array $customerData): array
    {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return ['success' => false, 'error' => __('Failed to authenticate with PayPal', 'yatra')];
        }

        // PayPal uses vault tokens associated with merchant, not traditional customers
        // Generate a unique customer reference
        $customerId = 'yatra_' . md5($customerData['email'] . time());

        return [
            'success' => true,
            'customer_id' => $customerId,
        ];
    }

    /**
     * Save payment token after successful vaulted payment
     */
    public function savePaymentMethod(string $customerId, array $paymentMethodData): array
    {
        // PayPal vault token is returned after successful order capture
        $vaultId = $paymentMethodData['vault_id'] ?? '';
        
        if (empty($vaultId)) {
            return [
                'success' => false,
                'error' => __('Vault ID is required', 'yatra'),
            ];
        }

        return [
            'success' => true,
            'payment_method_id' => $vaultId,
            'type' => 'paypal',
            'card_brand' => 'paypal',
            'card_last4' => substr($paymentMethodData['email'] ?? '', -4),
        ];
    }

    /**
     * Charge saved PayPal payment token
     */
    public function chargePaymentMethod(string $customerId, string $paymentMethodId, array $paymentData): array
    {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return ['success' => false, 'error' => __('Failed to authenticate with PayPal', 'yatra')];
        }

        $amount = number_format((float) ($paymentData['amount'] ?? 0), 2, '.', '');
        $currency = $paymentData['currency'] ?? 'USD';
        $bookingId = $paymentData['booking_id'] ?? 0;

        // Create order using vaulted payment source
        $orderData = [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'custom_id' => (string) $bookingId,
                'description' => $paymentData['description'] ?? 'Scheduled Payment',
                'amount' => [
                    'currency_code' => $currency,
                    'value' => $amount,
                ],
            ]],
            'payment_source' => [
                'paypal' => [
                    'vault_id' => $paymentMethodId,
                ],
            ],
        ];

        $response = $this->makeRequest($this->getBaseUrl() . '/v2/checkout/orders', [
            'method' => 'POST',
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'application/json',
                'PayPal-Request-Id' => uniqid('yatra_', true),
            ],
            'body' => wp_json_encode($orderData),
        ]);

        if (!$response['success'] || empty($response['body']['id'])) {
            return [
                'success' => false,
                'error' => $response['body']['message'] ?? __('Failed to create PayPal order', 'yatra'),
            ];
        }

        $orderId = $response['body']['id'];

        // Auto-capture for vaulted payments
        if ($response['body']['status'] === 'COMPLETED') {
            $captureId = $response['body']['purchase_units'][0]['payments']['captures'][0]['id'] ?? null;
            return [
                'success' => true,
                'transaction_id' => $captureId ?? $orderId,
                'order_id' => $orderId,
                'amount' => (float) $amount,
                'currency' => $currency,
                'status' => 'completed',
            ];
        }

        // If not auto-captured, capture now
        $captureResponse = $this->makeRequest($this->getBaseUrl() . "/v2/checkout/orders/{$orderId}/capture", [
            'method' => 'POST',
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'application/json',
            ],
        ]);

        if ($captureResponse['body']['status'] === 'COMPLETED') {
            $captureId = $captureResponse['body']['purchase_units'][0]['payments']['captures'][0]['id'] ?? null;
            return [
                'success' => true,
                'transaction_id' => $captureId ?? $orderId,
                'order_id' => $orderId,
                'amount' => (float) $amount,
                'currency' => $currency,
                'status' => 'completed',
            ];
        }

        return [
            'success' => false,
            'error' => __('Payment capture failed', 'yatra'),
        ];
    }

    /**
     * Get saved payment methods
     */
    public function getPaymentMethods(string $customerId): array
    {
        // PayPal vault tokens need to be stored locally
        // as PayPal doesn't provide a list endpoint for merchant-stored tokens
        return [];
    }

    /**
     * Delete saved payment method
     */
    public function deletePaymentMethod(string $paymentMethodId): array
    {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return ['success' => false, 'error' => __('Failed to authenticate with PayPal', 'yatra')];
        }

        $response = $this->makeRequest($this->getBaseUrl() . "/v3/vault/payment-tokens/{$paymentMethodId}", [
            'method' => 'DELETE',
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken,
            ],
        ]);

        return [
            'success' => $response['code'] === 204 || $response['success'],
        ];
    }

    public function verifyPayment(string $transactionId): array
    {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return ['success' => false, 'error' => 'Authentication failed'];
        }

        // First try to get order details
        $orderResponse = $this->makeRequest($this->getBaseUrl() . "/v2/checkout/orders/{$transactionId}", [
            'method' => 'GET',
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken,
            ],
        ]);

        // If already completed, return success
        if (($orderResponse['body']['status'] ?? '') === 'COMPLETED') {
            $vaultId = null;
            $paymentSource = $orderResponse['body']['payment_source']['paypal'] ?? [];
            if (!empty($paymentSource['attributes']['vault']['id'])) {
                $vaultId = $paymentSource['attributes']['vault']['id'];
            }

            return [
                'success' => true,
                'status' => 'COMPLETED',
                'capture_id' => $orderResponse['body']['purchase_units'][0]['payments']['captures'][0]['id'] ?? null,
                'vault_id' => $vaultId,
            ];
        }

        // If approved, capture the order
        if (($orderResponse['body']['status'] ?? '') === 'APPROVED') {
            $response = $this->makeRequest($this->getBaseUrl() . "/v2/checkout/orders/{$transactionId}/capture", [
                'method' => 'POST',
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                    'Content-Type' => 'application/json',
                ],
            ]);

            $status = $response['body']['status'] ?? '';
            
            // Check for vault ID
            $vaultId = null;
            $paymentSource = $response['body']['payment_source']['paypal'] ?? [];
            if (!empty($paymentSource['attributes']['vault']['id'])) {
                $vaultId = $paymentSource['attributes']['vault']['id'];
            }
            
            return [
                'success' => $status === 'COMPLETED',
                'status' => $status,
                'capture_id' => $response['body']['purchase_units'][0]['payments']['captures'][0]['id'] ?? null,
                'vault_id' => $vaultId,
            ];
        }

        return [
            'success' => false,
            'status' => $orderResponse['body']['status'] ?? 'UNKNOWN',
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
            'body' => wp_json_encode([
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

    /**
     * Handle PayPal webhook
     */
    public function handleWebhook(array $data): array
    {
        $body = $data['raw_body'] ?? '';
        $event = json_decode($body, true);
        $eventType = $event['event_type'] ?? '';

        switch ($eventType) {
            case 'PAYMENT.CAPTURE.COMPLETED':
                do_action('yatra_paypal_payment_completed', $event['resource'] ?? []);
                break;
                
            case 'PAYMENT.CAPTURE.REFUNDED':
                do_action('yatra_paypal_payment_refunded', $event['resource'] ?? []);
                break;
                
            case 'VAULT.PAYMENT-TOKEN.CREATED':
                do_action('yatra_paypal_token_created', $event['resource'] ?? []);
                break;
        }

        return ['success' => true, 'event_type' => $eventType];
    }
}

