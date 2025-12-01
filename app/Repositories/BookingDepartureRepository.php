<?php

declare(strict_types=1);

namespace Yatra\Repositories;

/**
 * Booking Departure Repository
 * Manages the relationship between bookings and departures
 * 
 * Table: wp_yatra_booking_departures
 */
class BookingDepartureRepository extends BaseRepository
{
    /**
     * Get table name
     */
    protected function getTableName(): string
    {
        return $this->wpdb->prefix . 'yatra_booking_departures';
    }

    /**
     * Check if table exists
     */
    protected function tableExists(): bool
    {
        $table = $this->getTableName();
        $result = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = %s AND table_name = %s",
            DB_NAME,
            $table
        ));
        return (bool) $result;
    }

    /**
     * Create the booking_departures table if it doesn't exist
     */
    private function createTable(): void
    {
        global $wpdb;
        $table = $this->getTableName();
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE IF NOT EXISTS `{$table}` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `booking_id` bigint(20) UNSIGNED NOT NULL,
            `departure_id` bigint(20) UNSIGNED NOT NULL,
            `created_at` datetime NOT NULL,
            PRIMARY KEY (`id`),
            KEY `booking_id` (`booking_id`),
            KEY `departure_id` (`departure_id`),
            UNIQUE KEY `booking_departure` (`booking_id`, `departure_id`)
        ) {$charset_collate};";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
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
        if (!$this->tableExists()) {
            $this->createTable();
        }

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
        if (!$this->tableExists()) {
            return false; // Table doesn't exist, nothing to unlink
        }

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
     * @return int|null Departure ID or null
     */
    public function getDepartureForBooking(int $bookingId): ?int
    {
        // Return null if table doesn't exist
        if (!$this->tableExists()) {
            return null;
        }

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
    public function getBookingsForDeparture(int $departureId): array
    {
        // Return empty array if table doesn't exist
        if (!$this->tableExists()) {
            return [];
        }

        $table = $this->getTableName();
        
        $results = $this->wpdb->get_col($this->wpdb->prepare(
            "SELECT booking_id FROM `{$table}` WHERE departure_id = %d",
            $departureId
        ));
        
        return array_map('intval', $results ?: []);
    }

    /**
     * Count bookings for a departure
     * 
     * @param int $departureId Departure ID
     * @return int Count
     */
    public function countBookingsForDeparture(int $departureId): int
    {
        if (!$this->tableExists()) {
            return 0;
        }

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
     * Delete all links for a departure (when departure is deleted - should not happen normally)
     * 
     * @param int $departureId Departure ID
     * @return bool Success
     */
    public function deleteByDepartureId(int $departureId): bool
    {
        if (!$this->tableExists()) {
            return false;
        }

        $table = $this->getTableName();
        
        $result = $this->wpdb->delete(
            $table,
            ['departure_id' => $departureId],
            ['%d']
        );
        
        return $result !== false;
    }
}

