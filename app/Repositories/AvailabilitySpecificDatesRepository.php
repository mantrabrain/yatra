<?php

namespace Yatra\Repositories;

use Yatra\Database\Tables\TripAvailabilityDatesTable;
use Yatra\Repositories\BaseRepository;

/**
 * Availability Specific Dates Repository Class
 * 
 * Handles data operations for specific date availability records.
 * Provides methods for CRUD operations and complex queries.
 * 
 * @package Yatra\Repositories
 * @since 2.0.0
 */
class AvailabilitySpecificDatesRepository extends BaseRepository
{
    /**
     * Constructor
     */
    public function __construct()
    {
        parent::__construct(TripAvailabilityDatesTable::getTableName());
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

    /**
     * Get dates with price overrides for a trip
     * 
     * @param int $tripId Trip ID
     * @param string $startDate Start date (Y-m-d)
     * @param string $endDate End date (Y-m-d)
     * @return array Array of dates with price overrides
     */
    public function getDatesWithPriceOverrides(int $tripId, string $startDate, string $endDate): array
    {
        $table = esc_sql($this->table);
        
        $sql = "SELECT * FROM `{$table}` 
                WHERE `trip_id` = %d 
                AND `date` BETWEEN %s AND %s
                AND `price_override` IS NOT NULL
                ORDER BY `date` ASC";
        
        $query = $this->wpdb->prepare($sql, $tripId, $startDate, $endDate);
        return $this->wpdb->get_results($query) ?: [];
    }

    /**
     * Delete specific dates for a trip within a date range
     * 
     * @param int $tripId Trip ID
     * @param string $startDate Start date (Y-m-d)
     * @param string $endDate End date (Y-m-d)
     * @return int Number of deleted records
     */
    public function deleteDatesInRange(int $tripId, string $startDate, string $endDate): int
    {
        $table = esc_sql($this->table);
        
        $sql = "DELETE FROM `{$table}` 
                WHERE `trip_id` = %d 
                AND `date` BETWEEN %s AND %s";
        
        $query = $this->wpdb->prepare($sql, $tripId, $startDate, $endDate);
        return (int) $this->wpdb->query($query);
    }

    /**
     * Check if a date is available for booking
     * 
     * @param int $tripId Trip ID
     * @param string $date Date (Y-m-d)
     * @return bool True if available, false otherwise
     */
    public function isDateAvailable(int $tripId, string $date): bool
    {
        $table = esc_sql($this->table);
        
        $sql = "SELECT COUNT(*) FROM `{$table}` 
                WHERE `trip_id` = %d 
                AND `date` = %s
                AND `status` = 'available'
                AND (`max_bookings` IS NULL OR `current_bookings` < `max_bookings`)";
        
        $query = $this->wpdb->prepare($sql, $tripId, $date);
        $count = (int) $this->wpdb->get_var($query);
        
        return $count > 0;
    }

    /**
     * Get available slots for a specific date
     * 
     * @param int $tripId Trip ID
     * @param string $date Date (Y-m-d)
     * @return int Available slots (0 if unlimited or unavailable)
     */
    public function getAvailableSlots(int $tripId, string $date): int
    {
        $table = esc_sql($this->table);
        
        $sql = "SELECT `max_bookings`, `current_bookings`, `status` 
                FROM `{$table}` 
                WHERE `trip_id` = %d 
                AND `date` = %s
                LIMIT 1";
        
        $query = $this->wpdb->prepare($sql, $tripId, $date);
        $result = $this->wpdb->get_row($query);
        
        if (!$result || $result->status !== 'available') {
            return 0;
        }
        
        if ($result->max_bookings === null) {
            return -1; // Unlimited
        }
        
        return max(0, (int) $result->max_bookings - (int) $result->current_bookings);
    }
}
