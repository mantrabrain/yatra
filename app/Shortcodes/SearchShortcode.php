<?php

declare(strict_types=1);

namespace Yatra\Shortcodes;

/**
 * Search Shortcode
 *
 * Displays advanced tour search functionality
 */
class SearchShortcode extends BaseShortcode
{
    public function __construct()
    {
        parent::__construct('yatra_search', [
            'show_filters' => 'yes',
            'show_categories' => 'yes',
            'show_destinations' => 'yes',
            'show_activities' => 'yes',
            'show_price_range' => 'yes',
            'show_duration' => 'yes',
            'show_difficulty' => 'yes',
            'placeholder' => 'Search for tours...',
            'button_text' => 'Search Tours'
        ]);
    }

    /**
     * Render the search shortcode content
     */
    protected function renderContent(array $atts): string
    {
        $atts = shortcode_atts($this->default_attributes, $atts, $this->tag);
        
        // Enqueue search CSS after theme (no deps) — filemtime busts cache when stylesheet changes.
        $tripSearchCssPath = YATRA_PLUGIN_PATH . 'assets/css/shortcodes/trip-search-shortcode.css';
        $tripSearchCssVer = is_readable($tripSearchCssPath)
            ? (string) filemtime($tripSearchCssPath)
            : YATRA_VERSION;
        wp_enqueue_style(
            'yatra-trip-search-shortcode',
            YATRA_PLUGIN_URL . 'assets/css/shortcodes/trip-search-shortcode.css',
            [],
            $tripSearchCssVer
        );
        
        // Enqueue JavaScript for dropdown interactions
        wp_enqueue_script(
            'yatra-trip-search-shortcode',
            YATRA_PLUGIN_URL . 'assets/js/trip-search-shortcode.js',
            ['jquery'],
            YATRA_VERSION,
            true
        );

        $listing_url = \function_exists('yatra_get_trip_listing_url')
            ? \yatra_get_trip_listing_url()
            : \trailingslashit(\home_url('/trip/'));

        \wp_localize_script(
            'yatra-trip-search-shortcode',
            'yatraTripSearchConfig',
            [
                'listingUrl' => $listing_url,
            ]
        );

        // Same source as trip listing sidebar filters: published classifications.
        // TripRepository::*ForSearch() only returned rows linked via trip_classifications,
        // so empty relations hid all dropdown options.
        $destinationRepository = new \Yatra\Repositories\DestinationRepository();
        $activityRepository = new \Yatra\Repositories\ActivityRepository();
        $destinations = $destinationRepository->getPublished();
        $activities = $activityRepository->getPublished();
        $tripListingService = new \Yatra\Services\TripListingService();
        $tripRepository = new \Yatra\Repositories\TripRepository();

        return $this->loadTemplate('shortcodes/trip-search.php', [
            'atts' => $atts,
            'destinations' => $destinations,
            'activities' => $activities,
            'listing_url' => $listing_url,
            'duration_bounds' => $tripRepository->getDurationDaysBounds(),
            'budget_presets' => $tripListingService->getSearchBudgetPresets(),
        ]);
    }
}
