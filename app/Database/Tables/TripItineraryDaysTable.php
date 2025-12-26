<?php

namespace Yatra\Database\Tables;

use Yatra\Database\Tables\BaseTable;

/**
 * Trip Itinerary Days Table Class
 * 
 * Stores day information for trip itineraries. Each row represents a day
 * in a trip's itinerary with basic day-level information.
 * 
 * @package Yatra\Database\Tables
 * @since 2.0.0
 */
class TripItineraryDaysTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_new_trip_itinerary_days';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
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
    `day_number` smallint(5) unsigned NOT NULL COMMENT 'Day 1, 2, 3...',
    `title` varchar(255) DEFAULT NULL COMMENT 'Day title',
    `description` text DEFAULT NULL COMMENT 'Day overview',
    `order` smallint(5) unsigned DEFAULT 0,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who created this record',
    `updated_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who last updated this record',
    `metadata` longtext DEFAULT NULL COMMENT 'JSON: Additional metadata for future use',
    PRIMARY KEY (`id`),
    UNIQUE KEY `trip_day` (`trip_id`, `day_number`),
    KEY `trip_id` (`trip_id`),
    KEY `day_number` (`day_number`),
    KEY `order` (`order`),
    KEY `created_at` (`created_at`),
    KEY `updated_at` (`updated_at`)
) ENGINE=InnoDB {$charsetCollate} COMMENT='Trip itinerary days - day level information';
SQL;
    }
}
