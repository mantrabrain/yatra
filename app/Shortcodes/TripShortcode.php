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
                // Note: reviews are loaded elsewhere; bookings_count is attached below
                $trip->reviews = [];
                
                $trips[] = $trip;
            }

            // Attach bookings_count (computed from bookings table) for just these trips
            $tripIds = array_map(static function ($t) {
                return isset($t->id) ? (int) $t->id : 0;
            }, $trips);
            $tripIds = array_values(array_filter($tripIds));
            if (!empty($tripIds)) {
                $bookingsCountMap = $tripService->getBookingsCountMap($tripIds);
                foreach ($trips as $t) {
                    $tId = isset($t->id) ? (int) $t->id : 0;
                    if ($tId > 0) {
                        $t->bookings_count = (int) ($bookingsCountMap[$tId] ?? 0);
                    }
                }
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

            
            return [
                'trips' => [],
                'max_pages' => 1,
                'current_page' => 1,
                'total_found' => 0
            ];
        }
    }

}
