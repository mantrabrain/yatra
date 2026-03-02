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
                $similar_trips_data = !empty($trip->similar_trips) ? $trip->similar_trips : [];
                
                // Only show real trips from database - no dummy data

                foreach ($similar_trips_data as $similar_trip) {
                    // Convert to Trip model if needed
                    if (!($similar_trip instanceof \Yatra\Models\Trip)) {
                        $similar_trip = \Yatra\Models\Trip::fromStdClass((object) $similar_trip);
                    }
                    
                    // Set required properties for the template
                    if (!isset($similar_trip->featured_image_url)) {
                        $similar_trip->featured_image_url = $similar_trip->featured_image ?? '';
                    }
                    
                    // Get trip data using Trip model methods
                    $title = $similar_trip->getTitle();
                    $duration = $similar_trip->getDuration();
                    $difficulty = $similar_trip->getDifficulty();
                    $pricing = $similar_trip->getPricing();
                    $discount = $similar_trip->getDiscount();
                    $image = $similar_trip->getImage();
                    $permalink = $similar_trip->getPermalink();
                    $destinations = $similar_trip->getDestinations();
                    $categories = $similar_trip->getCategories();
                    $activities = $similar_trip->getActivities();
                    
                    // Calculate rating directly from reviews array
                    $reviews = $similar_trip->reviews ?? [];
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
                        'has_rating' => $average_rating > 0 && $review_count > 0
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
                                
                                <?php if ($discount['has_discount']): ?>
                                <div class="yatra-similar-discount-badge">
                                    <?php echo esc_html($discount['discount_text']); ?> OFF
                                </div>
                                <?php endif; ?>
                                
                                <button class="yatra-similar-favorite-btn" data-trip-id="<?php echo esc_attr($similar_trip->id); ?>" title="<?php esc_attr_e('Add to favorites', 'yatra'); ?>">
                                    <?php echo yatra_svg_icon('heart', ''); ?>
                                </button>
                                
                                <?php if ($difficulty['has_difficulty'] && !empty($difficulty['icon'])): ?>
                                    <div class="yatra-similar-difficulty-overlay">
                                        <?php echo yatra_svg_icon($difficulty['icon'], 'similar-difficulty-icon'); ?>
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
                                        <span class="yatra-similar-trip-price">
                                            <?php if ($pricing['has_price']): ?>
                                                <?php echo esc_html($pricing['price_prefix'] . $pricing['current_price']); ?>
                                                <?php if ($pricing['has_discount'] && !empty($pricing['original_price'])): ?>
                                                    <span class="yatra-similar-original-price"><?php echo esc_html($pricing['original_price']); ?></span>
                                                <?php endif; ?>
                                            <?php else: ?>
                                                <?php esc_html_e('Contact for pricing', 'yatra'); ?>
                                            <?php endif; ?>
                                        </span>
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
