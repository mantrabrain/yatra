<?php
/**
 * Single Taxonomy Page Template (Destination, Activity, Category)
 * Shows trips filtered by the selected taxonomy
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

$type = $taxonomy_data['type'];
$entity = $taxonomy_data['entity'];
$trips = $taxonomy_data['trips'];

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

// Get entity image
$entity_image = '';
if (!empty($entity->featured_image)) {
    $entity_image = wp_get_attachment_url($entity->featured_image);
} elseif (!empty($entity->image)) {
    $entity_image = $entity->image;
}

// Fallback image
if (empty($entity_image)) {
    $fallback_images = [
        'destination' => 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&h=400&fit=crop',
        'activity' => 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600&h=400&fit=crop',
        'category' => 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&h=400&fit=crop',
    ];
    $entity_image = $fallback_images[$type] ?? $fallback_images['category'];
}

get_header();
?>

<div class="yatra-listing-page yatra-taxonomy-page yatra-<?php echo esc_attr($type); ?>-page">
    
    <!-- Hero Section -->
    <div class="yatra-taxonomy-hero" style="background-image: url('<?php echo esc_url($entity_image); ?>');">
        <div class="yatra-taxonomy-hero-overlay"></div>
        <div class="yatra-taxonomy-hero-content">
            <nav class="yatra-breadcrumb">
                <a href="<?php echo esc_url(home_url('/')); ?>"><?php echo esc_html__('Home', 'yatra'); ?></a>
                <span class="yatra-breadcrumb-sep">›</span>
                <?php 
                $base_url = '';
                switch ($type) {
                    case 'destination':
                        $base_url = yatra_get_destination_permalink((object)['slug' => '']);
                        $base_url = str_replace('//', '/', dirname($base_url));
                        break;
                    case 'activity':
                        $base_url = yatra_get_activity_permalink((object)['slug' => '']);
                        $base_url = str_replace('//', '/', dirname($base_url));
                        break;
                    case 'category':
                        $base_url = yatra_get_category_permalink((object)['slug' => '']);
                        $base_url = str_replace('//', '/', dirname($base_url));
                        break;
                }
                ?>
                <a href="<?php echo esc_url(home_url('/' . \Yatra\Services\SettingsService::getString($type . '_base', $type) . '/')); ?>"><?php echo esc_html($labels['plural']); ?></a>
                <span class="yatra-breadcrumb-sep">›</span>
                <span class="yatra-breadcrumb-current"><?php echo esc_html($entity->name); ?></span>
            </nav>
            <h1 class="yatra-taxonomy-title"><?php echo esc_html($entity->name); ?></h1>
            <?php if (!empty($entity->description)): ?>
            <p class="yatra-taxonomy-description"><?php echo wp_kses_post($entity->description); ?></p>
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
            
            <!-- Results Header -->
            <div class="yatra-results-header">
                <div class="yatra-results-info">
                    <h2><?php echo sprintf(esc_html($labels['trips_title']), esc_html($entity->name)); ?></h2>
                    <p class="yatra-results-count">
                        <?php echo sprintf(
                            __('Showing <strong>%d</strong> trips', 'yatra'),
                            count($trips)
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
            <?php if (!empty($trips)): ?>
            <div class="yatra-trip-grid" id="trip-grid">
                <?php foreach ($trips as $trip): 
                    $original_price = (float) ($trip->original_price ?? $trip->regular_price ?? 0);
                    $sale_price = (float) ($trip->sale_price ?? $trip->discounted_price ?? 0);
                    $has_discount = !empty($sale_price) && $sale_price > 0 && $sale_price < $original_price;
                    $discount_percent = ($has_discount && $original_price > 0) ? round((($original_price - $sale_price) / $original_price) * 100) : 0;
                    $display_price = $has_discount ? $sale_price : $original_price;
                ?>
                <div class="yatra-trip-card" 
                     data-price="<?php echo esc_attr($display_price); ?>"
                     data-rating="<?php echo esc_attr($trip->average_rating); ?>"
                     data-duration="<?php echo esc_attr($trip->duration_days ?? 0); ?>">
                    <div class="yatra-trip-image">
                        <?php if (!empty($trip->featured_image_url)): ?>
                        <img src="<?php echo esc_url($trip->featured_image_url); ?>" alt="<?php echo esc_attr($trip->title); ?>">
                        <?php else: ?>
                        <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop" alt="<?php echo esc_attr($trip->title); ?>">
                        <?php endif; ?>
                        
                        <?php if ($has_discount && $discount_percent > 0): ?>
                        <div class="yatra-discount-badge">
                            <?php echo esc_html($discount_percent); ?>% <?php echo esc_html__('OFF', 'yatra'); ?>
                        </div>
                        <?php endif; ?>
                        
                        <button class="yatra-favorite-btn" title="<?php echo esc_attr__('Add to favorites', 'yatra'); ?>">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="yatra-trip-content">
                        <div class="yatra-trip-meta">
                            <?php if (!empty($trip->location)): ?>
                            <span class="yatra-trip-location"><?php echo esc_html($trip->location); ?></span>
                            <span class="yatra-trip-separator">•</span>
                            <?php endif; ?>
                            <span class="yatra-trip-duration">
                                <?php 
                                if (!empty($trip->duration_days)) {
                                    echo esc_html(yatra_format_duration($trip->duration_days, $trip->duration_nights ?? null));
                                } else {
                                    echo esc_html__('Flexible', 'yatra');
                                }
                                ?>
                            </span>
                            <?php if (!empty($trip->difficulty_level)): ?>
                            <span class="yatra-trip-separator">•</span>
                            <span class="yatra-trip-difficulty"><?php echo esc_html($trip->difficulty_level); ?></span>
                            <?php endif; ?>
                        </div>
                        
                        <h3 class="yatra-trip-title"><?php echo esc_html($trip->title); ?></h3>
                        
                        <?php 
                        // Get highlights from trip features, categories, activities, and included items
                        $highlights = [];
                        
                        // Group size highlights (no link)
                        if (!empty($trip->max_travelers)) {
                            if ($trip->max_travelers <= 2) {
                                $highlights[] = ['text' => __('Private Tour', 'yatra'), 'link' => null];
                            } elseif ($trip->max_travelers <= 8) {
                                $highlights[] = ['text' => __('Small Group', 'yatra'), 'link' => null];
                            }
                        }
                        
                        // Category highlights (with link)
                        if (!empty($trip->trip_categories) && is_array($trip->trip_categories)) {
                            $first_category = $trip->trip_categories[0];
                            if (!empty($first_category->name)) {
                                $cat_link = !empty($first_category->slug) ? yatra_get_category_permalink($first_category) : null;
                                $highlights[] = ['text' => esc_html($first_category->name), 'link' => $cat_link];
                            }
                        }
                        
                        // Activity highlights (with link, if not on activity page)
                        if (!empty($trip->activities) && is_array($trip->activities)) {
                            $first_activity = $trip->activities[0];
                            if (!empty($first_activity->name) && $type !== 'activity') {
                                $act_link = !empty($first_activity->slug) ? yatra_get_activity_permalink($first_activity) : null;
                                $highlights[] = ['text' => esc_html($first_activity->name), 'link' => $act_link];
                            }
                        }
                        
                        // Feature highlights (no link)
                        if (!empty($trip->meals_included) && $trip->meals_included === 'all') {
                            $highlights[] = ['text' => __('All Meals Included', 'yatra'), 'link' => null];
                        }
                        if (!empty($trip->guide_included) && $trip->guide_included) {
                            $highlights[] = ['text' => __('Expert Guide', 'yatra'), 'link' => null];
                        }
                        
                        // Limit to 3 highlights
                        $highlights = array_slice($highlights, 0, 3);
                        ?>
                        <?php if (!empty($highlights)): ?>
                        <div class="yatra-trip-highlights">
                            <?php foreach ($highlights as $highlight): ?>
                                <?php if (!empty($highlight['link'])): ?>
                                <a href="<?php echo esc_url($highlight['link']); ?>" class="yatra-highlight-badge yatra-highlight-link"><?php echo $highlight['text']; ?></a>
                                <?php else: ?>
                                <span class="yatra-highlight-badge"><?php echo $highlight['text']; ?></span>
                                <?php endif; ?>
                            <?php endforeach; ?>
                        </div>
                        <?php endif; ?>
                        
                        <div class="yatra-trip-rating">
                            <div class="yatra-rating-stars">
                                <svg width="16" height="16" fill="#fbbf24" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                <span class="yatra-rating-value"><?php echo ($trip->average_rating > 0) ? number_format($trip->average_rating, 1) : '0.0'; ?></span>
                            </div>
                            <span class="yatra-reviews-count">(<?php echo (int) ($trip->review_count ?? 0); ?> <?php echo esc_html__('reviews', 'yatra'); ?>)</span>
                        </div>
                        
                        <div class="yatra-trip-footer">
                            <div class="yatra-trip-price">
                                <?php if ($has_discount): ?>
                                <div class="yatra-original-price"><?php echo esc_html(yatra_format_price($original_price)); ?></div>
                                <?php endif; ?>
                                <div class="yatra-current-price"><?php echo esc_html(yatra_format_price($display_price)); ?></div>
                                <div class="yatra-price-note"><?php echo esc_html__('per person', 'yatra'); ?></div>
                            </div>
                            <a href="<?php echo esc_url($trip->permalink); ?>" class="yatra-card-view-btn"><?php echo esc_html__('View Details', 'yatra'); ?></a>
                        </div>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
            <?php else: ?>
            <div class="yatra-no-trips-found">
                <div class="yatra-no-trips-icon">
                    <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                    </svg>
                </div>
                <h3><?php echo esc_html__('No trips found', 'yatra'); ?></h3>
                <p><?php echo sprintf(esc_html__('There are no trips available for %s at the moment. Please check back later or explore other options.', 'yatra'), esc_html($entity->name)); ?></p>
                <a href="<?php echo esc_url(home_url('/' . \Yatra\Services\SettingsService::getTripBase() . '/')); ?>" class="yatra-btn-primary">
                    <?php echo esc_html__('Browse All Trips', 'yatra'); ?>
                </a>
            </div>
            <?php endif; ?>

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
});
</script>

<?php
get_footer();
?>



