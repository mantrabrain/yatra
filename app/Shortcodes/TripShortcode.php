<?php

declare(strict_types=1);

namespace Yatra\Shortcodes;

/**
 * Trip Shortcode
 *
 * Displays trips with various filtering options using trip-listing-card.php template
 */
class TripShortcode extends BaseShortcode
{
    public function __construct()
    {
        parent::__construct('yatra_tour', [
            'order' => 'asc',
            'featured' => '0',
            'featured_priority' => '',
             'per_page' => '10',
            'category' => '',
            'destination' => '',
            'activity' => '',
            'difficulty' => '',
            'price_min' => '',
            'price_max' => '',
            'duration_min' => '',
            'duration_max' => '',
            'search' => '',
            'columns' => '3',
            'show_pagination' => 'yes',
            'title' => 'Our Trips'
        ]);
    }

    /**
     * Register the shortcode
     */
    public function register(): void
    {
        // Register both shortcode tags
        add_shortcode('yatra_tour', [$this, 'render']);
        add_shortcode('yatra_trip', [$this, 'render']);
    }

    /**
     * Render the trip shortcode content
     */
    protected function renderContent(array $atts): string
    {
        // Use the shared BlockDataService method
        return \Yatra\Services\BlockDataService::renderTrip($atts);
    }

    /**
     * Get trips using Yatra's service
     */
    public function getTrips(array $atts): array
    {
        return \Yatra\Services\BlockDataService::getTripListingForShortcode($atts);
    }

}
