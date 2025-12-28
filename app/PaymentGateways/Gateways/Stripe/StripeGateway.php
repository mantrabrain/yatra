<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways\Gateways\Stripe;

use Yatra\Database\Tables\BookingsTable;
use Yatra\Database\Tables\BookingPaymentsTable;
use Yatra\PaymentGateways\AbstractPaymentGateway;

class StripeGateway extends AbstractPaymentGateway
{
    protected string $id = 'stripe';
    protected string $title = 'Stripe';
    protected string $description = 'Accept credit and debit cards via Stripe';
    protected string $icon = 'icon.svg';
    protected string $sandboxUrl = 'https://stripe.com/docs/testing';
    protected array $supports = ['credit_card', 'debit_card', 'refunds', 'recurring', 'subscriptions', 'scheduled_payments'];

    private string $apiBase = 'https://api.stripe.com/v1';
    
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
                'help_url_test' => 'https://dashboard.stripe.com/test/apikeys',
                'help_url_live' => 'https://dashboard.stripe.com/apikeys',
                'help_text' => __('Get your API keys from Stripe Dashboard > Developers > API keys', 'yatra'),
            ],
            [
                'id' => 'api_secret',
                'type' => 'password',
                'label' => __('Secret Key', 'yatra'),
                'description' => __('Your Stripe secret API key (keep this secure)', 'yatra'),
                'placeholder' => 'sk_test_...',
                'default' => '',
                'help_url_test' => 'https://dashboard.stripe.com/test/apikeys',
                'help_url_live' => 'https://dashboard.stripe.com/apikeys',
                'help_text' => __('Get your API keys from Stripe Dashboard > Developers > API keys', 'yatra'),
            ],
            [
                'id' => 'webhook_secret',
                'type' => 'password',
                'label' => __('Webhook Secret', 'yatra'),
                'description' => __('Stripe webhook signing secret for payment verification', 'yatra'),
                'placeholder' => 'whsec_...',
                'default' => '',
                'help_url_test' => 'https://dashboard.stripe.com/test/webhooks',
                'help_url_live' => 'https://dashboard.stripe.com/webhooks',
                'help_text' => __('Create a webhook endpoint in Stripe Dashboard > Developers > Webhooks', 'yatra'),
            ],
            [
                'id' => 'enabled_methods',
                'type' => 'text',
                'label' => __('Enabled Payment Methods', 'yatra'),
                'description' => __('Enter a comma-separated list of payment methods to show (card, google_pay, apple_pay)', 'yatra'),
                'placeholder' => 'card,google_pay,apple_pay',
                'default' => 'card,google_pay,apple_pay',
                'help_text' => __('Apple Pay requires domain verification inside your Stripe Dashboard.', 'yatra'),
                'help_url_test' => 'https://stripe.com/docs/testing',
                'help_url_live' => 'https://stripe.com/docs/payments/payment-request-button#apple-pay',
            ],
        ];
    }

    public function processPayment(array $paymentData): array
    {
        try {
            // Validate required fields
            $required = ['amount', 'currency', 'booking_id', 'customer_email'];
            foreach ($required as $field) {
                if (empty($paymentData[$field])) {
                    return [
                        'success' => false,
                        'message' => sprintf(__('Missing required field: %s', 'yatra'), $field)
                    ];
                }
            }

            // Convert amount to cents for Stripe
            $amount = (int) ($paymentData['amount'] * 100);
            $currency = strtolower($paymentData['currency']);
            $bookingId = $paymentData['booking_id'] ?? 0;
            $reference = $paymentData['reference'] ?? '';
            $customerEmail = $paymentData['customer_email'] ?? '';
            $customerName = $paymentData['customer_name'] ?? '';
            $saveCard = !empty($paymentData['save_card']) && !empty($this->config['save_cards']);
            $customerId = $paymentData['stripe_customer_id'] ?? null;
            
            // Build return URL with stripe-specific query param
            $returnUrl = $paymentData['return_url'] ?? '';
            if (empty($returnUrl) && !empty($reference)) {
                $returnUrl = home_url('/booking-confirmation/' . $reference . '/?stripe=success');
            }

            // Create or get customer if saving card
            if ($saveCard && !$customerId && $customerEmail) {
                $customerResult = $this->createCustomer([
                    'email' => $customerEmail,
                    'name' => $customerName,
                    'metadata' => [
                        'booking_id' => $bookingId,
                        'source' => 'yatra_booking'
                    ]
                ]);

                if (!$customerResult['success']) {
                    return $customerResult;
                }

                $customerId = $customerResult['customer_id'];
            }

            // Create payment intent
            $response = $this->createPaymentIntent([
                'amount' => $amount,
                'currency' => $currency,
                'customer' => $customerId,
                'setup_future_usage' => $saveCard ? 'off_session' : null,
                'metadata' => [
                    'booking_id' => $bookingId,
                    'customer_email' => $customerEmail
                ],
                'description' => $paymentData['description'] ?? __('Trip Booking', 'yatra'),
                'return_url' => $paymentData['return_url']
            ]);

            if (!$response['success']) {
                return [
                    'success' => false,
                    'message' => $response['error'] ?? __('Failed to create payment intent', 'yatra')
                ];
            }

            $reference = $paymentData['reference'] ?? $paymentData['booking_id'];
            $confirmationUrl = home_url('/booking-confirmation/' . $reference . '/');
            
            // Return the payment intent data for frontend processing
            // The frontend JS (stripe.js) will handle opening the payment form
            return [
                'success' => true,
                'requires_action' => 'stripe_payment',
                'client_secret' => $response['body']['client_secret'],
                'publishable_key' => $this->config['api_key'] ?? '',
                'transaction_id' => $response['body']['id'],
                'customer_id' => $customerId,
                'save_card' => $saveCard,
                'booking_ref' => $reference,
                'confirmation_url' => $confirmationUrl,
                'amount' => $paymentData['amount'],
                'currency' => $paymentData['currency'],
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    // ... [rest of the file remains the same]
    
    /**
     * Create a Stripe customer
     */
    public function createCustomer(array $customerData): array
    {
        $body = [
            'email' => $customerData['email'] ?? '',
            'name' => $customerData['name'] ?? '',
        ];

        if (!empty($customerData['metadata'])) {
            foreach ($customerData['metadata'] as $key => $value) {
                $body["metadata[{$key}]"] = $value;
            }
        }

        $response = $this->makeRequest("{$this->apiBase}/customers", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
            'body' => $body,
        ]);

        if (!$response['success']) {
            return [
                'success' => false,
                'error' => $response['body']['error']['message'] ?? __('Failed to create customer', 'yatra'),
            ];
        }

        return [
            'success' => true,
            'customer_id' => $response['body']['id'],
            'data' => $response['body'],
        ];
    }

    /**
     * Create a payment intent
     */
    protected function createPaymentIntent(array $data): array
    {
        $body = [
            'amount' => $data['amount'],
            'currency' => $data['currency'],
            'confirmation_method' => 'automatic',
            'payment_method_types' => ['card'],
        ];

        if (!empty($data['customer'])) {
            $body['customer'] = $data['customer'];
        }

        if (!empty($data['setup_future_usage'])) {
            $body['setup_future_usage'] = $data['setup_future_usage'];
        }

        if (!empty($data['metadata'])) {
            foreach ($data['metadata'] as $key => $value) {
                $body["metadata[{$key}]"] = $value;
            }
        }

        if (!empty($data['description'])) {
            $body['description'] = $data['description'];
        }

        $response = $this->makeRequest("{$this->apiBase}/payment_intents", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
            'body' => $body,
        ]);

        if (!isset($response['body']['client_secret'])) {
            return [
                'success' => false,
                'error' => $response['body']['error']['message'] ?? __('Failed to create payment intent', 'yatra'),
            ];
        }

        return [
            'success' => true,
            'body' => $response['body'],
        ];
    }

    /**
     * Get API headers
     */
    private function getHeaders(): array
    {
        $apiKey = !empty($this->config['api_secret']) ? $this->config['api_secret'] : '';
        return [
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type' => 'application/x-www-form-urlencoded',
        ];
    }

    /**
     * Make API request to Stripe
     */
    protected function makeRequest(string $url, array $args = []): array
    {
        $defaults = [
            'method' => 'GET',
            'timeout' => 30,
            'headers' => [],
            'body' => [],
        ];

        $args = wp_parse_args($args, $defaults);
        
        // Encode the body as form data if it's an array
        if (is_array($args['body'])) {
            $args['body'] = http_build_query($args['body'], '', '&');
        }

        $response = wp_remote_request($url, $args);

        if (is_wp_error($response)) {
            return [
                'success' => false,
                'error' => $response->get_error_message(),
            ];
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return [
                'success' => false,
                'error' => 'Invalid JSON response from Stripe',
                'raw_response' => $body,
            ];
        }

        $responseCode = wp_remote_retrieve_response_code($response);
        
        if ($responseCode >= 400) {
            return [
                'success' => false,
                'error' => $data['error']['message'] ?? 'Unknown error occurred',
                'body' => $data,
            ];
        }

        return [
            'success' => true,
            'body' => $data,
        ];
    }

    /**
     * Verify a payment with Stripe
     * 
     * @param string $transactionId The payment intent ID or charge ID to verify
     * @return array Verification result
     */
    public function verifyPayment(string $transactionId): array
    {
        try {
            // First try to get payment intent
            $response = $this->makeRequest("{$this->apiBase}/payment_intents/{$transactionId}", [
                'method' => 'GET',
                'headers' => $this->getHeaders(),
            ]);

            // If payment intent found
            if (isset($response['body']['id'])) {
                $paymentIntent = $response['body'];
                $status = $paymentIntent['status'] ?? '';
                
                // Check if payment was successful
                if ($status === 'succeeded') {
                    return [
                        'success' => true,
                        'status' => 'succeeded',
                        'amount' => $paymentIntent['amount'] / 100, // Convert from cents
                        'currency' => strtoupper($paymentIntent['currency']),
                        'payment_method' => $paymentIntent['payment_method_types'][0] ?? 'card',
                        'charge_id' => $paymentIntent['latest_charge'] ?? null,
                        'payment_intent_id' => $paymentIntent['id'],
                    ];
                }
                
                // Handle other statuses
                return [
                    'success' => false,
                    'status' => $status,
                    'error' => $paymentIntent['last_payment_error']['message'] ?? 
                              ($status === 'requires_payment_method' ? 'Payment failed. Please try again with a different payment method.' :
                              ($status === 'requires_action' ? 'Additional action required to complete payment' :
                              'Payment not completed')),
                ];
            }

            // If not a payment intent, try to get charge
            $chargeResponse = $this->makeRequest("{$this->apiBase}/charges/{$transactionId}", [
                'method' => 'GET',
                'headers' => $this->getHeaders(),
            ]);

            if (isset($chargeResponse['body']['id'])) {
                $charge = $chargeResponse['body'];
                $status = $charge['status'] ?? '';
                
                if ($status === 'succeeded') {
                    return [
                        'success' => true,
                        'status' => 'succeeded',
                        'amount' => $charge['amount'] / 100, // Convert from cents
                        'currency' => strtoupper($charge['currency']),
                        'payment_method' => $charge['payment_method_details']['type'] ?? 'card',
                        'charge_id' => $charge['id'],
                    ];
                }
                
                return [
                    'success' => false,
                    'status' => $status,
                    'error' => $charge['failure_message'] ?? 'Payment not completed',
                ];
            }

            // If neither payment intent nor charge found
            return [
                'success' => false,
                'error' => 'Transaction not found',
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
    
    /**
     * Register gateway scripts for frontend
     */
    public function enqueueScripts(): void
    {
        if (!$this->isAvailable()) {
            return;
        }
        
        // Stripe.js is loaded from CDN, but we need our handler
        // The stripe.js in public/js handles the payment form
    }
    
    /**
     * Get frontend data for JavaScript
     */
    public function getFrontendData(): array
    {
        return [
            'publishable_key' => $this->config['api_key'] ?? '',
            'enabled_methods' => $this->config['enabled_methods'] ?? 'card,google_pay,apple_pay',
        ];
    }
    
    /**
     * Check if this gateway should handle the return request
     */
    public function shouldHandleReturn(array $params): bool
    {
        return isset($params['stripe']) && $params['stripe'] === 'success';
    }
    
    /**
     * Handle payment return from Stripe
     */
    public function handlePaymentReturn($booking, $bookingRepository): void
    {
        // Get payment intent from booking's session ID
        $paymentIntentId = $booking->payment_session_id ?? '';
        
        if (empty($paymentIntentId)) {
            return;
        }
        
        // Verify payment status
        $result = $this->verifyPayment($paymentIntentId);
        
        if ($result['success'] && $result['status'] === 'succeeded') {
            $this->completePayment($booking, $bookingRepository, $paymentIntentId, $result);
        }
    }
    
    /**
     * Complete the payment and update booking status
     */
    private function completePayment($booking, $bookingRepository, string $transactionId, array $paymentData = []): void
    {
        global $wpdb;
        
        if ($booking->payment_status === 'paid') {
            return;
        }
        
        $bookingId = (int) $booking->id;
        $amountDue = (float) ($booking->amount_due ?? ($booking->total_amount - $booking->amount_paid));
        $amount = $paymentData['amount'] ?? $amountDue;
        $currency = $paymentData['currency'] ?? ($booking->currency ?? 'USD');
        
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
                'gateway' => 'stripe',
                'transaction_id' => $transactionId,
                'status' => 'completed',
                'created_at' => current_time('mysql'),
            ],
            ['%d', '%f', '%s', '%s', '%s', '%s', '%s']
        );
        
        do_action('yatra_payment_completed', [
            'booking_id' => $bookingId,
            'transaction_id' => $transactionId,
            'amount' => $amount,
            'currency' => $currency,
            'gateway' => 'stripe',
        ]);
    }
}
