<?php
/**
 * Trip Search Shortcode Template
 * 
 * Copied exactly from /trip page search UI for consistency
 * 
 * @package Yatra
 * @var array $atts Shortcode attributes
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get filter options from database
global $wpdb;
$tripClassificationsTable = \Yatra\Database\Tables\TripClassificationsTable::getTableName();
$classificationsTable = \Yatra\Database\Tables\ClassificationsTable::getTableName();

// Get destinations - try multiple status values
$destinations = $wpdb->get_results("
    SELECT c.* FROM {$classificationsTable} c
    INNER JOIN {$tripClassificationsTable} tc ON c.id = tc.classification_id
    WHERE c.type = 'destination' AND c.status IN ('publish', 'active', 'draft')
    ORDER BY c.name ASC
");

// If no destinations found, try without status filter
if (empty($destinations)) {
    $destinations = $wpdb->get_results("
        SELECT c.* FROM {$classificationsTable} c
        INNER JOIN {$tripClassificationsTable} tc ON c.id = tc.classification_id
        WHERE c.type = 'destination'
        ORDER BY c.name ASC
    ");
}

// Get activities - try multiple status values
$activities = $wpdb->get_results("
    SELECT c.* FROM {$classificationsTable} c
    INNER JOIN {$tripClassificationsTable} tc ON c.id = tc.classification_id
    WHERE c.type = 'activity' AND c.status IN ('publish', 'active', 'draft')
    ORDER BY c.name ASC
");

// If no activities found, try without status filter
if (empty($activities)) {
    $activities = $wpdb->get_results("
        SELECT c.* FROM {$classificationsTable} c
        INNER JOIN {$tripClassificationsTable} tc ON c.id = tc.classification_id
        WHERE c.type = 'activity'
        ORDER BY c.name ASC
    ");
}


// Get active filters from URL parameters
$active_filters = [
    'destination' => sanitize_text_field($_GET['destination'] ?? ''),
    'activity' => sanitize_text_field($_GET['activity'] ?? ''),
    'duration' => sanitize_text_field($_GET['duration'] ?? ''),
    'budget' => sanitize_text_field($_GET['budget'] ?? ''),
];
?>

<div class="yatra-trip-search-shortcode">
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
                        <?php if (!empty($destinations)) : ?>
                            <?php foreach ($destinations as $dest) : ?>
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
                        <?php if (!empty($activities)) : ?>
                            <?php foreach ($activities as $act) : ?>
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
                            <div class="yatra-duration-header">
                                <div class="yatra-duration-title"><?php esc_html_e('Select Trip Duration', 'yatra'); ?></div>
                                <div class="yatra-duration-subtitle"><?php esc_html_e('Choose your preferred trip length', 'yatra'); ?></div>
                            </div>
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
</div>
