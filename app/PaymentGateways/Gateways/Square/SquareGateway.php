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
            ],
            [
                'id' => 'access_token',
                'type' => 'password',
                'label' => __('Access Token', 'yatra'),
                'description' => __('Your Square access token', 'yatra'),
                'placeholder' => 'EAA...',
                'default' => '',
            ],
            [
                'id' => 'location_id',
                'type' => 'text',
                'label' => __('Location ID', 'yatra'),
                'description' => __('Your Square location ID', 'yatra'),
                'placeholder' => '...',
                'default' => '',
            ],
            [
                'id' => 'sandbox',
                'type' => 'checkbox',
                'label' => __('Sandbox Mode', 'yatra'),
                'description' => __('Use Square sandbox for testing', 'yatra'),
                'default' => true,
            ],
        ];
    }

    public function processPayment(array $paymentData): array
    {
        // Square implementation
        return [
            'success' => true,
            'application_id' => $this->config['application_id'] ?? '',
            'location_id' => $this->config['location_id'] ?? '',
        ];
    }

    public function verifyPayment(string $transactionId): array
    {
        return ['success' => true, 'status' => 'completed'];
    }
}

