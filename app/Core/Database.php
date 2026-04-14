<?php

declare(strict_types=1);

namespace Yatra\Core;

use Yatra\Database\Tables\TripsTable;
use Yatra\Database\Tables\BookingsTable;
use Yatra\Database\Tables\CustomersTable;
use Yatra\Database\Tables\ReviewsTable;
use Yatra\Database\Tables\DiscountsTable;
use Yatra\Database\Tables\EnquiriesTable;
use Yatra\Database\Tables\BookingPaymentsTable;
use Yatra\Database\Tables\ScheduledPaymentsTable;
use Yatra\Database\Tables\PaymentTokensTable;
use Yatra\Database\Tables\BookingTravellersTable;
use Yatra\Database\Tables\BookingTravellerMetaTable;
use Yatra\Database\Tables\BookingDeparturesTable;
use Yatra\Database\Tables\DeparturesTable;
use Yatra\Database\Tables\TripRevisionsTable;

// Optimized Tables
use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Database\Tables\TripClassificationsTable;
use Yatra\Database\Tables\TripContentTable;
use Yatra\Database\Tables\TripItineraryDaysTable;
use Yatra\Database\Tables\TripItineraryDayEntryTable;

// Traditional Availability Tables
use Yatra\Database\Tables\TripAvailabilityDatesTable;
use Yatra\Database\Tables\TripAvailabilityRulesTable;

class Database
{
    /**
     * Create optimized database tables
     */
    public static function createTables(): void
    {
        global $wpdb;

        // Ensure dbDelta function is available
        if (!function_exists('\dbDelta')) {
            if (defined('ABSPATH') && file_exists(ABSPATH . 'wp-admin/includes/upgrade.php')) {
                require_once ABSPATH . 'wp-admin/includes/upgrade.php';
            } else {
                throw new \Exception('WordPress upgrade.php file not found. Cannot create database tables.');
            }
        }

        // ============================================
        // CORE BUSINESS TABLES (Essential - Keep as-is)
        // ============================================
        
        // Main trips table
        dbDelta(TripsTable::getSchema());
        
        // Bookings and payment tables
        dbDelta(BookingsTable::getSchema());
        dbDelta(BookingPaymentsTable::getSchema());
        dbDelta(ScheduledPaymentsTable::getSchema());
        dbDelta(PaymentTokensTable::getSchema());
        
        // Customer and traveller management
        dbDelta(CustomersTable::getSchema());
        dbDelta(BookingTravellersTable::getSchema());
        dbDelta(BookingTravellerMetaTable::getSchema());
        dbDelta(BookingDeparturesTable::getSchema());
        
        // Reviews and ratings
        dbDelta(ReviewsTable::getSchema());
        
        // Discounts and promotions
        dbDelta(DiscountsTable::getSchema());
        
        // Enquiries and contact
        dbDelta(EnquiriesTable::getSchema());
        
        // Traditional availability tables (2-table system)
        dbDelta(TripAvailabilityDatesTable::getSchema());
        dbDelta(TripAvailabilityRulesTable::getSchema());
        
        // Trip revisions
        dbDelta(TripRevisionsTable::getSchema());

        // ============================================
        // DEPARTURES SYSTEM
        // ============================================
        
        // Trip departures table - stores scheduled departure instances
        dbDelta(DeparturesTable::getSchema());

        // ============================================
        // OPTIMIZED CONSOLIDATED TABLES (v2.0.0)
        // ============================================
        
        // New itinerary system (2-table structure)
        dbDelta(TripItineraryDaysTable::getSchema());
        dbDelta(TripItineraryDayEntryTable::getSchema());
        
        // Unified classification system (consolidates 5 old tables)
        dbDelta(ClassificationsTable::getSchema());
        
        // Polymorphic trip relationships (consolidates 4 old tables)
        dbDelta(TripClassificationsTable::getSchema());
        
        // Unified content management (consolidates 4 old tables)
        dbDelta(TripContentTable::getSchema());

        // ============================================
        // DATABASE VERSION TRACKING
        // ============================================
        
        update_option('yatra_db_version', YATRA_VERSION);
    }

    /**
     * Update database tables (alias for createTables for backward compatibility)
     */
    public static function updateTables(): void
    {
        self::createTables();
    }

    /**
     * Drop all Yatra database tables
     */
    public static function dropTables(): void
    {
        global $wpdb;
        
        // Drop children before parents (FK-safe). Trips last.
        $tables = [
            TripAvailabilityDatesTable::getTableName(),
            TripAvailabilityRulesTable::getTableName(),
            BookingTravellerMetaTable::getTableName(),
            BookingTravellersTable::getTableName(),
            BookingDeparturesTable::getTableName(),
            DeparturesTable::getTableName(),
            BookingPaymentsTable::getTableName(),
            ScheduledPaymentsTable::getTableName(),
            PaymentTokensTable::getTableName(),
            BookingsTable::getTableName(),
            CustomersTable::getTableName(),
            ReviewsTable::getTableName(),
            DiscountsTable::getTableName(),
            EnquiriesTable::getTableName(),
            TripRevisionsTable::getTableName(),
            TripItineraryDayEntryTable::getTableName(),
            TripItineraryDaysTable::getTableName(),
            TripClassificationsTable::getTableName(),
            TripContentTable::getTableName(),
            ClassificationsTable::getTableName(),
            TripsTable::getTableName(),
        ];

        foreach ($tables as $table) {
            $wpdb->query("DROP TABLE IF EXISTS `{$table}`");
        }
        
        // Remove database version
        delete_option('yatra_db_version');
    }
}
