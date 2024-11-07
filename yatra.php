<?php
/**
 * Plugin Name:       Yatra - Best Travel & Tour Booking Plugin
 * Plugin URI:        https://wpyatra.com/?utm_source=wordpress&utm_medium=wppage&utm_campaign=wporg
 * Description:       Yatra is a free travel & tour booking WordPress plugin to create travel and tour packages for tour operators and travel agencies.
 * Version:           2.2.10
 * Author:            MantraBrain
 * Author URI:        https://mantrabrain.com/
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       yatra
 * Domain Path:       /languages
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}
// Define YATRA_PLUGIN_FILE.
if (!defined('YATRA_FILE')) {
    define('YATRA_FILE', __FILE__);
}

// Define YATRA_VERSION.
if (!defined('YATRA_VERSION')) {
    define('YATRA_VERSION', '2.2.10');
}

// Define YATRA_PLUGIN_URI.
if (!defined('YATRA_PLUGIN_URI')) {
    define('YATRA_PLUGIN_URI', plugins_url('', YATRA_FILE));
}

// Define YATRA_PLUGIN_DIR.
if (!defined('YATRA_PLUGIN_DIR')) {
    define('YATRA_PLUGIN_DIR', plugin_dir_path(YATRA_FILE));
}


// Include the main Yatra class.
if (!class_exists('Yatra')) {
    include_once dirname(__FILE__) . '/includes/class-yatra.php';
}


/**
 * Main instance of Yatra.
 *
 * Returns the main instance of Yatra to prevent the need to use globals.
 *
 * @return Yatra
 * @since  1.0.0
 */
function yatra()
{
    return Yatra::instance();
}

// Global for backwards compatibility.
$GLOBALS['yatra-instance'] = yatra();
