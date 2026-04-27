<?php

declare(strict_types=1);

namespace Yatra\Shortcodes;

use Yatra\Services\SettingsService;

/**
 * Destination Shortcode
 *
 * Displays destination showcase with associated trips using trip-listing-card.php template
 */
class DestinationShortcode extends BaseShortcode
{
    public function __construct()
    {
        parent::__construct('yatra_destination', [
            'order' => 'desc',
            'per_page' => '10',
             'columns' => '3',
            'show_trip_count' => 'yes',
            'show_description' => 'yes',
            'show_image' => 'yes',
            'show_pagination' => 'yes', // Default to show pagination like trip shortcode
            'destination' => '', // Specific destination slug(s), comma separated
            'hide_empty' => 'yes',
            'featured_only' => 'no',
            'title' => 'Destination Showcase'
        ]);
    }

    /**
     * Render the destination shortcode content
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

        // Get destinations using Yatra's service
        $destinations_data = $this->getDestinations($atts);
        
        // Prepare data for template
        $data = [
            'destinations' => $destinations_data['destinations'] ?? [],
            'atts' => $atts,
            'current_page' => $destinations_data['current_page'] ?? 1,
            'max_pages' => $destinations_data['max_pages'] ?? 1,
            'total_found' => $destinations_data['total_found'] ?? 0,
            'per_page' => $per_page
        ];

        // Enqueue shortcode-specific CSS
        wp_enqueue_style(
            'yatra-destination-shortcode',
            YATRA_PLUGIN_URL . 'assets/css/shortcodes/destination-shortcode.css',
            [],
            YATRA_VERSION
        );
        
        // Enqueue shortcode-specific JavaScript
        wp_enqueue_script(
            'yatra-destination-shortcode',
            YATRA_PLUGIN_URL . 'assets/js/destination-shortcode.js',
            ['jquery'],
            YATRA_VERSION,
            true
        );
        
        // Pass data to JavaScript
        wp_localize_script('yatra-destination-shortcode', 'yatraDestinationShortcode', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('yatra_destination_shortcode_nonce')
        ]);

        return $this->loadTemplate('shortcodes/destination.php', $data);
    }

    /**
     * Get destinations using Yatra's service
     */
    public function getDestinations(array $atts): array
    {
        try {
            $destinationService = new \Yatra\Services\DestinationService();
            
            // Get current page from query string or attributes (for AJAX)
            $current_page = isset($atts['current_page']) ? (int) $atts['current_page'] : (isset($_GET['destination_page']) ? (int) $_GET['destination_page'] : 1);
            // Use per_page parameter only
            $per_page = 10; // Default fallback
            if (!empty($atts['per_page'])) {
                $per_page = (int) $atts['per_page'];
              
            } else {
             
            }
            
            // Validate per_page to prevent issues
            $per_page = max(1, min($per_page, 100)); // Between 1 and 100 items
            $offset = ($current_page - 1) * $per_page;

            // Start with very basic arguments to ensure we get destinations
            $args = [
                'limit' => $per_page,
                'offset' => $offset,
                'order_by' => 'name',
                'order' => $atts['order'] === 'asc' ? 'ASC' : 'DESC'
            ];
            
            // Filter by specific destinations if provided
            if (!empty($atts['destination'])) {
                $args['where']['slug'] = explode(',', $atts['destination']);
            }

            // Get total count for pagination
            $count_args = $args;
            unset($count_args['limit']);
            unset($count_args['offset']);
            $total_destinations = $destinationService->count($count_args);

            // Try using the base repository method to bypass status filtering
            $result = $destinationService->getAll($args);
            
                       
            $destinations = [];

            foreach ($result as $destinationData) {
                // Get real trip data for this destination using classification tables
                global $wpdb;
                
                $tripClassificationsTable = \Yatra\Database\Tables\TripClassificationsTable::getTableName();
                $tripsTable = \Yatra\Database\Tables\TripsTable::getTableName();
                
                // Get trip IDs for this destination
                $trip_ids = $wpdb->get_col($wpdb->prepare(
                    "SELECT tc.trip_id 
                     FROM {$tripClassificationsTable} tc 
                     INNER JOIN {$tripsTable} t ON tc.trip_id = t.id 
                     WHERE tc.classification_id = %d 
                     AND tc.classification_type = 'destination' 
                     AND t.status = 'publish'",
                    $destinationData->id
                ));
                
                $trip_count = count($trip_ids);
                
                // Get actual trips
                $trips = [];
                if (!empty($trip_ids)) {
                    $placeholders = implode(',', array_fill(0, count($trip_ids), '%d'));
                    $trips = $wpdb->get_results($wpdb->prepare(
                        "SELECT * FROM {$tripsTable} 
                         WHERE id IN ({$placeholders}) 
                         AND status = 'publish' 
                         ORDER BY created_at DESC 
                         LIMIT 6",
                        ...$trip_ids
                    ));
                }
                
                // Calculate pricing from real trips
                $min_price = null;
                $max_price = null;
                $durations = [];
                $group_sizes = [];
                $best_seasons = [];
                
                // Calculate rating from reviews table directly
                $total_rating_sum = 0;
                $total_review_count = 0;
                
                if (!empty($trip_ids)) {
                    $reviewsTable = \Yatra\Database\Tables\ReviewsTable::getTableName();
                    $placeholders = implode(',', array_fill(0, count($trip_ids), '%d'));
                    
                    $reviews = $wpdb->get_results($wpdb->prepare(
                        "SELECT rating, COUNT(*) as review_count 
                         FROM {$reviewsTable} 
                         WHERE trip_id IN ({$placeholders}) 
                         AND status = 'approved'",
                        ...$trip_ids
                    ));
                    
                
                    
                    foreach ($reviews as $review) {
                        $total_rating_sum += $review->rating * $review->review_count;
                        $total_review_count += $review->review_count;
                        
                  
                    }
                }
                
                // Calculate average rating only for trips that actually have reviews
                // Trips with no reviews are excluded from the average (not treated as 0 rating)
                $avg_rating = $total_review_count > 0 ? $total_rating_sum / $total_review_count : 0;
                
                foreach ($trips as $trip) {
                    // Debug: Log all trip data to see what fields exist

                    // Get pricing via centralized TripPricingService
                    $effective = \Yatra\Services\TripPricingService::getEffectivePrice($trip);
                    if ($effective > 0) {
                        if ($min_price === null || $effective < $min_price) {
                            $min_price = $effective;
                        }
                        if ($max_price === null || $effective > $max_price) {
                            $max_price = $effective;
                        }
                    }
                    
                    // Get duration
                    if (!empty($trip->duration)) {
                        $durations[] = $trip->duration;
                    }
                    
                    // Get group size
                    if (!empty($trip->max_group_size)) {
                        $group_sizes[] = $trip->max_group_size;
                    }
                    
                    // Get best season
                    if (!empty($trip->best_season)) {
                        $best_seasons[] = $trip->best_season;
                    }
                }
                
                // Calculate averages
                $final_avg_rating = $avg_rating; // Already calculated correctly above
                $avg_duration = !empty($durations) ? array_sum($durations) / count($durations) : 0;
                $avg_group_size = !empty($group_sizes) ? round(array_sum($group_sizes) / count($group_sizes)) : 0;
                $best_season = !empty($best_seasons) ? $this->getMostCommonSeason($best_seasons) : 'Summer';
                
                if (defined('WP_DEBUG') && WP_DEBUG) {
                     
                     
                     
                     
                     
                     
                     
                }
                
                $destinations[] = [
                    'term' => $destinationData,
                    'trips' => $trips,
                    'trip_count' => $trip_count,
                    'description' => $destinationData->description ?? '',
                    'image' => $this->getDestinationImage($destinationData, $trips),
                    'link' => $this->getDestinationLink($destinationData),
                    'country' => $destinationData->country ?? '',
                    'region' => $destinationData->region ?? '',
                    'min_price' => $min_price,
                    'max_price' => $max_price,
                    'avg_rating' => $final_avg_rating,
                    'rating_count' => $total_review_count,
                    'avg_duration' => $avg_duration,
                    'avg_group_size' => $avg_group_size,
                    'best_season' => $best_season
                ];
            }

            // Filter out empty destinations if requested
            if ($atts['hide_empty'] === 'yes') {
                $destinations = array_filter($destinations, function($destination) {
                    return !empty($destination['term']->name) && !empty($destination['term']->slug);
                });
            }
            
            // Filter to show only featured destinations if requested
            if ($atts['featured_only'] === 'yes') {
                $destinations = array_filter($destinations, function($destination) {
                    // Check if destination is marked as featured
                    return isset($destination['term']->featured) && $destination['term']->featured == 1;
                });
            }

            // Calculate pagination data
            $max_pages = $per_page > 0 ? ceil($total_destinations / $per_page) : 1;

            return [
                'destinations' => $destinations,
                'current_page' => $current_page,
                'max_pages' => $max_pages,
                'total_found' => $total_destinations,
                'per_page' => $per_page
            ];
            
        } catch (\Exception $e) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                 
            }
            return [];
        }
    }
    
    /**
     * Get the most common season from an array of seasons
     */
    private function getMostCommonSeason(array $seasons): string
    {
        if (empty($seasons)) {
            return 'Summer';
        }
        
        $counts = array_count_values($seasons);
        arsort($counts);
        return array_key_first($counts);
    }

    
    /**
     * Resolve image URL from destination `icon` (same shape as admin: type image|icon, value = attachment ID or URL).
     */
    private function getImageUrlFromDestinationIcon($icon): string
    {
        if ($icon === null || $icon === '') {
            return '';
        }

        if (is_string($icon)) {
            $decoded = json_decode($icon, true);
            if (is_array($decoded)) {
                $icon = $decoded;
            } else {
                $icon = maybe_unserialize($icon);
            }
        }

        if (!is_array($icon)) {
            return '';
        }

        $type = $icon['type'] ?? $icon[0] ?? '';
        $value = $icon['value'] ?? $icon[1] ?? '';

        if ($type !== 'image' || $value === '' || $value === null) {
            return '';
        }

        if (is_numeric($value)) {
            $url = wp_get_attachment_image_url((int) $value, 'large');

            return $url ?: '';
        }

        if (is_string($value) && filter_var($value, FILTER_VALIDATE_URL)) {
            return $value;
        }

        return '';
    }

    /**
     * Decode metadata column to array (JSON or PHP serialized).
     *
     * @return array<string, mixed>
     */
    private function decodeDestinationMetadata($raw): array
    {
        if ($raw === null || $raw === '') {
            return [];
        }

        if (is_array($raw)) {
            return $raw;
        }

        if (!is_string($raw)) {
            return [];
        }

        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            return $decoded;
        }

        $unserialized = maybe_unserialize($raw);

        return is_array($unserialized) ? $unserialized : [];
    }

    /**
     * Get destination image URL for shortcode cards.
     *
     * @param object $destination Classification row from DB
     * @param array<int, object> $trips Associated trips (newest first), used for featured_image fallback
     */
    private function getDestinationImage($destination, array $trips = []): string
    {
        // Check for destination image in metadata
        if (isset($destination->image) && !empty($destination->image)) {
            return $destination->image;
        }

        // Check for destination banner in metadata
        if (isset($destination->banner) && !empty($destination->banner)) {
            return $destination->banner;
        }

        // Check for destination thumbnail/featured image
        if (isset($destination->thumbnail) && !empty($destination->thumbnail)) {
            return is_numeric($destination->thumbnail) ? (string) wp_get_attachment_url((int) $destination->thumbnail) : $destination->thumbnail;
        }

        // Check for destination cover image
        if (isset($destination->cover_image) && !empty($destination->cover_image)) {
            return $destination->cover_image;
        }

        // Check for destination hero image
        if (isset($destination->hero_image) && !empty($destination->hero_image)) {
            return $destination->hero_image;
        }

        $fromIcon = $this->getImageUrlFromDestinationIcon($destination->icon ?? null);
        if ($fromIcon !== '') {
            return $fromIcon;
        }

        // Check for metadata with image (JSON or serialized)
        if (isset($destination->metadata) && $destination->metadata !== '') {
            $metadata = $this->decodeDestinationMetadata($destination->metadata);
            if ($metadata !== []) {
                $image_fields = ['image', 'thumbnail', 'banner', 'featured_image', 'cover_image', 'hero_image', 'image_id'];
                foreach ($image_fields as $field) {
                    if (!empty($metadata[$field])) {
                        $val = $metadata[$field];

                        return is_numeric($val) ? (string) wp_get_attachment_url((int) $val) : (string) $val;
                    }
                }
            }
        }

        foreach ($trips as $trip) {
            if (!empty($trip->featured_image) && is_numeric($trip->featured_image)) {
                $url = wp_get_attachment_image_url((int) $trip->featured_image, 'large');
                if ($url !== false && $url !== '') {
                    return $url;
                }
            }
        }

        // Fallback to placeholder
        $fallback_url = YATRA_PLUGIN_URL . 'assets/images/placeholder.png';

        if (defined('WP_DEBUG') && WP_DEBUG) {
             
        }

        return $fallback_url;
    }

    /**
     * Get destination link
     */
    private function getDestinationLink($destination): string
    {
        if (isset($destination->slug)) {
            // Use permalink helper so global base + plain permalinks are respected
            if (function_exists('yatra_get_destination_permalink')) {
                return yatra_get_destination_permalink($destination);
            }

            $base = SettingsService::getString('destination_base', 'destination');
            return home_url('/' . $base . '/' . $destination->slug . '/');
        }
        
        return '#'; // Fallback
    }
}
