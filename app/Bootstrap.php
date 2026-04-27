<?php

declare(strict_types=1);

namespace Yatra;

use Yatra\Core\Container;
use Yatra\Core\Database;
use Yatra\Providers\AppServiceProvider;
use Yatra\Providers\RouteServiceProvider;
use Yatra\Providers\AdminServiceProvider;
use Yatra\Providers\FrontendAssetsProvider;
use Yatra\Compatibility\Compatibility;
use Yatra\Providers\BlockServiceProvider;

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

            if (class_exists('\Yatra\Hooks\MigrationAdminNoticeHooks')) {
                \Yatra\Hooks\MigrationAdminNoticeHooks::init();
            }

            // Initialize Setup Wizard Service
            if (class_exists('\Yatra\Services\SetupWizardService')) {
                \Yatra\Services\SetupWizardService::init();
            }

            // Centralized notices (React UI + WP admin notices)
            if (class_exists('\Yatra\Services\NoticeService')) {
                \Yatra\Services\NoticeService::init();
            }

            if (class_exists('\Yatra\Services\StatsUsage')) {
                \Yatra\Services\StatsUsage::instance()->init();
            }

            // Initialize Dynamic Pricing Service
            // DISABLED: Automatic dynamic pricing was adding 15% markup for trips with ≤5 spots
            // if (class_exists('\Yatra\Services\DynamicPricingService')) {
            //     \Yatra\Services\DynamicPricingService::init();
            // }

            // Initialize SEO Manager
            if (class_exists('\Yatra\Managers\SEOManager')) {
                \Yatra\Managers\SEOManager::init();
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

        } catch (\Throwable $e) {
            // Show admin notice if in admin area
            if (is_admin()) {
                add_action('admin_notices', function() use ($e) {
                    echo '<div class="notice notice-error"><p><strong>Yatra:</strong> ' .
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
        }

        $seoHelperPath = YATRA_PLUGIN_PATH . 'includes/seo-helper.php';
        if (file_exists($seoHelperPath)) {
            require_once $seoHelperPath;
        }
    }

    /**
     * Register and boot service providers.
     *
     * Each provider is instantiated once. The same instance is used for both
     * register() and boot() so that any hooks added during register() remain
     * attached to the object that boot() later acts on.
     */
    private function registerServiceProviders(): void
    {
        // Register third-party compatibility hooks (Elementor, etc.)
        // Must run on `plugins_loaded` so that other plugins (Elementor, etc.) are
        // guaranteed to have loaded their classes before we check class_exists().
        // Calling Compatibility::register() directly here runs before plugins_loaded
        // and class_exists('\Elementor\Plugin') will always be false at that point.
        if (!is_admin() && class_exists('Yatra\\Compatibility\\Compatibility')) {
            add_action('plugins_loaded', ['Yatra\\Compatibility\\Compatibility', 'register'], 20);
        }

        $providerClasses = [];

        // Core providers — always loaded
        if (class_exists('Yatra\Providers\AppServiceProvider')) {
            $providerClasses[] = 'Yatra\Providers\AppServiceProvider';
        }

        if (class_exists('Yatra\Providers\RouteServiceProvider')) {
            $providerClasses[] = 'Yatra\Providers\RouteServiceProvider';
        }

        // Admin-only providers
        if (is_admin() && class_exists('Yatra\Providers\AdminServiceProvider')) {
            $providerClasses[] = 'Yatra\Providers\AdminServiceProvider';
        }

        // Frontend-only providers
        if (!is_admin() && class_exists('Yatra\Providers\FrontendAssetsProvider')) {
            $providerClasses[] = 'Yatra\Providers\FrontendAssetsProvider';
        }

        // Shortcode provider (frontend + admin)
        if (class_exists('Yatra\Providers\ShortcodeServiceProvider')) {
            $providerClasses[] = 'Yatra\Providers\ShortcodeServiceProvider';
        }

        // Block provider (Gutenberg)
        if (class_exists('Yatra\Providers\BlockServiceProvider')) {
            $providerClasses[] = 'Yatra\Providers\BlockServiceProvider';
        }

        // Instantiate and register all providers, keeping a map of the instances
        // so boot() runs on the exact same object that register() did.
        $instances = [];

        foreach ($providerClasses as $class) {
            try {
                $instance = new $class($this->container);
                if (method_exists($instance, 'register')) {
                    $instance->register();
                }
                $instances[$class] = $instance;
            } catch (\Throwable $e) {
                continue;
            }
        }

        // Boot each successfully registered provider
        foreach ($instances as $class => $instance) {
            try {
                if (method_exists($instance, 'boot')) {
                    $instance->boot();
                }
            } catch (\Throwable $e) {
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
            // Temporarily manually require migration files until autoloader is fixed
            $migrationFiles = [
                __DIR__ . '/Migrations/MigrationController.php',
                __DIR__ . '/Migrations/MigrationProgress.php',
                __DIR__ . '/Migrations/MigrationDetector.php',
            ];
            
            foreach ($migrationFiles as $file) {
                if (file_exists($file)) {
                    require_once $file;
                }
            }
            
            if (class_exists('\Yatra\Migration\MigrationController')) {
                $migrationController = new \Yatra\Migration\MigrationController();
                $migrationController->registerRoutes();
            }
        });
        
        // Register Action Scheduler hook for background migration processing
        add_action('yatra_migrate_data_type', function($dataType, $force = false) {
            if (class_exists('\Yatra\Migration\MigrationProgress')) {
                $migrationService = new \Yatra\Migration\MigrationProgress();
                $result = $migrationService->processMigration($dataType, (bool) $force);
                

            }
        }, 10, 2);

        // Register background hook for all data types migration via cron
        add_action('yatra_migration_background_run', function($force = false) {
            if (class_exists('\Yatra\Migration\MigrationProgress')) {
                $migrationService = new \Yatra\Migration\MigrationProgress();
                $migrationService->migrateAllDirect((bool) $force);
            }
        }, 10, 1);
    }

    /**
     * Plugin activation
     */
    public function activate(): void
    {
        // Run centralized installer for all one-time actions (tables + settings)
        \Yatra\Services\InstallerService::install();
        
        // Set default options (only version tracking - other defaults handled by InstallerService)
        if (get_option('yatra_version') === false) {
            add_option('yatra_version', YATRA_VERSION);
        }
        
        // Set up setup wizard redirect for first-time activation
        if (get_option('yatra_setup_wizard_ran') !== '1') {
            set_transient('yatra_setup_wizard_redirect', 1, 30);
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

        if (version_compare($current_version, YATRA_VERSION, '<')) {
            Database::createTables();
            update_option('yatra_version', YATRA_VERSION);
        }

        \Yatra\Services\InstallerService::maybeBackfillEmailTemplateDefaults();
        \Yatra\Services\InstallerService::maybeNormalizeMigratedCouponDiscountStatuses();
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

