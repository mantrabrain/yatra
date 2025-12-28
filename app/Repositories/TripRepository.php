<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Database\Tables\BookingsTable;
use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Database\Tables\ReviewsTable;
use Yatra\Database\Tables\TripClassificationsTable;
use Yatra\Database\Tables\TripContentTable;
use Yatra\Database\Tables\TripItineraryDayEntryTable;
use Yatra\Database\Tables\TripItineraryDaysTable;
use Yatra\Database\Tables\TripPricingTable;
use Yatra\Database\Tables\TripsTable;
use Yatra\Models\Trip;
use Yatra\Utils\Cache;
use Yatra\Database\Tables\TripAvailabilityDatesTable;
use Yatra\Database\Tables\TripAvailabilityRulesTable;
use Yatra\Constants\ClassificationTypes;

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
     * Rich text fields specific to trips
     */
    protected array $richTextFields = ['description'];

    /**
     * Integer fields specific to trips
     */
    protected array $integerFields = ['id', 'created_by', 'updated_by', 'difficulty_level', 'duration', 'group_size'];

    /**
     * Get table name
     */
    protected function getTableName(): string
    {
     return TripsTable::getTableName();
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
        $query = "SELECT * FROM `{$table}` WHERE id = %d AND status IN ('publish', 'published')";

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
        
        // Use new table classes
        $reviews_table = ReviewsTable::getTableName();
        $bookings_table = BookingsTable::getTableName();
        // Build WHERE conditions and parameters
        $wheres = ["t.status IN ('publish', 'published')", "(t.deleted_at IS NULL OR t.deleted_at = '0000-00-00 00:00:00')"];
        $params = [];
        $joins = [];
        $having_clauses = [];
        $rating_params = [];
        
        $classificationsTable = ClassificationsTable::getTableName();
        $tripClassificationsTable = TripClassificationsTable::getTableName();

        // Destination filter
        if (!empty($filters['destination'])) {
            $joins[] = "LEFT JOIN {$tripClassificationsTable} tcd ON tcd.trip_id = t.id";
            $joins[] = "LEFT JOIN {$classificationsTable} dest ON dest.id = tcd.classification_id";
            $wheres[] = "dest.type = %s AND dest.slug = %s";
            $params[] = ClassificationTypes::DESTINATION;
            $params[] = $filters['destination'];
        }
        
        // Activity filter
        if (!empty($filters['activity'])) {
            $joins[] = "LEFT JOIN {$tripClassificationsTable} tca ON tca.trip_id = t.id";
            $joins[] = "LEFT JOIN {$classificationsTable} act ON act.id = tca.classification_id";
            $wheres[] = "act.type = %s AND act.slug = %s";
            $params[] = ClassificationTypes::ACTIVITY;
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
            $joins[] = "LEFT JOIN {$classificationsTable} dl ON dl.id = t.difficulty_level";
            $difficulty_placeholders = implode(',', array_fill(0, count($filters['difficulty']), '%d'));
            $wheres[] = "dl.type = %s AND dl.id IN ({$difficulty_placeholders})";
            $params[] = ClassificationTypes::DIFFICULTY;
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

        // Use ClassificationsTable for difficulty levels (type = 'difficulty')
        $difficulty_table = ClassificationsTable::getTableName();

        // Use advanced caching system instead of simple array cache
        $tableExists = Cache::tableExists($difficulty_table, function() use ($wpdb, $difficulty_table) {
            return (bool) $wpdb->get_var("SHOW TABLES LIKE '{$difficulty_table}'");
        });

        if ($tableExists) {
            // Map yatra_trips.difficulty_level (bigint ID) to yatra_classifications table
            // The difficulty_level field contains the classification ID
            return sprintf(
                "LEFT JOIN {$difficulty_table} diff ON diff.id = t.difficulty_level AND diff.type = '%s'",
                ClassificationTypes::DIFFICULTY
            );
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
        // Using TripPricingTable for pricing data
        $price_types_table = TripPricingTable::getTableName();
        $pricing_data = $wpdb->get_results($wpdb->prepare(
            "SELECT trip_id,
                    base_price AS original_price,
                    adjusted_price AS discounted_price,
                    CASE 
                        WHEN adjusted_price IS NOT NULL AND adjusted_price > 0 THEN adjusted_price 
                        ELSE base_price 
                    END as effective_price,
                    CASE 
                        WHEN adjusted_price IS NOT NULL AND adjusted_price > 0 AND base_price > 0 
                        THEN ROUND(((base_price - adjusted_price) / base_price) * 100)
                        ELSE 0
                    END as discount_percentage
             FROM {$price_types_table} 
             WHERE trip_id IN ({$trip_ids_placeholder}) AND (
                 (adjusted_price IS NOT NULL AND adjusted_price > 0) OR 
                 (base_price IS NOT NULL AND base_price > 0)
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
        $tripClassificationsTable = \Yatra\Database\Tables\TripClassificationsTable::getTableName();
        $classificationsTable = \Yatra\Database\Tables\ClassificationsTable::getTableName();
        $destinations_data = [];
        $destTableExists = Cache::tableExists($tripClassificationsTable, function() use ($wpdb, $tripClassificationsTable) {
            return (bool) $wpdb->get_var("SHOW TABLES LIKE '{$tripClassificationsTable}'");
        });
        
        if ($destTableExists) {
            $destinations_raw = $wpdb->get_results($wpdb->prepare(
                "SELECT tc.trip_id, c.* FROM {$classificationsTable} c
                 INNER JOIN {$tripClassificationsTable} tc ON c.id = tc.classification_id
                 WHERE tc.trip_id IN ({$trip_ids_placeholder}) AND c.type = %s AND c.status = 'publish'
                 ORDER BY tc.trip_id, tc.sort_order ASC, c.name ASC",
                ...$trip_ids, ClassificationTypes::DESTINATION
            ));
            
            foreach ($destinations_raw as $dest) {
                $trip_id = $dest->trip_id;
                unset($dest->trip_id);
                $destinations_data[$trip_id][] = $dest;
            }
        }

        // Batch load activities
        $activities_data = [];
        $actTableExists = Cache::tableExists($tripClassificationsTable, function() use ($wpdb, $tripClassificationsTable) {
            return (bool) $wpdb->get_var("SHOW TABLES LIKE '{$tripClassificationsTable}'");
        });
        
        if ($actTableExists) {
            $activities_raw = $wpdb->get_results($wpdb->prepare(
                "SELECT tc.trip_id, c.* FROM {$classificationsTable} c
                 INNER JOIN {$tripClassificationsTable} tc ON c.id = tc.classification_id
                 WHERE tc.trip_id IN ({$trip_ids_placeholder}) AND c.type = %s AND c.status = 'publish'
                 ORDER BY tc.trip_id, tc.sort_order ASC, c.name ASC",
                ...$trip_ids, ClassificationTypes::ACTIVITY
            ));
            
            foreach ($activities_raw as $act) {
                $trip_id = $act->trip_id;
                unset($act->trip_id);
                $activities_data[$trip_id][] = $act;
            }
        }

        // Batch load categories
        // Using TripClassificationsTable for category relationships
        $cat_rel_table = $tripClassificationsTable;
        $categories_data = [];
        $catTableExists = Cache::tableExists($cat_rel_table, function() use ($wpdb, $cat_rel_table) {
            return (bool) $wpdb->get_var("SHOW TABLES LIKE '{$cat_rel_table}'");
        });
        
        if ($catTableExists) {
            $categories_raw = $wpdb->get_results($wpdb->prepare(
                "SELECT tc.trip_id, c.* FROM {$classificationsTable} c
                 INNER JOIN {$cat_rel_table} tc ON c.id = tc.classification_id
                 WHERE tc.trip_id IN ({$trip_ids_placeholder}) 
                   AND c.type = %s AND c.status = 'publish'
                 ORDER BY tc.trip_id, c.name ASC",
                ...array_merge($trip_ids, [ClassificationTypes::CATEGORY])
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
            $price_types_table = TripPricingTable::getTableName();
            $all_price_types = $wpdb->get_results($wpdb->prepare(
                "SELECT base_price AS original_price, adjusted_price AS discounted_price,
                        CASE 
                            WHEN adjusted_price IS NOT NULL AND adjusted_price > 0 THEN adjusted_price 
                            ELSE base_price 
                        END as effective_price,
                        CASE 
                            WHEN adjusted_price IS NOT NULL AND adjusted_price > 0 AND base_price > 0 
                            THEN ROUND(((base_price - adjusted_price) / base_price) * 100)
                            ELSE 0
                        END as discount_percentage
                 FROM {$price_types_table} 
                 WHERE trip_id = %d AND pricing_type = 'traveler_category' AND (
                     (adjusted_price IS NOT NULL AND adjusted_price > 0) OR 
                     (base_price IS NOT NULL AND base_price > 0)
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
        
        // Use new Classification tables
        $tripClassificationsTable = \Yatra\Database\Tables\TripClassificationsTable::getTableName();
        $classificationsTable = \Yatra\Database\Tables\ClassificationsTable::getTableName();
        
        // Load destinations
        $destinations = $wpdb->get_results($wpdb->prepare(
            "SELECT c.* FROM {$classificationsTable} c
             INNER JOIN {$tripClassificationsTable} tc ON c.id = tc.classification_id
             WHERE tc.trip_id = %d AND c.type = %s AND c.status = 'publish'
             ORDER BY tc.sort_order ASC, c.name ASC",
            $trip->id, ClassificationTypes::DESTINATION
        ));
        $trip->destinations = $destinations ?: [];
        
        // Load activities
        $activities = $wpdb->get_results($wpdb->prepare(
            "SELECT c.* FROM {$classificationsTable} c
             INNER JOIN {$tripClassificationsTable} tc ON c.id = tc.classification_id
             WHERE tc.trip_id = %d AND c.type = %s AND c.status = 'publish'
             ORDER BY tc.sort_order ASC, c.name ASC",
            $trip->id, ClassificationTypes::ACTIVITY
        ));
        $trip->activities = $activities ?: [];
        
        // Load categories
        $categories = $wpdb->get_results($wpdb->prepare(
            "SELECT c.* FROM {$classificationsTable} c
             INNER JOIN {$tripClassificationsTable} tc ON c.id = tc.classification_id
             WHERE tc.trip_id = %d AND c.type = %s AND c.status = 'publish'
             ORDER BY tc.sort_order ASC, c.name ASC",
            $trip->id, ClassificationTypes::CATEGORY
        ));
        $trip->categories = $categories ?: [];
        
        // Load price types for traveler-based pricing
        if (!empty($trip->pricing_type) && $trip->pricing_type === 'traveler_based') {
            $tripPricingTable = \Yatra\Database\Tables\TripPricingTable::getTableName();
            $price_types = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM {$tripPricingTable}
                 WHERE trip_id = %d AND pricing_type = 'traveler_category'
                 ORDER BY original_price ASC",
                $trip->id
            ));
            $trip->price_types = $price_types ?: [];
        } else {
            $trip->price_types = [];
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
    public function findWithRelations(int $id, bool $includeDeleted = false): ?\stdClass
    {
        $trip = $this->find($id, $includeDeleted);
        
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
        
        // Use new Classification tables
        $tripClassificationsTable = \Yatra\Database\Tables\TripClassificationsTable::getTableName();
        $classificationsTable = \Yatra\Database\Tables\ClassificationsTable::getTableName();
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT tc.*, c.name as destination_name, c.slug as destination_slug 
                 FROM {$tripClassificationsTable} tc
                 LEFT JOIN {$classificationsTable} c ON c.id = tc.classification_id
                 WHERE tc.trip_id = %d AND c.type = %s
                 ORDER BY tc.sort_order ASC, tc.id ASC",
                $tripId, ClassificationTypes::DESTINATION
            )
        ) ?: [];
    }

    /**
     * Get activities for a trip
     */
    public function getActivities(int $tripId): array
    {
        global $wpdb;
        
        // Use new Classification tables
        $tripClassificationsTable = \Yatra\Database\Tables\TripClassificationsTable::getTableName();
        $classificationsTable = \Yatra\Database\Tables\ClassificationsTable::getTableName();
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT tc.*, c.name as activity_name, c.slug as activity_slug 
                 FROM {$tripClassificationsTable} tc
                 LEFT JOIN {$classificationsTable} c ON c.id = tc.classification_id
                 WHERE tc.trip_id = %d AND c.type = %s
                 ORDER BY tc.sort_order ASC, tc.id ASC",
                $tripId, ClassificationTypes::ACTIVITY
            )
        ) ?: [];
    }

    /**
     * Get trip categories for a trip
     */
    public function getTripCategories(int $tripId): array
    {
        global $wpdb;
        
        // Use TripClassificationsTable for trip-category relationships
        $tripClassificationsTable = \Yatra\Database\Tables\TripClassificationsTable::getTableName();
        $classificationsTable = \Yatra\Database\Tables\ClassificationsTable::getTableName();
        
        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT tc.*, c.name as category_name, c.slug as category_slug 
                 FROM {$tripClassificationsTable} tc
                 LEFT JOIN {$classificationsTable} c ON c.id = tc.classification_id
                 WHERE tc.trip_id = %d AND c.type = %s
                 ORDER BY tc.sort_order ASC, tc.id ASC",
                $tripId, ClassificationTypes::CATEGORY
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
        
        // Use TripPricingTable for pricing data and ClassificationsTable for traveler categories
        $tripPricingTable = \Yatra\Database\Tables\TripPricingTable::getTableName();
        $classificationsTable = \Yatra\Database\Tables\ClassificationsTable::getTableName();
        
        $sql = $wpdb->prepare(
                "SELECT tpt.*, c.name as category_label, c.slug as category_slug 
                 FROM {$tripPricingTable} tpt
                 LEFT JOIN {$classificationsTable} c ON tpt.category_id = c.id
                 WHERE tpt.trip_id = %d AND tpt.pricing_type = 'traveler_category'
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
        
        // Use TripContentTable for gallery images
        $tripContentTable = \Yatra\Database\Tables\TripContentTable::getTableName();
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$tripContentTable} 
                 WHERE trip_id = %d AND content_type = 'image'
                 ORDER BY sort_order ASC, id ASC",
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
        
        // Use TripContentTable for highlights
        $tripContentTable = \Yatra\Database\Tables\TripContentTable::getTableName();
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$tripContentTable} 
                 WHERE trip_id = %d AND content_type = 'highlight'
                 ORDER BY sort_order ASC, id ASC",
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
        
        // Use TripContentTable for FAQs
        $tripContentTable = \Yatra\Database\Tables\TripContentTable::getTableName();
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$tripContentTable} 
                 WHERE trip_id = %d AND content_type = 'faq'
                 ORDER BY sort_order ASC, id ASC",
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
        $table = TripAvailabilityDatesTable::getTableName();
        
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
        
        // Use new table names for itinerary
        $tableDays = \Yatra\Database\Tables\TripItineraryDaysTable::getTableName();
        $tableEntries = \Yatra\Database\Tables\TripItineraryDayEntryTable::getTableName();
        
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
            
            // Process each entry
            foreach ($entries as $entry) {
                // Decode included/excluded items JSON stored directly on the entry
                $entry->included_items = $this->decodeAmenityItems($entry->included_items ?? null);
                $entry->excluded_items = $this->decodeAmenityItems($entry->excluded_items ?? null);
                
                // Images are stored in metadata in the new structure
                $entry->images = [];
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
        
        $table = TripClassificationsTable::getTableName();
        
        // Delete existing destination relations
        $wpdb->delete(
            $table,
            [
                'trip_id' => $tripId,
                'classification_type' => ClassificationTypes::DESTINATION,
            ],
            ['%d', '%s']
        );
        
        // Insert new destination relations
        if (!empty($destinationIds)) {
            foreach ($destinationIds as $index => $destinationId) {
                $wpdb->insert(
                    $table,
                    [
                        'trip_id' => $tripId,
                        'classification_id' => (int) $destinationId,
                        'classification_type' => ClassificationTypes::DESTINATION,
                        'relationship_type' => $index === 0 ? 'primary' : 'secondary',
                        'sort_order' => $index,
                        'is_featured' => $index === 0 ? 1 : 0,
                    ],
                    ['%d', '%d', '%s', '%s', '%d', '%d']
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
        
        $table = TripClassificationsTable::getTableName();
        
        // Delete existing activity relations
        $wpdb->delete(
            $table,
            [
                'trip_id' => $tripId,
                'classification_type' => ClassificationTypes::ACTIVITY,
            ],
            ['%d', '%s']
        );
        
        // Insert new activity relations
        if (!empty($activityIds)) {
            foreach ($activityIds as $index => $activityId) {
                $wpdb->insert(
                    $table,
                    [
                        'trip_id' => $tripId,
                        'classification_id' => (int) $activityId,
                        'classification_type' => ClassificationTypes::ACTIVITY,
                        'relationship_type' => $index === 0 ? 'primary' : 'secondary',
                        'sort_order' => $index,
                        'is_featured' => $index === 0 ? 1 : 0,
                    ],
                    ['%d', '%d', '%s', '%s', '%d', '%d']
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
        
        $table = TripClassificationsTable::getTableName();
        
        // Delete existing category relations
        $wpdb->delete(
            $table,
            [
                'trip_id' => $tripId,
                'classification_type' => ClassificationTypes::CATEGORY,
            ],
            ['%d', '%s']
        );
        
        // Insert new categories
        if (!empty($categoryIds)) {
            foreach ($categoryIds as $index => $categoryId) {
                $wpdb->insert(
                    $table,
                    [
                        'trip_id' => $tripId,
                        'classification_id' => (int) $categoryId,
                        'classification_type' => ClassificationTypes::CATEGORY,
                        'relationship_type' => $index === 0 ? 'primary' : 'secondary',
                        'sort_order' => $index,
                        'is_featured' => $index === 0 ? 1 : 0,
                    ],
                    ['%d', '%d', '%s', '%s', '%d', '%d']
                );
            }
        }
    }

    /**
     * Save price types for a trip
     */
    public function savePriceTypes(int $tripId, array $priceTypes): void
    {
        global $wpdb;
        
        $table = TripPricingTable::getTableName();
        
        error_log("Yatra savePriceTypes: START - tripId={$tripId}, count=" . count($priceTypes));
        error_log("Yatra savePriceTypes: priceTypes=" . json_encode($priceTypes));
        
        // Delete existing traveler-category price types for this trip
        $deleteResult = $wpdb->query($wpdb->prepare(
            "DELETE FROM `{$table}` WHERE `trip_id` = %d AND `pricing_type` = 'traveler_category'",
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
                
                $basePrice = (float) ($priceType['original_price'] ?? $priceType['base_price'] ?? 0);
                $adjustedPrice = isset($priceType['discounted_price']) && $priceType['discounted_price'] !== '' && $priceType['discounted_price'] !== null
                    ? (float) $priceType['discounted_price']
                    : null;
                
                $insertData = [
                    'trip_id' => $tripId,
                    'pricing_type' => 'traveler_category',
                    'category_id' => $categoryId,
                    'base_price' => $basePrice,
                    'adjusted_price' => $adjustedPrice,
                    'price_per' => 'person',
                    'currency' => get_option('yatra_currency', 'USD'),
                    'min_quantity' => 1,
                    'is_default' => $index === 0 ? 1 : 0,
                    'sort_order' => $index,
                    'is_active' => 1,
                ];
                
                error_log("Yatra savePriceTypes: Inserting data=" . json_encode($insertData));
                
                $result = $wpdb->insert($table, $insertData, ['%d','%s','%d','%f','%f','%s','%s','%d','%d','%d','%d']);
                
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
        
        $table = TripContentTable::getTableName();
        
        // Delete existing highlights
        $wpdb->delete(
            $table,
            [
                'trip_id' => $tripId,
                'content_type' => 'highlight',
            ],
            ['%d', '%s']
        );
        
        if (!empty($highlights)) {
            foreach ($highlights as $index => $highlight) {
                $highlightText = is_string($highlight) ? $highlight : ($highlight['text'] ?? $highlight['highlight_text'] ?? '');
                if (empty($highlightText)) {
                    continue;
                }
                
                $metadata = [];
                if (is_array($highlight)) {
                    if (!empty($highlight['icon'])) {
                        $metadata['icon'] = $highlight['icon'];
                    }
                    if (!empty($highlight['image_id'])) {
                        $metadata['image_id'] = (int) $highlight['image_id'];
                    }
                }
                
                $wpdb->insert(
                    $table,
                    [
                        'trip_id' => $tripId,
                        'content_type' => 'highlight',
                        'title' => sanitize_text_field($highlightText),
                        'description' => is_array($highlight) && !empty($highlight['description']) ? wp_kses_post($highlight['description']) : null,
                        'metadata' => !empty($metadata) ? wp_json_encode($metadata) : null,
                        'sort_order' => $index,
                        'is_featured' => is_array($highlight) && isset($highlight['is_featured']) ? (int) $highlight['is_featured'] : 0,
                    ],
                    ['%d', '%s', '%s', '%s', '%s', '%d', '%d']
                );
            }
        }
    }

    /**
     * Save gallery images for a trip
     */
    public function saveGalleryImages(int $tripId, array $galleryImages): void
    {
        global $wpdb;
        
        $table = TripContentTable::getTableName();
        
        // Delete existing gallery images
        $wpdb->delete(
            $table,
            [
                'trip_id' => $tripId,
                'content_type' => 'image',
            ],
            ['%d', '%s']
        );
        
        // Insert new
        if (!empty($galleryImages)) {
            foreach ($galleryImages as $index => $image) {
                $imageUrl = is_string($image) ? $image : ($image['url'] ?? $image['image_url'] ?? '');
                if (empty($imageUrl)) {
                    continue;
                }
                
                $metadata = [];
                if (is_array($image)) {
                    if (!empty($image['alt_text'])) {
                        $metadata['alt_text'] = $image['alt_text'];
                    }
                    if (!empty($image['caption'])) {
                        $metadata['caption'] = $image['caption'];
                    }
                }
                
                $wpdb->insert(
                    $table,
                    [
                        'trip_id' => $tripId,
                        'content_type' => 'image',
                        'content_url' => esc_url_raw($imageUrl),
                        'file_path' => is_array($image) ? ($image['file_path'] ?? null) : null,
                        'metadata' => !empty($metadata) ? wp_json_encode($metadata) : null,
                        'thumbnail_url' => is_array($image) ? ($image['thumbnail_url'] ?? null) : null,
                        'sort_order' => $index,
                        'is_featured' => is_array($image) && isset($image['is_featured']) ? (int) $image['is_featured'] : 0,
                    ],
                    ['%d', '%s', '%s', '%s', '%s', '%s', '%d', '%d']
                );
            }
        }
    }

    /**
     * Save FAQs for a trip
     */
    public function saveFaqs(int $tripId, array $faqs): void
    {
        global $wpdb;
        
        $table = TripContentTable::getTableName();
        
        // Delete existing FAQs
        $wpdb->delete(
            $table,
            [
                'trip_id' => $tripId,
                'content_type' => 'faq',
            ],
            ['%d', '%s']
        );
        
        // Insert new FAQs
        if (!empty($faqs)) {
            foreach ($faqs as $index => $faq) {
                if (!is_array($faq) || empty($faq['question']) || empty($faq['answer'])) {
                    continue;
                }
                
                $metadata = [];
                if (!empty($faq['category'])) {
                    $metadata['category'] = sanitize_text_field($faq['category']);
                }
                
                $wpdb->insert(
                    $table,
                    [
                        'trip_id' => $tripId,
                        'content_type' => 'faq',
                        'title' => sanitize_text_field($faq['question']),
                        'description' => wp_kses_post($faq['answer']),
                        'metadata' => !empty($metadata) ? wp_json_encode($metadata) : null,
                        'sort_order' => $index,
                        'is_featured' => isset($faq['is_featured']) ? (int) $faq['is_featured'] : 0,
                    ],
                    ['%d', '%s', '%s', '%s', '%s', '%d', '%d']
                );
            }
        }
    }

    /**
     * Save itinerary days for a trip
     */
    public function saveItinerary(int $tripId, array $itineraryDays): void
    {
        global $wpdb;
        
        $tableDays = TripItineraryDaysTable::getTableName();
        $tableEntries = TripItineraryDayEntryTable::getTableName();
        
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
        $table = TripAvailabilityDatesTable::getTableName();
        
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
     * Save attributes for a trip
     */
    public function saveAttributes(int $tripId, array $attributes): void
    {
        $tripAttributeRepository = new \Yatra\Repositories\TripAttributeRepository();
        $tripAttributeRepository->saveTripAttributes($tripId, $attributes);
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
        $attributes = $relationships['attributes'] ?? [];
        
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
            $data['availability_dates'],
            $data['attributes']
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
        
        if (!empty($attributes)) {
            $this->saveAttributes($tripId, $attributes);
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
        $attributes = $relationships['attributes'] ?? null;
        
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
            $data['availability_dates'],
            $data['attributes']
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
        
        if ($attributes !== null) {
            $this->saveAttributes($id, $attributes);
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
    public function getActive(array $args = [], array $statuses = ['publish']): array
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
            $args['where']['status'] = ['publish'];
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
        // Using TripPricingTable for pricing data
        $prices_table = TripPricingTable::getTableName();
        $availability_table = TripAvailabilityRulesTable::getTableName();
        
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
        
        // Build search condition
        $searchCondition = "(title LIKE %s OR description LIKE %s OR short_description LIKE %s)";
        
        // If we have a WHERE clause, add AND; otherwise start with WHERE
        if (!empty($where)) {
            $whereClause = "{$where} AND {$searchCondition}";
        } else {
            $whereClause = "WHERE {$searchCondition}";
        }
        
        $query = $this->wpdb->prepare(
            "SELECT * FROM `{$table}` {$whereClause} {$order} {$limit}",
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

    /**
     * Get trip title by ID
     */
    public function getTripTitle(int $tripId): string
    {
        global $wpdb;
        $trips_table = $this->getTableName();
        
        return (string) $wpdb->get_var($wpdb->prepare(
            "SELECT title FROM {$trips_table} WHERE id = %d",
            $tripId
        )) ?: '';
    }

    /**
     * Count all trips
     */
    public function countAllTrips(): int
    {
        global $wpdb;
        $trips_table = $this->getTableName();
        
        return (int) $wpdb->get_var("SELECT COUNT(*) FROM `{$trips_table}`");
    }

    /**
     * Get trip status counts
     */
    public function getTripStatusCounts(): array
    {
        global $wpdb;
        $trips_table = $this->getTableName();
        
        return $wpdb->get_results("SELECT status, COUNT(*) as count FROM `{$trips_table}` GROUP BY status");
    }

    /**
     * Get trip with destinations
     */
    public function getTripWithDestinations(int $tripId): ?\stdClass
    {
        global $wpdb;
        $trips_table = $this->getTableName();
        
        // Use ClassificationsTable for destinations (type = 'destination')
        $trip_destinations_table = TripClassificationsTable::getTableName();
        $destinations_table = ClassificationsTable::getTableName();
        
        return $wpdb->get_row($wpdb->prepare(
            "SELECT t.id, t.title, t.slug, t.status, t.pricing_type, t.original_price, t.sale_price,
                    td.destination_id, d.name as destination_name, d.slug as destination_slug
             FROM {$trips_table} t
             LEFT JOIN {$trip_destinations_table} td ON td.trip_id = t.id
             LEFT JOIN {$destinations_table} d ON d.id = td.destination_id
             WHERE t.id = %d",
            $tripId
        ));
    }

    /**
     * Get trip destinations
     */
    public function getTripDestinations(int $tripId): array
    {
        global $wpdb;
        
        // Use new TripClassificationsTable for trip-destination relationships
        $tripClassificationsTable = \Yatra\Database\Tables\TripClassificationsTable::getTableName();
        $classificationsTable = \Yatra\Database\Tables\ClassificationsTable::getTableName();
        
        return $wpdb->get_results($wpdb->prepare(
            "SELECT tc.trip_id, c.id, c.name, c.slug
             FROM {$tripClassificationsTable} tc
             INNER JOIN {$classificationsTable} c ON c.id = tc.classification_id
             WHERE tc.trip_id = %d AND c.type = 'destination'",
            $tripId
        ));
    }

    /**
     * Get trip activities
     */
    public function getTripActivities(int $tripId): array
    {
        global $wpdb;
        
        // Use new TripClassificationsTable for trip-activity relationships
        $tripClassificationsTable = \Yatra\Database\Tables\TripClassificationsTable::getTableName();
        $classificationsTable = \Yatra\Database\Tables\ClassificationsTable::getTableName();
        
        return $wpdb->get_results($wpdb->prepare(
            "SELECT tc.trip_id, c.id, c.name, c.slug
             FROM {$tripClassificationsTable} tc
             INNER JOIN {$classificationsTable} c ON c.id = tc.classification_id
             WHERE tc.trip_id = %d AND c.type = 'activity'",
            $tripId
        ));
    }

    /**
     * Get trip with availability
     */
    public function getTripWithAvailability(int $tripId): ?\stdClass
    {
        global $wpdb;
        $trips_table = $this->getTableName();
        
        // Use TripAvailabilityDatesTable for availability data
        $availability_table = \Yatra\Database\Tables\TripAvailabilityDatesTable::getTableName();
        
        return $wpdb->get_row($wpdb->prepare(
            "SELECT t.*, a.departure_date, a.seats_total, a.seats_booked, a.status as availability_status
             FROM {$trips_table} t
             LEFT JOIN {$availability_table} a ON a.trip_id = t.id
             WHERE t.id = %d",
            $tripId
        ));
    }

    /**
     * Get price range statistics for published trips
     * 
     * @return object Object with min_price and max_price properties
     */
    public function getPriceRangeStats(): object
    {
        $table = $this->getTableName();
        return $this->wpdb->get_row(
            "SELECT 
                MIN(CAST(original_price AS DECIMAL(10,2))) as min_price,
                MAX(CAST(original_price AS DECIMAL(10,2))) as max_price
             FROM {$table} 
             WHERE status = 'publish' AND original_price > 0"
        );
    }

    /**
     * Count trips by difficulty level
     * 
     * @param int $difficultyLevelId Difficulty level ID
     * @return int Number of trips with this difficulty level
     */
    public function countByDifficultyLevel(int $difficultyLevelId): int
    {
        $table = $this->getTableName();
        
        // Use ClassificationsTable for difficulty levels (type = 'difficulty')
        $difficultyTable = ClassificationsTable::getTableName();
        
        return (int) $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} t 
             LEFT JOIN {$difficultyTable} dl ON (t.difficulty_level = dl.id OR t.difficulty_level = dl.slug OR t.difficulty_level = dl.name)
             WHERE dl.id = %d AND t.status IN ('publish','published')",
            $difficultyLevelId
        ));
    }

    /**
     * Check if reviews table exists
     * 
     * @return bool True if reviews table exists
     */
    public function reviewsTableExists(): bool
    {
        // Use ReviewsTable for reviews
        $reviewsTable = ReviewsTable::getTableName();
        return (bool) $this->wpdb->get_var(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
             WHERE TABLE_SCHEMA = DATABASE()
             AND TABLE_NAME = '{$reviewsTable}'"
        );
    }

    /**
     * Count trips by minimum rating
     * 
     * @param int $minRating Minimum rating
     * @return int Number of trips with this rating or above
     */
    public function countByMinRating(int $minRating): int
    {
        $table = $this->getTableName();
        
        // Use ReviewsTable for reviews
        $reviewsTable = ReviewsTable::getTableName();
        
        return (int) $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(DISTINCT t.id)
             FROM {$reviewsTable} r
             INNER JOIN {$table} t ON r.trip_id = t.id
             WHERE r.rating >= %d AND t.status IN ('publish','published')",
            $minRating
        ));
    }

    /**
     * Count trips by category
     * 
     * @param int $categoryId Category ID
     * @return int Number of trips in this category
     */
    public function countByCategory(int $categoryId): int
    {
        $table = $this->getTableName();
        
        // Use TripClassificationsTable for trip-category relationships
        $categoryTable = TripClassificationsTable::getTableName();
        
        return (int) $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(DISTINCT t.id) FROM {$table} t 
             INNER JOIN {$categoryTable} ttc ON t.id = ttc.trip_id 
             WHERE ttc.category_id = %d AND t.status = 'publish'",
            $categoryId
        ));
    }

    /**
     * Count trips by destination
     * 
     * @param int $destinationId Destination ID
     * @return int Number of trips to this destination
     */
    public function countByDestination(int $destinationId): int
    {
        $table = $this->getTableName();
        
        // Use TripClassificationsTable for trip-destination relationships
        $destinationTable = TripClassificationsTable::getTableName();
        
        return (int) $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(DISTINCT t.id) FROM {$table} t 
             INNER JOIN {$destinationTable} td ON t.id = td.trip_id 
             WHERE td.destination_id = %d AND t.status = 'publish'",
            $destinationId
        ));
    }

    /**
     * Count trips by activity
     * 
     * @param int $activityId Activity ID
     * @return int Number of trips with this activity
     */
    public function countByActivity(int $activityId): int
    {
        $table = $this->getTableName();
        
        // Use TripClassificationsTable for trip-activity relationships
        $activityTable = TripClassificationsTable::getTableName();
        
        return (int) $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(DISTINCT t.id) FROM {$table} t 
             INNER JOIN {$activityTable} ta ON t.id = ta.trip_id 
             WHERE ta.activity_id = %d AND t.status = 'publish'",
            $activityId
        ));
    }

    /**
     * Get popular trips for cache warming
     * 
     * @param int $limit Number of trips to return
     * @return array Array of popular trip IDs
     */
    public function getPopularTrips(int $limit = 20): array
    {
        global $wpdb;
        $tripsTable = $this->getTableName();
        
        // Using hardcoded table name since there's no dedicated repository for this table
        $bookingsTable = BookingsTable::getTableName();
        
        return $wpdb->get_results("
            SELECT t.id 
            FROM {$tripsTable} t
            LEFT JOIN {$bookingsTable} b ON b.trip_id = t.id
            WHERE t.status = 'publish'
            GROUP BY t.id
            ORDER BY COUNT(b.id) DESC
            LIMIT {$limit}
        ") ?: [];
    }
}
