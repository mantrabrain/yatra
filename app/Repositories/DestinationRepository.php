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
     * Rich text fields specific to destinations
     */
    protected array $richTextFields = ['description'];

    /**
     * Integer fields specific to destinations
     */
    protected array $integerFields = ['id', 'created_by', 'updated_by'];

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
        // starting_price is computed in PHP using both regular trip prices and
        // traveler-based pricing from recurring availability rules.
        $sql = "SELECT d.*, 
                       COUNT(DISTINCT td.trip_id) AS trips_count,
                       COALESCE(AVG(r.rating), 0) AS avg_rating,
                       GROUP_CONCAT(DISTINCT td.trip_id) AS trip_ids
                FROM `{$destTable}` d
                LEFT JOIN `{$relTable}` td
                  ON td.destination_id = d.id
                LEFT JOIN `{$tripsTable}` t
                  ON t.id = td.trip_id
                LEFT JOIN `{$reviewsTable}` r
                  ON r.trip_id = t.id AND r.status = 'approved'
                WHERE d.status = 'publish'
                GROUP BY d.id";

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
     * Compute the minimum effective starting price across a set of trip IDs.
     *
     * This looks at both regular trip pricing (sale/discounted/original) and
     * traveler-based pricing defined in recurring availability rules.
     */
    private function computeStartingPriceForTripIds(string $tripIdsCsv): float
    {
        if (trim($tripIdsCsv) === '') {
            return 0.0;
        }

        $tripIds = array_filter(array_map('intval', explode(',', $tripIdsCsv)));
        if (empty($tripIds)) {
            return 0.0;
        }

        $minPrice = null;
        foreach ($tripIds as $tripId) {
            $price = $this->getEffectiveTripBasePrice($tripId);
            if ($price > 0 && ($minPrice === null || $price < $minPrice)) {
                $minPrice = $price;
            }
        }

        return $minPrice ?? 0.0;
    }

    /**
     * Get an effective base price for a single trip.
     *
     * Priority:
     * 1) Trip-level sale/discounted/original price (if any > 0)
     * 2) Traveler-based pricing from active recurring availability rules
     *    (minimum effective traveler price or rule-level sale/original).
     */
    private function getEffectiveTripBasePrice(int $tripId): float
    {
        global $wpdb;

        if ($tripId <= 0) {
            return 0.0;
        }

        $tripsTable = esc_sql($wpdb->prefix . 'yatra_trips');

        $trip = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT id, sale_price, discounted_price, original_price FROM `{$tripsTable}` WHERE id = %d",
                $tripId
            )
        );

        if (!$trip) {
            return 0.0;
        }

        $candidates = [];
        foreach (['sale_price', 'discounted_price', 'original_price'] as $field) {
            if (isset($trip->{$field}) && (float) $trip->{$field} > 0) {
                $candidates[] = (float) $trip->{$field};
            }
        }

        if (!empty($candidates)) {
            return (float) min($candidates);
        }

        // Fallback 1: look at traveler-based pricing from recurring availability rules
        $rulesRepo = new RecurringAvailabilityRepository();
        $rules     = $rulesRepo->findByTripId($tripId, ['status' => 'active']);

        foreach ($rules as $rule) {
            // Rule-level sale/original
            if (!empty($rule->sale_price) && (float) $rule->sale_price > 0) {
                $candidates[] = (float) $rule->sale_price;
            }
            if (!empty($rule->original_price) && (float) $rule->original_price > 0) {
                $candidates[] = (float) $rule->original_price;
            }

            // Traveler pricing on the rule itself
            if (!empty($rule->traveler_pricing) && is_array($rule->traveler_pricing)) {
                foreach ($rule->traveler_pricing as $pricing) {
                    if (!empty($pricing['effective_price']) && (float) $pricing['effective_price'] > 0) {
                        $candidates[] = (float) $pricing['effective_price'];
                    }
                }
            }

            // Traveler pricing nested in time_slots
            if (!empty($rule->time_slots) && is_array($rule->time_slots)) {
                foreach ($rule->time_slots as $slot) {
                    if (empty($slot['traveler_pricing']) || !is_array($slot['traveler_pricing'])) {
                        continue;
                    }
                    foreach ($slot['traveler_pricing'] as $pricing) {
                        if (!empty($pricing['effective_price']) && (float) $pricing['effective_price'] > 0) {
                            $candidates[] = (float) $pricing['effective_price'];
                        }
                    }
                }
            }
        }

        if (empty($candidates)) {
            return 0.0;
        }

        return (float) min($candidates);
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
