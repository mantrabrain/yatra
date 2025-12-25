<?php

namespace Yatra\Database\Tables;

/**
 * PaymentTokens Table Class
 * 
 * Represents the payment tokens table (wp_yatra_payment_tokens) containing
 * saved payment method data including gateway information, card details,
 * token types, and customer payment preferences.
 * 
 * This table follows the new simplified pattern with only two static methods:
 * - getTableName(): Returns the prefixed table name
 * - getSchema(): Returns the complete CREATE TABLE SQL statement
 * 
 * Usage:
 * PaymentTokensTable::getTableName()  // Returns 'wp_yatra_payment_tokens'
 * PaymentTokensTable::getSchema()     // Returns complete SQL schema
 * 
 * @package Yatra\Database\Tables
 * @since 1.0.0
 */
class PaymentTokensTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_payment_tokens';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * Returns the full SQL schema for the payment tokens table using heredoc syntax
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
    `customer_id` bigint(20) UNSIGNED NOT NULL,
    `gateway` varchar(50) NOT NULL,
    `gateway_customer_id` varchar(255) NOT NULL,
    `gateway_payment_method_id` varchar(255) NOT NULL,
    `token_type` enum('card','bank_account','paypal','wallet','other') DEFAULT 'card',
    `card_brand` varchar(20) DEFAULT NULL,
    `card_last4` char(4) DEFAULT NULL,
    `card_exp_month` tinyint(2) UNSIGNED DEFAULT NULL,
    `card_exp_year` smallint(4) UNSIGNED DEFAULT NULL,
    `is_default` tinyint(1) DEFAULT 0,
    `is_active` tinyint(1) DEFAULT 1,
    `metadata` longtext COMMENT 'JSON metadata from gateway',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    KEY `idx_customer_id` (`customer_id`),
    KEY `idx_gateway` (`gateway`),
    KEY `idx_customer_gateway` (`customer_id`, `gateway`),
    KEY `idx_is_default` (`customer_id`, `is_default`)
) {$charsetCollate} COMMENT='Saved payment methods';
SQL;
    }
}
