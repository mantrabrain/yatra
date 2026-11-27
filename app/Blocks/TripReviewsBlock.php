<?php

declare(strict_types=1);

namespace Yatra\Blocks;

/**
 * Trip Reviews Block (yatra/trip-reviews)
 *
 * Rating summary, reviews and the review form (partials/single-trip/reviews.php).
 * Shows nothing while reviews are switched off in Settings.
 *
 * @package Yatra\Blocks
 * @since 3.1.4
 */
class TripReviewsBlock extends AbstractTripSectionBlock
{
    public function slug(): string
    {
        return 'trip-reviews';
    }

    public function title(): string
    {
        return __('Trip Reviews', 'yatra');
    }

    public function elementorIcon(): string
    {
        return 'eicon-rating';
    }

    protected function renderSection(object $trip, array $attributes): void
    {
        unset($attributes);

        if (yatra_reviews_enabled()) {
            yatra_get_template('partials/single-trip/reviews', ['trip' => $trip]);
        }
    }
}
