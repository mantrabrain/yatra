<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways\Gateways\PayPal;

use Yatra\Database\Tables\BookingsTable;
use Yatra\Database\Tables\BookingPaymentsTable;
use Yatra\PaymentGateways\AbstractPaymentGateway;
use Yatra\PaymentGateways\GatewayUserMessages;

class PayPalGateway extends AbstractPaymentGateway
{
    protected string $id = 'paypal';
    protected string $title = 'PayPal';
    protected string $description = 'Accept PayPal and credit card payments';
    protected string $icon = 'paypal.svg';
    protected string $sandboxUrl = 'https://developer.paypal.com/tools/sandbox/';
    protected array $supports = ['paypal', 'credit_card', 'refunds', 'recurring', 'tokenization', 'scheduled_payments'];

    public function getConfigFields(): array
    {
        return [
            [
                'id' => 'mode',
                'type' => 'select',
                'label' => __('Integration Mode', 'yatra'),
                'description' => __('Choose how to connect PayPal', 'yatra'),
                'default' => 'simple',
                'options' => [
                    'simple' => __('Simple (Email Only) - Quick setup, basic payments', 'yatra'),
                    'advanced' => __('Advanced (API) - Refunds, saved cards, scheduled payments', 'yatra'),
                ],
                'help_text' => __('Simple mode: Just enter your PayPal email. Advanced mode: Enables refunds, saved payment methods, and scheduled payments.', 'yatra'),
            ],
            [
                'id' => 'email',
                'type' => 'email',
                'label' => __('PayPal Email', 'yatra'),
                'description' => __('Your PayPal account email address', 'yatra'),
                'placeholder' => 'your-email@example.com',
                'default' => '',
                'help_text' => __('Enter the email address associated with your PayPal Business or Premier account.', 'yatra'),
                'help_url_live' => 'https://www.paypal.com/businesswallet/settings',
                'show_when' => ['mode' => 'simple'],
            ],
            [
                'id' => 'client_id',
                'type' => 'text',
                'label' => __('Client ID', 'yatra'),
                'description' => __('Your PayPal application client ID', 'yatra'),
                'placeholder' => 'AeA1QIZXiflr1...',
                'default' => '',
                'help_url_test' => 'https://developer.paypal.com/tools/sandbox/',
                'help_url_live' => 'https://developer.paypal.com/dashboard/applications/live',
                'help_text' => __('Create an app in PayPal Developer Dashboard to get Client ID', 'yatra'),
                'show_when' => ['mode' => 'advanced'],
            ],
            [
                'id' => 'client_secret',
                'type' => 'password',
                'label' => __('Client Secret', 'yatra'),
                'description' => __('Your PayPal application client secret', 'yatra'),
                'placeholder' => 'EC...',
                'default' => '',
                'help_url_test' => 'https://developer.paypal.com/tools/sandbox/',
                'help_url_live' => 'https://developer.paypal.com/dashboard/applications/live',
                'help_text' => __('Get Client Secret from the same PayPal app you created', 'yatra'),
                'show_when' => ['mode' => 'advanced'],
            ],
        ];
    }

    /**
     * Check if using simple (email-only) mode
     */
    private function isSimpleMode(): bool
    {
        return ($this->config['mode'] ?? 'simple') === 'simple';
    }

    public function isProperlyConfigured(): bool
    {
        if ($this->isSimpleMode()) {
            return !empty(trim((string) ($this->config['email'] ?? '')));
        }

        return !empty(trim((string) ($this->config['client_id'] ?? '')))
            && !empty(trim((string) ($this->config['client_secret'] ?? '')));
    }

    private function getBaseUrl(): string
    {
        return \Yatra\Services\SettingsService::isPaymentTestMode()
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
        // Log payment attempt for debugging
        $this->log('Processing PayPal payment', [
            'mode' => $this->isSimpleMode() ? 'simple' : 'advanced',
            'amount' => $paymentData['amount'] ?? 0,
            'currency' => $paymentData['currency'] ?? 'USD',
            'booking_id' => $paymentData['booking_id'] ?? 0,
            'test_mode' => \Yatra\Services\SettingsService::isPaymentTestMode(),
        ]);

        // Use simple or advanced mode based on configuration
        if ($this->isSimpleMode()) {
            return $this->processSimplePayment($paymentData);
        }

        return $this->processAdvancedPayment($paymentData);
    }

    /**
     * Process payment using Simple mode (PayPal Standard - email only)
     * Redirects to PayPal hosted checkout page
     */
    private function processSimplePayment(array $paymentData): array
    {
        $email = $this->config['email'] ?? '';
        if (empty($email)) {
            return ['success' => false, 'error' => GatewayUserMessages::gatewayNotConfigured($this)];
        }

        $amount = number_format((float) ($paymentData['amount'] ?? 0), 2, '.', '');
        $currency = $paymentData['currency'] ?? 'USD';
        $bookingId = $paymentData['booking_id'] ?? 0;
        $reference = $paymentData['reference'] ?? $bookingId;
        $description = $paymentData['description'] ?? sprintf(__('Booking #%s', 'yatra'), $reference);
        $returnUrl = $paymentData['return_url'] ?? yatra_get_booking_confirmation_url((string) $reference);
        $cancelUrl = $paymentData['cancel_url'] ?? home_url('/book/?payment=cancelled&ref=' . $reference);

        // PayPal Standard base URL
        $isTestMode = \Yatra\Services\SettingsService::isPaymentTestMode();
        $paypalUrl = $isTestMode 
            ? 'https://www.sandbox.paypal.com/cgi-bin/webscr'
            : 'https://www.paypal.com/cgi-bin/webscr';

        // Build PayPal Standard payment URL
        $params = [
            'cmd' => '_xclick',
            'business' => $email,
            'item_name' => $description,
            'item_number' => $reference,
            'amount' => $amount,
            'currency_code' => $currency,
            'return' => add_query_arg(['paypal' => 'success', 'booking_id' => $bookingId], $returnUrl),
            'cancel_return' => $cancelUrl,
            'notify_url' => rest_url('yatra/v1/payment/webhook/paypal'),
            'custom' => wp_json_encode(['booking_id' => $bookingId, 'reference' => $reference]),
            'no_shipping' => '1',
            'no_note' => '1',
            'rm' => '2', // POST data back to return URL
        ];

        $redirectUrl = $paypalUrl . '?' . http_build_query($params);

        $this->log('PayPal Simple mode redirect URL created', [
            'booking_id' => $bookingId,
            'amount' => $amount,
            'test_mode' => $isTestMode,
        ]);

        return [
            'success' => true,
            'redirect_url' => $redirectUrl,
            'transaction_id' => 'pending_' . $bookingId, // Will be updated via IPN
            'mode' => 'simple',
        ];
    }

    /**
     * Process payment using Advanced mode (PayPal REST API)
     * Creates order via API and redirects to approval URL
     */
    private function processAdvancedPayment(array $paymentData): array
    {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            $this->log('PayPal authentication failed', ['client_id' => substr($this->config['client_id'] ?? '', 0, 10) . '...']);
            return ['success' => false, 'error' => __('Failed to authenticate with PayPal. Please check your API credentials.', 'yatra')];
        }

        $amount = number_format((float) ($paymentData['amount'] ?? 0), 2, '.', '');
        $currency = $paymentData['currency'] ?? 'USD';
        $bookingId = $paymentData['booking_id'] ?? 0;
        $referenceForReturn = (string) ($paymentData['reference'] ?? $bookingId);
        $returnUrl = $paymentData['return_url'] ?? yatra_get_booking_confirmation_url($referenceForReturn);
        $cancelUrl = $paymentData['cancel_url'] ?? home_url('/book/?payment=cancelled');
        $savePayment = !empty($paymentData['save_payment']);

        $orderData = [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'custom_id' => (string) $bookingId,
                'description' => $paymentData['description'] ?? sprintf(__('Booking #%s', 'yatra'), $bookingId),
                'amount' => [
                    'currency_code' => $currency,
                    'value' => $amount,
                ],
            ]],
            'application_context' => [
                'return_url' => add_query_arg(['paypal' => 'success', 'booking_id' => $bookingId], $returnUrl),
                'cancel_url' => $cancelUrl,
                'user_action' => 'PAY_NOW',
                'brand_name' => get_bloginfo('name'),
            ],
        ];

        // Enable vault for saving payment method
        if ($savePayment) {
            $orderData['payment_source'] = [
                'paypal' => [
                    'experience_context' => [
                        'payment_method_preference' => 'IMMEDIATE_PAYMENT_REQUIRED',
                        'return_url' => add_query_arg(['paypal' => 'success', 'booking_id' => $bookingId], $returnUrl),
                        'cancel_url' => $cancelUrl,
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
            $errorMessage = $response['body']['message'] ?? $response['body']['error_description'] ?? __('Failed to create PayPal order', 'yatra');
            $this->log('PayPal order creation failed', [
                'response' => $response,
                'error' => $errorMessage,
            ]);
            return ['success' => false, 'error' => $errorMessage];
        }

        // Get approval URL
        $approvalUrl = null;
        foreach ($response['body']['links'] ?? [] as $link) {
            if ($link['rel'] === 'approve') {
                $approvalUrl = $link['href'];
                break;
            }
        }

        if (empty($approvalUrl)) {
            $this->log('PayPal order created but no approval URL found', ['order_id' => $response['body']['id']]);
            return ['success' => false, 'error' => __('PayPal order created but redirect URL not found', 'yatra')];
        }

        $this->log('PayPal order created successfully', [
            'order_id' => $response['body']['id'],
            'approval_url' => $approvalUrl,
        ]);

        return [
            'success' => true,
            'order_id' => $response['body']['id'],
            'transaction_id' => $response['body']['id'],
            'redirect_url' => $approvalUrl,
            'approval_url' => $approvalUrl,
            'client_id' => $this->config['client_id'] ?? '',
            'sandbox' => \Yatra\Services\SettingsService::isPaymentTestMode(),
            'mode' => 'advanced',
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
     * Handle PayPal webhook (supports both IPN for Simple mode and REST webhooks for Advanced mode)
     */
    public function handleWebhook(array $data): array
    {
        $body = $data['raw_body'] ?? '';
        $postData = $data['post_data'] ?? [];
        
        // Check if this is an IPN notification (Simple mode)
        if (!empty($postData['txn_type']) || !empty($postData['payment_status'])) {
            return $this->handleIPN($postData);
        }
        
        // Otherwise handle as REST API webhook (Advanced mode)
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
    
    /**
     * Handle PayPal IPN (Instant Payment Notification) for Simple mode
     */
    private function handleIPN(array $ipnData): array
    {
        $this->log('PayPal IPN received', $ipnData);
        
        // Verify IPN with PayPal
        $isTestMode = \Yatra\Services\SettingsService::isPaymentTestMode();
        $verifyUrl = $isTestMode 
            ? 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr'
            : 'https://ipnpb.paypal.com/cgi-bin/webscr';
        
        $verifyData = array_merge(['cmd' => '_notify-validate'], $ipnData);
        
        $response = wp_remote_post($verifyUrl, [
            'body' => $verifyData,
            'timeout' => 60,
            'httpversion' => '1.1',
        ]);
        
        if (is_wp_error($response)) {
            $this->log('IPN verification failed', ['error' => $response->get_error_message()]);
            return ['success' => false, 'error' => 'IPN verification failed'];
        }
        
        $responseBody = wp_remote_retrieve_body($response);
        
        if ($responseBody !== 'VERIFIED') {
            $this->log('IPN not verified', ['response' => $responseBody]);
            return ['success' => false, 'error' => 'IPN not verified'];
        }
        
        // Process the payment
        $paymentStatus = $ipnData['payment_status'] ?? '';
        $customData = json_decode($ipnData['custom'] ?? '{}', true);
        $bookingId = $customData['booking_id'] ?? 0;
        $transactionId = $ipnData['txn_id'] ?? '';
        $amount = (float) ($ipnData['mc_gross'] ?? 0);
        $currency = $ipnData['mc_currency'] ?? 'USD';
        
        if ($paymentStatus === 'Completed' && $bookingId > 0) {
            // Fire action for payment completed
            do_action('yatra_payment_completed', [
                'booking_id' => $bookingId,
                'transaction_id' => $transactionId,
                'amount' => $amount,
                'currency' => $currency,
                'gateway' => 'paypal',
                'mode' => 'simple',
            ]);
            
            $this->log('PayPal IPN payment completed', [
                'booking_id' => $bookingId,
                'transaction_id' => $transactionId,
                'amount' => $amount,
            ]);
            
            return ['success' => true, 'status' => 'completed', 'booking_id' => $bookingId];
        }
        
        return ['success' => true, 'status' => $paymentStatus];
    }
    
    /**
     * Check if this gateway should handle the return request
     */
    public function shouldHandleReturn(array $params): bool
    {
        return isset($params['paypal']) && $params['paypal'] === 'success';
    }
    
    /**
     * Handle payment return from PayPal (when user is redirected back after payment)
     * Works for both Simple and Advanced modes
     */
    public function handlePaymentReturn($booking, $bookingRepository): void
    {
        global $wpdb;
        
        // Check if payment already processed
        if ($booking->payment_status === 'paid') {
            return;
        }
        
        $bookingId = (int) $booking->id;
        $isAdvancedMode = !$this->isSimpleMode();
        
        $this->log('Handling PayPal return', [
            'booking_id' => $bookingId,
            'mode' => $isAdvancedMode ? 'advanced' : 'simple',
        ]);
        
        if ($isAdvancedMode) {
            // Advanced mode: Get token from URL and capture the order
            $token = sanitize_text_field($_GET['token'] ?? '');
            
            if (!empty($token)) {
                $result = $this->verifyPayment($token);
                
                if ($result['success'] && $result['status'] === 'COMPLETED') {
                    $this->completePayment($booking, $bookingRepository, $result['capture_id'] ?? $token);
                }
            }
        } else {
            // Simple mode: Payment verification happens via IPN
            // For now, mark as pending verification - IPN will update it
            // But we can show success to user since PayPal redirected them back
            $this->log('Simple mode return - awaiting IPN verification', ['booking_id' => $bookingId]);
        }
    }
    
    /**
     * Complete the payment and update booking status
     */
    private function completePayment($booking, $bookingRepository, string $transactionId): void
    {
        global $wpdb;
        
        $bookingId = (int) $booking->id;
        $amountDue = (float) ($booking->amount_due ?? ($booking->total_amount - $booking->amount_paid));
        
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
                'amount' => $amountDue,
                'currency' => $booking->currency ?? 'USD',
                'payment_gateway' => 'paypal',
                'transaction_id' => $transactionId,
                'status' => 'completed',
                'created_at' => current_time('mysql'),
            ],
            ['%d', '%f', '%s', '%s', '%s', '%s', '%s']
        );
        
        $this->log('PayPal payment completed', [
            'booking_id' => $bookingId,
            'transaction_id' => $transactionId,
            'amount' => $amountDue,
        ]);
        
        // Fire action for other plugins/services
        do_action('yatra_payment_completed', [
            'booking_id' => $bookingId,
            'transaction_id' => $transactionId,
            'amount' => $amountDue,
            'currency' => $booking->currency ?? 'USD',
            'gateway' => 'paypal',
        ]);
    }
}

