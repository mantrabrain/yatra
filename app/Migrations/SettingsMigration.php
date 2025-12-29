<?php

namespace Yatra\Migration;

use Yatra\Migration\MigrationProgress;
use Yatra\Utils\Logger;

class SettingsMigration extends BaseMigration
{
    public function __construct(MigrationProgress $service)
    {
        parent::__construct($service);
    }

    public function run(): array
    {
        global $wpdb;

        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        error_log("[Yatra Migration] ========================================");
        error_log("[Yatra Migration] Starting Settings Migration");
        error_log("[Yatra Migration] ========================================");

        try {
            // Map old settings to new settings
            $settingsMap = $this->getSettingsMap();
            
            $total = count($settingsMap);
            
            foreach ($settingsMap as $mapping) {
                try {
                    $oldKey = $mapping['old'];
                    $newKey = $mapping['new'];
                    $transform = $mapping['transform'] ?? null;
                    $default = $mapping['default'] ?? null;
                    
                    // Get old setting value
                    $oldValue = get_option($oldKey, null);
                    
                    if ($oldValue === null && $default !== null) {
                        $oldValue = $default;
                    }
                    
                    if ($oldValue === null) {
                        error_log("[Yatra Migration] Setting '{$oldKey}' not found in old system, skipping");
                        $skipped++;
                        continue;
                    }
                    
                    // Transform value if needed
                    $newValue = $transform ? $transform($oldValue) : $oldValue;
                    
                    // Check if new setting already exists
                    $existingValue = get_option($newKey, null);
                    
                    if ($existingValue !== null && !$this->isForceMigration()) {
                        error_log("[Yatra Migration] Setting '{$newKey}' already exists, skipping");
                        $skipped++;
                        continue;
                    }
                    
                    // Update or add new setting
                    update_option($newKey, $newValue);
                    
                    error_log("[Yatra Migration] Migrated setting: {$oldKey} => {$newKey} (value: " . print_r($newValue, true) . ")");
                    $migrated++;
                    
                } catch (\Exception $e) {
                    $failed++;
                    error_log("[Yatra Migration] Failed to migrate setting '{$oldKey}': " . $e->getMessage());
                    Logger::error("Setting migration exception", [
                        'source' => 'migration',
                        'old_key' => $oldKey,
                        'error' => $e->getMessage()
                    ]);
                }
                
                $this->updateProgress('settings', 'running', $migrated, $skipped, $failed, $total, null, null);
            }
            
            // Migrate complex settings (arrays/objects)
            $this->migrateComplexSettings();
            
        } catch (\Exception $e) {
            error_log("[Yatra Migration] Settings migration exception: " . $e->getMessage());
            Logger::error("Settings migration failed", [
                'source' => 'migration',
                'error' => $e->getMessage()
            ]);
        }

        error_log("[Yatra Migration] ========================================");
        error_log("[Yatra Migration] Settings Migration Complete");
        error_log("[Yatra Migration] Migrated: {$migrated}, Skipped: {$skipped}, Failed: {$failed}");
        error_log("[Yatra Migration] ========================================");

        return [
            'migrated' => $migrated,
            'skipped' => $skipped,
            'failed' => $failed,
        ];
    }
    
    /**
     * Get settings mapping from old to new
     */
    private function getSettingsMap(): array
    {
        return [
            // General Settings
            [
                'old' => 'yatra_general_company_name',
                'new' => 'yatra_company_name',
            ],
            [
                'old' => 'yatra_general_company_email',
                'new' => 'yatra_company_email',
            ],
            [
                'old' => 'yatra_general_company_phone',
                'new' => 'yatra_company_phone',
            ],
            [
                'old' => 'yatra_general_company_address',
                'new' => 'yatra_company_address',
            ],
            
            // Currency Settings
            [
                'old' => 'yatra_currency_code',
                'new' => 'yatra_currency',
            ],
            [
                'old' => 'yatra_currency_position',
                'new' => 'yatra_currency_position',
            ],
            [
                'old' => 'yatra_currency_thousand_separator',
                'new' => 'yatra_thousand_separator',
            ],
            [
                'old' => 'yatra_currency_decimal_separator',
                'new' => 'yatra_decimal_separator',
            ],
            [
                'old' => 'yatra_currency_number_of_decimals',
                'new' => 'yatra_decimal_places',
                'transform' => function($value) {
                    return intval($value);
                }
            ],
            
            // Trip/Tour Settings
            [
                'old' => 'yatra_general_tour_listing_page_displays',
                'new' => 'yatra_trip_listing_display',
            ],
            [
                'old' => 'yatra_general_number_of_tour_list_per_page',
                'new' => 'yatra_trips_per_page',
                'transform' => function($value) {
                    return intval($value) ?: 12;
                }
            ],
            [
                'old' => 'yatra_general_enable_tour_archive',
                'new' => 'yatra_enable_trip_archive',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            
            // Booking Settings
            [
                'old' => 'yatra_booking_enable_guest_booking',
                'new' => 'yatra_enable_guest_booking',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            [
                'old' => 'yatra_booking_require_login',
                'new' => 'yatra_require_login',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            [
                'old' => 'yatra_booking_allow_guest_checkout',
                'new' => 'yatra_allow_guest_checkout',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            [
                'old' => 'yatra_booking_confirmation',
                'new' => 'yatra_booking_confirmation',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            [
                'old' => 'yatra_booking_auto_confirm',
                'new' => 'yatra_auto_confirm_bookings',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            [
                'old' => 'yatra_booking_expiry_hours',
                'new' => 'yatra_booking_expiry_hours',
                'transform' => function($value) {
                    return intval($value) ?: 24;
                }
            ],
            [
                'old' => 'yatra_booking_cancellation_days',
                'new' => 'yatra_cancellation_days',
                'transform' => function($value) {
                    return intval($value) ?: 7;
                }
            ],
            [
                'old' => 'yatra_booking_refund_policy',
                'new' => 'yatra_refund_policy',
            ],
            [
                'old' => 'yatra_booking_allow_waitlist',
                'new' => 'yatra_allow_waitlist',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            
            // Payment Settings
            [
                'old' => 'yatra_payment_test_mode',
                'new' => 'yatra_payment_test_mode',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            [
                'old' => 'yatra_payment_enable_deposit',
                'new' => 'yatra_enable_deposit',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            [
                'old' => 'yatra_payment_deposit_type',
                'new' => 'yatra_deposit_type',
            ],
            [
                'old' => 'yatra_payment_deposit_amount',
                'new' => 'yatra_deposit_amount',
                'transform' => function($value) {
                    return floatval($value) ?: 20;
                }
            ],
            [
                'old' => 'yatra_payment_deposit_percentage',
                'new' => 'yatra_deposit_percentage',
                'transform' => function($value) {
                    return floatval($value) ?: 20;
                }
            ],
            
            // Email Settings
            [
                'old' => 'yatra_email_from_name',
                'new' => 'yatra_email_from_name',
            ],
            [
                'old' => 'yatra_email_from_address',
                'new' => 'yatra_email_from_address',
            ],
            [
                'old' => 'yatra_email_admin_email',
                'new' => 'yatra_admin_email',
            ],
            [
                'old' => 'yatra_email_enable_admin_notifications',
                'new' => 'yatra_enable_admin_notifications',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            [
                'old' => 'yatra_email_enable_customer_notifications',
                'new' => 'yatra_enable_customer_notifications',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            
            // Review Settings
            [
                'old' => 'yatra_review_enable_reviews',
                'new' => 'yatra_enable_reviews',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            [
                'old' => 'yatra_review_require_booking',
                'new' => 'yatra_require_booking_to_review',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            [
                'old' => 'yatra_review_auto_approve',
                'new' => 'yatra_auto_approve_reviews',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            [
                'old' => 'yatra_review_moderation',
                'new' => 'yatra_enable_review_moderation',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            
            // Tax Settings
            [
                'old' => 'yatra_tax_enable',
                'new' => 'yatra_enable_tax',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            [
                'old' => 'yatra_tax_rate',
                'new' => 'yatra_tax_rate',
                'transform' => function($value) {
                    return floatval($value);
                }
            ],
            [
                'old' => 'yatra_tax_inclusive',
                'new' => 'yatra_tax_inclusive',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            [
                'old' => 'yatra_tax_label',
                'new' => 'yatra_tax_label',
            ],
            
            // Permalink Settings
            [
                'old' => 'yatra_permalink_tour_base',
                'new' => 'yatra_trip_base',
                'default' => 'trip',
            ],
            [
                'old' => 'yatra_permalink_destination_base',
                'new' => 'yatra_destination_base',
                'default' => 'destination',
            ],
            [
                'old' => 'yatra_permalink_activity_base',
                'new' => 'yatra_activity_base',
                'default' => 'activity',
            ],
            [
                'old' => 'yatra_permalink_booking_base',
                'new' => 'yatra_booking_base',
                'default' => 'book',
            ],
            
            // Advanced Settings
            [
                'old' => 'yatra_advanced_debug_mode',
                'new' => 'yatra_enable_debug_mode',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            [
                'old' => 'yatra_advanced_delete_data',
                'new' => 'yatra_delete_data_on_uninstall',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            
            // Customer Settings
            [
                'old' => 'yatra_customer_enable_accounts',
                'new' => 'yatra_enable_customer_accounts',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            [
                'old' => 'yatra_customer_enable_registration',
                'new' => 'yatra_enable_customer_registration',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
        ];
    }
    
    /**
     * Migrate complex settings (arrays, objects, etc.)
     */
    private function migrateComplexSettings(): void
    {
        error_log("[Yatra Migration] Migrating complex settings...");
        
        // Migrate payment gateway settings
        $oldGatewaySettings = get_option('yatra_payment_gateways', []);
        if (!empty($oldGatewaySettings) && is_array($oldGatewaySettings)) {
            $newGatewayConfigs = [];
            
            foreach ($oldGatewaySettings as $gateway => $config) {
                if (is_array($config)) {
                    $newGatewayConfigs[$gateway] = $config;
                }
            }
            
            if (!empty($newGatewayConfigs)) {
                update_option('yatra_gateway_configs', $newGatewayConfigs);
                error_log("[Yatra Migration] Migrated payment gateway configs: " . count($newGatewayConfigs) . " gateways");
            }
        }
        
        // Migrate email template settings
        $emailTemplates = [
            'booking_confirmation',
            'booking_cancelled',
            'booking_completed',
            'payment_received',
            'payment_reminder',
            'admin_new_booking',
        ];
        
        foreach ($emailTemplates as $template) {
            $oldKey = "yatra_email_template_{$template}";
            $oldTemplate = get_option($oldKey, null);
            
            if ($oldTemplate !== null) {
                $newKey = "yatra_email_{$template}";
                update_option($newKey, $oldTemplate);
                error_log("[Yatra Migration] Migrated email template: {$template}");
            }
        }
        
        // Migrate date/time format settings
        $dateFormat = get_option('yatra_general_date_format', 'Y-m-d');
        $timeFormat = get_option('yatra_general_time_format', 'H:i');
        
        if ($dateFormat) {
            update_option('yatra_date_format', $dateFormat);
            error_log("[Yatra Migration] Migrated date format: {$dateFormat}");
        }
        
        if ($timeFormat) {
            update_option('yatra_time_format', $timeFormat);
            error_log("[Yatra Migration] Migrated time format: {$timeFormat}");
        }
        
        // Migrate page settings
        $pages = [
            'booking_page' => 'yatra_general_booking_page',
            'customer_account_page' => 'yatra_customer_account_page',
            'terms_page' => 'yatra_general_terms_page',
            'privacy_page' => 'yatra_general_privacy_page',
        ];
        
        foreach ($pages as $newKey => $oldKey) {
            $pageId = get_option($oldKey, 0);
            if ($pageId) {
                update_option("yatra_{$newKey}", intval($pageId));
                error_log("[Yatra Migration] Migrated page setting: {$newKey} = {$pageId}");
            }
        }
        
        error_log("[Yatra Migration] Complex settings migration complete");
    }
}
