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
                        $skipped++;
                        continue;
                    }
                    
                    // Transform value if needed
                    $newValue = $transform ? $transform($oldValue) : $oldValue;
                    
                    // Check if new setting already exists
                    $existingValue = get_option($newKey, null);
                    
                    if ($existingValue !== null && !$this->isForceMigration()) {
                        $skipped++;
                        continue;
                    }
                    
                    // Update or add new setting
                    update_option($newKey, $newValue);
                    
                    $migrated++;
                    
                } catch (\Exception $e) {
                    $failed++;
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
            Logger::error("Settings migration failed", [
                'source' => 'migration',
                'error' => $e->getMessage()
            ]);
        }

        return [
            'migrated' => $migrated,
            'skipped' => $skipped,
            'failed' => $failed,
        ];
    }
    
    /**
     * Get settings mapping from old to new
     *
     * These are the ACTUAL old Yatra option keys verified from old plugin source code.
     * Old keys found in: class-yatra-install.php, class-yatra-setup-wizard.php,
     * yatra-template-functions.php, class-yatra-email.php, yatra-pricing-functions.php,
     * hooks/yatra-design-hooks.php, class-yatra-assets.php, functions.php
     */
    private function getSettingsMap(): array
    {
        return [
            // Currency Settings (verified from setup wizard + template functions)
            [
                'old' => 'yatra_currency',
                'new' => 'yatra_currency',
            ],
            [
                'old' => 'yatra_currency_position',
                'new' => 'yatra_currency_position',
            ],
            [
                'old' => 'yatra_thousand_separator',
                'new' => 'yatra_thousand_separator',
            ],
            [
                'old' => 'yatra_decimal_separator',
                'new' => 'yatra_decimal_separator',
            ],
            [
                'old' => 'yatra_price_number_decimals',
                'new' => 'yatra_price_number_decimals',
                'transform' => function($value) {
                    return intval($value);
                }
            ],
            [
                'old' => 'yatra_currency_symbol_type',
                'new' => 'yatra_currency_symbol_type',
            ],

            // Page Settings (verified from class-yatra-install.php)
            [
                'old' => 'yatra_checkout_page',
                'new' => 'yatra_checkout_page',
                'transform' => function($value) {
                    return intval($value);
                }
            ],
            [
                'old' => 'yatra_cart_page',
                'new' => 'yatra_cart_page',
                'transform' => function($value) {
                    return intval($value);
                }
            ],
            [
                'old' => 'yatra_thankyou_page',
                'new' => 'yatra_thankyou_page',
                'transform' => function($value) {
                    return intval($value);
                }
            ],
            [
                'old' => 'yatra_my_account_page',
                'new' => 'yatra_my_account_page',
                'transform' => function($value) {
                    return intval($value);
                }
            ],
            [
                'old' => 'yatra_failed_transaction_page',
                'new' => 'yatra_failed_transaction_page',
                'transform' => function($value) {
                    return intval($value);
                }
            ],

            // Booking/Checkout Settings (verified from class-yatra-install.php + hooks)
            [
                'old' => 'yatra_enable_guest_checkout',
                'new' => 'yatra_enable_guest_checkout',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            [
                'old' => 'yatra_booknow_button_text',
                'new' => 'yatra_booknow_button_text',
            ],
            [
                'old' => 'yatra_booknow_loading_text',
                'new' => 'yatra_booknow_loading_text',
            ],
            [
                'old' => 'yatra_booking_form_title_text',
                'new' => 'yatra_booking_form_title_text',
            ],
            [
                'old' => 'yatra_enquiry_form_title_text',
                'new' => 'yatra_enquiry_form_title_text',
            ],
            [
                'old' => 'yatra_enquiry_button_text',
                'new' => 'yatra_enquiry_button_text',
            ],
            [
                'old' => 'yatra_select_date_title',
                'new' => 'yatra_select_date_title',
            ],
            [
                'old' => 'yatra_custom_attributes_title_text',
                'new' => 'yatra_custom_attributes_title_text',
            ],
            [
                'old' => 'yatra_update_cart_text',
                'new' => 'yatra_update_cart_text',
            ],
            [
                'old' => 'yatra_proceed_to_checkout_text',
                'new' => 'yatra_proceed_to_checkout_text',
            ],
            [
                'old' => 'yatra_order_booking_text',
                'new' => 'yatra_order_booking_text',
            ],

            // Payment Gateway Settings (verified from function-yatra-payments.php)
            [
                'old' => 'yatra_payment_gateway_test_mode',
                'new' => 'yatra_payment_gateway_test_mode',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            [
                'old' => 'yatra_payment_gateway_enable_logging',
                'new' => 'yatra_payment_gateway_enable_logging',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],

            // Email Settings (verified from class-yatra-email.php)
            [
                'old' => 'yatra_email_from_name',
                'new' => 'yatra_email_from_name',
            ],
            [
                'old' => 'yatra_email_from_address',
                'new' => 'yatra_email_from_address',
            ],
            [
                'old' => 'yatra_admin_email_recipient_lists',
                'new' => 'yatra_admin_email_recipient_lists',
            ],
            [
                'old' => 'yatra_disable_all_email',
                'new' => 'yatra_disable_all_email',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],

            // Tax Settings (verified from yatra-pricing-functions.php)
            [
                'old' => 'yatra_payment_tax_rate',
                'new' => 'yatra_tax_rate',
                'transform' => function($value) {
                    return floatval($value);
                }
            ],

            // Layout/Design Settings (verified from hooks and setup wizard)
            [
                'old' => 'yatra_page_container_class',
                'new' => 'yatra_page_container_class',
            ],
            [
                'old' => 'yatra_setting_layouts_single_tour_tab_layout',
                'new' => 'yatra_setting_layouts_single_tour_tab_layout',
            ],
            [
                'old' => 'yatra_setting_layouts_tour_archive',
                'new' => 'yatra_setting_layouts_tour_archive',
            ],
            [
                'old' => 'yatra_design_primary_color',
                'new' => 'yatra_design_primary_color',
            ],
            [
                'old' => 'yatra_available_for_booking_color',
                'new' => 'yatra_available_for_booking_color',
            ],
            [
                'old' => 'yatra_available_for_enquiry_only_color',
                'new' => 'yatra_available_for_enquiry_only_color',
            ],
            [
                'old' => 'yatra_not_available_for_booking_enquiry_color',
                'new' => 'yatra_not_available_for_booking_enquiry_color',
            ],

            // Misc Settings (verified from various files)
            [
                'old' => 'yatra_date_selection_type',
                'new' => 'yatra_date_selection_type',
            ],
            [
                'old' => 'yatra_enquiry_form_show',
                'new' => 'yatra_enquiry_form_show',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            [
                'old' => 'yatra_log_options',
                'new' => 'yatra_log_options',
            ],
        ];
    }
    
    /**
     * Migrate complex settings (arrays, objects, etc.)
     *
     * Verified from old plugin source:
     *   - yatra_payment_gateways: array of active gateway IDs (from class-yatra-install.php)
     *   - yatra_permalinks: array with tour_base, activity_base, destination_base, attributes_base
     *     (from admin/class-yatra-admin-permalinks.php)
     */
    private function migrateComplexSettings(): void
    {
        // Migrate active payment gateways list
        // Old: yatra_payment_gateways = ['paypal', 'booking_only'] (array of gateway IDs)
        $oldGateways = get_option('yatra_payment_gateways', []);
        if (!empty($oldGateways) && is_array($oldGateways)) {
            update_option('yatra_active_payment_gateways', $oldGateways);
        }

        // Migrate permalink settings
        // Old: yatra_permalinks = ['yatra_tour_base' => '...', 'yatra_destination_base' => '...', ...]
        $oldPermalinks = get_option('yatra_permalinks', []);
        if (!empty($oldPermalinks) && is_array($oldPermalinks)) {
            if (!empty($oldPermalinks['yatra_tour_base'])) {
                update_option('yatra_trip_base', $oldPermalinks['yatra_tour_base']);
            }
            if (!empty($oldPermalinks['yatra_destination_base'])) {
                update_option('yatra_destination_base', $oldPermalinks['yatra_destination_base']);
            }
            if (!empty($oldPermalinks['yatra_activity_base'])) {
                update_option('yatra_activity_base', $oldPermalinks['yatra_activity_base']);
            }
            if (!empty($oldPermalinks['yatra_attributes_base'])) {
                update_option('yatra_attributes_base', $oldPermalinks['yatra_attributes_base']);
            }
        }
    }
}
