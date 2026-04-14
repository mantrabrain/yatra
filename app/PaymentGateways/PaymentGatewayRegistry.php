<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways;

/**
 * Payment Gateway Registry
 * Manages registration and retrieval of payment gateways
 */
class PaymentGatewayRegistry
{
    private static ?PaymentGatewayRegistry $instance = null;
    private array $gateways = [];

    private function __construct()
    {
        // Register built-in gateways
        $this->registerBuiltInGateways();
        
        // Allow third-party plugins to register their gateways
        do_action('yatra_register_payment_gateways', $this);
    }

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Register built-in payment gateways (Free version)
     * Only PayLater and PayPal are included in free version
     * Premium gateways are registered by Yatra Pro via 'yatra_register_payment_gateways' hook
     */
    private function registerBuiltInGateways(): void
    {
        // Free gateways - always available
        $freeGateways = [
            Gateways\PayLater\PayLaterGateway::class,      // Book Now Pay Later - Free
            Gateways\PayPal\PayPalGateway::class,          // PayPal - Free
        ];

        foreach ($freeGateways as $gatewayClass) {
            if (class_exists($gatewayClass)) {
                $this->register(new $gatewayClass());
            }
        }
        
        // Premium gateways are registered by Yatra Pro plugin
        // via the 'yatra_register_payment_gateways' action hook
    }

    /**
     * Register a payment gateway
     */
    public function register(PaymentGatewayInterface $gateway): void
    {
        $this->gateways[$gateway->getId()] = $gateway;
    }

    /**
     * Get a specific gateway by ID
     */
    public function get(string $id): ?PaymentGatewayInterface
    {
        return $this->gateways[$id] ?? null;
    }

    /**
     * Get all registered gateways
     */
    public function getAll(): array
    {
        return $this->gateways;
    }

    /**
     * Get all enabled/available gateways
     */
    public function getAvailable(): array
    {
        return array_filter($this->gateways, fn($gateway) => $gateway->isAvailable());
    }

    /**
     * Gateways enabled in settings (may still lack API keys). Used for checkout UI.
     *
     * @return array<string, PaymentGatewayInterface>
     */
    public function getEnabledGateways(): array
    {
        return array_filter($this->gateways, fn($gateway) => $gateway->isEnabled());
    }

    /**
     * Get list of premium gateway IDs (requires Yatra Pro)
     */
    public function getPremiumGatewayIds(): array
    {
        return [
            'stripe',
            'razorpay',
            'mollie',
            'paystack',
            'square',
            'authorize_net',
            'bank_transfer',
        ];
    }
    
    /**
     * Check if a gateway is premium (requires Pro)
     */
    public function isPremiumGateway(string $gatewayId): bool
    {
        return in_array($gatewayId, $this->getPremiumGatewayIds(), true);
    }
    
    /**
     * Check if Yatra Pro is active
     */
    private function isProActive(): bool
    {
        return defined('YATRA_PRO_VERSION') && class_exists('YatraPro\Plugin');
    }

    /**
     * Get gateway definitions for admin settings UI
     * Shows all gateways (registered + premium placeholders) with Pro badges
     */
    public function getDefinitions(): array
    {
        $definitions = [];
        $isProActive = $this->isProActive();

        // Add registered gateways
        foreach ($this->gateways as $id => $gateway) {
            $config = $gateway->getConfig();
            $isPremium = $this->isPremiumGateway($id);
            
            $definitions[$id] = [
                'id' => $id,
                'title' => $gateway->getTitle(),
                'description' => $gateway->getDescription(),
                'icon' => $gateway->getIcon(),
                'sandbox_url' => $gateway->getSandboxUrl(),
                'is_offline' => $gateway->isOffline(),
                'supports' => $gateway->getSupports(),
                'fields' => $gateway->getConfigFields(),
                'config' => $config,
                'enabled' => !empty($config['enabled']),
                'is_premium' => $isPremium,
                'requires_pro' => $isPremium && !$isProActive,
            ];
        }
        
        // Add premium gateway placeholders if Pro is not active
        if (!$isProActive) {
            $premiumPlaceholders = $this->getPremiumGatewayPlaceholders();
            foreach ($premiumPlaceholders as $id => $placeholder) {
                // Only add if not already registered
                if (!isset($definitions[$id])) {
                    $definitions[$id] = $placeholder;
                }
            }
        }

        return $definitions;
    }
    
    /**
     * Get premium gateway placeholders for UI when Pro is not active
     */
    private function getPremiumGatewayPlaceholders(): array
    {
        return [
            'stripe' => [
                'id' => 'stripe',
                'title' => __('Stripe', 'yatra'),
                'description' => __('Accept credit card payments via Stripe', 'yatra'),
                'icon' => YATRA_PLUGIN_URL . 'assets/images/payment-gateways/stripe.svg',
                'sandbox_url' => '',
                'is_offline' => false,
                'supports' => ['refunds', 'subscriptions'],
                'fields' => [],
                'config' => ['enabled' => false],
                'enabled' => false,
                'is_premium' => true,
                'requires_pro' => true,
            ],
            'razorpay' => [
                'id' => 'razorpay',
                'title' => __('Razorpay', 'yatra'),
                'description' => __('Accept payments via Razorpay (India)', 'yatra'),
                'icon' => YATRA_PLUGIN_URL . 'assets/images/payment-gateways/razorpay.svg',
                'sandbox_url' => '',
                'is_offline' => false,
                'supports' => ['refunds'],
                'fields' => [],
                'config' => ['enabled' => false],
                'enabled' => false,
                'is_premium' => true,
                'requires_pro' => true,
            ],
            'mollie' => [
                'id' => 'mollie',
                'title' => __('Mollie', 'yatra'),
                'description' => __('Accept payments via Mollie (Europe)', 'yatra'),
                'icon' => YATRA_PLUGIN_URL . 'assets/images/payment-gateways/mollie.svg',
                'sandbox_url' => '',
                'is_offline' => false,
                'supports' => ['refunds'],
                'fields' => [],
                'config' => ['enabled' => false],
                'enabled' => false,
                'is_premium' => true,
                'requires_pro' => true,
            ],
            'paystack' => [
                'id' => 'paystack',
                'title' => __('Paystack', 'yatra'),
                'description' => __('Accept payments via Paystack (Africa)', 'yatra'),
                'icon' => YATRA_PLUGIN_URL . 'assets/images/payment-gateways/paystack.svg',
                'sandbox_url' => '',
                'is_offline' => false,
                'supports' => ['refunds'],
                'fields' => [],
                'config' => ['enabled' => false],
                'enabled' => false,
                'is_premium' => true,
                'requires_pro' => true,
            ],
            'square' => [
                'id' => 'square',
                'title' => __('Square', 'yatra'),
                'description' => __('Accept payments via Square (US/Canada)', 'yatra'),
                'icon' => YATRA_PLUGIN_URL . 'assets/images/payment-gateways/square.svg',
                'sandbox_url' => '',
                'is_offline' => false,
                'supports' => ['refunds'],
                'fields' => [],
                'config' => ['enabled' => false],
                'enabled' => false,
                'is_premium' => true,
                'requires_pro' => true,
            ],
            'authorize_net' => [
                'id' => 'authorize_net',
                'title' => __('Authorize.Net', 'yatra'),
                'description' => __('Accept payments via Authorize.Net (US)', 'yatra'),
                'icon' => YATRA_PLUGIN_URL . 'assets/images/payment-gateways/authorize-net.svg',
                'sandbox_url' => '',
                'is_offline' => false,
                'supports' => ['refunds'],
                'fields' => [],
                'config' => ['enabled' => false],
                'enabled' => false,
                'is_premium' => true,
                'requires_pro' => true,
            ],
            'bank_transfer' => [
                'id' => 'bank_transfer',
                'title' => __('Bank Transfer', 'yatra'),
                'description' => __('Accept manual bank transfer payments', 'yatra'),
                'icon' => YATRA_PLUGIN_URL . 'assets/images/payment-gateways/bank_transfer.svg',
                'sandbox_url' => '',
                'is_offline' => true,
                'supports' => [],
                'fields' => [],
                'config' => ['enabled' => false],
                'enabled' => false,
                'is_premium' => true,
                'requires_pro' => true,
            ],
        ];
    }

    /**
     * Gateways to show on checkout: all enabled in settings.
     * Configuration is validated when processing payment (see processPayment).
     */
    public function getForCheckout(): array
    {
        $checkoutGateways = [];

        foreach ($this->getEnabledGateways() as $id => $gateway) {
            $config = $gateway->getConfig();
            $checkoutGateways[] = [
                'id' => $id,
                'title' => !empty($config['title']) ? $config['title'] : $gateway->getTitle(),
                'description' => !empty($config['description']) ? $config['description'] : $gateway->getDescription(),
                'icon' => !empty($config['icon']) ? $config['icon'] : $gateway->getIcon(),
                'is_offline' => $gateway->isOffline(),
                'supports' => $gateway->getSupports(),
                'is_configured' => $gateway->isProperlyConfigured(),
            ];
        }

        return $checkoutGateways;
    }

    /**
     * Save gateway configuration
     */
    public function saveGatewayConfig(string $gatewayId, array $config): bool
    {
        $gateway = $this->get($gatewayId);
        if (!$gateway) {
            return false;
        }
        return $gateway->saveConfig($config);
    }

    /**
     * Process payment through a gateway
     */
    public function processPayment(string $gatewayId, array $paymentData): array
    {
        $gateway = $this->get($gatewayId);
        
        if (!$gateway) {
            return [
                'success' => false,
                'error' => __('Payment gateway not found', 'yatra'),
            ];
        }

        if (!$gateway->isEnabled()) {
            return [
                'success' => false,
                'error' => __('Payment gateway is not available', 'yatra'),
            ];
        }

        if (!$gateway->isProperlyConfigured()) {
            return [
                'success' => false,
                'error' => GatewayUserMessages::gatewayNotConfigured($gateway),
                'code' => 'gateway_not_configured',
            ];
        }

        return $gateway->processPayment($paymentData);
    }
    
    /**
     * Enqueue scripts for all available gateways
     */
    public function enqueueScripts(): void
    {
        foreach ($this->getAvailable() as $gateway) {
            if (method_exists($gateway, 'enqueueScripts')) {
                $gateway->enqueueScripts();
            }
        }
    }
    
    /**
     * Get frontend data for all available gateways
     */
    public function getFrontendData(): array
    {
        $data = [];
        
        foreach ($this->getAvailable() as $id => $gateway) {
            if (method_exists($gateway, 'getFrontendData')) {
                $data[$id] = $gateway->getFrontendData();
            }
        }
        
        return $data;
    }
}

