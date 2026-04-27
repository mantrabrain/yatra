<?php

declare(strict_types=1);

namespace Yatra\Core\Routing;

use Yatra\Services\SettingsService;

/**
 * Matches request paths served as path-based (pretty) URLs.
 * Used for: plain-permalink mode 404 when path looks like a plugin pretty URL, and by {@see Router}.
 */
final class PrettyRouteMatcher
{
    /**
     * @return array<string, mixed>|null Same shape as {@see Router} route_data
     */
    public static function match(string $path): ?array
    {
        $path = trim($path, '/');

        // 1. Email verification
        if (preg_match('/^yatra-verify-email\/([a-zA-Z0-9_-]+)$/', $path, $matches)) {
            return [
                'type' => 'email_verification',
                'token' => $matches[1],
            ];
        }

        // 2. Account page
        $account_base = SettingsService::getAccountBase();
        $account_route = self::matchAccountRoute($path, $account_base);
        if ($account_route !== null) {
            return $account_route;
        }

        // 3. Trip archive pagination: {trip_base}/page/{n}
        $trip_base = SettingsService::getTripBase();
        if (preg_match('/^' . preg_quote($trip_base, '/') . '\/page\/(\d+)\/?$/', $path, $matches)) {
            return [
                'type' => 'listing',
                'listing_type' => 'trip',
                'base' => $trip_base,
                'paged' => max(1, (int) $matches[1]),
            ];
        }

        // 5. Single trip
        if (preg_match('/^' . preg_quote($trip_base, '/') . '\/([^\/]+)\/?$/', $path, $matches)) {
            if ($matches[1] !== 'page') {
                return [
                    'type' => 'trip',
                    'slug' => $matches[1],
                    'base' => $trip_base,
                ];
            }
        }

        // 6. Taxonomy (pagination before single slug)
        $bases = [
            'destination' => SettingsService::getString('destination_base', 'destination'),
            'activity' => SettingsService::getString('activity_base', 'activity'),
            'category' => SettingsService::getString('trip_category_base', 'trip-category'),
        ];

        foreach ($bases as $type => $base) {
            if (preg_match('/^' . preg_quote($base, '/') . '\/([^\/]+)\/page\/(\d+)\/?$/', $path, $matches)) {
                return [
                    'type' => 'taxonomy',
                    'taxonomy_type' => $type,
                    'slug' => $matches[1],
                    'base' => $base,
                    'paged' => max(1, (int) $matches[2]),
                ];
            }
        }

        foreach ($bases as $type => $base) {
            if (preg_match('/^' . preg_quote($base, '/') . '\/([^\/]+)\/?$/', $path, $matches)) {
                return [
                    'type' => 'taxonomy',
                    'taxonomy_type' => $type,
                    'slug' => $matches[1],
                    'base' => $base,
                ];
            }
        }

        // 7. Listing roots
        foreach ($bases as $type => $base) {
            if ($path === $base) {
                return [
                    'type' => 'listing',
                    'listing_type' => $type,
                    'base' => $base,
                ];
            }
        }

        if ($path === $trip_base) {
            return [
                'type' => 'listing',
                'listing_type' => 'trip',
                'base' => $trip_base,
            ];
        }

        // 8. Booking confirmation (pageless: /{booking_base}/confirmation/{ref}/ + legacy slug)
        $booking_base = SettingsService::getBookingBase();
        if (preg_match('/^' . preg_quote($booking_base, '/') . '\/confirmation\/([a-zA-Z0-9_-]+)$/', $path, $matches)) {
            return [
                'type' => 'booking_confirmation',
                'confirmation_id' => $matches[1],
            ];
        }

        if (preg_match('/^booking-confirmation\/([a-zA-Z0-9_-]+)$/', $path, $matches)) {
            return [
                'type' => 'booking_confirmation',
                'confirmation_id' => $matches[1],
            ];
        }

        // 9. Remaining checkout (rewrite) and legacy checkout/ path
        if (preg_match('/^remaining-checkout\/([a-zA-Z0-9_-]+)$/', $path, $matches)) {
            return [
                'type' => 'checkout',
                'token' => $matches[1],
            ];
        }

        if (preg_match('/^checkout\/([a-zA-Z0-9_-]+)$/', $path, $matches)) {
            return [
                'type' => 'checkout',
                'token' => $matches[1],
            ];
        }

        // 10. Booking hub / trip booking
        if (!SettingsService::useCustomBookingPage()) {
            if (preg_match('/^' . preg_quote($booking_base, '/') . '\/([^\/]+)\/?$/', $path, $matches)) {
                return [
                    'type' => 'booking',
                    'page' => 'main',
                    'base' => $booking_base,
                    'trip' => $matches[1],
                ];
            }
            if ($path === $booking_base) {
                return [
                    'type' => 'booking',
                    'page' => 'main',
                    'base' => $booking_base,
                ];
            }
        }

        return null;
    }

    /**
     * @return array{type: string, page: string, base: string}|null
     */
    private static function matchAccountRoute(string $path, string $account_base): ?array
    {
        $path_trim = rtrim($path, '/');
        $base_trim = rtrim($account_base, '/');

        if ($path_trim === $base_trim) {
            $tab = isset($_GET['tab']) ? sanitize_key((string) $_GET['tab']) : '';

            return [
                'type' => 'account',
                'page' => self::accountQueryTabToPage($tab),
                'base' => $account_base,
            ];
        }

        $quoted = preg_quote($account_base, '/');
        if (preg_match('/^' . $quoted . '\/([^\/]+)/', $path, $m)) {
            $page = self::accountPathSegmentToPage($m[1]);
            if ($page === null) {
                return null;
            }

            return [
                'type' => 'account',
                'page' => $page,
                'base' => $account_base,
            ];
        }

        return null;
    }

    private static function accountQueryTabToPage(string $tab): string
    {
        $allowed = ['dashboard', 'bookings', 'payments', 'documents', 'profile', 'saved-trips'];
        if ($tab === '' || !in_array($tab, $allowed, true)) {
            return 'dashboard';
        }

        return $tab;
    }

    private static function accountPathSegmentToPage(string $segment): ?string
    {
        $segment = sanitize_title($segment);
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

        return $map[$segment] ?? null;
    }
}
