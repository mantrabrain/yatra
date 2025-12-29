<?php
/**
 * Activity Listing Template
 *
 * Lists all published activities from the Yatra activities table
 * using the ActivityService. This replaces the previous static
 * dummy-data implementation.
 *
 * @package Yatra
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Load ActivityService from plugin namespace
if (!class_exists('Yatra\\Services\\ActivityService')) {
    // If the service is not available for some reason, bail gracefully.
    get_header();
    echo '<p>' . esc_html__('Activity service is not available.', 'yatra') . '</p>';
    get_footer();
    return;
}

$activity_service = new \Yatra\Services\ActivityService();

// Fetch published activities with stats (including trips_count, avg_rating, starting_price)
$activities = $activity_service->getPublishedWithStats();

// Apply simple server-side sorting and pagination for UX.
$sort = isset($_GET['yatra_sort']) ? sanitize_text_field(wp_unslash($_GET['yatra_sort'])) : 'popular';

if (!empty($activities) && is_array($activities)) {
    usort($activities, function ($a, $b) use ($sort) {
        $nameA = isset($a->name) ? strtolower($a->name) : '';
        $nameB = isset($b->name) ? strtolower($b->name) : '';
        $tripsA = isset($a->trips_count) ? (int) $a->trips_count : 0;
        $tripsB = isset($b->trips_count) ? (int) $b->trips_count : 0;
        $ratingA = isset($a->avg_rating) ? (float) $a->avg_rating : 0.0;
        $ratingB = isset($b->avg_rating) ? (float) $b->avg_rating : 0.0;

        switch ($sort) {
            case 'trips_desc': // Most Trips
                return $tripsB <=> $tripsA;
            case 'trips_asc':
                return $tripsA <=> $tripsB;
            case 'name_asc': // Name: A-Z
                return $nameA <=> $nameB;
            case 'name_desc': // Name: Z-A
                return $nameB <=> $nameA;
            case 'rating_desc': // Most Popular (by rating then trips)
            default:
                $cmp = $ratingB <=> $ratingA;
                if (0 === $cmp) {
                    return $tripsB <=> $tripsA;
                }
                return $cmp;
        }
    });
}

$per_page     = 6;
$current_page = isset($_GET['yatra_page']) ? max(1, (int) $_GET['yatra_page']) : 1;
$total_items  = is_array($activities) ? count($activities) : 0;
$total_pages  = $total_items > 0 ? (int) ceil($total_items / $per_page) : 1;
$current_page = min($current_page, $total_pages);

$offset             = ($current_page - 1) * $per_page;
$paged_activities = $total_items > 0 ? array_slice($activities, $offset, $per_page) : [];

get_header();
?>

<style>
.yatra-activity-icon-wrapper svg {
    width: 100% !important;
    height: 100% !important;
    max-width: none !important;
    max-height: none !important;
    min-width: 100%;
    min-height: 100%;
}
</style>

<div class="yatra-listing-page yatra-activity-listing">
    <div class="yatra-listing-wrapper">
        <div class="yatra-listing-container">
            
            <!-- Page Header -->
            <div class="yatra-activity-header">
                <div class="yatra-activity-header-content">
                    <h1><?php esc_html_e('All Activities', 'yatra'); ?></h1>
                    <p><?php esc_html_e('Discover amazing activities and adventures', 'yatra'); ?></p>
                </div>
                <div class="yatra-results-controls">
                    <div class="yatra-sort-control">
                        <label><?php esc_html_e('Sort by:', 'yatra'); ?></label>
                        <select onchange="if (this.value) window.location.href=this.value;">
                            <?php
                            $base_url = remove_query_arg(['yatra_page', 'yatra_sort']);
                            $options  = [
                                'rating_desc' => __('Most Popular', 'yatra'),
                                'trips_desc'  => __('Most Trips', 'yatra'),
                                'name_asc'    => __('Name: A-Z', 'yatra'),
                                'name_desc'   => __('Name: Z-A', 'yatra'),
                            ];
                            foreach ($options as $value => $label) {
                                $url      = esc_url(add_query_arg(['yatra_sort' => $value], $base_url));
                                $selected = $sort === $value ? 'selected' : '';
                                echo '<option value="' . $url . '" ' . $selected . '>' . esc_html($label) . '</option>';
                            }
                            ?>
                        </select>
                    </div>
                    <div class="yatra-view-toggle">
                        <button class="yatra-view-btn active" data-view="grid" type="button" title="<?php esc_attr_e('Grid View', 'yatra'); ?>">
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                            </svg>
                        </button>
                        <button class="yatra-view-btn" data-view="list" type="button" title="<?php esc_attr_e('List View', 'yatra'); ?>">
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Activity Grid -->
            <div class="yatra-activity-grid" id="activity-grid">
                <?php
                if (!empty($paged_activities)) {
                    foreach ($paged_activities as $activity) {
                        // Activity is a stdClass from repository
                        $name        = isset($activity->name) ? $activity->name : '';
                        $description = isset($activity->description) ? $activity->description : '';

                        // Resolve image/icon from the stored icon field when possible.
                        $image_url  = '';
                        $icon_class = '';
                        if (!empty($activity->icon)) {
                            $icon = maybe_unserialize($activity->icon);

                            if (is_array($icon)) {
                                // Handle both newer format ['type' => 'icon', 'value' => 'footprint'] 
                                // and older format [0 => 'icon', 1 => 'footprint']
                                $type  = $icon['type'] ?? $icon[0] ?? '';
                                $value = $icon['value'] ?? $icon[1] ?? '';

                                if ($type === 'image' && !empty($value)) {
                                    if (is_numeric($value)) {
                                        $maybe_url = wp_get_attachment_image_url((int) $value, 'large');
                                        if (!empty($maybe_url)) {
                                            $image_url = $maybe_url;
                                        }
                                    } elseif (is_string($value) && filter_var($value, FILTER_VALIDATE_URL)) {
                                        $image_url = $value;
                                    }
                                } elseif ($type === 'icon' && !empty($value) && is_string($value)) {
                                    // Store icon name so yatra_svg_icon() can render the same SVG
                                    // icon as used in the React admin (e.g. 'camera').
                                    $icon_class = $value;
                                } elseif (!empty($icon['url']) && filter_var($icon['url'], FILTER_VALIDATE_URL)) {
                                    // Legacy format: ['url' => 'https://...']
                                    $image_url = $icon['url'];
                                } elseif (!empty($icon['id'])) {
                                    // Legacy format: ['id' => attachment_id]
                                    $maybe_url = wp_get_attachment_image_url((int) $icon['id'], 'large');
                                    if (!empty($maybe_url)) {
                                        $image_url = $maybe_url;
                                    }
                                }
                            } elseif (is_numeric($icon)) {
                                $maybe_url = wp_get_attachment_image_url((int) $icon, 'large');
                                if (!empty($maybe_url)) {
                                    $image_url = $maybe_url;
                                }
                            } elseif (is_string($icon) && filter_var($icon, FILTER_VALIDATE_URL)) {
                                $image_url = $icon;
                            }
                        }

                        // Basic stats: only use real DB fields when present; do not fake numbers.
                        $has_avg_rating = isset($activity->avg_rating) && (float) $activity->avg_rating > 0;
                        $avg_rating     = $has_avg_rating ? (float) $activity->avg_rating : 0.0;

                        $has_trips_count = isset($activity->trips_count) && (int) $activity->trips_count > 0;
                        $trips_count     = $has_trips_count ? (int) $activity->trips_count : 0;

                        $starting_price_raw = isset($activity->starting_price)
                            ? (float) $activity->starting_price
                            : 0.0;
                        $has_starting_price = $starting_price_raw > 0;

                        // Use core helper to format price with correct currency symbol & settings.
                        $starting_price  = $has_starting_price
                            ? yatra_format_price($starting_price_raw)
                            : '';

                        // Build permalink
                        $permalink = function_exists('yatra_get_activity_permalink')
                            ? yatra_get_activity_permalink($activity->id ?? $activity)
                            : '';
                ?>
                <div class="yatra-activity-card">
                    <div class="yatra-activity-image">
                        <?php if (!empty($image_url)) : ?>
                            <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($name); ?>">
                        <?php elseif (!empty($icon_class)) : ?>
                            <div class="yatra-activity-icon-wrapper" aria-hidden="true" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); color: #4b5563;">
                                <?php echo yatra_svg_icon($icon_class, 'yatra-activity-icon'); ?>
                            </div>
                        <?php else : ?>
                            <?php
                            // Use the placeholder image from plugin assets
                            $placeholder_src = plugins_url('assets/images/placeholder.png', dirname(__FILE__));
                            ?>
                            <img src="<?php echo esc_url($placeholder_src); ?>" alt="<?php echo esc_attr__('Yatra placeholder', 'yatra'); ?>">
                        <?php endif; ?>
                    </div>
                    <div class="yatra-activity-content">
                        <h3><?php echo esc_html($name); ?></h3>
                        <p><?php echo esc_html($description ?: __('No description available', 'yatra')); ?></p>
                        <div class="yatra-activity-stats">
                            <?php if ($has_avg_rating) : ?>
                            <div class="yatra-activity-stat">
                                <svg width="16" height="16" fill="#fbbf24" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                <span><?php echo esc_html(number_format($avg_rating, 1)); ?></span>
                            </div>
                            <?php endif; ?>
                            <?php if ($has_trips_count) : ?>
                            <div class="yatra-activity-stat">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                </svg>
                                <span><?php echo esc_html($trips_count); ?> <?php esc_html_e('Trips', 'yatra'); ?></span>
                            </div>
                            <?php endif; ?>
                            <?php if ($has_starting_price) : ?>
                            <div class="yatra-activity-stat">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span><?php esc_html_e('From', 'yatra'); ?> <?php echo esc_html($starting_price); ?></span>
                            </div>
                            <?php endif; ?>
                        </div>
                        <?php if (!empty($permalink)) : ?>
                            <a class="yatra-destination-btn" href="<?php echo esc_url($permalink); ?>">
                                <?php echo esc_html__('View Trips', 'yatra'); ?>
                            </a>
                        <?php endif; ?>
                    </div>
                </div>
                <?php 
                    }
                } else {
                ?>
                <div class="yatra-no-activities">
                    <p><?php esc_html_e('No activities found.', 'yatra'); ?></p>
                </div>
                <?php } ?>
            </div>

            <!-- Pagination -->
            <?php if ($total_pages > 1) { ?>
            <div class="yatra-listing-pagination">
                <?php
                $base_url = remove_query_arg('yatra_page');
                
                // Previous button
                if ($current_page > 1) {
                    $prev_url = esc_url(add_query_arg('yatra_page', $current_page - 1, $base_url));
                    echo "<a href=\"{$prev_url}\" class=\"yatra-pagination-btn\">" . esc_html__('Previous', 'yatra') . "</a>";
                } else {
                    echo "<span class=\"yatra-pagination-btn disabled\">" . esc_html__('Previous', 'yatra') . "</span>";
                }
                
                // Page numbers
                for ($i = 1; $i <= $total_pages; $i++) {
                    if ($i === $current_page) {
                        echo "<span class=\"yatra-pagination-btn active\">{$i}</span>";
                    } else {
                        $page_url = esc_url(add_query_arg('yatra_page', $i, $base_url));
                        echo "<a href=\"{$page_url}\" class=\"yatra-pagination-btn\">{$i}</a>";
                    }
                }
                
                // Next button
                if ($current_page < $total_pages) {
                    $next_url = esc_url(add_query_arg('yatra_page', $current_page + 1, $base_url));
                    echo "<a href=\"{$next_url}\" class=\"yatra-pagination-btn\">" . esc_html__('Next', 'yatra') . "</a>";
                } else {
                    echo "<span class=\"yatra-pagination-btn disabled\">" . esc_html__('Next', 'yatra') . "</span>";
                }
                ?>
            </div>
            <?php } ?>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Grid/List view toggle functionality
    const viewButtons = document.querySelectorAll('.yatra-view-btn');
    const activityGrid = document.getElementById('activity-grid');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            
            // Update button states
            viewButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update grid class
            if (view === 'list') {
                activityGrid.classList.add('list-view');
            } else {
                activityGrid.classList.remove('list-view');
            }
        });
    });
});
</script>

<?php
get_header();
?>

<?php
get_footer();
?>
