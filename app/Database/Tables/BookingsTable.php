<?php

namespace Yatra\Database\Tables;

/**
 * Bookings Table Class
 * 
 * Represents the main bookings table (wp_yatra_bookings) containing comprehensive
 * booking data including customer details, payment information, trip associations,
 * and booking lifecycle management.
 * 
 * This table follows the new simplified pattern with only two static methods:
 * - getTableName(): Returns the prefixed table name
 * - getSchema(): Returns the complete CREATE TABLE SQL statement
 * 
 * Usage:
 * BookingsTable::getTableName()  // Returns 'wp_yatra_bookings'
 * BookingsTable::getSchema()     // Returns complete SQL schema
 * 
 * @package Yatra\Database\Tables
 * @since 1.0.0
 */
class BookingsTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_new_bookings';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * Returns the full SQL schema for the bookings table using heredoc syntax
     * for proper IDE syntax highlighting. Includes all columns, indexes,
     * and constraints from the original Database.php schema.
     * 
     * @return string Complete CREATE TABLE SQL statement
     */
    public static function getSchema(): string
    {
        $tableName = static::getTableName();
        $charsetCollate = static::getCharsetCollate();

        return <<<SQL
CREATE TABLE IF NOT EXISTS `{$tableName}` (
    `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `reference` varchar(50) NOT NULL COMMENT 'Booking reference code',
    `trip_id` bigint(20) UNSIGNED NOT NULL,
    `customer_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Reference to yatra_customers',
    `user_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'WordPress user ID if logged in',
    `contact_first_name` varchar(100) DEFAULT NULL,
    `contact_last_name` varchar(100) DEFAULT NULL,
    `contact_email` varchar(255) NOT NULL,
    `contact_phone` varchar(50) NOT NULL,
    `contact_country` varchar(100) DEFAULT NULL,
    `contact_data` text COMMENT 'JSON with full contact details',
    `emergency_contact` text COMMENT 'JSON with emergency contact details',
    `travel_date` date NOT NULL,
    `start_date` date DEFAULT NULL COMMENT 'Trip start (often same as travel_date)',
    `end_date` date DEFAULT NULL COMMENT 'Trip end for multi-day itineraries',
    `availability_id` bigint(20) UNSIGNED DEFAULT NULL,
    `travelers_count` smallint(5) UNSIGNED NOT NULL DEFAULT 1,
    `total_amount` decimal(12,2) NOT NULL,
    `amount_paid` decimal(12,2) DEFAULT 0,
    `amount_due` decimal(12,2) NOT NULL,
    `currency` char(3) DEFAULT 'USD',
    `discount_amount` decimal(12,2) DEFAULT 0,
    `discount_code` varchar(100) DEFAULT NULL,
    `subtotal` decimal(12,2) DEFAULT NULL COMMENT 'Base amount before tax',
    `tax_amount` decimal(12,2) DEFAULT 0 COMMENT 'Total tax amount',
    `tax_rate` decimal(5,2) DEFAULT 0 COMMENT 'Total tax rate percentage',
    `tax_inclusive` tinyint(1) DEFAULT 0 COMMENT 'Whether tax is included in price',
    `tax_details` text COMMENT 'JSON with detailed tax breakdown',
    `itinerary_costs` text COMMENT 'JSON with itinerary activity costs',
    `itinerary_costs_total` decimal(12,2) DEFAULT 0 COMMENT 'Total itinerary costs',
    `payment_method` enum('full','deposit','partial') DEFAULT 'full',
    `payment_gateway` varchar(80) DEFAULT 'pay_later',
    `payment_status` enum('pending','partial','paid','refunded','failed') DEFAULT 'pending',
    `payment_session_id` varchar(255) DEFAULT NULL,
    `payment_transaction_id` varchar(255) DEFAULT NULL,
    `payment_date` datetime DEFAULT NULL,
    `payment_notes` text,
    `status` enum('pending','pending_verification','confirmed','processing','completed','cancelled','refunded','failed','on_hold','waitlist') DEFAULT 'pending',
    `cancellation_reason` text,
    `cancelled_at` datetime DEFAULT NULL,
    `cancelled_by` bigint(20) UNSIGNED DEFAULT NULL,
    `special_requests` text,
    `internal_notes` text COMMENT 'Admin-only notes',
    `newsletter_optin` tinyint(1) DEFAULT 0,
    `terms_accepted` tinyint(1) DEFAULT 1,
    `ip_address` varchar(45) DEFAULT NULL,
    `user_agent` text,
    `referral_source` varchar(255) DEFAULT NULL,
    `reminder_sent` tinyint(1) DEFAULT 0,
    `reminder_sent_at` datetime DEFAULT NULL,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who created this booking',
    `updated_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who last updated this booking',
    `confirmed_at` datetime DEFAULT NULL,
    `completed_at` datetime DEFAULT NULL,
    `meta` longtext DEFAULT NULL COMMENT 'Optional JSON for integrations — use typed columns for core fields',
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `reference` (`reference`),
    KEY `idx_trip_status` (`trip_id`, `status`),
    KEY `idx_trip_travel` (`trip_id`, `travel_date`),
    KEY `idx_customer_id` (`customer_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_email` (`contact_email`),
    KEY `idx_status` (`status`),
    KEY `idx_payment_status` (`payment_status`),
    KEY `idx_travel_date` (`travel_date`),
    KEY `idx_start_date` (`start_date`),
    KEY `idx_end_date` (`end_date`),
    KEY `idx_availability_id` (`availability_id`),
    KEY `idx_created` (`created_at`)
) {$charsetCollate} COMMENT='Trip bookings';
SQL;
    }
}
