<?php

declare(strict_types=1);

namespace Yatra\Services;

/**
 * Payment service for handling payment processing
 */
class PaymentService
{
    /**
     * Process payment
     */
    public function processPayment(array $paymentData): array
    {
        try {
            // Validate payment data
            $this->validatePaymentData($paymentData);

            // Get payment gateway
            $gateway = $this->getPaymentGateway($paymentData['gateway']);

            // Process payment through gateway
            $result = $gateway->process($paymentData);

            // Save payment record
            $paymentId = $this->savePaymentRecord($paymentData, $result);

            return [
                'success' => true,
                'payment_id' => $paymentId,
                'transaction_id' => $result['transaction_id'] ?? null,
                'message' => __('Payment processed successfully!', 'yatra')
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Validate payment data
     */
    private function validatePaymentData(array $data): void
    {
        $required_fields = ['booking_id', 'amount', 'gateway', 'payment_method'];
        
        foreach ($required_fields as $field) {
            if (empty($data[$field])) {
                throw new \Exception(sprintf(__('Field %s is required.', 'yatra'), $field));
            }
        }

        // Validate amount
        if (!is_numeric($data['amount']) || $data['amount'] <= 0) {
            throw new \Exception(__('Invalid payment amount.', 'yatra'));
        }
    }

    /**
     * Get payment gateway
     */
    private function getPaymentGateway(string $gatewayName)
    {
        // For now, return a mock gateway
        // In a real implementation, this would load the appropriate gateway class
        return new MockPaymentGateway();
    }

    /**
     * Save payment record
     */
    private function savePaymentRecord(array $paymentData, array $result): int
    {
        global $wpdb;

        $data = [
            'booking_id' => (int) $paymentData['booking_id'],
            'payment_type' => $paymentData['payment_type'] ?? 'deposit',
            'amount' => (float) $paymentData['amount'],
            'currency' => $paymentData['currency'] ?? 'USD',
            'payment_method' => $paymentData['payment_method'],
            'gateway' => $paymentData['gateway'],
            'transaction_id' => $result['transaction_id'] ?? null,
            'gateway_transaction_id' => $result['gateway_transaction_id'] ?? null,
            'payment_status' => $result['status'] ?? 'pending',
            'gateway_response' => json_encode($result),
            'payment_date' => current_time('mysql'),
        ];

        $result = $wpdb->insert(
            $wpdb->prefix . 'yatra_payments',
            $data,
            [
                '%d', '%s', '%f', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s'
            ]
        );

        if (!$result) {
            throw new \Exception(__('Failed to save payment record.', 'yatra'));
        }

        return $wpdb->insert_id;
    }
}

/**
 * Mock payment gateway for testing
 */
class MockPaymentGateway
{
    /**
     * Process payment
     */
    public function process(array $data): array
    {
        // Simulate payment processing
        $success = rand(0, 10) > 2; // 80% success rate

        if ($success) {
            return [
                'status' => 'completed',
                'transaction_id' => 'TXN_' . time() . '_' . rand(1000, 9999),
                'gateway_transaction_id' => 'GT_' . time() . '_' . rand(1000, 9999),
                'message' => 'Payment processed successfully'
            ];
        } else {
            return [
                'status' => 'failed',
                'message' => 'Payment failed'
            ];
        }
    }
} 