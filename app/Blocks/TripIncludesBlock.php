<?php

declare(strict_types=1);

namespace Yatra\Blocks;

/**
 * Trip Includes Block (yatra/trip-includes)
 *
 * What's included / not included (partials/single-trip/content-included-excluded.php).
 *
 * @package Yatra\Blocks
 * @since 3.1.4
 */
class TripIncludesBlock extends AbstractTripSectionBlock
{
    public function slug(): string
    {
        return 'trip-includes';
    }

    public function title(): string
    {
        return __('Trip Includes & Excludes', 'yatra');
    }

    public function elementorIcon(): string
    {
        return 'eicon-check-circle';
    }

    protected function renderSection(object $trip, array $attributes): void
    {
        unset($attributes);

        $tab = self::tab($trip, 'included_excluded', __('Included', 'yatra'), 'check');
        if (self::hasContent($tab, $trip)) {
            yatra_get_template('partials/single-trip/content-included-excluded', ['trip' => $trip, 'tab' => $tab]);
        }
    }
}
