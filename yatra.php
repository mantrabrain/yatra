<?php
/**
 * Plugin Name: Yatra - Travel Booking & Management
 * Plugin URI: https://yatra.com
 * Description: Professional travel booking and management system for WordPress
 * Version: 2.0.0
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * Author: Yatra Development Team
 * Author URI: https://yatra.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: yatra
 * Domain Path: /resources/lang
 * Network: false
 * Update URI: https://updates.yatra.com
 */

declare(strict_types=1);

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('YATRA_PLUGIN_FILE', __FILE__);
define('YATRA_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('YATRA_PLUGIN_URL', plugin_dir_url(__FILE__));
define('YATRA_PLUGIN_BASENAME', plugin_basename(__FILE__));
define('YATRA_VERSION', '2.0.0');
define('YATRA_MIN_PHP_VERSION', '8.0');
define('YATRA_MIN_WP_VERSION', '6.0');

// Check minimum requirements
if (!yatra_check_requirements()) {
    return;
}

// Load autoloader
require_once YATRA_PLUGIN_PATH . 'src/autoload.php';

// Bootstrap the plugin
try {
    $yatra = new \Yatra\Bootstrap();
    $yatra->init();
} catch (Throwable $e) {
    wp_die(
        sprintf(
            esc_html__('Yatra plugin failed to initialize: %s', 'yatra'),
            esc_html($e->getMessage())
        )
    );
}

/**
 * Check if the minimum requirements are met
 */
function yatra_check_requirements(): bool {
    global $wp_version;
    
    $errors = [];
    
    // Check PHP version
    if (version_compare(PHP_VERSION, YATRA_MIN_PHP_VERSION, '<')) {
        $errors[] = sprintf(
            __('PHP version %s or higher is required. You are running version %s.', 'yatra'),
            YATRA_MIN_PHP_VERSION,
            PHP_VERSION
        );
    }
    
    // Check WordPress version
    if (version_compare($wp_version, YATRA_MIN_WP_VERSION, '<')) {
        $errors[] = sprintf(
            __('WordPress version %s or higher is required. You are running version %s.', 'yatra'),
            YATRA_MIN_WP_VERSION,
            $wp_version
        );
    }
    
    // Check required PHP extensions
    $required_extensions = ['curl', 'json', 'mbstring'];
    foreach ($required_extensions as $extension) {
        if (!extension_loaded($extension)) {
            $errors[] = sprintf(
                __('The PHP extension %s is required but not installed.', 'yatra'),
                $extension
            );
        }
    }
    
    if (!empty($errors)) {
        add_action('admin_notices', function() use ($errors) {
            echo '<div class="notice notice-error"><p>';
            echo '<strong>' . esc_html__('Yatra Plugin Error:', 'yatra') . '</strong><br>';
            foreach ($errors as $error) {
                echo esc_html($error) . '<br>';
            }
            echo '</p></div>';
        });
        return false;
    }
    
    return true;
}

/**
 * Plugin activation hook
 */
register_activation_hook(__FILE__, function() {
    if (!yatra_check_requirements()) {
        deactivate_plugins(plugin_basename(__FILE__));
        wp_die(__('Yatra plugin could not be activated due to unmet requirements.', 'yatra'));
    }
    
    \Yatra\Core\Installer::activate();
});

/**
 * Plugin deactivation hook
 */
register_deactivation_hook(__FILE__, function() {
    \Yatra\Core\Installer::deactivate();
});

/**
 * Plugin uninstall hook
 */
register_uninstall_hook(__FILE__, [\Yatra\Core\Installer::class, 'uninstall']); 