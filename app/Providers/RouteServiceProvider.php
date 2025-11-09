<?php

declare(strict_types=1);

namespace Yatra\Providers;

use Yatra\Core\ServiceProvider;
use Yatra\Core\Container;

/**
 * Route Service Provider
 * Registers REST API routes
 */
class RouteServiceProvider extends ServiceProvider
{
    /**
     * Register services
     */
    public function register(): void
    {
        // Register routes on rest_api_init hook ONLY
        // WordPress requires REST API routes to be registered on this hook
        // Priority 10 ensures it runs early
        add_action('rest_api_init', [$this, 'registerRoutes'], 10);
        
        // Debug: Verify hook is registered
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: RouteServiceProvider registered rest_api_init hook');
        }
    }

    /**
     * Register REST API routes
     */
    public function registerRoutes(): void
    {
        // Only register once to avoid duplicate registrations
        static $registered = false;
        if ($registered) {
            return;
        }
        
        // Load route files
        $routes_file = YATRA_PLUGIN_PATH . 'routes/api.php';
        
        if (!file_exists($routes_file)) {
            error_log('Yatra: Routes file not found at: ' . $routes_file);
            return;
        }
        
        // Require the routes file which will instantiate controllers and register routes
            require_once $routes_file;
        
        $registered = true;
        
        // Debug: Log that routes have been registered
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: REST API routes registered successfully');
            
            // Log all registered routes for debugging
            $server = rest_get_server();
            $routes = $server->get_routes('yatra/v1');
            error_log('Yatra: All registered yatra/v1 routes: ' . print_r(array_keys($routes), true));
            
            // Add hook to log all REST API requests - EARLY to catch everything
            add_filter('rest_pre_dispatch', function($result, $server, $request) {
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    $route = $request->get_route();
                    if (strpos($route, '/yatra/v1/') === 0 || strpos($route, 'yatra/v1/') === 0) {
                        error_log(sprintf(
                            'Yatra: REST API request - Method: %s, Route: %s, User ID: %d, Matched: %s',
                            $request->get_method(),
                            $route,
                            get_current_user_id(),
                            $result instanceof \WP_Error ? 'NO' : 'YES'
                        ));
        }
    }
                return $result;
            }, 5, 3); // Priority 5 to run early

            // Add hook to log before callbacks (permission check happens here)
            add_filter('rest_request_before_callbacks', function($response, $handler, $request) {
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    $route = $request->get_route();
                    if (strpos($route, '/yatra/v1/') === 0 || strpos($route, 'yatra/v1/') === 0) {
                        error_log(sprintf(
                            'Yatra: Before callbacks - Method: %s, Route: %s, Has handler: %s, Has permission_callback: %s',
                            $request->get_method(),
                            $route,
                            isset($handler['callback']) ? 'YES' : 'NO',
                            isset($handler['permission_callback']) ? 'YES' : 'NO'
                        ));
                    }
                }
                return $response;
            }, 10, 3);

            // Add hook to log permission failures
            add_filter('rest_request_after_callbacks', function($response, $handler, $request) {
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    $route = $request->get_route();
                    if (strpos($route, '/yatra/v1/') === 0 || strpos($route, 'yatra/v1/') === 0) {
                        if (is_wp_error($response)) {
                            error_log(sprintf(
                                'Yatra: REST API error - Method: %s, Route: %s, Error Code: %s, Error Message: %s, Status: %d',
                                $request->get_method(),
                                $route,
                                $response->get_error_code(),
                                $response->get_error_message(),
                                $response->get_error_data()['status'] ?? 0
                            ));
                        } else {
                            error_log(sprintf(
                                'Yatra: REST API success - Method: %s, Route: %s, Status: %d',
                                $request->get_method(),
                                $route,
                                $response->get_status() ?? 200
                            ));
                        }
                    }
                }
                return $response;
            }, 10, 3);
        }
    }
}
