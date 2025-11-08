<?php
/**
 * Plugin Name: Yatra - Travel Booking & Management
 * Plugin URI: https://yatra.com
 * Description: Professional travel booking and management system for WordPress with modern React admin interface
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

/**
 * Check if the minimum requirements are met
 */
function yatra_check_requirements(): bool {
    global $wp_version;
    
    $errors = [];
    
    // Check PHP version
    if (version_compare(PHP_VERSION, YATRA_MIN_PHP_VERSION, '<')) {
        $errors[] = sprintf(
            'PHP version %s or higher is required. You are running version %s.',
            YATRA_MIN_PHP_VERSION,
            PHP_VERSION
        );
    }
    
    // Check WordPress version
    if (version_compare($wp_version, YATRA_MIN_WP_VERSION, '<')) {
        $errors[] = sprintf(
            'WordPress version %s or higher is required. You are running version %s.',
            YATRA_MIN_WP_VERSION,
            $wp_version
        );
    }
    
    // Check required PHP extensions
    $required_extensions = ['curl', 'json', 'mbstring'];
    foreach ($required_extensions as $extension) {
        if (!extension_loaded($extension)) {
            $errors[] = sprintf(
                'The PHP extension %s is required but not installed.',
                $extension
            );
        }
    }
    
    if (!empty($errors)) {
        add_action('admin_notices', function() use ($errors) {
            echo '<div class="notice notice-error"><p>';
            echo '<strong>Yatra Plugin Error:</strong><br>';
            foreach ($errors as $error) {
                echo esc_html($error) . '<br>';
            }
            echo '</p></div>';
        });
        return false;
    }
    
    return true;
}

// Check minimum requirements
    if (!yatra_check_requirements()) {
    return;
}

// Load Composer autoloader
$autoloader = YATRA_PLUGIN_PATH . 'vendor/autoload.php';
if (!file_exists($autoloader)) {
    wp_die(
        'Yatra plugin requires Composer dependencies. Please run "composer install" in the plugin directory.',
        'Yatra Plugin Error',
        ['back_link' => true]
    );
    }
require_once $autoloader;

// Bootstrap the plugin
try {
    if (!class_exists('Yatra\Bootstrap')) {
        throw new \Exception('Bootstrap class not found. Please run "composer install" to generate autoloader.');
    }
    
    $yatra = new \Yatra\Bootstrap();
    $yatra->init();
} catch (Throwable $e) {
    // Use plain strings instead of translation functions to avoid early loading
    wp_die(
        sprintf(
            'Yatra plugin failed to initialize: %s',
            esc_html($e->getMessage())
        ),
        'Yatra Plugin Error',
        ['back_link' => true]
    );
}

