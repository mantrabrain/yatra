<?php
/**
 * Tour Shortcode Template
 * 
 * @package Yatra
 * @var array $trips Array of trip objects
 * @var array $atts Shortcode attributes
 * @var array $query_args WP_Query arguments
 * @var int $max_pages Maximum number of pages
 * @var int $current_page Current page number
 * @var int $total_found Total number of trips found
 */
// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}
$columns = (int) $atts['columns'];
$column_class = 'yatra-tour-grid-' . min(max($columns, 1), 4);
// Extract pagination variables from trips data structure
$current_page = $trips['current_page'] ?? $current_page ?? 1;
$max_pages = $trips['max_pages'] ?? $max_pages ?? 1;
$total_found = $trips['total_found'] ?? $total_found ?? 0;
?>
<div class="yatra-tour-shortcode" data-atts='<?php echo esc_attr(json_encode($atts)); ?>'>
    <?php if (!empty($atts['title'])): ?>
        <h2 class="yatra-tour-title"><?php echo esc_html($atts['title']); ?></h2>
    <?php elseif (!empty($atts['featured']) && $atts['featured'] === '1'): ?>
        <h2 class="yatra-tour-title"><?php esc_html_e('Featured Trips', 'yatra'); ?></h2>
            <div class="yatra-tour-count">
                <?php 
                printf(
                    esc_html__('Showing %d of %d trips', 'yatra'),
                    esc_html(count($trips['trips'])),
                    esc_html($total_found)
                );
                ?>
            </div>
        <?php endif; ?>
    <?php if (!empty($trips['trips'])): ?>
        <div class="yatra-tour-grid <?php echo esc_attr($column_class); ?>">
            <?php foreach ($trips['trips'] as $trip): ?>
                <div class="yatra-tour-item">
                    <?php 
                    // Load the trip card template
                    include YATRA_PLUGIN_PATH . 'templates/trip-listing-card.php';
                    ?>
                </div>
            <?php endforeach; ?>
        </div>
    <?php elseif ($total_found > 0): ?>
        <!-- No trips on this page, but trips exist on other pages -->
        <div class="yatra-tour-empty-page">
            <p><?php esc_html_e('No trips found on this page. Try navigating to other pages.', 'yatra'); ?></p>
        </div>
    <?php else: ?>
        <!-- No tours found at all -->
        <div class="yatra-tour-empty">
            <div class="yatra-empty-icon">
                <?php echo yatra_svg_icon('map', 'yatra-empty-icon-svg'); ?>
            </div>
            <h3><?php esc_html_e('No Trips Found', 'yatra'); ?></h3>
            <p><?php esc_html_e('We couldn\'t find any trips matching your criteria. Try adjusting your filters or browse all trips.', 'yatra'); ?></p>
            
            
            
            <a href="<?php echo esc_url(home_url('/trips')); ?>" class="yatra-btn yatra-btn-primary">
                <?php esc_html_e('Browse All Trips', 'yatra'); ?>
            </a>
        </div>
    <?php endif; ?>
    <?php if ($atts['show_pagination'] === 'yes' && $max_pages > 1): ?>
        <div class="yatra-tour-pagination">
            <?php
            $current_url = remove_query_arg('trip_page', $_SERVER['REQUEST_URI']);
            $current_url = preg_replace('/&trip_page=[^&]*/', '', $current_url);
            
            // Previous page
            if ($current_page > 1):
                $prev_url = add_query_arg('trip_page', $current_page - 1, $current_url);
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
                $next_url = add_query_arg('trip_page', $current_page + 1, $current_url);
            ?>
                <a href="#" class="yatra-pagination-link yatra-pagination-next" data-page="<?php echo esc_attr($current_page + 1); ?>">
                    <?php esc_html_e('Next', 'yatra'); ?>
                    <?php echo yatra_svg_icon('chevron-right', ''); ?>
                </a>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</div>
