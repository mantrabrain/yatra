<?php

declare(strict_types=1);

namespace Yatra\Blocks;

/**
 * Trip Map Block (yatra/trip-map)
 *
 * Start point and itinerary route map (partials/single-trip/content-location.php).
 *
 * @package Yatra\Blocks
 * @since 3.1.4
 */
class TripMapBlock extends AbstractTripSectionBlock
{
    public function slug(): string
    {
        return 'trip-map';
    }

    public function title(): string
    {
        return __('Trip Map', 'yatra');
    }

    public function elementorIcon(): string
    {
        return 'eicon-google-maps';
    }

    protected function renderSection(object $trip, array $attributes): void
    {
        unset($attributes);

        $tab = self::tab($trip, 'location', __('Location', 'yatra'), 'map-pin');
        if (! self::hasContent($tab, $trip)) {
            return;
        }

        yatra_get_template('partials/single-trip/content-location', [
            'trip' => $trip,
            'tab' => $tab,
            'itinerary_entries' => (new \Yatra\Repositories\ItineraryRepository())->getEntriesWithCoordinatesForMap((int) $trip->id),
        ]);
    }
}
