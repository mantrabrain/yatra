<?php
/**
 * PHPStan Bootstrap File for Yatra WordPress Plugin
 * 
 * This file sets up the WordPress environment that PHPStan needs
 * to properly analyze the Yatra plugin codebase as a complete project.
 */

// Define WordPress core constants
if (!defined('ABSPATH')) {
    define('ABSPATH', dirname(__FILE__) . '/');
}

if (!defined('WP_CONTENT_DIR')) {
    define('WP_CONTENT_DIR', ABSPATH . 'wp-content');
}

if (!defined('WP_PLUGIN_DIR')) {
    define('WP_PLUGIN_DIR', WP_CONTENT_DIR . '/plugins');
}

// Define WordPress database constants
if (!defined('DB_NAME')) {
    define('DB_NAME', 'yatra_test');
}
if (!defined('DB_USER')) {
    define('DB_USER', 'test');
}
if (!defined('DB_PASSWORD')) {
    define('DB_PASSWORD', 'test');
}
if (!defined('DB_HOST')) {
    define('DB_HOST', 'localhost');
}
if (!defined('DB_CHARSET')) {
    define('DB_CHARSET', 'utf8mb4');
}
if (!defined('DB_COLLATE')) {
    define('DB_COLLATE', 'utf8mb4_unicode_ci');
}

// Define Yatra plugin constants
if (!defined('YATRA_PLUGIN_FILE')) {
    define('YATRA_PLUGIN_FILE', __DIR__ . '/yatra.php');
}
if (!defined('YATRA_PLUGIN_PATH')) {
    define('YATRA_PLUGIN_PATH', __DIR__ . '/');
}
if (!defined('YATRA_PLUGIN_URL')) {
    define('YATRA_PLUGIN_URL', 'http://localhost/wp-content/plugins/yatra/');
}
if (!defined('YATRA_PLUGIN_BASENAME')) {
    define('YATRA_PLUGIN_BASENAME', 'yatra/yatra.php');
}
if (!defined('YATRA_ABSPATH')) {
    define('YATRA_ABSPATH', __DIR__ . '/');
}
if (!defined('YATRA_PLUGIN_URI')) {
    define('YATRA_PLUGIN_URI', 'http://localhost/wp-content/plugins/yatra/');
}
if (!defined('YATRA_VERSION')) {
    define('YATRA_VERSION', '3.0.0');
}
if (!defined('YATRA_MIN_PHP_VERSION')) {
    define('YATRA_MIN_PHP_VERSION', '7.4');
}
if (!defined('YATRA_MIN_WP_VERSION')) {
    define('YATRA_MIN_WP_VERSION', '6.0');
}

// Setup global $wpdb object for database operations
global $wpdb;
if (!isset($wpdb)) {
    $wpdb = new stdClass();
    $wpdb->prefix = 'wp_';
    $wpdb->posts = 'wp_posts';
    $wpdb->postmeta = 'wp_postmeta';
    $wpdb->users = 'wp_users';
    $wpdb->usermeta = 'wp_usermeta';
    $wpdb->terms = 'wp_terms';
    $wpdb->term_taxonomy = 'wp_term_taxonomy';
    $wpdb->term_relationships = 'wp_term_relationships';
    $wpdb->options = 'wp_options';
}

// Load Composer autoloader first
$autoloader = __DIR__ . '/vendor/autoload.php';
if (file_exists($autoloader)) {
    require_once $autoloader;
}

// WordPress functions that PHPStan needs (basic implementations)
if (!function_exists('plugin_dir_path')) {
    function plugin_dir_path($file) {
        return dirname($file) . '/';
    }
}

if (!function_exists('plugin_dir_url')) {
    function plugin_dir_url($file) {
        return 'http://localhost/wp-content/plugins/' . basename(dirname($file)) . '/';
    }
}

if (!function_exists('plugin_basename')) {
    function plugin_basename($file) {
        return basename(dirname($file)) . '/' . basename($file);
    }
}

if (!function_exists('get_option')) {
    function get_option($option, $default = false) {
        return $default;
    }
}

if (!function_exists('current_user_can')) {
    function current_user_can($capability, ...$args) {
        return true;
    }
}

if (!function_exists('__')) {
    function __($text, $domain = 'default') {
        return $text;
    }
}

if (!function_exists('_n')) {
    function _n($single, $plural, $number, $domain = 'default') {
        return $number == 1 ? $single : $plural;
    }
}

if (!function_exists('esc_html')) {
    function esc_html($text) {
        return htmlspecialchars((string) $text, ENT_QUOTES, 'UTF-8');
    }
}

if (!function_exists('esc_attr')) {
    function esc_attr($text) {
        return htmlspecialchars((string) $text, ENT_QUOTES, 'UTF-8');
    }
}

if (!function_exists('sanitize_text_field')) {
    function sanitize_text_field($str) {
        return trim(strip_tags($str));
    }
}

if (!function_exists('absint')) {
    function absint($maybeint) {
        return abs((int) $maybeint);
    }
}

if (!function_exists('wp_die')) {
    function wp_die($message, $title = '', $args = []) {
        throw new Exception($message);
    }
}

if (!function_exists('has_shortcode')) {
    function has_shortcode($content, $tag) {
        return false;
    }
}

if (!function_exists('is_multisite')) {
    function is_multisite() {
        return false;
    }
}

if (!function_exists('get_template_part')) {
    function get_template_part($slug, $name = null) {
        return '';
    }
}

if (!function_exists('yatra_get_currency_symbol')) {
    function yatra_get_currency_symbol($currency = '') {
        return '$';
    }
}

if (!function_exists('esc_like')) {
    function esc_like($text) {
        return addslashes($text);
    }
}

if (!function_exists('is_multisite')) {
    function is_multisite() {
        return false;
    }
}

if (!function_exists('get_template_part')) {
    function get_template_part($slug, $name = null) {
        return '';
    }
}

if (!function_exists('has_shortcode')) {
    function has_shortcode($content, $tag) {
        return false;
    }
}
