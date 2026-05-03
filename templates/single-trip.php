<?php
/**
 * Single Trip Template - Clean Version
 *
 * Industry-standard trip single page design following Laravel patterns.
 * Uses global $trip object (similar to WordPress $post).
 * All data comes from SingleTripController - no business logic in template.
 *
 * @package Yatra
 * @global object $trip Trip data object (set by AppServiceProvider)
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Access global $trip object (similar to WordPress $post)
global $trip;

// Bail if no trip data - return proper 404
if (!$trip) {
    global $wp_query;
    $wp_query->set_404();
    status_header(404);
    get_template_part(404);
    exit;
}

// Document title and meta tags are handled by Yatra\Managers\SEOManager (document_title + wp_head).

yatra_get_header();

// Calculate pricing data using helper functions
$pricing_data = yatra_single_trip_calculate_base_price($trip);
$base_price = $pricing_data['base_price'];
$has_availability = $pricing_data['has_availability'];
$has_traveler_pricing = $pricing_data['has_traveler_pricing'];
$pricing_type = $pricing_data['pricing_type'];

// Prepare variables for templates
$destinations = isset($trip->destinations) ? $trip->destinations : [];
$activities = isset($trip->activities) ? $trip->activities : [];
$trip_categories = isset($trip->trip_categories) ? $trip->trip_categories : [];

// Set up global itinerary gallery data for modal (simple URL array like hero)
global $yatra_itinerary_gallery_images;
$yatra_itinerary_gallery_images = [];
$itinerary_days = $trip->getItineraryDays();
if (!empty($itinerary_days)) {
    foreach ($itinerary_days as $day) {
        if (!empty($day['entries'])) {
            foreach ($day['entries'] as $entry) {
                // Add gallery images
                if (!empty($entry['gallery']) && is_array($entry['gallery'])) {
                    foreach ($entry['gallery'] as $media) {
                        // Always use full-size URL for gallery popup
                        $yatra_itinerary_gallery_images[] = $media['url'] ?? '';
                    }
                }
                // Add video thumbnail
                if (!empty($entry['video_url'])) {
                    $video_url = esc_url($entry['video_url']);
                    $video_id = '';
                    $thumbnail_url = '';
                    
                    // Extract video ID and thumbnail
                    if (strpos($video_url, 'youtube.com') !== false || strpos($video_url, 'youtu.be') !== false) {
                        // YouTube thumbnail extraction
                        preg_match('/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/', $video_url, $matches);
                        $video_id = $matches[1] ?? '';
                        $thumbnail_url = "https://img.youtube.com/vi/{$video_id}/maxresdefault.jpg";
                    } elseif (strpos($video_url, 'vimeo.com') !== false) {
                        // Vimeo thumbnail extraction
                        preg_match('#vimeo\.com\/.*?(\d+)#', $video_url, $matches);
                        $video_id = $matches[1] ?? '';
                        if ($video_id) {
                            // Get Vimeo thumbnail via oEmbed API
                            $oembed_url = "https://vimeo.com/api/oembed.json?url=" . urlencode($video_url);
                            $response = wp_remote_get($oembed_url);
                            if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
                                $body = wp_remote_retrieve_body($response);
                                $data = json_decode($body, true);
                                if ($data && isset($data['thumbnail_url'])) {
                                    $thumbnail_url = $data['thumbnail_url'];
                                }
                            }
                            
                            // Fallback if API fails
                            if (empty($thumbnail_url)) {
                                $thumbnail_url = 'https://i.vimeocdn.com/video/' . $video_id . '_640.jpg';
                            }
                        }
                    }
                    
                    if ($thumbnail_url) {
                        $yatra_itinerary_gallery_images[] = $thumbnail_url;
                    }
                }
            }
        }
    }
}
?>

<!-- Flatpickr CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
<!-- Flatpickr JS -->
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>

<!-- Trip pricing/availability for JS: merged in wp_localize_script (yatra-trip) so apiUrl/nonce/wishlist are not overwritten. -->
<script>
window.yatraVars = {
    nonce: '<?php echo wp_create_nonce('wp_rest'); ?>'
};
</script>

<!-- Downloads JavaScript -->
<?php 
$downloads = $trip->getDownloadableItems();
if (!empty($downloads)): 
?>
<script src="<?php echo esc_url(plugin_dir_url(dirname(__FILE__)) . 'assets/js/api-helper.js'); ?>"></script>
<script src="<?php echo esc_url(plugin_dir_url(dirname(__FILE__)) . 'assets/js/downloads-list.js'); ?>"></script>
<?php endif; ?>

<div class="yatra-single-trip">
    
    <!-- Hero Section -->
    <?php yatra_get_template('partials/single-trip/hero', ['trip' => $trip, 'base_price' => $base_price]); ?>

    <!-- Category, Activity, Destination Tags -->
    <?php if (!empty($trip_categories) || !empty($activities) || !empty($destinations)): ?>
        <?php yatra_get_template('partials/single-trip/tags', ['trip' => $trip, 'trip_categories' => $trip_categories, 'activities' => $activities, 'destinations' => $destinations]); ?>
    <?php endif; ?>

    <!-- Quick Facts Bar -->
    <?php yatra_get_template('partials/single-trip/quick-facts', ['trip' => $trip]); ?>

    <!-- Trip Attributes -->
    <?php 
    $attributes = $trip->getAttributes();
    if (!empty($attributes)): 
    ?>
        <?php yatra_get_template('partials/single-trip/trip-attributes', ['trip' => $trip]); ?>
    <?php endif; ?>

    <!-- Sticky Navigation Bar -->
    <?php yatra_get_template('partials/single-trip/sticky-nav', ['trip' => $trip, 'base_price' => $base_price, 'has_availability' => $has_availability, 'has_traveler_pricing' => $has_traveler_pricing]); ?>

    <!-- Hero Gallery Modal -->
    <?php yatra_get_template('partials/single-trip/gallery-modal', ['trip' => $trip]); ?>

    <!-- Itinerary Gallery Modal -->
    <?php yatra_get_template('partials/single-trip/itinerary-gallery-modal', ['trip' => $trip]); ?>

    <!-- Main Container -->
    <div class="yatra-trip-container">
        <!-- Main Content -->
        <div class="yatra-trip-main">
            <!-- Dynamic Frontend Tabs -->
            <?php \Yatra\Controllers\SingleTripController::renderFrontendTabs($trip); ?>
            </div>

        <!-- Sidebar - Booking Card -->
        <?php yatra_get_template('partials/single-trip/content-sidebar', ['trip' => $trip, 'has_availability' => $has_availability, 'has_traveler_pricing' => $has_traveler_pricing, 'base_price' => $base_price, 'pricing_type' => $pricing_type]); ?>
    </div>

    <!-- Reviews Section - Full Width (before similar trips for social proof) -->
    <?php if (yatra_reviews_enabled()): ?>
        <?php yatra_get_template('partials/single-trip/reviews', ['trip' => $trip]); ?>
    <?php endif; ?>

    <!-- Similar Trips Section -->
    <?php 
    $similar_trips = $trip->getSimilarTrips();
    if (!empty($similar_trips)): 
    ?>
        <?php yatra_get_template('partials/single-trip/similar-trips', ['trip' => $trip]); ?>
    <?php endif; ?>
</div>

<!-- Mobile Sticky Sidebar -->
<?php yatra_get_template('partials/single-trip/sticky-sidebar', [
    'trip' => $trip, 
    'has_availability' => $has_availability, 
    'has_traveler_pricing' => $has_traveler_pricing, 
    'base_price' => $base_price, 
    'pricing_type' => $pricing_type
]); ?>

<!-- Enquiry Modal -->
<?php yatra_get_template('partials/single-trip/enquiry-modal', ['trip' => $trip]); ?>

<?php yatra_get_footer(); ?>
