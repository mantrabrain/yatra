<?php

declare(strict_types=1);

namespace Yatra\Core;

/**
 * Database Management
 * Handles table creation and updates
 */
class Database
{
    /**
     * Create database tables
     */
    public static function createTables(): void
    {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        // Trips table
        $table_trips = $wpdb->prefix . 'yatra_trips';
        
        $sql_trips = "CREATE TABLE IF NOT EXISTS `{$table_trips}` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `title` varchar(255) NOT NULL,
            `slug` varchar(255) NOT NULL,
            `description` text,
            `price` decimal(10,2) DEFAULT 0.00,
            `status` varchar(20) DEFAULT 'draft',
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `slug` (`slug`),
            KEY `status` (`status`)
        ) {$charset_collate};";

        // Activities table
        $table_activities = $wpdb->prefix . 'yatra_activities';
        
        $sql_activities = "CREATE TABLE IF NOT EXISTS `{$table_activities}` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `slug` varchar(255) NOT NULL,
            `description` text,
            `icon` text,
            `status` varchar(20) DEFAULT 'draft',
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            `created_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            `updated_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            PRIMARY KEY (`id`),
            UNIQUE KEY `slug` (`slug`),
            KEY `status` (`status`),
            KEY `created_by` (`created_by`),
            KEY `updated_by` (`updated_by`)
        ) {$charset_collate};";

        // Destinations table
        $table_destinations = $wpdb->prefix . 'yatra_destinations';
        
        $sql_destinations = "CREATE TABLE IF NOT EXISTS `{$table_destinations}` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `slug` varchar(255) NOT NULL,
            `description` text,
            `icon` text,
            `status` varchar(20) DEFAULT 'draft',
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            `created_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            `updated_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            PRIMARY KEY (`id`),
            UNIQUE KEY `slug` (`slug`),
            KEY `status` (`status`),
            KEY `created_by` (`created_by`),
            KEY `updated_by` (`updated_by`)
        ) {$charset_collate};";

        // Traveler Categories table
        $table_traveler_categories = $wpdb->prefix . 'yatra_traveler_categories';
        
        $sql_traveler_categories = "CREATE TABLE IF NOT EXISTS `{$table_traveler_categories}` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `label` varchar(255) NOT NULL,
            `slug` varchar(255) NOT NULL,
            `description` text,
            `age_min` int(11) DEFAULT NULL,
            `age_max` int(11) DEFAULT NULL,
            `icon` text,
            `status` varchar(20) DEFAULT 'draft',
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            `created_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            `updated_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            PRIMARY KEY (`id`),
            UNIQUE KEY `slug` (`slug`),
            KEY `status` (`status`),
            KEY `created_by` (`created_by`),
            KEY `updated_by` (`updated_by`)
        ) {$charset_collate};";

        // Item Types table
        $table_item_types = $wpdb->prefix . 'yatra_item_types';
        
        $sql_item_types = "CREATE TABLE IF NOT EXISTS `{$table_item_types}` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `slug` varchar(255) NOT NULL,
            `description` text,
            `icon` text,
            `color` varchar(50) DEFAULT 'blue',
            `status` varchar(20) DEFAULT 'draft',
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            `created_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            `updated_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            PRIMARY KEY (`id`),
            UNIQUE KEY `slug` (`slug`),
            KEY `status` (`status`),
            KEY `created_by` (`created_by`),
            KEY `updated_by` (`updated_by`)
        ) {$charset_collate};";

        // Items table (Item Subtypes)
        $table_items = $wpdb->prefix . 'yatra_items';
        
        $sql_items = "CREATE TABLE IF NOT EXISTS `{$table_items}` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `slug` varchar(255) NOT NULL,
            `description` text,
            `type_id` bigint(20) UNSIGNED NOT NULL,
            `status` varchar(20) DEFAULT 'draft',
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            `created_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            `updated_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            PRIMARY KEY (`id`),
            UNIQUE KEY `slug` (`slug`),
            KEY `type_id` (`type_id`),
            KEY `status` (`status`),
            KEY `created_by` (`created_by`),
            KEY `updated_by` (`updated_by`)
        ) {$charset_collate};";

        // Discounts table
        $table_discounts = $wpdb->prefix . 'yatra_discounts';
        
        $sql_discounts = "CREATE TABLE IF NOT EXISTS `{$table_discounts}` (
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
            `min_group_size` int(11) DEFAULT NULL,
            `group_discount_type` varchar(20) DEFAULT 'percentage',
            `group_discount_amount` decimal(10,2) DEFAULT NULL,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            `created_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            `updated_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            PRIMARY KEY (`id`),
            UNIQUE KEY `code` (`code`),
            KEY `status` (`status`),
            KEY `type` (`type`),
            KEY `expiry_date` (`expiry_date`),
            KEY `created_by` (`created_by`),
            KEY `updated_by` (`updated_by`)
        ) {$charset_collate};";

        // Trip Revisions table
        $table_trip_revisions = $wpdb->prefix . 'yatra_trip_revisions';
        
        $sql_trip_revisions = "CREATE TABLE IF NOT EXISTS `{$table_trip_revisions}` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `trip_id` bigint(20) UNSIGNED NOT NULL,
            `version` int(11) NOT NULL DEFAULT 1,
            `data` longtext NOT NULL,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `created_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            PRIMARY KEY (`id`),
            KEY `trip_id` (`trip_id`),
            KEY `version` (`version`),
            KEY `created_at` (`created_at`),
            KEY `created_by` (`created_by`)
        ) {$charset_collate};";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql_trips);
        dbDelta($sql_activities);
        dbDelta($sql_destinations);
        dbDelta($sql_traveler_categories);
        dbDelta($sql_item_types);
        dbDelta($sql_items);
        dbDelta($sql_discounts);
        dbDelta($sql_trip_revisions);
    }

    /**
     * Drop database tables
     */
    public static function dropTables(): void
    {
        global $wpdb;

        $tables = [
            $wpdb->prefix . 'yatra_trips',
            $wpdb->prefix . 'yatra_activities',
            $wpdb->prefix . 'yatra_destinations',
            $wpdb->prefix . 'yatra_traveler_categories',
            $wpdb->prefix . 'yatra_item_types',
            $wpdb->prefix . 'yatra_items',
            $wpdb->prefix . 'yatra_discounts',
            $wpdb->prefix . 'yatra_trip_revisions',
        ];

        foreach ($tables as $table) {
            $wpdb->query("DROP TABLE IF EXISTS `{$table}`");
        }
    }
}

