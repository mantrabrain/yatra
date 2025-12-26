<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Database\Tables\BookingDeparturesTable;

/**
 * Booking Departure Repository
 * Manages the relationship between bookings and departures
 * 
 * Table: wp_yatra_new_booking_departures
 */
class BookingDepartureRepository extends BaseRepository
{
    /**
     * Get table name
     */
    protected function getTableName(): string
    {
        return BookingDeparturesTable::getTableName();
    }

    /**
     * Link a booking to a departure
     * 
     * @param int $bookingId Booking ID
     * @param int $departureId Departure ID
     * @return bool Success
     */
    public function link(int $bookingId, int $departureId): bool
    {
        $table = $this->getTableName();
        
        // Check if relationship already exists
        $existing = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT id FROM `{$table}` WHERE booking_id = %d AND departure_id = %d LIMIT 1",
            $bookingId,
            $departureId
        ));
        
        if ($existing) {
            return true; // Already linked
        }
        
        $result = $this->wpdb->insert(
            $table,
            [
                'booking_id' => $bookingId,
                'departure_id' => $departureId,
                'created_at' => current_time('mysql'),
            ],
            ['%d', '%d', '%s']
        );
        
        return $result !== false;
    }

    /**
     * Unlink a booking from a departure
     * 
     * @param int $bookingId Booking ID
     * @param int|null $departureId Optional departure ID (if null, removes all links for booking)
     * @return bool Success
     */
    public function unlink(int $bookingId, ?int $departureId = null): bool
    {
        $table = $this->getTableName();
        
        if ($departureId !== null) {
            // Delete specific link
            $result = $this->wpdb->delete(
                $table,
                [
                    'booking_id' => $bookingId,
                    'departure_id' => $departureId,
                ],
                ['%d', '%d']
            );
        } else {
            // Delete all links for this booking
            $result = $this->wpdb->delete(
                $table,
                ['booking_id' => $bookingId],
                ['%d']
            );
        }
        
        return $result !== false;
    }

    /**
     * Get departure ID for a booking
     * 
     * @param int $bookingId Booking ID
     * @return int|null Departure ID or null if not linked
     */
    public function getDepartureIdForBooking(int $bookingId): ?int
    {
        $table = $this->getTableName();
        
        $departureId = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT departure_id FROM `{$table}` WHERE booking_id = %d LIMIT 1",
            $bookingId
        ));
        
        return $departureId ? (int) $departureId : null;
    }

    /**
     * Get all booking IDs for a departure
     * 
     * @param int $departureId Departure ID
     * @return array Array of booking IDs
     */
    public function getBookingIdsForDeparture(int $departureId): array
    {
        $table = $this->getTableName();
        
        return $this->wpdb->get_col($this->wpdb->prepare(
            "SELECT booking_id FROM `{$table}` WHERE departure_id = %d",
            $departureId
        ));
    }

    /**
     * Count bookings for a departure
     * 
     * @param int $departureId Departure ID
     * @return int Count
     */
    public function countBookingsForDeparture(int $departureId): int
    {
        $table = $this->getTableName();
        
        $count = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(*) FROM `{$table}` WHERE departure_id = %d",
            $departureId
        ));
        
        return (int) $count;
    }

    /**
     * Update departure for a booking (handle date change)
     * 
     * @param int $bookingId Booking ID
     * @param int $newDepartureId New departure ID
     * @return int|null Old departure ID (if existed)
     */
    public function updateDepartureForBooking(int $bookingId, int $newDepartureId): ?int
    {
        if (!$this->tableExists()) {
            $this->createTable(); // Ensure table exists before trying to update
        }

        $table = $this->getTableName();
        
        // Get old departure ID
        $oldDepartureId = $this->getDepartureForBooking($bookingId);
        
        // Remove old link
        if ($oldDepartureId) {
            $this->unlink($bookingId, $oldDepartureId);
        }
        
        // Create new link
        $this->link($bookingId, $newDepartureId);
        
        return $oldDepartureId;
    }

    /**
     * Delete all links for a booking (when booking is deleted)
     * 
     * @param int $bookingId Booking ID
     * @return bool Success
     */
    public function deleteByBookingId(int $bookingId): bool
    {
        if (!$this->tableExists()) {
            return false;
        }

        $table = $this->getTableName();
        
        $result = $this->wpdb->delete(
            $table,
            ['booking_id' => $bookingId],
            ['%d']
        );
        
        return $result !== false;
    }

    /**
     * Delete all booking relationships for a departure
     * 
     * @param int $departureId Departure ID
     * @return bool Success
     */
    public function deleteByDepartureId(int $departureId): bool
    {
        $table = $this->getTableName();
        
        $result = $this->wpdb->delete(
            $table,
            ['departure_id' => $departureId],
            ['%d']
        );
        
        return $result !== false;
    }
}
