<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\EmailTemplatePreviewService;

/**
 * Settings REST API Controller
 * Handles getting and updating plugin settings stored in WordPress options table
 */
class SettingsController extends BaseController
{
    /**
     * All settings fields with their default values
     * Pro plugin can add additional settings via filter
     */
    private array $default_settings;
    
    /**
     * Constructor - initialize default settings with filter
     */
    public function __construct()
    {
        $wpAdminEmail = (string) get_option('admin_email', '');
        $wpSiteName = (string) get_bloginfo('name');

        // Define base settings
        $base_settings = [
        // General Settings
        'company_name' => '',
        'company_email' => '',
        'company_phone' => '',
        'company_address' => '',
        'company_city' => '',
        'company_state' => '',
        'company_country' => '',
        'company_zip' => '',
        'company_website' => '',
        'company_logo' => '',
        'timezone' => 'UTC',
        'date_format' => 'Y-m-d',
        'time_format' => 'H:i',
        'frontend_primary_color' => '#3b82f6',
        'frontend_container_max_width' => '',

        // Booking Settings
        'booking_confirmation' => true,
        'auto_confirm_bookings' => false,
        'auto_confirm_pay_later' => true,
        'require_login' => false,
        'allow_guest_checkout' => true,
        'cancellation_policy' => 'full_refund',
        'cancellation_days' => 7,
        'refund_policy' => '',
        'booking_expiry_hours' => 24,
        'booking_reminder_days' => 3,
        'allow_waitlist' => true,
        'waitlist_auto_confirm' => false,
        
        // Payment Settings
        'currency' => 'USD',
        'payment_test_mode' => true,
        'payment_gateways' => [],
        'payment_methods' => [],
        'partial_payment' => false,
        'partial_payment_percentage' => 30,
        'deposit_required' => false,
        'deposit_percentage' => 20,
        'gateway_configs' => [],
        'gateway_order' => [],
        
        // Scheduled/Recurring Payment Settings (Pro feature - defaults disabled)
        'enable_scheduled_payments' => false,
        'scheduled_payment_type' => 'single', // single, installments
        'scheduled_payment_days' => 15, // Days until first scheduled payment
        'scheduled_payment_installments' => 1, // Number of installments (if type is installments)
        'scheduled_payment_interval' => 30, // Days between installments
        'scheduled_payment_reminder_days' => 3, // Days before to send reminder
        'allow_save_payment_methods' => false,
        
        // Email Settings (WordPress site defaults when Yatra options are missing)
        'admin_email' => $wpAdminEmail,
        'from_email' => $wpAdminEmail,
        'from_name' => $wpSiteName,
        'email_template_booking' => true,
        'email_template_confirmation' => true,
        'email_template_cancellation' => true,
        'email_template_reminder' => true,
        'email_template_admin_new_booking' => true,
        'email_template_admin_payment' => true,
        'email_template_admin_cancellation' => true,
        'email_template_trip_consent' => true,
        'email_template_customer_verification' => true,
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
        'smtp_enabled' => false,
        'smtp_host' => 'smtp.gmail.com',
        'smtp_port' => 587,
        'smtp_username' => '',
        'smtp_password' => '',
        'smtp_encryption' => 'tls',

        // Customer Settings
        'customer_registration' => true,
        'customer_fields' => [],
        'require_email_verification' => false,
        'customer_account_page' => '',
        'allow_customer_reviews' => true,
        'customer_dashboard_enabled' => true,
        
        // Review Settings
        'enable_reviews' => true,
        'require_booking' => true,
        'auto_approve_reviews' => false,
        'review_moderation' => true,
        'min_rating' => 1,
        'allow_anonymous_reviews' => false,
        'review_reminder_days' => 7,
        
        // Tax Settings
        'enable_tax' => false,
        'tax_name' => __('Tax', 'yatra'),
        'tax_rate' => 0,
        'tax_inclusive' => false,
        'vat_number' => '',
        'tax_by_country' => false,
        'tax_rates' => [],
        'multiple_taxes_enabled' => false,
        'multiple_taxes' => [],
        'multiple_taxes_by_country' => [],
        
        // Currency Settings
        'default_currency' => 'USD',
        'multi_currency' => false,
        'currency_position' => 'left',
        'currency_decimals' => 2,
        'decimal_separator'=>'.',
        'thousand_separator'=>',',
        
        // Notification Settings (SMS / future channels — booking email toggles live under Email → Templates)
        'sms_notifications' => false,
        'sms_provider' => '',
        'sms_api_key' => '',
        
        // Integration Settings
        'google_analytics' => '',
        'facebook_pixel' => '',
        'recaptcha_enabled' => false,
        'recaptcha_site_key' => '',
        'recaptcha_secret_key' => '',
        
        // Permalink Settings
        'trip_base' => 'trip',
        'destination_base' => 'destination',
        'activity_base' => 'activity',
        'trip_category_base' => 'trip-category',
        'booking_base' => 'book',
        // Wishlist (Pro) — stored in free options; active only when Pro + setting on
        'enable_wishlist' => false,
        
        // Booking Page Settings
        'use_booking_page' => false,
        'booking_page_id' => 0,

        // Legal Pages (Booking UI)
        'terms_page_id' => 0,
        'privacy_policy_page_id' => 0,
        
        // SEO Settings
        'seo_trip_meta_title' => '',
        'seo_trip_meta_description' => '',
        'seo_trip_meta_keywords' => '',
        'seo_trip_meta_image' => 0,
        
        // Advanced Settings
        'debug_mode' => false,
        'enable_logging' => false,
        'cache_enabled' => true,
        'api_key' => '',
        'api_rate_limit' => 100,
        'session_timeout' => 3600,
        
        // Booking Form Builder
        'booking_form_config' => [],
        ];
        
        $base_settings = array_merge(
            $base_settings,
            \Yatra\Services\EmailTemplateDefaults::settingsOptionDefaults()
        );

        // Allow Pro plugins to add their settings via filter
        $this->default_settings = apply_filters('yatra_settings_default_fields', $base_settings);
    }

    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        $base = 'settings';

        register_rest_route($namespace, '/' . $base, [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_settings'],
                'permission_callback' => [$this, 'check_permission'],
            ],
            [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_settings'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Flush rewrite rules endpoint
        register_rest_route($namespace, '/' . $base . '/flush-rewrite-rules', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'flush_rewrite_rules'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Get WordPress pages for booking page selection
        register_rest_route($namespace, '/' . $base . '/pages', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_pages'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Check if page has booking shortcode
        register_rest_route($namespace, '/' . $base . '/check-shortcode/(?P<page_id>\d+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'check_booking_shortcode'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Insert booking shortcode into page
        register_rest_route($namespace, '/' . $base . '/insert-shortcode/(?P<page_id>\d+)', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'insert_booking_shortcode'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        register_rest_route($namespace, '/' . $base . '/email-template-preview', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'preview_core_email_template'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);
    }

    /**
     * Preview a core (settings-backed) transactional template with sample merge data.
     */
    public function preview_core_email_template(WP_REST_Request $request)
    {
        try {
            $params = $request->get_json_params();
            if (!is_array($params)) {
                return $this->error_response(__('Invalid request body.', 'yatra'), 400);
            }

            $templateKey = sanitize_key($params['template_key'] ?? '');
            $subjectTpl = sanitize_text_field($params['subject'] ?? '');
            $bodyTpl = wp_kses_post($params['body'] ?? '');
            $tripId = isset($params['trip_id']) ? (int) $params['trip_id'] : 0;
            $tripId = $tripId > 0 ? $tripId : null;

            $rendered = EmailTemplatePreviewService::render($templateKey, $subjectTpl, $bodyTpl, $tripId);

            return $this->success_response([
                'success' => true,
                'data' => [
                    'subject' => $rendered['subject'],
                    'body' => $rendered['body'],
                ],
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->error_response($e->getMessage(), 400);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    public function check_permission(?WP_REST_Request $request = null): bool
    {
        if (!is_user_logged_in()) {
            return false;
        }

        // Match other Yatra admin surfaces (e.g. Email Automation, Pro modules)
        return current_user_can('manage_options')
            || current_user_can('manage_yatra');
    }

    /**
     * Get all settings
     */
    public function get_settings(WP_REST_Request $request)
    {
        try {
            $settings = [];
            
            // Get all settings from WordPress options table with yatra_ prefix
            foreach ($this->default_settings as $key => $default_value) {
                $option_name = 'yatra_' . $key;
                $value = get_option($option_name, false);
                
                // Only use default if option doesn't exist (wasn't set by InstallerService)
                if ($value === false) {
                    $value = $default_value;
                }

                // Stored empty string should behave like "unset" for delivery identity (matches installer / backfill).
                if (($key === 'admin_email' || $key === 'from_email') && is_string($value) && trim($value) === '') {
                    $wp = (string) get_option('admin_email', '');
                    $value = $wp !== '' ? $wp : $value;
                }
                if ($key === 'from_name' && is_string($value) && trim($value) === '') {
                    $wp = (string) get_bloginfo('name');
                    $value = $wp !== '' ? $wp : $value;
                }
                
                // Handle serialized arrays (for fields like payment_gateways, customer_fields, etc.)
                if (is_string($value) && is_serialized($value)) {
                    $value = maybe_unserialize($value);
                }
                
                // Ensure arrays are returned as arrays (not objects)
                if (is_array($default_value) && !is_array($value)) {
                    $value = [];
                }
                
                $settings[$key] = $value;
            }
            
            // Special handling for booking_form_config - always use getBookingFormConfig which handles locked fields
            $settings['booking_form_config'] = \Yatra\Services\SettingsService::getBookingFormConfig();

            // Merge in flexible payment settings from Pro module if enabled
            $flexible_payment_settings = apply_filters('yatra_get_flexible_payment_settings', []);
            if (!empty($flexible_payment_settings)) {
                $settings = array_merge($settings, $flexible_payment_settings);
            }

            $scheduled_payment_settings = apply_filters('yatra_get_scheduled_payment_settings', []);
            if (!empty($scheduled_payment_settings)) {
                $settings = array_merge($settings, $scheduled_payment_settings);
            }

            // Scheduled payment keys are owned by Pro (yatra_pro_scheduled_payments), not yatra_* options.
            foreach (
                [
                    'enable_scheduled_payments',
                    'scheduled_payment_type',
                    'scheduled_payment_days',
                    'scheduled_payment_installments',
                    'scheduled_payment_interval',
                    'scheduled_payment_reminder_days',
                ] as $sk
            ) {
                if (array_key_exists($sk, $this->default_settings)) {
                    $settings[$sk] = \Yatra\Services\SettingsService::get(
                        $sk,
                        $this->default_settings[$sk]
                    );
                }
            }

            $settings = $this->syncAccountRouteSettingsForResponse($settings);

            return $this->success_response($settings);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Update settings
     */
    public function update_settings(WP_REST_Request $request)
    {
        try {
            $data = $request->get_json_params();
            
            if (!is_array($data)) {
                return $this->error_response('Invalid settings data', 400);
            }

            $updated = [];
            $errors = [];
            
            // Check if Dynamic Form Field module is enabled
            $is_dynamic_form_enabled = apply_filters('yatra_dynamic_form_field_enabled', false);
            
            // Check if Flexible Payments module is enabled (Pro feature)
            $is_flexible_payments_enabled = apply_filters('yatra_flexible_payments_enabled', false);

            $is_scheduled_payments_module = apply_filters('yatra_scheduled_payments_module_active', false);
            
            // Flexible payment settings keys (Pro only)
            $flexible_payment_keys = [
                'deposit_required', 'deposit_percentage', 'partial_payment', 
                'partial_payment_percentage', 'enable_deposit', 'allow_save_payment_methods',
            ];

            $scheduled_payment_keys = [
                'enable_scheduled_payments',
                'scheduled_payment_type',
                'scheduled_payment_days',
                'scheduled_payment_installments',
                'scheduled_payment_interval',
                'scheduled_payment_reminder_days',
            ];
            
            // Collect flexible payment settings to delegate to Pro
            $flexible_payment_settings = [];

            $scheduled_payment_settings_batch = [];
            
            // Process each setting
            foreach ($data as $key => $value) {
                // Skip booking_form_config if Dynamic Form Field module is not enabled
                // This allows the settings to save without error when the module is disabled
                if ($key === 'booking_form_config' && !$is_dynamic_form_enabled) {
                    continue;
                }
                
                // Delegate flexible payment settings to Pro module
                if (in_array($key, $flexible_payment_keys, true)) {
                    if ($is_flexible_payments_enabled) {
                        $flexible_payment_settings[$key] = $value;
                    }
                    // Skip saving in Free plugin - Pro handles these
                    continue;
                }

                if (in_array($key, $scheduled_payment_keys, true)) {
                    if ($is_scheduled_payments_module) {
                        $scheduled_payment_settings_batch[$key] = $value;
                    }
                    continue;
                }

                // Wishlist toggle: only meaningful with Yatra Pro active
                if ($key === 'enable_wishlist' && !apply_filters('yatra_is_pro_active', false)) {
                    continue;
                }
                
                // Validate that the key exists in default settings
                if (!array_key_exists($key, $this->default_settings)) {
                    $errors[] = sprintf('Unknown setting: %s', $key);
                    continue;
                }

                // Sanitize and validate the value based on its type
                $sanitized_value = $this->sanitize_setting($key, $value);
                
                if ($sanitized_value === null) {
                    $errors[] = sprintf('Invalid value for setting: %s', $key);
                    continue;
                }

                // Save to WordPress options table with yatra_ prefix
                $option_name = 'yatra_' . $key;
                
                // Serialize arrays for storage
                if (is_array($sanitized_value)) {
                    $sanitized_value = maybe_serialize($sanitized_value);
                }
                
                $result = update_option($option_name, $sanitized_value);
                
                if ($result !== false) {
                    $updated[] = $key;
                }
            }

            // Delegate flexible payment settings to Pro module for saving
            if (!empty($flexible_payment_settings) && $is_flexible_payments_enabled) {
                do_action('yatra_save_flexible_payment_settings', $flexible_payment_settings);
                $updated = array_merge($updated, array_keys($flexible_payment_settings));
            }

            if (!empty($scheduled_payment_settings_batch) && $is_scheduled_payments_module) {
                do_action('yatra_save_scheduled_payment_settings', $scheduled_payment_settings_batch);
                $updated = array_merge($updated, array_keys($scheduled_payment_settings_batch));
            }

            // Sync currency keys: keep 'currency' and 'default_currency' in sync
            // Admin UI has both Payment Settings (currency) and Currency Settings (default_currency)
            if (in_array('default_currency', $updated, true) && !in_array('currency', $updated, true)) {
                $sync_currency = get_option('yatra_default_currency', 'USD');
                update_option('yatra_currency', $sync_currency);
            } elseif (in_array('currency', $updated, true) && !in_array('default_currency', $updated, true)) {
                $sync_currency = get_option('yatra_currency', 'USD');
                update_option('yatra_default_currency', $sync_currency);
            }

            if (in_array('customer_account_page', $updated, true)) {
                $this->persistAccountBaseFromCustomerAccountPage();
            }

            if (!empty($errors)) {
                $errorSummary = implode('; ', $errors);
                return $this->error_response(
                    sprintf('Some settings could not be updated: %s', $errorSummary),
                    400,
                    [
                        'errors' => $errors,
                        'updated' => $updated,
                    ]
                );
            }

            // Flush rewrite rules if permalink settings were updated
            if (in_array('trip_base', $updated, true) ||
                in_array('destination_base', $updated, true) ||
                in_array('activity_base', $updated, true) ||
                in_array('trip_category_base', $updated, true) ||
                in_array('booking_base', $updated, true) ||
                in_array('use_booking_page', $updated, true) ||
                in_array('booking_page_id', $updated, true) ||
                in_array('customer_account_page', $updated, true)) {
                // Use hard flush to ensure rules are saved to database
                flush_rewrite_rules(true);
            }

            if (!empty($updated)) {
                \Yatra\Services\SettingsService::reload();
            }

            return $this->success_response([
                'message' => 'Settings updated successfully',
                'updated' => $updated,
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Sanitize and validate setting value
     * Pro plugins can handle sanitization of their own settings via filter
     *
     * @param mixed $value
     * @return mixed
     */
    private function sanitize_setting(string $key, $value)
    {
        $default = $this->default_settings[$key] ?? null;
        $default_type = gettype($default);
        
        // Allow Pro plugins to handle sanitization of their own settings
        $filtered_value = apply_filters('yatra_sanitize_setting', null, $key, $value, $default);
        if ($filtered_value !== null) {
            return $filtered_value;
        }

        // Handle null values - use default
        if ($value === null) {
            return $default;
        }

        // Handle arrays
        if (is_array($default)) {
            if (!is_array($value)) {
                return null;
            }
            // Sanitize array values
            return array_map(function($item) {
                if (is_string($item)) {
                    return sanitize_text_field($item);
                }
                if (is_numeric($item)) {
                    return is_float($item) ? (float) $item : (int) $item;
                }
                if (is_bool($item)) {
                    return (bool) $item;
                }
                if (is_array($item)) {
                    return $this->sanitize_array($item);
                }
                return $item;
            }, $value);
        }

        // Handle booleans (REST may send true/false strings)
        if (is_bool($default)) {
            if (is_bool($value)) {
                return $value;
            }
            if (is_string($value)) {
                $parsed = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                return $parsed !== null ? $parsed : (bool) $value;
            }
            return (bool) $value;
        }

        // Handle integers
        if (is_int($default)) {
            if (!is_numeric($value)) {
                return null;
            }
            $int_value = (int) $value;
            // Validate ranges for specific fields
            if ($key === 'cancellation_days' && $int_value < 0) {
                return null;
            }
            if ($key === 'booking_expiry_hours' && $int_value < 0) {
                return null;
            }
            if ($key === 'partial_payment_percentage' && ($int_value < 0 || $int_value > 100)) {
                return null;
            }
            if ($key === 'deposit_percentage' && ($int_value < 0 || $int_value > 100)) {
                return null;
            }
            if ($key === 'tax_rate' && ($int_value < 0 || $int_value > 100)) {
                return null;
            }
            if ($key === 'smtp_port' && ($int_value < 1 || $int_value > 65535)) {
                return null;
            }
            return $int_value;
        }

        // Handle floats
        if (is_float($default)) {
            if (!is_numeric($value)) {
                return null;
            }
            $float_value = (float) $value;
            if ($float_value < 0) {
                return null;
            }
            return $float_value;
        }

        // Handle strings
        if (is_string($default)) {
            if ($key === 'timezone') {
                $tz = is_string($value) ? trim($value) : '';
                if ($tz === '') {
                    return is_string($default) ? $default : 'UTC';
                }
                try {
                    new \DateTimeZone($tz);

                    return $tz;
                } catch (\Exception $e) {
                    return is_string($default) ? $default : 'UTC';
                }
            }
            if ($key === 'currency_position') {
                $allowed = ['left', 'right', 'left_space', 'right_space', 'before', 'after'];
                $v = is_string($value) ? strtolower(trim($value)) : '';

                return in_array($v, $allowed, true) ? $v : (is_string($default) ? $default : 'left');
            }
            // Special handling for specific fields
            if ($key === 'company_email' || $key === 'admin_email' || $key === 'from_email' || $key === 'smtp_username') {
                return sanitize_email($value);
            }
            if ($key === 'company_website' || $key === 'company_logo' || $key === 'google_analytics' || $key === 'facebook_pixel') {
                return esc_url_raw($value);
            }
            if ($key === 'refund_policy' || $key === 'cancellation_policy') {
                return sanitize_textarea_field($value);
            }
            if ($key === 'seo_trip_meta_title') {
                // Allow more characters for meta title, but strip HTML
                return wp_strip_all_tags($value);
            }
            if ($key === 'seo_trip_meta_description') {
                // Allow more characters for meta description, but strip HTML
                return wp_strip_all_tags($value);
            }
            if ($key === 'seo_trip_meta_keywords') {
                // Allow keywords, strip HTML and sanitize
                return sanitize_text_field($value);
            }
            if ($key === 'frontend_primary_color') {
                return \Yatra\Utils\FrontendThemeCss::sanitizePrimaryColor(is_string($value) ? $value : '');
            }
            if ($key === 'frontend_container_max_width') {
                return \Yatra\Utils\FrontendThemeCss::sanitizeContainerMaxWidthSetting(
                    is_string($value) ? $value : ''
                );
            }
            if (is_string($key) && strpos($key, 'email_tpl_') === 0 && substr($key, -5) === '_body') {
                return wp_kses_post((string) $value);
            }
            if (is_string($key) && strpos($key, 'email_tpl_') === 0 && substr($key, -8) === '_subject') {
                return sanitize_text_field((string) $value);
            }
            if ($key === 'smtp_password' || $key === 'api_key' || $key === 'sms_api_key' || $key === 'recaptcha_secret_key') {
                // Don't sanitize passwords/keys too aggressively
                return sanitize_text_field($value);
            }
            if ($key === 'gateway_configs') {
                // Handle nested array structure for gateway configs
                if (is_array($value)) {
                    return $this->sanitize_gateway_configs($value);
                }
                return [];
            }
            if ($key === 'booking_form_config') {
                // Handle nested array structure for booking form config
                if (is_array($value)) {
                    return $this->sanitize_booking_form_config($value);
                }
                return [];
            }
            if ($key === 'tax_rates') {
                // Handle nested array structure for tax rates
                if (is_array($value)) {
                    return $this->sanitize_tax_rates($value);
                }
                return [];
            }
            return sanitize_text_field($value);
        }

        return $value;
    }

    /**
     * Sanitize nested array
     */
    private function sanitize_array(array $array): array
    {
        $sanitized = [];
        foreach ($array as $k => $v) {
            $sanitized_key = is_string($k) ? sanitize_key($k) : $k;
            if (is_array($v)) {
                $sanitized[$sanitized_key] = $this->sanitize_array($v);
            } elseif (is_string($v)) {
                $sanitized[$sanitized_key] = sanitize_text_field($v);
            } elseif (is_numeric($v)) {
                $sanitized[$sanitized_key] = is_float($v) ? (float) $v : (int) $v;
            } elseif (is_bool($v)) {
                $sanitized[$sanitized_key] = (bool) $v;
            } else {
                $sanitized[$sanitized_key] = $v;
            }
        }
        return $sanitized;
    }

    /**
     * Sanitize gateway configs
     */
    private function sanitize_gateway_configs(array $configs): array
    {
        $sanitized = [];
        foreach ($configs as $gateway => $config) {
            if (!is_array($config)) {
                continue;
            }
            $sanitized_gateway = sanitize_key($gateway);
            $row = [
                'enabled' => isset($config['enabled']) ? (bool) $config['enabled'] : false,
                'icon' => isset($config['icon']) ? esc_url_raw($config['icon']) : '',
                'title' => isset($config['title']) ? sanitize_text_field($config['title']) : '',
                'description' => isset($config['description']) ? sanitize_textarea_field($config['description']) : '',
                'api_key' => isset($config['api_key']) ? sanitize_text_field($config['api_key']) : '',
                'api_secret' => isset($config['api_secret']) ? sanitize_text_field($config['api_secret']) : '',
                'client_id' => isset($config['client_id']) ? sanitize_text_field($config['client_id']) : '',
                'client_secret' => isset($config['client_secret']) ? sanitize_text_field($config['client_secret']) : '',
                'merchant_id' => isset($config['merchant_id']) ? sanitize_text_field($config['merchant_id']) : '',
                'public_key' => isset($config['public_key']) ? sanitize_text_field($config['public_key']) : '',
                'private_key' => isset($config['private_key']) ? sanitize_text_field($config['private_key']) : '',
                'webhook_secret' => isset($config['webhook_secret']) ? sanitize_text_field($config['webhook_secret']) : '',
                'test_mode' => isset($config['test_mode']) ? (bool) $config['test_mode'] : false,
                'sandbox' => isset($config['sandbox']) ? (bool) $config['sandbox'] : false,
            ];

            if ($sanitized_gateway === 'paypal') {
                $mode = isset($config['mode']) && in_array((string) $config['mode'], ['simple', 'advanced'], true)
                    ? (string) $config['mode']
                    : 'simple';
                $row['email'] = isset($config['email']) ? sanitize_email((string) $config['email']) : '';
                $row['mode'] = $mode;
            }

            if ($sanitized_gateway === 'pay_later') {
                $row['payment_deadline_days'] = isset($config['payment_deadline_days'])
                    ? max(1, min(60, (int) $config['payment_deadline_days']))
                    : 7;
                $row['auto_cancel_days'] = isset($config['auto_cancel_days'])
                    ? max(0, min(30, (int) $config['auto_cancel_days']))
                    : 3;
                $row['require_deposit'] = isset($config['require_deposit']) ? (bool) $config['require_deposit'] : false;
                $row['deposit_amount'] = isset($config['deposit_amount'])
                    ? max(1, min(50, (int) $config['deposit_amount']))
                    : 10;
                $row['reminder_days'] = isset($config['reminder_days'])
                    ? sanitize_text_field((string) $config['reminder_days'])
                    : '7,3,1';
            }

            if ($sanitized_gateway === 'stripe') {
                $allowedStripeMethods = ['card', 'google_pay', 'apple_pay'];
                $methodsRaw = isset($config['enabled_methods']) ? (string) $config['enabled_methods'] : '';
                if ($methodsRaw !== '') {
                    $parts = array_filter(array_map('trim', explode(',', $methodsRaw)));
                    $normalized = [];
                    foreach ($parts as $part) {
                        $slug = strtolower($part);
                        if (in_array($slug, $allowedStripeMethods, true)) {
                            $normalized[] = $slug;
                        }
                    }
                    $row['enabled_methods'] = $normalized !== [] ? implode(',', $normalized) : 'card,google_pay,apple_pay';
                } else {
                    $row['enabled_methods'] = 'card,google_pay,apple_pay';
                }
                foreach (['live_publishable_key', 'live_secret_key', 'test_publishable_key', 'test_secret_key'] as $stripeKey) {
                    if (array_key_exists($stripeKey, $config)) {
                        $row[$stripeKey] = sanitize_text_field((string) $config[$stripeKey]);
                    }
                }
            }

            if ($sanitized_gateway === 'razorpay') {
                $row['key_id'] = isset($config['key_id']) ? sanitize_text_field((string) $config['key_id']) : '';
                $row['key_secret'] = isset($config['key_secret']) ? sanitize_text_field((string) $config['key_secret']) : '';
            }

            if ($sanitized_gateway === 'mollie') {
                $row['api_key'] = isset($config['api_key']) ? sanitize_text_field((string) $config['api_key']) : '';
                $row['webhook_url'] = isset($config['webhook_url']) ? esc_url_raw((string) $config['webhook_url']) : '';
                $allowedMollie = ['creditcard', 'ideal', 'bancontact', 'sofort', 'eps', 'giropay', 'paypal', 'sepadirectdebit'];
                $row['payment_methods'] = $this->sanitizeGatewayStringList(
                    $config['payment_methods'] ?? [],
                    $allowedMollie,
                    ['creditcard', 'ideal', 'paypal']
                );
            }

            if ($sanitized_gateway === 'paystack') {
                $row['public_key'] = isset($config['public_key']) ? sanitize_text_field((string) $config['public_key']) : '';
                $row['secret_key'] = isset($config['secret_key']) ? sanitize_text_field((string) $config['secret_key']) : '';
                $row['webhook_url'] = isset($config['webhook_url']) ? esc_url_raw((string) $config['webhook_url']) : '';
                $allowedPaystack = ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'];
                $row['payment_channels'] = $this->sanitizeGatewayStringList(
                    $config['payment_channels'] ?? [],
                    $allowedPaystack,
                    ['card', 'bank', 'ussd']
                );
                unset($row['private_key']);
            }

            if ($sanitized_gateway === 'square') {
                $row['application_id'] = isset($config['application_id']) ? sanitize_text_field((string) $config['application_id']) : '';
                $row['access_token'] = isset($config['access_token']) ? sanitize_text_field((string) $config['access_token']) : '';
                $row['location_id'] = isset($config['location_id']) ? sanitize_text_field((string) $config['location_id']) : '';
            }

            if ($sanitized_gateway === 'authorize_net') {
                $row['api_login_id'] = isset($config['api_login_id']) ? sanitize_text_field((string) $config['api_login_id']) : '';
                $row['transaction_key'] = isset($config['transaction_key']) ? sanitize_text_field((string) $config['transaction_key']) : '';
                $row['public_client_key'] = isset($config['public_client_key']) ? sanitize_text_field((string) $config['public_client_key']) : '';
            }

            if ($sanitized_gateway === 'bank_transfer') {
                $row['bank_name'] = isset($config['bank_name']) ? sanitize_text_field((string) $config['bank_name']) : '';
                $row['account_name'] = isset($config['account_name']) ? sanitize_text_field((string) $config['account_name']) : '';
                $row['account_number'] = isset($config['account_number']) ? sanitize_text_field((string) $config['account_number']) : '';
                $row['routing_code'] = isset($config['routing_code']) ? sanitize_text_field((string) $config['routing_code']) : '';
                $row['instructions'] = isset($config['instructions']) ? sanitize_textarea_field((string) $config['instructions']) : '';
            }

            /**
             * Allow Pro add-ons or custom code to append keys after core sanitization.
             *
             * @param array<string, mixed> $row
             * @param array<string, mixed> $config
             * @return array<string, mixed>
             */
            $row = apply_filters('yatra_sanitize_gateway_config_row', $row, $sanitized_gateway, $config);

            $sanitized[$sanitized_gateway] = $row;
        }
        return $sanitized;
    }

    /**
     * Normalize multiselect gateway options (Mollie methods, Paystack channels, etc.).
     *
     * @param mixed $input
     * @param array<int, string> $allowed
     * @param array<int, string> $default
     * @return array<int, string>
     */
    private function sanitizeGatewayStringList($input, array $allowed, array $default): array
    {
        if (is_string($input) && $input !== '') {
            $input = array_map('trim', explode(',', $input));
        }
        if (!is_array($input)) {
            return $default;
        }
        $out = [];
        foreach ($input as $v) {
            $slug = sanitize_key((string) $v);
            if ($slug !== '' && in_array($slug, $allowed, true)) {
                $out[] = $slug;
            }
        }
        $out = array_values(array_unique($out));

        return $out !== [] ? $out : $default;
    }

    /**
     * Sanitize tax rates
     */
    private function sanitize_tax_rates(array $rates): array
    {
        $sanitized = [];
        foreach ($rates as $country => $rate) {
            $sanitized_country = sanitize_text_field($country);
            if (is_numeric($rate)) {
                $float_rate = (float) $rate;
                if ($float_rate >= 0 && $float_rate <= 100) {
                    $sanitized[$sanitized_country] = $float_rate;
                }
            }
        }
        return $sanitized;
    }

    /**
     * Sanitize booking form configuration
     */
    private function sanitize_booking_form_config(array $config): array
    {
        $sanitized = [];
        $allowed_form_types = ['contact_form', 'emergency_contact_form', 'traveler_form'];
        $allowed_field_types = ['text', 'email', 'tel', 'date', 'select', 'country', 'textarea', 'checkbox', 'number'];
        $allowed_widths = ['full', 'half', 'third'];
        
        foreach ($config as $form_type => $form_config) {
            if (!in_array($form_type, $allowed_form_types, true)) {
                continue;
            }
            
            $sanitized[$form_type] = [
                'title' => isset($form_config['title']) ? sanitize_text_field($form_config['title']) : '',
                'description' => isset($form_config['description']) ? sanitize_text_field($form_config['description']) : '',
                'enabled' => isset($form_config['enabled']) ? (bool) $form_config['enabled'] : true,
                'fields' => [],
            ];
            
            if (!empty($form_config['fields']) && is_array($form_config['fields'])) {
                foreach ($form_config['fields'] as $field) {
                    if (!is_array($field) || empty($field['id'])) {
                        continue;
                    }
                    
                    $sanitized_field = [
                        'id' => sanitize_key($field['id']),
                        'type' => in_array($field['type'] ?? 'text', $allowed_field_types, true) ? $field['type'] : 'text',
                        'label' => isset($field['label']) ? sanitize_text_field($field['label']) : '',
                        'placeholder' => isset($field['placeholder']) ? sanitize_text_field($field['placeholder']) : '',
                        'required' => isset($field['required']) ? (bool) $field['required'] : false,
                        'enabled' => isset($field['enabled']) ? (bool) $field['enabled'] : true,
                        'order' => isset($field['order']) ? (int) $field['order'] : 0,
                        'width' => in_array($field['width'] ?? 'full', $allowed_widths, true) ? $field['width'] : 'full',
                        'locked' => isset($field['locked']) ? (bool) $field['locked'] : false,
                    ];
                    
                    // Handle optional section
                    if (!empty($field['section'])) {
                        $sanitized_field['section'] = sanitize_key($field['section']);
                    }
                    
                    // Handle options for select fields
                    if ($sanitized_field['type'] === 'select' && !empty($field['options']) && is_array($field['options'])) {
                        $sanitized_field['options'] = [];
                        foreach ($field['options'] as $option) {
                            if (is_array($option) && isset($option['value'])) {
                                $sanitized_field['options'][] = [
                                    'value' => sanitize_key($option['value']),
                                    'label' => isset($option['label']) ? sanitize_text_field($option['label']) : $option['value'],
                                ];
                            }
                        }
                    }
                    
                    $sanitized[$form_type]['fields'][] = $sanitized_field;
                }
                
                // Sort fields by order
                usort($sanitized[$form_type]['fields'], function($a, $b) {
                    return ($a['order'] ?? 0) - ($b['order'] ?? 0);
                });
            }
        }
        
        return apply_filters('yatra_save_booking_form_config', $sanitized, $config);
    }

    /**
     * Flush rewrite rules
     */
    public function flush_rewrite_rules(WP_REST_Request $request)
    {
        try {
            // Flush rewrite rules
            flush_rewrite_rules(true);

            return $this->success_response([
                'message' => 'Rewrite rules flushed successfully',
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get list of WordPress pages for booking page selection
     * Note: We don't check for shortcode here - it's checked on-demand when user selects a page
     */
    public function get_pages(WP_REST_Request $request)
    {
        try {
            $pages = get_pages([
                'post_status' => 'publish',
                'sort_column' => 'post_title',
                'sort_order' => 'ASC',
            ]);

            $page_list = [];
            foreach ($pages as $page) {
                $page_list[] = [
                    'id' => $page->ID,
                    'title' => $page->post_title,
                    'slug' => $page->post_name,
                    'url' => get_permalink($page->ID),
                ];
            }

            return $this->success_response($page_list);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Check if a page has the booking shortcode
     */
    public function check_booking_shortcode(WP_REST_Request $request)
    {
        try {
            $page_id = (int) $request->get_param('page_id');
            
            if ($page_id <= 0) {
                return $this->error_response('Invalid page ID', 400);
            }

            $page = get_post($page_id);
            
            if (!$page || $page->post_type !== 'page') {
                return $this->error_response('Page not found', 404);
            }

            $has_shortcode = has_shortcode($page->post_content, 'yatra_booking');
            
            return $this->success_response([
                'page_id' => $page_id,
                'has_shortcode' => $has_shortcode,
                'page_title' => $page->post_title,
                'page_url' => get_permalink($page_id),
                'edit_url' => get_edit_post_link($page_id, 'raw'),
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Insert booking shortcode into a page
     */
    public function insert_booking_shortcode(WP_REST_Request $request)
    {
        try {
            $page_id = (int) $request->get_param('page_id');
            
            if ($page_id <= 0) {
                return $this->error_response('Invalid page ID', 400);
            }

            $page = get_post($page_id);
            
            if (!$page || $page->post_type !== 'page') {
                return $this->error_response('Page not found', 404);
            }

            // Check if shortcode already exists
            if (has_shortcode($page->post_content, 'yatra_booking')) {
                return $this->success_response([
                    'message' => 'Shortcode already exists on this page',
                    'page_id' => $page_id,
                    'already_exists' => true,
                ]);
            }

            // Append shortcode to page content
            $new_content = $page->post_content . "\n\n[yatra_booking]";
            
            $result = wp_update_post([
                'ID' => $page_id,
                'post_content' => $new_content,
            ], true);

            if (is_wp_error($result)) {
                return $this->error_response($result->get_error_message(), 500);
            }

            return $this->success_response([
                'message' => 'Shortcode added successfully',
                'page_id' => $page_id,
                'page_url' => get_permalink($page_id),
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Keep Settings → Customer "account page" path aligned with {@see RouteMatcher} / {@see Router} (yatra_account_base).
     *
     * @param array<string, mixed> $settings
     * @return array<string, mixed>
     */
    private function syncAccountRouteSettingsForResponse(array $settings): array
    {
        // Prefer the full saved path so admin "View" matches Settings → Customer (not only yatra_account_base slug).
        $savedPath = get_option('yatra_customer_account_page', '');
        if (is_string($savedPath) && $savedPath !== '' && $savedPath !== '0') {
            $normalized = '/' . trim(str_replace('\\', '/', $savedPath), '/');
            if ($normalized === '/') {
                $normalized = '/my-account';
            }
            $settings['customer_account_page'] = $normalized;

            return $settings;
        }

        $stored = get_option('yatra_account_base', '');
        if (is_string($stored) && $stored !== '') {
            $settings['customer_account_page'] = '/' . $stored;

            return $settings;
        }

        $cpp = (string) ($settings['customer_account_page'] ?? '');
        $slug = self::accountSlugFromCustomerAccountPath($cpp !== '' ? $cpp : '/account');
        update_option('yatra_account_base', $slug);
        $settings['customer_account_page'] = '/' . $slug;

        return $settings;
    }

    private function persistAccountBaseFromCustomerAccountPage(): void
    {
        $cpp = (string) get_option('yatra_customer_account_page', '');
        update_option('yatra_account_base', self::accountSlugFromCustomerAccountPath($cpp));
    }

    private static function accountSlugFromCustomerAccountPath(string $path): string
    {
        $path = trim(str_replace('\\', '/', $path), '/');
        $parts = array_values(array_filter(explode('/', $path), static fn ($p) => $p !== ''));
        $segment = $parts !== [] ? end($parts) : 'account';
        $slug = sanitize_title($segment);

        return $slug !== '' ? $slug : 'account';
    }
}

