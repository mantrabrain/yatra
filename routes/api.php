<?php

declare(strict_types=1);

/**
 * REST API Routes
 * 
 * All routes are registered under the 'yatra/v1' namespace
 */

use Yatra\Controllers\TripController;

// Register Trip routes
$trip_controller = new TripController();
$trip_controller->register_routes();

// Add more route registrations here as you create new controllers

