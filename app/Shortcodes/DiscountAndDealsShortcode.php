<?php

declare(strict_types=1);

namespace Yatra\Shortcodes;

/**
 * Discount and Deals Shortcode
 *
 * Displays discounted tours and special deals using trip-listing-card.php template
 */
class DiscountAndDealsShortcode extends BaseShortcode
{
    public function __construct()
    {
        parent::__construct('yatra_discount_and_deals', [
            'order' => 'asc',
             'per_page' => '10',
            'columns' => '3',
            'discount_type' => 'all', // all, percentage, fixed, group
            'min_discount' => '',
            'max_discount' => '',
            'category' => '',
            'destination' => '',
            'show_original_price' => 'yes',
            'show_percentage' => 'yes',
            'show_time_left' => 'yes',
            'show_pagination' => 'yes',
            'show_filters' => 'no',
            'title' => 'Special Deals & Discounts'
        ]);
    }

    /**
     * Render the discount and deals shortcode content
     */
    protected function renderContent(array $atts): string
    {
        $atts = shortcode_atts($this->default_attributes, $atts, $this->tag);
        
        // Extract per_page from attributes (only per_page parameter)
        $per_page = 10; // default
        if (!empty($atts['per_page']) && is_numeric($atts['per_page'])) {
            $per_page = (int) $atts['per_page'];
        }
        $atts['per_page'] = $per_page;

        // Get trips using Yatra's service (same as TripShortcode)
        $trips_data = $this->getTrips($atts);
        
        // Prepare data for template (match expected structure - same as TripShortcode)
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
            'total_found' => $trips_data['total_found'] ?? 0,
            'per_page' => $per_page
        ];

        // Enqueue same CSS and JS as regular trip shortcode
        wp_enqueue_style(
            'yatra-trip-shortcode',
            YATRA_PLUGIN_URL . 'assets/css/shortcodes/trip-shortcode.css',
            [],
            YATRA_VERSION
        );
        
        wp_enqueue_script(
            'yatra-trip-shortcode',
            YATRA_PLUGIN_URL . 'assets/js/trip-shortcode.js',
            ['jquery'],
            YATRA_VERSION,
            true
        );
        
        // Pass data to JavaScript (same as trip shortcode)
        wp_localize_script('yatra-trip-shortcode', 'yatraTripShortcode', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('yatra_trip_shortcode_nonce')
        ]);

        return $this->loadTemplate('shortcodes/trip.php', $data);
    }
    
    /**
     * Get trips using Yatra's service (same as TripShortcode)
     */
    public function getTrips(array $atts): array
    {
        global $wpdb;
        
        $tripsTable = \Yatra\Database\Tables\TripsTable::getTableName();
        $limit = (int) $atts['per_page'];
        $order = strtolower($atts['order']) === 'desc' ? 'DESC' : 'ASC';
        
        // Build the query to get trips with discounts - more flexible
        $query = "SELECT * FROM {$tripsTable} 
                 WHERE status = 'publish' 
                 AND (
                     (discounted_price > 0 AND discounted_price < original_price) OR
                     (sale_price > 0 AND sale_price < original_price) OR
                     (discounted_price > 0) OR
                     (sale_price > 0)
                 )";
        
        // Debug: Log the query
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('DISCOUNT QUERY: ' . $query);
            error_log('DISCOUNT ATTRS: ' . print_r($atts, true));
        }
        
        // Add category filter if specified
        if (!empty($atts['category'])) {
            $tripClassificationsTable = \Yatra\Database\Tables\TripClassificationsTable::getTableName();
            $query .= " AND id IN (
                SELECT tc.trip_id 
                FROM {$tripClassificationsTable} tc 
                INNER JOIN {$wpdb->prefix}terms t ON tc.classification_id = t.term_id
                WHERE tc.classification_type = 'category' 
                AND t.slug = %s
            )";
        }
        
        // Add destination filter if specified
        if (!empty($atts['destination'])) {
            $tripClassificationsTable = \Yatra\Database\Tables\TripClassificationsTable::getTableName();
            $query .= " AND id IN (
                SELECT tc.trip_id 
                FROM {$tripClassificationsTable} tc 
                INNER JOIN {$wpdb->prefix}terms t ON tc.classification_id = t.term_id
                WHERE tc.classification_type = 'destination' 
                AND t.slug = %s
            )";
        }
        
        $query .= " ORDER BY created_at {$order} LIMIT {$limit}";
        
        // Prepare the query with parameters
        $params = [];
        if (!empty($atts['category'])) {
            $params[] = $atts['category'];
        }
        if (!empty($atts['destination'])) {
            $params[] = $atts['destination'];
        }
        
        if (!empty($params)) {
            $trips = $wpdb->get_results($wpdb->prepare($query, ...$params));
        } else {
            $trips = $wpdb->get_results($query);
        }
        
        // Debug: Log the results
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('DISCOUNT RESULTS COUNT: ' . count($trips));
            if (!empty($trips)) {
                foreach ($trips as $trip) {
                    error_log('DISCOUNT TRIP: ' . print_r([
                        'id' => $trip->id,
                        'title' => $trip->title,
                        'original_price' => $trip->original_price,
                        'discounted_price' => $trip->discounted_price,
                        'sale_price' => $trip->sale_price
                    ], true));
                }
            }
        }
        
        // Process trips and calculate discount information
        $processed_trips = [];
        foreach ($trips as $trip) {
            $trip_data = $this->processTripData($trip);
            if ($trip_data['has_discount']) {
                $processed_trips[] = (object) $trip_data;
            }
        }
        
        // Debug: Log processed trips
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('PROCESSED DISCOUNT TRIPS COUNT: ' . count($processed_trips));
            if (!empty($processed_trips)) {
                foreach ($processed_trips as $trip) {
                    error_log('PROCESSED TRIP: ' . print_r([
                        'id' => $trip->id,
                        'title' => $trip->title,
                        'has_discount' => $trip->has_discount,
                        'best_discount' => $trip->best_discount
                    ], true));
                }
            }
        }
        
        // Return in same format as TripShortcode
        return [
            'trips' => $processed_trips,
            'max_pages' => 1,
            'current_page' => 1,
            'total_found' => count($processed_trips)
        ];
    }
    
    /**
     * Process trip data and calculate discount information
     */
    private function processTripData($trip): array
    {
        $original_price = (float) ($trip->original_price ?? 0);
        $discounted_price = (float) ($trip->discounted_price ?? 0);
        $sale_price = (float) ($trip->sale_price ?? 0);
        
        $has_discount = false;
        $best_discount = null;
        $current_price = $original_price;
        
        // Check for discounted price
        if ($discounted_price > 0 && $discounted_price < $original_price) {
            $has_discount = true;
            $discount_amount = $original_price - $discounted_price;
            $discount_percentage = ($discount_amount / $original_price) * 100;
            
            $best_discount = [
                'type' => 'percentage',
                'value' => round($discount_percentage, 1),
                'amount' => $discount_amount,
                'original_price' => $original_price,
                'discounted_price' => $discounted_price
            ];
            $current_price = $discounted_price;
        }
        
        // Check for sale price
        if ($sale_price > 0 && $sale_price < $original_price) {
            $has_discount = true;
            $discount_amount = $original_price - $sale_price;
            $discount_percentage = ($discount_amount / $original_price) * 100;
            
            // Use sale price if it's better than discounted price
            if (!$best_discount || $sale_price < $best_discount['discounted_price']) {
                $best_discount = [
                    'type' => 'percentage',
                    'value' => round($discount_percentage, 1),
                    'amount' => $discount_amount,
                    'original_price' => $original_price,
                    'discounted_price' => $sale_price
                ];
                $current_price = $sale_price;
            }
        }
        
        // Generate permalink directly
        $permalink = function_exists('yatra_get_trip_permalink') 
            ? yatra_get_trip_permalink($trip) 
            : home_url('/' . \Yatra\Services\SettingsService::getTripBase() . '/' . $trip->slug);

        return [
            'id' => $trip->id,
            'title' => $trip->title,
            'slug' => $trip->slug,
            'description' => $trip->description ?? '',
            'short_description' => $trip->short_description ?? '',
            'original_price' => $original_price,
            'discounted_price' => $current_price < $original_price ? $current_price : null,
            'sale_price' => $current_price < $original_price ? $current_price : null,
            'has_discount' => $has_discount,
            'best_discount' => $best_discount,
            'current_price' => $current_price,
            'featured_image' => $trip->featured_image,
            'starting_location' => $trip->starting_location ?? '',
            'duration_days' => $trip->duration_days ?? 0,
            'duration_nights' => $trip->duration_nights ?? 0,
            'difficulty_level' => $trip->difficulty_level,
            'created_at' => $trip->created_at,
            'permalink' => $permalink
        ];
    }
}
