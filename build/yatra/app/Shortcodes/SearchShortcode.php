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
    private static bool $tripSearchAssetsQueued = false;

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

        // [yatra_search] may appear in posts, widgets, builders, FSE templates, or do_shortcode()
        // with no reliable way to detect that before output. Enqueue on every public frontend
        // request so styles always print in wp_head (avoids FOUC). Rules are scoped to
        // .yatra-trip-search-shortcode in trip-search-shortcode.css.
        add_action('wp_enqueue_scripts', [self::class, 'enqueueTripSearchAssets'], 10);
    }

    /**
     * Enqueue trip search bar CSS/JS for head output. Idempotent per request.
     */
    public static function enqueueTripSearchAssets(): void
    {
        if (is_admin() || is_feed()) {
            return;
        }
        if (self::$tripSearchAssetsQueued) {
            return;
        }
        self::$tripSearchAssetsQueued = true;

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

        $tripSearchJsPath = YATRA_PLUGIN_PATH . 'assets/js/trip-search-shortcode.js';
        $tripSearchJsVer = is_readable($tripSearchJsPath)
            ? (string) filemtime($tripSearchJsPath)
            : YATRA_VERSION;
        wp_enqueue_script(
            'yatra-trip-search-shortcode',
            YATRA_PLUGIN_URL . 'assets/js/trip-search-shortcode.js',
            ['jquery'],
            $tripSearchJsVer,
            true
        );

        $listing_url = \function_exists('yatra_get_trip_listing_url')
            ? \yatra_get_trip_listing_url()
            : \trailingslashit(\home_url('/trip/'));

        wp_localize_script(
            'yatra-trip-search-shortcode',
            'yatraTripSearchConfig',
            [
                'listingUrl' => $listing_url,
            ]
        );
    }

    /**
     * Render the search shortcode content
     */
    protected function renderContent(array $atts): string
    {
        $atts = shortcode_atts($this->default_attributes, $atts, $this->tag);

        // Same source as trip listing sidebar filters: published classifications.
        // TripRepository::*ForSearch() only returned rows linked via trip_classifications,
        // so empty relations hid all dropdown options.
        $destinationRepository = new \Yatra\Repositories\DestinationRepository();
        $activityRepository = new \Yatra\Repositories\ActivityRepository();
        $destinations = $destinationRepository->getPublished();
        $activities = $activityRepository->getPublished();
        $tripListingService = new \Yatra\Services\TripListingService();
        $tripRepository = new \Yatra\Repositories\TripRepository();

        $listing_url = \function_exists('yatra_get_trip_listing_url')
            ? \yatra_get_trip_listing_url()
            : \trailingslashit(\home_url('/trip/'));

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
