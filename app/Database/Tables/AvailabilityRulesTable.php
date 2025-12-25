<?php

namespace Yatra\Database\Tables;

/**
 * AvailabilityRules Table Class
 * 
 * Represents the trip availability rules table (wp_yatra_trip_availability_rules) containing
 * complex recurring availability rules with scheduling patterns, time slots,
 * pricing configurations, and exclusion management.
 * 
 * This table follows the new simplified pattern with only two static methods:
 * - getTableName(): Returns the prefixed table name
 * - getSchema(): Returns the complete CREATE TABLE SQL statement
 * 
 * Usage:
 * AvailabilityRulesTable::getTableName()  // Returns 'wp_yatra_trip_availability_rules'
 * AvailabilityRulesTable::getSchema()     // Returns complete SQL schema
 * 
 * @package Yatra\Database\Tables
 * @since 1.0.0
 */
class AvailabilityRulesTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_new_availability_rules';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * Returns the full SQL schema for the availability rules table using heredoc syntax
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
    `trip_id` bigint(20) UNSIGNED NOT NULL,
    `name` varchar(100) DEFAULT NULL COMMENT 'Rule name for easy identification',
    
    -- Rule Type: weekly, monthly, interval
    `rule_type` enum('weekly','monthly','interval') NOT NULL DEFAULT 'weekly',
    
    -- Weekly: Days of week (0=Sun, 1=Mon, ..., 6=Sat) as comma-separated
    `days_of_week` varchar(20) DEFAULT NULL COMMENT 'e.g., 0 or 1,3,5',
    
    -- Monthly: Week position + Day
    `week_of_month` enum('first','second','third','fourth','last') DEFAULT NULL,
    `day_of_week` tinyint(1) DEFAULT NULL COMMENT '0-6 (Sun-Sat)',
    
    -- Interval: Every X days
    `interval_days` smallint(5) UNSIGNED DEFAULT NULL,
    `interval_start_date` date DEFAULT NULL COMMENT 'Reference date for interval calculation',
    
    -- Active Period
    `start_date` date NOT NULL,
    `end_date` date DEFAULT NULL COMMENT 'NULL = no end date',
    
    -- Excluded Dates (JSON array of YYYY-MM-DD strings)
    `excluded_dates` text DEFAULT NULL,
    
    -- Specific Months Filter (JSON array of month numbers 1-12)
    `months` text DEFAULT NULL COMMENT 'JSON: [1,3,12] for Jan,Mar,Dec. Empty = all months',
    
    -- Multiple time slots per day (JSON array)
    `time_slots` text DEFAULT NULL COMMENT 'JSON: [{departure_time, arrival_time, seats, price}]',
    
    -- Pricing Type
    `pricing_type` enum('regular','traveler_based') DEFAULT 'regular',
    
    -- Default Pricing & Capacity (used if time_slots is empty)
    `original_price` decimal(10,2) DEFAULT NULL,
    `sale_price` decimal(10,2) DEFAULT NULL,
    `traveler_pricing` text DEFAULT NULL COMMENT 'JSON: [{category_id, original_price, sale_price}]',
    `seats_total` smallint(5) UNSIGNED DEFAULT 20,
    `alert_threshold` smallint(5) UNSIGNED DEFAULT 5,
    
    -- Default Times (used if time_slots is empty)
    `departure_time` time DEFAULT NULL,
    `arrival_time` time DEFAULT NULL,
    
    -- Locations
    `from_location` varchar(255) DEFAULT NULL,
    `to_location` varchar(255) DEFAULT NULL,
    
    -- Booking Rules
    `cutoff_hours` smallint(5) UNSIGNED DEFAULT 24,
    `advance_booking_days` smallint(5) UNSIGNED DEFAULT NULL COMMENT 'Max days in advance to book',
    
    -- Day-specific overrides (JSON: {0: {price: 120}, 6: {price: 150}})
    `day_overrides` text DEFAULT NULL COMMENT 'JSON for day-specific pricing/seats',
    
    -- Status
    `status` enum('active','inactive') DEFAULT 'active',
    `priority` smallint(5) UNSIGNED DEFAULT 0 COMMENT 'Higher priority rules override',
    
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    KEY `idx_trip_id` (`trip_id`),
    KEY `idx_rule_type` (`rule_type`),
    KEY `idx_status` (`status`),
    KEY `idx_start_date` (`start_date`),
    KEY `idx_trip_status` (`trip_id`, `status`)
) {$charsetCollate} COMMENT='Trip availability rules';
SQL;
    }
}
