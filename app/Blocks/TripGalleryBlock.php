<?php

declare(strict_types=1);

namespace Yatra\Blocks;

/**
 * Trip Gallery Block (yatra/trip-gallery)
 *
 * The trip's photo grid (templates/partials/single-trip/content-gallery.php)
 * with the click-to-open gallery modal.
 *
 * @package Yatra\Blocks
 * @since 3.1.4
 */
class TripGalleryBlock extends AbstractTripSectionBlock
{
    public function slug(): string
    {
        return 'trip-gallery';
    }

    public function title(): string
    {
        return __('Trip Gallery', 'yatra');
    }

    public function elementorIcon(): string
    {
        return 'eicon-gallery-grid';
    }

    protected function renderSection(object $trip, array $attributes): void
    {
        unset($attributes);

        // Same list the hero builds for the gallery section and modal:
        // featured image first, then the gallery (see partials/single-trip/hero.php).
        $images = [];
        if (! empty($trip->featured_image_url)) {
            $images[] = (string) $trip->featured_image_url;
        }
        if (isset($trip->gallery_images) && is_array($trip->gallery_images)) {
            $images = array_merge($images, $trip->gallery_images);
        }
        $images = array_values(array_unique(array_filter($images, 'is_string')));
        if (empty($images)) {
            return;
        }

        $GLOBALS['yatra_hero_gallery_images'] = $images;
        yatra_get_template('partials/single-trip/content-gallery', [
            'trip' => $trip,
            'tab' => self::tab($trip, 'gallery', __('Photo Gallery', 'yatra'), 'camera'),
        ]);
        self::templateOnce('partials/single-trip/gallery-modal', ['trip' => $trip]);
    }
}
