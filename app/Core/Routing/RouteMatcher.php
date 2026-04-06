<?php

declare(strict_types=1);

namespace Yatra\Core\Routing;

use Yatra\Services\SettingsService;

/**
 * Route Matcher for determining which page handler should handle a request
 *
 * Centralizes route matching logic that was scattered across handler methods
 */
class RouteMatcher
{
    /**
     * Match account page route
     *
     * @param string $path Request path
     * @return array|null Route data or null if no match
     */
    public static function matchAccountPage(string $path): ?array
    {
        $account_base = SettingsService::getAccountBase();
        $path_trim = rtrim($path, '/');
        $base_trim = rtrim($account_base, '/');

        if ($path_trim === $base_trim) {
            $tab = isset($_GET['tab']) ? sanitize_key((string) $_GET['tab']) : '';
            $allowed = ['dashboard', 'bookings', 'payments', 'documents', 'profile', 'saved-trips'];
            $page = ($tab !== '' && in_array($tab, $allowed, true)) ? $tab : 'dashboard';

            return [
                'type' => 'account',
                'page' => $page,
                'base' => $account_base,
            ];
        }

        $slug = UrlParser::extractSlugFromPath($path, $account_base);
        if (!$slug) {
            return null;
        }

        $slug = sanitize_title($slug);
        $map = [
            'dashboard' => 'dashboard',
            'profile' => 'profile',
            'bookings' => 'bookings',
            'payments' => 'payments',
            'documents' => 'documents',
            'support' => 'dashboard',
            'saved-trips' => 'saved-trips',
            'wishlist' => 'saved-trips',
            'settings' => 'profile',
        ];
        $page = $map[$slug] ?? null;
        if ($page === null) {
            return null;
        }

        return [
            'type' => 'account',
            'page' => $page,
            'base' => $account_base,
        ];
    }

    /**
     * Match trip single page route
     *
     * @param string $path Request path
     * @return array|null Route data or null if no match
     */
    public static function matchTripPage(string $path): ?array
    {
        $trip_base = SettingsService::getTripBase();
        $slug = UrlParser::extractSlugFromPath($path, $trip_base);

        if ($slug) {
            return [
                'type' => 'trip',
                'slug' => $slug,
                'base' => $trip_base
            ];
        }

        return null;
    }

    /**
     * Match listing page route
     *
     * @param string $path Request path
     * @return array|null Route data or null if no match
     */
    public static function matchListingPage(string $path): ?array
    {
        $bases = [
            'destination' => SettingsService::getString('destination_base', 'destination'),
            'activity' => SettingsService::getString('activity_base', 'activity'),
            'category' => SettingsService::getString('trip_category_base', 'trip-category'),
        ];

        foreach ($bases as $type => $base) {
            if ($path === $base) {
                return [
                    'type' => 'listing',
                    'listing_type' => $type,
                    'base' => $base
                ];
            }
        }

        return null;
    }

    /**
     * Match taxonomy single page route
     *
     * @param string $path Request path
     * @return array|null Route data or null if no match
     */
    public static function matchTaxonomyPage(string $path): ?array
    {
        $bases = [
            'destination' => SettingsService::getString('destination_base', 'destination'),
            'activity' => SettingsService::getString('activity_base', 'activity'),
            'category' => SettingsService::getString('trip_category_base', 'trip-category'),
        ];

        foreach ($bases as $type => $base) {
            $slug = UrlParser::extractSlugFromPath($path, $base);
            if ($slug) {
                return [
                    'type' => 'taxonomy',
                    'taxonomy_type' => $type,
                    'slug' => $slug,
                    'base' => $base
                ];
            }
        }

        return null;
    }

    /**
     * Match booking page route
     *
     * @param string $path Request path
     * @return array|null Route data or null if no match
     */
    public static function matchBookingPage(string $path): ?array
    {
        $booking_base = SettingsService::getBookingBase();

        if ($path === $booking_base && !SettingsService::useCustomBookingPage()) {
            return [
                'type' => 'booking',
                'page' => 'main',
                'base' => $booking_base
            ];
        }

        return null;
    }

    /**
     * Match booking confirmation page route
     *
     * @param string $path Request path
     * @return array|null Route data or null if no match
     */
    public static function matchBookingConfirmationPage(string $path): ?array
    {
        // Try /book/confirmation/{token} pattern first
        $token = UrlParser::extractTokenFromPath($path, '/^book\/confirmation\/([a-zA-Z0-9_-]+)$/');
        
        if ($token) {
            return [
                'type' => 'booking_confirmation',
                'confirmation_id' => $token
            ];
        }
        
        // Try /booking-confirmation/{token} pattern
        $token = UrlParser::extractTokenFromPath($path, '/^booking-confirmation\/([a-zA-Z0-9_-]+)$/');
        
        if ($token) {
            return [
                'type' => 'booking_confirmation',
                'confirmation_id' => $token
            ];
        }
        
        // Try /booking-confirmation?booking_id={token} pattern (query parameter)
        if (strpos($path, 'booking-confirmation') !== false) {
            $booking_id = $_GET['booking_id'] ?? null;
            if ($booking_id) {
                return [
                    'type' => 'booking_confirmation',
                    'confirmation_id' => $booking_id
                ];
            }
        }

        return null;
    }

    /**
     * Match checkout page route
     *
     * @param string $path Request path
     * @return array|null Route data or null if no match
     */
    public static function matchCheckoutPage(string $path): ?array
    {
        $token = UrlParser::extractTokenFromPath($path, '/^checkout\/([a-zA-Z0-9_-]+)$/');

        if ($token) {
            return [
                'type' => 'checkout',
                'token' => $token
            ];
        }

        return null;
    }

    /**
     * Match email verification route
     *
     * @param string $path Request path
     * @return array|null Route data or null if no match
     */
    public static function matchEmailVerification(string $path): ?array
    {
        $token = UrlParser::extractTokenFromPath($path, '/^yatra-verify-email\/([a-zA-Z0-9_-]+)$/');

        if ($token) {
            return [
                'type' => 'email_verification',
                'token' => $token
            ];
        }

        return null;
    }
}
