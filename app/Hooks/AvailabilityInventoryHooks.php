<?php

declare(strict_types=1);

namespace Yatra\Hooks;

use Yatra\Repositories\BookingRepository;
use Yatra\Repositories\DepartureRepository;
use Yatra\Repositories\AvailabilityRepository;
use Yatra\Services\CapacityService;

class AvailabilityInventoryHooks
{
    public static function init(): void
    {
        add_action('yatra_booking_created', [self::class, 'onBookingCreated'], 10, 2);
        add_action('yatra_booking_deleted', [self::class, 'onBookingDeleted'], 10, 2);
        add_action('yatra_booking_status_changed', [self::class, 'onBookingStatusChanged'], 10, 3);
        
        // Add hooks to ensure departure capacity sync
        add_action('yatra_availability_updated', [self::class, 'onAvailabilityUpdate'], 10, 1);
        add_action('yatra_departure_saved', [self::class, 'onDepartureSave'], 10, 1);
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

            if ($tripId > 0 && $availabilityId <= 0) {
                global $wpdb;
                $availabilityTable = $wpdb->prefix . 'yatra_trip_availability_dates';
                $travelDate = (string) ($booking->travel_date ?? '');

                if ($travelDate !== '') {
                    $rows = $wpdb->get_results(
                        $wpdb->prepare(
                            "SELECT id FROM {$availabilityTable} WHERE trip_id = %d AND departure_date = %s LIMIT 2",
                            $tripId,
                            $travelDate
                        )
                    );

                    if (is_array($rows) && count($rows) === 1 && !empty($rows[0]->id)) {
                        $availabilityId = (int) $rows[0]->id;
                        $bookingsTable = $wpdb->prefix . 'yatra_bookings';
                        $wpdb->query(
                            $wpdb->prepare(
                                "UPDATE {$bookingsTable} SET availability_id = %d WHERE id = %d",
                                $availabilityId,
                                $bookingId
                            )
                        );
                    }
                }
            }

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

        $departureTime = isset($availability->departure_time) ? (string) $availability->departure_time : '';

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
        $seatsReserved = $bookedCount;
        $seatsAvailable = max(0, $seatsTotal - $bookedCount);

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
                'seats_reserved' => $seatsReserved,
                'status' => $status,
            ],
            ['id' => (int) $availabilityId],
            ['%d', '%d', '%s'],
            ['%d']
        );

        self::syncDepartureWithAvailability($tripId, $availability, $bookedCount, $seatsTotal);
    }

    private static function syncDepartureWithAvailability(int $tripId, object $availability, int $bookedCount, int $seatsTotal): void
    {
        $departureRepo = new DepartureRepository();
        $date = (string) ($availability->departure_date ?? '');
        $time = (string) ($availability->departure_time ?? '');
        $normalizedTime = '';
        if ($time !== '') {
            $ts = strtotime($time);
            if ($ts !== false) {
                $normalizedTime = date('H:i:s', $ts);
            }
        }

        if ($date === '') {
            return;
        }

        // Find a matching departure by trip + date (+ time if provided)
        $departure = null;
        $candidateTimes = array_values(array_unique(array_filter([$normalizedTime, $time], function ($t) {
            return $t !== '';
        })));

        foreach ($candidateTimes as $candidateTime) {
            $departure = $departureRepo->findByTripIdAndStartDate($tripId, $date, $candidateTime);
            if ($departure) {
                break;
            }
        }
        if (!$departure) {
            $departure = $departureRepo->findByTripIdAndStartDate($tripId, $date, null);
        }

        if (!$departure) {
            return;
        }

        $updated = [
            'max_capacity' => $seatsTotal,
            'booked_count' => min($seatsTotal, max(0, $bookedCount)),
        ];

        $departureRepo->update((int) $departure->id, $updated);
    }

    /**
     * Hook to sync departure capacity when availability is updated
     */
    public static function onAvailabilityUpdate(int $availabilityId): void
    {
        $availabilityRepo = new AvailabilityRepository();
        $availability = $availabilityRepo->find($availabilityId);
        
        if ($availability) {
            self::syncDepartureWithAvailability(
                (int) $availability->trip_id,
                $availability, // Pass the full availability object, not just the date
                0, // Will be recalculated from bookings
                (int) ($availability->seats_total ?? 0)
            );
        }
    }

    /**
     * Hook to ensure departure capacity always matches availability on save
     */
    public static function onDepartureSave(int $departureId): void
    {
        // Prevent infinite loops
        static $processing = [];
        if (isset($processing[$departureId])) {
            return;
        }
        $processing[$departureId] = true;
        
        $departureRepo = new DepartureRepository();
        $departure = $departureRepo->find($departureId);
        
        if ($departure) {
            $date = $departure->start_date ?: $departure->date;
            
            // Get capacity from availability
            $capacityService = new CapacityService();
            $correctCapacity = $capacityService->getCapacityForDate($departure->trip_id, $date);
            
            if ($correctCapacity > 0 && $departure->max_capacity !== $correctCapacity) {
                // Remove hook temporarily to prevent infinite loop
                remove_action('yatra_departure_saved', [self::class, 'onDepartureSave'], 10);
                
                $departureRepo->update($departureId, [
                    'max_capacity' => $correctCapacity
                ]);
                
                // Re-add hook
                add_action('yatra_departure_saved', [self::class, 'onDepartureSave'], 10, 1);
            }
        }
        
        unset($processing[$departureId]);
    }
}
