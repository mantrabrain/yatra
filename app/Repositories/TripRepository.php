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
use Yatra\Database\Tables\TripsTable;
use Yatra\Repositories\TripDownloadRepository;
use Yatra\Models\Trip;
use Yatra\Utils\Cache;
use Yatra\Utils\QueryCache;
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
    protected array $integerFields = [
        'id', 
        'created_by', 
        'updated_by', 
        'difficulty_level', 
        'duration_days', 
        'duration_nights', 
        'duration_hours',
        'booking_window_days',
        'booking_deadline_hours',
        'min_travelers',
        'max_travelers',
        'group_size',
        'age_min',
        'age_max',
        'version',
        'views_count',
        'bookings_count',
        'reviews_count'
    ];

    /**
     * JSON fields specific to trips
     */
    protected array $jsonFields = [
        'included_items',
        'excluded_items',
        'frontend_tabs',
        'testimonial_review_ids',
        'custom_fields',
        'price_types',
    ];

    /**
     * Publish trips whose scheduled_publish_date has passed
     */
    public function publishScheduledTrips(string $now): void
    {
        $table = esc_sql($this->table);
        $this->wpdb->query(
            $this->wpdb->prepare(
                "UPDATE {$table}
                 SET status = 'publish', scheduled_publish_date = NULL, updated_at = %s
                 WHERE scheduled_publish_date IS NOT NULL
                   AND scheduled_publish_date <= %s
                   AND status <> 'publish'",
                $now,
                $now
            )
        );
    }

    /**
     * Archive trips whose scheduled_unpublish_date has passed
     */
    public function archiveScheduledTrips(string $now): void
    {
        $table = esc_sql($this->table);
        $this->wpdb->query(
            $this->wpdb->prepare(
                "UPDATE {$table}
                 SET status = 'archived', scheduled_unpublish_date = NULL, updated_at = %s
                 WHERE scheduled_unpublish_date IS NOT NULL
                   AND scheduled_unpublish_date <= %s
                   AND status = 'publish'",
                $now,
                $now
            )
        );
    }

    /**
     * Enable trips when seasonal_auto_enable is set and enable date reached
     */
    public function enableSeasonalTrips(string $today, string $now): void
    {
        $table = esc_sql($this->table);
        $this->wpdb->query(
            $this->wpdb->prepare(
                "UPDATE {$table}
                 SET status = 'publish', updated_at = %s
                 WHERE seasonal_auto_enable = 1
                   AND seasonal_enable_date IS NOT NULL
                   AND seasonal_enable_date <= %s
                   AND status <> 'publish'",
                $now,
                $today
            )
        );
    }

    /**
     * Disable trips when seasonal_auto_enable is set and disable date reached
     */
    public function disableSeasonalTrips(string $today, string $now): void
    {
        $table = esc_sql($this->table);
        $this->wpdb->query(
            $this->wpdb->prepare(
                "UPDATE {$table}
                 SET status = 'archived', updated_at = %s
                 WHERE seasonal_auto_enable = 1
                   AND seasonal_disable_date IS NOT NULL
                   AND seasonal_disable_date <= %s
                   AND status = 'publish'",
                $now,
                $today
            )
        );
    }

    /**
     * Get table name
     */
    protected function getTableName(): string
    {
     return TripsTable::getTableName();
    }

    /**
     * Override update method to provide proper field formats
     */
    public function update(int $id, array $data): bool
    {
        $data = $this->sanitizeData($data);
        $data['updated_at'] = current_time('mysql');

        // Build format array based on field types
        $formats = [];
        foreach ($data as $key => $value) {
            if (in_array($key, $this->integerFields, true)) {
                $formats[] = '%d';
            } elseif (in_array($key, ['created_at', 'updated_at'], true)) {
                $formats[] = '%s';
            } elseif (in_array($key, ['original_price', 'discounted_price', 'sale_price', 'deposit_amount', 'deposit_percentage'], true)) {
                $formats[] = '%f';
            } elseif (in_array($key, ['transportation_included', 'is_featured', 'seasonal_auto_enable'], true)) {
                $formats[] = '%d'; // boolean as integer
            } else {
                $formats[] = '%s'; // default to string
            }
        }

        $result = $this->wpdb->update(
            $this->getTableName(),
            $data,
            ['id' => $id],
            $formats,
            ['%d']
        );

        return $result !== false;
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
     * Get downloads for a trip (normalized for UI)
     */
    public function getDownloads(int $tripId): array
    {
        $repo = new TripDownloadRepository();
        $rows = $repo->getByTripId($tripId);

        return array_map(function ($row) {
            $metadata = [];
            if (!empty($row->metadata)) {
                $decoded = json_decode($row->metadata, true);
                if (is_array($decoded)) {
                    $metadata = $decoded;
                }
            }

            $attachmentId = $metadata['attachment_id'] ?? null;
            $protectedPath = $metadata['protected_path'] ?? null;
            $visibilityMeta = $metadata['visibility'] ?? null;

            // Map access_level to visibility used by UI
            $visibility = 'booked_only';
            if ($row->access_level === 'public') {
                $visibility = 'public';
            } elseif ($row->access_level === 'registered') {
                $visibility = 'logged_in';
            } elseif ($visibilityMeta) {
                $visibility = $visibilityMeta;
            }

            return (object) [
                'id' => isset($row->id) ? (int) $row->id : 0,
                'title' => $row->title ?? '',
                'description' => $row->description ?? '',
                'attachment_id' => $attachmentId ? (int) $attachmentId : null,
                'protected_path' => $protectedPath,
                'content_url' => $row->content_url ?? '',
                'file_path' => $row->file_path ?? null,
                'file_size' => isset($row->file_size) ? (int) $row->file_size : null,
                'file_type' => $row->file_type ?? null,
                'thumbnail_url' => $row->thumbnail_url ?? null,
                'visibility' => $visibility,
                'is_downloadable' => isset($row->is_downloadable) ? (bool) $row->is_downloadable : true,
                'sort_order' => isset($row->sort_order) ? (int) $row->sort_order : 0,
            ];
        }, $rows);
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
        // Create cache key based on filters and pagination
        $cacheKey = Cache::KEY_TRIPS_WITH_FILTERS . '_' . md5(serialize($filters) . "_page_{$page}_per_page_{$perPage}");
        
        return Cache::remember($cacheKey, function() use ($filters, $page, $perPage) {
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
        
        // Trip Category filter
        if (!empty($filters['trip_category'])) {
            $joins[] = "LEFT JOIN {$tripClassificationsTable} tcc ON tcc.trip_id = t.id";
            $joins[] = "LEFT JOIN {$classificationsTable} cat ON cat.id = tcc.classification_id";
            $wheres[] = "cat.type = %s AND cat.slug = %s";
            $params[] = ClassificationTypes::CATEGORY;
            $params[] = $filters['trip_category'];
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
                      LIMIT %d OFFSET %d";
        
        $main_query_params = array_merge($params, $rating_params, [$perPage, $offset]);
        $prepared_query = $wpdb->prepare($query_sql, ...$main_query_params);
        
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
        }, Cache::DURATION_QUERY_RESULT); // Cache for 10 minutes
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
                ClassificationTypes::DESTINATION, ...$trip_ids
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
                ClassificationTypes::ACTIVITY, ...$trip_ids
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
                ClassificationTypes::CATEGORY, ...$trip_ids
            ));
            
            foreach ($categories_raw as $cat) {
                $trip_id = $cat->trip_id;
                unset($cat->trip_id);
                $categories_data[$trip_id][] = $cat;
            }
        }

        // Apply enriched data to each trip (regular pricing fallback only)
        foreach ($trips as $trip) {
            $trip->effective_price_min = 0;
            if (!empty($trip->discounted_price) && (float)$trip->discounted_price > 0) {
                $trip->effective_price_min = (float)$trip->discounted_price;
            } elseif (!empty($trip->sale_price) && (float)$trip->sale_price > 0) {
                $trip->effective_price_min = (float)$trip->sale_price;
            } elseif (!empty($trip->original_price) && (float)$trip->original_price > 0) {
                $trip->effective_price_min = (float)$trip->original_price;
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
        // Regular pricing logic only (traveler-based table removed)
        if (!empty($trip->discounted_price) && (float)$trip->discounted_price > 0) {
            $trip->effective_price_min = (float)$trip->discounted_price;
        } elseif (!empty($trip->sale_price) && (float)$trip->sale_price > 0) {
            $trip->effective_price_min = (float)$trip->sale_price;
        } elseif (!empty($trip->original_price) && (float)$trip->original_price > 0) {
            $trip->effective_price_min = (float)$trip->original_price;
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
        
        // Load price types for traveler-based pricing (from trips table JSON)
        $trip->price_types = $this->getPriceTypes((int) $trip->id);
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
        
        // Load downloads
        $trip->downloadable_items = $this->getDownloads($id);
        
        // Load highlights
        $trip->highlights = $this->getHighlights($id);
        
        // Load landmarks
        $trip->landmarks = $this->getLandmarks($id);
        
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
                "SELECT tc.classification_id as id, tc.sort_order, tc.relationship_type, tc.is_featured, c.name, c.slug 
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
        
        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT tc.*, c.name as activity_name, c.slug as activity_slug 
                 FROM {$tripClassificationsTable} tc
                 LEFT JOIN {$classificationsTable} c ON c.id = tc.classification_id
                 WHERE tc.trip_id = %d AND tc.classification_type = %s
                 ORDER BY tc.sort_order ASC, tc.id ASC",
                $tripId, ClassificationTypes::ACTIVITY
            )
        ) ?: [];
        
        // Filter out relationships where the activity doesn't exist in Classifications table
        $validResults = array_filter($results, function($result) {
            return !empty($result->activity_name) && !empty($result->activity_slug);
        });
        
        return array_values($validResults);
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
        
        $sql = $wpdb->prepare(
            "SELECT tc.*, c.name as category_name, c.slug as category_slug 
             FROM {$tripClassificationsTable} tc
             LEFT JOIN {$classificationsTable} c ON c.id = tc.classification_id
             WHERE tc.trip_id = %d AND tc.classification_type = %s
             ORDER BY tc.sort_order ASC, tc.id ASC",
            $tripId, ClassificationTypes::CATEGORY
        );
        
        $results = $wpdb->get_results($sql) ?: [];
        
        // Filter out relationships where the category doesn't exist in Classifications table
        $validResults = array_filter($results, function($result) {
            return !empty($result->category_name) && !empty($result->category_slug);
        });
        
        return array_values($validResults);
    }

    /**
     * Get price types for a trip
     */
    public function getPriceTypes(int $tripId): array
    {
        // Read price_types JSON from trips table
        $table = esc_sql($this->table);
        $json  = $this->wpdb->get_var(
            $this->wpdb->prepare("SELECT price_types FROM `{$table}` WHERE id = %d", $tripId)
        );

        if (empty($json)) {
            return [];
        }

        // Decode JSON safely
        $decoded = is_string($json) ? json_decode($json, true) : $json;
        if (!is_array($decoded)) {
            return [];
        }

        // Normalize each price type entry
        return array_values(array_filter(array_map(function ($pt) {
            if (!is_array($pt)) {
                return null;
            }
            return [
                'category_id'      => isset($pt['category_id']) ? (int) $pt['category_id'] : null,
                'original_price'   => isset($pt['original_price']) ? (float) $pt['original_price'] : null,
                'discounted_price' => isset($pt['discounted_price']) ? (float) $pt['discounted_price'] : null,
                'sale_price'       => isset($pt['sale_price']) ? (float) $pt['sale_price'] : null,
                'label'            => $pt['label'] ?? ($pt['title'] ?? null),
            ];
        }, $decoded)));
    }

    /**
     * Get gallery images for a trip
     */
    public function getGalleryImages(int $tripId): array
    {
        global $wpdb;
        
        // Use TripContentTable for gallery images
        $tripContentTable = \Yatra\Database\Tables\TripContentTable::getTableName();
        
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$tripContentTable} 
                 WHERE trip_id = %d AND content_type = 'image'
                 ORDER BY sort_order ASC, id ASC",
                $tripId
            )
        ) ?: [];

        // Normalize to the shape the edit form expects
        return array_map(function ($row) {
            $metadata = [];
            if (!empty($row->metadata)) {
                $decoded = json_decode($row->metadata, true);
                if (is_array($decoded)) {
                    $metadata = $decoded;
                }
            }

            $imageId = $metadata['image_id'] ?? ($row->image_id ?? null);
            $altText = $metadata['alt_text'] ?? null;
            $caption = $metadata['caption'] ?? null;
            $dimensions = $metadata['dimensions'] ?? null;

            return (object) [
                'id'            => $imageId ? (int) $imageId : 0,
                'image_id'      => $imageId ? (int) $imageId : 0,
                'url'           => $row->content_url ?? '',
                'image_url'     => $row->content_url ?? '',
                'thumbnail_url' => $row->thumbnail_url ?? '',
                'alt_text'      => $altText ?? '',
                'caption'       => $caption ?? '',
                'width'         => is_array($dimensions) && isset($dimensions['width']) ? (int) $dimensions['width'] : null,
                'height'        => is_array($dimensions) && isset($dimensions['height']) ? (int) $dimensions['height'] : null,
                'is_featured'   => isset($row->is_featured) ? (bool) $row->is_featured : false,
                'order'         => isset($row->sort_order) ? (int) $row->sort_order : 0,
            ];
        }, $rows);
    }

    /**
     * Get highlights for a trip
     */
    public function getHighlights(int $tripId): array
    {
        global $wpdb;
        
        // Use TripContentTable for highlights
        $tripContentTable = \Yatra\Database\Tables\TripContentTable::getTableName();
        
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$tripContentTable} 
                 WHERE trip_id = %d AND content_type = 'highlight'
                 ORDER BY sort_order ASC, id ASC",
                $tripId
            )
        ) ?: [];

        // Normalize to UI shape
        return array_map(function ($row) {
            $metadata = [];
            if (!empty($row->metadata)) {
                $decoded = json_decode($row->metadata, true);
                if (is_array($decoded)) {
                    $metadata = $decoded;
                }
            }

            $imageId = $metadata['image_id'] ?? ($row->image_id ?? null);
            $icon = $metadata['icon'] ?? ($row->icon ?? null);

            return (object) [
                'text'        => $row->title ?? '',
                'description' => $row->description ?? '',
                'image_id'    => $imageId ? (int) $imageId : 0,
                'icon'        => $icon ?? '',
                'is_featured' => isset($row->is_featured) ? (bool) $row->is_featured : false,
                'order'       => isset($row->sort_order) ? (int) $row->sort_order : 0,
            ];
        }, $rows);
    }

    /**
     * Get landmarks for a trip
     */
    public function getLandmarks(int $tripId): array
    {
        global $wpdb;
        
        // Use TripContentTable for landmarks
        $tripContentTable = \Yatra\Database\Tables\TripContentTable::getTableName();
        
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$tripContentTable} 
                 WHERE trip_id = %d AND content_type = 'landmark'
                 ORDER BY sort_order ASC, id ASC",
                $tripId
            )
        ) ?: [];

        // Convert to simple array of landmark texts (like SingleTripController)
        $landmark_texts = [];
        foreach ($rows as $landmark) {
            if (!empty($landmark->title)) {
                $landmark_texts[] = $landmark->title;
            } elseif (!empty($landmark->description)) {
                $landmark_texts[] = $landmark->description;
            }
        }
        
        return $landmark_texts;
    }

    /**
     * Get FAQs for a trip
     */
    public function getFaqs(int $tripId): array
    {
        global $wpdb;
        
        // Use TripContentTable for FAQs
        $tripContentTable = \Yatra\Database\Tables\TripContentTable::getTableName();
        
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$tripContentTable} 
                 WHERE trip_id = %d AND content_type = 'faq'
                 ORDER BY sort_order ASC, id ASC",
                $tripId
            )
        ) ?: [];

        // Normalize to UI shape
        return array_map(function ($row) {
            $metadata = [];
            if (!empty($row->metadata)) {
                $decoded = json_decode($row->metadata, true);
                if (is_array($decoded)) {
                    $metadata = $decoded;
                }
            }
            return (object) [
                'question'    => $row->title ?? '',
                'answer'      => $row->description ?? '',
                'category'    => $metadata['category'] ?? '',
                'is_featured' => isset($row->is_featured) ? (bool) $row->is_featured : false,
                'order'       => isset($row->sort_order) ? (int) $row->sort_order : 0,
            ];
        }, $rows);
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
    public function saveDestinations(int $tripId, array $destinations): void
    {
        global $wpdb;
        
        $table = TripClassificationsTable::getTableName();
        $classificationsTable = ClassificationsTable::getTableName();
        
        // Delete existing destination relations
        $wpdb->delete(
            $table,
            [
                'trip_id' => $tripId,
                'classification_type' => ClassificationTypes::DESTINATION,
            ],
            ['%d', '%s']
        );
        
        // Extract destination IDs from destination objects
        $destinationIds = [];
        foreach ($destinations as $destination) {
            if (is_array($destination) && isset($destination['id'])) {
                $destinationIds[] = (int) $destination['id'];
            } elseif (is_object($destination) && isset($destination->id)) {
                $destinationIds[] = (int) $destination->id;
            } elseif (is_numeric($destination)) {
                $destinationIds[] = (int) $destination;
            }
        }
        
        // Validate that destinations exist before saving (same as activities)
        $validDestinationIds = [];
        if (!empty($destinationIds)) {
            $placeholders = implode(',', array_fill(0, count($destinationIds), '%d'));
            $existingDestinations = $wpdb->get_col(
                $wpdb->prepare(
                    "SELECT id FROM {$classificationsTable} 
                     WHERE id IN ({$placeholders}) AND type = %s",
                    array_merge($destinationIds, [ClassificationTypes::DESTINATION])
                )
            );
            $validDestinationIds = array_map('intval', $existingDestinations);
        }
        
        // Also clean up any existing invalid destination relationships for this trip
        $deletedRows = $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$table} 
                 WHERE trip_id = %d AND classification_type = %s 
                 AND classification_id NOT IN (
                     SELECT id FROM {$classificationsTable} WHERE type = %s
                 )",
                $tripId, ClassificationTypes::DESTINATION, ClassificationTypes::DESTINATION
            )
        );
        
                
        // Insert new destination relations
        if (!empty($validDestinationIds)) {
            foreach ($validDestinationIds as $index => $destinationId) {
                $wpdb->insert(
                    $table,
                    [
                        'trip_id' => $tripId,
                        'classification_id' => $destinationId,
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
        $classificationsTable = ClassificationsTable::getTableName();
        
        // Validate that activities exist before saving
        $validActivityIds = [];
        if (!empty($activityIds)) {
            $placeholders = implode(',', array_fill(0, count($activityIds), '%d'));
            $existingActivities = $wpdb->get_col(
                $wpdb->prepare(
                    "SELECT id FROM {$classificationsTable} 
                     WHERE id IN ({$placeholders}) AND type = %s",
                    array_merge($activityIds, [ClassificationTypes::ACTIVITY])
                )
            );
            $validActivityIds = array_map('intval', $existingActivities);
        }
        
        // Delete existing activity relations
        $wpdb->delete(
            $table,
            [
                'trip_id' => $tripId,
                'classification_type' => ClassificationTypes::ACTIVITY,
            ],
            ['%d', '%s']
        );
        
        // Insert new activity relations (only for valid activities)
        if (!empty($validActivityIds)) {
            foreach ($validActivityIds as $index => $activityId) {
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
        if (empty($priceTypes)) {
            return;
        }

        // Compute minimal pricing values from provided price types
        $minOriginal   = PHP_FLOAT_MAX;
        $minDiscounted = PHP_FLOAT_MAX;
        $minSale       = PHP_FLOAT_MAX;

        foreach ($priceTypes as $priceType) {
            $original   = isset($priceType['original_price']) ? (float) $priceType['original_price'] : null;
            $discounted = isset($priceType['discounted_price']) ? (float) $priceType['discounted_price'] : null;
            $sale       = isset($priceType['sale_price']) ? (float) $priceType['sale_price'] : null;

            if ($original !== null && $original > 0 && $original < $minOriginal) {
                $minOriginal = $original;
            }
            if ($discounted !== null && $discounted > 0 && $discounted < $minDiscounted) {
                $minDiscounted = $discounted;
            }
            if ($sale !== null && $sale > 0 && $sale < $minSale) {
                $minSale = $sale;
            }
        }

        // Normalize infinity values to null
        $minOriginal   = ($minOriginal === PHP_FLOAT_MAX)   ? null : $minOriginal;
        $minDiscounted = ($minDiscounted === PHP_FLOAT_MAX) ? null : $minDiscounted;
        $minSale       = ($minSale === PHP_FLOAT_MAX)       ? null : $minSale;

        // Determine final prices to store on trips table
        $finalOriginal   = $minOriginal;
        $finalDiscounted = $minDiscounted ?? null;
        $finalSale       = $minSale ?? null;

        // If no discounted/sale but original exists, keep it; else leave unchanged
        $data   = [];
        $format = [];

        // Persist full price_types JSON for reference (stored on trips table)
        $data['price_types'] = wp_json_encode($priceTypes);
        $format[] = '%s';

        if ($finalOriginal !== null) {
            $data['original_price'] = $finalOriginal;
            $format[] = '%f';
        }
        if ($finalDiscounted !== null) {
            $data['discounted_price'] = $finalDiscounted;
            $format[] = '%f';
        }
        if ($finalSale !== null) {
            $data['sale_price'] = $finalSale;
            $format[] = '%f';
        }

        if (!empty($data)) {
            $this->wpdb->update(
                TripsTable::getTableName(),
                $data,
                ['id' => $tripId],
                $format,
                ['%d']
            );
        }
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
     * Save landmarks for a trip
     */
    public function saveLandmarks(int $tripId, array $landmarks): void
    {
        global $wpdb;
        
        $table = TripContentTable::getTableName();
        
        // Delete existing landmarks
        $wpdb->delete(
            $table,
            [
                'trip_id' => $tripId,
                'content_type' => 'landmark',
            ],
            ['%d', '%s']
        );
        
        if (!empty($landmarks)) {
            foreach ($landmarks as $index => $landmark) {
                $landmarkText = is_string($landmark) ? $landmark : ($landmark['text'] ?? $landmark['landmark_text'] ?? '');
                if (empty($landmarkText)) {
                    continue;
                }
                
                $metadata = [];
                if (is_array($landmark)) {
                    if (!empty($landmark['icon'])) {
                        $metadata['icon'] = $landmark['icon'];
                    }
                    if (!empty($landmark['image_id'])) {
                        $metadata['image_id'] = (int) $landmark['image_id'];
                    }
                }
                
                $wpdb->insert(
                    $table,
                    [
                        'trip_id' => $tripId,
                        'content_type' => 'landmark',
                        'title' => sanitize_text_field($landmarkText),
                        'description' => is_array($landmark) && !empty($landmark['description']) ? wp_kses_post($landmark['description']) : null,
                        'metadata' => !empty($metadata) ? wp_json_encode($metadata) : null,
                        'sort_order' => $index,
                        'is_featured' => is_array($landmark) && isset($landmark['is_featured']) ? (int) $landmark['is_featured'] : 0,
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
        
        $processedDayIds[] = $dayId;
        
        // Process entries for this day
        if (isset($day['entries']) && is_array($day['entries'])) {
            $this->saveDayEntries($dayId, $day['entries'], $existingEntryMap[$dayId] ?? []);
        }
    }
    
    // Clean up orphaned days and entries (days that are no longer in the itinerary)
    if (!empty($processedDayIds)) {
        $placeholders = implode(',', array_fill(0, count($processedDayIds), '%d'));
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$tableEntries} WHERE day_id NOT IN ({$placeholders}) AND day_id IN (SELECT id FROM {$tableDays} WHERE trip_id = %d)",
            $tripId,
            ...$processedDayIds
        ));
        
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$tableDays} WHERE trip_id = %d AND id NOT IN ({$placeholders})",
            $tripId,
            ...$processedDayIds
        ));
    } else {
        // If no days provided, delete all days and entries for this trip
        $wpdb->delete($tableEntries, ['trip_id' => $tripId], ['%d']);
        $wpdb->delete($tableDays, ['trip_id' => $tripId], ['%d']);
    }
}

/**
 * Save entries for a specific day using upsert strategy
 */
private function saveDayEntries(int $dayId, array $entries, array $existingEntries): void
{
    global $wpdb;
    $tableEntries = TripItineraryDayEntryTable::getTableName();
    
    // Create lookup map for existing entries
    $existingEntryMap = [];
    foreach ($existingEntries as $entry) {
        $key = $entry->title . '|' . ($entry->order ?? 0);
        $existingEntryMap[$key] = $entry;
    }
    
    $processedEntryIds = [];
    foreach ($entries as $entryIndex => $entry) {
        if (!is_array($entry) || empty($entry['title'])) continue;
        
        $entryKey = $entry['title'] . '|' . $entryIndex;
        $entryData = [
            'title' => sanitize_text_field($entry['title']),
            'description' => isset($entry['description']) ? wp_kses_post($entry['description']) : null,
            'item_type_id' => isset($entry['item_type_id']) ? (int) $entry['item_type_id'] : null,
            'item_id' => isset($entry['item_id']) ? (int) $entry['item_id'] : null,
            'item_type' => isset($entry['item_type']) ? sanitize_text_field($entry['item_type']) : null,
            'item_name' => isset($entry['item_name']) ? sanitize_text_field($entry['item_name']) : null,
            'item_icon' => isset($entry['item_icon']) ? sanitize_text_field($entry['item_icon']) : null,
            'time' => isset($entry['time']) ? sanitize_text_field($entry['time']) : null,
            'start_time' => isset($entry['start_time']) ? sanitize_text_field($entry['start_time']) : null,
            'end_time' => isset($entry['end_time']) ? sanitize_text_field($entry['end_time']) : null,
            'time_type' => isset($entry['time_type']) ? sanitize_text_field($entry['time_type']) : 'exact',
            'location' => isset($entry['location']) ? sanitize_text_field($entry['location']) : null,
            'duration' => isset($entry['duration']) ? sanitize_text_field($entry['duration']) : null,
            'cost' => isset($entry['cost']) ? floatval($entry['cost']) : null,
            'cost_per_person' => isset($entry['cost_per_person']) ? (int) $entry['cost_per_person'] : 0,
            'notes' => isset($entry['notes']) ? wp_kses_post($entry['notes']) : null,
            'included_items' => isset($entry['included_items']) ? wp_json_encode($entry['included_items']) : null,
            'excluded_items' => isset($entry['excluded_items']) ? wp_json_encode($entry['excluded_items']) : null,
            'gallery' => isset($entry['gallery']) ? wp_json_encode($entry['gallery']) : null,
            'video_url' => isset($entry['video_url']) ? esc_url_raw($entry['video_url']) : null,
            'status' => isset($entry['status']) ? sanitize_text_field($entry['status']) : 'publish',
            'order' => $entryIndex,
            'updated_at' => current_time('mysql'),
        ];
        
        // Update existing entry or insert new
        if (isset($existingEntryMap[$entryKey])) {
            $existingEntry = $existingEntryMap[$entryKey];
            $wpdb->update($tableEntries, $entryData, ['id' => $existingEntry->id]);
            $processedEntryIds[] = $existingEntry->id;
        } else {
            $entryData['day_id'] = $dayId;
            $entryData['trip_id'] = $this->getTripIdByDayId($dayId);
            $entryData['created_at'] = current_time('mysql');
            $wpdb->insert($tableEntries, $entryData);
            $processedEntryIds[] = $wpdb->insert_id;
        }
    }
    
    // Delete entries that are no longer present
    if (!empty($processedEntryIds)) {
        $placeholders = implode(',', array_fill(0, count($processedEntryIds), '%d'));
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$tableEntries} WHERE day_id = %d AND id NOT IN ({$placeholders})",
            $dayId,
            ...$processedEntryIds
        ));
    } else {
        // If no entries provided, delete all entries for this day
        $wpdb->delete($tableEntries, ['day_id' => $dayId], ['%d']);
    }
}

/**
 * Get trip ID by day ID
 */
private function getTripIdByDayId(int $dayId): int
{
    global $wpdb;
    $tableDays = TripItineraryDaysTable::getTableName();
    return (int) $wpdb->get_var($wpdb->prepare(
        "SELECT trip_id FROM {$tableDays} WHERE id = %d",
        $dayId
    ));
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
        $destinations      = $relationships['destinations'] ?? [];
        $activities        = $relationships['activities'] ?? [];
        $tripCategories    = $relationships['trip_category'] ?? [];
        $priceTypes        = $relationships['price_types'] ?? [];
        $highlights        = $relationships['highlights'] ?? [];
        $landmarks         = $relationships['landmarks'] ?? [];
        $galleryImages     = $relationships['gallery_images'] ?? [];
        $faqs              = $relationships['faqs'] ?? [];
        $downloadableItems = $relationships['downloadable_items'] ?? [];
        $itineraryDays     = $relationships['itinerary_days'] ?? [];
        $availabilityDates = $relationships['availability_dates'] ?? [];
        $attributes        = $relationships['attributes'] ?? [];
        
        // Remove relationship data from main data (these should not be in the main table)
        unset(
            $data['destinations'], 
            $data['activities'], 
            $data['trip_category'],
            $data['highlights'],
            $data['landmarks'],
            $data['gallery_images'],
            $data['faqs'],
            $data['downloadable_items'],
            $data['itinerary_days'],
            $data['availability_dates'],
            $data['attributes']
        );
        
        // Create main trip record
        $tripId = $this->create($data);
        
        // Update relationships if provided
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
        
        if (!empty($landmarks)) {
            $this->saveLandmarks($tripId, $landmarks);
        }
        
        if (!empty($galleryImages)) {
            $this->saveGalleryImages($tripId, $galleryImages);
        }
        
        if (!empty($faqs)) {
            $this->saveFaqs($tripId, $faqs);
        }

        // Always replace downloads (clear if empty array)
        $downloadRepo = new TripDownloadRepository();
        $downloadRepo->replaceForTrip($tripId, is_array($downloadableItems) ? $downloadableItems : []);
        
        // ITINERARY SHOULD NEVER BE PROCESSED DURING TRIP CREATION
        // Itinerary should be created separately through dedicated itinerary endpoints
        // This ensures complete separation of concerns and prevents data loss
        
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
        // Extract relationship data (excluding itinerary - handled separately)
        $destinations      = $relationships['destinations'] ?? null;
        $activities        = $relationships['activities'] ?? null;
        $tripCategories    = $relationships['trip_category'] ?? null;
        $priceTypes        = $relationships['price_types'] ?? null;
        $highlights        = $relationships['highlights'] ?? null;
        $landmarks         = $relationships['landmarks'] ?? null;
        $galleryImages     = $relationships['gallery_images'] ?? null;
        $faqs              = $relationships['faqs'] ?? null;
        $downloadableItems = $relationships['downloadable_items'] ?? null;
        // ITINERARY IS HANDLED SEPARATELY - NEVER PROCESSED HERE
        $availabilityDates = $relationships['availability_dates'] ?? null;
        $attributes        = $relationships['attributes'] ?? null;
        
        // Remove relationship data from main data (excluding itinerary - handled separately)
        unset(
            $data['destinations'], 
            $data['activities'], 
            $data['trip_category'],
            $data['price_types'],
            $data['highlights'],
            $data['landmarks'],
            $data['gallery_images'],
            $data['faqs'],
            // ITINERARY IS HANDLED SEPARATELY - DO NOT UNSET
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
        
        if ($landmarks !== null) {
            $this->saveLandmarks($id, $landmarks);
        }
        
        if ($galleryImages !== null) {
            $this->saveGalleryImages($id, $galleryImages);
        }
        
        if ($faqs !== null) {
            $this->saveFaqs($id, $faqs);
        }
        
        if (is_array($downloadableItems)) {
            $downloadRepo = new TripDownloadRepository();
            $downloadRepo->replaceForTrip($id, $downloadableItems);
        }
        
        // ITINERARY SHOULD NEVER BE PROCESSED DURING TRIP UPDATES
        // Itinerary updates should be handled separately through dedicated endpoints
        // This ensures complete separation of concerns and prevents data loss
        
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
            }
        
        // Base query to get all active trips
        $args['where']['deleted_at'] = null;
        if (!isset($args['where']['status'])) {
            $args['where']['status'] = ['publish'];
        }
        
        // DEBUG: Log query args
        if (defined('WP_DEBUG') && WP_DEBUG) {
            }
        
        // Get all active trips first
        $all_trips = $this->all($args);
        
        if (empty($all_trips)) {
            return [];
        }
        
        // Get trip IDs
        $trip_ids = array_map(function($trip) {
            return $trip->id;
        }, $all_trips);
        
        // Get trip prices and filter by range (price types table removed)
        $filtered_trips = [];
        
        // DEBUG: Log price filtering process
        if (defined('WP_DEBUG') && WP_DEBUG) {
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
            
            // If no valid price found, skip
            if ($trip_min_price === PHP_FLOAT_MAX) {
                continue;
            }
            
            // Apply price range filter
            $passes_filter = ($min_price === 0 || $trip_min_price >= $min_price) && 
                           ($max_price === 0 || $trip_min_price <= $max_price);
            
            // DEBUG: Log individual trip filtering
            if (defined('WP_DEBUG') && WP_DEBUG) {
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
        
        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT tc.trip_id, tc.classification_id, c.name, c.slug
             FROM {$tripClassificationsTable} tc
             LEFT JOIN {$classificationsTable} c ON c.id = tc.classification_id
             WHERE tc.trip_id = %d AND tc.classification_type = %s",
            $tripId, ClassificationTypes::DESTINATION
        ));
        
        // Filter out destinations with missing classification data
        return array_filter($results, function($destination) {
            return !empty($destination->name) && !empty($destination->slug);
        });
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
            "SELECT t.*, a.departure_date, a.seats_total, a.seats_reserved AS seats_booked, a.status as availability_status
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
             WHERE ttc.classification_id = %d AND ttc.classification_type = 'category' AND t.status = 'publish'",
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

    /**
     * Get price statistics for filter sidebar
     */
    public function getPriceStats(): ?object
    {
        global $wpdb;
        
        $table = $this->getTableName();
        
        $result = $wpdb->get_row("
            SELECT 
                MIN(CAST(original_price AS DECIMAL(10,2))) as min_price,
                MAX(CAST(original_price AS DECIMAL(10,2))) as max_price,
                AVG(CAST(original_price AS DECIMAL(10,2))) as avg_price
            FROM {$table} 
            WHERE status = 'publish' AND original_price > 0
        ");
        
        return $result ? (object) [
            'min_price' => (float) $result->min_price,
            'max_price' => (float) $result->max_price,
            'avg_price' => (float) $result->avg_price
        ] : null;
    }

    /**
     * Get accommodation types (placeholder)
     * 
     * @return array
     */
    public function getAccommodationTypes(): array
    {
        return [];
    }

    /**
     * Get included services (placeholder)
     * 
     * @return array
     */
    public function getIncludedServices(): array
    {
        return [];
    }

    /**
     * Get duration options (placeholder)
     * 
     * @return array
     */
    public function getDurationOptions(): array
    {
        return [];
    }

    /**
     * Get group size options (placeholder)
     * 
     * @return array
     */
    public function getGroupSizeOptions(): array
    {
        return [];
    }

    /**
     * Get physical grades (placeholder)
     * 
     * @return array
     */
    public function getPhysicalGrades(): array
    {
        return [];
    }

    /**
     * Get trip types
     */
    public function getTripTypes(): array
    {
        return [
            (object) ['value' => 'adventure', 'label' => __('Adventure', 'yatra')],
            (object) ['value' => 'cultural', 'label' => __('Cultural', 'yatra')],
            (object) ['value' => 'wildlife', 'label' => __('Wildlife', 'yatra')],
            (object) ['value' => 'pilgrimage', 'label' => __('Pilgrimage', 'yatra')],
            (object) ['value' => 'educational', 'label' => __('Educational', 'yatra')]
        ];
    }

    /**
     * Count trips by trip type
     */
    public function countByTripType(string $tripType): int
    {
        global $wpdb;
        $table = $this->getTableName();
        
        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} 
             WHERE trip_type = %s AND status = 'publish'",
            $tripType
        ));
    }

    /**
     * Count trips with discounts
     */
    public function countByDiscount(): int
    {
        $table = $this->getTableName();
        return (int) $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$table} 
             WHERE status = 'publish' AND (discounted_price IS NOT NULL OR sale_price IS NOT NULL)"
        );
    }

    /**
     * Count trips with early bird offers
     */
    public function countByEarlyBird(): int
    {
        $table = $this->getTableName();
        
        // Check if column exists
        $column_exists = (int) $this->wpdb->get_var(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = '{$table}' 
               AND COLUMN_NAME = 'early_bird_discount_enabled'"
        );
        
        if ($column_exists) {
            return (int) $this->wpdb->get_var(
                "SELECT COUNT(*) FROM {$table} 
                 WHERE status = 'publish' AND early_bird_discount_enabled = 1"
            );
        }
        
        return 0;
    }

    /**
     * Count trips with last minute deals
     */
    public function countByLastMinute(): int
    {
        $table = $this->getTableName();
        
        // Check if column exists
        $column_exists = (int) $this->wpdb->get_var(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = '{$table}' 
               AND COLUMN_NAME = 'last_minute_discount_enabled'"
        );
        
        if ($column_exists) {
            return (int) $this->wpdb->get_var(
                "SELECT COUNT(*) FROM {$table} 
                 WHERE status = 'publish' AND last_minute_discount_enabled = 1"
            );
        }
        
        return 0;
    }

    /**
     * Count trips with instant booking
     */
    public function countByInstantBooking(): int
    {
        $table = $this->getTableName();
        
        // Check if column exists
        $column_exists = (int) $this->wpdb->get_var(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = '{$table}' 
               AND COLUMN_NAME = 'instant_booking'"
        );
        
        if ($column_exists) {
            return (int) $this->wpdb->get_var(
                "SELECT COUNT(*) FROM {$table} 
                 WHERE status = 'publish' AND instant_booking = 1"
            );
        }
        
        return 0;
    }

    /**
     * Count trips with flexible dates
     */
    public function countByFlexibleDates(): int
    {
        $table = $this->getTableName();
        
        // Check if column exists
        $column_exists = (int) $this->wpdb->get_var(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = '{$table}' 
               AND COLUMN_NAME = 'flexible_dates'"
        );
        
        if ($column_exists) {
            return (int) $this->wpdb->get_var(
                "SELECT COUNT(*) FROM {$table} 
                 WHERE status = 'publish' AND flexible_dates = 1"
            );
        }
        
        return 0;
    }

    /**
     * Count trips requiring deposit
     */
    public function countByDepositRequired(): int
    {
        $table = $this->getTableName();
        
        // Check if column exists
        $column_exists = (int) $this->wpdb->get_var(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = '{$table}' 
               AND COLUMN_NAME = 'deposit_required'"
        );
        
        if ($column_exists) {
            return (int) $this->wpdb->get_var(
                "SELECT COUNT(*) FROM {$table} 
                 WHERE status = 'publish' AND deposit_required = 1"
            );
        }
        
        return 0;
    }

    /**
     * Count family friendly trips
     */
    public function countByFamilyFriendly(): int
    {
        $table = $this->getTableName();
        return (int) $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$table} 
             WHERE status = 'publish' AND (age_min IS NULL OR age_min <= 5)"
        );
    }

    /**
     * Count kids friendly trips
     */
    public function countByKidsFriendly(): int
    {
        $table = $this->getTableName();
        return (int) $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$table} 
             WHERE status = 'publish' AND (age_min IS NULL OR age_min <= 12)"
        );
    }

    /**
     * Count senior friendly trips
     */
    public function countBySeniorFriendly(): int
    {
        $table = $this->getTableName();
        return (int) $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$table} 
             WHERE status = 'publish' AND (age_max IS NULL OR age_max >= 65)"
        );
    }

    /**
     * Count adults only trips
     */
    public function countByAdultsOnly(): int
    {
        $table = $this->getTableName();
        return (int) $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$table} 
             WHERE status = 'publish' AND age_min >= 18"
        );
    }
}
