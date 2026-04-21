<?php

namespace Yatra\Database\Tables;

/**
 * BookingTravellerMeta Table Class
 * 
 * Represents the booking traveller meta table (wp_yatra_booking_traveller_meta) containing
 * dynamic metadata fields for individual travelers including personal information,
 * dietary requirements, medical conditions, and custom fields.
 * 
 * This table follows the new simplified pattern with only two static methods:
 * - getTableName(): Returns the prefixed table name
 * - getSchema(): Returns the complete CREATE TABLE SQL statement
 * 
 * Usage:
 * BookingTravellerMetaTable::getTableName()  // Returns 'wp_yatra_booking_traveller_meta'
 * BookingTravellerMetaTable::getSchema()     // Returns complete SQL schema
 * 
 * @package Yatra\Database\Tables
 * @since 1.0.0
 */
class BookingTravellerMetaTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_new_booking_traveller_meta';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * Returns the full SQL schema for the booking traveller meta table using heredoc syntax
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
    `traveller_id` bigint(20) UNSIGNED NOT NULL,
    `meta_key` varchar(255) NOT NULL,
    `meta_value` longtext,
    
    PRIMARY KEY (`id`),
    KEY `idx_traveller_id` (`traveller_id`),
    KEY `idx_meta_key` (`meta_key`(191)),
    UNIQUE KEY `idx_traveller_meta` (`traveller_id`, `meta_key`(191))
) {$charsetCollate} COMMENT='Dynamic metadata for booking travellers';
SQL;
    }
}
