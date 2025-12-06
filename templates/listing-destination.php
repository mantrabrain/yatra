<?php
/**
 * Destination Listing Template
 *
 * Lists all published destinations from the Yatra destinations table
 * using the DestinationService. This replaces the previous static
 * dummy-data implementation.
 *
 * @package Yatra
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Load DestinationService from plugin namespace
if (!class_exists('Yatra\\Services\\DestinationService')) {
    // If the service is not available for some reason, bail gracefully.
    get_header();
    echo '<p>' . esc_html__('Destination service is not available.', 'yatra') . '</p>';
    get_footer();
    return;
}

$destination_service = new \Yatra\Services\DestinationService();

// Enqueue destination-specific styles so icons and placeholders render correctly.
if (defined('YATRA_PLUGIN_URL')) {
    $css_path = YATRA_PLUGIN_PATH . 'assets/css/destination.css';
    if (file_exists($css_path)) {
        $css_url     = YATRA_PLUGIN_URL . 'assets/css/destination.css';
        $css_version = defined('YATRA_VERSION') ? YATRA_VERSION . '.' . filemtime($css_path) : null;
        wp_enqueue_style('yatra-destination', $css_url, [], $css_version);
    }
}

// Fetch published destinations with stats (including trips_count), ordered by name
$destinations = $destination_service->getPublishedWithStats();

get_header();
?>

<div class="yatra-listing-page yatra-destination-listing">
    <div class="yatra-listing-wrapper">
        <div class="yatra-listing-container">
            
            <!-- Page Header -->
            <div class="yatra-destination-header">
                <div class="yatra-destination-header-content">
                    <h1>All Destinations</h1>
                    <p>Explore breathtaking destinations around the world</p>
                </div>
                <div class="yatra-results-controls">
                    <div class="yatra-sort-control">
                        <label>Sort by:</label>
                        <select>
                            <option>Most Popular</option>
                            <option>Most Trips</option>
                            <option>Name: A-Z</option>
                            <option>Name: Z-A</option>
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

            <!-- Destination Grid -->
            <div class="yatra-destination-grid" id="destination-grid">
                <?php if (!empty($destinations)) : ?>
                    <?php
                    ?>

                    <?php foreach ($destinations as $destination) : ?>
                        <?php
                        // Destination is a stdClass from repository
                        $name        = isset($destination->name) ? $destination->name : '';
                        $description = isset($destination->description) ? $destination->description : '';

                        // Resolve image/icon from the stored icon field when possible.
                        $image_url  = '';
                        $icon_class = '';
                        if (!empty($destination->icon)) {
                            $icon = maybe_unserialize($destination->icon);

                            if (is_array($icon)) {
                                // Newer format: ['type' => 'image'|'icon', 'value' => attachment id, URL, or icon name]
                                $type  = $icon['type']  ?? '';
                                $value = $icon['value'] ?? '';

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
                        $has_avg_rating = isset($destination->avg_rating) && (float) $destination->avg_rating > 0;
                        $avg_rating     = $has_avg_rating ? (float) $destination->avg_rating : 0.0;

                        $has_trips_count = isset($destination->trips_count) && (int) $destination->trips_count > 0;
                        $trips_count     = $has_trips_count ? (int) $destination->trips_count : 0;

                        $starting_price_raw = isset($destination->starting_price)
                            ? (float) $destination->starting_price
                            : 0.0;
                        $has_starting_price = $starting_price_raw > 0;

                        // Use core helper to format price with correct currency symbol & settings.
                        $starting_price  = $has_starting_price
                            ? yatra_format_price($starting_price_raw)
                            : '';

                        // Build permalink
                        $permalink = function_exists('yatra_get_destination_permalink')
                            ? yatra_get_destination_permalink($destination->id ?? $destination)
                            : '';
                        ?>
                        <div class="yatra-destination-card">
                            <div class="yatra-destination-image">
                                <?php if (!empty($image_url)) : ?>
                                    <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($name); ?>">
                                <?php elseif (!empty($icon_class)) : ?>
                                    <div class="yatra-destination-icon-wrapper" aria-hidden="true">
                                        <?php echo yatra_svg_icon($icon_class, 'yatra-destination-icon'); ?>
                                    </div>
                                <?php else : ?>
                                    <?php
                                    // Static placeholder image inside the plugin assets.
                                    $placeholder_src = plugins_url('assets/images/placeholder.png', dirname(__FILE__));
                                    ?>
                                    <img src="<?php echo esc_url($placeholder_src); ?>" alt="<?php echo esc_attr__('Yatra placeholder', 'yatra'); ?>">
                                <?php endif; ?>
                                <div class="yatra-destination-overlay">
                                    <h3><?php echo esc_html($name); ?></h3>
                                </div>
                            </div>
                            <div class="yatra-destination-content">
                                <?php if (!empty($description)) : ?>
                                    <p><?php echo esc_html($description); ?></p>
                                <?php endif; ?>
                                <?php if ($has_avg_rating || $has_trips_count || $has_starting_price) : ?>
                                    <div class="yatra-destination-stats">
                                        <?php if ($has_avg_rating) : ?>
                                            <div class="yatra-destination-stat">
                                                <svg width="16" height="16" fill="#fbbf24" viewBox="0 0 24 24">
                                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                                </svg>
                                                <span><?php echo esc_html(number_format($avg_rating, 1)); ?></span>
                                            </div>
                                        <?php endif; ?>

                                        <?php if ($has_trips_count) : ?>
                                            <div class="yatra-destination-stat">
                                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                                </svg>
                                                <span><?php echo esc_html($trips_count); ?> <?php echo esc_html__('Trips', 'yatra'); ?></span>
                                            </div>
                                        <?php endif; ?>

                                        <?php if ($has_starting_price) : ?>
                                            <div class="yatra-destination-stat">
                                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                </svg>
                                                <span><?php echo esc_html__('From ', 'yatra') . esc_html($starting_price); ?></span>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                <?php endif; ?>
                                <?php if (!empty($permalink)) : ?>
                                    <a class="yatra-destination-btn" href="<?php echo esc_url($permalink); ?>">
                                        <?php echo esc_html__('Explore Destination', 'yatra'); ?>
                                    </a>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php else : ?>
                    <p class="yatra-no-destinations">
                        <?php echo esc_html__('No destinations found. Please add destinations from the Yatra admin panel.', 'yatra'); ?>
                    </p>
                <?php endif; ?>
            </div>

            <!-- Pagination -->
            <div class="yatra-listing-pagination">
                <button class="yatra-pagination-btn" disabled>Previous</button>
                <button class="yatra-pagination-btn active">1</button>
                <button class="yatra-pagination-btn">2</button>
                <button class="yatra-pagination-btn">3</button>
                <button class="yatra-pagination-btn">Next</button>
            </div>
        </div>
    </div>
</div>

<?php
get_footer();
?>
