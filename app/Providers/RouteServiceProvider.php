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
        // Register routes on rest_api_init
        add_action('rest_api_init', [$this, 'registerRoutes']);
    }

    /**
     * Register REST API routes
     */
    public function registerRoutes(): void
    {
        // Load route files
        $routes_file = YATRA_PLUGIN_PATH . 'routes/api.php';
        
        if (file_exists($routes_file)) {
            require_once $routes_file;
        }
    }
}

