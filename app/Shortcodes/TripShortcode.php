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
            'posts_per_page' => '12',
            'per_page' => '12', // Support both parameters
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
            'show_filters' => 'no'
        ]);
    }

    /**
     * Render the tour shortcode content
     */
    protected function renderContent(array $atts): string
    {
        $atts = shortcode_atts($this->default_attributes, $atts, $this->tag);
        
        // Get trips using Yatra's service
        $trips_data = $this->getTrips($atts);
        
        // Prepare data for template (match expected structure)
        $data = [
            'trips' => [
                'trips' => $trips_data['trips'] ?? [],
                'max_pages' => $trips_data['max_pages'] ?? 1,
                'current_page' => $trips_data['current_page'] ?? 1,
                'total_found' => $trips_data['total_found'] ?? 0
            ],
            'atts' => $atts,
            'max_pages' => $trips_data['max_pages'] ?? 1,
            'current_page' => $trips_data['current_page'] ?? 1,
            'total_found' => $trips_data['total_found'] ?? 0
        ];

        // Enqueue shortcode-specific CSS
        wp_enqueue_style(
            'yatra-trip-shortcode',
            YATRA_PLUGIN_URL . 'assets/css/shortcodes/trip-shortcode.css',
            [],
            YATRA_VERSION
        );
        
        // Enqueue shortcode-specific JavaScript
        wp_enqueue_script(
            'yatra-trip-shortcode',
            YATRA_PLUGIN_URL . 'assets/js/trip-shortcode.js',
            ['jquery'],
            YATRA_VERSION,
            true
        );
        
        // Pass data to JavaScript
        wp_localize_script('yatra-trip-shortcode', 'yatraTripShortcode', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('yatra_trip_shortcode_nonce')
        ]);

        return $this->loadTemplate('shortcodes/trip.php', $data);
    }

    /**
     * Get trips using Yatra's service
     */
    public function getTrips(array $atts): array
    {
        try {
            $tripService = new \Yatra\Services\TripService();
            
            // Get current page from query string or attributes (for AJAX)
            $current_page = isset($atts['current_page']) ? (int) $atts['current_page'] : (isset($_GET['trip_page']) ? (int) $_GET['trip_page'] : 1);
            // Support both per_page and posts_per_page parameters
            // posts_per_page takes precedence over per_page
            if (isset($atts['posts_per_page']) && $atts['posts_per_page'] !== '') {
                $per_page = (int) $atts['posts_per_page'];
            } else {
                $per_page = (int) $atts['per_page'];
            }
            $offset = ($current_page - 1) * $per_page;
            
            // Debug: Log the parameter values
            if (defined('WP_DEBUG') && WP_DEBUG) {
                $is_ajax = defined('DOING_AJAX') && DOING_AJAX;
                error_log('Yatra TripShortcode Raw atts (AJAX: ' . ($is_ajax ? 'yes' : 'no') . '): ' . print_r($atts, true));
                error_log('Yatra TripShortcode Per page: ' . $per_page);
                error_log('Yatra TripShortcode Featured: ' . $atts['featured']);
                error_log('Yatra TripShortcode Current page: ' . $current_page);
            }

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
            
            // Debug: Log the results
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Yatra TripShortcode Args: ' . print_r($args, true));
                error_log('Yatra TripShortcode Results count: ' . count($trips_data));
                error_log('Yatra TripShortcode Total trips: ' . $total_trips);
            }
            
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
                error_log('Yatra TripShortcode Error: ' . $e->getMessage());
            }
            
            return [
                'trips' => [],
                'max_pages' => 1,
                'current_page' => 1,
                'total_found' => 0
            ];
        }
    }

}
