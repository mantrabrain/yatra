<?php
/**
 * Destination Shortcode Template
 * 
 * @package Yatra
 * @var array $destinations Array of destination data with trips
 * @var array $atts Shortcode attributes
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

$columns = (int) $atts['columns'];
$column_class = 'yatra-destination-grid-' . min(max($columns, 1), 6);
?>

<div class="yatra-destination-shortcode" data-atts='<?php echo esc_attr(json_encode($atts)); ?>'>
    <div class="yatra-destination-header">
        <?php if (!empty($atts['title'])): ?>
            <h2 class="yatra-destination-title"><?php echo esc_html($atts['title']); ?></h2>
        <?php else: ?>
            <h2 class="yatra-destination-title"><?php esc_html_e('Destination Showcase', 'yatra'); ?></h2>
        <?php endif; ?>
        <?php if (!empty($destinations)): ?>
            <div class="yatra-destination-count">
                <?php
                printf(
                    /* translators: 1: number of destinations shown, 2: total destinations available. */
                    esc_html__('Showing %1$d of %2$d destinations', 'yatra'),
                    (int) count($destinations),
                    (int) $total_found
                );
                ?>
            </div>
        <?php endif; ?>
    </div>

    <?php if (!empty($destinations)): ?>
        <div class="yatra-destination-grid <?php echo esc_attr($column_class); ?>">
            <?php foreach ($destinations as $destination): ?>
                <div class="yatra-category-card">
                    <div class="yatra-category-card-image-wrapper">
                        <?php if (!empty($destination['image'])): ?>
                            <a href="<?php echo esc_url($destination['link']); ?>">
                                <img src="<?php echo esc_url($destination['image']); ?>" alt="<?php echo esc_attr($destination['term']->name); ?>" class="yatra-category-card-image">
                            </a>
                        <?php else: ?>
                            <a href="<?php echo esc_url($destination['link']); ?>">
                                <img src="<?php echo YATRA_PLUGIN_URL; ?>assets/images/placeholder.png" alt="<?php echo esc_attr($destination['term']->name); ?>" class="yatra-category-card-image">
                            </a>
                        <?php endif; ?>
                        
                        <!-- Overlay Content on Image -->
                        <div class="yatra-category-card-overlay">
                            <div class="yatra-category-card-content">
                                <h3 class="yatra-category-card-title">
                                    <a href="<?php echo esc_url($destination['link']); ?>" class="yatra-category-card-title-link"><?php echo esc_html($destination['term']->name); ?></a>
                                </h3>
                                
                                <div class="yatra-category-card-stats">
                                    <!-- Rating -->
                                    <div class="category-stat rating">
                                        <span class="category-stat-icon">
                                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        </span>
                                        <span class="category-stat-value"><?php echo esc_html(number_format(!empty($destination['avg_rating']) ? $destination['avg_rating'] : 0, 1)); ?></span>
                                    </div>
                                    
                                    <!-- Trip Count -->
                                    <div class="category-stat trips">
                                        <span class="category-stat-icon">
                                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                            </svg>
                                        </span>
                                        <span class="category-stat-value">
                                            <?php 
                                            $trip_count = !empty($destination['trip_count']) ? $destination['trip_count'] : 0;
                                            echo esc_html($trip_count) . ' ' . _n('Trip', 'Trips', $trip_count, 'yatra'); 
                                            ?>
                                        </span>
                                    </div>
                                    
                                    <!-- Price (if available) -->
                                    <?php if (!empty($destination['min_price'])): ?>
                                        <div class="category-stat price">
                                            <span class="category-stat-icon">$</span>
                                            <span class="category-stat-value">
                                                <?php esc_html_e('From', 'yatra'); ?> <?php echo esc_html(yatra_get_currency_symbol(get_option('yatra_currency', 'USD')) . number_format($destination['min_price'], 2)); ?>
                                            </span>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Featured Badge -->
                        <?php if (isset($destination['term']->featured) && $destination['term']->featured == 1): ?>
                            <div class="yatra-category-featured-badge">
                                <?php esc_html_e('Featured', 'yatra'); ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php elseif ($total_found > 0): ?>
        <!-- No destinations on this page, but destinations exist on other pages -->
        <div class="yatra-destination-empty-page">
            <p><?php esc_html_e('No destinations found on this page. Try navigating to other pages.', 'yatra'); ?></p>
        </div>
    <?php else: ?>
        <!-- No destinations found at all -->
        <div class="yatra-destination-empty">
            <div class="yatra-empty-icon">
                <?php echo yatra_svg_icon('map', 'yatra-empty-icon-svg'); ?>
            </div>
            <h3><?php esc_html_e('No Destinations Found', 'yatra'); ?></h3>
            <p><?php esc_html_e('We couldn\'t find any destinations. Please check back later or browse our trips directly.', 'yatra'); ?></p>
            <a href="<?php echo esc_url(get_post_type_archive_link('trip')); ?>" class="yatra-btn yatra-btn-primary yatra-archive-card-cta">
                <?php echo yatra_svg_icon('globe', 'yatra-btn-icon'); ?>
                <span><?php esc_html_e('Browse All Trips', 'yatra'); ?></span>
            </a>
        </div>
    <?php endif; ?>

    <?php if ($atts['show_pagination'] === 'yes' && isset($max_pages) && $max_pages > 1): ?>
        <div class="yatra-destination-pagination">
            <?php
            $current_url = remove_query_arg('destination_page', $_SERVER['REQUEST_URI']);
            $current_url = preg_replace('/&destination_page=[^&]*/', '', $current_url);
            
            // Previous page
            if ($current_page > 1):
                $prev_url = add_query_arg('destination_page', $current_page - 1, $current_url);
            ?>
                <a href="#" class="yatra-pagination-link yatra-pagination-prev" data-page="<?php echo esc_attr($current_page - 1); ?>">
                    <?php echo yatra_svg_icon('chevron-left', ''); ?>
                    <?php esc_html_e('Previous', 'yatra'); ?>
                </a>
            <?php endif; ?>

            <?php
            // Show all page numbers - no ellipsis
            for ($i = 1; $i <= $max_pages; $i++):
                $is_current = $i === $current_page;
                ?>
                <a href="#" class="yatra-pagination-link <?php echo $is_current ? 'yatra-pagination-current' : ''; ?>" data-page="<?php echo esc_attr($i); ?>">
                    <?php echo esc_html($i); ?>
                </a>
            <?php endfor; ?>

            <?php
            // Next page
            if ($current_page < $max_pages):
                $next_url = add_query_arg('destination_page', $current_page + 1, $current_url);
            ?>
                <a href="#" class="yatra-pagination-link yatra-pagination-next" data-page="<?php echo esc_attr($current_page + 1); ?>">
                    <?php esc_html_e('Next', 'yatra'); ?>
                    <?php echo yatra_svg_icon('chevron-right', ''); ?>
                </a>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</div>
    
