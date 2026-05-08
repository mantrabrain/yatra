<?php
/**
 * Single Activity Template
 * 
 * Displays individual activity page with associated trips
 * Uses global $activity object (similar to WordPress $post)
 * 
 * @package Yatra
 * @global object $activity Activity data object
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Access global $activity object
global $activity;

// Debug: Check what data we have
if (defined('WP_DEBUG') && WP_DEBUG) {
    }

// Bail if no activity data - return proper 404
if (!$activity) {
    global $wp_query;
    $wp_query->set_404();
    status_header(404);
    get_template_part(404);
    exit;
}

// Set up page title
add_filter('wp_title', function($title) {
    global $activity;
    return esc_html($activity->name) . ' - ' . get_bloginfo('name');
}, 10, 1);

yatra_get_header();
?>

<div class="yatra-single-activity" style="max-width: 1200px; margin: 0 auto; padding: 40px 20px;">
    <!-- Activity Header -->
    <div class="activity-header" style="margin-bottom: 40px;">
        <h1 style="font-size: 2.5rem; margin-bottom: 16px; color: #1f2937;">
            <?php echo esc_html($activity->name); ?>
        </h1>
        
        <?php if (!empty($activity->description)): ?>
            <div class="activity-description" style="font-size: 1.125rem; color: #6b7280; line-height: 1.6;">
                <?php echo wp_kses_post($activity->description); ?>
            </div>
        <?php endif; ?>
    </div>

    <!-- Activity Icon/Image -->
    <?php if (!empty($activity->icon)): ?>
        <div class="activity-media" style="margin-bottom: 40px;">
            <?php
            $icon = maybe_unserialize($activity->icon);
            $image_url = '';
            $icon_class = '';

            if (is_array($icon)) {
                $type = $icon['type'] ?? $icon[0] ?? '';
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
                    $icon_class = $value;
                }
            }
            ?>

            <?php if (!empty($image_url)): ?>
                <div class="activity-image" style="width: 100%; max-width: 600px; margin: 0 auto;">
                    <img src="<?php echo esc_url($image_url); ?>" 
                         alt="<?php echo esc_attr($activity->name); ?>"
                         style="width: 100%; height: auto; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                </div>
            <?php elseif (!empty($icon_class)): ?>
                <div class="activity-icon" style="text-align: center; padding: 60px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; margin: 0 auto; max-width: 400px;">
                    <div style="font-size: 4rem; color: #4b5563;">
                        <?php echo yatra_svg_icon($icon_class, 'activity-large-icon'); ?>
                    </div>
                </div>
            <?php endif; ?>
        </div>
    <?php endif; ?>

    <!-- Activity Stats -->
    <?php if (!empty($activity->trips_count) || !empty($activity->avg_rating)): ?>
        <div class="activity-stats" style="display: flex; gap: 24px; margin-bottom: 40px; justify-content: center; flex-wrap: wrap;">
            <?php if (!empty($activity->trips_count)): ?>
                <div class="stat-item" style="text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px; min-width: 120px;">
                    <div style="font-size: 2rem; font-weight: bold; color: #059669; margin-bottom: 4px;">
                        <?php echo esc_html($activity->trips_count); ?>
                    </div>
                    <div style="color: #6b7280; font-size: 0.875rem;">
                        <?php echo esc_html(_n('Trip', 'Trips', (int)$activity->trips_count, 'yatra')); ?>
                    </div>
                </div>
            <?php endif; ?>

            <?php if (!empty($activity->avg_rating)): ?>
                <div class="stat-item" style="text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px; min-width: 120px;">
                    <div style="font-size: 2rem; font-weight: bold; color: #f59e0b; margin-bottom: 4px;">
                        <?php echo esc_html(number_format($activity->avg_rating, 1)); ?>
                    </div>
                    <div style="color: #6b7280; font-size: 0.875rem;">
                        <?php esc_html_e('Rating', 'yatra'); ?>
                    </div>
                </div>
            <?php endif; ?>

            <?php if (!empty($activity->starting_price)): ?>
                <div class="stat-item" style="text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px; min-width: 120px;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #2563eb; margin-bottom: 4px;">
                        <?php echo esc_html($activity->starting_price); ?>
                    </div>
                    <div style="color: #6b7280; font-size: 0.875rem;">
                        <?php esc_html_e('From', 'yatra'); ?>
                    </div>
                </div>
            <?php endif; ?>
        </div>
    <?php endif; ?>

    <!-- Available Trips -->
    <div class="activity-trips" style="margin-top: 60px;">
        <h2 style="font-size: 2rem; margin-bottom: 24px; color: #1f2937; text-align: center;">
            <?php esc_html_e('Available Trips', 'yatra'); ?>
        </h2>
        
        <?php if (!empty($activity->trips) && is_array($activity->trips)): ?>
            <?php
            $yatra_dp_flags_activity = function_exists('yatra_get_dynamic_pricing_display_flags') ? yatra_get_dynamic_pricing_display_flags() : [
                'show_original_price' => true,
                'show_savings_badge' => true,
                'show_urgency_messages' => false,
            ];
            ?>
            <div class="yatra-trip-grid">
                <?php foreach ($activity->trips as $trip): ?>
                    <div class="yatra-trip-card">
                        <div class="yatra-trip-image">
                            <?php if (!empty($trip->featured_image_url)): ?>
                                <img src="<?php echo esc_url($trip->featured_image_url); ?>" alt="<?php echo esc_attr($trip->title ?? $trip->name ?? __('Trip', 'yatra')); ?>">
                            <?php else: ?>
                                <img src="<?php echo esc_url(plugins_url('assets/images/trip-placeholder.svg', YATRA_PLUGIN_FILE)); ?>" alt="<?php echo esc_attr($trip->title ?? $trip->name ?? __('Trip', 'yatra')); ?>">
                            <?php endif; ?>
                            
                            <?php if (!empty($trip->discount_percentage) && $trip->discount_percentage > 0 && !empty($yatra_dp_flags_activity['show_savings_badge'])): ?>
                                <div class="yatra-discount-badge">
                                    <?php
                                    printf(
                                        /* translators: %s: discount percentage */
                                        esc_html__('%s%% OFF', 'yatra'),
                                        esc_html($trip->discount_percentage)
                                    );
                                    ?>
                                </div>
                            <?php endif; ?>
                            
                            <?php if (function_exists('yatra_wishlist_enabled') && yatra_wishlist_enabled() && !empty($trip->id)) : ?>
                            <button type="button" class="yatra-favorite-btn yatra-similar-favorite-btn" data-trip-id="<?php echo esc_attr((string) $trip->id); ?>" title="<?php esc_attr_e('Save to wishlist', 'yatra'); ?>">
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                                </svg>
                            </button>
                            <?php endif; ?>
                        </div>
                        
                        <div class="yatra-trip-content">
                            <div class="yatra-trip-meta">
                                <span class="yatra-trip-location"><?php echo esc_html($trip->location ?? $activity->name); ?></span>
                                <?php if (!empty($trip->duration)): ?>
                                    <span class="yatra-trip-separator">•</span>
                                    <span class="yatra-trip-duration"><?php echo esc_html($trip->duration); ?> <?php esc_html_e('Days', 'yatra'); ?></span>
                                <?php endif; ?>
                                <?php if (!empty($trip->difficulty)): ?>
                                    <span class="yatra-trip-separator">•</span>
                                    <span class="yatra-trip-difficulty"><?php echo esc_html($trip->difficulty); ?></span>
                                <?php endif; ?>
                            </div>
                            
                            <h3 class="yatra-trip-title">
                                <a href="<?php echo esc_url($trip->permalink ?? ''); ?>">
                                    <?php echo esc_html($trip->title ?? $trip->name ?? __('Untitled Trip', 'yatra')); ?>
                                </a>
                            </h3>
                            
                            <?php if (!empty($trip->destinations) && is_array($trip->destinations)): ?>
                                <div class="yatra-trip-highlights">
                                    <?php foreach (array_slice($trip->destinations, 0, 3) as $destination): ?>
                                        <span class="yatra-highlight-badge"><?php echo esc_html($destination->name ?? ''); ?></span>
                                    <?php endforeach; ?>
                                </div>
                            <?php endif; ?>
                            
                            <div class="yatra-trip-rating">
                                <div class="yatra-rating-stars">
                                    <svg width="16" height="16" fill="#fbbf24" viewBox="0 0 24 24">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                    <span class="yatra-rating-value"><?php echo esc_html(number_format($trip->average_rating ?? 0, 1)); ?></span>
                                </div>
                                <span class="yatra-reviews-count">(<?php echo esc_html($trip->review_count ?? 0); ?> <?php esc_html_e('reviews', 'yatra'); ?>)</span>
                            </div>
                            
                            <div class="yatra-trip-footer">
                                <div class="yatra-trip-price">
                                    <?php
                                    $raw_orig_act = (float) ($trip->original_price ?? 0);
                                    $raw_eff_act = (float) ($trip->effective_price_min ?? $trip->original_price ?? 0);
                                    $disp_orig_act = $raw_orig_act;
                                    $disp_eff_act = $raw_eff_act;
                                    if (apply_filters('yatra_dynamic_pricing_enabled', false)) {
                                        if ($disp_eff_act > 0) {
                                            $disp_eff_act = apply_filters('yatra_trip_display_price', $disp_eff_act, (int) ($trip->id ?? 0), [
                                                'departure_date' => null,
                                                'spots_remaining' => null,
                                                'original_price' => $raw_orig_act > 0 ? $raw_orig_act : (float) $disp_eff_act,
                                                'discounted_price' => $raw_eff_act > 0 ? $raw_eff_act : (float) $disp_eff_act,
                                            ]);
                                        }
                                    }
                                    $yatra_act_urgency = function_exists('yatra_trip_card_dynamic_pricing_urgency_lines')
                                        ? yatra_trip_card_dynamic_pricing_urgency_lines((int) ($trip->id ?? 0), [
                                            'base_sale_price' => $raw_eff_act,
                                            'base_original_price' => $raw_orig_act,
                                            'sale_price' => (float) $disp_eff_act,
                                            'original_price' => (float) $disp_orig_act,
                                            'departure_date' => null,
                                            'spots_remaining' => null,
                                            'availability_id' => null,
                                            'surface' => 'activity_card',
                                        ])
                                        : [];
                                    ?>
                                    <?php if (!empty($yatra_dp_flags_activity['show_original_price']) && $disp_orig_act > 0 && $disp_eff_act > 0 && $disp_orig_act > $disp_eff_act): ?>
                                        <div class="yatra-original-price"><?php echo esc_html(yatra_format_price($disp_orig_act)); ?></div>
                                    <?php endif; ?>
                                    <div class="yatra-current-price">
                                        <?php 
                                        if ($disp_eff_act > 0) {
                                            echo esc_html(yatra_format_price($disp_eff_act));
                                        } elseif ($disp_orig_act > 0) {
                                            echo esc_html(yatra_format_price($disp_orig_act));
                                        } else {
                                            echo esc_html__('Price on request', 'yatra');
                                        }
                                        ?>
                                    </div>
                                    <div class="yatra-price-note"><?php esc_html_e('per person', 'yatra'); ?></div>
                                    <?php if (!empty($yatra_act_urgency)) : ?>
                                        <?php foreach ($yatra_act_urgency as $yatra_a_urg) : ?>
                                            <div style="margin-top:6px;font-size:11px;line-height:1.35;color:#92400e;background:#fef3c7;padding:4px 6px;border-radius:4px;">
                                                <?php echo esc_html((string) $yatra_a_urg); ?>
                                            </div>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </div>
                                <a href="<?php echo esc_url($trip->permalink ?? ''); ?>" class="yatra-btn yatra-btn-primary yatra-archive-card-cta yatra-card-view-btn">
                                    <?php echo yatra_svg_icon('file-text', 'yatra-btn-icon'); ?>
                                    <span><?php esc_html_e('View Details', 'yatra'); ?></span>
                                </a>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php else: ?>
            <div style="text-align: center; padding: 40px; background: #f9fafb; border-radius: 12px; margin-bottom: 40px;">
                <p style="color: #6b7280; margin: 0 0 16px 0;">
                    <?php esc_html_e('No trips are currently available with this activity.', 'yatra'); ?>
                </p>
                <a href="<?php echo esc_url(function_exists('yatra_get_trip_listing_url') ? yatra_get_trip_listing_url() : home_url('/' . \Yatra\Services\SettingsService::getTripBase() . '/')); ?>" 
                   style="color: #2563eb; text-decoration: none; font-weight: 500;">
                    <?php esc_html_e('Browse all trips', 'yatra'); ?>
                </a>
            </div>
        <?php endif; ?>
        
        <div style="text-align: center;">
            <a href="<?php echo esc_url(add_query_arg(['activity' => urlencode($activity->slug)], function_exists('yatra_get_trip_listing_url') ? yatra_get_trip_listing_url() : home_url('/' . \Yatra\Services\SettingsService::getTripBase() . '/'))); ?>" 
               class="yatra-btn" 
               style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; transition: background-color 0.2s;">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <?php esc_html_e('View All Trips with', 'yatra'); ?> <?php echo esc_html($activity->name); ?>
            </a>
        </div>
    </div>

    <!-- Back to Activities -->
    <div style="text-align: center; margin-top: 60px; padding-top: 40px; border-top: 1px solid #e5e7eb;">
        <a href="<?php echo esc_url(function_exists('yatra_get_taxonomy_listing_url') ? yatra_get_taxonomy_listing_url('activity') : home_url('/' . \Yatra\Services\SettingsService::getActivityBase() . '/')); ?>" 
           style="color: #6b7280; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            <?php esc_html_e('Back to All Activities', 'yatra'); ?>
        </a>
    </div>
</div>

<?php
yatra_get_footer();
?>
