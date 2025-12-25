<?php

namespace Yatra\Database\Tables;

/**
 * BookingPayments Table Class
 * 
 * Represents the booking payments table (wp_yatra_booking_payments) containing
 * comprehensive payment history data including transaction details, gateway
 * information, payment status, and processing timestamps.
 * 
 * This table follows the new simplified pattern with only two static methods:
 * - getTableName(): Returns the prefixed table name
 * - getSchema(): Returns the complete CREATE TABLE SQL statement
 * 
 * Usage:
 * BookingPaymentsTable::getTableName()  // Returns 'wp_yatra_booking_payments'
 * BookingPaymentsTable::getSchema()     // Returns complete SQL schema
 * 
 * @package Yatra\Database\Tables
 * @since 1.0.0
 */
class BookingPaymentsTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_booking_payments';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * Returns the full SQL schema for the booking payments table using heredoc syntax
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
    `transaction_id` varchar(255) DEFAULT NULL,
    `gateway` varchar(50) NOT NULL,
    `amount` decimal(12,2) NOT NULL,
    `currency` char(3) DEFAULT 'USD',
    `status` enum('pending','completed','failed','refunded','cancelled') DEFAULT 'pending',
    `payment_type` enum('initial','partial','final','refund') DEFAULT 'initial',
    `gateway_response` longtext COMMENT 'JSON gateway response data',
    `notes` text,
    `processed_at` datetime DEFAULT NULL,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    KEY `idx_booking_id` (`booking_id`),
    KEY `idx_customer_id` (`customer_id`),
    KEY `idx_transaction_id` (`transaction_id`),
    KEY `idx_status` (`status`),
    KEY `idx_created` (`created_at`)
) {$charsetCollate} COMMENT='Booking payment history';
SQL;
    }
}
