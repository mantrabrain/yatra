<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways\Gateways\Mollie;

use Yatra\Database\Tables\BookingsTable;
use Yatra\Database\Tables\BookingPaymentsTable;
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
    protected string $sandboxUrl = 'https://docs.mollie.com/overview/testing';
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
                'help_url_test' => 'https://docs.mollie.com/overview/testing',
                'help_url_live' => 'https://my.mollie.com/dashboard/developers/api-keys',
                'help_text' => __('Get your API key from Mollie Dashboard > Developers > API keys', 'yatra'),
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
            
            $bookingId = $paymentData['booking_id'] ?? 0;
            $reference = $paymentData['reference'] ?? '';
            
            // Build return URL - redirect back to confirmation page after payment
            $returnUrl = $paymentData['return_url'] ?? '';
            if (empty($returnUrl) && !empty($reference)) {
                $returnUrl = home_url('/booking-confirmation/' . $reference . '/?mollie=return');
            }
            
            // Build description
            $description = $paymentData['description'] ?? '';
            if (empty($description)) {
                $tripTitle = $paymentData['trip_title'] ?? '';
                $description = !empty($tripTitle) 
                    ? sprintf(__('Booking for %s', 'yatra'), $tripTitle)
                    : sprintf(__('Booking #%s', 'yatra'), $reference);
            }

            // Create payment with Mollie
            $paymentRequest = [
                'amount' => [
                    'currency' => $paymentData['currency'] ?? 'EUR',
                    'value' => number_format((float) $paymentData['amount'], 2, '.', ''),
                ],
                'description' => $description,
                'redirectUrl' => $returnUrl,
                'metadata' => [
                    'booking_id' => $bookingId,
                    'reference' => $reference,
                    'customer_email' => $paymentData['customer_email'] ?? '',
                ],
            ];
            
            // Only add webhook URL if site is publicly accessible (not localhost)
            $siteUrl = site_url();
            $isLocalhost = (strpos($siteUrl, 'localhost') !== false || 
                           strpos($siteUrl, '.local') !== false || 
                           strpos($siteUrl, '127.0.0.1') !== false);
            
            if (!$isLocalhost) {
                $paymentRequest['webhookUrl'] = site_url('/wp-json/yatra/v1/payment/mollie/webhook');
            }
            
            error_log('[Yatra Mollie] Creating payment: ' . print_r($paymentRequest, true));

            // Add Mollie-specific payment method if specified (not the generic payment_method field)
            // Mollie methods: creditcard, ideal, bancontact, sofort, etc.
            if (!empty($paymentData['mollie_method'])) {
                $paymentRequest['method'] = $paymentData['mollie_method'];
            }

            $response = $this->makeApiRequest('POST', '/payments', $paymentRequest, $apiKey);
            
            error_log('[Yatra Mollie] API Response: ' . print_r($response, true));

            if (isset($response['id'])) {
                $checkoutUrl = $response['_links']['checkout']['href'] ?? '';
                error_log('[Yatra Mollie] Checkout URL: ' . $checkoutUrl);
                
                return [
                    'success' => true,
                    'transaction_id' => $response['id'],
                    'redirect_url' => $checkoutUrl,
                    'status' => $response['status'] ?? 'pending',
                ];
            }

            $errorMessage = $response['detail'] ?? $response['title'] ?? 'Invalid response from Mollie API';
            throw new \Exception($errorMessage);

        } catch (\Exception $e) {
            error_log('[Yatra Mollie] Payment Error: ' . $e->getMessage());
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
    
    /**
     * Get frontend data for JavaScript
     */
    public function getFrontendData(): array
    {
        return [
            'payment_methods' => $this->config['payment_methods'] ?? ['creditcard', 'ideal', 'paypal'],
        ];
    }
    
    /**
     * Check if this gateway should handle the return request
     */
    public function shouldHandleReturn(array $params): bool
    {
        return isset($params['mollie']);
    }
    
    /**
     * Handle payment return from Mollie
     */
    public function handlePaymentReturn($booking, $bookingRepository): void
    {
        error_log('[Yatra Mollie] handlePaymentReturn called for booking: ' . ($booking->id ?? 'unknown'));
        
        // Get payment ID from booking's session ID
        $paymentId = $booking->payment_session_id ?? '';
        
        if (empty($paymentId)) {
            error_log('[Yatra Mollie] No payment_session_id found');
            return;
        }
        
        error_log('[Yatra Mollie] Verifying payment: ' . $paymentId);
        $result = $this->verifyPayment($paymentId);
        error_log('[Yatra Mollie] Verify result: ' . print_r($result, true));
        
        if ($result['success'] && $result['status'] === 'completed') {
            error_log('[Yatra Mollie] Payment completed, recording...');
            $this->completePayment($booking, $bookingRepository, $paymentId, $result);
        } else {
            error_log('[Yatra Mollie] Payment not completed. Status: ' . ($result['status'] ?? 'unknown'));
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
        $currency = $paymentData['currency'] ?? ($booking->currency ?? 'EUR');
        
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
                'gateway' => 'mollie',
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
            'gateway' => 'mollie',
        ]);
    }
}
