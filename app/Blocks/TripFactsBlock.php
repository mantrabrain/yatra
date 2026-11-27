<?php

declare(strict_types=1);

namespace Yatra\Blocks;

/**
 * Trip Facts Block (yatra/trip-facts)
 *
 * Duration, difficulty, group size, rating … (partials/single-trip/quick-facts.php),
 * optionally followed by the trip's custom attributes (trip-attributes.php).
 *
 * @package Yatra\Blocks
 * @since 3.1.4
 */
class TripFactsBlock extends AbstractTripSectionBlock
{
    public function slug(): string
    {
        return 'trip-facts';
    }

    public function title(): string
    {
        return __('Trip Facts', 'yatra');
    }

    public function elementorIcon(): string
    {
        return 'eicon-bullet-list';
    }

    public function controls(): array
    {
        return array_merge(parent::controls(), [
            ['name' => 'showAttributes', 'type' => 'toggle', 'label' => __('Show trip attributes', 'yatra'), 'default' => true],
        ]);
    }

    protected function renderSection(object $trip, array $attributes): void
    {
        yatra_get_template('partials/single-trip/quick-facts', ['trip' => $trip]);

        if (self::bool($attributes['showAttributes'] ?? true, true) && ! empty($trip->getAttributes())) {
            yatra_get_template('partials/single-trip/trip-attributes', ['trip' => $trip]);
        }
    }
}
