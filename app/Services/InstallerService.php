<?php

declare(strict_types=1);

namespace Yatra\Services;

/**
 * Installer Service
 * 
 * Handles plugin installation and default settings setup
 * Ensures proper default configuration on fresh installation
 */
class InstallerService
{
    /**
     * Run installation tasks
     * 
     * @return void
     */
    public static function install(): void
    {
        // Create all database tables (one-time action)
        self::createDatabaseTables();
        
        // Set all default options for fresh installation
        self::setDefaultOptions();
    }
    
    /**
     * Create all database tables (centralized table creation)
     * 
     * @return void
     */
    public static function createDatabaseTables(): void
    {
        if (class_exists('\Yatra\Core\Database')) {
            \Yatra\Core\Database::createTables();
        }
        
        // Log table creation (for debugging)
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra Installer: Created all database tables');
        }
    }
    
    /**
     * Set all default options for fresh installation
     * Only Book Now Pay Later should be enabled by default
     * Uses SettingsService keys to ensure consistency
     * 
     * @return void
     */
    private static function setDefaultOptions(): void
    {
        // Payment Gateway Settings - Only enable Pay Later by default
        // These match SettingsService defaults exactly
        update_option('yatra_payment_gateways', ['pay_later']);
        update_option('yatra_payment_methods', []);
        update_option('yatra_payment_test_mode', true);
        update_option('yatra_auto_confirm_pay_later', true);
        update_option('yatra_partial_payment', false);
        // Set gateway configs with proper structure - only enable pay_later by default
        $gateway_configs = [
            'pay_later' => [
                'enabled' => true,
                'title' => 'Book Now, Pay Later',
                'description' => 'Allow customers to reserve now and pay before the trip',
            ],
            // Explicitly disable all other gateways
            'stripe' => [
                'enabled' => false,
                'title' => 'Stripe',
                'description' => 'Accept credit and debit cards',
                'api_key' => '',
                'api_secret' => '',
                'webhook_secret' => '',
            ],
            'paypal' => [
                'enabled' => false,
                'title' => 'PayPal',
                'description' => 'Accept PayPal payments',
                'api_key' => '',
                'api_secret' => '',
            ],
            'razorpay' => [
                'enabled' => false,
                'title' => 'Razorpay',
                'description' => 'Accept payments via Razorpay',
                'api_key' => '',
                'api_secret' => '',
            ],
            'square' => [
                'enabled' => false,
                'title' => 'Square',
                'description' => 'Accept payments via Square',
                'api_key' => '',
                'api_secret' => '',
            ],
            'authorize_net' => [
                'enabled' => false,
                'title' => 'Authorize.net',
                'description' => 'Accept payments via Authorize.net',
                'api_key' => '',
                'api_secret' => '',
            ],
            'bank_transfer' => [
                'enabled' => false,
                'title' => 'Bank Transfer',
                'description' => 'Accept manual bank transfer payments',
                'api_key' => '',
                'api_secret' => '',
            ]
        ];
        update_option('yatra_gateway_configs', $gateway_configs);
        update_option('yatra_gateway_order', []);
        
        // Currency Settings - Match SettingsService defaults
        update_option('yatra_currency', 'USD');
        update_option('yatra_currency_position', 'before');
        update_option('yatra_thousand_separator', ',');
        update_option('yatra_decimal_separator', '.');
        update_option('yatra_decimal_places', 2);
        
        // Flexible Payment Settings - Match SettingsService defaults
        update_option('yatra_enable_deposit', false);
        update_option('yatra_deposit_type', 'percentage');
        update_option('yatra_deposit_amount', 20);
        update_option('yatra_deposit_required', false);
        update_option('yatra_deposit_percentage', 20);
        update_option('yatra_partial_payment_percentage', 30);
        
        // Scheduled Payment Settings - Match SettingsService defaults
        update_option('yatra_enable_scheduled_payments', false);
        update_option('yatra_scheduled_payment_type', 'single');
        update_option('yatra_scheduled_payment_days', 15);
        update_option('yatra_scheduled_payment_installments', 1);
        update_option('yatra_scheduled_payment_interval', 30);
        update_option('yatra_scheduled_payment_reminder_days', 3);
        update_option('yatra_allow_save_payment_methods', false);
        
        // Trip Settings - Match SettingsService defaults
        update_option('yatra_trip_base', 'trip');
        update_option('yatra_trips_per_page', 12);
        update_option('yatra_enable_wishlist', true);
        update_option('yatra_enable_comparison', false);
        update_option('yatra_show_sold_out', true);
        
        // Customer Settings - Match SettingsService defaults
        update_option('yatra_enable_customer_accounts', true);
        update_option('yatra_enable_customer_registration', true);
        
        // Booking Settings - Match SettingsService defaults
        update_option('yatra_booking_base', 'book');
        update_option('yatra_use_booking_page', false);
        update_option('yatra_booking_page_id', 0);
        update_option('yatra_enable_guest_booking', true);
        update_option('yatra_booking_confirmation', true);
        update_option('yatra_auto_confirm_bookings', false);
        update_option('yatra_require_login', false);
        update_option('yatra_allow_guest_checkout', true);
        update_option('yatra_cancellation_policy', 'full_refund');
        update_option('yatra_cancellation_days', 7);
        update_option('yatra_refund_policy', '');
        update_option('yatra_booking_expiry_hours', 24);
        update_option('yatra_booking_reminder_days', 3);
        update_option('yatra_allow_waitlist', true);
        
        // Email identity: canonical keys (REST / EmailService) + legacy keys for older code paths
        $wpAdminEmail = (string) get_option('admin_email', '');
        $blogName = (string) get_bloginfo('name');
        update_option('yatra_from_email', $wpAdminEmail);
        update_option('yatra_from_name', $blogName);
        update_option('yatra_admin_email', $wpAdminEmail);
        update_option('yatra_email_from_name', $blogName);
        update_option('yatra_email_from_address', $wpAdminEmail);
        update_option('yatra_enable_admin_notifications', true);
        update_option('yatra_enable_customer_notifications', true);

        // Default transactional template HTML + subjects (Email → Templates / settings API)
        foreach (EmailTemplateDefaults::settingsOptionDefaults() as $optionKey => $value) {
            update_option('yatra_' . $optionKey, $value);
        }
        update_option('yatra_email_template_booking', true);
        update_option('yatra_email_template_confirmation', true);
        update_option('yatra_email_template_cancellation', true);
        update_option('yatra_email_template_reminder', true);
        update_option('yatra_email_template_admin_new_booking', true);
        
        // Clear any existing Stripe/PayPal settings that might exist
        delete_option('yatra_stripe_settings');
        delete_option('yatra_paypal_settings');
        
        // Set installation tracking (not in SettingsService but needed for tracking)
        update_option('yatra_installation_date', current_time('mysql'));
        update_option('yatra_version', defined('YATRA_VERSION') ? YATRA_VERSION : '3.0.0');
        
        // Log the installation (for debugging)
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra Installer: Set all default options with pay_later as only gateway');
        }
    }
    
    /**
     * Get all required database tables using Table classes
     * 
     * @return array
     */
    public static function getRequiredTables(): array
    {
        $table_classes = [
            \Yatra\Database\Tables\TripsTable::class,
            \Yatra\Database\Tables\BookingsTable::class,
            \Yatra\Database\Tables\BookingTravellersTable::class,
            \Yatra\Database\Tables\ClassificationsTable::class,
            \Yatra\Database\Tables\TripClassificationsTable::class,
            \Yatra\Database\Tables\ReviewsTable::class,
            \Yatra\Database\Tables\EnquiriesTable::class,
            \Yatra\Database\Tables\PaymentsTable::class,
            \Yatra\Database\Tables\TripAvailabilityDatesTable::class,
            \Yatra\Database\Tables\DeparturesTable::class,
            \Yatra\Database\Tables\DepartureBookingsTable::class,
            \Yatra\Database\Tables\CustomersTable::class,
            \Yatra\Database\Tables\BookingTravellerMetaTable::class,
            \Yatra\Database\Tables\AdditionalServicesTable::class,
            \Yatra\Database\Tables\TripServicesTable::class,
            \Yatra\Database\Tables\BookingServicesTable::class,
            \Yatra\Database\Tables\BookingSessionsTable::class,
            \Yatra\Database\Tables\CouponsTable::class,
            \Yatra\Database\Tables\BookingCouponsTable::class,
        ];

        $table_names = [];
        foreach ($table_classes as $table_class) {
            if (class_exists($table_class)) {
                $table_names[] = $table_class::getTableName();
            }
        }

        return $table_names;
    }
    
    /**
     * Check if this is a fresh installation
     * 
     * @return bool
     */
    public static function isFreshInstallation(): bool
    {
        // Check if Yatra version exists in database
        $installed_version = get_option('yatra_version');
        
        // If no version is set, it's a fresh installation
        if ($installed_version === false) {
            return true;
        }
        
        // Check installation date
        $installation_date = get_option('yatra_installation_date');
        if ($installation_date === false) {
            return true;
        }
        
        // Additional check: if core tables don't exist, it's fresh
        global $wpdb;
        $required_tables = self::getRequiredTables();
        if (!empty($required_tables)) {
            $trips_table = $required_tables[0]; // Use first table (already has prefix)
            if ($wpdb->get_var("SHOW TABLES LIKE '$trips_table'") !== $trips_table) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Fill canonical + legacy email identity options when empty (upgrades, partial installs, or empty strings in DB).
     * Idempotent; safe to run on each admin load via maybeBackfillEmailTemplateDefaults().
     */
    public static function maybeBackfillEmailDeliveryIdentity(): void
    {
        $wpAdmin = trim((string) get_option('admin_email', ''));
        $wpName = trim((string) get_bloginfo('name'));

        $isUnsetOrEmpty = static function ($v): bool {
            return $v === false || $v === null || $v === '' || (is_string($v) && trim($v) === '');
        };

        if ($wpAdmin !== '') {
            foreach (['yatra_admin_email', 'yatra_from_email', 'yatra_email_from_address'] as $opt) {
                if ($isUnsetOrEmpty(get_option($opt, false))) {
                    update_option($opt, $wpAdmin);
                }
            }
        }
        if ($wpName !== '') {
            foreach (['yatra_from_name', 'yatra_email_from_name'] as $opt) {
                if ($isUnsetOrEmpty(get_option($opt, false))) {
                    update_option($opt, $wpName);
                }
            }
        }
    }

    /**
     * One-time: persist default HTML subjects/bodies when options exist but are empty (pre-template-defaults installs).
     */
    public static function maybeBackfillEmailTemplateDefaults(): void
    {
        self::maybeBackfillEmailDeliveryIdentity();

        // Default-on for new option on existing sites (add_option no-ops if already present).
        add_option('yatra_email_template_admin_new_booking', 1);

        if (!get_option('yatra_email_identity_synced_v1')) {
            $from = get_option('yatra_from_email', '');
            if (($from === false || $from === '') && ($legacy = get_option('yatra_email_from_address', '')) && is_string($legacy) && $legacy !== '') {
                update_option('yatra_from_email', $legacy);
            }
            $fname = get_option('yatra_from_name', '');
            if (($fname === false || $fname === '') && ($legacy = get_option('yatra_email_from_name', '')) && is_string($legacy) && $legacy !== '') {
                update_option('yatra_from_name', $legacy);
            }
            update_option('yatra_email_identity_synced_v1', '1');
        }

        if (get_option('yatra_email_tpl_defaults_backfill_1')) {
            return;
        }

        foreach (EmailTemplateDefaults::settingsOptionDefaults() as $key => $defaultValue) {
            $name = 'yatra_' . $key;
            $current = get_option($name, false);
            $isEmpty = $current === false || $current === '' || (is_string($current) && trim($current) === '');
            if ($isEmpty) {
                update_option($name, $defaultValue);
            }
        }

        update_option('yatra_email_tpl_defaults_backfill_1', '1');
    }
}
