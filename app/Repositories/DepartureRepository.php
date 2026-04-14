<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Models\Departure;
use Yatra\Database\Tables\DeparturesTable;

/**
 * Departure Repository
 * Handles database operations for trip departures
 * 
 * Table: wp_yatra_trip_departures
 * 
 * Fields:
 * - id (primary key)
 * - trip_id
 * - date (YYYY-MM-DD)
 * - time (HH:MM:SS, nullable)
 * - max_capacity
 * - booked_count
 * - status (upcoming|full|past|cancelled)
 * - source (manual|recurring_generated)
 * - price_override (nullable)
 * - price_by_traveler_type (JSON)
 * - notes (nullable)
 * - created_at
 * - updated_at
 */
class DepartureRepository extends BaseRepository
{
    /**
     * Get table name
     */
    protected function getTableName(): string
    {
        return DeparturesTable::getTableName();
    }

    /**
     * Find by ID
     */
    public function find(int $id, bool $includeDeleted = false): ?\stdClass
    {
        $result = parent::find($id, $includeDeleted);
        return $result ? (object) Departure::fromArray((array) $result)->toArray() : null;
    }

    /**
     * Find by ID and return Departure model
     */
    public function findModel(int $id): ?Departure
    {
        $result = parent::find($id);
        return $result ? Departure::fromArray((array) $result) : null;
    }

    /**
     * Find a departure by trip, start date (or date), and optional time
     */
    public function findByTripIdAndStartDate(int $tripId, string $date, ?string $time = null): ?Departure
    {
        $table = esc_sql($this->table);
        $where = ['trip_id = %d'];
        $params = [$tripId];

        // prefer start_date if exists, else fall back to date column
        $columns = $this->wpdb->get_col("DESCRIBE {$table}");
        $hasStartDate = in_array('start_date', $columns, true);

        if ($hasStartDate) {
            $where[] = '((start_date IS NOT NULL AND start_date = %s) OR (start_date IS NULL AND date = %s))';
            $params[] = $date;
            $params[] = $date;
        } else {
            $where[] = 'date = %s';
            $params[] = $date;
        }

        if ($time !== null && $time !== '') {
            $where[] = 'time = %s';
            $params[] = $time;
        }

        $query = "SELECT * FROM {$table} WHERE " . implode(' AND ', $where) . " LIMIT 1";
        $row = $this->wpdb->get_row($this->wpdb->prepare($query, ...$params), ARRAY_A);

        return $row ? Departure::fromArray($row) : null;
    }

    /**
     * Find all departures across all trips
     * 
     * @param array $filters Filters: status, date_from, date_to, source
     * @return array Array of Departure models
     */
    public function findAll(array $filters = []): array
    {

        $table = esc_sql($this->table);
        $where = ['1=1']; // Always true for base condition
        $params = [];
        
        // Status filter
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $where[] = 'status = %s';
            $params[] = $filters['status'];
        }
        
        // Date range filter - simple approach
        if (isset($filters['date_from']) && is_string($filters['date_from']) && trim($filters['date_from']) !== '') {
            $dateFrom = trim($filters['date_from']);
            // Validate date format AND that it's a real date
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom) && strtotime($dateFrom) !== false) {
                $where[] = 'date >= %s';
                $params[] = $dateFrom;
            }
        }
        
        if (isset($filters['date_to']) && is_string($filters['date_to']) && trim($filters['date_to']) !== '') {
            $dateTo = trim($filters['date_to']);
            // Validate date format AND that it's a real date
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo) && strtotime($dateTo) !== false) {
                $where[] = 'date <= %s';
                $params[] = $dateTo;
            }
        }
        
        // Source filter
        if (!empty($filters['source']) && $filters['source'] !== 'all') {
            $where[] = 'source = %s';
            $params[] = $filters['source'];
        }
        
        // Past/upcoming filter
        if (isset($filters['include_past'])) {
            if (!$filters['include_past']) {
                $where[] = 'date >= CURDATE()';
            }
        }
        
        $query = "SELECT * FROM `{$table}` WHERE " . implode(' AND ', $where);
        $query .= " ORDER BY date ASC, time ASC";
        
        if (!empty($filters['per_page'])) {
            $perPage = (int) $filters['per_page'];
            $page = max(1, (int) ($filters['page'] ?? 1));
            $offset = ($page - 1) * $perPage;
            $query .= " LIMIT %d OFFSET %d";
            $params[] = $perPage;
            $params[] = $offset;
        }
        
        // Debug output
        $prepared_query = $this->wpdb->prepare($query, ...$params);
        $results = $this->wpdb->get_results($prepared_query, ARRAY_A);
        
        if ($this->wpdb->last_error) {
            }
        
        return array_map(function ($row) {
            return Departure::fromArray($row);
        }, $results ?: []);
    }

    /**
     * Find departures by trip ID
     * 
     * @param int $tripId Trip ID
     * @param array $filters Filters: status, date_from, date_to, source
     * @return array Array of Departure models
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
        
        // Date range filter - check both start_date and date columns
        $columns = $this->wpdb->get_col("DESCRIBE {$table}");
        $hasStartDate = in_array('start_date', $columns, true);
        
        if (!empty($filters['date_from']) && trim($filters['date_from']) !== '') {
            if ($hasStartDate) {
                $where[] = '(start_date >= %s OR ((start_date IS NULL OR start_date = "") AND date >= %s))';
                $params[] = $filters['date_from'];
                $params[] = $filters['date_from'];
            } else {
                $where[] = 'date >= %s';
                $params[] = $filters['date_from'];
            }
        }
        
        if (!empty($filters['date_to']) && trim($filters['date_to']) !== '') {
            if ($hasStartDate) {
                $where[] = '(start_date <= %s OR ((start_date IS NULL OR start_date = "") AND date <= %s))';
                $params[] = $filters['date_to'];
                $params[] = $filters['date_to'];
            } else {
                $where[] = 'date <= %s';
                $params[] = $filters['date_to'];
            }
        }
        
        // Source filter
        if (!empty($filters['source']) && $filters['source'] !== 'all') {
            $where[] = 'source = %s';
            $params[] = $filters['source'];
        }
        
        // Past/upcoming filter
        if (isset($filters['include_past'])) {
            if (!$filters['include_past']) {
                $where[] = 'date >= CURDATE()';
            }
        }
        
        $query = "SELECT * FROM `{$table}` WHERE " . implode(' AND ', $where);
        $query .= " ORDER BY date ASC, time ASC";
        
        if (!empty($filters['per_page'])) {
            $perPage = (int) $filters['per_page'];
            $page = max(1, (int) ($filters['page'] ?? 1));
            $offset = ($page - 1) * $perPage;
            $query .= " LIMIT %d OFFSET %d";
            $params[] = $perPage;
            $params[] = $offset;
        }
        
        $results = $this->wpdb->get_results(
            $this->wpdb->prepare($query, ...$params),
            ARRAY_A
        );
        
        return array_map(function ($row) {
            return Departure::fromArray($row);
        }, $results ?: []);
    }

    /**
     * Find past departures by trip ID
     */
    public function findPastByTripId(int $tripId, array $filters = []): array
    {
        $filters['status'] = 'past';
        $filters['include_past'] = true;
        return $this->findByTripId($tripId, $filters);
    }

    /**
     * Find upcoming departures by trip ID
     */
    public function findUpcomingByTripId(int $tripId, array $filters = []): array
    {
        $filters['include_past'] = false;
        return $this->findByTripId($tripId, $filters);
    }

    /**
     * Find departure by trip ID and date (backward compatibility - uses start_date)
     */
    public function findByTripIdAndDate(int $tripId, string $date, ?string $time = null): ?Departure
    {
        return $this->findByTripIdAndStartDate($tripId, $date, $time);
    }

    /**
     * Count departures by trip ID
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
        
        if (!empty($filters['date_from'])) {
            $where[] = 'date >= %s';
            $params[] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $where[] = 'date <= %s';
            $params[] = $filters['date_to'];
        }
        
        if (!empty($filters['source']) && $filters['source'] !== 'all') {
            $where[] = 'source = %s';
            $params[] = $filters['source'];
        }
        
        if (isset($filters['include_past']) && !$filters['include_past']) {
            $where[] = 'date >= CURDATE()';
        }
        
        $query = "SELECT COUNT(*) FROM `{$table}` WHERE " . implode(' AND ', $where);
        
        return (int) $this->wpdb->get_var($this->wpdb->prepare($query, ...$params));
    }

    /**
     * Create a departure
     */
    public function create(array $data): int
    {
        $table = esc_sql($this->table);
        
        // Check which columns exist in the table
        $columns = $this->wpdb->get_col("DESCRIBE {$table}");
        $hasStartDate = in_array('start_date', $columns, true);
        $hasEndDate = in_array('end_date', $columns, true);
        
        // Handle start_date and end_date - support both old 'date' and new format
        $startDate = !empty($data['start_date']) ? $data['start_date'] : ($data['date'] ?? '');
        $endDate = $data['end_date'] ?? '';
        
        $insertData = [
            'trip_id' => (int) ($data['trip_id'] ?? 0),
            'date' => sanitize_text_field($startDate), // Always include for backward compatibility
            'time' => !empty($data['time']) ? sanitize_text_field($data['time']) : null,
            'max_capacity' => (int) ($data['max_capacity'] ?? 0),
            'booked_count' => (int) ($data['booked_count'] ?? 0),
            'status' => sanitize_text_field($data['status'] ?? 'upcoming'),
            'source' => sanitize_text_field($data['source'] ?? 'booking_created'),
            'price_override' => !empty($data['price_override']) ? (float) $data['price_override'] : null,
            'notes' => !empty($data['notes']) ? sanitize_textarea_field($data['notes']) : null,
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
        ];
        
        // Only add start_date and end_date if columns exist
        if ($hasStartDate) {
            $insertData['start_date'] = sanitize_text_field($startDate);
        }
        if ($hasEndDate && !empty($endDate)) {
            $insertData['end_date'] = sanitize_text_field($endDate);
        }
        
        // Only add total_revenue if column exists
        $hasTotalRevenue = in_array('total_revenue', $columns, true);
        if ($hasTotalRevenue) {
            $insertData['total_revenue'] = !empty($data['total_revenue']) ? (float) $data['total_revenue'] : 0.00;
        }
        
        // Handle price_by_traveler_type as JSON
        if (!empty($data['price_by_traveler_type'])) {
            $insertData['price_by_traveler_type'] = is_array($data['price_by_traveler_type'])
                ? wp_json_encode($data['price_by_traveler_type'])
                : $data['price_by_traveler_type'];
        } else {
            $insertData['price_by_traveler_type'] = null;
        }
        
        // Calculate status if not provided
        if (empty($data['status'])) {
            $departure = Departure::fromArray($insertData);
            $insertData['status'] = $departure->calculateStatus();
        }
        
        // Build format array dynamically based on what we're inserting
        $formats = [];
        foreach ($insertData as $key => $value) {
            if (in_array($key, ['trip_id', 'max_capacity', 'booked_count'], true)) {
                $formats[] = '%d';
            } elseif (in_array($key, ['price_override'], true)) {
                $formats[] = '%f';
            } else {
                $formats[] = '%s';
            }
        }
        
        $this->wpdb->insert($table, $insertData, $formats);
        
        return $this->wpdb->insert_id;
    }

    /**
     * Update a departure
     */
    public function update(int $id, array $data): bool
    {
        $table = esc_sql($this->table);
        
        // Check which columns exist
        $columns = $this->wpdb->get_col("DESCRIBE {$table}");
        $hasStartDate = in_array('start_date', $columns, true);
        $hasEndDate = in_array('end_date', $columns, true);
        
        $updateData = [];
        
        if (isset($data['trip_id'])) $updateData['trip_id'] = (int) $data['trip_id'];
        
        // Handle date fields - support both old 'date' and new 'start_date'/'end_date'
        if (isset($data['start_date'])) {
            if ($hasStartDate) {
                $updateData['start_date'] = sanitize_text_field($data['start_date']);
            }
            $updateData['date'] = sanitize_text_field($data['start_date']); // Always update date for backward compatibility
        } elseif (isset($data['date'])) {
            $updateData['date'] = sanitize_text_field($data['date']);
            if ($hasStartDate) {
                $updateData['start_date'] = $updateData['date']; // Sync start_date
            }
        }
        
        if (isset($data['end_date']) && $hasEndDate) {
            $updateData['end_date'] = sanitize_text_field($data['end_date']);
        }
        if (isset($data['time'])) $updateData['time'] = !empty($data['time']) ? sanitize_text_field($data['time']) : null;
        if (isset($data['max_capacity'])) $updateData['max_capacity'] = (int) $data['max_capacity'];
        if (isset($data['booked_count'])) $updateData['booked_count'] = (int) $data['booked_count'];
        if (isset($data['status'])) $updateData['status'] = sanitize_text_field($data['status']);
        if (isset($data['source'])) $updateData['source'] = sanitize_text_field($data['source']);
        if (isset($data['price_override'])) $updateData['price_override'] = !empty($data['price_override']) ? (float) $data['price_override'] : null;
        
        // Only update total_revenue if column exists
        $hasTotalRevenue = in_array('total_revenue', $columns, true);
        if (isset($data['total_revenue']) && $hasTotalRevenue) {
            $updateData['total_revenue'] = !empty($data['total_revenue']) ? (float) $data['total_revenue'] : 0.00;
        }
        
        if (isset($data['notes'])) $updateData['notes'] = !empty($data['notes']) ? sanitize_textarea_field($data['notes']) : null;
        
        if (isset($data['price_by_traveler_type'])) {
            $updateData['price_by_traveler_type'] = is_array($data['price_by_traveler_type'])
                ? wp_json_encode($data['price_by_traveler_type'])
                : $data['price_by_traveler_type'];
        }
        
        $updateData['updated_at'] = current_time('mysql');
        
        // Recalculate status if date or capacity changed
        if (isset($updateData['start_date']) || isset($updateData['end_date']) || isset($updateData['date']) || 
            isset($updateData['max_capacity']) || isset($updateData['booked_count'])) {
            // Get current departure to merge with updates
            $current = $this->findModel($id);
            if ($current) {
                $merged = array_merge($current->toArray(), $updateData);
                $departure = Departure::fromArray($merged);
                $updateData['status'] = $departure->calculateStatus();
            }
        }
        
        if (empty($updateData)) {
            return false;
        }
        
        $formats = [];
        foreach ($updateData as $value) {
            if (is_int($value)) {
                $formats[] = '%d';
            } elseif (is_float($value)) {
                $formats[] = '%f';
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
     * Increment booked count
     */
    public function incrementBookedCount(int $id, int $amount = 1): bool
    {
        $table = esc_sql($this->table);
        
        $this->wpdb->query($this->wpdb->prepare(
            "UPDATE `{$table}` 
             SET booked_count = booked_count + %d, 
                 updated_at = %s
             WHERE id = %d",
            $amount,
            current_time('mysql'),
            $id
        ));
        
        // Recalculate status
        $departure = $this->findModel($id);
        if ($departure) {
            $this->update($id, ['status' => $departure->calculateStatus()]);
        }
        
        return true;
    }

    /**
     * Decrement booked count
     */
    public function decrementBookedCount(int $id, int $amount = 1): bool
    {
        $table = esc_sql($this->table);
        
        $this->wpdb->query($this->wpdb->prepare(
            "UPDATE `{$table}` 
             SET booked_count = GREATEST(0, booked_count - %d), 
                 updated_at = %s
             WHERE id = %d",
            $amount,
            current_time('mysql'),
            $id
        ));
        
        // Recalculate status
        $departure = $this->findModel($id);
        if ($departure) {
            $this->update($id, ['status' => $departure->calculateStatus()]);
        }
        
        return true;
    }

    /**
     * Delete a departure
     * Only allowed if source is recurring_generated and booked_count is 0
     */
    public function delete(int $id): bool
    {
        $departure = $this->findModel($id);
        
        if (!$departure) {
            return false;
        }
        
        // Only allow deletion of recurring_generated departures with no bookings
        if ($departure->source === 'recurring_generated' && $departure->booked_count === 0) {
            $table = esc_sql($this->table);
            return (bool) $this->wpdb->delete($table, ['id' => $id], ['%d']);
        }
        
        // Manual departures or departures with bookings cannot be deleted
        return false;
    }

    /**
     * Recalculate status for all departures (for cron job)
     */
    public function recalculateAllStatuses(): int
    {
        $table = esc_sql($this->table);
        $today = date('Y-m-d');
        
        // Update past departures - use end_date if available, otherwise start_date or date
        $this->wpdb->query($this->wpdb->prepare(
            "UPDATE `{$table}` 
             SET status = 'past', updated_at = %s
             WHERE (
                 (end_date IS NOT NULL AND end_date != '' AND end_date < %s) OR
                 (end_date IS NULL OR end_date = '') AND (
                     (start_date IS NOT NULL AND start_date != '' AND start_date < %s) OR
                     (start_date IS NULL OR start_date = '') AND date < %s
                 )
             )
             AND status != 'cancelled'",
            current_time('mysql'),
            $today,
            $today,
            $today
        ));
        
        // Update full departures - check future dates only
        $this->wpdb->query(
            "UPDATE `{$table}` 
             SET status = 'full', updated_at = NOW()
             WHERE booked_count >= max_capacity 
             AND max_capacity > 0 
             AND (
                 (end_date IS NOT NULL AND end_date != '' AND end_date >= CURDATE()) OR
                 (end_date IS NULL OR end_date = '') AND (
                     (start_date IS NOT NULL AND start_date != '' AND start_date >= CURDATE()) OR
                     (start_date IS NULL OR start_date = '') AND date >= CURDATE()
                 )
             )
             AND status NOT IN ('cancelled', 'past')"
        );
        
        // Update upcoming departures - check future dates only
        $this->wpdb->query(
            "UPDATE `{$table}` 
             SET status = 'upcoming', updated_at = NOW()
             WHERE (
                 (end_date IS NOT NULL AND end_date != '' AND end_date >= CURDATE()) OR
                 (end_date IS NULL OR end_date = '') AND (
                     (start_date IS NOT NULL AND start_date != '' AND start_date >= CURDATE()) OR
                     (start_date IS NULL OR start_date = '') AND date >= CURDATE()
                 )
             )
             AND booked_count < max_capacity
             AND status NOT IN ('cancelled', 'past', 'full')"
        );
        
        return $this->wpdb->rows_affected;
    }

    /**
     * Check if table supports soft delete
     */
    protected function hasSoftDelete(): bool
    {
        return false;
    }
}

