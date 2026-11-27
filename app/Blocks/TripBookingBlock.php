<?php

declare(strict_types=1);

namespace Yatra\Blocks;

/**
 * Trip Booking Block (yatra/trip-booking)
 *
 * Price, departure picker, travellers and "Check availability" — the booking
 * card from the trip page sidebar (partials/single-trip/content-sidebar.php),
 * plus the enquiry modal it opens.
 *
 * @package Yatra\Blocks
 * @since 3.1.4
 */
class TripBookingBlock extends AbstractTripSectionBlock
{
    public function slug(): string
    {
        return 'trip-booking';
    }

    public function title(): string
    {
        return __('Trip Booking Card', 'yatra');
    }

    public function elementorIcon(): string
    {
        return 'eicon-price-table';
    }

    /** Trip id of the booking card already on this page. */
    private static ?int $renderedTripId = null;

    protected function needsOwnTripData(): bool
    {
        return true;
    }

    /**
     * One booking card per page: its scripts, element ids and enquiry form
     * are page-wide, so a second card (or one on a trip page, which already
     * has its own) would book or enquire for the wrong trip.
     *
     * @param array<string, mixed> $attributes
     */
    public function render(array $attributes): string
    {
        if (function_exists('yatra_is_single_trip') && yatra_is_single_trip()) {
            return $this->staffNotice(__('This page already shows the trip\'s own booking card, so this block is hidden.', 'yatra'));
        }
        if (self::$renderedTripId !== null) {
            return $this->staffNotice(__('Only one booking card can be shown per page; this one is hidden.', 'yatra'));
        }
        $html = parent::render($attributes);
        if ($html !== '') {
            $resolved = self::resolveTrip((int) ($attributes['tripId'] ?? 0));
            self::$renderedTripId = $resolved ? (int) $resolved->id : 0;
        }

        return $html;
    }

    private function staffNotice(string $message): string
    {
        if (!current_user_can('edit_posts')) {
            return '';
        }

        return '<div class="yatra-trip-block-notice">' . esc_html(sprintf(
            /* translators: 1: block title, 2: explanation. */
            __('%1$s: %2$s', 'yatra'),
            $this->title(),
            $message
        )) . '</div>';
    }

    protected function renderSection(object $trip, array $attributes): void
    {
        unset($attributes);

        // Same pricing inputs single-trip.php passes to the sidebar.
        $pricing = yatra_single_trip_calculate_base_price($trip);

        yatra_get_template('partials/single-trip/content-sidebar', [
            'trip' => $trip,
            'has_availability' => $pricing['has_availability'],
            'has_traveler_pricing' => $pricing['has_traveler_pricing'],
            'base_price' => $pricing['base_price'],
            'pricing_type' => $pricing['pricing_type'],
        ]);
        self::templateOnce('partials/single-trip/enquiry-modal', ['trip' => $trip]);
    }
}
