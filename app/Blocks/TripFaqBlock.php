<?php

declare(strict_types=1);

namespace Yatra\Blocks;

/**
 * Trip FAQ Block (yatra/trip-faq)
 *
 * The trip's frequently asked questions (partials/single-trip/content-faq.php).
 *
 * @package Yatra\Blocks
 * @since 3.1.4
 */
class TripFaqBlock extends AbstractTripSectionBlock
{
    public function slug(): string
    {
        return 'trip-faq';
    }

    public function title(): string
    {
        return __('Trip FAQ', 'yatra');
    }

    public function elementorIcon(): string
    {
        return 'eicon-accordion';
    }

    protected function renderSection(object $trip, array $attributes): void
    {
        unset($attributes);

        $tab = self::tab($trip, 'faq', __('FAQ', 'yatra'), 'help-circle');
        if (self::hasContent($tab, $trip)) {
            yatra_get_template('partials/single-trip/content-faq', ['trip' => $trip, 'tab' => $tab]);
        }
    }
}
