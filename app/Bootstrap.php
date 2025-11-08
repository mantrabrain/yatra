<?php

declare(strict_types=1);

namespace Yatra;

use Yatra\Core\Container;
use Yatra\Core\Database;
use Yatra\Providers\AppServiceProvider;
use Yatra\Providers\RouteServiceProvider;
use Yatra\Providers\AdminServiceProvider;

/**
 * Main Bootstrap class for Yatra plugin
 */
class Bootstrap
{
    /**
     * @var Container
     */
    private Container $container;

    /**
     * @var bool
     */
    private bool $initialized = false;

    /**
     * Bootstrap constructor
     */
    public function __construct()
    {
        $this->container = new Container();
    }

    /**
     * Initialize the plugin
     */
    public function init(): void
    {
        if ($this->initialized) {
            return;
        }

        // Register service providers
        $this->registerServiceProviders();

        // Initialize core components
        $this->initializeCore();

        // Set up WordPress hooks
        $this->setupWordPressHooks();

        $this->initialized = true;
    }

    /**
     * Register service providers
     */
    private function registerServiceProviders(): void
    {
        $providers = [
            AppServiceProvider::class,
            RouteServiceProvider::class,
            AdminServiceProvider::class,
        ];

        foreach ($providers as $provider) {
            if (class_exists($provider)) {
                $serviceProvider = new $provider($this->container);
                $serviceProvider->register();
            }
        }
        
        // Boot all service providers after registration
        foreach ($providers as $provider) {
            if (class_exists($provider)) {
                $serviceProvider = new $provider($this->container);
                $serviceProvider->boot();
            }
        }
    }

    /**
     * Initialize core components
     */
    private function initializeCore(): void
    {
        // Initialize database connection if needed
        // Can be added here when database service is created
    }

    /**
     * Set up WordPress hooks
     */
    private function setupWordPressHooks(): void
    {
        // Activation and deactivation hooks
        register_activation_hook(YATRA_PLUGIN_FILE, [$this, 'activate']);
        register_deactivation_hook(YATRA_PLUGIN_FILE, [$this, 'deactivate']);
    }

    /**
     * Plugin activation
     */
    public function activate(): void
    {
        // Create database tables
        Database::createTables();
        
        // Set default options
        if (get_option('yatra_version') === false) {
            add_option('yatra_version', YATRA_VERSION);
        }
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Plugin deactivation
     */
    public function deactivate(): void
    {
        // Clean up if needed
        flush_rewrite_rules();
    }

    /**
     * Get container instance
     */
    public function getContainer(): Container
    {
        return $this->container;
    }
}

