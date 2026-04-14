<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\AvailabilityRepository;
use Yatra\Repositories\BookingRepository;

/**
 * Global + per-trip waitlist rules for checkout (free + Pro via filters).
 */
final class WaitlistService
{
    /**
     * Site-wide waitlist toggle (Settings → Booking).
     */
    public static function isGloballyEnabled(): bool
    {
        return SettingsService::isEnabled('allow_waitlist');
    }

    /**
     * Global toggle plus filters (Pro or custom code may require per-trip flags).
     *
     * @param object $trip Trip model from repository
     */
    public static function isAllowedForTrip(object $trip): bool
    {
        if (!self::isGloballyEnabled()) {
            return false;
        }

        return (bool) apply_filters('yatra_trip_allows_waitlist', true, $trip);
    }

    /**
     * True when this availability row cannot fit the party but waitlist may be offered.
     *
     * @param object|null $availability Resolved availability model or null (no strict cap)
     */
    public static function isInsufficientSeats(?object $availability, int $travelersCount): bool
    {
        if ($availability === null || $travelersCount < 1) {
            return false;
        }

        $available = (int) ($availability->seats_available ?? 0);

        return $available < $travelersCount;
    }

    /**
     * Optional per-trip max waitlist travelers (same departure) — 0 or null = unlimited.
     */
    public static function hasWaitlistCapacity(object $trip, int $availabilityId, int $additionalTravelers): bool
    {
        $cap = isset($trip->waitlist_capacity) ? (int) $trip->waitlist_capacity : 0;
        if ($cap <= 0) {
            return true;
        }

        $repo = new BookingRepository();
        $current = $repo->getTotalWaitlistTravelersForAvailability($availabilityId);

        return ($current + $additionalTravelers) <= $cap;
    }

    /**
     * Persist waitlist counter on the availability row (display / admin).
     */
    public static function incrementAvailabilityWaitlistCount(int $availabilityId, int $travelers): void
    {
        if ($availabilityId <= 0 || $travelers < 1) {
            return;
        }

        $repo = new AvailabilityRepository();
        $repo->incrementSeatsWaitlist($availabilityId, $travelers);
    }

    /**
     * Decrement seats_waitlist when a waitlisted booking is removed (cancel, refund, delete).
     *
     * @param object $booking Row as returned by BookingRepository::find (must reflect waitlist state).
     */
    public static function releaseWaitlistHolding(object $booking): void
    {
        if (($booking->status ?? '') !== 'waitlist') {
            return;
        }

        $availabilityId = (int) ($booking->availability_id ?? 0);
        $travelers = max(1, (int) ($booking->travelers_count ?? 1));

        if ($availabilityId <= 0) {
            return;
        }

        $repo = new AvailabilityRepository();
        $repo->incrementSeatsWaitlist($availabilityId, -$travelers);
    }

    /**
     * @param object|null $availability
     */
    public static function canJoinWaitlist(object $trip, $availability, int $travelersCount): bool
    {
        if (!self::isAllowedForTrip($trip)) {
            return false;
        }

        if ($availability === null) {
            return false;
        }

        if (!self::isInsufficientSeats($availability, $travelersCount)) {
            return false;
        }

        if (!self::hasWaitlistCapacity($trip, (int) $availability->id, $travelersCount)) {
            return false;
        }

        return (bool) apply_filters('yatra_can_join_waitlist', true, $trip, $availability, $travelersCount);
    }
}
