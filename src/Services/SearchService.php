<?php

declare(strict_types=1);

namespace Yatra\Services;

/**
 * Search service for trip search functionality
 */
class SearchService
{
    /**
     * Search trips
     */
    public function searchTrips(array $filters = [], int $limit = 12, int $offset = 0): array
    {
        global $wpdb;

        $where = [];
        $params = [];

        // Destination filter
        if (!empty($filters['destination'])) {
            $where[] = "t.destination_id = %d";
            $params[] = (int) $filters['destination'];
        }

        // Trip type filter
        if (!empty($filters['trip_type'])) {
            $where[] = "t.trip_type = %s";
            $params[] = $filters['trip_type'];
        }

        // Difficulty level filter
        if (!empty($filters['difficulty'])) {
            $where[] = "t.difficulty_level = %s";
            $params[] = $filters['difficulty'];
        }

        // Price range filter
        if (!empty($filters['min_price'])) {
            $where[] = "t.base_price >= %f";
            $params[] = (float) $filters['min_price'];
        }

        if (!empty($filters['max_price'])) {
            $where[] = "t.base_price <= %f";
            $params[] = (float) $filters['max_price'];
        }

        // Duration filter
        if (!empty($filters['min_duration'])) {
            $where[] = "t.duration_days >= %d";
            $params[] = (int) $filters['min_duration'];
        }

        if (!empty($filters['max_duration'])) {
            $where[] = "t.duration_days <= %d";
            $params[] = (int) $filters['max_duration'];
        }

        // Date range filter
        if (!empty($filters['start_date'])) {
            $where[] = "td.start_date >= %s";
            $params[] = $filters['start_date'];
        }

        if (!empty($filters['end_date'])) {
            $where[] = "td.start_date <= %s";
            $params[] = $filters['end_date'];
        }

        // Availability filter
        if (!empty($filters['available_only'])) {
            $where[] = "td.available_seats > td.booked_seats";
        }

        // Status filter
        $where[] = "t.status = 'active'";

        // Build query
        $sql = "
            SELECT DISTINCT t.*, d.name as destination_name
            FROM {$wpdb->prefix}yatra_trips t
            LEFT JOIN {$wpdb->prefix}yatra_destinations d ON t.destination_id = d.id
            LEFT JOIN {$wpdb->prefix}yatra_trip_dates td ON t.id = td.trip_id
        ";

        if (!empty($where)) {
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        $sql .= " ORDER BY t.featured DESC, t.priority DESC, t.created_at DESC";

        if ($limit > 0) {
            $sql .= " LIMIT %d OFFSET %d";
            $params[] = $limit;
            $params[] = $offset;
        }

        // Execute query
        if (!empty($params)) {
            $results = $wpdb->get_results($wpdb->prepare($sql, ...$params));
        } else {
            $results = $wpdb->get_results($sql);
        }

        return $results ?: [];
    }

    /**
     * Get search filters
     */
    public function getSearchFilters(): array
    {
        global $wpdb;

        $filters = [];

        // Get destinations
        $filters['destinations'] = $wpdb->get_results("
            SELECT id, name 
            FROM {$wpdb->prefix}yatra_destinations 
            WHERE status = 'active' 
            ORDER BY name
        ");

        // Get trip types
        $filters['trip_types'] = $wpdb->get_col("
            SELECT DISTINCT trip_type 
            FROM {$wpdb->prefix}yatra_trips 
            WHERE status = 'active' 
            ORDER BY trip_type
        ");

        // Get difficulty levels
        $filters['difficulty_levels'] = $wpdb->get_col("
            SELECT DISTINCT difficulty_level 
            FROM {$wpdb->prefix}yatra_trips 
            WHERE status = 'active' 
            ORDER BY difficulty_level
        ");

        // Get price range
        $priceRange = $wpdb->get_row("
            SELECT MIN(base_price) as min_price, MAX(base_price) as max_price 
            FROM {$wpdb->prefix}yatra_trips 
            WHERE status = 'active'
        ");

        $filters['price_range'] = [
            'min' => (float) ($priceRange->min_price ?? 0),
            'max' => (float) ($priceRange->max_price ?? 1000)
        ];

        // Get duration range
        $durationRange = $wpdb->get_row("
            SELECT MIN(duration_days) as min_duration, MAX(duration_days) as max_duration 
            FROM {$wpdb->prefix}yatra_trips 
            WHERE status = 'active'
        ");

        $filters['duration_range'] = [
            'min' => (int) ($durationRange->min_duration ?? 1),
            'max' => (int) ($durationRange->max_duration ?? 30)
        ];

        return $filters;
    }

    /**
     * Get featured trips
     */
    public function getFeaturedTrips(int $limit = 6): array
    {
        global $wpdb;

        $sql = "
            SELECT t.*, d.name as destination_name
            FROM {$wpdb->prefix}yatra_trips t
            LEFT JOIN {$wpdb->prefix}yatra_destinations d ON t.destination_id = d.id
            WHERE t.status = 'active' AND t.featured = 1
            ORDER BY t.priority DESC, t.created_at DESC
            LIMIT %d
        ";

        $results = $wpdb->get_results($wpdb->prepare($sql, $limit));
        return $results ?: [];
    }

    /**
     * Get popular trips
     */
    public function getPopularTrips(int $limit = 6): array
    {
        global $wpdb;

        $sql = "
            SELECT t.*, d.name as destination_name
            FROM {$wpdb->prefix}yatra_trips t
            LEFT JOIN {$wpdb->prefix}yatra_destinations d ON t.destination_id = d.id
            WHERE t.status = 'active'
            ORDER BY t.booking_count DESC, t.average_rating DESC
            LIMIT %d
        ";

        $results = $wpdb->get_results($wpdb->prepare($sql, $limit));
        return $results ?: [];
    }

    /**
     * Get trips by destination
     */
    public function getTripsByDestination(int $destinationId, int $limit = 12): array
    {
        global $wpdb;

        $sql = "
            SELECT t.*, d.name as destination_name
            FROM {$wpdb->prefix}yatra_trips t
            LEFT JOIN {$wpdb->prefix}yatra_destinations d ON t.destination_id = d.id
            WHERE t.status = 'active' AND t.destination_id = %d
            ORDER BY t.featured DESC, t.created_at DESC
            LIMIT %d
        ";

        $results = $wpdb->get_results($wpdb->prepare($sql, $destinationId, $limit));
        return $results ?: [];
    }
} 