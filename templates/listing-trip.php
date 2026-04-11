<?php
/**
 * Trip listing template (presentation). Data is prepared in {@see TripListingPageContextFactory} and set by {@see ListingPageHandler}.
 *
 * @package Yatra
 */

use Yatra\Services\TripListingService;

if (!defined('ABSPATH')) {
    exit;
}

$tripListingService = new TripListingService();

$ctx = $GLOBALS['yatra_trip_listing_context'] ?? [];
$filter_data = $ctx['filter_data'] ?? [];
if ($filter_data === []) {
    $filter_data = $tripListingService->getFilterData();
}
$yatra_trip_list = $ctx['trip_list'] ?? ($GLOBALS['yatra_trip_list'] ?? null);
$trips_source = $ctx['trips'] ?? [];
$trip_total = (int) ($ctx['total'] ?? 0);
$trip_total_pages = (int) ($ctx['pages'] ?? 1);
$trip_current_page = (int) ($ctx['current_page'] ?? 1);
$trip_dest_options = $ctx['destinations'] ?? [];
$trip_act_options = $ctx['activities'] ?? [];
$active_filters = $ctx['active_filters'] ?? [];
$yatra_listing_title = $ctx['listing_title'] ?? __('All Trips', 'yatra');
$current_filter_type = $ctx['taxonomy_type'] ?? '';
$current_filter_slug = $ctx['taxonomy_slug'] ?? '';
$current_filter_name = $ctx['taxonomy_name'] ?? '';
$yatra_results = $ctx['results'] ?? [
    'display_total' => 0,
    'start_item' => 0,
    'end_item' => 0,
    'per_page' => yatra_get_posts_per_page(),
];
$yatra_pagination = $ctx['pagination'] ?? [
    'total_pages' => 1,
    'current_page' => 1,
    'prev_url' => null,
    'next_url' => null,
    'items' => [],
];
$yatra_sort_options = $ctx['sort_options'] ?? [];
$show_taxonomy_context = !empty($ctx['show_taxonomy_context']);

yatra_get_header();
?>

<?php if ($show_taxonomy_context) : ?>
    <div id="yatra-trip-context"
         data-type="<?php echo esc_attr($current_filter_type); ?>"
         data-slug="<?php echo esc_attr($current_filter_slug); ?>"
         data-name="<?php echo esc_attr($current_filter_name); ?>"
         style="display:none;"></div>
<?php endif; ?>

<div class="yatra-listing-page yatra-trip-listing" id="yatra-trip-listing-root">
    <!-- Trip Search Shortcode - replaces hardcoded search UI -->
    <div class="yatra-trip-listing-search-wrap">
        <?php echo do_shortcode('[yatra_search]'); ?>
    </div>

    <div class="yatra-listing-wrapper yatra-listing-wrapper--overlay-host">
        <div id="yatra-listing-loading-overlay" class="yatra-listing-loading-overlay" aria-hidden="true" role="status">
            <div class="yatra-listing-loading-card">
                <span class="yatra-listing-loading-spinner" aria-hidden="true"></span>
                <p class="yatra-listing-loading-text"><?php esc_html_e('Updating trips…', 'yatra'); ?></p>
            </div>
        </div>
        <div class="yatra-listing-container">
            
            <!-- Results Header -->
            <div class="yatra-results-header">
                <div class="yatra-results-info">
                    <h1><?php echo esc_html($yatra_listing_title); ?></h1>
                    <?php if (empty($show_taxonomy_context)) : ?>
                        <p class="yatra-listing-archive-lede"><?php esc_html_e('Compare trips, filter by budget and trip style, then open a trip for full details and booking.', 'yatra'); ?></p>
                    <?php elseif (!empty($current_filter_name) || !empty($current_filter_slug)) : ?>
                        <p class="yatra-listing-archive-lede"><?php
                        printf(
                            esc_html__('Filtered by: %s', 'yatra'),
                            esc_html($current_filter_name !== '' ? $current_filter_name : (string) $current_filter_slug)
                        );
                        ?></p>
                    <?php endif; ?>
                    <p class="yatra-results-count">
                        <?php
                        if ($yatra_results['display_total'] > 0) {
                            echo sprintf(
                                __('Showing <strong>%d-%d</strong> of %d trips (Page %d of %d)', 'yatra'),
                                (int) $yatra_results['start_item'],
                                (int) $yatra_results['end_item'],
                                (int) $yatra_results['display_total'],
                                $trip_current_page,
                                $trip_total_pages
                            );
                        } else {
                            echo esc_html__('No trips found', 'yatra');
                        }
                        ?>
                    </p>
                </div>
                <div class="yatra-results-controls">
                    <div class="yatra-sort-control">
                        <label><?php esc_html_e('Sort by:', 'yatra'); ?></label>
                        <?php
                        ?>
                        <select id="yatra-sort-filter" class="yatra-sort-filter-select">
                            <?php foreach ($yatra_sort_options as $sort_opt) : ?>
                                <option value="<?php echo esc_url($sort_opt['url']); ?>"<?php echo !empty($sort_opt['selected']) ? ' selected="selected"' : ''; ?>>
                                    <?php echo esc_html($sort_opt['label']); ?>
                                </option>
                            <?php endforeach; ?>
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
                    $price_stats = $filter_data['price_stats'] ?? $tripListingService->getPriceStats();

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
                                $trip_type_options = $filter_data['trip_types'] ?? [];
                                
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
                    $difficulty_levels = $filter_data['difficulty_levels'] ?? [];
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
                            <?php
                            $yatra_sidebar_cb_rows = [];
                            foreach ($difficulty_levels as $level) {
                                $yatra_sidebar_cb_rows[] = [
                                    'value' => $level->id,
                                    'label' => $level->name,
                                    'count' => (int) $level->count,
                                ];
                            }
                            $yatra_sidebar_cb_input_name = 'difficulty[]';
                            $yatra_sidebar_cb_active = $active_filters['difficulty'] ?? [];
                            include __DIR__ . '/partials/listing-sidebar-collapsible-checkboxes.php';
                            unset($yatra_sidebar_cb_rows, $yatra_sidebar_cb_input_name, $yatra_sidebar_cb_active);
                            ?>
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
                                $rating_options = $filter_data['ratings'] ?? [];
                                
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
                    $categories = $filter_data['categories'] ?? [];
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
                            <?php
                            $yatra_sidebar_cb_rows = [];
                            foreach ($categories as $category) {
                                $yatra_sidebar_cb_rows[] = [
                                    'value' => $category->id,
                                    'label' => $category->name,
                                    'count' => (int) $category->count,
                                ];
                            }
                            $yatra_sidebar_cb_input_name = 'categories[]';
                            $yatra_sidebar_cb_active = $active_filters['categories'] ?? [];
                            include __DIR__ . '/partials/listing-sidebar-collapsible-checkboxes.php';
                            unset($yatra_sidebar_cb_rows, $yatra_sidebar_cb_input_name, $yatra_sidebar_cb_active);
                            ?>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Destinations -->
                    <?php
                    $destinations = $filter_data['destinations'] ?? [];
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
                            <?php
                            $yatra_sidebar_cb_rows = [];
                            foreach ($destinations as $destination) {
                                $yatra_sidebar_cb_rows[] = [
                                    'value' => $destination->id,
                                    'label' => $destination->name,
                                    'count' => (int) $destination->count,
                                ];
                            }
                            $yatra_sidebar_cb_input_name = 'destinations[]';
                            $yatra_sidebar_cb_active = $active_filters['destinations'] ?? [];
                            include __DIR__ . '/partials/listing-sidebar-collapsible-checkboxes.php';
                            unset($yatra_sidebar_cb_rows, $yatra_sidebar_cb_input_name, $yatra_sidebar_cb_active);
                            ?>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Activities -->
                    <?php
                    $activities = $filter_data['activities'] ?? [];
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
                            <?php
                            $yatra_sidebar_cb_rows = [];
                            foreach ($activities as $activity) {
                                $yatra_sidebar_cb_rows[] = [
                                    'value' => $activity->id,
                                    'label' => $activity->name,
                                    'count' => (int) $activity->count,
                                ];
                            }
                            $yatra_sidebar_cb_input_name = 'activities[]';
                            $yatra_sidebar_cb_active = $active_filters['activities'] ?? [];
                            include __DIR__ . '/partials/listing-sidebar-collapsible-checkboxes.php';
                            unset($yatra_sidebar_cb_rows, $yatra_sidebar_cb_input_name, $yatra_sidebar_cb_active);
                            ?>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Accommodation Type -->
                    <?php
                    // Get accommodation types from service
                    $accommodation_types = $filter_data['accommodations'] ?? [];
                    
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
                            <?php
                            $yatra_sidebar_cb_rows = [];
                            foreach ($accommodation_types as $accommodation) {
                                $yatra_sidebar_cb_rows[] = [
                                    'value' => $accommodation->name,
                                    'label' => ucwords(str_replace(['_', '-'], ' ', $accommodation->name)),
                                    'count' => (int) $accommodation->trip_count,
                                ];
                            }
                            $yatra_sidebar_cb_input_name = 'accommodation[]';
                            $yatra_sidebar_cb_active = $active_filters['accommodation'] ?? [];
                            include __DIR__ . '/partials/listing-sidebar-collapsible-checkboxes.php';
                            unset($yatra_sidebar_cb_rows, $yatra_sidebar_cb_input_name, $yatra_sidebar_cb_active);
                            ?>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Included Services -->
                    <?php
                    // Get included services from service
                    $included_services = $filter_data['included_services'] ?? [];
                    
                    if (!empty($included_services)) :
                    ?>
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="services">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                                </svg>
                                <span><?php esc_html_e('Included Services', 'yatra'); ?></span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <?php
                            $yatra_sidebar_cb_rows = [];
                            foreach ($included_services as $service) {
                                $yatra_sidebar_cb_rows[] = [
                                    'value' => $service->service_name,
                                    'label' => $service->service_name,
                                    'count' => (int) $service->trip_count,
                                ];
                            }
                            $yatra_sidebar_cb_input_name = 'services[]';
                            $yatra_sidebar_cb_active = $active_filters['services'] ?? [];
                            include __DIR__ . '/partials/listing-sidebar-collapsible-checkboxes.php';
                            unset($yatra_sidebar_cb_rows, $yatra_sidebar_cb_input_name, $yatra_sidebar_cb_active);
                            ?>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Special Offers -->
                    <?php
                    // Get special offers from service
                    $special_offers = $filter_data['special_offers'] ?? [];
                    
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
                            <?php
                            $yatra_sidebar_cb_rows = [];
                            foreach ($special_offers as $offer) {
                                $yatra_sidebar_cb_rows[] = [
                                    'value' => $offer->value,
                                    'label' => $offer->label,
                                    'count' => (int) $offer->count,
                                ];
                            }
                            $yatra_sidebar_cb_input_name = 'offers[]';
                            $yatra_sidebar_cb_active = $active_filters['offers'] ?? [];
                            include __DIR__ . '/partials/listing-sidebar-collapsible-checkboxes.php';
                            unset($yatra_sidebar_cb_rows, $yatra_sidebar_cb_input_name, $yatra_sidebar_cb_active);
                            ?>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Booking Options -->
                    <?php
                    // Get booking options from service
                    $booking_options = $filter_data['booking_options'] ?? [];
                    
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
                            <?php
                            $yatra_sidebar_cb_rows = [];
                            foreach ($booking_options as $option) {
                                $yatra_sidebar_cb_rows[] = [
                                    'value' => $option->value,
                                    'label' => $option->label,
                                    'count' => (int) $option->count,
                                ];
                            }
                            $yatra_sidebar_cb_input_name = 'booking[]';
                            $yatra_sidebar_cb_active = $active_filters['booking'] ?? [];
                            include __DIR__ . '/partials/listing-sidebar-collapsible-checkboxes.php';
                            unset($yatra_sidebar_cb_rows, $yatra_sidebar_cb_input_name, $yatra_sidebar_cb_active);
                            ?>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Age Suitability -->
                    <?php
                    // Get age restrictions from service
                    $age_options = $filter_data['age_restrictions'] ?? [];
                    
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
                            <?php
                            $yatra_sidebar_cb_rows = [];
                            foreach ($age_options as $option) {
                                $yatra_sidebar_cb_rows[] = [
                                    'value' => $option->value,
                                    'label' => $option->label,
                                    'count' => (int) $option->count,
                                ];
                            }
                            $yatra_sidebar_cb_input_name = 'age[]';
                            $yatra_sidebar_cb_active = $active_filters['age'] ?? [];
                            include __DIR__ . '/partials/listing-sidebar-collapsible-checkboxes.php';
                            unset($yatra_sidebar_cb_rows, $yatra_sidebar_cb_input_name, $yatra_sidebar_cb_active);
                            ?>
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
                            <div class="yatra-filter-actions">
                                <span class="yatra-clear-section" data-section="trip-attributes" title="<?php esc_attr_e('Clear trip attribute filters', 'yatra'); ?>">
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
                                            <?php
                                            $yatra_sidebar_cb_rows = [];
                                            foreach ($field_options as $option) {
                                                $yatra_sidebar_cb_rows[] = [
                                                    'value' => $option['value'],
                                                    'label' => $option['label'],
                                                ];
                                            }
                                            $yatra_sidebar_cb_input_name = $attribute_filter_name . '[]';
                                            $yatra_sidebar_cb_active = $current_values;
                                            include __DIR__ . '/partials/listing-sidebar-collapsible-checkboxes.php';
                                            unset($yatra_sidebar_cb_rows, $yatra_sidebar_cb_input_name, $yatra_sidebar_cb_active);
                                            ?>

                                        <?php elseif ($attribute['field_type'] === 'checkbox' && !empty($field_options)) : ?>
                                            <?php
                                            $yatra_sidebar_cb_rows = [];
                                            foreach ($field_options as $option) {
                                                $yatra_sidebar_cb_rows[] = [
                                                    'value' => $option['value'],
                                                    'label' => $option['label'],
                                                ];
                                            }
                                            $yatra_sidebar_cb_input_name = $attribute_filter_name . '[]';
                                            $yatra_sidebar_cb_active = is_array($current_values) ? $current_values : [];
                                            include __DIR__ . '/partials/listing-sidebar-collapsible-checkboxes.php';
                                            unset($yatra_sidebar_cb_rows, $yatra_sidebar_cb_input_name, $yatra_sidebar_cb_active);
                                            ?>

                                        <?php elseif ($attribute['field_type'] === 'checkbox') : ?>
                                            <div class="yatra-checkbox-group">
                                                <label class="yatra-checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        name="<?php echo esc_attr($attribute_filter_name); ?>"
                                                        value="1"
                                                        <?php echo in_array('1', (array) $current_values, true) ? 'checked' : ''; ?>
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
                        <div class="yatra-trip-grid" id="trip-grid">
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

                    <div class="yatra-listing-pagination yatra-listing-pagination--trip-content">
                        <?php
                        $prev_url = $yatra_pagination['prev_url'] ?? null;
                        $next_url = $yatra_pagination['next_url'] ?? null;
                        $prev_disabled = empty($prev_url);
                        $next_disabled = empty($next_url);
                        ?>
                        <a class="yatra-pagination-btn <?php echo $prev_disabled ? 'disabled' : ''; ?>" href="<?php echo $prev_disabled ? 'javascript:void(0);' : esc_url($prev_url); ?>">
                            <?php echo yatra_svg_icon('chevron-left', 'yatra-btn-icon'); ?>
                            <span><?php esc_html_e('Previous', 'yatra'); ?></span>
                        </a>
                        <?php foreach (($yatra_pagination['items'] ?? []) as $pitem) : ?>
                            <?php if (($pitem['type'] ?? '') === 'ellipsis') : ?>
                                <span class="yatra-pagination-ellipsis">...</span>
                            <?php elseif (($pitem['type'] ?? '') === 'page') : ?>
                                <a class="yatra-pagination-btn <?php echo !empty($pitem['is_current']) ? 'active' : ''; ?>" href="<?php echo esc_url((string) ($pitem['url'] ?? '')); ?>">
                                    <?php echo esc_html((string) ($pitem['page'] ?? '')); ?>
                                </a>
                            <?php endif; ?>
                        <?php endforeach; ?>
                        <a class="yatra-pagination-btn <?php echo $next_disabled ? 'disabled' : ''; ?>" href="<?php echo $next_disabled ? 'javascript:void(0);' : esc_url($next_url); ?>">
                            <span><?php esc_html_e('Next', 'yatra'); ?></span>
                            <?php echo yatra_svg_icon('chevron-right', 'yatra-btn-icon'); ?>
                        </a>
                    </div>
                </main>
            </div>
        </div>
    </div>
</div>

<?php
yatra_get_footer();
?>
