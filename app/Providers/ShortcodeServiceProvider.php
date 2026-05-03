<?php

declare(strict_types=1);

namespace Yatra\Providers;

use Yatra\Shortcodes\MyAccountShortcode;
use Yatra\Shortcodes\TripShortcode;
use Yatra\Shortcodes\ActivityShortcode;
use Yatra\Shortcodes\DestinationShortcode;
use Yatra\Shortcodes\TripCategoryShortcode;
use Yatra\Shortcodes\DiscountAndDealsShortcode;
use Yatra\Shortcodes\SearchShortcode;
use Yatra\Shortcodes\LoginShortcode;
use Yatra\Ajax\TripShortcodeAjax;
use Yatra\Ajax\ActivityShortcodeAjax;
use Yatra\Ajax\DestinationShortcodeAjax;
use Yatra\Ajax\TripCategoryShortcodeAjax;
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
            'TripCategoryShortcodeAjax',
            'DiscountShortcodeAjax',
            'LoginAjax',
            'GeocodingAjax',
            'DirectAttributeQuery',
        ];

        foreach ($ajax_handlers as $handler_class) {
            try {
                $full_class_name = "\\Yatra\\Ajax\\{$handler_class}";
                
                if (class_exists($full_class_name)) {
                    new $full_class_name();
                } else {

                }
            } catch (Exception $e) {

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
            'yatra_trip_category' => TripCategoryShortcode::class,
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

                    }
                } else {

                }
            } catch (\Exception $e) {
                // Log error for debugging

                // Continue with other shortcodes even if one fails
                continue;
            }
        }
    }
}
