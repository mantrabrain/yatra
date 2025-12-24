<?php

declare(strict_types=1);

namespace Yatra\Providers;

use Yatra\Core\ServiceProvider;
use Yatra\Core\Container;
use Yatra\Core\Modules\ModuleManager;

/**
 * Admin Service Provider
 * Handles admin menu, assets, and pages
 */
class AdminServiceProvider extends ServiceProvider
{
    /**
     * Register services
     */
    public function register(): void
    {
        // Register admin menu
        add_action('admin_menu', [$this, 'registerAdminMenu']);

        // Enqueue admin assets - use priority 5 to run before other plugins
        add_action('admin_enqueue_scripts', [$this, 'enqueueAdminAssets'], 5);
        
        // Add module type to script tag
        add_filter('script_loader_tag', [$this, 'addModuleTypeToScript'], 10, 2);
        
        // Remove admin wrapper for our page
        add_action('admin_init', [$this, 'removeAdminWrapper']);
    }
    
    /**
     * Add type="module" attribute to yatra-admin script
     */
    public function addModuleTypeToScript(string $tag, string $handle): string
    {
        if ($handle === 'yatra-admin') {
            // Check if type="module" is already present
            if (strpos($tag, 'type="module"') === false && strpos($tag, "type='module'") === false) {
                // Replace the script tag to add type="module"
                $tag = str_replace('<script ', '<script type="module" ', $tag);
            }
        }
        return $tag;
    }
    
    /**
     * Remove WordPress admin wrapper for Yatra page
     */
    public function removeAdminWrapper(): void
    {
        $screen = get_current_screen();
        if ($screen && $screen->id === 'toplevel_page_yatra') {
            // Remove admin notices wrapper
            remove_action('admin_notices', 'wp_admin_notices');
        }
    }

    /**
     * Register admin menu
     */
    public function registerAdminMenu(): void
    {
        add_menu_page(
            __('Yatra', 'yatra'),
            __('Yatra', 'yatra'),
            'manage_options',
            'yatra',
            [$this, 'renderAdminPage'],
            'dashicons-palmtree',
            30
        );
    }

    /**
     * Enqueue admin assets
     */
    public function enqueueAdminAssets(string $hook): void
    {
        // Only load on our admin page
        if ($hook !== 'toplevel_page_yatra') {
            return;
        }

        // Prevent problematic scripts that cause initialization errors
        // These scripts try to access wp.media.view before it's initialized
        wp_dequeue_script('svg-painter');
        wp_deregister_script('svg-painter');
        wp_dequeue_script('image-edit');
        wp_deregister_script('image-edit');
        
        // Enqueue WordPress media library for image uploads
        // This enqueues: jquery, underscore, media-models, wp-plupload, jquery-ui-sortable, 
        // media-views, media-editor, media-audiovideo, etc.
        wp_enqueue_media();
        
        // Ensure wp-mediaelement is loaded (required by media-views for removeAllPlayers)
        wp_enqueue_script('wp-mediaelement');
        
        // Ensure media-audiovideo is loaded (defines wp.media.mixin.removeAllPlayers)
        // This must load before media-views tries to use it
        // Note: media-audiovideo depends on media-editor, so we keep media-editor loaded
        wp_enqueue_script('media-audiovideo');
        
        // Keep media-editor loaded - it's required by media-audiovideo
        // The initialization errors were caused by svg-painter and image-edit, not media-editor
        
        // Ensure all required dependencies are loaded
        wp_enqueue_script('jquery');
        wp_enqueue_script('underscore');
        wp_enqueue_script('backbone');

        // Remove WordPress core form CSS
        wp_dequeue_style('forms');
        wp_deregister_style('forms');

        // Enqueue admin app - always load compiled assets
        // For development with auto-rebuild, use: npm run build -- --watch
        {
            // Enqueue compiled React app CSS files
            $react_vendor_css = YATRA_PLUGIN_PATH . 'public/css/react-vendor.css';
            $index_css = YATRA_PLUGIN_PATH . 'public/css/index.css';
            $app_css = YATRA_PLUGIN_PATH . 'public/css/app.css';
            $app_js = YATRA_PLUGIN_PATH . 'public/js/app.js';

            // Load react-vendor.css first (contains react-draft-wysiwyg CSS)
            if (file_exists($react_vendor_css)) {
                $css_version = YATRA_VERSION . '.' . filemtime($react_vendor_css);
                wp_enqueue_style(
                    'yatra-react-vendor',
                    YATRA_PLUGIN_URL . 'public/css/react-vendor.css',
                    [],
                    $css_version
                );
            }

            // Load index.css second (contains main component styles)
            if (file_exists($index_css)) {
                $css_version = YATRA_VERSION . '.' . filemtime($index_css);
                wp_enqueue_style(
                    'yatra-index',
                    YATRA_PLUGIN_URL . 'public/css/index.css',
                    ['yatra-react-vendor'],
                    $css_version
                );
            }

            // Load app.css last (if it exists)
            if (file_exists($app_css)) {
                $css_version = YATRA_VERSION . '.' . filemtime($app_css);
                wp_enqueue_style(
                    'yatra-admin',
                    YATRA_PLUGIN_URL . 'public/css/app.css',
                    ['yatra-index'],
                    $css_version
                );
            }

            if (file_exists($app_js)) {
                $js_version = YATRA_VERSION . '.' . filemtime($app_js) . '.currency-fix';
                // Enqueue our script with media library as dependency
                // Note: wp_enqueue_media() registers these scripts: media-models, media-views, etc.
                // We need to ensure they load before our React app
                wp_enqueue_script(
                    'yatra-admin',
                    YATRA_PLUGIN_URL . 'public/js/app.js',
                    ['jquery', 'underscore', 'backbone', 'media-models', 'wp-mediaelement', 'media-editor', 'media-audiovideo', 'media-views'], // Dependencies to ensure media library loads first
                    $js_version,
                    true
                );
            }
        }

        // Add inline script to preserve wp.media reference before it gets overwritten
        // This runs after media scripts load but before React app
        wp_add_inline_script('yatra-admin', '
                (function() {
                    // Preserve wp.media reference in a safe location
                    if (typeof wp !== "undefined" && typeof wp.media === "function") {
                        window.yatraWpMedia = wp.media;
                    }
                    
                    // Also ensure wp object exists
                    if (typeof wp === "undefined") {
                        window.wp = {};
                    }
                })();
            ', 'before');

        // Get current user
        $current_user = wp_get_current_user();
            
            // Get user capabilities
            $capabilities = [];
            if ($current_user->ID > 0) {
                $user_caps = $current_user->allcaps;
                foreach ($user_caps as $cap => $has_cap) {
                    if ($has_cap && strpos($cap, 'yatra_') === 0) {
                        $capabilities[$cap] = true;
                    }
                }
            }
            
            // Get translations (comprehensive set - can be extended by Pro)
            $translations = [
                // Navigation
                'Dashboard' => __('Dashboard', 'yatra'),
                'Trips' => __('Trips', 'yatra'),
                'All Trips' => __('All Trips', 'yatra'),
                'Activities' => __('Activities', 'yatra'),
                'Destinations' => __('Destinations', 'yatra'),
                'Bookings' => __('Bookings', 'yatra'),
                'Customers' => __('Customers', 'yatra'),
                'Reviews' => __('Reviews', 'yatra'),
                'Reports' => __('Reports', 'yatra'),
                'Settings' => __('Settings', 'yatra'),
                
                // Actions
                'Add New' => __('Add New', 'yatra'),
                'Add New Trip' => __('Add New Trip', 'yatra'),
                'Edit' => __('Edit', 'yatra'),
                'Delete' => __('Delete', 'yatra'),
                'View' => __('View', 'yatra'),
                'Search' => __('Search', 'yatra'),
                'Filter' => __('Filter', 'yatra'),
                'Save' => __('Save', 'yatra'),
                'Cancel' => __('Cancel', 'yatra'),
                'Reset' => __('Reset', 'yatra'),
                'Collect' => __('Collect', 'yatra'),
                'Previous' => __('Previous', 'yatra'),
                'Next' => __('Next', 'yatra'),
                
                // Status
                'Active' => __('Active', 'yatra'),
                'Draft' => __('Draft', 'yatra'),
                'Inactive' => __('Inactive', 'yatra'),
                'Pending' => __('Pending', 'yatra'),
                'Confirmed' => __('Confirmed', 'yatra'),
                'Cancelled' => __('Cancelled', 'yatra'),
                'Completed' => __('Completed', 'yatra'),
                
                // Dashboard Stats
                'Total Trips' => __('Total Trips', 'yatra'),
                'Total Bookings' => __('Total Bookings', 'yatra'),
                'Total Revenue' => __('Total Revenue', 'yatra'),
                'Pending Bookings' => __('Pending Bookings', 'yatra'),
                'Total Customers' => __('Total Customers', 'yatra'),
                'Upcoming Departures' => __('Upcoming Departures', 'yatra'),
                'Active Tours' => __('Active Tours', 'yatra'),
                'Avg Booking Value' => __('Avg Booking Value', 'yatra'),
                'Occupancy Rate' => __('Occupancy Rate', 'yatra'),
                'Conversion Rate' => __('Conversion Rate', 'yatra'),
                'Cancellation Rate' => __('Cancellation Rate', 'yatra'),
                
                // Dashboard Sections
                'Recent Bookings' => __('Recent Bookings', 'yatra'),
                'Popular Trips' => __('Popular Trips', 'yatra'),
                'Popular Destinations' => __('Popular Destinations', 'yatra'),
                'Revenue Trend' => __('Revenue Trend', 'yatra'),
                'Bookings Over Time' => __('Bookings Over Time', 'yatra'),
                'Booking Status' => __('Booking Status', 'yatra'),
                'Bookings by Destination' => __('Bookings by Destination', 'yatra'),
                'Pending Payments' => __('Pending Payments', 'yatra'),
                'System Alerts' => __('System Alerts', 'yatra'),
                'Quick Actions' => __('Quick Actions', 'yatra'),
                
                // Quick Actions
                'Create New Trip' => __('Create New Trip', 'yatra'),
                'Generate Report' => __('Generate Report', 'yatra'),
                'View Calendar' => __('View Calendar', 'yatra'),
                'View Analytics' => __('View Analytics', 'yatra'),
                
                // Common
                'Loading' => __('Loading', 'yatra'),
                'Loading trips...' => __('Loading trips...', 'yatra'),
                'No items found' => __('No items found', 'yatra'),
                'No trips found' => __('No trips found', 'yatra'),
                'No recent bookings' => __('No recent bookings', 'yatra'),
                'No trips available' => __('No trips available', 'yatra'),
                'No upcoming departures' => __('No upcoming departures', 'yatra'),
                'No pending payments' => __('No pending payments', 'yatra'),
                'No data available' => __('No data available', 'yatra'),
                'All systems operational' => __('All systems operational', 'yatra'),
                
                // Trips
                'Title' => __('Title', 'yatra'),
                'Slug' => __('Slug', 'yatra'),
                'Price' => __('Price', 'yatra'),
                'Status' => __('Status', 'yatra'),
                'Created' => __('Created', 'yatra'),
                'Actions' => __('Actions', 'yatra'),
                'Manage your travel packages and tours' => __('Manage your travel packages and tours', 'yatra'),
                'Are you sure you want to delete this trip?' => __('Are you sure you want to delete this trip?', 'yatra'),
                'Error loading trips' => __('Error loading trips', 'yatra'),
                'Showing' => __('Showing', 'yatra'),
                'of' => __('of', 'yatra'),
                'trips' => __('trips', 'yatra'),
                'bookings' => __('bookings', 'yatra'),
                
                // Departures
                'Today' => __('Today', 'yatra'),
                'Tomorrow' => __('Tomorrow', 'yatra'),
                'days' => __('days', 'yatra'),
                'available' => __('available', 'yatra'),
                'occupied' => __('occupied', 'yatra'),
                'days overdue' => __('days overdue', 'yatra'),
                'Due' => __('Due', 'yatra'),
                
                // Alerts
                'critical' => __('critical', 'yatra'),
                
                // Destinations
                'Nepal' => __('Nepal', 'yatra'),
                'India' => __('India', 'yatra'),
                'Bhutan' => __('Bhutan', 'yatra'),
                'Tibet' => __('Tibet', 'yatra'),
            ];
            
        // Localize script with API data, permissions, and translations
        wp_localize_script('yatra-admin', 'yatraAdmin', apply_filters('yatra_admin_localized_data', [
            'apiUrl' => rest_url('yatra/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
            'currentUser' => $current_user->ID,
            'siteUrl' => home_url(),
            'adminUrl' => admin_url('admin.php'),
            'permissions' => array_keys($capabilities),
            'capabilities' => $capabilities,
            'roles' => $current_user->roles,
            'isPro' => defined('YATRA_PRO_VERSION'),
            'version' => defined('YATRA_VERSION') ? YATRA_VERSION : '1.0.0',
            'proVersion' => defined('YATRA_PRO_VERSION') ? YATRA_PRO_VERSION : null,
            'showGoogleCalendarSettingsUI' => apply_filters(
                'yatra_show_google_calendar_settings_ui',
                class_exists('\\Yatra\\Core\\Modules\\ModuleManager') ? ModuleManager::isModuleEnabled('google_calendar') : false
            ),
            'dynamicFormFieldEnabled' => apply_filters(
                'yatra_dynamic_form_field_enabled',
                class_exists('\\Yatra\\Core\\Modules\\ModuleManager') ? ModuleManager::isModuleEnabled('dynamic_form_field') : false
            ),
            'showMailchimpSettingsUI' => apply_filters(
                'yatra_show_mailchimp_settings_ui',
                class_exists('\\Yatra\\Core\\Modules\\ModuleManager') ? ModuleManager::isModuleEnabled('mailchimp') : false
            ),
            'showFacebookPixelSettingsUI' => apply_filters(
                'yatra_show_facebook_pixel_settings_ui',
                class_exists('\\Yatra\\Core\\Modules\\ModuleManager') ? ModuleManager::isModuleEnabled('facebook_pixel') : false
            ),
            'showGoogleAnalyticsSettingsUI' => apply_filters(
                'yatra_show_google_analytics_settings_ui',
                class_exists('\\Yatra\\Core\\Modules\\ModuleManager') ? ModuleManager::isModuleEnabled('google_analytics') : false
            ),
            'abandonedBookingRecoveryEnabled' => apply_filters(
                'yatra_abandoned_booking_recovery_enabled',
                class_exists('\\Yatra\\Core\\Modules\\ModuleManager') ? ModuleManager::isModuleEnabled('abandoned_booking_recovery') : false
            ),
            'dynamicPricingEnabled' => apply_filters(
                'yatra_dynamic_pricing_enabled',
                class_exists('\\Yatra\\Core\\Modules\\ModuleManager') ? ModuleManager::isModuleEnabled('dynamic_pricing') : false
            ),
            'translations' => $translations,
            'locale' => get_locale(),
            'currency' => \Yatra\Services\SettingsService::getCurrency(),
            'date_format' => \Yatra\Services\SettingsService::get('date_format', 'Y-m-d'),
            'time_format' => \Yatra\Services\SettingsService::get('time_format', 'H:i'),
        ]));
    }


    /**
     * Render admin page
     */
    public function renderAdminPage(): void
    {
        // Load admin template
        $template = YATRA_PLUGIN_PATH . 'templates/admin.php';
        
        if (file_exists($template)) {
            include $template;
        } else {
            echo '<div class="wrap"><h1>Yatra Admin</h1><p>Admin template not found.</p></div>';
        }
    }
}

