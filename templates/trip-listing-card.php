<?php
/**
 * Reusable Trip Listing Card Template
 * 
 * This template uses Trip model getter methods for clean, reusable data access
 * All trip-related data comes from the Trip model methods
 * 
 * @package Yatra
 * @var \Yatra\Models\Trip $trip The trip model object with getter methods
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Ensure we have a trip object
if (!isset($trip) || !is_object($trip)) {
    return;
}

// Convert stdClass to Trip model instance if needed
if (!($trip instanceof \Yatra\Models\Trip)) {
    $trip = \Yatra\Models\Trip::fromStdClass($trip);
}


// Get all trip data using Trip model getter methods
$title = $trip->getTitle();
$duration = $trip->getDuration();
$difficulty = $trip->getDifficulty();
$rating = $trip->getRating();
$pricing = $trip->getPricing();
$discount = $trip->getDiscount();
$image = $trip->getImage();
$permalink = $trip->getPermalink();
$destinations = $trip->getDestinations();
$categories = $trip->getCategories();
$activities = $trip->getActivities();
?>

<div class="yatra-trip-card">
    <div class="yatra-trip-card-image">
        <?php if (!empty($permalink)): ?>
            <a href="<?php echo esc_url($permalink); ?>" class="yatra-trip-image-link">
                <img src="<?php echo esc_url($image['url']); ?>" alt="<?php echo esc_attr($image['alt']); ?>">
            </a>
        <?php else: ?>
            <img src="<?php echo esc_url($image['url']); ?>" alt="<?php echo esc_attr($image['alt']); ?>">
        <?php endif; ?>
        <?php if ($discount['has_discount']): ?>
        <div class="yatra-discount-badge">
            <?php echo esc_html($discount['discount_text']); ?> OFF
        </div>
        <?php endif; ?>
        <button class="yatra-favorite-btn" data-trip-id="<?php echo esc_attr($trip->id); ?>" title="Add to favorites" aria-label="Add to favorites">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
        </button>
        <!-- Difficulty level overlay on bottom-right -->
        <?php if ($difficulty['has_difficulty'] && !empty($difficulty['icon'])): ?>
            <div class="yatra-difficulty-overlay">
                <?php echo yatra_svg_icon($difficulty['icon'], 'difficulty-icon'); ?>
                <?php echo ' ' . esc_html($difficulty['level']); ?>
            </div>
        <?php endif; ?>
    </div>
    <div class="yatra-trip-content">
        <!-- Destination section -->
        <?php if (!empty($destinations)) : ?>
            <div class="yatra-trip-destinations">
                <svg class="location-icon" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                </svg>
                <?php 
                $destination_links = [];
                foreach ($destinations as $destination) {
                    if (isset($destination->name)) {
                        $destination_permalink = function_exists('yatra_get_destination_permalink') 
                            ? yatra_get_destination_permalink($destination) 
                            : '#';
                        $destination_links[] = '<a href="' . esc_url($destination_permalink) . '" class="destination-link">' . esc_html($destination->name) . '</a>';
                    }
                }
                echo implode(', ', $destination_links);
                ?>
            </div>
        <?php endif; ?>
        
        <h3 class="yatra-trip-title">
            <?php if (!empty($permalink)): ?>
                <a href="<?php echo esc_url($permalink); ?>" class="yatra-trip-title-link"><?php echo esc_html($title); ?></a>
            <?php else: ?>
                <?php echo esc_html($title); ?>
            <?php endif; ?>
        </h3>
        
        <!-- Trip Info Row (Duration and Rating on same line) -->
        <div class="yatra-trip-info-row">
            <?php if ($duration['has_duration']): ?>
                <span class="yatra-info-badge duration">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 00-1-1H6z" clip-rule="evenodd" />
                    </svg>
                    <?php echo esc_html($duration['formatted']); ?>
                </span>
            <?php endif; ?>
            
            <div class="yatra-trip-rating">
                <div class="yatra-rating-stars">
                    <svg width="16" height="16" fill="#fbbf24" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span class="yatra-rating-value"><?php echo esc_html($rating['formatted_rating']); ?></span>
                </div>
                <span class="yatra-reviews-count">(<?php echo esc_html($rating['review_count']); ?> reviews)</span>
            </div>
        </div>

        <!-- Activities Only -->
        <?php if (!empty($activities)) : ?>
            <div class="yatra-trip-activities">
                <?php foreach (array_slice($activities, 0, 3) as $activity) : ?>
                    <a href="<?php echo esc_url(yatra_get_activity_permalink($activity)); ?>" class="yatra-tag activity-tag">
                        <?php echo esc_html($activity->name); ?>
                    </a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <!-- Categories below reviews -->
        <?php if (!empty($categories)) : ?>
            <div class="yatra-trip-categories-compact">
                <div class="yatra-category-icon">
                    <?php 
                    // Show icon from first category
                    $first_category = $categories[0];
                    if (!empty($first_category->icon)) {
                        $icon_data = maybe_unserialize($first_category->icon);
                        if (is_array($icon_data) && isset($icon_data['type']) && $icon_data['type'] === 'icon' && !empty($icon_data['value'])) {
                            echo yatra_svg_icon($icon_data['value'], 'category-icon');
                        } else {
                            // Default category icon
                            echo '<svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clip-rule="evenodd" /></svg>';
                        }
                    } else {
                        // Default category icon
                        echo '<svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clip-rule="evenodd" /></svg>';
                    }
                    ?>
                </div>
                <span class="yatra-categories-text">
                    <?php 
                    $category_links = [];
                    foreach ($categories as $category) {
                        $category_links[] = '<a href="' . esc_url(yatra_get_category_permalink($category)) . '" class="yatra-category-link">' . esc_html($category->name) . '</a>';
                    }
                    echo implode(', ', $category_links);
                    ?>
                </span>
            </div>
        <?php endif; ?>

        <div class="yatra-trip-footer">
            <div class="yatra-trip-card-price">
                <span class="yatra-trip-price">
                    <?php if ($pricing['has_price']): ?>
                        <?php echo esc_html($pricing['price_prefix'] . $pricing['current_price']); ?>
                        <?php if ($pricing['has_discount'] && !empty($pricing['original_price'])): ?>
                            <span class="yatra-original-price"><?php echo esc_html($pricing['original_price']); ?></span>
                        <?php endif; ?>
                    <?php else: ?>
                        <?php _e('Contact for pricing', 'yatra'); ?>
                    <?php endif; ?>
                </span>
            </div>
            <?php if (!empty($permalink)): ?>
                <a href="<?php echo esc_url($permalink); ?>" class="yatra-card-view-btn"><?php esc_html_e('View Details', 'yatra'); ?></a>
            <?php endif; ?>
        </div>
    </div>
</div>
