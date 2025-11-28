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
use Yatra\Controllers\DestinationController;
use Yatra\Controllers\TripCategoryController;
use Yatra\Controllers\DifficultyLevelController;
use Yatra\Controllers\TravelerCategoryController;
use Yatra\Controllers\ItemTypeController;
use Yatra\Controllers\ItemController;
use Yatra\Controllers\DiscountController;
use Yatra\Controllers\SettingsController;
use Yatra\Controllers\AvailabilityController;
use Yatra\Controllers\ItineraryController;
use Yatra\Controllers\MaintenanceController;
use Yatra\Controllers\ModuleController;
use Yatra\Controllers\CustomerController;
use Yatra\Controllers\ReviewController;
use Yatra\Controllers\EnquiryController;
use Yatra\Controllers\PaymentGatewayController;
use Yatra\Controllers\BookingSessionController;
use Yatra\Controllers\BookingsController;

// Register Trip routes
if (class_exists('Yatra\Controllers\TripController')) {
    try {
        $trip_controller = new TripController();
        $trip_controller->register_routes();
    } catch (\Exception $e) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: Failed to register Trip routes: ' . $e->getMessage());
        }
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
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: Failed to register Activity routes: ' . $e->getMessage());
            error_log('Yatra: Stack trace: ' . $e->getTraceAsString());
        }
    }
}

// Register Destination routes
if (class_exists('Yatra\Controllers\DestinationController')) {
    try {
        $destination_controller = new DestinationController();
        $destination_controller->register_routes();
        
        // Debug: Verify route was registered
        if (defined('WP_DEBUG') && WP_DEBUG) {
            $routes = rest_get_server()->get_routes('yatra/v1');
            $destination_routes = array_filter($routes, function($key) {
                return strpos($key, '/destinations') !== false;
            }, ARRAY_FILTER_USE_KEY);
            error_log('Yatra: Destination routes registered: ' . print_r(array_keys($destination_routes), true));
        }
    } catch (\Exception $e) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: Failed to register Destination routes: ' . $e->getMessage());
            error_log('Yatra: Stack trace: ' . $e->getTraceAsString());
        }
    }
}

// Register Trip Category routes
if (class_exists('Yatra\Controllers\TripCategoryController')) {
    try {
        $trip_category_controller = new TripCategoryController();
        $trip_category_controller->register_routes();
        
        // Debug: Verify route was registered
        if (defined('WP_DEBUG') && WP_DEBUG) {
            $routes = rest_get_server()->get_routes('yatra/v1');
            $trip_category_routes = array_filter($routes, function($key) {
                return strpos($key, '/trip-categories') !== false;
            }, ARRAY_FILTER_USE_KEY);
            error_log('Yatra: Trip Category routes registered: ' . print_r(array_keys($trip_category_routes), true));
        }
    } catch (\Exception $e) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: Failed to register Trip Category routes: ' . $e->getMessage());
            error_log('Yatra: Stack trace: ' . $e->getTraceAsString());
        }
    }
}

// Register Difficulty Level routes
if (class_exists('Yatra\Controllers\DifficultyLevelController')) {
    try {
        $difficulty_level_controller = new DifficultyLevelController();
        $difficulty_level_controller->register_routes();
        
        // Debug: Verify route was registered
        if (defined('WP_DEBUG') && WP_DEBUG) {
            $routes = rest_get_server()->get_routes('yatra/v1');
            $difficulty_level_routes = array_filter($routes, function($key) {
                return strpos($key, '/difficulty-levels') !== false;
            }, ARRAY_FILTER_USE_KEY);
            error_log('Yatra: Difficulty Level routes registered: ' . print_r(array_keys($difficulty_level_routes), true));
        }
    } catch (\Exception $e) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: Failed to register Difficulty Level routes: ' . $e->getMessage());
            error_log('Yatra: Stack trace: ' . $e->getTraceAsString());
        }
    }
}

// Register Traveler Category routes
if (class_exists('Yatra\Controllers\TravelerCategoryController')) {
    try {
        $traveler_category_controller = new TravelerCategoryController();
        $traveler_category_controller->register_routes();
        
        // Debug: Verify route was registered
        if (defined('WP_DEBUG') && WP_DEBUG) {
            $routes = rest_get_server()->get_routes('yatra/v1');
            $traveler_category_routes = array_filter($routes, function($key) {
                return strpos($key, '/traveler-categories') !== false;
            }, ARRAY_FILTER_USE_KEY);
            error_log('Yatra: Traveler Category routes registered: ' . print_r(array_keys($traveler_category_routes), true));
        }
    } catch (\Exception $e) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: Failed to register Traveler Category routes: ' . $e->getMessage());
            error_log('Yatra: Stack trace: ' . $e->getTraceAsString());
        }
    }
}

// Register Item Type routes
if (class_exists('Yatra\Controllers\ItemTypeController')) {
    try {
        $item_type_controller = new ItemTypeController();
        $item_type_controller->register_routes();
        
        // Debug: Verify route was registered
        if (defined('WP_DEBUG') && WP_DEBUG) {
            $routes = rest_get_server()->get_routes('yatra/v1');
            $item_type_routes = array_filter($routes, function($key) {
                return strpos($key, '/item-types') !== false;
            }, ARRAY_FILTER_USE_KEY);
            error_log('Yatra: Item Type routes registered: ' . print_r(array_keys($item_type_routes), true));
        }
    } catch (\Exception $e) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: Failed to register Item Type routes: ' . $e->getMessage());
            error_log('Yatra: Stack trace: ' . $e->getTraceAsString());
        }
    }
}

// Register Item routes
if (class_exists('Yatra\Controllers\ItemController')) {
    try {
        $item_controller = new ItemController();
        $item_controller->register_routes();
        
        // Debug: Verify route was registered
        if (defined('WP_DEBUG') && WP_DEBUG) {
            $routes = rest_get_server()->get_routes('yatra/v1');
            $item_routes = array_filter($routes, function($key) {
                return strpos($key, '/items') !== false;
            }, ARRAY_FILTER_USE_KEY);
            error_log('Yatra: Item routes registered: ' . print_r(array_keys($item_routes), true));
        }
    } catch (\Exception $e) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: Failed to register Item routes: ' . $e->getMessage());
            error_log('Yatra: Stack trace: ' . $e->getTraceAsString());
        }
    }
}

// Register Discount routes
if (class_exists('Yatra\Controllers\DiscountController')) {
    try {
        $discount_controller = new DiscountController();
        $discount_controller->register_routes();
        
        // Debug: Verify route was registered
        if (defined('WP_DEBUG') && WP_DEBUG) {
            $routes = rest_get_server()->get_routes('yatra/v1');
            $discount_routes = array_filter($routes, function($key) {
                return strpos($key, '/discounts') !== false;
            }, ARRAY_FILTER_USE_KEY);
            error_log('Yatra: Discount routes registered: ' . print_r(array_keys($discount_routes), true));
        }
    } catch (\Exception $e) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: Failed to register Discount routes: ' . $e->getMessage());
            error_log('Yatra: Stack trace: ' . $e->getTraceAsString());
        }
    }
}

// Register Settings routes
if (class_exists('Yatra\Controllers\SettingsController')) {
    try {
        $settings_controller = new SettingsController();
        $settings_controller->register_routes();
        
        // Debug: Verify route was registered
        if (defined('WP_DEBUG') && WP_DEBUG) {
            $routes = rest_get_server()->get_routes('yatra/v1');
            $settings_routes = array_filter($routes, function($key) {
                return strpos($key, '/settings') !== false;
            }, ARRAY_FILTER_USE_KEY);
            error_log('Yatra: Settings routes registered: ' . print_r(array_keys($settings_routes), true));
        }
    } catch (\Exception $e) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: Failed to register Settings routes: ' . $e->getMessage());
            error_log('Yatra: Stack trace: ' . $e->getTraceAsString());
        }
    }
}

// Register Availability routes
if (class_exists('Yatra\Controllers\AvailabilityController')) {
    try {
        $availability_controller = new AvailabilityController();
        $availability_controller->register_routes();
        
        // Debug: Verify route was registered
        if (defined('WP_DEBUG') && WP_DEBUG) {
            $routes = rest_get_server()->get_routes('yatra/v1');
            $availability_routes = array_filter($routes, function($key) {
                return strpos($key, '/availability') !== false;
            }, ARRAY_FILTER_USE_KEY);
            error_log('Yatra: Availability routes registered: ' . print_r(array_keys($availability_routes), true));
        }
    } catch (\Exception $e) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: Failed to register Availability routes: ' . $e->getMessage());
            error_log('Yatra: Stack trace: ' . $e->getTraceAsString());
        }
    }
}

// Register Itinerary routes
if (class_exists('Yatra\Controllers\ItineraryController')) {
    try {
        $itinerary_controller = new ItineraryController();
        $itinerary_controller->register_routes();
        
        // Debug: Verify route was registered
        if (defined('WP_DEBUG') && WP_DEBUG) {
            $routes = rest_get_server()->get_routes('yatra/v1');
            $itinerary_routes = array_filter($routes, function($key) {
                return strpos($key, '/itinerary') !== false;
            }, ARRAY_FILTER_USE_KEY);
            error_log('Yatra: Itinerary routes registered: ' . print_r(array_keys($itinerary_routes), true));
        }
    } catch (\Exception $e) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: Failed to register Itinerary routes: ' . $e->getMessage());
            error_log('Yatra: Stack trace: ' . $e->getTraceAsString());
        }
    }
}

// Register Maintenance routes
if (class_exists('Yatra\Controllers\MaintenanceController')) {
    try {
        $maintenance_controller = new MaintenanceController();
        $maintenance_controller->register_routes();
        
        if (defined('WP_DEBUG') && WP_DEBUG) {
            $routes = rest_get_server()->get_routes('yatra/v1');
            $maintenance_routes = array_filter($routes, function($key) {
                return strpos($key, '/maintenance') !== false;
            }, ARRAY_FILTER_USE_KEY);
            error_log('Yatra: Maintenance routes registered: ' . print_r(array_keys($maintenance_routes), true));
        }
    } catch (\Exception $e) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: Failed to register Maintenance routes: ' . $e->getMessage());
            error_log('Yatra: Stack trace: ' . $e->getTraceAsString());
        }
    }
}

// Register Module routes
if (class_exists('Yatra\Controllers\ModuleController')) {
    try {
        $module_controller = new ModuleController();
        $module_controller->register_routes();

        if (defined('WP_DEBUG') && WP_DEBUG) {
            $routes = rest_get_server()->get_routes('yatra/v1');
            $module_routes = array_filter($routes, function($key) {
                return strpos($key, '/modules') !== false;
            }, ARRAY_FILTER_USE_KEY);
            error_log('Yatra: Module routes registered: ' . print_r(array_keys($module_routes), true));
        }
    } catch (\Exception $e) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: Failed to register Module routes: ' . $e->getMessage());
            error_log('Yatra: Stack trace: ' . $e->getTraceAsString());
        }
    }
}

// Register Customer routes
if (class_exists('Yatra\Controllers\CustomerController')) {
    try {
        $customer_controller = new CustomerController();
        $customer_controller->register_routes();

        if (defined('WP_DEBUG') && WP_DEBUG) {
            $routes = rest_get_server()->get_routes('yatra/v1');
            $customer_routes = array_filter($routes, function($key) {
                return strpos($key, '/customers') !== false;
            }, ARRAY_FILTER_USE_KEY);
            error_log('Yatra: Customer routes registered: ' . print_r(array_keys($customer_routes), true));
        }
    } catch (\Exception $e) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: Failed to register Customer routes: ' . $e->getMessage());
            error_log('Yatra: Stack trace: ' . $e->getTraceAsString());
        }
    }
}

// Register Review routes
if (class_exists('Yatra\Controllers\ReviewController')) {
    try {
        $review_controller = new ReviewController();
        $review_controller->register_routes();

        if (defined('WP_DEBUG') && WP_DEBUG) {
            $routes = rest_get_server()->get_routes('yatra/v1');
            $review_routes = array_filter($routes, function($key) {
                return strpos($key, '/reviews') !== false;
            }, ARRAY_FILTER_USE_KEY);
            error_log('Yatra: Review routes registered: ' . print_r(array_keys($review_routes), true));
        }
    } catch (\Exception $e) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: Failed to register Review routes: ' . $e->getMessage());
            error_log('Yatra: Stack trace: ' . $e->getTraceAsString());
        }
    }
}

// Register Enquiry routes
if (class_exists('Yatra\Controllers\EnquiryController')) {
    try {
        $enquiry_controller = new EnquiryController();
        $enquiry_controller->register_routes();

        if (defined('WP_DEBUG') && WP_DEBUG) {
            $routes = rest_get_server()->get_routes('yatra/v1');
            $enquiry_routes = array_filter($routes, function($key) {
                return strpos($key, '/enquiries') !== false;
            }, ARRAY_FILTER_USE_KEY);
            error_log('Yatra: Enquiry routes registered: ' . print_r(array_keys($enquiry_routes), true));
        }
    } catch (\Exception $e) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: Failed to register Enquiry routes: ' . $e->getMessage());
            error_log('Yatra: Stack trace: ' . $e->getTraceAsString());
        }
    }
}

// Register Payment Gateway routes
if (class_exists('Yatra\Controllers\PaymentGatewayController')) {
    try {
        $payment_controller = new PaymentGatewayController();
        $payment_controller->register_routes();

        if (defined('WP_DEBUG') && WP_DEBUG) {
            $routes = rest_get_server()->get_routes('yatra/v1');
            $payment_routes = array_filter($routes, function($key) {
                return strpos($key, '/payment') !== false;
            }, ARRAY_FILTER_USE_KEY);
            error_log('Yatra: Payment Gateway routes registered: ' . print_r(array_keys($payment_routes), true));
        }
    } catch (\Exception $e) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: Failed to register Payment Gateway routes: ' . $e->getMessage());
            error_log('Yatra: Stack trace: ' . $e->getTraceAsString());
        }
    }
}

// Register Booking Session routes
if (class_exists('Yatra\Controllers\BookingSessionController')) {
    try {
        $booking_session_controller = new BookingSessionController();
        $booking_session_controller->register_routes();

        if (defined('WP_DEBUG') && WP_DEBUG) {
            $routes = rest_get_server()->get_routes('yatra/v1');
            $booking_routes = array_filter($routes, function($key) {
                return strpos($key, '/booking') !== false;
            }, ARRAY_FILTER_USE_KEY);
            error_log('Yatra: Booking Session routes registered: ' . print_r(array_keys($booking_routes), true));
        }
    } catch (\Exception $e) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: Failed to register Booking Session routes: ' . $e->getMessage());
            error_log('Yatra: Stack trace: ' . $e->getTraceAsString());
        }
    }
}

// Register Bookings Controller (Admin CRUD)
if (class_exists('Yatra\Controllers\BookingsController')) {
    try {
        $bookings_controller = new BookingsController();
        $bookings_controller->register_routes();

        if (defined('WP_DEBUG') && WP_DEBUG) {
            $routes = rest_get_server()->get_routes('yatra/v1');
            $bookings_routes = array_filter($routes, function($key) {
                return strpos($key, '/bookings') !== false || strpos($key, '/payments') !== false;
            }, ARRAY_FILTER_USE_KEY);
            error_log('Yatra: Bookings routes registered: ' . print_r(array_keys($bookings_routes), true));
        }
    } catch (\Exception $e) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: Failed to register Bookings routes: ' . $e->getMessage());
            error_log('Yatra: Stack trace: ' . $e->getTraceAsString());
        }
    }
}

