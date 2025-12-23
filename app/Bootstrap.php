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

        try {
            // Register service providers first
            $this->registerServiceProviders();
            
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
            
            // Initialize Action Scheduler
            $this->initializeActionScheduler();
            
            // Initialize core components
            $this->initializeCore();
            
            // Set up WordPress hooks
            $this->setupWordPressHooks();

        } catch (\Exception $e) {
            // Log the error
            if (function_exists('error_log')) {
                error_log('Yatra plugin initialization error: ' . $e->getMessage());
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
        }
        
        if (class_exists('Yatra\Providers\RouteServiceProvider')) {
            $providers[] = 'Yatra\Providers\RouteServiceProvider';
        }
        
        if (is_admin() && class_exists('Yatra\Providers\AdminServiceProvider')) {
            $providers[] = 'Yatra\Providers\AdminServiceProvider';
        }

        // Register each provider
        foreach ($providers as $provider) {
            try {
                $providerInstance = new $provider($this->container);
                if (method_exists($providerInstance, 'register')) {
                    $providerInstance->register();
                }
            } catch (\Exception $e) {
                error_log("Failed to register provider {$provider}: " . $e->getMessage());
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
                error_log("Failed to boot provider {$provider}: " . $e->getMessage());
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
        global $wpdb;
        
        // Check if activities table exists
        $table_activities = $wpdb->prefix . 'yatra_activities';
        $activities_exists = $wpdb->get_var($wpdb->prepare(
            "SHOW TABLES LIKE %s",
            $table_activities
        )) === $table_activities;

        // Check if trips table exists
        $table_trips = $wpdb->prefix . 'yatra_trips';
        $trips_exists = $wpdb->get_var($wpdb->prepare(
            "SHOW TABLES LIKE %s",
            $table_trips
        )) === $table_trips;

        // Check if destinations table exists
        $table_destinations = $wpdb->prefix . 'yatra_destinations';
        $destinations_exists = $wpdb->get_var($wpdb->prepare(
            "SHOW TABLES LIKE %s",
            $table_destinations
        )) === $table_destinations;

        // Check if traveler categories table exists
        $table_traveler_categories = $wpdb->prefix . 'yatra_traveler_categories';
        $traveler_categories_exists = $wpdb->get_var($wpdb->prepare(
            "SHOW TABLES LIKE %s",
            $table_traveler_categories
        )) === $table_traveler_categories;

        // Check if item types table exists
        $table_item_types = $wpdb->prefix . 'yatra_item_types';
        $item_types_exists = $wpdb->get_var($wpdb->prepare(
            "SHOW TABLES LIKE %s",
            $table_item_types
        )) === $table_item_types;

        // Check if items table exists
        $table_items = $wpdb->prefix . 'yatra_items';
        $items_exists = $wpdb->get_var($wpdb->prepare(
            "SHOW TABLES LIKE %s",
            $table_items
        )) === $table_items;

        // Check if discounts table exists
        $table_discounts = $wpdb->prefix . 'yatra_discounts';
        $discounts_exists = $wpdb->get_var($wpdb->prepare(
            "SHOW TABLES LIKE %s",
            $table_discounts
        )) === $table_discounts;

        // Check if trip categories table exists
        $table_trip_categories = $wpdb->prefix . 'yatra_trip_categories';
        $trip_categories_exists = $wpdb->get_var($wpdb->prepare(
            "SHOW TABLES LIKE %s",
            $table_trip_categories
        )) === $table_trip_categories;

        // Check if difficulty levels table exists
        $table_difficulty_levels = $wpdb->prefix . 'yatra_difficulty_levels';
        $difficulty_levels_exists = $wpdb->get_var($wpdb->prepare(
            "SHOW TABLES LIKE %s",
            $table_difficulty_levels
        )) === $table_difficulty_levels;

        // Check if trip-trip-categories relation table exists
        $table_trip_trip_categories = $wpdb->prefix . 'yatra_trip_trip_categories';
        $trip_trip_categories_exists = $wpdb->get_var($wpdb->prepare(
            "SHOW TABLES LIKE %s",
            $table_trip_trip_categories
        )) === $table_trip_trip_categories;

        // Check if attributes table exists
        $table_attributes = $wpdb->prefix . 'yatra_attributes';
        $attributes_exists = $wpdb->get_var($wpdb->prepare(
            "SHOW TABLES LIKE %s",
            $table_attributes
        )) === $table_attributes;

        // If any table doesn't exist, create all tables
        if (
            !$activities_exists ||
            !$trips_exists ||
            !$destinations_exists ||
            !$traveler_categories_exists ||
            !$item_types_exists ||
            !$items_exists ||
            !$discounts_exists ||
            !$trip_categories_exists ||
            !$difficulty_levels_exists ||
            !$trip_trip_categories_exists ||
            !$attributes_exists
        ) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                $missing = [];
                if (!$activities_exists) $missing[] = 'activities';
                if (!$trips_exists) $missing[] = 'trips';
                if (!$destinations_exists) $missing[] = 'destinations';
                if (!$traveler_categories_exists) $missing[] = 'traveler_categories';
                if (!$item_types_exists) $missing[] = 'item_types';
                if (!$items_exists) $missing[] = 'items';
                if (!$discounts_exists) $missing[] = 'discounts';
                if (!$trip_categories_exists) $missing[] = 'trip_categories';
                if (!$difficulty_levels_exists) $missing[] = 'difficulty_levels';
                if (!$trip_trip_categories_exists) $missing[] = 'trip_trip_categories';
                if (!$attributes_exists) $missing[] = 'attributes';
                error_log('Yatra: Missing tables - ' . implode(', ', $missing));
            }
            
            Database::createTables();
            
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Yatra: Database tables created automatically');
            }
        }
        
        // Register migration routes
        add_action('rest_api_init', function() {
            if (class_exists('\Yatra\Migration\MigrationController')) {
                $migrationController = new \Yatra\Migration\MigrationController();
                $migrationController->registerRoutes();
            }
        });
        
        // Register Action Scheduler hook for background migration processing
        add_action('yatra_migrate_data_type', function($dataType, $force = false) {
            error_log("[Yatra Migration] Action Scheduler hook called for: {$dataType} (force=" . ($force ? 'true' : 'false') . ')');
            
            if (class_exists('\Yatra\Migration\MigrationProgress')) {
                $migrationService = new \Yatra\Migration\MigrationProgress();
                $result = $migrationService->processMigration($dataType, (bool) $force);
                error_log("[Yatra Migration] Migration result for {$dataType}: " . json_encode($result));
            } else {
                error_log("[Yatra Migration] ERROR: MigrationProgress class not found!");
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
     * Get container instance
     */
    public function getContainer(): Container
    {
        return $this->container;
    }
}

