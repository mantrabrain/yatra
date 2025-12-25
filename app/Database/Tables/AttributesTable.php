<?php

namespace Yatra\Database\Tables;

use Yatra\Database\Tables\BaseTable;

/**
 * Optimized Attributes Table Class
 * 
 * Implements a flexible EAV (Entity-Attribute-Value) system that consolidates
 * multiple attribute tables and provides unlimited extensibility for future features.
 * 
 * Consolidates from:
 * - yatra_attributes
 * - yatra_trip_attributes
 * - yatra_items
 * - yatra_item_types
 * - yatra_difficulty_levels
 * - yatra_traveler_categories
 * 
 * Key improvements:
 * - EAV pattern for maximum flexibility
 * - Type-safe attribute definitions
 * - Validation rules and constraints
 * - Support for complex data types
 * - Future-proof for any new attributes
 * 
 * @package Yatra\Database\Tables\Optimized
 * @since 2.0.0
 */
class AttributesTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_attributes';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * Returns the EAV-based schema that provides maximum flexibility
     * for attribute definitions and value storage.
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
    `entity_type` enum('trip','booking','customer','destination','classification','availability') NOT NULL,
    `entity_id` bigint(20) unsigned NOT NULL,
    `attribute_key` varchar(100) NOT NULL,
    `attribute_type` enum('text','number','decimal','date','datetime','boolean','json','file') NOT NULL,
    `attribute_value` longtext,
    `attribute_label` varchar(255) DEFAULT NULL,
    `attribute_group` varchar(100) DEFAULT NULL,
    `sort_order` smallint(5) unsigned DEFAULT 0,
    `is_required` tinyint(1) DEFAULT 0,
    `is_searchable` tinyint(1) DEFAULT 0,
    `is_filterable` tinyint(1) DEFAULT 0,
    `validation_rules` longtext COMMENT 'JSON: Validation rules and constraints',
    `display_options` longtext COMMENT 'JSON: Display configuration for frontend',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who created this record',
    `updated_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who last updated this record',
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `entity_attribute_unique` (`entity_type`, `entity_id`, `attribute_key`),
    KEY `entity_type_id` (`entity_type`, `entity_id`),
    KEY `attribute_key` (`attribute_key`),
    KEY `attribute_type` (`attribute_type`),
    KEY `attribute_group` (`attribute_group`),
    KEY `is_required` (`is_required`),
    KEY `is_searchable` (`is_searchable`),
    KEY `is_filterable` (`is_filterable`),
    KEY `sort_order` (`sort_order`),
    FULLTEXT KEY `search_content` (`attribute_value`)
) {$charsetCollate} COMMENT='EAV system for flexible attribute management';
SQL;
    }
}
