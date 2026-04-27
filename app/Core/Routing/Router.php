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
use Yatra\Core\Routing\PlainPageMatcher;
use Yatra\Core\Routing\PrettyRouteMatcher;

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
        ];
    }

    
    /**
     * Route the current request
     *
     * @return bool True if route was handled
     */
    public function route(): bool
    {
        $plain = PlainPageMatcher::match();
        if ($plain !== null) {
            return $this->handleRouteData($plain);
        }

        $request_path = UrlParser::getCleanRequestPath();

        if ($request_path === '') {
            return false;
        }

        $route_data = $this->matchRoute($request_path);

        if ($route_data === null) {
            return false;
        }

        return $this->handleRouteData($route_data);
    }

    /**
     * @param array<string, mixed> $route_data
     */
    private function handleRouteData(array $route_data): bool
    {
        $handler = $this->getHandler($route_data['type']);

        if (!$handler) {
            $this->logError("No handler found for route type: {$route_data['type']}");

            return false;
        }

        try {
            return $handler->handle($route_data);
        } catch (\Exception $e) {
            $this->logError("Handler error for route type {$route_data['type']}: " . $e->getMessage());

            return false;
        }
    }

    /**
     * Match pretty-permalink path (non-plain) to route data.
     *
     * @param string $path Request path
     * @return array|null Route data or null if no match
     */
    private function matchRoute(string $path): ?array
    {
        return PrettyRouteMatcher::match($path);
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
        } catch (\Throwable $e) {

            
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
