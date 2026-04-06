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
        'booking_confirmation' => true,
        'auto_confirm_bookings' => false,
        'require_login' => false,
        'allow_guest_checkout' => true,
        'cancellation_policy' => 'full_refund',
        'cancellation_days' => 7,
        'refund_policy' => '',
        'booking_expiry_hours' => 24,
        'booking_reminder_days' => 3,
        'allow_waitlist' => true,
        'waitlist_auto_confirm' => false,
        
        // Payment
        'currency' => 'USD',
        'payment_test_mode' => true,
        'currency_position' => 'before',
        'thousand_separator' => ',',
        'decimal_separator' => '.',
        'decimal_places' => 2,
        // Flexible payments (deposit/partial) - Pro feature
        // These defaults are overridden by Pro's FlexiblePaymentsModule when active
        'enable_deposit' => false,
        'deposit_type' => 'percentage',
        'deposit_amount' => 20,
        'deposit_required' => false,
        'deposit_percentage' => 20,
        'partial_payment' => false,
        'partial_payment_percentage' => 30,
        'auto_confirm_pay_later' => true,
        'payment_gateways' => ['pay_later'],
        'payment_methods' => [],
        'gateway_configs' => [],
        'gateway_order' => [],
        
        // Scheduled/Recurring Payments - Pro feature
        // These defaults are overridden by Pro's FlexiblePaymentsModule when active
        'enable_scheduled_payments' => false,
        'scheduled_payment_type' => 'single',
        'scheduled_payment_days' => 15,
        'scheduled_payment_installments' => 1,
        'scheduled_payment_interval' => 30,
        'scheduled_payment_reminder_days' => 3,
        'allow_save_payment_methods' => false,
        
        // Email
        'email_from_name' => '',
        'email_from_address' => '',
        'admin_email' => '',
        'enable_admin_notifications' => true,
        'enable_customer_notifications' => true,
        
        // Trip
        'trip_base' => 'trip',
        'trips_per_page' => 12,
        'enable_wishlist' => false,
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
        'multiple_taxes_enabled' => false,
        'multiple_taxes' => [],
        'multiple_taxes_by_country' => [],
        
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
        
        // Booking Form Builder
        'booking_form_config' => [],
    ];
    
    /**
     * Get default booking form configuration
     * 
     * @return array
     */
    public static function getDefaultBookingFormConfig(): array
    {
        return [
            'contact_form' => [
                'title' => 'Lead Traveler / Contact Information',
                'description' => 'Primary contact person for this booking',
                'fields' => [
                    ['id' => 'first_name', 'type' => 'text', 'label' => 'First Name', 'placeholder' => 'Enter first name', 'required' => true, 'enabled' => true, 'order' => 1, 'width' => 'half', 'locked' => true],
                    ['id' => 'last_name', 'type' => 'text', 'label' => 'Last Name', 'placeholder' => 'Enter last name', 'required' => true, 'enabled' => true, 'order' => 2, 'width' => 'half', 'locked' => true],
                    ['id' => 'email', 'type' => 'email', 'label' => 'Email Address', 'placeholder' => 'your@email.com', 'required' => true, 'enabled' => true, 'order' => 3, 'width' => 'half', 'locked' => true],
                    ['id' => 'phone', 'type' => 'tel', 'label' => 'Phone Number', 'placeholder' => '+1 234 567 8900', 'required' => true, 'enabled' => true, 'order' => 4, 'width' => 'half', 'locked' => true],
                    ['id' => 'country', 'type' => 'country', 'label' => 'Country', 'placeholder' => 'Select Country', 'required' => true, 'enabled' => true, 'order' => 5, 'width' => 'half', 'locked' => true],
                    ['id' => 'nationality', 'type' => 'country', 'label' => 'Nationality', 'placeholder' => 'Select Nationality', 'required' => false, 'enabled' => true, 'order' => 6, 'width' => 'half'],
                    ['id' => 'address', 'type' => 'text', 'label' => 'Address', 'placeholder' => 'Street address (optional)', 'required' => false, 'enabled' => true, 'order' => 7, 'width' => 'full'],
                ],
            ],
            'emergency_contact_form' => [
                'title' => 'Emergency Contact',
                'description' => 'Person to contact in case of emergency',
                'enabled' => true,
                'fields' => [
                    ['id' => 'name', 'type' => 'text', 'label' => 'Contact Name', 'placeholder' => 'Full name', 'required' => true, 'enabled' => true, 'order' => 1, 'width' => 'half'],
                    ['id' => 'phone', 'type' => 'tel', 'label' => 'Contact Phone', 'placeholder' => '+1 234 567 8900', 'required' => true, 'enabled' => true, 'order' => 2, 'width' => 'half'],
                    ['id' => 'relationship', 'type' => 'select', 'label' => 'Relationship', 'placeholder' => 'Select Relationship', 'required' => false, 'enabled' => true, 'order' => 3, 'width' => 'full', 'options' => [
                        ['value' => 'spouse', 'label' => 'Spouse/Partner'],
                        ['value' => 'parent', 'label' => 'Parent'],
                        ['value' => 'sibling', 'label' => 'Sibling'],
                        ['value' => 'child', 'label' => 'Child'],
                        ['value' => 'friend', 'label' => 'Friend'],
                        ['value' => 'other', 'label' => 'Other'],
                    ]],
                ],
            ],
            'traveler_form' => [
                'title' => 'Traveler Information',
                'description' => 'Please provide details for each traveler (passport details required for international trips)',
                'fields' => [
                    ['id' => 'first_name', 'type' => 'text', 'label' => 'First Name', 'placeholder' => 'As in passport', 'required' => true, 'enabled' => true, 'order' => 1, 'width' => 'half'],
                    ['id' => 'last_name', 'type' => 'text', 'label' => 'Last Name', 'placeholder' => 'As in passport', 'required' => true, 'enabled' => true, 'order' => 2, 'width' => 'half'],
                    ['id' => 'date_of_birth', 'type' => 'date', 'label' => 'Date of Birth', 'placeholder' => '', 'required' => true, 'enabled' => true, 'order' => 3, 'width' => 'half'],
                    ['id' => 'gender', 'type' => 'select', 'label' => 'Gender', 'placeholder' => 'Select Gender', 'required' => true, 'enabled' => true, 'order' => 4, 'width' => 'half', 'options' => [
                        ['value' => 'male', 'label' => 'Male'],
                        ['value' => 'female', 'label' => 'Female'],
                        ['value' => 'other', 'label' => 'Other'],
                    ]],
                    ['id' => 'nationality', 'type' => 'country', 'label' => 'Nationality', 'placeholder' => 'Select Nationality', 'required' => true, 'enabled' => true, 'order' => 5, 'width' => 'full'],
                    ['id' => 'passport', 'type' => 'text', 'label' => 'Passport Number', 'placeholder' => 'Enter passport number', 'required' => true, 'enabled' => true, 'order' => 6, 'width' => 'half', 'section' => 'passport'],
                    ['id' => 'passport_expiry', 'type' => 'date', 'label' => 'Passport Expiry', 'placeholder' => '', 'required' => true, 'enabled' => true, 'order' => 7, 'width' => 'half', 'section' => 'passport'],
                    ['id' => 'dietary', 'type' => 'select', 'label' => 'Dietary Requirements', 'placeholder' => 'Select', 'required' => false, 'enabled' => true, 'order' => 8, 'width' => 'half', 'section' => 'dietary_medical', 'options' => [
                        ['value' => 'none', 'label' => 'No special requirements'],
                        ['value' => 'vegetarian', 'label' => 'Vegetarian'],
                        ['value' => 'vegan', 'label' => 'Vegan'],
                        ['value' => 'halal', 'label' => 'Halal'],
                        ['value' => 'kosher', 'label' => 'Kosher'],
                        ['value' => 'gluten_free', 'label' => 'Gluten Free'],
                        ['value' => 'lactose_free', 'label' => 'Lactose Free'],
                        ['value' => 'other', 'label' => 'Other (specify in notes)'],
                    ]],
                    ['id' => 'medical', 'type' => 'text', 'label' => 'Medical Conditions / Allergies', 'placeholder' => 'Any allergies or conditions we should know', 'required' => false, 'enabled' => true, 'order' => 9, 'width' => 'half', 'section' => 'dietary_medical'],
                ],
            ],
        ];
    }
    
    /**
     * Get booking form configuration (merged with defaults)
     * 
     * @return array
     */
    public static function getBookingFormConfig(): array
    {
        $saved_config = self::get('booking_form_config', []);
        $default_config = self::getDefaultBookingFormConfig();
        
        // If no saved config, return defaults
        if (empty($saved_config)) {
            return $default_config;
        }
        
        // Build a map of locked field IDs from defaults
        $locked_fields = [];
        foreach ($default_config as $form_type => $form_config) {
            if (!empty($form_config['fields'])) {
                foreach ($form_config['fields'] as $field) {
                    if (!empty($field['locked'])) {
                        $locked_fields[$form_type][$field['id']] = true;
                    }
                }
            }
        }
        
        // Merge saved with defaults
        $merged = array_replace_recursive($default_config, $saved_config);
        
        // Ensure locked status is preserved from defaults (locked cannot be overridden)
        foreach ($merged as $form_type => &$form_config) {
            if (!empty($form_config['fields']) && is_array($form_config['fields'])) {
                foreach ($form_config['fields'] as &$field) {
                    // If this field ID is in the locked list, force locked=true and required=true
                    if (isset($locked_fields[$form_type][$field['id']])) {
                        $field['locked'] = true;
                        $field['required'] = true;
                    }
                }
            }
        }
        
        return $merged;
    }

    private static function isEmailIdentityKey(string $key): bool
    {
        return $key === 'admin_email' || $key === 'from_email' || $key === 'from_name';
    }

    private static function isEmptyScalar($value): bool
    {
        return $value === null || $value === false || $value === ''
            || (is_string($value) && trim($value) === '');
    }

    /**
     * When Yatra delivery options are empty, use WordPress site admin email / blog name (same as installer defaults).
     *
     * @param mixed $value
     * @return mixed
     */
    private static function applyEmailIdentityFallback(string $key, $value)
    {
        if (!self::isEmailIdentityKey($key) || !self::isEmptyScalar($value)) {
            return $value;
        }
        if ($key === 'from_name') {
            $wp = (string) get_bloginfo('name');

            return $wp !== '' ? $wp : $value;
        }
        $wp = (string) get_option('admin_email', '');

        return $wp !== '' ? $wp : $value;
    }

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
     * Get setting value with fallback to default
     *
     * @param string $key Setting key
     * @param mixed $default Default value if setting not found
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

        // If setting exists in cache, return it
        if (isset(self::$settings[$key])) {
            return self::applyEmailIdentityFallback($key, self::$settings[$key]);
        }
        
        // Try to fetch from database directly for settings not in defaults
        $option_name = self::OPTION_PREFIX . $key;
        $value = get_option($option_name, null);

        // Installer / migrations used yatra_email_from_*; REST + EmailService use yatra_from_*.
        if (($value === null || $value === false || $value === '') && $key === 'from_email') {
            $legacy = get_option(self::OPTION_PREFIX . 'email_from_address', '');
            if (is_string($legacy) && $legacy !== '') {
                $value = $legacy;
            }
        }
        if (($value === null || $value === false || $value === '') && $key === 'from_name') {
            $legacy = get_option(self::OPTION_PREFIX . 'email_from_name', '');
            if (is_string($legacy) && $legacy !== '') {
                $value = $legacy;
            }
        }

        if ($value !== null) {
            // Handle serialized arrays
            if (is_string($value) && is_serialized($value)) {
                $value = maybe_unserialize($value);
            }
            // Cache the value
            self::$settings[$key] = $value;

            return self::applyEmailIdentityFallback($key, $value);
        }

        $fallback = $default ?? (self::$defaults[$key] ?? null);

        return self::applyEmailIdentityFallback($key, $fallback);
    }

    /**
     * Check if a boolean setting is enabled
     *
     * @param string $key Setting key
     * @return bool
     */
    public static function isEnabled(string $key): bool
    {
        // Flexible payment settings require Pro module
        if (self::isFlexiblePaymentSetting($key)) {
            $value = apply_filters('yatra_flexible_payment_setting', false, $key);
            return filter_var($value, FILTER_VALIDATE_BOOLEAN);
        }
        
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
        // Flexible payment settings require Pro module
        if (self::isFlexiblePaymentSetting($key)) {
            return (int) apply_filters('yatra_flexible_payment_setting', $default, $key);
        }
        
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

        self::mergeAdminReviewOptionAliases();
    }

    /**
     * REST/Settings UI uses yatra_require_booking, yatra_review_moderation, yatra_min_rating;
     * internal helpers use require_booking_to_review, enable_review_moderation, minimum_rating.
     */
    private static function mergeAdminReviewOptionAliases(): void
    {
        $map = [
            'require_booking' => 'require_booking_to_review',
            'review_moderation' => 'enable_review_moderation',
            'min_rating' => 'minimum_rating',
        ];
        foreach ($map as $adminKey => $internalKey) {
            $v = get_option(self::OPTION_PREFIX . $adminKey, null);
            if ($v !== null) {
                self::$settings[$internalKey] = $v;
            }
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
     * Checks both 'currency' and 'default_currency' keys for compatibility
     * (Admin UI Currency Settings saves as 'default_currency')
     */
    public static function getCurrency(): string
    {
        // Priority: 'currency' key first (Payment Settings), then 'default_currency' (Currency Settings)
        $currency = self::getString('currency', '');
        if (!empty($currency) && $currency !== 'USD') {
            return $currency;
        }
        
        // Check default_currency (from Currency Settings section)
        $defaultCurrency = self::getString('default_currency', '');
        if (!empty($defaultCurrency)) {
            return $defaultCurrency;
        }
        
        // Return whatever currency is set, even if USD
        return !empty($currency) ? $currency : 'USD';
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
        $base = self::getString('booking_base', 'booking');
        return preg_replace('/[^a-z0-9_-]/i', '', $base) ?: 'booking';
    }

    /**
     * URL slug for the customer account area (Settings → Customer → account path).
     * Derives from yatra_customer_account_page first so routing matches the configured path
     * even when yatra_account_base was never saved or is out of sync.
     */
    public static function getAccountBase(): string
    {
        $customerPath = get_option('yatra_customer_account_page', '');
        if (is_string($customerPath) && $customerPath !== '' && $customerPath !== '0') {
            $slug = self::slugFromAccountPathString($customerPath);
            if ($slug !== '') {
                return $slug;
            }
        }

        $base = self::getString('account_base', '');
        $base = preg_replace('/[^a-z0-9_-]/i', '', $base) ?: '';

        return $base !== '' ? $base : 'account';
    }

    private static function slugFromAccountPathString(string $path): string
    {
        $path = trim(str_replace('\\', '/', $path), '/');
        $parts = array_values(array_filter(explode('/', $path), static fn ($p) => $p !== ''));
        $segment = $parts !== [] ? end($parts) : 'account';
        $slug = sanitize_title($segment);

        return $slug !== '' ? $slug : 'account';
    }

    /**
     * Check if using custom booking page
     */
    public static function useCustomBookingPage(): bool
    {
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
     * Wishlist (saved trips) is a Yatra Pro feature and must be enabled in settings.
     */
    public static function wishlistEnabled(): bool
    {
        if (!apply_filters('yatra_is_pro_active', false)) {
            return false;
        }

        return self::isEnabled('enable_wishlist');
    }

    /**
     * Get trips per page
     */
    public static function getTripsPerPage(): int
    {
        return self::getInt('trips_per_page', 12);
    }

    /**
     * Check if a setting key is a flexible payment setting (Pro feature)
     * 
     * @param string $key Setting key
     * @return bool
     */
    private static function isFlexiblePaymentSetting(string $key): bool
    {
        $flexiblePaymentSettings = [
            'deposit_required',
            'deposit_percentage',
            'partial_payment',
            'partial_payment_percentage',
            'enable_deposit',
            'enable_scheduled_payments',
            'scheduled_payment_type',
            'scheduled_payment_days',
            'scheduled_payment_installments',
            'scheduled_payment_interval',
            'scheduled_payment_reminder_days',
            'allow_save_payment_methods',
        ];
        
        return in_array($key, $flexiblePaymentSettings, true);
    }

    /**
     * Check if flexible payments module is available (Pro active + module enabled)
     * 
     * @return bool
     */
    public static function isFlexiblePaymentsAvailable(): bool
    {
        return apply_filters('yatra_flexible_payments_enabled', false);
    }

    /**
     * Global payment test/sandbox toggle (Settings → Payment).
     */
    public static function isPaymentTestMode(): bool
    {
        return self::isEnabled('payment_test_mode');
    }
}

