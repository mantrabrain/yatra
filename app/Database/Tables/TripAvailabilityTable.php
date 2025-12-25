<?php

namespace Yatra\Database\Tables;

use Yatra\Database\Tables\BaseTable;

/**
 * Optimized TripAvailability Table Class
 * 
 * Consolidates availability and pricing tables into a unified system:
 * - yatra_trip_availability_dates
 * - yatra_trip_availability_rules
 * - yatra_trip_price_types
 * - yatra_trip_departures
 * 
 * This unified system handles both specific dates and recurring rules with
 * flexible pricing options and departure management.
 * 
 * Key improvements:
 * - Single table for all availability types
 * - Rule-based and date-based availability
 * - Integrated pricing information
 * - Flexible recurrence patterns
 * - Performance-optimized queries
 * 
 * @package Yatra\Database\Tables\Optimized
 * @since 2.0.0
 */
class TripAvailabilityTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_trip_availability';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * Returns the optimized schema that unifies availability, pricing,
     * and departure management into a single flexible system.
     * 
     * @return string Complete CREATE TABLE SQL statement
     */
    public static function getSchema(): string
    {
        $tableName = static::getTableName();
        $charsetCollate = static::getCharsetCollate();

        return <<<SQL
CREATE TABLE IF NOT EXISTS `{$tableName}` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    `trip_id` bigint(20) unsigned NOT NULL,
    `type` enum('date','rule','departure') NOT NULL,
    `start_date` date DEFAULT NULL,
    `end_date` date DEFAULT NULL,
    `recurrence_pattern` longtext COMMENT 'JSON: Recurrence rules for recurring availability',
    `availability_status` enum('available','unavailable','limited','sold_out','cancelled') DEFAULT 'available',
    `capacity` smallint(5) unsigned DEFAULT NULL,
    `booked_count` smallint(5) unsigned DEFAULT 0,
    `waitlist_capacity` smallint(5) unsigned DEFAULT 0,
    `waitlist_count` smallint(5) unsigned DEFAULT 0,
    
    -- Pricing Information
    `base_price` decimal(10,2) DEFAULT NULL,
    `price_type` enum('fixed','percentage','dynamic') DEFAULT 'fixed',
    `price_adjustment` decimal(10,2) DEFAULT 0.00,
    `price_adjustment_type` enum('amount','percentage') DEFAULT 'amount',
    `currency` char(3) DEFAULT 'USD',
    
    -- Departure Specific (when type = 'departure')
    `departure_code` varchar(50) DEFAULT NULL,
    `departure_time` time DEFAULT NULL,
    `pickup_location` varchar(255) DEFAULT NULL,
    `dropoff_location` varchar(255) DEFAULT NULL,
    `guide_assigned` varchar(255) DEFAULT NULL,
    
    -- Rule Configuration (when type = 'rule')
    `rule_name` varchar(255) DEFAULT NULL,
    `rule_conditions` longtext COMMENT 'JSON: Conditions for rule application',
    `priority` smallint(5) unsigned DEFAULT 10,
    
    -- Metadata and Status
    `notes` text,
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    `sort_order` int(11) DEFAULT 0,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who created this record',
    `updated_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who last updated this record',
    
    PRIMARY KEY (`id`),
    KEY `trip_id` (`trip_id`),
    KEY `type` (`type`),
    KEY `date_range` (`start_date`, `end_date`),
    KEY `availability_status` (`availability_status`),
    KEY `capacity` (`capacity`),
    KEY `is_active` (`is_active`),
    KEY `sort_order` (`sort_order`),
    KEY `departure_code` (`departure_code`),
    FULLTEXT KEY `search_content` (`rule_name`, `notes`)
) {$charsetCollate} COMMENT='Unified availability, pricing, and departure management';
SQL;
    }
}
