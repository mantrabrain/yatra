-- Complete Services Schema for Yatra
-- Run this SQL to create/recreate both services tables with correct structure

-- ============================================
-- DROP EXISTING TABLES (if they exist)
-- ============================================
DROP TABLE IF EXISTS `wp_yatra_trip_services`;
DROP TABLE IF EXISTS `wp_yatra_additional_services`;

-- ============================================
-- MASTER SERVICES TABLE
-- All service data stored here
-- ============================================
CREATE TABLE `wp_yatra_additional_services` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `price_type` enum('fixed','percentage') NOT NULL DEFAULT 'fixed',
  `price_per` enum('person','booking','day') NOT NULL DEFAULT 'person',
  `icon` text DEFAULT NULL,
  `status` enum('publish','draft','trash') NOT NULL DEFAULT 'draft',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `applicable_to` enum('all','specific_trips') NOT NULL DEFAULT 'all',
  `is_required` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `status` (`status`),
  KEY `sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- ============================================
-- RELATIONSHIP TABLE
-- Links trips to services (minimal - just IDs)
-- ============================================
CREATE TABLE `wp_yatra_trip_services` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `trip_id` bigint(20) unsigned NOT NULL,
  `service_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `trip_service` (`trip_id`, `service_id`),
  KEY `trip_id` (`trip_id`),
  KEY `service_id` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
