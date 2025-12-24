<?php

declare(strict_types=1);

namespace Yatra\Repositories;

/**
 * Activity Repository
 * Handles database operations for activities
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
     * Get table name
     */
    protected function getTableName(): string
    {
        global $wpdb;
        return $wpdb->prefix . 'yatra_activities';
    }

    /**
     * Find by slug
     */
    public function findBySlug(string $slug): ?\stdClass
    {
        $table = esc_sql($this->table);
        $result = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM `{$table}` WHERE slug = %s",
                $slug
            )
        );

        return $result ?: null;
    }

    /**
     * Get published activities
     */
    public function getPublished(array $args = []): array
    {
        $args['where']['status'] = 'publish';
        return $this->all($args);
    }

    /**
     * Get activities by status
     */
    public function getByStatus(string $status, array $args = []): array
    {
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
            "WHERE (name LIKE %s OR slug LIKE %s OR description LIKE %s)",
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
        $sql = "UPDATE `{$table}` SET status = %s, updated_at = %s WHERE id IN ({$placeholders})";
        $params = array_merge([$status, current_time('mysql')], $ids);

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
        $sql = "DELETE FROM `{$table}` WHERE id IN ({$placeholders})";

        $prepared = $this->wpdb->prepare($sql, $ids);
        return $this->wpdb->query($prepared) !== false;
    }

    /**
     * Get published activities with trip counts and stats
     * Similar to destinations, this joins with trip_activities relation table
     * to count how many trips are linked to each activity.
     */
    public function getPublishedWithTripCounts(): array
    {
        global $wpdb;

        $actTable     = esc_sql($this->table);
        $relTable     = esc_sql($wpdb->prefix . 'yatra_trip_activities');
        $tripsTable   = esc_sql($wpdb->prefix . 'yatra_trips');
        $reviewsTable = esc_sql($wpdb->prefix . 'yatra_reviews');

        // COUNT(DISTINCT ta.trip_id) gives real number of trips per activity.
        // avg_rating is computed from approved reviews across all those trips.
        // starting_price is computed in PHP using both regular trip prices and
        // traveler-based pricing from recurring availability rules.
        $sql = "SELECT a.*, 
                       COUNT(DISTINCT ta.trip_id) AS trips_count,
                       COALESCE(AVG(r.rating), 0) AS avg_rating,
                       GROUP_CONCAT(DISTINCT ta.trip_id) AS trip_ids
                FROM `{$actTable}` a
                LEFT JOIN `{$relTable}` ta
                  ON ta.activity_id = a.id
                LEFT JOIN `{$tripsTable}` t
                  ON t.id = ta.trip_id
                LEFT JOIN `{$reviewsTable}` r
                  ON r.trip_id = t.id AND r.status = 'approved'
                WHERE a.status = 'publish'
                GROUP BY a.id";

        $rows = $this->wpdb->get_results($sql) ?: [];

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
        $tripsTable = esc_sql($wpdb->prefix . 'yatra_trips');
        
        // Get the minimum original price from trips
        $sql = "SELECT MIN(CAST(original_price AS DECIMAL(10,2))) as min_price 
                FROM `{$tripsTable}` 
                WHERE id IN ({$placeholders}) AND original_price > 0";
        
        $prepared = $this->wpdb->prepare($sql, $tripIdsArray);
        $result = $this->wpdb->get_var($prepared);
        
        return $result ? (float) $result : 0.0;
    }

    /**
     * Get counts per status for admin views
     */
    public function getStatusCounts(): array
    {
        $table = esc_sql($this->table);
        
        // Debug logging
        error_log('ActivityRepository - Table name: ' . $table);
        
        // Get counts for each status
        $query = "SELECT status, COUNT(*) as count FROM `{$table}` WHERE 1=1 GROUP BY status";
        error_log('ActivityRepository - Query: ' . $query);
        
        $results = $this->wpdb->get_results($query, ARRAY_A) ?: [];
        error_log('ActivityRepository - Raw results: ' . print_r($results, true));

        $counts = [];
        foreach ($results as $row) {
            $counts[$row['status']] = (int) $row['count'];
        }

        // Ensure we have entries for all main statuses even if count is 0
        $counts['publish'] = $counts['publish'] ?? 0;
        $counts['draft'] = $counts['draft'] ?? 0;
        $counts['trash'] = $counts['trash'] ?? 0;

        error_log('ActivityRepository - Final counts: ' . print_r($counts, true));
        return $counts;
    }
}
