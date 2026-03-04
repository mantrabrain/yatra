<?php

declare(strict_types=1);

namespace Yatra\Shortcodes;

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
            'activity' => '', // Specific activity slug(s), comma separated
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

        // Enqueue shortcode-specific CSS
        wp_enqueue_style(
            'yatra-activity-shortcode',
            YATRA_PLUGIN_URL . 'assets/css/shortcodes/activity-shortcode.css',
            [],
            YATRA_VERSION
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
            
            // Filter by specific activities if provided
            if (!empty($atts['activity'])) {
                $args['where']['slug'] = explode(',', $atts['activity']);
            }

            // Get total count for pagination
            $count_args = $args;
            unset($count_args['limit']);
            unset($count_args['offset']);
            $total_activities = $activityService->count($count_args);

            // Try using the base repository method to bypass status filtering
            $result = $activityService->getAll($args);
            
            
            
            $activities = [];

            foreach ($result as $activityData) {
                // Debug: Log each activity being processed
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log('Yatra ActivityShortcode Processing activity: ' . $activityData->name . ' (ID: ' . $activityData->id . ')');
                }
                
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
                    
                    if (defined('WP_DEBUG') && WP_DEBUG) {
                        error_log('ACTIVITY REVIEWS QUERY: ' . print_r($reviews, true));
                    }
                    
                    foreach ($reviews as $review) {
                        $total_rating_sum += $review->rating * $review->review_count;
                        $total_review_count += $review->review_count;
                        
                        if (defined('WP_DEBUG') && WP_DEBUG) {
                            error_log('ACTIVITY RATING CALCULATION: Added ' . $review->rating . ' * ' . $review->review_count . ' = ' . ($review->rating * $review->review_count));
                        }
                    }
                }
                
                // Calculate average rating only for trips that actually have reviews
                // Trips with no reviews are excluded from the average (not treated as 0 rating)
                $avg_rating = $total_review_count > 0 ? $total_rating_sum / $total_review_count : 0;
                
                foreach ($trips as $trip) {
                    // Debug: Log all trip data to see what fields exist
                   
                    
                    // Get pricing - use correct field names from database
                    if (isset($trip->original_price) && $trip->original_price > 0) {
                        if ($min_price === null || $trip->original_price < $min_price) {
                            $min_price = $trip->original_price;
                        }
                        if ($max_price === null || $trip->original_price > $max_price) {
                            $max_price = $trip->original_price;
                        }
                    } elseif (isset($trip->discounted_price) && $trip->discounted_price > 0) {
                        if ($min_price === null || $trip->discounted_price < $min_price) {
                            $min_price = $trip->discounted_price;
                        }
                        if ($max_price === null || $trip->discounted_price > $max_price) {
                            $max_price = $trip->discounted_price;
                        }
                    } elseif (isset($trip->sale_price) && $trip->sale_price > 0) {
                        if ($min_price === null || $trip->sale_price < $min_price) {
                            $min_price = $trip->sale_price;
                        }
                        if ($max_price === null || $trip->sale_price > $max_price) {
                            $max_price = $trip->sale_price;
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
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Yatra ActivityShortcode Error: ' . $e->getMessage());
            }
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
        
        // Debug: Log the image URL being used
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra ActivityShortcode Using fallback image: ' . $fallback_url);
        }
        
        return $fallback_url;
    }

    /**
     * Get activity link
     */
    private function getActivityLink($activity): string
    {
        // Try to get permalink from activity service or construct it
        if (isset($activity->slug)) {
            return home_url("/activity/{$activity->slug}/");
        }
        
        return '#'; // Fallback
    }
}
