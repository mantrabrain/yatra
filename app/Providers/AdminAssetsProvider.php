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

        // Enqueue WordPress media library dependencies
        $this->enqueueWordPressMedia();

        // Enqueue admin React app assets
        $this->enqueueAdminReactApp();

        // Senior Engineer Solution: Complete forms CSS removal
        // First, remove any existing forms style
        wp_dequeue_style('forms');
        wp_deregister_style('forms');
        
        // Get all registered styles that depend on forms
        global $wp_styles;
        $dependent_styles = [];
        
        if (isset($wp_styles->registered) && is_array($wp_styles->registered)) {
            foreach ($wp_styles->registered as $handle => $style) {
                if (isset($style->deps) && is_array($style->deps) && in_array('forms', $style->deps)) {
                    $dependent_styles[] = $handle;
                }
            }
        }
        
        // Register forms as empty style to satisfy dependencies
        wp_register_style('forms', false);
        
        // Re-enqueue dependent styles without forms dependency
        foreach ($dependent_styles as $handle) {
            if ($handle !== 'forms') {
                wp_dequeue_style($handle);
                $style = $wp_styles->registered[$handle] ?? null;
                if ($style && isset($style->deps)) {
                    // Remove forms from dependencies
                    $style->deps = array_diff($style->deps, ['forms']);
                    wp_enqueue_style($handle);
                }
            }
        }
        
        // Aggressive WordPress Admin CSS removal
        $admin_css_handles = [
            'dashicons',
            'admin-bar', 
            'common',
            'admin-menu',
            'dashboard',
            'list-tables',
            'edit',
            'revisions',
            'media',
            'themes',
            'about',
            'nav-menus',
            'wp-pointer',
            'widgets',
            'site-icon',
            'l10n',
            'buttons',
            'wp-auth-check',
            'wp-components',
            'wp-commands',
            'media-views',
            'login',
            'install',
            'wp-reset-editor-styles',
            'wp-admin',
            'colors',
            'thickbox'
        ];
        
        // Dequeue all WordPress admin CSS and register empty placeholders
        foreach ($admin_css_handles as $handle) {
            wp_dequeue_style($handle);
            wp_deregister_style($handle);
            // Register as empty style to satisfy dependencies
            wp_register_style($handle, false);
        }
        
        // Final safety dequeue at print time
        add_action('wp_print_styles', function() use ($dependent_styles, $admin_css_handles) {
            wp_dequeue_style('forms');
            foreach ($dependent_styles as $handle) {
                if ($handle !== 'forms') {
                    wp_dequeue_style($handle);
                }
            }
            
            // Ensure admin CSS is removed at render time
            foreach ($admin_css_handles as $handle) {
                wp_dequeue_style($handle);
            }
        }, 999);

        // Add aggressive style loader filter to prevent WordPress admin CSS
        add_filter('style_loader_src', function($src, $handle) use ($admin_css_handles) {
            if (in_array($handle, $admin_css_handles)) {
                return false; // Prevent loading actual CSS files
            }
            // Allow load-styles.php but individual handles will be blocked above
            return $src;
        }, 999, 2);

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
        // Check if we're in development mode and Vite dev server is running
        $isDevMode = defined('WP_DEBUG') && WP_DEBUG && defined('YATRA_DEV_MODE') && YATRA_DEV_MODE;
        $viteDevServer = 'http://localhost:3000';
        
        if ($isDevMode && $this->isViteDevServerRunning($viteDevServer)) {
            // In dev mode, inject localized data and Vite's HMR client
            add_action('admin_head', function() use ($viteDevServer) {
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
                
                // Localize data for dev mode
                $localized_data = apply_filters('yatra_admin_localized_data', [
                    'apiUrl' => rest_url('yatra/v1'),
                    'licenseStatus' => 'inactive',
                    'restUrl' => rest_url(),
                    'nonce' => wp_create_nonce('wp_rest'),
                    'currentUser' => $current_user->ID,
                    'currentUserEmail' => $current_user->user_email,
                    'currentUserDisplayName' => $current_user->display_name,
                    'currentUserLogin' => $current_user->user_login,
                    'currentUserAvatar' => get_avatar($current_user->ID, 96),
                    'siteUrl' => home_url(),
                    'adminUrl' => admin_url('admin.php'),
                    'capabilities' => $capabilities,
                    'roles' => $current_user->roles,
                    'isPro' => defined('YATRA_PRO_VERSION'),
                    'version' => defined('YATRA_VERSION') ? YATRA_VERSION : '1.0.0',
                    'proVersion' => defined('YATRA_PRO_VERSION') ? YATRA_PRO_VERSION : null,
                ]);
                
                ?>
                <script>
                    window.yatraAdmin = <?php echo json_encode($localized_data); ?>;
                </script>
                <script type="module">
                    import { injectIntoGlobalHook } from "<?php echo $viteDevServer; ?>/@react-refresh";
                    injectIntoGlobalHook(window);
                    window.$RefreshReg$ = () => {};
                    window.$RefreshSig$ = () => (type) => type;
                </script>
                <script type="module" src="<?php echo $viteDevServer; ?>/@vite/client"></script>
                <?php
            }, 1);
            
            // Load the entry point as ES module
            add_action('admin_footer', function() use ($viteDevServer) {
                ?>
                <script type="module" src="<?php echo $viteDevServer; ?>/resources/js/main.tsx"></script>
                <?php
            }, 1);
            
        } else {
            // Use built assets in production
            $appJs = YATRA_PLUGIN_PATH . 'assets/admin/dist/js/app.js';

            if (file_exists($appJs)) {
                $jsVersion = YATRA_VERSION . '.' . filemtime($appJs) . '.view-icon-fix.' . time() . '.' . microtime(true);

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
                
                // Localize data for production
                $localized_data = apply_filters('yatra_admin_localized_data', [
                    'apiUrl' => rest_url('yatra/v1'),
                    'licenseStatus' => 'inactive',
                    'restUrl' => rest_url(),
                    'nonce' => wp_create_nonce('wp_rest'),
                    'currentUser' => $current_user->ID,
                    'currentUserEmail' => $current_user->user_email,
                    'currentUserDisplayName' => $current_user->display_name,
                    'currentUserLogin' => $current_user->user_login,
                    'currentUserAvatar' => get_avatar($current_user->ID, 96),
                    'siteUrl' => home_url(),
                    'adminUrl' => admin_url('admin.php'),
                    'capabilities' => $capabilities,
                    'roles' => $current_user->roles,
                    'isPro' => defined('YATRA_PRO_VERSION'),
                    'version' => defined('YATRA_VERSION') ? YATRA_VERSION : '1.0.0',
                    'proVersion' => defined('YATRA_PRO_VERSION') ? YATRA_PRO_VERSION : null,
                ]);

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

                // Localize script data
                wp_localize_script('yatra-admin', 'yatraAdmin', $localized_data);
            }
        }
    }
    
    /**
     * Check if Vite dev server is running
     *
     * @param string $url
     * @return bool
     */
    private function isViteDevServerRunning(string $url): bool
    {
        // Check the actual asset URL, not the root
        $assetUrl = $url . '/assets/admin/dist/js/app.js';
        $ch = curl_init($assetUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 2); // 2 second timeout
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 1); // 1 second connection timeout
        curl_setopt($ch, CURLOPT_NOBODY, true); // HEAD request only
        curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return $httpCode === 200;
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
            'licenseStatus' => 'inactive',
            'restUrl' => rest_url(),
            'nonce' => wp_create_nonce('wp_rest'),
            'currentUser' => $current_user->ID,
            'currentUserEmail' => $current_user->user_email,
            'currentUserDisplayName' => $current_user->display_name,
            'currentUserLogin' => $current_user->user_login,
            'currentUserAvatar' => get_avatar($current_user->ID, 96),
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

            'locale' => get_locale(),
            'currency' => \Yatra\Services\SettingsService::getCurrency(),
            'date_format' => \Yatra\Services\SettingsService::get('date_format', 'Y-m-d'),
            'time_format' => \Yatra\Services\SettingsService::get('time_format', 'H:i'),
            'geocodingNonce' => wp_create_nonce('yatra_geocoding_nonce'),
            'ajaxUrl' => admin_url('admin-ajax.php'),
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
