<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<div class="yatra-trip-hero-new" itemscope itemtype="https://schema.org/TouristTrip">
    <div class="yatra-hero-header">
        <nav class="yatra-hero-breadcrumb" aria-label="Breadcrumb" itemscope itemtype="https://schema.org/BreadcrumbList">
            <span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                <a href="<?php echo esc_url(home_url('/')); ?>" itemprop="item">
                    <span itemprop="name"><?php echo esc_html__('Home', 'yatra'); ?></span>
                </a>
                <meta itemprop="position" content="1" />
            </span>
            <span class="yatra-hero-breadcrumb-separator">›</span>
            <span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                <a href="<?php echo esc_url(home_url('/' . \Yatra\Services\SettingsService::getTripBase() . '/')); ?>" itemprop="item">
                    <span itemprop="name"><?php echo esc_html__('Trips', 'yatra'); ?></span>
                </a>
                <meta itemprop="position" content="2" />
            </span>
            <span class="yatra-hero-breadcrumb-separator">›</span>
            <span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                <span class="yatra-hero-breadcrumb-current" itemprop="name"><?php echo esc_html($trip->title); ?></span>
                <meta itemprop="position" content="3" />
            </span>
        </nav>
        <h1 class="yatra-trip-hero-title-new" itemprop="name"><?php echo esc_html($trip->title); ?></h1>
        <div class="yatra-hero-meta">
            <div class="yatra-hero-rating" itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
                <?php if ($trip->average_rating > 0): ?>
                    <div class="yatra-rating-stars">
                        <?php for ($i = 1; $i <= 5; $i++): ?>
                            <span class="yatra-star <?php echo $i <= round($trip->average_rating) ? 'filled' : ''; ?>" aria-label="<?php echo esc_attr(sprintf(_n('%d star', '%d stars', $i, 'yatra'), $i)); ?>">★</span>
                        <?php endfor; ?>
                    </div>
                    <span class="yatra-rating-number" itemprop="ratingValue"><?php echo esc_html(number_format($trip->average_rating, 1)); ?></span>
                    <span class="yatra-rating-text">
                        <span itemprop="reviewCount"><?php echo esc_html($trip->review_count); ?></span> 
                        <?php echo esc_html(_n('Review', 'Reviews', $trip->review_count, 'yatra')); ?>
                    </span>
                    <meta itemprop="bestRating" content="5">
                    <meta itemprop="worstRating" content="1">
                <?php else: ?>
                    <div class="yatra-rating-stars yatra-no-rating">
                        <?php for ($i = 1; $i <= 5; $i++): ?>
                            <span class="yatra-star" aria-label="<?php echo esc_attr(sprintf(_n('%d star', '%d stars', $i, 'yatra'), $i)); ?>">★</span>
                        <?php endfor; ?>
                    </div>
                    <span class="yatra-rating-text yatra-no-reviews"><?php echo esc_html__('No reviews yet', 'yatra'); ?></span>
                    <meta itemprop="reviewCount" content="0">
                <?php endif; ?>
            </div>
            <?php if (!empty($trip->starting_location)): ?>
                <div class="yatra-hero-location" itemprop="location" itemscope itemtype="https://schema.org/Place">
                    <?php echo yatra_svg_icon('map-pin', 'yatra-icon-sm'); ?>
                    <span itemprop="name"><?php echo esc_html($trip->starting_location); ?></span>
                </div>
            <?php endif; ?>
            <?php if (!empty($trip->duration_days)): ?>
                <div class="yatra-hero-duration" itemprop="duration">
                    <?php echo yatra_svg_icon('clock', 'yatra-icon-sm'); ?>
                    <span>
                        <?php 
                        if (!empty($trip->duration_nights) && $trip->duration_nights > 0) {
                            echo esc_html(sprintf(_n('%d day %d night', '%d days %d nights', $trip->duration_days, 'yatra'), $trip->duration_days, $trip->duration_nights));
                        } else {
                            echo esc_html(sprintf(_n('%d day', '%d days', $trip->duration_days, 'yatra'), $trip->duration_days));
                        }
                        ?>
                    </span>
                </div>
            <?php endif; ?>
            <?php if (!empty($trip->seasonal_availability)): ?>
                <div class="yatra-hero-season">
                    <?php echo yatra_svg_icon('calendar', 'yatra-icon-sm'); ?>
                    <span><?php echo esc_html($trip->seasonal_availability); ?></span>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <?php
    // Determine hero images
    // 1. If featured image is set, use it as main image
    // 2. If no featured image, use first gallery image as main
    // 3. Side images are gallery images (up to 3)
    
    // Gallery images are already URLs from SingleTripController
    $gallery_image_urls = isset($trip->gallery_images) && is_array($trip->gallery_images) ? $trip->gallery_images : [];
    
    $has_featured = !empty($trip->featured_image_url);

    // Main image: featured image OR first gallery image
    $main_image_url = '';
    if ($has_featured) {
        $main_image_url = $trip->featured_image_url;
        // If featured is set, side images are first 3 gallery images
        $side_images = array_slice($gallery_image_urls, 0, 3);
    } else {
        // No featured image - use first gallery as main
        $main_image_url = !empty($gallery_image_urls[0]) ? $gallery_image_urls[0] : '';
        // Side images start from index 1
        $side_images = array_slice($gallery_image_urls, 1, 3);
    }

    // Create combined gallery array for modal (featured + gallery images)
    $all_gallery_images = [];
    if ($has_featured) {
        $all_gallery_images[] = $main_image_url;
    }
    $all_gallery_images = array_merge($all_gallery_images, $gallery_image_urls);
    
    // Set global variable for content-gallery template
    global $yatra_hero_gallery_images;
    $yatra_hero_gallery_images = $all_gallery_images;
    
    $total_images = count($all_gallery_images);
    ?>
    <div class="yatra-hero-images">
        <div class="yatra-hero-main-image" itemprop="image" itemscope itemtype="https://schema.org/ImageObject">
            <?php if ($trip->discount_percentage > 0): ?>
                <div class="yatra-hero-discount-tag" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
                    <?php echo esc_html__('SAVE', 'yatra'); ?> <?php echo esc_html($trip->discount_percentage); ?>%
                    <meta itemprop="discount" content="<?php echo esc_attr($trip->discount_percentage); ?>">
                    <meta itemprop="discountCurrency" content="<?php echo esc_attr($trip->currency ?? 'USD'); ?>">
                </div>
            <?php endif; ?>
            
            <!-- Media Badges -->
            <div class="yatra-hero-media-badges">
                <?php 
                $image_count = count($all_gallery_images);
                $video_count = count($trip->videos ?? []);
                $youtube_count = count($trip->youtube_videos ?? []);
                $tour_count = count($trip->virtual_tours ?? []);
                $doc_count = count($trip->documents ?? []);
                
                if ($image_count > 0): ?>
                    <span class="yatra-media-badge yatra-media-badge-image">
                        <?php echo yatra_svg_icon('camera', 'yatra-media-badge-icon'); ?>
                        <span class="yatra-media-badge-count"><?php echo esc_html($image_count); ?></span>
                    </span>
                <?php endif; ?>
                
                <?php if ($video_count > 0): ?>
                    <span class="yatra-media-badge yatra-media-badge-video">
                        <?php echo yatra_svg_icon('play', 'yatra-media-badge-icon'); ?>
                        <span class="yatra-media-badge-count"><?php echo esc_html($video_count); ?></span>
                    </span>
                <?php endif; ?>
                
                <?php if ($youtube_count > 0): ?>
                    <span class="yatra-media-badge yatra-media-badge-youtube">
                        <?php echo yatra_svg_icon('video', 'yatra-media-badge-icon'); ?>
                        <span class="yatra-media-badge-count"><?php echo esc_html($youtube_count); ?></span>
                    </span>
                <?php endif; ?>
                
                <?php if ($tour_count > 0): ?>
                    <span class="yatra-media-badge yatra-media-badge-tour">
                        <?php echo yatra_svg_icon('globe', 'yatra-media-badge-icon'); ?>
                        <span class="yatra-media-badge-count"><?php echo esc_html($tour_count); ?></span>
                    </span>
                <?php endif; ?>
                
                <?php if ($doc_count > 0): ?>
                    <span class="yatra-media-badge yatra-media-badge-document">
                        <?php echo yatra_svg_icon('file-text', 'yatra-media-badge-icon'); ?>
                        <span class="yatra-media-badge-count"><?php echo esc_html($doc_count); ?></span>
                    </span>
                <?php endif; ?>
            </div>
            
            <?php if (!empty($main_image_url)): ?>
                <a href="#" class="yatra-hero-main-img-link" data-gallery="hero-gallery" data-image-index="0">
                    <img src="<?php echo esc_url($main_image_url); ?>" 
                         alt="<?php echo esc_attr(sprintf(__('Main image for %s', 'yatra'), $trip->title)); ?>"
                         title="<?php echo esc_attr($trip->title); ?>"
                         itemprop="url" content="<?php echo esc_url($main_image_url); ?>"
                         class="yatra-hero-main-img">
                </a>
                <meta itemprop="contentUrl" content="<?php echo esc_url($main_image_url); ?>">
                <meta itemprop="encodingFormat" content="image/jpeg">
                <meta itemprop="width" content="1200">
                <meta itemprop="height" content="630">
            <?php else: ?>
                <img src="<?php echo esc_url(plugins_url('assets/images/trip-placeholder.svg', YATRA_PLUGIN_FILE)); ?>"
                     alt="<?php echo esc_attr(sprintf(__('Placeholder image for %s', 'yatra'), $trip->title)); ?>"
                     title="<?php echo esc_attr($trip->title); ?>"
                     itemprop="url" content="<?php echo esc_url(plugins_url('assets/images/trip-placeholder.svg', YATRA_PLUGIN_FILE)); ?>"
                     class="yatra-hero-main-img">
                <meta itemprop="contentUrl" content="<?php echo esc_url(plugins_url('assets/images/trip-placeholder.svg', YATRA_PLUGIN_FILE)); ?>">
                <meta itemprop="encodingFormat" content="image/svg+xml">
            <?php endif; ?>
            
            <!-- Quick Media Switcher -->
            <div class="yatra-hero-media-switcher">
                <button type="button" class="yatra-media-switcher-btn yatra-media-switcher-active" data-media="images">
                    <?php echo yatra_svg_icon('camera', 'yatra-media-switcher-icon'); ?>
                    <span>Images</span>
                </button>
                <?php if ($video_count > 0): ?>
                    <button type="button" class="yatra-media-switcher-btn" data-media="videos">
                        <?php echo yatra_svg_icon('play', 'yatra-media-switcher-icon'); ?>
                        <span>Videos</span>
                    </button>
                <?php endif; ?>
                <?php if ($youtube_count > 0): ?>
                    <button type="button" class="yatra-media-switcher-btn" data-media="youtube">
                        <?php echo yatra_svg_icon('video', 'yatra-media-switcher-icon'); ?>
                    <span>Video</span>
                    </button>
                <?php endif; ?>
                <?php if ($tour_count > 0): ?>
                    <button type="button" class="yatra-media-switcher-btn" data-media="tours">
                        <?php echo yatra_svg_icon('globe', 'yatra-media-switcher-icon'); ?>
                    <span>360°</span>
                    </button>
                <?php endif; ?>
                <?php if ($doc_count > 0): ?>
                    <button type="button" class="yatra-media-switcher-btn" data-media="documents">
                        <?php echo yatra_svg_icon('file-text', 'yatra-media-switcher-icon'); ?>
                        <span>Documents</span>
                    </button>
                <?php endif; ?>
            </div>
            
            <!-- Media Data for JavaScript -->
            <script type="application/json" id="yatra-hero-media-data">
                <?php echo json_encode([
                    'images' => $all_gallery_images,
                    'videos' => $trip->videos ?? [],
                    'youtube_videos' => $trip->youtube_videos ?? [],
                    'virtual_tours' => $trip->virtual_tours ?? [],
                    'documents' => $trip->documents ?? []
                ]); ?>
            </script>
            
            <!-- Book Now Button on Right Side of Main Image -->
            <div class="yatra-hero-book-now-container">
                <a href="#yatra-booking-widget" class="yatra-hero-book-now-btn">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <?php echo esc_html__('Book Now', 'yatra'); ?>
                    - <?php echo esc_html(yatra_format_price($base_price)); ?>
                </a>
            </div>
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
</section>