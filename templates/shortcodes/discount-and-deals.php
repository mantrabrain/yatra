<?php
/**
 * Discount and Deals Shortcode Template
 * 
 * @package Yatra
 * @var array $trips Array of trip objects with discounts
 * @var array $atts Shortcode attributes
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

$columns = (int) $atts['columns'];
$column_class = 'yatra-discount-grid-' . min(max($columns, 1), 4);
$yatra_deals_dp_overlay = true;
if (function_exists('yatra_get_dynamic_pricing_display_flags')) {
    $yatra_deals_dp_overlay = !empty(yatra_get_dynamic_pricing_display_flags()['show_savings_badge']);
}
?>

<div class="yatra-discount-shortcode">
    <div class="yatra-discount-header">
        <h2 class="yatra-discount-title"><?php esc_html_e('Special Deals & Discounts', 'yatra'); ?></h2>
        <?php if (!empty($trips)): ?>
            <div class="yatra-discount-count">
                <?php
                printf(
                    /* translators: %d: number of deals currently available. */
                    _nx('%d Deal Available', '%d Deals Available', count($trips), 'deal count', 'yatra'),
                    (int) count($trips)
                );
                ?>
            </div>
        <?php endif; ?>
    </div>

    <?php if (!empty($trips)): ?>
        <div class="yatra-discount-grid <?php echo esc_attr($column_class); ?>">
            <?php foreach ($trips as $trip): ?>
                <div class="yatra-discount-card">
                    <?php 
                    // Load the trip-listing-card.php template (same as tour shortcode)
                    include YATRA_PLUGIN_PATH . 'templates/trip-listing-card.php';
                    ?>
                    
                    <!-- Discount Badge Overlay -->
                    <?php if ($yatra_deals_dp_overlay && $trip->has_discount && !empty($trip->best_discount)): ?>
                        <div class="yatra-discount-badge">
                            <?php
                            printf(
                                /* translators: %s: discount percentage */
                                esc_html__('%s%% OFF', 'yatra'),
                                esc_html($trip->best_discount['value'])
                            );
                            ?>
                        </div>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>
        </div>
        
        <?php if (count($trips) >= (int) $atts['per_page']): ?>
            <div class="yatra-discount-more">
                <a href="<?php echo esc_url(get_post_type_archive_link('trip')); ?>" class="yatra-btn yatra-btn-outline yatra-archive-card-cta">
                    <span><?php esc_html_e('View All Deals', 'yatra'); ?></span>
                    <?php echo yatra_svg_icon('chevron-right', 'yatra-btn-icon'); ?>
                </a>
            </div>
        <?php endif; ?>
    <?php else: ?>
        <div class="yatra-discount-empty">
            <div class="yatra-empty-icon">
                <svg width="60" height="60" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clip-rule="evenodd" />
                </svg>
            </div>
            <h3><?php esc_html_e('No Deals Available', 'yatra'); ?></h3>
            <p><?php esc_html_e('There are no special deals or discounts available at the moment. Check back soon for amazing offers!', 'yatra'); ?></p>
            <a href="<?php echo esc_url(get_post_type_archive_link('trip')); ?>" class="yatra-btn yatra-btn-primary yatra-archive-card-cta">
                <?php echo yatra_svg_icon('globe', 'yatra-btn-icon'); ?>
                <span><?php esc_html_e('Browse All Trips', 'yatra'); ?></span>
            </a>
        </div>
    <?php endif; ?>
</div>
