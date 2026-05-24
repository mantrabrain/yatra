<?php

namespace Yatra\Repositories;

use Yatra\Database\Tables\YatraAvailabilityTable;

/**
 * Yatra Availability Repository
 * 
 * Handles database operations for traditional Yatra trip availability dates.
 * Provides methods for managing departure dates, pricing, capacity, and bookings.
 * 
 * @package Yatra\Repositories
 * @since 2.0.0
 */
class YatraAvailabilityRepository extends BaseRepository
{
    /**
     * Table name
     */
    protected string $table;

    /**
     * Constructor
     */
    public function __construct()
    {
        global $wpdb;
        $this->table = YatraAvailabilityTable::getTableName();
        parent::__construct();
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
        $tripId = (int) $tripId;
        $departureDate = esc_sql($departureDate);

        $query = $this->wpdb->prepare(
            "SELECT * FROM `{$table}` 
             WHERE trip_id = %d AND departure_date = %s 
             LIMIT 1",
            $tripId,
            $departureDate
        );

        return $this->wpdb->get_row($query) ?: null;
    }

    /**
     * Get availability dates for a trip within a date range
     * 
     * @param int $tripId Trip ID
     * @param string $startDate Start date (YYYY-MM-DD)
     * @param string $endDate End date (YYYY-MM-DD)
     * @param array $args Additional arguments
     * @return array Array of availability objects
     */
    public function getDatesForTrip(int $tripId, string $startDate, string $endDate, array $args = []): array
    {
        $table = esc_sql($this->table);
        $tripId = (int) $tripId;
        $startDate = esc_sql($startDate);
        $endDate = esc_sql($endDate);

        $where = ["trip_id = {$tripId}", "departure_date BETWEEN '{$startDate}' AND '{$endDate}'"];
        
        if (!empty($args['status'])) {
            $where[] = "status = '" . esc_sql($args['status']) . "'";
        }
        
        if (!empty($args['available_only'])) {
            $where[] = "seats_available > 0";
            $where[] = "status = 'available'";
        }
        
        if (!empty($args['not_blocked'])) {
            $where[] = "is_blocked = 0";
        }

        $whereClause = implode(' AND ', $where);
        
        $order = !empty($args['order']) ? esc_sql($args['order']) : 'departure_date ASC';
        $limit = !empty($args['limit']) ? (int) $args['limit'] : '';

        $sql = "SELECT * FROM `{$table}` 
                WHERE {$whereClause} 
                ORDER BY {$order}";

        if ($limit) {
            $sql .= " LIMIT {$limit}";
        }

        return $this->wpdb->get_results($sql) ?: [];
    }

    /**
     * Get available dates for a trip (with seats available)
     * 
     * @param int $tripId Trip ID
     * @param string $startDate Start date (YYYY-MM-DD)
     * @param string $endDate End date (YYYY-MM-DD)
     * @param int $minSeats Minimum seats required (default: 1)
     * @return array Array of available dates
     */
    public function getAvailableDates(int $tripId, string $startDate, string $endDate, int $minSeats = 1): array
    {
        $table = esc_sql($this->table);
        $tripId = (int) $tripId;
        $startDate = esc_sql($startDate);
        $endDate = esc_sql($endDate);
        $minSeats = (int) $minSeats;

        $sql = "SELECT * FROM `{$table}` 
                WHERE trip_id = {$tripId} 
                AND departure_date BETWEEN '{$startDate}' AND '{$endDate}'
                AND seats_available >= {$minSeats}
                AND status = 'available'
                AND is_blocked = 0
                AND (cutoff_date IS NULL OR cutoff_date >= CURDATE())
                ORDER BY departure_date ASC";

        return $this->wpdb->get_results($sql) ?: [];
    }

    /**
     * Check if a specific date is available for booking
     * 
     * @param int $tripId Trip ID
     * @param string $departureDate Departure date (YYYY-MM-DD)
     * @param int $requiredSeats Seats required (default: 1)
     * @return bool True if available, false otherwise
     */
    public function isDateAvailable(int $tripId, string $departureDate, int $requiredSeats = 1): bool
    {
        $table = esc_sql($this->table);
        $tripId = (int) $tripId;
        $departureDate = esc_sql($departureDate);
        $requiredSeats = (int) $requiredSeats;

        $sql = "SELECT COUNT(*) as count 
                FROM `{$table}` 
                WHERE trip_id = {$tripId} 
                AND departure_date = '{$departureDate}'
                AND seats_available >= {$requiredSeats}
                AND status = 'available'
                AND is_blocked = 0
                AND (cutoff_date IS NULL OR cutoff_date >= CURDATE())";

        $result = $this->wpdb->get_var($sql);
        return (int) $result > 0;
    }

    /**
     * Update seat counts for a departure date
     * 
     * @param int $tripId Trip ID
     * @param string $departureDate Departure date (YYYY-MM-DD)
     * @param int $totalSeats Total seats
     * @param int $reservedSeats Reserved seats
     * @return bool Success status
     */
    public function updateSeatCounts(int $tripId, string $departureDate, int $totalSeats, int $reservedSeats): bool
    {
        $table = esc_sql($this->table);
        $tripId = (int) $tripId;
        $departureDate = esc_sql($departureDate);
        $totalSeats = (int) $totalSeats;
        $reservedSeats = (int) $reservedSeats;
        $availableSeats = max(0, $totalSeats - $reservedSeats);

        $sql = "UPDATE `{$table}` 
                SET seats_total = {$totalSeats},
                    seats_reserved = {$reservedSeats},
                    seats_available = {$availableSeats},
                    updated_at = CURRENT_TIMESTAMP
                WHERE trip_id = {$tripId} AND departure_date = '{$departureDate}'";

        return $this->wpdb->query($sql) !== false;
    }

    /**
     * Reserve seats for a departure date
     * 
     * @param int $tripId Trip ID
     * @param string $departureDate Departure date (YYYY-MM-DD)
     * @param int $seatsToReserve Number of seats to reserve
     * @return bool Success status
     */
    public function reserveSeats(int $tripId, string $departureDate, int $seatsToReserve): bool
    {
        $table = esc_sql($this->table);
        $tripId = (int) $tripId;
        $departureDate = esc_sql($departureDate);
        $seatsToReserve = (int) $seatsToReserve;

        if ($seatsToReserve <= 0) return false;

        // Early-exit when there's clearly not enough capacity. This is
        // a "fail fast" optimisation — the atomic UPDATE below is the
        // actual authority (the AND seats_available >= guard prevents
        // overbooking even if this pre-check raced with a concurrent
        // reservation), but skipping the UPDATE round-trip when the
        // answer is already obvious is cheap.
        $available = $this->getAvailableSeats($tripId, $departureDate);
        if ($available < $seatsToReserve) {
            return false;
        }

        $sql = "UPDATE `{$table}`
                SET seats_reserved = seats_reserved + {$seatsToReserve},
                    seats_available = seats_available - {$seatsToReserve},
                    updated_at = CURRENT_TIMESTAMP
                WHERE trip_id = {$tripId}
                AND departure_date = '{$departureDate}'
                AND seats_available >= {$seatsToReserve}";

        // CRITICAL: anti-overbooking authority. `$wpdb->query()`
        // returns the number of rows affected for UPDATE statements,
        // or `false` on error. We MUST distinguish:
        //
        //   - false        → SQL error (return false; caller treats
        //                    as failed reservation).
        //   - 0 rows       → another writer beat us to the seats; the
        //                    `AND seats_available >= …` guard rejected
        //                    the write. Return false — this is the
        //                    overbooking-prevention path.
        //   - 1+ rows      → reservation succeeded atomically. The
        //                    decrement-and-guard happened in a single
        //                    DB statement so no race is possible.
        //
        // Previous behaviour was `return $wpdb->query($sql) !== false`
        // which incorrectly returned TRUE on the 0-rows case — meaning
        // callers thought they had reserved seats when in fact the DB
        // had refused the write. With concurrent OTA + local bookings,
        // that resulted in real overbooking even though the SQL was
        // safe.
        $rows = $this->wpdb->query($sql);
        if ($rows === false) return false;
        return (int) $rows > 0;
    }

    /**
     * Release reserved seats for a departure date
     * 
     * @param int $tripId Trip ID
     * @param string $departureDate Departure date (YYYY-MM-DD)
     * @param int $seatsToRelease Number of seats to release
     * @return bool Success status
     */
    public function releaseSeats(int $tripId, string $departureDate, int $seatsToRelease): bool
    {
        $table = esc_sql($this->table);
        $tripId = (int) $tripId;
        $departureDate = esc_sql($departureDate);
        $seatsToRelease = (int) $seatsToRelease;

        $sql = "UPDATE `{$table}` 
                SET seats_reserved = GREATEST(0, seats_reserved - {$seatsToRelease}),
                    seats_available = LEAST(seats_total, seats_available + {$seatsToRelease}),
                    updated_at = CURRENT_TIMESTAMP
                WHERE trip_id = {$tripId} AND departure_date = '{$departureDate}'";

        return $this->wpdb->query($sql) !== false;
    }

    /**
     * Get available seats count for a departure date
     * 
     * @param int $tripId Trip ID
     * @param string $departureDate Departure date (YYYY-MM-DD)
     * @return int Number of available seats
     */
    public function getAvailableSeats(int $tripId, string $departureDate): int
    {
        $table = esc_sql($this->table);
        $tripId = (int) $tripId;
        $departureDate = esc_sql($departureDate);

        $sql = "SELECT seats_available 
                FROM `{$table}` 
                WHERE trip_id = {$tripId} AND departure_date = '{$departureDate}'
                AND status = 'available' AND is_blocked = 0
                LIMIT 1";

        $result = $this->wpdb->get_var($sql);
        return (int) $result ?: 0;
    }

    /**
     * Block/unblock a departure date
     * 
     * @param int $tripId Trip ID
     * @param string $departureDate Departure date (YYYY-MM-DD)
     * @param bool $blocked Whether to block
     * @param string|null $reason Block reason
     * @return bool Success status
     */
    public function blockDate(int $tripId, string $departureDate, bool $blocked = true, ?string $reason = null): bool
    {
        $table = esc_sql($this->table);
        $tripId = (int) $tripId;
        $departureDate = esc_sql($departureDate);
        $blockedInt = $blocked ? 1 : 0;
        $reason = $reason ? "'" . esc_sql($reason) . "'" : 'NULL';

        $sql = "UPDATE `{$table}` 
                SET is_blocked = {$blockedInt},
                    block_reason = {$reason},
                    updated_at = CURRENT_TIMESTAMP
                WHERE trip_id = {$tripId} AND departure_date = '{$departureDate}'";

        return $this->wpdb->query($sql) !== false;
    }

    /**
     * Update status for a departure date
     * 
     * @param int $tripId Trip ID
     * @param string $departureDate Departure date (YYYY-MM-DD)
     * @param string $status New status
     * @return bool Success status
     */
    public function updateStatus(int $tripId, string $departureDate, string $status): bool
    {
        $table = esc_sql($this->table);
        $tripId = (int) $tripId;
        $departureDate = esc_sql($departureDate);
        $status = esc_sql($status);

        $sql = "UPDATE `{$table}` 
                SET status = '{$status}',
                    updated_at = CURRENT_TIMESTAMP
                WHERE trip_id = {$tripId} AND departure_date = '{$departureDate}'";

        return $this->wpdb->query($sql) !== false;
    }

    /**
     * Get availability statistics for a trip
     * 
     * @param int $tripId Trip ID
     * @param string $startDate Start date (YYYY-MM-DD)
     * @param string $endDate End date (YYYY-MM-DD)
     * @return array Statistics array
     */
    public function getTripStatistics(int $tripId, string $startDate, string $endDate): array
    {
        $table = esc_sql($this->table);
        $tripId = (int) $tripId;
        $startDate = esc_sql($startDate);
        $endDate = esc_sql($endDate);

        $sql = "SELECT 
                    COUNT(*) as total_dates,
                    SUM(CASE WHEN status = 'available' AND is_blocked = 0 THEN 1 ELSE 0 END) as available_dates,
                    SUM(CASE WHEN seats_available > 0 THEN 1 ELSE 0 END) as dates_with_seats,
                    SUM(seats_total) as total_capacity,
                    SUM(seats_available) as total_available,
                    SUM(seats_reserved) as total_reserved,
                    AVG(seats_available) as avg_available_seats,
                    MIN(departure_date) as first_date,
                    MAX(departure_date) as last_date
                FROM `{$table}` 
                WHERE trip_id = {$tripId} 
                AND departure_date BETWEEN '{$startDate}' AND '{$endDate}'";

        $result = $this->wpdb->get_row($sql);
        return $result ? (array) $result : [];
    }

    /**
     * Delete availability dates for a trip within a date range
     * 
     * @param int $tripId Trip ID
     * @param string $startDate Start date (YYYY-MM-DD)
     * @param string $endDate End date (YYYY-MM-DD)
     * @return int Number of deleted records
     */
    public function deleteDateRange(int $tripId, string $startDate, string $endDate): int
    {
        $table = esc_sql($this->table);
        $tripId = (int) $tripId;
        $startDate = esc_sql($startDate);
        $endDate = esc_sql($endDate);

        $sql = "DELETE FROM `{$table}` 
                WHERE trip_id = {$tripId} 
                AND departure_date BETWEEN '{$startDate}' AND '{$endDate}'";

        return $this->wpdb->query($sql) ?: 0;
    }

    /**
     * Get upcoming departures that need alerts
     * 
     * @param int $daysAhead Number of days ahead to check
     * @param int $alertThreshold Alert threshold for seats
     * @return array Array of departures needing alerts
     */
    public function getDeparturesNeedingAlerts(int $daysAhead = 7, int $alertThreshold = 3): array
    {
        $table = esc_sql($this->table);
        $daysAhead = (int) $daysAhead;
        $alertThreshold = (int) $alertThreshold;

        $sql = "SELECT * FROM `{$table}` 
                WHERE departure_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL {$daysAhead} DAY)
                AND seats_available > 0 
                AND seats_available <= {$alertThreshold}
                AND status = 'available'
                AND is_blocked = 0
                ORDER BY departure_date ASC";

        return $this->wpdb->get_results($sql) ?: [];
    }

    /**
     * Get status counts for availability dates
     * 
     * @param array $args Arguments including trip_id filtering
     * @return array Status counts
     */
    public function getStatusCounts(array $args = []): array
    {
        $table = esc_sql($this->table);
        $where = $this->buildWhereClause($args);
        
        $sql = "SELECT status, COUNT(*) as count 
                FROM `{$table}` 
                {$where}
                GROUP BY status";
        
        $results = $this->wpdb->get_results($sql) ?: [];

        $counts = [
            'available' => 0,
            'unavailable' => 0,
            'limited' => 0,
            'sold_out' => 0,
            'cancelled' => 0,
            'blocked' => 0,
            'total' => 0
        ];
        
        foreach ($results as $row) {
            $status = $row->status;
            $count = (int) $row->count;
            
            if (isset($counts[$status])) {
                $counts[$status] = $count;
            }
            $counts['total'] += $count;
        }
        
        return $counts;
    }
}
