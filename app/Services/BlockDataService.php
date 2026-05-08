<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Helpers\TripListingFilterBuilder;
use Yatra\Repositories\TripRepository;
use Yatra\Shortcodes\ActivityShortcode;
use Yatra\Shortcodes\DestinationShortcode;
use Yatra\Shortcodes\TripCategoryShortcode;

/**
 * Block Data Service
 * 
 * Shared service for rendering blocks and shortcodes
 * Provides reusable data fetching and template rendering logic
 * 
 * @package Yatra\Services
 * @since 3.0.0
 */
class BlockDataService
{
    /** Max grid columns for tour / activity / destination listing blocks (matches block editor RangeControl). */
    private const LISTING_COLUMNS_MAX = 6;

    /**
     * Defaults aligned with each block's block.json (REST and ServerSideRender rely on full merge).
     *
     * @return array<string, mixed>
     */
    private static function defaultTourBlockAttributes(): array
    {
        return [
            'order' => 'desc',
            'featured' => false,
            'featured_priority' => '',
            'featuredPriority' => '',
            'per_page' => 10,
            'columns' => 3,
            'title' => 'Our Trips',
            'show_pagination' => true,
            'destinationIds' => [],
            'activityIds' => [],
            'categoryIds' => [],
            'difficultyIds' => [],
            'destination' => '',
            'activity' => '',
            'category' => '',
            'destination_ids' => '',
            'activity_ids' => '',
            'category_ids' => '',
            'difficulty' => '',
            'price_min' => '',
            'price_max' => '',
            'duration_min' => '',
            'duration_max' => '',
            'search' => '',
        ];
    }

    /** Allowed values for the trip "Featured Priority" filter (matches admin TripForm). */
    private const FEATURED_PRIORITY_VALUES = ['featured', 'new', 'limited'];

    /**
     * Trip listing for shortcodes, AJAX pagination, and programmatic use.
     *
     * @param array<string, mixed> $rawAtts
     *
     * @return array{trips: \Yatra\Models\Trip[], max_pages: int, current_page: int, total_found: int}
     */
    public static function getTripListingForShortcode(array $rawAtts): array
    {
        $atts = wp_parse_args(is_array($rawAtts) ? $rawAtts : [], self::defaultTourBlockAttributes());
        self::normalizeTripShortcodeAttributes($atts);

        return self::queryTripsForAtts($atts);
    }

    /**
     * @return array<string, mixed>
     */
    private static function defaultActivityBlockAttributes(): array
    {
        return [
            'order' => 'asc',
            'columns' => 3,
            'per_page' => 10,
            'title' => 'Activity Listings',
            'show_pagination' => true,
            'activityIds' => [],
            'activity' => '',
            'activity_ids' => '',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function defaultDestinationBlockAttributes(): array
    {
        return [
            'order' => 'asc',
            'columns' => 3,
            'per_page' => 10,
            'title' => 'Destination Showcase',
            'show_pagination' => true,
            'destinationIds' => [],
            'destination' => '',
            'destination_ids' => '',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function defaultTripCategoryBlockAttributes(): array
    {
        return [
            'order' => 'desc',
            'columns' => 3,
            'per_page' => 10,
            'title' => 'Trip Categories',
            'show_pagination' => true,
            'category' => '',
            'show_trip_count' => true,
            'show_description' => true,
            'show_image' => true,
            'hide_empty' => true,
            'featured_only' => false,
            'categoryIds' => [],
            'category_ids' => '',
        ];
    }

    /**
     * Coerce REST/block booleans and legacy string values.
     *
     * @param mixed $value
     */
    private static function coerceToBool($value, bool $default): bool
    {
        if ($value === null || $value === '') {
            return $default;
        }
        if (is_bool($value)) {
            return $value;
        }
        if (is_int($value) || is_float($value)) {
            return (bool) $value;
        }
        $s = strtolower((string) $value);

        return in_array($s, ['1', 'true', 'yes', 'on'], true);
    }

    /**
     * Normalize trip/tour attributes in place (shortcode extras like category are preserved).
     *
     * @param array<string, mixed> $atts
     */
    private static function normalizeTripShortcodeAttributes(array &$atts): void
    {
        $order = strtolower((string) ($atts['order'] ?? 'desc'));
        $atts['order'] = in_array($order, ['asc', 'desc'], true) ? $order : 'desc';

        $atts['featured'] = self::coerceToBool($atts['featured'] ?? false, false) ? '1' : '0';

        $perPage = (int) ($atts['per_page'] ?? 10);
        if ($perPage === -1) {
            $perPage = 10;
        }
        $atts['per_page'] = (string) max(1, min(100, $perPage));

        $cols = (int) ($atts['columns'] ?? 3);
        $atts['columns'] = (string) max(1, min(self::LISTING_COLUMNS_MAX, $cols));

        $atts['title'] = sanitize_text_field((string) ($atts['title'] ?? 'Our Trips'));

        $atts['show_pagination'] = self::coerceToBool($atts['show_pagination'] ?? true, true) ? 'yes' : 'no';

        // Featured Priority (matches admin form: featured | new | limited; "none"/empty = no filter).
        // Accept both snake_case (shortcode) and camelCase (Gutenberg block attribute).
        $featuredPriorityRaw = '';
        if (isset($atts['featured_priority']) && is_string($atts['featured_priority']) && $atts['featured_priority'] !== '') {
            $featuredPriorityRaw = $atts['featured_priority'];
        } elseif (isset($atts['featuredPriority']) && is_string($atts['featuredPriority']) && $atts['featuredPriority'] !== '') {
            $featuredPriorityRaw = $atts['featuredPriority'];
        }
        $featuredPriority = strtolower(trim((string) $featuredPriorityRaw));
        if ($featuredPriority === 'none') {
            $featuredPriority = '';
        }
        if ($featuredPriority !== '' && !in_array($featuredPriority, self::FEATURED_PRIORITY_VALUES, true)) {
            $featuredPriority = '';
        }
        $atts['featured_priority'] = $featuredPriority;
    }

    /**
     * Render trip/tour - Shared method for both blocks and shortcodes
     * 
     * @param array $attributes Block or shortcode attributes
     * @return string Rendered HTML
     */
    public static function renderTrip(array $attributes): string
    {
        try {
            $atts = wp_parse_args(is_array($attributes) ? $attributes : [], self::defaultTourBlockAttributes());
            self::normalizeTripShortcodeAttributes($atts);

            // Get trips using Yatra's service
            $trips_data = self::queryTripsForAtts($atts);
            
            $per_page = max(1, (int) ($atts['per_page'] ?? 10));
            $atts['per_page'] = $per_page;

            // Prepare data for template
            $data = [
                'trips' => [
                    'trips' => $trips_data['trips'] ?? [],
                    'max_pages' => $trips_data['max_pages'] ?? 1,
                    'current_page' => $trips_data['current_page'] ?? 1,
                    'total_found' => $trips_data['total_found'] ?? 0,
                    'per_page' => $per_page
                ],
                'atts' => $atts,
                'current_page' => $trips_data['current_page'] ?? 1,
                'max_pages' => $trips_data['max_pages'] ?? 1,
                'total_found' => $trips_data['total_found'] ?? 0,
                'per_page' => $per_page
            ];

            // Enqueue assets
            self::enqueueTripAssets();

            // Load template
            $result = self::loadTemplate('shortcodes/trip.php', $data);

            
            return $result;
        } catch (\Exception $e) {

            return '<div class="yatra-error">Trip rendering failed</div>';
        } catch (\Error $e) {

            return '<div class="yatra-error">Trip rendering failed</div>';
        }
    }

    /**
     * Render trip/tour block - Backward compatibility method
     * 
     * @param array $attributes Block attributes
     * @return string Rendered HTML
     */
    public static function renderTripBlock(array $attributes): string
    {
        return self::renderTrip($attributes);
    }

    /**
     * Enqueue trip assets
     */
    private static function enqueueTripAssets(): void
    {
        \Yatra\Providers\FrontendAssetsProvider::registerCoreFrontendStylesheets();
        $cssPath = \YATRA_PLUGIN_PATH . 'assets/css/shortcodes/trip-shortcode.css';
        $cssVer = is_readable($cssPath) ? \YATRA_VERSION . '.' . filemtime($cssPath) : \YATRA_VERSION;
        wp_enqueue_style(
            'yatra-trip-shortcode',
            \YATRA_PLUGIN_URL . 'assets/css/shortcodes/trip-shortcode.css',
            \Yatra\Providers\FrontendAssetsProvider::shortcodeStyleDependencies(),
            $cssVer
        );
        wp_enqueue_script('yatra-trip-shortcode', \YATRA_PLUGIN_URL . 'assets/js/trip-shortcode.js', array('jquery'), \YATRA_VERSION, true);
        
        // Localize script for AJAX
        wp_localize_script('yatra-trip-shortcode', 'yatraTripShortcode', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('yatra_trip_shortcode_nonce')
        ]);
    }

    /**
     * Load template file
     */
    private static function loadTemplate(string $template_path, array $data = []): string
    {
        $full_path = \YATRA_PLUGIN_PATH . 'templates/' . $template_path;
        
        if (!file_exists($full_path)) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                return sprintf(
                    '<div class="yatra-error">Template not found: %s</div>',
                    esc_html($full_path)
                );
            }
            return '';
        }

        // Extract data to make variables available in template
        if (!empty($data)) {
            extract($data);
        }

        ob_start();
        include $full_path;
        return ob_get_clean();
    }

    /**
     * @param array<string, mixed> $atts
     *
     * @return array{trips: \Yatra\Models\Trip[], max_pages: int, current_page: int, total_found: int}
     */
    private static function queryTripsForAtts(array $atts): array
    {
        try {
            $tripRepository = new TripRepository();

            $current_page = isset($atts['current_page'])
                ? (int) $atts['current_page']
                : (isset($_GET['trip_page']) ? (int) $_GET['trip_page'] : 1);
            $current_page = max(1, $current_page);

            $per_page = max(1, (int) ($atts['per_page'] ?? 10));

            $filters = TripListingFilterBuilder::buildFindWithFiltersArray($atts);
            $result = $tripRepository->findWithFilters($filters, $current_page, $per_page);

            $trips = [];
            foreach (($result['trips'] ?? []) as $tripData) {
                $trip = \Yatra\Models\Trip::fromStdClass($tripData);
                if (isset($tripData->booking_count)) {
                    $trip->bookings_count = (int) $tripData->booking_count;
                }
                if (isset($tripData->review_count)) {
                    $trip->reviews_count = (int) $tripData->review_count;
                }
                if (isset($tripData->average_rating)) {
                    $ar = (float) $tripData->average_rating;
                    $trip->average_rating = $ar;
                    $trip->avg_rating = $ar;
                }
                $trip->reviews = [];

                $trips[] = $trip;
            }

            return [
                'trips' => $trips,
                'max_pages' => max(1, (int) ($result['pages'] ?? 1)),
                'current_page' => max(1, (int) ($result['page'] ?? $current_page)),
                'total_found' => (int) ($result['total'] ?? 0),
            ];
        } catch (\Exception $e) {
            return [
                'trips' => [],
                'max_pages' => 1,
                'current_page' => 1,
                'total_found' => 0,
            ];
        }
    }

    /**
     * Render activity block or shortcode
     * 
     * @param array $attributes Block or shortcode attributes
     * @return string Rendered HTML
     */
    public static function renderActivityBlock(array $attributes): string
    {
        // Create shortcode instance to reuse its logic
        $shortcode = new ActivityShortcode();

        $merged = wp_parse_args(is_array($attributes) ? $attributes : [], self::defaultActivityBlockAttributes());

        // Use shortcode's render method
        return $shortcode->render(self::mapActivityAttributes($merged));
    }
    
    /**
     * Render destination block or shortcode
     * 
     * @param array $attributes Block or shortcode attributes
     * @return string Rendered HTML
     */
    public static function renderDestinationBlock(array $attributes): string
    {
        // Create shortcode instance to reuse its logic
        $shortcode = new DestinationShortcode();

        $merged = wp_parse_args(is_array($attributes) ? $attributes : [], self::defaultDestinationBlockAttributes());

        // Use shortcode's render method
        return $shortcode->render(self::mapDestinationAttributes($merged));
    }

    /**
     * Render trip category block (same card UI as destinations).
     *
     * @param array<string, mixed> $attributes
     */
    public static function renderTripCategoryBlock(array $attributes): string
    {
        $shortcode = new TripCategoryShortcode();
        $merged = wp_parse_args(is_array($attributes) ? $attributes : [], self::defaultTripCategoryBlockAttributes());

        return $shortcode->render(self::mapTripCategoryAttributes($merged));
    }

    /**
     * @param array<string, mixed> $attributes
     * @param string ...$legacyCsvKeys
     */
    private static function classificationIdsCsvForShortcode(
        array $attributes,
        string $arrayKey,
        string ...$legacyCsvKeys
    ): string {
        $ids = TripListingFilterBuilder::positiveIntIdsFromAtts($attributes, $arrayKey, ...$legacyCsvKeys);

        return $ids === [] ? '' : implode(',', $ids);
    }

    /**
     * Map activity block attributes to shortcode format (full set for shortcode_atts merge).
     *
     * @param array<string, mixed> $attributes Merged with defaults
     * @return array<string, string>
     */
    private static function mapActivityAttributes(array $attributes): array
    {
        $order = strtolower((string) ($attributes['order'] ?? 'asc'));
        $order = in_array($order, ['asc', 'desc'], true) ? $order : 'asc';

        $perPage = (int) ($attributes['per_page'] ?? 10);
        if ($perPage === -1) {
            $perPage = 10;
        }
        $perPage = max(1, min(100, $perPage));

        $cols = max(1, min(self::LISTING_COLUMNS_MAX, (int) ($attributes['columns'] ?? 3)));

        $showPag = self::coerceToBool($attributes['show_pagination'] ?? true, true);

        return [
            'order' => $order,
            'per_page' => (string) $perPage,
            'columns' => (string) $cols,
            'title' => sanitize_text_field((string) ($attributes['title'] ?? 'Activity Listings')),
            'show_pagination' => $showPag ? 'yes' : 'no',
            'activity' => self::classificationIdsCsvForShortcode(
                $attributes,
                'activityIds',
                'activity_ids',
                'activity'
            ),
        ];
    }

    /**
     * @param array<string, mixed> $attributes Merged with defaults
     * @return array<string, string>
     */
    private static function mapDestinationAttributes(array $attributes): array
    {
        $order = strtolower((string) ($attributes['order'] ?? 'asc'));
        $order = in_array($order, ['asc', 'desc'], true) ? $order : 'asc';

        $perPage = (int) ($attributes['per_page'] ?? 10);
        if ($perPage === -1) {
            $perPage = 10;
        }
        $perPage = max(1, min(100, $perPage));

        $cols = max(1, min(self::LISTING_COLUMNS_MAX, (int) ($attributes['columns'] ?? 3)));

        $showPag = self::coerceToBool($attributes['show_pagination'] ?? true, true);

        return [
            'order' => $order,
            'per_page' => (string) $perPage,
            'columns' => (string) $cols,
            'title' => sanitize_text_field((string) ($attributes['title'] ?? 'Destination Showcase')),
            'show_pagination' => $showPag ? 'yes' : 'no',
            'destination' => self::classificationIdsCsvForShortcode(
                $attributes,
                'destinationIds',
                'destination_ids',
                'destination'
            ),
        ];
    }

    /**
     * @param array<string, mixed> $attributes
     * @return array<string, string>
     */
    private static function mapTripCategoryAttributes(array $attributes): array
    {
        $order = strtolower((string) ($attributes['order'] ?? 'desc'));
        $order = in_array($order, ['asc', 'desc'], true) ? $order : 'desc';

        $perPage = (int) ($attributes['per_page'] ?? 10);
        if ($perPage === -1) {
            $perPage = 10;
        }
        $perPage = max(1, min(100, $perPage));

        $cols = max(1, min(self::LISTING_COLUMNS_MAX, (int) ($attributes['columns'] ?? 3)));

        $showPag = self::coerceToBool($attributes['show_pagination'] ?? true, true);
        $showTripCount = self::coerceToBool($attributes['show_trip_count'] ?? true, true);
        $showDescription = self::coerceToBool($attributes['show_description'] ?? true, true);
        $showImage = self::coerceToBool($attributes['show_image'] ?? true, true);
        $hideEmpty = self::coerceToBool($attributes['hide_empty'] ?? true, true);
        $featuredOnly = self::coerceToBool($attributes['featured_only'] ?? false, false);

        return [
            'order' => $order,
            'per_page' => (string) $perPage,
            'columns' => (string) $cols,
            'title' => sanitize_text_field((string) ($attributes['title'] ?? 'Trip Categories')),
            'show_pagination' => $showPag ? 'yes' : 'no',
            'category' => self::classificationIdsCsvForShortcode(
                $attributes,
                'categoryIds',
                'category_ids',
                'category'
            ),
            'show_trip_count' => $showTripCount ? 'yes' : 'no',
            'show_description' => $showDescription ? 'yes' : 'no',
            'show_image' => $showImage ? 'yes' : 'no',
            'hide_empty' => $hideEmpty ? 'yes' : 'no',
            'featured_only' => $featuredOnly ? 'yes' : 'no',
        ];
    }
}
