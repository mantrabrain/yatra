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
     * @return array e.g., ['credit_card', 'refunds', 'recurring']
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
}

