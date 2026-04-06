<?php
/**
 * Plugin Name: Yatra - Travel Booking & Management
 * Plugin URI: https://wpyatra.com/
 * Description: Professional travel booking and management system for WordPress with modern React admin interface
 * Version: 3.0.0
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * Author: MantraBrain
 * Author URI: https://wpyatra.com/
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: yatra
 * Domain Path: /i18n/languages
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
define('YATRA_ABSPATH', plugin_dir_path(__FILE__));
define('YATRA_PLUGIN_URI', plugin_dir_url(__FILE__));
define('YATRA_VERSION', '3.0.0');
define('YATRA_MIN_PHP_VERSION', '8.0');
define('YATRA_MIN_WP_VERSION', '6.0');

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

// Check minimum requirements
if (!\Yatra\Core\Requirements::check()) {
    return;
}

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
