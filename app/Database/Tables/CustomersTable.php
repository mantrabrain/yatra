<?php

namespace Yatra\Database\Tables;

/**
 * Customers Table Class
 * 
 * Represents the customers CRM table (wp_yatra_customers) containing comprehensive
 * customer data including personal information, contact details, preferences,
 * loyalty program data, and payment gateway customer IDs.
 * 
 * This table follows the new simplified pattern with only two static methods:
 * - getTableName(): Returns the prefixed table name
 * - getSchema(): Returns the complete CREATE TABLE SQL statement
 * 
 * Usage:
 * CustomersTable::getTableName()  // Returns 'wp_yatra_customers'
 * CustomersTable::getSchema()     // Returns complete SQL schema
 * 
 * @package Yatra\Database\Tables
 * @since 1.0.0
 */
class CustomersTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_customers';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * Returns the full SQL schema for the customers table using heredoc syntax
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
    `user_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'WordPress user ID if registered',
    `first_name` varchar(100) NOT NULL,
    `last_name` varchar(100) DEFAULT NULL,
    `email` varchar(255) NOT NULL,
    `phone` varchar(50) DEFAULT NULL,
    `secondary_phone` varchar(50) DEFAULT NULL,
    `address` varchar(500) DEFAULT NULL,
    `city` varchar(100) DEFAULT NULL,
    `state` varchar(100) DEFAULT NULL,
    `country` varchar(100) DEFAULT NULL,
    `postal_code` varchar(20) DEFAULT NULL,
    `date_of_birth` date DEFAULT NULL,
    `gender` enum('male','female','other','prefer_not_to_say') DEFAULT NULL,
    `nationality` varchar(100) DEFAULT NULL,
    `passport_number` varchar(50) DEFAULT NULL,
    `passport_expiry` date DEFAULT NULL,
    `emergency_name` varchar(200) DEFAULT NULL,
    `emergency_phone` varchar(50) DEFAULT NULL,
    `emergency_relationship` varchar(100) DEFAULT NULL,
    `dietary_requirements` varchar(255) DEFAULT NULL,
    `medical_conditions` text,
    `special_needs` text,
    `preferred_language` varchar(10) DEFAULT 'en',
    `preferred_currency` char(3) DEFAULT 'USD',
    `communication_preferences` text COMMENT 'JSON: email, sms, whatsapp preferences',
    `newsletter_optin` tinyint(1) DEFAULT 0,
    `marketing_optin` tinyint(1) DEFAULT 0,
    `source` varchar(100) DEFAULT NULL COMMENT 'How they found us',
    `referral_code` varchar(50) DEFAULT NULL,
    `referred_by` bigint(20) UNSIGNED DEFAULT NULL,
    `total_bookings` int(11) UNSIGNED DEFAULT 0,
    `total_spent` decimal(12,2) DEFAULT 0,
    `total_travelers` int(11) UNSIGNED DEFAULT 0,
    `last_booking_date` date DEFAULT NULL,
    `last_travel_date` date DEFAULT NULL,
    `loyalty_points` int(11) UNSIGNED DEFAULT 0,
    `loyalty_tier` enum('bronze','silver','gold','platinum') DEFAULT 'bronze',
    `loyalty_tier_expiry` date DEFAULT NULL,
    `stripe_customer_id` varchar(255) DEFAULT NULL,
    `paypal_customer_id` varchar(255) DEFAULT NULL,
    `razorpay_customer_id` varchar(255) DEFAULT NULL,
    `status` enum('active','inactive','blocked') DEFAULT 'active',
    `notes` text COMMENT 'Internal notes about customer',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `last_login_at` datetime DEFAULT NULL,
    `verified_at` datetime DEFAULT NULL,
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_email` (`email`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_phone` (`phone`),
    KEY `idx_country` (`country`),
    KEY `idx_status` (`status`),
    KEY `idx_loyalty_tier` (`loyalty_tier`),
    KEY `idx_created` (`created_at`),
    KEY `idx_total_spent` (`total_spent`),
    KEY `idx_stripe_customer` (`stripe_customer_id`),
    KEY `idx_paypal_customer` (`paypal_customer_id`),
    KEY `idx_razorpay_customer` (`razorpay_customer_id`)
) {$charsetCollate} COMMENT='Customer CRM data';
SQL;
    }
}
