<?php
/**
 * Discount Tour Shortcode Template
 * 
 * Uses exactly the same structure as trip.php but for discounted trips
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
?>

<div class="yatra-tour-shortcode" data-atts='<?php echo esc_attr(json_encode($atts)); ?>'>
    <div class="yatra-tour-header">
        <h2 class="yatra-tour-title"><?php esc_html_e('Special Deals & Discounts', 'yatra'); ?></h2>
        
        <?php if ($total_found > 0): ?>
            <div class="yatra-tour-count">
                <?php 
                printf(
                    esc_html__('Showing %d of %d deals', 'yatra'),
                    esc_html(count($trips['trips'])),
                    esc_html($total_found)
                );
                ?>
            </div>
        <?php endif; ?>
    </div>

    <?php if (!empty($trips['trips'])): ?>
        <div class="yatra-tour-grid <?php echo esc_attr($column_class); ?>">
            <?php foreach ($trips['trips'] as $trip): ?>
                <div class="yatra-tour-item">
                    <?php 
                    // Load the trip card template (same as tour shortcode)
                    include YATRA_PLUGIN_PATH . 'templates/trip-listing-card.php';
                    ?>
                    
                    <!-- Discount Badge Overlay -->
                    <?php if ($trip->has_discount && !empty($trip->best_discount)): ?>
                        <div class="yatra-discount-badge">
                            <?php echo esc_html($trip->best_discount['value']); ?>% OFF
                        </div>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>
        </div>
    <?php elseif ($total_found > 0): ?>
        <!-- No trips on this page, but trips exist on other pages -->
        <div class="yatra-tour-empty-page">
            <p><?php esc_html_e('No deals found on this page. Try navigating to other pages.', 'yatra'); ?></p>
        </div>
    <?php else: ?>
        <!-- No trips found at all -->
        <div class="yatra-tour-empty">
            <div class="yatra-empty-icon">
                <?php echo yatra_svg_icon('tag', 'yatra-empty-icon-svg'); ?>
            </div>
            <h3><?php esc_html_e('No Deals Available', 'yatra'); ?></h3>
            <p><?php esc_html_e('There are no special deals or discounts available at the moment. Check back soon for amazing offers!', 'yatra'); ?></p>
            <a href="<?php echo esc_url(get_post_type_archive_link('trip')); ?>" class="yatra-btn yatra-btn-primary">
                <?php esc_html_e('Browse All Tours', 'yatra'); ?>
            </a>
        </div>
    <?php endif; ?>
    
    <?php if ($atts['show_pagination'] === 'yes' && $max_pages > 1): ?>
        <div class="yatra-tour-pagination">
            <?php
            $current_page = $current_page ?? 1;
            $total_pages = $max_pages;
            
            // Previous page
            if ($current_page > 1):
                $prev_page = $current_page - 1;
            ?>
                <a href="#" class="yatra-pagination-link yatra-pagination-prev" data-page="<?php echo esc_attr($prev_page); ?>">
                    <?php esc_html_e('Previous', 'yatra'); ?>
                </a>
            <?php endif; ?>
            
            // Page numbers
            <?php
            $start_page = max(1, $current_page - 2);
            $end_page = min($total_pages, $current_page + 2);
            
            if ($start_page > 1):
            ?>
                <a href="#" class="yatra-pagination-link" data-page="1">1</a>
                <?php if ($start_page > 2): ?>
                    <span class="yatra-pagination-ellipsis">...</span>
                <?php endif; ?>
            <?php endif; ?>
            
            <?php for ($i = $start_page; $i <= $end_page; $i++): ?>
                <a href="#" class="yatra-pagination-link <?php echo $i === $current_page ? 'active' : ''; ?>" data-page="<?php echo esc_attr($i); ?>">
                    <?php echo esc_html($i); ?>
                </a>
            <?php endfor; ?>
            
            <?php if ($end_page < $total_pages): ?>
                <?php if ($end_page < $total_pages - 1): ?>
                    <span class="yatra-pagination-ellipsis">...</span>
                <?php endif; ?>
                <a href="#" class="yatra-pagination-link" data-page="<?php echo esc_attr($total_pages); ?>">
                    <?php echo esc_html($total_pages); ?>
                </a>
            <?php endif; ?>
            
            // Next page
            <?php if ($current_page < $total_pages):
                $next_page = $current_page + 1;
            ?>
                <a href="#" class="yatra-pagination-link yatra-pagination-next" data-page="<?php echo esc_attr($next_page); ?>">
                    <?php esc_html_e('Next', 'yatra'); ?>
                </a>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</div>
