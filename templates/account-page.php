<?php
/**
 * Account Page Template
 * Template for rendering the customer account page
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get current user
$current_user = wp_get_current_user();

// If user is not logged in, redirect to login
if (!$current_user->ID) {
    // Render the login shortcode inline (no redirect, no dedicated /login endpoint required)
    status_header(200);
    nocache_headers();

    // Ensure the login shortcode UI assets are loaded even though this page is not a WP post containing the shortcode.
    wp_enqueue_style(
        'yatra-login-shortcode',
        YATRA_PLUGIN_URL . 'assets/css/shortcodes/login-shortcode.css',
        [],
        YATRA_VERSION
    );
    wp_enqueue_script(
        'yatra-login-shortcode',
        YATRA_PLUGIN_URL . 'assets/js/login-shortcode.js',
        ['jquery'],
        YATRA_VERSION,
        true
    );
    wp_localize_script('yatra-login-shortcode', 'yatra_ajax', [
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('yatra_login_nonce'),
        'debug' => defined('WP_DEBUG') && WP_DEBUG,
        'strings' => [
            'login_error' => __('Login failed. Please try again.', 'yatra'),
            'network_error' => __('Network error. Please check your connection.', 'yatra'),
            'validation_error' => __('Please fill in all required fields.', 'yatra'),
        ],
    ]);
    ?>
    <!DOCTYPE html>
    <html <?php language_attributes(); ?>>
    <head>
        <meta charset="<?php bloginfo('charset'); ?>">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title><?php echo esc_html(get_bloginfo('name')) . ' - ' . esc_html__('Login', 'yatra'); ?></title>
        <?php wp_head(); ?>
    </head>
    <body <?php body_class(); ?>>
        <div class="yatra-login-page-wrapper">
            <?php echo do_shortcode('[yatra_login redirect_url="/' . esc_attr(\Yatra\Services\SettingsService::getAccountBase()) . '"]'); ?>
        </div>
        <?php wp_footer(); ?>
    </body>
    </html>
    <?php
    exit;
}

?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?php echo esc_html(get_bloginfo('name')) . ' - ' . __('My Account', 'yatra'); ?></title>
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
    <?php
    $yatra_account_react_embed = false;
    require YATRA_PLUGIN_PATH . 'templates/partials/account-react-root.php';
    ?>
    <?php wp_footer(); ?>
</body>
</html>

