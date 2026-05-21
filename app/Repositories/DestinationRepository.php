<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Constants\ClassificationTypes;
use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Database\Tables\TripClassificationsTable;
use Yatra\Database\Tables\TripsTable;
use Yatra\Database\Tables\ReviewsTable;
use Yatra\Utils\Cache;

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
     * JSON fields specific to destinations
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
        $args['where']['status'] = 'publish';
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
     * Wipe listing caches whenever a destination row is created /
     * updated / deleted so {@see self::getPublishedWithTripCounts()}
     * (and any other `destination_listing_*` / `trip_listing_*` keys)
     * never serve stale aggregates after admin edits. The matching
     * {@see \Yatra\Hooks\CacheHooks::onDestinationUpdated()} listeners
     * only fire when a `yatra_destination_*` action is dispatched
     * elsewhere, which today nothing does — so without this override an
     * admin edit could keep showing old `trips_count` / `starting_price`
     * for up to {@see Cache::DURATION_DESTINATION_DATA} seconds.
     */
    protected function afterWrite(string $operation, int $id, array $context = []): void
    {
        Cache::invalidateListingCaches();
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
        // The underlying SQL + price walk has been made O(1) in the
        // number of trips per destination (see
        // {@see self::computeStartingPriceForTripIds()}), so the
        // uncached path is now fast on its own. We still cache the full
        // result for repeat visits, but the cache key sits behind
        // {@see \Yatra\Utils\Cache::invalidateListingCaches()} (which
        // matches the `destination_listing_` prefix) and gets wiped
        // automatically whenever a trip/destination row is written via
        // {@see \Yatra\Hooks\CacheHooks}. Users always see real data
        // immediately after admin edits — no manual cache-bust needed.
        return $this->cacheQueryResult(
            'destination_listing_with_trip_counts_v2',
            function (): array {
                return $this->fetchPublishedWithTripCounts();
            },
            Cache::DURATION_DESTINATION_DATA
        );
    }

    /**
     * Uncached worker for {@see self::getPublishedWithTripCounts()}.
     *
     * @return array<int, \stdClass>
     */
    private function fetchPublishedWithTripCounts(): array
    {
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
                  AND tc.classification_type = %s
                LEFT JOIN `{$tripsTable}` t
                  ON t.id = tc.trip_id
                LEFT JOIN `{$reviewsTable}` r
                  ON r.trip_id = t.id AND r.status = 'approved'
                WHERE d.type = %s AND d.status = 'publish'
                GROUP BY d.id";

        $rows = $this->wpdb->get_results($this->wpdb->prepare($sql, ClassificationTypes::DESTINATION, ClassificationTypes::DESTINATION)) ?: [];

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

        $tripIds = array_values(array_unique(array_filter(array_map('intval', explode(',', $tripIdsCsv)))));
        if (empty($tripIds)) {
            return 0.0;
        }

        // Batch-load all trip rows in ONE query (was: SELECT-per-trip,
        // which made every /destinations request issue O(trips_per_dest)
        // queries — multiplied across all destinations on the page).
        $tripsTable   = TripsTable::getTableName();
        $placeholders = implode(',', array_fill(0, count($tripIds), '%d'));
        $rows         = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT id, sale_price, discounted_price, original_price FROM `{$tripsTable}` WHERE id IN ({$placeholders})",
                ...$tripIds
            )
        ) ?: [];

        $minPrice = null;
        $unpricedIds = [];

        foreach ($rows as $row) {
            $tripEffective = \Yatra\Services\TripPricingService::getEffectivePrice($row);
            if ($tripEffective > 0) {
                if ($minPrice === null || $tripEffective < $minPrice) {
                    $minPrice = $tripEffective;
                }
            } else {
                $unpricedIds[] = (int) $row->id;
            }
        }

        // Only fall back to RecurringAvailabilityRepository for trips
        // that have no trip-level price set. Even there, batch the rule
        // query across all such trip IDs instead of N separate calls.
        if (!empty($unpricedIds)) {
            $fallbackMin = $this->minPriceFromRecurringRulesForTripIds($unpricedIds);
            if ($fallbackMin > 0 && ($minPrice === null || $fallbackMin < $minPrice)) {
                $minPrice = $fallbackMin;
            }
        }

        return $minPrice ?? 0.0;
    }

    /**
     * Batched version of the traveler-pricing fallback that used to run
     * once per trip. Pulls every active rule for the given trip IDs in a
     * single query and scans them in PHP.
     *
     * @param list<int> $tripIds
     */
    private function minPriceFromRecurringRulesForTripIds(array $tripIds): float
    {
        if ($tripIds === []) {
            return 0.0;
        }

        $rulesRepo = new RecurringAvailabilityRepository();
        if (!method_exists($rulesRepo, 'findByTripIds')) {
            // Older repository — fall back to per-trip lookup but only
            // for the (small) set of trips with no trip-level price.
            $candidates = [];
            foreach ($tripIds as $tid) {
                $rules = $rulesRepo->findByTripId($tid, ['status' => 'active']);
                foreach ($rules as $rule) {
                    $this->collectRulePriceCandidates($rule, $candidates);
                }
            }
            return $candidates === [] ? 0.0 : (float) min($candidates);
        }

        $rules = $rulesRepo->findByTripIds($tripIds, ['status' => 'active']);
        $candidates = [];
        foreach ($rules as $rule) {
            $this->collectRulePriceCandidates($rule, $candidates);
        }
        return $candidates === [] ? 0.0 : (float) min($candidates);
    }

    /**
     * @param list<float> $candidates Accumulator passed by reference.
     */
    private function collectRulePriceCandidates(object $rule, array &$candidates): void
    {
        if (!empty($rule->sale_price) && (float) $rule->sale_price > 0) {
            $candidates[] = (float) $rule->sale_price;
        }
        if (!empty($rule->original_price) && (float) $rule->original_price > 0) {
            $candidates[] = (float) $rule->original_price;
        }
        if (!empty($rule->traveler_pricing) && is_array($rule->traveler_pricing)) {
            foreach ($rule->traveler_pricing as $pricing) {
                if (!empty($pricing['effective_price']) && (float) $pricing['effective_price'] > 0) {
                    $candidates[] = (float) $pricing['effective_price'];
                }
            }
        }
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

        // Use centralized TripPricingService for trip-level pricing
        $tripEffective = \Yatra\Services\TripPricingService::getEffectivePrice($trip);
        if ($tripEffective > 0) {
            return $tripEffective;
        }

        $candidates = [];

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
            "WHERE type = %s AND (name LIKE %s OR slug LIKE %s OR description LIKE %s)",
            ClassificationTypes::DESTINATION,
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
        $results = $this->wpdb->get_results($this->wpdb->prepare("
            SELECT status, COUNT(*) as count 
            FROM `{$table}` 
            WHERE type = %s
            GROUP BY status
        ", ClassificationTypes::DESTINATION), ARRAY_A) ?: [];

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
             WHERE td.classification_id = %d
               AND td.classification_type = %s
               AND t.status != 'trash'",
            $destinationId,
            ClassificationTypes::DESTINATION
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
        $tripClassificationsTable = TripClassificationsTable::getTableName();
        
        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(DISTINCT t.id)
             FROM `{$tripTable}` t
             INNER JOIN `{$tripClassificationsTable}` tc ON tc.trip_id = t.id
             WHERE tc.classification_id = %d
               AND tc.classification_type = %s
               AND t.status != 'trash'",
            $destinationId,
            ClassificationTypes::DESTINATION
        ));
    }
}
