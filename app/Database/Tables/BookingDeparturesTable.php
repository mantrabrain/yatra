<?php

namespace Yatra\Database\Tables;

/**
 * BookingDepartures Table Class
 * 
 * Represents the booking-departures relationship table (wp_yatra_booking_departures)
 * linking bookings to specific trip departures with date and time information.
 * This table manages the association between bookings and scheduled departures.
 * 
 * This table follows the new simplified pattern with only two static methods:
 * - getTableName(): Returns the prefixed table name
 * - getSchema(): Returns the complete CREATE TABLE SQL statement
 * 
 * Usage:
 * BookingDeparturesTable::getTableName()  // Returns 'wp_yatra_booking_departures'
 * BookingDeparturesTable::getSchema()     // Returns complete SQL schema
 * 
 * @package Yatra\Database\Tables
 * @since 1.0.0
 */
class BookingDeparturesTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_new_booking_departures';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * Returns the full SQL schema for the booking-departures table using heredoc syntax
     * for proper IDE syntax highlighting. Includes all columns, indexes,
     * and constraints.
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
    `booking_id` bigint(20) UNSIGNED NOT NULL,
    `departure_id` bigint(20) UNSIGNED NOT NULL,
    `travel_date` date NOT NULL,
    `departure_time` time DEFAULT NULL,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_booking_departure` (`booking_id`,`departure_id`),
    KEY `idx_booking_id` (`booking_id`),
    KEY `idx_departure_id` (`departure_id`),
    KEY `idx_travel_date` (`travel_date`)
) {$charsetCollate} COMMENT='Booking-Departure relationship';
SQL;
    }
}
