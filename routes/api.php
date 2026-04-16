<?php

declare(strict_types=1);

/**
 * REST API Routes Registry
 * 
 * All API routes are registered under the 'yatra/v1' namespace.
 * Each controller defines its own routes in register_routes() method.
 * 
 * This file provides a central registry of all API controllers.
 * 
 * @package Yatra
 */

// Ensure we're in WordPress context
if (!defined('ABSPATH')) {
    exit;
}

/**
 * API Controllers Registry
 * 
 * Organized by domain/module for easy navigation.
 * Comment out a controller to disable its endpoints.
 */
$controllers = [

    // =============================================
    // CORE RESOURCES
    // =============================================
    \Yatra\Controllers\TripController::class,
    \Yatra\Controllers\ActivityController::class,
    \Yatra\Controllers\DestinationController::class,

    // =============================================
    // TAXONOMY & CLASSIFICATION
    // =============================================
    \Yatra\Controllers\TripCategoryController::class,
    \Yatra\Controllers\DifficultyLevelController::class,
    \Yatra\Controllers\TravelerCategoryController::class,

    // =============================================
    // ITEMS & INVENTORY
    // =============================================
    \Yatra\Controllers\ItemTypeController::class,
    \Yatra\Controllers\ItemController::class,

    // =============================================
    // TRIP DETAILS
    // =============================================
    \Yatra\Controllers\AvailabilityController::class,
    \Yatra\Controllers\RecurringAvailabilityController::class,
    \Yatra\Controllers\TripAvailabilityController::class, // Departures System (FREE)
    \Yatra\Controllers\TripDownloadController::class, // Downloads System (FREE)
    \Yatra\Controllers\AttributeController::class, // Attributes System (FREE)
    \Yatra\Controllers\ItineraryController::class,
    \Yatra\Controllers\DiscountController::class,

    // =============================================
    // BOOKING & PAYMENTS
    // =============================================
    \Yatra\Controllers\BookingsController::class,
    \Yatra\Controllers\PaymentController::class, // Payment records management
    \Yatra\Controllers\BookingSessionController::class,
    \Yatra\Controllers\PaymentGatewayController::class, // Payment gateway operations

    // =============================================
    // CUSTOMERS & CRM
    // =============================================
    \Yatra\Controllers\CustomerController::class,
    \Yatra\Controllers\ReviewController::class,
    \Yatra\Controllers\EnquiryController::class,
    \Yatra\Controllers\SavedTripController::class,

    // =============================================
    // AUTHENTICATION
    // =============================================
    \Yatra\Controllers\AuthController::class,

    // =============================================
    // ADMIN & SETTINGS
    // =============================================
    \Yatra\Controllers\SettingsController::class,
    \Yatra\Controllers\LicenseController::class,
    \Yatra\Controllers\ModuleController::class,
    \Yatra\Controllers\ReportsController::class,
    \Yatra\Controllers\ToolsController::class,
    \Yatra\Controllers\SampleDataController::class,
    \Yatra\Controllers\UsageTrackingController::class,
    \Yatra\Controllers\NoticeController::class,

];

// Debug: Check if BookingsController is in the array
if (defined('WP_DEBUG') && WP_DEBUG) {
    }

/**
 * Register all controller routes
 * 
 * Each controller's register_routes() method is called to register
 * its endpoints with WordPress REST API.
 */
foreach ($controllers as $controllerClass) {
    if (!class_exists($controllerClass)) {
        continue;
    }

    try {
        $controller = new $controllerClass();
        
        if (method_exists($controller, 'register_routes')) {
            $controller->register_routes();
        }
    } catch (\Throwable $e) {
        continue;
    }
}
