<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways\Gateways\Razorpay;

use Yatra\PaymentGateways\AbstractPaymentGateway;

class RazorpayGateway extends AbstractPaymentGateway
{
    protected string $id = 'razorpay';
    protected string $title = 'Razorpay';
    protected string $description = 'Accept payments via Razorpay (India)';
    protected string $icon = 'icon.svg';
    protected string $sandboxUrl = 'https://razorpay.com/docs/payments/payments/test-mode/';
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
                'help_url_test' => 'https://razorpay.com/docs/payments/payments/test-mode/',
                'help_url_live' => 'https://dashboard.razorpay.com/app/keys',
                'help_text' => __('Get your API keys from Razorpay Dashboard > Settings > API Keys', 'yatra'),
            ],
            [
                'id' => 'key_secret',
                'type' => 'password',
                'label' => __('Key Secret', 'yatra'),
                'description' => __('Your Razorpay key secret', 'yatra'),
                'placeholder' => '...',
                'default' => '',
                'help_url_test' => 'https://razorpay.com/docs/payments/payments/test-mode/',
                'help_url_live' => 'https://dashboard.razorpay.com/app/keys',
                'help_text' => __('Get your API keys from Razorpay Dashboard > Settings > API Keys', 'yatra'),
            ],
        ];
    }
    
    /**
     * Register gateway scripts for frontend
     */
    public function enqueueScripts(): void
    {
        if (!$this->isAvailable()) {
            return;
        }
        
        $gatewayDir = plugin_dir_url(__FILE__);
        
        wp_enqueue_script(
            'yatra-razorpay',
            $gatewayDir . 'razorpay.js',
            ['jquery'],
            YATRA_VERSION,
            true
        );
    }
    
    /**
     * Get frontend data for JavaScript
     */
    public function getFrontendData(): array
    {
        return [
            'key_id' => $this->config['key_id'] ?? '',
            'currency' => 'INR',
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
        // Check if API keys are configured
        if (empty($this->config['key_id']) || empty($this->config['key_secret'])) {
            error_log('[Yatra Razorpay] API keys not configured');
            return [
                'success' => false,
                'error' => __('Razorpay API keys are not configured. Please configure them in settings.', 'yatra'),
            ];
        }
        
        $amount = (int) (($paymentData['amount'] ?? 0) * 100);
        $currency = $paymentData['currency'] ?? 'INR';
        $bookingId = $paymentData['booking_id'] ?? 0;
        $reference = $paymentData['reference'] ?? $bookingId;
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
        
        error_log('[Yatra Razorpay] Creating order: ' . wp_json_encode($orderData));

        $response = $this->makeRequest("{$this->apiBase}/orders", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
            'body' => wp_json_encode($orderData),
        ]);
        
        error_log('[Yatra Razorpay] Order response: ' . wp_json_encode($response));

        if (!$response['success'] || empty($response['body']['id'])) {
            $errorMsg = $response['body']['error']['description'] ?? ($response['error'] ?? __('Failed to create order', 'yatra'));
            error_log('[Yatra Razorpay] Order creation failed: ' . $errorMsg);
            return [
                'success' => false,
                'error' => $errorMsg,
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
        
        $orderId = $response['body']['id'];
        $confirmationUrl = home_url('/booking-confirmation/' . $reference . '/');

        // Return data for client-side Razorpay checkout
        // The frontend JS (razorpay.js) will handle opening the checkout
        return [
            'success' => true,
            'requires_action' => 'razorpay_checkout',
            'order_id' => $orderId,
            'key_id' => $this->config['key_id'] ?? '',
            'amount' => $amount,
            'currency' => $currency,
            'customer_id' => $customerId,
            'customer_name' => $customerName,
            'customer_email' => $customerEmail,
            'booking_ref' => $reference,
            'confirmation_url' => $confirmationUrl,
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
        $postData = $data['post_data'] ?? [];
        $event = json_decode($payload, true);
        $eventType = $event['event'] ?? '';

        switch ($eventType) {
            case 'payment.captured':
                $paymentEntity = $event['payload']['payment']['entity'] ?? [];
                $this->completePaymentFromWebhook($paymentEntity);
                do_action('yatra_razorpay_payment_captured', $paymentEntity);
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
    
    /**
     * Check if this gateway should handle the return request
     * Razorpay returns with razorpay_payment_id parameter
     */
    public function shouldHandleReturn(array $params): bool
    {
        return !empty($params['razorpay_payment_id']) && !empty($params['razorpay_order_id']);
    }
    
    /**
     * Handle payment return from Razorpay
     */
    public function handlePaymentReturn($booking, $bookingRepository): void
    {
        $paymentId = sanitize_text_field($_GET['razorpay_payment_id'] ?? '');
        $orderId = sanitize_text_field($_GET['razorpay_order_id'] ?? '');
        $signature = sanitize_text_field($_GET['razorpay_signature'] ?? '');
        
        if (empty($paymentId) || empty($orderId)) {
            return;
        }
        
        // Verify signature
        $expectedSignature = hash_hmac('sha256', $orderId . '|' . $paymentId, $this->config['key_secret'] ?? '');
        
        if (!hash_equals($expectedSignature, $signature)) {
            $this->log('Razorpay signature verification failed', [
                'order_id' => $orderId,
                'payment_id' => $paymentId,
            ]);
            return;
        }
        
        // Verify payment status
        $result = $this->verifyPayment($paymentId);
        
        if ($result['success'] && $result['status'] === 'captured') {
            $this->completePayment($booking, $bookingRepository, $paymentId, $result);
        }
    }
    
    /**
     * Complete payment from webhook
     */
    private function completePaymentFromWebhook(array $paymentEntity): void
    {
        global $wpdb;
        
        $bookingId = $paymentEntity['notes']['booking_id'] ?? 0;
        if (empty($bookingId)) {
            return;
        }
        
        $bookingRepository = new \Yatra\Repositories\BookingRepository();
        $booking = $bookingRepository->find((int) $bookingId);
        
        if (!$booking || $booking->payment_status === 'paid') {
            return;
        }
        
        $this->completePayment($booking, $bookingRepository, $paymentEntity['id'], [
            'amount' => ($paymentEntity['amount'] ?? 0) / 100,
            'currency' => strtoupper($paymentEntity['currency'] ?? 'INR'),
        ]);
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
        $currency = $paymentData['currency'] ?? ($booking->currency ?? 'INR');
        
        // Update booking payment status
        $bookings_table = $wpdb->prefix . 'yatra_bookings';
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
                'payment_gateway' => 'razorpay',
                'transaction_id' => $transactionId,
                'status' => 'completed',
                'created_at' => current_time('mysql'),
            ],
            ['%d', '%f', '%s', '%s', '%s', '%s', '%s']
        );
        
        $this->log('Razorpay payment completed', [
            'booking_id' => $bookingId,
            'transaction_id' => $transactionId,
            'amount' => $amount,
        ]);
        
        do_action('yatra_payment_completed', [
            'booking_id' => $bookingId,
            'transaction_id' => $transactionId,
            'amount' => $amount,
            'currency' => $currency,
            'gateway' => 'razorpay',
        ]);
    }
}

