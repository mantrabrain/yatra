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
            'button_text' => 'Search Tours',
            // Per-field visibility overrides. Empty string = inherit the global
            // Settings → Search & Listing toggle (so [yatra_search] is unchanged).
            // Pass yes/no (or true/false, on/off, 1/0) to force a field on/off for
            // this one placement, e.g. [yatra_search budget="no" keyword="yes"].
            'keyword' => '',
            'destination' => '',
            'activities' => '',
            'duration' => '',
            'budget' => '',
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
            'field_visibility' => $this->resolveFieldVisibility($atts),
        ]);
    }

    /**
     * Resolve which search fields are visible for THIS shortcode instance.
     *
     * Each field follows the rule: an explicit shortcode attribute wins; when the
     * attribute is omitted (empty), inherit the global Settings → Search & Listing
     * toggle. This keeps a bare [yatra_search] identical to before while allowing
     * per-placement overrides like [yatra_search budget="no"].
     *
     * @param array<string,mixed> $atts Resolved shortcode attributes.
     * @return array<string,bool>  Keyed by field: keyword/destination/activities/duration/budget.
     */
    private function resolveFieldVisibility(array $atts): array
    {
        $resolve = static function ($attr_value, string $setting_key): bool {
            $value = strtolower(trim((string) $attr_value));
            if ($value === '') {
                // No override → inherit the global toggle (defaults to true).
                return \Yatra\Services\SettingsService::isEnabled($setting_key);
            }
            if (\in_array($value, ['1', 'yes', 'true', 'on', 'show'], true)) {
                return true;
            }
            if (\in_array($value, ['0', 'no', 'false', 'off', 'hide'], true)) {
                return false;
            }
            // Unrecognised value → fall back to the global toggle, never guess.
            return \Yatra\Services\SettingsService::isEnabled($setting_key);
        };

        return [
            'keyword'     => $resolve($atts['keyword'] ?? '', 'search_show_keyword'),
            'destination' => $resolve($atts['destination'] ?? '', 'search_show_destination'),
            'activities'  => $resolve($atts['activities'] ?? '', 'search_show_activities'),
            'duration'    => $resolve($atts['duration'] ?? '', 'search_show_duration'),
            'budget'      => $resolve($atts['budget'] ?? '', 'search_show_budget'),
        ];
    }
}
