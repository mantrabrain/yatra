<?php

namespace Yatra\Database\Tables;

/**
 * Enquiries Table Class
 * 
 * Represents the customer enquiries table (wp_yatra_enquiries) containing
 * customer inquiry data including contact information, message content,
 * travel preferences, response tracking, and status management.
 * 
 * This table follows the new simplified pattern with only two static methods:
 * - getTableName(): Returns the prefixed table name
 * - getSchema(): Returns the complete CREATE TABLE SQL statement
 * 
 * Usage:
 * EnquiriesTable::getTableName()  // Returns 'wp_yatra_enquiries'
 * EnquiriesTable::getSchema()     // Returns complete SQL schema
 * 
 * @package Yatra\Database\Tables
 * @since 1.0.0
 */
class EnquiriesTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_new_enquiries';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * Returns the full SQL schema for the enquiries table using heredoc syntax
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
    `trip_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Related trip ID',
    `name` varchar(255) NOT NULL COMMENT 'Customer full name',
    `email` varchar(255) NOT NULL COMMENT 'Customer email',
    `phone` varchar(50) DEFAULT NULL COMMENT 'Customer phone',
    `message` text NOT NULL COMMENT 'Enquiry message',
    `adults` smallint(5) UNSIGNED DEFAULT 1 COMMENT 'Number of adults',
    `children` smallint(5) UNSIGNED DEFAULT 0 COMMENT 'Number of children',
    `travel_date` date DEFAULT NULL COMMENT 'Preferred travel date',
    `status` enum('new','responded','closed','converted','spam') DEFAULT 'new',
    `response_notes` text DEFAULT NULL COMMENT 'Internal response notes',
    `responded_at` datetime DEFAULT NULL COMMENT 'When enquiry was responded to',
    `responded_by` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'User who responded',
    `ip_address` varchar(45) DEFAULT NULL COMMENT 'Customer IP address',
    `user_agent` varchar(500) DEFAULT NULL COMMENT 'Customer browser info',
    `source` varchar(50) DEFAULT 'website' COMMENT 'Source of enquiry',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID who created this enquiry record',
    
    PRIMARY KEY (`id`),
    KEY `idx_trip_id` (`trip_id`),
    KEY `idx_email` (`email`),
    KEY `idx_status` (`status`),
    KEY `idx_created_at` (`created_at`)
) {$charsetCollate} COMMENT='Customer enquiries';
SQL;
    }
}
