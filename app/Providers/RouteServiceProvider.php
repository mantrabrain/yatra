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

        // Register routes on rest_api_init hook
        add_action('rest_api_init', [$this, 'registerRoutes'], 10);
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
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Yatra: Routes file not found - ' . $this->routesFile);
            }
            return;
        }

        // Load routes registry
        require_once $this->routesFile;

        $registered = true;

        // Debug logging (only when explicitly enabled)
        if (defined('YATRA_DEBUG_API') && YATRA_DEBUG_API) {
            $this->logRegisteredRoutes();
        }
    }

    /**
     * Log all registered routes for debugging
     */
    private function logRegisteredRoutes(): void
    {
        $server = rest_get_server();
        $routes = $server->get_routes('yatra/v1');
        
        error_log('Yatra API: Total routes registered - ' . count($routes));
        
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
            error_log("  - {$resource}: {$count} endpoints");
        }
    }
}
