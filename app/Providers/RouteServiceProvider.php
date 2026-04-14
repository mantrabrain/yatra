<?php

declare(strict_types=1);

namespace Yatra\Providers;

use Yatra\Core\ServiceProvider;

/**
 * Route Service Provider
 * 
 * Registers REST API routes by loading the routes/api.php file
 * during the 'rest_api_init' hook.
 * 
 * @package Yatra\Providers
 */
class RouteServiceProvider extends ServiceProvider
{
    /**
     * Routes file path
     */
    private string $routesFile;

    /**
     * Register services
     */
    public function register(): void
    {
        $this->routesFile = YATRA_PLUGIN_PATH . 'routes/api.php';

        
        // Register routes on rest_api_init hook with higher priority to ensure it runs early
        add_action('rest_api_init', [$this, 'registerRoutes'], 5);
        
        // Fix REST API rewrite rules if they're not working
        add_action('init', [$this, 'fixRestApiRewrites'], 999);
    }

    /**
     * Register REST API routes
     */
    public function registerRoutes(): void
    {
        
        // Prevent duplicate registration
        static $registered = false;
        if ($registered) {
            return;
        }

        if (!file_exists($this->routesFile)) {
            return;
        }

        // Load routes registry
        require_once $this->routesFile;

        $registered = true;

        // Debug logging (only when explicitly enabled)
        if (defined('YATRA_DEBUG_API') && YATRA_DEBUG_API) {
            $this->logRegisteredRoutes();
        }
        
        // Debug: Log route registration completion
        if (defined('WP_DEBUG') && WP_DEBUG) {
            }
    }

    /**
     * Fix REST API rewrite rules
     */
    public function fixRestApiRewrites(): void
    {
        // Add manual rewrite rule for REST API
        add_rewrite_rule(
            '^wp-json/yatra/v1/downloads/([0-9]+)/download-url/?$',
            'index.php?rest_route=/yatra/v1/downloads/$matches[1]/download-url',
            'top'
        );
        
        add_rewrite_rule(
            '^wp-json/yatra/v1/(.*)?$',
            'index.php?rest_route=/yatra/v1/$matches[1]',
            'top'
        );
        
        // Ensure REST API rewrite rules are properly flushed
        if (!get_option('yatra_rest_api_flushed')) {
            flush_rewrite_rules(false);
            update_option('yatra_rest_api_flushed', true);
        }
    }

    /**
     * Log all registered routes for debugging
     */
    private function logRegisteredRoutes(): void
    {
        $server = rest_get_server();
        $routes = $server->get_routes('yatra/v1');
        
        // Group routes by resource
        $grouped = [];
        foreach (array_keys($routes) as $route) {
            $parts = explode('/', trim($route, '/'));
            $resource = $parts[1] ?? 'root';
            if (!isset($grouped[$resource])) {
                $grouped[$resource] = 0;
            }
            $grouped[$resource]++;
        }
        
        foreach ($grouped as $resource => $count) {
            }
    }
}
