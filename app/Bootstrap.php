<?php

declare(strict_types=1);

namespace Yatra;

use Yatra\Core\Container;
use Yatra\Core\Database;
use Yatra\Providers\AppServiceProvider;
use Yatra\Providers\RouteServiceProvider;
use Yatra\Providers\AdminServiceProvider;
use Yatra\Providers\FrontendAssetsProvider;

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

        try {
            // Register service providers first
            $this->registerServiceProviders();

            // Load helper functions (must be loaded after autoloader)
            $this->loadHelperFunctions();
            
            // Initialize cache hooks
            if (class_exists('\Yatra\Hooks\CacheHooks')) {
                \Yatra\Hooks\CacheHooks::init();
            }

            if (class_exists('\Yatra\Hooks\AvailabilityInventoryHooks')) {
                \Yatra\Hooks\AvailabilityInventoryHooks::init();
            }
            
            // Initialize Setup Wizard Service
            if (class_exists('\Yatra\Services\SetupWizardService')) {
                \Yatra\Services\SetupWizardService::init();
            }

            // Initialize Dynamic Pricing Service
            if (class_exists('\Yatra\Services\DynamicPricingService')) {
                \Yatra\Services\DynamicPricingService::init();
            }

            
            // Register Setup Service activation hook
            if (class_exists('\Yatra\Services\SetupService')) {
                \Yatra\Services\SetupService::registerActivationHook();
            }
            
            // Initialize Action Scheduler
            $this->initializeActionScheduler();
            
            // Initialize REST API hooks
            if (class_exists('\Yatra\Hooks\RestApiHooks')) {
                \Yatra\Hooks\RestApiHooks::init();
            }
            
            // Initialize core components
            $this->initializeCore();
            
            // Set up WordPress hooks
            $this->setupWordPressHooks();
            
            // Load text domain
            $this->loadTextDomain();

        } catch (\Exception $e) {
            // Log the error
            if (function_exists('error_log')) {
                }
            
            // Show admin notice if in admin area
            if (is_admin()) {
                add_action('admin_notices', function() use ($e) {
                    echo '<div class="notice notice-error"><p>Yatra plugin failed to initialize: ' . 
                         esc_html($e->getMessage()) . '</p></div>';
                });
            }
            
            return;
        }

        $this->initialized = true;
    }

    /**
     * Load helper functions
     */
    private function loadHelperFunctions(): void
    {
        $helpersPath = YATRA_PLUGIN_PATH . 'includes/helpers.php';
        if (file_exists($helpersPath)) {
            require_once $helpersPath;
        } else {
            }
        
        $seoHelperPath = YATRA_PLUGIN_PATH . 'includes/seo-helper.php';
        if (file_exists($seoHelperPath)) {
            require_once $seoHelperPath;
        } else {
            }
    }

    /**
     * Register service providers
     */
    /**
     * Register and boot service providers
     */
    private function registerServiceProviders(): void
    {
        $providers = [];
        
        // Core providers
        if (class_exists('Yatra\Providers\AppServiceProvider')) {
            $providers[] = 'Yatra\Providers\AppServiceProvider';
        } else {
            }
        
        if (class_exists('Yatra\Providers\RouteServiceProvider')) {
            $providers[] = 'Yatra\Providers\RouteServiceProvider';
        }
        
        if (is_admin() && class_exists('Yatra\Providers\AdminServiceProvider')) {
            $providers[] = 'Yatra\Providers\AdminServiceProvider';
        }

        // Frontend assets provider (always load for frontend asset management)
        if (!is_admin() && class_exists('Yatra\Providers\FrontendAssetsProvider')) {
            $providers[] = 'Yatra\Providers\FrontendAssetsProvider';
        }

        // Register each provider
        foreach ($providers as $provider) {
            try {
                $providerInstance = new $provider($this->container);
                if (method_exists($providerInstance, 'register')) {
                    $providerInstance->register();
                }
            } catch (\Exception $e) {
                continue;
            }
        }
        
        // Boot each provider
        foreach ($providers as $provider) {
            try {
                $providerInstance = $this->container->get($provider);
                if (method_exists($providerInstance, 'boot')) {
                    $providerInstance->boot();
                }
            } catch (\Exception $e) {
                continue;
            }
        }
    }

    /**
     * Initialize Action Scheduler
     */
    private function initializeActionScheduler(): void
    {
        $actionSchedulerPath = YATRA_PLUGIN_PATH . 'vendor/woocommerce/action-scheduler/action-scheduler.php';
        if (file_exists($actionSchedulerPath)) {
            require_once $actionSchedulerPath;
        }
    }

    /**
     * Initialize core components
     */
    private function initializeCore(): void
    {
        // Check and create database tables if they don't exist
        $this->ensureDatabaseTables();
    }

    /**
     * Setup WordPress hooks
     */
    private function setupWordPressHooks(): void
    {
        // Register activation/deactivation hooks
        register_activation_hook(YATRA_PLUGIN_FILE, [$this, 'activate']);
        register_deactivation_hook(YATRA_PLUGIN_FILE, [$this, 'deactivate']);
        
        // Check for plugin upgrades
        add_action('admin_init', [$this, 'upgrade']);
    }

    /**
     * Ensure database tables exist
     */
    private function ensureDatabaseTables(): void
    {

        // Register migration routes
        add_action('rest_api_init', function() {
            if (class_exists('\Yatra\Migrations\MigrationController')) {
                $migrationController = new \Yatra\Migrations\MigrationController();
                $migrationController->registerRoutes();
            }
        });
        
        // Register Action Scheduler hook for background migration processing
        add_action('yatra_migrate_data_type', function($dataType, $force = false) {
            if (class_exists('\Yatra\Migrations\MigrationProgress')) {
                $migrationService = new \Yatra\Migrations\MigrationProgress();
                $result = $migrationService->processMigration($dataType, (bool) $force);
                } else {
                }
        }, 10, 2);
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
     * Plugin upgrade logic
     */
    public function upgrade(): void
    {
        $current_version = get_option('yatra_version', '1.0.0');
        
        if (version_compare($current_version, '3.0.0', '<')) {
            // Create any new tables added in v3.0.0
            Database::createTables();
            
            // Update version
            update_option('yatra_version', YATRA_VERSION);
        }
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
     * Load plugin text domain
     */
    public function loadTextDomain(): void
    {
        $locale = determine_locale();
        
        // Unload any existing text domain
        unload_textdomain('yatra');
        
        // Load from WordPress languages directory first (where Loco Translate saves files)
        load_textdomain('yatra', WP_LANG_DIR . '/plugins/yatra-' . $locale . '.mo');
        
        // Also check loco subdirectory
        if (file_exists(WP_LANG_DIR . '/loco/plugins/yatra-' . $locale . '.mo')) {
            load_textdomain('yatra', WP_LANG_DIR . '/loco/plugins/yatra-' . $locale . '.mo');
        }
        
        // Load from plugin directory (fallback)
        load_plugin_textdomain('yatra', false, 'i18n/languages');
    }

    /**
     * Get container instance
     */
    public function getContainer(): Container
    {
        return $this->container;
    }
}

