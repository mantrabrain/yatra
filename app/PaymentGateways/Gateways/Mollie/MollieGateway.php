<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways\Gateways\Mollie;

use Yatra\PaymentGateways\AbstractPaymentGateway;

/**
 * Mollie Payment Gateway
 * Popular payment gateway in Europe supporting multiple payment methods
 */
class MollieGateway extends AbstractPaymentGateway
{
    protected string $id = 'mollie';
    protected string $title = 'Mollie';
    protected string $description = 'Accept payments via Mollie - iDEAL, Credit Card, SEPA, and more';
    protected string $icon = 'icon.svg';
    protected array $supports = ['credit_card', 'debit_card', 'ideal', 'sepa', 'bancontact', 'sofort', 'refunds', 'webhooks'];

    private string $apiBase = 'https://api.mollie.com/v2';

    public function getConfigFields(): array
    {
        return [
            [
                'id' => 'api_key',
                'type' => 'password',
                'label' => __('API Key', 'yatra'),
                'description' => __('Your Mollie API key (live or test)', 'yatra'),
                'placeholder' => 'live_... or test_...',
                'default' => '',
                'help_url' => 'https://my.mollie.com/dashboard/developers/api-keys',
                'help_text' => __('Get your API key from Mollie Dashboard > Developers > API keys', 'yatra'),
            ],
            [
                'id' => 'test_mode',
                'type' => 'checkbox',
                'label' => __('Test Mode', 'yatra'),
                'description' => __('Enable test mode for development', 'yatra'),
                'default' => '1',
            ],
            [
                'id' => 'webhook_url',
                'type' => 'text',
                'label' => __('Webhook URL', 'yatra'),
                'description' => __('Set this URL in your Mollie dashboard', 'yatra'),
                'default' => site_url('/wp-json/yatra/v1/payment/mollie/webhook'),
                'readonly' => true,
            ],
            [
                'id' => 'payment_methods',
                'type' => 'multiselect',
                'label' => __('Payment Methods', 'yatra'),
                'description' => __('Select which payment methods to enable', 'yatra'),
                'options' => [
                    'creditcard' => __('Credit Card', 'yatra'),
                    'ideal' => __('iDEAL', 'yatra'),
                    'bancontact' => __('Bancontact', 'yatra'),
                    'sofort' => __('SOFORT Banking', 'yatra'),
                    'eps' => __('EPS', 'yatra'),
                    'giropay' => __('Giropay', 'yatra'),
                    'paypal' => __('PayPal', 'yatra'),
                    'sepadirectdebit' => __('SEPA Direct Debit', 'yatra'),
                ],
                'default' => ['creditcard', 'ideal', 'paypal'],
            ],
        ];
    }

    public function isAvailable(): bool
    {
        $config = $this->getConfig();
        return !empty($config['api_key']) && $this->isEnabled();
    }

    public function processPayment(array $paymentData): array
    {
        try {
            $config = $this->getConfig();
            $apiKey = $config['api_key'] ?? '';
            
            if (empty($apiKey)) {
                throw new \Exception('Mollie API key not configured');
            }

            // Create payment with Mollie
            $paymentRequest = [
                'amount' => [
                    'currency' => $paymentData['currency'] ?? 'EUR',
                    'value' => number_format($paymentData['amount'], 2, '.', ''),
                ],
                'description' => $paymentData['description'] ?? 'Yatra Booking Payment',
                'redirectUrl' => $paymentData['return_url'] ?? '',
                'webhookUrl' => site_url('/wp-json/yatra/v1/payment/mollie/webhook'),
                'metadata' => [
                    'booking_id' => $paymentData['booking_id'] ?? '',
                    'customer_email' => $paymentData['customer_email'] ?? '',
                ],
            ];

            // Add payment method if specified
            if (!empty($paymentData['payment_method'])) {
                $paymentRequest['method'] = $paymentData['payment_method'];
            }

            $response = $this->makeApiRequest('POST', '/payments', $paymentRequest, $apiKey);

            if (isset($response['id'])) {
                return [
                    'success' => true,
                    'transaction_id' => $response['id'],
                    'redirect_url' => $response['_links']['checkout']['href'] ?? '',
                    'status' => $response['status'] ?? 'pending',
                ];
            }

            throw new \Exception('Invalid response from Mollie API');

        } catch (\Exception $e) {
            error_log('Mollie Payment Error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function handleWebhook(array $data): array
    {
        try {
            $paymentId = $data['id'] ?? '';
            if (empty($paymentId)) {
                throw new \Exception('No payment ID provided');
            }

            $config = $this->getConfig();
            $apiKey = $config['api_key'] ?? '';

            // Get payment details from Mollie
            $payment = $this->makeApiRequest('GET', "/payments/{$paymentId}", [], $apiKey);

            $status = $payment['status'] ?? '';
            $bookingId = $payment['metadata']['booking_id'] ?? '';

            return [
                'success' => true,
                'status' => $this->mapMollieStatus($status),
                'transaction_id' => $paymentId,
                'booking_id' => $bookingId,
                'amount' => (float) ($payment['amount']['value'] ?? 0),
                'currency' => $payment['amount']['currency'] ?? 'EUR',
            ];

        } catch (\Exception $e) {
            error_log('Mollie Webhook Error: ' . $e->getMessage());
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
            $apiKey = $config['api_key'] ?? '';

            $payment = $this->makeApiRequest('GET', "/payments/{$transactionId}", [], $apiKey);

            return [
                'success' => true,
                'status' => $this->mapMollieStatus($payment['status'] ?? ''),
                'amount' => (float) ($payment['amount']['value'] ?? 0),
                'currency' => $payment['amount']['currency'] ?? 'EUR',
            ];

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
            $apiKey = $config['api_key'] ?? '';

            $refundData = [
                'amount' => [
                    'currency' => 'EUR', // Should be dynamic based on original payment
                    'value' => number_format($amount, 2, '.', ''),
                ],
            ];

            $response = $this->makeApiRequest('POST', "/payments/{$transactionId}/refunds", $refundData, $apiKey);

            return [
                'success' => true,
                'refund_id' => $response['id'] ?? '',
                'status' => $response['status'] ?? 'pending',
                'amount' => (float) ($response['amount']['value'] ?? 0),
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function makeApiRequest(string $method, string $endpoint, array $data = [], string $apiKey = ''): array
    {
        $url = $this->apiBase . $endpoint;
        
        $args = [
            'method' => $method,
            'headers' => [
                'Authorization' => 'Bearer ' . $apiKey,
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
            $errorMessage = $decodedBody['detail'] ?? $decodedBody['title'] ?? 'Unknown error';
            throw new \Exception("Mollie API Error ({$statusCode}): {$errorMessage}");
        }

        return $decodedBody ?? [];
    }

    private function mapMollieStatus(string $mollieStatus): string
    {
        $statusMap = [
            'open' => 'pending',
            'pending' => 'pending',
            'authorized' => 'processing',
            'paid' => 'completed',
            'canceled' => 'cancelled',
            'expired' => 'failed',
            'failed' => 'failed',
        ];

        return $statusMap[$mollieStatus] ?? 'pending';
    }

    public function supportsTokenization(): bool
    {
        return false; // Mollie handles this differently
    }

    public function supportsRecurring(): bool
    {
        return true; // Mollie supports recurring payments
    }
}
