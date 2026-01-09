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
                    'media-views',
                    'wp-i18n'
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
        $localized_data = apply_filters('yatra_admin_localized_data', [
            'apiUrl' => rest_url('yatra/v1'),
            'restUrl' => rest_url(),
            'nonce' => wp_create_nonce('wp_rest'),
            'currentUser' => $current_user->ID,
            'siteUrl' => home_url(),
            'adminUrl' => admin_url('admin.php'),
            'permalinkStructure' => (get_option('permalink_structure') ?: '') ?: 'plain',
            'tripBase' => \Yatra\Services\SettingsService::getTripBase(),
            'bookingBase' => \Yatra\Services\SettingsService::getBookingBase(),
            'capabilities' => $capabilities,
            'roles' => $current_user->roles,
            'isPro' => defined('YATRA_PRO_VERSION'),
            'version' => defined('YATRA_VERSION') ? YATRA_VERSION : '1.0.0',
            'proVersion' => defined('YATRA_PRO_VERSION') ? YATRA_PRO_VERSION : null,
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
            'tripConsentEnabled' => apply_filters(
                'yatra_trip_consent_enabled',
                class_exists('\\Yatra\\Core\\Modules\\ModuleManager') ? \Yatra\Core\Modules\ModuleManager::isModuleEnabled('trip_consent') : false
            ),
            'additionalServicesEnabled' => apply_filters(
                'yatra_additional_services_enabled',
                class_exists('\\Yatra\\Core\\Modules\\ModuleManager') ? \Yatra\Core\Modules\ModuleManager::isModuleEnabled('additional_services') : false
            ),
            'emailAutomationEnabled' => apply_filters(
                'yatra_email_automation_enabled',
                class_exists('\\Yatra\\Core\\Modules\\ModuleManager') ? \Yatra\Core\Modules\ModuleManager::isModuleEnabled('email_automation') : false
            ),
            'advancedDiscountEnabled' => apply_filters(
                'yatra_advanced_discount_enabled',
                class_exists('\\Yatra\\Core\\Modules\\ModuleManager') ? \Yatra\Core\Modules\ModuleManager::isModuleEnabled('advanced_discount') : false
            ),
            'locale' => get_locale(),
            'currency' => \Yatra\Services\SettingsService::getCurrency(),
            'date_format' => \Yatra\Services\SettingsService::get('date_format', 'Y-m-d'),
            'time_format' => \Yatra\Services\SettingsService::get('time_format', 'H:i'),
        ]);

        wp_localize_script('yatra-admin', 'yatraAdmin', $localized_data);

        // Load WordPress translation data for the yatra domain
        $this->loadWordPressTranslations();
    }

    /**
     * Load WordPress translation data for JavaScript
     *
     * @return void
     */
    private function loadWordPressTranslations(): void
    {
        // Use WordPress built-in function to load script translations
        // Specify the path where WordPress should look for JSON translation files
        if (function_exists('wp_set_script_translations')) {
            wp_set_script_translations('yatra-admin', 'yatra', YATRA_PLUGIN_FILE . '/i18n/languages');
        }
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
