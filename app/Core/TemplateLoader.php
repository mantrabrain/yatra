<?php

declare(strict_types=1);

namespace Yatra\Core;

use Yatra\Core\Routing\Router;
use Yatra\Services\SettingsService;
use Yatra\Core\Handlers\TripPageHandler;

/**
 * Template Loader
 *
 * Handles all frontend template loading and routing for Yatra pages.
 * Uses a modern, modular architecture with dedicated routing and asset management.
 *
 * @package Yatra\Core
 * @since 3.0.0
 */
class TemplateLoader
{
    /**
     * Router instance
     */
    private static ?Router $router = null;

    /**
     * Initialize template loading hooks
     */
    public static function init(): void
    {
        // Initialize rewrite rules and query vars first
        add_action('init', [self::class, 'addTripRewriteRules'], 10);
        add_filter('query_vars', [self::class, 'addCustomQueryVars']);

        // Initialize the main router for template handling
        add_action('template_redirect', [self::class, 'handleTemplateRedirect'], 1);
    }

    /**
     * Handle template redirect using the new routing system
     */
    public static function handleTemplateRedirect(): void
    {
        if (!self::$router) {
            self::$router = new Router();
        }

        // Let the router handle the request
        $handled = self::$router->route();

        // If router didn't handle it, let WordPress continue normally
        if (!$handled) {
            // Plain permalink fallback: handle ?yatra_trip_slug= or ?trip= requests
            $slug = get_query_var('yatra_trip_slug') ?: ($_GET['yatra_trip_slug'] ?? ($_GET['trip'] ?? ''));
            if (!empty($slug)) {
                $handler = new TripPageHandler();
                $handled = $handler->handle([
                    'type' => 'trip',
                    'slug' => sanitize_title($slug),
                    'base' => SettingsService::getTripBase(),
                ]);
            }
        }

        // If still not handled, continue normally
        if (!$handled) {
            return;
        }

        // If router handled it, exit to prevent further processing
        exit;
    }

    /**
     * Add rewrite rules for trip permalinks and listing pages
     */
    public static function addTripRewriteRules(): void
    {
        // Use centralized SettingsService for all settings
        $trip_base = SettingsService::getTripBase();
        $booking_base = SettingsService::getBookingBase();

        // Get other bases with sanitization
        $destination_base = SettingsService::getString('destination_base', 'destination');
        $destination_base = preg_replace('/[^a-z0-9_-]/i', '', $destination_base) ?: 'destination';

        $activity_base = SettingsService::getString('activity_base', 'activity');
        $activity_base = preg_replace('/[^a-z0-9_-]/i', '', $activity_base) ?: 'activity';

        $trip_category_base = SettingsService::getString('trip_category_base', 'trip-category');
        $trip_category_base = preg_replace('/[^a-z0-9_-]/i', '', $trip_category_base) ?: 'trip-category';

        // Add query vars first (must be registered before rewrite rules)
        add_rewrite_tag('%yatra_trip_slug%', '([^&]+)');
        add_rewrite_tag('%yatra_listing_page%', '([^&]+)');
        add_rewrite_tag('%yatra_booking_page%', '([^&]+)');
        add_rewrite_tag('%yatra_booking_confirmation%', '([^&]+)');
        add_rewrite_tag('%yatra_remaining_checkout%', '([^&]+)');
        add_rewrite_tag('%yatra_verify_email%', '([^&]+)');
        // Single taxonomy page tags
        add_rewrite_tag('%yatra_destination_slug%', '([^&]+)');
        add_rewrite_tag('%yatra_activity_slug%', '([^&]+)');
        add_rewrite_tag('%yatra_category_slug%', '([^&]+)');

        // Add rewrite rule for email verification: /yatra-verify-email/{token}/
        add_rewrite_rule(
            '^yatra-verify-email/([a-zA-Z0-9_-]+)/?$',
            'index.php?yatra_verify_email=$matches[1]',
            'top'
        );

        // Add rewrite rule for trip single page: {trip_base}/{trip_slug}
        add_rewrite_rule(
            '^' . $trip_base . '/([^/]+)/?$',
            'index.php?yatra_trip_slug=$matches[1]',
            'top'
        );

        // Add rewrite rules for SINGLE taxonomy pages (must come before listing pages)
        // Single destination: /destination/{slug}/
        add_rewrite_rule(
            '^' . $destination_base . '/([^/]+)/?$',
            'index.php?yatra_destination_slug=$matches[1]',
            'top'
        );

        // Single activity: /activity/{slug}/
        add_rewrite_rule(
            '^' . $activity_base . '/([^/]+)/?$',
            'index.php?yatra_activity_slug=$matches[1]',
            'top'
        );

        // Single category: /trip-category/{slug}/
        add_rewrite_rule(
            '^' . $trip_category_base . '/([^/]+)/?$',
            'index.php?yatra_category_slug=$matches[1]',
            'top'
        );

        // Add rewrite rule for booking confirmation: book/confirmation/{id}
        add_rewrite_rule(
            '^book/confirmation/([a-zA-Z0-9_-]+)/?$',
            'index.php?yatra_booking_confirmation=$matches[1]',
            'top'
        );

        // Add rewrite rule for remaining checkout: checkout/{token}
        add_rewrite_rule(
            '^checkout/([a-zA-Z0-9_-]+)/?$',
            'index.php?yatra_remaining_checkout=$matches[1]',
            'top'
        );
    }

    /**
     * Add custom query vars for Yatra functionality
     */
    public static function addCustomQueryVars(array $vars): array
    {
        $yatra_vars = [
            'yatra_trip_slug',
            'yatra_listing_page',
            'yatra_booking_page',
            'yatra_booking_confirmation',
            'yatra_remaining_checkout',
            'yatra_verify_email',
            'yatra_destination_slug',
            'yatra_activity_slug',
            'yatra_category_slug',
        ];

        return array_merge($vars, $yatra_vars);
    }
}
