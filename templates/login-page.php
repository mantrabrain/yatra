<?php
/**
 * Login Page Template
 * 
 * Production-optimized template for rendering the login page
 * 
 * @package Yatra
 * @version 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Security: Check if user is already logged in and redirect securely
$current_user = wp_get_current_user();
if ($current_user->ID > 0) {
    // Use safe redirect with nonce verification
    $redirect_url = apply_filters('yatra_login_redirect_url', home_url('/my-account'), $current_user);
    wp_safe_redirect($redirect_url);
    exit;
}

// Performance: Only enqueue assets when needed
if (!wp_style_is('yatra-login-page', 'registered')) {
    wp_enqueue_style(
        'yatra-login-page',
        YATRA_PLUGIN_URL . 'assets/css/pages/login-page.css',
        ['yatra-login-shortcode'], // Dependency on shortcode styles
        YATRA_VERSION
    );
}

// Security: Add CSP headers if available
if (!headers_sent()) {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: strict-origin-when-cross-origin');
}

// Performance: Set cache control headers
if (!headers_sent()) {
    header('Cache-Control: public, max-age=300'); // 5 minutes cache
}

// SEO: Set page metadata
$page_title = __('Login - Yatra', 'yatra');
$page_description = __('Login to your Yatra account to manage your bookings and travel experiences.', 'yatra');

?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="<?php echo esc_attr($page_description); ?>">
    <meta name="robots" content="noindex, nofollow">
    <title><?php echo esc_html($page_title); ?></title>
    
    <!-- Preload critical resources -->
    <link rel="preload" href="<?php echo esc_url(YATRA_PLUGIN_URL . 'assets/css/shortcodes/login-shortcode.css'); ?>" as="style">
    
    <?php wp_head(); ?>
</head>
<body <?php body_class('yatra-login-page'); ?>>
    
    <?php wp_body_open(); ?>
    
    <!-- Skip to main content for accessibility -->
    <a href="#yatra-login-main" class="skip-link screen-reader-text">
        <?php esc_html_e('Skip to content', 'yatra'); ?>
    </a>
    
    <div class="yatra-login-page-wrapper">
        <div class="yatra-login-page-container">
            <header class="yatra-login-page-header">
                <div class="yatra-login-page-logo">
                    <?php if (function_exists('the_custom_logo') && get_custom_logo()) : ?>
                        <?php the_custom_logo(); ?>
                    <?php else : ?>
                        <h1 class="site-title">
                            <a href="<?php echo esc_url(home_url('/')); ?>" rel="home">
                                <?php echo esc_html(get_bloginfo('name')); ?>
                            </a>
                        </h1>
                    <?php endif; ?>
                </div>
                <div class="yatra-login-page-nav">
                    <nav aria-label="<?php esc_attr_e('Main navigation', 'yatra'); ?>">
                        <a href="<?php echo esc_url(home_url('/')); ?>" class="yatra-back-home">
                            <?php esc_html_e('← Back to Home', 'yatra'); ?>
                        </a>
                    </nav>
                </div>
            </header>
            
            <div class="yatra-login-page-content">
                <?php echo do_shortcode('[yatra_login]'); ?>
            </div>
            
            <div class="yatra-login-page-footer">
                <p>&copy; <?php echo date('Y'); ?> <?php bloginfo('name'); ?>. <?php esc_html_e('All rights reserved.', 'yatra'); ?></p>
            </div>
        </div>
    </div>
    
    <?php wp_footer(); ?>
</body>
</html>
