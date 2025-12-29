<?php

declare(strict_types=1);

namespace Yatra\Providers;

/**
 * Admin Assets Provider
 *
 * Handles enqueuing of all admin-related CSS and JavaScript assets
 * Centralizes admin asset management for better organization and maintainability
 *
 * @package Yatra\Providers
 * @since 3.0.0
 */
class AdminAssetsProvider
{
    /**
     * Enqueue all admin assets
     *
     * @param string $hook Current admin page hook
     * @return void
     */
    public function enqueueAssets(string $hook): void
    {
        // Only load on our admin page
        if ($hook !== 'toplevel_page_yatra') {
            return;
        }

        // Prevent problematic scripts that cause initialization errors
        $this->preventProblematicScripts();

        // Enqueue WordPress media library
        $this->enqueueWordPressMedia();

        // Remove WordPress core form CSS
        wp_dequeue_style('forms');
        wp_deregister_style('forms');

        // Enqueue admin React app assets
        $this->enqueueAdminReactApp();

        // Add inline script for media library compatibility
        $this->addMediaLibraryCompatScript();
    }

    /**
     * Prevent problematic WordPress scripts
     *
     * @return void
     */
    private function preventProblematicScripts(): void
    {
        // These scripts try to access wp.media.view before it's initialized
        wp_dequeue_script('svg-painter');
        wp_deregister_script('svg-painter');
        wp_dequeue_script('image-edit');
        wp_deregister_script('image-edit');
    }

    /**
     * Enqueue WordPress media library dependencies
     *
     * @return void
     */
    private function enqueueWordPressMedia(): void
    {
        // Enqueue WordPress media library
        wp_enqueue_media();

        // Ensure wp-mediaelement is loaded
        wp_enqueue_script('wp-mediaelement');

        // Ensure media-audiovideo is loaded
        wp_enqueue_script('media-audiovideo');

        // Keep media-editor loaded - it's required by media-audiovideo
        // Note: The initialization errors were caused by svg-painter and image-edit, not media-editor

        // Ensure all required dependencies are loaded
        wp_enqueue_script('jquery');
        wp_enqueue_script('underscore');
        wp_enqueue_script('backbone');
    }

    /**
     * Enqueue admin React app assets
     *
     * @return void
     */
    private function enqueueAdminReactApp(): void
    {
        // Enqueue compiled React app CSS files
        $this->enqueueAdminReactCss();
        $this->enqueueAdminReactJs();
    }

    /**
     * Enqueue admin React CSS files
     *
     * @return void
     */
    private function enqueueAdminReactCss(): void
    {
        $basePath = YATRA_PLUGIN_PATH . 'assets/admin/dist/css/';

        // React vendor CSS (contains react-draft-wysiwyg CSS)
        $reactVendorCss = $basePath . 'react-vendor.css';
        if (file_exists($reactVendorCss)) {
            $cssVersion = YATRA_VERSION . '.' . filemtime($reactVendorCss);
            wp_enqueue_style(
                'yatra-react-vendor',
                YATRA_PLUGIN_URL . 'assets/admin/dist/css/react-vendor.css',
                [],
                $cssVersion
            );
        }

        // Index CSS (contains main component styles)
        $indexCss = $basePath . 'index.css';
        if (file_exists($indexCss)) {
            $cssVersion = YATRA_VERSION . '.' . filemtime($indexCss);
            wp_enqueue_style(
                'yatra-index',
                YATRA_PLUGIN_URL . 'assets/admin/dist/css/index.css',
                ['yatra-react-vendor'],
                $cssVersion
            );
        }
    }

    /**
     * Enqueue admin React JS files
     *
     * @return void
     */
    private function enqueueAdminReactJs(): void
    {
        $appJs = YATRA_PLUGIN_PATH . 'assets/admin/dist/js/app.js';

        if (file_exists($appJs)) {
            $jsVersion = YATRA_VERSION . '.' . filemtime($appJs) . '.currency-fix';

            // Enqueue our script with media library as dependency
            wp_enqueue_script(
                'yatra-admin',
                YATRA_PLUGIN_URL . 'assets/admin/dist/js/app.js',
                [
                    'jquery',
                    'underscore',
                    'backbone',
                    'media-models',
                    'wp-mediaelement',
                    'media-editor',
                    'media-audiovideo',
                    'media-views'
                ],
                $jsVersion,
                true
            );
        }
    }

    /**
     * Add inline script for media library compatibility
     *
     * @return void
     */
    private function addMediaLibraryCompatScript(): void
    {
        // Get current user for permissions
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
            'translations' => $this->getAdminTranslations(),
            'showGoogleCalendarSettingsUI' => apply_filters(
                'yatra_show_google_calendar_settings_ui',
                class_exists('\\Yatra\\Core\\Modules\\ModuleManager') ? \Yatra\Core\Modules\ModuleManager::isModuleEnabled('google_calendar') : false
            ),
            'dynamicFormFieldEnabled' => apply_filters(
                'yatra_dynamic_form_field_enabled',
                class_exists('\\Yatra\\Core\\Modules\\ModuleManager') ? \Yatra\Core\Modules\ModuleManager::isModuleEnabled('dynamic_form_field') : false
            ),
            'showMailchimpSettingsUI' => apply_filters(
                'yatra_show_mailchimp_settings_ui',
                class_exists('\\Yatra\\Core\\Modules\\ModuleManager') ? \Yatra\Core\Modules\ModuleManager::isModuleEnabled('mailchimp') : false
            ),
            'showFacebookPixelSettingsUI' => apply_filters(
                'yatra_show_facebook_pixel_settings_ui',
                class_exists('\\Yatra\\Core\\Modules\\ModuleManager') ? \Yatra\Core\Modules\ModuleManager::isModuleEnabled('facebook_pixel') : false
            ),
            'showGoogleAnalyticsSettingsUI' => apply_filters(
                'yatra_show_google_analytics_settings_ui',
                class_exists('\\Yatra\\Core\\Modules\\ModuleManager') ? \Yatra\Core\Modules\ModuleManager::isModuleEnabled('google_analytics') : false
            ),
            'abandonedBookingRecoveryEnabled' => apply_filters(
                'yatra_abandoned_booking_recovery_enabled',
                class_exists('\\Yatra\\Core\\Modules\\ModuleManager') ? \Yatra\Core\Modules\ModuleManager::isModuleEnabled('abandoned_booking_recovery') : false
            ),
            'dynamicPricingEnabled' => apply_filters(
                'yatra_dynamic_pricing_enabled',
                class_exists('\\Yatra\\Core\\Modules\\ModuleManager') ? \Yatra\Core\Modules\ModuleManager::isModuleEnabled('dynamic_pricing') : false
            ),
            'locale' => get_locale(),
            'currency' => \Yatra\Services\SettingsService::getCurrency(),
            'date_format' => \Yatra\Services\SettingsService::get('date_format', 'Y-m-d'),
            'time_format' => \Yatra\Services\SettingsService::get('time_format', 'H:i'),
        ]));

        // Add inline script to preserve wp.media reference
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
    }

    /**
     * Get admin translations
     *
     * @return array
     */
    private function getAdminTranslations(): array
    {
        return [
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

            // Booking translations
            'Create Booking' => __('Create Booking', 'yatra'),
            'Bookings' => __('Bookings', 'yatra'),
            'Manage customer bookings and reservations' => __('Manage customer bookings and reservations', 'yatra'),
            'Search bookings...' => __('Search bookings...', 'yatra'),
            'All Payments' => __('All Payments', 'yatra'),
            'Paid' => __('Paid', 'yatra'),
            'Pending' => __('Pending', 'yatra'),
            'Partial' => __('Partial', 'yatra'),
            'Refunded' => __('Refunded', 'yatra'),
            'Error loading bookings' => __('Error loading bookings', 'yatra'),
            'No bookings found' => __('No bookings found', 'yatra'),
            'Delete Booking' => __('Delete Booking', 'yatra'),
            'Delete' => __('Delete', 'yatra'),
            'Cancel' => __('Cancel', 'yatra'),
            'Are you sure you want to delete this booking?' => __('Are you sure you want to delete this booking?', 'yatra'),
            'bookings' => __('bookings', 'yatra'),
            'Mark as Completed' => __('Mark as Completed', 'yatra'),
            'Booking status updated' => __('Booking status updated', 'yatra'),
            'Failed to update booking status' => __('Failed to update booking status', 'yatra'),
            'Booking deleted successfully' => __('Booking deleted successfully', 'yatra'),
            'Failed to delete booking' => __('Failed to delete booking', 'yatra'),
            'Selected bookings deleted successfully' => __('Selected bookings deleted successfully', 'yatra'),
            'Bulk booking status updated successfully' => __('Bulk booking status updated successfully', 'yatra'),
            'Failed to perform bulk action on bookings' => __('Failed to perform bulk action on bookings', 'yatra'),
            'Mark as Confirmed' => __('Mark as Confirmed', 'yatra'),
            'Mark as Pending' => __('Mark as Pending', 'yatra'),
            'Mark as Cancelled' => __('Mark as Cancelled', 'yatra'),
            'Delete permanently' => __('Delete permanently', 'yatra'),
            'Booking Number' => __('Booking Number', 'yatra'),
            'All Status' => __('All Status', 'yatra'),
            'Customer' => __('Customer', 'yatra'),
            'Trip' => __('Trip', 'yatra'),
            'Amount' => __('Amount', 'yatra'),
            'Status' => __('Status', 'yatra'),
            'View' => __('View', 'yatra'),
            'Edit' => __('Edit', 'yatra'),
            'Travelers' => __('Travelers', 'yatra'),
            'Booking Date' => __('Booking Date', 'yatra'),
            'Travel Date' => __('Travel Date', 'yatra'),
            'Payment' => __('Payment', 'yatra'),
            'Booking #' => __('Booking #', 'yatra'),
            'Confirmed' => __('Confirmed', 'yatra'),
            'Cancelled' => __('Cancelled', 'yatra'),
            'Completed' => __('Completed', 'yatra'),
            'All' => __('All', 'yatra'),
            'Try adjusting your filters to see more results.' => __('Try adjusting your filters to see more results.', 'yatra'),
            'Get started by creating your first booking.' => __('Get started by creating your first booking.', 'yatra'),
            'Error: ' => __('Error: ', 'yatra'),
        ];
    }

    /**
     * Enqueue setup wizard assets
     *
     * @return void
     */
    public function enqueueSetupWizardAssets(): void
    {
        // Enqueue setup wizard CSS
        $cssPath = YATRA_PLUGIN_PATH . 'assets/admin/css/setup-wizard.css';
        if (file_exists($cssPath)) {
            wp_enqueue_style(
                'yatra-setup-wizard',
                YATRA_PLUGIN_URL . 'assets/admin/css/setup-wizard.css',
                [],
                YATRA_VERSION
            );
        }

        // Enqueue setup wizard JS
        $jsPath = YATRA_PLUGIN_PATH . 'assets/admin/js/setup-wizard.js';
        if (file_exists($jsPath)) {
            wp_enqueue_script(
                'yatra-setup-wizard',
                YATRA_PLUGIN_URL . 'assets/admin/js/setup-wizard.js',
                ['jquery'],
                YATRA_VERSION,
                true
            );

            // Localize setup wizard
            wp_localize_script('yatra-setup-wizard', 'yatraSetupWizard', [
                'ajaxurl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('yatra-setup-wizard'),
            ]);
        }
    }
}
