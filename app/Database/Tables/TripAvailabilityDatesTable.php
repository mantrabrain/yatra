<?php

namespace Yatra\Database\Tables;

use Yatra\Database\Tables\BaseTable;
use Yatra\Database\Tables\TripsTable;

/**
 * Trip Availability Dates Table Class
 * 
 * @package Yatra\Database\Tables
 * @since 2.0.0
 */
class TripAvailabilityDatesTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string
     */
    protected static string $table = 'yatra_new_trip_availability_dates';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * @return string
     */
    public static function getSchema(): string
    {
        $tableName = static::getTableName();
        $charsetCollate = static::getCharsetCollate();
        $tripsTable = TripsTable::getTableName();

        return <<<SQL
CREATE TABLE IF NOT EXISTS `{$tableName}` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    `trip_id` bigint(20) unsigned NOT NULL,
    `departure_date` date NOT NULL COMMENT 'Main departure date for the trip',
    `arrival_date` date DEFAULT NULL COMMENT 'Arrival date (for multi-day trips)',
    `return_date` date DEFAULT NULL COMMENT 'Return date (for round trips)',
    `departure_time` time DEFAULT NULL COMMENT 'Departure time',
    `arrival_time` time DEFAULT NULL COMMENT 'Arrival time',
    
    -- Capacity Management
    `seats_total` smallint(5) unsigned NOT NULL DEFAULT 1 COMMENT 'Total seats available',
    `seats_available` smallint(5) unsigned NOT NULL DEFAULT 1 COMMENT 'Seats currently available',
    `seats_reserved` smallint(5) unsigned NOT NULL DEFAULT 0 COMMENT 'Seats reserved/booked',
    `seats_waitlist` smallint(5) unsigned NOT NULL DEFAULT 0 COMMENT 'Waitlist count',
    
    -- Pricing Information
    `pricing_type` enum('regular','discounted','special') NOT NULL DEFAULT 'regular',
    `original_price` decimal(10,2) DEFAULT NULL COMMENT 'Original price before discounts',
    `discounted_price` decimal(10,2) DEFAULT NULL COMMENT 'Discounted price',
    `discount_percentage` decimal(5,2) DEFAULT NULL COMMENT 'Discount percentage',
    `price_types` longtext DEFAULT NULL COMMENT 'JSON: Multiple price types (adult/child/senior)',
    
    -- Location Information
    `from_location` varchar(255) DEFAULT NULL COMMENT 'Departure location',
    `to_location` varchar(255) DEFAULT NULL COMMENT 'Destination location',
    `pickup_location` varchar(255) DEFAULT NULL COMMENT 'Specific pickup point',
    `dropoff_location` varchar(255) DEFAULT NULL COMMENT 'Specific dropoff point',
    
    -- Status and Availability
    `status` enum('available','unavailable','limited','sold_out','cancelled','blocked') NOT NULL DEFAULT 'available',
    `is_blocked` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether this date is blocked',
    `block_reason` varchar(255) DEFAULT NULL COMMENT 'Reason for blocking',
    
    -- Booking Management
    `cutoff_date` date DEFAULT NULL COMMENT 'Last date to book this departure',
    `cutoff_hours` smallint(5) unsigned NOT NULL DEFAULT 24 COMMENT 'Hours before departure to stop bookings',
    `alert_threshold` smallint(5) unsigned DEFAULT NULL COMMENT 'Alert when seats below this',
    
    -- Special Information
    `special_notes` text DEFAULT NULL COMMENT 'Special notes for this departure',
    `guide_assigned` varchar(255) DEFAULT NULL COMMENT 'Assigned guide name',
    `equipment_included` longtext DEFAULT NULL COMMENT 'JSON: Equipment included for this departure',
    
    -- Synchronization and Tracking
    `last_synced_at` datetime DEFAULT NULL COMMENT 'Last sync with external systems',
    `sync_status` enum('pending','synced','failed') DEFAULT NULL COMMENT 'Sync status',
    
    -- Metadata
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who created this record',
    `updated_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who last updated this record',
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `trip_departure_date` (`trip_id`, `departure_date`),
    KEY `trip_id` (`trip_id`),
    KEY `departure_date` (`departure_date`),
    KEY `arrival_date` (`arrival_date`),
    KEY `return_date` (`return_date`),
    KEY `status` (`status`),
    KEY `seats_available` (`seats_available`),
    KEY `is_blocked` (`is_blocked`),
    KEY `cutoff_date` (`cutoff_date`),
    KEY `pricing_type` (`pricing_type`),
    KEY `from_location` (`from_location`),
    KEY `to_location` (`to_location`),
    KEY `created_at` (`created_at`),
    KEY `updated_at` (`updated_at`),
    KEY `last_synced_at` (`last_synced_at`),
    
    CONSTRAINT `fk_trip_availability_dates_trip` 
        FOREIGN KEY (`trip_id`) 
        REFERENCES `{$tripsTable}` (`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    -- Check constraints
    CONSTRAINT `chk_seats_total_positive` CHECK (`seats_total` > 0),
    CONSTRAINT `chk_seats_available_not_negative` CHECK (`seats_available` >= 0),
    CONSTRAINT `chk_seats_reserved_not_negative` CHECK (`seats_reserved` >= 0),
    CONSTRAINT `chk_seats_waitlist_not_negative` CHECK (`seats_waitlist` >= 0),
    CONSTRAINT `chk_dates_cutoff_hours_positive` CHECK (`cutoff_hours` > 0),
    CONSTRAINT `chk_seats_reserved_not_exceed_total` CHECK (`seats_reserved` <= `seats_total`),
    CONSTRAINT `chk_seats_available_not_exceed_total` CHECK (`seats_available` <= `seats_total`)
    
) {$charsetCollate} COMMENT='Traditional Yatra trip availability dates with pricing and capacity';
SQL;
    }
}
