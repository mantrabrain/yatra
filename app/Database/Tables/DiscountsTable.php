<?php

namespace Yatra\Database\Tables;

/**
 * Discounts Table Class
 * 
 * Represents the discounts table (wp_yatra_discounts) containing comprehensive
 * discount management data including promo codes, group discounts,
 * usage tracking, and advanced discount configurations.
 * 
 * This table follows the new simplified pattern with only two static methods:
 * - getTableName(): Returns the prefixed table name
 * - getSchema(): Returns the complete CREATE TABLE SQL statement
 * 
 * Usage:
 * DiscountsTable::getTableName()  // Returns 'wp_yatra_discounts'
 * DiscountsTable::getSchema()     // Returns complete SQL schema
 * 
 * @package Yatra\Database\Tables
 * @since 1.0.0
 */
class DiscountsTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_discounts';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * Returns the full SQL schema for the discounts table using heredoc syntax
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
    `code` varchar(100) NOT NULL,
    `description` text,
    `type` varchar(20) NOT NULL DEFAULT 'percentage',
    `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
    `max_discount_amount` decimal(10,2) DEFAULT NULL,
    `usage_limit` int(11) NOT NULL DEFAULT 0,
    `usage_limit_per_customer` int(11) DEFAULT 0,
    `usage_count` int(11) NOT NULL DEFAULT 0,
    `valid_from` datetime DEFAULT NULL,
    `expiry_date` datetime DEFAULT NULL,
    `status` varchar(20) DEFAULT 'draft',
    `applicable_to` varchar(20) DEFAULT 'all',
    `trip_ids` text DEFAULT NULL,
    `min_amount` decimal(10,2) DEFAULT NULL,
    `first_time_customer_only` tinyint(1) DEFAULT 0,
    `is_group_discount` tinyint(1) DEFAULT 0,
    `discount_mode` varchar(20) DEFAULT 'both' COMMENT 'promo, group, or both',
    `min_group_size` int(11) DEFAULT NULL,
    `max_group_size` int(11) DEFAULT NULL,
    `group_discount_type` varchar(20) DEFAULT 'percentage',
    `group_discount_amount` decimal(10,2) DEFAULT NULL,
    `group_discount_mode` varchar(20) DEFAULT 'total',
    `group_discount_ranges` longtext DEFAULT NULL,
    `category_discounts` longtext DEFAULT NULL,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
    `updated_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `code` (`code`),
    KEY `type` (`type`),
    KEY `status` (`status`),
    KEY `valid_from` (`valid_from`),
    KEY `expiry_date` (`expiry_date`),
    KEY `created_by` (`created_by`)
) {$charsetCollate} COMMENT='Discount codes and group discounts';
SQL;
    }
}
