<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Models\Availability;
use Yatra\Database\Tables\TripAvailabilityDatesTable;

/**
 * Availability Repository
 * Handles database operations for trip availability dates
 */
class AvailabilityRepository extends BaseRepository
{
    /**
     * Normalize optional latitude/longitude for storage (null if empty/invalid).
     */
    private function sanitizeCoordinate(mixed $value): ?string
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
        return TripAvailabilityDatesTable::getTableName();
    }

    /**
     * Find by ID
     */
    public function find(int $id, bool $includeDeleted = false): ?\stdClass
    {
        $result = parent::find($id, $includeDeleted);
        return $result ? (object) Availability::fromArray((array) $result)->toArray() : null;
    }

    /**
     * Find by ID and return Availability model
     */
    public function findModel(int $id): ?Availability
    {
        $result = parent::find($id);
        return $result ? Availability::fromArray((array) $result) : null;
    }

    /**
     * Find availability by trip ID and departure date
     * 
     * @param int $tripId Trip ID
     * @param string $departureDate Departure date (YYYY-MM-DD)
     * @return object|null Availability object or null
     */
    public function findByTripIdAndDate(int $tripId, string $departureDate): ?object
    {
        $table = esc_sql($this->table);
        
        $result = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT * FROM `{$table}` 
             WHERE trip_id = %d 
             AND departure_date = %s
             AND status IN ('available', 'limited')
             LIMIT 1",
            $tripId,
            $departureDate
        ));
        
        return $result ?: null;
    }

    /**
     * Find availability by trip ID, departure date, and optionally departure time.
     * Supports day tours with multiple time slots on the same date.
     * 
     * @param int $tripId Trip ID
     * @param string $departureDate Departure date (YYYY-MM-DD)
     * @param string|null $departureTime Departure time (HH:MM:SS or HH:MM)
     * @return object|null Availability object or null
     */
    public function findByTripIdAndDateTime(int $tripId, string $departureDate, ?string $departureTime = null): ?object
    {
        $table = esc_sql($this->table);

        if (!empty($departureTime)) {
            $result = $this->wpdb->get_row($this->wpdb->prepare(
                "SELECT * FROM `{$table}` 
                 WHERE trip_id = %d 
                 AND departure_date = %s
                 AND departure_time = %s
                 AND status IN ('available', 'limited')
                 LIMIT 1",
                $tripId,
                $departureDate,
                $departureTime
            ));
        } else {
            $result = $this->wpdb->get_row($this->wpdb->prepare(
                "SELECT * FROM `{$table}` 
                 WHERE trip_id = %d 
                 AND departure_date = %s
                 AND status IN ('available', 'limited')
                 LIMIT 1",
                $tripId,
                $departureDate
            ));
        }

        return $result ?: null;
    }

    /**
     * Find availability records by trip ID and departure date
     * 
     * @param int $tripId Trip ID
     * @param string $departureDate Departure date (YYYY-MM-DD)
     * @return array Array of availability objects
     */
    public function findByTripAndDate(int $tripId, string $departureDate): array
    {
        $table = esc_sql($this->table);
        
        $results = $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT * FROM `{$table}` 
             WHERE trip_id = %d 
             AND departure_date = %s
             ORDER BY departure_time ASC",
            $tripId,
            $departureDate
        ));
        
        return $results ?: [];
    }

    /**
     * Find availability records by trip ID within a date range
     * 
     * @param int $tripId Trip ID
     * @param string $fromDate Start date (YYYY-MM-DD)
     * @param string $toDate End date (YYYY-MM-DD)
     * @return array Array of availability objects
     */
    public function findByTripIdAndDateRange(int $tripId, string $fromDate, string $toDate): array
    {
        $table = esc_sql($this->table);
        
        $results = $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT * FROM `{$table}` 
             WHERE trip_id = %d 
             AND departure_date >= %s
             AND departure_date <= %s
             ORDER BY departure_date ASC, departure_time ASC",
            $tripId,
            $fromDate,
            $toDate
        ));
        
        return $results ?: [];
    }

    public function existsForTripDateTime(int $tripId, string $departureDate, ?string $departureTime): bool
    {
        $table = esc_sql($this->table);

        if ($departureTime === null || $departureTime === '') {
            $count = (int) $this->wpdb->get_var($this->wpdb->prepare(
                "SELECT COUNT(*) FROM `{$table}` WHERE trip_id = %d AND departure_date = %s AND departure_time IS NULL",
                $tripId,
                $departureDate
            ));
        } else {
            $count = (int) $this->wpdb->get_var($this->wpdb->prepare(
                "SELECT COUNT(*) FROM `{$table}` WHERE trip_id = %d AND departure_date = %s AND departure_time = %s",
                $tripId,
                $departureDate,
                $departureTime
            ));
        }

        return $count > 0;
    }

    /**
     * Find all by trip ID
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
        
        // Month filter
        if (!empty($filters['month']) && $filters['month'] !== 'all') {
            $where[] = 'YEAR(departure_date) = %d AND MONTH(departure_date) = %d';
            [$year, $month] = explode('-', $filters['month']);
            $params[] = (int) $year;
            $params[] = (int) $month;
        }
        
        // Search filter
        if (!empty($filters['search'])) {
            $where[] = '(departure_date LIKE %s OR arrival_date LIKE %s OR from_location LIKE %s OR to_location LIKE %s)';
            $search = '%' . $this->wpdb->esc_like($filters['search']) . '%';
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
        }
        
        $query = "SELECT * FROM `{$table}` WHERE " . implode(' AND ', $where);
        $query .= " ORDER BY departure_date ASC, departure_time ASC";
        
        if (!empty($filters['per_page'])) {
            $perPage = (int) $filters['per_page'];
            $page = max(1, (int) ($filters['page'] ?? 1));
            $offset = ($page - 1) * $perPage;
            $query .= " LIMIT %d OFFSET %d";
            $params[] = $perPage;
            $params[] = $offset;
        }
        
        $results = $this->wpdb->get_results(
            $this->wpdb->prepare($query, $params),
            ARRAY_A
        );
        
        return array_map(function ($row) {
            return Availability::fromArray($row);
        }, $results ?: []);
    }

    /**
     * Count by trip ID
     */
    public function countByTripId(int $tripId, array $filters = []): int
    {
        $table = esc_sql($this->table);
        $where = ['trip_id = %d'];
        $params = [$tripId];
        
        // Status filter
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $where[] = 'status = %s';
            $params[] = $filters['status'];
        }
        
        // Month filter
        if (!empty($filters['month']) && $filters['month'] !== 'all') {
            $where[] = 'YEAR(departure_date) = %d AND MONTH(departure_date) = %d';
            [$year, $month] = explode('-', $filters['month']);
            $params[] = (int) $year;
            $params[] = (int) $month;
        }
        
        // Search filter
        if (!empty($filters['search'])) {
            $where[] = '(departure_date LIKE %s OR arrival_date LIKE %s OR from_location LIKE %s OR to_location LIKE %s)';
            $search = '%' . $this->wpdb->esc_like($filters['search']) . '%';
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
        }
        
        $query = "SELECT COUNT(*) FROM `{$table}` WHERE " . implode(' AND ', $where);
        
        return (int) $this->wpdb->get_var($this->wpdb->prepare($query, $params));
    }

    /**
     * Create availability date
     */
    public function create(array $data): int
    {
        $table = esc_sql($this->table);
        
        $insertData = [
            'trip_id' => (int) ($data['trip_id'] ?? 0),
            'departure_date' => sanitize_text_field($data['departure_date'] ?? ''),
            'arrival_date' => !empty($data['arrival_date']) ? sanitize_text_field($data['arrival_date']) : null,
            'return_date' => !empty($data['return_date']) ? sanitize_text_field($data['return_date']) : null,
            'departure_time' => !empty($data['departure_time']) ? sanitize_text_field($data['departure_time']) : null,
            'arrival_time' => !empty($data['arrival_time']) ? sanitize_text_field($data['arrival_time']) : null,
            'seats_total' => (int) ($data['seats_total'] ?? 0),
            'seats_available' => (int) ($data['seats_available'] ?? ($data['seats_total'] ?? 0)),
            'seats_reserved' => (int) ($data['seats_reserved'] ?? 0),
            'seats_waitlist' => (int) ($data['seats_waitlist'] ?? 0),
            'pricing_type' => sanitize_text_field($data['pricing_type'] ?? 'regular'),
            'original_price' => !empty($data['original_price']) ? (float) $data['original_price'] : null,
            'discounted_price' => !empty($data['discounted_price']) ? (float) $data['discounted_price'] : null,
            'discount_percentage' => !empty($data['discount_percentage']) ? (float) $data['discount_percentage'] : null,
            'price_types' => !empty($data['price_types']) ? (is_array($data['price_types']) ? wp_json_encode($data['price_types']) : $data['price_types']) : null,
            'status' => sanitize_text_field($data['status'] ?? 'available'),
            'from_location' => !empty($data['from_location']) ? sanitize_text_field($data['from_location']) : null,
            'to_location' => !empty($data['to_location']) ? sanitize_text_field($data['to_location']) : null,
            'from_latitude' => $this->sanitizeCoordinate($data['from_latitude'] ?? null),
            'from_longitude' => $this->sanitizeCoordinate($data['from_longitude'] ?? null),
            'to_latitude' => $this->sanitizeCoordinate($data['to_latitude'] ?? null),
            'to_longitude' => $this->sanitizeCoordinate($data['to_longitude'] ?? null),
            'special_notes' => !empty($data['special_notes']) ? sanitize_textarea_field($data['special_notes']) : null,
            'cutoff_date' => !empty($data['cutoff_date']) ? sanitize_text_field($data['cutoff_date']) : null,
            'cutoff_hours' => (int) ($data['cutoff_hours'] ?? 24),
        ];
        
        // Calculate discount percentage if not provided
        if (!empty($insertData['original_price']) && !empty($insertData['discounted_price']) && empty($data['discount_percentage'])) {
            $insertData['discount_percentage'] = round((($insertData['original_price'] - $insertData['discounted_price']) / $insertData['original_price']) * 100, 2);
        }
        
        $this->wpdb->insert($table, $insertData, [
            '%d', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%d', '%d',
            '%s', '%f', '%f', '%f', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d',
        ]);
        
        return $this->wpdb->insert_id;
    }

    /**
     * Update availability date
     */
    public function update(int $id, array $data): bool
    {
        $table = esc_sql($this->table);
        
        $updateData = [];
        
        if (isset($data['trip_id'])) $updateData['trip_id'] = (int) $data['trip_id'];
        if (isset($data['departure_date'])) $updateData['departure_date'] = sanitize_text_field($data['departure_date']);
        if (isset($data['arrival_date'])) $updateData['arrival_date'] = !empty($data['arrival_date']) ? sanitize_text_field($data['arrival_date']) : null;
        if (isset($data['return_date'])) $updateData['return_date'] = !empty($data['return_date']) ? sanitize_text_field($data['return_date']) : null;
        if (isset($data['departure_time'])) $updateData['departure_time'] = !empty($data['departure_time']) ? sanitize_text_field($data['departure_time']) : null;
        if (isset($data['arrival_time'])) $updateData['arrival_time'] = !empty($data['arrival_time']) ? sanitize_text_field($data['arrival_time']) : null;
        if (isset($data['seats_total'])) $updateData['seats_total'] = (int) $data['seats_total'];
        if (isset($data['seats_available'])) $updateData['seats_available'] = (int) $data['seats_available'];
        if (isset($data['seats_reserved'])) $updateData['seats_reserved'] = (int) $data['seats_reserved'];
        if (isset($data['seats_waitlist'])) $updateData['seats_waitlist'] = (int) $data['seats_waitlist'];
        if (isset($data['pricing_type'])) $updateData['pricing_type'] = sanitize_text_field($data['pricing_type']);
        if (isset($data['original_price'])) $updateData['original_price'] = !empty($data['original_price']) ? (float) $data['original_price'] : null;
        if (isset($data['discounted_price'])) $updateData['discounted_price'] = !empty($data['discounted_price']) ? (float) $data['discounted_price'] : null;
        if (isset($data['discount_percentage'])) $updateData['discount_percentage'] = !empty($data['discount_percentage']) ? (float) $data['discount_percentage'] : null;
        if (isset($data['price_types'])) $updateData['price_types'] = !empty($data['price_types']) ? (is_array($data['price_types']) ? wp_json_encode($data['price_types']) : $data['price_types']) : null;
        if (isset($data['status'])) $updateData['status'] = sanitize_text_field($data['status']);
        if (isset($data['from_location'])) $updateData['from_location'] = !empty($data['from_location']) ? sanitize_text_field($data['from_location']) : null;
        if (isset($data['to_location'])) $updateData['to_location'] = !empty($data['to_location']) ? sanitize_text_field($data['to_location']) : null;
        if (array_key_exists('from_latitude', $data)) {
            $updateData['from_latitude'] = $this->sanitizeCoordinate($data['from_latitude']);
        }
        if (array_key_exists('from_longitude', $data)) {
            $updateData['from_longitude'] = $this->sanitizeCoordinate($data['from_longitude']);
        }
        if (array_key_exists('to_latitude', $data)) {
            $updateData['to_latitude'] = $this->sanitizeCoordinate($data['to_latitude']);
        }
        if (array_key_exists('to_longitude', $data)) {
            $updateData['to_longitude'] = $this->sanitizeCoordinate($data['to_longitude']);
        }
        if (isset($data['special_notes'])) $updateData['special_notes'] = !empty($data['special_notes']) ? sanitize_textarea_field($data['special_notes']) : null;
        if (isset($data['cutoff_date'])) $updateData['cutoff_date'] = !empty($data['cutoff_date']) ? sanitize_text_field($data['cutoff_date']) : null;
        if (isset($data['cutoff_hours'])) $updateData['cutoff_hours'] = (int) $data['cutoff_hours'];
        
        // Calculate discount percentage if not provided
        if (!empty($updateData['original_price']) && !empty($updateData['discounted_price']) && empty($updateData['discount_percentage'])) {
            $updateData['discount_percentage'] = round((($updateData['original_price'] - $updateData['discounted_price']) / $updateData['original_price']) * 100, 2);
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
     * Delete availability date
     */
    public function delete(int $id): bool
    {
        $table = esc_sql($this->table);
        return (bool) $this->wpdb->delete($table, ['id' => $id], ['%d']);
    }

    /**
     * Atomically adjust seats_waitlist (negative delta when promoting from waitlist).
     */
    public function incrementSeatsWaitlist(int $id, int $delta): void
    {
        if ($id <= 0 || $delta === 0) {
            return;
        }

        $table = esc_sql($this->table);
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $this->wpdb->query($this->wpdb->prepare(
            "UPDATE `{$table}` SET seats_waitlist = GREATEST(0, COALESCE(seats_waitlist, 0) + %d) WHERE id = %d",
            $delta,
            $id
        ));
    }

    /**
     * Check if table supports soft delete
     */
    protected function hasSoftDelete(): bool
    {
        return false; // Availability table doesn't have soft delete
    }

    /**
     * Update pricing type for all availability dates of a trip
     * 
     * @param int $tripId Trip ID
     * @param string $pricingType Pricing type
     * @return int Number of rows updated
     */
    public function updatePricingTypeByTripId(int $tripId, string $pricingType): int
    {
        $table = esc_sql($this->table);
        return (int) $this->wpdb->update(
            $table,
            ['pricing_type' => $pricingType],
            ['trip_id' => $tripId],
            ['%s'],
            ['%d']
        );
    }

    /**
     * Clear price types for all availability dates of a trip
     * 
     * @param int $tripId Trip ID
     * @return int Number of rows updated
     */
    public function clearPriceTypesByTripId(int $tripId): int
    {
        $table = esc_sql($this->table);
        return (int) $this->wpdb->query(
            $this->wpdb->prepare(
                "UPDATE {$table} 
                 SET price_types = NULL 
                 WHERE trip_id = %d",
                $tripId
            )
        );
    }

    /**
     * Clear traveler pricing from availability dates for a trip
     * 
     * @param int $tripId Trip ID
     * @return int Number of rows updated
     */
    public function clearTravelerPricingByTripId(int $tripId): int
    {
        $table = esc_sql($this->table);
        return (int) $this->wpdb->query(
            $this->wpdb->prepare(
                "UPDATE {$table} 
                 SET price_types = NULL 
                 WHERE trip_id = %d",
                $tripId
            )
        );
    }

    /**
     * Get specific dates for a trip within a date range
     * 
     * @param int $tripId Trip ID
     * @param string $startDate Start date (Y-m-d)
     * @param string $endDate End date (Y-m-d)
     * @return array Array of specific date records
     */
    public function getDatesForTrip(int $tripId, string $startDate, string $endDate): array
    {
        $table = esc_sql($this->table);
        
        $sql = "SELECT * FROM `{$table}` 
                WHERE `trip_id` = %d 
                AND `date` BETWEEN %s AND %s
                ORDER BY `date` ASC";
        
        $query = $this->wpdb->prepare($sql, $tripId, $startDate, $endDate);
        return $this->wpdb->get_results($query) ?: [];
    }

    /**
     * Get specific date for a trip on a particular date
     * 
     * @param int $tripId Trip ID
     * @param string $date Date (Y-m-d)
     * @return object|null Specific date record or null
     */
    public function getDateForTrip(int $tripId, string $date): ?object
    {
        $table = esc_sql($this->table);
        
        $sql = "SELECT * FROM `{$table}` 
                WHERE `trip_id` = %d 
                AND `date` = %s
                LIMIT 1";
        
        $query = $this->wpdb->prepare($sql, $tripId, $date);
        $result = $this->wpdb->get_row($query);
        
        return $result ?: null;
    }

    /**
     * Get available dates for a trip within a date range
     * 
     * @param int $tripId Trip ID
     * @param string $startDate Start date (Y-m-d)
     * @param string $endDate End date (Y-m-d)
     * @return array Array of available dates
     */
    public function getAvailableDates(int $tripId, string $startDate, string $endDate): array
    {
        $table = esc_sql($this->table);
        
        $sql = "SELECT * FROM `{$table}` 
                WHERE `trip_id` = %d 
                AND `date` BETWEEN %s AND %s
                AND `status` = 'available'
                AND (`max_bookings` IS NULL OR `current_bookings` < `max_bookings`)
                ORDER BY `date` ASC";
        
        $query = $this->wpdb->prepare($sql, $tripId, $startDate, $endDate);
        return $this->wpdb->get_results($query) ?: [];
    }

    /**
     * Update current bookings count for a specific date
     * 
     * @param int $id Specific date record ID
     * @param int $bookingCount New booking count
     * @return bool Success status
     */
    public function updateBookingCount(int $id, int $bookingCount): bool
    {
        $table = esc_sql($this->table);
        
        $sql = "UPDATE `{$table}` 
                SET `current_bookings` = %d, `updated_at` = NOW()
                WHERE `id` = %d";
        
        $query = $this->wpdb->prepare($sql, $bookingCount, $id);
        return (bool) $this->wpdb->query($query);
    }

    /**
     * Increment booking count for a specific date
     * 
     * @param int $id Specific date record ID
     * @param int $increment Number to increment by (default: 1)
     * @return bool Success status
     */
    public function incrementBookingCount(int $id, int $increment = 1): bool
    {
        $table = esc_sql($this->table);
        
        $sql = "UPDATE `{$table}` 
                SET `current_bookings` = `current_bookings` + %d, `updated_at` = NOW()
                WHERE `id` = %d";
        
        $query = $this->wpdb->prepare($sql, $increment, $id);
        return (bool) $this->wpdb->query($query);
    }

    /**
     * Decrement booking count for a specific date
     * 
     * @param int $id Specific date record ID
     * @param int $decrement Number to decrement by (default: 1)
     * @return bool Success status
     */
    public function decrementBookingCount(int $id, int $decrement = 1): bool
    {
        $table = esc_sql($this->table);
        
        $sql = "UPDATE `{$table}` 
                SET `current_bookings` = GREATEST(0, `current_bookings` - %d), `updated_at` = NOW()
                WHERE `id` = %d";
        
        $query = $this->wpdb->prepare($sql, $decrement, $id);
        return (bool) $this->wpdb->query($query);
    }
}

