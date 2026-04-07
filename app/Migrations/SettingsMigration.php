<?php

namespace Yatra\Migration;

use Yatra\Migration\MigrationProgress;
use Yatra\Utils\Logger;

class SettingsMigration extends BaseMigration
{
    /**
     * True when legacy permalink slug options were written; triggers a rewrite flush after run().
     */
    private bool $rewriteRulesNeedFlush = false;

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
            
            Logger::info("Starting settings migration", [
                'source' => 'migration',
                'total_simple_settings' => $total,
                'force_migration' => $this->isForceMigration()
            ]);
            
            // Debug: Check what old Yatra settings actually exist
            global $wpdb;
            $existingOldSettings = $wpdb->get_col(
                "SELECT option_name FROM {$wpdb->options} 
                 WHERE option_name LIKE 'yatra_%' 
                 AND option_name NOT LIKE '%gateway_configs%'
                 AND option_name NOT LIKE '%migration_%'
                 ORDER BY option_name"
            );
            
            Logger::info("Found " . count($existingOldSettings) . " existing old Yatra settings", [
                'source' => 'migration',
                'existing_settings' => $existingOldSettings
            ]);
            
            // Debug: Log specific gateway-related settings
            $gatewaySettings = ['yatra_payment_gateways', 'yatra_paypal_settings', 'yatra_stripe_settings', 'yatra_authorize_net_settings'];
            foreach ($gatewaySettings as $key) {
                $value = get_option($key, 'NOT_FOUND');
                $valueType = is_array($value) ? '[ARRAY:' . count($value) . ']' : (is_serialized($value) ? '[SERIALIZED]' : $value);
                Logger::debug("Gateway setting - {$key}: {$valueType}", ['source' => 'migration']);
            }
            
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
                        Logger::debug("Setting skipped (not found): {$oldKey}", ['source' => 'migration']);
                        continue;
                    }
                    
                    // Transform value if needed
                    $newValue = $transform ? $transform($oldValue) : $oldValue;
                    
                    // Check if new setting already exists.
                    // NOTE: Since many option keys are shared between old and new plugin (same
                    // option_name for the same feature), the new plugin's install routine may
                    // have already written a default value. We always overwrite to ensure the
                    // user's real data from the old plugin wins — unless it's identical.
                    $existingValue = get_option($newKey, null);

                    if ($existingValue !== null && !$this->isForceMigration()) {
                        // If the values are already identical, just count as migrated to avoid
                        // misleading 'skipped 30 settings' message in the UI.
                        if (serialize($existingValue) === serialize($newValue)) {
                            $migrated++;
                            Logger::debug("Setting already matches, counted as migrated: {$oldKey} -> {$newKey}", ['source' => 'migration']);
                            $this->updateProgress('settings', 'running', $migrated, $skipped, $failed, $total, null, null);
                            continue;
                        }
                        // Values differ — for same-key settings the old data should win.
                        // Only skip if old and new keys are truly different option names
                        // (meaning the new plugin intentionally renamed them).
                        if ($oldKey !== $newKey) {
                            $skipped++;
                            Logger::debug("Setting skipped (already exists, different key): {$oldKey} -> {$newKey}", ['source' => 'migration']);
                            $this->updateProgress('settings', 'running', $migrated, $skipped, $failed, $total, null, null);
                            continue;
                        }
                        // Same key in both systems — overwrite with old user data.
                    }
                    
                    // Update or add new setting
                    update_option($newKey, $newValue);
                    
                    if ($existingValue !== null && $this->isForceMigration()) {
                        Logger::info("Setting force-migrated (overwritten): {$oldKey} -> {$newKey}", ['source' => 'migration']);
                    } else {
                        Logger::info("Setting migrated: {$oldKey} -> {$newKey}", ['source' => 'migration']);
                    }
                    
                    $migrated++;
                    
                } catch (\Exception $e) {
                    $failed++;
                    Logger::error("Setting migration exception", [
                        'source' => 'migration',
                        'old_key' => $oldKey ?? 'unknown',
                        'error' => $e->getMessage()
                    ]);
                }
                
                $this->updateProgress('settings', 'running', $migrated, $skipped, $failed, $total, null, null);
            }
            
            // Migrate complex settings (arrays/objects) and count them
            Logger::info("Starting complex settings migration", ['source' => 'migration']);
            $complexResults = $this->migrateComplexSettings();
            $migrated += $complexResults['migrated'];
            $skipped += $complexResults['skipped'];
            $failed += $complexResults['failed'];
            
            Logger::info("Settings migration completed", [
                'source' => 'migration',
                'migrated' => $migrated,
                'skipped' => $skipped,
                'failed' => $failed
            ]);

            if ($this->rewriteRulesNeedFlush && function_exists('flush_rewrite_rules')) {
                flush_rewrite_rules(true);
                Logger::info('Flushed rewrite rules after legacy permalink slug migration', [
                    'source' => 'migration',
                ]);
                $this->rewriteRulesNeedFlush = false;
            }

            if (class_exists(\Yatra\Services\SettingsService::class)) {
                \Yatra\Services\SettingsService::reload();
            }
            
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
            // yatra_price_number_decimals → yatra_decimal_places: see migrateLegacyRenamedFreeOptions()
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
            // yatra_enable_guest_checkout → allow_guest_checkout + enable_guest_booking: migrateLegacyRenamedFreeOptions()
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

            // yatra_payment_tax_rate → yatra_tax_rate: migrateLegacyRenamedFreeOptions()

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

            // ── Additional settings verified from yatra-misc-functions.php and form handler ──

            // Tour listing "View Details" button text
            [
                'old' => 'yatra_tour_view_details_button_text',
                'new' => 'yatra_tour_view_details_button_text',
            ],

            // Checkout legal agreement toggles (class-yatra-form-handler.php)
            [
                'old' => 'yatra_checkout_show_agree_to_privacy_policy',
                'new' => 'yatra_checkout_show_agree_to_privacy_policy',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],
            [
                'old' => 'yatra_checkout_show_agree_to_terms_policy',
                'new' => 'yatra_checkout_show_agree_to_terms_policy',
                'transform' => function($value) {
                    return $value === 'yes' || $value === true || $value === 1;
                }
            ],

            // Date/time display formats (used in template-tags.php)
            [
                'old' => 'yatra_date_format',
                'new' => 'yatra_date_format',
            ],
            [
                'old' => 'yatra_time_format',
                'new' => 'yatra_time_format',
            ],
        ];
    }

    /**
     * Copy public URL slug options from legacy yatra_permalinks into 3.x wp_options.
     *
     * @return array{migrated: int, skipped: int}
     */
    private function migrateLegacyPermalinkBases(): array
    {
        $writes = 0;
        $sanitize = static function ($value): string {
            if ($value === null || $value === false || $value === '') {
                return '';
            }
            $s = is_string($value) ? trim($value) : (string) $value;
            $s = preg_replace('/[^a-z0-9_-]/i', '', $s) ?: '';

            return $s;
        };

        $setSlugOption = function (string $optionName, $raw) use (&$writes, $sanitize): void {
            $slug = $sanitize($raw);
            if ($slug === '') {
                return;
            }
            $current = get_option($optionName, '');
            $curNorm = is_string($current) ? $sanitize($current) : '';
            if ($curNorm === $slug) {
                return;
            }
            update_option($optionName, $slug);
            $writes++;
            $this->rewriteRulesNeedFlush = true;
        };

        $oldPermalinks = get_option('yatra_permalinks', []);
        if (!empty($oldPermalinks) && is_array($oldPermalinks)) {
            $map = [
                ['yatra_tour_base', 'yatra_trip_base'],
                ['tour_base', 'yatra_trip_base'],
                ['yatra_destination_base', 'yatra_destination_base'],
                ['destination_base', 'yatra_destination_base'],
                ['yatra_activity_base', 'yatra_activity_base'],
                ['activity_base', 'yatra_activity_base'],
                ['yatra_attributes_base', 'yatra_attributes_base'],
                ['attributes_base', 'yatra_attributes_base'],
                ['yatra_booking_base', 'yatra_booking_base'],
                ['booking_base', 'yatra_booking_base'],
                ['yatra_trip_category_base', 'yatra_trip_category_base'],
                ['yatra_tour_category_base', 'yatra_trip_category_base'],
                ['trip_category_base', 'yatra_trip_category_base'],
                ['tour_category_base', 'yatra_trip_category_base'],
                ['yatra_category_base', 'yatra_trip_category_base'],
                ['category_base', 'yatra_trip_category_base'],
                ['yatra_difficulty_base', 'yatra_difficulty_base'],
                ['difficulty_base', 'yatra_difficulty_base'],
                ['yatra_account_base', 'yatra_account_base'],
                ['account_base', 'yatra_account_base'],
            ];
            foreach ($map as [$legacyKey, $optionName]) {
                if (!empty($oldPermalinks[$legacyKey])) {
                    $setSlugOption($optionName, $oldPermalinks[$legacyKey]);
                }
            }
        }

        $skipped = (!is_array($oldPermalinks) || empty($oldPermalinks)) ? 1 : 0;

        if ($writes > 0) {
            Logger::info("Migrated {$writes} permalink slug option(s) from yatra_permalinks", [
                'source' => 'migration',
            ]);
        } elseif ($skipped) {
            Logger::debug('Skipped permalinks (yatra_permalinks not found or empty)', ['source' => 'migration']);
        }

        return [
            'migrated' => $writes,
            'skipped' => $skipped,
        ];
    }

    /**
     * Free 2.x → 3.x option renames that SettingsService actually reads.
     *
     * The simple settings loop skips when old_key !== new_key and the 3.x option already exists with a
     * different value — which would leave these stuck on defaults forever after upgrade.
     */
    private function migrateLegacyRenamedFreeOptions(): int
    {
        $n = 0;

        $legacyGuest = get_option('yatra_enable_guest_checkout', null);
        if ($legacyGuest !== null && $legacyGuest !== false && $legacyGuest !== '') {
            $on = $legacyGuest === 'yes' || $legacyGuest === true || $legacyGuest === 1 || $legacyGuest === '1';
            update_option('yatra_allow_guest_checkout', $on);
            update_option('yatra_enable_guest_booking', $on);
            Logger::info('Migrated yatra_enable_guest_checkout → yatra_allow_guest_checkout + yatra_enable_guest_booking', [
                'source' => 'migration',
                'enabled' => $on,
            ]);
            $n++;
        }

        $legacyDecimals = get_option('yatra_price_number_decimals', null);
        if ($legacyDecimals !== null && $legacyDecimals !== false && $legacyDecimals !== '') {
            update_option('yatra_decimal_places', max(0, min(10, (int) $legacyDecimals)));
            Logger::info('Migrated yatra_price_number_decimals → yatra_decimal_places', [
                'source' => 'migration',
            ]);
            $n++;
        }

        $legacyTax = get_option('yatra_payment_tax_rate', null);
        if ($legacyTax !== null && $legacyTax !== false && $legacyTax !== '') {
            update_option('yatra_tax_rate', (float) $legacyTax);
            Logger::info('Migrated yatra_payment_tax_rate → yatra_tax_rate', [
                'source' => 'migration',
            ]);
            $n++;
        }

        return $n;
    }
    
    /**
     * Migrate complex settings (arrays, objects, etc.)
     *
     * Verified from old plugin source:
     *   - yatra_payment_gateways: array of active gateway IDs (from class-yatra-install.php)
     *   - yatra_permalinks: array with tour/trip, booking, category, difficulty, account bases, etc.
     *     (from admin/class-yatra-admin-permalinks.php; keys may be prefixed or short forms)
     *   - Individual gateway settings (yatra_paypal_settings, yatra_stripe_settings, etc.)
     * 
     * @return array ['migrated' => int, 'skipped' => int, 'failed' => int]
     */
    private function migrateComplexSettings(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;
        
        // Migrate active payment gateways list.
        //
        // OLD format (class-yatra-install.php line 197):
        //   yatra_payment_gateways = ['booking_only' => 'yes', 'paypal' => 'yes']
        //   Active gateways are retrieved via array_keys() — the value is always 'yes'.
        //
        // NEW format expected by yatra 3.x:
        //   yatra_active_payment_gateways = ['booking_only', 'paypal']  (indexed array)
        //
        // We must convert the associative slug=>yes map to a plain indexed list.
        $oldGateways = get_option('yatra_payment_gateways', []);
        if (!empty($oldGateways) && is_array($oldGateways)) {
            // Filter out any disabled gateways (value != 'yes') and extract just the slugs.
            $activeGatewayIds = array_keys(array_filter($oldGateways, function($v) {
                return $v === 'yes' || $v === true || $v === 1;
            }));
            update_option('yatra_active_payment_gateways', $activeGatewayIds);
            $migrated++;
            Logger::info("Migrated active payment gateways (indexed)", [
                'source' => 'migration',
                'gateways' => $activeGatewayIds
            ]);
        } else {
            $skipped++;
            Logger::debug("Skipped payment gateways (not found or empty)", ['source' => 'migration']);
        }

        // Migrate payment gateway configurations
        $gatewayResults = $this->migratePaymentGatewayConfigs();
        $migrated += $gatewayResults['migrated'];
        $skipped += $gatewayResults['skipped'];

        $permalinkResults = $this->migrateLegacyPermalinkBases();
        $migrated += $permalinkResults['migrated'];
        $skipped += $permalinkResults['skipped'];

        // 2.x options renamed in 3.x (must not rely on simple map — getSettingsMap skips when new key already differs).
        $migrated += $this->migrateLegacyRenamedFreeOptions();
        
        // Migrate enquiry/booking form settings
        $enquiryResults = $this->migrateEnquirySettings();
        $migrated += $enquiryResults['migrated'];
        $skipped += $enquiryResults['skipped'];

        // Legacy Pro Google Calendar OAuth options → new Pro 3.x option names (no separate migration step).
        $this->migrateLegacyProGoogleCalendarTokens();

        // Legacy Pro review settings + partial payment (wp_options) → Yatra 3.x core settings keys.
        $this->migrateLegacyReviewAndPartialPaymentOptions();
        
        return [
            'migrated' => $migrated,
            'skipped' => $skipped,
            'failed' => $failed,
        ];
    }

    /**
     * Map legacy Pro Google Calendar token options to the keys used by Yatra Pro 3.x SettingsRepository.
     * Skips when Pro 3.0+ is not active (same rule as other Pro table migrations).
     */
    private function migrateLegacyProGoogleCalendarTokens(): void
    {
        $refresh = (string) get_option('yatra_google_calendar_refresh_token', '');
        $access = (string) get_option('yatra_google_calendar_access_token', '');
        $expiresIn = get_option('yatra_google_calendar_expires_in', '');
        $legacyEnable = get_option('yatra_enable_google_calendar', null);

        if ($refresh === '' && $access === '' && ($expiresIn === '' || $expiresIn === null) && $legacyEnable === null) {
            return;
        }

        $pro = ProMigrationReadiness::getState();
        if (!$pro['ready']) {
            Logger::warning('Skipping legacy Google Calendar token migration: Yatra Pro 3.0+ not ready', [
                'source' => 'migration',
                'pro_migration' => $pro,
            ]);

            return;
        }

        $tokenExpiresAt = get_option('yatra_google_calendar_token_expires_at', null);
        if (($tokenExpiresAt === null || $tokenExpiresAt === '' || $this->isForceMigration()) && $expiresIn !== '' && $expiresIn !== null) {
            $n = (int) $expiresIn;
            if ($n > 0) {
                update_option('yatra_google_calendar_token_expires_at', time() + $n);
            }
        }

        if ($legacyEnable !== null) {
            $enabled = ((string) $legacyEnable === '1' || $legacyEnable === 1 || $legacyEnable === true) ? 'yes' : 'no';
            $existing = get_option('yatra_google_calendar_enabled', null);
            if ($existing === null || $existing === '' || $this->isForceMigration()) {
                update_option('yatra_google_calendar_enabled', $enabled);
            }
        }

        Logger::info('Migrated legacy Google Calendar options for Yatra Pro 3.x.', ['source' => 'migration']);
    }
    
    /**
     * Migrate payment gateway configurations from old Yatra 2.x.
     *
     * Old Yatra stored each gateway's credentials as individual flat wp_options:
     *
     *   PayPal (core plugin):
     *     yatra_payment_gateway_paypal_email
     *     yatra_payment_gateway_paypal_label_on_checkout
     *
     *   Stripe (yatra-stripe add-on):
     *     yatra_payment_gateway_stripe_live_publishable_key
     *     yatra_payment_gateway_stripe_live_secret_key
     *     yatra_payment_gateway_stripe_test_publishable_key
     *     yatra_payment_gateway_stripe_test_secret_key
     *     yatra_payment_gateway_stripe_webhook_endpoint_secret
     *     yatra_payment_gateway_stripe_label_on_checkout
     *
     *   Razorpay (yatra-razorpay add-on):
     *     yatra_payment_gateway_razorpay_key_id
     *     yatra_payment_gateway_razorpay_key_secret
     *     yatra_payment_gateway_razorpay_payment_action
     *     yatra_payment_gateway_razorpay_enable_webhook
     *     yatra_payment_gateway_razorpay_webhook_secret
     *     yatra_payment_gateway_razorpay_label_on_checkout
     *
     *   2Checkout (yatra-2checkout add-on):
     *     yatra_payment_gateway_2checkout_live_publishable_key
     *     yatra_payment_gateway_2checkout_live_private_key
     *     yatra_payment_gateway_2checkout_merchant_code
     *     yatra_payment_gateway_2checkout_ins_secret_word
     *     yatra_payment_gateway_2checkout_webhook_endpoint_secret
     *     yatra_payment_gateway_2checkout_label_on_checkout
     *
     *   Booking Only (core plugin):
     *     yatra_payment_gateway_booking_only_label_on_checkout
     *
     * New Yatra 3.0 stores all configs in a single serialised option:
     *   yatra_gateway_configs = [
     *     'paypal'  => ['email' => '...', ...],
     *     'stripe'  => ['api_key' => '...', 'api_secret' => '...', ...],
     *     'razorpay'=> ['key_id' => '...', 'key_secret' => '...', ...],
     *     ...
     *   ]
     *
     * Active gateway slugs in old system use 'booking_only'; new system uses 'pay_later'.
     *
     * @return array ['migrated' => int, 'skipped' => int]
     */
    private function migratePaymentGatewayConfigs(): array
    {
        $gatewayConfigs = [];
        $migrated       = 0;
        $skipped        = 0;

        // Global test mode flag from old plugin (applies to all gateways).
        $globalTestMode = get_option('yatra_payment_gateway_test_mode', 'no') === 'yes';

        // ── PayPal ────────────────────────────────────────────────────────────
        $paypalEmail = get_option('yatra_payment_gateway_paypal_email', '');
        if (!empty($paypalEmail)) {
            $gatewayConfigs['paypal'] = [
                'email'      => sanitize_email($paypalEmail),
                'test_mode'  => $globalTestMode,
                'title'      => get_option('yatra_payment_gateway_paypal_label_on_checkout', 'PayPal Standard'),
            ];
            $migrated++;
            Logger::info('Migrated PayPal gateway config.', [
                'source'      => 'migration',
                'has_email'   => !empty($paypalEmail),
            ]);
        } else {
            $skipped++;
            Logger::debug('Skipped PayPal gateway config — yatra_payment_gateway_paypal_email not found.', [
                'source' => 'migration',
            ]);
        }

        // ── Stripe ────────────────────────────────────────────────────────────
        // Keys differ between live and test mode; pick the appropriate set.
        $stripePubKey    = $globalTestMode
            ? get_option('yatra_payment_gateway_stripe_test_publishable_key', '')
            : get_option('yatra_payment_gateway_stripe_live_publishable_key', '');
        $stripeSecretKey = $globalTestMode
            ? get_option('yatra_payment_gateway_stripe_test_secret_key', '')
            : get_option('yatra_payment_gateway_stripe_live_secret_key', '');
        $stripeWebhook   = get_option('yatra_payment_gateway_stripe_webhook_endpoint_secret', '');

        // Also store the opposite-mode keys so the admin can switch without re-entering them.
        $stripeLivePub    = get_option('yatra_payment_gateway_stripe_live_publishable_key', '');
        $stripeLiveSecret = get_option('yatra_payment_gateway_stripe_live_secret_key', '');
        $stripeTestPub    = get_option('yatra_payment_gateway_stripe_test_publishable_key', '');
        $stripeTestSecret = get_option('yatra_payment_gateway_stripe_test_secret_key', '');

        if (!empty($stripePubKey) || !empty($stripeSecretKey)) {
            $gatewayConfigs['stripe'] = array_filter([
                // New Pro gateway uses 'api_key' (publishable) and 'api_secret' (secret).
                'api_key'              => $stripePubKey,
                'api_secret'           => $stripeSecretKey,
                'webhook_secret'       => $stripeWebhook,
                'test_mode'            => $globalTestMode,
                'title'                => get_option('yatra_payment_gateway_stripe_label_on_checkout', 'Pay with Credit / Debit Card'),
                // Preserve all four keys so switching modes works without re-entry.
                'live_publishable_key' => $stripeLivePub,
                'live_secret_key'      => $stripeLiveSecret,
                'test_publishable_key' => $stripeTestPub,
                'test_secret_key'      => $stripeTestSecret,
            ], fn($v) => $v !== '' && $v !== null);
            $migrated++;
            Logger::info('Migrated Stripe gateway config.', [
                'source'         => 'migration',
                'has_pub_key'    => !empty($stripePubKey),
                'has_secret_key' => !empty($stripeSecretKey),
            ]);
        } else {
            $skipped++;
            Logger::debug('Skipped Stripe gateway config — no keys found.', ['source' => 'migration']);
        }

        // ── Razorpay ──────────────────────────────────────────────────────────
        // Old sites used either generic keys or separate live/test option names (Pro add-ons).
        $razorKeyId     = (string) get_option('yatra_payment_gateway_razorpay_key_id', '');
        $razorKeySecret = (string) get_option('yatra_payment_gateway_razorpay_key_secret', '');
        if ($razorKeyId === '' && $razorKeySecret === '') {
            $razorKeyId = $globalTestMode
                ? (string) get_option('yatra_payment_gateway_razorpay_test_key_id', '')
                : (string) get_option('yatra_payment_gateway_razorpay_live_key_id', '');
            $razorKeySecret = $globalTestMode
                ? (string) get_option('yatra_payment_gateway_razorpay_test_key_secret', '')
                : (string) get_option('yatra_payment_gateway_razorpay_live_key_secret', '');
        }

        if (!empty($razorKeyId) || !empty($razorKeySecret)) {
            $gatewayConfigs['razorpay'] = array_filter([
                'key_id'         => $razorKeyId,
                'key_secret'     => $razorKeySecret,
                'payment_action' => get_option('yatra_payment_gateway_razorpay_payment_action', 'capture'),
                'webhook_secret' => get_option('yatra_payment_gateway_razorpay_webhook_secret', ''),
                'test_mode'      => $globalTestMode,
                'title'          => get_option('yatra_payment_gateway_razorpay_label_on_checkout', 'Pay with Cards'),
            ], fn($v) => $v !== '' && $v !== null);
            $migrated++;
            Logger::info('Migrated Razorpay gateway config.', [
                'source'        => 'migration',
                'has_key_id'    => !empty($razorKeyId),
                'has_key_secret'=> !empty($razorKeySecret),
            ]);
        } else {
            $skipped++;
            Logger::debug('Skipped Razorpay gateway config — no keys found.', ['source' => 'migration']);
        }

        // ── 2Checkout ─────────────────────────────────────────────────────────
        $twoCheckoutPubKey     = get_option('yatra_payment_gateway_2checkout_live_publishable_key', '');
        $twoCheckoutPrivateKey = get_option('yatra_payment_gateway_2checkout_live_private_key', '');
        $twoCheckoutMerchant   = get_option('yatra_payment_gateway_2checkout_merchant_code', '');

        if (!empty($twoCheckoutPubKey) || !empty($twoCheckoutPrivateKey) || !empty($twoCheckoutMerchant)) {
            $gatewayConfigs['2checkout'] = array_filter([
                'publishable_key' => $twoCheckoutPubKey,
                'private_key'     => $twoCheckoutPrivateKey,
                'merchant_code'   => $twoCheckoutMerchant,
                'ins_secret_word' => get_option('yatra_payment_gateway_2checkout_ins_secret_word', ''),
                'webhook_secret'  => get_option('yatra_payment_gateway_2checkout_webhook_endpoint_secret', ''),
                'test_mode'       => $globalTestMode,
                'title'           => get_option('yatra_payment_gateway_2checkout_label_on_checkout', 'Pay with Cards'),
            ], fn($v) => $v !== '' && $v !== null);
            $migrated++;
            Logger::info('Migrated 2Checkout gateway config.', ['source' => 'migration']);
        } else {
            $skipped++;
            Logger::debug('Skipped 2Checkout gateway config — no keys found.', ['source' => 'migration']);
        }

        // ── Mollie (legacy flat wp_options from Yatra 2.x / Pro gateway pack) ──
        $mollieKey = $globalTestMode
            ? (string) get_option('yatra_payment_gateway_mollie_test_api_key', '')
            : (string) get_option('yatra_payment_gateway_mollie_live_api_key', '');
        if ($mollieKey === '') {
            $mollieKey = (string) get_option('yatra_payment_gateway_mollie_live_api_key', '');
            if ($mollieKey === '') {
                $mollieKey = (string) get_option('yatra_payment_gateway_mollie_test_api_key', '');
            }
        }
        if ($mollieKey !== '') {
            $gatewayConfigs['mollie'] = array_filter([
                'api_key'        => $mollieKey,
                'webhook_secret' => (string) get_option('yatra_payment_gateway_mollie_webhook_secret', ''),
                'test_mode'      => $globalTestMode,
                'title'          => get_option('yatra_payment_gateway_mollie_label_on_checkout', 'Pay with Mollie'),
            ], fn($v) => $v !== '' && $v !== null);
            $migrated++;
            Logger::info('Migrated Mollie gateway config.', ['source' => 'migration']);
        } else {
            $skipped++;
            Logger::debug('Skipped Mollie gateway config — no API key found.', ['source' => 'migration']);
        }

        // ── Square (flat keys; yatra_pro_square_settings merged later in mergeLegacyProBundledGatewayOptions)
        $squareAppId = $globalTestMode
            ? (string) get_option('yatra_payment_gateway_square_test_application_id', '')
            : (string) get_option('yatra_payment_gateway_square_live_application_id', '');
        $squareToken = $globalTestMode
            ? (string) get_option('yatra_payment_gateway_square_test_access_token', '')
            : (string) get_option('yatra_payment_gateway_square_live_access_token', '');
        $squareLoc = $globalTestMode
            ? (string) get_option('yatra_payment_gateway_square_test_location_id', '')
            : (string) get_option('yatra_payment_gateway_square_live_location_id', '');
        if ($squareAppId === '' && $squareToken === '') {
            $squareAppId = (string) get_option('yatra_payment_gateway_square_live_application_id', '');
            $squareToken = (string) get_option('yatra_payment_gateway_square_live_access_token', '');
            $squareLoc = (string) get_option('yatra_payment_gateway_square_live_location_id', '');
        }
        if ($squareAppId !== '' || $squareToken !== '' || $squareLoc !== '') {
            $gatewayConfigs['square'] = array_filter([
                'application_id' => $squareAppId,
                'access_token'   => $squareToken,
                'location_id'    => $squareLoc,
                'test_mode'      => $globalTestMode,
                'title'          => get_option('yatra_payment_gateway_square_label_on_checkout', 'Pay With Card'),
            ], fn($v) => $v !== '' && $v !== null && $v !== false);
            $migrated++;
            Logger::info('Migrated Square gateway config (flat legacy options).', ['source' => 'migration']);
        } else {
            $skipped++;
            Logger::debug('Skipped Square flat gateway config — no keys found.', ['source' => 'migration']);
        }

        // ── Authorize.Net (flat keys + optional yatra_pro_authorizenet_settings later)
        $authLogin = $globalTestMode
            ? (string) get_option('yatra_payment_gateway_authorizenet_test_login_id', '')
            : (string) get_option('yatra_payment_gateway_authorizenet_live_login_id', '');
        $authTxn = $globalTestMode
            ? (string) get_option('yatra_payment_gateway_authorizenet_test_transaction_key', '')
            : (string) get_option('yatra_payment_gateway_authorizenet_live_transaction_key', '');
        $authPub = (string) get_option('yatra_payment_gateway_authorizenet_public_client_key', '');
        if ($authPub === '') {
            $authPub = (string) get_option('yatra_payment_gateway_authorizenet_client_key', '');
        }
        if ($authLogin === '' && $authTxn === '') {
            $authLogin = (string) get_option('yatra_payment_gateway_authorizenet_live_login_id', '');
            $authTxn = (string) get_option('yatra_payment_gateway_authorizenet_live_transaction_key', '');
        }
        if ($authLogin !== '' || $authTxn !== '' || $authPub !== '') {
            $gatewayConfigs['authorize_net'] = array_filter([
                'api_login_id'       => $authLogin,
                'transaction_key'    => $authTxn,
                'public_client_key'  => $authPub,
                'test_mode'          => $globalTestMode,
                'title'              => get_option('yatra_payment_gateway_authorizenet_label_on_checkout', 'Pay with Cards'),
            ], fn($v) => $v !== '' && $v !== null);
            $migrated++;
            Logger::info('Migrated Authorize.Net gateway config (flat legacy options).', ['source' => 'migration']);
        } else {
            $skipped++;
            Logger::debug('Skipped Authorize.Net flat gateway config — no keys found.', ['source' => 'migration']);
        }

        // ── Booking-Only / Pay-Later ──────────────────────────────────────────
        // Old slug was 'booking_only'; new system calls it 'pay_later'.
        $bookingOnlyLabel = get_option('yatra_payment_gateway_booking_only_label_on_checkout', 'Book Now Pay Later');
        $gatewayConfigs['pay_later'] = [
            'title' => $bookingOnlyLabel,
        ];
        $migrated++;
        Logger::info('Migrated Pay Later (booking_only) gateway config.', ['source' => 'migration']);

        // ── Persist all configs ───────────────────────────────────────────────
        if (!empty($gatewayConfigs)) {
            // Merge with any existing pro-gateway configs already saved so we do
            // not clobber configs written by Pro module registration.
            $existing = get_option('yatra_gateway_configs', []);
            if (!is_array($existing)) {
                $existing = [];
            }
            if ($this->isForceMigration()) {
                $merged = array_merge($existing, $gatewayConfigs);
            } else {
                // Non-force: only fill in gateways not already configured.
                $merged = array_merge($gatewayConfigs, $existing);
            }
            update_option('yatra_gateway_configs', $merged);
            Logger::info('Saved yatra_gateway_configs.', [
                'source'   => 'migration',
                'count'    => count($merged),
                'gateways' => array_keys($merged),
            ]);
            $this->ensureActivePaymentGatewaySlugsForConfigs($merged);
        }

        // ── Fix active-gateway slug: booking_only → pay_later ─────────────────
        $activeGateways = get_option('yatra_active_payment_gateways', []);
        if (is_array($activeGateways) && in_array('booking_only', $activeGateways, true)) {
            $activeGateways = array_map(
                fn($slug) => $slug === 'booking_only' ? 'pay_later' : $slug,
                $activeGateways
            );
            update_option('yatra_active_payment_gateways', array_values(array_unique($activeGateways)));
            Logger::info('Renamed booking_only → pay_later in active gateways list.', ['source' => 'migration']);
        }

        // Legacy Yatra Pro 2.x bundled gateway settings (yatra_pro_* options). Runs after free flat-key
        // migration so yatra_gateway_configs from core/free wins on duplicate keys; Pro only fills gaps.
        $this->mergeLegacyProBundledGatewayOptions();

        return [
            'migrated' => $migrated,
            'skipped'  => $skipped,
        ];
    }

    /**
     * Merge legacy Pro payment gateway options into yatra_active_payment_gateways and yatra_gateway_configs.
     *
     * Free/core migration above already maps yatra_payment_gateways + yatra_payment_gateway_* flat keys.
     * This handles Pro-only bundles (yatra_pro_*_settings) without a second migration step.
     */
    private function mergeLegacyProBundledGatewayOptions(): void
    {
        $legacyEnabled = get_option('yatra_pro_enabled_payment_gateways', []);
        $legacyEnabled = is_array($legacyEnabled) ? $legacyEnabled : [];

        $legacySettings = [
            '2checkout' => get_option('yatra_pro_twocheckout_settings', null),
            'square' => get_option('yatra_pro_square_settings', null),
            'razorpay' => get_option('yatra_pro_razorpay_settings', null),
            'authorize_net' => get_option('yatra_pro_authorizenet_settings', null),
        ];

        $hasAny = $legacyEnabled !== [];
        foreach ($legacySettings as $v) {
            if ($v !== null && $v !== '' && $v !== []) {
                $hasAny = true;
            }
        }
        if (!$hasAny) {
            return;
        }

        $active = get_option('yatra_active_payment_gateways', []);
        if (!is_array($active)) {
            $active = [];
        }

        $enabledMapped = [];
        foreach ($legacyEnabled as $g) {
            $g = strtolower(trim((string) $g));
            if ($g === '') {
                continue;
            }
            $map = [
                'booking_only' => 'pay_later',
                'authorizenet' => 'authorize_net',
                'authorize' => 'authorize_net',
                'two_checkout' => '2checkout',
                'twocheckout' => '2checkout',
            ];
            $enabledMapped[] = $map[$g] ?? $g;
        }
        $enabledMapped = array_values(array_filter($enabledMapped, static fn ($v) => $v !== ''));

        // Free/core list first so ordering matches the main migration; Pro appends any missing slugs.
        $finalActive = array_values(array_unique(array_merge($active, $enabledMapped)));
        update_option('yatra_active_payment_gateways', $finalActive);

        $configs = get_option('yatra_gateway_configs', []);
        if (!is_array($configs)) {
            $configs = [];
        }

        foreach ($legacySettings as $gatewayId => $settings) {
            if (!is_array($settings) || $settings === []) {
                continue;
            }

            if ($gatewayId === 'authorize_net' && isset($settings['client_key']) && !isset($settings['public_client_key'])) {
                $settings['public_client_key'] = $settings['client_key'];
            }

            if (!isset($configs[$gatewayId]) || $this->isForceMigration()) {
                $configs[$gatewayId] = array_merge($configs[$gatewayId] ?? [], $settings);
            } else {
                $configs[$gatewayId] = array_merge($settings, $configs[$gatewayId]);
            }
        }

        update_option('yatra_gateway_configs', $configs);

        $this->ensureActivePaymentGatewaySlugsForConfigs($configs);

        Logger::info('Merged legacy Pro bundled gateway options into unified gateway settings.', [
            'source' => 'migration',
            'active_gateways' => $finalActive,
            'config_keys' => array_keys($configs),
        ]);
    }

    /**
     * If unified configs contain real credentials but the gateway slug is missing from the active list
     * (common when legacy sites only stored flat keys, not yatra_payment_gateways), append the slug.
     *
     * @param array<string, array<string, mixed>> $merged
     */
    private function ensureActivePaymentGatewaySlugsForConfigs(array $merged): void
    {
        $active = get_option('yatra_active_payment_gateways', []);
        if (!is_array($active)) {
            $active = [];
        }

        $rules = [
            'paypal' => static fn (array $c): bool => !empty($c['email']),
            'stripe' => static fn (array $c): bool => !empty($c['api_key']) || !empty($c['api_secret']),
            'razorpay' => static fn (array $c): bool => !empty($c['key_id']) || !empty($c['key_secret']),
            '2checkout' => static fn (array $c): bool => !empty($c['publishable_key']) || !empty($c['merchant_code']) || !empty($c['private_key']),
            'mollie' => static fn (array $c): bool => !empty($c['api_key']),
            'square' => static fn (array $c): bool => !empty($c['application_id']) || !empty($c['access_token']),
            'authorize_net' => static fn (array $c): bool => !empty($c['api_login_id']) || !empty($c['transaction_key']),
        ];

        foreach ($rules as $slug => $hasCreds) {
            if (empty($merged[$slug]) || !is_array($merged[$slug])) {
                continue;
            }
            if (!$hasCreds($merged[$slug])) {
                continue;
            }
            if (!in_array($slug, $active, true)) {
                $active[] = $slug;
            }
        }

        update_option('yatra_active_payment_gateways', array_values(array_unique($active)));
    }

    /**
     * Map legacy Pro review + partial-payment options into Yatra 3.x SettingsService option keys.
     * Only writes when the legacy option exists so fresh 3.x installs are untouched.
     */
    private function migrateLegacyReviewAndPartialPaymentOptions(): void
    {
        $revEnable = get_option('yatra_review_enable', null);
        if ($revEnable !== null && $revEnable !== '') {
            $on = $revEnable === 'yes' || $revEnable === true || $revEnable === 1 || $revEnable === '1';
            update_option('yatra_enable_reviews', $on);
            Logger::info('Migrated legacy yatra_review_enable → yatra_enable_reviews', ['source' => 'migration']);
        }

        $who = get_option('yatra_review_who_can', null);
        if (is_string($who) && $who !== '') {
            $w = strtolower($who);
            if (str_contains($w, 'book')) {
                update_option('yatra_require_booking_to_review', true);
            } elseif ($w === 'logged_in' || str_contains($w, 'login')) {
                update_option('yatra_require_booking_to_review', false);
            }
            Logger::info('Migrated legacy yatra_review_who_can', ['source' => 'migration', 'value' => $who]);
        }

        $auto = get_option('yatra_review_autopublish', null);
        if ($auto !== null && $auto !== '') {
            $publish = strtolower((string) $auto) === 'publish';
            update_option('yatra_auto_approve_reviews', $publish);
            update_option('yatra_enable_review_moderation', !$publish);
            Logger::info('Migrated legacy yatra_review_autopublish', ['source' => 'migration', 'value' => $auto]);
        }

        $partial = get_option('yatra_enable_partial_payment', null);
        if ($partial === 'yes' || $partial === true || $partial === 1 || $partial === '1') {
            update_option('yatra_partial_payment', true);
            $pct = (float) get_option('yatra_first_installment_payment', 0);
            $type = (string) get_option('yatra_first_installment_payment_type', 'percentage');
            if ($type === 'percentage' && $pct > 0 && $pct < 100) {
                update_option('yatra_partial_payment_percentage', max(1, min(99, (int) round($pct))));
            }
            Logger::info('Migrated legacy partial payment options → yatra_partial_payment*', ['source' => 'migration']);
        }
    }
    
    /**
     * Migrate enquiry and booking form settings
     * 
     * @return array ['migrated' => int, 'skipped' => int]
     */
    private function migrateEnquirySettings(): array
    {
        $migrated = 0;
        $skipped = 0;
        
        // Check if enquiry forms were enabled in old version
        $enquiryEnabled = get_option('yatra_enquiry_form_show', 'no');
        if ($enquiryEnabled === 'yes' || $enquiryEnabled === true) {
            update_option('yatra_enable_enquiry', true);
            $migrated++;
            Logger::info("Migrated enquiry form setting", ['source' => 'migration']);
        } else {
            $skipped++;
            Logger::debug("Skipped enquiry form setting (disabled or not found)", ['source' => 'migration']);
        }
        
        // Migrate booking form field settings if they exist
        $oldBookingFields = get_option('yatra_booking_form_fields', []);
        if (!empty($oldBookingFields) && is_array($oldBookingFields)) {
            // Transform old booking form fields to new format
            update_option('yatra_legacy_booking_fields', $oldBookingFields);
            $migrated++;
            Logger::info("Migrated booking form fields", ['source' => 'migration', 'count' => count($oldBookingFields)]);
        } else {
            $skipped++;
            Logger::debug("Skipped booking form fields (not found or empty)", ['source' => 'migration']);
        }
        
        return [
            'migrated' => $migrated,
            'skipped' => $skipped,
        ];
    }
}
