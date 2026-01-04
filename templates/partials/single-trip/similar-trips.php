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
