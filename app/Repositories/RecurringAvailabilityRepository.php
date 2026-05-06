<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Database\Tables\TripAvailabilityRulesTable;

/**
 * Recurring Availability Repository
 * Handles database operations for recurring availability rules
 */
class RecurringAvailabilityRepository extends BaseRepository
{
    private function sanitizeCoordinate($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (is_numeric($value)) {
            return (string) $value;
        }

        return null;
    }

    /**
     * Get table name
     */
    protected function getTableName(): string
    {
        return TripAvailabilityRulesTable::getTableName();
    }

    /**
     * Find all rules by trip ID
     */
    public function findByTripId(int $tripId, array $filters = []): array
    {
        $table = esc_sql($this->table);
        $where = ['trip_id = %d'];
        $params = [$tripId];
        
        // Status filter
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $where[] = 'status = %s';
            $params[] = $filters['status'];
        }
        
        // Rule type filter
        if (!empty($filters['rule_type']) && $filters['rule_type'] !== 'all') {
            $where[] = 'rule_type = %s';
            $params[] = $filters['rule_type'];
        }
        
        // Search filter
        if (!empty($filters['search'])) {
            $where[] = '(name LIKE %s OR from_location LIKE %s OR to_location LIKE %s)';
            $search = '%' . $this->wpdb->esc_like($filters['search']) . '%';
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
        }
        
        $query = "SELECT * FROM `{$table}` WHERE " . implode(' AND ', $where);
        $query .= " ORDER BY priority DESC, created_at DESC";
        
        if (!empty($filters['per_page'])) {
            $perPage = (int) $filters['per_page'];
            $page = max(1, (int) ($filters['page'] ?? 1));
            $offset = ($page - 1) * $perPage;
            $query .= $this->wpdb->prepare(" LIMIT %d OFFSET %d", $perPage, $offset);
        }
        
        $results = $this->wpdb->get_results(
            $this->wpdb->prepare($query, ...$params)
        );
        
        return array_map([$this, 'hydrateRule'], $results ?: []);
    }

    /**
     * Count rules by trip ID
     */
    public function countByTripId(int $tripId, array $filters = []): int
    {
        $table = esc_sql($this->table);
        $where = ['trip_id = %d'];
        $params = [$tripId];
        
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $where[] = 'status = %s';
            $params[] = $filters['status'];
        }
        
        if (!empty($filters['rule_type']) && $filters['rule_type'] !== 'all') {
            $where[] = 'rule_type = %s';
            $params[] = $filters['rule_type'];
        }
        
        $query = "SELECT COUNT(*) FROM `{$table}` WHERE " . implode(' AND ', $where);
        
        return (int) $this->wpdb->get_var(
            $this->wpdb->prepare($query, ...$params)
        );
    }

    /**
     * Get status counts for recurring rules by trip ID.
     *
     * Returns zeros for every key when the trip has no rules at all so the
     * admin status badges (All / Active / Inactive) can never report a
     * phantom "1" while the underlying list is empty. Guarantees:
     *   - Trip ID is required (positive integer).
     *   - SUM() over an empty result set is normalized to 0 via COALESCE.
     *   - $wpdb->get_row() returning null (table missing, transient errors)
     *     also yields a fully-zero payload instead of leaking nulls upstream.
     */
    public function getStatusCounts(array $args = []): array
    {
        // Extract trip ID from args for backward compatibility
        $tripId = isset($args['trip_id']) ? (int) $args['trip_id'] : 0;

        if ($tripId <= 0) {
            throw new \InvalidArgumentException('Trip ID is required for RecurringAvailability status counts');
        }

        $table = esc_sql($this->table);

        $query = $this->wpdb->prepare(
            "SELECT
                COALESCE(COUNT(*), 0) AS all_count,
                COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) AS active,
                COALESCE(SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END), 0) AS inactive
             FROM `{$table}`
             WHERE trip_id = %d",
            $tripId
        );

        $result = $this->wpdb->get_row($query, ARRAY_A);

        // Defensive default: return all-zero when the row is missing or the
        // query failed silently (no rules table yet, DB down, etc.).
        if (!is_array($result)) {
            return ['all' => 0, 'active' => 0, 'inactive' => 0];
        }

        return [
            'all'      => max(0, (int) ($result['all_count'] ?? 0)),
            'active'   => max(0, (int) ($result['active'] ?? 0)),
            'inactive' => max(0, (int) ($result['inactive'] ?? 0)),
        ];
    }

    /**
     * Get active rules for a trip within a date range
     */
    public function getActiveRulesForDateRange(int $tripId, string $fromDate, string $toDate): array
    {
        $table = esc_sql($this->table);
        
        $query = $this->wpdb->prepare(
            "SELECT * FROM `{$table}` 
             WHERE trip_id = %d 
               AND status = 'active'
               AND start_date <= %s
               AND (end_date IS NULL OR end_date >= %s)
             ORDER BY priority DESC",
            $tripId,
            $toDate,
            $fromDate
        );
        
        $results = $this->wpdb->get_results($query);
        
        return array_map([$this, 'hydrateRule'], $results ?: []);
    }

    /**
     * Find active rules that apply to a specific date
     * 
     * @param int $tripId Trip ID
     * @param string $date Date in YYYY-MM-DD format
     * @return array Array of matching rules ordered by priority
     */
    public function findActiveRulesForDate(int $tripId, string $date): array
    {
        $table = esc_sql($this->table);
        
        $query = $this->wpdb->prepare(
            "SELECT * FROM `{$table}` 
             WHERE trip_id = %d 
               AND status = 'active'
               AND start_date <= %s
               AND (end_date IS NULL OR end_date >= %s)
             ORDER BY priority DESC",
            $tripId,
            $date,
            $date
        );
        
        $results = $this->wpdb->get_results($query);
        
        return array_map([$this, 'hydrateRule'], $results ?: []);
    }

    /**
     * Create a new rule
     */
    public function create(array $data): int
    {
        $prepared = $this->prepareData($data);
        
        $result = $this->wpdb->insert($this->table, $prepared);
        
        if ($result === false) {
            throw new \RuntimeException('Failed to create recurring rule: ' . $this->wpdb->last_error);
        }
        
        return (int) $this->wpdb->insert_id;
    }

    /**
     * Update a rule
     */
    public function update(int $id, array $data): bool
    {
        $prepared = $this->prepareData($data);
        $prepared['updated_at'] = current_time('mysql');

        $result = $this->wpdb->update(
            $this->table,
            $prepared,
            ['id' => $id]
        );

        if ($result === false) {
            // Bubble the wpdb error up so the controller's catch-all returns a
            // useful 500 message instead of the opaque "Failed to update rule".
            throw new \RuntimeException('Failed to update recurring rule: ' . $this->wpdb->last_error);
        }

        return true;
    }

    /**
     * Delete a rule
     */
    public function delete(int $id): bool
    {
        $result = $this->wpdb->delete($this->table, ['id' => $id]);
        return $result !== false;
    }

    /**
     * Find a rule by ID (override to hydrate data)
     */
    public function find(int $id, bool $includeDeleted = false): ?\stdClass
    {
        $result = parent::find($id, $includeDeleted);
        
        if ($result) {
            return $this->hydrateRule($result);
        }
        
        return null;
    }

    /**
     * Prepare data for database
     */
    private function prepareData(array $data): array
    {
        $allowed = [
            'trip_id', 'name', 'rule_type', 'days_of_week', 'week_of_month',
            'day_of_week', 'interval_days', 'interval_start_date', 'start_date',
            'end_date', 'excluded_dates', 'months', 'time_slots', 'original_price',
            'sale_price', 'traveler_pricing', 'seats_total', 'alert_threshold',
            'departure_time', 'arrival_time', 'from_location', 'to_location',
            'from_latitude', 'from_longitude', 'to_latitude', 'to_longitude',
            'cutoff_hours', 'advance_booking_days', 'day_overrides', 'status', 'priority',
        ];

        $prepared = [];

        // Map API pricing_type to schema column price_type (enum fixed|percentage)
        if (array_key_exists('pricing_type', $data)) {
            $pt = $data['pricing_type'];
            $prepared['price_type'] = ($pt === 'percentage' || $pt === 'percent') ? 'percentage' : 'fixed';
        }

        // Columns that are JSON in the schema. Anything written here MUST be a
        // valid JSON document, otherwise MySQL rejects the row with
        // "Invalid JSON text: The document root must not be followed by other
        // values." (e.g. when a legacy CSV string like "0,1,2" is sent).
        $jsonColumns = ['excluded_dates', 'months', 'time_slots', 'day_overrides', 'traveler_pricing', 'days_of_week'];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $value = $data[$field];

                // Normalise week_of_month (stored as smallint in schema) from the admin UI strings.
                if ($field === 'week_of_month') {
                    if (is_string($value)) {
                        $map = [
                            'first' => 1,
                            'second' => 2,
                            'third' => 3,
                            'fourth' => 4,
                            'last' => 5,
                        ];
                        $key = strtolower(trim($value));
                        if (isset($map[$key])) {
                            $value = $map[$key];
                        }
                    }
                    if ($value === '' || $value === null) {
                        $value = null;
                    }
                }

                if (in_array($field, $jsonColumns, true)) {
                    if (is_array($value)) {
                        $value = wp_json_encode($value);
                    } elseif (is_string($value)) {
                        $trimmed = trim($value);
                        // Detect a value that already looks like JSON; otherwise
                        // treat as legacy CSV (only meaningful for days_of_week).
                        if ($trimmed === '' || $trimmed === 'null') {
                            $value = $field === 'days_of_week' ? wp_json_encode([]) : wp_json_encode([]);
                        } elseif ($trimmed[0] === '[' || $trimmed[0] === '{') {
                            $value = $trimmed;
                        } elseif ($field === 'days_of_week') {
                            $parts = array_values(array_filter(
                                array_map('intval', explode(',', $trimmed)),
                                static fn(int $d) => $d >= 0 && $d <= 6
                            ));
                            $value = wp_json_encode($parts);
                        } else {
                            $value = wp_json_encode([]);
                        }
                    } elseif ($value === null) {
                        $value = wp_json_encode([]);
                    } else {
                        $value = wp_json_encode([$value]);
                    }
                }

                // Handle empty values
                if ($value === '' || $value === null) {
                    if (in_array($field, ['end_date', 'interval_start_date', 'departure_time', 'arrival_time', 'advance_booking_days'], true)) {
                        $value = null;
                    }
                }

                if (in_array($field, ['from_latitude', 'from_longitude', 'to_latitude', 'to_longitude'], true)) {
                    $value = $this->sanitizeCoordinate($value);
                }

                $prepared[$field] = $value;
            }
        }

        return $prepared;
    }

    /**
     * Hydrate rule data (decode JSON fields)
     */
    private function hydrateRule(object $rule): object
    {
        // Normalise week_of_month from stored int (1..5) to UI string.
        if (isset($rule->week_of_month) && $rule->week_of_month !== null && $rule->week_of_month !== '') {
            $w = is_numeric($rule->week_of_month) ? (int) $rule->week_of_month : null;
            if ($w !== null) {
                $map = [
                    1 => 'first',
                    2 => 'second',
                    3 => 'third',
                    4 => 'fourth',
                    5 => 'last',
                ];
                if (isset($map[$w])) {
                    $rule->week_of_month = $map[$w];
                }
            }
        }

        // Decode JSON fields
        if (!empty($rule->excluded_dates)) {
            $rule->excluded_dates = json_decode($rule->excluded_dates, true) ?: [];
        } else {
            $rule->excluded_dates = [];
        }
        
        if (!empty($rule->time_slots)) {
            $rule->time_slots = json_decode($rule->time_slots, true) ?: [];
        } else {
            $rule->time_slots = [];
        }
        
        if (!empty($rule->day_overrides)) {
            $rule->day_overrides = json_decode($rule->day_overrides, true) ?: [];
        } else {
            $rule->day_overrides = [];
        }
        
        if (!empty($rule->traveler_pricing)) {
            $rule->traveler_pricing = json_decode($rule->traveler_pricing, true) ?: [];
            // Enrich traveler pricing with category labels
            $rule->traveler_pricing = $this->enrichTravelerPricing($rule->traveler_pricing);
        } else {
            $rule->traveler_pricing = [];
        }

        // CapacityService reads seats_total; fall back to capacity_value when fixed capacity
        if (empty($rule->seats_total) && !empty($rule->capacity_value)) {
            $capType = $rule->capacity_type ?? 'fixed';
            if ($capType === 'fixed') {
                $rule->seats_total = (int) $rule->capacity_value;
            }
        }

        // Also enrich time_slots traveler_pricing
        if (!empty($rule->time_slots)) {
            foreach ($rule->time_slots as &$slot) {
                if (!empty($slot['traveler_pricing'])) {
                    $slot['traveler_pricing'] = $this->enrichTravelerPricing($slot['traveler_pricing']);
                }
            }
        }
        
        // Convert days_of_week to array (JSON array from DB, or legacy comma-separated)
        if (!empty($rule->days_of_week)) {
            $dow = $rule->days_of_week;
            if (is_string($dow)) {
                $decoded = json_decode($dow, true);
                if (is_array($decoded)) {
                    $rule->days_of_week_array = array_map('intval', $decoded);
                } else {
                    $rule->days_of_week_array = array_map('intval', explode(',', $dow));
                }
            } elseif (is_array($dow)) {
                $rule->days_of_week_array = array_map('intval', $dow);
            } else {
                $rule->days_of_week_array = [];
            }
        } else {
            $rule->days_of_week_array = [];
        }
        
        // Decode months (JSON column or longtext)
        if (!empty($rule->months)) {
            if (is_string($rule->months)) {
                $rule->months = json_decode($rule->months, true) ?: [];
            } elseif (!is_array($rule->months)) {
                $rule->months = [];
            }
        } else {
            $rule->months = [];
        }

        return $rule;
    }
    
    /**
     * Enrich traveler pricing with category labels from database
     */
    private function enrichTravelerPricing(array $pricing): array
    {
        if (empty($pricing)) {
            return [];
        }
        
        // Get all category IDs
        $categoryIds = array_filter(array_map(function($p) {
            return isset($p['category_id']) ? (int) $p['category_id'] : null;
        }, $pricing));
        
        if (empty($categoryIds)) {
            return $pricing;
        }
        
        // Fetch category details
        // Using hardcoded table name since there's no dedicated repository for this table
        $categories_table = $this->wpdb->prefix . 'yatra_traveler_categories';
        $placeholders = implode(',', array_fill(0, count($categoryIds), '%d'));
        $sql = $this->wpdb->prepare(
            "SELECT id, label, slug, description, age_min, age_max 
             FROM {$categories_table} 
             WHERE id IN ({$placeholders})",
            ...$categoryIds
        );
        $categories = $this->wpdb->get_results($sql);
        
        // Index by ID
        $categoryIndex = [];
        foreach ($categories as $cat) {
            $categoryIndex[(int) $cat->id] = $cat;
        }
        
        // Enrich pricing with category info
        foreach ($pricing as &$p) {
            $catId = isset($p['category_id']) ? (int) $p['category_id'] : null;
            if ($catId && isset($categoryIndex[$catId])) {
                $cat = $categoryIndex[$catId];
                $p['category_label'] = $cat->label;
                $p['category_slug'] = $cat->slug;
                $p['age_min'] = $cat->age_min ? (int) $cat->age_min : null;
                $p['age_max'] = $cat->age_max ? (int) $cat->age_max : null;
                // Calculate effective price
                $p['effective_price'] = \Yatra\Services\TripPricingService::resolveCategoryEffectivePrice($p);
            }
        }
        
        return $pricing;
    }
}

