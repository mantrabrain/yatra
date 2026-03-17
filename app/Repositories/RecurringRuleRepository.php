<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Models\RecurringRule;
use Yatra\Database\Tables\TripAvailabilityRulesTable;

/**
 * Recurring Rule Repository
 * Handles database operations for recurring departure rules
 * 
 * Table: yatra_new_trip_availability_rules
 * 
 * Fields:
 * - id (primary key)
 * - trip_id
 * - recurrence_type (daily|weekly|monthly|custom_days)
 * - weekdays (JSON array: [0,1,2,3,4,5,6])
 * - start_date (nullable)
 * - end_date (nullable)
 * - max_capacity
 * - base_price (nullable)
 * - pricing_by_traveler_type (JSON)
 * - is_active
 * - created_at
 * - updated_at
 */
class RecurringRuleRepository extends BaseRepository
{
    /**
     * Get table name
     */
    protected function getTableName(): string
    {
        return TripAvailabilityRulesTable::getTableName();
    }

    /**
     * Find by ID
     */
    public function find(int $id, bool $includeDeleted = false): ?\stdClass
    {
        $result = parent::find($id, $includeDeleted);
        return $result ? (object) RecurringRule::fromArray((array) $result)->toArray() : null;
    }

    /**
     * Find by ID and return RecurringRule model
     */
    public function findModel(int $id): ?RecurringRule
    {
        $result = parent::find($id);
        return $result ? RecurringRule::fromArray((array) $result) : null;
    }

    /**
     * Find all rules by trip ID
     */
    public function findByTripId(int $tripId, bool $activeOnly = false): array
    {
        $table = esc_sql($this->table);
        $where = ['trip_id = %d'];
        $params = [$tripId];
        
        if ($activeOnly) {
            $where[] = 'is_active = 1';
        }
        
        $query = "SELECT * FROM `{$table}` WHERE " . implode(' AND ', $where);
        $query .= " ORDER BY created_at DESC";
        
        $results = $this->wpdb->get_results(
            $this->wpdb->prepare($query, ...$params),
            ARRAY_A
        );
        
        return array_map(function ($row) {
            return RecurringRule::fromArray($row);
        }, $results ?: []);
    }

    /**
     * Find active rules for a trip within a date range
     */
    public function findActiveForDateRange(int $tripId, string $fromDate, string $toDate): array
    {
        $table = esc_sql($this->table);
        
        $query = $this->wpdb->prepare(
            "SELECT * FROM `{$table}` 
             WHERE trip_id = %d 
               AND status = 'active'
               AND (start_date IS NULL OR start_date <= %s)
               AND (end_date IS NULL OR end_date >= %s)
             ORDER BY created_at DESC",
            $tripId,
            $toDate,
            $fromDate
        );
        
        $results = $this->wpdb->get_results($query, ARRAY_A);
        
        return array_map(function ($row) {
            return RecurringRule::fromArray($row);
        }, $results ?: []);
    }

    /**
     * Create a recurring rule
     */
    public function create(array $data): int
    {
        $table = esc_sql($this->table);
        
        $insertData = [
            'trip_id' => (int) ($data['trip_id'] ?? 0),
            'name' => sanitize_text_field($data['name'] ?? 'Recurring Rule'),
            'status' => sanitize_text_field($data['status'] ?? 'active'),
            'recurrence_type' => sanitize_text_field($data['recurrence_type'] ?? 'weekly'),
            'start_date' => !empty($data['start_date']) ? sanitize_text_field($data['start_date']) : current_time('Y-m-d'),
            'end_date' => !empty($data['end_date']) ? sanitize_text_field($data['end_date']) : null,
            'capacity_value' => (int) ($data['max_capacity'] ?? 0),
            'price_override' => !empty($data['base_price']) ? (float) $data['base_price'] : null,
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
        ];
        
        // Handle weekdays as JSON
        if (!empty($data['weekdays'])) {
            if (is_array($data['weekdays'])) {
                $insertData['weekdays'] = wp_json_encode(array_map('intval', $data['weekdays']));
            } else {
                $insertData['weekdays'] = $data['weekdays'];
            }
        } else {
            $insertData['weekdays'] = null;
        }
        
        // Handle pricing_by_traveler_type as JSON
        if (!empty($data['pricing_by_traveler_type'])) {
            $insertData['pricing_by_traveler_type'] = is_array($data['pricing_by_traveler_type'])
                ? wp_json_encode($data['pricing_by_traveler_type'])
                : $data['pricing_by_traveler_type'];
        } else {
            $insertData['pricing_by_traveler_type'] = null;
        }
        
        $this->wpdb->insert($table, $insertData, [
            '%d', '%s', '%s', '%s', '%d', '%f', '%d', '%s', '%s'
        ]);
        
        return $this->wpdb->insert_id;
    }

    /**
     * Update a recurring rule
     */
    public function update(int $id, array $data): bool
    {
        $table = esc_sql($this->table);
        
        $updateData = [];
        
        if (isset($data['trip_id'])) $updateData['trip_id'] = (int) $data['trip_id'];
        if (isset($data['recurrence_type'])) $updateData['recurrence_type'] = sanitize_text_field($data['recurrence_type']);
        if (isset($data['start_date'])) $updateData['start_date'] = !empty($data['start_date']) ? sanitize_text_field($data['start_date']) : null;
        if (isset($data['end_date'])) $updateData['end_date'] = !empty($data['end_date']) ? sanitize_text_field($data['end_date']) : null;
        if (isset($data['max_capacity'])) $updateData['max_capacity'] = (int) $data['max_capacity'];
        if (isset($data['base_price'])) $updateData['base_price'] = !empty($data['base_price']) ? (float) $data['base_price'] : null;
        if (isset($data['is_active'])) $updateData['is_active'] = (bool) $data['is_active'];
        
        if (isset($data['weekdays'])) {
            if (is_array($data['weekdays'])) {
                $updateData['weekdays'] = wp_json_encode(array_map('intval', $data['weekdays']));
            } else {
                $updateData['weekdays'] = $data['weekdays'];
            }
        }
        
        if (isset($data['pricing_by_traveler_type'])) {
            $updateData['pricing_by_traveler_type'] = is_array($data['pricing_by_traveler_type'])
                ? wp_json_encode($data['pricing_by_traveler_type'])
                : $data['pricing_by_traveler_type'];
        }
        
        $updateData['updated_at'] = current_time('mysql');
        
        if (empty($updateData)) {
            return false;
        }
        
        $formats = [];
        foreach ($updateData as $value) {
            if (is_int($value)) {
                $formats[] = '%d';
            } elseif (is_float($value)) {
                $formats[] = '%f';
            } elseif (is_bool($value)) {
                $formats[] = '%d';
            } else {
                $formats[] = '%s';
            }
        }
        
        return (bool) $this->wpdb->update(
            $table,
            $updateData,
            ['id' => $id],
            $formats,
            ['%d']
        );
    }

    /**
     * Delete a recurring rule
     */
    public function delete(int $id): bool
    {
        $table = esc_sql($this->table);
        return (bool) $this->wpdb->delete($table, ['id' => $id], ['%d']);
    }

    /**
     * Check if table supports soft delete
     */
    protected function hasSoftDelete(): bool
    {
        return false;
    }
}

