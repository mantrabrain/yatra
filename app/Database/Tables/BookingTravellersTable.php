<?php

namespace Yatra\Database\Tables;

/**
 * BookingTravellers Table Class
 * 
 * Represents the booking travellers table (wp_yatra_booking_travellers) containing
 * individual traveler records for each booking with indexing,
 * lead traveler designation, and relationship tracking.
 * 
 * This table follows the new simplified pattern with only two static methods:
 * - getTableName(): Returns the prefixed table name
 * - getSchema(): Returns the complete CREATE TABLE SQL statement
 * 
 * Usage:
 * BookingTravellersTable::getTableName()  // Returns 'wp_yatra_booking_travellers'
 * BookingTravellersTable::getSchema()     // Returns complete SQL schema
 * 
 * @package Yatra\Database\Tables
 * @since 1.0.0
 */
class BookingTravellersTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_booking_travellers';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * Returns the full SQL schema for the booking travellers table using heredoc syntax
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
    `booking_id` bigint(20) UNSIGNED NOT NULL,
    `traveller_index` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
    `is_lead` tinyint(1) NOT NULL DEFAULT 0,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    KEY `idx_booking_id` (`booking_id`),
    KEY `idx_is_lead` (`is_lead`),
    KEY `idx_booking_index` (`booking_id`, `traveller_index`)
) {$charsetCollate} COMMENT='Individual travellers for each booking';
SQL;
    }
}
