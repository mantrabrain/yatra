<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways;

/**
 * Payment Gateway Interface
 * All payment gateways must implement this interface
 */
interface PaymentGatewayInterface
{
    /**
     * Get gateway unique ID
     */
    public function getId(): string;

    /**
     * Get gateway display title
     */
    public function getTitle(): string;

    /**
     * Get gateway description
     */
    public function getDescription(): string;

    /**
     * Get gateway icon URL
     */
    public function getIcon(): string;

    /**
     * Check if gateway is available/configured
     */
    public function isAvailable(): bool;

    /**
     * Check if this is an offline payment method
     */
    public function isOffline(): bool;

    /**
     * Get supported features
     * @return array e.g., ['credit_card', 'refunds', 'recurring', 'tokenization', 'scheduled_payments']
     */
    public function getSupports(): array;

    /**
     * Get configuration fields for admin settings
     * @return array Field definitions
     */
    public function getConfigFields(): array;

    /**
     * Get current configuration values
     */
    public function getConfig(): array;

    /**
     * Save configuration
     */
    public function saveConfig(array $config): bool;

    /**
     * Process payment
     * @param array $paymentData Payment details
     * @return array Result with success status and data
     */
    public function processPayment(array $paymentData): array;

    /**
     * Handle webhook/callback
     */
    public function handleWebhook(array $data): array;

    /**
     * Verify payment
     */
    public function verifyPayment(string $transactionId): array;

    /**
     * Process refund
     */
    public function processRefund(string $transactionId, float $amount): array;

    /**
     * Check if gateway supports tokenization (saving payment methods)
     */
    public function supportsTokenization(): bool;

    /**
     * Check if gateway supports recurring/scheduled payments
     */
    public function supportsRecurring(): bool;

    /**
     * Create a customer in the gateway (for storing payment methods)
     * @param array $customerData Customer details
     * @return array Result with customer_id
     */
    public function createCustomer(array $customerData): array;

    /**
     * Save payment method for future charges
     * @param string $customerId Gateway customer ID
     * @param array $paymentMethodData Payment method details
     * @return array Result with payment_method_id/token
     */
    public function savePaymentMethod(string $customerId, array $paymentMethodData): array;

    /**
     * Charge a saved payment method
     * @param string $customerId Gateway customer ID
     * @param string $paymentMethodId Saved payment method ID
     * @param array $paymentData Payment details (amount, currency, etc.)
     * @return array Result with transaction details
     */
    public function chargePaymentMethod(string $customerId, string $paymentMethodId, array $paymentData): array;

    /**
     * Delete a saved payment method
     * @param string $paymentMethodId Payment method ID to delete
     * @return array Result
     */
    public function deletePaymentMethod(string $paymentMethodId): array;

    /**
     * Get customer's saved payment methods
     * @param string $customerId Gateway customer ID
     * @return array List of saved payment methods
     */
    public function getPaymentMethods(string $customerId): array;
}

