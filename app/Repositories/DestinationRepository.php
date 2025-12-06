<?php

declare(strict_types=1);

namespace Yatra\Repositories;

/**
 * Destination Repository
 * Handles database operations for destinations
 */
class DestinationRepository extends BaseRepository
{
    /**
     * Get table name
     */
    protected function getTableName(): string
    {
        global $wpdb;
        return $wpdb->prefix . 'yatra_destinations';
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
     * Get published destinations
     */
    public function getPublished(array $args = []): array
    {
        $args['where']['status'] = 'publish';
        return $this->all($args);
    }

    /**
     * Get destinations by status
     */
    public function getByStatus(string $status, array $args = []): array
    {
        $args['where']['status'] = $status;
        return $this->all($args);
    }

    /**
     * Get published destinations with attached trip counts.
     *
     * This uses the yatra_trip_destinations relation table to count how many
     * trips are linked to each destination. It returns each destination row
     * plus a numeric trips_count property.
     */
    public function getPublishedWithTripCounts(): array
    {
        global $wpdb;

        $destTable    = esc_sql($this->table);
        $relTable     = esc_sql($wpdb->prefix . 'yatra_trip_destinations');
        $tripsTable   = esc_sql($wpdb->prefix . 'yatra_trips');
        $reviewsTable = esc_sql($wpdb->prefix . 'yatra_reviews');

        // COUNT(DISTINCT td.trip_id) gives real number of trips per destination.
        // avg_rating is computed from approved reviews across all those trips.
        // starting_price is the minimum non-zero price across related trips,
        // using sale/discounted/original price in that priority.
        $sql = "SELECT d.*, 
                       COUNT(DISTINCT td.trip_id) AS trips_count,
                       COALESCE(AVG(r.rating), 0) AS avg_rating,
                       MIN(NULLIF(COALESCE(t.sale_price, t.discounted_price, t.original_price), 0)) AS starting_price
                FROM `{$destTable}` d
                LEFT JOIN `{$relTable}` td
                  ON td.destination_id = d.id
                LEFT JOIN `{$tripsTable}` t
                  ON t.id = td.trip_id
                LEFT JOIN `{$reviewsTable}` r
                  ON r.trip_id = t.id AND r.status = 'approved'
                WHERE d.status = 'publish'
                GROUP BY d.id";

        return $this->wpdb->get_results($sql) ?: [];
    }

    /**
     * Search destinations
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
     * Get counts per status for admin views
     */
    public function getStatusCounts(): array
    {
        $table = esc_sql($this->table);

        // Get counts for each status
        $results = $this->wpdb->get_results("
            SELECT status, COUNT(*) as count 
            FROM `{$table}` 
            WHERE 1=1 
            GROUP BY status
        ", ARRAY_A) ?: [];

        $counts = [];
        foreach ($results as $row) {
            $counts[$row['status']] = (int) $row['count'];
        }

        // Ensure we have entries for all main statuses even if count is 0
        $counts['publish'] = $counts['publish'] ?? 0;
        $counts['draft'] = $counts['draft'] ?? 0;
        $counts['trash'] = $counts['trash'] ?? 0;

        return $counts;
    }
}
