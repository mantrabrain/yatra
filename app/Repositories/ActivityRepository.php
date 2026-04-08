<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Constants\ClassificationTypes;
use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Database\Tables\TripClassificationsTable;
use Yatra\Database\Tables\TripsTable;
use Yatra\Database\Tables\ReviewsTable;
use Yatra\Utils\Cache;
use Yatra\Utils\QueryCache;

/**
 * Activity Repository
 * Handles database operations for activities using the new ClassificationsTable
 */
class ActivityRepository extends BaseRepository
{
    /**
     * Rich text fields specific to activities
     */
    protected array $richTextFields = ['description'];

    /**
     * Integer fields specific to activities
     */
    protected array $integerFields = ['id', 'created_by', 'updated_by'];

    /**
     * JSON fields specific to activities
     */
    protected array $jsonFields = ['metadata'];

    /**
     * Get table name - using the new ClassificationsTable
     */
    protected function getTableName(): string
    {
        return ClassificationsTable::getTableName();
    }

    
    /**
     * Find by slug - for activities
     */
    public function findBySlug(string $slug): ?\stdClass
    {
        $table = esc_sql($this->table);
        $result = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM `{$table}` WHERE type =  %s AND slug = %s",
                ClassificationTypes::ACTIVITY,
                $slug
            )
        );

        return $result ?: null;
    }

    /**
     * Get published activities (visible in listings and search).
     *
     * Accepts both `active` and `publish` status — some sites/data use either.
     */
    public function getPublished(array $args = []): array
    {
        $statuses = apply_filters('yatra_activity_published_statuses', ['active', 'publish']);
        if (!is_array($statuses) || $statuses === []) {
            $statuses = ['active', 'publish'];
        }
        $args['where']['type'] = ClassificationTypes::ACTIVITY;
        $args['where']['status'] = $statuses;

        return $this->all($args);
    }

    /**
     * Get activities by status
     */
    public function getByStatus(string $status, array $args = []): array
    {
        $args['where']['type'] = ClassificationTypes::ACTIVITY;
        $args['where']['status'] = $status;
        return $this->all($args);
    }

    /**
     * Search activities
     */
    public function search(string $search, array $args = []): array
    {
        $table = esc_sql($this->table);
        $where = $this->buildWhereClause($args);
        $order = $this->buildOrderClause($args);
        $limit = $this->buildLimitClause($args);

        $search_where = $this->wpdb->prepare(
            "WHERE type = %s AND (name LIKE %s OR slug LIKE %s OR description LIKE %s)",
            ClassificationTypes::ACTIVITY,
            '%' . $this->wpdb->esc_like($search) . '%',
            '%' . $this->wpdb->esc_like($search) . '%',
            '%' . $this->wpdb->esc_like($search) . '%'
        );

        if ($where) {
            $search_where .= ' AND ' . str_replace('WHERE ', '', $where);
        }

        $query = "SELECT * FROM `{$table}` {$search_where} {$order} {$limit}";

        return $this->wpdb->get_results($query) ?: [];
    }

    /**
     * Bulk update status for multiple activities
     */
    public function bulkUpdateStatus(array $ids, string $status): bool
    {
        if (empty($ids)) {
            return false;
        }

        $table = esc_sql($this->table);
        $placeholders = implode(',', array_fill(0, count($ids), '%d'));
        $sql = "UPDATE `{$table}` SET status = %s, updated_at = %s WHERE type = %s AND id IN ({$placeholders})";
        $params = array_merge([$status, current_time('mysql'), ClassificationTypes::ACTIVITY], $ids);

        $prepared = $this->wpdb->prepare($sql, $params);
        return $this->wpdb->query($prepared) !== false;
    }

    /**
     * Permanently delete multiple activities
     */
    public function bulkDelete(array $ids): bool
    {
        if (empty($ids)) {
            return false;
        }

        $table = esc_sql($this->table);
        $placeholders = implode(',', array_fill(0, count($ids), '%d'));
        $sql = "DELETE FROM `{$table}` WHERE type = %s AND id IN ({$placeholders})";

        $prepared = $this->wpdb->prepare($sql, array_merge([ClassificationTypes::ACTIVITY], $ids));
        return $this->wpdb->query($prepared) !== false;
    }

    /**
     * Get published activities with trip counts and stats
     * Uses the new ClassificationsTable and TripClassificationsTable
     */
    public function getPublishedWithTripCounts(): array
    {
        global $wpdb;

        $actTable     = esc_sql($this->table);
        $relTable     = TripClassificationsTable::getTableName();
        $tripsTable   = TripsTable::getTableName();
        $reviewsTable = ReviewsTable::getTableName();

        // COUNT(DISTINCT tc.trip_id) gives real number of trips per activity.
        // avg_rating is computed from approved reviews across all those trips.
        // starting_price is computed in PHP using both regular trip prices and
        // traveler-based pricing from recurring availability rules.
        $sql = "SELECT a.*, 
                       COUNT(DISTINCT tc.trip_id) AS trips_count,
                       COALESCE(AVG(r.rating), 0) AS avg_rating,
                       GROUP_CONCAT(DISTINCT tc.trip_id) AS trip_ids
                FROM `{$actTable}` a
                LEFT JOIN `{$relTable}` tc
                  ON tc.classification_id = a.id 
                  AND tc.classification_type = %s
                LEFT JOIN `{$tripsTable}` t
                  ON t.id = tc.trip_id
                LEFT JOIN `{$reviewsTable}` r
                  ON r.trip_id = t.id AND r.status = 'approved'
                WHERE a.type = %s AND a.status = 'active'
                GROUP BY a.id";

        $rows = $this->wpdb->get_results($this->wpdb->prepare($sql, ClassificationTypes::ACTIVITY, ClassificationTypes::ACTIVITY)) ?: [];

        if (empty($rows)) {
            return [];
        }

        foreach ($rows as $row) {
            $row->starting_price = $this->computeStartingPriceForTripIds($row->trip_ids ?? '');
        }

        return $rows;
    }

    /**
     * Compute starting price for given trip IDs
     * This method calculates the lowest price from all trips associated with an activity
     */
    private function computeStartingPriceForTripIds(string $tripIds): float
    {
        if (empty($tripIds)) {
            return 0.0;
        }

        global $wpdb;
        $tripIdsArray = array_filter(array_map('intval', explode(',', $tripIds)));
        
        if (empty($tripIdsArray)) {
            return 0.0;
        }

        $placeholders = implode(',', array_fill(0, count($tripIdsArray), '%d'));
        $tripsTable = TripsTable::getTableName();
        
        // Get the minimum original price from trips
        $sql = "SELECT MIN(CAST(original_price AS DECIMAL(10,2))) as min_price 
                FROM `{$tripsTable}` 
                WHERE id IN ({$placeholders}) AND original_price > 0";
        
        $prepared = $this->wpdb->prepare($sql, $tripIdsArray);
        $result = $this->wpdb->get_var($prepared);
        
        return $result ? (float) $result : 0.0;
    }

    /**
     * Get status counts for activities
     */
    public function getStatusCounts(array $args = []): array
    {
        $table = esc_sql($this->table);

        $debug_sql = "SELECT id, type, status, name FROM `{$table}` ORDER BY id";
        $debug_results = $this->wpdb->get_results($debug_sql);

        // Get counts for each status - only for activities
        $sql = "SELECT status, COUNT(*) as count 
                FROM `{$table}` 
                WHERE type = %s
                GROUP BY status";

        $results = $this->wpdb->get_results($this->wpdb->prepare($sql, ClassificationTypes::ACTIVITY));
         $counts = [
            'publish' => 0,
            'draft' => 0,
            'trash' => 0,
            'total' => 0
        ];
        
        foreach ($results as $row) {
            $status = $row->status;
            $count = (int) $row->count;
            
            // Map old status values to new ones if needed
            if ($status === 'active') {
                $status = 'publish';
            } elseif ($status === 'inactive') {
                $status = 'trash';
            }
             
            if (isset($counts[$status])) {
                $counts[$status] += $count;
                $counts['total'] += $count;
            } else {
                // Handle any unexpected statuses
                $counts['total'] += $count;
            }
        }

         
        return $counts;
    }

    /**
     * Override base all() method to ensure type filtering
     */
    public function all(array $args = []): array
    {
        // IMPORTANT: Always filter by type = 'activity' for activities
        $args['where']['type'] = ClassificationTypes::ACTIVITY;
        return parent::all($args);
    }

    /**
     * Override base count() method to ensure type filtering
     */
    public function count(array $args = []): int
    {
        // IMPORTANT: Always filter by type = 'activity' for activities
        $args['where']['type'] = ClassificationTypes::ACTIVITY;
        return parent::count($args);
    }

    /**
     * Get trip count for an activity
     * 
     * @param int $activityId Activity ID
     * @return int Number of trips with this activity
     */
    public function getTripCount(int $activityId): int
    {
        // Use QueryCache for caching activity trip counts
        $cacheKey = Cache::KEY_ACTIVITY_TRIP_COUNT . '_' . $activityId;
        
        // Cache backends often return strings for scalars; force int on read + write.
        return (int) Cache::remember($cacheKey, function () use ($activityId): int {
            global $wpdb;
            $tripRepository = new \Yatra\Repositories\TripRepository();
            $tripsTable = $tripRepository->getTableName();
            
            // Using hardcoded table name since there's no dedicated repository for trip activities
            $tripActivitiesTable = TripClassificationsTable::getTableName();
            
            return (int) ($wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(DISTINCT t.id)
                 FROM `{$tripsTable}` t
                 INNER JOIN `{$tripActivitiesTable}` ta ON ta.trip_id = t.id
                 WHERE ta.classification_id = %d AND ta.classification_type = %s
                   AND t.status != 'trash'",
                $activityId,
                ClassificationTypes::ACTIVITY
            )) ?? 0);
        }, Cache::DURATION_COUNTS); // Cache for 30 minutes
    }

    /**
     * Get trip count for activity (direct field method)
     * 
     * @param int $activityId Activity ID
     * @return int Number of trips with this activity
     */
    public function getTripCountDirect(int $activityId): int
    {
        // Use QueryCache for caching activity trip counts
        $cacheKey = Cache::KEY_ACTIVITY_TRIP_COUNT_DIRECT . '_' . $activityId;
        
        // Cache backends often return strings for scalars; force int on read + write.
        return (int) Cache::remember($cacheKey, function () use ($activityId): int {
            global $wpdb;
            $tripRepository = new \Yatra\Repositories\TripRepository();
            $tripTable = $tripRepository->getTableName();
            
            return (int) ($wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*)
                 FROM `{$tripTable}` t
                 WHERE t.activity_id = %d",
                $activityId
            )) ?? 0);
        }, Cache::DURATION_COUNTS); // Cache for 30 minutes
    }
}
