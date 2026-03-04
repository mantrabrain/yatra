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
?>

<div class="yatra-tour-shortcode" data-atts='<?php echo esc_attr(json_encode($atts)); ?>'>
    <?php if ($atts['show_filters'] === 'yes'): ?>
        <div class="yatra-tour-filters">
            <div class="yatra-filter-header">
                <h3><?php esc_html_e('Filter Tours', 'yatra'); ?></h3>
                <button class="yatra-filter-toggle"><?php esc_html_e('Filters', 'yatra'); ?></button>
            </div>
            
            <div class="yatra-filter-content">
                <div class="yatra-filter-row">
                    <div class="yatra-filter-group">
                        <label for="yatra-search-filter"><?php esc_html_e('Search', 'yatra'); ?></label>
                        <input type="text" id="yatra-search-filter" class="yatra-filter-input" placeholder="<?php esc_attr_e('Search tours...', 'yatra'); ?>">
                    </div>
                    
                    <div class="yatra-filter-group">
                        <label for="yatra-category-filter"><?php esc_html_e('Category', 'yatra'); ?></label>
                        <select id="yatra-category-filter" class="yatra-filter-select">
                            <option value=""><?php esc_html_e('All Categories', 'yatra'); ?></option>
                            <?php
                            $categories = get_terms(['taxonomy' => 'trip_category', 'hide_empty' => true]);
                            foreach ($categories as $category):
                            ?>
                                <option value="<?php echo esc_attr($category->slug); ?>"><?php echo esc_html($category->name); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="yatra-filter-group">
                        <label for="yatra-destination-filter"><?php esc_html_e('Destination', 'yatra'); ?></label>
                        <select id="yatra-destination-filter" class="yatra-filter-select">
                            <option value=""><?php esc_html_e('All Destinations', 'yatra'); ?></option>
                            <?php
                            $destinations = get_terms(['taxonomy' => 'trip_destination', 'hide_empty' => true]);
                            foreach ($destinations as $destination):
                            ?>
                                <option value="<?php echo esc_attr($destination->slug); ?>"><?php echo esc_html($destination->name); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>
                
                <div class="yatra-filter-row">
                    <div class="yatra-filter-group">
                        <label for="yatra-price-min"><?php esc_html_e('Min Price', 'yatra'); ?></label>
                        <input type="number" id="yatra-price-min" class="yatra-filter-input" placeholder="0" min="0">
                    </div>
                    
                    <div class="yatra-filter-group">
                        <label for="yatra-price-max"><?php esc_html_e('Max Price', 'yatra'); ?></label>
                        <input type="number" id="yatra-price-max" class="yatra-filter-input" placeholder="10000" min="0">
                    </div>
                    
                    <div class="yatra-filter-group">
                        <label for="yatra-duration-filter"><?php esc_html_e('Duration (days)', 'yatra'); ?></label>
                        <select id="yatra-duration-filter" class="yatra-filter-select">
                            <option value=""><?php esc_html_e('Any Duration', 'yatra'); ?></option>
                            <option value="1-3">1-3 <?php esc_html_e('days', 'yatra'); ?></option>
                            <option value="4-7">4-7 <?php esc_html_e('days', 'yatra'); ?></option>
                            <option value="8-14">8-14 <?php esc_html_e('days', 'yatra'); ?></option>
                            <option value="15+">15+ <?php esc_html_e('days', 'yatra'); ?></option>
                        </select>
                    </div>
                    
                    <div class="yatra-filter-actions">
                        <button type="button" class="yatra-btn yatra-btn-primary" id="yatra-apply-filters">
                            <?php esc_html_e('Apply Filters', 'yatra'); ?>
                        </button>
                        <button type="button" class="yatra-btn yatra-btn-outline" id="yatra-reset-filters">
                            <?php esc_html_e('Reset', 'yatra'); ?>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    <?php endif; ?>

    <div class="yatra-tour-header">
        <?php if (!empty($atts['featured']) && $atts['featured'] === '1'): ?>
            <h2 class="yatra-tour-title"><?php esc_html_e('Featured Tours', 'yatra'); ?></h2>
        <?php else: ?>
            <h2 class="yatra-tour-title"><?php esc_html_e('Our Tours', 'yatra'); ?></h2>
        <?php endif; ?>
        
        <?php if ($total_found > 0): ?>
            <div class="yatra-tour-count">
                <?php 
                printf(
                    esc_html__('Showing %d of %d tours', 'yatra'),
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
                    // Load the trip card template
                    include YATRA_PLUGIN_PATH . 'templates/trip-listing-card.php';
                    ?>
                </div>
            <?php endforeach; ?>
        </div>
    <?php elseif ($total_found > 0): ?>
        <!-- No trips on this page, but trips exist on other pages -->
        <div class="yatra-tour-empty-page">
            <p><?php esc_html_e('No tours found on this page. Try navigating to other pages.', 'yatra'); ?></p>
        </div>
    <?php else: ?>
        <!-- No tours found at all -->
        <div class="yatra-tour-empty">
            <div class="yatra-empty-icon">
                <?php echo yatra_svg_icon('map', 'yatra-empty-icon-svg'); ?>
            </div>
            <h3><?php esc_html_e('No Tours Found', 'yatra'); ?></h3>
            <p><?php esc_html_e('We couldn\'t find any tours matching your criteria. Try adjusting your filters or browse all tours.', 'yatra'); ?></p>
            
            <?php if (defined('WP_DEBUG') && WP_DEBUG && isset($trips['debug_info'])): ?>
                <div class="yatra-debug-info" style="background: #f1f1f1; padding: 10px; margin: 10px 0; border-left: 4px solid #0073aa;">
                    <h4><?php esc_html_e('Debug Information', 'yatra'); ?></h4>
                    <p><strong><?php esc_html_e('Query Arguments:', 'yatra'); ?></strong></p>
                    <pre style="background: #fff; padding: 5px; overflow: auto;"><?php echo esc_html(print_r($trips['debug_info']['args_used'], true)); ?></pre>
                    <p><strong><?php esc_html_e('Raw Results Count:', 'yatra'); ?></strong> <?php echo esc_html($trips['debug_info']['raw_count']); ?></p>
                    <p><strong><?php esc_html_e('Processed Trips Count:', 'yatra'); ?></strong> <?php echo esc_html(count($trips['trips'])); ?></p>
                </div>
            <?php endif; ?>
            
            <a href="<?php echo esc_url(home_url('/tours')); ?>" class="yatra-btn yatra-btn-primary">
                <?php esc_html_e('Browse All Tours', 'yatra'); ?>
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
            // Page numbers
            $show_pages = 3;
            $start_page = max(1, $current_page - floor($show_pages / 2));
                $end_page = min($max_pages, $start_page + $show_pages - 1);
                
                if ($start_page > 1):
                ?>
                    <a href="#" class="yatra-pagination-link" data-page="1">1</a>
                    <?php if ($start_page > 2): ?>
                        <span class="yatra-pagination-ellipsis">...</span>
                    <?php endif; ?>
                <?php endif; ?>

                <?php for ($i = $start_page; $i <= $end_page; $i++): ?>
                    <?php
                    $page_url = add_query_arg('trip_page', $i, $current_url);
                    $is_current = $i === $current_page;
                    ?>
                    <a href="#" class="yatra-pagination-link <?php echo $is_current ? 'yatra-pagination-current' : ''; ?>" data-page="<?php echo esc_attr($i); ?>">
                        <?php echo esc_html($i); ?>
                    </a>
                <?php endfor; ?>

                <?php
                if ($end_page < $max_pages):
                    if ($end_page < $max_pages - 1):
                ?>
                        <span class="yatra-pagination-ellipsis">...</span>
                    <?php endif; ?>
                    <a href="#" class="yatra-pagination-link" data-page="<?php echo esc_attr($max_pages); ?>">
                        <?php echo esc_html($max_pages); ?>
                    </a>
                <?php endif; ?>

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
    
