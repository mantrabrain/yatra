<?php

declare(strict_types=1);

namespace Yatra\Providers;

use Yatra\Core\Modules\ModuleManager;
use Yatra\Utils\Logger;

/**
 * Frontend Assets Provider
 *
 * Handles enqueuing of all frontend-related CSS and JavaScript assets
 * Centralizes frontend asset management for better organization and maintainability
 *
 * @package Yatra\Providers
 * @since 3.0.0
 */
class FrontendAssetsProvider
{
    /**
     * Register the provider
     *
     * @return void
     */
    public function register(): void
    {
        add_action('init', [self::class, 'registerCoreFrontendStylesheets'], 5);
        // Hook into WordPress to enqueue assets
        add_action('wp_enqueue_scripts', [$this, 'enqueueAssets']);
    }

    /**
     * Register Font Awesome (optional) and common.css so block editor + shortcode styles can
     * depend on `yatra-common` (shared @keyframes: yatra-spin, yatra-shimmer, etc.).
     */
    /**
     * @return list<string>
     */
    public static function shortcodeStyleDependencies(): array
    {
        self::registerCoreFrontendStylesheets();

        return wp_style_is('yatra-common', 'registered') ? ['yatra-common'] : [];
    }

    public static function registerCoreFrontendStylesheets(): void
    {
        $faPath = YATRA_PLUGIN_PATH . 'assets/vendor/fontawesome/css/all.min.css';
        if (file_exists($faPath) && !wp_style_is('yatra-fontawesome-6', 'registered')) {
            wp_register_style(
                'yatra-fontawesome-6',
                YATRA_PLUGIN_URL . 'assets/vendor/fontawesome/css/all.min.css',
                [],
                '6.7.2.' . filemtime($faPath)
            );
        }

        if (wp_style_is('yatra-common', 'registered')) {
            return;
        }
        $path = YATRA_PLUGIN_PATH . 'assets/css/common.css';
        if (!is_readable($path)) {
            return;
        }
        $commonDeps = wp_style_is('yatra-fontawesome-6', 'registered') ? ['yatra-fontawesome-6'] : [];
        wp_register_style(
            'yatra-common',
            YATRA_PLUGIN_URL . 'assets/css/common.css',
            $commonDeps,
            YATRA_VERSION . '.' . filemtime($path)
        );
    }

    /**
     * Enqueue frontend assets based on context
     *
     * @return void
     */
    public function enqueueAssets(): void
    {
        // Only run on frontend
        if (is_admin()) {
            return;
        }

        // Always enqueue common frontend assets
        $this->enqueueCommonAssets();

        // Enqueue page-specific assets
        $this->enqueuePageSpecificAssets();
    }

    /**
     * Enqueue common frontend assets
     *
     * @return void
     */
    private function enqueueCommonAssets(): void
    {
        // Enqueue common CSS
        $this->enqueueCommonCss();

        // Enqueue common JavaScript
        $this->enqueueCommonJs();
    }

    /**
     * Enqueue common CSS files
     *
     * @return void
     */
    private function enqueueCommonCss(): void
    {
        $cssFiles = [
            'common' => 'common.css',
            'listing' => 'listing.css',
            'stripe' => 'stripe.css',
            'trip' => 'trip.css',
            'activity' => 'activity.css',
            'destination' => 'destination.css',
            'yatra-capacity' => 'yatra-capacity.css',
            'video-player' => 'video-player.css',
            'tour-viewer' => 'tour-viewer.css',
        ];

        self::registerCoreFrontendStylesheets();

        if (wp_style_is('yatra-fontawesome-6', 'registered')) {
            wp_enqueue_style('yatra-fontawesome-6');
        }

        foreach ($cssFiles as $handle => $filename) {
            $filePath = YATRA_PLUGIN_PATH . "assets/css/{$filename}";
            if (!file_exists($filePath)) {
                continue;
            }
            $styleHandle = 'yatra-' . $handle;
            $ver = YATRA_VERSION . '.' . filemtime($filePath);

            if ($handle === 'common') {
                if (wp_style_is('yatra-common', 'registered')) {
                    wp_enqueue_style('yatra-common');
                } else {
                    $deps = wp_style_is('yatra-fontawesome-6', 'registered') ? ['yatra-fontawesome-6'] : [];
                    wp_enqueue_style($styleHandle, YATRA_PLUGIN_URL . "assets/css/{$filename}", $deps, $ver);
                }
                continue;
            }

            $deps = [];
            if ($handle !== 'common' && wp_style_is('yatra-common', 'registered')) {
                $deps[] = 'yatra-common';
            }

            wp_enqueue_style(
                $styleHandle,
                YATRA_PLUGIN_URL . "assets/css/{$filename}",
                $deps,
                $ver
            );
        }

        $this->enqueueFrontendThemeVariables();
        $this->enqueueFrontendLayoutVariables();
    }

    /**
     * Override design tokens from Settings (single primary color → related shades).
     */
    private function enqueueFrontendThemeVariables(): void
    {
        if (!wp_style_is('yatra-common', 'enqueued')) {
            return;
        }
        $primary = \Yatra\Services\SettingsService::getString(
            'frontend_primary_color',
            \Yatra\Utils\FrontendThemeCss::DEFAULT_PRIMARY
        );
        $primary = \Yatra\Utils\FrontendThemeCss::sanitizePrimaryColor($primary);
        if (strtolower($primary) === strtolower(\Yatra\Utils\FrontendThemeCss::DEFAULT_PRIMARY)) {
            return;
        }
        $css = \Yatra\Utils\FrontendThemeCss::buildInlineRootCss($primary);
        if ($css !== '') {
            wp_add_inline_style('yatra-common', $css);
        }
    }

    /**
     * Align --yatra-container-max-width with the active theme (theme.json wide/content size or $content_width).
     */
    private function enqueueFrontendLayoutVariables(): void
    {
        if (!wp_style_is('yatra-common', 'enqueued')) {
            return;
        }
        $fromSetting = \Yatra\Utils\FrontendThemeCss::sanitizeContainerMaxWidthSetting(
            \Yatra\Services\SettingsService::getString('frontend_container_max_width', '')
        );
        $max = $fromSetting !== ''
            ? $fromSetting
            : \Yatra\Utils\FrontendThemeCss::resolveThemeContainerMaxWidth();
        if ($max === null || $max === '') {
            return;
        }
        $maxEsc = esc_attr($max);
        wp_add_inline_style('yatra-common', ':root{--yatra-container-max-width:' . $maxEsc . ';}');
    }

    /**
     * Enqueue common JavaScript files
     *
     * @return void
     */
    private function enqueueCommonJs(): void
    {
        $jsFiles = [
            'api-helper' => 'api-helper.js',
            'video-player' => 'video-player.js',
            'tour-viewer' => 'tour-viewer.js',
            'listing' => 'listing.js',
            'listing-filters' => 'listing-filters.js',
            'stripe' => 'stripe.js',
            'trip' => 'trip.js',
        ];

        foreach ($jsFiles as $handle => $filename) {
            $filePath = YATRA_PLUGIN_PATH . "assets/js/{$filename}";
            if (file_exists($filePath)) {
                // Set dependencies
                $dependencies = ['jquery'];
                if ($handle === 'trip') {
                    $dependencies[] = 'yatra-api-helper';
                }
                // Scripts that call `wp.i18n.__()` for user-facing
                // strings need wp-i18n as a dependency so the global
                // exists before they run AND a `wp_set_script_translations`
                // call below so WordPress loads each one's Jed JSON
                // catalog (each handle has its own md5-named JSON
                // because the .po references their respective source
                // file paths). Add a handle here whenever you wrap a
                // new string in __() inside its file.
                $i18nHandles = ['trip', 'listing', 'stripe', 'tour-viewer', 'video-player'];
                if (in_array($handle, $i18nHandles, true)) {
                    $dependencies[] = 'wp-i18n';
                }

                wp_enqueue_script(
                    "yatra-{$handle}",
                    YATRA_PLUGIN_URL . "assets/js/{$filename}",
                    $dependencies,
                    YATRA_VERSION . '.' . filemtime($filePath),
                    true
                );

                // Mirror the wp-i18n dep list above. wp_set_script_translations
                // tells WordPress where to look for this script's Jed JSON
                // catalog (path = plugin's i18n/languages/) and the loader
                // hashes md5(handle src) to find the right file.
                if (in_array($handle, $i18nHandles, true)
                    && function_exists('wp_set_script_translations')
                ) {
                    wp_set_script_translations(
                        "yatra-{$handle}",
                        'yatra',
                        YATRA_PLUGIN_PATH . 'i18n/languages'
                    );
                }
            }
        }

        if (\Yatra\Services\SettingsService::wishlistEnabled()) {
            $wishPath = YATRA_PLUGIN_PATH . 'assets/js/listing-wishlist.js';
            if (file_exists($wishPath)) {
                wp_enqueue_script(
                    'yatra-listing-wishlist',
                    YATRA_PLUGIN_URL . 'assets/js/listing-wishlist.js',
                    ['jquery', 'wp-i18n'],
                    YATRA_VERSION . '.' . filemtime($wishPath),
                    true
                );
                if (function_exists('wp_set_script_translations')) {
                    wp_set_script_translations(
                        'yatra-listing-wishlist',
                        'yatra',
                        YATRA_PLUGIN_PATH . 'i18n/languages'
                    );
                }
                wp_localize_script('yatra-listing-wishlist', 'yatraWishlistConfig', [
                    'enabled' => true,
                    'restUrl' => rest_url('yatra/v1'),
                    'nonce' => wp_create_nonce('wp_rest'),
                    'isLoggedIn' => is_user_logged_in(),
                    'loginUrl' => wp_login_url(),
                    'i18n' => [
                        'loginRequired' => __('Login Required', 'yatra'),
                        'loginPrompt'   => __('Please login to save trips to your wishlist.', 'yatra'),
                        'login'         => __('Login', 'yatra'),
                        'cancel'        => __('Cancel', 'yatra'),
                        'genericError'  => __('An error occurred. Please try again.', 'yatra'),
                        'saved'         => __('Trip saved to wishlist', 'yatra'),
                        'removed'       => __('Trip removed from wishlist', 'yatra'),
                        'saveFailed'    => __('Failed to save trip', 'yatra'),
                        'removeFailed'  => __('Failed to remove trip', 'yatra'),
                        'addAria'       => __('Add to favorites', 'yatra'),
                        'removeAria'    => __('Remove from favorites', 'yatra'),
                    ],
                ]);
            }
        }
    }

    /**
     * Enqueue page-specific assets
     *
     * @return void
     */
    private function enqueuePageSpecificAssets(): void
    {
        if (yatra_is_account_page()) {
            $this->enqueueAccountAssets();

            return;
        }

        // Check current page context and enqueue specific assets using helper functions
        if (yatra_is_trip_listing()) {
            $this->enqueueTripListingAssets();
        }

        if (yatra_is_single_trip()) {
            $this->enqueueTripDetailAssets();
        }

        if (yatra_is_activity_listing()) {
            $this->enqueueActivityListingAssets();
        }

        if (yatra_is_destination_listing()) {
            $this->enqueueDestinationListingAssets();
        }

        if (yatra_is_booking_page()) {
            $this->enqueueBookingAssets();
        }

        if (yatra_is_taxonomy_page()) {
            // Taxonomy pages use the same assets as trip listing
            $this->enqueueTripListingAssets();
        }
    }

    /**
     * Enqueue trip listing specific assets
     *
     * @return void
     */
    private function enqueueTripListingAssets(): void
    {
        $this->enqueueListingFiltersJs();
    }

    /**
     * Enqueue trip detail specific assets
     *
     * @return void
     */
    private function enqueueTripDetailAssets(): void
    {
        // Enqueue booking assets for trip detail pages (booking forms)
        $bookingJs = YATRA_PLUGIN_PATH . 'assets/js/booking.js';
        if (file_exists($bookingJs)) {
            wp_enqueue_script(
                'yatra-booking',
                YATRA_PLUGIN_URL . 'assets/js/booking.js',
                ['jquery', 'wp-i18n'],
                YATRA_VERSION . '.' . filemtime($bookingJs),
                true
            );
            if (function_exists('wp_set_script_translations')) {
                wp_set_script_translations(
                    'yatra-booking',
                    'yatra',
                    YATRA_PLUGIN_PATH . 'i18n/languages'
                );
            }
        }

        // Mobile sticky-sidebar + flatpickr init for the single-trip page. Lives in a
        // dedicated file rather than as inline <script> in the partial because
        // WordPress core's `convert_chars` filter (hooked to the_content) rewrites the
        // `&&` operators inside inline scripts as `&#038;&#038;` — JS parsers don't
        // decode HTML entities inside <script>, producing a SyntaxError. As a properly
        // enqueued external file, the source is delivered verbatim.
        $sidebarJs = YATRA_PLUGIN_PATH . 'assets/js/single-trip-sidebar.js';
        if (file_exists($sidebarJs)) {
            wp_enqueue_script(
                'yatra-single-trip-sidebar',
                YATRA_PLUGIN_URL . 'assets/js/single-trip-sidebar.js',
                ['yatra-trip', 'wp-i18n'], // depends on window.yatraTripData from yatra-trip
                YATRA_VERSION . '.' . filemtime($sidebarJs),
                true
            );
            if (function_exists('wp_set_script_translations')) {
                wp_set_script_translations(
                    'yatra-single-trip-sidebar',
                    'yatra',
                    YATRA_PLUGIN_PATH . 'i18n/languages'
                );
            }
        }
        
        // Localize trip page data for JS (trip.js, booking.js)
        global $trip;

        $permalink_structure = get_option('permalink_structure') ?: '';
        $is_plain = empty($permalink_structure);

        $trip_id = null;
        $trip_slug = null;
        $has_trip = isset($trip) && is_object($trip) && isset($trip->id);
        if ($has_trip) {
            $trip_id = (int) $trip->id;
        }
        if ($has_trip && isset($trip->slug)) {
            $trip_slug = $trip->slug;
        }

        $tripData = [
            'apiUrl' => rest_url('yatra/v1'),
            'restUrl' => rest_url(),
            'siteUrl' => site_url(),
            'bookingBase' => \Yatra\Services\SettingsService::getBookingBase(),
            'permalinkStructure' => $is_plain ? 'plain' : $permalink_structure,
            'nonce' => wp_create_nonce('wp_rest'),
            'tripId' => $trip_id,
            'tripSlug' => $trip_slug,
            'wishlistEnabled' => \Yatra\Services\SettingsService::wishlistEnabled(),
            'isLoggedIn' => is_user_logged_in(),
            // Regional settings
            'timezone' => \Yatra\Services\SettingsService::getString('timezone', 'UTC'),
            'dateFormat' => \Yatra\Services\SettingsService::getString('date_format', 'Y-m-d'),
            'timeFormat' => \Yatra\Services\SettingsService::getString('time_format', 'H:i'),
            // Currency/settings
            'currency' => \Yatra\Services\SettingsService::getCurrency(),
            'currencyPosition' => \Yatra\Services\SettingsService::getString('currency_position', 'left'),
            'currency_position' => \Yatra\Services\SettingsService::getString('currency_position', 'left'),
            'decimalPlaces' => (int) \Yatra\Services\SettingsService::getString('currency_decimals', '2'),
            'thousandSeparator' => \Yatra\Services\SettingsService::getString('thousand_separator', ','),
            'decimalSeparator' => \Yatra\Services\SettingsService::getString('decimal_separator', '.'),
            'basePrice' => 0.0,
            'currencySymbol' => function_exists('yatra_get_currency_symbol')
                ? yatra_get_currency_symbol(\Yatra\Services\SettingsService::getCurrency())
                : '$',
            'availabilityDates' => [],
            'groupDiscountsUrl' => rest_url('yatra/v1/discounts/group-discounts'),
            'dynamicPricingDisplay' => apply_filters('yatra_get_dynamic_pricing_display_settings', [
                'show_original_price' => true,
                'show_savings_badge' => true,
                'show_urgency_messages' => false,
            ]),
            'pricingType' => 'regular',
            'sidebarAvailability' => [],
            'sidebarGroupDiscounts' => [],
            'flatpickrLocale' => $this->buildFlatpickrLocalePayload(),
        ];

        if ($has_trip) {
            if (function_exists('yatra_single_trip_calculate_base_price')) {
                $pricing_data = yatra_single_trip_calculate_base_price($trip);
                $tripData['basePrice'] = (float) ($pricing_data['base_price'] ?? 0);
            }
            if (method_exists($trip, 'getAvailabilityDates')) {
                $tripData['availabilityDates'] = array_values(array_filter(array_map(static function ($avail) {
                    if (is_object($avail)) {
                        return $avail->departure_date ?? $avail->date ?? null;
                    }
                    if (is_array($avail)) {
                        return $avail['departure_date'] ?? $avail['date'] ?? null;
                    }

                    return null;
                }, $trip->getAvailabilityDates())));
            }
            if (function_exists('yatra_single_trip_get_client_booking_payload')) {
                $bookingPayload = yatra_single_trip_get_client_booking_payload($trip);
                $tripData['pricingType'] = $bookingPayload['pricingType'];
                $tripData['sidebarAvailability'] = $bookingPayload['sidebarAvailability'];
                $tripData['sidebarGroupDiscounts'] = $bookingPayload['sidebarGroupDiscounts'];
            }
        }

        wp_localize_script('yatra-trip', 'yatraTripData', $tripData);
        $tripTitle = '';
        if ($has_trip && isset($trip->title)) {
            $tripTitle = is_string($trip->title) ? $trip->title : '';
        }
        wp_localize_script('yatra-booking', 'yatraBookingData', array_merge(
            $tripData,
            $this->getStripeFrontendBookingPayload(),
            [
                'tripTitle' => $tripTitle !== '' ? $tripTitle : ($tripData['tripTitle'] ?? 'Trip Booking'),
                // booking page expects these keys; leave placeholders if not set on trip view
                'isRemainingPayment' => false,
                'remainingAmount' => 0,
                'totalAmount' => 0,
                'amountPaid' => 0,
                // Booking-scoped CSRF nonce — covers BOTH logged-in and
                // guest checkouts. The REST endpoint's public
                // permission_callback intentionally bypasses the WP REST
                // cookie/nonce check (so guests can hit it at all);
                // this token is what gates the actual write. The JS
                // forwards it in the `X-Yatra-Booking-Nonce` header on
                // every booking-create / booking-update POST.
                'bookingNonce' => wp_create_nonce('yatra_booking_action'),
            ]
        ));
    }

    /**
     * Enqueue activity listing specific assets
     *
     * @return void
     */
    private function enqueueActivityListingAssets(): void
    {
        // Activity listing specific assets
        $filePath = YATRA_PLUGIN_PATH . 'assets/css/activity.css';
        if (file_exists($filePath)) {
            wp_enqueue_style(
                'yatra-activity-listing',
                YATRA_PLUGIN_URL . 'assets/css/activity.css',
                [],
                YATRA_VERSION . '.' . filemtime($filePath)
            );
        }
    }

    /**
     * Enqueue destination listing specific assets
     *
     * @return void
     */
    private function enqueueDestinationListingAssets(): void
    {
        // Destination listing specific assets
        $filePath = YATRA_PLUGIN_PATH . 'assets/css/destination.css';
        if (file_exists($filePath)) {
            wp_enqueue_style(
                'yatra-destination-listing',
                YATRA_PLUGIN_URL . 'assets/css/destination.css',
                [],
                YATRA_VERSION . '.' . filemtime($filePath)
            );
        }
    }

    /**
     * Enqueue booking specific assets
     *
     * @return void
     */
    private function enqueueBookingAssets(): void
    {
        // Enqueue booking-specific CSS
        $bookingCss = YATRA_PLUGIN_PATH . 'assets/css/booking.css';
        if (file_exists($bookingCss)) {
            wp_enqueue_style(
                'yatra-booking',
                YATRA_PLUGIN_URL . 'assets/css/booking.css',
                ['yatra-common'],
                YATRA_VERSION . '.' . filemtime($bookingCss)
            );
        }
        
        // Enqueue booking-specific JavaScript
        $bookingJs = YATRA_PLUGIN_PATH . 'assets/js/booking.js';
        if (file_exists($bookingJs)) {
            wp_enqueue_script(
                'yatra-booking',
                YATRA_PLUGIN_URL . 'assets/js/booking.js',
                ['jquery'],
                YATRA_VERSION . '.' . filemtime($bookingJs),
                true
            );
        }
        
        // Localize booking data for booking.js
        $permalink_structure = get_option('permalink_structure') ?: '';
        $is_plain = empty($permalink_structure);

        $deposit_pct_store = (int) \Yatra\Services\SettingsService::get('deposit_percentage', 20);
        $partial_pct_store = (int) \Yatra\Services\SettingsService::get('partial_payment_percentage', 30);
        $deposit_pct_resolved = (int) apply_filters('yatra_deposit_percentage', $deposit_pct_store);
        $partial_pct_resolved = (int) apply_filters('yatra_partial_payment_percentage', $partial_pct_store);
        $flexible_payments_enabled = (bool) apply_filters('yatra_flexible_payments_enabled', false);
        $flexible_module_on = class_exists(ModuleManager::class)
            ? ModuleManager::isModuleEnabled('flexible_payments')
            : false;

        Logger::debug('Yatra booking localize: flexible payment snapshot', [
            'context' => 'booking_localize',
            'flexible_payments_enabled' => $flexible_payments_enabled,
            'flexible_payments_module' => $flexible_module_on,
            'partial_payment_setting' => (bool) \Yatra\Services\SettingsService::get('partial_payment', false),
            'deposit_required_setting' => (bool) \Yatra\Services\SettingsService::get('deposit_required', false),
            'deposit_percentage_store' => $deposit_pct_store,
            'partial_percentage_store' => $partial_pct_store,
            'deposit_percentage_resolved' => $deposit_pct_resolved,
            'partial_percentage_resolved' => $partial_pct_resolved,
        ]);

        $bookingData = [
            'apiUrl' => rest_url('yatra/v1'),
            'restUrl' => rest_url(),
            'siteUrl' => site_url(),
            'bookingBase' => \Yatra\Services\SettingsService::getBookingBase(),
            'permalinkStructure' => $is_plain ? 'plain' : $permalink_structure,
            'nonce' => wp_create_nonce('wp_rest'),
            // Booking-scoped CSRF nonce. See enqueueTripDetailAssets()
            // for the rationale: the booking REST endpoint bypasses
            // the WP REST cookie/nonce check (so guests can use it),
            // and this token is what gates the actual booking write.
            'bookingNonce' => wp_create_nonce('yatra_booking_action'),
            'currency' => \Yatra\Services\SettingsService::getCurrency(),
            'currencyPosition' => \Yatra\Services\SettingsService::getString('currency_position', 'left'),
            'currency_position' => \Yatra\Services\SettingsService::getString('currency_position', 'left'),
            'decimalPlaces' => (int) \Yatra\Services\SettingsService::getString('currency_decimals', '2'),
            'thousandSeparator' => \Yatra\Services\SettingsService::getString('thousand_separator', ','),
            'decimalSeparator' => \Yatra\Services\SettingsService::getString('decimal_separator', '.'),
            // Payment gateways data
            'paymentGateways' => apply_filters('yatra_payment_gateways', \Yatra\Services\SettingsService::get('payment_gateways', [])),
            'paymentMethods' => \Yatra\Services\SettingsService::get('payment_methods', []),
            'paymentTestMode' => \Yatra\Services\SettingsService::get('payment_test_mode', false),
            'partialPayment' => \Yatra\Services\SettingsService::get('partial_payment', false),
            'partialPaymentPercentage' => \Yatra\Services\SettingsService::get('partial_payment_percentage', 0),
            // Flexible payments (Pro) — keep these keys stable for frontend booking.js.
            // Values are resolved via generic filters so Pro can override without hard-coding premium logic here.
            'depositRequired' => (bool) \Yatra\Services\SettingsService::get('deposit_required', false),
            'depositPercentage' => $deposit_pct_resolved,
            'partialPercentage' => $partial_pct_resolved,
            'gatewayOrder' => \Yatra\Services\SettingsService::get('gateway_order', []),
            'autoConfirmPayLater' => \Yatra\Services\SettingsService::get('auto_confirm_pay_later', true),
            'allowWaitlist' => \Yatra\Services\SettingsService::isEnabled('allow_waitlist'),
            'waitlistAutoConfirm' => \Yatra\Services\SettingsService::isEnabled('waitlist_auto_confirm'),
            'gateways' => apply_filters('yatra_payment_gateways', \Yatra\Services\SettingsService::get('payment_gateways', [])),
            'enabledGateways' => \Yatra\Services\SettingsService::get('payment_gateways', []),
        ];

        $bookingData = array_merge($bookingData, $this->getStripeFrontendBookingPayload());

        wp_localize_script('yatra-booking', 'yatraBookingData', $bookingData);
    }

    /**
     * Enqueue account page specific assets
     *
     * @return void
     */
    private function enqueueAccountAssets(): void
    {
        // Account bundle shares admin Vite chunks; CSS is extracted to admin/dist/css (ES modules do not auto-load it).
        $reactVendorCss = YATRA_PLUGIN_PATH . 'assets/admin/dist/css/react-vendor.css';
        if (file_exists($reactVendorCss)) {
            wp_enqueue_style(
                'yatra-account-react-vendor',
                YATRA_PLUGIN_URL . 'assets/admin/dist/css/react-vendor.css',
                [],
                YATRA_VERSION . '.' . filemtime($reactVendorCss)
            );
        }

        $accountUiCss = YATRA_PLUGIN_PATH . 'assets/admin/dist/css/index.css';
        $accountUiDeps = file_exists($reactVendorCss) ? ['yatra-account-react-vendor'] : [];
        if (file_exists($accountUiCss)) {
            wp_enqueue_style(
                'yatra-account-ui',
                YATRA_PLUGIN_URL . 'assets/admin/dist/css/index.css',
                $accountUiDeps,
                YATRA_VERSION . '.' . filemtime($accountUiCss)
            );
        }

        // Vite build outputs to assets/dist/js/account-page.js (ES module + shared chunks).
        $accountJs = YATRA_PLUGIN_PATH . 'assets/dist/js/account-page.js';
        if (!file_exists($accountJs)) {
            return;
        }

        wp_enqueue_script(
            'yatra-account-page',
            YATRA_PLUGIN_URL . 'assets/dist/js/account-page.js',
            [],
            YATRA_VERSION . '.' . filemtime($accountJs),
            true
        );

        wp_script_add_data('yatra-account-page', 'type', 'module');

        wp_localize_script('yatra-account-page', 'yatraAccountPage', [
            'apiUrl' => rest_url('yatra/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
            'userId' => get_current_user_id(),
            'siteUrl' => site_url(),
            'logoutUrl' => wp_logout_url(home_url('/')),
            'companyPhone' => \Yatra\Services\SettingsService::getString('company_phone', ''),
            'companyName' => \Yatra\Services\SettingsService::getString('company_name', ''),
            'companyEmail' => \Yatra\Services\SettingsService::getString('company_email', ''),
            'currency' => \Yatra\Services\SettingsService::getCurrency(),
            'currencyPosition' => \Yatra\Services\SettingsService::getString('currency_position', 'left'),
            'currency_position' => \Yatra\Services\SettingsService::getString('currency_position', 'left'),
            'decimalPlaces' => (int) \Yatra\Services\SettingsService::getString('currency_decimals', '2'),
            'thousandSeparator' => \Yatra\Services\SettingsService::getString('thousand_separator', ','),
            'decimalSeparator' => \Yatra\Services\SettingsService::getString('decimal_separator', '.'),
            'locale' => get_locale(),
            // Full ISO country map (code => name) so the account profile can show
            // full country names and render the country dropdown. Mirrors the
            // admin (`yatraAdmin.countries`); honours the `yatra_countries_list` filter.
            'countries' => class_exists('\\Yatra\\Helpers\\FormatHelper')
                ? \Yatra\Helpers\FormatHelper::getCountries()
                : [],
            'translations' => $this->getFrontendTranslations(),
            'wishlistEnabled' => \Yatra\Services\SettingsService::wishlistEnabled(),
        ]);

        // Match admin React (`yatra-admin`): register Jed translations for this handle so `wp.i18n` resolves
        // strings from PHP/Loco JSON catalogs. Without this, only keys in `translations` above work; the rest
        // stay English because the account bundle is not in `yatra-admin`'s Jed file (different script hash).
        if (function_exists('wp_set_script_translations')) {
            wp_set_script_translations('yatra-account-page', 'yatra', YATRA_PLUGIN_PATH . 'i18n/languages');
        }
    }

    /**
     * Enqueue listing filters JavaScript
     *
     * @return void
     */
    private function enqueueListingFiltersJs(): void
    {
        $filtersJs = YATRA_PLUGIN_PATH . 'assets/js/listing-filters.js';
        if (file_exists($filtersJs)) {
            wp_enqueue_script(
                'yatra-listing-filters',
                YATRA_PLUGIN_URL . 'assets/js/listing-filters.js',
                ['jquery'],
                YATRA_VERSION . '.' . filemtime($filtersJs),
                true
            );

            // Add currency formatting function
            wp_add_inline_script('yatra-listing-filters', "
                window.yatra_format_price = function(amount) {
                    if (!amount || amount == 0) return '" . esc_js(__('Contact for pricing', 'yatra')) . "';
                    const currency = window.yatraSettings?.currency || 'USD';
                    const symbol = window.yatraSettings?.currencySymbol || '$';
                    return symbol + amount.toLocaleString();
                };
            ");
        }
    }

    /**
     * Month and weekday labels for Flatpickr from {@see \WP_Locale} (site language).
     *
     * @return array<string, mixed>
     */
    private function buildFlatpickrLocalePayload(): array
    {
        global $wp_locale;

        $first_day = (int) get_option('start_of_week', 1);
        $first_day = max(0, min(6, $first_day));

        if (!($wp_locale instanceof \WP_Locale)) {
            return [
                'firstDayOfWeek' => $first_day,
            ];
        }

        // IMPORTANT — `month_abbrev` and `weekday_abbrev` are keyed by the
        // TRANSLATED LONG NAME, not by a numeric index:
        //
        //   $wp_locale->month['01']                          = 'January'    (or 'जनवरी', 'enero'…)
        //   $wp_locale->month_abbrev['January']              = 'Jan'        (or 'जन', 'ene'…)
        //
        // An earlier version of this code mistakenly indexed
        // month_abbrev by '01'..'12' / weekday_abbrev by 0..6, which
        // ALWAYS returned null → flatpickr's locale.months.shorthand
        // shipped as an array of empty strings → the `M` token in any
        // altFormat rendered as nothing. Net effect: a date set to
        // "19 May 2026" displayed as "19  2026" (no month) under any
        // non-en_US locale that exposed the bug.
        //
        // WP_Locale exposes get_month_abbrev() / get_weekday_abbrev()
        // which take the long name and do the right lookup. We use
        // those so the indexing rule lives inside core, not here.
        $months_long = [];
        $months_short = [];
        for ($m = 1; $m <= 12; ++$m) {
            $key = sprintf('%02d', $m);
            $long = $wp_locale->month[$key] ?? '';
            $short = $long !== '' ? (string) $wp_locale->get_month_abbrev($long) : '';
            $months_long[] = $long;
            // Final fallback to the long name if the locale has no
            // abbreviated form — better than shipping an empty string
            // that flatpickr would render as blank.
            $months_short[] = $short !== '' ? $short : $long;
        }

        $weekdays_long = [];
        $weekdays_short = [];
        for ($d = 0; $d <= 6; ++$d) {
            $long = $wp_locale->weekday[$d] ?? '';
            $short = $long !== '' ? (string) $wp_locale->get_weekday_abbrev($long) : '';
            $weekdays_long[] = $long;
            $weekdays_short[] = $short !== '' ? $short : $long;
        }

        $payload = [
            'weekdays' => [
                'shorthand' => $weekdays_short,
                'longhand' => $weekdays_long,
            ],
            'months' => [
                'shorthand' => $months_short,
                'longhand' => $months_long,
            ],
            'firstDayOfWeek' => $first_day,
        ];

        return apply_filters('yatra_flatpickr_locale', $payload);
    }

    /**
     * Get frontend translations
     *
     * @return array
     */
    private function getFrontendTranslations(): array
    {
        return [
            // Account page
            'My Account' => __('My Account', 'yatra'),
            'My Bookings' => __('My Bookings', 'yatra'),
            'Account Settings' => __('Account Settings', 'yatra'),
            'Logout' => __('Logout', 'yatra'),
            'Login' => __('Login', 'yatra'),
            'Register' => __('Register', 'yatra'),

            // Booking related
            'Booking Details' => __('Booking Details', 'yatra'),
            'Booking Status' => __('Booking Status', 'yatra'),
            'Total Amount' => __('Total Amount', 'yatra'),
            'Payment Status' => __('Payment Status', 'yatra'),
            'View Details' => __('View Details', 'yatra'),

            // Common
            'Loading...' => __('Loading...', 'yatra'),
            'No data available' => __('No data available', 'yatra'),
            'Error loading data' => __('Error loading data', 'yatra'),
            'Please try again' => __('Please try again', 'yatra'),

            // Currency and pricing
            'Contact for pricing' => __('Contact for pricing', 'yatra'),
            'Free' => __('Free', 'yatra'),
            'Price' => __('Price', 'yatra'),

            // Trip related
            'Trip Details' => __('Trip Details', 'yatra'),
            'Duration' => __('Duration', 'yatra'),
            'Difficulty' => __('Difficulty', 'yatra'),
            'Group Size' => __('Group Size', 'yatra'),

            // Navigation
            'Home' => __('Home', 'yatra'),
            'Trips' => __('Trips', 'yatra'),
            'Destinations' => __('Destinations', 'yatra'),
            'Activities' => __('Activities', 'yatra'),
            'About Us' => __('About Us', 'yatra'),
            'Contact' => __('Contact', 'yatra'),
        ];
    }

    /**
     * Enqueue assets for specific shortcodes
     *
     * @param array $shortcodes Array of shortcodes that need assets
     * @return void
     */
    public function enqueueShortcodeAssets(array $shortcodes): void
    {
        global $post;

        if (!$post || !has_shortcode($post->post_content, $shortcodes)) {
            return;
        }

        // Enqueue common frontend assets for shortcodes
        $this->enqueueCommonAssets();

        // Shortcode-specific assets can be added here based on $shortcodes array
        foreach ($shortcodes as $shortcode) {
            switch ($shortcode) {
                case 'yatra_trip_listing':
                    $this->enqueueTripListingAssets();
                    break;
                case 'yatra_cart':
                case 'yatra_checkout':
                    $this->enqueueBookingAssets();
                    break;
                case 'yatra_my_account':
                    $this->enqueueAccountAssets();
                    break;
            }
        }
    }

    /**
     * Enqueue assets conditionally based on custom conditions
     *
     * @param callable $condition Function that returns true if assets should be enqueued
     * @return void
     */
    public function enqueueConditionalAssets(callable $condition): void
    {
        if ($condition()) {
            $this->enqueueAssets();
        }
    }

    /**
     * Get asset URL with versioning
     *
     * @param string $path Relative path to asset
     * @param string $type 'css' or 'js'
     * @return string Asset URL or empty string if file doesn't exist
     */
    public function getAssetUrl(string $path, string $type = 'css'): string
    {
        $basePath = $type === 'css' ? 'assets/css/' : 'assets/js/';
        $fullPath = YATRA_PLUGIN_PATH . $basePath . $path;

        if (!file_exists($fullPath)) {
            return '';
        }

        $version = YATRA_VERSION . '.' . filemtime($fullPath);
        return YATRA_PLUGIN_URL . $basePath . $path . '?ver=' . $version;
    }

    /**
     * Check if asset file exists
     *
     * @param string $path Relative path to asset
     * @param string $type 'css' or 'js'
     * @return bool
     */
    public function assetExists(string $path, string $type = 'css'): bool
    {
        $basePath = $type === 'css' ? 'assets/css/' : 'assets/js/';
        $fullPath = YATRA_PLUGIN_PATH . $basePath . $path;
        return file_exists($fullPath);
    }

    /**
     * Stripe Elements (assets/js/stripe.js) expects publishableKey under yatraBookingData.stripe.
     * Mirror YatraPro StripeGateway::loadConfig() live/test selection; never expose secret keys.
     *
     * @return array<string, mixed>
     */
    private function getStripeFrontendBookingPayload(): array
    {
        $allConfigs = get_option('yatra_gateway_configs', []);
        if (is_string($allConfigs)) {
            $maybe = maybe_unserialize($allConfigs);
            $allConfigs = is_array($maybe) ? $maybe : [];
        }
        if (!is_array($allConfigs)) {
            $allConfigs = [];
        }

        $stripe = isset($allConfigs['stripe']) && is_array($allConfigs['stripe'])
            ? $allConfigs['stripe']
            : [];

        $test = filter_var(\Yatra\Services\SettingsService::get('payment_test_mode', true), FILTER_VALIDATE_BOOLEAN);

        $livePub = trim((string) ($stripe['live_publishable_key'] ?? ''));
        $testPub = trim((string) ($stripe['test_publishable_key'] ?? ''));

        $publishableKey = trim((string) ($stripe['api_key'] ?? ''));
        if ($test) {
            if ($testPub !== '') {
                $publishableKey = $testPub;
            }
        } elseif ($livePub !== '') {
            $publishableKey = $livePub;
        }

        // Match StripeGateway default + admin multi-select when unset (was dropped by old sanitizer).
        $defaultMethods = 'card,google_pay,apple_pay';
        $enabledMethods = $stripe['enabled_methods'] ?? $defaultMethods;
        if (is_array($enabledMethods)) {
            // stripe.js accepts an array of method ids
        } elseif (!is_string($enabledMethods) || trim($enabledMethods) === '') {
            $enabledMethods = $defaultMethods;
        }

        $companyCountry = trim((string) \Yatra\Services\SettingsService::get('company_country', ''));
        if ($companyCountry === '') {
            $companyCountry = 'US';
        }

        $payload = [
            'stripe' => [
                'publishableKey' => $publishableKey,
                'enabledMethods' => $enabledMethods,
            ],
            'companyCountry' => $companyCountry,
        ];

        return apply_filters('yatra_booking_stripe_frontend_data', $payload, $stripe, $test);
    }
}
