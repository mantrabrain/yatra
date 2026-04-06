<?php

declare(strict_types=1);

namespace Yatra\Core\Routing;

use Yatra\Core\Handlers\BasePageHandler;
use Yatra\Core\Handlers\TripPageHandler;
use Yatra\Core\Handlers\AccountPageHandler;
use Yatra\Core\Handlers\ListingPageHandler;
use Yatra\Core\Handlers\TaxonomyPageHandler;
use Yatra\Core\Handlers\BookingPageHandler;
use Yatra\Core\Handlers\BookingConfirmationPageHandler;
use Yatra\Core\Handlers\CheckoutPageHandler;
use Yatra\Core\Handlers\LoginPageHandler;
use Yatra\Core\Routing\RouteMatcher;

/**
 * Router
 *
 * Central routing system that matches routes and delegates to appropriate handlers
 */
class Router
{
    /**
     * Route handlers registry
     */
    private array $handlers = [];

    /**
     * Constructor - register all route handlers
     */
    public function __construct()
    {
        $this->registerHandlers();
    }

    /**
     * Register page handlers with production optimizations
     */
    private function registerHandlers(): void
    {
        // Lazy loading for better performance
        $this->handlers = [
            'trip' => function() { return new TripPageHandler(); },
            'account' => function() { return new AccountPageHandler(); },
            'listing' => function() { return new ListingPageHandler(); },
            'taxonomy' => function() { return new TaxonomyPageHandler(); },
            'booking' => function() { return new BookingPageHandler(); },
            'booking_confirmation' => function() { return new BookingConfirmationPageHandler(); },
            'checkout' => function() { return new CheckoutPageHandler(); },
            'login' => function() { return new LoginPageHandler(); },
        ];
    }

    
    /**
     * Route the current request
     *
     * @return bool True if route was handled
     */
    public function route(): bool
    {
        $request_path = UrlParser::getCleanRequestPath();

        // Plain permalink fallback: if booking query var is present, dispatch booking handler
        $booking_page_query = get_query_var('yatra_booking_page');
        if (!empty($booking_page_query) && !\Yatra\Services\SettingsService::useCustomBookingPage()) {
            $handler = $this->getHandler('booking');
            if ($handler) {
                return $handler->handle([
                    'type' => 'booking',
                    'page' => $booking_page_query,
                    'base' => \Yatra\Services\SettingsService::getBookingBase(),
                ]);
            }
            return false;
        }

        if (empty($request_path)) {
            return false;
        }

        // Try to match route using various matchers
        $route_data = $this->matchRoute($request_path);

        if (!$route_data) {
            return false;
        }

        // Get appropriate handler
        $handler = $this->getHandler($route_data['type']);

        if (!$handler) {
            $this->logError("No handler found for route type: {$route_data['type']}");
            return false;
        }

        // Handle the route
        try {
            return $handler->handle($route_data);
        } catch (\Exception $e) {
            $this->logError("Handler error for route type {$route_data['type']}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Match route using RouteMatcher
     *
     * @param string $path Request path
     * @return array|null Route data or null if no match
     */
    private function matchRoute(string $path): ?array
    {
        // Try different route matchers in order of specificity

        // 1. Email verification
        if (preg_match('/^yatra-verify-email\/([a-zA-Z0-9_-]+)$/', $path, $matches)) {
            return [
                'type' => 'email_verification',
                'token' => $matches[1]
            ];
        }

        // 2. Account page
        $account_base = \Yatra\Services\SettingsService::getString('account_base', 'account');
        if (preg_match('/^' . preg_quote($account_base, '/') . '\/([^\/]+).*$/', $path, $matches)) {
            if (in_array($matches[1], ['dashboard', 'profile', 'bookings', 'wishlist', 'settings'], true)) {
                return [
                    'type' => 'account',
                    'page' => $matches[1],
                    'base' => $account_base
                ];
            }
        }

        // 3. Trip archive pagination: {trip_base}/page/{n} (must run before single-trip slug match)
        $trip_base = \Yatra\Services\SettingsService::getTripBase();
        if (preg_match('/^' . preg_quote($trip_base, '/') . '\/page\/(\d+)\/?$/', $path, $matches)) {
            return [
                'type' => 'listing',
                'listing_type' => 'trip',
                'base' => $trip_base,
                'paged' => max(1, (int) $matches[1]),
            ];
        }

        // 4. Single trip page
        if (preg_match('/^' . preg_quote($trip_base, '/') . '\/([^\/]+)\/?$/', $path, $matches)) {
            return [
                'type' => 'trip',
                'slug' => $matches[1],
                'base' => $trip_base
            ];
        }

        // 5. Taxonomy page
        $bases = [
            'destination' => \Yatra\Services\SettingsService::getString('destination_base', 'destination'),
            'activity' => \Yatra\Services\SettingsService::getString('activity_base', 'activity'),
            'category' => \Yatra\Services\SettingsService::getString('trip_category_base', 'trip-category'),
        ];

        foreach ($bases as $type => $base) {
            if (preg_match('/^' . preg_quote($base, '/') . '\/([^\/]+)\/?$/', $path, $matches)) {
                return [
                    'type' => 'taxonomy',
                    'taxonomy_type' => $type,
                    'slug' => $matches[1],
                    'base' => $base
                ];
            }
        }

        // 6. Listing page
        foreach ($bases as $type => $base) {
            if ($path === $base) {
                return [
                    'type' => 'listing',
                    'listing_type' => $type,
                    'base' => $base
                ];
            }
        }
        
        // 6b. Trip listing page
        if ($path === $trip_base) {
            return [
                'type' => 'listing',
                'listing_type' => 'trip',
                'base' => $trip_base
            ];
        }

        // 7. Booking confirmation
        if (preg_match('/^book\/confirmation\/([a-zA-Z0-9_-]+)$/', $path, $matches)) {
            return [
                'type' => 'booking_confirmation',
                'confirmation_id' => $matches[1]
            ];
        }

        // 8. Checkout
        if (preg_match('/^checkout\/([a-zA-Z0-9_-]+)$/', $path, $matches)) {
            return [
                'type' => 'checkout',
                'token' => $matches[1]
            ];
        }

        // 9. Booking page
        $booking_base = \Yatra\Services\SettingsService::getBookingBase();
        if ($path === $booking_base && !\Yatra\Services\SettingsService::useCustomBookingPage()) {
            return [
                'type' => 'booking',
                'page' => 'main',
                'base' => $booking_base
            ];
        }

        return null;
    }

    /**
     * Get handler instance with lazy loading and error handling
     *
     * @param string $route_type Route type
     * @return BasePageHandler|null Handler instance or null if not found
     */
    private function getHandler(string $route_type): ?BasePageHandler
    {
        if (!isset($this->handlers[$route_type])) {
            return null;
        }

        try {
            $handler = $this->handlers[$route_type];
            
            // Lazy loading - instantiate only when needed
            if ($handler instanceof \Closure) {
                $this->handlers[$route_type] = $handler();
                return $this->handlers[$route_type];
            }
            
            return $handler;
        } catch (Exception $e) {
            // Log error for debugging
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Yatra Router: Failed to load handler "' . $route_type . '": ' . $e->getMessage());
            }
            
            return null;
        }
    }

    /**
     * Log error message
     *
     * @param string $message Error message
     */
    private function logError(string $message): void
    {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            }
    }
}
