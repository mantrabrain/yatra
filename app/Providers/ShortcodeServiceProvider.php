<?php

declare(strict_types=1);

namespace Yatra\Providers;

use Yatra\Shortcodes\MyAccountShortcode;
use Yatra\Shortcodes\TripShortcode;
use Yatra\Shortcodes\ActivityShortcode;
use Yatra\Shortcodes\DestinationShortcode;
use Yatra\Shortcodes\DiscountAndDealsShortcode;
use Yatra\Shortcodes\SearchShortcode;
use Yatra\Shortcodes\LoginShortcode;
use Yatra\Ajax\TripShortcodeAjax;
use Yatra\Ajax\ActivityShortcodeAjax;
use Yatra\Ajax\DestinationShortcodeAjax;
use Yatra\Ajax\DiscountShortcodeAjax;
use Yatra\Ajax\LoginAjax;
use Yatra\Ajax\GeocodingAjax;

/**
 * Shortcode Service Provider
 *
 * Registers all Yatra shortcodes
 */
class ShortcodeServiceProvider extends \Yatra\Core\ServiceProvider
{
    /**
     * Register services with production optimizations
     */
    public function register(): void
    {
        // Register all shortcodes immediately, not on init hook
        $this->registerShortcodes();
        
        // Register AJAX handlers with error handling
        $this->registerAjaxHandlers();
    }

    /**
     * Register AJAX handlers with error handling and lazy loading
     */
    private function registerAjaxHandlers(): void
    {
        $ajax_handlers = [
            'TripShortcodeAjax',
            'ActivityShortcodeAjax', 
            'DestinationShortcodeAjax',
            'DiscountShortcodeAjax',
            'LoginAjax',
            'GeocodingAjax'
        ];

        foreach ($ajax_handlers as $handler_class) {
            try {
                $full_class_name = "\\Yatra\\Ajax\\{$handler_class}";
                
                if (class_exists($full_class_name)) {
                    new $full_class_name();
                } else {
                    // Log error for debugging
                    if (defined('WP_DEBUG') && WP_DEBUG) {
                        error_log("Yatra ShortcodeServiceProvider: AJAX handler class {$full_class_name} not found");
                    }
                }
            } catch (Exception $e) {
                // Log error for debugging
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log("Yatra ShortcodeServiceProvider: Failed to register AJAX handler {$handler_class}: " . $e->getMessage());
                }
            }
        }
    }

    /**
     * Register all shortcodes with production optimizations
     */
    public function registerShortcodes(): void
    {
        $shortcodes = [
            'yatra_my_account' => MyAccountShortcode::class,
            'yatra_trip' => TripShortcode::class,
            'yatra_activity' => ActivityShortcode::class,
            'yatra_destination' => DestinationShortcode::class,
            'yatra_discount_and_deals' => DiscountAndDealsShortcode::class,
            'yatra_search' => SearchShortcode::class,
            'yatra_login' => LoginShortcode::class,
        ];

        foreach ($shortcodes as $tag => $class) {
            try {
                if (class_exists($class)) {
                    $shortcode = new $class();
                    
                    // Validate that the shortcode class has the register method
                    if (method_exists($shortcode, 'register')) {
                        $shortcode->register();
                    } else {
                        // Log error for debugging
                        if (defined('WP_DEBUG') && WP_DEBUG) {
                            error_log("Yatra ShortcodeServiceProvider: Shortcode class {$class} missing register method");
                        }
                    }
                } else {
                    // Log error for debugging
                    if (defined('WP_DEBUG') && WP_DEBUG) {
                        error_log("Yatra ShortcodeServiceProvider: Shortcode class {$class} not found");
                    }
                }
            } catch (Exception $e) {
                // Log error for debugging
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log("Yatra ShortcodeServiceProvider: Failed to register shortcode {$tag}: " . $e->getMessage());
                }
                
                // Continue with other shortcodes even if one fails
                continue;
            }
        }
    }
}
