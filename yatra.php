<?php
/**
 * Plugin Name: Yatra - Travel Booking & Management
 * Plugin URI: https://yatra.com
 * Description: Professional travel booking and management system for WordPress with modern React admin interface
 * Version: 3.0.0
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * Author: Yatra Development Team
 * Author URI: https://yatra.com
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

// Load helper functions
require_once YATRA_PLUGIN_PATH . 'includes/helpers.php';

// Bootstrap the plugin
try {
    if (!class_exists('Yatra\Bootstrap')) {
        throw new \Exception('Bootstrap class not found. Please run "composer install" to generate autoloader.');
    }
    
    $yatra = new \Yatra\Bootstrap();
    $yatra->init();
    
    // Enable dynamic pricing module
    add_filter('yatra_dynamic_pricing_enabled', '__return_true');
    
    // Basic dynamic pricing filters (simplified version)
    add_filter('yatra_availability_price', function($price, $trip_id, $context) {
        // Debug logging
        error_log('[Yatra Dynamic Pricing] Filter called');
        error_log('[Yatra Dynamic Pricing] Original price: ' . $price);
        error_log('[Yatra Dynamic Pricing] Trip ID: ' . $trip_id);
        error_log('[Yatra Dynamic Pricing] Context: ' . json_encode($context));
        
        // Apply basic dynamic pricing logic
        $departure_date = $context['departure_date'] ?? null;
        $spots_remaining = $context['spots_remaining'] ?? null;
        
        $original_price = $price;
        
        // Example: Increase price if less than 5 spots remaining (high demand)
        if ($spots_remaining !== null && $spots_remaining <= 5 && $spots_remaining > 0) {
            $price = $price * 1.15; // 15% increase for high demand
            error_log('[Yatra Dynamic Pricing] Applied high demand pricing: ' . $original_price . ' -> ' . $price);
        }
        
        // Example: Early bird discount (more than 30 days in advance)
        if ($departure_date) {
            $days_until = (strtotime($departure_date) - time()) / (60 * 60 * 24);
            error_log('[Yatra Dynamic Pricing] Days until departure: ' . $days_until);
            if ($days_until > 30) {
                $price = $price * 0.9; // 10% early bird discount
                error_log('[Yatra Dynamic Pricing] Applied early bird discount: ' . $original_price . ' -> ' . $price);
            }
        }
        
        error_log('[Yatra Dynamic Pricing] Final price: ' . $price);
        return $price;
    }, 10, 3);
    
    add_filter('yatra_trip_display_price', function($price, $trip_id, $context) {
        // Apply same logic for trip display pages
        return apply_filters('yatra_availability_price', $price, $trip_id, $context);
    }, 10, 3);
    
    add_filter('yatra_booking_trip_price', function($price, $trip_id, $context) {
        // Apply same logic for booking calculations
        return apply_filters('yatra_availability_price', $price, $trip_id, $context);
    }, 10, 3);
    
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

// Register cache management AJAX handlers
add_action('wp_ajax_yatra_cache_stats', function() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['nonce'] ?? '', 'yatra_admin_nonce')) {
        wp_send_json_error('Invalid nonce');
    }

    $controller = new \Yatra\Controllers\CacheController();
    $result = $controller->getStats();
    wp_send_json($result);
});

add_action('wp_ajax_yatra_cache_clear_all', function() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['nonce'] ?? '', 'yatra_admin_nonce')) {
        wp_send_json_error('Invalid nonce');
    }

    // Check capabilities
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Insufficient permissions');
    }

    $controller = new \Yatra\Controllers\CacheController();
    $result = $controller->clearAll();
    wp_send_json($result);
});

add_action('wp_ajax_yatra_cache_clear_pattern', function() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['nonce'] ?? '', 'yatra_admin_nonce')) {
        wp_send_json_error('Invalid nonce');
    }

    // Check capabilities
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Insufficient permissions');
    }

    $pattern = sanitize_text_field($_POST['pattern'] ?? '');
    $controller = new \Yatra\Controllers\CacheController();
    $result = $controller->clearPattern(['pattern' => $pattern]);
    wp_send_json($result);
});

add_action('wp_ajax_yatra_cache_toggle', function() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['nonce'] ?? '', 'yatra_admin_nonce')) {
        wp_send_json_error('Invalid nonce');
    }

    // Check capabilities
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Insufficient permissions');
    }

    $enabled = isset($_POST['enabled']) ? (bool) $_POST['enabled'] : false;
    $controller = new \Yatra\Controllers\CacheController();
    $result = $controller->toggleCache(['enabled' => $enabled]);
    wp_send_json($result);
});

add_action('wp_ajax_yatra_cache_warm', function() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['nonce'] ?? '', 'yatra_admin_nonce')) {
        wp_send_json_error('Invalid nonce');
    }

    // Check capabilities
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Insufficient permissions');
    }

    $controller = new \Yatra\Controllers\CacheController();
    $result = $controller->warmCache();
    wp_send_json($result);
});

/**
 * Plugin activation hook
 */
register_activation_hook(__FILE__, function() {
    if (class_exists('\Yatra\Services\SetupWizardService')) {
        \Yatra\Services\SetupWizardService::triggerWizardOnActivation();
    }
});

