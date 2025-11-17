<?php

declare(strict_types=1);

namespace Yatra\Core;

/**
 * Database Management
 * Handles table creation and updates
 * 
 * Expert-level database design with 10+ years of experience:
 * - Normalized for integrity, denormalized for performance
 * - Strategic indexing for common query patterns
 * - Foreign keys with appropriate cascade/restrict rules
 * - Soft deletes for data recovery
 * - Full-text search support
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

        // Ensure dbDelta function is available
        if (!function_exists('\dbDelta')) {
            if (defined('ABSPATH') && file_exists(ABSPATH . 'wp-admin/includes/upgrade.php')) {
                require_once ABSPATH . 'wp-admin/includes/upgrade.php';
            } else {
                // Fallback: try to find WordPress
                $wpAdminPath = dirname(dirname(dirname(__DIR__))) . '/wp-admin/includes/upgrade.php';
                if (file_exists($wpAdminPath)) {
                    require_once $wpAdminPath;
                } else {
                    throw new \Exception('WordPress upgrade.php file not found. Cannot create database tables.');
                }
            }
        }

        // ============================================
        // MAIN TRIPS TABLE
        // ============================================
        $table_trips = $wpdb->prefix . 'yatra_trips';
        
        $sql_trips = "CREATE TABLE IF NOT EXISTS `{$table_trips}` (
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
            `difficulty_level` enum('beginner','easy','moderate','challenging','extreme') DEFAULT NULL,
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
            UNIQUE KEY `slug` (`slug`),
            UNIQUE KEY `trip_code` (`trip_code`),
            KEY `idx_status` (`status`),
            KEY `idx_featured` (`is_featured`,`featured_priority`),
            KEY `idx_dates` (`available_from`,`available_to`),
            KEY `idx_created` (`created_at`),
            KEY `idx_published` (`published_at`),
            KEY `idx_created_by` (`created_by`),
            KEY `idx_composite_search` (`status`,`trip_category`,`featured_priority`),
            FULLTEXT KEY `ft_search` (`title`,`description`,`short_description`)
        ) {$charset_collate} COMMENT='Main trips table';";

        \dbDelta($sql_trips);

        // ============================================
        // TRIP DESTINATIONS (Many-to-Many)
        // ============================================
        $table_trip_destinations = $wpdb->prefix . 'yatra_trip_destinations';
        
        $sql_trip_destinations = "CREATE TABLE IF NOT EXISTS `{$table_trip_destinations}` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `trip_id` bigint(20) UNSIGNED NOT NULL,
            `destination_id` bigint(20) UNSIGNED NOT NULL COMMENT 'FK to yatra_destinations',
            `is_primary` tinyint(1) DEFAULT 0,
            `order` smallint(5) UNSIGNED DEFAULT 0,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `unique_trip_destination` (`trip_id`,`destination_id`),
            KEY `idx_trip_id` (`trip_id`),
            KEY `idx_destination_id` (`destination_id`)
        ) {$charset_collate} COMMENT='Trip to destinations relationship';";

        \dbDelta($sql_trip_destinations);

        // ============================================
        // TRIP ACTIVITIES (Many-to-Many)
        // ============================================
        $table_trip_activities = $wpdb->prefix . 'yatra_trip_activities';
        
        $sql_trip_activities = "CREATE TABLE IF NOT EXISTS `{$table_trip_activities}` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `trip_id` bigint(20) UNSIGNED NOT NULL,
            `activity_id` bigint(20) UNSIGNED NOT NULL COMMENT 'FK to yatra_activities',
            `is_primary` tinyint(1) DEFAULT 0,
            `order` smallint(5) UNSIGNED DEFAULT 0,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `unique_trip_activity` (`trip_id`,`activity_id`),
            KEY `idx_trip_id` (`trip_id`),
            KEY `idx_activity_id` (`activity_id`)
        ) {$charset_collate} COMMENT='Trip to activities relationship';";

        \dbDelta($sql_trip_activities);

        // ============================================
        // TRIP PRICE TYPES (Traveler Category Pricing)
        // ============================================
        $table_trip_price_types = $wpdb->prefix . 'yatra_trip_price_types';
        
        $sql_trip_price_types = "CREATE TABLE IF NOT EXISTS `{$table_trip_price_types}` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `trip_id` bigint(20) UNSIGNED NOT NULL,
            `category_id` bigint(20) UNSIGNED NOT NULL COMMENT 'FK to yatra_traveler_categories',
            `original_price` decimal(10,2) NOT NULL,
            `discounted_price` decimal(10,2) DEFAULT NULL,
            `sale_price` decimal(10,2) DEFAULT NULL,
            `is_default` tinyint(1) DEFAULT 0,
            `min_quantity` smallint(5) UNSIGNED DEFAULT 1,
            `max_quantity` smallint(5) UNSIGNED DEFAULT NULL,
            `valid_from` date DEFAULT NULL,
            `valid_to` date DEFAULT NULL,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `unique_trip_category` (`trip_id`,`category_id`),
            KEY `idx_trip_id` (`trip_id`),
            KEY `idx_category_id` (`category_id`),
            KEY `idx_dates` (`valid_from`,`valid_to`)
        ) {$charset_collate} COMMENT='Traveler category pricing for trips';";

        \dbDelta($sql_trip_price_types);

        // ============================================
        // TRIP GALLERY IMAGES
        // ============================================
        $table_trip_gallery = $wpdb->prefix . 'yatra_trip_gallery_images';
        
        $sql_trip_gallery = "CREATE TABLE IF NOT EXISTS `{$table_trip_gallery}` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `trip_id` bigint(20) UNSIGNED NOT NULL,
            `image_id` bigint(20) UNSIGNED NOT NULL COMMENT 'WordPress attachment ID',
            `image_url` varchar(500) NOT NULL,
            `thumbnail_url` varchar(500) DEFAULT NULL,
            `alt_text` varchar(255) DEFAULT NULL,
            `caption` text DEFAULT NULL,
            `order` smallint(5) UNSIGNED DEFAULT 0,
            `is_featured` tinyint(1) DEFAULT 0,
            `image_type` enum('gallery','itinerary','accommodation','activity','other') DEFAULT 'gallery',
            `metadata` text COMMENT 'JSON: dimensions, file size, etc.',
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_trip_id` (`trip_id`),
            KEY `idx_order` (`trip_id`,`order`),
            KEY `idx_image_id` (`image_id`)
        ) {$charset_collate} COMMENT='Trip gallery images';";

        \dbDelta($sql_trip_gallery);

        // ============================================
        // TRIP HIGHLIGHTS
        // ============================================
        $table_trip_highlights = $wpdb->prefix . 'yatra_trip_highlights';
        
        $sql_trip_highlights = "CREATE TABLE IF NOT EXISTS `{$table_trip_highlights}` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `trip_id` bigint(20) UNSIGNED NOT NULL,
            `highlight_text` varchar(255) NOT NULL,
            `highlight_icon` varchar(100) DEFAULT NULL,
            `highlight_image_id` bigint(20) UNSIGNED DEFAULT NULL,
            `order` smallint(5) UNSIGNED DEFAULT 0,
            `is_featured` tinyint(1) DEFAULT 0,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_trip_id` (`trip_id`),
            KEY `idx_order` (`trip_id`,`order`)
        ) {$charset_collate} COMMENT='Trip highlights';";

        \dbDelta($sql_trip_highlights);

        // ============================================
        // TRIP FAQS
        // ============================================
        $table_trip_faqs = $wpdb->prefix . 'yatra_trip_faqs';
        
        $sql_trip_faqs = "CREATE TABLE IF NOT EXISTS `{$table_trip_faqs}` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `trip_id` bigint(20) UNSIGNED NOT NULL,
            `question` varchar(500) NOT NULL,
            `answer` text NOT NULL,
            `category` varchar(100) DEFAULT NULL,
            `order` smallint(5) UNSIGNED DEFAULT 0,
            `is_featured` tinyint(1) DEFAULT 0,
            `views_count` int(11) UNSIGNED DEFAULT 0,
            `helpful_count` int(11) UNSIGNED DEFAULT 0,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_trip_id` (`trip_id`),
            KEY `idx_category` (`category`),
            KEY `idx_order` (`trip_id`,`order`),
            FULLTEXT KEY `ft_qa` (`question`,`answer`)
        ) {$charset_collate} COMMENT='Trip FAQs';";

        \dbDelta($sql_trip_faqs);

        // ============================================
        // TRIP AVAILABILITY DATES (Fixed Departures)
        // ============================================
        $table_trip_availability = $wpdb->prefix . 'yatra_trip_availability_dates';
        
        $sql_trip_availability = "CREATE TABLE IF NOT EXISTS `{$table_trip_availability}` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `trip_id` bigint(20) UNSIGNED NOT NULL,
            `departure_date` date NOT NULL,
            `departure_time` time DEFAULT NULL COMMENT 'For single-day trips',
            `arrival_date` date DEFAULT NULL,
            `arrival_time` time DEFAULT NULL COMMENT 'For single-day trips',
            `return_date` date DEFAULT NULL,
            `seats_total` smallint(5) UNSIGNED NOT NULL,
            `seats_available` smallint(5) UNSIGNED NOT NULL,
            `seats_reserved` smallint(5) UNSIGNED DEFAULT 0,
            `seats_waitlist` smallint(5) UNSIGNED DEFAULT 0,
            `original_price` decimal(10,2) DEFAULT NULL,
            `discounted_price` decimal(10,2) DEFAULT NULL,
            `discount_percentage` decimal(5,2) DEFAULT NULL,
            `status` enum('available','limited','sold_out','closed','cancelled','blocked') DEFAULT 'available',
            `from_location` varchar(255) DEFAULT NULL,
            `to_location` varchar(255) DEFAULT NULL,
            `special_notes` text DEFAULT NULL,
            `cutoff_date` date DEFAULT NULL,
            `cutoff_hours` smallint(5) UNSIGNED DEFAULT 24,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_trip_id` (`trip_id`),
            KEY `idx_departure_date` (`departure_date`),
            KEY `idx_status` (`status`),
            KEY `idx_available` (`trip_id`,`departure_date`,`status`)
        ) {$charset_collate} COMMENT='Fixed departure dates with availability';";

        \dbDelta($sql_trip_availability);

        // Create itinerary tables
        self::createItineraryTables();

        // ============================================
        // EXISTING TABLES (Keep existing structure)
        // ============================================
        
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

        \dbDelta($sql_activities);

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

        \dbDelta($sql_destinations);

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

        \dbDelta($sql_traveler_categories);

        // Trip Categories table
        $table_categories = $wpdb->prefix . 'yatra_trip_categories';
        
        $sql_categories = "CREATE TABLE IF NOT EXISTS `{$table_categories}` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `slug` varchar(255) NOT NULL,
            `description` text,
            `icon` text,
            `parent_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Parent category ID for subcategories',
            `status` varchar(20) DEFAULT 'draft',
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            `created_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            `updated_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            PRIMARY KEY (`id`),
            UNIQUE KEY `slug` (`slug`),
            KEY `status` (`status`),
            KEY `parent_id` (`parent_id`),
            KEY `created_by` (`created_by`),
            KEY `updated_by` (`updated_by`)
        ) {$charset_collate};";

        \dbDelta($sql_categories);

        // Difficulty Levels table
        $table_difficulty_levels = $wpdb->prefix . 'yatra_difficulty_levels';
        
        $sql_difficulty_levels = "CREATE TABLE IF NOT EXISTS `{$table_difficulty_levels}` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `slug` varchar(255) NOT NULL,
            `description` text,
            `icon` text,
            `level_order` smallint(5) UNSIGNED DEFAULT 0 COMMENT 'Order for sorting difficulty levels',
            `status` varchar(20) DEFAULT 'draft',
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            `created_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            `updated_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            PRIMARY KEY (`id`),
            UNIQUE KEY `slug` (`slug`),
            KEY `status` (`status`),
            KEY `level_order` (`level_order`),
            KEY `created_by` (`created_by`),
            KEY `updated_by` (`updated_by`)
        ) {$charset_collate};";

        \dbDelta($sql_difficulty_levels);

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

        \dbDelta($sql_item_types);

        // Items table
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

        \dbDelta($sql_items);

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

        \dbDelta($sql_discounts);

        // Trip Revisions table
        $table_trip_revisions = $wpdb->prefix . 'yatra_trip_revisions';
        
        $sql_trip_revisions = "CREATE TABLE IF NOT EXISTS `{$table_trip_revisions}` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `trip_id` bigint(20) UNSIGNED NOT NULL,
            `version` int(11) NOT NULL DEFAULT 1,
            `status` enum('inherit','restored') DEFAULT 'inherit' COMMENT 'inherit = normal revision, restored = revision created from restore',
            `data` longtext NOT NULL COMMENT 'Serialized trip data',
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `created_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            PRIMARY KEY (`id`),
            KEY `trip_id` (`trip_id`),
            KEY `version` (`version`),
            KEY `status` (`status`),
            KEY `created_at` (`created_at`),
            KEY `created_by` (`created_by`),
            CONSTRAINT `fk_revisions_trip` FOREIGN KEY (`trip_id`) REFERENCES `{$table_trips}` (`id`) ON DELETE CASCADE
        ) {$charset_collate};";

        \dbDelta($sql_trip_revisions);
        
        // Update existing tables to add missing columns
        self::updateTables();
    }

    /**
     * Update existing tables to add missing columns
     */
    public static function updateTables(): void
    {
        global $wpdb;
        
        // Ensure dbDelta function is available
        if (!function_exists('\dbDelta')) {
            if (defined('ABSPATH') && file_exists(ABSPATH . 'wp-admin/includes/upgrade.php')) {
                require_once ABSPATH . 'wp-admin/includes/upgrade.php';
            } else {
                // Fallback: try to find WordPress
                $wpAdminPath = dirname(dirname(dirname(__DIR__))) . '/wp-admin/includes/upgrade.php';
                if (file_exists($wpAdminPath)) {
                    require_once $wpAdminPath;
                } else {
                    throw new \Exception('WordPress upgrade.php file not found. Cannot create database tables.');
                }
            }
        }
        
        $table_trips = $wpdb->prefix . 'yatra_trips';
        
        // Helper function to check if column exists
        $columnExists = function($column) use ($wpdb, $table_trips) {
            return (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = DATABASE() 
                     AND TABLE_NAME = %s 
                     AND COLUMN_NAME = %s",
                    $table_trips,
                    $column
                )
            ) > 0;
        };
        
        // Helper function to determine the column to add after
        $getAfterColumn = function($preferred, $fallback = 'updated_at') use ($columnExists) {
            if ($columnExists($preferred)) {
                return $preferred;
            }
            if ($fallback && $columnExists($fallback)) {
                return $fallback;
            }
            return null;
        };
        
        // Add columns in the correct order
        // 1. short_description (after description)
        if (!$columnExists('short_description')) {
            $after = $getAfterColumn('description');
            $sql = $after 
                ? "ALTER TABLE `{$table_trips}` ADD COLUMN `short_description` varchar(500) DEFAULT NULL COMMENT 'Brief summary' AFTER `{$after}`"
                : "ALTER TABLE `{$table_trips}` ADD COLUMN `short_description` varchar(500) DEFAULT NULL COMMENT 'Brief summary'";
            $wpdb->query($sql);
        }
        
        // 2. created_by (after updated_at)
        if (!$columnExists('created_by')) {
            $after = $getAfterColumn('updated_at');
            $sql = $after
                ? "ALTER TABLE `{$table_trips}` ADD COLUMN `created_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0 AFTER `{$after}`"
                : "ALTER TABLE `{$table_trips}` ADD COLUMN `created_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0";
            $wpdb->query($sql);
        }
        
        // 3. updated_by (after created_by, fallback to updated_at)
        if (!$columnExists('updated_by')) {
            $after = $getAfterColumn('created_by', 'updated_at');
            $sql = $after
                ? "ALTER TABLE `{$table_trips}` ADD COLUMN `updated_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0 AFTER `{$after}`"
                : "ALTER TABLE `{$table_trips}` ADD COLUMN `updated_by` bigint(20) UNSIGNED NOT NULL DEFAULT 0";
            $wpdb->query($sql);
        }
        
        // 4. deleted_at (after updated_by, fallback to created_by, then updated_at)
        if (!$columnExists('deleted_at')) {
            $after = $getAfterColumn('updated_by', 'created_by') ?: $getAfterColumn('updated_at');
            $sql = $after
                ? "ALTER TABLE `{$table_trips}` ADD COLUMN `deleted_at` datetime DEFAULT NULL COMMENT 'Soft delete' AFTER `{$after}`"
                : "ALTER TABLE `{$table_trips}` ADD COLUMN `deleted_at` datetime DEFAULT NULL COMMENT 'Soft delete'";
            $wpdb->query($sql);
        }
        
        // 5. deleted_by (after deleted_at, fallback to updated_by, then created_by, then updated_at)
        if (!$columnExists('deleted_by')) {
            $after = $getAfterColumn('deleted_at', 'updated_by') ?: $getAfterColumn('created_by', 'updated_at') ?: $getAfterColumn('updated_at');
            $sql = $after
                ? "ALTER TABLE `{$table_trips}` ADD COLUMN `deleted_by` bigint(20) UNSIGNED DEFAULT NULL AFTER `{$after}`"
                : "ALTER TABLE `{$table_trips}` ADD COLUMN `deleted_by` bigint(20) UNSIGNED DEFAULT NULL";
            $wpdb->query($sql);
        }
        
        // Add all other missing columns from the schema
        $columnsToAdd = [
            // After short_description
            ['name' => 'trip_details', 'def' => "longtext COMMENT 'Detailed itinerary overview'", 'after' => 'short_description'],
            ['name' => 'what_makes_special', 'def' => "text COMMENT 'Unique selling points'", 'after' => 'trip_details'],
            ['name' => 'trip_story', 'def' => "longtext COMMENT 'Narrative/story format'", 'after' => 'what_makes_special'],
            
            // Location & Geography (after trip_story or description)
            ['name' => 'starting_location', 'def' => "varchar(255) DEFAULT NULL COMMENT 'Pickup/start point'", 'after' => 'trip_story'],
            ['name' => 'ending_location', 'def' => "varchar(255) DEFAULT NULL COMMENT 'Drop-off/end point'", 'after' => 'starting_location'],
            ['name' => 'countries', 'def' => "text COMMENT 'JSON array'", 'after' => 'ending_location'],
            ['name' => 'regions', 'def' => "text COMMENT 'JSON array'", 'after' => 'countries'],
            ['name' => 'latitude', 'def' => "decimal(10,8) DEFAULT NULL COMMENT 'Map center latitude'", 'after' => 'regions'],
            ['name' => 'longitude', 'def' => "decimal(11,8) DEFAULT NULL COMMENT 'Map center longitude'", 'after' => 'latitude'],
            ['name' => 'landmarks', 'def' => "text COMMENT 'JSON array'", 'after' => 'longitude'],
            
            // Duration & Schedule
            ['name' => 'trip_type', 'def' => "enum('single_day','multi_day','flexible') DEFAULT 'multi_day'", 'after' => 'landmarks'],
            ['name' => 'duration_days', 'def' => "smallint(5) UNSIGNED DEFAULT NULL COMMENT 'Total days'", 'after' => 'trip_type'],
            ['name' => 'duration_nights', 'def' => "smallint(5) UNSIGNED DEFAULT NULL COMMENT 'Total nights'", 'after' => 'duration_days'],
            ['name' => 'available_from', 'def' => "date DEFAULT NULL COMMENT 'First available date'", 'after' => 'duration_nights'],
            ['name' => 'available_to', 'def' => "date DEFAULT NULL COMMENT 'Last available date'", 'after' => 'available_from'],
            ['name' => 'booking_window_days', 'def' => "smallint(5) UNSIGNED DEFAULT 30 COMMENT 'Days in advance to book'", 'after' => 'available_to'],
            ['name' => 'seasonal_availability', 'def' => "varchar(100) DEFAULT NULL", 'after' => 'booking_window_days'],
            ['name' => 'best_season', 'def' => "varchar(100) DEFAULT NULL", 'after' => 'seasonal_availability'],
            ['name' => 'peak_season', 'def' => "varchar(100) DEFAULT NULL", 'after' => 'best_season'],
            ['name' => 'off_season', 'def' => "varchar(100) DEFAULT NULL", 'after' => 'peak_season'],
            
            // Categorization
            ['name' => 'difficulty_level', 'def' => "enum('beginner','easy','moderate','challenging','extreme') DEFAULT NULL", 'after' => 'off_season'],
            ['name' => 'trip_category', 'def' => "varchar(100) DEFAULT NULL", 'after' => 'difficulty_level'],
            ['name' => 'trip_category_parent', 'def' => "varchar(100) DEFAULT NULL", 'after' => 'trip_category'],
            ['name' => 'trip_category_sub', 'def' => "varchar(100) DEFAULT NULL", 'after' => 'trip_category_parent'],
            ['name' => 'tags', 'def' => "text COMMENT 'JSON array'", 'after' => 'trip_category_sub'],
            ['name' => 'featured_priority', 'def' => "enum('none','featured','popular','new','limited','bestseller') DEFAULT 'none'", 'after' => 'tags'],
            
            // Pricing
            ['name' => 'pricing_type', 'def' => "enum('regular','traveler_based','dynamic','custom') DEFAULT 'regular'", 'after' => 'featured_priority'],
            ['name' => 'original_price', 'def' => "decimal(10,2) DEFAULT 0.00", 'after' => 'pricing_type'],
            ['name' => 'discounted_price', 'def' => "decimal(10,2) DEFAULT NULL", 'after' => 'original_price'],
            ['name' => 'sale_price', 'def' => "decimal(10,2) DEFAULT NULL", 'after' => 'discounted_price'],
            ['name' => 'currency', 'def' => "char(3) DEFAULT 'USD'", 'after' => 'sale_price'],
            ['name' => 'deposit_amount', 'def' => "decimal(10,2) DEFAULT NULL", 'after' => 'currency'],
            ['name' => 'deposit_percentage', 'def' => "decimal(5,2) DEFAULT NULL", 'after' => 'deposit_amount'],
            ['name' => 'payment_terms', 'def' => "text", 'after' => 'deposit_percentage'],
            ['name' => 'group_pricing_enabled', 'def' => "tinyint(1) DEFAULT 0", 'after' => 'payment_terms'],
            ['name' => 'group_size_min', 'def' => "smallint(5) UNSIGNED DEFAULT NULL", 'after' => 'group_pricing_enabled'],
            ['name' => 'group_discount_percentage', 'def' => "decimal(5,2) DEFAULT NULL", 'after' => 'group_size_min'],
            ['name' => 'max_travelers', 'def' => "smallint(5) UNSIGNED DEFAULT NULL", 'after' => 'group_discount_percentage'],
            ['name' => 'min_travelers', 'def' => "smallint(5) UNSIGNED DEFAULT 1", 'after' => 'max_travelers'],
            ['name' => 'booking_deadline', 'def' => "date DEFAULT NULL", 'after' => 'min_travelers'],
            
            // Requirements
            ['name' => 'cancellation_policy', 'def' => "text", 'after' => 'booking_deadline'],
            ['name' => 'age_min', 'def' => "tinyint(3) UNSIGNED DEFAULT NULL", 'after' => 'cancellation_policy'],
            ['name' => 'age_max', 'def' => "tinyint(3) UNSIGNED DEFAULT NULL", 'after' => 'age_min'],
            ['name' => 'physical_requirements', 'def' => "text", 'after' => 'age_max'],
            ['name' => 'visa_requirements', 'def' => "text", 'after' => 'physical_requirements'],
            ['name' => 'vaccination_requirements', 'def' => "text", 'after' => 'visa_requirements'],
            
            // Accommodation
            ['name' => 'accommodation_type', 'def' => "varchar(100) DEFAULT NULL", 'after' => 'vaccination_requirements'],
            ['name' => 'meal_plan', 'def' => "enum('none','breakfast','half_board','full_board','all_inclusive') DEFAULT NULL", 'after' => 'accommodation_type'],
            ['name' => 'accommodation_details', 'def' => "text", 'after' => 'meal_plan'],
            
            // Transportation
            ['name' => 'transportation_included', 'def' => "tinyint(1) DEFAULT 0", 'after' => 'accommodation_details'],
            ['name' => 'pickup_location', 'def' => "varchar(255) DEFAULT NULL", 'after' => 'transportation_included'],
            ['name' => 'dropoff_location', 'def' => "varchar(255) DEFAULT NULL", 'after' => 'pickup_location'],
            ['name' => 'transportation_details', 'def' => "text", 'after' => 'dropoff_location'],
            
            // Media
            ['name' => 'video_url', 'def' => "varchar(500) DEFAULT NULL", 'after' => 'transportation_details'],
            ['name' => 'virtual_tour_url', 'def' => "varchar(500) DEFAULT NULL", 'after' => 'video_url'],
            ['name' => 'testimonials', 'def' => "text COMMENT 'JSON array'", 'after' => 'virtual_tour_url'],
            ['name' => 'featured_image', 'def' => "varchar(500) DEFAULT NULL", 'after' => 'testimonials'],
            
            // JSON fields (these should be stored in separate tables, but keeping for backward compatibility)
            ['name' => 'included_items', 'def' => "text COMMENT 'JSON array of objects with title and description'", 'after' => 'featured_image'],
            ['name' => 'excluded_items', 'def' => "text COMMENT 'JSON array of objects with title and description'", 'after' => 'included_items'],
            ['name' => 'frontend_tabs', 'def' => "text COMMENT 'JSON array'", 'after' => 'excluded_items'],
            
            // Status
            ['name' => 'status', 'def' => "enum('draft','review','approved','published','archived','suspended') DEFAULT 'draft'", 'after' => 'frontend_tabs'],
            ['name' => 'scheduled_publish_date', 'def' => "datetime DEFAULT NULL", 'after' => 'status'],
            ['name' => 'scheduled_unpublish_date', 'def' => "datetime DEFAULT NULL", 'after' => 'scheduled_publish_date'],
            ['name' => 'version', 'def' => "int(11) UNSIGNED DEFAULT 1", 'after' => 'scheduled_unpublish_date'],
            ['name' => 'seasonal_auto_enable', 'def' => "tinyint(1) DEFAULT 0", 'after' => 'version'],
            ['name' => 'seasonal_enable_date', 'def' => "date DEFAULT NULL", 'after' => 'seasonal_auto_enable'],
            ['name' => 'seasonal_disable_date', 'def' => "date DEFAULT NULL", 'after' => 'seasonal_enable_date'],
            
            // SEO
            ['name' => 'meta_title', 'def' => "varchar(255) DEFAULT NULL", 'after' => 'seasonal_disable_date'],
            ['name' => 'meta_description', 'def' => "text", 'after' => 'meta_title'],
            ['name' => 'meta_keywords', 'def' => "text", 'after' => 'meta_description'],
        ];
        
        // Add each column if it doesn't exist
        foreach ($columnsToAdd as $column) {
            if (!$columnExists($column['name'])) {
                $after = $getAfterColumn($column['after'], 'updated_at');
                $sql = $after
                    ? "ALTER TABLE `{$table_trips}` ADD COLUMN `{$column['name']}` {$column['def']} AFTER `{$after}`"
                    : "ALTER TABLE `{$table_trips}` ADD COLUMN `{$column['name']}` {$column['def']}";
                $wpdb->query($sql);
            }
        }
        
        // Update revisions table to add status column if it doesn't exist
        $table_revisions = $wpdb->prefix . 'yatra_trip_revisions';
        $revisionColumnExists = function($column) use ($wpdb, $table_revisions) {
            return (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = DATABASE() 
                     AND TABLE_NAME = %s 
                     AND COLUMN_NAME = %s",
                    $table_revisions,
                    $column
                )
            ) > 0;
        };
        
        // Check if revisions table exists
        $revisionsTableExists = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM information_schema.tables 
                 WHERE table_schema = DATABASE() 
                 AND table_name = %s",
                $table_revisions
            )
        ) > 0;
        
        if ($revisionsTableExists && !$revisionColumnExists('status')) {
            // Add status column to revisions table
            $wpdb->query(
                "ALTER TABLE `{$table_revisions}` 
                 ADD COLUMN `status` enum('inherit','restored') DEFAULT 'inherit' 
                 COMMENT 'inherit = normal revision, restored = revision created from restore' 
                 AFTER `version`"
            );
        }
        
        // Ensure itinerary tables exist (they should be created in createTables, but check here too)
        $itineraryTables = [
            'yatra_trip_itinerary_days',
            'yatra_trip_itinerary_entries',
            'yatra_trip_itinerary_entry_images',
        ];
        
        // Drop yatra_trip_itinerary_entry_items table if it exists (no longer needed)
        $table_entry_items = $wpdb->prefix . 'yatra_trip_itinerary_entry_items';
        $entryItemsTableExists = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM information_schema.tables 
                 WHERE table_schema = DATABASE() 
                 AND table_name = %s",
                $table_entry_items
            )
        ) > 0;
        
        if ($entryItemsTableExists) {
            $wpdb->query("DROP TABLE IF EXISTS `{$table_entry_items}`");
        }
        
        foreach ($itineraryTables as $tableName) {
            $fullTableName = $wpdb->prefix . $tableName;
            $tableExists = (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM information_schema.tables 
                     WHERE table_schema = DATABASE() 
                     AND table_name = %s",
                    $fullTableName
                )
            ) > 0;
            
            if (!$tableExists) {
                // Re-create the table using the same schema from createTables
                self::createItineraryTables();
                break; // Only need to call once as it creates all tables
            }
        }
        
        // Migration: Remove accommodation and meals from yatra_trip_itinerary_days
        $table_itinerary_days = $wpdb->prefix . 'yatra_trip_itinerary_days';
        $daysTableExists = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM information_schema.tables 
                 WHERE table_schema = DATABASE() 
                 AND table_name = %s",
                $table_itinerary_days
            )
        ) > 0;
        
        if ($daysTableExists) {
            // Check if accommodation column exists and remove it
            $accommodationExists = (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM information_schema.columns 
                     WHERE table_schema = DATABASE() 
                     AND table_name = %s 
                     AND column_name = 'accommodation'",
                    $table_itinerary_days
                )
            ) > 0;
            
            if ($accommodationExists) {
                $wpdb->query("ALTER TABLE `{$table_itinerary_days}` DROP COLUMN `accommodation`");
            }
            
            // Check if meals column exists and remove it
            $mealsExists = (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM information_schema.columns 
                     WHERE table_schema = DATABASE() 
                     AND table_name = %s 
                     AND column_name = 'meals'",
                    $table_itinerary_days
                )
            ) > 0;
            
            if ($mealsExists) {
                $wpdb->query("ALTER TABLE `{$table_itinerary_days}` DROP COLUMN `meals`");
            }
        }
        
        // Migration: Replace activity_type with item_type_id and item_id in yatra_trip_itinerary_entries
        $table_itinerary_entries = $wpdb->prefix . 'yatra_trip_itinerary_entries';
        $entriesTableExists = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM information_schema.tables 
                 WHERE table_schema = DATABASE() 
                 AND table_name = %s",
                $table_itinerary_entries
            )
        ) > 0;
        
        if ($entriesTableExists) {
            // Check if activity_type column exists
            $activityTypeExists = (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM information_schema.columns 
                     WHERE table_schema = DATABASE() 
                     AND table_name = %s 
                     AND column_name = 'activity_type'",
                    $table_itinerary_entries
                )
            ) > 0;
            
            // Check if item_type_id column exists
            $itemTypeIdExists = (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM information_schema.columns 
                     WHERE table_schema = DATABASE() 
                     AND table_name = %s 
                     AND column_name = 'item_type_id'",
                    $table_itinerary_entries
                )
            ) > 0;
            
            // Check if item_id column exists
            $itemIdExists = (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM information_schema.columns 
                     WHERE table_schema = DATABASE() 
                     AND table_name = %s 
                     AND column_name = 'item_id'",
                    $table_itinerary_entries
                )
            ) > 0;
            
            // Add item_type_id if it doesn't exist
            if (!$itemTypeIdExists) {
                $wpdb->query(
                    "ALTER TABLE `{$table_itinerary_entries}` 
                     ADD COLUMN `item_type_id` bigint(20) UNSIGNED DEFAULT NULL 
                     COMMENT 'Reference to yatra_item_types' 
                     AFTER `location`"
                );
                
                // Add index
                $wpdb->query(
                    "ALTER TABLE `{$table_itinerary_entries}` 
                     ADD INDEX `idx_item_type_id` (`item_type_id`)"
                );
            }
            
            // Add item_id if it doesn't exist
            if (!$itemIdExists) {
                $afterColumn = $itemTypeIdExists ? 'item_type_id' : 'location';
                $wpdb->query(
                    "ALTER TABLE `{$table_itinerary_entries}` 
                     ADD COLUMN `item_id` bigint(20) UNSIGNED DEFAULT NULL 
                     COMMENT 'Reference to yatra_items' 
                     AFTER `{$afterColumn}`"
                );
                
                // Add index
                $wpdb->query(
                    "ALTER TABLE `{$table_itinerary_entries}` 
                     ADD INDEX `idx_item_id` (`item_id`)"
                );
            }
            
            // If activity_type exists and we have item_type_id/item_id, we can optionally migrate data
            // For now, just drop activity_type after adding new columns
            if ($activityTypeExists && $itemTypeIdExists && $itemIdExists) {
                // Drop activity_type column (data migration would happen here if needed)
                $wpdb->query("ALTER TABLE `{$table_itinerary_entries}` DROP COLUMN `activity_type`");
            }
            
            // Add missing columns for itinerary entries
            $columnsToAdd = [
                'start_time' => "ADD COLUMN `start_time` varchar(10) DEFAULT NULL COMMENT 'Start time (HH:MM)' AFTER `time`",
                'end_time' => "ADD COLUMN `end_time` varchar(10) DEFAULT NULL COMMENT 'End time (HH:MM)' AFTER `start_time`",
                'time_type' => "ADD COLUMN `time_type` varchar(20) DEFAULT 'exact' COMMENT 'exact, approximate, all_day, flexible' AFTER `end_time`",
                'duration' => "ADD COLUMN `duration` varchar(50) DEFAULT NULL COMMENT 'Duration (e.g., 3 hours)' AFTER `location`",
                'cost' => "ADD COLUMN `cost` decimal(10,2) DEFAULT NULL AFTER `duration`",
                'cost_per_person' => "ADD COLUMN `cost_per_person` tinyint(1) DEFAULT 0 AFTER `cost`",
                'notes' => "ADD COLUMN `notes` text DEFAULT NULL AFTER `cost_per_person`",
                'included_items' => "ADD COLUMN `included_items` text DEFAULT NULL COMMENT 'JSON array of included items' AFTER `notes`",
                'excluded_items' => "ADD COLUMN `excluded_items` text DEFAULT NULL COMMENT 'JSON array of excluded items' AFTER `included_items`",
                'status' => "ADD COLUMN `status` varchar(20) DEFAULT 'draft' COMMENT 'draft, publish, trash' AFTER `item_id`",
            ];
            
            foreach ($columnsToAdd as $columnName => $alterSql) {
                $columnExists = (int) $wpdb->get_var(
                    $wpdb->prepare(
                        "SELECT COUNT(*) FROM information_schema.columns 
                         WHERE table_schema = DATABASE() 
                         AND table_name = %s 
                         AND column_name = %s",
                        $table_itinerary_entries,
                        $columnName
                    )
                ) > 0;
                
                if (!$columnExists) {
                    $wpdb->query("ALTER TABLE `{$table_itinerary_entries}` {$alterSql}");
                }
            }
            
            // Add status index if it doesn't exist
            $statusIndexExists = (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM information_schema.statistics 
                     WHERE table_schema = DATABASE() 
                     AND table_name = %s 
                     AND index_name = 'idx_status'",
                    $table_itinerary_entries
                )
            ) > 0;
            
            if (!$statusIndexExists) {
                $wpdb->query("ALTER TABLE `{$table_itinerary_entries}` ADD INDEX `idx_status` (`status`)");
            }
        }
        
        // Update availability table to add time columns and blocked status
        $table_availability = $wpdb->prefix . 'yatra_trip_availability_dates';
        $availabilityTableExists = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM information_schema.tables 
                 WHERE table_schema = DATABASE() 
                 AND table_name = %s",
                $table_availability
            )
        ) > 0;
        
        if ($availabilityTableExists) {
            // Check and add departure_time column
            $departureTimeExists = (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM information_schema.columns 
                     WHERE table_schema = DATABASE() 
                     AND table_name = %s 
                     AND column_name = 'departure_time'",
                    $table_availability
                )
            ) > 0;
            
            if (!$departureTimeExists) {
                $wpdb->query(
                    "ALTER TABLE `{$table_availability}` 
                     ADD COLUMN `departure_time` time DEFAULT NULL 
                     COMMENT 'For single-day trips' 
                     AFTER `departure_date`"
                );
            }
            
            // Check and add arrival_time column
            $arrivalTimeExists = (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM information_schema.columns 
                     WHERE table_schema = DATABASE() 
                     AND table_name = %s 
                     AND column_name = 'arrival_time'",
                    $table_availability
                )
            ) > 0;
            
            if (!$arrivalTimeExists) {
                $wpdb->query(
                    "ALTER TABLE `{$table_availability}` 
                     ADD COLUMN `arrival_time` time DEFAULT NULL 
                     COMMENT 'For single-day trips' 
                     AFTER `arrival_date`"
                );
            }
            
            // Update status enum to include 'blocked'
            $wpdb->query(
                "ALTER TABLE `{$table_availability}` 
                 MODIFY COLUMN `status` enum('available','limited','sold_out','closed','cancelled','blocked') DEFAULT 'available'"
            );
        }
    }
    
    /**
     * Create itinerary-related tables
     * Called from createTables() and updateTables()
     */
    private static function createItineraryTables(): void
    {
        global $wpdb;
        
        // Ensure dbDelta function is available
        if (!function_exists('\dbDelta')) {
            if (defined('ABSPATH') && file_exists(ABSPATH . 'wp-admin/includes/upgrade.php')) {
                require_once ABSPATH . 'wp-admin/includes/upgrade.php';
            } else {
                // Fallback: try to find WordPress
                $wpAdminPath = dirname(dirname(dirname(__DIR__))) . '/wp-admin/includes/upgrade.php';
                if (file_exists($wpAdminPath)) {
                    require_once $wpAdminPath;
                } else {
                    throw new \Exception('WordPress upgrade.php file not found. Cannot create database tables.');
                }
            }
        }
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // ============================================
        // TRIP ITINERARY DAYS
        // ============================================
        $table_trip_itinerary_days = $wpdb->prefix . 'yatra_trip_itinerary_days';
        $sql_trip_itinerary_days = "CREATE TABLE IF NOT EXISTS `{$table_trip_itinerary_days}` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `trip_id` bigint(20) UNSIGNED NOT NULL,
            `day_number` smallint(5) UNSIGNED NOT NULL COMMENT 'Day 1, 2, 3...',
            `title` varchar(255) DEFAULT NULL COMMENT 'Day title',
            `description` text DEFAULT NULL COMMENT 'Day overview',
            `order` smallint(5) UNSIGNED DEFAULT 0,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_trip_id` (`trip_id`),
            KEY `idx_day_number` (`trip_id`,`day_number`),
            KEY `idx_order` (`trip_id`,`order`)
        ) {$charset_collate} COMMENT='Trip itinerary days';";
        \dbDelta($sql_trip_itinerary_days);

        // ============================================
        // TRIP ITINERARY ENTRIES
        // ============================================
        $table_trip_itinerary_entries = $wpdb->prefix . 'yatra_trip_itinerary_entries';
        $table_item_types = $wpdb->prefix . 'yatra_item_types';
        $sql_trip_itinerary_entries = "CREATE TABLE IF NOT EXISTS `{$table_trip_itinerary_entries}` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `trip_id` bigint(20) UNSIGNED NOT NULL,
            `day_id` bigint(20) UNSIGNED NOT NULL,
            `title` varchar(255) NOT NULL,
            `description` text DEFAULT NULL,
            `time` varchar(50) DEFAULT NULL COMMENT 'Time of day',
            `start_time` varchar(10) DEFAULT NULL COMMENT 'Start time (HH:MM)',
            `end_time` varchar(10) DEFAULT NULL COMMENT 'End time (HH:MM)',
            `time_type` varchar(20) DEFAULT 'exact' COMMENT 'exact, approximate, all_day, flexible',
            `location` varchar(255) DEFAULT NULL,
            `duration` varchar(50) DEFAULT NULL COMMENT 'Duration (e.g., 3 hours)',
            `cost` decimal(10,2) DEFAULT NULL,
            `cost_per_person` tinyint(1) DEFAULT 0,
            `notes` text DEFAULT NULL,
            `included_items` text DEFAULT NULL COMMENT 'JSON array of included items',
            `excluded_items` text DEFAULT NULL COMMENT 'JSON array of excluded items',
            `item_type_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Reference to yatra_item_types',
            `item_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Reference to yatra_items',
            `status` varchar(20) DEFAULT 'draft' COMMENT 'draft, publish, trash',
            `order` smallint(5) UNSIGNED DEFAULT 0,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_trip_id` (`trip_id`),
            KEY `idx_day_id` (`day_id`),
            KEY `idx_item_type_id` (`item_type_id`),
            KEY `idx_item_id` (`item_id`),
            KEY `idx_status` (`status`),
            KEY `idx_order` (`day_id`,`order`)
        ) {$charset_collate} COMMENT='Trip itinerary entries';";
        \dbDelta($sql_trip_itinerary_entries);

        // Note: yatra_trip_itinerary_entry_items table has been removed
        // included_items and excluded_items are no longer stored separately

        // ============================================
        // TRIP ITINERARY ENTRY IMAGES
        // ============================================
        $table_trip_itinerary_entry_images = $wpdb->prefix . 'yatra_trip_itinerary_entry_images';
        $sql_trip_itinerary_entry_images = "CREATE TABLE IF NOT EXISTS `{$table_trip_itinerary_entry_images}` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `entry_id` bigint(20) UNSIGNED NOT NULL,
            `image_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'WordPress attachment ID',
            `image_url` varchar(500) NOT NULL,
            `alt_text` varchar(255) DEFAULT NULL,
            `caption` text DEFAULT NULL,
            `order` smallint(5) UNSIGNED DEFAULT 0,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_entry_id` (`entry_id`),
            KEY `idx_order` (`entry_id`,`order`),
            KEY `idx_image_id` (`image_id`)
        ) {$charset_collate} COMMENT='Trip itinerary entry images';";
        \dbDelta($sql_trip_itinerary_entry_images);
    }

    /**
     * Drop database tables
     */
    public static function dropTables(): void
    {
        global $wpdb;

        $tables = [
            $wpdb->prefix . 'yatra_trip_availability_dates',
            $wpdb->prefix . 'yatra_trip_faqs',
            $wpdb->prefix . 'yatra_trip_highlights',
            $wpdb->prefix . 'yatra_trip_gallery_images',
            $wpdb->prefix . 'yatra_trip_price_types',
            $wpdb->prefix . 'yatra_trip_activities',
            $wpdb->prefix . 'yatra_trip_destinations',
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
