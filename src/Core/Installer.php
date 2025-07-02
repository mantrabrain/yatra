<?php

declare(strict_types=1);

namespace Yatra\Core;

/**
 * Plugin installer and database setup
 */
class Installer
{
    /**
     * Plugin activation
     */
    public static function activate(): void
    {
        // Create database tables
        self::createTables();

        // Run migrations
        self::runMigrations();

        // Set default options
        self::setDefaultOptions();

        // Create default pages
        self::createDefaultPages();

        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Plugin deactivation
     */
    public static function deactivate(): void
    {
        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Plugin uninstall
     */
    public static function uninstall(): void
    {
        // Remove database tables
        self::dropTables();

        // Remove options
        self::removeOptions();

        // Remove default pages
        self::removeDefaultPages();
    }

    /**
     * Create database tables
     */
    private static function createTables(): void
    {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        // Core configuration table
        $sql_config = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}yatra_config (
            id INT AUTO_INCREMENT PRIMARY KEY,
            config_key VARCHAR(100) UNIQUE NOT NULL,
            config_value LONGTEXT,
            config_type ENUM('string', 'json', 'number', 'boolean') DEFAULT 'string',
            is_autoload BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_config_key (config_key),
            INDEX idx_autoload (is_autoload)
        ) $charset_collate;";

        // Destinations table
        $sql_destinations = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}yatra_destinations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            description LONGTEXT,
            short_description TEXT,
            featured_image VARCHAR(500),
            gallery JSON,
            country VARCHAR(100),
            region VARCHAR(100),
            timezone VARCHAR(50),
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            elevation INT,
            climate_info JSON,
            best_time_to_visit JSON,
            emergency_contacts JSON,
            visa_requirements TEXT,
            status ENUM('active', 'inactive', 'draft') DEFAULT 'active',
            sort_order INT DEFAULT 0,
            seo_title VARCHAR(255),
            seo_description TEXT,
            seo_keywords TEXT,
            view_count INT DEFAULT 0,
            created_by BIGINT UNSIGNED,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_status (status),
            INDEX idx_country_region (country, region),
            INDEX idx_slug (slug),
            INDEX idx_sort_order (sort_order),
            FULLTEXT idx_search (name, description, short_description),
            FOREIGN KEY (created_by) REFERENCES {$wpdb->users}(ID)
        ) $charset_collate;";

        // Trips table
        $sql_trips = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}yatra_trips (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            description LONGTEXT,
            short_description TEXT,
            destination_id INT,
            destination VARCHAR(255),
            primary_destination VARCHAR(255),
            secondary_destinations TEXT,
            cities_visited TEXT,
            starting_point VARCHAR(255),
            ending_point VARCHAR(255),
            highlights TEXT,
            time_zones VARCHAR(100),
            duration_days INT NOT NULL,
            duration_nights INT NOT NULL,
            max_people INT DEFAULT 20,
            min_people INT DEFAULT 1,
            difficulty_level ENUM('easy', 'moderate', 'challenging', 'expert') DEFAULT 'moderate',
            trip_type ENUM('adventure', 'cultural', 'wildlife', 'pilgrimage', 'leisure', 'business', 'custom') DEFAULT 'leisure',
            featured_image VARCHAR(500),
            gallery JSON,
            base_price DECIMAL(12, 2) NOT NULL,
            child_price DECIMAL(12, 2),
            single_supplement DECIMAL(12, 2) DEFAULT 0,
            group_discount_rules JSON,
            seasonal_pricing JSON,
            includes JSON,
            excludes JSON,
            itinerary JSON,
            equipment_list JSON,
            fitness_requirements TEXT,
            age_restrictions JSON,
            cancellation_policy TEXT,
            terms_conditions TEXT,
            status ENUM('active', 'inactive', 'draft', 'archived') DEFAULT 'draft',
            featured BOOLEAN DEFAULT FALSE,
            priority INT DEFAULT 0,
            seo_title VARCHAR(255),
            seo_description TEXT,
            seo_keywords TEXT,
            booking_count INT DEFAULT 0,
            view_count INT DEFAULT 0,
            average_rating DECIMAL(3, 2) DEFAULT 0,
            total_reviews INT DEFAULT 0,
            created_by BIGINT UNSIGNED,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_status (status),
            INDEX idx_destination (destination_id),
            INDEX idx_type_difficulty (trip_type, difficulty_level),
            INDEX idx_featured (featured, priority DESC),
            INDEX idx_price (base_price),
            INDEX idx_duration (duration_days),
            INDEX idx_popularity (booking_count DESC, average_rating DESC),
            FULLTEXT idx_search (title, description, short_description),
            FOREIGN KEY (destination_id) REFERENCES {$wpdb->prefix}yatra_destinations(id),
            FOREIGN KEY (created_by) REFERENCES {$wpdb->users}(ID)
        ) $charset_collate;";

        // Trip dates table
        $sql_trip_dates = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}yatra_trip_dates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            trip_id INT NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            available_seats INT NOT NULL,
            booked_seats INT DEFAULT 0,
            waitlist_count INT DEFAULT 0,
            price_modifier DECIMAL(8, 4) DEFAULT 1.0000,
            fixed_price DECIMAL(12, 2) NULL,
            guide_id BIGINT UNSIGNED NULL,
            special_notes TEXT,
            status ENUM('available', 'full', 'cancelled', 'completed') DEFAULT 'available',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_trip_dates (trip_id, start_date),
            INDEX idx_availability (status, start_date),
            INDEX idx_date_range (start_date, end_date),
            FOREIGN KEY (trip_id) REFERENCES {$wpdb->prefix}yatra_trips(id) ON DELETE CASCADE,
            FOREIGN KEY (guide_id) REFERENCES {$wpdb->users}(ID)
        ) $charset_collate;";

        // Bookings table
        $sql_bookings = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}yatra_bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_number VARCHAR(25) UNIQUE NOT NULL,
            trip_id INT NOT NULL,
            trip_date_id INT NOT NULL,
            customer_id BIGINT UNSIGNED,
            lead_traveler JSON NOT NULL,
            travelers JSON NOT NULL,
            adults INT DEFAULT 1,
            children INT DEFAULT 0,
            infants INT DEFAULT 0,
            total_amount DECIMAL(12, 2) NOT NULL,
            paid_amount DECIMAL(12, 2) DEFAULT 0,
            due_amount DECIMAL(12, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
            currency VARCHAR(10) DEFAULT 'USD',
            exchange_rate DECIMAL(10, 4) DEFAULT 1.0000,
            payment_status ENUM('pending', 'partial', 'completed', 'refunded', 'cancelled') DEFAULT 'pending',
            booking_status ENUM('confirmed', 'pending', 'cancelled', 'completed', 'no_show') DEFAULT 'pending',
            source VARCHAR(50) DEFAULT 'website',
            referral_code VARCHAR(50),
            special_requirements TEXT,
            dietary_restrictions JSON,
            emergency_contacts JSON,
            insurance_details JSON,
            booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            confirmation_date TIMESTAMP NULL,
            cancellation_date TIMESTAMP NULL,
            cancellation_reason TEXT,
            refund_amount DECIMAL(12, 2) DEFAULT 0,
            commission_rate DECIMAL(5, 4) DEFAULT 0,
            agent_id BIGINT UNSIGNED NULL,
            notes TEXT,
            internal_notes TEXT,
            INDEX idx_booking_number (booking_number),
            INDEX idx_trip_date (trip_id, trip_date_id),
            INDEX idx_customer (customer_id),
            INDEX idx_status (booking_status, payment_status),
            INDEX idx_booking_date (booking_date),
            INDEX idx_agent (agent_id),
            FOREIGN KEY (trip_id) REFERENCES {$wpdb->prefix}yatra_trips(id),
            FOREIGN KEY (trip_date_id) REFERENCES {$wpdb->prefix}yatra_trip_dates(id),
            FOREIGN KEY (customer_id) REFERENCES {$wpdb->users}(ID),
            FOREIGN KEY (agent_id) REFERENCES {$wpdb->users}(ID)
        ) $charset_collate;";

        // Payments table
        $sql_payments = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}yatra_payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_id INT NOT NULL,
            payment_type ENUM('deposit', 'installment', 'final', 'refund', 'fee') DEFAULT 'deposit',
            amount DECIMAL(12, 2) NOT NULL,
            currency VARCHAR(10) DEFAULT 'USD',
            payment_method VARCHAR(50) NOT NULL,
            gateway VARCHAR(50) NOT NULL,
            transaction_id VARCHAR(150),
            gateway_transaction_id VARCHAR(150),
            payment_status ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled') DEFAULT 'pending',
            gateway_response JSON,
            failure_reason TEXT,
            processing_fee DECIMAL(8, 2) DEFAULT 0,
            net_amount DECIMAL(12, 2) GENERATED ALWAYS AS (amount - processing_fee) STORED,
            scheduled_date DATE NULL,
            payment_date TIMESTAMP NULL,
            refund_date TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_booking (booking_id),
            INDEX idx_status (payment_status),
            INDEX idx_gateway (gateway, transaction_id),
            INDEX idx_payment_date (payment_date),
            FOREIGN KEY (booking_id) REFERENCES {$wpdb->prefix}yatra_bookings(id) ON DELETE CASCADE
        ) $charset_collate;";

        // Reviews table
        $sql_reviews = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}yatra_reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            trip_id INT NOT NULL,
            booking_id INT,
            customer_id BIGINT UNSIGNED,
            overall_rating DECIMAL(2, 1) CHECK (overall_rating >= 1 AND overall_rating <= 5),
            guide_rating DECIMAL(2, 1) CHECK (guide_rating >= 1 AND guide_rating <= 5),
            accommodation_rating DECIMAL(2, 1) CHECK (accommodation_rating >= 1 AND accommodation_rating <= 5),
            transport_rating DECIMAL(2, 1) CHECK (transport_rating >= 1 AND transport_rating <= 5),
            value_rating DECIMAL(2, 1) CHECK (value_rating >= 1 AND value_rating <= 5),
            title VARCHAR(255),
            review_text TEXT,
            photos JSON,
            verified_booking BOOLEAN DEFAULT FALSE,
            helpful_votes INT DEFAULT 0,
            total_votes INT DEFAULT 0,
            response_text TEXT,
            response_date TIMESTAMP NULL,
            status ENUM('approved', 'pending', 'rejected', 'flagged') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_trip (trip_id),
            INDEX idx_customer (customer_id),
            INDEX idx_status (status),
            INDEX idx_rating (overall_rating),
            INDEX idx_verified (verified_booking),
            FOREIGN KEY (trip_id) REFERENCES {$wpdb->prefix}yatra_trips(id),
            FOREIGN KEY (booking_id) REFERENCES {$wpdb->prefix}yatra_bookings(id),
            FOREIGN KEY (customer_id) REFERENCES {$wpdb->users}(ID)
        ) $charset_collate;";

        // Activities table
        $sql_activities = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}yatra_activities (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            time VARCHAR(100),
            location VARCHAR(255),
            image VARCHAR(255),
            meta JSON,
            status ENUM('active','inactive') DEFAULT 'active',
            created_by BIGINT UNSIGNED,
            updated_by BIGINT UNSIGNED,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_status (status),
            INDEX idx_created_by (created_by),
            INDEX idx_updated_by (updated_by)
        ) $charset_collate;";

        // Execute SQL statements
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
        dbDelta($sql_config);
        dbDelta($sql_destinations);
        dbDelta($sql_trips);
        dbDelta($sql_trip_dates);
        dbDelta($sql_bookings);
        dbDelta($sql_payments);
        dbDelta($sql_reviews);
        dbDelta($sql_activities);
    }

    /**
     * Run database migrations
     */
    private static function runMigrations(): void
    {
        global $wpdb;
        
        // Migration: Update activities table time field
        $table_name = $wpdb->prefix . 'yatra_activities';
        $column_exists = $wpdb->get_results("SHOW COLUMNS FROM {$table_name} LIKE 'time'");
        
        if (!empty($column_exists)) {
            $wpdb->query("ALTER TABLE {$table_name} MODIFY COLUMN time VARCHAR(100)");
        }
    }

    /**
     * Set default options
     */
    private static function setDefaultOptions(): void
    {
        $default_options = [
            'yatra_currency' => 'USD',
            'yatra_date_format' => 'Y-m-d',
            'yatra_time_format' => 'H:i',
            'yatra_booking_confirmation_email' => true,
            'yatra_payment_confirmation_email' => true,
            'yatra_reminder_email_days' => 7,
            'yatra_max_people_per_booking' => 20,
            'yatra_booking_timeout_minutes' => 30,
            'yatra_enable_reviews' => true,
            'yatra_auto_approve_reviews' => false,
            'yatra_enable_waitlist' => true,
            'yatra_enable_partial_payments' => true,
            'yatra_deposit_percentage' => 25,
        ];

        foreach ($default_options as $option => $value) {
            if (get_option($option) === false) {
                add_option($option, $value);
            }
        }
    }

    /**
     * Create default pages
     */
    private static function createDefaultPages(): void
    {
        $pages = [
            'trips' => [
                'title' => __('Trips', 'yatra'),
                'content' => '[yatra_trips]',
                'slug' => 'trips'
            ],
            'destinations' => [
                'title' => __('Destinations', 'yatra'),
                'content' => '[yatra_destinations]',
                'slug' => 'destinations'
            ],
            'search' => [
                'title' => __('Search Trips', 'yatra'),
                'content' => '[yatra_search_form]',
                'slug' => 'search-trips'
            ],
        ];

        foreach ($pages as $key => $page_data) {
            $page_id = get_option("yatra_page_{$key}");
            
            if (!$page_id || !get_post($page_id)) {
                $page_id = wp_insert_post([
                    'post_title' => $page_data['title'],
                    'post_content' => $page_data['content'],
                    'post_status' => 'publish',
                    'post_type' => 'page',
                    'post_name' => $page_data['slug'],
                ]);

                if ($page_id) {
                    update_option("yatra_page_{$key}", $page_id);
                }
            }
        }
    }

    /**
     * Drop database tables
     */
    private static function dropTables(): void
    {
        global $wpdb;

        $tables = [
            'yatra_reviews',
            'yatra_payments',
            'yatra_bookings',
            'yatra_trip_dates',
            'yatra_trips',
            'yatra_destinations',
            'yatra_activities',
            'yatra_config',
        ];

        foreach ($tables as $table) {
            $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}{$table}");
        }
    }

    /**
     * Remove options
     */
    private static function removeOptions(): void
    {
        $options = [
            'yatra_currency',
            'yatra_date_format',
            'yatra_time_format',
            'yatra_booking_confirmation_email',
            'yatra_payment_confirmation_email',
            'yatra_reminder_email_days',
            'yatra_max_people_per_booking',
            'yatra_booking_timeout_minutes',
            'yatra_enable_reviews',
            'yatra_auto_approve_reviews',
            'yatra_enable_waitlist',
            'yatra_enable_partial_payments',
            'yatra_deposit_percentage',
            'yatra_page_trips',
            'yatra_page_destinations',
            'yatra_page_search',
        ];

        foreach ($options as $option) {
            delete_option($option);
        }
    }

    /**
     * Remove default pages
     */
    private static function removeDefaultPages(): void
    {
        $pages = ['trips', 'destinations', 'search'];

        foreach ($pages as $page) {
            $page_id = get_option("yatra_page_{$page}");
            if ($page_id) {
                wp_delete_post($page_id, true);
                delete_option("yatra_page_{$page}");
            }
        }
    }
} 