<?php
/**
 * Activity Shortcode Template
 * 
 * This template displays activities in a grid layout with comprehensive information
 * including pricing, ratings, duration, and other relevant details.
 * 
 * @package Yatra
 * @var array $atts Shortcode attributes
 * @var array $activities Array of activity data
 * @var int $current_page Current page number
 * @var int $max_pages Maximum number of pages
 * @var int $total_found Total number of activities found
 * @var int $per_page Number of activities per page
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}


$columns = (int) $atts['columns'];
$column_class = 'yatra-activity-grid-' . min(max($columns, 1), 6);
?>

<div class="yatra-activity-shortcode" data-atts='<?php echo esc_attr(json_encode($atts)); ?>'>
    <div class="yatra-activity-header">
        <?php if (!empty($atts['title'])): ?>
            <h2 class="yatra-activity-title"><?php echo esc_html($atts['title']); ?></h2>
        <?php else: ?>
            <h2 class="yatra-activity-title"><?php esc_html_e('Activity Listings', 'yatra'); ?></h2>
        <?php endif; ?>
        <?php if (!empty($activities)): ?>
            <div class="yatra-activity-count">
                <?php
                printf(
                    /* translators: 1: number of activities shown, 2: total activities available. */
                    esc_html__('Showing %1$d of %2$d activities', 'yatra'),
                    (int) count($activities),
                    (int) $total_found
                );
                ?>
            </div>
        <?php endif; ?>
    </div>

    <?php if (!empty($activities)): ?>
        <div class="yatra-activity-grid <?php echo esc_attr($column_class); ?>">
            <?php foreach ($activities as $activity): ?>
                <div class="yatra-category-card">
                    <div class="yatra-category-card-image-wrapper">
                        <?php if (!empty($activity['image'])): ?>
                            <a href="<?php echo esc_url($activity['link']); ?>">
                                <img src="<?php echo esc_url($activity['image']); ?>" alt="<?php echo esc_attr($activity['term']->name); ?>" class="yatra-category-card-image">
                            </a>
                        <?php else: ?>
                            <a href="<?php echo esc_url($activity['link']); ?>">
                                <img src="<?php echo YATRA_PLUGIN_URL; ?>assets/images/placeholder.png" alt="<?php echo esc_attr($activity['term']->name); ?>" class="yatra-category-card-image">
                            </a>
                        <?php endif; ?>
                        
                        <!-- Overlay Content on Image -->
                        <div class="yatra-category-card-overlay">
                            <div class="yatra-category-card-content">
                                <h3 class="yatra-category-card-title">
                                    <a href="<?php echo esc_url($activity['link']); ?>" class="yatra-category-card-title-link"><?php echo esc_html($activity['term']->name); ?></a>
                                </h3>
                                
                                <div class="yatra-category-card-stats">
                                    <!-- Rating -->
                                    <div class="category-stat rating">
                                        <span class="category-stat-icon">
                                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        </span>
                                        <span class="category-stat-value"><?php echo esc_html(number_format(!empty($activity['avg_rating']) ? $activity['avg_rating'] : 0, 1)); ?></span>
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
                                            $trip_count = !empty($activity['trip_count']) ? $activity['trip_count'] : 0;
                                            echo esc_html($trip_count) . ' ' . _n('Trip', 'Trips', $trip_count, 'yatra'); 
                                            ?>
                                        </span>
                                    </div>
                                    
                                    <!-- Price (if available) -->
                                    <?php if (!empty($activity['min_price'])): ?>
                                        <div class="category-stat price">
                                            <span class="category-stat-icon">$</span>
                                            <span class="category-stat-value">
                                                <?php esc_html_e('From', 'yatra'); ?> <?php echo esc_html(yatra_format_price((float) $activity['min_price'])); ?>
                                            </span>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Featured Badge -->
                        <?php if (isset($activity['term']->featured) && $activity['term']->featured == 1): ?>
                            <div class="yatra-category-featured-badge">
                                <?php esc_html_e('Featured', 'yatra'); ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php elseif ($total_found > 0): ?>
        <!-- No activities on this page, but activities exist on other pages -->
        <div class="yatra-activity-empty-page">
            <p><?php esc_html_e('No activities found on this page. Try navigating to other pages.', 'yatra'); ?></p>
        </div>
    <?php else: ?>
        <!-- No activities found at all -->
        <div class="yatra-activity-empty">
            <div class="yatra-empty-icon">
                <?php echo yatra_svg_icon('activity', 'yatra-empty-icon-svg'); ?>
            </div>
            <h3><?php esc_html_e('No Activities Found', 'yatra'); ?></h3>
            <p><?php esc_html_e('We couldn\'t find any activities. Please check back later or browse our trips directly.', 'yatra'); ?></p>
            <a href="<?php echo esc_url(get_post_type_archive_link('trip')); ?>" class="yatra-btn yatra-btn-primary yatra-archive-card-cta">
                <?php echo yatra_svg_icon('globe', 'yatra-btn-icon'); ?>
                <span><?php esc_html_e('Browse All Trips', 'yatra'); ?></span>
            </a>
        </div>
    <?php endif; ?>

    <?php if ($atts['show_pagination'] === 'yes' && isset($max_pages) && $max_pages > 1): ?>
        <div class="yatra-activity-pagination">
            <?php
            $current_url = remove_query_arg('activity_page', $_SERVER['REQUEST_URI']);
            $current_url = preg_replace('/&activity_page=[^&]*/', '', $current_url);
            
            // Previous page
            if ($current_page > 1):
                $prev_url = add_query_arg('activity_page', $current_page - 1, $current_url);
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
                $next_url = add_query_arg('activity_page', $current_page + 1, $current_url);
            ?>
                <a href="#" class="yatra-pagination-link yatra-pagination-next" data-page="<?php echo esc_attr($current_page + 1); ?>">
                    <?php esc_html_e('Next', 'yatra'); ?>
                    <?php echo yatra_svg_icon('chevron-right', ''); ?>
                </a>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</div>
