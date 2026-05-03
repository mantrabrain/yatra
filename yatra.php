<?php
/**
 * Plugin Name: Yatra - Travel Booking & Management
 * Plugin URI: https://wpyatra.com/
 * Description: Tours and activities on WordPress — trips, bookings, PayPal and Pay Later, guest accounts, emails, reports. Yatra Pro adds premium gateways and modules.
 * Version: 3.0.1
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: MantraBrain
 * Author URI: https://mantrabrain.com/
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: yatra
 * Domain Path: /i18n/languages
 */

declare(strict_types=1);

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/includes/php-compat.php';

// Define plugin constants
define('YATRA_PLUGIN_FILE', __FILE__);
define('YATRA_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('YATRA_PLUGIN_URL', plugin_dir_url(__FILE__));
define('YATRA_PLUGIN_BASENAME', plugin_basename(__FILE__));
define('YATRA_ABSPATH', plugin_dir_path(__FILE__));
define('YATRA_PLUGIN_URI', plugin_dir_url(__FILE__));
define('YATRA_VERSION', '3.0.1');
define('YATRA_MIN_PHP_VERSION', '7.4');
define('YATRA_MIN_WP_VERSION', '6.0');

/** Sample / preview email verification URL segment (not a real token). */
if (!defined('YATRA_EMAIL_VERIFICATION_PREVIEW_TOKEN')) {
    define('YATRA_EMAIL_VERIFICATION_PREVIEW_TOKEN', 'preview-verify-token');
}

// Deactivate incompatible Yatra Pro (&lt; 3.0) and normalize plugin load order before Composer (prevents fatals from old Pro extending removed classes).
require_once YATRA_PLUGIN_PATH . 'includes/incompatible-pro-guard.php';
yatra_run_incompatible_pro_guard();

// Load Composer autoloader
$autoloader = YATRA_PLUGIN_PATH . 'vendor/autoload.php';
if (!file_exists($autoloader)) {
    wp_die(
        'Yatra plugin requires Composer dependencies. From the plugin directory run: composer install --no-dev --optimize-autoloader (or: composer run install:prod).',
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
        throw new \Exception('Bootstrap class not found. Run composer install --no-dev --optimize-autoloader (or composer run install:prod) in the plugin directory.');
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

register_activation_hook(YATRA_PLUGIN_FILE, static function (): void {
    if (!function_exists('yatra_normalize_yatra_plugins_active_order')) {
        require_once YATRA_PLUGIN_PATH . 'includes/incompatible-pro-guard.php';
    }
    yatra_normalize_yatra_plugins_active_order();
    yatra_deactivate_incompatible_old_pro();
});
