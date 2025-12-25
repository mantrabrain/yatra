<?php

namespace Yatra\Database\Tables;

use Yatra\Database\Tables\BaseTable;

/**
 * Optimized TripPricing Table Class
 * 
 * Consolidates pricing-related tables into a unified system:
 * - yatra_trip_price_types
 * - Dynamic pricing data
 * - Group pricing rules
 * - Seasonal pricing
 * 
 * This unified pricing system handles all pricing models with
 * flexible rules and automatic calculation support.
 * 
 * Key improvements:
 * - Single table for all pricing models
 * - Rule-based pricing engine
 * - Support for complex pricing scenarios
 * - Historical pricing tracking
 * - Performance-optimized queries
 * 
 * @package Yatra\Database\Tables\Optimized
 * @since 2.0.0
 */
class TripPricingTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_trip_pricing';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * Returns the optimized schema that unifies all pricing models
     * into a single flexible system with rule-based calculations.
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
    `pricing_type` enum('base','traveler_category','group','seasonal','dynamic','custom') NOT NULL,
    `category_id` bigint(20) unsigned DEFAULT NULL,
    `category_name` varchar(100) DEFAULT NULL,
    
    -- Pricing Values
    `base_price` decimal(10,2) NOT NULL DEFAULT 0.00,
    `adjusted_price` decimal(10,2) DEFAULT NULL,
    `price_per` enum('person','group','booking','day') DEFAULT 'person',
    `currency` char(3) DEFAULT 'USD',
    
    -- Pricing Rules
    `min_quantity` smallint(5) unsigned DEFAULT NULL,
    `max_quantity` smallint(5) unsigned DEFAULT NULL,
    `price_adjustment` decimal(10,2) DEFAULT 0.00,
    `adjustment_type` enum('fixed','percentage','multiplier') DEFAULT 'fixed',
    
    -- Seasonal/Date-based Pricing
    `valid_from` date DEFAULT NULL,
    `valid_until` date DEFAULT NULL,
    `seasonal_type` enum('peak','off_peak','shoulder','holiday') DEFAULT NULL,
    
    -- Dynamic Pricing
    `demand_threshold` decimal(5,2) DEFAULT NULL,
    `inventory_threshold` smallint(5) unsigned DEFAULT NULL,
    `time_threshold_days` smallint(5) unsigned DEFAULT NULL,
    
    -- Configuration
    `deposit_required` tinyint(1) DEFAULT 0,
    `deposit_amount` decimal(10,2) DEFAULT NULL,
    `deposit_percentage` decimal(5,2) DEFAULT NULL,
    `payment_terms` text,
    
    -- Status and Priority
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    `is_default` tinyint(1) DEFAULT 0,
    `priority` smallint(5) unsigned DEFAULT 10,
    `sort_order` int(11) DEFAULT 0,
    
    -- Metadata
    `description` text,
    `conditions` longtext COMMENT 'JSON: Complex pricing conditions',
    `calculation_rules` longtext COMMENT 'JSON: Price calculation logic',
    
    -- Timestamps
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who created this record',
    `updated_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who last updated this record',
    `expires_at` datetime DEFAULT NULL,
    
    PRIMARY KEY (`id`),
    KEY `trip_id` (`trip_id`),
    KEY `pricing_type` (`pricing_type`),
    KEY `category_id` (`category_id`),
    KEY `valid_date_range` (`valid_from`, `valid_until`),
    KEY `is_active` (`is_active`),
    KEY `is_default` (`is_default`),
    KEY `priority` (`priority`),
    KEY `expires_at` (`expires_at`)
) {$charsetCollate} COMMENT='Unified pricing system with flexible rule engine';
SQL;
    }
}
