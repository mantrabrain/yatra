<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Shortcodes\TripShortcode;
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
    /**
     * Render trip/tour - Shared method for both blocks and shortcodes
     * 
     * @param array $attributes Block or shortcode attributes
     * @return string Rendered HTML
     */
    public static function renderTrip(array $attributes): string
    {
        try {
            // Map attributes to expected format
            $atts = self::mapTripAttributes($attributes);
            
            // Get trips using Yatra's service
            $trips_data = self::getTrips($atts);
            
            // Extract per_page from attributes
            $per_page = 10; // default
            if (!empty($atts['per_page']) && is_numeric($atts['per_page'])) {
                $per_page = (int) $atts['per_page'];
            }
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
        wp_enqueue_style('yatra-trip-shortcode', \YATRA_PLUGIN_URL . 'assets/css/shortcodes/trip-shortcode.css', array(), '3.0.0');
        wp_enqueue_script('yatra-trip-shortcode', \YATRA_PLUGIN_URL . 'assets/js/trip-shortcode.js', array('jquery'), '3.0.0', true);
        
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
            // Use per_page parameter only
            $per_page = (int) $atts['per_page'];
            $offset = ($current_page - 1) * $per_page;
            
               // Start with very basic arguments to ensure we get trips
            $args = [
                'limit' => $per_page,
                'offset' => $offset,
                'order_by' => 'created_at',
                'order' => $atts['order'] === 'asc' ? 'ASC' : 'DESC'
            ];

            // Add featured filter if requested
            if ($atts['featured'] === '1') {
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
        
        // Map block attributes to shortcode attributes
        $shortcodeAtts = self::mapActivityAttributes($attributes);
        
        // Use shortcode's render method
        return $shortcode->render($shortcodeAtts);
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
        
        // Map block attributes to shortcode attributes
        $shortcodeAtts = self::mapDestinationAttributes($attributes);
        
        // Use shortcode's render method
        return $shortcode->render($shortcodeAtts);
    }
    
    /**
     * Map trip/tour block attributes to shortcode format
     * Handles backward compatibility with old plugin's posts_per_page
     * 
     * @param array $attributes Block attributes
     * @return array Shortcode attributes
     */
    private static function mapTripAttributes(array $attributes): array
    {
        $mapped = [];
        
        // Order
        if (isset($attributes['order'])) {
            $mapped['order'] = in_array(strtolower($attributes['order']), ['asc', 'desc']) 
                ? strtolower($attributes['order']) 
                : 'desc';
        }
        
        // Featured
        if (isset($attributes['featured'])) {
            $mapped['featured'] = $attributes['featured'] ? '1' : '0';
        }
        
        // Per page
        if (isset($attributes['per_page'])) {
            $mapped['per_page'] = max(1, (int) $attributes['per_page']);
        }
        
        // Columns
        if (isset($attributes['columns'])) {
            $mapped['columns'] = (string) max(1, min(4, (int) $attributes['columns']));
        }
        
        // Title
        if (isset($attributes['title'])) {
            $mapped['title'] = sanitize_text_field($attributes['title']);
        }
        
        // Show pagination
        if (isset($attributes['show_pagination'])) {
            $mapped['show_pagination'] = $attributes['show_pagination'] ? 'yes' : 'no';
        }
        
        return $mapped;
    }
    
    /**
     * Map activity block attributes to shortcode format
     * 
     * @param array $attributes Block attributes
     * @return array Shortcode attributes
     */
    private static function mapActivityAttributes(array $attributes): array
    {
        $mapped = [];
        
        // Order
        if (isset($attributes['order'])) {
            $mapped['order'] = in_array(strtolower($attributes['order']), ['asc', 'desc']) 
                ? strtolower($attributes['order']) 
                : 'asc';
        }
        
        // Per page (blocks previously defaulted to -1; server clamped that to 1 — use 10 to match shortcode default)
        if (isset($attributes['per_page'])) {
            $perPage = (int) $attributes['per_page'];
            if ($perPage === -1) {
                $perPage = 10;
            }
            $mapped['per_page'] = (string) max(1, min(100, $perPage));
        }
        
        // Columns
        if (isset($attributes['columns'])) {
            $mapped['columns'] = (string) max(1, min(4, (int) $attributes['columns']));
        }
        
        // Title
        if (isset($attributes['title'])) {
            $mapped['title'] = sanitize_text_field($attributes['title']);
        }
        
        // Show pagination
        if (isset($attributes['show_pagination'])) {
            $mapped['show_pagination'] = $attributes['show_pagination'] ? 'yes' : 'no';
        }
        
        return $mapped;
    }
    
    /**
     * Map destination block attributes to shortcode format
     * 
     * @param array $attributes Block attributes
     * @return array Shortcode attributes
     */
    private static function mapDestinationAttributes(array $attributes): array
    {
        $mapped = [];
        
        // Order
        if (isset($attributes['order'])) {
            $mapped['order'] = in_array(strtolower($attributes['order']), ['asc', 'desc']) 
                ? strtolower($attributes['order']) 
                : 'asc';
        }
        
        // Per page — legacy block saves used -1 (clamped to 1 in PHP); treat as 10 like shortcode default
        if (isset($attributes['per_page'])) {
            $perPage = (int) $attributes['per_page'];
            if ($perPage === -1) {
                $perPage = 10;
            }
            $mapped['per_page'] = (string) max(1, min(100, $perPage));
        }
        
        // Columns
        if (isset($attributes['columns'])) {
            $mapped['columns'] = (string) max(1, min(4, (int) $attributes['columns']));
        }
        
        // Title
        if (isset($attributes['title'])) {
            $mapped['title'] = sanitize_text_field($attributes['title']);
        }
        
        // Show pagination
        if (isset($attributes['show_pagination'])) {
            $mapped['show_pagination'] = $attributes['show_pagination'] ? 'yes' : 'no';
        }
        
        return $mapped;
    }
}
