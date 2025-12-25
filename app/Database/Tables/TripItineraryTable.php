<?php

namespace Yatra\Database\Tables;

use Yatra\Database\Tables\BaseTable;

/**
 * Optimized TripItinerary Table Class
 * 
 * Consolidates 3 separate itinerary tables (Days, Entries, EntryImages) into a single
 * flexible table using JSON fields for hierarchical data. This eliminates complex joins
 * and provides better performance while maintaining all functionality.
 * 
 * Key improvements:
 * - Single table instead of 3 separate tables
 * - JSON fields for flexible hierarchical data
 * - Built-in image storage within entries
 * - Better indexing and query performance
 * - Future-proof for additional itinerary features
 * 
 * This table follows the new simplified pattern with only two static methods:
 * - getTableName(): Returns the prefixed table name
 * - getSchema(): Returns the complete CREATE TABLE SQL statement
 * 
 * Usage:
 * TripItineraryTable::getTableName()  // Returns 'wp_yatra_trip_itinerary'
 * TripItineraryTable::getSchema()     // Returns complete SQL schema
 * 
 * @package Yatra\Database\Tables\Optimized
 * @since 2.0.0
 */
class TripItineraryTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_trip_itinerary';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * Returns the optimized schema that consolidates itinerary days, entries,
     * and images into a single flexible structure using JSON fields.
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
    `day_number` smallint(5) unsigned NOT NULL,
    `title` varchar(255) NOT NULL,
    `description` text,
    `content` longtext COMMENT 'JSON: Array of itinerary entries with activities, meals, accommodation, etc.',
    `images` longtext COMMENT 'JSON: Array of images with captions, order, and metadata',
    `activities` longtext COMMENT 'JSON: Array of activities with duration, location, notes',
    `meals` longtext COMMENT 'JSON: Array of meals with type, included status, dietary info',
    `accommodation` longtext COMMENT 'JSON: Accommodation details if applicable',
    `transportation` longtext COMMENT 'JSON: Transportation details for the day',
    `special_notes` text,
    `duration_hours` decimal(4,2) DEFAULT NULL,
    `difficulty_level` enum('easy','moderate','challenging','strenuous') DEFAULT 'easy',
    `weather_considerations` text,
    `packing_requirements` text,
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    `sort_order` smallint(5) unsigned DEFAULT 0,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who created this record',
    `updated_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who last updated this record',
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `trip_day` (`trip_id`, `day_number`),
    KEY `trip_id` (`trip_id`),
    KEY `day_number` (`day_number`),
    KEY `is_active` (`is_active`),
    KEY `sort_order` (`sort_order`),
    FULLTEXT KEY `search_content` (`title`, `description`, `special_notes`)
) {$charsetCollate} COMMENT='Optimized trip itinerary with JSON-based flexible structure';
SQL;
    }
}
