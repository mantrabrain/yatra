<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways\Gateways\Stripe;

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
                'help_url' => 'https://dashboard.stripe.com/apikeys',
                'help_text' => __('Get your API keys from Stripe Dashboard > Developers > API keys', 'yatra'),
            ],
            [
                'id' => 'api_secret',
                'type' => 'password',
                'label' => __('Secret Key', 'yatra'),
                'description' => __('Your Stripe secret API key (keep this secure)', 'yatra'),
                'placeholder' => 'sk_test_...',
                'default' => '',
                'help_url' => 'https://dashboard.stripe.com/apikeys',
                'help_text' => __('Get your API keys from Stripe Dashboard > Developers > API keys', 'yatra'),
            ],
            [
                'id' => 'webhook_secret',
                'type' => 'password',
                'label' => __('Webhook Secret', 'yatra'),
                'description' => __('Stripe webhook signing secret for payment verification', 'yatra'),
                'placeholder' => 'whsec_...',
                'default' => '',
                'help_url' => 'https://dashboard.stripe.com/webhooks',
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
                'help_url' => 'https://stripe.com/docs/payments/payment-request-button#apple-pay',
            ],
        ];
    }

    public function processPayment(array $paymentData): array
    {
        try {
            // Validate required fields
            $required = ['amount', 'currency', 'booking_id', 'customer_email', 'return_url', 'cancel_url'];
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
            $customerEmail = $paymentData['customer_email'] ?? '';
            $customerName = $paymentData['customer_name'] ?? '';
            $saveCard = !empty($paymentData['save_card']) && !empty($this->config['save_cards']);
            $customerId = $paymentData['stripe_customer_id'] ?? null;

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

            // Return the payment intent data for frontend processing
            return [
                'success' => true,
                'client_secret' => $response['body']['client_secret'],
                'publishable_key' => $this->config['api_key'] ?? '',
                'transaction_id' => $response['body']['id'],
                'customer_id' => $customerId,
                'save_card' => $saveCard,
                'redirect_url' => add_query_arg([
                    'gateway' => 'stripe',
                    'client_secret' => $response['body']['client_secret'],
                    'publishable_key' => $this->config['api_key'] ?? '',
                    'booking_ref' => $paymentData['booking_id']
                ], home_url('/yatra-payment/process/'))
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
}
