<?php
/**
 * Single Trip Template - Dynamic Version
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

// Bail if no trip data
if (!$trip) {
    get_header();
    echo '<div class="yatra-error" style="max-width: 1200px; margin: 80px auto; padding: 40px; text-align: center;">';
    echo '<h1>' . esc_html__('Trip Not Found', 'yatra') . '</h1>';
    echo '<p>' . esc_html__('The trip you are looking for does not exist or has been removed.', 'yatra') . '</p>';
    echo '<a href="' . esc_url(home_url('/trip/')) . '" class="yatra-btn"><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>' . esc_html__('Browse All Trips', 'yatra') . '</a>';
    echo '</div>';
    get_footer();
    exit;
}

// Set up page title
add_filter('wp_title', function($title) {
    global $trip;
    return esc_html($trip->title) . ' - ' . get_bloginfo('name');
}, 10, 1);

get_header();

// Calculate base price (for display) - used in hero, quick facts, sticky nav, and sidebar
// Check if availability dates exist (PRIORITY)
$has_availability = !empty($trip->availability_dates) && is_array($trip->availability_dates) && count($trip->availability_dates) > 0;

// Determine pricing type from trip settings
$pricing_type = $trip->pricing_type ?? 'regular';
$has_traveler_pricing = ($pricing_type === 'traveler_based' && !empty($trip->price_types));

// Calculate base price (for display)
if ($has_availability) {
    // Get the lowest price from availability dates
    $min_price = PHP_FLOAT_MAX;
    foreach ($trip->availability_dates as $avail) {
        $avail_price = $avail->effective_price ?? $avail->original_price ?? 0;
        if ($avail_price > 0 && $avail_price < $min_price) {
            $min_price = $avail_price;
        }
    }
    $base_price = ($min_price < PHP_FLOAT_MAX) ? $min_price : ($trip->sale_price ?: $trip->original_price);
} elseif ($has_traveler_pricing) {
    // Get default or first traveler category price
    $default_price_type = null;
    foreach ($trip->price_types as $pt) {
        if (!empty($pt->is_default)) {
            $default_price_type = $pt;
            break;
        }
    }
    if (!$default_price_type && !empty($trip->price_types)) {
        $default_price_type = $trip->price_types[0];
    }
    $base_price = $default_price_type ? $default_price_type->effective_price : ($trip->sale_price ?: $trip->original_price);
} else {
    // Regular pricing
    $base_price = $trip->sale_price > 0 ? $trip->sale_price : $trip->original_price;
}
?>

<!-- Flatpickr CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
<!-- Flatpickr JS -->
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>

<div class="yatra-single-trip">
    <!-- Hero Section -->
    <div class="yatra-trip-hero-new">
        <div class="yatra-hero-header">
            <h1 class="yatra-trip-hero-title-new"><?php echo esc_html($trip->title); ?></h1>
            <div class="yatra-hero-rating">
                <?php if ($trip->average_rating > 0): ?>
                <div class="yatra-rating-stars">
                    <?php for ($i = 1; $i <= 5; $i++): ?>
                    <span class="yatra-star <?php echo $i <= round($trip->average_rating) ? 'filled' : ''; ?>">★</span>
                    <?php endfor; ?>
                </div>
                <span class="yatra-rating-number"><?php echo esc_html(number_format($trip->average_rating, 1)); ?></span>
                <span class="yatra-rating-text">(<?php echo esc_html($trip->review_count); ?> <?php echo esc_html(_n('Review', 'Reviews', $trip->review_count, 'yatra')); ?>)</span>
                <?php else: ?>
                <div class="yatra-rating-stars yatra-no-rating">
                    <?php for ($i = 1; $i <= 5; $i++): ?>
                    <span class="yatra-star">★</span>
                    <?php endfor; ?>
                </div>
                <span class="yatra-rating-text yatra-no-reviews"><?php echo esc_html__('No reviews yet', 'yatra'); ?></span>
                <?php endif; ?>
            </div>
        </div>

        <?php 
        // Determine hero images
        // 1. If featured image is set, use it as main image
        // 2. If no featured image, use first gallery image as main
        // 3. Side images are gallery images 2, 3, 4 (indices 1, 2, 3)
        $gallery_images = $trip->gallery_images ?? [];
        $has_featured = !empty($trip->featured_image_url);
        
        // Main image: featured image OR first gallery image
        $main_image_url = '';
        if ($has_featured) {
            $main_image_url = $trip->featured_image_url;
            // If featured is set, side images start from index 0
            $side_images = array_slice($gallery_images, 0, 3);
        } else {
            // No featured image - use first gallery as main
            $main_image_url = !empty($gallery_images[0]) ? $gallery_images[0] : '';
            // Side images start from index 1
            $side_images = array_slice($gallery_images, 1, 3);
        }
        
        $total_images = count($gallery_images) + ($has_featured ? 1 : 0);
        ?>
        <div class="yatra-hero-images">
            <div class="yatra-hero-main-image">
                <?php if ($trip->discount_percentage > 0): ?>
                <div class="yatra-hero-discount-tag"><?php echo esc_html__('SAVE', 'yatra'); ?> <?php echo esc_html($trip->discount_percentage); ?>%</div>
                <?php endif; ?>
                <?php if (!empty($main_image_url)): ?>
                <img src="<?php echo esc_url($main_image_url); ?>" alt="<?php echo esc_attr($trip->title); ?>" class="yatra-hero-main-img">
                <?php else: ?>
                <img src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920&q=80" alt="<?php echo esc_attr($trip->title); ?>" class="yatra-hero-main-img">
                <?php endif; ?>
                <a href="#yatra-booking-widget" class="yatra-hero-book-now-btn">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <?php echo esc_html__('Book Now', 'yatra'); ?> - <?php echo esc_html(yatra_format_price($base_price)); ?>
                </a>
            </div>
            <div class="yatra-hero-side-images">
                <?php if (!empty($side_images)): ?>
                    <?php foreach ($side_images as $index => $img_url): ?>
                    <div class="yatra-side-image-item">
                        <img src="<?php echo esc_url($img_url); ?>" alt="<?php echo esc_attr__('Gallery Image', 'yatra'); ?>">
                        <?php if ($index === 0): ?>
                        <button type="button" class="yatra-favorite-btn" aria-label="<?php echo esc_attr__('Add to favorites', 'yatra'); ?>">
                            <?php echo yatra_svg_icon('heart', 'yatra-icon-sm'); ?>
                        </button>
                        <?php endif; ?>
                        <?php if ($index === count($side_images) - 1 && $total_images > 4): ?>
                        <button type="button" class="yatra-view-all-photos-btn yatra-gallery-play-btn" data-gallery="hero-gallery">
                            <?php echo yatra_svg_icon('camera', 'yatra-icon-sm'); ?>
                            <?php echo sprintf(esc_html__('View all %d photos', 'yatra'), $total_images); ?>
                        </button>
                        <?php endif; ?>
                    </div>
                    <?php endforeach; ?>
                <?php else: ?>
                <div class="yatra-side-image-item">
                    <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80" alt="<?php echo esc_attr__('Gallery Image', 'yatra'); ?>">
                </div>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- Category, Activity, Destination Tags -->
    <?php 
    $destinations = isset($trip->destinations) ? $trip->destinations : [];
    $activities = isset($trip->activities) ? $trip->activities : [];
    $trip_categories = isset($trip->trip_categories) ? $trip->trip_categories : [];
    ?>
    <?php if (!empty($trip_categories) || !empty($activities) || !empty($destinations)): ?>
    <div class="yatra-trip-tags">
        <div class="yatra-trip-tags-container">
            <?php if (!empty($trip_categories)): ?>
            <div class="yatra-trip-tag">
                <span class="yatra-trip-tag-label"><?php echo esc_html__('Category:', 'yatra'); ?></span>
                <span class="yatra-trip-tag-value">
                    <?php 
                    $category_links = [];
                    foreach ($trip_categories as $category) {
                        $name = esc_html($category->name ?? '');
                        $permalink = yatra_get_category_permalink($category);
                        $category_links[] = $permalink ? '<a href="' . esc_url($permalink) . '">' . $name . '</a>' : $name;
                    }
                    echo implode(', ', $category_links);
                    ?>
                </span>
            </div>
            <?php endif; ?>
            <?php if (!empty($activities)): ?>
            <div class="yatra-trip-tag">
                <span class="yatra-trip-tag-label"><?php echo esc_html__('Activity:', 'yatra'); ?></span>
                <span class="yatra-trip-tag-value">
                    <?php 
                    $activity_links = [];
                    foreach ($activities as $activity) {
                        $name = esc_html($activity->name ?? '');
                        $permalink = yatra_get_activity_permalink($activity);
                        $activity_links[] = $permalink ? '<a href="' . esc_url($permalink) . '">' . $name . '</a>' : $name;
                    }
                    echo implode(', ', $activity_links);
                    ?>
                </span>
            </div>
            <?php endif; ?>
            <?php if (!empty($destinations)): ?>
            <div class="yatra-trip-tag">
                <span class="yatra-trip-tag-label"><?php echo esc_html__('Destination:', 'yatra'); ?></span>
                <span class="yatra-trip-tag-value">
                    <?php 
                    $destination_links = [];
                    foreach ($destinations as $destination) {
                        $name = esc_html($destination->name ?? '');
                        $permalink = yatra_get_destination_permalink($destination);
                        $destination_links[] = $permalink ? '<a href="' . esc_url($permalink) . '">' . $name . '</a>' : $name;
                    }
                    echo implode(', ', $destination_links);
                    ?>
                </span>
            </div>
            <?php endif; ?>
        </div>
    </div>
    <?php endif; ?>

    <!-- Quick Facts Bar -->
    <div class="yatra-trip-quick-facts">
        <div class="yatra-quick-fact">
            <div class="yatra-quick-fact-icon">
                <?php echo yatra_svg_icon('calendar', 'yatra-icon-lg'); ?>
            </div>
            <div class="yatra-quick-fact-content">
                <div class="yatra-quick-fact-label"><?php echo esc_html__('Duration', 'yatra'); ?></div>
                <div class="yatra-quick-fact-value">
                    <?php 
                    if ($trip->trip_type === 'single_day') {
                        echo esc_html__('Day Trip', 'yatra');
                    } else {
                        echo esc_html(yatra_format_duration($trip->duration_days, $trip->duration_nights)); 
                    }
                    ?>
                </div>
            </div>
        </div>
        
        <?php if (!empty($trip->difficulty_level)): ?>
        <div class="yatra-quick-fact">
            <div class="yatra-quick-fact-icon">
                <?php echo yatra_svg_icon('mountain', 'yatra-icon-lg'); ?>
            </div>
            <div class="yatra-quick-fact-content">
                <div class="yatra-quick-fact-label"><?php echo esc_html__('Difficulty', 'yatra'); ?></div>
                <div class="yatra-quick-fact-value"><?php echo esc_html(ucfirst($trip->difficulty_level)); ?></div>
            </div>
        </div>
        <?php endif; ?>

        <div class="yatra-quick-fact">
            <div class="yatra-quick-fact-icon">
                <?php echo yatra_svg_icon('users', 'yatra-icon-lg'); ?>
            </div>
            <div class="yatra-quick-fact-content">
                <div class="yatra-quick-fact-label"><?php echo esc_html__('Group Size', 'yatra'); ?></div>
                <div class="yatra-quick-fact-value">
                    <?php echo esc_html(sprintf(__('%d-%d travelers', 'yatra'), $trip->min_travelers, $trip->max_travelers)); ?>
                </div>
            </div>
        </div>

        <div class="yatra-quick-fact">
            <div class="yatra-quick-fact-icon">
                <?php echo yatra_svg_icon('star', 'yatra-icon-lg'); ?>
            </div>
            <div class="yatra-quick-fact-content">
                <div class="yatra-quick-fact-label"><?php echo esc_html__('Rating', 'yatra'); ?></div>
                <div class="yatra-quick-fact-value">
                    <?php if ($trip->average_rating > 0): ?>
                        <?php echo esc_html(number_format($trip->average_rating, 1)); ?> (<?php echo esc_html($trip->review_count); ?> <?php echo esc_html(_n('review', 'reviews', $trip->review_count, 'yatra')); ?>)
                    <?php else: ?>
                        <?php echo esc_html__('No reviews yet', 'yatra'); ?>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <?php if (!empty($trip->starting_location) || !empty($trip->ending_location)): ?>
        <div class="yatra-quick-fact">
            <div class="yatra-quick-fact-icon">
                <?php echo yatra_svg_icon('map-pin', 'yatra-icon-lg'); ?>
            </div>
            <div class="yatra-quick-fact-content">
                <div class="yatra-quick-fact-label"><?php echo esc_html__('Route', 'yatra'); ?></div>
                <div class="yatra-quick-fact-value">
                    <?php 
                    if (!empty($trip->starting_location) && !empty($trip->ending_location)) {
                        echo esc_html($trip->starting_location . ' → ' . $trip->ending_location);
                    } elseif (!empty($trip->starting_location)) {
                        echo esc_html__('From:', 'yatra') . ' ' . esc_html($trip->starting_location);
                    } else {
                        echo esc_html__('To:', 'yatra') . ' ' . esc_html($trip->ending_location);
                    }
                    ?>
                </div>
            </div>
        </div>
        <?php endif; ?>
    </div>


    <!-- Sticky Navigation Bar -->
    <div class="yatra-sticky-nav">
        <div class="yatra-sticky-nav-container">
            <a href="#overview" class="yatra-sticky-nav-item">
                <?php echo yatra_svg_icon('book-open', 'yatra-icon-sm'); ?>
                <span>Overview</span>
            </a>
            <a href="#trip-details" class="yatra-sticky-nav-item">
                <?php echo yatra_svg_icon('info', 'yatra-icon-sm'); ?>
                <span>Trip Details</span>
            </a>
            <a href="#itinerary" class="yatra-sticky-nav-item">
                <?php echo yatra_svg_icon('calendar', 'yatra-icon-sm'); ?>
                <span>Itinerary</span>
            </a>
            <a href="#included" class="yatra-sticky-nav-item">
                <?php echo yatra_svg_icon('check', 'yatra-icon-sm'); ?>
                <span>What's Included</span>
            </a>
            <a href="#gallery" class="yatra-sticky-nav-item">
                <?php echo yatra_svg_icon('camera', 'yatra-icon-sm'); ?>
                <span>Gallery</span>
            </a>
            <a href="#location" class="yatra-sticky-nav-item">
                <?php echo yatra_svg_icon('map-pin', 'yatra-icon-sm'); ?>
                <span>Location</span>
            </a>
            <a href="#faq" class="yatra-sticky-nav-item">
                <?php echo yatra_svg_icon('info', 'yatra-icon-sm'); ?>
                <span>FAQ</span>
            </a>
            <a href="#reviews" class="yatra-sticky-nav-item">
                <?php echo yatra_svg_icon('star', 'yatra-icon-sm'); ?>
                <span>Reviews</span>
            </a>
            <div class="yatra-sticky-nav-price">
                <?php if ($has_availability || $has_traveler_pricing): ?>
                <div class="yatra-sticky-nav-price-label"><?php echo esc_html__('Starting From', 'yatra'); ?></div>
                <?php endif; ?>
                <div class="yatra-sticky-nav-price-amount">
                    <?php echo yatra_svg_icon('dollar', 'yatra-icon-sm'); ?>
                    <span><?php echo yatra_format_price($base_price); ?></span>
                </div>
                <div class="yatra-sticky-nav-price-note"><?php echo esc_html__('per person', 'yatra'); ?></div>
            </div>
        </div>
    </div>

    <!-- Gallery Modal -->
    <div class="yatra-gallery-modal" id="hero-gallery" role="dialog" aria-modal="true" aria-label="Trip Gallery">
        <div class="yatra-gallery-modal-overlay"></div>
        <div class="yatra-gallery-modal-content">
            <button type="button" class="yatra-gallery-modal-close" aria-label="Close Gallery">
                <svg class="yatra-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
            <button type="button" class="yatra-gallery-modal-prev" aria-label="Previous Image">
                <svg class="yatra-icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
            </button>
            <button type="button" class="yatra-gallery-modal-next" aria-label="Next Image">
                <svg class="yatra-icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
            </button>
            <div class="yatra-gallery-modal-main">
                <img src="" alt="Gallery Image" class="yatra-gallery-modal-image">
                <div class="yatra-gallery-modal-loader">Loading...</div>
            </div>
            <div class="yatra-gallery-modal-info">
                <div class="yatra-gallery-modal-counter">
                    <span class="yatra-gallery-current-index">1</span> / <span class="yatra-gallery-total-count">6</span>
                </div>
            </div>
            <div class="yatra-gallery-modal-thumbnails">
                <div class="yatra-gallery-thumbnails-container">
                    <!-- Thumbnails will be populated by JavaScript -->
                </div>
            </div>
        </div>
    </div>

    <!-- Main Container -->
    <div class="yatra-trip-container">
        <!-- Main Content -->
        <div class="yatra-trip-main">
            <!-- Overview Section -->
            <section class="yatra-trip-section" id="overview">
                <h2 class="yatra-trip-section-title">
                    <?php echo yatra_svg_icon('book-open', 'yatra-trip-section-title-icon'); ?>
                    Overview
                </h2>
                <div class="yatra-trip-description">
                    <?php echo wp_kses_post($trip->description ?? ''); ?>
                </div>

                <?php if (!empty($trip->highlights) && is_array($trip->highlights)): ?>
                <div class="yatra-trip-highlights">
                    <?php foreach ($trip->highlights as $highlight): ?>
                    <?php if (!empty($highlight)): ?>
                    <div class="yatra-highlight-item">
                        <?php echo yatra_svg_icon('star', 'yatra-highlight-icon'); ?>
                        <p class="yatra-highlight-text"><?php echo esc_html($highlight); ?></p>
                    </div>
                    <?php endif; ?>
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>

                <div class="yatra-trip-features">
                    <div class="yatra-feature-card">
                        <?php echo yatra_svg_icon('users', 'yatra-feature-icon'); ?>
                        <h3 class="yatra-feature-title"><?php echo esc_html__('Group Size', 'yatra'); ?></h3>
                        <p class="yatra-feature-desc"><?php echo esc_html(sprintf(__('%d-%d travelers', 'yatra'), $trip->min_travelers, $trip->max_travelers)); ?></p>
                    </div>
                    <?php if (!empty($trip->accommodation_type)): ?>
                    <div class="yatra-feature-card">
                        <?php echo yatra_svg_icon('home', 'yatra-feature-icon'); ?>
                        <h3 class="yatra-feature-title"><?php echo esc_html__('Accommodation', 'yatra'); ?></h3>
                        <p class="yatra-feature-desc"><?php echo esc_html(ucfirst(str_replace('_', ' ', $trip->accommodation_type))); ?></p>
                    </div>
                    <?php endif; ?>
                    <?php if (!empty($trip->meal_plan)): ?>
                    <div class="yatra-feature-card">
                        <?php echo yatra_svg_icon('utensils', 'yatra-feature-icon'); ?>
                        <h3 class="yatra-feature-title"><?php echo esc_html__('Meals', 'yatra'); ?></h3>
                        <p class="yatra-feature-desc"><?php echo esc_html(ucfirst(str_replace('_', ' ', $trip->meal_plan))); ?></p>
                    </div>
                    <?php endif; ?>
                    <?php if (!empty($trip->transportation_included) && $trip->transportation_included): ?>
                    <div class="yatra-feature-card">
                        <?php echo yatra_svg_icon('truck', 'yatra-feature-icon'); ?>
                        <h3 class="yatra-feature-title"><?php echo esc_html__('Transport', 'yatra'); ?></h3>
                        <p class="yatra-feature-desc"><?php echo esc_html__('Included', 'yatra'); ?></p>
                    </div>
                    <?php endif; ?>
                    <?php if (!empty($trip->best_season)): ?>
                    <div class="yatra-feature-card">
                        <?php echo yatra_svg_icon('sun', 'yatra-feature-icon'); ?>
                        <h3 class="yatra-feature-title"><?php echo esc_html__('Best Season', 'yatra'); ?></h3>
                        <p class="yatra-feature-desc"><?php echo esc_html(ucfirst($trip->best_season)); ?></p>
                    </div>
                    <?php endif; ?>
                </div>
            </section>

            <!-- What Makes This Trip Special Section -->
            <?php if (!empty($trip->what_makes_special ?? '')): ?>
            <section class="yatra-trip-section" id="what-makes-special">
                <h2 class="yatra-trip-section-title">
                    <?php echo yatra_svg_icon('star', 'yatra-trip-section-title-icon'); ?>
                    What Makes This Trip Special
                </h2>
                <div class="yatra-trip-special">
                    <p class="yatra-trip-special-text"><?php echo esc_html($trip->what_makes_special ?? ''); ?></p>
                </div>
            </section>
            <?php endif; ?>

            <!-- Trip Details Section -->
            <section class="yatra-trip-section" id="trip-details">
                <h2 class="yatra-trip-section-title">
                    <?php echo yatra_svg_icon('info', 'yatra-trip-section-title-icon'); ?>
                    Trip Details
                </h2>
                <div class="yatra-trip-description">
                    <?php echo wp_kses_post($trip->trip_details ?? ''); ?>
                </div>
            </section>

            <!-- Itinerary Section -->
            <section class="yatra-trip-section" id="itinerary">
                <div class="yatra-section-header-with-actions">
                    <h2 class="yatra-trip-section-title">
                        <?php echo yatra_svg_icon('calendar', 'yatra-trip-section-title-icon'); ?>
                        Detailed Itinerary
                    </h2>
                    <div class="yatra-itinerary-actions">
                        <button type="button" class="yatra-toggle-all-btn" id="yatra-expand-all">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                            </svg>
                            Expand All
                        </button>
                        <button type="button" class="yatra-toggle-all-btn" id="yatra-collapse-all">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"/>
                            </svg>
                            Collapse All
                        </button>
                    </div>
                </div>
                
                <?php
                // Use dynamic itinerary data from trip, fallback to sample data for demo
                $itinerary_days = !empty($trip->itinerary_days) ? $trip->itinerary_days : [
                    [
                        'day' => 1,
                        'day_title' => 'Arrival in Kathmandu',
                        'entries' => [
                            [
                                'item_type' => 'Transportation',
                                'item_name' => 'Airport Transfer',
                                'icon' => 'car',
                                'title' => 'Airport Pickup & Hotel Transfer',
                                'description' => 'Welcome to Nepal! Our representative will meet you at Tribhuvan International Airport with a welcome sign and transfer you to your hotel.',
                                'location' => 'Tribhuvan International Airport',
                                'start_time' => 'Flexible',
                                'end_time' => '',
                                'duration' => '45 mins',
                                'included' => ['Airport pickup', 'Private vehicle', 'Bottled water']
                            ],
                            [
                                'item_type' => 'Rest',
                                'item_name' => 'Free Time',
                                'icon' => 'moon',
                                'title' => 'Hotel Check-in & Rest',
                                'description' => 'Check into your hotel and take some time to rest after your flight. Freshen up and explore the hotel facilities.',
                                'location' => 'Hotel Yak & Yeti, Kathmandu',
                                'start_time' => '2:00 PM',
                                'end_time' => '6:00 PM',
                                'duration' => '4 hours',
                                'included' => ['Hotel accommodation', 'Free WiFi']
                            ],
                            [
                                'item_type' => 'Meal',
                                'item_name' => 'Dinner',
                                'icon' => 'utensils',
                                'title' => 'Welcome Dinner & Trip Briefing',
                                'description' => 'Join your fellow trekkers and guide for a traditional Nepali welcome dinner. Your guide will brief you about the trek, answer questions, and distribute any necessary equipment.',
                                'location' => 'Hotel Restaurant',
                                'start_time' => '7:00 PM',
                                'end_time' => '9:00 PM',
                                'duration' => '2 hours',
                                'included' => ['Welcome dinner', 'Beverages', 'Equipment check']
                            ],
                            [
                                'item_type' => 'Accommodation',
                                'item_name' => 'Hotel',
                                'icon' => 'hotel',
                                'title' => 'Overnight Stay',
                                'description' => 'Comfortable 4-star hotel accommodation with all modern amenities.',
                                'location' => 'Hotel Yak & Yeti, Kathmandu',
                                'start_time' => '',
                                'end_time' => '',
                                'duration' => 'Overnight',
                                'included' => ['Twin sharing room', 'Breakfast', 'Free WiFi']
                            ]
                        ]
                    ],
                    [
                        'day' => 2,
                        'day_title' => 'Flight to Lukla & Trek to Phakding',
                        'entries' => [
                            [
                                'item_type' => 'Meal',
                                'item_name' => 'Breakfast',
                                'icon' => 'utensils',
                                'title' => 'Early Breakfast',
                                'description' => 'Early breakfast at the hotel before heading to the airport.',
                                'location' => 'Hotel Restaurant',
                                'start_time' => '5:00 AM',
                                'end_time' => '5:45 AM',
                                'duration' => '45 mins',
                                'included' => ['Breakfast buffet', 'Tea/Coffee']
                            ],
                            [
                                'item_type' => 'Transportation',
                                'item_name' => 'Flight',
                                'icon' => 'plane',
                                'title' => 'Scenic Flight to Lukla',
                                'description' => 'Experience one of the world\'s most spectacular flights! Fly over the Himalayan foothills and land at Tenzing-Hillary Airport, one of the most challenging airports in the world.',
                                'location' => 'Kathmandu to Lukla',
                                'start_time' => '6:30 AM',
                                'end_time' => '7:05 AM',
                                'duration' => '35 mins',
                                'included' => ['Domestic flight', 'Airport transfers', 'Luggage allowance 15kg']
                            ],
                            [
                                'item_type' => 'Activity',
                                'item_name' => 'Trekking',
                                'icon' => 'hiking',
                                'title' => 'Trek to Phakding',
                                'description' => 'After landing in Lukla (2,860m), meet your porters and begin your trek. The trail descends through the village and follows the Dudh Koshi River to Phakding (2,610m).',
                                'location' => 'Lukla to Phakding',
                                'start_time' => '8:00 AM',
                                'end_time' => '12:00 PM',
                                'duration' => '3-4 hours',
                                'included' => ['Experienced guide', 'Porter service', 'Trail snacks']
                            ],
                            [
                                'item_type' => 'Meal',
                                'item_name' => 'Lunch',
                                'icon' => 'utensils',
                                'title' => 'Lunch at Phakding',
                                'description' => 'Enjoy a hearty lunch at a local teahouse with views of the river.',
                                'location' => 'Teahouse, Phakding',
                                'start_time' => '12:30 PM',
                                'end_time' => '1:30 PM',
                                'duration' => '1 hour',
                                'included' => ['Lunch', 'Tea/Coffee']
                            ],
                            [
                                'item_type' => 'Rest',
                                'item_name' => 'Free Time',
                                'icon' => 'moon',
                                'title' => 'Rest & Explore Phakding',
                                'description' => 'Free time to rest, explore the village, or simply relax and enjoy the peaceful surroundings.',
                                'location' => 'Phakding Village',
                                'start_time' => '2:00 PM',
                                'end_time' => '6:00 PM',
                                'duration' => '4 hours',
                                'included' => []
                            ],
                            [
                                'item_type' => 'Accommodation',
                                'item_name' => 'Teahouse',
                                'icon' => 'hotel',
                                'title' => 'Overnight at Teahouse',
                                'description' => 'Stay at a comfortable teahouse lodge with basic but clean facilities.',
                                'location' => 'Phakding (2,610m)',
                                'start_time' => '',
                                'end_time' => '',
                                'duration' => 'Overnight',
                                'included' => ['Twin sharing room', 'Dinner', 'Breakfast']
                            ]
                        ]
                    ],
                    [
                        'day' => 3,
                        'day_title' => 'Trek to Namche Bazaar',
                        'entries' => [
                            [
                                'item_type' => 'Meal',
                                'item_name' => 'Breakfast',
                                'icon' => 'utensils',
                                'title' => 'Breakfast at Teahouse',
                                'description' => 'Hot breakfast to fuel you for the challenging day ahead.',
                                'location' => 'Teahouse, Phakding',
                                'start_time' => '6:30 AM',
                                'end_time' => '7:30 AM',
                                'duration' => '1 hour',
                                'included' => ['Hot breakfast', 'Tea/Coffee']
                            ],
                            [
                                'item_type' => 'Activity',
                                'item_name' => 'Trekking',
                                'icon' => 'hiking',
                                'title' => 'Trek to Namche Bazaar',
                                'description' => 'Today\'s trek is challenging with significant altitude gain. Cross several suspension bridges including the famous Hillary Bridge. Enter Sagarmatha National Park at Monjo. The final ascent to Namche is steep but rewarding.',
                                'location' => 'Phakding to Namche Bazaar',
                                'start_time' => '8:00 AM',
                                'end_time' => '3:00 PM',
                                'duration' => '5-6 hours',
                                'included' => ['National Park entry permit', 'Guide service', 'Trail snacks']
                            ],
                            [
                                'item_type' => 'Activity',
                                'item_name' => 'Sightseeing',
                                'icon' => 'camera',
                                'title' => 'First Views of Everest',
                                'description' => 'On a clear day, catch your first glimpse of Mount Everest from the trail! Photo opportunity at the famous viewpoint.',
                                'location' => 'Everest View Point',
                                'start_time' => '1:00 PM',
                                'end_time' => '1:30 PM',
                                'duration' => '30 mins',
                                'included' => []
                            ],
                            [
                                'item_type' => 'Accommodation',
                                'item_name' => 'Teahouse',
                                'icon' => 'hotel',
                                'title' => 'Overnight in Namche Bazaar',
                                'description' => 'Stay at a comfortable teahouse in the bustling Sherpa capital. Namche has ATMs, bakeries, and shops.',
                                'location' => 'Namche Bazaar (3,440m)',
                                'start_time' => '',
                                'end_time' => '',
                                'duration' => 'Overnight',
                                'included' => ['Twin sharing room', 'Dinner', 'Breakfast']
                            ]
                        ]
                    ],
                    [
                        'day' => 4,
                        'day_title' => 'Acclimatization Day in Namche',
                        'entries' => [
                            [
                                'item_type' => 'Meal',
                                'item_name' => 'Breakfast',
                                'icon' => 'utensils',
                                'title' => 'Leisurely Breakfast',
                                'description' => 'Enjoy a relaxed breakfast at the teahouse.',
                                'location' => 'Teahouse, Namche Bazaar',
                                'start_time' => '7:30 AM',
                                'end_time' => '8:30 AM',
                                'duration' => '1 hour',
                                'included' => ['Hot breakfast', 'Tea/Coffee']
                            ],
                            [
                                'item_type' => 'Activity',
                                'item_name' => 'Hiking',
                                'icon' => 'hiking',
                                'title' => 'Acclimatization Hike to Everest View Hotel',
                                'description' => 'Climb to the famous Everest View Hotel (3,880m) for stunning panoramic views of Everest, Lhotse, Ama Dablam, and surrounding peaks. This is crucial for acclimatization.',
                                'location' => 'Namche to Everest View Hotel',
                                'start_time' => '9:00 AM',
                                'end_time' => '12:00 PM',
                                'duration' => '3 hours',
                                'included' => ['Guide service', 'Tea at viewpoint']
                            ],
                            [
                                'item_type' => 'Activity',
                                'item_name' => 'Sightseeing',
                                'icon' => 'camera',
                                'title' => 'Visit Sherpa Culture Museum',
                                'description' => 'Learn about Sherpa culture, history, and the legacy of mountaineering in the Khumbu region.',
                                'location' => 'Sherpa Culture Museum, Namche',
                                'start_time' => '2:00 PM',
                                'end_time' => '3:30 PM',
                                'duration' => '1.5 hours',
                                'included' => ['Museum entry fee', 'Guide explanation']
                            ],
                            [
                                'item_type' => 'Rest',
                                'item_name' => 'Free Time',
                                'icon' => 'moon',
                                'title' => 'Explore Namche Bazaar',
                                'description' => 'Free time to explore the local markets, bakeries, and shops. Great place to buy souvenirs or rent/buy any missing gear.',
                                'location' => 'Namche Bazaar Market',
                                'start_time' => '4:00 PM',
                                'end_time' => '6:00 PM',
                                'duration' => '2 hours',
                                'included' => []
                            ],
                            [
                                'item_type' => 'Accommodation',
                                'item_name' => 'Teahouse',
                                'icon' => 'hotel',
                                'title' => 'Overnight in Namche Bazaar',
                                'description' => 'Second night in Namche for proper acclimatization.',
                                'location' => 'Namche Bazaar (3,440m)',
                                'start_time' => '',
                                'end_time' => '',
                                'duration' => 'Overnight',
                                'included' => ['Twin sharing room', 'Dinner', 'Breakfast']
                            ]
                        ]
                    ],
                    [
                        'day' => 14,
                        'day_title' => 'Return to Kathmandu & Departure',
                        'entries' => [
                            [
                                'item_type' => 'Meal',
                                'item_name' => 'Breakfast',
                                'icon' => 'utensils',
                                'title' => 'Early Breakfast',
                                'description' => 'Quick breakfast before your flight.',
                                'location' => 'Teahouse, Lukla',
                                'start_time' => '5:30 AM',
                                'end_time' => '6:15 AM',
                                'duration' => '45 mins',
                                'included' => ['Hot breakfast', 'Tea/Coffee']
                            ],
                            [
                                'item_type' => 'Transportation',
                                'item_name' => 'Flight',
                                'icon' => 'plane',
                                'title' => 'Flight Back to Kathmandu',
                                'description' => 'Scenic flight back to Kathmandu. One last chance to enjoy aerial views of the Himalayas.',
                                'location' => 'Lukla to Kathmandu',
                                'start_time' => '7:00 AM',
                                'end_time' => '7:35 AM',
                                'duration' => '35 mins',
                                'included' => ['Domestic flight', 'Airport transfers']
                            ],
                            [
                                'item_type' => 'Rest',
                                'item_name' => 'Free Time',
                                'icon' => 'moon',
                                'title' => 'Rest & Optional Sightseeing',
                                'description' => 'Free day to rest, shop for souvenirs, or explore Kathmandu\'s heritage sites like Durbar Square, Swayambhunath, or Boudhanath.',
                                'location' => 'Kathmandu',
                                'start_time' => '9:00 AM',
                                'end_time' => '6:00 PM',
                                'duration' => 'Full day',
                                'included' => ['Day room at hotel', 'Luggage storage']
                            ],
                            [
                                'item_type' => 'Meal',
                                'item_name' => 'Dinner',
                                'icon' => 'utensils',
                                'title' => 'Farewell Dinner',
                                'description' => 'Celebrate the successful completion of your trek with a special farewell dinner featuring Nepali cuisine and cultural performance.',
                                'location' => 'Traditional Restaurant, Kathmandu',
                                'start_time' => '7:00 PM',
                                'end_time' => '9:30 PM',
                                'duration' => '2.5 hours',
                                'included' => ['Farewell dinner', 'Cultural show', 'Beverages']
                            ],
                            [
                                'item_type' => 'Transportation',
                                'item_name' => 'Airport Transfer',
                                'icon' => 'car',
                                'title' => 'Airport Drop-off (If departing)',
                                'description' => 'Transfer to Tribhuvan International Airport for your departure flight.',
                                'location' => 'Hotel to Airport',
                                'start_time' => 'Flexible',
                                'end_time' => '',
                                'duration' => '45 mins',
                                'included' => ['Private vehicle', 'Airport assistance']
                            ]
                        ]
                    ]
                ];
                
                // Icon mapping function
                $get_icon = function($icon_name) {
                    $icons = [
                        'car' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 17h.01M16 17h.01M3 11l1.5-4.5A2 2 0 016.4 5h11.2a2 2 0 011.9 1.5L21 11M3 11v6a1 1 0 001 1h1m16-7v6a1 1 0 01-1 1h-1M3 11h18"/></svg>',
                        'plane' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>',
                        'utensils' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v18m-7-4h14M5 3v4a2 2 0 002 2h10a2 2 0 002-2V3"/></svg>',
                        'hotel' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>',
                        'hiking' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM5 22l3-9 4 3 5-7"/></svg>',
                        'moon' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>',
                        'camera' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
                    ];
                    return $icons[$icon_name] ?? $icons['hiking'];
                };
                
                // Item type colors
                $type_colors = [
                    'Transportation' => '#3b82f6',
                    'Meal' => '#f59e0b',
                    'Accommodation' => '#8b5cf6',
                    'Activity' => '#10b981',
                    'Rest' => '#6b7280',
                ];
                ?>
                
                <div class="yatra-itinerary-timeline">
                    <?php foreach ($itinerary_days as $day): ?>
                    <div class="yatra-itinerary-day" data-day="<?php echo esc_attr($day['day']); ?>">
                        <div class="yatra-itinerary-day-header">
                            <div class="yatra-day-badge">Day <?php echo esc_html($day['day']); ?></div>
                            <h3 class="yatra-day-title"><?php echo esc_html($day['day_title']); ?></h3>
                            <button type="button" class="yatra-day-toggle" aria-expanded="true">
                                <svg class="yatra-chevron-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div class="yatra-itinerary-day-content">
                            <div class="yatra-entries-timeline">
                                <?php foreach ($day['entries'] as $index => $entry): 
                                    $type_color = $type_colors[$entry['item_type']] ?? '#6b7280';
                                ?>
                                <div class="yatra-entry-item" style="--entry-color: <?php echo esc_attr($type_color); ?>">
                                    <div class="yatra-entry-timeline-dot"></div>
                                    <div class="yatra-entry-card">
                                        <div class="yatra-entry-header">
                                            <div class="yatra-entry-icon" style="background: <?php echo esc_attr($type_color); ?>15; color: <?php echo esc_attr($type_color); ?>">
                                                <?php echo $get_icon($entry['icon']); ?>
                                            </div>
                                            <div class="yatra-entry-info">
                                                <span class="yatra-entry-type" style="color: <?php echo esc_attr($type_color); ?>"><?php echo esc_html($entry['item_type']); ?></span>
                                                <h4 class="yatra-entry-title"><?php echo esc_html($entry['title']); ?></h4>
                                            </div>
                                            <?php if ($entry['start_time']): ?>
                                            <div class="yatra-entry-time">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                </svg>
                                                <span>
                                                    <?php 
                                                    echo esc_html($entry['start_time']);
                                                    if ($entry['end_time']) {
                                                        echo ' - ' . esc_html($entry['end_time']);
                                                    }
                                                    ?>
                                                </span>
                                            </div>
                                            <?php endif; ?>
                                        </div>
                                        
                                        <p class="yatra-entry-description"><?php echo esc_html($entry['description']); ?></p>
                                        
                                        <div class="yatra-entry-meta">
                                            <?php if ($entry['location']): ?>
                                            <div class="yatra-entry-meta-item">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                </svg>
                                                <span><?php echo esc_html($entry['location']); ?></span>
                                            </div>
                                            <?php endif; ?>
                                            
                                            <?php if ($entry['duration']): ?>
                                            <div class="yatra-entry-meta-item">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                </svg>
                                                <span><?php echo esc_html($entry['duration']); ?></span>
                                            </div>
                                            <?php endif; ?>
                                        </div>
                                        
                                        <?php if (!empty($entry['included'])): ?>
                                        <div class="yatra-entry-included">
                                            <?php foreach ($entry['included'] as $item): ?>
                                            <span class="yatra-included-tag">
                                                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                                </svg>
                                                <?php echo esc_html($item); ?>
                                            </span>
                                            <?php endforeach; ?>
                                        </div>
                                        <?php endif; ?>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                    
                    <!-- Days 5-13 Summary -->
                    <div class="yatra-itinerary-day yatra-itinerary-summary">
                        <div class="yatra-itinerary-day-header">
                            <div class="yatra-day-badge">Days 5-13</div>
                            <h3 class="yatra-day-title">Trek to Everest Base Camp & Return</h3>
                            <button type="button" class="yatra-day-toggle" aria-expanded="false">
                                <svg class="yatra-chevron-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div class="yatra-itinerary-day-content" style="display: none;">
                            <div class="yatra-summary-content">
                                <p>Continue your trek through the stunning Khumbu region:</p>
                                <ul class="yatra-summary-list">
                                    <li><strong>Day 5:</strong> Trek to Tengboche (3,860m) - Visit the famous Tengboche Monastery</li>
                                    <li><strong>Day 6:</strong> Trek to Dingboche (4,410m) - Enter the high altitude zone</li>
                                    <li><strong>Day 7:</strong> Acclimatization day in Dingboche - Hike to Nagarjun Hill</li>
                                    <li><strong>Day 8:</strong> Trek to Lobuche (4,940m) - Pass memorial cairns</li>
                                    <li><strong>Day 9:</strong> Trek to Gorak Shep (5,170m) - Visit Everest Base Camp (5,364m)</li>
                                    <li><strong>Day 10:</strong> Sunrise at Kala Patthar (5,545m) - Best Everest views</li>
                                    <li><strong>Day 11:</strong> Trek back to Pheriche (4,280m)</li>
                                    <li><strong>Day 12:</strong> Trek to Namche Bazaar (3,440m)</li>
                                    <li><strong>Day 13:</strong> Trek to Lukla (2,860m) - Celebration dinner</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- What's Included/Excluded -->
            <?php if (!empty($trip->included_items) || !empty($trip->excluded_items)): ?>
            <section class="yatra-trip-section" id="included">
                <h2 class="yatra-trip-section-title">
                    <?php echo yatra_svg_icon('check', 'yatra-trip-section-title-icon'); ?>
                    <?php echo esc_html__("What's Included & Excluded", 'yatra'); ?>
                </h2>
                <div class="yatra-included-excluded">
                    <?php if (!empty($trip->included_items)): ?>
                    <div class="yatra-included-section">
                        <h3>
                            <?php echo yatra_svg_icon('check', 'yatra-included-icon'); ?>
                            <?php echo esc_html__('Included', 'yatra'); ?>
                        </h3>
                        <ul class="yatra-included-list">
                            <?php foreach ($trip->included_items as $item): ?>
                            <?php 
                                $item_title = is_array($item) ? ($item['title'] ?? '') : (is_object($item) ? ($item->title ?? '') : $item);
                                $item_desc = is_array($item) ? ($item['description'] ?? '') : (is_object($item) ? ($item->description ?? '') : '');
                            ?>
                            <?php if (!empty($item_title)): ?>
                            <li>
                                <?php echo yatra_svg_icon('check', 'yatra-included-icon'); ?>
                                <span>
                                    <?php echo esc_html($item_title); ?>
                                    <?php if (!empty($item_desc)): ?>
                                    <small class="yatra-item-desc"><?php echo esc_html($item_desc); ?></small>
                                    <?php endif; ?>
                                </span>
                            </li>
                            <?php endif; ?>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                    <?php endif; ?>
                    <?php if (!empty($trip->excluded_items)): ?>
                    <div class="yatra-excluded-section">
                        <h3>
                            <?php echo yatra_svg_icon('x', 'yatra-excluded-icon'); ?>
                            <?php echo esc_html__('Excluded', 'yatra'); ?>
                        </h3>
                        <ul class="yatra-excluded-list">
                            <?php foreach ($trip->excluded_items as $item): ?>
                            <?php 
                                $item_title = is_array($item) ? ($item['title'] ?? '') : (is_object($item) ? ($item->title ?? '') : $item);
                                $item_desc = is_array($item) ? ($item['description'] ?? '') : (is_object($item) ? ($item->description ?? '') : '');
                            ?>
                            <?php if (!empty($item_title)): ?>
                            <li>
                                <?php echo yatra_svg_icon('x', 'yatra-excluded-icon'); ?>
                                <span>
                                    <?php echo esc_html($item_title); ?>
                                    <?php if (!empty($item_desc)): ?>
                                    <small class="yatra-item-desc"><?php echo esc_html($item_desc); ?></small>
                                    <?php endif; ?>
                                </span>
                            </li>
                            <?php endif; ?>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                    <?php endif; ?>
                </div>
            </section>
            <?php endif; ?>

            <!-- Gallery Section -->
            <?php if (!empty($trip->gallery_images) && is_array($trip->gallery_images)): ?>
            <section class="yatra-trip-section" id="gallery">
                <h2 class="yatra-trip-section-title">
                    <?php echo yatra_svg_icon('camera', 'yatra-trip-section-title-icon'); ?>
                    <?php echo esc_html__('Photo Gallery', 'yatra'); ?>
                </h2>
                <div class="yatra-trip-gallery" data-gallery="hero-gallery">
                    <?php foreach ($trip->gallery_images as $index => $image): ?>
                    <?php $img_url = is_numeric($image) ? wp_get_attachment_url($image) : $image; ?>
                    <?php if ($img_url): ?>
                    <div class="yatra-gallery-item" data-image-index="<?php echo esc_attr($index); ?>">
                        <img src="<?php echo esc_url($img_url); ?>" alt="<?php echo esc_attr(sprintf(__('Gallery Image %d', 'yatra'), $index + 1)); ?>">
                    </div>
                    <?php endif; ?>
                    <?php endforeach; ?>
                </div>
            </section>
            <?php endif; ?>

            <!-- Location/Map Section -->
            <section class="yatra-trip-section" id="location">
                <h2 class="yatra-trip-section-title">
                    <?php echo yatra_svg_icon('map-pin', 'yatra-trip-section-title-icon'); ?>
                    <?php echo esc_html__('Location', 'yatra'); ?>
                </h2>
                
                <?php if (!empty($trip->latitude) && !empty($trip->longitude)): ?>
                <div class="yatra-trip-map" id="yatra-trip-map" data-lat="<?php echo esc_attr($trip->latitude); ?>" data-lng="<?php echo esc_attr($trip->longitude); ?>">
                    <iframe
                        width="100%"
                        height="400"
                        style="border:0; border-radius: 12px;"
                        loading="lazy"
                        allowfullscreen
                        referrerpolicy="no-referrer-when-downgrade"
                        src="https://www.google.com/maps?q=<?php echo esc_attr($trip->latitude); ?>,<?php echo esc_attr($trip->longitude); ?>&output=embed">
                    </iframe>
                </div>
                <?php else: ?>
                <div class="yatra-trip-map yatra-map-placeholder">
                    <p><?php echo esc_html__('Map location not available', 'yatra'); ?></p>
                </div>
                <?php endif; ?>
                
                <?php if (!empty($trip->starting_location) || !empty($trip->ending_location) || !empty($trip->landmarks)): ?>
                <div class="yatra-location-details" style="margin-top: 24px;">
                    <?php if (!empty($trip->starting_location)): ?>
                    <p><strong><?php echo esc_html__('Starting Point:', 'yatra'); ?></strong> <?php echo esc_html($trip->starting_location); ?></p>
                    <?php endif; ?>
                    <?php if (!empty($trip->ending_location)): ?>
                    <p><strong><?php echo esc_html__('Ending Point:', 'yatra'); ?></strong> <?php echo esc_html($trip->ending_location); ?></p>
                    <?php endif; ?>
                    <?php if (!empty($trip->landmarks) && is_array($trip->landmarks)): ?>
                    <p><strong><?php echo esc_html__('Key Landmarks:', 'yatra'); ?></strong> <?php echo esc_html(implode(', ', $trip->landmarks)); ?></p>
                    <?php endif; ?>
                </div>
                <?php endif; ?>
            </section>

            <!-- Important Information Section -->
            <section class="yatra-trip-section" id="important-info">
                <h2 class="yatra-trip-section-title">
                    <?php echo yatra_svg_icon('info', 'yatra-trip-section-title-icon'); ?>
                    Important Information
                </h2>
                <div class="yatra-important-info-grid">
                    <?php if (!empty($trip->physical_requirements ?? '')): ?>
                    <div class="yatra-important-info-card">
                        <div class="yatra-important-info-icon">
                            <?php echo yatra_svg_icon('shield', 'yatra-icon-lg'); ?>
                        </div>
                        <h3 class="yatra-important-info-title">Physical Requirements</h3>
                        <p class="yatra-important-info-content"><?php echo esc_html($trip->physical_requirements ?? ''); ?></p>
                    </div>
                    <?php endif; ?>

                    <?php if (!empty($trip->visa_requirements ?? '')): ?>
                    <div class="yatra-important-info-card">
                        <div class="yatra-important-info-icon">
                            <?php echo yatra_svg_icon('file', 'yatra-icon-lg'); ?>
                        </div>
                        <h3 class="yatra-important-info-title">Visa Requirements</h3>
                        <p class="yatra-important-info-content"><?php echo esc_html($trip->visa_requirements ?? ''); ?></p>
                    </div>
                    <?php endif; ?>

                    <?php if (!empty($trip->vaccination_requirements ?? '')): ?>
                    <div class="yatra-important-info-card">
                        <div class="yatra-important-info-icon">
                            <?php echo yatra_svg_icon('shield', 'yatra-icon-lg'); ?>
                        </div>
                        <h3 class="yatra-important-info-title">Vaccination Requirements</h3>
                        <p class="yatra-important-info-content"><?php echo esc_html($trip->vaccination_requirements ?? ''); ?></p>
                    </div>
                    <?php endif; ?>

                    <?php if (!empty($trip->cancellation_policy ?? '')): ?>
                    <div class="yatra-important-info-card">
                        <div class="yatra-important-info-icon">
                            <?php echo yatra_svg_icon('info', 'yatra-icon-lg'); ?>
                        </div>
                        <h3 class="yatra-important-info-title">Cancellation Policy</h3>
                        <p class="yatra-important-info-content"><?php echo esc_html($trip->cancellation_policy ?? ''); ?></p>
                    </div>
                    <?php endif; ?>

                    <?php if (!empty($trip->age_min) || !empty($trip->age_max)): ?>
                    <div class="yatra-important-info-card">
                        <div class="yatra-important-info-icon">
                            <?php echo yatra_svg_icon('users', 'yatra-icon-lg'); ?>
                        </div>
                        <h3 class="yatra-important-info-title">Age Requirements</h3>
                        <p class="yatra-important-info-content">
                            Minimum age: <?php echo esc_html($trip->age_min ?? 'N/A'); ?> years.
                            <?php if (!empty($trip->age_max)): ?>
                            Maximum age: <?php echo esc_html($trip->age_max); ?> years.
                            <?php endif; ?>
                            Participants should be in good physical condition.
                        </p>
                    </div>
                    <?php endif; ?>

                    <?php if (!empty($trip->best_season ?? '')): ?>
                    <div class="yatra-important-info-card">
                        <div class="yatra-important-info-icon">
                            <?php echo yatra_svg_icon('sun', 'yatra-icon-lg'); ?>
                        </div>
                        <h3 class="yatra-important-info-title">Best Time to Visit</h3>
                        <p class="yatra-important-info-content"><?php echo esc_html($trip->best_season ?? ''); ?></p>
                    </div>
                    <?php endif; ?>
                </div>
            </section>

            <!-- FAQ Section -->
            <?php if (!empty($trip->faqs) && is_array($trip->faqs)): ?>
            <section class="yatra-trip-section" id="faq">
                <h2 class="yatra-trip-section-title">
                    <?php echo yatra_svg_icon('info', 'yatra-trip-section-title-icon'); ?>
                    <?php echo esc_html__('Frequently Asked Questions', 'yatra'); ?>
                </h2>
                <ul class="yatra-trip-faq">
                    <?php foreach ($trip->faqs as $faq): ?>
                    <?php 
                        $question = is_array($faq) ? ($faq['question'] ?? '') : (is_object($faq) ? ($faq->question ?? '') : '');
                        $answer = is_array($faq) ? ($faq['answer'] ?? '') : (is_object($faq) ? ($faq->answer ?? '') : '');
                    ?>
                    <?php if (!empty($question) && !empty($answer)): ?>
                    <li class="yatra-faq-item">
                        <h3 class="yatra-faq-question">
                            <?php echo esc_html($question); ?>
                            <?php echo yatra_svg_icon('chevron-down', 'yatra-faq-toggle'); ?>
                        </h3>
                        <div class="yatra-faq-answer">
                            <p><?php echo wp_kses_post($answer); ?></p>
                        </div>
                    </li>
                    <?php endif; ?>
                    <?php endforeach; ?>
                </ul>
            </section>
            <?php endif; ?>

        </div>

        <!-- Sidebar - Booking Card -->
        <aside class="yatra-trip-sidebar" id="booking">
            <?php 
            // Determine if this is a multi-day trip
            $is_multi_day = ($trip->duration_days ?? 1) > 1;
            
            // Prepare availability data for JavaScript
            $availability_json = [];
            if ($has_availability) {
                foreach ($trip->availability_dates as $avail) {
                    $availability_json[] = [
                        'id' => (int) $avail->id,
                        'date' => $avail->departure_date,
                        'departure_date' => $avail->departure_date,
                        'return_date' => $avail->return_date,
                        'price' => $avail->effective_price ?? $avail->original_price,
                        'original_price' => $avail->original_price,
                        'discounted_price' => $avail->discounted_price,
                        'seats_available' => $avail->seats_available,
                        'seats_total' => $avail->seats_total,
                        'status' => $avail->status,
                        'is_limited' => $avail->is_limited ?? false,
                        'is_sold_out' => $avail->is_sold_out ?? false,
                    ];
                }
            }
            ?>
            <div class="yatra-booking-card" 
                 data-has-availability="<?php echo $has_availability ? 'true' : 'false'; ?>"
                 data-is-multi-day="<?php echo $is_multi_day ? 'true' : 'false'; ?>"
                 data-pricing-type="<?php echo esc_attr($pricing_type); ?>"
                 data-availability='<?php echo esc_attr(json_encode($availability_json)); ?>'>
                
                <!-- Price Display -->
                <div class="yatra-booking-price">
                    <div class="yatra-booking-price-main">
                        <?php if ($has_availability || $has_traveler_pricing): ?>
                        <span class="yatra-booking-price-label-top"><?php echo esc_html__('From', 'yatra'); ?></span>
                        <?php elseif ($trip->original_price > $trip->sale_price && $trip->sale_price > 0): ?>
                        <span class="yatra-booking-price-original"><?php echo yatra_format_price($trip->original_price); ?></span>
                        <?php endif; ?>
                        <span class="yatra-booking-price-amount" id="display-price"><?php echo yatra_format_price($base_price); ?></span>
                        <span class="yatra-booking-price-label"><?php echo esc_html__('per person', 'yatra'); ?></span>
                    </div>
                </div>

                <?php if ($has_availability): ?>
                <!-- ========================================== -->
                <!-- AVAILABILITY-BASED BOOKING -->
                <!-- ========================================== -->
                <div class="yatra-availability-info">
                    <span class="yatra-availability-count">
                        <?php echo esc_html(sprintf(_n('%d departure available', '%d departures available', count($trip->availability_dates), 'yatra'), count($trip->availability_dates))); ?>
                    </span>
                </div>

                <form class="yatra-booking-form" data-booking-mode="availability">
                    <!-- Date Selection -->
                    <div class="yatra-booking-field-select">
                        <div class="yatra-booking-field-icon">
                            <?php echo yatra_svg_icon('calendar', 'yatra-icon-sm'); ?>
                        </div>
                        <input type="text" 
                               id="travel_date" 
                               name="travel_date" 
                               class="yatra-booking-select yatra-datepicker" 
                               placeholder="<?php esc_attr_e('Select date', 'yatra'); ?>" 
                               readonly 
                               required>
                        <svg class="yatra-select-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>

                    <!-- Travelers Selection - Respects Trip's Pricing Type -->
                    <?php if ($has_traveler_pricing): ?>
                        <!-- Traveler-Based Pricing: Show dynamic categories with prices -->
                        <div class="yatra-booking-field-select yatra-participants-select">
                            <div class="yatra-booking-field-icon">
                                <?php echo yatra_svg_icon('users', 'yatra-icon-sm'); ?>
                            </div>
                            <div class="yatra-participants-display" id="participants-display">
                                <?php 
                                if (!empty($trip->price_types[0]->category_label)) {
                                    echo esc_html($trip->price_types[0]->category_label) . ' x 1';
                                } else {
                                    echo esc_html__('1 Traveler', 'yatra');
                                }
                                ?>
                            </div>
                            <svg class="yatra-select-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                            <div class="yatra-booking-quantity-selector" id="quantity-selector">
                                <!-- Dynamic Traveler Categories from Database -->
                                <?php foreach ($trip->price_types as $index => $price_type): ?>
                                <div class="yatra-quantity-row" data-category-id="<?php echo esc_attr($price_type->category_id); ?>" data-price="<?php echo esc_attr($price_type->effective_price); ?>">
                                    <div class="yatra-quantity-label">
                                        <span class="yatra-quantity-title"><?php echo esc_html($price_type->category_label ?: __('Traveler', 'yatra')); ?></span>
                                        <?php if ($price_type->age_min !== null || $price_type->age_max !== null): ?>
                                        <span class="yatra-quantity-subtitle">
                                            <?php 
                                            if ($price_type->age_min !== null && $price_type->age_max !== null) {
                                                echo esc_html(sprintf(__('(Age %d-%d)', 'yatra'), $price_type->age_min, $price_type->age_max));
                                            } elseif ($price_type->age_min !== null) {
                                                echo esc_html(sprintf(__('(Age %d+)', 'yatra'), $price_type->age_min));
                                            } else {
                                                echo esc_html(sprintf(__('(Up to age %d)', 'yatra'), $price_type->age_max));
                                            }
                                            ?>
                                        </span>
                                        <?php endif; ?>
                                        <span class="yatra-quantity-price"><?php echo yatra_format_price($price_type->effective_price); ?></span>
                                    </div>
                                    <div class="yatra-quantity-controls">
                                        <button type="button" class="yatra-quantity-btn yatra-quantity-minus" data-target="traveler_<?php echo esc_attr($price_type->category_id); ?>" aria-label="<?php echo esc_attr(sprintf(__('Decrease %s', 'yatra'), $price_type->category_label)); ?>" <?php echo ($index === 0) ? '' : 'disabled'; ?>>
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                            </svg>
                                        </button>
                                        <input type="number" 
                                               id="traveler_<?php echo esc_attr($price_type->category_id); ?>" 
                                               name="travelers[<?php echo esc_attr($price_type->category_id); ?>]" 
                                               class="yatra-quantity-input" 
                                               value="<?php echo ($index === 0) ? '1' : '0'; ?>" 
                                               min="0" 
                                               max="<?php echo esc_attr($price_type->max_quantity ?: $trip->max_travelers); ?>" 
                                               readonly
                                               data-category-label="<?php echo esc_attr($price_type->category_label); ?>"
                                               data-price="<?php echo esc_attr($price_type->effective_price); ?>">
                                        <button type="button" class="yatra-quantity-btn yatra-quantity-plus" data-target="traveler_<?php echo esc_attr($price_type->category_id); ?>" aria-label="<?php echo esc_attr(sprintf(__('Increase %s', 'yatra'), $price_type->category_label)); ?>">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                                
                                <?php if (!empty($trip->age_min) && $trip->age_min > 0): ?>
                                <div class="yatra-quantity-note"><?php echo esc_html(sprintf(__('Ages %d and younger are not permitted.', 'yatra'), $trip->age_min - 1)); ?></div>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php else: ?>
                        <!-- Regular Pricing: Simple number of travelers input -->
                    <div class="yatra-booking-field-group">
                        <label for="num_travelers" class="yatra-booking-field-label"><?php echo esc_html__('Number of Travelers', 'yatra'); ?></label>
                        <div class="yatra-booking-travelers-simple">
                            <div class="yatra-booking-field-icon">
                                <?php echo yatra_svg_icon('users', 'yatra-icon-sm'); ?>
                            </div>
                            <div class="yatra-quantity-controls-inline">
                                <button type="button" class="yatra-quantity-btn yatra-quantity-minus" data-target="num_travelers" aria-label="<?php esc_attr_e('Decrease travelers', 'yatra'); ?>">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                    </svg>
                                </button>
                                <input type="number" 
                                       id="num_travelers" 
                                       name="num_travelers" 
                                       class="yatra-quantity-input-simple" 
                                       value="1" 
                                       min="<?php echo esc_attr($trip->min_travelers ?: 1); ?>" 
                                       max="<?php echo esc_attr($trip->max_travelers ?: 20); ?>" 
                                       readonly
                                       data-price="<?php echo esc_attr($base_price); ?>">
                                <button type="button" class="yatra-quantity-btn yatra-quantity-plus" data-target="num_travelers" aria-label="<?php esc_attr_e('Increase travelers', 'yatra'); ?>">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                    </svg>
                                </button>
                            </div>
                            <span class="yatra-travelers-range"><?php echo esc_html(sprintf(__('Min: %d, Max: %d', 'yatra'), $trip->min_travelers ?: 1, $trip->max_travelers ?: 20)); ?></span>
                        </div>
                    </div>
                    <?php endif; ?>
                <?php else: ?>
                <!-- ========================================== -->
                <!-- REGULAR BOOKING (No Availability Setup) -->
                <!-- ========================================== -->
                
                <?php if (!empty($trip->available_from) || !empty($trip->available_to)): ?>
                <div class="yatra-booking-availability-compact">
                    <span class="yatra-booking-availability-text">
                        <?php 
                        if (!empty($trip->available_from) && !empty($trip->available_to)) {
                            echo esc_html(sprintf(__('Available: %s - %s', 'yatra'), 
                                date_i18n(get_option('date_format'), strtotime($trip->available_from)),
                                date_i18n(get_option('date_format'), strtotime($trip->available_to))
                            ));
                        } elseif (!empty($trip->available_from)) {
                            echo esc_html(sprintf(__('Available from: %s', 'yatra'), 
                                date_i18n(get_option('date_format'), strtotime($trip->available_from))
                            ));
                        } else {
                            echo esc_html(sprintf(__('Available until: %s', 'yatra'), 
                                date_i18n(get_option('date_format'), strtotime($trip->available_to))
                            ));
                        }
                        ?>
                    </span>
                </div>
                <?php endif; ?>

                <form class="yatra-booking-form" data-booking-mode="regular">
                    <!-- Date Selection (Flexible) -->
                    <div class="yatra-booking-field-select">
                        <div class="yatra-booking-field-icon">
                            <?php echo yatra_svg_icon('calendar', 'yatra-icon-sm'); ?>
                        </div>
                        <input type="text" 
                               id="travel_date" 
                               name="travel_date" 
                               class="yatra-booking-select yatra-datepicker" 
                               placeholder="<?php esc_attr_e('Select date', 'yatra'); ?>" 
                               data-min-date="<?php echo esc_attr($trip->available_from ?: date('Y-m-d')); ?>"
                               data-max-date="<?php echo esc_attr($trip->available_to ?: ''); ?>"
                               readonly 
                               required>
                        <svg class="yatra-select-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>

                    <!-- Travelers Selection -->
                    <?php if ($has_traveler_pricing): ?>
                        <!-- Traveler-Based Pricing: Show dynamic categories with prices -->
                        <div class="yatra-booking-field-select yatra-participants-select">
                            <div class="yatra-booking-field-icon">
                                <?php echo yatra_svg_icon('users', 'yatra-icon-sm'); ?>
                            </div>
                            <div class="yatra-participants-display" id="participants-display">
                                <?php 
                                if (!empty($trip->price_types[0]->category_label)) {
                                    echo esc_html($trip->price_types[0]->category_label) . ' x 1';
                                } else {
                                    echo esc_html__('1 Traveler', 'yatra');
                                }
                                ?>
                            </div>
                            <svg class="yatra-select-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                            <div class="yatra-booking-quantity-selector" id="quantity-selector">
                                <!-- Dynamic Traveler Categories from Database -->
                                <?php foreach ($trip->price_types as $index => $price_type): ?>
                                <div class="yatra-quantity-row" data-category-id="<?php echo esc_attr($price_type->category_id); ?>" data-price="<?php echo esc_attr($price_type->effective_price); ?>">
                                    <div class="yatra-quantity-label">
                                        <span class="yatra-quantity-title"><?php echo esc_html($price_type->category_label ?: __('Traveler', 'yatra')); ?></span>
                                        <?php if ($price_type->age_min !== null || $price_type->age_max !== null): ?>
                                        <span class="yatra-quantity-subtitle">
                                            <?php 
                                            if ($price_type->age_min !== null && $price_type->age_max !== null) {
                                                echo esc_html(sprintf(__('(Age %d-%d)', 'yatra'), $price_type->age_min, $price_type->age_max));
                                            } elseif ($price_type->age_min !== null) {
                                                echo esc_html(sprintf(__('(Age %d+)', 'yatra'), $price_type->age_min));
                                            } else {
                                                echo esc_html(sprintf(__('(Up to age %d)', 'yatra'), $price_type->age_max));
                                            }
                                            ?>
                                        </span>
                                        <?php endif; ?>
                                        <span class="yatra-quantity-price"><?php echo yatra_format_price($price_type->effective_price); ?></span>
                                    </div>
                                    <div class="yatra-quantity-controls">
                                        <button type="button" class="yatra-quantity-btn yatra-quantity-minus" data-target="traveler_<?php echo esc_attr($price_type->category_id); ?>" aria-label="<?php echo esc_attr(sprintf(__('Decrease %s', 'yatra'), $price_type->category_label)); ?>" <?php echo ($index === 0) ? '' : 'disabled'; ?>>
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                            </svg>
                                        </button>
                                        <input type="number" 
                                               id="traveler_<?php echo esc_attr($price_type->category_id); ?>" 
                                               name="travelers[<?php echo esc_attr($price_type->category_id); ?>]" 
                                               class="yatra-quantity-input" 
                                               value="<?php echo ($index === 0) ? '1' : '0'; ?>" 
                                               min="0" 
                                               max="<?php echo esc_attr($price_type->max_quantity ?: $trip->max_travelers); ?>" 
                                               readonly
                                               data-category-label="<?php echo esc_attr($price_type->category_label); ?>"
                                               data-price="<?php echo esc_attr($price_type->effective_price); ?>">
                                        <button type="button" class="yatra-quantity-btn yatra-quantity-plus" data-target="traveler_<?php echo esc_attr($price_type->category_id); ?>" aria-label="<?php echo esc_attr(sprintf(__('Increase %s', 'yatra'), $price_type->category_label)); ?>">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                                
                                <?php if (!empty($trip->age_min) && $trip->age_min > 0): ?>
                                <div class="yatra-quantity-note"><?php echo esc_html(sprintf(__('Ages %d and younger are not permitted.', 'yatra'), $trip->age_min - 1)); ?></div>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php else: ?>
                        <!-- Regular Pricing: Simple number of travelers input -->
                        <div class="yatra-booking-field-group">
                            <label for="num_travelers" class="yatra-booking-field-label"><?php echo esc_html__('Number of Travelers', 'yatra'); ?></label>
                            <div class="yatra-booking-travelers-simple">
                                <div class="yatra-booking-field-icon">
                                    <?php echo yatra_svg_icon('users', 'yatra-icon-sm'); ?>
                                </div>
                                <div class="yatra-quantity-controls-inline">
                                    <button type="button" class="yatra-quantity-btn yatra-quantity-minus" data-target="num_travelers" aria-label="<?php esc_attr_e('Decrease travelers', 'yatra'); ?>">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                        </svg>
                                    </button>
                                    <input type="number" 
                                           id="num_travelers" 
                                           name="num_travelers" 
                                           class="yatra-quantity-input-simple" 
                                           value="1" 
                                           min="<?php echo esc_attr($trip->min_travelers ?: 1); ?>" 
                                           max="<?php echo esc_attr($trip->max_travelers ?: 20); ?>" 
                                           readonly
                                           data-price="<?php echo esc_attr($base_price); ?>">
                                    <button type="button" class="yatra-quantity-btn yatra-quantity-plus" data-target="num_travelers" aria-label="<?php esc_attr_e('Increase travelers', 'yatra'); ?>">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                        </svg>
                                    </button>
                                </div>
                                <span class="yatra-travelers-range"><?php echo esc_html(sprintf(__('Min: %d, Max: %d', 'yatra'), $trip->min_travelers ?: 1, $trip->max_travelers ?: 20)); ?></span>
                            </div>
                        </div>
                    <?php endif; ?>
                <?php endif; ?>

                    <!-- Total Price Display (Dynamic) -->
                    <div class="yatra-booking-total" id="booking-total">
                        <div class="yatra-booking-total-label"><?php echo esc_html__('Total', 'yatra'); ?></div>
                        <div class="yatra-booking-total-amount" id="total-amount"><?php echo yatra_format_price($base_price); ?></div>
                    </div>

                    <!-- Action Buttons -->
                    <button type="button" class="yatra-booking-button" id="check-availability-btn" data-trip-id="<?php echo esc_attr($trip->id); ?>">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <?php echo esc_html__('Check Availability', 'yatra'); ?>
                    </button>

                    <button type="button" class="yatra-booking-enquiry-button" id="open-enquiry-modal" onclick="event.preventDefault(); event.stopPropagation(); const modal = document.getElementById('enquiry-modal'); if(modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; } return false;">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                        </svg>
                        <?php echo esc_html__('Make Enquiry', 'yatra'); ?>
                    </button>

                    <!-- Single Trust Signal -->
                    <div class="yatra-booking-trust">
                        <div class="yatra-booking-trust-icon">
                            <?php echo yatra_svg_icon('check', 'yatra-icon-xs'); ?>
                        </div>
                        <div class="yatra-booking-trust-text">
                            <strong>Free cancellation</strong> up to 24 hours before
                        </div>
                    </div>
                </form>
            </div>
        </aside>
    </div>

    <!-- Similar Adventures Section - Carousel -->
    <section class="yatra-similar-section">
        <div class="yatra-similar-section-container">
            <div class="yatra-similar-section-header">
                <h2 class="yatra-similar-section-title">
                    <?php echo yatra_svg_icon('mountain', 'yatra-similar-section-icon'); ?>
                    <?php echo esc_html__('Similar Adventures', 'yatra'); ?>
                </h2>
                <div class="yatra-carousel-nav">
                    <button type="button" class="yatra-carousel-btn yatra-carousel-prev" id="similar-prev" aria-label="<?php echo esc_attr__('Previous', 'yatra'); ?>">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <button type="button" class="yatra-carousel-btn yatra-carousel-next" id="similar-next" aria-label="<?php echo esc_attr__('Next', 'yatra'); ?>">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="yatra-carousel-wrapper">
                <div class="yatra-carousel-track" id="similar-carousel">
                    <?php
                    // Use dynamic similar trips from controller, with fallback to sample data
                    $similar_trips_data = !empty($trip->similar_trips) ? $trip->similar_trips : [];
                    
                    // If no similar trips from DB, show placeholder data for demo
                    if (empty($similar_trips_data)) {
                        $similar_trips_data = [
                            (object)[
                                'title' => 'Annapurna Base Camp Trek',
                                'slug' => 'annapurna-base-camp-trek',
                                'featured_image_url' => 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
                                'duration_days' => 12,
                                'duration_nights' => 11,
                                'sale_price' => 1450,
                                'original_price' => 1650,
                                'currency' => 'USD',
                                'discount_percentage' => 12,
                                'difficulty_level' => 'Moderate',
                                'location' => 'Nepal',
                                'rating' => 4.8,
                                'reviews_count' => 156,
                                'highlights' => ['Mountain Views', 'Teahouse Stay'],
                            ],
                            (object)[
                                'title' => 'Langtang Valley Trek',
                                'slug' => 'langtang-valley-trek',
                                'featured_image_url' => 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop',
                                'duration_days' => 10,
                                'duration_nights' => 9,
                                'sale_price' => 1200,
                                'original_price' => 1200,
                                'currency' => 'USD',
                                'discount_percentage' => 0,
                                'difficulty_level' => 'Moderate',
                                'location' => 'Nepal',
                                'rating' => 4.6,
                                'reviews_count' => 89,
                                'highlights' => ['Valley Views', 'Local Culture'],
                            ],
                            (object)[
                                'title' => 'Manaslu Circuit Trek',
                                'slug' => 'manaslu-circuit-trek',
                                'featured_image_url' => 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
                                'duration_days' => 16,
                                'duration_nights' => 15,
                                'sale_price' => 1850,
                                'original_price' => 2100,
                                'currency' => 'USD',
                                'discount_percentage' => 12,
                                'difficulty_level' => 'Challenging',
                                'location' => 'Nepal',
                                'rating' => 4.9,
                                'reviews_count' => 67,
                                'highlights' => ['Remote Trail', 'Less Crowded'],
                            ],
                            (object)[
                                'title' => 'Gokyo Lakes Trek',
                                'slug' => 'gokyo-lakes-trek',
                                'featured_image_url' => 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=800&h=600&fit=crop',
                                'duration_days' => 14,
                                'duration_nights' => 13,
                                'sale_price' => 1550,
                                'original_price' => 1550,
                                'currency' => 'USD',
                                'discount_percentage' => 0,
                                'difficulty_level' => 'Moderate',
                                'location' => 'Nepal',
                                'rating' => 4.7,
                                'reviews_count' => 124,
                                'highlights' => ['Turquoise Lakes', 'Gokyo Ri'],
                            ],
                            (object)[
                                'title' => 'Upper Mustang Trek',
                                'slug' => 'upper-mustang-trek',
                                'featured_image_url' => 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop',
                                'duration_days' => 15,
                                'duration_nights' => 14,
                                'sale_price' => 2200,
                                'original_price' => 2500,
                                'currency' => 'USD',
                                'discount_percentage' => 12,
                                'difficulty_level' => 'Moderate',
                                'location' => 'Nepal',
                                'rating' => 4.8,
                                'reviews_count' => 45,
                                'highlights' => ['Ancient Culture', 'Desert Landscape'],
                            ],
                            (object)[
                                'title' => 'Mardi Himal Trek',
                                'slug' => 'mardi-himal-trek',
                                'featured_image_url' => 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&h=600&fit=crop',
                                'duration_days' => 7,
                                'duration_nights' => 6,
                                'sale_price' => 850,
                                'original_price' => 850,
                                'currency' => 'USD',
                                'discount_percentage' => 0,
                                'difficulty_level' => 'Easy',
                                'location' => 'Nepal',
                                'rating' => 4.5,
                                'reviews_count' => 203,
                                'highlights' => ['Short Trek', 'Mountain Views'],
                            ],
                        ];
                    }

                    foreach ($similar_trips_data as $similar_trip) {
                        // Handle both object and array format
                        $st_title = is_object($similar_trip) ? $similar_trip->title : ($similar_trip['title'] ?? '');
                        $st_slug = is_object($similar_trip) ? ($similar_trip->slug ?? sanitize_title($st_title)) : ($similar_trip['slug'] ?? sanitize_title($st_title));
                        $st_image = is_object($similar_trip) ? ($similar_trip->featured_image_url ?? '') : ($similar_trip['featured_image_url'] ?? '');
                        $st_duration_days = is_object($similar_trip) ? ($similar_trip->duration_days ?? 1) : ($similar_trip['duration_days'] ?? 1);
                        $st_duration_nights = is_object($similar_trip) ? ($similar_trip->duration_nights ?? 0) : ($similar_trip['duration_nights'] ?? 0);
                        $st_sale_price = is_object($similar_trip) ? ($similar_trip->sale_price ?? 0) : ($similar_trip['sale_price'] ?? 0);
                        $st_original_price = is_object($similar_trip) ? ($similar_trip->original_price ?? 0) : ($similar_trip['original_price'] ?? 0);
                        $st_currency = is_object($similar_trip) ? ($similar_trip->currency ?? 'USD') : ($similar_trip['currency'] ?? 'USD');
                        $st_discount = is_object($similar_trip) ? ($similar_trip->discount_percentage ?? 0) : ($similar_trip['discount_percentage'] ?? 0);
                        $st_difficulty = is_object($similar_trip) ? ($similar_trip->difficulty_level ?? 'Moderate') : ($similar_trip['difficulty_level'] ?? 'Moderate');
                        $st_location = is_object($similar_trip) ? ($similar_trip->location ?? '') : ($similar_trip['location'] ?? '');
                        $st_rating = is_object($similar_trip) ? ($similar_trip->rating ?? 0) : ($similar_trip['rating'] ?? 0);
                        $st_reviews_count = is_object($similar_trip) ? ($similar_trip->reviews_count ?? 0) : ($similar_trip['reviews_count'] ?? 0);
                        $st_highlights = is_object($similar_trip) ? ($similar_trip->highlights ?? []) : ($similar_trip['highlights'] ?? []);
                    ?>
                    <div class="yatra-carousel-item">
                        <div class="yatra-trip-card">
                            <div class="yatra-trip-image">
                                <img src="<?php echo esc_url($st_image ?: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'); ?>" alt="<?php echo esc_attr($st_title); ?>" loading="lazy">
                                <?php if ($st_discount > 0): ?>
                                <div class="yatra-discount-badge">
                                    <?php echo esc_html($st_discount); ?>% <?php echo esc_html__('OFF', 'yatra'); ?>
                                </div>
                                <?php endif; ?>
                                <button class="yatra-favorite-btn" title="<?php echo esc_attr__('Add to favorites', 'yatra'); ?>">
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                                    </svg>
                                </button>
                            </div>
                            
                            <div class="yatra-trip-content">
                                <div class="yatra-trip-meta">
                                    <?php if ($st_location): ?>
                                    <span class="yatra-trip-location"><?php echo esc_html($st_location); ?></span>
                                    <span class="yatra-trip-separator">•</span>
                                    <?php endif; ?>
                                    <span class="yatra-trip-duration"><?php echo esc_html(yatra_format_duration($st_duration_days, $st_duration_nights)); ?></span>
                                    <span class="yatra-trip-separator">•</span>
                                    <span class="yatra-trip-difficulty"><?php echo esc_html(ucfirst($st_difficulty)); ?></span>
                                </div>
                                
                                <h3 class="yatra-trip-title"><?php echo esc_html($st_title); ?></h3>
                                
                                <?php if (!empty($st_highlights) && is_array($st_highlights)): ?>
                                <div class="yatra-trip-highlights">
                                    <?php foreach (array_slice($st_highlights, 0, 2) as $highlight): ?>
                                    <span class="yatra-highlight-badge"><?php echo esc_html($highlight); ?></span>
                                    <?php endforeach; ?>
                                </div>
                                <?php endif; ?>
                                
                                <?php if ($st_rating > 0): ?>
                                <div class="yatra-trip-rating">
                                    <div class="yatra-rating-stars">
                                        <svg width="16" height="16" fill="#fbbf24" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                        <span class="yatra-rating-value"><?php echo esc_html(number_format($st_rating, 1)); ?></span>
                                    </div>
                                    <?php if ($st_reviews_count > 0): ?>
                                    <span class="yatra-reviews-count">(<?php echo esc_html(number_format($st_reviews_count)); ?> <?php echo esc_html(_n('review', 'reviews', $st_reviews_count, 'yatra')); ?>)</span>
                                    <?php endif; ?>
                                </div>
                                <?php endif; ?>
                                
                                <div class="yatra-trip-footer">
                                    <div class="yatra-trip-price">
                                        <?php if ($st_original_price > $st_sale_price): ?>
                                        <div class="yatra-original-price"><?php echo esc_html(yatra_format_price($st_original_price)); ?></div>
                                        <?php endif; ?>
                                        <div class="yatra-current-price"><?php echo esc_html(yatra_format_price($st_sale_price)); ?></div>
                                        <div class="yatra-price-note"><?php echo esc_html__('per person', 'yatra'); ?></div>
                                    </div>
                                    <a href="<?php echo esc_url(home_url('/trip/' . $st_slug)); ?>" class="yatra-card-view-btn"><?php echo esc_html__('View Details', 'yatra'); ?></a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <?php } ?>
                </div>
            </div>
        </div>
    </section>

    <!-- Reviews Section - Full Width -->
    <?php if (yatra_reviews_enabled()): ?>
    <section class="yatra-reviews-section" id="reviews">
        <div class="yatra-reviews-section-container">
            <div class="yatra-reviews-header">
                <h2 class="yatra-reviews-section-title">
                    <?php echo yatra_svg_icon('star', 'yatra-reviews-section-icon'); ?>
                    <?php echo esc_html__('Reviews', 'yatra'); ?>
                </h2>
            </div>

            <?php 
            // Use dynamic reviews from database (via SingleTripController)
            $display_reviews = !empty($trip->reviews) && is_array($trip->reviews) ? $trip->reviews : [];
            
            // Calculate rating stats from actual reviews
            $total_reviews = count($display_reviews);
            $avg_rating = $trip->average_rating > 0 ? $trip->average_rating : 0;
            
            // Calculate rating distribution (5★, 4★, 3★, 2★, 1★)
            $rating_distribution = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
            foreach ($display_reviews as $review) {
                $review_rating = (int) (is_object($review) ? ($review->rating ?? 0) : ($review['rating'] ?? 0));
                if ($review_rating >= 1 && $review_rating <= 5) {
                    $rating_distribution[$review_rating]++;
                }
            }
            
            // If we have reviews, calculate average from them
            if ($total_reviews > 0 && $avg_rating == 0) {
                $total_rating = 0;
                foreach ($display_reviews as $review) {
                    $total_rating += (int) (is_object($review) ? ($review->rating ?? 0) : ($review['rating'] ?? 0));
                }
                $avg_rating = round($total_rating / $total_reviews, 1);
            }
            ?>

            <div class="yatra-reviews-container">
                <!-- Left: Overall Rating Summary -->
                <div class="yatra-reviews-summary">
                    <div class="yatra-overall-rating">
                        <div class="yatra-overall-rating-score">
                            <span class="yatra-rating-big"><?php echo esc_html(number_format($avg_rating, 1)); ?></span>
                            <span class="yatra-rating-max">/5</span>
                        </div>
                        <div class="yatra-overall-stars">
                            <?php 
                            $full_stars = floor($avg_rating);
                            $has_half = ($avg_rating - $full_stars) >= 0.3;
                            for ($i = 1; $i <= 5; $i++): 
                                if ($i <= $full_stars):
                            ?>
                            <span class="yatra-star-icon filled">★</span>
                            <?php elseif ($i == $full_stars + 1 && $has_half): ?>
                            <span class="yatra-star-icon half">★</span>
                            <?php else: ?>
                            <span class="yatra-star-icon">★</span>
                            <?php endif; endfor; ?>
                        </div>
                        <p class="yatra-reviews-based-on">
                            <?php echo esc_html(sprintf(_n('based on %s review', 'based on %s reviews', $total_reviews, 'yatra'), number_format($total_reviews))); ?>
                        </p>
                    </div>

                    <div class="yatra-rating-distribution">
                        <h4 class="yatra-rating-distribution-title"><?php echo esc_html__('Rating breakdown', 'yatra'); ?></h4>
                        <?php for ($star = 5; $star >= 1; $star--): 
                            $count = $rating_distribution[$star];
                            $percentage = $total_reviews > 0 ? ($count / $total_reviews) * 100 : 0;
                        ?>
                        <div class="yatra-rating-row">
                            <span class="yatra-rating-star-label">
                                <?php for ($s = 1; $s <= 5; $s++): ?>
                                <span class="yatra-breakdown-star <?php echo $s <= $star ? 'filled' : ''; ?>">★</span>
                                <?php endfor; ?>
                            </span>
                            <div class="yatra-rating-bar">
                                <div class="yatra-rating-bar-fill" style="width: <?php echo esc_attr($percentage); ?>%"></div>
                            </div>
                            <span class="yatra-rating-count"><?php echo esc_html($count); ?></span>
                        </div>
                        <?php endfor; ?>
                    </div>
                </div>

                <!-- Right: Reviews List -->
                <div class="yatra-reviews-list">
                    <?php if (!empty($display_reviews)): ?>
                    <!-- Sort & Filter Toolbar -->
                    <div class="yatra-reviews-toolbar">
                        <div class="yatra-reviews-sort">
                            <span class="yatra-sort-label"><?php echo esc_html__('Sort by:', 'yatra'); ?></span>
                            <select class="yatra-sort-select" id="review-sort">
                                <option value="newest"><?php echo esc_html__('Newest first', 'yatra'); ?></option>
                                <option value="highest"><?php echo esc_html__('Highest rated', 'yatra'); ?></option>
                                <option value="lowest"><?php echo esc_html__('Lowest rated', 'yatra'); ?></option>
                            </select>
                        </div>
                    </div>
                    <!-- Reviews -->
                    <div class="yatra-reviews-items">
                        <?php foreach ($display_reviews as $review):
                            $review_rating = is_object($review) ? ($review->rating ?? 5) : ($review['rating'] ?? 5);
                            $review_title = is_object($review) ? ($review->title ?? '') : ($review['title'] ?? '');
                            $review_content = is_object($review) ? ($review->content ?? '') : ($review['content'] ?? '');
                            $review_author = is_object($review) ? ($review->author_name ?? 'Anonymous') : ($review['author_name'] ?? 'Anonymous');
                            $review_location = is_object($review) ? ($review->author_location ?? '') : ($review['author_location'] ?? '');
                            $review_date = is_object($review) ? ($review->created_at ?? '') : ($review['created_at'] ?? '');
                            $review_user_id = is_object($review) ? ($review->user_id ?? 0) : ($review['user_id'] ?? 0);
                            $is_verified = $review_user_id > 0;
                            $author_initial = strtoupper(substr($review_author, 0, 1));
                            $avatar_colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
                            $avatar_color = $avatar_colors[ord($author_initial) % count($avatar_colors)];
                        ?>
                        <div class="yatra-review-item">
                            <div class="yatra-review-header">
                                <div class="yatra-review-header-left">
                                    <div class="yatra-review-avatar" style="background: linear-gradient(135deg, <?php echo esc_attr($avatar_color); ?> 0%, <?php echo esc_attr($avatar_color); ?>dd 100%);">
                                        <?php echo esc_html($author_initial); ?>
                                    </div>
                                    <div class="yatra-review-author-info">
                                        <div class="yatra-review-author-top">
                                            <span class="yatra-review-author-name"><?php echo esc_html($review_author); ?></span>
                                            <?php if ($is_verified): ?>
                                            <span class="yatra-verified-badge">
                                                <svg class="yatra-icon-xs" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                                    <path d="M20 6L9 17l-5-5"/>
                                                </svg>
                                                <?php echo esc_html__('Verified', 'yatra'); ?>
                                            </span>
                                            <?php endif; ?>
                                        </div>
                                        <div class="yatra-review-meta">
                                            <?php if ($review_date): ?>
                                            <span class="yatra-review-date"><?php echo esc_html(date_i18n('F j, Y', strtotime($review_date))); ?></span>
                                            <?php endif; ?>
                                            <?php if ($review_location): ?>
                                            <span class="yatra-review-author-location">• <?php echo esc_html($review_location); ?></span>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                </div>
                                <div class="yatra-review-stars">
                                    <?php for ($i = 1; $i <= 5; $i++): ?>
                                    <span class="yatra-star-sm <?php echo $i <= $review_rating ? 'filled' : ''; ?>">★</span>
                                    <?php endfor; ?>
                                </div>
                            </div>
                            <div class="yatra-review-body">
                                <?php if ($review_title): ?>
                                <h4 class="yatra-review-title"><?php echo esc_html($review_title); ?></h4>
                                <?php endif; ?>
                                <p class="yatra-review-content"><?php echo esc_html($review_content); ?></p>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>

                    <!-- Load More -->
                    <?php if ($total_reviews > 3): ?>
                    <div class="yatra-reviews-load-more">
                        <button class="yatra-load-more-btn" type="button">
                            <?php echo esc_html__('Show more reviews', 'yatra'); ?>
                        </button>
                    </div>
                    <?php endif; ?>
                    <?php else: ?>
                    <div class="yatra-no-reviews-message">
                        <div class="yatra-no-reviews-icon">
                            <?php echo yatra_svg_icon('message', 'yatra-icon-lg'); ?>
                        </div>
                        <p><?php echo esc_html__('No reviews yet. Be the first to review this trip!', 'yatra'); ?></p>
                    </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Review Form -->
            <?php 
            $can_review = yatra_can_review((int) $trip->id);
            $require_booking = yatra_setting_enabled('require_booking_to_review');
            $minimum_rating = (int) yatra_get_setting('minimum_rating', 1);
            
            // Check for existing review that can be edited
            $existing_review = null;
            $can_edit_review = false;
            $edit_time_remaining = '';
            
            if (is_user_logged_in()) {
                $existing_review = yatra_get_user_review((int) $trip->id);
                if ($existing_review) {
                    $can_edit_review = yatra_can_edit_review($existing_review);
                    if ($can_edit_review) {
                        $edit_time_remaining = yatra_get_review_edit_time_remaining($existing_review);
                    }
                }
            }
            ?>
            <div class="yatra-review-form-section">
                <?php if ($existing_review && $can_edit_review): ?>
                <h3 class="yatra-review-form-title"><?php echo esc_html__('Edit Your Review', 'yatra'); ?></h3>
                <div class="yatra-review-edit-notice">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p><?php echo esc_html(sprintf(__('You can edit your review for %s more.', 'yatra'), $edit_time_remaining)); ?></p>
                </div>
                <?php else: ?>
                <h3 class="yatra-review-form-title"><?php echo esc_html__('Write a Review', 'yatra'); ?></h3>
                <?php endif; ?>
                
                <?php if (!is_user_logged_in()): ?>
                <div class="yatra-review-login-notice">
                    <p><?php echo esc_html__('Please', 'yatra'); ?> <a href="<?php echo esc_url(wp_login_url(get_permalink())); ?>"><?php echo esc_html__('log in', 'yatra'); ?></a> <?php echo esc_html__('to write a review.', 'yatra'); ?></p>
                </div>
                <?php elseif (!$can_review && $require_booking): ?>
                <div class="yatra-review-booking-notice">
                    <p><?php echo esc_html__('Only customers who have booked this trip can leave a review.', 'yatra'); ?></p>
                </div>
                <?php elseif ($existing_review && !$can_edit_review): ?>
                <div class="yatra-review-already-notice">
                    <?php if (isset($existing_review->status) && $existing_review->status === 'approved'): ?>
                    <p><?php echo esc_html__('Thank you! Your review has been approved and published.', 'yatra'); ?></p>
                    <?php else: ?>
                    <p><?php echo esc_html__('You have already reviewed this trip.', 'yatra'); ?></p>
                    <?php endif; ?>
                </div>
                <?php elseif ($can_review || ($existing_review && $can_edit_review)): ?>
                <form class="yatra-review-form" id="yatra-review-form" method="post">
                    <?php wp_nonce_field('yatra_submit_review', 'yatra_review_nonce'); ?>
                    <input type="hidden" name="trip_id" value="<?php echo esc_attr($trip->id); ?>">
                    <?php if ($existing_review && $can_edit_review): ?>
                    <input type="hidden" name="review_id" value="<?php echo esc_attr($existing_review->id); ?>">
                    <input type="hidden" name="action_type" value="edit">
                    <?php endif; ?>
                    
                    <!-- Rating -->
                    <div class="yatra-form-field yatra-rating-field">
                        <label class="yatra-form-label"><?php echo esc_html__('Your Rating', 'yatra'); ?> <span class="yatra-required">*</span></label>
                        <div class="yatra-star-rating-input" data-min-rating="<?php echo esc_attr($minimum_rating); ?>">
                            <?php 
                            $selected_rating = $existing_review ? (int) $existing_review->rating : 5;
                            for ($i = 1; $i <= 5; $i++): 
                            ?>
                            <input type="radio" name="rating" id="rating-<?php echo $i; ?>" value="<?php echo $i; ?>" <?php echo $i === $selected_rating ? 'checked' : ''; ?> <?php echo $i < $minimum_rating ? 'disabled' : ''; ?>>
                            <label for="rating-<?php echo $i; ?>" class="yatra-star-label" title="<?php echo esc_attr(sprintf(__('%d star', 'yatra'), $i)); ?>">★</label>
                            <?php endfor; ?>
                        </div>
                        <?php if ($minimum_rating > 1): ?>
                        <p class="yatra-field-hint"><?php echo esc_html(sprintf(__('Minimum rating: %d star(s)', 'yatra'), $minimum_rating)); ?></p>
                        <?php endif; ?>
                    </div>

                    <!-- Title -->
                    <div class="yatra-form-field">
                        <label for="review-title" class="yatra-form-label"><?php echo esc_html__('Review Title', 'yatra'); ?></label>
                        <input type="text" id="review-title" name="title" class="yatra-form-input" placeholder="<?php echo esc_attr__('Summarize your experience', 'yatra'); ?>" maxlength="100" value="<?php echo $existing_review ? esc_attr($existing_review->title ?? '') : ''; ?>">
                    </div>

                    <!-- Review Content -->
                    <div class="yatra-form-field">
                        <label for="review-content" class="yatra-form-label"><?php echo esc_html__('Your Review', 'yatra'); ?> <span class="yatra-required">*</span></label>
                        <textarea id="review-content" name="content" class="yatra-form-textarea" rows="5" placeholder="<?php echo esc_attr__('Share your experience with this trip...', 'yatra'); ?>" required minlength="20"><?php echo $existing_review ? esc_textarea($existing_review->content ?? '') : ''; ?></textarea>
                        <p class="yatra-field-hint"><?php echo esc_html__('Minimum 20 characters', 'yatra'); ?></p>
                    </div>

                    <!-- Submit Button -->
                    <div class="yatra-form-field">
                        <button type="submit" class="yatra-review-submit-btn">
                            <?php echo yatra_svg_icon('check', 'yatra-icon-sm'); ?>
                            <?php echo $existing_review && $can_edit_review ? esc_html__('Update Review', 'yatra') : esc_html__('Submit Review', 'yatra'); ?>
                        </button>
                        <?php if (yatra_setting_enabled('enable_review_moderation')): ?>
                        <p class="yatra-review-moderation-notice"><?php echo esc_html__('Your review will be published after moderation.', 'yatra'); ?></p>
                        <?php endif; ?>
                    </div>
                </form>
                <?php endif; ?>
            </div>
        </div>
    </section>
    <?php endif; ?>
</div>

<!-- Enquiry Modal -->
<div class="yatra-enquiry-modal" id="enquiry-modal" role="dialog" aria-modal="true" aria-label="Make Enquiry">
    <div class="yatra-enquiry-modal-overlay"></div>
    <div class="yatra-enquiry-modal-content">
        <button type="button" class="yatra-enquiry-modal-close" aria-label="Close Enquiry Form">
            <svg class="yatra-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
        <div class="yatra-enquiry-modal-header">
            <h2 class="yatra-enquiry-modal-title">Make an Enquiry</h2>
            <p class="yatra-enquiry-modal-subtitle">Fill out the form below and we'll get back to you as soon as possible</p>
        </div>
        <form class="yatra-enquiry-form" id="enquiry-form">
            <input type="hidden" name="action" value="yatra_submit_enquiry">
            <input type="hidden" name="trip_id" value="<?php echo esc_attr((int) $trip->id); ?>">
            <?php wp_nonce_field('yatra_submit_enquiry', 'yatra_enquiry_nonce'); ?>
            
            <div class="yatra-enquiry-message" id="enquiry-message-box" style="display: none;"></div>
            
            <div class="yatra-enquiry-form-grid">
                <div class="yatra-enquiry-field">
                    <label for="enquiry-name" class="yatra-enquiry-label">Full Name <span class="yatra-enquiry-required">*</span></label>
                    <input type="text" id="enquiry-name" name="name" class="yatra-enquiry-input" placeholder="Enter your full name" required>
                </div>
                
                <div class="yatra-enquiry-field">
                    <label for="enquiry-email" class="yatra-enquiry-label">Email Address <span class="yatra-enquiry-required">*</span></label>
                    <input type="email" id="enquiry-email" name="email" class="yatra-enquiry-input" placeholder="your.email@example.com" required>
                </div>
                
                <div class="yatra-enquiry-field">
                    <label for="enquiry-phone" class="yatra-enquiry-label">Phone Number</label>
                    <input type="tel" id="enquiry-phone" name="phone" class="yatra-enquiry-input" placeholder="+1 (234) 567-8900">
                </div>
            </div>
            
            <div class="yatra-enquiry-field-group">
                <div class="yatra-enquiry-field">
                    <label for="enquiry-travel-date" class="yatra-enquiry-label">Preferred Travel Date</label>
                    <div class="yatra-booking-field-select">
                        <div class="yatra-booking-field-icon">
                            <?php echo yatra_svg_icon('calendar', 'yatra-icon-sm'); ?>
                        </div>
                        <input type="text" id="enquiry-travel-date" name="travel_date" class="yatra-booking-select yatra-enquiry-datepicker" placeholder="Select date" readonly>
                        <svg class="yatra-select-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                </div>
                
                <div class="yatra-enquiry-field">
                    <label for="enquiry-travelers" class="yatra-enquiry-label">Number of Travelers</label>
                    <div class="yatra-booking-field-select yatra-participants-select yatra-enquiry-participants">
                        <div class="yatra-booking-field-icon">
                            <?php echo yatra_svg_icon('users', 'yatra-icon-sm'); ?>
                        </div>
                        <div class="yatra-participants-display" id="enquiry-participants-display">
                            Adult x 1
                        </div>
                        <svg class="yatra-select-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                        <div class="yatra-booking-quantity-selector" id="enquiry-quantity-selector">
                            <div class="yatra-quantity-row">
                                <div class="yatra-quantity-label">
                                    <span class="yatra-quantity-title">Adult</span>
                                    <span class="yatra-quantity-subtitle">(Age 13-99)</span>
                                </div>
                                <div class="yatra-quantity-controls">
                                    <button type="button" class="yatra-quantity-btn yatra-quantity-minus" data-target="enquiry-adults" aria-label="Decrease adults">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                        </svg>
                                    </button>
                                    <input type="number" id="enquiry-adults" name="enquiry_adults" class="yatra-quantity-input" value="1" min="1" max="20" readonly>
                                    <button type="button" class="yatra-quantity-btn yatra-quantity-plus" data-target="enquiry-adults" aria-label="Increase adults">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div class="yatra-quantity-row">
                                <div class="yatra-quantity-label">
                                    <span class="yatra-quantity-title">Child</span>
                                    <span class="yatra-quantity-subtitle">(Age 4-12)</span>
                                </div>
                                <div class="yatra-quantity-controls">
                                    <button type="button" class="yatra-quantity-btn yatra-quantity-minus" data-target="enquiry-children" aria-label="Decrease children" disabled>
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                        </svg>
                                    </button>
                                    <input type="number" id="enquiry-children" name="enquiry_children" class="yatra-quantity-input" value="0" min="0" max="10" readonly>
                                    <button type="button" class="yatra-quantity-btn yatra-quantity-plus" data-target="enquiry-children" aria-label="Increase children">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div class="yatra-quantity-note">Ages 3 and younger are not permitted.</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="yatra-enquiry-field">
                <label for="enquiry-message" class="yatra-enquiry-label">Message <span class="yatra-enquiry-required">*</span></label>
                <textarea id="enquiry-message" name="message" class="yatra-enquiry-textarea" rows="3" placeholder="Tell us about your travel plans, special requirements, or any questions you have..." required></textarea>
            </div>
            
            <div class="yatra-enquiry-actions">
                <button type="button" class="yatra-enquiry-cancel" id="close-enquiry-modal">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                    <?php echo esc_html__('Cancel', 'yatra'); ?>
                </button>
                <button type="submit" class="yatra-enquiry-submit">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                    </svg>
                    <?php echo esc_html__('Send Enquiry', 'yatra'); ?>
                </button>
            </div>
        </form>
    </div>
</div>

<?php
get_footer();
?>

