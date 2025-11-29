<?php

declare(strict_types=1);

namespace Yatra\Repositories;

/**
 * Recurring Availability Repository
 * Handles database operations for recurring availability rules
 */
class RecurringAvailabilityRepository extends BaseRepository
{
    /**
     * Get table name
     */
    protected function getTableName(): string
    {
        return $this->wpdb->prefix . 'yatra_trip_availability_rules';
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
        
        return $result !== false;
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
     * Prepare data for database
     */
    private function prepareData(array $data): array
    {
        $allowed = [
            'trip_id', 'name', 'rule_type', 'days_of_week', 'week_of_month',
            'day_of_week', 'interval_days', 'interval_start_date', 'start_date',
            'end_date', 'excluded_dates', 'time_slots', 'original_price', 'sale_price',
            'seats_total', 'departure_time', 'arrival_time', 'from_location',
            'to_location', 'cutoff_hours', 'advance_booking_days', 'day_overrides',
            'status', 'priority'
        ];
        
        $prepared = [];
        
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $value = $data[$field];
                
                // JSON encode array fields
                if (in_array($field, ['excluded_dates', 'time_slots', 'day_overrides'], true)) {
                    if (is_array($value)) {
                        $value = wp_json_encode($value);
                    }
                }
                
                // Handle empty values
                if ($value === '' || $value === null) {
                    if (in_array($field, ['end_date', 'interval_start_date', 'departure_time', 'arrival_time', 'advance_booking_days'], true)) {
                        $value = null;
                    }
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
        
        // Convert days_of_week string to array
        if (!empty($rule->days_of_week)) {
            $rule->days_of_week_array = array_map('intval', explode(',', $rule->days_of_week));
        } else {
            $rule->days_of_week_array = [];
        }
        
        return $rule;
    }
}

