<?php
if (!defined('ABSPATH')) {
    exit;
}

// Similar Trips Section
// Expected variables: $trip
?>
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
                $similar_trips_data = $trip->getSimilarTrips();
                
                // Only show real trips from database - no dummy data

                $yatra_similar_dp_flags = function_exists('yatra_get_dynamic_pricing_display_flags') ? yatra_get_dynamic_pricing_display_flags() : [
                    'show_original_price' => true,
                    'show_savings_badge' => true,
                    'show_urgency_messages' => false,
                ];

                foreach ($similar_trips_data as $similar_trip) {
                    // Prepare trip data directly from object properties
                    $title = $similar_trip->title ?? '';
                    $slug = $similar_trip->slug ?? '';
                    
                    // Duration
                    $duration_days = (int) ($similar_trip->duration_days ?? 0);
                    $duration_nights = (int) ($similar_trip->duration_nights ?? 0);
                    $duration = [
                        'has_duration' => $duration_days > 0,
                        'formatted' => $duration_nights > 0 
                            ? sprintf(_n('%d day %d night', '%d days %d nights', $duration_days, 'yatra'), $duration_days, $duration_nights)
                            : sprintf(_n('%d day', '%d days', $duration_days, 'yatra'), $duration_days)
                    ];
                    
                    // Difficulty — resolve classification id to label + icon (same logic as Trip::getDifficulty / quick facts)
                    $similar_difficulty_level = isset($similar_trip->difficulty_level) && $similar_trip->difficulty_level !== ''
                        ? (string) $similar_trip->difficulty_level
                        : null;
                    $similar_difficulty_name = isset($similar_trip->difficulty_name) && $similar_trip->difficulty_name !== ''
                        ? (string) $similar_trip->difficulty_name
                        : null;
                    $difficulty = \Yatra\Models\Trip::resolveDifficultyDisplay(
                        $similar_difficulty_level,
                        $similar_difficulty_name,
                        $similar_trip->difficulty_icon ?? null
                    );
                    
                    // Pricing
                    $original_price = (float) ($similar_trip->original_price ?? 0);
                    $sale_price = (float) ($similar_trip->sale_price ?? $original_price);
                    $current_price = $sale_price > 0 ? $sale_price : $original_price;
                    $discount_pct = 0;
                    $has_discount = false;
                    
                    if ($original_price > 0 && $sale_price < $original_price) {
                        $discount_pct = round((($original_price - $sale_price) / $original_price) * 100);
                        // Only show discount if percentage is greater than 0
                        $has_discount = $discount_pct > 0;
                    }
                    
                    $pricing = [
                        'has_price' => $current_price > 0,
                        'current_price' => yatra_format_price($current_price),
                        'original_price' => $has_discount ? yatra_format_price($original_price) : '',
                        'has_discount' => $has_discount,
                    ];
                    
                    $discount = [
                        'has_discount' => $has_discount,
                        'discount_text' => $has_discount ? $discount_pct . '%' : ''
                    ];

                    $yatra_similar_urgency = [];
                    if (!empty($yatra_similar_dp_flags['show_urgency_messages']) && function_exists('yatra_trip_card_dynamic_pricing_urgency_lines')) {
                        $yatra_similar_urgency = yatra_trip_card_dynamic_pricing_urgency_lines((int) ($similar_trip->id ?? 0), [
                            'base_sale_price' => $current_price,
                            'base_original_price' => $original_price,
                            'sale_price' => $current_price,
                            'original_price' => $original_price,
                            'departure_date' => null,
                            'spots_remaining' => null,
                            'availability_id' => null,
                            'surface' => 'similar',
                        ]);
                    }
                    
                    // Image
                    $image_url = $similar_trip->featured_image_url ?? '';
                    if (empty($image_url)) {
                        $image_url = plugins_url('assets/images/trip-placeholder.svg', YATRA_PLUGIN_FILE);
                    }
                    $image = [
                        'url' => $image_url,
                        'alt' => $title
                    ];
                    
                    // Permalink — use canonical helper (pretty + plain permalink structures).
                    $permalink = '';
                    if (!empty($slug) && function_exists('yatra_get_trip_permalink')) {
                        $permalink = yatra_get_trip_permalink($similar_trip);
                    }
                    
                    // Empty arrays for now (can be populated later if needed)
                    $destinations = [];
                    $categories = [];
                    $activities = [];
                    
                    // Rating
                    $rating = [
                        'average_rating' => 0,
                        'review_count' => 0,
                        'formatted_rating' => '0.0',
                        'has_rating' => false
                    ];
                    ?>
                    <div class="yatra-carousel-item">
                        <div class="yatra-similar-trip-card">
                            <div class="yatra-similar-trip-image">
                                <?php if (!empty($permalink)): ?>
                                    <a href="<?php echo esc_url($permalink); ?>" class="yatra-similar-image-link">
                                        <img src="<?php echo esc_url($image['url']); ?>" alt="<?php echo esc_attr($image['alt']); ?>">
                                    </a>
                                <?php else: ?>
                                    <img src="<?php echo esc_url($image['url']); ?>" alt="<?php echo esc_attr($image['alt']); ?>">
                                <?php endif; ?>
                                
                                <?php if ($discount['has_discount'] && !empty($yatra_similar_dp_flags['show_savings_badge'])): ?>
                                <div class="yatra-similar-discount-badge">
                                    <?php
                                    printf(
                                        /* translators: %s: discount text (e.g. "10%") */
                                        esc_html__('%s OFF', 'yatra'),
                                        esc_html($discount['discount_text'])
                                    );
                                    ?>
                                </div>
                                <?php endif; ?>
                                
                                <?php if (function_exists('yatra_wishlist_enabled') && yatra_wishlist_enabled()) : ?>
                                <button type="button" class="yatra-favorite-btn yatra-similar-favorite-btn" data-trip-id="<?php echo esc_attr($similar_trip->id); ?>" title="<?php esc_attr_e('Save to wishlist', 'yatra'); ?>">
                                    <?php echo yatra_svg_icon('heart', ''); ?>
                                </button>
                                <?php endif; ?>
                                
                                <?php if (!empty($difficulty['has_difficulty'])) : ?>
                                    <div class="yatra-similar-difficulty-overlay">
                                        <?php
                                        // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                                        echo yatra_stored_picker_icon_markup($difficulty['icon_picker'] ?? null, 'mountain', 'similar-difficulty-icon');
                                        ?>
                                        <?php echo ' ' . esc_html($difficulty['level']); ?>
                                    </div>
                                <?php endif; ?>
                            </div>
                            
                            <div class="yatra-similar-trip-content">
                                <!-- Destination -->
                                <?php if (!empty($destinations)) : ?>
                                    <div class="yatra-similar-destinations">
                                        <?php echo yatra_svg_icon('map-pin', 'similar-location-icon'); ?>
                                        <?php 
                                        $destination_names = [];
                                        foreach ($destinations as $destination) {
                                            if (isset($destination->name)) {
                                                $destination_permalink = function_exists('yatra_get_destination_permalink') 
                                                    ? yatra_get_destination_permalink($destination) 
                                                    : '#';
                                                $destination_names[] = '<a href="' . esc_url($destination_permalink) . '" class="similar-destination-link">' . esc_html($destination->name) . '</a>';
                                            }
                                        }
                                        echo implode(', ', $destination_names);
                                        ?>
                                    </div>
                                <?php endif; ?>
                                
                                <h3 class="yatra-similar-trip-title">
                                    <?php if (!empty($permalink)): ?>
                                        <a href="<?php echo esc_url($permalink); ?>" class="yatra-similar-title-link"><?php echo esc_html($title); ?></a>
                                    <?php else: ?>
                                        <?php echo esc_html($title); ?>
                                    <?php endif; ?>
                                </h3>
                                
                                <!-- Trip Stats -->
                                <div class="yatra-similar-trip-stats">
                                    <?php if ($duration['has_duration']): ?>
                                        <div class="yatra-similar-stat">
                                            <?php echo yatra_svg_icon('calendar', 'similar-stat-icon'); ?>
                                            <span><?php echo esc_html($duration['formatted']); ?></span>
                                        </div>
                                    <?php endif; ?>
                                    
                                    <?php if (!empty($similar_trip->min_travelers) || !empty($similar_trip->max_travelers)): ?>
                                        <div class="yatra-similar-stat">
                                            <?php echo yatra_svg_icon('users', 'similar-stat-icon'); ?>
                                            <span>
                                                <?php 
                                                $min_travelers = $similar_trip->min_travelers ?? 1;
                                                $max_travelers = $similar_trip->max_travelers ?? 20;
                                                echo esc_html($min_travelers . '-' . $max_travelers); 
                                                ?>
                                            </span>
                                        </div>
                                    <?php endif; ?>
                                    
                                    <?php if ($rating['has_rating'] && $rating['average_rating'] > 0): ?>
                                        <div class="yatra-similar-stat">
                                            <?php echo yatra_svg_icon('star', 'similar-stat-icon'); ?>
                                            <span><?php echo esc_html($rating['formatted_rating']); ?></span>
                                        </div>
                                    <?php endif; ?>
                                </div>
                                
                                <!-- Categories -->
                                <?php if (!empty($categories)) : ?>
                                    <div class="yatra-similar-categories">
                                        <?php foreach (array_slice($categories, 0, 2) as $category) : ?>
                                            <a href="<?php echo esc_url(yatra_get_category_permalink($category)); ?>" class="yatra-similar-category-tag">
                                                <?php echo esc_html($category->name); ?>
                                            </a>
                                        <?php endforeach; ?>
                                    </div>
                                <?php endif; ?>
                                
                                <div class="yatra-similar-trip-footer">
                                    <div class="yatra-similar-price">
                                        <?php if ($pricing['has_price']): ?>
                                            <div class="yatra-similar-trip-price">
                                                <span class="yatra-similar-price-label"><?php esc_html_e('From', 'yatra'); ?></span>
                                                <span class="yatra-similar-price-amount"><?php echo esc_html($pricing['current_price']); ?></span>
                                                <?php if (!empty($yatra_similar_dp_flags['show_original_price']) && $pricing['has_discount'] && !empty($pricing['original_price'])): ?>
                                                    <span class="yatra-similar-original-price"><?php echo esc_html($pricing['original_price']); ?></span>
                                                <?php endif; ?>
                                            </div>
                                            <?php if (!empty($yatra_similar_urgency)) : ?>
                                                <?php foreach ($yatra_similar_urgency as $yatra_sim_urg) : ?>
                                                    <div style="background-color:#fef3c7;color:#92400e;padding:4px 6px;border-radius:4px;font-size:11px;line-height:1.3;margin-top:6px;">
                                                        <?php echo esc_html((string) $yatra_sim_urg); ?>
                                                    </div>
                                                <?php endforeach; ?>
                                            <?php endif; ?>
                                        <?php else: ?>
                                            <span class="yatra-similar-trip-price yatra-similar-price-contact"><?php esc_html_e('Contact for pricing', 'yatra'); ?></span>
                                        <?php endif; ?>
                                    </div>
                                    <?php if (!empty($permalink)): ?>
                                        <a href="<?php echo esc_url($permalink); ?>" class="yatra-similar-view-btn"><?php esc_html_e('View Details', 'yatra'); ?></a>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php } ?>
            </div>
        </div>
    </div>
</section>
