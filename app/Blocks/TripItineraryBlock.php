<?php

declare(strict_types=1);

namespace Yatra\Blocks;

/**
 * Trip Itinerary Block (yatra/trip-itinerary)
 *
 * The day-by-day itinerary (templates/partials/single-trip/content-itinerary.php).
 *
 * @package Yatra\Blocks
 * @since 3.1.4
 */
class TripItineraryBlock extends AbstractTripSectionBlock
{
    public function slug(): string
    {
        return 'trip-itinerary';
    }

    public function title(): string
    {
        return __('Trip Itinerary', 'yatra');
    }

    public function elementorIcon(): string
    {
        return 'eicon-time-line';
    }

    protected function renderSection(object $trip, array $attributes): void
    {
        unset($attributes);

        $tab = self::tab($trip, 'itinerary', __('Itinerary', 'yatra'), 'calendar');
        if (! self::hasContent($tab, $trip)) {
            return;
        }

        // The itinerary part looks up each photo's position in this list (built
        // by single-trip.php on the trip page): entry photos in order, plus one
        // slot per entry video.
        $images = [];
        foreach ($trip->getItineraryDays() as $day) {
            foreach ((array) ($day['entries'] ?? []) as $entry) {
                foreach ((array) ($entry['gallery'] ?? []) as $media) {
                    $images[] = is_array($media) ? (string) ($media['url'] ?? '') : '';
                }
                // single-trip.php adds a thumbnail slot for YouTube / Vimeo videos.
                $video = (string) ($entry['video_url'] ?? '');
                if ($video !== '' && preg_match('#youtube\.com|youtu\.be|vimeo\.com#i', $video)) {
                    $images[] = esc_url_raw($video);
                }
            }
        }
        $GLOBALS['yatra_itinerary_gallery_images'] = $images;

        yatra_get_template('partials/single-trip/content-itinerary', ['trip' => $trip, 'tab' => $tab]);
    }
}
