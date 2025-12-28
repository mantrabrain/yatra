<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Database\Tables\TripsTable;
use Yatra\Database\Tables\TripAvailabilityDatesTable;

/**
 * Trip Availability Repository
 * Handles database operations for trip availability
 */
class TripAvailabilityRepository extends BaseRepository
{
    protected function getTableName(): string
    {
        return TripAvailabilityDatesTable::getTableName();
    }

    /**
     * Count available departures by date
     */
    public function countAvailableDeparturesByDate(int $tripId, string $date): int
    {
        global $wpdb;
        $availability_table = $this->getTableName();
        
        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$availability_table} WHERE trip_id = %d AND departure_date = %s AND status IN ('available', 'limited')",
            $tripId,
            $date
        ));
    }

    /**
     * Get availability by date
     */
    public function getAvailabilityByDate(int $tripId, string $date): ?\stdClass
    {
        global $wpdb;
        $availability_table = $this->getTableName();
        
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$availability_table} WHERE trip_id = %d AND departure_date = %s",
            $tripId,
            $date
        ));
    }

    /**
     * Get total booked seats by date
     */
    public function getTotalBookedByDate(int $tripId, string $date): int
    {
        global $wpdb;
        $availability_table = $this->getTableName();
        
        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(SUM(seats_booked), 0) FROM {$availability_table} WHERE trip_id = %d AND departure_date = %s",
            $tripId,
            $date
        ));
    }

    /**
     * Update availability status
     */
    public function updateAvailabilityStatus(int $tripId, string $date, string $status): bool
    {
        global $wpdb;
        $availability_table = $this->getTableName();
        
        return $wpdb->update(
            $availability_table,
            ['status' => $status, 'updated_at' => current_time('mysql')],
            ['trip_id' => $tripId, 'departure_date' => $date],
            ['%s', '%s'],
            ['%d', '%s']
        ) !== false;
    }

    /**
     * Update booked seats
     */
    public function updateBookedSeats(int $tripId, string $date, int $bookedSeats): bool
    {
        global $wpdb;
        $availability_table = $this->getTableName();
        
        return $wpdb->update(
            $availability_table,
            ['seats_booked' => $bookedSeats, 'updated_at' => current_time('mysql')],
            ['trip_id' => $tripId, 'departure_date' => $date],
            ['%d', '%s'],
            ['%d', '%s']
        ) !== false;
    }

    /**
     * Get availability dates for trip
     */
    public function getAvailabilityDates(int $tripId, array $filters = []): array
    {
        global $wpdb;
        $availability_table = $this->getTableName();
        
        $where_conditions = ["trip_id = %d"];
        $where_values = [$tripId];
        
        // Apply filters
        if (!empty($filters['status'])) {
            $where_conditions[] = "status = %s";
            $where_values[] = $filters['status'];
        }
        
        if (!empty($filters['date_from'])) {
            $where_conditions[] = "departure_date >= %s";
            $where_values[] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $where_conditions[] = "departure_date <= %s";
            $where_values[] = $filters['date_to'];
        }
        
        $where_clause = implode(' AND ', $where_conditions);
        
        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$availability_table} WHERE {$where_clause} ORDER BY departure_date ASC",
            ...$where_values
        ));
    }
}
