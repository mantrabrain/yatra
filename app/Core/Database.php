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

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql_trips);
    }

    /**
     * Drop database tables
     */
    public static function dropTables(): void
    {
        global $wpdb;

        $tables = [
            $wpdb->prefix . 'yatra_trips',
        ];

        foreach ($tables as $table) {
            $wpdb->query("DROP TABLE IF EXISTS `{$table}`");
        }
    }
}

