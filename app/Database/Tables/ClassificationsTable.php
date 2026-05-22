<?php

namespace Yatra\Database\Tables;

use Yatra\Database\Tables\BaseTable;

/**
 * Optimized Classifications Table Class
 * 
 * Consolidates multiple classification tables (Categories, Activities, Destinations)
 * into a single flexible system using a type-based approach. This eliminates redundancy
 * and provides a unified interface for all classification needs.
 * 
 * Consolidated from:
 * - yatra_trip_categories
 * - yatra_activities  
 * - yatra_destinations
 * - yatra_difficulty_levels
 * - yatra_traveler_categories
 * 
 * Key improvements:
 * - Single table for all classification types
 * - Type-based differentiation
 * - Hierarchical support via parent_id
 * - JSON metadata for flexible extensions
 * - Unified search and filtering
 * 
 * @package Yatra\Database\Tables\Optimized
 * @since 2.0.0
 */
class ClassificationsTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_classifications';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * Returns the optimized schema that unifies all classification types
     * into a single flexible table with type-based differentiation.
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
    `type` enum('category','activity','destination','difficulty','traveler_type','attribute','item_type','item') NOT NULL,
    `name` varchar(255) NOT NULL,
    `slug` varchar(255) NOT NULL,
    `description` text,
    `parent_id` bigint(20) unsigned DEFAULT NULL,
    `level` tinyint(3) unsigned DEFAULT 0,
    `icon` text DEFAULT NULL,
    `color` varchar(7) DEFAULT NULL COMMENT 'Hex color code',
    `metadata` longtext COMMENT 'JSON: Type-specific metadata (coordinates for destinations, requirements for activities, field config for attributes, item_type_id for items, etc.)',
    `sorting` int(11) DEFAULT 0,
    `is_featured` tinyint(1) DEFAULT 0,
    `status` varchar(20) NOT NULL DEFAULT 'draft',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who created this record',
    `updated_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who last updated this record',
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `type_slug` (`type`, `slug`),
    KEY `type` (`type`),
    KEY `parent_id` (`parent_id`),
    KEY `level` (`level`),
    KEY `status` (`status`),
    KEY `is_featured` (`is_featured`),
    KEY `sorting` (`sorting`),
    FULLTEXT KEY `search_content` (`name`, `description`)
) {$charsetCollate} COMMENT='Unified classification system for categories, activities, destinations, attributes, items, and item types';
SQL;
    }
}
