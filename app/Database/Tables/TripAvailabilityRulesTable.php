<?php

namespace Yatra\Database\Tables;

use Yatra\Database\Tables\BaseTable;
use Yatra\Database\Tables\TripsTable;

/**
 * Trip Availability Rules Table Class
 * 
 * @package Yatra\Database\Tables
 * @since 2.0.0
 */
class TripAvailabilityRulesTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string
     */
    protected static string $table = 'yatra_new_trip_availability_rules';

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
    `name` varchar(255) NOT NULL DEFAULT '' COMMENT 'Rule name for identification',
    `status` enum('active','inactive','paused') NOT NULL DEFAULT 'active',
    
    -- Recurrence Pattern Configuration
    `recurrence_type` enum('daily','weekly','monthly','yearly','custom') NOT NULL DEFAULT 'weekly',
    `recurrence_pattern` json DEFAULT NULL COMMENT 'Recurrence pattern configuration',
    `start_date` date NOT NULL COMMENT 'Rule start date',
    `end_date` date DEFAULT NULL COMMENT 'Rule end date (null for no end)',
    
    -- Time-based Recurrence Fields
    `days_of_week` json DEFAULT NULL COMMENT 'Applicable days of week for weekly patterns',
    `day_of_month` int(11) DEFAULT NULL COMMENT 'Day of month for monthly patterns',
    `month_of_year` int(11) DEFAULT NULL COMMENT 'Month of year for yearly patterns',
    `interval` int(11) NOT NULL DEFAULT 1 COMMENT 'Interval for recurrence (every X days/weeks/etc)',
    
    -- Availability Settings
    `availability_status` enum('available','unavailable','limited') NOT NULL DEFAULT 'available',
    `max_bookings` int(11) DEFAULT NULL COMMENT 'Maximum bookings per recurrence',
    `price_override` decimal(10,2) DEFAULT NULL COMMENT 'Override price for this rule',
    `price_type` enum('fixed','percentage') DEFAULT 'fixed' COMMENT 'Price override type',
    
    -- Time-based Settings
    `departure_time` time DEFAULT NULL COMMENT 'Default departure time for generated dates',
    `arrival_time` time DEFAULT NULL COMMENT 'Default arrival time for generated dates',
    `duration_hours` decimal(5,2) DEFAULT NULL COMMENT 'Trip duration in hours',
    
    -- Location Settings
    `from_location` varchar(255) DEFAULT NULL COMMENT 'Default pickup location',
    `to_location` varchar(255) DEFAULT NULL COMMENT 'Default destination location',
    `pickup_location` varchar(255) DEFAULT NULL COMMENT 'Specific pickup point',
    `dropoff_location` varchar(255) DEFAULT NULL COMMENT 'Specific dropoff point',
    
    -- Exception Handling
    `exceptions` json DEFAULT NULL COMMENT 'Date exceptions to the rule',
    `exception_type` enum('exclude','include_only') DEFAULT 'exclude' COMMENT 'How to handle exceptions',
    
    -- Capacity and Pricing Rules
    `capacity_type` enum('fixed','percentage') DEFAULT 'fixed' COMMENT 'Capacity calculation type',
    `capacity_value` int(11) DEFAULT NULL COMMENT 'Capacity value (seats or percentage)',
    `pricing_adjustment` decimal(10,2) DEFAULT 0.00 COMMENT 'Price adjustment amount',
    `pricing_adjustment_type` enum('amount','percentage') DEFAULT 'amount' COMMENT 'Price adjustment type',
    
    -- Booking Management
    `cutoff_hours` smallint(5) unsigned DEFAULT NULL COMMENT 'Hours before departure to stop bookings',
    `cutoff_days` smallint(5) unsigned DEFAULT NULL COMMENT 'Days before departure to stop bookings',
    `advance_booking_days` smallint(5) unsigned DEFAULT NULL COMMENT 'Days in advance booking opens',
    
    -- Conditions and Restrictions
    `minimum_participants` smallint(5) unsigned DEFAULT NULL COMMENT 'Minimum participants required',
    `maximum_participants` smallint(5) unsigned DEFAULT NULL COMMENT 'Maximum participants allowed',
    `age_restrictions` json DEFAULT NULL COMMENT 'Age restrictions (min/max ages)',
    `skill_level` varchar(100) DEFAULT NULL COMMENT 'Required skill level',
    
    -- Seasonal and Date-based Rules
    `season_type` enum('all','high','low','shoulder') DEFAULT 'all' COMMENT 'Season applicability',
    `holiday_only` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Apply only on holidays',
    `weekend_only` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Apply only on weekends',
    `weekday_only` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Apply only on weekdays',
    
    -- Metadata and Status
    `notes` text DEFAULT NULL COMMENT 'Internal notes for this rule',
    `priority` smallint(5) unsigned DEFAULT 10 COMMENT 'Rule priority (lower = higher priority)',
    `auto_generate` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Automatically generate dates',
    `last_generated` datetime DEFAULT NULL COMMENT 'Last time dates were generated',
    
    -- Audit Trail
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who created this record',
    `updated_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who last updated this record',
    
    PRIMARY KEY (`id`),
    KEY `trip_id` (`trip_id`),
    KEY `status` (`status`),
    KEY `recurrence_type` (`recurrence_type`),
    KEY `start_date` (`start_date`),
    KEY `end_date` (`end_date`),
    KEY `availability_status` (`availability_status`),
    KEY `price_type` (`price_type`),
    KEY `season_type` (`season_type`),
    KEY `priority` (`priority`),
    KEY `auto_generate` (`auto_generate`),
    KEY `last_generated` (`last_generated`),
    KEY `created_at` (`created_at`),
    KEY `updated_at` (`updated_at`),
    
    CONSTRAINT `fk_trip_availability_rules_trip` 
        FOREIGN KEY (`trip_id`) 
        REFERENCES `{$tripsTable}` (`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    -- Check constraints
    CONSTRAINT `chk_interval_positive` CHECK (`interval` > 0),
    CONSTRAINT `chk_priority_positive` CHECK (`priority` >= 0),
    CONSTRAINT `chk_minimum_participants_positive` CHECK (`minimum_participants` IS NULL OR `minimum_participants` > 0),
    CONSTRAINT `chk_maximum_participants_positive` CHECK (`maximum_participants` IS NULL OR `maximum_participants` > 0),
    CONSTRAINT `chk_rules_cutoff_hours_positive` CHECK (`cutoff_hours` IS NULL OR `cutoff_hours` > 0),
    CONSTRAINT `chk_cutoff_days_positive` CHECK (`cutoff_days` IS NULL OR `cutoff_days` > 0),
    CONSTRAINT `chk_advance_booking_days_positive` CHECK (`advance_booking_days` IS NULL OR `advance_booking_days` >= 0),
    CONSTRAINT `chk_capacity_value_positive` CHECK (`capacity_value` IS NULL OR `capacity_value` > 0),
    CONSTRAINT `chk_max_bookings_positive` CHECK (`max_bookings` IS NULL OR `max_bookings` > 0),
    CONSTRAINT `chk_duration_hours_positive` CHECK (`duration_hours` IS NULL OR `duration_hours` > 0),
    CONSTRAINT `chk_participants_order` CHECK (`minimum_participants` IS NULL OR `maximum_participants` IS NULL OR `minimum_participants` <= `maximum_participants`)
    
) {$charsetCollate} COMMENT='Recurring availability rules for trip scheduling';
SQL;
    }
}
