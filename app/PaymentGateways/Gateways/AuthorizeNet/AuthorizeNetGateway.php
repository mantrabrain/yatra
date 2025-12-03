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
    protected array $supports = ['credit_card', 'debit_card'];

    public function getConfigFields(): array
    {
        return [
            [
                'id' => 'api_login_id',
                'type' => 'text',
                'label' => __('API Login ID', 'yatra'),
                'description' => __('Your Authorize.net API login ID', 'yatra'),
                'default' => '',
            ],
            [
                'id' => 'transaction_key',
                'type' => 'password',
                'label' => __('Transaction Key', 'yatra'),
                'description' => __('Your Authorize.net transaction key', 'yatra'),
                'default' => '',
            ],
        ];
    }

    public function processPayment(array $paymentData): array
    {
        return ['success' => true, 'requires_form' => true];
    }

    public function verifyPayment(string $transactionId): array
    {
        return ['success' => true];
    }
}

