<?php

namespace Yatra\Database\Tables;

use Yatra\Database\Tables\TripsTable;

/**
 * TripRevisions Table Class
 * 
 * Represents the trip revisions table (wp_yatra_trip_revisions) containing
 * version history for trips with serialized data, version tracking,
 * status management, and user attribution.
 * 
 * This table follows the new simplified pattern with only two static methods:
 * - getTableName(): Returns the prefixed table name
 * - getSchema(): Returns the complete CREATE TABLE SQL statement
 * 
 * Usage:
 * TripRevisionsTable::getTableName()  // Returns 'wp_yatra_trip_revisions'
 * TripRevisionsTable::getSchema()     // Returns complete SQL schema
 * 
 * @package Yatra\Database\Tables
 * @since 1.0.0
 */
class TripRevisionsTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_new_trip_revisions';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * Returns the full SQL schema for the trip revisions table using heredoc syntax
     * for proper IDE syntax highlighting. Includes all columns, indexes,
     * and constraints from the original Database.php schema.
     * 
     * @return string Complete CREATE TABLE SQL statement
     */
    public static function getSchema(): string
    {
        $tableName = static::getTableName();
        $charsetCollate = static::getCharsetCollate();
        $tripsTable = TripsTable::getTableName();

        return <<<SQL
CREATE TABLE IF NOT EXISTS `{$tableName}` (
    `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `trip_id` bigint(20) UNSIGNED NOT NULL,
    `version` int(11) NOT NULL DEFAULT 1,
    `status` enum('inherit','restored') DEFAULT 'inherit' COMMENT 'inherit = normal revision, restored = revision created from restore',
    `data` longtext NOT NULL COMMENT 'Serialized trip data',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `created_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
    
    PRIMARY KEY (`id`),
    KEY `trip_id` (`trip_id`),
    KEY `version` (`version`),
    KEY `status` (`status`),
    KEY `created_at` (`created_at`),
    KEY `created_by` (`created_by`),
    CONSTRAINT `fk_revisions_trip` FOREIGN KEY (`trip_id`) REFERENCES `{$tripsTable}` (`id`) ON DELETE CASCADE
) {$charsetCollate};
SQL;
    }
}
