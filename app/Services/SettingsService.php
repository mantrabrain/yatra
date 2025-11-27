<?php

declare(strict_types=1);

namespace Yatra\Services;

/**
 * Centralized Settings Service
 * 
 * Provides a single point of access for all plugin settings.
 * Caches settings to avoid multiple database queries.
 * 
 * @package Yatra
 */
class SettingsService
{
    /**
     * Cached settings
     */
    private static ?array $settings = null;

    /**
     * Settings option prefix in database
     * Each setting is stored as yatra_{key}
     */
    private const OPTION_PREFIX = 'yatra_';

    /**
     * Default settings
     */
    private static array $defaults = [
        // General
        'company_name' => '',
        'company_email' => '',
        'company_phone' => '',
        'company_address' => '',
        'date_format' => 'Y-m-d',
        'time_format' => 'H:i',
        
        // Booking
        'booking_base' => 'book',
        'use_booking_page' => false,
        'booking_page_id' => 0,
        'enable_guest_booking' => true,
        'booking_confirmation' => 'manual',
        'booking_expiry_hours' => 24,
        
        // Payment
        'currency' => 'USD',
        'currency_position' => 'before',
        'thousand_separator' => ',',
        'decimal_separator' => '.',
        'decimal_places' => 2,
        'enable_deposit' => false,
        'deposit_type' => 'percentage',
        'deposit_amount' => 20,
        
        // Email
        'email_from_name' => '',
        'email_from_address' => '',
        'admin_email' => '',
        'enable_admin_notifications' => true,
        'enable_customer_notifications' => true,
        
        // Trip
        'trip_base' => 'trip',
        'trips_per_page' => 12,
        'enable_wishlist' => true,
        'enable_comparison' => false,
        'show_sold_out' => true,
        
        // Customer
        'enable_customer_accounts' => true,
        'enable_customer_registration' => true,
        'customer_account_page' => 0,
        
        // Review
        'enable_reviews' => true,
        'require_booking_to_review' => false,
        'auto_approve_reviews' => false,
        'enable_review_moderation' => true,
        'minimum_rating' => 1,
        'review_reminder_days' => 7,
        
        // Tax
        'enable_tax' => false,
        'tax_rate' => 0,
        'tax_inclusive' => false,
        'tax_label' => 'Tax',
        
        // Currency
        'enabled_currencies' => ['USD'],
        'default_currency' => 'USD',
        
        // Notification
        'enable_push_notifications' => false,
        'enable_sms_notifications' => false,
        
        // Permalink
        'destination_base' => 'destination',
        'activity_base' => 'activity',
        'trip_category_base' => 'trip-category',
        
        // Advanced
        'enable_debug_mode' => false,
        'delete_data_on_uninstall' => false,
    ];

    /**
     * Get all settings
     *
     * @return array All settings with defaults applied
     */
    public static function all(): array
    {
        if (self::$settings === null) {
            self::load();
        }

        return self::$settings;
    }

    /**
     * Get a single setting value
     *
     * @param string $key     Setting key (supports dot notation: 'review.enable_reviews')
     * @param mixed  $default Default value if not set
     * @return mixed Setting value or default
     */
    public static function get(string $key, $default = null)
    {
        if (self::$settings === null) {
            self::load();
        }

        // Support dot notation for nested access (future use)
        if (strpos($key, '.') !== false) {
            $keys = explode('.', $key);
            $value = self::$settings;
            foreach ($keys as $k) {
                if (!isset($value[$k])) {
                    return $default ?? (self::$defaults[$key] ?? null);
                }
                $value = $value[$k];
            }
            return $value;
        }

        return self::$settings[$key] ?? $default ?? (self::$defaults[$key] ?? null);
    }

    /**
     * Check if a boolean setting is enabled
     *
     * @param string $key Setting key
     * @return bool
     */
    public static function isEnabled(string $key): bool
    {
        $value = self::get($key, false);
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Get a setting as integer
     *
     * @param string $key     Setting key
     * @param int    $default Default value
     * @return int
     */
    public static function getInt(string $key, int $default = 0): int
    {
        return (int) self::get($key, $default);
    }

    /**
     * Get a setting as float
     *
     * @param string $key     Setting key
     * @param float  $default Default value
     * @return float
     */
    public static function getFloat(string $key, float $default = 0.0): float
    {
        return (float) self::get($key, $default);
    }

    /**
     * Get a setting as string
     *
     * @param string $key     Setting key
     * @param string $default Default value
     * @return string
     */
    public static function getString(string $key, string $default = ''): string
    {
        return (string) self::get($key, $default);
    }

    /**
     * Load settings from database
     * Settings are stored as individual options with yatra_ prefix
     */
    private static function load(): void
    {
        self::$settings = [];
        
        // Load each setting from individual options
        foreach (self::$defaults as $key => $default_value) {
            $option_name = self::OPTION_PREFIX . $key;
            $value = get_option($option_name, $default_value);
            
            // Handle serialized arrays
            if (is_string($value) && is_serialized($value)) {
                $value = maybe_unserialize($value);
            }
            
            self::$settings[$key] = $value;
        }
    }

    /**
     * Reload settings (clear cache)
     */
    public static function reload(): void
    {
        self::$settings = null;
        self::load();
    }

    /**
     * Get default settings
     *
     * @return array
     */
    public static function getDefaults(): array
    {
        return self::$defaults;
    }

    // =========================================
    // Convenience Methods for Common Settings
    // =========================================

    /**
     * Check if reviews are enabled
     */
    public static function reviewsEnabled(): bool
    {
        return self::isEnabled('enable_reviews');
    }

    /**
     * Check if booking is required for reviews
     */
    public static function requireBookingForReview(): bool
    {
        return self::isEnabled('require_booking_to_review');
    }

    /**
     * Check if reviews auto-approve
     */
    public static function autoApproveReviews(): bool
    {
        return self::isEnabled('auto_approve_reviews');
    }

    /**
     * Check if review moderation is enabled
     */
    public static function reviewModerationEnabled(): bool
    {
        return self::isEnabled('enable_review_moderation');
    }

    /**
     * Get minimum rating allowed
     */
    public static function getMinimumRating(): int
    {
        return self::getInt('minimum_rating', 1);
    }

    /**
     * Get currency settings
     */
    public static function getCurrency(): string
    {
        return self::getString('currency', 'USD');
    }

    /**
     * Get currency position (before/after)
     */
    public static function getCurrencyPosition(): string
    {
        return self::getString('currency_position', 'before');
    }

    /**
     * Get trip base slug
     */
    public static function getTripBase(): string
    {
        $base = self::getString('trip_base', 'trip');
        return preg_replace('/[^a-z0-9_-]/i', '', $base) ?: 'trip';
    }

    /**
     * Get booking base slug
     */
    public static function getBookingBase(): string
    {
        $base = self::getString('booking_base', 'book');
        return preg_replace('/[^a-z0-9_-]/i', '', $base) ?: 'book';
    }

    /**
     * Check if using custom booking page
     */
    public static function useCustomBookingPage(): bool
    {
       // var_dump(self::isEnabled('use_booking_page'));exit;
        return self::isEnabled('use_booking_page') && self::getInt('booking_page_id') > 0;
    }

    /**
     * Get booking page ID
     */
    public static function getBookingPageId(): int
    {
        return self::getInt('booking_page_id', 0);
    }

    /**
     * Check if guest booking is allowed
     */
    public static function guestBookingEnabled(): bool
    {
        return self::isEnabled('enable_guest_booking');
    }

    /**
     * Check if wishlist is enabled
     */
    public static function wishlistEnabled(): bool
    {
        return self::isEnabled('enable_wishlist');
    }

    /**
     * Get trips per page
     */
    public static function getTripsPerPage(): int
    {
        return self::getInt('trips_per_page', 12);
    }
}

