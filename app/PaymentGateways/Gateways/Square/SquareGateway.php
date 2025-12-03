<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways\Gateways\Square;

use Yatra\PaymentGateways\AbstractPaymentGateway;

class SquareGateway extends AbstractPaymentGateway
{
    protected string $id = 'square';
    protected string $title = 'Square';
    protected string $description = 'Accept payments via Square';
    protected string $icon = 'icon.svg';
    protected string $sandboxUrl = 'https://developer.squareup.com/docs/devtools/sandbox/overview';
    protected array $supports = ['credit_card', 'debit_card', 'refunds'];

    public function getConfigFields(): array
    {
        return [
            [
                'id' => 'application_id',
                'type' => 'text',
                'label' => __('Application ID', 'yatra'),
                'description' => __('Your Square application ID', 'yatra'),
                'placeholder' => 'sandbox-sq0idb-...',
                'default' => '',
                'help_url_test' => 'https://developer.squareup.com/docs/devtools/sandbox/overview',
                'help_url_live' => 'https://developer.squareup.com/apps',
                'help_text' => __('Get your Application ID from Square Developer Dashboard', 'yatra'),
            ],
            [
                'id' => 'access_token',
                'type' => 'password',
                'label' => __('Access Token', 'yatra'),
                'description' => __('Your Square access token', 'yatra'),
                'placeholder' => 'EAA...',
                'default' => '',
                'help_url_test' => 'https://developer.squareup.com/docs/devtools/sandbox/overview',
                'help_url_live' => 'https://developer.squareup.com/apps',
                'help_text' => __('Get your Access Token from Square Developer Dashboard', 'yatra'),
            ],
            [
                'id' => 'location_id',
                'type' => 'text',
                'label' => __('Location ID', 'yatra'),
                'description' => __('Your Square location ID', 'yatra'),
                'placeholder' => '...',
                'default' => '',
                'help_url_test' => 'https://developer.squareup.com/docs/devtools/sandbox/overview',
                'help_url_live' => 'https://squareup.com/dashboard/locations',
                'help_text' => __('Find your Location ID in Square Dashboard > Locations', 'yatra'),
            ],
        ];
    }
    
    private function getApiBase(): string
    {
        return \Yatra\Services\SettingsService::isPaymentTestMode()
            ? 'https://connect.squareupsandbox.com/v2'
            : 'https://connect.squareup.com/v2';
    }

    public function processPayment(array $paymentData): array
    {
        // Check if API credentials are configured
        if (empty($this->config['application_id']) || empty($this->config['access_token']) || empty($this->config['location_id'])) {
            error_log('[Yatra Square] API credentials not configured');
            return [
                'success' => false,
                'error' => __('Square API credentials are not configured. Please configure them in settings.', 'yatra'),
            ];
        }
        
        $bookingId = $paymentData['booking_id'] ?? 0;
        $reference = $paymentData['reference'] ?? $bookingId;
        $amount = $paymentData['amount'] ?? 0;
        $amountCents = (int) ($amount * 100); // Convert to cents
        $currency = $paymentData['currency'] ?? 'USD';
        $confirmationUrl = home_url('/booking-confirmation/' . $reference . '/');
        
        // If we have a source_id (card token from frontend), complete the payment directly
        $sourceId = $paymentData['square_source_id'] ?? '';
        if (!empty($sourceId)) {
            error_log('[Yatra Square] Processing payment with source_id for booking: ' . $bookingId);
            
            $result = $this->createPayment([
                'source_id' => $sourceId,
                'booking_id' => $bookingId,
                'amount' => $amount,
                'currency' => $currency,
            ]);
            
            if ($result['success']) {
                return [
                    'success' => true,
                    'transaction_id' => $result['transaction_id'] ?? '',
                    'status' => $result['status'] ?? 'completed',
                    'redirect_url' => $confirmationUrl,
                ];
            }
            
            return $result;
        }
        
        // No source_id - return config for frontend to tokenize card
        error_log('[Yatra Square] Returning requires_action for booking: ' . $bookingId);
        
        return [
            'success' => true,
            'requires_action' => 'square_payment',
            'application_id' => $this->config['application_id'] ?? '',
            'location_id' => $this->config['location_id'] ?? '',
            'amount' => $amount,
            'amount_cents' => $amountCents,
            'currency' => $currency,
            'booking_id' => $bookingId,
            'booking_ref' => $reference,
            'confirmation_url' => $confirmationUrl,
        ];
    }
    
    /**
     * Enqueue Square Web Payments SDK scripts
     */
    public function enqueueScripts(): void
    {
        if (!$this->isAvailable()) {
            return;
        }
        
        $sdkUrl = \Yatra\Services\SettingsService::isPaymentTestMode()
            ? 'https://sandbox.web.squarecdn.com/v1/square.js'
            : 'https://web.squarecdn.com/v1/square.js';
        
        wp_enqueue_script(
            'square-web-payments-sdk',
            $sdkUrl,
            [],
            null,
            true
        );
        
        wp_enqueue_script(
            'yatra-square',
            YATRA_PLUGIN_URL . 'app/PaymentGateways/Gateways/Square/square.js',
            ['jquery', 'square-web-payments-sdk'],
            YATRA_VERSION,
            true
        );
    }
    
    /**
     * Get frontend data for Square
     */
    public function getFrontendData(): array
    {
        return [
            'application_id' => $this->config['application_id'] ?? '',
            'location_id' => $this->config['location_id'] ?? '',
            'is_sandbox' => \Yatra\Services\SettingsService::isPaymentTestMode(),
        ];
    }
    
    /**
     * Create payment after receiving source_id from client
     */
    public function createPayment(array $paymentData): array
    {
        $sourceId = $paymentData['source_id'] ?? '';
        $amount = (int) (($paymentData['amount'] ?? 0) * 100);
        $currency = $paymentData['currency'] ?? 'USD';
        $bookingId = $paymentData['booking_id'] ?? 0;
        
        if (empty($sourceId)) {
            return ['success' => false, 'error' => __('Payment source is required', 'yatra')];
        }
        
        $response = $this->makeRequest($this->getApiBase() . '/payments', [
            'method' => 'POST',
            'headers' => [
                'Authorization' => 'Bearer ' . ($this->config['access_token'] ?? ''),
                'Content-Type' => 'application/json',
                'Square-Version' => '2024-01-18',
            ],
            'body' => wp_json_encode([
                'source_id' => $sourceId,
                'idempotency_key' => wp_generate_uuid4(),
                'amount_money' => [
                    'amount' => $amount,
                    'currency' => $currency,
                ],
                'location_id' => $this->config['location_id'] ?? '',
                'note' => sprintf(__('Booking #%s', 'yatra'), $bookingId),
                'reference_id' => (string) $bookingId,
            ]),
        ]);
        
        if (!$response['success'] || empty($response['body']['payment']['id'])) {
            $error = $response['body']['errors'][0]['detail'] ?? __('Payment failed', 'yatra');
            return ['success' => false, 'error' => $error];
        }
        
        $payment = $response['body']['payment'];
        
        return [
            'success' => true,
            'transaction_id' => $payment['id'],
            'status' => $payment['status'] === 'COMPLETED' ? 'completed' : 'pending',
            'amount' => $amount / 100,
            'currency' => $currency,
        ];
    }

    public function verifyPayment(string $transactionId): array
    {
        $response = $this->makeRequest($this->getApiBase() . '/payments/' . $transactionId, [
            'method' => 'GET',
            'headers' => [
                'Authorization' => 'Bearer ' . ($this->config['access_token'] ?? ''),
                'Square-Version' => '2024-01-18',
            ],
        ]);
        
        if (!$response['success'] || empty($response['body']['payment'])) {
            return ['success' => false, 'error' => __('Payment not found', 'yatra')];
        }
        
        $payment = $response['body']['payment'];
        
        return [
            'success' => $payment['status'] === 'COMPLETED',
            'status' => $payment['status'] === 'COMPLETED' ? 'completed' : 'pending',
            'amount' => ($payment['amount_money']['amount'] ?? 0) / 100,
            'currency' => $payment['amount_money']['currency'] ?? 'USD',
        ];
    }
    
    public function processRefund(string $transactionId, float $amount): array
    {
        $response = $this->makeRequest($this->getApiBase() . '/refunds', [
            'method' => 'POST',
            'headers' => [
                'Authorization' => 'Bearer ' . ($this->config['access_token'] ?? ''),
                'Content-Type' => 'application/json',
                'Square-Version' => '2024-01-18',
            ],
            'body' => wp_json_encode([
                'idempotency_key' => wp_generate_uuid4(),
                'payment_id' => $transactionId,
                'amount_money' => [
                    'amount' => (int) ($amount * 100),
                    'currency' => 'USD',
                ],
            ]),
        ]);
        
        if (!$response['success'] || empty($response['body']['refund']['id'])) {
            $error = $response['body']['errors'][0]['detail'] ?? __('Refund failed', 'yatra');
            return ['success' => false, 'error' => $error];
        }
        
        return [
            'success' => true,
            'refund_id' => $response['body']['refund']['id'],
        ];
    }
}

