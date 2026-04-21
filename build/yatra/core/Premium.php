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
        'google_calendar' => [
            'title' => 'Google Calendar Integration',
            'description' => 'Sync tour schedules with Google Calendar for seamless booking management',
            'icon' => 'dashicons-calendar-alt',
            'benefits' => [
                'Automatic calendar sync',
                'Real-time availability updates',
                'Google Calendar API integration',
                'Seamless booking workflow',
                'Enhanced scheduling management'
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
        add_filter('yatra_settings_tabs_array', [__CLASS__, 'add_premium_settings_tabs'], 999);
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
        <div class="yatra-saas-page">
            <!-- Hero Section with Premium Design -->
            <div class="yatra-saas-hero">
                <div class="yatra-hero-bg-pattern" data-speed="0.5"></div>
                <div class="yatra-container">
                    <div class="yatra-hero-content" data-aos="fade-up" data-aos-delay="100">
                        <div class="yatra-hero-badge">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                            </svg>
                            <span><?php _e('Premium Feature', 'yatra'); ?></span>
                        </div>
                        
                        <div class="yatra-hero-icon" data-aos="zoom-in" data-aos-delay="200">
                            <div class="yatra-icon-wrapper">
                                <span class="dashicons <?php echo esc_attr($feature_data['icon']); ?>"></span>
                                <div class="yatra-icon-glow"></div>
                            </div>
                        </div>
                        
                        <h1 data-aos="fade-up" data-aos-delay="300"><?php echo esc_html($feature_data['title']); ?></h1>
                        <p data-aos="fade-up" data-aos-delay="400"><?php echo esc_html($feature_data['description']); ?></p>
                        
                        <!-- Premium Stats -->
                        <div class="yatra-hero-stats" data-aos="fade-up" data-aos-delay="500">
                            <div class="yatra-stat">
                                <span class="yatra-stat-number">1000+</span>
                                <span class="yatra-stat-label"><?php _e('Worldwide Customers', 'yatra'); ?></span>
                            </div>
                            <div class="yatra-stat">
                                <span class="yatra-stat-number">7 Days</span>
                                <span class="yatra-stat-label"><?php _e('Money Back', 'yatra'); ?></span>
                            </div>
                            <div class="yatra-stat">
                                <span class="yatra-stat-number">24/7</span>
                                <span class="yatra-stat-label"><?php _e('Support', 'yatra'); ?></span>
                            </div>
                        </div>
                        
                        <div class="yatra-hero-cta" data-aos="fade-up" data-aos-delay="600">
                            <a href="https://wpyatra.com/pricing/" class="yatra-cta-primary" target="_blank">
                                <span><?php _e('Upgrade to Pro', 'yatra'); ?></span>
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                                </svg>
                            </a>
                            <p class="yatra-cta-note">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <?php _e('7-day money-back guarantee', 'yatra'); ?>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Benefits Section -->
            <div class="yatra-saas-benefits">
                <div class="yatra-container">
                    <div class="yatra-section-header" data-aos="fade-up">
                        <h2><?php _e('What you get with this feature:', 'yatra'); ?></h2>
                        <p><?php _e('Unlock powerful capabilities that will transform your tour business', 'yatra'); ?></p>
                    </div>
                    <div class="yatra-benefits-grid">
                        <?php foreach ($feature_data['benefits'] as $index => $benefit): ?>
                            <div class="yatra-benefit-card" data-aos="fade-up" data-aos-delay="<?php echo ($index * 100) + 200; ?>">
                                <div class="yatra-benefit-icon">
                                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                    </svg>
                                </div>
                                <div class="yatra-benefit-content">
                                    <h4><?php echo esc_html($benefit); ?></h4>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>

            <!-- Showcase Section -->
            <div class="yatra-saas-showcase">
                <div class="yatra-container">
                    <div class="yatra-section-header" data-aos="fade-up">
                        <h2><?php _e('Complete Premium Suite', 'yatra'); ?></h2>
                        <p><?php _e('Get access to all premium features with one upgrade', 'yatra'); ?></p>
                    </div>
                    <div class="yatra-showcase-grid">
                        <?php foreach (self::$premium_features as $key => $extension): ?>
                            <div class="yatra-showcase-card <?php echo $key === $feature ? 'featured' : ''; ?>" data-aos="fade-up" data-aos-delay="<?php echo ($key === $feature ? 0 : 100); ?>">
                                <div class="yatra-showcase-header">
                                    <div class="yatra-showcase-icon">
                                        <span class="dashicons <?php echo esc_attr($extension['icon']); ?>"></span>
                                    </div>
                                    <?php if ($key === $feature): ?>
                                        <div class="yatra-featured-badge">
                                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                                            </svg>
                                            <span><?php _e('Current Feature', 'yatra'); ?></span>
                                        </div>
                                    <?php endif; ?>
                                </div>
                                <div class="yatra-showcase-content">
                                    <h3><?php echo esc_html($extension['title']); ?></h3>
                                    <p><?php echo esc_html($extension['description']); ?></p>
                                </div>
                                <div class="yatra-showcase-footer">
                                    <div class="yatra-feature-status">
                                        <?php if ($key === $feature): ?>
                                            <span class="yatra-status-current"><?php _e('This Feature', 'yatra'); ?></span>
                                        <?php else: ?>
                                            <span class="yatra-status-available"><?php _e('Available in Pro', 'yatra'); ?></span>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>

            <!-- Bottom CTA Section -->
            <div class="yatra-saas-cta">
                <div class="yatra-cta-bg-pattern" data-speed="0.3"></div>
                <div class="yatra-container">
                    <div class="yatra-cta-content" data-aos="fade-up">
                        <div class="yatra-cta-badge">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                            </svg>
                            <span><?php _e('Limited Time Offer', 'yatra'); ?></span>
                        </div>
                        <h2><?php _e('Ready to transform your tour business?', 'yatra'); ?></h2>
                        <p><?php _e('Join thousands of successful tour operators who have upgraded to Yatra Pro', 'yatra'); ?></p>
                        
                        <div class="yatra-cta-actions">
                            <a href="https://wpyatra.com/pricing/" class="yatra-cta-primary large" target="_blank">
                                <span><?php _e('View Pricing Plans', 'yatra'); ?></span>
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                                </svg>
                            </a>
                            <a href="https://demo.wpyatra.com/" class="yatra-cta-secondary" target="_blank">
                                <span><?php _e('View Live Demo', 'yatra'); ?></span>
                            </a>
                        </div>
                        
                        <div class="yatra-cta-guarantees">
                            <div class="yatra-guarantee">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span><?php _e('7-day money-back guarantee', 'yatra'); ?></span>
                            </div>
                            <div class="yatra-guarantee">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z"/>
                                </svg>
                                <span><?php _e('24/7 premium support', 'yatra'); ?></span>
                            </div>
                            <div class="yatra-guarantee">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                                </svg>
                                <span><?php _e('Lifetime updates', 'yatra'); ?></span>
                            </div>
                        </div>
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
        <div class="yatra-premium-metabox-compact">
            <div class="yatra-metabox-header">
                <div class="yatra-metabox-icon">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                    </svg>
                </div>
                <h4><?php _e('Premium Features', 'yatra'); ?></h4>
            </div>

            <div class="yatra-metabox-features-list">
                <div class="yatra-feature-item">
                    <span class="dashicons dashicons-admin-tools"></span>
                    <span><?php _e('Services', 'yatra'); ?></span>
                </div>
                <div class="yatra-feature-item">
                    <span class="dashicons dashicons-calendar-alt"></span>
                    <span><?php _e('Availability Conditions', 'yatra'); ?></span>
                </div>
                <div class="yatra-feature-item">
                    <span class="dashicons dashicons-download"></span>
                    <span><?php _e('Downloads', 'yatra'); ?></span>
                </div>
                <div class="yatra-feature-item">
                    <span class="dashicons dashicons-money-alt"></span>
                    <span><?php _e('Partial Payment', 'yatra'); ?></span>
                </div>
                <div class="yatra-feature-item">
                    <span class="dashicons dashicons-star-filled"></span>
                    <span><?php _e('Reviews & Ratings', 'yatra'); ?></span>
                </div>
                <div class="yatra-feature-item">
                    <span class="dashicons dashicons-money"></span>
                    <span><?php _e('Payment Gateways', 'yatra'); ?></span>
                </div>
            </div>

            <div class="yatra-metabox-cta">
                <a href="https://wpyatra.com/pricing/" class="yatra-upgrade-button" target="_blank">
                    <?php _e('Upgrade to Pro', 'yatra'); ?>
                </a>
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

        // Yatra settings page
        if (isset($_GET['page']) && $_GET['page'] === 'yatra-settings') {
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

    /**
     * Add premium settings tabs
     */
    public static function add_premium_settings_tabs($tabs)
    {
        // Add Downloads premium tab
        $tabs['downloads'] = array(
            'label' => __('Downloads', 'yatra'),
            'description' => __('Manage downloadable files and tour resources', 'yatra'),
            'icon' => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
            'premium' => true,
            'redirect_url' => 'https://wpyatra.com/pricing/'
        );

        // Add Google premium tab
        $tabs['google'] = array(
            'label' => __('Google', 'yatra'),
            'description' => __('Configure Google Calendar integration and API settings', 'yatra'),
            'icon' => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16 10,8"/></svg>',
            'premium' => true,
            'redirect_url' => 'https://wpyatra.com/pricing/'
        );

        return $tabs;
    }

    /**
     * Handle premium settings page output
     */
    public static function output_premium_settings_page($tab)
    {
        if ($tab === 'downloads' || $tab === 'google') {
            self::render_premium_settings_page($tab);
        }
    }

    /**
     * Render premium settings page
     */
    private static function render_premium_settings_page($feature)
    {
        $feature_data = self::$premium_features[$feature] ?? null;
        
        if (!$feature_data) {
            return;
        }

        ?>
        <div class="yatra-premium-settings-page">
            <div class="yatra-premium-settings-header">
                <div class="yatra-premium-icon">
                    <span class="dashicons <?php echo esc_attr($feature_data['icon']); ?>"></span>
                </div>
                <div class="yatra-premium-content">
                    <h2><?php echo esc_html($feature_data['title']); ?></h2>
                    <p><?php echo esc_html($feature_data['description']); ?></p>
                </div>
                <div class="yatra-premium-badge">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                    </svg>
                    <span><?php _e('Premium Feature', 'yatra'); ?></span>
                </div>
            </div>

            <div class="yatra-premium-settings-content">
                <div class="yatra-premium-card">
                    <div class="yatra-premium-card-header">
                        <h3><?php _e('Feature Benefits', 'yatra'); ?></h3>
                    </div>
                    <div class="yatra-premium-benefits">
                        <?php foreach ($feature_data['benefits'] as $benefit): ?>
                            <div class="yatra-benefit-item">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                </svg>
                                <span><?php echo esc_html($benefit); ?></span>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>

                <div class="yatra-premium-cta">
                    <div class="yatra-cta-content">
                        <h3><?php _e('Ready to unlock this feature?', 'yatra'); ?></h3>
                        <p><?php _e('Upgrade to Yatra Pro and get access to all premium features', 'yatra'); ?></p>
                        <div class="yatra-cta-buttons">
                            <a href="https://wpyatra.com/pricing/" class="yatra-cta-primary" target="_blank">
                                <?php _e('Upgrade to Pro', 'yatra'); ?>
                            </a>
                            <a href="https://demo.wpyatra.com/" class="yatra-cta-secondary" target="_blank">
                                <?php _e('View Demo', 'yatra'); ?>
                            </a>
                        </div>
                        <div class="yatra-cta-guarantees">
                            <span><?php _e('7-day money-back guarantee', 'yatra'); ?></span>
                            <span><?php _e('24/7 support', 'yatra'); ?></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
}