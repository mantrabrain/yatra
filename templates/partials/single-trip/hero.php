<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
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
                <div class="yatra-hero-discount-tag"><?php echo esc_html__('SAVE', 'yatra'); ?> <?php echo esc_html($trip->discount_percentage); ?>
                    %
                </div>
            <?php endif; ?>
            <?php if (!empty($main_image_url)): ?>
                <img src="<?php echo esc_url($main_image_url); ?>" alt="<?php echo esc_attr($trip->title); ?>"
                     class="yatra-hero-main-img">
            <?php else: ?>
                <img src="<?php echo esc_url(plugins_url('assets/images/trip-placeholder.svg', YATRA_PLUGIN_FILE)); ?>"
                     alt="<?php echo esc_attr($trip->title); ?>" class="yatra-hero-main-img">
            <?php endif; ?>
            <a href="#yatra-booking-widget" class="yatra-hero-book-now-btn">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <?php echo esc_html__('Book Now', 'yatra'); ?>
                - <?php echo esc_html(yatra_format_price($base_price)); ?>
            </a>
        </div>
        <div class="yatra-hero-side-images">
            <?php if (!empty($side_images)): ?>
                <?php foreach ($side_images as $index => $img_url): ?>
                    <div class="yatra-side-image-item">
                        <img src="<?php echo esc_url($img_url); ?>"
                             alt="<?php echo esc_attr__('Gallery Image', 'yatra'); ?>">
                        <?php if ($index === 0): ?>
                            <button type="button" class="yatra-favorite-btn"
                                    aria-label="<?php echo esc_attr__('Add to favorites', 'yatra'); ?>">
                                <?php echo yatra_svg_icon('heart', 'yatra-icon-sm'); ?>
                            </button>
                        <?php endif; ?>
                        <?php if ($index === count($side_images) - 1 && $total_images > 4): ?>
                            <button type="button" class="yatra-view-all-photos-btn yatra-gallery-play-btn"
                                    data-gallery="hero-gallery">
                                <?php echo yatra_svg_icon('camera', 'yatra-icon-sm'); ?>
                                <?php echo sprintf(esc_html__('View all %d photos', 'yatra'), $total_images); ?>
                            </button>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            <?php else: ?>
                <div class="yatra-side-image-item">
                    <img src="<?php echo esc_url(plugins_url('assets/images/trip-placeholder.svg', YATRA_PLUGIN_FILE)); ?>"
                         alt="<?php echo esc_attr__('Gallery Image', 'yatra'); ?>">
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>