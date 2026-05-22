<?php

declare(strict_types=1);

namespace Yatra\Hooks;

use Yatra\Repositories\SavedTripRepository;

/**
 * Saved Trip (Wishlist) Hooks
 *
 * Keeps the wishlist meta in sync with the trip lifecycle: when a trip is
 * deleted, its ID is purged from every user's saved-trips meta so orphan
 * IDs don't accumulate forever.
 */
class SavedTripHooks
{
    public static function init(): void
    {
        add_action('yatra_trip_deleted', [self::class, 'onTripDeleted'], 10, 1);
    }

    /**
     * Garbage-collect a deleted trip's ID from every user's wishlist.
     */
    public static function onTripDeleted($tripId): void
    {
        $tripId = (int) $tripId;
        if ($tripId <= 0) {
            return;
        }
        try {
            (new SavedTripRepository())->removeTripFromAllUsers($tripId);
        } catch (\Throwable $e) {
            // Don't let cleanup failure break the trip-delete flow.
        }
    }
}
