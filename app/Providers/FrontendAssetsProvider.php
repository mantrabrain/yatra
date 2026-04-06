<?php

declare(strict_types=1);

namespace Yatra\Providers;

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
        // Hook into WordPress to enqueue assets
        add_action('wp_enqueue_scripts', [$this, 'enqueueAssets']);
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

        foreach ($cssFiles as $handle => $filename) {
            $filePath = YATRA_PLUGIN_PATH . "assets/css/{$filename}";
            if (file_exists($filePath)) {
                wp_enqueue_style(
                    "yatra-{$handle}",
                    YATRA_PLUGIN_URL . "assets/css/{$filename}",
                    [],
                    YATRA_VERSION . '.' . filemtime($filePath)
                );
            }
        }
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
                
                wp_enqueue_script(
                    "yatra-{$handle}",
                    YATRA_PLUGIN_URL . "assets/js/{$filename}",
                    $dependencies,
                    YATRA_VERSION . '.' . filemtime($filePath),
                    true
                );
            }
        }

        if (\Yatra\Services\SettingsService::wishlistEnabled()) {
            $wishPath = YATRA_PLUGIN_PATH . 'assets/js/listing-wishlist.js';
            if (file_exists($wishPath)) {
                wp_enqueue_script(
                    'yatra-listing-wishlist',
                    YATRA_PLUGIN_URL . 'assets/js/listing-wishlist.js',
                    ['jquery'],
                    YATRA_VERSION . '.' . filemtime($wishPath),
                    true
                );
                wp_localize_script('yatra-listing-wishlist', 'yatraWishlistConfig', [
                    'enabled' => true,
                    'restUrl' => rest_url('yatra/v1'),
                    'nonce' => wp_create_nonce('wp_rest'),
                    'isLoggedIn' => is_user_logged_in(),
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
        // Additional assets for trip listing can be added here
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
                ['jquery'],
                YATRA_VERSION . '.' . filemtime($bookingJs),
                true
            );
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
            // Currency/settings
            'currency' => \Yatra\Services\SettingsService::getCurrency(),
            'currencyPosition' => \Yatra\Services\SettingsService::getString('currency_position', 'before'),
            'decimalPlaces' => (int) \Yatra\Services\SettingsService::getString('currency_decimals', '2'),
            'thousandSeparator' => \Yatra\Services\SettingsService::getString('thousand_separator', ','),
            'decimalSeparator' => \Yatra\Services\SettingsService::getString('decimal_separator', '.'),
            'basePrice' => 0.0,
            'currencySymbol' => function_exists('yatra_get_currency_symbol')
                ? yatra_get_currency_symbol(\Yatra\Services\SettingsService::getCurrency())
                : '$',
            'availabilityDates' => [],
            'groupDiscountsUrl' => rest_url('yatra/v1/discounts/group-discounts'),
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
        }

        wp_localize_script('yatra-trip', 'yatraTripData', $tripData);
        wp_localize_script('yatra-booking', 'yatraBookingData', array_merge($tripData, [
            // booking page expects these keys; leave placeholders if not set on trip view
            'isRemainingPayment' => false,
            'remainingAmount' => 0,
            'totalAmount' => 0,
            'amountPaid' => 0,
        ]));
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
                [],
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

        $bookingData = [
            'apiUrl' => rest_url('yatra/v1'),
            'restUrl' => rest_url(),
            'siteUrl' => site_url(),
            'bookingBase' => \Yatra\Services\SettingsService::getBookingBase(),
            'permalinkStructure' => $is_plain ? 'plain' : $permalink_structure,
            'nonce' => wp_create_nonce('wp_rest'),
            'currency' => \Yatra\Services\SettingsService::getCurrency(),
            'currencyPosition' => \Yatra\Services\SettingsService::getString('currency_position', 'before'),
            'decimalPlaces' => (int) \Yatra\Services\SettingsService::getString('currency_decimals', '2'),
            'thousandSeparator' => \Yatra\Services\SettingsService::getString('thousand_separator', ','),
            'decimalSeparator' => \Yatra\Services\SettingsService::getString('decimal_separator', '.'),
            // Payment gateways data
            'paymentGateways' => apply_filters('yatra_payment_gateways', \Yatra\Services\SettingsService::get('payment_gateways', [])),
            'paymentMethods' => \Yatra\Services\SettingsService::get('payment_methods', []),
            'paymentTestMode' => \Yatra\Services\SettingsService::get('payment_test_mode', false),
            'partialPayment' => \Yatra\Services\SettingsService::get('partial_payment', false),
            'partialPaymentPercentage' => \Yatra\Services\SettingsService::get('partial_payment_percentage', 0),
            'gatewayOrder' => \Yatra\Services\SettingsService::get('gateway_order', []),
            'autoConfirmPayLater' => \Yatra\Services\SettingsService::get('auto_confirm_pay_later', true),
            'allowWaitlist' => \Yatra\Services\SettingsService::isEnabled('allow_waitlist'),
            'waitlistAutoConfirm' => \Yatra\Services\SettingsService::isEnabled('waitlist_auto_confirm'),
            'gateways' => apply_filters('yatra_payment_gateways', \Yatra\Services\SettingsService::get('payment_gateways', [])),
            'enabledGateways' => \Yatra\Services\SettingsService::get('payment_gateways', []),
        ];

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
            'currencyPosition' => \Yatra\Services\SettingsService::getString('currency_position', 'before'),
            'decimalPlaces' => (int) \Yatra\Services\SettingsService::getString('currency_decimals', '2'),
            'thousandSeparator' => \Yatra\Services\SettingsService::getString('thousand_separator', ','),
            'decimalSeparator' => \Yatra\Services\SettingsService::getString('decimal_separator', '.'),
            'locale' => get_locale(),
            'translations' => $this->getFrontendTranslations(),
            'wishlistEnabled' => \Yatra\Services\SettingsService::wishlistEnabled(),
        ]);
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
}
