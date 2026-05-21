<?php

namespace Yatra\Database\Tables;

/**
 * Reviews Table Class
 * 
 * Represents the reviews table (wp_yatra_reviews) containing trip review data
 * including ratings, content, author information, status management,
 * and helpful voting.
 * 
 * This table follows the new simplified pattern with only two static methods:
 * - getTableName(): Returns the prefixed table name
 * - getSchema(): Returns the complete CREATE TABLE SQL statement
 * 
 * Usage:
 * ReviewsTable::getTableName()  // Returns 'wp_yatra_reviews'
 * ReviewsTable::getSchema()     // Returns complete SQL schema
 * 
 * @package Yatra\Database\Tables
 * @since 1.0.0
 */
class ReviewsTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_new_reviews';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * Returns the full SQL schema for the reviews table using heredoc syntax
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
    `trip_id` bigint(20) UNSIGNED NOT NULL,
    `user_id` bigint(20) UNSIGNED DEFAULT 0,
    `rating` tinyint(1) UNSIGNED NOT NULL,
    `title` varchar(255) DEFAULT NULL,
    `content` text NOT NULL,
    `author_name` varchar(100) NOT NULL,
    `author_email` varchar(100) DEFAULT NULL,
    `author_location` varchar(100) DEFAULT NULL,
    `status` enum('pending','approved','rejected','spam','trash') DEFAULT 'pending',
    `helpful_count` int(11) UNSIGNED DEFAULT 0,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who created this review',
    `updated_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who last updated this review',
    
    PRIMARY KEY (`id`),
    KEY `idx_trip_status` (`trip_id`, `status`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_status` (`status`),
    KEY `idx_rating` (`rating`),
    KEY `idx_created_at` (`created_at`)
) {$charsetCollate} COMMENT='Trip reviews and ratings';
SQL;
    }
}
