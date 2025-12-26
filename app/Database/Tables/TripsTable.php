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
    
    -- IDENTIFICATION & BASIC INFO
    `title` varchar(255) NOT NULL COMMENT 'Trip title',
    `slug` varchar(255) NOT NULL COMMENT 'URL-friendly identifier',
    `trip_code` varchar(50) DEFAULT NULL COMMENT 'Internal trip code',
    `description` text COMMENT 'Full trip description',
    `short_description` varchar(500) DEFAULT NULL COMMENT 'Brief summary',
    `trip_details` longtext COMMENT 'Detailed itinerary overview',
    `what_makes_special` text COMMENT 'Unique selling points',
    `trip_story` longtext COMMENT 'Narrative/story format',
    `excerpt` varchar(300) DEFAULT NULL COMMENT 'Meta description excerpt',
    
    -- LOCATION & GEOGRAPHY
    `starting_location` varchar(255) DEFAULT NULL COMMENT 'Pickup/start point',
    `ending_location` varchar(255) DEFAULT NULL COMMENT 'Drop-off/end point',
    `latitude` decimal(10,8) DEFAULT NULL COMMENT 'Map center latitude',
    `longitude` decimal(11,8) DEFAULT NULL COMMENT 'Map center longitude',
    `map_zoom_level` tinyint(3) DEFAULT 10 COMMENT 'Default map zoom',
    `timezone` varchar(50) DEFAULT NULL COMMENT 'Destination timezone',
    `country_code` char(2) DEFAULT NULL COMMENT 'ISO 3166-1 alpha-2',
    
    -- DURATION & SCHEDULE
    `trip_type` enum('single_day','multi_day','flexible') DEFAULT 'multi_day',
    `duration_days` smallint(5) UNSIGNED DEFAULT NULL COMMENT 'Total days',
    `duration_nights` smallint(5) UNSIGNED DEFAULT NULL COMMENT 'Total nights',
    `duration_hours` smallint(5) UNSIGNED DEFAULT NULL COMMENT 'For single-day trips',
    `available_from` date DEFAULT NULL COMMENT 'First available date',
    `available_to` date DEFAULT NULL COMMENT 'Last available date',
    `booking_window_days` smallint(5) UNSIGNED DEFAULT 30 COMMENT 'Days in advance to book',
    `booking_deadline_hours` smallint(5) UNSIGNED DEFAULT 24 COMMENT 'Hours before trip start',
    `flexible_dates` tinyint(1) DEFAULT 0 COMMENT 'Can book any date in range',
    `fixed_departures_only` tinyint(1) DEFAULT 0 COMMENT 'Only specific departure dates',
    
    -- SEASONAL & AVAILABILITY
    `seasonal_availability` varchar(100) DEFAULT NULL,
    `best_season` varchar(100) DEFAULT NULL,
    `peak_season` varchar(100) DEFAULT NULL,
    `off_season` varchar(100) DEFAULT NULL,
    `seasonal_auto_enable` tinyint(1) DEFAULT 0,
    `seasonal_enable_date` date DEFAULT NULL,
    `seasonal_disable_date` date DEFAULT NULL,
    `blackout_dates` text COMMENT 'JSON array of unavailable dates',
    
    -- CATEGORIZATION & CLASSIFICATION
    `trip_category` varchar(100) DEFAULT NULL,
    `trip_category_parent` varchar(100) DEFAULT NULL,
    `trip_category_sub` varchar(100) DEFAULT NULL,
    `difficulty_level` bigint(20) UNSIGNED DEFAULT NULL,
    `activity_intensity` enum('relaxing','light','moderate','active','strenuous') DEFAULT NULL,
    `featured_priority` enum('none','featured','popular','new','limited','bestseller') DEFAULT 'none',
    `trip_style` varchar(50) DEFAULT NULL,
    `group_type` enum('private','shared','both') DEFAULT 'both',
    
    -- PRICING (CORE BUSINESS LOGIC)
    `pricing_type` enum('regular','traveler_based','dynamic','custom') DEFAULT 'regular',
    `original_price` decimal(10,2) DEFAULT 0.00,
    `discounted_price` decimal(10,2) DEFAULT NULL,
    `sale_price` decimal(10,2) DEFAULT NULL,
    `currency` char(3) DEFAULT 'USD',
    `price_per_person` tinyint(1) DEFAULT 1,
    `deposit_required` tinyint(1) DEFAULT 0,
    `deposit_amount` decimal(10,2) DEFAULT NULL,
    `deposit_percentage` decimal(5,2) DEFAULT NULL,
    `payment_terms` text,
    `payment_plans_enabled` tinyint(1) DEFAULT 0,
    `tax_included` tinyint(1) DEFAULT 0,
    `tax_rate` decimal(5,2) DEFAULT NULL,
    `service_charge` decimal(10,2) DEFAULT NULL,
    `service_charge_percentage` decimal(5,2) DEFAULT NULL,
    
    -- Group Pricing
    `group_pricing_enabled` tinyint(1) DEFAULT 0,
    `group_size_min` smallint(5) UNSIGNED DEFAULT NULL,
    `group_size_max` smallint(5) UNSIGNED DEFAULT NULL,
    `group_discount_type` enum('percentage','fixed','tiered') DEFAULT 'percentage',
    `group_discount_percentage` decimal(5,2) DEFAULT NULL,
    `group_discount_amount` decimal(10,2) DEFAULT NULL,
    
    -- Early Bird / Last Minute
    `early_bird_discount_enabled` tinyint(1) DEFAULT 0,
    `early_bird_days` smallint(5) UNSIGNED DEFAULT NULL,
    `early_bird_discount` decimal(5,2) DEFAULT NULL,
    `last_minute_discount_enabled` tinyint(1) DEFAULT 0,
    `last_minute_days` smallint(5) UNSIGNED DEFAULT NULL,
    `last_minute_discount` decimal(5,2) DEFAULT NULL,
    
    -- BOOKING SETTINGS & CAPACITY
    `min_travelers` smallint(5) UNSIGNED DEFAULT 1,
    `max_travelers` smallint(5) UNSIGNED DEFAULT NULL,
    `max_travelers_per_booking` smallint(5) UNSIGNED DEFAULT NULL,
    `waitlist_enabled` tinyint(1) DEFAULT 0,
    `waitlist_capacity` smallint(5) UNSIGNED DEFAULT NULL,
    `instant_booking` tinyint(1) DEFAULT 1,
    `requires_approval` tinyint(1) DEFAULT 0,
    `booking_confirmation_email` tinyint(1) DEFAULT 1,
    `booking_reminder_email` tinyint(1) DEFAULT 1,
    `reminder_days_before` smallint(5) UNSIGNED DEFAULT 7,
    
    -- REQUIREMENTS & RESTRICTIONS
    `age_min` tinyint(3) UNSIGNED DEFAULT NULL,
    `age_max` tinyint(3) UNSIGNED DEFAULT NULL,
    `physical_requirements` text,
    `medical_requirements` text,
    `visa_requirements` text,
    `vaccination_requirements` text,
    `passport_validity_months` tinyint(3) UNSIGNED DEFAULT 6,
    `travel_insurance_required` tinyint(1) DEFAULT 0,
    `special_equipment` text,
    
    -- POLICIES
    `cancellation_policy` text,
    `refund_policy` text,
    `change_policy` text,
    `weather_policy` text,
    `force_majeure_policy` text,
    `terms_conditions` longtext,
    
    -- ACCOMMODATION
    `accommodation_type` varchar(100) DEFAULT NULL,
    `accommodation_standard` enum('budget','standard','comfort','luxury','premium') DEFAULT NULL,
    `meal_plan` enum('none','breakfast','half_board','full_board','all_inclusive') DEFAULT NULL,
    `accommodation_details` text,
    `accommodation_included` tinyint(1) DEFAULT 1,
    
    -- TRANSPORTATION
    `transportation_included` tinyint(1) DEFAULT 0,
    `pickup_location` varchar(255) DEFAULT NULL,
    `pickup_location_lat` decimal(10,8) DEFAULT NULL,
    `pickup_location_lng` decimal(11,8) DEFAULT NULL,
    `dropoff_location` varchar(255) DEFAULT NULL,
    `dropoff_location_lat` decimal(10,8) DEFAULT NULL,
    `dropoff_location_lng` decimal(11,8) DEFAULT NULL,
    `transportation_details` text,
    `internal_transportation` text,
    `international_flights_included` tinyint(1) DEFAULT 0,
    `domestic_flights_included` tinyint(1) DEFAULT 0,
    
    -- MEDIA & MARKETING
    `featured_image_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'WordPress attachment ID',
    `featured_image_url` varchar(500) DEFAULT NULL,
    `video_url` varchar(500) DEFAULT NULL,
    `virtual_tour_url` varchar(500) DEFAULT NULL,
    `promo_video_url` varchar(500) DEFAULT NULL,
    `social_share_image_id` bigint(20) UNSIGNED DEFAULT NULL,
    
    -- SEO & METADATA
    `meta_title` varchar(255) DEFAULT NULL,
    `meta_description` text,
    `meta_keywords` text,
    `og_title` varchar(255) DEFAULT NULL,
    `og_description` text,
    `og_image_id` bigint(20) UNSIGNED DEFAULT NULL,
    `schema_markup` text COMMENT 'JSON-LD structured data',
    
    -- STATUS & LIFECYCLE
    `status` enum('draft','review','approved','published','archived','suspended') DEFAULT 'draft',
    `scheduled_publish_date` datetime DEFAULT NULL,
    `scheduled_unpublish_date` datetime DEFAULT NULL,
    `published_at` datetime DEFAULT NULL,
    `version` int(11) UNSIGNED DEFAULT 1,
    `is_featured` tinyint(1) DEFAULT 0,
    `featured_order` int(11) DEFAULT 0,
    `sort_order` int(11) DEFAULT 0,
    
    -- ANALYTICS & TRACKING
    `views_count` int(11) UNSIGNED DEFAULT 0,
    `bookings_count` int(11) UNSIGNED DEFAULT 0,
    `revenue_total` decimal(12,2) DEFAULT 0.00,
    `conversion_rate` decimal(5,2) DEFAULT 0.00,
    `avg_rating` decimal(3,2) DEFAULT 0.00,
    `reviews_count` int(11) UNSIGNED DEFAULT 0,
    `last_viewed_at` datetime DEFAULT NULL,
    `last_booked_at` datetime DEFAULT NULL,
    
    -- COMPLEX DATA (JSON STORAGE)
    `highlights` text COMMENT 'JSON array',
    `testimonials` text COMMENT 'JSON array',
    `countries` text COMMENT 'JSON array',
    `regions` text COMMENT 'JSON array',
    `landmarks` text COMMENT 'JSON array',
    `tags` text COMMENT 'JSON array',
    `included_items` text COMMENT 'JSON array of objects with title and description',
    `excluded_items` text COMMENT 'JSON array of objects with title and description',
    `gallery_images` text COMMENT 'JSON array',
    `price_types` text COMMENT 'JSON array for traveler-based pricing',
    `itinerary_days` text COMMENT 'JSON array',
    `faqs` text COMMENT 'JSON array',
    `frontend_tabs` text COMMENT 'JSON array',
    `availability_dates` text COMMENT 'JSON array',
    `custom_fields` text COMMENT 'JSON object for extensibility',
    `pricing_rules` text COMMENT 'JSON object',
    `booking_rules` text COMMENT 'JSON object',
    
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
    KEY `idx_created_by` (`created_by`),
    KEY `idx_updated_by` (`updated_by`),
    KEY `idx_price` (`original_price`),
    KEY `idx_duration_days` (`duration_days`),
    KEY `idx_difficulty_level` (`difficulty_level`),
    KEY `idx_trip_category` (`trip_category`),
    KEY `idx_is_featured` (`is_featured`),
    KEY `idx_sort_order` (`sort_order`),
    KEY `idx_views_count` (`views_count`),
    KEY `idx_bookings_count` (`bookings_count`),
    KEY `idx_avg_rating` (`avg_rating`),
    KEY `idx_reviews_count` (`reviews_count`),
    KEY `idx_deleted_at` (`deleted_at`),
    KEY `idx_featured_image_id` (`featured_image_id`),
    KEY `idx_social_share_image_id` (`social_share_image_id`),
    KEY `idx_og_image_id` (`og_image_id`)
) {$charsetCollate} COMMENT='Trips main table with comprehensive trip data';
SQL;
    }
}
