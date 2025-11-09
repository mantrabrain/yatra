<?php

declare(strict_types=1);

/**
 * REST API Routes
 * 
 * All routes are registered under the 'yatra/v1' namespace
 * 
 * This file is loaded by RouteServiceProvider on the 'rest_api_init' hook
 */

// Ensure we're in WordPress context
if (!defined('ABSPATH')) {
    exit;
}

use Yatra\Controllers\TripController;
use Yatra\Controllers\ActivityController;

// Register Trip routes
if (class_exists('Yatra\Controllers\TripController')) {
    try {
$trip_controller = new TripController();
$trip_controller->register_routes();
    } catch (\Exception $e) {
        error_log('Yatra: Failed to register Trip routes: ' . $e->getMessage());
    }
}

// Register Activity routes
if (class_exists('Yatra\Controllers\ActivityController')) {
    try {
        $activity_controller = new ActivityController();
        $activity_controller->register_routes();
        
        // Debug: Verify route was registered
        if (defined('WP_DEBUG') && WP_DEBUG) {
            $routes = rest_get_server()->get_routes('yatra/v1');
            $activity_routes = array_filter($routes, function($key) {
                return strpos($key, '/activities') !== false;
            }, ARRAY_FILTER_USE_KEY);
            error_log('Yatra: Activity routes registered: ' . print_r(array_keys($activity_routes), true));
        }
    } catch (\Exception $e) {
        error_log('Yatra: Failed to register Activity routes: ' . $e->getMessage());
        error_log('Yatra: Stack trace: ' . $e->getTraceAsString());
    }
}

// Add more route registrations here as you create new controllers

