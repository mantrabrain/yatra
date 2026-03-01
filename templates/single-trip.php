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

// Set up page title
add_filter('wp_title', function ($title) {
    global $trip;
    return esc_html($trip->title) . ' - ' . get_bloginfo('name');
}, 10, 1);

// Include SEO helper functions
require_once plugin_dir_path(dirname(__FILE__)) . 'includes/seo-helper.php';

yatra_get_header();

// Calculate pricing data using helper functions
$pricing_data = yatra_single_trip_calculate_base_price($trip);
$base_price = $pricing_data['base_price'];
$has_availability = $pricing_data['has_availability'];
$has_traveler_pricing = $pricing_data['has_traveler_pricing'];
$pricing_type = $pricing_data['pricing_type'];

// Get group discounts data
$group_discounts = yatra_single_trip_get_group_discounts($trip->id);

// Prepare variables for templates
$destinations = isset($trip->destinations) ? $trip->destinations : [];
$activities = isset($trip->activities) ? $trip->activities : [];
$trip_categories = isset($trip->trip_categories) ? $trip->trip_categories : [];

// Set up global itinerary gallery data for modal (simple URL array like hero)
global $yatra_itinerary_gallery_images;
$yatra_itinerary_gallery_images = [];
if (!empty($trip->itinerary_days)) {
    foreach ($trip->itinerary_days as $day) {
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

<!-- Single Trip JavaScript Data -->
<script>
window.yatraTripData = {
    tripId: <?php echo (int)$trip->id; ?>,
    basePrice: <?php echo (float)$base_price; ?>,
    currencySymbol: '<?php echo yatra_get_currency_symbol($trip->currency ?? 'USD'); ?>',
    availabilityDates: <?php echo json_encode(array_map(function ($avail) {
        return $avail->departure_date ?? $avail->date;
    }, $trip->availability_dates ?? [])); ?>,
    groupDiscountsUrl: '<?php echo esc_url(rest_url('yatra/v1/discounts/group-discounts')); ?>'
};
</script>

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
    <?php if (!empty($trip->attributes)): ?>
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
            <!-- Overview Section -->
            <?php yatra_get_template('partials/single-trip/content-overview', ['trip' => $trip, 'has_traveler_pricing' => $has_traveler_pricing, 'has_availability' => $has_availability, 'base_price' => $base_price]); ?>

            
            <!-- Itinerary Section -->
            <?php yatra_get_template('partials/single-trip/content-itinerary', ['trip' => $trip]); ?>

            <!-- What's Included/Excluded -->
            <?php if (!empty($trip->included_items) || !empty($trip->excluded_items)): ?>
                <?php yatra_get_template('partials/single-trip/content-included-excluded', ['trip' => $trip]); ?>
            <?php endif; ?>

            
            <!-- Location/Map Section -->
            <?php yatra_get_template('partials/single-trip/content-location', ['trip' => $trip]); ?>

            <!-- Important Information Section -->
            <?php yatra_get_template('partials/single-trip/content-important-info', ['trip' => $trip]); ?>

            <!-- FAQ Section -->
            <?php if (!empty($trip->faqs) && is_array($trip->faqs)): ?>
                <?php yatra_get_template('partials/single-trip/content-faq', ['trip' => $trip]); ?>
            <?php endif; ?>

            <!-- Trip Story Section -->
            <?php if (!empty($trip->trip_story ?? '')): ?>
                <?php yatra_get_template('partials/single-trip/content-trip-story', ['trip' => $trip]); ?>
            <?php endif; ?>

            <!-- What Makes This Trip Special Section -->
            <?php if (!empty($trip->what_makes_special ?? '')): ?>
                <?php yatra_get_template('partials/single-trip/content-whats-make-special', ['trip' => $trip]); ?>
            <?php endif; ?>

            <!-- Testimonials Section -->
            <?php 
            $display_testimonials = !empty($trip->testimonials) && is_array($trip->testimonials) ? $trip->testimonials : [];
            if (!empty($display_testimonials)): 
                yatra_get_template('partials/single-trip/testimonials', ['trip' => $trip]);
            endif; 
            ?>

            </div>

        <!-- Sidebar - Booking Card -->
        <?php yatra_get_template('partials/single-trip/content-sidebar', ['trip' => $trip, 'has_availability' => $has_availability, 'has_traveler_pricing' => $has_traveler_pricing, 'base_price' => $base_price, 'pricing_type' => $pricing_type]); ?>
    </div>

    <!-- Group Discount Section -->
    <?php if ($group_discounts['has_group_discounts'] && !empty($group_discounts['group_discounts_data'])): ?>
        <?php yatra_get_template('partials/single-trip/group-discounts', ['trip' => $trip, 'group_discounts_data' => $group_discounts['group_discounts_data']]); ?>
    <?php endif; ?>

    <!-- Similar Trips Section -->
    <?php yatra_get_template('partials/single-trip/similar-trips', ['trip' => $trip]); ?>

    <!-- Reviews Section - Full Width -->
    <?php if (yatra_reviews_enabled()): ?>
        <?php yatra_get_template('partials/single-trip/reviews', ['trip' => $trip]); ?>
    <?php endif; ?>
</div>

<!-- Enquiry Modal -->
<?php yatra_get_template('partials/single-trip/enquiry-modal', ['trip' => $trip]); ?>

<?php yatra_get_footer(); ?>
