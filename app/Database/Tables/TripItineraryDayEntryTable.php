<?php

namespace Yatra\Database\Tables;

use Yatra\Database\Tables\BaseTable;

/**
 * Trip Itinerary Day Entry Table Class
 * 
 * Stores individual entries/activities for each day in a trip itinerary.
 * Each entry represents a specific activity, meal, accommodation, etc.
 * 
 * @package Yatra\Database\Tables
 * @since 2.0.0
 */
class TripItineraryDayEntryTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_new_trip_itinerary_day_entry';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * @return string Complete CREATE TABLE SQL statement
     */
    public static function getSchema(): string
    {
        $tableName = static::getTableName();
        $daysTableName = (new \Yatra\Database\Tables\TripItineraryDaysTable())->getTableName();
        $charsetCollate = static::getCharsetCollate();

        return <<<SQL
CREATE TABLE IF NOT EXISTS `{$tableName}` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    `day_id` bigint(20) unsigned NOT NULL COMMENT 'Reference to yatra_new_trip_itinerary_days.id',
    `trip_id` bigint(20) unsigned NOT NULL,
    `title` varchar(255) NOT NULL COMMENT 'Entry title (activity name, meal type, etc.)',
    `description` text DEFAULT NULL COMMENT 'Entry description/details',
    `item_type_id` bigint(20) unsigned DEFAULT NULL COMMENT 'Reference to classification item type',
    `item_id` bigint(20) unsigned DEFAULT NULL COMMENT 'Reference to classification item',
    `item_type` varchar(50) DEFAULT NULL COMMENT 'Item type (activity, meal, accommodation, etc.)',
    `item_name` varchar(255) DEFAULT NULL COMMENT 'Item name from classification',
    `item_icon` varchar(255) DEFAULT NULL COMMENT 'Item icon from classification',
    `time` varchar(50) DEFAULT NULL COMMENT 'Time display (e.g., "9:00 AM - 10:00 AM")',
    `start_time` varchar(20) DEFAULT NULL COMMENT 'Start time (HH:MM format)',
    `end_time` varchar(20) DEFAULT NULL COMMENT 'End time (HH:MM format)',
    `time_type` enum('exact','duration','flexible') DEFAULT 'exact' COMMENT 'Time specification type',
    `location` varchar(255) DEFAULT NULL COMMENT 'Location name',
    `location_latitude` decimal(10,8) DEFAULT NULL COMMENT 'Location latitude coordinate',
    `location_longitude` decimal(11,8) DEFAULT NULL COMMENT 'Location longitude coordinate',
    `duration` varchar(50) DEFAULT NULL COMMENT 'Duration (e.g., "2 hours", "1 day")',
    `cost` decimal(10,2) DEFAULT NULL COMMENT 'Cost amount',
    `cost_per_person` tinyint(1) DEFAULT 0 COMMENT 'Whether cost is per person',
    `notes` text DEFAULT NULL COMMENT 'Additional notes',
    `included_items` longtext DEFAULT NULL COMMENT 'JSON: Array of included items',
    `excluded_items` longtext DEFAULT NULL COMMENT 'JSON: Array of excluded items',
    `gallery` longtext DEFAULT NULL COMMENT 'JSON: Array of gallery images with metadata',
    `video_url` varchar(2048) DEFAULT NULL COMMENT 'Video URL (YouTube, Vimeo, etc.)',
    `status` varchar(20) DEFAULT 'publish' COMMENT 'Entry status (publish, draft, etc.)',
    `order` smallint(5) unsigned DEFAULT 0 COMMENT 'Order within the day',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who created this record',
    `updated_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who last updated this record',
    `metadata` longtext DEFAULT NULL COMMENT 'JSON: Additional metadata for future use',
    PRIMARY KEY (`id`),
    KEY `day_id` (`day_id`),
    KEY `trip_id` (`trip_id`),
    KEY `item_type_id` (`item_type_id`),
    KEY `item_id` (`item_id`),
    KEY `item_type` (`item_type`),
    KEY `status` (`status`),
    KEY `order` (`order`),
    KEY `location_latitude` (`location_latitude`),
    KEY `location_longitude` (`location_longitude`),
    KEY `created_at` (`created_at`),
    KEY `updated_at` (`updated_at`),
    CONSTRAINT `fk_itinerary_day_entry_day_id` FOREIGN KEY (`day_id`) REFERENCES `{$daysTableName}` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB {$charsetCollate} COMMENT='Trip itinerary day entries - individual activities/items';
SQL;
    }
}
