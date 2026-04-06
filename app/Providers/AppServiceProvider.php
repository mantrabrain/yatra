<?php

namespace Yatra\Providers;

use WP_REST_Request;
use Yatra\Core\Database;
use Yatra\Core\ServiceProvider;

/**
 * Service provider for Yatra plugin
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Register services
     */
    public function register(): void
    {
   

        // Activation hook
        register_activation_hook(YATRA_PLUGIN_FILE, [$this, 'activate']);
        
        // Deactivation hook
        register_deactivation_hook(YATRA_PLUGIN_FILE, [$this, 'deactivate']);

        // Initialize database tables
        $this->initDatabase();

        // Register shortcodes
        $this->registerShortcodes();

        // Blocks are registered in Bootstrap, not here

        // Initialize template loader for all frontend routing
        \Yatra\Core\TemplateLoader::init();

        // Initialize ItineraryCostService for free itinerary costs feature
        \Yatra\Services\ItineraryCostService::init();

        // Ensure frontend bundles are marked as ES modules
        add_filter('script_loader_tag', [$this, 'addFrontendModuleType'], 10, 2);

        // Initialize utility hooks (admin bar, etc.)
        \Yatra\Hooks\UtilsHooks::init();

        // Initialize review and enquiry hooks
        \Yatra\Hooks\ReviewHooks::init();

        // Initialize REST API hooks
        \Yatra\Hooks\RestApiHooks::init();

        // Initialize cron hooks (trip lifecycle, etc.)
        \Yatra\Hooks\CronHooks::init();

        // Initialize notification hooks
        \Yatra\Hooks\NotificationHooks::init();

        // Initialize review reminder service
        \Yatra\Services\ReviewReminderService::init();

        // Initialize availability inventory hooks
        \Yatra\Hooks\AvailabilityInventoryHooks::init();

        // Initialize cache hooks
        \Yatra\Hooks\CacheHooks::init();

        add_filter('yatra_require_email_verification', static function (): bool {
            return \Yatra\Services\SettingsService::isEnabled('require_email_verification');
        });
    }

    /**
     * Initialize database tables
     */
    private function initDatabase(): void
    {
        // Check if tables exist, create them if they don't
        $missing_table = false;
        $required_tables = \Yatra\Services\InstallerService::getRequiredTables();

        global $wpdb;
        foreach ($required_tables as $table) {
            // $table already includes prefix from Table class
            if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
                $missing_table = true;
                break;
            }
        }

        if ($missing_table) {
            // Use centralized InstallerService for table creation
            \Yatra\Services\InstallerService::createDatabaseTables();
        }

        // Always run updateTables to ensure schema is up to date
        // This handles migrations for existing installations
        Database::updateTables();
    }

    /**
     * Plugin activation
     */
    public function activate(): void
    {
        // Flush rewrite rules
        flush_rewrite_rules();
        
        // Run installer for fresh installation setup (centralized location)
        \Yatra\Services\InstallerService::install();
    }

    /**
     * Plugin deactivation
     */
    public function deactivate(): void
    {
        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Set default options
     */
    private function setDefaultOptions(): void
    {
        $defaults = [
            'yatra_currency' => 'USD',
            'yatra_currency_position' => 'before',
            'yatra_decimal_places' => 2,
            'yatra_thousand_separator' => ',',
            'yatra_decimal_separator' => '.',
            'yatra_trip_base' => 'trip',
            'yatra_destination_base' => 'destination',
            'yatra_activity_base' => 'activity',
            'yatra_trip_category_base' => 'trip-category',
            'yatra_booking_base' => 'bookings',
            'yatra_use_booking_page' => false,
            'yatra_customer_account_page' => '/my-account',
            'yatra_auto_approve_reviews' => false,
            'yatra_enable_reviews' => true,
            'yatra_enable_enquiries' => true,
            'yatra_enable_wishlist' => false,
            'yatra_enable_coupons' => false,
            'yatra_enable_dynamic_pricing' => false,
            'yatra_enable_additional_services' => false,
            'yatra_company_name' => get_bloginfo('name'),
            'yatra_company_email' => get_option('admin_email'),
            'yatra_company_phone' => '',
            'yatra_company_address' => '',
            'yatra_date_format' => get_option('date_format'),
            'yatra_time_format' => get_option('time_format'),
        ];

        foreach ($defaults as $option => $default) {
            if (get_option($option) === false) {
                update_option($option, $default);
            }
        }
    }

    /**
     * Register shortcodes
     */
    public function registerShortcodes(): void
    {
        // Initialize shortcode classes
        $shortcodes = [
            new \Yatra\Shortcodes\MyAccountShortcode(),
            new \Yatra\Shortcodes\TripShortcode(),
        ];

        foreach ($shortcodes as $shortcode) {
            $shortcode->register();
        }
    }

    
    /**
     * Add type="module" to frontend React bundles
     */
    public function addFrontendModuleType(string $tag, string $handle): string
    {
        static $module_handles = ['yatra-account-page'];

        if (in_array($handle, $module_handles, true)) {
            if (strpos($tag, 'type="module"') === false && strpos($tag, "type='module'") === false) {
                $tag = str_replace('<script ', '<script type="module" ', $tag);
            }
        }

        return $tag;
    }

}
