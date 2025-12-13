<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Models\Trip;
use Yatra\Utils\Cache;

/**
 * Trip Repository
 * Handles database operations for trips with comprehensive field support
 * 
 * Expert-level repository design:
 * - Relationship management (destinations, activities)
 * - JSON field handling
 * - Soft delete support
 * - Optimized queries with proper indexing
 */
class TripRepository extends BaseRepository
{
    /**
     * Cache for table existence checks to avoid repeated SHOW TABLES queries
     */
    private static array $tableExistsCache = [];

    /**
     * Get table name
     */
    protected function getTableName(): string
    {
        global $wpdb;
        return $wpdb->prefix . 'yatra_trips';
    }

    /**
     * Find published/active trip by ID
     *
     * @param int $id Trip ID
     * @return \stdClass|null
     */
    public function findPublished(int $id): ?\stdClass
    {
        $table = esc_sql($this->table);
        $query = "SELECT * FROM `{$table}` WHERE id = %d AND status IN ('publish', 'published', 'active')";

        if ($this->hasSoftDelete()) {
            $query .= " AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00')";
        }

        $result = $this->wpdb->get_row(
            $this->wpdb->prepare($query, $id)
        );

        return $result ?: null;
    }

    /**
     * Find trips with comprehensive filtering, pagination, and relationships
     *
     * @param array $filters Filter criteria
     * @param int $page Current page
     * @param int $perPage Items per page
     * @return array
     */
    public function findWithFilters(array $filters = [], int $page = 1, int $perPage = 10): array
    {
        global $wpdb;
        
        // Table references
        $trip_table = $this->getTableName();
        $reviews_table = $wpdb->prefix . 'yatra_reviews';
        $bookings_table = $wpdb->prefix . 'yatra_bookings';
        $dest_table = $wpdb->prefix . 'yatra_destinations';
        $act_table = $wpdb->prefix . 'yatra_activities';
        
        // Build WHERE conditions and parameters
        $wheres = ["t.status IN ('publish', 'published')"];
        $params = [];
        $joins = [];
        $having_clauses = [];
        $rating_params = [];
        
        // Destination filter
        if (!empty($filters['destination'])) {
            $dest_mapping_table = $wpdb->prefix . 'yatra_trip_destination_mapping';
            $joins[] = "LEFT JOIN {$dest_mapping_table} tdm ON tdm.trip_id = t.id";
            $joins[] = "LEFT JOIN {$dest_table} dest ON dest.id = tdm.destination_id";
            $wheres[] = "dest.slug = %s";
            $params[] = $filters['destination'];
        }
        
        // Activity filter
        if (!empty($filters['activity'])) {
            $act_mapping_table = $wpdb->prefix . 'yatra_trip_activity_mapping';
            $joins[] = "LEFT JOIN {$act_mapping_table} tam ON tam.trip_id = t.id";
            $joins[] = "LEFT JOIN {$act_table} act ON act.id = tam.activity_id";
            $wheres[] = "act.slug = %s";
            $params[] = $filters['activity'];
        }
        
        // Price range filter
        if (!empty($filters['price_min']) && $filters['price_min'] > 0) {
            $wheres[] = "CAST(t.original_price AS DECIMAL(10,2)) >= %f";
            $params[] = $filters['price_min'];
        }
        
        if (!empty($filters['price_max']) && $filters['price_max'] > 0) {
            $wheres[] = "CAST(t.original_price AS DECIMAL(10,2)) <= %f";
            $params[] = $filters['price_max'];
        }
        
        // Duration filter
        if (!empty($filters['duration_min']) && $filters['duration_min'] > 0) {
            $wheres[] = "CAST(t.duration_days AS UNSIGNED) >= %d";
            $params[] = $filters['duration_min'];
        }
        
        if (!empty($filters['duration_max']) && $filters['duration_max'] > 0) {
            $wheres[] = "CAST(t.duration_days AS UNSIGNED) <= %d";
            $params[] = $filters['duration_max'];
        }
        
        // Rating filter
        if (!empty($filters['rating_min']) && $filters['rating_min'] > 0) {
            $having_clauses[] = "AVG(r.rating) >= %f";
            $rating_params[] = $filters['rating_min'];
        }
        
        // Difficulty filter
        if (!empty($filters['difficulty']) && is_array($filters['difficulty'])) {
            $difficulty_table = $wpdb->prefix . 'yatra_difficulty_levels';
            $joins[] = "LEFT JOIN {$difficulty_table} dl ON (t.difficulty_level = dl.id OR t.difficulty_level = dl.slug)";
            $difficulty_placeholders = implode(',', array_fill(0, count($filters['difficulty']), '%d'));
            $wheres[] = "dl.id IN ({$difficulty_placeholders})";
            $params = array_merge($params, $filters['difficulty']);
        }
        
        // Build SQL components
        $join_sql = !empty($joins) ? implode(' ', $joins) : '';
        $where_sql = 'WHERE ' . implode(' AND ', $wheres);
        $having_sql = !empty($having_clauses) ? ('HAVING ' . implode(' AND ', $having_clauses)) : '';
        
        // Calculate pagination
        $offset = ($page - 1) * $perPage;
        
        // Count total results
        $count_params = array_merge($params, $rating_params);
        if (!empty($having_clauses)) {
            $count_sql = "SELECT COUNT(*) FROM (
                          SELECT t.id
                          FROM {$trip_table} t
                          {$join_sql}
                          LEFT JOIN {$reviews_table} r ON r.trip_id = t.id AND r.status = 'approved'
                          {$where_sql}
                          GROUP BY t.id
                          {$having_sql}
                          ) as filtered_trips";
        } else {
            $count_sql = "SELECT COUNT(DISTINCT t.id)
                          FROM {$trip_table} t
                          {$join_sql}
                          {$where_sql}";
            $count_params = $params;
        }
        
        $prepared_count_query = empty($count_params) ? $count_sql : 
            $wpdb->prepare($count_sql, ...$count_params);
        
        $total = (int) $wpdb->get_var($prepared_count_query);
        $total_pages = $total > 0 ? (int) ceil($total / $perPage) : 1;
        
        // Build ORDER BY clause
        $order_clause = $this->buildTripOrderClause($filters['sort'] ?? '');
        
        // Check for difficulty table and build difficulty JOIN
        $difficulty_join = $this->buildDifficultyJoin();
        $difficulty_select = $difficulty_join ? ', diff.name AS difficulty_name, diff.icon AS difficulty_icon' : '';
        
        
        // Main query
        $query_sql = "SELECT t.*,
                             AVG(r.rating) AS average_rating,
                             COUNT(DISTINCT r.id) AS review_count,
                             COUNT(DISTINCT b.id) AS booking_count{$difficulty_select}
                      FROM {$trip_table} t
                      {$join_sql}
                      LEFT JOIN {$reviews_table} r ON r.trip_id = t.id AND r.status = 'approved'
                      LEFT JOIN {$bookings_table} b ON b.trip_id = t.id AND b.status IN ('confirmed', 'completed', 'paid')
                      {$difficulty_join}
                      {$where_sql}
                      GROUP BY t.id
                      {$having_sql}
                      {$order_clause}
                      LIMIT {$perPage} OFFSET {$offset}";
        
        $main_query_params = array_merge($params, $rating_params);
        $prepared_query = empty($main_query_params) ? $query_sql : 
            $wpdb->prepare($query_sql, ...$main_query_params);
        
        $trips = $wpdb->get_results($prepared_query) ?: [];
        
        // Process trips in batch for better performance (eliminates N+1 queries)
        if (!empty($trips)) {
            $this->batchEnrichTrips($trips);
        }
        
        return [
            'trips' => $trips,
            'total' => $total,
            'pages' => $total_pages,
            'page' => $page,
            'per_page' => $perPage
        ];
    }
    
    /**
     * Build ORDER BY clause for trip-specific sorting
     */
    protected function buildTripOrderClause(string $sort): string
    {
        switch ($sort) {
            case 'most_popular':
                return "ORDER BY booking_count DESC, t.created_at DESC";
            case 'price_low':
                return "ORDER BY CAST(t.original_price AS DECIMAL(10,2)) ASC";
            case 'price_high':
                return "ORDER BY CAST(t.original_price AS DECIMAL(10,2)) DESC";
            case 'rating_high':
                return "ORDER BY average_rating DESC";
            case 'duration_short':
                return "ORDER BY CAST(t.duration_days AS UNSIGNED) ASC, CAST(t.duration_nights AS UNSIGNED) ASC";
            case 'duration_long':
                return "ORDER BY CAST(t.duration_days AS UNSIGNED) DESC, CAST(t.duration_nights AS UNSIGNED) DESC";
            default:
                return "ORDER BY t.created_at DESC";
        }
    }
    
    /**
     * Build difficulty JOIN clause if table exists
     */
    protected function buildDifficultyJoin(): string
    {
        global $wpdb;
        
        // Use the actual difficulty table from Database.php schema
        $difficulty_table = $wpdb->prefix . 'yatra_difficulty_levels';
        
        // Use advanced caching system instead of simple array cache
        $tableExists = Cache::tableExists($difficulty_table, function() use ($wpdb, $difficulty_table) {
            return (bool) $wpdb->get_var("SHOW TABLES LIKE '{$difficulty_table}'");
        });
        
        if ($tableExists) {
            // Map yatra_trips.difficulty_level (bigint ID) to yatra_difficulty_levels table
            // The difficulty_level field now contains the ID, so match on ID first
            return "LEFT JOIN {$difficulty_table} diff ON diff.id = t.difficulty_level";
        }
        return '';
    }

    /**
     * Batch enrich multiple trips to eliminate N+1 queries
     * 
     * @param array $trips Array of trip objects
     */
    protected function batchEnrichTrips(array $trips): void
    {
        if (empty($trips)) {
            return;
        }

        global $wpdb;
        $trip_ids = array_column($trips, 'id');
        $trip_ids_placeholder = implode(',', array_fill(0, count($trip_ids), '%d'));

        // Batch load pricing data for traveler-based trips
        $price_types_table = $wpdb->prefix . 'yatra_trip_price_types';
        $pricing_data = $wpdb->get_results($wpdb->prepare(
            "SELECT trip_id, original_price, discounted_price,
                    CASE 
                        WHEN discounted_price IS NOT NULL AND discounted_price > 0 THEN discounted_price 
                        ELSE original_price 
                    END as effective_price,
                    CASE 
                        WHEN discounted_price IS NOT NULL AND discounted_price > 0 AND original_price > 0 
                        THEN ROUND(((original_price - discounted_price) / original_price) * 100)
                        ELSE 0
                    END as discount_percentage
             FROM {$price_types_table} 
             WHERE trip_id IN ({$trip_ids_placeholder}) AND (
                 (discounted_price IS NOT NULL AND discounted_price > 0) OR 
                 (original_price IS NOT NULL AND original_price > 0)
             )
             ORDER BY trip_id, effective_price ASC",
            ...$trip_ids
        ));

        // Group pricing data by trip_id
        $pricing_by_trip = [];
        foreach ($pricing_data as $price) {
            $pricing_by_trip[$price->trip_id][] = $price;
        }

        // Batch load destinations
        $dest_rel_table = $wpdb->prefix . 'yatra_trip_destinations';
        $destinations_data = [];
        $destTableExists = Cache::tableExists($dest_rel_table, function() use ($wpdb, $dest_rel_table) {
            return (bool) $wpdb->get_var("SHOW TABLES LIKE '{$dest_rel_table}'");
        });
        
        if ($destTableExists) {
            $destinations_raw = $wpdb->get_results($wpdb->prepare(
                "SELECT td.trip_id, d.* FROM {$wpdb->prefix}yatra_destinations d
                 INNER JOIN {$dest_rel_table} td ON d.id = td.destination_id
                 WHERE td.trip_id IN ({$trip_ids_placeholder}) AND d.status = 'publish'
                 ORDER BY td.trip_id, d.name ASC",
                ...$trip_ids
            ));
            
            foreach ($destinations_raw as $dest) {
                $trip_id = $dest->trip_id;
                unset($dest->trip_id);
                $destinations_data[$trip_id][] = $dest;
            }
        }

        // Batch load activities
        $act_rel_table = $wpdb->prefix . 'yatra_trip_activities';
        $activities_data = [];
        $actTableExists = Cache::tableExists($act_rel_table, function() use ($wpdb, $act_rel_table) {
            return (bool) $wpdb->get_var("SHOW TABLES LIKE '{$act_rel_table}'");
        });
        
        if ($actTableExists) {
            $activities_raw = $wpdb->get_results($wpdb->prepare(
                "SELECT ta.trip_id, a.* FROM {$wpdb->prefix}yatra_activities a
                 INNER JOIN {$act_rel_table} ta ON a.id = ta.activity_id
                 WHERE ta.trip_id IN ({$trip_ids_placeholder}) AND a.status = 'publish'
                 ORDER BY ta.trip_id, a.name ASC",
                ...$trip_ids
            ));
            
            foreach ($activities_raw as $act) {
                $trip_id = $act->trip_id;
                unset($act->trip_id);
                $activities_data[$trip_id][] = $act;
            }
        }

        // Batch load categories
        $cat_rel_table = $wpdb->prefix . 'yatra_trip_trip_categories';
        $categories_data = [];
        $catTableExists = Cache::tableExists($cat_rel_table, function() use ($wpdb, $cat_rel_table) {
            return (bool) $wpdb->get_var("SHOW TABLES LIKE '{$cat_rel_table}'");
        });
        
        if ($catTableExists) {
            $categories_raw = $wpdb->get_results($wpdb->prepare(
                "SELECT tc.trip_id, c.* FROM {$wpdb->prefix}yatra_trip_categories c
                 INNER JOIN {$cat_rel_table} tc ON c.id = tc.category_id
                 WHERE tc.trip_id IN ({$trip_ids_placeholder}) AND c.status = 'publish'
                 ORDER BY tc.trip_id, c.name ASC",
                ...$trip_ids
            ));
            
            foreach ($categories_raw as $cat) {
                $trip_id = $cat->trip_id;
                unset($cat->trip_id);
                $categories_data[$trip_id][] = $cat;
            }
        }

        // Apply enriched data to each trip
        foreach ($trips as $trip) {
            // Set pricing data
            $trip->effective_price_min = 0;
            
            if (!empty($trip->pricing_type) && $trip->pricing_type === 'traveler_based') {
                if (isset($pricing_by_trip[$trip->id]) && !empty($pricing_by_trip[$trip->id])) {
                    $min_price_row = $pricing_by_trip[$trip->id][0];
                    $trip->effective_price_min = (float)$min_price_row->effective_price;
                    $trip->min_category_original_price = (float)$min_price_row->original_price;
                    
                    $max_discount = 0;
                    foreach ($pricing_by_trip[$trip->id] as $price_type) {
                        if ($price_type->discount_percentage > $max_discount) {
                            $max_discount = $price_type->discount_percentage;
                        }
                    }
                    $trip->max_discount_percentage = $max_discount;
                }
            } else {
                // Regular pricing logic
                if (!empty($trip->discounted_price) && (float)$trip->discounted_price > 0) {
                    $trip->effective_price_min = (float)$trip->discounted_price;
                } elseif (!empty($trip->sale_price) && (float)$trip->sale_price > 0) {
                    $trip->effective_price_min = (float)$trip->sale_price;
                } elseif (!empty($trip->original_price) && (float)$trip->original_price > 0) {
                    $trip->effective_price_min = (float)$trip->original_price;
                }
            }

            // Set relationships
            $trip->destinations = $destinations_data[$trip->id] ?? [];
            $trip->activities = $activities_data[$trip->id] ?? [];
            $trip->categories = $categories_data[$trip->id] ?? [];
        }
    }
    
    /**
     * Enrich trip data with additional computed fields (legacy single-trip method)
     */
    protected function enrichTripData(\stdClass $trip): void
    {
        global $wpdb;
        
        // Compute effective pricing based on pricing type
        $trip->effective_price_min = 0;
        
        if (!empty($trip->pricing_type) && $trip->pricing_type === 'traveler_based') {
            $price_types_table = $wpdb->prefix . 'yatra_trip_price_types';
            $all_price_types = $wpdb->get_results($wpdb->prepare(
                "SELECT original_price, discounted_price,
                        CASE 
                            WHEN discounted_price IS NOT NULL AND discounted_price > 0 THEN discounted_price 
                            ELSE original_price 
                        END as effective_price,
                        CASE 
                            WHEN discounted_price IS NOT NULL AND discounted_price > 0 AND original_price > 0 
                            THEN ROUND(((original_price - discounted_price) / original_price) * 100)
                            ELSE 0
                        END as discount_percentage
                 FROM {$price_types_table} 
                 WHERE trip_id = %d AND (
                     (discounted_price IS NOT NULL AND discounted_price > 0) OR 
                     (original_price IS NOT NULL AND original_price > 0)
                 )
                 ORDER BY effective_price ASC",
                $trip->id
            ));
            
            if ($all_price_types && count($all_price_types) > 0) {
                $min_price_row = $all_price_types[0];
                $trip->effective_price_min = (float)$min_price_row->effective_price;
                $trip->min_category_original_price = (float)$min_price_row->original_price;
                
                $max_discount = 0;
                foreach ($all_price_types as $price_type) {
                    if ($price_type->discount_percentage > $max_discount) {
                        $max_discount = $price_type->discount_percentage;
                    }
                }
                $trip->max_discount_percentage = $max_discount;
            }
        } else {
            // Regular pricing logic
            if (!empty($trip->discounted_price) && (float)$trip->discounted_price > 0) {
                $trip->effective_price_min = (float)$trip->discounted_price;
            } elseif (!empty($trip->sale_price) && (float)$trip->sale_price > 0) {
                $trip->effective_price_min = (float)$trip->sale_price;
            } elseif (!empty($trip->original_price) && (float)$trip->original_price > 0) {
                $trip->effective_price_min = (float)$trip->original_price;
            }
        }
    }

    /**
     * Load trip relationships (destinations, activities, categories)
     */
    protected function loadTripRelationships(\stdClass $trip): void
    {
        global $wpdb;
        
        // Use advanced caching system for table existence checks
        $dest_rel_table = $wpdb->prefix . 'yatra_trip_destinations';
        $destTableExists = Cache::tableExists($dest_rel_table, function() use ($wpdb, $dest_rel_table) {
            return (bool) $wpdb->get_var("SHOW TABLES LIKE '{$dest_rel_table}'");
        });
        
        if ($destTableExists) {
            $destinations = $wpdb->get_results($wpdb->prepare(
                "SELECT d.* FROM {$wpdb->prefix}yatra_destinations d
                 INNER JOIN {$dest_rel_table} td ON d.id = td.destination_id
                 WHERE td.trip_id = %d AND d.status = 'publish'
                 ORDER BY d.name ASC",
                $trip->id
            ));
            $trip->destinations = $destinations ?: [];
        } else {
            $trip->destinations = [];
        }
        
        // Use advanced caching system for activities table existence check
        $act_rel_table = $wpdb->prefix . 'yatra_trip_activities';
        $actTableExists = Cache::tableExists($act_rel_table, function() use ($wpdb, $act_rel_table) {
            return (bool) $wpdb->get_var("SHOW TABLES LIKE '{$act_rel_table}'");
        });
        
        if ($actTableExists) {
            $activities = $wpdb->get_results($wpdb->prepare(
                "SELECT a.* FROM {$wpdb->prefix}yatra_activities a
                 INNER JOIN {$act_rel_table} ta ON a.id = ta.activity_id
                 WHERE ta.trip_id = %d AND a.status = 'publish'
                 ORDER BY a.name ASC",
                $trip->id
            ));
            $trip->activities = $activities ?: [];
        } else {
            $trip->activities = [];
        }
        
        // Check and load categories using existing table structure
        $cat_rel_table = $wpdb->prefix . 'yatra_trip_trip_categories';
        if ($wpdb->get_var("SHOW TABLES LIKE '{$cat_rel_table}'")) {
            $categories = $wpdb->get_results($wpdb->prepare(
                "SELECT c.* FROM {$wpdb->prefix}yatra_trip_categories c
                 INNER JOIN {$cat_rel_table} ttc ON c.id = ttc.category_id
                 WHERE ttc.trip_id = %d AND c.status = 'publish'
                 ORDER BY c.name ASC",
                $trip->id
            ));
            $trip->categories = $categories ?: [];
        } else {
            $trip->categories = [];
        }
        
        // Load price types for traveler-based pricing
        if (!empty($trip->pricing_type) && $trip->pricing_type === 'traveler_based') {
            $price_types_table = $wpdb->prefix . 'yatra_trip_price_types';
            if ($wpdb->get_var("SHOW TABLES LIKE '{$price_types_table}'")) {
                $price_types = $wpdb->get_results($wpdb->prepare(
                    "SELECT * FROM {$price_types_table}
                     WHERE trip_id = %d
                     ORDER BY original_price ASC",
                    $trip->id
                ));
                $trip->price_types = $price_types ?: [];
            } else {
                $trip->price_types = [];
            }
        }
    }

    /**
     * Find by slug
     */
    public function findBySlug(string $slug): ?\stdClass
    {
        $table = esc_sql($this->table);
        $query = "SELECT * FROM `{$table}` WHERE slug = %s";
        
        if ($this->hasSoftDelete()) {
            $query .= " AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00')";
        }
        
        $result = $this->wpdb->get_row(
            $this->wpdb->prepare($query, $slug)
        );

        return $result ?: null;
    }

    /**
     * Find by ID with relationships
     */
    public function findWithRelations(int $id): ?\stdClass
    {
        $trip = $this->find($id);
        
        if (!$trip) {
            return null;
        }

        // Load destinations
        $trip->destinations = $this->getDestinations($id);
        
        // Load activities
        $trip->activities = $this->getActivities($id);
        
        // Load trip categories
        $trip->trip_category = $this->getTripCategories($id);
        
        // Load price types
        $trip->price_types = $this->getPriceTypes($id);
        
        // Load gallery images
        $trip->gallery_images = $this->getGalleryImages($id);
        
        // Load highlights
        $trip->highlights = $this->getHighlights($id);
        
        // Load FAQs
        $trip->faqs = $this->getFaqs($id);
        
        // Load availability dates
        $trip->availability_dates = $this->getAvailabilityDates($id);

        // Load itinerary days with entries
        $trip->itinerary_days = $this->getItineraryDays($id);

        do_action('yatra_trip_loaded_with_relations', $trip);

        return $trip;
    }

    /**
     * Get destinations for a trip
     */
    public function getDestinations(int $tripId): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_destinations';
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT td.*, d.name as destination_name, d.slug as destination_slug 
                 FROM `{$table}` td
                 LEFT JOIN `{$wpdb->prefix}yatra_destinations` d ON td.destination_id = d.id
                 WHERE td.trip_id = %d
                 ORDER BY td.`order` ASC, td.id ASC",
                $tripId
            )
        ) ?: [];
    }

    /**
     * Get activities for a trip
     */
    public function getActivities(int $tripId): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_activities';
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT ta.*, a.name as activity_name, a.slug as activity_slug 
                 FROM `{$table}` ta
                 LEFT JOIN `{$wpdb->prefix}yatra_activities` a ON ta.activity_id = a.id
                 WHERE ta.trip_id = %d
                 ORDER BY ta.`order` ASC, ta.id ASC",
                $tripId
            )
        ) ?: [];
    }

    /**
     * Get trip categories for a trip
     */
    public function getTripCategories(int $tripId): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_trip_categories';
        
        // Check if table exists first
        $table_exists = $wpdb->get_var($wpdb->prepare(
            "SHOW TABLES LIKE %s",
            $table
        )) === $table;
        
        if (!$table_exists) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log("Yatra: getTripCategories - Table {$table} does not exist");
            }
            return [];
        }
        
        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT ttc.*, tc.name as category_name, tc.slug as category_slug 
                 FROM `{$table}` ttc
                 LEFT JOIN `{$wpdb->prefix}yatra_trip_categories` tc ON ttc.category_id = tc.id
                 WHERE ttc.trip_id = %d
                 ORDER BY ttc.`order` ASC, ttc.id ASC",
                $tripId
            )
        ) ?: [];
        
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log("Yatra: getTripCategories - Found " . count($results) . " categories for trip {$tripId}");
            if (!empty($results)) {
                error_log("Yatra: getTripCategories - Sample category: " . json_encode($results[0]));
            }
        }
        
        return $results;
    }

    /**
     * Get price types for a trip
     */
    public function getPriceTypes(int $tripId): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_price_types';
        
        $sql = $wpdb->prepare(
                "SELECT tpt.*, tc.label as category_label, tc.slug as category_slug 
                 FROM `{$table}` tpt
                 LEFT JOIN `{$wpdb->prefix}yatra_traveler_categories` tc ON tpt.category_id = tc.id
                 WHERE tpt.trip_id = %d
                 ORDER BY tpt.id ASC",
                $tripId
        );
        
        error_log("Yatra getPriceTypes: SQL=" . $sql);
        
        $results = $wpdb->get_results($sql) ?: [];
        
        error_log("Yatra getPriceTypes: tripId={$tripId}, count=" . count($results));
        if (!empty($results)) {
            error_log("Yatra getPriceTypes: results=" . json_encode($results));
        }
        
        return $results;
    }

    /**
     * Get gallery images for a trip
     */
    public function getGalleryImages(int $tripId): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_gallery_images';
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM `{$table}` 
                 WHERE trip_id = %d
                 ORDER BY `order` ASC, id ASC",
                $tripId
            )
        ) ?: [];
    }

    /**
     * Get highlights for a trip
     */
    public function getHighlights(int $tripId): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_highlights';
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM `{$table}` 
                 WHERE trip_id = %d
                 ORDER BY `order` ASC, id ASC",
                $tripId
            )
        ) ?: [];
    }

    /**
     * Get FAQs for a trip
     */
    public function getFaqs(int $tripId): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_faqs';
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM `{$table}` 
                 WHERE trip_id = %d
                 ORDER BY `order` ASC, id ASC",
                $tripId
            )
        ) ?: [];
    }

    /**
     * Get availability dates for a trip
     */
    public function getAvailabilityDates(int $tripId): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_availability_dates';
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM `{$table}` 
                 WHERE trip_id = %d
                 ORDER BY departure_date ASC",
                $tripId
            )
        ) ?: [];
    }

    /**
     * Get itinerary days with entries for a trip
     */
    public function getItineraryDays(int $tripId): array
    {
        global $wpdb;
        $tableDays = $wpdb->prefix . 'yatra_trip_itinerary_days';
        $tableEntries = $wpdb->prefix . 'yatra_trip_itinerary_entries';
        $tableEntryImages = $wpdb->prefix . 'yatra_trip_itinerary_entry_images';
        
        // Check if tables exist, return empty array if they don't
        $table_exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM information_schema.tables 
             WHERE table_schema = %s AND table_name = %s",
            DB_NAME,
            $tableDays
        ));
        
        if (!$table_exists) {
            // Tables don't exist yet, return empty array
            return [];
        }
        
        // Get all days for this trip
        $days = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM `{$tableDays}` 
                 WHERE trip_id = %d
                 ORDER BY `order` ASC, day_number ASC",
                $tripId
            )
        ) ?: [];
        
        // For each day, load its entries
        foreach ($days as $day) {
            $dayId = (int) $day->id;
            
            // Get entries for this day
            $entries = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT * FROM `{$tableEntries}` 
                     WHERE day_id = %d
                     ORDER BY `order` ASC",
                    $dayId
                )
            ) ?: [];
            
            // For each entry, load images
            foreach ($entries as $entry) {
                $entryId = (int) $entry->id;
                
                // Decode included/excluded items JSON stored directly on the entry
                $entry->included_items = $this->decodeAmenityItems($entry->included_items ?? null);
                $entry->excluded_items = $this->decodeAmenityItems($entry->excluded_items ?? null);
                
                // Get images for this entry
                $images = $wpdb->get_results(
                    $wpdb->prepare(
                        "SELECT * FROM `{$tableEntryImages}` 
                         WHERE entry_id = %d
                         ORDER BY `order` ASC",
                        $entryId
                    )
                ) ?: [];
                
                $entry->images = array_map(function ($img) {
                    return $img->image_url ?? '';
                }, $images);
            }
            
            // Attach entries to day
            $day->entries = $entries;
        }
        
        return $days;
    }

    /**
     * Save destinations for a trip
     */
    public function saveDestinations(int $tripId, array $destinationIds): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_destinations';
        
        // Delete existing
        $wpdb->delete($table, ['trip_id' => $tripId], ['%d']);
        
        // Insert new
        if (!empty($destinationIds)) {
            foreach ($destinationIds as $index => $destinationId) {
                $wpdb->insert(
                    $table,
                    [
                        'trip_id' => $tripId,
                        'destination_id' => (int) $destinationId,
                        'is_primary' => $index === 0 ? 1 : 0,
                        'order' => $index,
                    ],
                    ['%d', '%d', '%d', '%d']
                );
            }
        }
    }

    /**
     * Save activities for a trip
     */
    public function saveActivities(int $tripId, array $activityIds): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_activities';
        
        // Delete existing
        $wpdb->delete($table, ['trip_id' => $tripId], ['%d']);
        
        // Insert new
        if (!empty($activityIds)) {
            foreach ($activityIds as $index => $activityId) {
                $wpdb->insert(
                    $table,
                    [
                        'trip_id' => $tripId,
                        'activity_id' => (int) $activityId,
                        'is_primary' => $index === 0 ? 1 : 0,
                        'order' => $index,
                    ],
                    ['%d', '%d', '%d', '%d']
                );
            }
        }
    }

    /**
     * Save trip categories for a trip
     */
    public function saveTripCategories(int $tripId, array $categoryIds): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_trip_categories';
        
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log("Yatra: saveTripCategories called with tripId={$tripId}, categoryIds=" . json_encode($categoryIds));
        }
        
        // Check if table exists first
        $table_exists = $wpdb->get_var($wpdb->prepare(
            "SHOW TABLES LIKE %s",
            $table
        )) === $table;
        
        if (!$table_exists) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log("Yatra: Table {$table} does not exist, creating tables...");
            }
            // Try to create tables
            \Yatra\Core\Database::createTables();
        }
        
        // Delete existing
        $wpdb->delete($table, ['trip_id' => $tripId], ['%d']);
        
        // Insert new
        if (!empty($categoryIds)) {
            foreach ($categoryIds as $index => $categoryId) {
                $result = $wpdb->insert(
                    $table,
                    [
                        'trip_id' => $tripId,
                        'category_id' => (int) $categoryId,
                        'is_primary' => $index === 0 ? 1 : 0,
                        'order' => $index,
                    ],
                    ['%d', '%d', '%d', '%d']
                );
                
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    if ($result === false) {
                        error_log("Yatra: Failed to insert trip category - " . $wpdb->last_error);
                    } else {
                        error_log("Yatra: Inserted trip category {$categoryId} for trip {$tripId}");
                    }
                }
            }
        } else {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log("Yatra: No category IDs to save for trip {$tripId}");
            }
        }
    }

    /**
     * Save price types for a trip
     */
    public function savePriceTypes(int $tripId, array $priceTypes): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_price_types';
        
        error_log("Yatra savePriceTypes: START - tripId={$tripId}, count=" . count($priceTypes));
        error_log("Yatra savePriceTypes: priceTypes=" . json_encode($priceTypes));
        
        // Delete existing price types for this trip first
        $deleteResult = $wpdb->query($wpdb->prepare(
            "DELETE FROM `{$table}` WHERE `trip_id` = %d",
            $tripId
        ));
        
        error_log("Yatra savePriceTypes: Deleted {$deleteResult} existing price types");
        
        // Insert new price types
        if (!empty($priceTypes)) {
            // Track category IDs to prevent duplicates in input
            $processedCategories = [];
            
            foreach ($priceTypes as $index => $priceType) {
                error_log("Yatra savePriceTypes: Processing index={$index}, priceType=" . json_encode($priceType));
                
                $categoryId = (int) ($priceType['category_id'] ?? 0);
                
                // Skip if category_id is 0 or already processed (duplicate in input)
                if ($categoryId <= 0) {
                    error_log("Yatra savePriceTypes: Skipping - invalid category_id={$categoryId}");
                    continue;
                }
                
                if (in_array($categoryId, $processedCategories, true)) {
                    error_log("Yatra savePriceTypes: Skipping - duplicate category_id={$categoryId}");
                    continue;
                }
                
                $processedCategories[] = $categoryId;
                
                // Simple insert with all required fields
                $insertData = [
                        'trip_id' => $tripId,
                    'category_id' => $categoryId,
                        'original_price' => (float) ($priceType['original_price'] ?? 0),
                    'is_default' => 0,
                    'min_quantity' => 1,
                ];
                
                // Add optional fields if they have values
                if (isset($priceType['discounted_price']) && $priceType['discounted_price'] !== '' && $priceType['discounted_price'] !== null) {
                    $insertData['discounted_price'] = (float) $priceType['discounted_price'];
                }
                
                error_log("Yatra savePriceTypes: Inserting data=" . json_encode($insertData));
                
                $result = $wpdb->insert($table, $insertData);
                
                if ($result === false) {
                    error_log("Yatra savePriceTypes: INSERT FAILED - " . $wpdb->last_error);
                } else {
                    error_log("Yatra savePriceTypes: INSERT SUCCESS - insert_id=" . $wpdb->insert_id);
                }
            }
        } else {
            error_log("Yatra savePriceTypes: No price types to insert (empty array)");
        }
        
        error_log("Yatra savePriceTypes: END");
    }

    /**
     * Save highlights for a trip
     */
    public function saveHighlights(int $tripId, array $highlights): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_highlights';
        
        // Delete existing
        $wpdb->delete($table, ['trip_id' => $tripId], ['%d']);
        
        // Insert new
        if (!empty($highlights)) {
            foreach ($highlights as $index => $highlight) {
                $highlightText = is_string($highlight) ? $highlight : ($highlight['text'] ?? $highlight['highlight_text'] ?? '');
                if (!empty($highlightText)) {
                    $wpdb->insert(
                        $table,
                        [
                            'trip_id' => $tripId,
                            'highlight_text' => sanitize_text_field($highlightText),
                            'highlight_icon' => is_array($highlight) ? ($highlight['icon'] ?? null) : null,
                            'highlight_image_id' => is_array($highlight) ? ($highlight['image_id'] ?? null) : null,
                            'order' => $index,
                            'is_featured' => is_array($highlight) && isset($highlight['is_featured']) ? (int) $highlight['is_featured'] : 0,
                        ],
                        ['%d', '%s', '%s', '%d', '%d', '%d']
                    );
                }
            }
        }
    }

    /**
     * Save gallery images for a trip
     */
    public function saveGalleryImages(int $tripId, array $galleryImages): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_gallery_images';
        
        // Delete existing
        $wpdb->delete($table, ['trip_id' => $tripId], ['%d']);
        
        // Insert new
        if (!empty($galleryImages)) {
            foreach ($galleryImages as $index => $image) {
                $imageUrl = is_string($image) ? $image : ($image['url'] ?? $image['image_url'] ?? '');
                if (!empty($imageUrl)) {
                    $wpdb->insert(
                        $table,
                        [
                            'trip_id' => $tripId,
                            'image_url' => esc_url_raw($imageUrl),
                            'image_id' => is_array($image) && isset($image['id']) ? (int) $image['id'] : 0,
                            'thumbnail_url' => is_array($image) ? ($image['thumbnail_url'] ?? null) : null,
                            'alt_text' => is_array($image) ? ($image['alt_text'] ?? null) : null,
                            'caption' => is_array($image) ? ($image['caption'] ?? null) : null,
                            'order' => $index,
                            'is_featured' => is_array($image) && isset($image['is_featured']) ? (int) $image['is_featured'] : 0,
                        ],
                        ['%d', '%s', '%d', '%s', '%s', '%s', '%d', '%d']
                    );
                }
            }
        }
    }

    /**
     * Save FAQs for a trip
     */
    public function saveFaqs(int $tripId, array $faqs): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_faqs';
        
        // Delete existing
        $wpdb->delete($table, ['trip_id' => $tripId], ['%d']);
        
        // Insert new
        if (!empty($faqs)) {
            foreach ($faqs as $index => $faq) {
                if (is_array($faq) && !empty($faq['question']) && !empty($faq['answer'])) {
                    $wpdb->insert(
                        $table,
                        [
                            'trip_id' => $tripId,
                            'question' => sanitize_text_field($faq['question']),
                            'answer' => wp_kses_post($faq['answer']),
                            'category' => isset($faq['category']) ? sanitize_text_field($faq['category']) : null,
                            'order' => $index,
                            'is_featured' => isset($faq['is_featured']) ? (int) $faq['is_featured'] : 0,
                        ],
                        ['%d', '%s', '%s', '%s', '%d', '%d']
                    );
                }
            }
        }
    }

    /**
     * Save itinerary days for a trip
     */
    public function saveItinerary(int $tripId, array $itineraryDays): void
    {
        global $wpdb;
        $tableDays = $wpdb->prefix . 'yatra_trip_itinerary_days';
        $tableEntries = $wpdb->prefix . 'yatra_trip_itinerary_entries';
        
        // Delete existing itinerary
        $wpdb->delete($tableEntries, ['trip_id' => $tripId], ['%d']);
        $wpdb->delete($tableDays, ['trip_id' => $tripId], ['%d']);
        
        // Insert new itinerary
        if (!empty($itineraryDays)) {
            foreach ($itineraryDays as $dayIndex => $day) {
                if (is_array($day)) {
                    $insertResult = $wpdb->insert(
                        $tableDays,
                        [
                            'trip_id' => $tripId,
                            'day_number' => $day['day_number'] ?? ($dayIndex + 1),
                            'title' => isset($day['title']) ? sanitize_text_field($day['title']) : null,
                            'description' => isset($day['description']) ? wp_kses_post($day['description']) : null,
                            'order' => $dayIndex,
                        ],
                        ['%d', '%d', '%s', '%s', '%d']
                    );
                    
                    // Save entries for this day
                    if ($insertResult !== false && isset($day['entries']) && is_array($day['entries'])) {
                        $dayId = $wpdb->insert_id;
                        foreach ($day['entries'] as $entryIndex => $entry) {
                            if (is_array($entry) && !empty($entry['title'])) {
                                $wpdb->insert(
                                    $tableEntries,
                                    [
                                        'trip_id' => $tripId,
                                        'day_id' => $dayId,
                                        'title' => sanitize_text_field($entry['title']),
                                        'description' => isset($entry['description']) ? wp_kses_post($entry['description']) : null,
                                        'time' => isset($entry['time']) ? sanitize_text_field($entry['time']) : null,
                                        'location' => isset($entry['location']) ? sanitize_text_field($entry['location']) : null,
                                        'item_type_id' => isset($entry['item_type_id']) ? (int) $entry['item_type_id'] : null,
                                        'item_id' => isset($entry['item_id']) ? (int) $entry['item_id'] : null,
                                        'order' => $entryIndex,
                                    ],
                                    ['%d', '%d', '%s', '%s', '%s', '%s', '%d', '%d', '%d']
                                );
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Save availability dates for a trip
     */
    public function saveAvailabilityDates(int $tripId, array $availabilityDates): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_availability_dates';
        
        // Delete existing
        $wpdb->delete($table, ['trip_id' => $tripId], ['%d']);
        
        // Insert new
        if (!empty($availabilityDates)) {
            foreach ($availabilityDates as $date) {
                if (is_array($date) && !empty($date['departure_date'])) {
                    $seatsTotal = isset($date['seats_total']) ? (int) $date['seats_total'] : 20;
                    $seatsAvailable = isset($date['seats_available']) ? (int) $date['seats_available'] : $seatsTotal;
                    
                    $insertData = [
                        'trip_id' => $tripId,
                        'departure_date' => sanitize_text_field($date['departure_date']),
                        'arrival_date' => isset($date['arrival_date']) ? sanitize_text_field($date['arrival_date']) : ($date['return_date'] ?? null),
                        'return_date' => isset($date['return_date']) ? sanitize_text_field($date['return_date']) : null,
                        'departure_time' => isset($date['departure_time']) ? sanitize_text_field($date['departure_time']) : null,
                        'arrival_time' => isset($date['arrival_time']) ? sanitize_text_field($date['arrival_time']) : null,
                        'seats_total' => $seatsTotal,
                        'seats_available' => $seatsAvailable,
                        'original_price' => isset($date['original_price']) ? (float) $date['original_price'] : (isset($date['price_override']) ? (float) $date['price_override'] : null),
                        'discounted_price' => isset($date['discounted_price']) ? (float) $date['discounted_price'] : null,
                        'from_location' => isset($date['from_location']) ? sanitize_text_field($date['from_location']) : null,
                        'to_location' => isset($date['to_location']) ? sanitize_text_field($date['to_location']) : null,
                        'status' => isset($date['is_blackout']) && $date['is_blackout'] ? 'blocked' : (isset($date['status']) ? sanitize_text_field($date['status']) : 'available'),
                    ];
                    
                    $wpdb->insert(
                        $table,
                        $insertData,
                        ['%d', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%f', '%f', '%s', '%s', '%s']
                    );
                }
            }
        }
    }

    /**
     * Create trip with relationships
     */
    public function createWithRelations(array $data, array $relationships = []): int
    {
        // Extract relationship data
        $destinations = $relationships['destinations'] ?? [];
        $activities = $relationships['activities'] ?? [];
        $tripCategories = $relationships['trip_category'] ?? [];
        $priceTypes = $relationships['price_types'] ?? [];
        $highlights = $relationships['highlights'] ?? [];
        $galleryImages = $relationships['gallery_images'] ?? [];
        $faqs = $relationships['faqs'] ?? [];
        $itineraryDays = $relationships['itinerary_days'] ?? [];
        $availabilityDates = $relationships['availability_dates'] ?? [];
        
        // Remove relationship data from main data (these should not be in the main table)
        unset(
            $data['destinations'], 
            $data['activities'], 
            $data['trip_category'],
            $data['price_types'],
            $data['highlights'],
            $data['gallery_images'],
            $data['faqs'],
            $data['itinerary_days'],
            $data['availability_dates']
        );
        
        // Create main trip record
        $tripId = $this->create($data);
        
        // Save relationships
        if (!empty($destinations)) {
            $this->saveDestinations($tripId, $destinations);
        }
        
        if (!empty($activities)) {
            $this->saveActivities($tripId, $activities);
        }
        
        if (!empty($tripCategories)) {
            $this->saveTripCategories($tripId, $tripCategories);
        }
        
        if (!empty($priceTypes)) {
            $this->savePriceTypes($tripId, $priceTypes);
        }
        
        if (!empty($highlights)) {
            $this->saveHighlights($tripId, $highlights);
        }
        
        if (!empty($galleryImages)) {
            $this->saveGalleryImages($tripId, $galleryImages);
        }
        
        if (!empty($faqs)) {
            $this->saveFaqs($tripId, $faqs);
        }
        
        if (!empty($itineraryDays)) {
            $this->saveItinerary($tripId, $itineraryDays);
        }
        
        if (!empty($availabilityDates)) {
            $this->saveAvailabilityDates($tripId, $availabilityDates);
        }

        do_action('yatra_trip_created_with_relations', $tripId, $relationships, $data);
        
        return $tripId;
    }

    /**
     * Update trip with relationships
     */
    public function updateWithRelations(int $id, array $data, array $relationships = []): bool
    {
        // Extract relationship data
        $destinations = $relationships['destinations'] ?? null;
        $activities = $relationships['activities'] ?? null;
        $tripCategories = $relationships['trip_category'] ?? null;
        $priceTypes = $relationships['price_types'] ?? null;
        $highlights = $relationships['highlights'] ?? null;
        $galleryImages = $relationships['gallery_images'] ?? null;
        $faqs = $relationships['faqs'] ?? null;
        $itineraryDays = $relationships['itinerary_days'] ?? null;
        $availabilityDates = $relationships['availability_dates'] ?? null;
        
        // Remove relationship data from main data (these should not be in the main table)
        unset(
            $data['destinations'], 
            $data['activities'], 
            $data['trip_category'],
            $data['price_types'],
            $data['highlights'],
            $data['gallery_images'],
            $data['faqs'],
            $data['itinerary_days'],
            $data['availability_dates']
        );
        
        // Update main trip record
        $result = $this->update($id, $data);
        
        // Update relationships if provided
        if ($destinations !== null) {
            $this->saveDestinations($id, $destinations);
        }
        
        if ($activities !== null) {
            $this->saveActivities($id, $activities);
        }
        
        if ($tripCategories !== null) {
            $this->saveTripCategories($id, $tripCategories);
        }
        
        if ($priceTypes !== null) {
            $this->savePriceTypes($id, $priceTypes);
        }
        
        if ($highlights !== null) {
            $this->saveHighlights($id, $highlights);
        }
        
        if ($galleryImages !== null) {
            $this->saveGalleryImages($id, $galleryImages);
        }
        
        if ($faqs !== null) {
            $this->saveFaqs($id, $faqs);
        }
        
        if ($itineraryDays !== null) {
            $this->saveItinerary($id, $itineraryDays);
        }
        
        if ($availabilityDates !== null) {
            $this->saveAvailabilityDates($id, $availabilityDates);
        }

        do_action('yatra_trip_updated_with_relations', $id, $relationships, $data);
        
        return $result;
    }

    /**
     * Soft delete a trip
     */
    public function softDelete(int $id, int $userId): bool
    {
        return $this->update($id, [
            'deleted_at' => current_time('mysql'),
            'deleted_by' => $userId,
        ]);
    }

    /**
     * Restore a soft-deleted trip
     */
    public function restore(int $id): bool
    {
        return $this->update($id, [
            'deleted_at' => null,
            'deleted_by' => null,
        ]);
    }

    /**
     * Get active trips (not deleted, with specified statuses)
     * 
     * @param array $args Query arguments
     * @param array $statuses Array of statuses to filter by. Defaults to ['published']
     * @return array
     */
    public function getActive(array $args = [], array $statuses = ['published']): array
    {
        $args['where']['deleted_at'] = null;
        
        // If status is already set in where clause, respect it
        if (!isset($args['where']['status'])) {
            $args['where']['status'] = $statuses;
        }
        
        return $this->all($args);
    }
    
    /**
     * Find trips within a price range, considering all pricing types
     * 
     * @param float $min_price Minimum price
     * @param float $max_price Maximum price
     * @param array $args Additional query arguments
     * @return array Array of trips
     */
    public function findByPriceRange(float $min_price = 0, float $max_price = 0, array $args = []): array
    {
        global $wpdb;
        
        // DEBUG: Log method entry
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('YATRA PRICE RANGE DEBUG - Method called with min_price=' . $min_price . ', max_price=' . $max_price);
            error_log('YATRA PRICE RANGE DEBUG - Args: ' . print_r($args, true));
        }
        
        // Base query to get all active trips
        $args['where']['deleted_at'] = null;
        if (!isset($args['where']['status'])) {
            $args['where']['status'] = ['publish', 'published', 'active'];
        }
        
        // DEBUG: Log query args
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('YATRA PRICE RANGE DEBUG - Query args: ' . print_r($args, true));
        }
        
        // Get all active trips first
        $all_trips = $this->all($args);
        
        // DEBUG: Log trips found
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('YATRA PRICE RANGE DEBUG - Found ' . count($all_trips) . ' active trips');
            if (!empty($all_trips)) {
                error_log('YATRA PRICE RANGE DEBUG - First trip sample: ' . print_r($all_trips[0], true));
            }
        }
        
        if (empty($all_trips)) {
            return [];
        }
        
        // Get trip IDs
        $trip_ids = array_map(function($trip) {
            return $trip->id;
        }, $all_trips);
        
        // Get minimum prices for each trip from all pricing sources
        $prices_table = $wpdb->prefix . 'yatra_trip_price_types';
        $availability_table = $wpdb->prefix . 'yatra_recurring_availability';
        
        // Get minimum prices from price types
        $price_types_sql = "
            SELECT trip_id, MIN(LEAST(
                NULLIF(sale_price, 0), 
                NULLIF(discounted_price, 0), 
                NULLIF(original_price, 0)
            )) as min_price
            FROM {$prices_table}
            WHERE trip_id IN (" . implode(',', array_fill(0, count($trip_ids), '%d')) . ")
            GROUP BY trip_id
        ";
        
        // Get minimum prices from availability rules
        $availability_sql = "
            SELECT 
                trip_id, 
                MIN(LEAST(
                    NULLIF(JSON_EXTRACT(traveler_pricing, '$[*].sale_price'), 'null'),
                    NULLIF(JSON_EXTRACT(traveler_pricing, '$[*].discounted_price'), 'null'),
                    NULLIF(JSON_EXTRACT(traveler_pricing, '$[*].original_price'), 'null'),
                    NULLIF(sale_price, 0),
                    NULLIF(original_price, 0)
                )) as min_price
            FROM {$availability_table}
            WHERE trip_id IN (" . implode(',', array_fill(0, count($trip_ids), '%d')) . ")
                AND status = 'active'
            GROUP BY trip_id
        ";
        
        // Execute queries with trip IDs
        $price_type_prices = $wpdb->get_results(
            $wpdb->prepare(
                $price_types_sql,
                $trip_ids // Only pass trip_ids once, not twice
            ),
            OBJECT_K
        );
        
        // Get trip prices and filter by range
        $filtered_trips = [];
        
        // DEBUG: Log price filtering process
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('YATRA PRICE RANGE DEBUG - Starting price filtering for ' . count($all_trips) . ' trips');
            error_log('YATRA PRICE RANGE DEBUG - Filter range: $' . $min_price . ' - $' . $max_price);
        }
        
        foreach ($all_trips as $trip) {
            $trip_id = $trip->id;
            $trip_min_price = PHP_FLOAT_MAX;
            
            // Check trip's own price first
            if (!empty($trip->sale_price) && $trip->sale_price > 0) {
                $trip_min_price = min($trip_min_price, (float)$trip->sale_price);
            }
            if (!empty($trip->discounted_price) && $trip->discounted_price > 0) {
                $trip_min_price = min($trip_min_price, (float)$trip->discounted_price);
            }
            if (!empty($trip->original_price) && $trip->original_price > 0) {
                $trip_min_price = min($trip_min_price, (float)$trip->original_price);
            }
            
            // Check price types
            if (isset($price_type_prices[$trip_id]) && $price_type_prices[$trip_id]->min_price > 0) {
                $trip_min_price = min($trip_min_price, (float)$price_type_prices[$trip_id]->min_price);
            }
            
            // If no valid price found, skip
            if ($trip_min_price === PHP_FLOAT_MAX) {
                continue;
            }
            
            // Apply price range filter
            $passes_filter = ($min_price === 0 || $trip_min_price >= $min_price) && 
                           ($max_price === 0 || $trip_min_price <= $max_price);
            
            // DEBUG: Log individual trip filtering
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('YATRA PRICE RANGE DEBUG - Trip ID ' . $trip_id . ': trip_min_price=$' . $trip_min_price . ', passes_filter=' . ($passes_filter ? 'YES' : 'NO'));
            }
            
            if ($passes_filter) {
                $trip->min_price = $trip_min_price;
                $filtered_trips[] = $trip;
            }
        }
        
        return $filtered_trips;
    }

    /**
     * Build where clause (override to handle soft deletes)
     */
    protected function buildWhereClause(array $args): string
    {
        $where = parent::buildWhereClause($args);
        
        // Add soft delete filter if not explicitly requested
        if (!isset($args['include_deleted']) || !$args['include_deleted']) {
            if ($where) {
                $where .= ' AND (deleted_at IS NULL OR deleted_at = \'0000-00-00 00:00:00\')';
            } else {
                $where = 'WHERE (deleted_at IS NULL OR deleted_at = \'0000-00-00 00:00:00\')';
            }
        }
        
        return $where;
    }

    /**
     * Count trips by status
     */
    public function countByStatus(string $status): int
    {
        $table = esc_sql($this->table);
        $count = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SELECT COUNT(*) FROM `{$table}` 
                 WHERE status = %s 
                 AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00')",
                $status
            )
        );
        
        return (int) $count;
    }

    /**
     * Search trips by keyword
     */
    public function search(string $keyword, array $args = []): array
    {
        $table = esc_sql($this->table);
        $where = $this->buildWhereClause($args);
        $order = $this->buildOrderClause($args);
        $limit = $this->buildLimitClause($args);
        
        $searchTerm = '%' . $this->wpdb->esc_like($keyword) . '%';
        
        $query = $this->wpdb->prepare(
            "SELECT * FROM `{$table}` 
             {$where} 
             AND (title LIKE %s OR description LIKE %s OR short_description LIKE %s)
             {$order} {$limit}",
            $searchTerm,
            $searchTerm,
            $searchTerm
        );
        
        return $this->wpdb->get_results($query) ?: [];
    }

    /**
     * Decode included/excluded items JSON column stored on itinerary entries
     */
    private function decodeAmenityItems($value): array
    {
        if (empty($value)) {
            return [];
        }

        if (is_array($value)) {
            return $value;
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : [];
        }

        return [];
    }
}
