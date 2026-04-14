<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Shortcodes\ActivityShortcode;
use Yatra\Shortcodes\DestinationShortcode;

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
            'per_page' => 10,
            'columns' => 3,
            'title' => 'Our Trips',
            'show_pagination' => true,
        ];
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
            $trips_data = self::getTrips($atts);
            
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
            
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Yatra BlockDataService: Render successful, result length: ' . strlen($result));
            }
            
            return $result;
        } catch (\Exception $e) {
            // Return error message for debugging
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Yatra BlockDataService Exception: ' . $e->getMessage());
                error_log('Yatra BlockDataService Exception Trace: ' . $e->getTraceAsString());
                return '<div class="yatra-error">Trip rendering error: ' . esc_html($e->getMessage()) . ' in ' . esc_html($e->getFile()) . ':' . esc_html($e->getLine()) . '</div>';
            }
            return '<div class="yatra-error">Trip rendering failed</div>';
        } catch (\Error $e) {
            // Catch fatal errors too
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Yatra BlockDataService Error: ' . $e->getMessage());
                error_log('Yatra BlockDataService Error Trace: ' . $e->getTraceAsString());
                return '<div class="yatra-error">Trip rendering error: ' . esc_html($e->getMessage()) . ' in ' . esc_html($e->getFile()) . ':' . esc_html($e->getLine()) . '</div>';
            }
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
        wp_enqueue_style('yatra-trip-shortcode', \YATRA_PLUGIN_URL . 'assets/css/shortcodes/trip-shortcode.css', array(), '3.0.2.3');
        wp_enqueue_script('yatra-trip-shortcode', \YATRA_PLUGIN_URL . 'assets/js/trip-shortcode.js', array('jquery'), '3.0.2.3', true);
        
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
     * Get trips data - copied from TripShortcode
     */
    private static function getTrips(array $atts): array
    {
        try {
            $tripService = new \Yatra\Services\TripService();
            
            // Get current page from query string or attributes (for AJAX)
            $current_page = isset($atts['current_page']) ? (int) $atts['current_page'] : (isset($_GET['trip_page']) ? (int) $_GET['trip_page'] : 1);
            $per_page = max(1, (int) ($atts['per_page'] ?? 10));
            $offset = ($current_page - 1) * $per_page;

            $order = strtolower((string) ($atts['order'] ?? 'desc'));

            // Start with very basic arguments to ensure we get trips
            $args = [
                'limit' => $per_page,
                'offset' => $offset,
                'order_by' => 'created_at',
                'order' => $order === 'asc' ? 'ASC' : 'DESC',
            ];

            // Add featured filter if requested
            $featured = (string) ($atts['featured'] ?? '0');
            if ($featured === '1') {
                $args['where']['is_featured'] = 1;
            }

            // Get total count for pagination
            $count_args = $args;
            unset($count_args['limit']);
            unset($count_args['offset']);
            $total_trips = $tripService->count($count_args);

            // Get trips using the service
            $trips_data = $tripService->getActiveTrips($args);
            
 
            
            $trips = [];
            foreach ($trips_data as $tripData) {
                // Convert to Trip model
                $trip = \Yatra\Models\Trip::fromStdClass($tripData);
                
                // Add basic data needed for the card
                // Note: bookings_count and reviews will be added later
                // For now, we'll set default values to ensure basic functionality
                $trip->bookings_count = 0;
                $trip->reviews = [];
                
                $trips[] = $trip;
            }
            
            // Calculate pagination data
            $max_pages = $per_page > 0 ? ceil($total_trips / $per_page) : 1;

            return [
                'trips' => $trips,
                'max_pages' => $max_pages,
                'current_page' => $current_page,
                'total_found' => $total_trips,
                'debug_info' => [
                    'args_used' => $args,
                    'raw_count' => count($trips_data)
                ]
            ];
            
        } catch (\Exception $e) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Yatra BlockDataService Trip Error: ' . $e->getMessage());
            }
            
            return [
                'trips' => [],
                'max_pages' => 1,
                'current_page' => 1,
                'total_found' => 0
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
        ];
    }
}
