<?php

declare(strict_types=1);

namespace Yatra\Hooks;

use Yatra\Repositories\BookingRepository;

class AvailabilityInventoryHooks
{
    public static function init(): void
    {
        add_action('yatra_booking_created', [self::class, 'onBookingCreated'], 10, 2);
        add_action('yatra_booking_deleted', [self::class, 'onBookingDeleted'], 10, 2);
        add_action('yatra_booking_status_changed', [self::class, 'onBookingStatusChanged'], 10, 3);
    }

    public static function onBookingCreated(int $bookingId, $booking = null): void
    {
        self::syncForBooking($bookingId, $booking);
    }

    public static function onBookingDeleted(int $bookingId, $booking = null): void
    {
        self::syncForBooking($bookingId, $booking);
    }

    public static function onBookingStatusChanged(int $bookingId, string $oldStatus, string $newStatus): void
    {
        self::syncForBooking($bookingId, null);
    }

    private static function syncForBooking(int $bookingId, $booking = null): void
    {
        try {
            if (!is_object($booking)) {
                $repo = new BookingRepository();
                $booking = $repo->find($bookingId);
            }

            if (!is_object($booking)) {
                return;
            }

            $tripId = (int) ($booking->trip_id ?? 0);
            $availabilityId = isset($booking->availability_id) ? (int) $booking->availability_id : 0;

            if ($tripId <= 0 || $availabilityId <= 0) {
                return;
            }

            self::syncAvailabilityId($availabilityId, $tripId);
        } catch (\Throwable $e) {
            return;
        }
    }

    private static function syncAvailabilityId(int $availabilityId, int $tripId): void
    {
        global $wpdb;

        $availabilityTable = $wpdb->prefix . 'yatra_trip_availability_dates';
        $bookingsTable = $wpdb->prefix . 'yatra_bookings';

        $availability = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT id, seats_total, seats_available, seats_reserved, status FROM {$availabilityTable} WHERE id = %d LIMIT 1",
                $availabilityId
            )
        );

        if (!$availability) {
            return;
        }

        $activeBookingStatuses = ['pending', 'confirmed', 'processing', 'completed', 'on_hold'];
        $placeholders = implode(',', array_fill(0, count($activeBookingStatuses), '%s'));

        $bookedCount = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COALESCE(SUM(travelers_count), 0)
                 FROM {$bookingsTable}
                 WHERE trip_id = %d
                   AND availability_id = %d
                   AND status IN ({$placeholders})",
                array_merge([(int) $tripId, (int) $availabilityId], $activeBookingStatuses)
            )
        );

        $seatsTotal = (int) ($availability->seats_total ?? 0);
        $seatsReserved = (int) ($availability->seats_reserved ?? 0);
        $seatsAvailable = max(0, $seatsTotal - $bookedCount - $seatsReserved);

        $status = (string) ($availability->status ?? 'available');
        if (!in_array($status, ['blocked', 'closed', 'cancelled'], true)) {
            if ($seatsAvailable === 0) {
                $status = 'sold_out';
            } elseif ($seatsTotal > 0 && $seatsAvailable <= (int) ceil($seatsTotal * 0.2)) {
                $status = 'limited';
            } else {
                $status = 'available';
            }
        }

        $wpdb->update(
            $availabilityTable,
            [
                'seats_available' => $seatsAvailable,
                'status' => $status,
            ],
            ['id' => (int) $availabilityId],
            ['%d', '%s'],
            ['%d']
        );
    }
}
