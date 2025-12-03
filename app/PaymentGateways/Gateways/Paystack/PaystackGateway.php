<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways\Gateways\Paystack;

use Yatra\PaymentGateways\AbstractPaymentGateway;

/**
 * Paystack Payment Gateway
 * Popular payment gateway in Africa supporting multiple payment methods
 */
class PaystackGateway extends AbstractPaymentGateway
{
    protected string $id = 'paystack';
    protected string $title = 'Paystack';
    protected string $description = 'Accept payments via Paystack - Cards, Bank Transfer, USSD, and more';
    protected string $icon = 'icon.svg';
    protected string $sandboxUrl = 'https://paystack.com/docs/payments/test-payments/';
    protected array $supports = ['credit_card', 'debit_card', 'bank_transfer', 'ussd', 'mobile_money', 'refunds', 'webhooks'];
    private array $supportedCurrencies = ['NGN', 'GHS', 'ZAR', 'USD'];

    private string $apiBase = 'https://api.paystack.co';

    public function getConfigFields(): array
    {
        return [
            [
                'id' => 'public_key',
                'type' => 'text',
                'label' => __('Public Key', 'yatra'),
                'description' => __('Your Paystack public key', 'yatra'),
                'placeholder' => 'pk_test_... or pk_live_...',
                'default' => '',
                'help_url_test' => 'https://paystack.com/docs/payments/test-payments/',
                'help_url_live' => 'https://dashboard.paystack.com/#/settings/developer',
                'help_text' => __('Get your API keys from Paystack Dashboard > Settings > API Keys & Webhooks', 'yatra'),
            ],
            [
                'id' => 'secret_key',
                'type' => 'password',
                'label' => __('Secret Key', 'yatra'),
                'description' => __('Your Paystack secret key (keep this secure)', 'yatra'),
                'placeholder' => 'sk_test_... or sk_live_...',
                'default' => '',
                'help_url_test' => 'https://paystack.com/docs/payments/test-payments/',
                'help_url_live' => 'https://dashboard.paystack.com/#/settings/developer',
                'help_text' => __('Get your API keys from Paystack Dashboard > Settings > API Keys & Webhooks', 'yatra'),
            ],
            [
                'id' => 'webhook_url',
                'type' => 'text',
                'label' => __('Webhook URL', 'yatra'),
                'description' => __('Set this URL in your Paystack dashboard', 'yatra'),
                'default' => site_url('/wp-json/yatra/v1/payment/paystack/webhook'),
                'readonly' => true,
            ],
            [
                'id' => 'payment_channels',
                'type' => 'multiselect',
                'label' => __('Payment Channels', 'yatra'),
                'description' => __('Select which payment channels to enable', 'yatra'),
                'options' => [
                    'card' => __('Card', 'yatra'),
                    'bank' => __('Bank Transfer', 'yatra'),
                    'ussd' => __('USSD', 'yatra'),
                    'qr' => __('QR Code', 'yatra'),
                    'mobile_money' => __('Mobile Money', 'yatra'),
                    'bank_transfer' => __('Bank Transfer', 'yatra'),
                ],
                'default' => ['card', 'bank', 'ussd'],
            ],
        ];
    }

    public function isAvailable(): bool
    {
        $config = $this->getConfig();
        return !empty($config['public_key']) && !empty($config['secret_key']) && $this->isEnabled();
    }

    public function processPayment(array $paymentData): array
    {
        try {
            $config = $this->getConfig();
            $secretKey = $config['secret_key'] ?? '';
            
            if (empty($secretKey)) {
                throw new \Exception('Paystack secret key not configured');
            }
            
            $bookingId = $paymentData['booking_id'] ?? 0;
            $reference = $paymentData['reference'] ?? '';
            
            // Build callback URL with paystack-specific query param
            $callbackUrl = $paymentData['return_url'] ?? '';
            if (empty($callbackUrl) && !empty($reference)) {
                $callbackUrl = home_url('/booking-confirmation/' . $reference . '/');
            }

            $currency = strtoupper($paymentData['currency'] ?? 'NGN');

            if (!in_array($currency, $this->supportedCurrencies, true)) {
                $supportedList = implode(', ', $this->supportedCurrencies);
                return [
                    'success' => false,
                    'error' => sprintf(
                        /* translators: 1: Unsupported currency code, 2: List of supported currencies */
                        __('Paystack does not support transactions in %1$s. Please switch to one of the supported currencies (%2$s) or choose a different payment gateway.', 'yatra'),
                        $currency,
                        $supportedList
                    ),
                ];
            }

            // Initialize transaction with Paystack
            $transactionData = [
                'email' => $paymentData['customer_email'] ?? '',
                'amount' => (int) ($paymentData['amount'] * 100), // Convert to kobo/cents
                'currency' => $currency,
                'reference' => $this->generateReference($bookingId),
                'callback_url' => $callbackUrl,
                'metadata' => [
                    'booking_id' => $bookingId,
                    'reference' => $reference,
                    'customer_name' => $paymentData['customer_name'] ?? '',
                ],
            ];

            // Add payment channels if specified
            $channels = $config['payment_channels'] ?? ['card'];
            if (!empty($channels)) {
                $transactionData['channels'] = $channels;
            }

            $response = $this->makeApiRequest('POST', '/transaction/initialize', $transactionData, $secretKey);

            if ($response['status'] === true && isset($response['data']['authorization_url'])) {
                return [
                    'success' => true,
                    'transaction_id' => $response['data']['reference'],
                    'redirect_url' => $response['data']['authorization_url'],
                    'status' => 'pending',
                ];
            }

            throw new \Exception($response['message'] ?? 'Failed to initialize payment');

        } catch (\Exception $e) {
            error_log('Paystack Payment Error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function handleWebhook(array $data): array
    {
        try {
            // Verify webhook signature
            $signature = $_SERVER['HTTP_X_PAYSTACK_SIGNATURE'] ?? '';
            $config = $this->getConfig();
            $secretKey = $config['secret_key'] ?? '';
            
            $computedSignature = hash_hmac('sha512', json_encode($data), $secretKey);
            
            if (!hash_equals($signature, $computedSignature)) {
                throw new \Exception('Invalid webhook signature');
            }

            $event = $data['event'] ?? '';
            $eventData = $data['data'] ?? [];

            if ($event === 'charge.success') {
                $reference = $eventData['reference'] ?? '';
                $bookingId = $eventData['metadata']['booking_id'] ?? '';
                $amount = ($eventData['amount'] ?? 0) / 100; // Convert from kobo/cents

                return [
                    'success' => true,
                    'status' => 'completed',
                    'transaction_id' => $reference,
                    'booking_id' => $bookingId,
                    'amount' => $amount,
                    'currency' => $eventData['currency'] ?? 'NGN',
                ];
            }

            return [
                'success' => true,
                'status' => 'ignored', // Event not relevant
            ];

        } catch (\Exception $e) {
            error_log('Paystack Webhook Error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function verifyPayment(string $transactionId): array
    {
        try {
            $config = $this->getConfig();
            $secretKey = $config['secret_key'] ?? '';

            $response = $this->makeApiRequest('GET', "/transaction/verify/{$transactionId}", [], $secretKey);

            if ($response['status'] === true) {
                $data = $response['data'];
                $amount = ($data['amount'] ?? 0) / 100; // Convert from kobo/cents

                return [
                    'success' => true,
                    'status' => $this->mapPaystackStatus($data['status'] ?? ''),
                    'amount' => $amount,
                    'currency' => $data['currency'] ?? 'NGN',
                    'gateway_fee' => ($data['fees'] ?? 0) / 100,
                ];
            }

            throw new \Exception($response['message'] ?? 'Verification failed');

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function processRefund(string $transactionId, float $amount): array
    {
        try {
            $config = $this->getConfig();
            $secretKey = $config['secret_key'] ?? '';

            $refundData = [
                'transaction' => $transactionId,
                'amount' => (int) ($amount * 100), // Convert to kobo/cents
            ];

            $response = $this->makeApiRequest('POST', '/refund', $refundData, $secretKey);

            if ($response['status'] === true) {
                return [
                    'success' => true,
                    'refund_id' => $response['data']['id'] ?? '',
                    'status' => 'processing',
                    'amount' => $amount,
                ];
            }

            throw new \Exception($response['message'] ?? 'Refund failed');

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function makeApiRequest(string $method, string $endpoint, array $data = [], string $secretKey = ''): array
    {
        $url = $this->apiBase . $endpoint;
        
        $args = [
            'method' => $method,
            'headers' => [
                'Authorization' => 'Bearer ' . $secretKey,
                'Content-Type' => 'application/json',
            ],
            'timeout' => 30,
        ];

        if (!empty($data) && in_array($method, ['POST', 'PUT', 'PATCH'])) {
            $args['body'] = json_encode($data);
        }

        $response = wp_remote_request($url, $args);

        if (is_wp_error($response)) {
            throw new \Exception('HTTP Error: ' . $response->get_error_message());
        }

        $statusCode = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $decodedBody = json_decode($body, true);

        if ($statusCode >= 400) {
            $errorMessage = $decodedBody['message'] ?? 'Unknown error';
            throw new \Exception("Paystack API Error ({$statusCode}): {$errorMessage}");
        }

        return $decodedBody ?? [];
    }

    private function generateReference($bookingId): string
    {
        return 'yatra_' . (string) $bookingId . '_' . time() . '_' . wp_generate_password(8, false);
    }

    private function mapPaystackStatus(string $paystackStatus): string
    {
        $statusMap = [
            'success' => 'completed',
            'failed' => 'failed',
            'abandoned' => 'cancelled',
            'pending' => 'pending',
        ];

        return $statusMap[$paystackStatus] ?? 'pending';
    }

    public function supportsTokenization(): bool
    {
        return true; // Paystack supports saving payment methods
    }

    public function supportsRecurring(): bool
    {
        return true; // Paystack supports recurring payments
    }
    
    /**
     * Get frontend data for JavaScript
     */
    public function getFrontendData(): array
    {
        return [
            'public_key' => $this->config['public_key'] ?? '',
            'payment_channels' => $this->config['payment_channels'] ?? ['card', 'bank', 'ussd'],
        ];
    }
    
    /**
     * Check if this gateway should handle the return request
     */
    public function shouldHandleReturn(array $params): bool
    {
        return !empty($params['trxref']) || !empty($params['reference']);
    }
    
    /**
     * Handle payment return from Paystack
     */
    public function handlePaymentReturn($booking, $bookingRepository): void
    {
        $reference = sanitize_text_field($_GET['trxref'] ?? $_GET['reference'] ?? '');
        
        if (empty($reference)) {
            return;
        }
        
        // Verify payment with Paystack
        $result = $this->verifyPayment($reference);
        
        if ($result['success'] && $result['status'] === 'completed') {
            $this->completePayment($booking, $bookingRepository, $reference, $result);
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
        $currency = $paymentData['currency'] ?? ($booking->currency ?? 'NGN');
        
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
        $payments_table = $wpdb->prefix . 'yatra_booking_payments';
        $wpdb->insert(
            $payments_table,
            [
                'booking_id' => $bookingId,
                'amount' => $amount,
                'currency' => $currency,
                'gateway' => 'paystack',
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
            'gateway' => 'paystack',
        ]);
    }
}
