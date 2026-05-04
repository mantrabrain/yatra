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
    // Preserve review data before conversion
    $original_reviews = $trip->reviews ?? null;
    $original_average_rating = $trip->avg_rating ?? null;
    $original_review_count = $trip->reviews_count ?? null;
    
    $trip = \Yatra\Models\Trip::fromStdClass($trip);
    
    // Restore review data after conversion
    if ($original_reviews !== null) {
        $trip->reviews = $original_reviews;
    }
    if ($original_average_rating !== null) {
        $trip->avg_rating = $original_average_rating;
    }
    if ($original_review_count !== null) {
        $trip->reviews_count = $original_review_count;
    }
}


// Get all trip data using Trip model getter methods
$title = $trip->getTitle();
$duration = $trip->getDuration();
$difficulty = $trip->getDifficulty();
// Calculate rating directly from reviews array (working correctly)
$reviews = $trip->reviews ?? [];
$review_count = count($reviews);
$average_rating = 0;

if ($review_count > 0) {
    $total_rating = 0;
    foreach ($reviews as $review) {
        $total_rating += (float) ($review->rating ?? 0);
    }
    $average_rating = round($total_rating / $review_count, 1);
}

$rating = [
    'average_rating' => $average_rating,
    'review_count' => $review_count,
    'formatted_rating' => number_format($average_rating, 1),
    'has_rating' => $average_rating > 0 && $review_count > 0,
];
if (function_exists('yatra_trip_listing_card_rating_data')) {
    $rating = array_merge($rating, yatra_trip_listing_card_rating_data($trip, $rating));
}

$pricing = $trip->getPricing();
$discount = $trip->getDiscount();
$yatra_dp_flags = function_exists('yatra_get_dynamic_pricing_display_flags') ? yatra_get_dynamic_pricing_display_flags() : [
    'show_original_price' => true,
    'show_savings_badge' => true,
    'show_urgency_messages' => false,
];
$yatra_listing_urgency = [];
if (!empty($yatra_dp_flags['show_urgency_messages'])) {
    $yatra_tid = (int) ($trip->id ?? 0);
    $yatra_listing_urgency = function_exists('yatra_trip_card_dynamic_pricing_urgency_lines')
        ? yatra_trip_card_dynamic_pricing_urgency_lines($yatra_tid, [
            'base_sale_price' => (float) ($pricing['raw_current_price'] ?? 0),
            'base_original_price' => (float) ($pricing['raw_original_price'] ?? 0),
            'sale_price' => (float) ($pricing['raw_current_price'] ?? 0),
            'original_price' => (float) ($pricing['raw_original_price'] ?? 0),
            'departure_date' => null,
            'spots_remaining' => null,
            'availability_id' => null,
            'surface' => 'listing',
        ])
        : [];
}
$image = $trip->getImage();
$permalink = $trip->getPermalink();
$destinations = $trip->getDestinations();
$categories = $trip->getCategories();
$activities = $trip->getActivities();

if (function_exists('yatra_trip_listing_filter_classification_duplicates')) {
    [$destinations, $activities, $categories] = yatra_trip_listing_filter_classification_duplicates(
        $destinations,
        $activities,
        $categories,
        $trip
    );
}

$starting_loc = method_exists($trip, 'getStartingLocation') ? $trip->getStartingLocation() : ($trip->starting_location ?? null);
$ending_loc = $trip->ending_location ?? null;
$starting_loc = is_string($starting_loc) ? trim($starting_loc) : '';
$ending_loc = is_string($ending_loc) ? trim($ending_loc) : '';
$yatra_card_location_line = '';
if ($starting_loc !== '' && $ending_loc !== '' && $starting_loc !== $ending_loc) {
    $yatra_card_location_line = function_exists('yatra_format_trip_listing_route_line')
        ? yatra_format_trip_listing_route_line($starting_loc, $ending_loc)
        : $starting_loc . ' → ' . $ending_loc;
} elseif ($starting_loc !== '') {
    $yatra_card_location_line = $starting_loc;
} elseif ($ending_loc !== '') {
    $yatra_card_location_line = $ending_loc;
}

$yatra_traveler_type_labels = function_exists('yatra_trip_listing_traveler_type_labels_for_card')
    ? yatra_trip_listing_traveler_type_labels_for_card($trip)
    : [];

$yatra_trip_type_label = function_exists('yatra_trip_listing_trip_type_label')
    ? yatra_trip_listing_trip_type_label($trip->trip_type ?? null)
    : '';
$yatra_primary_category = !empty($categories[0]) ? $categories[0] : null;
$yatra_categories_additional = [];
foreach ($categories as $yatra_cat_row) {
    if ($yatra_primary_category && isset($yatra_cat_row->id, $yatra_primary_category->id)
        && (int) $yatra_cat_row->id === (int) $yatra_primary_category->id) {
        continue;
    }
    $yatra_categories_additional[] = $yatra_cat_row;
}

$yatra_view_details_icon_slug = function_exists('yatra_trip_listing_card_cta_icon_slug')
    ? yatra_trip_listing_card_cta_icon_slug($categories, $destinations, $difficulty)
    : '';

// Check for group discounts availability
$has_group_discounts = false;
$group_discount_summary = '';
try {
    // Call the group discount API to check availability
    $api_url = rest_url('yatra/v1/discounts/group-discounts');
    $response = wp_remote_post($api_url, [
        'method' => 'GET',
        'body' => [
            'trip_ids' => [$trip->id]
        ],
        'headers' => [
            'Content-Type' => 'application/json',
        ],
    ]);

    if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
        $data = json_decode(wp_remote_retrieve_body($response), true);
        if (isset($data[$trip->id]) && $data[$trip->id]['has_group_discounts']) {
            $has_group_discounts = true;
            $group_discount_summary = $data[$trip->id]['summary'];
        }
    }
} catch (Exception $e) {
    // Silently fail if API call fails - don't break the page
    $has_group_discounts = false;
}
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
        <?php if ($discount['has_discount'] && !empty($yatra_dp_flags['show_savings_badge'])): ?>
        <div class="yatra-discount-badge">
            <?php
            printf(
                /* translators: %s: discount text (e.g. "10%") */
                esc_html__('%s OFF', 'yatra'),
                esc_html($discount['discount_text'])
            );
            ?>
        </div>
        <?php endif; ?>
        <?php if ($has_group_discounts): ?>
        <div class="yatra-group-discount-badge" title="<?php echo esc_attr($group_discount_summary); ?>">
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <?php esc_html_e('Group Discounts', 'yatra'); ?>
        </div>
        <?php endif; ?>
        <?php if (function_exists('yatra_wishlist_enabled') && yatra_wishlist_enabled()) : ?>
        <button type="button" class="yatra-favorite-btn" data-trip-id="<?php echo esc_attr($trip->id); ?>" title="<?php esc_attr_e('Save to wishlist', 'yatra'); ?>" aria-label="<?php esc_attr_e('Save to wishlist', 'yatra'); ?>">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
        </button>
        <?php endif; ?>
        <!-- Difficulty level overlay on bottom-right -->
        <?php if ($difficulty['has_difficulty'] && (!empty($difficulty['icon_picker']) || !empty($difficulty['icon']))): ?>
            <div class="yatra-difficulty-overlay">
                <?php
                // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                echo yatra_stored_picker_icon_markup($difficulty['icon_picker'] ?? null, 'mountain', 'difficulty-icon');
                ?>
                <?php echo ' ' . esc_html($difficulty['level']); ?>
            </div>
        <?php endif; ?>
    </div>
    <div class="yatra-trip-content">
        <?php if ($yatra_card_location_line !== '' || !empty($destinations)) : ?>
            <div class="yatra-trip-destinations" role="group" aria-label="<?php esc_attr_e('Trip location', 'yatra'); ?>">
                <svg class="location-icon" width="14" height="14" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                </svg>
                <?php if ($yatra_card_location_line !== '') : ?>
                    <span class="yatra-trip-card-location-text"><?php echo esc_html($yatra_card_location_line); ?></span>
                <?php else : ?>
                    <?php
                    $destination_links = [];
                    foreach ($destinations as $destination) {
                        if (empty($destination->name)) {
                            continue;
                        }
                        $destination_permalink = function_exists('yatra_get_destination_permalink')
                            ? yatra_get_destination_permalink($destination)
                            : '#';
                        $destination_links[] = '<a href="' . esc_url($destination_permalink) . '" class="destination-link">' . esc_html($destination->name) . '</a>';
                    }
                    echo implode(', ', $destination_links);
                    ?>
                <?php endif; ?>
            </div>
        <?php endif; ?>
        
        <h3 class="yatra-trip-title">
            <?php if (!empty($permalink)): ?>
                <a href="<?php echo esc_url($permalink); ?>" class="yatra-trip-title-link"><?php echo esc_html($title); ?></a>
            <?php else: ?>
                <?php echo esc_html($title); ?>
            <?php endif; ?>
        </h3>

        <?php if ($yatra_trip_type_label !== '' || $yatra_primary_category) : ?>
            <div class="yatra-trip-card-meta">
                <?php if ($yatra_trip_type_label !== '') : ?>
                    <span class="yatra-trip-type-chip"><?php echo esc_html($yatra_trip_type_label); ?></span>
                <?php endif; ?>
                <?php if ($yatra_primary_category && !empty($yatra_primary_category->name)) : ?>
                    <?php
                    $pc_link = function_exists('yatra_get_category_permalink')
                        ? yatra_get_category_permalink($yatra_primary_category)
                        : '';
                    ?>
                    <?php if ($pc_link !== '') : ?>
                        <a class="yatra-trip-primary-category-chip" href="<?php echo esc_url($pc_link); ?>"><?php echo esc_html($yatra_primary_category->name); ?></a>
                    <?php else : ?>
                        <span class="yatra-trip-primary-category-chip yatra-trip-primary-category-chip--text"><?php echo esc_html($yatra_primary_category->name); ?></span>
                    <?php endif; ?>
                <?php endif; ?>
            </div>
        <?php endif; ?>
        
        <!-- Short Description -->
        <?php 
        $short_desc = $trip->getShortDescription();
        if (!empty($short_desc)): 
        ?>
            <p class="yatra-trip-short-description">
                <?php echo \Yatra\Helpers\FormatHelper::sanitizeQuillHtml($short_desc); ?>
            </p>
        <?php endif; ?>
        
        <!-- Trip Stats Row: scannable decision cues (duration, rating, group, difficulty, optional bookings) -->
        <div class="yatra-trip-stats-row">
            <?php if ($duration['has_duration']) : ?>
                <div class="yatra-trip-stat">
                    <div class="yatra-stat-icon duration">
                        <?php echo yatra_svg_icon('calendar', ''); ?>
                    </div>
                    <div class="yatra-stat-content">
                        <span class="yatra-stat-value"><?php echo esc_html($duration['formatted']); ?></span>
                        <span class="yatra-stat-label"><?php esc_html_e('Duration', 'yatra'); ?></span>
                    </div>
                </div>
            <?php endif; ?>

            <?php if (!empty($rating['has_rating'])) : ?>
                <div class="yatra-trip-stat">
                    <div class="yatra-stat-icon rating">
                        <?php echo yatra_svg_icon('star', ''); ?>
                    </div>
                    <div class="yatra-stat-content">
                        <span class="yatra-stat-value"><?php echo esc_html($rating['formatted_rating']); ?></span>
                        <span class="yatra-stat-label">
                            <?php
                            printf(
                                /* translators: %d: number of reviews */
                                esc_html(_n('%d review', '%d reviews', (int) $rating['review_count'], 'yatra')),
                                (int) $rating['review_count']
                            );
                            ?>
                        </span>
                    </div>
                </div>
            <?php endif; ?>

            <?php if (!empty($trip->min_travelers) || !empty($trip->max_travelers)) : ?>
                <div class="yatra-trip-stat">
                    <div class="yatra-stat-icon group">
                        <?php echo yatra_svg_icon('users', ''); ?>
                    </div>
                    <div class="yatra-stat-content">
                        <span class="yatra-stat-value">
                            <?php
                            $min_travelers = $trip->min_travelers ?? 1;
                            $max_travelers = $trip->max_travelers ?? 20;
                            echo esc_html($min_travelers . '-' . $max_travelers);
                            ?>
                        </span>
                        <span class="yatra-stat-label"><?php esc_html_e('Group size', 'yatra'); ?></span>
                    </div>
                </div>
            <?php endif; ?>

            <?php if (!empty($difficulty['has_difficulty']) && empty($difficulty['icon']) && empty($difficulty['icon_picker'])) : ?>
                <div class="yatra-trip-stat">
                    <div class="yatra-stat-icon difficulty">
                        <?php echo yatra_svg_icon('mountain', ''); ?>
                    </div>
                    <div class="yatra-stat-content">
                        <span class="yatra-stat-value"><?php echo esc_html($difficulty['level']); ?></span>
                        <span class="yatra-stat-label"><?php esc_html_e('Difficulty', 'yatra'); ?></span>
                    </div>
                </div>
            <?php endif; ?>

            <?php if (apply_filters('yatra_trip_listing_card_show_bookings_count', false, $trip) && !empty($trip->bookings_count) && (int) $trip->bookings_count > 0) : ?>
                <div class="yatra-trip-stat">
                    <div class="yatra-stat-icon bookings">
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="yatra-stat-content">
                        <span class="yatra-stat-value"><?php echo esc_html((string) (int) $trip->bookings_count); ?></span>
                        <span class="yatra-stat-label"><?php esc_html_e('Bookings', 'yatra'); ?></span>
                    </div>
                </div>
            <?php endif; ?>
        </div>

        <?php if (!empty($yatra_traveler_type_labels)) : ?>
            <div class="yatra-trip-traveler-types" role="group" aria-label="<?php esc_attr_e('Traveler types', 'yatra'); ?>">
                <svg class="yatra-trip-traveler-types-icon" width="14" height="14" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2h8v2H6V6zm0 4h5v2H6v-2z" clip-rule="evenodd" />
                </svg>
                <div class="yatra-trip-traveler-types-inner">
                    <span class="yatra-trip-traveler-types-label"><?php esc_html_e('Traveler types', 'yatra'); ?></span>
                    <span class="yatra-trip-traveler-types-pills">
                        <?php foreach ($yatra_traveler_type_labels as $ttl) : ?>
                            <span class="yatra-traveler-tier-pill"><?php echo esc_html($ttl); ?></span>
                        <?php endforeach; ?>
                    </span>
                </div>
            </div>
        <?php endif; ?>

        
        <!-- Activities Only -->
        <?php if (!empty($activities)) : ?>
            <div class="yatra-trip-activities" role="group" aria-label="<?php esc_attr_e('Activities', 'yatra'); ?>">
                <?php foreach (array_slice($activities, 0, 3) as $activity) : ?>
                    <a href="<?php echo esc_url(yatra_get_activity_permalink($activity)); ?>" class="yatra-tag activity-tag">
                        <?php echo esc_html($activity->name); ?>
                    </a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <!-- Additional trip categories (primary chip is under title) -->
        <?php if (!empty($yatra_categories_additional)) : ?>
            <div class="yatra-trip-categories-compact" role="group" aria-label="<?php esc_attr_e('More categories', 'yatra'); ?>">
                <div class="yatra-category-icon">
                    <?php
                    $first_category = $yatra_categories_additional[0];
                    if (!empty($first_category->icon)) {
                        $icon_data = maybe_unserialize($first_category->icon);
                        if (is_array($icon_data) && isset($icon_data['type']) && $icon_data['type'] === 'icon' && !empty($icon_data['value'])) {
                            // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                            echo yatra_stored_picker_icon_markup($icon_data, 'tag', 'category-icon');
                        } else {
                            echo '<svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clip-rule="evenodd" /></svg>';
                        }
                    } else {
                        echo '<svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clip-rule="evenodd" /></svg>';
                    }
                    ?>
                </div>
                <span class="yatra-categories-text">
                    <?php
                    $category_links = [];
                    foreach ($yatra_categories_additional as $category) {
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
                        <?php if (!empty($yatra_dp_flags['show_original_price']) && $pricing['has_discount'] && !empty($pricing['original_price'])): ?>
                            <span class="yatra-original-price"><?php echo esc_html($pricing['original_price']); ?></span>
                        <?php endif; ?>
                    <?php else: ?>
                        <?php esc_html_e('Contact for pricing', 'yatra'); ?>
                    <?php endif; ?>
                </span>
            </div>
            <?php if (!empty($permalink)) : ?>
                <a href="<?php echo esc_url($permalink); ?>" class="yatra-btn yatra-btn-primary yatra-archive-card-cta yatra-card-view-btn">
                    <?php echo function_exists('yatra_archive_listing_cta_icon_markup') ? yatra_archive_listing_cta_icon_markup($yatra_view_details_icon_slug, 'file-text') : yatra_svg_icon('file-text', 'yatra-btn-icon'); ?>
                    <span><?php esc_html_e('View Details', 'yatra'); ?></span>
                </a>
            <?php endif; ?>
            <?php if (!empty($yatra_listing_urgency)) : ?>
                <div class="yatra-trip-listing-dp-urgency" style="width:100%;margin-top:8px;">
                    <?php foreach ($yatra_listing_urgency as $yatra_urg_line) : ?>
                        <div style="background-color:#fef3c7;color:#92400e;padding:6px 8px;border-radius:6px;font-size:12px;line-height:1.35;margin-top:4px;">
                            <?php echo esc_html((string) $yatra_urg_line); ?>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<style>
.yatra-trip-short-description {
    color: #64748b;
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 8px 0 12px 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Trip Stats Row */
.yatra-trip-stats-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin: 12px 0;
    padding: 12px 0;
}

.yatra-trip-stat {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
}

.yatra-stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    flex-shrink: 0;
}

.yatra-stat-icon.duration {
    background: #dbeafe;
    color: #1e40af;
}

.yatra-stat-icon.difficulty {
    background: #fef3c7;
    color: #d97706;
}

.yatra-stat-icon.group {
    background: #dcfce7;
    color: #166534;
}

.yatra-stat-icon.bookings {
    background: #fce7f3;
    color: #be185d;
}

.yatra-stat-content {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
}

.yatra-stat-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.2;
}

.yatra-stat-label {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.2;
    margin-top: 2px;
}

/* Rating Row */
.yatra-trip-rating-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 12px 0;
}

.yatra-rating-stars {
    display: flex;
    align-items: center;
    gap: 4px;
}

.yatra-rating-value {
    font-weight: 600;
    color: #1f2937;
    font-size: 0.875rem;
}

.yatra-reviews-count {
    font-size: 0.75rem;
    color: #6b7280;
}

/* Responsive design */
@media (max-width: 768px) {
    .yatra-trip-stats-row {
        gap: 12px;
    }
    
    .yatra-trip-stat {
        min-width: calc(50% - 6px);
    }
    
    .yatra-stat-icon {
        width: 24px;
        height: 24px;
    }
    
    .yatra-stat-value {
        font-size: 0.8rem;
    }
    
    .yatra-stat-label {
        font-size: 0.7rem;
    }
}

@media (max-width: 480px) {
    .yatra-trip-stats-row {
        flex-direction: column;
        gap: 8px;
    }
    
    .yatra-trip-stat {
        min-width: 100%;
    }
}
</style>
