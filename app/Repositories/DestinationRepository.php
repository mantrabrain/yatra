<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Constants\ClassificationTypes;
use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Database\Tables\TripClassificationsTable;
use Yatra\Database\Tables\TripsTable;
use Yatra\Database\Tables\ReviewsTable;

/**
 * Destination Repository
 * Handles database operations for destinations using the new ClassificationsTable
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
     * Get table name - using the new ClassificationsTable
     */
    protected function getTableName(): string
    {
        return ClassificationsTable::getTableName();
    }

    /**
     * Find by slug - for destinations
     */
    public function findBySlug(string $slug): ?\stdClass
    {
        $table = esc_sql($this->table);
        $result = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM `{$table}` WHERE type = %s AND slug = %s",
                ClassificationTypes::DESTINATION,
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
        $args['where']['type'] = ClassificationTypes::DESTINATION;
        $args['where']['status'] = 'active';
        return $this->all($args);
    }

    /**
     * Get destinations by status
     */
    public function getByStatus(string $status, array $args = []): array
    {
        $args['where']['type'] = ClassificationTypes::DESTINATION;
        $args['where']['status'] = $status;
        return $this->all($args);
    }

    /**
     * Get published destinations with attached trip counts.
     *
     * This uses the new TripClassificationsTable relation table to count how many
     * trips are linked to each destination. It returns each destination row
     * plus a numeric trips_count property.
     */
    public function getPublishedWithTripCounts(): array
    {
        global $wpdb;

        $destTable    = esc_sql($this->table);
        $relTable     = TripClassificationsTable::getTableName();
        $tripsTable   = TripsTable::getTableName();
        $reviewsTable = ReviewsTable::getTableName();

        // COUNT(DISTINCT tc.trip_id) gives real number of trips per destination.
        // avg_rating is computed from approved reviews across all those trips.
        // starting_price is computed in PHP using both regular trip prices and
        // traveler-based pricing from recurring availability rules.
        $sql = "SELECT d.*, 
                       COUNT(DISTINCT tc.trip_id) AS trips_count,
                       COALESCE(AVG(r.rating), 0) AS avg_rating,
                       GROUP_CONCAT(DISTINCT tc.trip_id) AS trip_ids
                FROM `{$destTable}` d
                LEFT JOIN `{$relTable}` tc
                  ON tc.classification_id = d.id 
                  AND tc.classification_type = '" . ClassificationTypes::DESTINATION . "'
                LEFT JOIN `{$tripsTable}` t
                  ON t.id = tc.trip_id
                LEFT JOIN `{$reviewsTable}` r
                  ON r.trip_id = t.id AND r.status = 'approved'
                WHERE d.type = '" . ClassificationTypes::DESTINATION . "' AND d.status = 'active'
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

        $tripsTable = TripsTable::getTableName();

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
            "WHERE type = '" . ClassificationTypes::DESTINATION . "' AND (name LIKE %s OR slug LIKE %s OR description LIKE %s)",
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
     * Get status counts for destinations
     */
    public function getStatusCounts(array $args = []): array
    {
        $table = esc_sql($this->table);

        // Get counts for each status - only for destinations
        $results = $this->wpdb->get_results("
            SELECT status, COUNT(*) as count 
            FROM `{$table}` 
            WHERE type = '" . ClassificationTypes::DESTINATION . "'
            GROUP BY status
        ", ARRAY_A) ?: [];

        $counts = [
            'publish' => 0,
            'draft' => 0,
            'trash' => 0,
            'total' => 0
        ];
        
        foreach ($results as $row) {
            $status = $row['status'];
            $count = (int) $row['count'];
            
            // Map old status values to new ones
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

        // Ensure we have entries for all main statuses even if count is 0
        $counts['publish'] = $counts['publish'] ?? 0;
        $counts['draft'] = $counts['draft'] ?? 0;
        $counts['trash'] = $counts['trash'] ?? 0;

         
        return $counts;
    }

    /**
     * Override base all() method to ensure type filtering
     */
    public function all(array $args = []): array
    {
        // IMPORTANT: Always filter by type = 'destination' for destinations
        $args['where']['type'] = ClassificationTypes::DESTINATION;
        return parent::all($args);
    }

    /**
     * Override base count() method to ensure type filtering
     */
    public function count(array $args = []): int
    {
        // IMPORTANT: Always filter by type = 'destination' for destinations
        $args['where']['type'] = ClassificationTypes::DESTINATION;
        return parent::count($args);
    }

    /**
     * Get trip count for a destination
     * 
     * @param int $destinationId Destination ID
     * @return int Number of trips with this destination
     */
    public function getTripCount(int $destinationId): int
    {
        global $wpdb;
        $tripRepository = new \Yatra\Repositories\TripRepository();
        $tripsTable = $tripRepository->getTableName();
        
        // Use TripClassificationsTable for trip-destination relationships
        $tripDestinationsTable = TripClassificationsTable::getTableName();
        
        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(DISTINCT t.id)
             FROM `{$tripsTable}` t
             INNER JOIN `{$tripDestinationsTable}` td ON td.trip_id = t.id
             WHERE td.destination_id = %d
               AND t.status != 'trash'",
            $destinationId
        ));
    }

    /**
     * Get trip count for destination (direct field method)
     * 
     * @param int $destinationId Destination ID
     * @return int Number of trips with this destination
     */
    public function getTripCountDirect(int $destinationId): int
    {
        global $wpdb;
        $tripRepository = new \Yatra\Repositories\TripRepository();
        $tripTable = $tripRepository->getTableName();
        
        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*)
             FROM `{$tripTable}` t
             WHERE t.destination_id = %d
               AND t.status != 'trash'",
            $destinationId
        ));
    }
}
