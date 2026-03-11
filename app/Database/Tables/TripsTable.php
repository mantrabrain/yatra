<?php

namespace Yatra\Database\Tables;

/**
 * Trips Table Class
 * 
 * Represents the main trips table (wp_yatra_trips) containing comprehensive trip data
 * including pricing, scheduling, location details, policies, and analytics.
 * 
 * This table follows the new simplified pattern with only two static methods:
 * - getTableName(): Returns the prefixed table name
 * - getSchema(): Returns the complete CREATE TABLE SQL statement
 * 
 * Usage:
 * TripsTable::getTableName()  // Returns 'wp_yatra_trips'
 * TripsTable::getSchema()     // Returns complete SQL schema
 * 
 * @package Yatra\Database\Tables
 * @since 1.0.0
 */
class TripsTable extends BaseTable
{
    /**
     * Table name without prefix
     * 
     * @var string The base table name without WordPress prefix
     */
    protected static string $table = 'yatra_new_trips';

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     * 
     * Returns the full SQL schema for the trips table using heredoc syntax
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
    
    -- IDENTIFICATION & BASIC INFO (Form Fields)
    `title` varchar(255) NOT NULL COMMENT 'Trip title',
    `slug` varchar(255) NOT NULL COMMENT 'URL-friendly identifier',
    `description` text COMMENT 'Full trip description',
    `short_description` varchar(500) DEFAULT NULL COMMENT 'Brief summary',
    `trip_details` longtext COMMENT 'Detailed itinerary overview',
    `what_makes_special` text COMMENT 'Unique selling points',
    `trip_story` longtext COMMENT 'Narrative/story format',
    
    -- LOCATION & GEOGRAPHY (Form Fields)
    `starting_location` varchar(255) DEFAULT NULL COMMENT 'Pickup/start point',
    `ending_location` varchar(255) DEFAULT NULL COMMENT 'Drop-off/end point',
    `starting_latitude` decimal(10,8) DEFAULT NULL COMMENT 'Starting location latitude',
    `starting_longitude` decimal(11,8) DEFAULT NULL COMMENT 'Starting location longitude',
    `ending_latitude` decimal(10,8) DEFAULT NULL COMMENT 'Ending location latitude',
    `ending_longitude` decimal(11,8) DEFAULT NULL COMMENT 'Ending location longitude',
    
    -- DURATION & SCHEDULE (Form Fields)
    `trip_type` varchar(50) DEFAULT 'multi_day',
    `duration_days` smallint(5) UNSIGNED DEFAULT NULL COMMENT 'Total days',
    `duration_nights` smallint(5) UNSIGNED DEFAULT NULL COMMENT 'Total nights',
    `available_from` date DEFAULT NULL COMMENT 'First available date',
    `available_to` date DEFAULT NULL COMMENT 'Last available date',
    `booking_window_days` smallint(5) UNSIGNED DEFAULT 30 COMMENT 'Days in advance to book',
    `booking_deadline_hours` smallint(5) UNSIGNED DEFAULT 24 COMMENT 'Hours before trip start',
    
    -- SEASONAL & AVAILABILITY (Form Fields)
    `seasonal_availability` varchar(100) DEFAULT NULL,
    `best_season` varchar(100) DEFAULT NULL,
    `peak_season` varchar(100) DEFAULT NULL,
    `off_season` varchar(100) DEFAULT NULL,
    `seasonal_auto_enable` tinyint(1) DEFAULT 0,
    `seasonal_enable_date` date DEFAULT NULL,
    `seasonal_disable_date` date DEFAULT NULL,
    
    -- CATEGORIZATION (Form Fields)
    `difficulty_level` bigint(20) UNSIGNED DEFAULT NULL,
    `featured_priority` varchar(50) DEFAULT 'none',
    
    -- PRICING (Form Fields)
    `pricing_type` varchar(50) DEFAULT 'regular',
    `original_price` decimal(10,2) DEFAULT 0.00,
    `discounted_price` decimal(10,2) DEFAULT NULL,
    `sale_price` decimal(10,2) DEFAULT NULL,
    `deposit_amount` decimal(10,2) DEFAULT NULL,
    `deposit_percentage` decimal(5,2) DEFAULT NULL,
    `payment_terms` text,
    
    -- BOOKING SETTINGS (Form Fields)
    `min_travelers` smallint(5) UNSIGNED DEFAULT 1,
    `max_travelers` smallint(5) UNSIGNED DEFAULT NULL,
    
    -- REQUIREMENTS (Form Fields)
    `age_min` tinyint(3) UNSIGNED DEFAULT NULL,
    `age_max` tinyint(3) UNSIGNED DEFAULT NULL,
    `physical_requirements` text,
    `visa_requirements` text,
    `vaccination_requirements` text,
    
    -- POLICIES (Form Fields)
    `cancellation_policy` text,
    
    -- ACCOMMODATION (Form Fields)
    `accommodation_type` varchar(100) DEFAULT NULL,
    `meal_plan` varchar(50) DEFAULT NULL,
    `accommodation_details` text,
    
    -- TRANSPORTATION (Form Fields)
    `transportation_included` tinyint(1) DEFAULT 0,
    `pickup_location` varchar(255) DEFAULT NULL,
    `dropoff_location` varchar(255) DEFAULT NULL,
    `transportation_details` text,
    
    -- MEDIA (Form Fields)
    `featured_image` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'WordPress attachment ID',
    `video_url` varchar(500) DEFAULT NULL,
    `virtual_tour_url` varchar(500) DEFAULT NULL,
    `testimonial_review_ids` text COMMENT 'JSON array of review IDs to display as testimonials',
    
    -- SEO (Form Fields)
    `meta_title` varchar(255) DEFAULT NULL,
    `meta_description` text,
    `meta_keywords` text,
    
    -- STATUS & LIFECYCLE (Form Fields)
    `status` varchar(50) DEFAULT 'draft',
    `scheduled_publish_date` datetime DEFAULT NULL,
    `scheduled_unpublish_date` datetime DEFAULT NULL,
    `version` int(11) UNSIGNED DEFAULT 1,
    
    -- SYSTEM FIELDS (Auto-managed)
    `is_featured` tinyint(1) DEFAULT 0,
    `views_count` int(11) UNSIGNED DEFAULT 0,
    `bookings_count` int(11) UNSIGNED DEFAULT 0,
    `revenue_total` decimal(12,2) DEFAULT 0.00,
    `avg_rating` decimal(3,2) DEFAULT 0.00,
    `reviews_count` int(11) UNSIGNED DEFAULT 0,
    `last_viewed_at` datetime DEFAULT NULL,
    `last_booked_at` datetime DEFAULT NULL,
    
    -- JSON STORAGE (For simple array data from form)
    `included_items` text COMMENT 'JSON array of objects with title and description',
    `excluded_items` text COMMENT 'JSON array of objects with title and description',
    `price_types` text COMMENT 'JSON array for traveler-based pricing',
    `frontend_tabs` text COMMENT 'JSON array for frontend tab configuration',
    `custom_fields` text COMMENT 'JSON object for custom metadata and future extensibility',
    
    -- TIMESTAMPS & AUDIT
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
    `updated_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
    `deleted_at` datetime DEFAULT NULL COMMENT 'Soft delete',
    `deleted_by` bigint(20) UNSIGNED DEFAULT NULL,
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_slug` (`slug`),
    KEY `idx_status` (`status`),
    KEY `idx_trip_type` (`trip_type`),
    KEY `idx_featured_priority` (`featured_priority`),
    KEY `idx_created_at` (`created_at`),
    KEY `idx_updated_at` (`updated_at`),
    KEY `idx_price` (`original_price`),
    KEY `idx_duration_days` (`duration_days`),
    KEY `idx_difficulty_level` (`difficulty_level`),
    KEY `idx_is_featured` (`is_featured`),
    KEY `idx_views_count` (`views_count`),
    KEY `idx_bookings_count` (`bookings_count`),
    KEY `idx_avg_rating` (`avg_rating`),
    KEY `idx_deleted_at` (`deleted_at`),
    KEY `idx_featured_image` (`featured_image`),
    KEY `idx_starting_latitude` (`starting_latitude`),
    KEY `idx_starting_longitude` (`starting_longitude`),
    KEY `idx_ending_latitude` (`ending_latitude`),
    KEY `idx_ending_longitude` (`ending_longitude`)
) {$charsetCollate} COMMENT='Optimized trips table with only used fields';
SQL;
    }
}
