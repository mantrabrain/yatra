<?php

namespace Yatra\Database\Tables;

/**
 * ScheduledPayments Table Class
 * 
 * Represents the scheduled payments table (wp_yatra_scheduled_payments) containing
 * automatic payment scheduling data including payment details, status tracking,
 * attempt management, and gateway integration.
 * 
 * This table follows the new simplified pattern with only two static methods:
 * - getTableName(): Returns the prefixed table name
 * - getSchema(): Returns the complete CREATE TABLE SQL statement
 * 
 * Usage:
 * ScheduledPaymentsTable::getTableName()  // Returns 'wp_yatra_scheduled_payments'
 * ScheduledPaymentsTable::getSchema()     // Returns complete SQL schema
 * 
 * @package Yatra\Database\Tables
 * @since 1.0.0
 */
class ScheduledPaymentsTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_scheduled_payments';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * Returns the full SQL schema for the scheduled payments table using heredoc syntax
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
    `customer_id` bigint(20) UNSIGNED DEFAULT NULL,
    `gateway` varchar(50) NOT NULL,
    `gateway_customer_id` varchar(255) DEFAULT NULL,
    `payment_token_id` bigint(20) UNSIGNED DEFAULT NULL,
    `amount` decimal(12,2) NOT NULL,
    `currency` char(3) DEFAULT 'USD',
    `scheduled_date` datetime NOT NULL,
    `status` enum('pending','processing','completed','failed','cancelled','skipped') DEFAULT 'pending',
    `payment_type` enum('deposit','partial','installment','final','recurring') DEFAULT 'partial',
    `attempt_count` tinyint(3) UNSIGNED DEFAULT 0,
    `max_attempts` tinyint(3) UNSIGNED DEFAULT 3,
    `last_attempt_at` datetime DEFAULT NULL,
    `last_error` text,
    `payment_id` bigint(20) UNSIGNED DEFAULT NULL,
    `notes` text,
    `metadata` longtext COMMENT 'JSON metadata',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    KEY `idx_booking_id` (`booking_id`),
    KEY `idx_status` (`status`),
    KEY `idx_scheduled_date` (`scheduled_date`),
    KEY `idx_gateway` (`gateway`),
    KEY `idx_status_date` (`status`, `scheduled_date`)
) {$charsetCollate} COMMENT='Scheduled automatic payments';
SQL;
    }
}
