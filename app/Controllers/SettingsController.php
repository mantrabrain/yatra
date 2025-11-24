<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Settings REST API Controller
 * Handles getting and updating plugin settings stored in WordPress options table
 */
class SettingsController extends BaseController
{
    /**
     * All settings fields with their default values
     */
    private array $default_settings = [
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
        'language' => 'en',
        
        // Booking Settings
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
        
        // Payment Settings
        'currency' => 'USD',
        'payment_gateways' => [],
        'payment_methods' => [],
        'partial_payment' => false,
        'partial_payment_percentage' => 30,
        'deposit_required' => false,
        'deposit_percentage' => 20,
        'gateway_configs' => [],
        
        // Email Settings
        'admin_email' => '',
        'from_email' => '',
        'from_name' => '',
        'email_template_booking' => true,
        'email_template_confirmation' => true,
        'email_template_cancellation' => true,
        'email_template_reminder' => true,
        'smtp_enabled' => false,
        'smtp_host' => 'smtp.gmail.com',
        'smtp_port' => 587,
        'smtp_username' => '',
        'smtp_password' => '',
        'smtp_encryption' => 'tls',
        
        // Trip Settings
        'default_trip_status' => 'draft',
        'require_availability' => true,
        'max_group_size' => 20,
        'min_group_size' => 2,
        'booking_advance_days' => 0,
        'allow_custom_dates' => false,
        'require_minimum_participants' => false,
        'minimum_participants' => 1,
        
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
        'tax_rate' => 0,
        'tax_inclusive' => false,
        'vat_number' => '',
        'tax_by_country' => false,
        'tax_rates' => [],
        
        // Currency Settings
        'default_currency' => 'USD',
        'multi_currency' => false,
        'currency_position' => 'left',
        'currency_decimals' => 2,
        'supported_currencies' => ['USD'],
        'auto_currency_detection' => false,
        
        // Notification Settings
        'notify_new_booking' => true,
        'notify_payment' => true,
        'notify_cancellation' => true,
        'notify_admin' => true,
        'notify_customer_booking' => true,
        'notify_customer_payment' => true,
        'sms_notifications' => false,
        'sms_provider' => '',
        'sms_api_key' => '',
        
        // Integration Settings
        'google_analytics' => '',
        'facebook_pixel' => '',
        'google_maps_api' => '',
        'recaptcha_enabled' => false,
        'recaptcha_site_key' => '',
        'recaptcha_secret_key' => '',
        
        // Permalink Settings
        'trip_base' => 'trip',
        'destination_base' => 'destination',
        'activity_base' => 'activity',
        'trip_category_base' => 'trip-category',
        
        // Advanced Settings
        'debug_mode' => false,
        'enable_logging' => false,
        'cache_enabled' => true,
        'api_key' => '',
        'api_rate_limit' => 100,
        'session_timeout' => 3600,
    ];

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
    }

    public function check_permission(?WP_REST_Request $request = null): bool
    {
        if (!is_user_logged_in()) {
            return false;
        }

        // Only administrators can manage settings
        return current_user_can('manage_options');
    }

    /**
     * Get all settings
     */
    public function get_settings(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $settings = [];
            
            // Get all settings from WordPress options table with yatra_ prefix
            foreach ($this->default_settings as $key => $default_value) {
                $option_name = 'yatra_' . $key;
                $value = get_option($option_name, $default_value);
                
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

            return $this->success_response($settings);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Update settings
     */
    public function update_settings(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $data = $request->get_json_params();
            
            if (!is_array($data)) {
                return $this->error_response('Invalid settings data', 400);
            }

            $updated = [];
            $errors = [];

            // Process each setting
            foreach ($data as $key => $value) {
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
                in_array('trip_category_base', $updated, true)) {
                // Use hard flush to ensure rules are saved to database
                flush_rewrite_rules(true);
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
     */
    private function sanitize_setting(string $key, mixed $value): mixed
    {
        $default = $this->default_settings[$key] ?? null;
        $default_type = gettype($default);

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

        // Handle booleans
        if (is_bool($default)) {
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
            // Special handling for specific fields
            if ($key === 'company_email' || $key === 'admin_email' || $key === 'from_email' || $key === 'smtp_username') {
                return sanitize_email($value);
            }
            if ($key === 'company_website' || $key === 'company_logo' || $key === 'google_analytics' || $key === 'facebook_pixel' || $key === 'google_maps_api') {
                return esc_url_raw($value);
            }
            if ($key === 'refund_policy' || $key === 'cancellation_policy') {
                return sanitize_textarea_field($value);
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
            $sanitized[$sanitized_gateway] = [
                'enabled' => isset($config['enabled']) ? (bool) $config['enabled'] : false,
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
        }
        return $sanitized;
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
     * Flush rewrite rules
     */
    public function flush_rewrite_rules(WP_REST_Request $request): WP_REST_Response|WP_Error
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
}

