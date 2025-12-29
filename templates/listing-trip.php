<?php
/**
 * Trip Listing Page Template - Static Version with Dummy Data
 * 
 * @package Yatra
 */

use Yatra\Database\Tables\TripsTable;
use Yatra\Database\Tables\TripClassificationsTable;
use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Database\Tables\ReviewsTable;
use Yatra\Constants\ClassificationTypes;
use Yatra\Services\TripListingService;

if (!defined('ABSPATH')) {
    exit;
}

// Initialize TripListingService for template data
$tripListingService = new TripListingService();

$tripTable = esc_sql(TripsTable::getTableName());
$reviewsTable = esc_sql(ReviewsTable::getTableName());
$tripClassificationsTable = esc_sql(TripClassificationsTable::getTableName());
$classificationsTable = esc_sql(ClassificationsTable::getTableName());

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
// Helper function to safely get array from $_GET
function yatra_get_filter_array($key, $sanitize_callback = 'sanitize_text_field') {
    if (!isset($_GET[$key])) {
        return [];
    }
    
    $value = $_GET[$key];
    
    // If it's already an array, sanitize each element
    if (is_array($value)) {
        return array_map($sanitize_callback, $value);
    }
    
    // If it's a string, convert to array and sanitize
    if (is_string($value) && !empty($value)) {
        // Handle comma-separated values
        $array = explode(',', $value);
        return array_map($sanitize_callback, array_filter($array));
    }
    
    return [];
}

// Get active filters from URL parameters
$active_filters = [
    'destination'        => sanitize_text_field($_GET['destination'] ?? ''),
    'activity'           => sanitize_text_field($_GET['activity'] ?? ''),
    'price_min'          => !empty($_GET['price_min']) ? intval($_GET['price_min']) : '',
    'price_max'          => !empty($_GET['price_max']) ? intval($_GET['price_max']) : '',
    'trip_type'          => sanitize_text_field($_GET['trip_type'] ?? ''),
    'sort'               => sanitize_text_field($_GET['sort'] ?? ''),
    'difficulty'         => yatra_get_filter_array('difficulty', 'intval'),
    'rating'             => yatra_get_filter_array('rating', 'intval'),
    'categories'         => yatra_get_filter_array('categories', 'intval'),
    'destinations'       => yatra_get_filter_array('destinations', 'intval'),
    'activities'         => yatra_get_filter_array('activities', 'intval'),
    'accommodation'      => yatra_get_filter_array('accommodation', 'sanitize_text_field'),
    'included_services'  => yatra_get_filter_array('included_services', 'sanitize_text_field'),
    'special_offers'     => yatra_get_filter_array('special_offers', 'sanitize_text_field'),
    'booking_options'    => yatra_get_filter_array('booking_options', 'sanitize_text_field'),
    'age_suitability'    => yatra_get_filter_array('age_suitability', 'sanitize_text_field'),
    'attributes'         => isset($_GET['attributes']) && is_array($_GET['attributes']) ? array_map(function($attr_data) {
        if (is_array($attr_data)) {
            return array_map('sanitize_text_field', $attr_data);
        }
        return sanitize_text_field($attr_data);
    }, $_GET['attributes']) : [],
];


// Enqueue the filter JavaScript
wp_enqueue_script(
    'yatra-listing-filters',
    plugin_dir_url(__FILE__) . '../public/js/listing-filters.js',
    ['jquery'],
    '1.0.0',
    true
);

// Add currency formatting function to JavaScript with proper escaping
$contact_for_pricing = esc_js(__('Contact for pricing', 'yatra'));
wp_add_inline_script('yatra-listing-filters', "
    window.yatra_format_price = function(amount) {
        if (!amount || amount == 0) return '{$contact_for_pricing}';
        // Use global currency settings if available
        const currency = window.yatraSettings?.currency || 'USD';
        const symbol = window.yatraSettings?.currencySymbol || '$';
        return symbol + amount.toLocaleString();
    };
");

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
} else {
    // No data from new system - ensure empty state to prevent fallback to old tour posts
    $trips_source = [];
    $trip_total = 0;
    $trip_total_pages = 1;
    $trip_current_page = 1;
    $trip_dest_options = [];
    $trip_act_options = [];
    
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
                            <span class="yatra-dropdown-label"><?php esc_html_e('Destination', 'yatra'); ?></span>
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
                            <span class="yatra-dropdown-label"><?php esc_html_e('Activities', 'yatra'); ?></span>
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
                            <span class="yatra-dropdown-label"><?php esc_html_e('Duration', 'yatra'); ?></span>
                            <span class="yatra-dropdown-value"><?php echo !empty($active_filters['duration']) ? esc_html($active_filters['duration']) : esc_html__('Trip duration', 'yatra'); ?></span>
                        </div>
                        <svg class="yatra-dropdown-arrow yatra-arrow-up" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                        </svg>
                    </div>
                    <div class="yatra-dropdown-menu yatra-duration-menu">
                        <div class="yatra-duration-slider-wrapper">
                            <div class="yatra-duration-badges">
                                <span class="yatra-duration-badge yatra-duration-min-badge"><?php echo esc_html__('2 Days', 'yatra'); ?></span>
                                <span class="yatra-duration-badge yatra-duration-max-badge"><?php echo esc_html__('29 Days', 'yatra'); ?></span>
                            </div>
                            <div class="yatra-dual-range-slider">
                                <input type="range" id="durationMin" min="1" max="30" value="2" class="yatra-range-min">
                                <input type="range" id="durationMax" min="1" max="30" value="29" class="yatra-range-max">
                                <div class="yatra-slider-track"></div>
                                <div class="yatra-slider-range"></div>
                            </div>
                            <div class="yatra-duration-labels">
                                <span><?php echo esc_html__('2 Days', 'yatra'); ?></span>
                                <span><?php echo esc_html__('29 Days', 'yatra'); ?></span>
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
                            <span class="yatra-dropdown-label"><?php esc_html_e('Budget', 'yatra'); ?></span>
                            <span class="yatra-dropdown-value"><?php echo !empty($active_filters['budget']) ? esc_html($active_filters['budget']) : esc_html__('Your budget range', 'yatra'); ?></span>
                        </div>
                        <svg class="yatra-dropdown-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    <div class="yatra-dropdown-menu">
                        <div class="yatra-dropdown-option" data-value="0-1000"><?php echo esc_html__('Under $1,000', 'yatra'); ?></div>
                        <div class="yatra-dropdown-option" data-value="1000-2000"><?php echo esc_html__('$1,000 - $2,000', 'yatra'); ?></div>
                        <div class="yatra-dropdown-option" data-value="2000-3000"><?php echo esc_html__('$2,000 - $3,000', 'yatra'); ?></div>
                        <div class="yatra-dropdown-option" data-value="3000-5000"><?php echo esc_html__('$3,000 - $5,000', 'yatra'); ?></div>
                        <div class="yatra-dropdown-option" data-value="5000+"><?php echo esc_html__('$5,000+', 'yatra'); ?></div>
                    </div>
                </div>

                <!-- Search Button -->
                <button class="yatra-search-main-btn">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    <?php esc_html_e('Search', 'yatra'); ?>
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
                        <label><?php esc_html_e('Sort by:', 'yatra'); ?></label>
                        <?php
                        $sort_options = [
                            ''              => __('Recommended', 'yatra'),
                            'most_popular'  => __('Most Popular', 'yatra'),
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
                                $args = [];
                                
                                // Add sort parameter
                                if (!empty($value)) {
                                    $args['sort'] = $value;
                                }
                                
                                // Preserve all active filters
                                foreach ($active_filters as $k => $v) {
                                    if ($k === 'sort') continue;
                                    
                                    // Handle array filters (difficulty, rating, categories, etc.)
                                    if (is_array($v) && !empty($v)) {
                                        $args[$k] = $v;
                                    }
                                    // Handle string/numeric filters
                                    elseif (!is_array($v) && $v !== '' && $v !== null) {
                                        $args[$k] = $v;
                                    }
                                }
                                
                                $url = esc_url(add_query_arg($args, $base_url_sort));
                                $selected = ($value === $current_sort) ? 'selected' : '';
                                
                                                       
                                echo '<option value="' . $url . '" ' . $selected . '>' . esc_html($label) . '</option>';
                            }
                            ?>
                        </select>
                    </div>
                    <div class="yatra-view-toggle">
                        <button class="yatra-view-btn active" data-view="grid" title="<?php esc_attr_e('Grid View', 'yatra'); ?>">
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                            </svg>
                        </button>
                        <button class="yatra-view-btn" data-view="list" title="<?php esc_attr_e('List View', 'yatra'); ?>">
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
                        <h2><?php esc_html_e('Filters', 'yatra'); ?></h2>
                        <span class="yatra-clear-filters"><?php esc_html_e('Clear all', 'yatra'); ?></span>
                    </div>

                    <!-- Price Range -->
                    <?php
                    // Get price statistics from service
                    $price_stats = $tripListingService->getPriceStats();
                    
                    $min_price = $price_stats ? (int)$price_stats->min_price : 0;
                    $max_price = $price_stats ? (int)$price_stats->max_price : 10000;
                    $step = max(1, (int)($max_price / 100)); // Dynamic step based on price range
                    ?>
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="price">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                                </svg>
                                <span><?php esc_html_e('Price Range', 'yatra'); ?></span>
                            </div>
                            <div class="yatra-filter-actions">
                                <span class="yatra-clear-section" data-section="price" title="<?php esc_attr_e('Clear price filters', 'yatra'); ?>">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </span>
                                <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </div>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-price-range">
                                <div class="yatra-price-inputs">
                                    <div class="yatra-price-input-group">
                                        <label class="yatra-price-input-label"><?php esc_html_e('Min Price', 'yatra'); ?></label>
                                        <input type="number" name="price_min" placeholder="<?php echo $min_price; ?>" min="<?php echo $min_price; ?>" max="<?php echo $max_price; ?>" value="<?php echo !empty($active_filters['price_min']) ? esc_attr($active_filters['price_min']) : ''; ?>" id="priceMin">
                                    </div>
                                    <div class="yatra-price-separator">—</div>
                                    <div class="yatra-price-input-group">
                                        <label class="yatra-price-input-label"><?php esc_html_e('Max Price', 'yatra'); ?></label>
                                        <input type="number" name="price_max" placeholder="<?php echo $max_price; ?>" min="<?php echo $min_price; ?>" max="<?php echo $max_price; ?>" value="<?php echo !empty($active_filters['price_max']) ? esc_attr($active_filters['price_max']) : ''; ?>" id="priceMax">
                                    </div>
                                </div>
                                <div class="yatra-price-slider">
                                    <input type="range" min="<?php echo $min_price; ?>" max="<?php echo $max_price; ?>" step="<?php echo $step; ?>" value="<?php echo !empty($active_filters['price_min']) ? esc_attr($active_filters['price_min']) : $min_price; ?>" class="yatra-range-min" id="priceRangeMin" data-default="<?php echo $min_price; ?>" data-user-set="<?php echo !empty($active_filters['price_min']) ? 'true' : 'false'; ?>">
                                    <input type="range" min="<?php echo $min_price; ?>" max="<?php echo $max_price; ?>" step="<?php echo $step; ?>" value="<?php echo !empty($active_filters['price_max']) ? esc_attr($active_filters['price_max']) : $max_price; ?>" class="yatra-range-max" id="priceRangeMax" data-default="<?php echo $max_price; ?>" data-user-set="<?php echo !empty($active_filters['price_max']) ? 'true' : 'false'; ?>">
                                </div>
                                <div class="yatra-price-display"><?php echo yatra_format_price($min_price); ?> - <?php echo yatra_format_price($max_price); ?></div>
                            </div>
                        </div>
                    </div>

                    <!-- Trip Type Filter -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="trip-type">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span><?php esc_html_e('Trip Type', 'yatra'); ?></span>
                            </div>
                            <div class="yatra-filter-actions">
                                <span class="yatra-clear-section" data-section="trip-type" title="<?php esc_attr_e('Clear trip type filter', 'yatra'); ?>">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </span>
                                <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </div>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <?php
                                // Get trip type options from service
                                $trip_type_options = $tripListingService->getFilterData()['trip_types'];
                                
                                foreach ($trip_type_options as $type_option) :
                                ?>
                                <label class="yatra-checkbox-label">
                                    <input type="radio" name="trip_type" value="<?php echo esc_attr($type_option->value); ?>" <?php echo ($active_filters['trip_type'] === $type_option->value) ? 'checked' : ''; ?>>
                                    <span><?php echo esc_html($type_option->label); ?></span>
                                    <span class="yatra-filter-count">(<?php echo (int)$type_option->count; ?>)</span>
                                </label>
                                <?php endforeach; ?>
                                
                                <!-- All Types Option -->
                                <label class="yatra-checkbox-label">
                                    <input type="radio" name="trip_type" value="" <?php echo empty($active_filters['trip_type']) ? 'checked' : ''; ?>>
                                    <span><?php esc_html_e('All Types', 'yatra'); ?></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Difficulty Level -->
                    <?php
                    $difficulty_service = new \Yatra\Services\DifficultyLevelService();
                    $difficulty_levels = $difficulty_service->getPublished(['order_by' => 'sorting', 'order' => 'ASC']);
                    if (!empty($difficulty_levels)) :
                    ?>
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="difficulty">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                                </svg>
                                <span><?php esc_html_e('Difficulty Level', 'yatra'); ?></span>
                            </div>
                            <div class="yatra-filter-actions">
                                <span class="yatra-clear-section" data-section="difficulty" title="<?php esc_attr_e('Clear difficulty filters', 'yatra'); ?>">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </span>
                                <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </div>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <?php 
                                // Get difficulty levels from service
                                $difficulty_levels = $tripListingService->getFilterData()['difficulty_levels'];
                                
                                foreach ($difficulty_levels as $level) : 
                                    // Show all difficulty levels, even with 0 count for better UX
                                ?>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" name="difficulty[]" value="<?php echo esc_attr($level->id); ?>" <?php echo in_array($level->id, $active_filters['difficulty'] ?? []) ? 'checked' : ''; ?>>
                                    <span><?php echo esc_html($level->name); ?></span>
                                    <span class="yatra-filter-count">(<?php echo (int)$level->count; ?>)</span>
                                </label>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Rating -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="rating">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="#fbbf24" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                <span><?php esc_html_e('Rating', 'yatra'); ?></span>
                            </div>
                            <div class="yatra-filter-actions">
                                <span class="yatra-clear-section" data-section="rating" title="<?php esc_attr_e('Clear rating filters', 'yatra'); ?>">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </span>
                                <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </div>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-rating-filter">
                                <?php
                                // Get rating options from service
                                $rating_options = $tripListingService->getFilterData()['ratings'];
                                
                                foreach ($rating_options as $option) :
                                    // Show all rating options, even with 0 count for better UX
                                ?>
                                <label class="yatra-rating-option">
                                    <input type="checkbox" name="rating[]" value="<?php echo esc_attr($option->rating); ?>" <?php echo in_array($option->rating, $active_filters['rating'] ?? []) ? 'checked' : ''; ?>>
                                    <div class="yatra-stars-display">
                                        <?php for ($i = 1; $i <= 5; $i++) : ?>
                                            <svg class="yatra-star <?php echo $i <= $option->rating ? 'filled' : 'empty'; ?>" width="16" height="16" viewBox="0 0 24 24">
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="<?php echo $i <= $option->rating ? '#fbbf24' : '#e5e7eb'; ?>"/>
                                            </svg>
                                        <?php endfor; ?>
                                        <span class="yatra-rating-label"><?php echo esc_html($option->label); ?></span>
                                        <span class="yatra-filter-count">(<?php echo (int)$option->count; ?>)</span>
                                    </div>
                                </label>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    </div>

                    <!-- Trip Categories -->
                    <?php
                    $category_service = new \Yatra\Services\TripCategoryService();
                    $categories = $category_service->getPublished(['order_by' => 'name', 'order' => 'ASC']);
                    if (!empty($categories)) :
                    ?>
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="categories">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clip-rule="evenodd" />
                                </svg>
                                <span><?php esc_html_e('Categories', 'yatra'); ?></span>
                            </div>
                            <div class="yatra-filter-actions">
                                <span class="yatra-clear-section" data-section="categories" title="<?php esc_attr_e('Clear category filters', 'yatra'); ?>">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </span>
                                <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </div>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <?php 
                                // Get categories from service
                                $categories = $tripListingService->getFilterData()['categories'];
                                
                                foreach ($categories as $category) : 
                                ?>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" name="categories[]" value="<?php echo esc_attr($category->id); ?>" <?php echo in_array($category->id, $active_filters['categories'] ?? []) ? 'checked' : ''; ?>>
                                    <span><?php echo esc_html($category->name); ?></span>
                                    <span class="yatra-filter-count">(<?php echo (int)$category->count; ?>)</span>
                                </label>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Destinations -->
                    <?php
                    $destination_service = new \Yatra\Services\DestinationService();
                    $destinations = $destination_service->getPublished(['order_by' => 'name', 'order' => 'ASC', 'limit' => 15]);
                    if (!empty($destinations)) :
                    ?>
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="destinations">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                                </svg>
                                <span><?php esc_html_e('Destinations', 'yatra'); ?></span>
                            </div>
                            <div class="yatra-filter-actions">
                                <span class="yatra-clear-section" data-section="destinations" title="<?php esc_attr_e('Clear destination filters', 'yatra'); ?>">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </span>
                                <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </div>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <?php 
                                // Get destinations from service
                                $destinations = $tripListingService->getFilterData()['destinations'];
                                
                                foreach ($destinations as $destination) : 
                                    if ($destination->count > 0) :
                                ?>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" name="destinations[]" value="<?php echo esc_attr($destination->id); ?>" <?php echo in_array($destination->id, $active_filters['destinations'] ?? []) ? 'checked' : ''; ?>>
                                    <span><?php echo esc_html($destination->name); ?></span>
                                    <span class="yatra-filter-count">(<?php echo (int)$destination->count; ?>)</span>
                                </label>
                                <?php endif; endforeach; ?>
                            </div>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Activities -->
                    <?php
                    $activity_service = new \Yatra\Services\ActivityService();
                    $activities = $activity_service->getPublished(['order_by' => 'name', 'order' => 'ASC', 'limit' => 10]);
                    if (!empty($activities)) :
                    ?>
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="activities">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                </svg>
                                <span><?php esc_html_e('Activities', 'yatra'); ?></span>
                            </div>
                            <div class="yatra-filter-actions">
                                <span class="yatra-clear-section" data-section="activities" title="<?php esc_attr_e('Clear activity filters', 'yatra'); ?>">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </span>
                                <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </div>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <?php 
                                // Get activities from service
                                $activities = $tripListingService->getFilterData()['activities'];
                                
                                foreach ($activities as $activity) : 
                                ?>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" name="activities[]" value="<?php echo esc_attr($activity->id); ?>" <?php echo in_array($activity->id, $active_filters['activities'] ?? []) ? 'checked' : ''; ?>>
                                    <span><?php echo esc_html($activity->name); ?></span>
                                    <span class="yatra-filter-count">(<?php echo (int)$activity->count; ?>)</span>
                                </label>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Accommodation Type -->
                    <?php
                    // Get accommodation types from service
                    $accommodation_types = $tripListingService->getFilterData()['accommodations'];
                    
                    if (!empty($accommodation_types)) :
                    ?>
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="accommodation">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                </svg>
                                <span><?php esc_html_e('Accommodation', 'yatra'); ?></span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <?php foreach ($accommodation_types as $accommodation) : ?>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" name="accommodation[]" value="<?php echo esc_attr($accommodation->name); ?>" <?php echo in_array($accommodation->name, $active_filters['accommodation'] ?? []) ? 'checked' : ''; ?>>
                                    <span><?php echo esc_html(ucwords(str_replace(['_', '-'], ' ', $accommodation->name))); ?></span>
                                    <span class="yatra-filter-count">(<?php echo (int)$accommodation->trip_count; ?>)</span>
                                </label>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Included Services -->
                    <?php
                    // Get included services from service
                    $included_services = $tripListingService->getFilterData()['included_services'];
                    
                    if (!empty($included_services)) :
                    ?>
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="services">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 713.138-3.138z"/>
                                </svg>
                                <span><?php esc_html_e('Included Services', 'yatra'); ?></span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <?php foreach ($included_services as $service) : ?>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" name="services[]" value="<?php echo esc_attr($service->service_name); ?>" <?php echo in_array($service->service_name, $active_filters['services'] ?? []) ? 'checked' : ''; ?>>
                                    <span><?php echo esc_html($service->service_name); ?></span>
                                    <span class="yatra-filter-count">(<?php echo (int)$service->trip_count; ?>)</span>
                                </label>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Special Offers -->
                    <?php
                    // Get special offers from service
                    $special_offers = $tripListingService->getFilterData()['special_offers'];
                    
                    if (!empty($special_offers)) :
                    ?>
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="offers">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
                                </svg>
                                <span><?php esc_html_e('Special Offers', 'yatra'); ?></span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <?php foreach ($special_offers as $offer) : ?>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" name="offers[]" value="<?php echo esc_attr($offer->value); ?>" <?php echo in_array($offer->value, $active_filters['offers'] ?? []) ? 'checked' : ''; ?>>
                                    <span><?php echo esc_html($offer->label); ?></span>
                                    <span class="yatra-filter-count">(<?php echo (int)$offer->count; ?>)</span>
                                </label>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Booking Options -->
                    <?php
                    // Get booking options from service
                    $booking_options = $tripListingService->getFilterData()['booking_options'];
                    
                    if (!empty($booking_options)) :
                    ?>
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="booking">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                <span><?php esc_html_e('Booking Options', 'yatra'); ?></span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <?php foreach ($booking_options as $option) : ?>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" name="booking[]" value="<?php echo esc_attr($option->value); ?>" <?php echo in_array($option->value, $active_filters['booking'] ?? []) ? 'checked' : ''; ?>>
                                    <span><?php echo esc_html($option->label); ?></span>
                                    <span class="yatra-filter-count">(<?php echo (int)$option->count; ?>)</span>
                                </label>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Age Suitability -->
                    <?php
                    // Get age restrictions from service
                    $age_options = $tripListingService->getFilterData()['age_restrictions'];
                    
                    if (!empty($age_options)) :
                    ?>
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="age">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span><?php esc_html_e('Age Suitability', 'yatra'); ?></span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <?php foreach ($age_options as $option) : ?>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" name="age[]" value="<?php echo esc_attr($option->value); ?>" <?php echo in_array($option->value, $active_filters['age'] ?? []) ? 'checked' : ''; ?>>
                                    <span><?php echo esc_html($option->label); ?></span>
                                    <span class="yatra-filter-count">(<?php echo (int)$option->count; ?>)</span>
                                </label>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Trip Attributes Filter -->
                    <?php if (is_array($yatra_trip_list) && !empty($yatra_trip_list['attributes'])) : ?>
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="trip-attributes">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                                </svg>
                                <span><?php esc_html_e('Trip Attributes', 'yatra'); ?></span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <?php foreach ($yatra_trip_list['attributes'] as $attribute) : ?>
                                <?php
                                $attribute_filter_name = 'attributes[' . $attribute['id'] . ']';
                                $current_values = $active_filters['attributes'][$attribute['id']] ?? [];

                                $field_options = [];
                                if (!empty($attribute['field_options'])) {
                                    $field_options = is_array($attribute['field_options']) ?
                                        $attribute['field_options'] :
                                        (json_decode($attribute['field_options'], true) ?: []);
                                }
                                ?>

                                <div class="yatra-attribute-item">
                                    <div class="yatra-attribute-label">
                                        <?php if (!empty($attribute['icon'])) : ?>
                                            <?php
                                            $icon_data = maybe_unserialize($attribute['icon']);
                                            if (is_array($icon_data) && $icon_data['type'] === 'image' && !empty($icon_data['value'])) {
                                                $image_url = '';
                                                if (is_numeric($icon_data['value'])) {
                                                    $image_url = wp_get_attachment_image_url((int) $icon_data['value'], 'thumbnail');
                                                } elseif (is_string($icon_data['value']) && filter_var($icon_data['value'], FILTER_VALIDATE_URL)) {
                                                    $image_url = $icon_data['value'];
                                                }
                                                if (!empty($image_url)) {
                                                    echo '<img class="yatra-attribute-icon" src="' . esc_url($image_url) . '" alt="' . esc_attr($attribute['name']) . '" width="16" height="16">';
                                                }
                                            } elseif (is_array($icon_data) && $icon_data['type'] === 'icon' && !empty($icon_data['value'])) {
                                                echo '<span class="yatra-attribute-icon">' . yatra_svg_icon($icon_data['value'], '') . '</span>';
                                            }
                                            ?>
                                        <?php endif; ?>
                                        <span class="yatra-attribute-name"><?php echo esc_html($attribute['name']); ?></span>
                                    </div>
                                    <div class="yatra-attribute-content">
                                        <?php if (($attribute['field_type'] === 'select' || $attribute['field_type'] === 'radio') && !empty($field_options)) : ?>
                                            <div class="yatra-checkbox-group">
                                                <?php foreach ($field_options as $option) : ?>
                                                    <label class="yatra-checkbox-label">
                                                        <input
                                                            type="checkbox"
                                                            name="<?php echo esc_attr($attribute_filter_name); ?>[]"
                                                            value="<?php echo esc_attr($option['value']); ?>"
                                                            <?php echo in_array($option['value'], $current_values) ? 'checked' : ''; ?>
                                                        >
                                                        <span><?php echo esc_html($option['label']); ?></span>
                                                    </label>
                                                <?php endforeach; ?>
                                            </div>

                                        <?php elseif ($attribute['field_type'] === 'checkbox') : ?>
                                            <div class="yatra-checkbox-group">
                                                <label class="yatra-checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        name="<?php echo esc_attr($attribute_filter_name); ?>"
                                                        value="1"
                                                        <?php echo in_array('1', $current_values) ? 'checked' : ''; ?>
                                                    >
                                                    <span><?php _e('Yes', 'yatra'); ?></span>
                                                </label>
                                            </div>

                                        <?php elseif ($attribute['field_type'] === 'number') : ?>
                                            <div class="yatra-input-group">
                                                <input
                                                    type="number"
                                                    name="<?php echo esc_attr($attribute_filter_name); ?>[min]"
                                                    placeholder="<?php esc_attr_e('Min', 'yatra'); ?>"
                                                    value="<?php echo esc_attr($current_values['min'] ?? ''); ?>"
                                                    class="yatra-filter-input"
                                                >
                                                <input
                                                    type="number"
                                                    name="<?php echo esc_attr($attribute_filter_name); ?>[max]"
                                                    placeholder="<?php esc_attr_e('Max', 'yatra'); ?>"
                                                    value="<?php echo esc_attr($current_values['max'] ?? ''); ?>"
                                                    class="yatra-filter-input"
                                                >
                                            </div>

                                        <?php elseif ($attribute['field_type'] === 'date') : ?>
                                            <div class="yatra-input-group">
                                                <input
                                                    type="date"
                                                    name="<?php echo esc_attr($attribute_filter_name); ?>[from]"
                                                    value="<?php echo esc_attr($current_values['from'] ?? ''); ?>"
                                                    class="yatra-filter-input"
                                                >
                                                <input
                                                    type="date"
                                                    name="<?php echo esc_attr($attribute_filter_name); ?>[to]"
                                                    value="<?php echo esc_attr($current_values['to'] ?? ''); ?>"
                                                    class="yatra-filter-input"
                                                >
                                            </div>

                                        <?php else : ?>
                                            <input
                                                type="text"
                                                name="<?php echo esc_attr($attribute_filter_name); ?>"
                                                placeholder="<?php esc_attr_e('Type to filter…', 'yatra'); ?>"
                                                value="<?php echo esc_attr(implode(', ', $current_values)); ?>"
                                                class="yatra-filter-input"
                                            >
                                        <?php endif; ?>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <?php endif; ?>

                </aside>

                <!-- Main Content Area -->
                <main class="yatra-listing-content">
                    <?php if (count($trips_source) > 0) : ?>
                        <div class="yatra-trip-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <?php foreach ($trips_source as $trip) : ?>
                                <!-- Use the reusable trip-listing-card.php component -->
                                <?php include(dirname(__FILE__) . '/trip-listing-card.php'); ?>
                            <?php endforeach; ?>
                        </div>
                    <?php else : ?>
                        <div class="yatra-empty-state text-center py-12">
                            <svg class="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 class="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100"><?php esc_html_e('No trips found', 'yatra'); ?></h3>
                            <p class="mt-1 text-gray-500 dark:text-gray-400"><?php esc_html_e('Try adjusting your search or filter to find what you\'re looking for.', 'yatra'); ?></p>
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

<?php
get_footer();
?>
