<?php

namespace Yatra\Database\Tables;

use Yatra\Database\Tables\BaseTable;

/**
 * Optimized TripClassifications Table Class
 * 
 * Consolidates multiple relationship tables into a single flexible system:
 * - yatra_trip_trip_categories
 * - yatra_trip_activities  
 * - yatra_trip_destinations
 * - yatra_trip_attributes
 * 
 * This polymorphic relationship table handles all trip-to-classification associations
 * with additional metadata for context-specific information.
 * 
 * Key improvements:
 * - Single table for all trip relationships
 * - Polymorphic design for flexibility
 * - Context metadata for each relationship
 * - Sorting and priority support
 * - Future-proof for new relationship types
 * 
 * @package Yatra\Database\Tables\Optimized
 * @since 2.0.0
 */
class TripClassificationsTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_trip_classifications';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * Returns the optimized schema that unifies all trip-to-classification
     * relationships into a single polymorphic table.
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
    `classification_id` bigint(20) unsigned NOT NULL,
    `classification_type` enum('category','activity','destination','difficulty','traveler_type','attribute') NOT NULL,
    `relationship_type` enum('primary','secondary','optional','required') DEFAULT 'primary',
    `metadata` longtext COMMENT 'JSON: Relationship-specific data (emphasis, custom notes, etc.)',
    `sort_order` smallint(5) unsigned DEFAULT 0,
    `is_featured` tinyint(1) DEFAULT 0,
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who created this record',
    `updated_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who last updated this record',
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `trip_classification_unique` (`trip_id`, `classification_id`, `classification_type`),
    KEY `trip_id` (`trip_id`),
    KEY `classification_id` (`classification_id`),
    KEY `classification_type` (`classification_type`),
    KEY `relationship_type` (`relationship_type`),
    KEY `is_active` (`is_active`),
    KEY `is_featured` (`is_featured`),
    KEY `sort_order` (`sort_order`)
) {$charsetCollate} COMMENT='Polymorphic trip-to-classification relationships';
SQL;
    }
}
