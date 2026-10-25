<?php

declare(strict_types=1);

namespace Yatra\Hooks;

use Yatra\Repositories\BookingRepository;
use Yatra\Repositories\CustomerRepository;

/**
 * Keeps the booking statistics stored on a customer row (total_bookings,
 * total_spent, total_travelers and the last booking / travel dates) in step
 * with the bookings table.
 *
 * These columns used to be maintained by hand, with a "+1" every time
 * {@see CustomerRepository::findOrCreate()} ran. One checkout runs it twice —
 * once in BookingSessionController, which carries the emergency contact and
 * lead-traveller details, and once inside BookingService::createBooking() — so
 * every booking was counted twice, and nothing ever subtracted when a booking
 * was cancelled or deleted.
 *
 * Recalculating from the bookings table is immune to both problems: it is a
 * full recount rather than an adjustment, so running it twice for one booking
 * gives the same answer as running it once, and a booking that disappears is
 * simply no longer counted.
 *
 * @see CustomerRepository::recalculateStats()
 */
class CustomerStatsHooks
{
    public static function init(): void
    {
        add_action('yatra_booking_created', [self::class, 'onBookingCreated'], 20, 2);
        add_action('yatra_booking_updated', [self::class, 'onBookingUpdated'], 20, 1);
        add_action('yatra_booking_status_changed', [self::class, 'onBookingStatusChanged'], 20, 3);
        add_action('yatra_booking_deleted', [self::class, 'onBookingDeleted'], 20, 2);
    }

    public static function onBookingCreated(int $bookingId, $booking = null): void
    {
        self::recalculateForBooking($bookingId, $booking);
    }

    public static function onBookingUpdated(int $bookingId): void
    {
        self::recalculateForBooking($bookingId, null);
    }

    public static function onBookingStatusChanged(int $bookingId, string $oldStatus = '', string $newStatus = ''): void
    {
        self::recalculateForBooking($bookingId, null);
    }

    /**
     * The booking row is already gone by the time this fires, so the customer
     * can only be identified from the object the action carries.
     */
    public static function onBookingDeleted(int $bookingId, $booking = null): void
    {
        self::recalculateForBooking($bookingId, $booking, false);
    }

    /**
     * @param object|null $booking Booking row when the caller has it to hand.
     * @param bool        $mayReload Whether the booking can still be read back.
     */
    private static function recalculateForBooking(int $bookingId, $booking = null, bool $mayReload = true): void
    {
        try {
            if (!is_object($booking) && $mayReload && $bookingId > 0) {
                $booking = (new BookingRepository())->find($bookingId);
            }

            if (!is_object($booking)) {
                return;
            }

            $customerId = (int) ($booking->customer_id ?? 0);
            if ($customerId <= 0) {
                return;
            }

            (new CustomerRepository())->recalculateStats($customerId);
        } catch (\Throwable $e) {
            // Statistics are a display concern — never let them break a booking.
        }
    }
}
