<?php

namespace Yatra\Core;

defined('ABSPATH') || exit;

/**
 * Yatra Premium Features Management
 *
 * Handles premium feature display, upgrades, and restrictions
 *
 * @class Premium
 * @package Yatra\Core
 * @since 2.2.14
 */
class Premium
{
    /**
     * Premium upgrade URL
     */
    const UPGRADE_URL = 'https://wpyatra.com/pricing/';

    /**
     * Premium features list
     */
    private static $premium_features = [
        'services' => [
            'title' => 'Yatra Services',
            'description' => 'Add extra services which can be free or paid into your tour package',
            'icon' => 'dashicons-admin-tools',
            'benefits' => [
                'Add unlimited extra services to tours',
                'Configure free or paid services',
                'Service selection during booking',
                'Flexible pricing options',
                'Enhanced customer experience'
            ]
        ],
        'availability_conditions' => [
            'title' => 'Availability Conditions',
            'description' => 'Enable/disable tour packages on specific date conditions with advanced availability management',
            'icon' => 'dashicons-calendar-alt',
            'benefits' => [
                'Date-specific availability rules',
                'Advanced booking conditions',
                'Flexible tour scheduling',
                'Seasonal availability control',
                'Automated availability management'
            ]
        ],
        'downloads' => [
            'title' => 'Yatra Downloads',
            'description' => 'Add downloadable files like PDF, DOC, images, ZIP into your tour packages',
            'icon' => 'dashicons-download',
            'benefits' => [
                'Multiple file format support',
                'Easy file management',
                'Customer download access',
                'Tour documentation sharing',
                'Enhanced tour information'
            ]
        ],
        'partial_payment' => [
            'title' => 'Yatra Partial Payment',
            'description' => 'Enable deposit payment feature for tour bookings with flexible payment options',
            'icon' => 'dashicons-money-alt',
            'benefits' => [
                'Deposit payment system',
                'Flexible payment schedules',
                'Improved booking conversion',
                'Customer payment flexibility',
                'Better cash flow management'
            ]
        ],
        'reviews_rating' => [
            'title' => 'Review and Rating',
            'description' => 'Enable review and rating feature on tour packages to build trust and credibility',
            'icon' => 'dashicons-star-filled',
            'benefits' => [
                'Customer review system',
                'Star rating display',
                'Trust building features',
                'Social proof elements',
                'Enhanced tour credibility'
            ]
        ],
        'payment_gateways' => [
            'title' => 'Premium Payment Gateways',
            'description' => 'Multiple premium payment options including Stripe, Authorize.Net, Square, and Razorpay',
            'icon' => 'dashicons-money',
            'benefits' => [
                'Stripe payment integration',
                'Authorize.Net support',
                'Square payment gateway',
                'Razorpay integration',
                'Secure payment processing'
            ]
        ]
    ];

    /**
     * Initialize premium features
     */
    public static function init()
    {
        add_action('admin_menu', [__CLASS__, 'add_premium_menus'], 100);
        add_action('add_meta_boxes', [__CLASS__, 'add_premium_metaboxes']);
        add_action('admin_enqueue_scripts', [__CLASS__, 'enqueue_premium_assets']);
        add_action('wp_ajax_yatra_premium_redirect', [__CLASS__, 'handle_premium_redirect']);
    }

    /**
     * Add premium submenus under Tours
     */
    public static function add_premium_menus()
    {
        // Services submenu
        add_submenu_page(
            'edit.php?post_type=tour',
            __('Services', 'yatra'),
            __('Services', 'yatra'),
            'manage_options',
            'yatra-services',
            [__CLASS__, 'render_services_page']
        );

        // Availability Conditions submenu
        add_submenu_page(
            'edit.php?post_type=tour',
            __('Availability Conditions', 'yatra'),
            __('Availability Conditions', 'yatra'),
            'manage_options',
            'yatra-availability-conditions',
            [__CLASS__, 'render_availability_conditions_page']
        );
    }

    /**
     * Render Services premium page
     */
    public static function render_services_page()
    {
        self::render_premium_page('services');
    }

    /**
     * Render Availability Conditions premium page
     */
    public static function render_availability_conditions_page()
    {
        self::render_premium_page('availability_conditions');
    }

    /**
     * Render premium upgrade page
     */
    private static function render_premium_page($feature)
    {
        $feature_data = self::$premium_features[$feature] ?? null;
        
        if (!$feature_data) {
            return;
        }

        ?>
        <div class="yatra-clean-page">
            <!-- Hero Section -->
            <div class="yatra-clean-hero">
                <div class="yatra-container">
                    <div class="yatra-hero-content">
                        <div class="yatra-hero-icon">
                            <span class="dashicons <?php echo esc_attr($feature_data['icon']); ?>"></span>
                        </div>
                        
                        <h1><?php echo esc_html($feature_data['title']); ?></h1>
                        <p><?php echo esc_html($feature_data['description']); ?></p>
                        
                        <div class="yatra-hero-cta">
                            <a href="https://wpyatra.com/pricing/" class="yatra-clean-button" target="_blank">
                                <?php _e('Upgrade to Pro', 'yatra'); ?>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Benefits -->
            <div class="yatra-clean-benefits">
                <div class="yatra-container">
                    <h2><?php _e('What you get:', 'yatra'); ?></h2>
                    <div class="yatra-benefits-list">
                        <?php foreach ($feature_data['benefits'] as $benefit): ?>
                            <div class="yatra-benefit-item">
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                </svg>
                                <span><?php echo esc_html($benefit); ?></span>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>

            <!-- All Features -->
            <div class="yatra-clean-features">
                <div class="yatra-container">
                    <h2><?php _e('All Premium Features', 'yatra'); ?></h2>
                    <div class="yatra-features-grid">
                        <?php foreach (self::$premium_features as $key => $extension): ?>
                            <div class="yatra-feature-card <?php echo $key === $feature ? 'current' : ''; ?>">
                                <div class="yatra-feature-icon">
                                    <span class="dashicons <?php echo esc_attr($extension['icon']); ?>"></span>
                                </div>
                                <div class="yatra-feature-content">
                                    <h3><?php echo esc_html($extension['title']); ?></h3>
                                    <p><?php echo esc_html($extension['description']); ?></p>
                                </div>
                                <?php if ($key === $feature): ?>
                                    <span class="yatra-current-badge"><?php _e('This Feature', 'yatra'); ?></span>
                                <?php endif; ?>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>

            <!-- Bottom CTA -->
            <div class="yatra-clean-cta">
                <div class="yatra-container">
                    <div class="yatra-cta-content">
                        <h2><?php _e('Ready to upgrade?', 'yatra'); ?></h2>
                        <p><?php _e('Get access to all premium features', 'yatra'); ?></p>
                        <a href="https://wpyatra.com/pricing/" class="yatra-clean-button large" target="_blank">
                            <?php _e('View Pricing', 'yatra'); ?>
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * Add premium metaboxes to tour post type
     */
    public static function add_premium_metaboxes()
    {
        add_meta_box(
            'yatra_premium_features',
            __('Premium Features', 'yatra'),
            [__CLASS__, 'render_premium_metabox'],
            'tour',
            'side',
            'high'
        );
    }

    /**
     * Render premium metabox
     */
    public static function render_premium_metabox($post)
    {
        ?>
        <div class="yatra-clean-metabox">
            <div class="yatra-metabox-header">
                <div class="yatra-metabox-icon">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                </div>
                <div class="yatra-metabox-title">
                    <h4><?php _e('Premium Features', 'yatra'); ?></h4>
                    <p><?php _e('Unlock advanced tour management capabilities', 'yatra'); ?></p>
                </div>
            </div>

            <div class="yatra-metabox-features">
                <div class="yatra-feature-item">
                    <span class="dashicons dashicons-admin-tools"></span>
                    <span><?php _e('Extra Services', 'yatra'); ?></span>
                </div>
                <div class="yatra-feature-item">
                    <span class="dashicons dashicons-calendar-alt"></span>
                    <span><?php _e('Availability Conditions', 'yatra'); ?></span>
                </div>
                <div class="yatra-feature-item">
                    <span class="dashicons dashicons-download"></span>
                    <span><?php _e('Downloadable Files', 'yatra'); ?></span>
                </div>
                <div class="yatra-feature-item">
                    <span class="dashicons dashicons-money-alt"></span>
                    <span><?php _e('Partial Payments', 'yatra'); ?></span>
                </div>
                <div class="yatra-feature-item">
                    <span class="dashicons dashicons-star-filled"></span>
                    <span><?php _e('Reviews & Ratings', 'yatra'); ?></span>
                </div>
                <div class="yatra-feature-item">
                    <span class="dashicons dashicons-plus-alt2"></span>
                    <span><?php _e('And much more...', 'yatra'); ?></span>
                </div>
            </div>

            <div class="yatra-metabox-cta">
                <a href="https://wpyatra.com/pricing/" class="yatra-metabox-button" target="_blank">
                    <?php _e('Upgrade to Pro', 'yatra'); ?>
                </a>
                <p class="yatra-metabox-note"><?php _e('30-day money-back guarantee', 'yatra'); ?></p>
            </div>
        </div>
        <?php
    }

    /**
     * Enqueue premium assets
     */
    public static function enqueue_premium_assets($hook)
    {
        // Only load on relevant admin pages
        if (!self::should_load_premium_assets($hook)) {
            return;
        }

        wp_enqueue_style(
            'yatra-premium-admin',
            YATRA_PLUGIN_URI . '/assets/admin/css/premium.css',
            [],
            YATRA_VERSION
        );

        wp_enqueue_script(
            'yatra-premium-admin',
            YATRA_PLUGIN_URI . '/assets/admin/js/premium.js',
            ['jquery'],
            YATRA_VERSION,
            true
        );

        wp_localize_script('yatra-premium-admin', 'yatraPremium', [
            'upgradeUrl' => self::UPGRADE_URL,
            'nonce' => wp_create_nonce('yatra_premium_nonce'),
            'strings' => [
                'upgrading' => __('Redirecting to upgrade...', 'yatra'),
                'error' => __('Something went wrong. Please try again.', 'yatra')
            ]
        ]);
    }

    /**
     * Check if premium assets should be loaded
     */
    private static function should_load_premium_assets($hook)
    {
        global $post_type;

        // Tour edit screens
        if ($post_type === 'tour' && in_array($hook, ['post.php', 'post-new.php'])) {
            return true;
        }

        // Premium feature pages
        if (isset($_GET['page']) && in_array($_GET['page'], ['yatra-services', 'yatra-availability-conditions'])) {
            return true;
        }

        return false;
    }

    /**
     * Handle premium redirect AJAX
     */
    public static function handle_premium_redirect()
    {
        check_ajax_referer('yatra_premium_nonce', 'nonce');

        wp_send_json_success([
            'redirect_url' => self::UPGRADE_URL
        ]);
    }

    /**
     * Get premium features
     */
    public static function get_premium_features()
    {
        return self::$premium_features;
    }

    /**
     * Check if feature is premium
     */
    public static function is_premium_feature($feature)
    {
        return array_key_exists($feature, self::$premium_features);
    }

    /**
     * Get upgrade URL
     */
    public static function get_upgrade_url()
    {
        return self::UPGRADE_URL;
    }
}