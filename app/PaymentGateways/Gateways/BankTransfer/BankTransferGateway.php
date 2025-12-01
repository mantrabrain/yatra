<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways\Gateways\Square;

use Yatra\PaymentGateways\AbstractPaymentGateway;

class BankTransferGateway extends AbstractPaymentGateway
{
    protected string $id = 'bank_transfer';
    protected string $title = 'Bank Transfer';
    protected string $description = 'Accept manual bank transfer payments';
    protected string $icon = 'bank-transfer.svg';
    protected bool $isOffline = true;
    protected array $supports = ['bank_transfer'];

    public function getConfigFields(): array
    {
        return [
            [
                'id' => 'bank_name',
                'type' => 'text',
                'label' => __('Bank Name', 'yatra'),
                'description' => __('Name of your bank', 'yatra'),
                'placeholder' => 'e.g., Chase Bank, HSBC...',
                'default' => '',
            ],
            [
                'id' => 'account_name',
                'type' => 'text',
                'label' => __('Account Name', 'yatra'),
                'description' => __('Name on the bank account', 'yatra'),
                'placeholder' => 'e.g., Yatra Travel Company',
                'default' => '',
            ],
            [
                'id' => 'account_number',
                'type' => 'text',
                'label' => __('Account Number', 'yatra'),
                'description' => __('Bank account number', 'yatra'),
                'placeholder' => 'e.g., 1234567890',
                'default' => '',
            ],
            [
                'id' => 'routing_code',
                'type' => 'text',
                'label' => __('Routing/SWIFT Code', 'yatra'),
                'description' => __('Bank routing number or SWIFT/BIC code', 'yatra'),
                'placeholder' => 'e.g., 021000021 or CHASUS33',
                'default' => '',
            ],
            [
                'id' => 'instructions',
                'type' => 'textarea',
                'label' => __('Additional Instructions', 'yatra'),
                'description' => __('Additional instructions shown to customers', 'yatra'),
                'default' => '',
            ],
        ];
    }

    public function processPayment(array $paymentData): array
    {
        $bookingId = $paymentData['booking_id'] ?? 0;
        
        return [
            'success' => true,
            'payment_method' => 'bank_transfer',
            'status' => 'pending',
            'bank_details' => [
                'bank_name' => $this->config['bank_name'] ?? '',
                'account_name' => $this->config['account_name'] ?? '',
                'account_number' => $this->config['account_number'] ?? '',
                'routing_code' => $this->config['routing_code'] ?? '',
            ],
            'instructions' => $this->config['instructions'] ?? __('Please transfer the amount to the bank account above and include your booking reference in the payment description.', 'yatra'),
            'reference' => 'BOOKING-' . $bookingId,
        ];
    }

    public function verifyPayment(string $transactionId): array
    {
        // Bank transfers are verified manually
        return ['success' => true, 'status' => 'pending_verification'];
    }
}

