<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways\Gateways\AuthorizeNet;

use Yatra\PaymentGateways\AbstractPaymentGateway;

class AuthorizeNetGateway extends AbstractPaymentGateway
{
    protected string $id = 'authorize_net';
    protected string $title = 'Authorize.net';
    protected string $description = 'Accept payments via Authorize.net';
    protected string $icon = 'authorize-net.svg';
    protected string $sandboxUrl = 'https://developer.authorize.net/hello_world/testing_guide.html';
    protected array $supports = ['credit_card', 'debit_card', 'refunds'];

    public function getConfigFields(): array
    {
        return [
            [
                'id' => 'api_login_id',
                'type' => 'text',
                'label' => __('API Login ID', 'yatra'),
                'description' => __('Your Authorize.net API login ID', 'yatra'),
                'default' => '',
                'help_url_test' => 'https://developer.authorize.net/hello_world/testing_guide.html',
                'help_url_live' => 'https://account.authorize.net/',
                'help_text' => __('Get your API Login ID from Authorize.net Merchant Interface', 'yatra'),
            ],
            [
                'id' => 'transaction_key',
                'type' => 'password',
                'label' => __('Transaction Key', 'yatra'),
                'description' => __('Your Authorize.net transaction key', 'yatra'),
                'default' => '',
                'help_url_test' => 'https://developer.authorize.net/hello_world/testing_guide.html',
                'help_url_live' => 'https://account.authorize.net/',
                'help_text' => __('Get your Transaction Key from Authorize.net Merchant Interface > Account > Settings', 'yatra'),
            ],
            [
                'id' => 'public_client_key',
                'type' => 'text',
                'label' => __('Public Client Key', 'yatra'),
                'description' => __('Your Authorize.net public client key for Accept.js', 'yatra'),
                'default' => '',
                'help_url_test' => 'https://developer.authorize.net/hello_world/testing_guide.html',
                'help_url_live' => 'https://account.authorize.net/',
                'help_text' => __('Get your Public Client Key from Authorize.net Merchant Interface > Account > Settings > Security Settings', 'yatra'),
            ],
        ];
    }
    
    private function getApiUrl(): string
    {
        return \Yatra\Services\SettingsService::isPaymentTestMode()
            ? 'https://apitest.authorize.net/xml/v1/request.api'
            : 'https://api.authorize.net/xml/v1/request.api';
    }
    
    public function isAvailable(): bool
    {
        $config = $this->getConfig();
        return !empty($config['api_login_id']) && 
               !empty($config['transaction_key']) && 
               !empty($config['public_client_key']) && 
               $this->isEnabled();
    }
    
    /**
     * Get frontend data for JavaScript
     */
    public function getFrontendData(): array
    {
        return [
            'api_login_id' => $this->config['api_login_id'] ?? '',
            'public_client_key' => $this->config['public_client_key'] ?? '',
            'test_mode' => \Yatra\Services\SettingsService::isPaymentTestMode(),
        ];
    }
    
    /**
     * Enqueue gateway scripts
     */
    public function enqueueScripts(): void
    {
        if (!$this->isAvailable()) {
            return;
        }
        
        wp_enqueue_script(
            'yatra-authorize-net',
            plugins_url('authorizenet.js', __FILE__),
            ['jquery'],
            '2.0.0',
            true
        );
    }

    public function processPayment(array $paymentData): array
    {
        $bookingId = $paymentData['booking_id'] ?? 0;
        $reference = $paymentData['reference'] ?? '';
        $amount = number_format((float) ($paymentData['amount'] ?? 0), 2, '.', '');
        $currency = $paymentData['currency'] ?? 'USD';
        $confirmationUrl = home_url('/booking-confirmation/' . $reference . '/');
        
        // Check if we have payment token from frontend (Accept.js)
        $dataDescriptor = $paymentData['authnet_data_descriptor'] ?? '';
        $dataValue = $paymentData['authnet_data_value'] ?? '';
        
        if (!empty($dataDescriptor) && !empty($dataValue)) {
            // Process payment with token
            $result = $this->createPayment([
                'data_descriptor' => $dataDescriptor,
                'data_value' => $dataValue,
                'amount' => $amount,
                'booking_id' => $bookingId,
            ]);
            
            if ($result['success']) {
                return [
                    'success' => true,
                    'transaction_id' => $result['transaction_id'] ?? '',
                    'status' => 'completed',
                    'redirect_url' => $confirmationUrl,
                ];
            }
            
            return $result;
        }
        
        // No token - return config for frontend to collect card via Accept.js
        return [
            'success' => true,
            'requires_action' => 'authorize_net_payment',
            'api_login_id' => $this->config['api_login_id'] ?? '',
            'public_client_key' => $this->config['public_client_key'] ?? '',
            'amount' => $amount,
            'currency' => $currency,
            'booking_id' => $bookingId,
            'booking_ref' => $reference,
            'confirmation_url' => $confirmationUrl,
            'test_mode' => \Yatra\Services\SettingsService::isPaymentTestMode(),
        ];
    }
    
    /**
     * Create payment after receiving payment nonce from Accept.js
     */
    public function createPayment(array $paymentData): array
    {
        $dataDescriptor = $paymentData['data_descriptor'] ?? '';
        $dataValue = $paymentData['data_value'] ?? '';
        $amount = number_format((float) ($paymentData['amount'] ?? 0), 2, '.', '');
        $bookingId = $paymentData['booking_id'] ?? 0;
        
        if (empty($dataDescriptor) || empty($dataValue)) {
            return ['success' => false, 'error' => __('Payment token is required', 'yatra')];
        }
        
        $request = [
            'createTransactionRequest' => [
                'merchantAuthentication' => [
                    'name' => $this->config['api_login_id'] ?? '',
                    'transactionKey' => $this->config['transaction_key'] ?? '',
                ],
                'refId' => 'booking_' . $bookingId,
                'transactionRequest' => [
                    'transactionType' => 'authCaptureTransaction',
                    'amount' => $amount,
                    'payment' => [
                        'opaqueData' => [
                            'dataDescriptor' => $dataDescriptor,
                            'dataValue' => $dataValue,
                        ],
                    ],
                    'order' => [
                        'invoiceNumber' => (string) $bookingId,
                        'description' => sprintf(__('Booking #%s', 'yatra'), $bookingId),
                    ],
                ],
            ],
        ];
        
        $response = $this->makeRequest($this->getApiUrl(), [
            'method' => 'POST',
            'headers' => ['Content-Type' => 'application/json'],
            'body' => wp_json_encode($request),
        ]);
        
        $body = $response['body'] ?? [];
        $messages = $body['messages'] ?? [];
        $transactionResponse = $body['transactionResponse'] ?? [];
        
        if (($messages['resultCode'] ?? '') !== 'Ok') {
            $error = $messages['message'][0]['text'] ?? __('Payment failed', 'yatra');
            return ['success' => false, 'error' => $error];
        }
        
        if (($transactionResponse['responseCode'] ?? '') !== '1') {
            $error = $transactionResponse['errors'][0]['errorText'] ?? __('Transaction declined', 'yatra');
            return ['success' => false, 'error' => $error];
        }
        
        return [
            'success' => true,
            'transaction_id' => $transactionResponse['transId'] ?? '',
            'auth_code' => $transactionResponse['authCode'] ?? '',
            'status' => 'completed',
            'amount' => (float) $amount,
        ];
    }

    public function verifyPayment(string $transactionId): array
    {
        $request = [
            'getTransactionDetailsRequest' => [
                'merchantAuthentication' => [
                    'name' => $this->config['api_login_id'] ?? '',
                    'transactionKey' => $this->config['transaction_key'] ?? '',
                ],
                'transId' => $transactionId,
            ],
        ];
        
        $response = $this->makeRequest($this->getApiUrl(), [
            'method' => 'POST',
            'headers' => ['Content-Type' => 'application/json'],
            'body' => wp_json_encode($request),
        ]);
        
        $body = $response['body'] ?? [];
        $transaction = $body['transaction'] ?? [];
        
        $status = $transaction['transactionStatus'] ?? '';
        $isSuccess = in_array($status, ['settledSuccessfully', 'capturedPendingSettlement']);
        
        return [
            'success' => $isSuccess,
            'status' => $isSuccess ? 'completed' : $status,
            'amount' => (float) ($transaction['settleAmount'] ?? 0),
        ];
    }
    
    public function processRefund(string $transactionId, float $amount): array
    {
        // Note: Authorize.net refunds require the last 4 digits of the card
        // This is a simplified version - full implementation would need card info
        $request = [
            'createTransactionRequest' => [
                'merchantAuthentication' => [
                    'name' => $this->config['api_login_id'] ?? '',
                    'transactionKey' => $this->config['transaction_key'] ?? '',
                ],
                'transactionRequest' => [
                    'transactionType' => 'refundTransaction',
                    'amount' => number_format($amount, 2, '.', ''),
                    'refTransId' => $transactionId,
                ],
            ],
        ];
        
        $response = $this->makeRequest($this->getApiUrl(), [
            'method' => 'POST',
            'headers' => ['Content-Type' => 'application/json'],
            'body' => wp_json_encode($request),
        ]);
        
        $body = $response['body'] ?? [];
        $messages = $body['messages'] ?? [];
        $transactionResponse = $body['transactionResponse'] ?? [];
        
        if (($messages['resultCode'] ?? '') !== 'Ok') {
            $error = $messages['message'][0]['text'] ?? __('Refund failed', 'yatra');
            return ['success' => false, 'error' => $error];
        }
        
        return [
            'success' => true,
            'refund_id' => $transactionResponse['transId'] ?? '',
        ];
    }
}

