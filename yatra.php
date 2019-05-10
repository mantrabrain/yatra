<?php
/**
 * Plugin Name:       Yatra
 * Plugin URI:        https://wordpress.org/plugins/yatra/
 * Description:       Yatra is a free travel & tour booking WordPress plugin to create travel and tour packages for tour operators and travel agencies. This is beta version of travel & tour booking plugin for now.
 * Version:           1.0.0
 * Author:            Mantrabrain
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
    define('YATRA_VERSION', '1.0.0');
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
 * @since  1.0.0
 * @return Yatra
 */
function yatra_instance()
{
    return Yatra::instance();
}

// Global for backwards compatibility.
$GLOBALS['yatra-instance'] = yatra_instance();
