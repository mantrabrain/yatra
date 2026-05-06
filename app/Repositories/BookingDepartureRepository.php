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
     * Check if booking_departures table exists
     */
    public function tableExists(): bool
    {
        $table = $this->getTableName();
        // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
        $exists = $this->wpdb->get_var($this->wpdb->prepare("SHOW TABLES LIKE %s", $table));
        return $exists === $table;
    }

    /**
     * Create booking_departures table if missing
     */
    private function createTable(): void
    {
        if (!function_exists('dbDelta')) {
            require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        }
        // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
        dbDelta(\Yatra\Database\Tables\BookingDeparturesTable::getSchema());
    }

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

        // Ensure table exists and detect optional columns (older installs may differ).
        $columns = $this->wpdb->get_col("DESCRIBE {$table}") ?: [];
        $hasTravelDate = in_array('travel_date', $columns, true);
        $hasDepartureTime = in_array('departure_time', $columns, true);
        
        // Check if relationship already exists
        $existing = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT id FROM `{$table}` WHERE booking_id = %d AND departure_id = %d LIMIT 1",
            $bookingId,
            $departureId
        ));
        
        if ($existing) {
            // Already linked; best-effort backfill date/time if the columns exist and are empty.
            if ($hasTravelDate || $hasDepartureTime) {
                $update = [];

                $booking = (new BookingRepository())->find($bookingId);
                $departure = (new DepartureRepository())->find($departureId);

                $travelDate = '';
                if (is_object($departure)) {
                    $travelDate = (string) ($departure->start_date ?? $departure->date ?? '');
                }
                if ($travelDate === '' && is_object($booking)) {
                    $travelDate = (string) ($booking->travel_date ?? $booking->start_date ?? '');
                }

                $time = '';
                if (is_object($departure)) {
                    $time = (string) ($departure->time ?? '');
                }
                if ($time !== '') {
                    $ts = strtotime($time);
                    $time = $ts !== false ? date('H:i:s', $ts) : $time;
                }

                if ($hasTravelDate && $travelDate !== '') {
                    $update['travel_date'] = $travelDate;
                }
                if ($hasDepartureTime && $time !== '' && $time !== '00:00:00') {
                    $update['departure_time'] = $time;
                }

                if (!empty($update)) {
                    $this->wpdb->update($table, $update, ['id' => (int) $existing]);
                }
            }

            return true;
        }

        $booking = (new BookingRepository())->find($bookingId);
        $departure = (new DepartureRepository())->find($departureId);

        $travelDate = '';
        if (is_object($departure)) {
            $travelDate = (string) ($departure->start_date ?? $departure->date ?? '');
        }
        if ($travelDate === '' && is_object($booking)) {
            $travelDate = (string) ($booking->travel_date ?? $booking->start_date ?? '');
        }

        $time = '';
        if (is_object($departure)) {
            $time = (string) ($departure->time ?? '');
        }
        if ($time !== '') {
            $ts = strtotime($time);
            $time = $ts !== false ? date('H:i:s', $ts) : $time;
        }

        // Build insert payload compatible with both new and legacy schemas.
        $insert = [
            'booking_id' => $bookingId,
            'departure_id' => $departureId,
            'created_at' => current_time('mysql'),
        ];
        $formats = ['%d', '%d', '%s'];

        if ($hasTravelDate) {
            // travel_date is NOT NULL in the new schema; fail safe to booking travel_date.
            if ($travelDate === '' && is_object($booking) && !empty($booking->travel_date)) {
                $travelDate = (string) $booking->travel_date;
            }
            if ($travelDate === '') {
                // If we can't infer a date, don't attempt insert (would violate NOT NULL in new schema).
                return false;
            }
            $insert['travel_date'] = $travelDate;
            $formats[] = '%s';
        }
        if ($hasDepartureTime) {
            $insert['departure_time'] = ($time !== '' && $time !== '00:00:00') ? $time : null;
            $formats[] = '%s';
        }
        
        $result = $this->wpdb->insert(
            $table,
            $insert,
            $formats
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

        $rows = $this->wpdb->get_col($this->wpdb->prepare(
            "SELECT booking_id FROM `{$table}` WHERE departure_id = %d",
            $departureId
        ));

        $ids = [];
        foreach ($rows as $id) {
            $id = (int) $id;
            if ($id > 0) {
                $ids[] = $id;
            }
        }

        return $ids;
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
        $oldDepartureId = $this->getDepartureIdForBooking($bookingId);
        
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
