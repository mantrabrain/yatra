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
     * Full `window.yatraAdmin` payload — must match what addMediaLibraryCompatScript used to merge
     * (permalinkStructure, tripBase, locale, etc.) so View links and REST helpers work in all modes.
     *
     * @return array<string, mixed>
     */
    private function buildAdminLocalizedData(): array
    {
        $current_user = wp_get_current_user();
        $capabilities = [];
        if ($current_user->ID > 0) {
            $user_caps = $current_user->allcaps;
            foreach ($user_caps as $cap => $has_cap) {
                if (!$has_cap) continue;
                // Mirror every `yatra_*` cap into the JS-side map (these
                // are what React's `can()` checks against). Also
                // explicitly include `manage_options` so the React-side
                // admin fallback has a server-confirmed signal even on
                // exotic installs where `isWpAdmin` or `roles` were
                // filtered out by a third-party plugin.
                $capStr = (string) $cap;
                if (strpos($capStr, 'yatra_') === 0 || $capStr === 'manage_options') {
                    $capabilities[$capStr] = true;
                }
            }
        }

        return apply_filters('yatra_admin_localized_data', [
            'timeZoneIdentifiers' => self::buildTimezoneIdentifierList(),
            'wordPressTimezone' => function_exists('wp_timezone_string')
                ? (string) wp_timezone_string()
                : 'UTC',
            'timezone' => \Yatra\Services\SettingsService::getString('timezone', 'UTC'),
            'apiUrl' => rest_url('yatra/v1'),
            'licenseStatus' => (function () {
                $all = get_option('yatra_license', []);
                $status = $all['yatra-pro']['status'] ?? 'inactive';
                return (string) $status;
            })(),
            'restUrl' => rest_url(),
            'nonce' => wp_create_nonce('wp_rest'),
            'currentUser' => $current_user->ID,
            'currentUserEmail' => $current_user->user_email,
            'currentUserDisplayName' => $current_user->display_name,
            'currentUserLogin' => $current_user->user_login,
            'currentUserAvatar' => get_avatar($current_user->ID, 96),
            'siteUrl' => home_url(),
            'adminUrl' => admin_url('admin.php'),
            'pluginUrl' => YATRA_PLUGIN_URL,
            // Brand-name and brand-logo helpers are filter-backed (defaults
            // wired in includes/helpers.php). Pro's WhiteLabel module
            // overrides the filters when Agency white-label is active.
            'brandLogoUrl' => function_exists('yatra_get_brand_icon_url') ? yatra_get_brand_icon_url() : '',
            'brandName' => function_exists('yatra_get_brand_name') ? yatra_get_brand_name() : 'Yatra',
            // White-label-specific window.yatraAdmin keys (brandMenuOverrides,
            // brandMenuOrder, brandUiChrome, brandPrimaryColor) are injected
            // by Pro via the `yatra_admin_localized_data` filter applied at
            // the bottom of this method. They are NOT set here because option
            // storage is owned by Pro's WhiteLabel module.
            'permalinkStructure' => (get_option('permalink_structure') ?: '') ?: 'plain',
            'tripBase' => \Yatra\Services\SettingsService::getTripBase(),
            'bookingBase' => \Yatra\Services\SettingsService::getBookingBase(),
            'capabilities' => $capabilities,
            'roles' => $current_user->roles,
            // Cap-gating fallback flag. ALWAYS injected (not just by the
            // Team module) because the React `usePermissions.can()` helper
            // uses it as the last-resort allow for site owners: anyone
            // with `manage_options` passes any cap check, mirroring the
            // server-side admin fallback in Team's Capabilities filter.
            //
            // Without this, free-plugin installs (or Pro installs where
            // Team is off) silently fail every `can("yatra_*")` check —
            // even for site owners — because the cap isn't on the
            // administrator role record. The Team module overwrites
            // this same key when active; semantics are identical, so
            // the overwrite is safe.
            'isWpAdmin' => current_user_can('manage_options'),
            'isPro' => defined('YATRA_PRO_VERSION'),
            // Agency-tier flag — drives the sidebar's White Label entry visibility
            // and any other Agency-only UI affordances. Pro registers the filter
            // unconditionally so the value is always trustworthy.
            'isAgency' => (bool) apply_filters('yatra_is_agency_active', false),
            // AI-eligibility flag (Growth + Agency). Drives the AI Assistant
            // sidebar entry visibility and the per-field sparkle affordances
            // in the trip / SEO editors.
            'isAiEligible' => (bool) apply_filters('yatra_is_ai_eligible', false),
            'whiteLabelEnabled' => class_exists('\\Yatra\\Core\\Modules\\ModuleManager')
                ? \Yatra\Core\Modules\ModuleManager::isModuleEnabled('white_label')
                : false,
            'aiAssistantEnabled' => class_exists('\\Yatra\\Core\\Modules\\ModuleManager')
                ? \Yatra\Core\Modules\ModuleManager::isModuleEnabled('ai_assistant')
                : false,
            'whatsappEnabled' => class_exists('\\Yatra\\Core\\Modules\\ModuleManager')
                ? \Yatra\Core\Modules\ModuleManager::isModuleEnabled('whatsapp')
                : false,
            'channelManagerEnabled' => class_exists('\\Yatra\\Core\\Modules\\ModuleManager')
                ? \Yatra\Core\Modules\ModuleManager::isModuleEnabled('channel_manager')
                : false,
            'webhooksEnabled' => class_exists('\\Yatra\\Core\\Modules\\ModuleManager')
                ? \Yatra\Core\Modules\ModuleManager::isModuleEnabled('webhooks')
                : false,
            // Settings → Pricing (Discount Stacking) drives off these
            // two. Setting them here (free plugin, AdminAssetsProvider)
            // matches the pattern used by every other Pro-module flag
            // above and decouples the React UI from Pro module boot
            // timing — Pro's init.php is conditionally loaded by
            // ProModuleManager only when the module is enabled, so any
            // filter-based exposure could fail silently if boot order
            // shifts. Reading from the canonical ModuleManager here is
            // the source of truth.
            'dynamicPricingEnabled' => class_exists('\\Yatra\\Core\\Modules\\ModuleManager')
                ? \Yatra\Core\Modules\ModuleManager::isModuleEnabled('dynamic_pricing')
                : false,
            'advancedDiscountEnabled' => class_exists('\\Yatra\\Core\\Modules\\ModuleManager')
                ? \Yatra\Core\Modules\ModuleManager::isModuleEnabled('advanced_discount')
                : false,
            // Single source of truth for every country dropdown in the
            // React admin. Pulled from the canonical FormatHelper —
            // operators that want a curated or reordered list apply
            // the `yatra_countries_list` filter once and it propagates
            // to every dropdown automatically.
            'countries' => class_exists('\\Yatra\\Helpers\\FormatHelper')
                ? \Yatra\Helpers\FormatHelper::getCountries()
                : [],
            'customLandingPagesModuleEnabled' => class_exists('\\Yatra\\Core\\Modules\\ModuleManager')
                ? \Yatra\Core\Modules\ModuleManager::isModuleEnabled('custom_landing_pages')
                : false,
            // Per-trip Deposit & Payment Terms is a Pro feature (FlexiblePayments).
            // Default false; Pro's FlexiblePaymentsModule::addAdminData() flips this
            // to true via the `yatra_admin_localized_data` filter when active, and
            // the React TripForm hides/shows the section based on this flag.
            'flexiblePaymentsEnabled' => false,
            'version' => defined('YATRA_VERSION') ? YATRA_VERSION : '1.0.0',
            'proVersion' => defined('YATRA_PRO_VERSION') ? YATRA_PRO_VERSION : null,

            'locale' => get_locale(),
            'currency' => \Yatra\Services\SettingsService::getCurrency(),
            'currencyPosition' => \Yatra\Services\SettingsService::getString('currency_position', 'left'),
            'currency_position' => \Yatra\Services\SettingsService::getString('currency_position', 'left'),
            'decimalPlaces' => (int) \Yatra\Services\SettingsService::getString('currency_decimals', '2'),
            'thousandSeparator' => \Yatra\Services\SettingsService::getString('thousand_separator', ','),
            'decimalSeparator' => \Yatra\Services\SettingsService::getString('decimal_separator', '.'),
            'date_format' => \Yatra\Services\SettingsService::get('date_format', 'Y-m-d'),
            'time_format' => \Yatra\Services\SettingsService::get('time_format', 'H:i'),
            'geocodingNonce' => wp_create_nonce('yatra_geocoding_nonce'),
            'ajaxUrl' => admin_url('admin-ajax.php'),
        ]);
    }

    /**
     * Sorted IANA identifiers for the admin timezone control (matches PHP {@see DateTimeZone}).
     *
     * @return list<string>
     */
    private static function buildTimezoneIdentifierList(): array
    {
        if (!function_exists('timezone_identifiers_list')) {
            return ['UTC'];
        }

        $ids = timezone_identifiers_list();
        if (!is_array($ids) || $ids === []) {
            return ['UTC'];
        }

        $ids = array_values(array_filter($ids, static function ($id): bool {
            return is_string($id) && $id !== '';
        }));

        sort($ids, SORT_STRING);

        return $ids;
    }

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

        // Do not strip styles required by wp_enqueue_media() / wp.media(): stripping `media-views`
        // (and replacing `forms` with an empty handle) makes the media modal invisible or broken.
        // See: TripForm gallery / featured image / downloadable file pickers.

        // Aggressive WordPress Admin CSS removal (keep media modal + its dependency chain intact)
        $admin_css_handles = [
            'admin-bar',
            'admin-menu',
            'dashboard',
            'list-tables',
            'edit',
            'revisions',
            'themes',
            'about',
            'nav-menus',
            'wp-pointer',
            'widgets',
            'site-icon',
            'l10n',
            'wp-auth-check',
            'wp-components',
            'wp-commands',
            'login',
            'install',
            'wp-reset-editor-styles',
            'wp-admin',
            'colors',
        ];
        
        // Dequeue all WordPress admin CSS and register empty placeholders
        foreach ($admin_css_handles as $handle) {
            wp_dequeue_style($handle);
            wp_deregister_style($handle);
            // Register as empty style to satisfy dependencies
            wp_register_style($handle, false);
        }
        
        // Final safety dequeue at print time
        add_action('wp_print_styles', function () use ($admin_css_handles) {
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
        $faPath = YATRA_PLUGIN_PATH . 'assets/vendor/fontawesome/css/all.min.css';
        if (file_exists($faPath)) {
            wp_enqueue_style(
                'yatra-fontawesome-6-admin',
                YATRA_PLUGIN_URL . 'assets/vendor/fontawesome/css/all.min.css',
                [],
                '6.7.2.' . filemtime($faPath)
            );
        }

        $basePath = YATRA_PLUGIN_PATH . 'assets/admin/dist/css/';
        $faHandle = file_exists($faPath) ? 'yatra-fontawesome-6-admin' : false;

        // React vendor CSS (contains react-draft-wysiwyg CSS)
        $reactVendorCss = $basePath . 'react-vendor.css';
        if (file_exists($reactVendorCss)) {
            $cssVersion = YATRA_VERSION . '.' . filemtime($reactVendorCss);
            wp_enqueue_style(
                'yatra-react-vendor',
                YATRA_PLUGIN_URL . 'assets/admin/dist/css/react-vendor.css',
                $faHandle ? [$faHandle] : [],
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
        $viteDevServer = 'http://localhost:5173';
        
        if ($isDevMode && $this->isViteDevServerRunning($viteDevServer)) {
            // In dev mode, inject localized data and Vite's HMR client
            add_action('admin_head', function() use ($viteDevServer) {
                $localized_data = $this->buildAdminLocalizedData();

                ?>
                <script>
                    window.yatraAdmin = <?php echo wp_json_encode($localized_data); ?>;
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

                $localized_data = $this->buildAdminLocalizedData();

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

                // Start fetching the ES module as early as possible (helps shorten white/splash time before React runs)
                $app_js_url = YATRA_PLUGIN_URL . 'assets/admin/dist/js/app.js';
                add_action('admin_head', static function () use ($app_js_url, $jsVersion): void {
                    $href = esc_url(add_query_arg('ver', rawurlencode((string) $jsVersion), $app_js_url));
                    echo '<link rel="modulepreload" href="' . $href . '" />' . "\n";
                }, 0);
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
        // `yatraAdmin` is localized once in enqueueAdminReactJs via buildAdminLocalizedData().
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
        // Use WordPress built-in function to load script translations.
        // The third argument MUST be an absolute path to the directory
        // that contains the per-locale .json translation files.
        //
        // Previously this passed YATRA_PLUGIN_FILE — i.e. the main
        // plugin PHP FILE path, not its directory. Appending
        // "/i18n/languages" yielded ".../plugin/yatra.php/i18n/languages",
        // a path that doesn't exist, so WordPress silently fell back to
        // shipping source-English strings to the React admin regardless
        // of the operator's WP locale.
        //
        // Use YATRA_PLUGIN_PATH (the directory, ending in /) instead,
        // matching the block-editor side that has always worked.
        //
        // The actual JSON file shipped here is generated at BUILD time
        // by scripts/build-translation-json.mjs from each locale's .po
        // file. That script writes ONE consolidated JSON per locale
        // named `yatra-{locale}-{md5(bundle src path)}.json`, so
        // WordPress's native script-translation loader finds it on
        // first try — no runtime filter / merge needed.
        if (function_exists('wp_set_script_translations')) {
            wp_set_script_translations('yatra-admin', 'yatra', YATRA_PLUGIN_PATH . 'i18n/languages');
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
