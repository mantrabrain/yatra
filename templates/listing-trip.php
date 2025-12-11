<?php
/**
 * Trip Listing Page Template - Static Version with Dummy Data
 * 
 * @package Yatra
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Optional context when this template is reused for destination/activity URLs
$yatra_taxonomy_context = $GLOBALS['yatra_taxonomy_context'] ?? null;
// Trip list context for base /trip listing (with filters + pagination)
$yatra_trip_list = $GLOBALS['yatra_trip_list'] ?? null;

$current_filter_type = '';
$current_filter_slug = '';
$current_filter_name = '';

if (is_array($yatra_taxonomy_context) && !empty($yatra_taxonomy_context['type']) && !empty($yatra_taxonomy_context['entity'])) {
    $current_filter_type = $yatra_taxonomy_context['type'];
    $entity              = $yatra_taxonomy_context['entity'];
    $current_filter_slug = isset($entity->slug) ? (string) $entity->slug : '';
    $current_filter_name = isset($entity->name) ? (string) $entity->name : '';
}

// Default listing title
$yatra_listing_title = __('All Trips', 'yatra');

if (!empty($current_filter_type) && !empty($current_filter_name)) {
    if ($current_filter_type === 'destination') {
        // Example: "Trips to Nepal"
        $yatra_listing_title = sprintf(
            /* translators: %s is destination name */
            __('Trips to %s', 'yatra'),
            $current_filter_name
        );
    } elseif ($current_filter_type === 'activity') {
        // Example: "Trips with Trekking"
        $yatra_listing_title = sprintf(
            /* translators: %s is activity name */
            __('Trips with %s', 'yatra'),
            $current_filter_name
        );
    }
}

// Trip data source: prefer trip_list (base /trip), else taxonomy context, else dummy
$trips_source      = [];
$trip_total        = 0;
$trip_total_pages  = 1;
$trip_current_page = 1;
$trip_dest_options = [];
$trip_act_options  = [];
$active_filters    = [
    'destination'  => '',
    'activity'     => '',
    'price_min'    => '',
    'price_max'    => '',
    'duration_min' => '',
    'duration_max' => '',
    'rating_min'   => '',
];

if (is_array($yatra_trip_list) && !empty($yatra_trip_list['trips'])) {
    $trips_source      = $yatra_trip_list['trips'];
    $trip_total        = isset($yatra_trip_list['total']) ? (int) $yatra_trip_list['total'] : count($trips_source);
    $trip_total_pages  = isset($yatra_trip_list['pages']) ? (int) $yatra_trip_list['pages'] : 1;
    $trip_current_page = isset($yatra_trip_list['page']) ? (int) $yatra_trip_list['page'] : 1;
    $trip_dest_options = $yatra_trip_list['destinations'] ?? [];
    $trip_act_options  = $yatra_trip_list['activities'] ?? [];
    if (!empty($yatra_trip_list['filters']) && is_array($yatra_trip_list['filters'])) {
        foreach ($active_filters as $k => $v) {
            if (isset($yatra_trip_list['filters'][$k])) {
                $active_filters[$k] = $yatra_trip_list['filters'][$k];
            }
        }
    }
} elseif (!empty($yatra_taxonomy_context['trips'])) {
    $trips_source = $yatra_taxonomy_context['trips'];
    $trip_total   = count($trips_source);
}

get_header();
?>

<?php if (!empty($current_filter_type) && !empty($current_filter_slug)) : ?>
    <div id="yatra-trip-context"
         data-type="<?php echo esc_attr($current_filter_type); ?>"
         data-slug="<?php echo esc_attr($current_filter_slug); ?>"
         data-name="<?php echo esc_attr($current_filter_name); ?>"
         style="display:none;"></div>
<?php endif; ?>

<div class="yatra-listing-page yatra-trip-listing">
    <!-- Horizontal Search Bar -->
    <div class="yatra-horizontal-search">
        <div class="yatra-horizontal-search-container">
            <div class="yatra-search-bar">
                <!-- Destination Dropdown -->
                <div class="yatra-search-dropdown" data-dropdown="destination">
                    <div class="yatra-dropdown-trigger">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <div class="yatra-dropdown-content">
                            <span class="yatra-dropdown-label">DESTINATION</span>
                            <span class="yatra-dropdown-value"><?php echo !empty($active_filters['destination']) ? esc_html($active_filters['destination']) : __('Pick a destination', 'yatra'); ?></span>
                        </div>
                        <svg class="yatra-dropdown-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    <div class="yatra-dropdown-menu">
                        <?php if (!empty($trip_dest_options)) : ?>
                            <?php foreach ($trip_dest_options as $dest) : ?>
                                <div class="yatra-dropdown-option" data-value="<?php echo esc_attr($dest->slug ?? ''); ?>">
                                    <?php echo esc_html($dest->name ?? ''); ?>
                                </div>
                            <?php endforeach; ?>
                        <?php else : ?>
                            <div class="yatra-dropdown-option" data-value=""><?php esc_html_e('All Destinations', 'yatra'); ?></div>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="yatra-search-divider"></div>

                <!-- Activities Dropdown -->
                <div class="yatra-search-dropdown" data-dropdown="activities">
                    <div class="yatra-dropdown-trigger">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        <div class="yatra-dropdown-content">
                            <span class="yatra-dropdown-label">ACTIVITIES</span>
                            <span class="yatra-dropdown-value"><?php echo !empty($active_filters['activity']) ? esc_html($active_filters['activity']) : __('Choose an activity', 'yatra'); ?></span>
                        </div>
                        <svg class="yatra-dropdown-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    <div class="yatra-dropdown-menu">
                        <?php if (!empty($trip_act_options)) : ?>
                            <?php foreach ($trip_act_options as $act) : ?>
                                <div class="yatra-dropdown-option" data-value="<?php echo esc_attr($act->slug ?? ''); ?>">
                                    <?php echo esc_html($act->name ?? ''); ?>
                                </div>
                            <?php endforeach; ?>
                        <?php else : ?>
                            <div class="yatra-dropdown-option" data-value=""><?php esc_html_e('All Activities', 'yatra'); ?></div>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="yatra-search-divider"></div>

                <!-- Duration Dropdown with Range Slider -->
                <div class="yatra-search-dropdown" data-dropdown="duration">
                    <div class="yatra-dropdown-trigger">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 018 0z"/>
                        </svg>
                        <div class="yatra-dropdown-content">
                            <span class="yatra-dropdown-label">DURATION</span>
                            <span class="yatra-dropdown-value">Trip duration</span>
                        </div>
                        <svg class="yatra-dropdown-arrow yatra-arrow-up" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                        </svg>
                    </div>
                    <div class="yatra-dropdown-menu yatra-duration-menu">
                        <div class="yatra-duration-slider-wrapper">
                            <div class="yatra-duration-badges">
                                <span class="yatra-duration-badge yatra-duration-min-badge">2 Days</span>
                                <span class="yatra-duration-badge yatra-duration-max-badge">29 Days</span>
                            </div>
                            <div class="yatra-dual-range-slider">
                                <input type="range" id="durationMin" min="1" max="30" value="2" class="yatra-range-min">
                                <input type="range" id="durationMax" min="1" max="30" value="29" class="yatra-range-max">
                                <div class="yatra-slider-track"></div>
                                <div class="yatra-slider-range"></div>
                            </div>
                            <div class="yatra-duration-labels">
                                <span>2 Days</span>
                                <span>29 Days</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="yatra-search-divider"></div>

                <!-- Budget Dropdown -->
                <div class="yatra-search-dropdown" data-dropdown="budget">
                    <div class="yatra-dropdown-trigger">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                        </svg>
                        <div class="yatra-dropdown-content">
                            <span class="yatra-dropdown-label">BUDGET</span>
                            <span class="yatra-dropdown-value">Your budget range</span>
                        </div>
                        <svg class="yatra-dropdown-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    <div class="yatra-dropdown-menu">
                        <div class="yatra-dropdown-option" data-value="0-1000">Under $1,000</div>
                        <div class="yatra-dropdown-option" data-value="1000-2000">$1,000 - $2,000</div>
                        <div class="yatra-dropdown-option" data-value="2000-3000">$2,000 - $3,000</div>
                        <div class="yatra-dropdown-option" data-value="3000-5000">$3,000 - $5,000</div>
                        <div class="yatra-dropdown-option" data-value="5000+">$5,000+</div>
                    </div>
                </div>

                <!-- Search Button -->
                <button class="yatra-search-main-btn">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    Search
                </button>
            </div>
        </div>
    </div>

    <div class="yatra-listing-wrapper">
        <div class="yatra-listing-container">
            
            <!-- Results Header -->
            <div class="yatra-results-header">
                <div class="yatra-results-info">
                    <h1><?php echo esc_html($yatra_listing_title); ?></h1>
                    <p class="yatra-results-count">
                        <?php
                        $display_total = $trip_total ?: (is_array($trips_source) ? count($trips_source) : 0);
                        echo sprintf(__('Showing <strong>%d</strong> trips', 'yatra'), $display_total);
                        ?>
                    </p>
                </div>
                <div class="yatra-results-controls">
                    <div class="yatra-sort-control">
                        <label>Sort by:</label>
                        <?php
                        $sort_options = [
                            ''              => __('Recommended', 'yatra'),
                            'price_low'     => __('Price: Low to High', 'yatra'),
                            'price_high'    => __('Price: High to Low', 'yatra'),
                            'rating_high'   => __('Rating: Highest', 'yatra'),
                            'duration_short'=> __('Duration: Shortest', 'yatra'),
                            'duration_long' => __('Duration: Longest', 'yatra'),
                        ];

                        $current_sort = $active_filters['sort'] ?? '';
                        ?>
                        <select onchange="if(this.value){ window.location.href=this.value; }" id="yatra-sort-filter">
                            <?php
                            $base_url_sort = remove_query_arg('sort');
                            foreach ($sort_options as $value => $label) {
                                $args = ['sort' => $value];
                                foreach ($active_filters as $k => $v) {
                                    if ($k === 'sort') continue;
                                    if ($v !== '') $args[$k] = $v;
                                }
                                $url = esc_url(add_query_arg($args, $base_url_sort));
                                $selected = ($value === $current_sort) ? 'selected' : '';
                                echo '<option value="' . $url . '" ' . $selected . '>' . esc_html($label) . '</option>';
                            }
                            ?>
                        </select>
                    </div>
                    <div class="yatra-view-toggle">
                        <button class="yatra-view-btn active" data-view="grid" title="Grid View">
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                            </svg>
                        </button>
                        <button class="yatra-view-btn" data-view="list" title="List View">
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div class="yatra-listing-layout">
                <!-- Filter Sidebar - Comprehensive Filters -->
                <aside class="yatra-filter-sidebar">
                    <div class="yatra-filter-header">
                        <h2>Filters</h2>
                        <button class="yatra-clear-filters">Clear all</button>
                    </div>

                    <!-- Price Range -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="price">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                                </svg>
                                <span>Price Range</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-price-range">
                                <div class="yatra-price-inputs">
                                    <input type="number" placeholder="Min" min="0" value="<?php echo !empty($active_filters['price_min']) ? esc_attr($active_filters['price_min']) : ''; ?>" id="priceMin">
                                    <span>-</span>
                                    <input type="number" placeholder="Max" min="0" value="<?php echo !empty($active_filters['price_max']) ? esc_attr($active_filters['price_max']) : ''; ?>" id="priceMax">
                                </div>
                                <div class="yatra-price-slider">
                                    <input type="range" min="0" max="10000" step="100" value="<?php echo !empty($active_filters['price_min']) ? esc_attr($active_filters['price_min']) : '0'; ?>" class="yatra-range-min" id="priceRangeMin">
                                    <input type="range" min="0" max="10000" step="100" value="<?php echo !empty($active_filters['price_max']) ? esc_attr($active_filters['price_max']) : '10000'; ?>" class="yatra-range-max" id="priceRangeMax">
                                </div>
                                <div class="yatra-price-display">$0 - $10,000</div>
                            </div>
                        </div>
                    </div>

                    <!-- Difficulty Level -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="difficulty">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                                </svg>
                                <span>Difficulty Level</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="easy">
                                    <span>Easy</span>
                                    <span class="yatra-filter-count">(8)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="moderate">
                                    <span>Moderate</span>
                                    <span class="yatra-filter-count">(12)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="challenging">
                                    <span>Challenging</span>
                                    <span class="yatra-filter-count">(6)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="strenuous">
                                    <span>Strenuous</span>
                                    <span class="yatra-filter-count">(3)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Rating -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="rating">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="#fbbf24" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                <span>Rating</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="4.5+">
                                    <div class="yatra-rating-display">
                                        <svg width="16" height="16" fill="#fbbf24" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                        <span>4.5+ Excellent</span>
                                    </div>
                                    <span class="yatra-filter-count">(10)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="4.0+">
                                    <div class="yatra-rating-display">
                                        <svg width="16" height="16" fill="#fbbf24" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                        <span>4.0+ Very Good</span>
                                    </div>
                                    <span class="yatra-filter-count">(18)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="3.5+">
                                    <div class="yatra-rating-display">
                                        <svg width="16" height="16" fill="#fbbf24" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                        <span>3.5+ Good</span>
                                    </div>
                                    <span class="yatra-filter-count">(22)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Group Size -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="group-size">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                </svg>
                                <span>Group Size</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="private">
                                    <span>Private Tour</span>
                                    <span class="yatra-filter-count">(5)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="small">
                                    <span>Small Group (2-8)</span>
                                    <span class="yatra-filter-count">(14)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="medium">
                                    <span>Medium Group (9-15)</span>
                                    <span class="yatra-filter-count">(8)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="large">
                                    <span>Large Group (16+)</span>
                                    <span class="yatra-filter-count">(4)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Best Season -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="season">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                                </svg>
                                <span>Best Season</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="spring">
                                    <span>Spring (Mar-May)</span>
                                    <span class="yatra-filter-count">(18)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="summer">
                                    <span>Summer (Jun-Aug)</span>
                                    <span class="yatra-filter-count">(10)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="autumn">
                                    <span>Autumn (Sep-Nov)</span>
                                    <span class="yatra-filter-count">(20)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="winter">
                                    <span>Winter (Dec-Feb)</span>
                                    <span class="yatra-filter-count">(6)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Accommodation Type -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="accommodation">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                </svg>
                                <span>Accommodation</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="luxury">
                                    <span>Luxury Hotels</span>
                                    <span class="yatra-filter-count">(6)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="standard">
                                    <span>Standard Hotels</span>
                                    <span class="yatra-filter-count">(12)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="teahouse">
                                    <span>Teahouse/Lodge</span>
                                    <span class="yatra-filter-count">(15)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="camping">
                                    <span>Camping</span>
                                    <span class="yatra-filter-count">(8)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="homestay">
                                    <span>Homestay</span>
                                    <span class="yatra-filter-count">(5)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Included Services -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="services">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                                </svg>
                                <span>Included Services</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="meals">
                                    <span>All Meals Included</span>
                                    <span class="yatra-filter-count">(18)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="guide">
                                    <span>Professional Guide</span>
                                    <span class="yatra-filter-count">(24)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="transport">
                                    <span>Airport Transfers</span>
                                    <span class="yatra-filter-count">(20)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="permits">
                                    <span>Permits Included</span>
                                    <span class="yatra-filter-count">(16)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="equipment">
                                    <span>Equipment Provided</span>
                                    <span class="yatra-filter-count">(10)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Special Offers -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="offers">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h-.01M15 3h.01M15 7h-.01M7 21h.01M7 15h-.01M15 21h.01M15 15h-.01M7 9h.01M7 5h-.01M15 9h.01M15 5h-.01M9 7h.01M9 3h-.01M9 21h.01M9 15h-.01M9 9h.01M9 5h-.01M3 7h.01M3 3h-.01M3 21h.01M3 15h-.01M3 9h.01M3 5h-.01M21 7h.01M21 3h-.01M21 21h.01M21 15h-.01M21 9h.01M21 5h-.01M13 7h.01M13 3h-.01M13 21h.01M13 15h-.01M13 9h.01M13 5h-.01M5 7h.01M5 3h-.01M5 21h.01M5 15h-.01M5 9h.01M5 5h-.01M1 7h.01M1 3h-.01M1 21h.01M1 15h-.01M1 9h.01M1 5h-.01z"/>
                                </svg>
                                <span>Special Offers</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="discount">
                                    <span>Discount Available</span>
                                    <span class="yatra-filter-count">(8)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="early-bird">
                                    <span>Early Bird Offer</span>
                                    <span class="yatra-filter-count">(5)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="last-minute">
                                    <span>Last Minute Deal</span>
                                    <span class="yatra-filter-count">(3)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="group-discount">
                                    <span>Group Discount</span>
                                    <span class="yatra-filter-count">(10)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Booking Options -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="booking">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                <span>Booking Options</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="instant">
                                    <span>Instant Confirmation</span>
                                    <span class="yatra-filter-count">(15)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="free-cancel">
                                    <span>Free Cancellation</span>
                                    <span class="yatra-filter-count">(12)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="flexible">
                                    <span>Flexible Dates</span>
                                    <span class="yatra-filter-count">(18)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="pay-later">
                                    <span>Reserve Now, Pay Later</span>
                                    <span class="yatra-filter-count">(8)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Age Suitability -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="age">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span>Age Suitability</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="family">
                                    <span>Family Friendly</span>
                                    <span class="yatra-filter-count">(12)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="kids">
                                    <span>Suitable for Kids</span>
                                    <span class="yatra-filter-count">(8)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="seniors">
                                    <span>Senior Friendly</span>
                                    <span class="yatra-filter-count">(10)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="adults">
                                    <span>Adults Only</span>
                                    <span class="yatra-filter-count">(6)</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </aside>

                <!-- Main Content Area -->
                <main class="yatra-listing-content">
                    <?php if (count($trips_source) > 0) : ?>
                        <div class="yatra-trip-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <?php foreach ($trips_source as $trip) : ?>
                                <!-- Normalize fields from trip object -->
                                <?php
                                $title     = isset($trip->title) ? $trip->title : (isset($trip->name) ? $trip->name : '');
                                $image_url = !empty($trip->featured_image_url)
                                    ? $trip->featured_image_url
                                    : 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop';
                                $duration  = !empty($trip->duration) ? $trip->duration . ' ' . __('Days', 'yatra') : '';
                                $location  = !empty($trip->location) ? $trip->location : '';
                                // Get difficulty name - ONLY if there's real, valid data
                                $difficulty = '';
                                
                                // First check if difficulty_name exists and is valid
                                if (!empty($trip->difficulty_name) && is_string($trip->difficulty_name)) {
                                    $clean_name = trim($trip->difficulty_name);
                                    if (!empty($clean_name) && 
                                        $clean_name !== 'EMPTY' && 
                                        $clean_name !== 'none' && 
                                        $clean_name !== 'null' && 
                                        $clean_name !== '0' &&
                                        strlen($clean_name) > 1) {
                                        $difficulty = $clean_name;
                                    }
                                }
                                
                                // If no difficulty_name, check raw difficulty field
                                if (empty($difficulty) && !empty($trip->difficulty) && is_string($trip->difficulty)) {
                                    $clean_difficulty = trim($trip->difficulty);
                                    if (!empty($clean_difficulty) && 
                                        $clean_difficulty !== 'EMPTY' && 
                                        $clean_difficulty !== 'none' && 
                                        $clean_difficulty !== 'null' && 
                                        $clean_difficulty !== '0' &&
                                        strlen($clean_difficulty) > 1) {
                                        $difficulty = $clean_difficulty;
                                    }
                                }
                                
                                // Final validation - must be a meaningful string
                                if (!empty($difficulty)) {
                                    if (!is_string($difficulty) || strlen(trim($difficulty)) < 2) {
                                        $difficulty = '';
                                    }
                                }
                                
                                $average_rating = isset($trip->average_rating) ? (float) $trip->average_rating : 0;
                                $review_count   = isset($trip->review_count) ? (int) $trip->review_count : 0;

                                // Initialize pricing variables first
                                $current_price = '';
                                $original_price = '';
                                $has_discount = false;
                                $price_prefix = ''; // Will be set based on pricing type

                                // Determine pricing type and set appropriate prefix
                                $is_traveler_based = (!empty($trip->pricing_type) && $trip->pricing_type === 'traveler_based');
                                
                                if ($is_traveler_based) {
                                    $price_prefix = __('From', 'yatra') . ' ';
                                    // For traveler-based, prioritize effective_price_min
                                    $price_fields = [
                                        'effective_price_min',
                                        'discounted_price',
                                        'sale_price',
                                        'original_price',
                                        'regular_price'
                                    ];
                                } else {
                                    $price_prefix = ''; // No prefix for regular pricing
                                    // For regular pricing, prioritize discounted/sale prices
                                    $price_fields = [
                                        'discounted_price',
                                        'sale_price',
                                        'original_price',
                                        'regular_price',
                                        'price',
                                        'base_price'
                                    ];
                                }
                                
                                foreach ($price_fields as $field) {
                                    if (isset($trip->$field) && !empty($trip->$field) && (float)$trip->$field > 0) {
                                        $current_price = yatra_format_price((float)$trip->$field);
                                        break;
                                    }
                                }
                                
                                // Check for discount display
                                if (!empty($current_price) && !empty($trip->original_price) && (float)$trip->original_price > 0) {
                                    $current_field_value = 0;
                                    foreach ($price_fields as $field) {
                                        if (isset($trip->$field) && !empty($trip->$field) && (float)$trip->$field > 0) {
                                            $current_field_value = (float)$trip->$field;
                                            break;
                                        }
                                    }
                                    
                                    if ($current_field_value > 0 && (float)$trip->original_price > $current_field_value) {
                                        $original_price = yatra_format_price((float)$trip->original_price);
                                        $has_discount = true;
                                    }
                                }
                                
                                // Debug output (remove after testing)
                                if (current_user_can('manage_options')) {
                                    echo '<!-- DEBUG: Trip ID ' . $trip->id . ' -->';
                                    echo '<!-- PRICING DEBUG -->';
                                    echo '<!-- pricing_type: "' . ($trip->pricing_type ?? 'EMPTY') . '" -->';
                                    echo '<!-- original_price: "' . ($trip->original_price ?? 'EMPTY') . '" -->';
                                    echo '<!-- sale_price: "' . ($trip->sale_price ?? 'EMPTY') . '" -->';
                                    echo '<!-- discounted_price: "' . ($trip->discounted_price ?? 'EMPTY') . '" -->';
                                    echo '<!-- effective_price_min: "' . ($trip->effective_price_min ?? 'EMPTY') . '" -->';
                                    echo '<!-- regular_price: "' . ($trip->regular_price ?? 'EMPTY') . '" -->';
                                    echo '<!-- Final current_price: "' . $current_price . '" -->';
                                    echo '<!-- Categories count: ' . (isset($trip->categories) ? count($trip->categories) : 'not set') . ' -->';
                                }

                                // Discount badge text (optional)
                                $discount_text = '';
                                if ($has_discount && !empty($trip->discount_percentage)) {
                                    $discount_text = intval($trip->discount_percentage) . '%';
                                }

                                // Highlights: use first few activities/destinations as badges
                                $highlights = [];
                                if (!empty($trip->activities) && is_array($trip->activities)) {
                                    foreach (array_slice($trip->activities, 0, 3) as $act) {
                                        if (!empty($act->name)) {
                                            $highlights[] = $act->name;
                                        }
                                    }
                                } elseif (!empty($trip->destinations) && is_array($trip->destinations)) {
                                    foreach (array_slice($trip->destinations, 0, 3) as $dest) {
                                        if (!empty($dest->name)) {
                                            $highlights[] = $dest->name;
                                        }
                                    }
                                }

                                $permalink = !empty($trip->permalink) ? $trip->permalink : '';
                                ?>
                                <div class="yatra-trip-card">
                                    <div class="yatra-trip-card-image">
                                        <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($title); ?>">
                                        <?php if (!empty($discount_text)): ?>
                                        <div class="yatra-discount-badge">
                                            <?php echo esc_html($discount_text); ?> OFF
                                        </div>
                                        <?php endif; ?>
                                        <button class="yatra-favorite-btn" title="Add to favorites">
                                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                                            </svg>
                                        </button>
                                        <!-- Difficulty level overlay on bottom-right -->
                                        <?php if (!empty($difficulty) && !empty($trip->difficulty_icon)): ?>
                                            <div class="yatra-difficulty-overlay">
                                                <?php 
                                                // Display difficulty icon ONLY if available
                                                $icon_data = maybe_unserialize($trip->difficulty_icon);
                                                if (is_array($icon_data) && isset($icon_data['type']) && $icon_data['type'] === 'icon' && !empty($icon_data['value'])) {
                                                    echo yatra_svg_icon($icon_data['value'], 'difficulty-icon');
                                                    echo ' ' . esc_html($difficulty);
                                                }
                                                ?>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                    <!-- Destination section outside image -->
                                    <?php if (!empty($trip->destinations)) : ?>
                                        <div class="yatra-trip-destinations">
                                            <svg class="location-icon" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                                            </svg>
                                            <?php 
                                            $destination_links = [];
                                            foreach ($trip->destinations as $destination) {
                                                $destination_links[] = '<a href="' . esc_url(yatra_get_destination_permalink($destination)) . '" class="destination-link">' . esc_html($destination->name) . '</a>';
                                            }
                                            echo implode(', ', $destination_links);
                                            ?>
                                        </div>
                                    <?php endif; ?>
                                    <div class="yatra-trip-content">
                                        <h3 class="yatra-trip-title"><?php echo esc_html($title); ?></h3>
                                        
                                        <!-- Trip Info Row (Duration only) -->
                                        <?php if (!empty($duration)): ?>
                                            <div class="yatra-trip-info-row">
                                                <span class="yatra-info-badge duration">
                                                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 00-1-1H6z" clip-rule="evenodd" />
                                                    </svg>
                                                    <?php echo esc_html($duration); ?>
                                                </span>
                                            </div>
                                        <?php endif; ?>

                                        <!-- Activities Only -->
                                        <?php if (!empty($trip->activities) && is_array($trip->activities)) : ?>
                                            <div class="yatra-trip-activities">
                                                <?php foreach (array_slice($trip->activities, 0, 3) as $activity) : ?>
                                                    <a href="<?php echo esc_url(yatra_get_activity_permalink($activity)); ?>" class="yatra-tag activity-tag">
                                                        <?php echo esc_html($activity->name); ?>
                                                    </a>
                                                <?php endforeach; ?>
                                            </div>
                                        <?php endif; ?>

                                        <div class="yatra-trip-rating">
                                            <div class="yatra-rating-stars">
                                                <svg width="16" height="16" fill="#fbbf24" viewBox="0 0 24 24">
                                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                                </svg>
                                                <span class="yatra-rating-value"><?php echo esc_html(number_format($average_rating, 1)); ?></span>
                                            </div>
                                            <span class="yatra-reviews-count">(<?php echo esc_html($review_count); ?> reviews)</span>
                                        </div>

                                        <!-- Categories below reviews -->
                                        <?php if (!empty($trip->categories) && is_array($trip->categories)) : ?>
                                            <div class="yatra-trip-categories-compact">
                                                <div class="yatra-category-icon">
                                                    <?php 
                                                    // Show icon from first category
                                                    $first_category = $trip->categories[0];
                                                    if (!empty($first_category->icon)) {
                                                        $icon_data = maybe_unserialize($first_category->icon);
                                                        if (is_array($icon_data) && isset($icon_data['type']) && $icon_data['type'] === 'icon' && !empty($icon_data['value'])) {
                                                            echo yatra_svg_icon($icon_data['value'], 'category-icon');
                                                        } else {
                                                            // Default category icon
                                                            echo '<svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clip-rule="evenodd" /></svg>';
                                                        }
                                                    } else {
                                                        // Default category icon
                                                        echo '<svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clip-rule="evenodd" /></svg>';
                                                    }
                                                    ?>
                                                </div>
                                                <span class="yatra-categories-text">
                                                    <?php 
                                                    $category_links = [];
                                                    foreach ($trip->categories as $category) {
                                                        $category_links[] = '<a href="' . esc_url(yatra_get_category_permalink($category)) . '" class="yatra-category-link">' . esc_html($category->name) . '</a>';
                                                    }
                                                    echo implode(', ', $category_links);
                                                    ?>
                                                </span>
                                            </div>
                                        <?php endif; ?>

                                        <div class="yatra-trip-footer">
                                            <div class="yatra-trip-card-price">
                                                <span class="yatra-trip-price">
                                                    <?php
                                                    if (!empty($current_price)) {
                                                        echo $price_prefix . $current_price;
                                                        if ($has_discount && !empty($original_price)) {
                                                            echo ' <span class="yatra-original-price">' . $original_price . '</span>';
                                                        }
                                                    } else {
                                                        _e('Contact for pricing', 'yatra');
                                                    }
                                                    ?>
                                                </span>
                                            </div>
                                            <?php if (!empty($permalink)): ?>
                                                <a href="<?php echo esc_url($permalink); ?>" class="yatra-card-view-btn"><?php esc_html_e('View Details', 'yatra'); ?></a>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php else : ?>
                        <div class="yatra-empty-state text-center py-12">
                            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 class="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100"><?php _e('No trips found', 'yatra'); ?></h3>
                            <p class="mt-1 text-gray-500 dark:text-gray-400"><?php _e('Try adjusting your search or filter to find what you\'re looking for.', 'yatra'); ?></p>
                        </div>
                    <?php endif; ?>
                </main>
            </div>
        </div>
    </div>

    <!-- Pagination -->
    <?php
    $total_pages_to_render = max(1, (int) $trip_total_pages);
    $current_page_to_render = max(1, (int) $trip_current_page);
    if ($total_pages_to_render < $current_page_to_render) {
        $current_page_to_render = $total_pages_to_render;
    }

    // Helper to preserve filters in pagination URLs
    $base_url = remove_query_arg('page');
    $base_url = esc_url($base_url);

    $build_page_url = function(int $page) use ($base_url, $active_filters) {
        $args = ['page' => $page];
        foreach ($active_filters as $k => $v) {
            if ($v !== '') $args[$k] = $v;
        }
        return esc_url(add_query_arg($args, $base_url));
    };
    ?>
    <div class="yatra-listing-pagination">
        <?php $prev_disabled = $current_page_to_render <= 1; ?>
        <a class="yatra-pagination-btn <?php echo $prev_disabled ? 'disabled' : ''; ?>" href="<?php echo $prev_disabled ? 'javascript:void(0);' : $build_page_url($current_page_to_render - 1); ?>">
            <?php esc_html_e('Previous', 'yatra'); ?>
        </a>
        <?php
        for ($p = 1; $p <= $total_pages_to_render; $p++) {
            $active = $p === $current_page_to_render ? 'active' : '';
            echo '<a class="yatra-pagination-btn ' . $active . '" href="' . $build_page_url($p) . '">' . esc_html($p) . '</a>';
        }
        ?>
        <?php $next_disabled = $current_page_to_render >= $total_pages_to_render; ?>
        <a class="yatra-pagination-btn <?php echo $next_disabled ? 'disabled' : ''; ?>" href="<?php echo $next_disabled ? 'javascript:void(0);' : $build_page_url($current_page_to_render + 1); ?>">
            <?php esc_html_e('Next', 'yatra'); ?>
        </a>
    </div>
</div>

<?php if (!empty($current_filter_type) && !empty($current_filter_slug)) : ?>
<script>
document.addEventListener('DOMContentLoaded', function () {
    var ctxEl = document.getElementById('yatra-trip-context');
    if (!ctxEl) return;

    var type = ctxEl.getAttribute('data-type');
    var slug = ctxEl.getAttribute('data-slug');
    var name = ctxEl.getAttribute('data-name');

    if (!type || !slug) return;

    // When coming from a single destination URL, show that destination as selected
    if (type === 'destination') {
        var destDropdown = document.querySelector('.yatra-search-dropdown[data-dropdown="destination"]');
        if (destDropdown) {
            var valueEl = destDropdown.querySelector('.yatra-dropdown-value');
            if (valueEl && name) {
                valueEl.textContent = name;
            }

            var option = destDropdown.querySelector('.yatra-dropdown-option[data-value="' + slug + '"]');
            if (option) {
                option.classList.add('active');
            }
        }
    }

    // When coming from a single activity URL, show that activity as selected
    if (type === 'activity') {
        var actDropdown = document.querySelector('.yatra-search-dropdown[data-dropdown="activities"]');
        if (actDropdown) {
            var valueEl2 = actDropdown.querySelector('.yatra-dropdown-value');
            if (valueEl2 && name) {
                valueEl2.textContent = name;
            }

            var option2 = actDropdown.querySelector('.yatra-dropdown-option[data-value="' + slug + '"]');
            if (option2) {
                option2.classList.add('active');
            }
        }
    }
});
</script>
<?php endif; ?>

<style>

/* Complete Trip Card Styling */
.yatra-trip-card {
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
    border: 1px solid #e5e7eb;
    height: 100%;
    display: flex;
    flex-direction: column;
    box-shadow: none;
}

.yatra-trip-card:hover {
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

/* Image Section */
.yatra-trip-card-image {
    position: relative;
    width: 100%;
    height: 280px;
    overflow: hidden;
    background: #f8fafc;
}

.yatra-trip-card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.yatra-trip-card:hover .yatra-trip-card-image img {
    transform: scale(1.05);
}

/* Discount Badge */
.yatra-discount-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

/* Favorite Button */
.yatra-favorite-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(4px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.yatra-favorite-btn:hover {
    background: white;
    transform: scale(1.1);
}

/* Destination Section */
.yatra-trip-destinations {
    background: #f8fafc;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    border-bottom: 1px solid #e5e7eb;
    font-size: 0.875rem;
    color: #374151;
}

.yatra-trip-destinations .location-icon {
    color: #6b7280;
    flex-shrink: 0;
}

.yatra-trip-destinations .destination-link {
    color: #2563eb;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s ease;
}

.yatra-trip-destinations .destination-link:hover {
    color: #1d4ed8;
    text-decoration: underline;
}

/* Content Section */
.yatra-trip-content {
    padding: 16px;
}

.yatra-trip-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 16px 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Trip Info Row */
.yatra-trip-info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;
}

.yatra-info-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #f1f5f9;
    color: #475569;
    padding: 4px 8px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
    border: 1px solid #e2e8f0;
}

.yatra-info-badge.duration {
    background: #fef3c7;
    color: #92400e;
    border-color: #fde68a;
}

.yatra-info-badge svg {
    opacity: 0.8;
}

/* Difficulty Overlay on Image */
.yatra-difficulty-overlay {
    position: absolute;
    bottom: 12px;
    right: 12px;
    background: rgba(16, 185, 129, 0.9);
    color: white;
    padding: 6px 10px;
    border-radius: 16px;
    font-size: 0.8rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
    backdrop-filter: blur(4px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.yatra-difficulty-overlay svg {
    width: 14px;
    height: 14px;
    opacity: 0.9;
}

.yatra-difficulty-overlay .difficulty-icon {
    width: 14px;
    height: 14px;
}

/* Activities Section */
.yatra-trip-activities {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 16px;
    align-items: center;
}

/* Categories Compact Section */
.yatra-trip-categories-compact {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 16px;
}

.yatra-category-icon {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6366f1;
    flex-shrink: 0;
}

.yatra-category-icon svg {
    width: 14px;
    height: 14px;
}

.yatra-categories-text {
    font-size: 0.8rem;
    color: #6b7280;
    line-height: 1.2;
}

.yatra-category-link {
    color: #6b7280;
    text-decoration: none;
    transition: color 0.2s ease;
}

.yatra-category-link:hover {
    color: #6366f1;
    text-decoration: none;
}

.yatra-tag {
    display: inline-block;
    padding: 5px 12px;
    border-radius: 16px;
    font-size: 0.8rem;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s ease;
    border: 1px solid transparent;
}

.category-tag {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-transform: capitalize;
}

.category-tag:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(102, 126, 234, 0.4);
    color: white;
    text-decoration: none;
}

.activity-tag {
    background: #f0f9ff;
    color: #0369a1;
    border-color: #bae6fd;
    text-transform: capitalize;
}

.activity-tag:hover {
    background: #0369a1;
    color: white;
    border-color: #0369a1;
    transform: translateY(-1px);
    text-decoration: none;
}

/* Rating */
.yatra-trip-rating {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
}

.yatra-rating-stars {
    display: flex;
    align-items: center;
    gap: 4px;
}

.yatra-rating-value {
    font-weight: 600;
    color: #1f2937;
    font-size: 0.875rem;
}

.yatra-reviews-count {
    color: #6b7280;
    font-size: 0.8rem;
}

/* Footer */
.yatra-trip-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
}

.yatra-trip-price {
    font-size: 1.125rem;
    font-weight: 700;
    color: #2563eb;
}

.yatra-card-view-btn {
    background: #3b82f6;
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
    border: none;
    cursor: pointer;
}

.yatra-card-view-btn:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
    color: white;
    text-decoration: none;
}

</style>

<script>
function updateQueryStringParameter(uri, key, value) {
  const re = new RegExp(`([?&])${key}=.*?(&|$)`, 'i');
  const separator = uri.includes('?') ? '&' : '?';
  if (uri.match(re)) {
    return uri.replace(re, `$1${key}=${value}$2`);
  }
  return `${uri}${separator}${key}=${value}`;
}

// Handle destination/activity filter changes
document.querySelectorAll('#yatra-destination-filter, #yatra-activity-filter').forEach(select => {
  select.addEventListener('change', function() {
    const param = this.id === 'yatra-destination-filter' ? 'destination' : 'activity';
    window.location.href = updateQueryStringParameter(
      window.location.href, 
      param, 
      this.value
    );
  });
});

// Handle sort dropdown change
document.getElementById('yatra-sort-filter').addEventListener('change', function() {
  window.location.href = updateQueryStringParameter(
    window.location.href, 
    'sort', 
    this.value
  );
});
</script>

<script>
function updateFilters() {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);

  // Reset pagination when filters change
  params.delete('page');

  // Get destination and activity values
  const destination = document.getElementById('yatra-destination-filter')?.value;
  const activity = document.getElementById('yatra-activity-filter')?.value;
  const sort = document.getElementById('yatra-sort-filter')?.value;

  // Get sidebar filter values
  const priceMin = document.getElementById('priceMin')?.value;
  const priceMax = document.getElementById('priceMax')?.value;
  const durationMin = document.getElementById('durationMin')?.value;
  const durationMax = document.getElementById('durationMax')?.value;
  const ratingMin = document.getElementById('ratingMin')?.value;

  // Update params
  if (destination) params.set('destination', destination);
  else params.delete('destination');

  if (activity) params.set('activity', activity);
  else params.delete('activity');

  if (sort) params.set('sort', sort);
  else params.delete('sort');

  if (priceMin) params.set('price_min', priceMin);
  else params.delete('price_min');

  if (priceMax) params.set('price_max', priceMax);
  else params.delete('price_max');

  if (durationMin) params.set('duration_min', durationMin);
  else params.delete('duration_min');

  if (durationMax) params.set('duration_max', durationMax);
  else params.delete('duration_max');

  if (ratingMin) params.set('rating_min', ratingMin);
  else params.delete('rating_min');

  // Update URL and reload
  window.location.href = url.origin + url.pathname + '?' + params.toString();
}

// Attach to existing dropdowns and new sidebar inputs
document.querySelectorAll(
  '#yatra-destination-filter, #yatra-activity-filter, #yatra-sort-filter, ' +
  '#priceMin, #priceMax, ' +
  '#durationMin, #durationMax, ' +
  '#ratingMin'
).forEach(element => {
  element.addEventListener('change', updateFilters);
});
</script>

<?php
get_footer();
?>
