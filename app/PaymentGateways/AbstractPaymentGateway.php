<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways;

/**
 * Abstract Payment Gateway
 * Base class for all payment gateways
 */
abstract class AbstractPaymentGateway implements PaymentGatewayInterface
{
    protected string $id;
    protected string $title;
    protected string $description;
    protected string $icon = '';
    protected bool $isOffline = false;
    protected array $supports = [];
    protected array $config = [];

    public function __construct()
    {
        $this->loadConfig();
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function getIcon(): string
    {
        // If icon is a relative path (starts with /), convert to full URL
        if (!empty($this->icon) && strpos($this->icon, 'http') !== 0) {
            return plugins_url('public/images/gateways/' . $this->icon, dirname(__DIR__, 2) . '/yatra.php');
        }
        return $this->icon;
    }

    public function isOffline(): bool
    {
        return $this->isOffline;
    }

    public function getSupports(): array
    {
        return $this->supports;
    }

    public function getConfig(): array
    {
        return $this->config;
    }

    /**
     * Load configuration from database
     */
    protected function loadConfig(): void
    {
        $allConfigs = get_option('yatra_gateway_configs', []);
        if (is_string($allConfigs)) {
            $allConfigs = maybe_unserialize($allConfigs);
        }
        $this->config = $allConfigs[$this->id] ?? $this->getDefaultConfig();
    }

    /**
     * Get default configuration
     */
    protected function getDefaultConfig(): array
    {
        $defaults = ['enabled' => false];
        foreach ($this->getConfigFields() as $field) {
            $defaults[$field['id']] = $field['default'] ?? '';
        }
        return $defaults;
    }

    public function saveConfig(array $config): bool
    {
        $allConfigs = get_option('yatra_gateway_configs', []);
        if (is_string($allConfigs)) {
            $allConfigs = maybe_unserialize($allConfigs);
        }
        $allConfigs[$this->id] = array_merge($this->config, $config);
        return update_option('yatra_gateway_configs', $allConfigs);
    }

    public function isAvailable(): bool
    {
        return !empty($this->config['enabled']);
    }

    /**
     * Get option key for this gateway
     */
    protected function getOptionKey(): string
    {
        return 'yatra_gateway_' . $this->id;
    }

    /**
     * Make HTTP request
     */
    protected function makeRequest(string $url, array $options = []): array
    {
        $response = wp_remote_request($url, $options);

        if (is_wp_error($response)) {
            return [
                'success' => false,
                'error' => $response->get_error_message(),
            ];
        }

        $body = wp_remote_retrieve_body($response);
        $code = wp_remote_retrieve_response_code($response);

        return [
            'success' => $code >= 200 && $code < 300,
            'code' => $code,
            'body' => json_decode($body, true) ?: $body,
        ];
    }

    /**
     * Log gateway activity
     */
    protected function log(string $message, array $context = []): void
    {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(sprintf('[Yatra %s] %s: %s', $this->id, $message, json_encode($context)));
        }
    }

    // Default implementations that can be overridden
    public function handleWebhook(array $data): array
    {
        return ['success' => true];
    }

    public function processRefund(string $transactionId, float $amount): array
    {
        return [
            'success' => false,
            'error' => __('Refunds not supported by this gateway', 'yatra'),
        ];
    }
}

