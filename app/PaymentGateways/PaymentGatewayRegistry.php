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
     * Register built-in payment gateways
     * Order matters - Pay Later first, then popular gateways
     */
    private function registerBuiltInGateways(): void
    {
        $builtInGateways = [
            Gateways\PayLater\PayLaterGateway::class,      // Book Now Pay Later - First
            Gateways\Stripe\StripeGateway::class,          // Popular worldwide
            Gateways\PayPal\PayPalGateway::class,          // Popular worldwide
            Gateways\Razorpay\RazorpayGateway::class,      // Popular in India
            Gateways\Mollie\MollieGateway::class,          // Popular in Europe
            Gateways\Paystack\PaystackGateway::class,      // Popular in Africa
            Gateways\Square\SquareGateway::class,          // Popular in US/Canada
            Gateways\AuthorizeNet\AuthorizeNetGateway::class,  // Popular in US
            Gateways\BankTransfer\BankTransferGateway::class,  // Manual/Offline
            Gateways\Esewa\EsewaGateway::class,             // Popular in Nepal
            Gateways\Khalti\KhaltiGateway::class,           // Popular in Nepal
        ];

        foreach ($builtInGateways as $gatewayClass) {
            if (class_exists($gatewayClass)) {
                $this->register(new $gatewayClass());
            }
        }
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
     * Get gateway definitions for admin settings UI
     */
    public function getDefinitions(): array
    {
        $definitions = [];

        foreach ($this->gateways as $id => $gateway) {
            $config = $gateway->getConfig();
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
            ];
        }

        return $definitions;
    }

    /**
     * Get available gateways for checkout
     */
    public function getForCheckout(): array
    {
        $checkoutGateways = [];
        $available = $this->getAvailable();
        
        foreach ($available as $id => $gateway) {
            $config = $gateway->getConfig();
            $checkoutGateways[] = [
                'id' => $id,
                'title' => $gateway->getTitle(),
                'description' => $gateway->getDescription(),
                'icon' => $gateway->getIcon(),
                'is_offline' => $gateway->isOffline(),
                'supports' => $gateway->getSupports(),
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

        if (!$gateway->isAvailable()) {
            return [
                'success' => false,
                'error' => __('Payment gateway is not available', 'yatra'),
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

