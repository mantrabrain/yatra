<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways\Gateways\Square;

use Yatra\PaymentGateways\AbstractPaymentGateway;

class EsewaGateway extends AbstractPaymentGateway
{
    protected string $id = 'esewa';
    protected string $title = 'eSewa';
    protected string $description = 'Accept payments via eSewa (Nepal)';
    protected string $icon = 'esewa.svg';
    protected array $supports = ['wallet'];

    public function getConfigFields(): array
    {
        return [
            [
                'id' => 'merchant_code',
                'type' => 'text',
                'label' => __('Merchant Code', 'yatra'),
                'description' => __('Your eSewa merchant code', 'yatra'),
                'placeholder' => 'EPAYTEST',
                'default' => '',
            ],
            [
                'id' => 'secret_key',
                'type' => 'password',
                'label' => __('Secret Key', 'yatra'),
                'description' => __('Your eSewa secret key for verification', 'yatra'),
                'default' => '',
            ],
            [
                'id' => 'test_mode',
                'type' => 'checkbox',
                'label' => __('Test Mode', 'yatra'),
                'description' => __('Use eSewa sandbox for testing', 'yatra'),
                'default' => true,
            ],
        ];
    }

    private function getBaseUrl(): string
    {
        return !empty($this->config['test_mode']) 
            ? 'https://uat.esewa.com.np/epay/main' 
            : 'https://esewa.com.np/epay/main';
    }

    public function processPayment(array $paymentData): array
    {
        $amount = (float) ($paymentData['amount'] ?? 0);
        $bookingId = $paymentData['booking_id'] ?? 0;
        $callbackUrl = rest_url('yatra/v1/payment/callback/esewa');

        return [
            'success' => true,
            'redirect' => true,
            'payment_url' => $this->getBaseUrl(),
            'form_data' => [
                'amt' => $amount,
                'pdc' => 0,
                'psc' => 0,
                'txAmt' => 0,
                'tAmt' => $amount,
                'pid' => 'booking_' . $bookingId,
                'scd' => $this->config['merchant_code'] ?? 'EPAYTEST',
                'su' => $callbackUrl . '?booking_id=' . $bookingId . '&status=success',
                'fu' => $callbackUrl . '?booking_id=' . $bookingId . '&status=failed',
            ],
        ];
    }

    public function verifyPayment(string $transactionId): array
    {
        return ['success' => true];
    }
}

