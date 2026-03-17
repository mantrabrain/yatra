<?php

namespace Yatra\Database\Tables;

/**
 * Departures Table
 * 
 * Handles trip departures table operations
 * Table: wp_yatra_trip_departures
 */
class DeparturesTable extends BaseTable
{
    /**
     * Table name without prefix
     */
    protected static string $table = 'yatra_new_trip_departures';

    /**
     * Get table name
     */
    public static function getTableName(): string
    {
        global $wpdb;
        return $wpdb->prefix . static::$table;
    }

    /**
     * Get table schema
     */
    public static function getSchema(): string
    {
        global $wpdb;
        $table = static::getTableName();
        $charset_collate = $wpdb->get_charset_collate();

        return "
            CREATE TABLE IF NOT EXISTS `{$table}` (
                `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
                `trip_id` bigint(20) UNSIGNED NOT NULL,
                `date` date NOT NULL,
                `time` time DEFAULT NULL,
                `max_capacity` int(11) NOT NULL DEFAULT 0,
                `booked_count` int(11) NOT NULL DEFAULT 0,
                `status` varchar(20) NOT NULL DEFAULT 'upcoming',
                `source` varchar(20) NOT NULL DEFAULT 'manual',
                `price_override` decimal(10,2) DEFAULT NULL,
                `price_by_traveler_type` longtext DEFAULT NULL,
                `notes` text DEFAULT NULL,
                `created_at` datetime NOT NULL,
                `updated_at` datetime DEFAULT NULL,
                PRIMARY KEY (`id`),
                KEY `trip_id` (`trip_id`),
                KEY `date` (`date`),
                KEY `status` (`status`),
                KEY `trip_date` (`trip_id`, `date`)
            ) {$charset_collate};
        ";
    }
}
