<?php
/**
 * Single Taxonomy Page Template (Destination, Activity, Category)
 * Shows trips filtered by the selected taxonomy with full filtering capabilities
 * 
 * @package Yatra
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get taxonomy data from global
$taxonomy_data = $GLOBALS['yatra_taxonomy_data'] ?? null;

if (!$taxonomy_data) {
    wp_die(__('No taxonomy data found', 'yatra'));
}

$type = $taxonomy_data->type;
$entity = $taxonomy_data; // Use the taxonomy object itself as entity
$trips = $taxonomy_data->trips ?? []; // This will be populated by the handler

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

// Get active filters from URL parameters (same as main trip listing)
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
];

// Get type labels
$type_labels = [
    'destination' => [
        'singular' => __('Destination', 'yatra'),
        'plural' => __('Destinations', 'yatra'),
        'trips_title' => __('Trips in %s', 'yatra'),
    ],
    'activity' => [
        'singular' => __('Activity', 'yatra'),
        'plural' => __('Activities', 'yatra'),
        'trips_title' => __('%s Trips', 'yatra'),
    ],
    'category' => [
        'singular' => __('Category', 'yatra'),
        'plural' => __('Categories', 'yatra'),
        'trips_title' => __('%s Trips', 'yatra'),
    ],
];

$labels = $type_labels[$type] ?? $type_labels['category'];

// Basic pagination for trips on taxonomy pages (10 trips per page)
$per_page     = 10;
$current_page = isset($_GET['yatra_page']) ? max(1, (int) $_GET['yatra_page']) : 1;
$total_trips  = is_array($trips) ? count($trips) : 0;
$total_pages  = $total_trips > 0 ? (int) ceil($total_trips / $per_page) : 1;
$current_page = min($current_page, $total_pages);

$offset      = ($current_page - 1) * $per_page;
$paged_trips = $total_trips > 0 ? array_slice($trips, $offset, $per_page) : [];

// Get entity image (no external hardcoded external URL)
$entity_image = '';

// Prefer explicit featured_image or image when present
if (!empty($taxonomy_data->featured_image)) {
    $entity_image = wp_get_attachment_url($taxonomy_data->featured_image);
} elseif (!empty($taxonomy_data->image)) {
    $entity_image = $taxonomy_data->image;
}

// If still empty, try resolving from icon configuration (same logic as listing-destination.php)
if (empty($entity_image) && !empty($taxonomy_data->icon)) {
    $icon = maybe_unserialize($taxonomy_data->icon);

    if (is_array($icon)) {
        $type  = $icon['type']  ?? '';
        $value = $icon['value'] ?? '';

        if ($type === 'image' && !empty($value)) {
            if (is_numeric($value)) {
                $maybe_url = wp_get_attachment_image_url((int) $value, 'large');
                if (!empty($maybe_url)) {
                    $entity_image = $maybe_url;
                }
            } elseif (is_string($value) && filter_var($value, FILTER_VALIDATE_URL)) {
                $entity_image = $value;
            }
        } elseif (!empty($icon['url']) && filter_var($icon['url'], FILTER_VALIDATE_URL)) {
            // Legacy format: ['url' => 'https://...']
            $entity_image = $icon['url'];
        } elseif (!empty($icon['id'])) {
            // Legacy format: ['id' => attachment_id]
            $maybe_url = wp_get_attachment_image_url((int) $icon['id'], 'large');
            if (!empty($maybe_url)) {
                $entity_image = $maybe_url;
            }
        }
    } elseif (is_numeric($icon)) {
        $maybe_url = wp_get_attachment_image_url((int) $icon, 'large');
        if (!empty($maybe_url)) {
            $entity_image = $maybe_url;
        }
    } elseif (is_string($icon) && filter_var($icon, FILTER_VALIDATE_URL)) {
        $entity_image = $icon;
    }
}

// Final internal placeholder fallback (no external Unsplash)
if (empty($entity_image)) {
    $placeholder_src = plugins_url('assets/images/placeholder.png', dirname(__FILE__));
    $entity_image = $placeholder_src;
}

yatra_get_header();
?>

<div class="yatra-listing-page yatra-taxonomy-page yatra-<?php echo esc_attr($type); ?>-page">
    
    <!-- Hero Section -->
    <div class="yatra-taxonomy-hero"<?php echo $entity_image ? ' style="background-image: url(' . esc_url($entity_image) . ');"' : ''; ?>>
        <div class="yatra-taxonomy-hero-overlay"></div>
        <div class="yatra-taxonomy-hero-content">
            <h1 class="yatra-taxonomy-title"><?php echo esc_html($taxonomy_data->name); ?></h1>
            <?php if (!empty($taxonomy_data->description)): ?>
            <p class="yatra-taxonomy-description"><?php echo wp_kses_post($taxonomy_data->description); ?></p>
            <?php endif; ?>
            <div class="yatra-taxonomy-stats">
                <span class="yatra-taxonomy-trip-count">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                    </svg>
                    <?php echo sprintf(_n('%d Trip', '%d Trips', count($trips), 'yatra'), count($trips)); ?>
                </span>
            </div>
        </div>
    </div>

    <div class="yatra-listing-wrapper">
        <div class="yatra-listing-container">
            
            <!-- Full Width Content (no sidebar) -->
            <div class="yatra-listing-content-full">
                    <!-- Results Header -->
                    <div class="yatra-results-header">
                        <div class="yatra-results-info">
                            <h2><?php echo sprintf(esc_html($labels['trips_title']), esc_html($taxonomy_data->name)); ?></h2>
                            <p class="yatra-results-count">
                                <?php echo sprintf(
                                    __('Showing <strong>%d</strong> of %d trips', 'yatra'),
                                    count($paged_trips),
                                    $total_trips
                                ); ?>
                            </p>
                        </div>
                        <div class="yatra-results-controls">
                            <div class="yatra-sort-control">
                                <label><?php echo esc_html__('Sort by:', 'yatra'); ?></label>
                                <select id="yatra-sort-select">
                                    <option value="recommended"><?php echo esc_html__('Recommended', 'yatra'); ?></option>
                                    <option value="price-low"><?php echo esc_html__('Price: Low to High', 'yatra'); ?></option>
                                    <option value="price-high"><?php echo esc_html__('Price: High to Low', 'yatra'); ?></option>
                                    <option value="rating"><?php echo esc_html__('Rating: Highest', 'yatra'); ?></option>
                                    <option value="duration-short"><?php echo esc_html__('Duration: Shortest', 'yatra'); ?></option>
                                    <option value="duration-long"><?php echo esc_html__('Duration: Longest', 'yatra'); ?></option>
                                </select>
                            </div>
                            <div class="yatra-view-toggle">
                                <button class="yatra-view-btn active" data-view="grid" title="<?php echo esc_attr__('Grid View', 'yatra'); ?>">
                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                                    </svg>
                                </button>
                                <button class="yatra-view-btn" data-view="list" title="<?php echo esc_attr__('List View', 'yatra'); ?>">
                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

            <!-- Trip Grid -->
            <?php if (!empty($paged_trips)): ?>
            <div class="yatra-trip-grid" id="trip-grid">
                <?php foreach ($paged_trips as $trip): ?>
                    <?php 
                    // Convert stdClass to Trip model instance if needed for consistent data access
                    if (!($trip instanceof \Yatra\Models\Trip)) {
                        $trip = \Yatra\Models\Trip::fromStdClass($trip);
                    }
                    ?>
                    <?php include(dirname(__FILE__) . '/trip-listing-card.php'); ?>
                <?php endforeach; ?>
            </div>
            <?php else: ?>
            <div class="yatra-no-trips-found">
                <div class="yatra-no-trips-icon">
                    <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                    </svg>
                </div>
                <h3><?php echo esc_html__('No trips found', 'yatra'); ?></h3>
                <p><?php echo sprintf(esc_html__('There are no trips available for %s at the moment. Please check back later or explore other options.', 'yatra'), esc_html($taxonomy_data->name)); ?></p>
                <a href="<?php echo esc_url(home_url('/' . \Yatra\Services\SettingsService::getTripBase() . '/')); ?>" class="yatra-btn-primary">
                    <?php echo esc_html__('Browse All Trips', 'yatra'); ?>
                </a>
            </div>
            <?php endif; ?>

            <?php if ($total_pages > 1): ?>
                <div class="yatra-listing-pagination">
                    <?php
                    $prev_page = max(1, $current_page - 1);
                    $next_page = min($total_pages, $current_page + 1);
                    
                    // Manual URL builder to avoid ampersand issues
                    $build_page_url = function($page) {
                        $base_path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
                        $query_string = http_build_query(['yatra_page' => $page], '', '&', PHP_QUERY_RFC3986);
                        return esc_url($base_path . '?' . $query_string);
                    };
                    ?>

                    <?php if ($current_page <= 1): ?>
                        <span class="yatra-pagination-btn disabled" aria-disabled="true">
                            <?php echo esc_html__('Previous', 'yatra'); ?>
                        </span>
                    <?php else: ?>
                        <a class="yatra-pagination-btn" href="<?php echo $build_page_url($prev_page); ?>">
                            <?php echo esc_html__('Previous', 'yatra'); ?>
                        </a>
                    <?php endif; ?>

                    <?php
                    // Smart pagination with ellipsis
                    $range = 2;
                    for ($i = 1; $i <= $total_pages; $i++):
                        if ($i == 1 || $i == $total_pages || ($i >= $current_page - $range && $i <= $current_page + $range)):
                            $active = $i === $current_page ? ' active' : '';
                            ?>
                            <a class="yatra-pagination-btn<?php echo $active; ?>" href="<?php echo $build_page_url($i); ?>">
                                <?php echo (int) $i; ?>
                            </a>
                        <?php elseif ($i == $current_page - $range - 1 || $i == $current_page + $range + 1): ?>
                            <span class="yatra-pagination-ellipsis">...</span>
                        <?php endif;
                    endfor;
                    ?>

                    <?php if ($current_page >= $total_pages): ?>
                        <span class="yatra-pagination-btn disabled" aria-disabled="true">
                            <?php echo esc_html__('Next', 'yatra'); ?>
                        </span>
                    <?php else: ?>
                        <a class="yatra-pagination-btn" href="<?php echo $build_page_url($next_page); ?>">
                            <?php echo esc_html__('Next', 'yatra'); ?>
                        </a>
                    <?php endif; ?>
                </div>
            <?php endif; ?>

            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // View toggle
    const viewBtns = document.querySelectorAll('.yatra-view-btn');
    const tripGrid = document.getElementById('trip-grid');
    
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            viewBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const view = this.dataset.view;
            if (view === 'list') {
                tripGrid.classList.add('yatra-list-view');
            } else {
                tripGrid.classList.remove('yatra-list-view');
            }
        });
    });

    // Sort functionality
    const sortSelect = document.getElementById('yatra-sort-select');
    if (sortSelect && tripGrid) {
        sortSelect.addEventListener('change', function() {
            const cards = Array.from(tripGrid.querySelectorAll('.yatra-trip-card'));
            const sortValue = this.value;
            
            cards.sort((a, b) => {
                switch (sortValue) {
                    case 'price-low':
                        return parseFloat(a.dataset.price || 0) - parseFloat(b.dataset.price || 0);
                    case 'price-high':
                        return parseFloat(b.dataset.price || 0) - parseFloat(a.dataset.price || 0);
                    case 'rating':
                        return parseFloat(b.dataset.rating || 0) - parseFloat(a.dataset.rating || 0);
                    case 'duration-short':
                        return parseFloat(a.dataset.duration || 0) - parseFloat(b.dataset.duration || 0);
                    case 'duration-long':
                        return parseFloat(b.dataset.duration || 0) - parseFloat(a.dataset.duration || 0);
                    default:
                        return 0;
                }
            });
            
            cards.forEach(card => tripGrid.appendChild(card));
        });
    }

    // Make trip image area clickable via JS (preserve markup/design)
    const imageWrappers = document.querySelectorAll('.yatra-trip-card .yatra-trip-image[data-permalink]');
    imageWrappers.forEach(function(wrapper) {
        wrapper.addEventListener('click', function (event) {
            // Do not navigate when clicking the favorite button inside the image area
            var target = event.target;
            if (target instanceof Element && target.closest('.yatra-favorite-btn')) {
                return;
            }

            var url = wrapper.getAttribute('data-permalink');
            if (url) {
                window.location.href = url;
            }
        });
    });
});
</script>

<?php
yatra_get_footer();
?>



