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
     * Cached {@see self::getPermalinkBases()} per request (after {@see 'yatra_permalink_bases'} filter).
     */
    private static ?array $permalinkBasesCache = null;

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
        'timezone' => 'UTC',
        'date_format' => 'Y-m-d',
        'time_format' => 'H:i',
        /** Primary brand color (hex) for trip/booking/listing frontend — see FrontendThemeCss */
        'frontend_primary_color' => '#3b82f6',
        /** Max width for Yatra trip/booking/listing containers (CSS length). Empty = theme.json / content width / filter. */
        'frontend_container_max_width' => '',

        // Booking
        'booking_base' => 'book',
        'use_booking_page' => false,
        'booking_page_id' => 0,
        'terms_page_id' => 0,
        'privacy_policy_page_id' => 0,
        'enable_guest_booking' => true,
        'booking_confirmation' => true,
        'auto_confirm_bookings' => false,
        'require_login' => false,
        'allow_guest_checkout' => true,
        // Hold guest bookings in `pending_verification` status until
        // the customer clicks a magic link sent to the email they
        // gave. Defends against typo'd email addresses (a booking
        // with the wrong email is unreachable forever) and against
        // form-spam bots that submit junk emails. Only applies when
        // `allow_guest_checkout` is true and the customer is not
        // logged in.
        'require_guest_email_verification' => false,
        // cancellation_policy / cancellation_days / refund_policy
        // removed — see SettingsController::$default_settings for
        // the rationale. Leaving the keys out of this defaults map
        // means SettingsService::get() returns null for legacy
        // callers, and email/template render paths handle absence
        // gracefully by skipping the cancellation paragraph or
        // falling back to the per-trip cancellation_policy.
        'booking_expiry_hours' => 24,
        'booking_reminder_days' => 3,
        'allow_waitlist' => true,
        'waitlist_auto_confirm' => false,
        // Pro: when enabled, the single-trip date_specific mode renders a
        // <select> of available departure dates instead of the flatpickr
        // calendar (desktop sidebar and mobile sticky bar). Renders no-op
        // for free installs — see Settings UI + FrontendAssetsProvider gate.
        'date_picker_as_dropdown' => false,

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
        
        'allow_save_payment_methods' => false,
        
        // Email
        'email_from_name' => '',
        'email_from_address' => '',
        'admin_email' => '',
        'enable_admin_notifications' => true,
        'enable_customer_notifications' => true,

        // Email template enable flags.
        //
        // These mirror SettingsController::$default_settings + the
        // entries InstallerService seeds on activation. They're
        // duplicated here because SettingsService::isEnabled() falls
        // back to THIS array when the wp_option doesn't exist — and
        // there are two installation paths where the option is
        // missing in production:
        //   1. Sites that upgraded from a Yatra version that didn't
        //      seed the flag (InstallerService runs only on initial
        //      activation, not on update).
        //   2. Sites whose operator never opened Settings → never
        //      hit the REST save endpoint that would write defaults.
        // Without this fallback, the verification email + booking
        // confirmation + every transactional email silently no-ops
        // on those installs (sendIfEnabled gates on the flag).
        'email_template_booking' => true,
        'email_template_confirmation' => true,
        'email_template_cancellation' => true,
        'email_template_reminder' => true,
        'email_template_admin_new_booking' => true,
        'email_template_admin_payment' => true,
        'email_template_admin_cancellation' => true,
        'email_template_trip_consent' => true,
        'email_template_customer_verification' => true,
        'email_template_guest_verification' => true,
        'email_template_booking_completed' => true,
        'email_template_booking_expired_customer' => true,
        'email_template_admin_booking_expired' => true,
        'email_template_scheduled_payment_reminder' => true,
        'email_template_scheduled_payment_succeeded' => true,
        'email_template_scheduled_payment_failed' => true,
        'email_template_admin_scheduled_payment_failed' => true,
        'email_template_enquiry_received' => true,
        'email_template_enquiry_admin' => true,
        'email_template_enquiry_response' => true,
        'email_template_review_request' => true,
        'email_template_abandoned_booking_recovery_first' => true,
        'email_template_abandoned_booking_recovery_second' => true,
        'email_template_abandoned_booking_recovery_final' => true,
        // Customer-registration gate (AuthController::register reads
        // this exact key). Mismatched name vs InstallerService's
        // `enable_customer_registration` seed — keeping both names
        // here so register() works regardless of which key was
        // saved on prior installs.
        'customer_registration' => true,
        
        // Trip
        'trip_base' => 'trip',
        'trips_per_page' => 12,
        'enable_wishlist' => false,
        'enable_comparison' => false,
        'show_sold_out' => true,

        // Search & Listing storefront UX.
        // Search-bar field visibility — default true so the bar renders every
        // field exactly as before for existing free/pro installs. Owners can
        // hide individual fields from Settings → Search & Listing.
        'search_show_keyword' => true,
        'search_show_destination' => true,
        'search_show_activities' => true,
        'search_show_duration' => true,
        'search_show_budget' => true,
        // Collapse the listing filter sidebar sections on mobile. Default false
        // = today's behaviour (all sections expanded on every viewport), so an
        // existing site sees no change on update until the owner opts in.
        'collapse_filters_on_mobile' => false,

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
        // User-facing strings (titles, descriptions, labels, placeholders,
        // option labels) are wrapped in __() so they are (a) extracted into the
        // .pot for Loco Translate and (b) translated to the active locale when
        // the config is built — e.g. on a Dutch storefront the default booking
        // form renders in Dutch. Structural values (id/type/order/width/etc.)
        // stay literal. Saved/custom labels are additionally translated at
        // render time (see yatra_translate_form_string()).
        return [
            'contact_form' => [
                'title' => __('Lead Traveler / Contact Information', 'yatra'),
                'description' => __('Primary contact person for this booking', 'yatra'),
                'fields' => [
                    ['id' => 'first_name', 'type' => 'text', 'label' => __('First Name', 'yatra'), 'placeholder' => __('Enter first name', 'yatra'), 'required' => true, 'enabled' => true, 'order' => 1, 'width' => 'half', 'locked' => true],
                    ['id' => 'last_name', 'type' => 'text', 'label' => __('Last Name', 'yatra'), 'placeholder' => __('Enter last name', 'yatra'), 'required' => true, 'enabled' => true, 'order' => 2, 'width' => 'half', 'locked' => true],
                    ['id' => 'email', 'type' => 'email', 'label' => __('Email Address', 'yatra'), 'placeholder' => 'your@email.com', 'required' => true, 'enabled' => true, 'order' => 3, 'width' => 'half', 'locked' => true],
                    ['id' => 'phone', 'type' => 'tel', 'label' => __('Phone Number', 'yatra'), 'placeholder' => '+1 234 567 8900', 'required' => true, 'enabled' => true, 'order' => 4, 'width' => 'half', 'locked' => true],
                    ['id' => 'country', 'type' => 'country', 'label' => __('Country', 'yatra'), 'placeholder' => __('Select Country', 'yatra'), 'required' => true, 'enabled' => true, 'order' => 5, 'width' => 'half', 'locked' => true],
                    ['id' => 'nationality', 'type' => 'country', 'label' => __('Nationality', 'yatra'), 'placeholder' => __('Select Nationality', 'yatra'), 'required' => false, 'enabled' => true, 'order' => 6, 'width' => 'half'],
                    ['id' => 'address', 'type' => 'text', 'label' => __('Address', 'yatra'), 'placeholder' => __('Street address (optional)', 'yatra'), 'required' => false, 'enabled' => true, 'order' => 7, 'width' => 'full'],
                ],
            ],
            'emergency_contact_form' => [
                'title' => __('Emergency Contact', 'yatra'),
                'description' => __('Person to contact in case of emergency', 'yatra'),
                'enabled' => true,
                'fields' => [
                    ['id' => 'name', 'type' => 'text', 'label' => __('Contact Name', 'yatra'), 'placeholder' => __('Full name', 'yatra'), 'required' => true, 'enabled' => true, 'order' => 1, 'width' => 'half'],
                    ['id' => 'phone', 'type' => 'tel', 'label' => __('Contact Phone', 'yatra'), 'placeholder' => '+1 234 567 8900', 'required' => true, 'enabled' => true, 'order' => 2, 'width' => 'half'],
                    ['id' => 'relationship', 'type' => 'select', 'label' => __('Relationship', 'yatra'), 'placeholder' => __('Select Relationship', 'yatra'), 'required' => false, 'enabled' => true, 'order' => 3, 'width' => 'full', 'options' => [
                        ['value' => 'spouse', 'label' => __('Spouse/Partner', 'yatra')],
                        ['value' => 'parent', 'label' => __('Parent', 'yatra')],
                        ['value' => 'sibling', 'label' => __('Sibling', 'yatra')],
                        ['value' => 'child', 'label' => __('Child', 'yatra')],
                        ['value' => 'friend', 'label' => __('Friend', 'yatra')],
                        ['value' => 'other', 'label' => __('Other', 'yatra')],
                    ]],
                ],
            ],
            'traveler_form' => [
                'title' => __('Traveler Information', 'yatra'),
                'description' => __('Please provide details for each traveler', 'yatra'),
                'fields' => [
                    ['id' => 'first_name', 'type' => 'text', 'label' => __('First Name', 'yatra'), 'placeholder' => __('Legal first name', 'yatra'), 'required' => true, 'enabled' => true, 'order' => 1, 'width' => 'half'],
                    ['id' => 'last_name', 'type' => 'text', 'label' => __('Last Name', 'yatra'), 'placeholder' => __('Legal last name', 'yatra'), 'required' => true, 'enabled' => true, 'order' => 2, 'width' => 'half'],
                    ['id' => 'date_of_birth', 'type' => 'date', 'label' => __('Date of Birth', 'yatra'), 'placeholder' => '', 'required' => true, 'enabled' => true, 'order' => 3, 'width' => 'half'],
                    ['id' => 'gender', 'type' => 'select', 'label' => __('Gender', 'yatra'), 'placeholder' => __('Select Gender', 'yatra'), 'required' => true, 'enabled' => true, 'order' => 4, 'width' => 'half', 'options' => [
                        ['value' => 'male', 'label' => __('Male', 'yatra')],
                        ['value' => 'female', 'label' => __('Female', 'yatra')],
                        ['value' => 'other', 'label' => __('Other', 'yatra')],
                    ]],
                    ['id' => 'nationality', 'type' => 'country', 'label' => __('Nationality', 'yatra'), 'placeholder' => __('Select Nationality', 'yatra'), 'required' => true, 'enabled' => true, 'order' => 5, 'width' => 'full'],
                    ['id' => 'dietary', 'type' => 'select', 'label' => __('Dietary Requirements', 'yatra'), 'placeholder' => __('Select', 'yatra'), 'required' => false, 'enabled' => true, 'order' => 6, 'width' => 'half', 'section' => 'dietary_medical', 'options' => [
                        ['value' => 'none', 'label' => __('No special requirements', 'yatra')],
                        ['value' => 'vegetarian', 'label' => __('Vegetarian', 'yatra')],
                        ['value' => 'vegan', 'label' => __('Vegan', 'yatra')],
                        ['value' => 'halal', 'label' => __('Halal', 'yatra')],
                        ['value' => 'kosher', 'label' => __('Kosher', 'yatra')],
                        ['value' => 'gluten_free', 'label' => __('Gluten Free', 'yatra')],
                        ['value' => 'lactose_free', 'label' => __('Lactose Free', 'yatra')],
                        ['value' => 'other', 'label' => __('Other (specify in notes)', 'yatra')],
                    ]],
                    ['id' => 'medical', 'type' => 'text', 'label' => __('Medical Conditions / Allergies', 'yatra'), 'placeholder' => __('Any allergies or conditions we should know', 'yatra'), 'required' => false, 'enabled' => true, 'order' => 7, 'width' => 'half', 'section' => 'dietary_medical'],
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
        
        // If no saved config, return defaults (Pro may filter)
        if (empty($saved_config)) {
            return apply_filters('yatra_booking_form_config', $default_config);
        }

        // Merge saved over defaults. IMPORTANT: `fields` is a positional list,
        // so a naive array_replace_recursive() merges field-by-INDEX — which
        // resurrects a deleted default field (saved list is shorter, the tail
        // default leaks back) and duplicates fields after a middle deletion.
        // We therefore merge each section's fields BY `id`, treating the saved
        // config as the authoritative list (order, props, and deletions), while
        // guaranteeing that locked core fields always exist and stay
        // locked+required.
        $merged = [];
        foreach ($default_config as $form_type => $default_section) {
            $saved_section = is_array($saved_config[$form_type] ?? null)
                ? $saved_config[$form_type]
                : null;

            if ($saved_section === null) {
                // Section absent from saved config → use the default verbatim.
                $merged[$form_type] = $default_section;
                continue;
            }

            // Section-level scalars (title/description/enabled) come from saved,
            // falling back to default.
            $section = array_merge($default_section, $saved_section);

            // Index default fields by id + collect the locked ids for this section.
            $default_fields_by_id = [];
            $locked_ids = [];
            foreach (($default_section['fields'] ?? []) as $df) {
                if (empty($df['id'])) {
                    continue;
                }
                $default_fields_by_id[$df['id']] = $df;
                if (!empty($df['locked'])) {
                    $locked_ids[$df['id']] = true;
                }
            }

            // Rebuild the field list from the saved order, de-duplicated by id.
            $result_fields = [];
            $seen = [];
            $saved_fields = is_array($saved_section['fields'] ?? null)
                ? $saved_section['fields']
                : ($default_section['fields'] ?? []);
            foreach ($saved_fields as $sf) {
                $id = is_array($sf) ? ($sf['id'] ?? '') : '';
                if ($id === '' || isset($seen[$id])) {
                    continue; // drop malformed / duplicate field entries
                }
                $seen[$id] = true;
                // Known default field → default props as the base, saved wins.
                $field = isset($default_fields_by_id[$id])
                    ? array_merge($default_fields_by_id[$id], $sf)
                    : $sf;
                if (isset($locked_ids[$id])) {
                    $field['locked'] = true;
                    $field['required'] = true;
                    // Locked core fields must keep their original input type — a
                    // saved config can't repurpose them (e.g. to a display-only
                    // text_block), which would drop the real input from checkout.
                    if (isset($default_fields_by_id[$id]['type'])) {
                        $field['type'] = $default_fields_by_id[$id]['type'];
                    }
                }
                $result_fields[] = $field;
            }

            // Locked core fields can never be legitimately removed — re-add any
            // that the saved config dropped, so checkout/admin always have them.
            foreach ($locked_ids as $id => $_) {
                if (!isset($seen[$id])) {
                    $field = $default_fields_by_id[$id];
                    $field['locked'] = true;
                    $field['required'] = true;
                    $result_fields[] = $field;
                }
            }

            $section['fields'] = $result_fields;
            $merged[$form_type] = $section;
        }

        // Preserve any saved sections that aren't part of the defaults
        // (future-proofing for Pro-introduced sections).
        foreach ($saved_config as $form_type => $saved_section) {
            if (!isset($merged[$form_type])) {
                $merged[$form_type] = $saved_section;
            }
        }

        return apply_filters('yatra_booking_form_config', $merged);
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

        if (self::isScheduledPaymentSetting($key)) {
            $scheduledDefaults = self::scheduledPaymentDefaults();

            return apply_filters(
                'yatra_scheduled_payment_setting',
                $default ?? ($scheduledDefaults[$key] ?? null),
                $key
            );
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

        if (self::isScheduledPaymentSetting($key)) {
            $defaults = self::scheduledPaymentDefaults();
            $base = $defaults[$key] ?? false;
            $value = apply_filters('yatra_scheduled_payment_setting', $base, $key);

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

        if (self::isScheduledPaymentSetting($key)) {
            $defaults = self::scheduledPaymentDefaults();
            $base = $defaults[$key] ?? $default;

            return (int) apply_filters('yatra_scheduled_payment_setting', $base, $key);
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
        self::$permalinkBasesCache = null;
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
     * Single source of truth for the number of decimals shown in prices.
     *
     * Historically two unsynced options existed:
     *  - `currency_decimals` — the admin "Number of decimals" field, also handed
     *    to the frontend JS as `decimalPlaces`. Written only when settings are saved.
     *  - `decimal_places`    — legacy, written by the installer (default 2) and the
     *    Setup Wizard, and read by {@see yatra_format_price()}.
     *
     * They drifted, so PHP-rendered prices (single trip, showcase, listings) and
     * JS-rendered prices could disagree, and the admin field had no effect on PHP.
     * This resolver collapses both into ONE value that every reader uses:
     *  1. the admin field when it has been changed from the default (authoritative);
     *  2. otherwise a non-default legacy value (preserves Setup-Wizard choices);
     *  3. otherwise whichever is present, else the default.
     *
     * Result is clamped to 0–4. It can never silently regress a site that was
     * already showing the correct decimals — it only aligns the two readers.
     */
    public static function getPriceDecimals(): int
    {
        $default = 2;

        $cdRaw = get_option('yatra_currency_decimals', null); // admin field + JS
        $dpRaw = get_option('yatra_decimal_places', null);    // legacy / yatra_format_price

        $cd = ($cdRaw === null || $cdRaw === '') ? null : (int) $cdRaw;
        $dp = ($dpRaw === null || $dpRaw === '') ? null : (int) $dpRaw;

        if ($cd !== null && $cd !== $default) {
            $value = $cd;            // admin explicitly changed → wins
        } elseif ($dp !== null && $dp !== $default) {
            $value = $dp;            // legacy Setup-Wizard value → preserved
        } elseif ($cd !== null) {
            $value = $cd;            // admin field present at default
        } elseif ($dp !== null) {
            $value = $dp;
        } else {
            $value = $default;
        }

        return max(0, min(4, $value));
    }

    /**
     * Sanitize a single URL path segment used in Yatra rewrites (alphanumeric, underscore, hyphen).
     */
    private static function sanitizePermalinkSlug(string $value, string $fallback): string
    {
        $v = preg_replace('/[^a-z0-9_-]/i', '', $value);

        return ($v !== '' && is_string($v)) ? $v : $fallback;
    }

    /**
     * Default account path slug (before {@see 'yatra_permalink_bases'}).
     */
    private static function resolveDefaultAccountBaseSlug(): string
    {
        $customerPath = get_option('yatra_customer_account_page', '');
        if (is_string($customerPath) && $customerPath !== '' && $customerPath !== '0') {
            $slug = self::slugFromAccountPathString($customerPath);
            if ($slug !== '') {
                return self::sanitizePermalinkSlug($slug, 'account');
            }
        }

        $base = self::getString('account_base', '');
        $base = self::sanitizePermalinkSlug($base, '');

        return $base !== '' ? $base : 'account';
    }

    /**
     * Raw permalink configuration from options (not yet filtered).
     *
     * @return array<string, string>
     */
    private static function defaultPermalinkBases(): array
    {
        $trip = self::sanitizePermalinkSlug(self::getString('trip_base', 'trip'), 'trip');
        $booking = self::sanitizePermalinkSlug(self::getString('booking_base', 'booking'), 'booking');
        $account = self::resolveDefaultAccountBaseSlug();
        $destination = self::sanitizePermalinkSlug(self::getString('destination_base', 'destination'), 'destination');
        $activity = self::sanitizePermalinkSlug(self::getString('activity_base', 'activity'), 'activity');
        $tripCategory = self::sanitizePermalinkSlug(self::getString('trip_category_base', 'trip-category'), 'trip-category');

        return [
            'trip_base' => $trip,
            'booking_base' => $booking,
            'account_base' => $account,
            'destination_base' => $destination,
            'activity_base' => $activity,
            'trip_category_base' => $tripCategory,
            /** Path segment after booking base for confirmation URLs, e.g. /{booking_base}/confirmation/{ref}/ */
            'booking_flow_confirmation_segment' => 'confirmation',
            /** Legacy pageless path /{prefix}/{reference}/ (default kept for old links). */
            'legacy_booking_confirmation_prefix' => 'booking-confirmation',
            /** Pageless remaining balance checkout /{prefix}/{token}/ */
            'remaining_checkout_prefix' => 'remaining-checkout',
            /** Email verification pretty path /{prefix}/{token}/ */
            'email_verification_prefix' => 'yatra-verify-email',
        ];
    }

    /**
     * All path segments and prefixes used by Yatra rewrites, routing, and URL helpers.
     *
     * Third-party plugins can change slugs in one place via:
     *
     * `add_filter( 'yatra_permalink_bases', function ( array $bases ) { $bases['trip_base'] = 'tours'; return $bases; } );`
     *
     * **Full URLs (different from bases only):**
     *
     * - Outbound links: `yatra_destination_permalink`, `yatra_activity_permalink`, `yatra_category_permalink`, `yatra_trip_permalink`
     *   ({@see yatra_get_destination_permalink()} and siblings in `includes/helpers.php`).
     * - Inbound path mapping (pretty URLs): {@see \Yatra\Core\Routing\UrlParser::getCleanRequestPath()} filter `yatra_frontend_request_path`.
     * - Inbound overrides: `yatra_pretty_route_match`, `yatra_plain_route_match` ({@see \Yatra\Core\Routing\PrettyRouteMatcher}, {@see \Yatra\Core\Routing\PlainPageMatcher}).
     *
     * After changing bases at runtime you must flush rewrite rules (or bump `yatra_rewrite_rules_version`
     * in development). Use the {@see 'yatra_register_rewrite_rules'} action to register extra rules that
     * depend on these bases.
     *
     * @return array<string, string>
     */
    public static function getPermalinkBases(): array
    {
        if (self::$permalinkBasesCache !== null) {
            return self::$permalinkBasesCache;
        }

        $defaults = self::defaultPermalinkBases();
        $filtered = apply_filters('yatra_permalink_bases', $defaults);
        if (!is_array($filtered)) {
            $filtered = $defaults;
        }

        $merged = array_merge($defaults, $filtered);
        $out = [
            'trip_base' => self::sanitizePermalinkSlug((string) ($merged['trip_base'] ?? ''), $defaults['trip_base']),
            'booking_base' => self::sanitizePermalinkSlug((string) ($merged['booking_base'] ?? ''), $defaults['booking_base']),
            'account_base' => self::sanitizePermalinkSlug((string) ($merged['account_base'] ?? ''), $defaults['account_base']),
            'destination_base' => self::sanitizePermalinkSlug((string) ($merged['destination_base'] ?? ''), $defaults['destination_base']),
            'activity_base' => self::sanitizePermalinkSlug((string) ($merged['activity_base'] ?? ''), $defaults['activity_base']),
            'trip_category_base' => self::sanitizePermalinkSlug((string) ($merged['trip_category_base'] ?? ''), $defaults['trip_category_base']),
            'booking_flow_confirmation_segment' => self::sanitizePermalinkSlug(
                (string) ($merged['booking_flow_confirmation_segment'] ?? ''),
                $defaults['booking_flow_confirmation_segment']
            ),
            'legacy_booking_confirmation_prefix' => self::sanitizePermalinkSlug(
                (string) ($merged['legacy_booking_confirmation_prefix'] ?? ''),
                $defaults['legacy_booking_confirmation_prefix']
            ),
            'remaining_checkout_prefix' => self::sanitizePermalinkSlug(
                (string) ($merged['remaining_checkout_prefix'] ?? ''),
                $defaults['remaining_checkout_prefix']
            ),
            'email_verification_prefix' => self::sanitizePermalinkSlug(
                (string) ($merged['email_verification_prefix'] ?? ''),
                $defaults['email_verification_prefix']
            ),
        ];

        self::$permalinkBasesCache = $out;

        return self::$permalinkBasesCache;
    }

    /**
     * Get trip base slug
     */
    public static function getTripBase(): string
    {
        return self::getPermalinkBases()['trip_base'];
    }

    /**
     * Get booking base slug
     */
    public static function getBookingBase(): string
    {
        return self::getPermalinkBases()['booking_base'];
    }

    /**
     * URL slug for the customer account area (Settings → Customer → account path).
     * Derives from yatra_customer_account_page first so routing matches the configured path
     * even when yatra_account_base was never saved or is out of sync.
     */
    public static function getAccountBase(): string
    {
        return self::getPermalinkBases()['account_base'];
    }

    public static function getDestinationBase(): string
    {
        return self::getPermalinkBases()['destination_base'];
    }

    public static function getActivityBase(): string
    {
        return self::getPermalinkBases()['activity_base'];
    }

    public static function getTripCategoryBase(): string
    {
        return self::getPermalinkBases()['trip_category_base'];
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
     * Trips per page on front-end listings (aligned with WordPress Reading "posts per page").
     */
    public static function getTripsPerPage(): int
    {
        if (function_exists('yatra_get_posts_per_page')) {
            return yatra_get_posts_per_page();
        }

        return max(1, absint((int) get_option('posts_per_page', 10)));
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
            'allow_save_payment_methods',
        ];
        
        return in_array($key, $flexiblePaymentSettings, true);
    }

    /**
     * Settings owned by Yatra Pro "Scheduled Payments" module (not core options).
     *
     * @return array<string, mixed>
     */
    private static function scheduledPaymentDefaults(): array
    {
        return [
            'enable_scheduled_payments' => false,
            'scheduled_payment_type' => 'single',
            'scheduled_payment_days' => 15,
            'scheduled_payment_installments' => 1,
            'scheduled_payment_interval' => 30,
            'scheduled_payment_reminder_days' => 3,
        ];
    }

    private static function isScheduledPaymentSetting(string $key): bool
    {
        return array_key_exists($key, self::scheduledPaymentDefaults());
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

