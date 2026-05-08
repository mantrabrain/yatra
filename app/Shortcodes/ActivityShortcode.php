<?php

declare(strict_types=1);

namespace Yatra\Shortcodes;

use Yatra\Helpers\TripListingFilterBuilder;
use Yatra\Services\SettingsService;

/**
 * Activity Shortcode
 *
 * Displays activity listings with associated trips using trip-listing-card.php template
 */
class ActivityShortcode extends BaseShortcode
{
    public function __construct()
    {
        parent::__construct('yatra_activity', [
            'order' => 'desc',
            'per_page' => '10',
            'columns' => '3',
            'show_trip_count' => 'yes',
            'show_description' => 'yes',
            'show_image' => 'yes',
            'show_pagination' => 'yes', // Default to show pagination like trip shortcode
            'activity' => '', // Classification IDs, comma-separated
            'hide_empty' => 'yes',
            'title' => 'Activity Listings'
        ]);
    }

    /**
     * Render the activity shortcode content
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
 
        // Get activities using Yatra's service
        $activities_data = $this->getActivities($atts);
        
        // Prepare data for template
        $data = [
            'activities' => $activities_data['activities'] ?? [],
            'atts' => $atts,
            'current_page' => $activities_data['current_page'] ?? 1,
            'max_pages' => $activities_data['max_pages'] ?? 1,
            'total_found' => $activities_data['total_found'] ?? 0,
            'per_page' => $per_page
        ];

        $activityCssPath = YATRA_PLUGIN_PATH . 'assets/css/shortcodes/activity-shortcode.css';
        $activityCssVer = is_readable($activityCssPath) ? YATRA_VERSION . '.' . filemtime($activityCssPath) : YATRA_VERSION;
        wp_enqueue_style(
            'yatra-activity-shortcode',
            YATRA_PLUGIN_URL . 'assets/css/shortcodes/activity-shortcode.css',
            \Yatra\Providers\FrontendAssetsProvider::shortcodeStyleDependencies(),
            $activityCssVer
        );
        
        // Enqueue shortcode-specific JavaScript
        wp_enqueue_script(
            'yatra-activity-shortcode',
            YATRA_PLUGIN_URL . 'assets/js/activity-shortcode.js',
            ['jquery'],
            YATRA_VERSION,
            true
        );
        
        // Pass data to JavaScript
        wp_localize_script('yatra-activity-shortcode', 'yatraActivityShortcode', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('yatra_activity_shortcode_nonce')
        ]);

        return $this->loadTemplate('shortcodes/activity.php', $data);
    }

    /**
     * Get activities using Yatra's service
     */
    public function getActivities(array $atts): array
    {
        try {
            $activityService = new \Yatra\Services\ActivityService();
            
            // Get current page from query string or attributes (for AJAX)
            $current_page = isset($atts['current_page']) ? (int) $atts['current_page'] : (isset($_GET['activity_page']) ? (int) $_GET['activity_page'] : 1);
            // Enhanced per_page handling with validation and debugging
        
           $per_page = (int) $atts['per_page'];

           
            // Validate per_page to prevent issues
            $per_page = max(1, min($per_page, 100)); // Between 1 and 100 items
            $offset = ($current_page - 1) * $per_page;

            // Start with very basic arguments to ensure we get activities
            $args = [
                'limit' => $per_page,
                'offset' => $offset,
                'order_by' => 'name',
                'order' => $atts['order'] === 'asc' ? 'ASC' : 'DESC'
            ];
            
            $args['where'] = $args['where'] ?? [];
            TripListingFilterBuilder::applyTaxonomyWhere(
                $args['where'],
                $atts,
                'activityIds',
                'activity_ids',
                'activity'
            );

            // Get total count for pagination
            $count_args = $args;
            unset($count_args['limit']);
            unset($count_args['offset']);
            $total_activities = $activityService->count($count_args);

            // Try using the base repository method to bypass status filtering
            $result = $activityService->getAll($args);
            
            
            
            $activities = [];

            foreach ($result as $activityData) {

                
                // Get real trip data for this activity using classification tables
                global $wpdb;
                
                $tripClassificationsTable = \Yatra\Database\Tables\TripClassificationsTable::getTableName();
                $tripsTable = \Yatra\Database\Tables\TripsTable::getTableName();
                
                // Get trip IDs for this activity
                $trip_ids = $wpdb->get_col($wpdb->prepare(
                    "SELECT tc.trip_id 
                     FROM {$tripClassificationsTable} tc 
                     INNER JOIN {$tripsTable} t ON tc.trip_id = t.id 
                     WHERE tc.classification_id = %d 
                     AND tc.classification_type = 'activity' 
                     AND t.status = 'publish'",
                    $activityData->id
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
                $difficulties = [];
                
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
                    
                    // Get difficulty
                    if (!empty($trip->difficulty)) {
                        $difficulties[] = $trip->difficulty;
                    }
                }
                
                // Calculate averages
                $final_avg_rating = $avg_rating; // Already calculated correctly above
                $avg_duration = !empty($durations) ? array_sum($durations) / count($durations) : 0;
                $avg_group_size = !empty($group_sizes) ? round(array_sum($group_sizes) / count($group_sizes)) : 0;
                
               
                
                $activities[] = [
                    'term' => $activityData,
                    'trips' => $trips,
                    'trip_count' => $trip_count,
                    'description' => $activityData->description ?? '',
                    'image' => $this->getActivityImage($activityData),
                    'link' => $this->getActivityLink($activityData),
                    'min_price' => $min_price,
                    'max_price' => $max_price,
                    'avg_rating' => $final_avg_rating,
                    'rating_count' => $total_review_count,
                    'avg_duration' => $avg_duration,
                    'avg_group_size' => $avg_group_size,
                    'difficulty' => !empty($difficulties) ? $this->getMostCommonDifficulty($difficulties) : null
                ];
            }
            
            // Filter out empty activities if requested
            if ($atts['hide_empty'] === 'yes') {
                $activities = array_filter($activities, function($activity) {
                    return !empty($activity['term']->name) && !empty($activity['term']->slug);
                });
            }
            
            // Calculate pagination data
            $max_pages = $per_page > 0 ? ceil($total_activities / $per_page) : 1;
            
        

            return [
                'activities' => $activities,
                'current_page' => $current_page,
                'max_pages' => $max_pages,
                'total_found' => $total_activities,
                'per_page' => $per_page
            ];
            
        } catch (\Exception $e) {

            return [];
        }
    }
    
    /**
     * Get the most common difficulty from an array of difficulties
     */
    private function getMostCommonDifficulty(array $difficulties): string
    {
        if (empty($difficulties)) {
            return 'Moderate';
        }
        
        $counts = array_count_values($difficulties);
        arsort($counts);
        return array_key_first($counts);
    }

    
    /**
     * Get activity image
     */
    private function getActivityImage($activity): string
    {
        // Check for activity image in metadata
        if (isset($activity->image) && !empty($activity->image)) {
            return $activity->image;
        }

        // Check for activity icon in metadata
        if (isset($activity->icon) && !empty($activity->icon)) {
            $icon_data = maybe_unserialize($activity->icon);
            if (is_array($icon_data) && isset($icon_data['type']) && $icon_data['type'] === 'image') {
                return is_numeric($icon_data['value']) ? wp_get_attachment_url($icon_data['value']) : $icon_data['value'];
            }
        }

        // Check for activity thumbnail/featured image
        if (isset($activity->thumbnail) && !empty($activity->thumbnail)) {
            return is_numeric($activity->thumbnail) ? wp_get_attachment_url($activity->thumbnail) : $activity->thumbnail;
        }

        // Check for activity banner
        if (isset($activity->banner) && !empty($activity->banner)) {
            return $activity->banner;
        }

        // Check for metadata with image
        if (isset($activity->metadata) && !empty($activity->metadata)) {
            $metadata = maybe_unserialize($activity->metadata);
            if (is_array($metadata)) {
                // Check for various image fields in metadata
                $image_fields = ['image', 'thumbnail', 'banner', 'featured_image', 'cover_image'];
                foreach ($image_fields as $field) {
                    if (isset($metadata[$field]) && !empty($metadata[$field])) {
                        return is_numeric($metadata[$field]) ? wp_get_attachment_url($metadata[$field]) : $metadata[$field];
                    }
                }
            }
        }

        // Fallback to placeholder
        $fallback_url = YATRA_PLUGIN_URL . 'assets/images/placeholder.png';
        

        
        return $fallback_url;
    }

    /**
     * Get activity link
     */
    private function getActivityLink($activity): string
    {
        if (isset($activity->slug)) {
            // Use permalink helper so global base + plain permalinks are respected
            if (function_exists('yatra_get_activity_permalink')) {
                return yatra_get_activity_permalink($activity);
            }

            $base = SettingsService::getActivityBase();
            return home_url('/' . $base . '/' . $activity->slug . '/');
        }
        
        return '#'; // Fallback
    }
}
