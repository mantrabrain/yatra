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
     * 
     * @return void
     */
    private static function setDefaultOptions(): void
    {
        // Payment Gateway Settings - Only enable Pay Later by default
        update_option('yatra_payment_gateways', ['pay_later']);
        update_option('yatra_payment_methods', []);
        update_option('yatra_payment_test_mode', true);
        update_option('yatra_auto_confirm_pay_later', true);
        update_option('yatra_partial_payment', false);
        update_option('yatra_gateway_configs', []);
        
        // Clear any existing Stripe/PayPal settings that might exist
        delete_option('yatra_stripe_settings');
        delete_option('yatra_paypal_settings');
        
        // Basic Settings
        update_option('yatra_currency', 'USD');
        update_option('yatra_currency_position', 'before');
        update_option('yatra_decimal_places', 2);
        update_option('yatra_thousand_separator', ',');
        update_option('yatra_decimal_separator', '.');
        
        // Set installation tracking
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
}
