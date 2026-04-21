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
    $login_url = home_url('/login');
    wp_redirect($login_url);
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

