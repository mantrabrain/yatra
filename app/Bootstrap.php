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
        // Check and create database tables if they don't exist
        $this->ensureDatabaseTables();
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

        // If any table doesn't exist, create all tables
        if (!$activities_exists || !$trips_exists || !$destinations_exists || !$traveler_categories_exists || !$item_types_exists || !$items_exists || !$discounts_exists) {
            Database::createTables();
            
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Yatra: Database tables created automatically');
            }
        }
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

