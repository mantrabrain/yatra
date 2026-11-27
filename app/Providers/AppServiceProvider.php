<?php

namespace Yatra\Providers;

use WP_REST_Request;
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
        // Capability filters MUST install for every request type (admin,
        // REST, AJAX, frontend, CLI). Previously they were only installed
        // from AdminServiceProvider::registerAdminMenu(), which is hooked
        // on `admin_menu` — a hook that DOES NOT fire during REST API
        // requests. The admin SPA loads all data via REST, so the admin
        // fallback that grants every yatra_* cap to users with
        // manage_options never ran for those requests → site admins hit
        // 403 "REST forbidden" on Settings, Bookings, Trips, etc.
        //
        // AdminServiceProvider itself is gated behind is_admin() in
        // Bootstrap, which is false during pure REST requests, so even
        // calling the static from there isn't enough. AppServiceProvider
        // is in the always-loaded providers list, so calling the
        // installer here guarantees the filters exist for every entry
        // point. add_filter is idempotent — the AdminServiceProvider
        // call stays in place for defence-in-depth.
        \Yatra\Providers\AdminServiceProvider::bootstrapMenuCapability();

        // Activation hook
        register_activation_hook(YATRA_PLUGIN_FILE, [$this, 'activate']);
        
        // Deactivation hook
        register_deactivation_hook(YATRA_PLUGIN_FILE, [$this, 'deactivate']);

        // Database tables: created on activation (see activate()) and on version bump (FreeUpgradeRunner on admin_init).

        // Register shortcodes
        $this->registerShortcodes();

        // Blocks are registered in Bootstrap, not here

        // Initialize template loader for all frontend routing
        \Yatra\Core\TemplateLoader::init();

        // Initialize ItineraryCostService for free itinerary costs feature
        \Yatra\Services\ItineraryCostService::init();

        // Booking fee (3.3): off unless set in Settings → Payment.
        \Yatra\Services\BookingFeeService::init();

        // Accommodation choice + travel insurance at checkout (3.3).
        \Yatra\Services\CheckoutChoiceService::init();

        // Per-person price by group size (3.3).
        \Yatra\Services\GroupPriceTierService::init();

        // 7-day weather forecast on trip pages (3.3, off by default).
        \Yatra\Services\WeatherService::init();

        // Recently viewed trips (3.3, browser storage only, off by default).
        \Yatra\Services\RecentlyViewedService::init();

        // Trips embedder for other websites (3.3, off by default).
        \Yatra\Services\TripEmbedService::init();

        // SliceWP affiliate commissions for bookings (3.3; acts only with SliceWP's "Yatra" integration on).
        \Yatra\Integrations\SliceWP\SliceWPBridge::init();

        // Persist + expose selected additional services on bookings (free fallback).
        \Yatra\Services\AdditionalServicesBookingService::init();

        // Ensure frontend bundles are marked as ES modules
        add_filter('script_loader_tag', [$this, 'addFrontendModuleType'], 10, 2);

        // Initialize utility hooks (admin bar, etc.)
        \Yatra\Hooks\UtilsHooks::init();

        // WPML / Polylang support (no-op without either).
        \Yatra\Multilingual\MultilingualHooks::init();

        // Booking activity log (status changes, emails, notes, price changes).
        \Yatra\Services\BookingActivityService::init();

        // Settings → Labels: rename customer-facing texts.
        \Yatra\Services\LabelOverrideService::init();

        // Payment links: open → balance checkout for the link's amount; a
        // payment arriving on the booking marks the link paid.
        add_action('template_redirect', [\Yatra\Services\PaymentLinkService::class, 'handleRequest'], 1);
        add_action('yatra_payment_completed', static function (...$args): void {
            $bookingId = 0;
            $amount = 0.0;
            if (isset($args[0]) && is_array($args[0])) {
                $bookingId = (int) ($args[0]['booking_id'] ?? 0);
                $amount = (float) ($args[0]['amount'] ?? 0);
            } else {
                $bookingId = (int) ($args[0] ?? 0);
                $amount = (float) (is_array($args[3] ?? null) ? ($args[3]['amount'] ?? 0) : 0);
            }
            if ($bookingId > 0 && $amount > 0) {
                \Yatra\Services\PaymentLinkService::onPaymentCompleted($bookingId, $amount);
            }
        }, 20, 4);

        // Initialize review and enquiry hooks
        \Yatra\Hooks\ReviewHooks::init();

        // Load the reCAPTCHA v3 script on the frontend when enabled (self-guards).
        add_action('wp_enqueue_scripts', ['\\Yatra\\Services\\RecaptchaService', 'enqueueScript']);

        // Garbage-collect deleted-trip IDs out of user wishlist meta.
        \Yatra\Hooks\SavedTripHooks::init();

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

        // Keep a customer's booking statistics derived from the bookings table
        // instead of counted up by hand (which double-counted every checkout).
        \Yatra\Hooks\CustomerStatsHooks::init();

        // Initialize cache hooks
        \Yatra\Hooks\CacheHooks::init();

        // Publish Yatra trips/destinations/activities/categories to sitemaps
        // (WP core, Yoast, Rank Math, AIOSEO) — Yatra content lives in custom
        // tables, so no SEO generator can discover it without this.
        \Yatra\Sitemap\SitemapManager::init();

        add_filter('yatra_require_email_verification', static function (): bool {
            return \Yatra\Services\SettingsService::isEnabled('require_email_verification');
        });
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
