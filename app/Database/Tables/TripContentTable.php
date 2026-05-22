<?php

namespace Yatra\Database\Tables;

use Yatra\Database\Tables\BaseTable;

/**
 * Optimized TripContent Table Class
 * 
 * Consolidates multiple content tables into a unified system:
 * - yatra_trip_gallery_images
 * - yatra_trip_downloads
 * - yatra_trip_highlights
 * - yatra_trip_faqs
 * 
 * This unified content system handles all trip-related content with
 * type-based differentiation and flexible metadata.
 * 
 * Key improvements:
 * - Single table for all trip content
 * - Type-based content organization
 * - JSON metadata for flexibility
 * - Built-in sorting and display control
 * - Support for future content types
 * 
 * @package Yatra\Database\Tables\Optimized
 * @since 2.0.0
 */
class TripContentTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_trip_content';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * Returns the optimized schema that unifies all trip content
     * into a single flexible table with type-based organization.
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
    `content_type` enum('image','video','youtube','virtual_tour','document','highlight','faq','download','testimonial', 'landmark') NOT NULL,
    `title` varchar(255) DEFAULT NULL,
    `description` text,
    `content_url` varchar(500) DEFAULT NULL,
    `file_path` varchar(500) DEFAULT NULL,
    `file_size` bigint(20) unsigned DEFAULT NULL,
    `file_type` varchar(50) DEFAULT NULL,
    `thumbnail_url` varchar(500) DEFAULT NULL,
    `metadata` longtext COMMENT 'JSON: Type-specific metadata (image dimensions, FAQ answer, download permissions, etc.)',
    `display_options` longtext COMMENT 'JSON: Display configuration, layout options, etc.',
    `sort_order` smallint(5) unsigned DEFAULT 0,
    `is_featured` tinyint(1) DEFAULT 0,
    `is_downloadable` tinyint(1) DEFAULT 0,
    `is_public` tinyint(1) DEFAULT 1,
    `requires_login` tinyint(1) DEFAULT 0,
    `access_level` enum('public','registered','customer','premium') DEFAULT 'public',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who created this record',
    `updated_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who last updated this record',
    
    PRIMARY KEY (`id`),
    KEY `idx_trip_content_type` (`trip_id`, `content_type`),
    KEY `content_type` (`content_type`),
    KEY `is_featured` (`is_featured`),
    KEY `is_downloadable` (`is_downloadable`),
    KEY `is_public` (`is_public`),
    KEY `access_level` (`access_level`),
    KEY `sort_order` (`sort_order`),
    KEY `created_at` (`created_at`),
    FULLTEXT KEY `search_content` (`title`, `description`)
) {$charsetCollate} COMMENT='Unified trip content management system';
SQL;
    }
}
