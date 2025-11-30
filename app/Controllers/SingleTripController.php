<?php

declare(strict_types=1);

namespace Yatra\Controllers;

/**
 * Single Trip Frontend Controller
 * 
 * Prepares all data for the single trip template following Laravel patterns.
 * This controller handles data transformation and preparation only.
 * 
 * @package Yatra
 */
class SingleTripController
{
    /**
     * @var \wpdb WordPress database instance
     */
    private $wpdb;

    /**
     * @var string Trips table name
     */
    private string $table_trips;

    /**
     * @var string Destinations table name
     */
    private string $table_destinations;

    /**
     * @var string Activities table name
     */
    private string $table_activities;

    /**
     * @var string Reviews table name
     */
    private string $table_reviews;

    /**
     * Constructor
     */
    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->table_trips = $wpdb->prefix . 'yatra_trips';
        $this->table_destinations = $wpdb->prefix . 'yatra_destinations';
        $this->table_activities = $wpdb->prefix . 'yatra_activities';
        $this->table_reviews = $wpdb->prefix . 'yatra_reviews';
    }

    /**
     * Get trip by slug with all related data
     *
     * @param string $slug Trip slug
     * @return object|null Prepared trip data or null
     */
    public function getBySlug(string $slug): ?object
    {
        $trip = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table_trips} 
                 WHERE slug = %s 
                 AND status IN ('publish', 'published', 'active') 
                 AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00') 
                 LIMIT 1",
                $slug
            )
        );

        // Allow draft trips during development
        if (!$trip && defined('WP_DEBUG') && WP_DEBUG) {
            $trip = $this->wpdb->get_row(
                $this->wpdb->prepare(
                    "SELECT * FROM {$this->table_trips} 
                     WHERE slug = %s 
                     AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00') 
                     LIMIT 1",
                    $slug
                )
            );
        }

        if (!$trip) {
            return null;
        }

        return $this->prepareTrip($trip);
    }

    /**
     * Get trip by ID with all related data
     *
     * @param int $id Trip ID
     * @return object|null Prepared trip data or null
     */
    public function getById(int $id): ?object
    {
        $trip = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table_trips} 
                 WHERE id = %d 
                 AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00') 
                 LIMIT 1",
                $id
            )
        );

        if (!$trip) {
            return null;
        }

        return $this->prepareTrip($trip);
    }

    /**
     * Prepare trip data with all relationships and transformations
     *
     * @param object $trip Raw trip data from database
     * @return object Prepared trip data
     */
    private function prepareTrip(object $trip): object
    {
        // Decode JSON fields
        $trip->highlights = $this->decodeJson($trip->highlights ?? '');
        $trip->testimonials = $this->decodeJson($trip->testimonials ?? '');
        $trip->countries = $this->decodeJson($trip->countries ?? '');
        $trip->regions = $this->decodeJson($trip->regions ?? '');
        $trip->landmarks = $this->decodeJson($trip->landmarks ?? '');
        $trip->tags = $this->decodeJson($trip->tags ?? '');
        $trip->included_items = $this->decodeJson($trip->included_items ?? '');
        $trip->excluded_items = $this->decodeJson($trip->excluded_items ?? '');
        // Gallery images from separate table (with attachment IDs)
        $trip->gallery_images = $this->getGalleryImages((int) $trip->id);
        
        // Get price types from database table (for traveler-based pricing)
        $trip->price_types = $this->getPriceTypes((int) $trip->id);
        
        // Determine pricing type - use database value, fallback to 'regular'
        // If pricing_type is set to 'traveler_based' in DB, use that
        // If pricing_type is empty but price_types exist, infer 'traveler_based'
        if (empty($trip->pricing_type)) {
            $trip->pricing_type = !empty($trip->price_types) ? 'traveler_based' : 'regular';
        }
        $trip->itinerary_days = $this->decodeJson($trip->itinerary_days ?? '');
        $trip->faqs = $this->decodeJson($trip->faqs ?? '');
        $trip->frontend_tabs = $this->decodeJson($trip->frontend_tabs ?? '');
        
        // Fetch availability dates from database table
        $trip->availability_dates = $this->getAvailabilityDates((int) $trip->id);
        $trip->blackout_dates = $this->decodeJson($trip->blackout_dates ?? '');

        // Set default values for numeric fields
        $trip->duration_days = (int) ($trip->duration_days ?? 1);
        $trip->duration_nights = (int) ($trip->duration_nights ?? 0);
        $trip->min_travelers = (int) ($trip->min_travelers ?? 1);
        $trip->max_travelers = (int) ($trip->max_travelers ?? 10);
        $trip->age_min = (int) ($trip->age_min ?? 0);
        $trip->age_max = (int) ($trip->age_max ?? 99);

        // Set default values for price fields
        $trip->original_price = (float) ($trip->original_price ?? 0);
        $trip->sale_price = (float) ($trip->sale_price ?? $trip->original_price);
        $trip->discounted_price = (float) ($trip->discounted_price ?? 0);
        $trip->deposit_amount = (float) ($trip->deposit_amount ?? 0);

        // Get currency
        $trip->currency = $trip->currency ?? get_option('yatra_currency', 'USD');

        // Calculate discount percentage
        $trip->discount_percentage = 0;
        if ($trip->original_price > 0 && $trip->sale_price < $trip->original_price) {
            $trip->discount_percentage = round((($trip->original_price - $trip->sale_price) / $trip->original_price) * 100);
        }

        // Ensure ID is integer
        $trip_id = (int) $trip->id;

        // Fetch related data
        $trip->destinations = $this->getDestinations($trip_id);
        $trip->activities = $this->getActivities($trip_id);
        $trip->trip_categories = $this->getTripCategories($trip_id);
        $trip->reviews = $this->getReviews($trip_id);
        $trip->similar_trips = $this->getSimilarTrips($trip);

        // Calculate rating
        $trip->average_rating = $this->calculateAverageRating($trip->reviews);
        $trip->review_count = count($trip->reviews);

        // Format featured image
        $trip->featured_image_url = $this->getFeaturedImageUrl($trip->featured_image ?? '');

        return $trip;
    }

    /**
     * Decode JSON safely
     *
     * @param string|null $json JSON string
     * @return array Decoded array or empty array
     */
    private function decodeJson(?string $json): array
    {
        if (empty($json)) {
            return [];
        }

        $decoded = json_decode($json, true);
        return is_array($decoded) ? $decoded : [];
    }

    /**
     * Get availability dates for trip from database
     *
     * @param int $trip_id Trip ID
     * @return array Availability dates with pricing and seat info
     */
    private function getAvailabilityDates(int $trip_id): array
    {
        $table = $this->wpdb->prefix . 'yatra_trip_availability_dates';
        
        // Get future availability dates only
        $availability = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$table} 
                 WHERE trip_id = %d 
                 AND departure_date >= CURDATE()
                 AND status IN ('available', 'limited')
                 ORDER BY departure_date ASC",
                $trip_id
            )
        ) ?: [];
        
        // Format availability dates for frontend
        foreach ($availability as $avail) {
            $avail->departure_date = $avail->departure_date;
            $avail->return_date = $avail->return_date;
            $avail->original_price = $avail->original_price ? (float) $avail->original_price : null;
            $avail->discounted_price = $avail->discounted_price ? (float) $avail->discounted_price : null;
            $avail->seats_total = (int) $avail->seats_total;
            $avail->seats_available = (int) $avail->seats_available;
            $avail->seats_reserved = (int) ($avail->seats_reserved ?? 0);
            
            // Calculate effective price for this date
            $avail->effective_price = $avail->discounted_price ?? $avail->original_price;
            
            // Calculate if limited availability
            $avail->is_limited = ($avail->seats_available <= 5 && $avail->seats_available > 0);
            $avail->is_sold_out = ($avail->seats_available <= 0 || $avail->status === 'sold_out');
        }
        
        return $availability;
    }

    /**
     * Get price types for trip (traveler-based pricing)
     *
     * @param int $trip_id Trip ID
     * @return array Price types with category info
     */
    private function getPriceTypes(int $trip_id): array
    {
        $table = $this->wpdb->prefix . 'yatra_trip_price_types';
        $categories_table = $this->wpdb->prefix . 'yatra_traveler_categories';
        
        $sql = $this->wpdb->prepare(
            "SELECT pt.*, tc.label as category_label, tc.slug as category_slug, 
                    tc.description as category_description, tc.age_min, tc.age_max
             FROM {$table} pt
             LEFT JOIN {$categories_table} tc ON pt.category_id = tc.id
             WHERE pt.trip_id = %d
             ORDER BY pt.id ASC",
            $trip_id
        );
        
        $price_types = $this->wpdb->get_results($sql) ?: [];
        
        // Format price types for frontend use
        foreach ($price_types as $pt) {
            $pt->original_price = (float) $pt->original_price;
            $pt->discounted_price = $pt->discounted_price ? (float) $pt->discounted_price : null;
            $pt->sale_price = $pt->sale_price ? (float) $pt->sale_price : null;
            $pt->min_quantity = (int) ($pt->min_quantity ?? 1);
            $pt->max_quantity = $pt->max_quantity ? (int) $pt->max_quantity : null;
            $pt->age_min = $pt->age_min ? (int) $pt->age_min : null;
            $pt->age_max = $pt->age_max ? (int) $pt->age_max : null;
            
            // Calculate effective price (sale_price > discounted_price > original_price)
            $pt->effective_price = $pt->sale_price ?? $pt->discounted_price ?? $pt->original_price;
        }
        
        return $price_types;
    }

    /**
     * Get destinations for trip
     *
     * @param int $trip_id Trip ID
     * @return array Destinations
     */
    private function getDestinations(int $trip_id): array
    {
        $destination_ids = $this->wpdb->get_col(
            $this->wpdb->prepare(
                "SELECT destination_id FROM {$this->wpdb->prefix}yatra_trip_destinations 
                 WHERE trip_id = %d",
                $trip_id
            )
        );

        if (empty($destination_ids)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($destination_ids), '%d'));
        $destinations = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table_destinations} 
                 WHERE id IN ($placeholders)",
                ...$destination_ids
            )
        ) ?: [];
        
        // Add permalink to each destination
        foreach ($destinations as $destination) {
            $destination->url = home_url('/destination/' . ($destination->slug ?? '') . '/');
        }
        
        return $destinations;
    }

    /**
     * Get activities for trip
     *
     * @param int $trip_id Trip ID
     * @return array Activities
     */
    private function getActivities(int $trip_id): array
    {
        $activity_ids = $this->wpdb->get_col(
            $this->wpdb->prepare(
                "SELECT activity_id FROM {$this->wpdb->prefix}yatra_trip_activities 
                 WHERE trip_id = %d",
                $trip_id
            )
        );

        if (empty($activity_ids)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($activity_ids), '%d'));
        return $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table_activities} 
                 WHERE id IN ($placeholders)",
                ...$activity_ids
            )
        ) ?: [];
    }

    /**
     * Get gallery images for trip
     *
     * @param int $trip_id Trip ID
     * @return array Gallery images with URLs
     */
    private function getGalleryImages(int $trip_id): array
    {
        $table = $this->wpdb->prefix . 'yatra_trip_gallery_images';
        
        // Check if table exists
        $table_exists = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $table
            )
        ) === $table;
        
        if (!$table_exists) {
            return [];
        }
        
        $images = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$table} 
                 WHERE trip_id = %d
                 ORDER BY `order` ASC, id ASC",
                $trip_id
            )
        ) ?: [];
        
        // Convert to array of URLs (using attachment ID when available)
        $gallery = [];
        foreach ($images as $img) {
            $url = '';
            
            // If we have an attachment ID, get the URL from WordPress
            if (!empty($img->image_id) && $img->image_id > 0) {
                $url = wp_get_attachment_url((int) $img->image_id);
            }
            
            // Fallback to stored URL
            if (empty($url) && !empty($img->image_url)) {
                $url = $img->image_url;
            }
            
            if (!empty($url)) {
                $gallery[] = $url;
            }
        }
        
        return $gallery;
    }

    /**
     * Get trip categories for trip
     *
     * @param int $trip_id Trip ID
     * @return array Trip categories
     */
    private function getTripCategories(int $trip_id): array
    {
        $relation_table = $this->wpdb->prefix . 'yatra_trip_trip_categories';
        $categories_table = $this->wpdb->prefix . 'yatra_trip_categories';
        
        // Check if relation table exists
        $table_exists = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $relation_table
            )
        ) === $relation_table;
        
        if (!$table_exists) {
            return [];
        }
        
        return $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT tc.id, tc.name, tc.slug 
                 FROM {$relation_table} ttc
                 LEFT JOIN {$categories_table} tc ON ttc.category_id = tc.id
                 WHERE ttc.trip_id = %d
                 ORDER BY ttc.`order` ASC, ttc.id ASC",
                $trip_id
            )
        ) ?: [];
    }

    /**
     * Get reviews for trip
     *
     * @param int $trip_id Trip ID
     * @return array Reviews
     */
    private function getReviews(int $trip_id): array
    {
        $table_exists = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $this->table_reviews
            )
        );

        if (!$table_exists) {
            return [];
        }

        return $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table_reviews} 
                 WHERE trip_id = %d 
                 AND status = 'approved' 
                 ORDER BY created_at DESC 
                 LIMIT 10",
                $trip_id
            )
        ) ?: [];
    }

    /**
     * Get similar trips
     *
     * @param object $trip Current trip
     * @return array Similar trips
     */
    private function getSimilarTrips(object $trip): array
    {
        $trip_id = (int) $trip->id;
        
        // Get similar trips based on category or difficulty
        $similar = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT id, title, slug, featured_image, duration_days, duration_nights, 
                        original_price, sale_price, currency, difficulty_level, 
                        short_description
                 FROM {$this->table_trips} 
                 WHERE id != %d 
                 AND status IN ('publish', 'published', 'active') 
                 AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00')
                 AND (trip_category = %s OR difficulty_level = %s)
                 ORDER BY RAND() 
                 LIMIT 4",
                $trip_id,
                $trip->trip_category ?? '',
                $trip->difficulty_level ?? ''
            )
        );

        // Fallback: Get any published trips if no similar found
        if (empty($similar)) {
            $similar = $this->wpdb->get_results(
                $this->wpdb->prepare(
                    "SELECT id, title, slug, featured_image, duration_days, duration_nights, 
                            original_price, sale_price, currency, difficulty_level, 
                            short_description
                     FROM {$this->table_trips} 
                     WHERE id != %d 
                     AND status IN ('publish', 'published', 'active') 
                     AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00')
                     ORDER BY RAND() 
                     LIMIT 4",
                    $trip_id
                )
            );
        }

        // Prepare each similar trip
        foreach ($similar as &$s) {
            $s->highlights = []; // Empty array as default
            $s->duration_days = (int) ($s->duration_days ?? 1);
            $s->duration_nights = (int) ($s->duration_nights ?? 0);
            $s->original_price = (float) ($s->original_price ?? 0);
            $s->sale_price = (float) ($s->sale_price ?? $s->original_price);
            $s->currency = $s->currency ?? get_option('yatra_currency', 'USD');
            $s->featured_image_url = $this->getFeaturedImageUrl($s->featured_image ?? '');
            
            // Calculate discount
            $s->discount_percentage = 0;
            if ($s->original_price > 0 && $s->sale_price < $s->original_price) {
                $s->discount_percentage = round((($s->original_price - $s->sale_price) / $s->original_price) * 100);
            }
        }

        return $similar ?: [];
    }

    /**
     * Calculate average rating from reviews
     *
     * @param array $reviews Reviews array
     * @return float Average rating
     */
    private function calculateAverageRating(array $reviews): float
    {
        if (empty($reviews)) {
            return 0.0;
        }

        $total = 0;
        foreach ($reviews as $review) {
            $total += (float) ($review->rating ?? 0);
        }

        return round($total / count($reviews), 1);
    }

    /**
     * Get featured image URL
     *
     * @param string|int $image Image ID or URL
     * @return string Image URL
     */
    private function getFeaturedImageUrl($image): string
    {
        if (empty($image)) {
            return '';
        }

        // If it's a numeric ID, get the attachment URL
        if (is_numeric($image)) {
            $url = wp_get_attachment_url((int) $image);
            return $url ?: '';
        }

        // If it's already a URL, return it
        if (filter_var($image, FILTER_VALIDATE_URL)) {
            return $image;
        }

        return '';
    }

    /**
     * Format time from 24h to 12h format
     *
     * @param string $time Time in 24h format (e.g., "14:00")
     * @return string Time in 12h format (e.g., "2:00 PM")
     */
    public static function formatTime(string $time): string
    {
        if (empty($time) || $time === 'Flexible') {
            return $time;
        }

        // Try to parse and format the time
        $timestamp = strtotime($time);
        if ($timestamp !== false) {
            return date('g:i A', $timestamp);
        }

        return $time;
    }

    /**
     * Get booking URL for a trip
     *
     * @param string $slug Trip slug
     * @return string Booking URL
     */
    public static function getBookingUrl(string $slug): string
    {
        if (function_exists('yatra_get_booking_url')) {
            return yatra_get_booking_url($slug);
        }

        $booking_base = get_option('yatra_booking_base', 'book');
        return home_url("/{$booking_base}/{$slug}/");
    }
}

