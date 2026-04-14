<?php

declare(strict_types=1);

namespace Yatra\Core\Routing;

use Yatra\Services\SettingsService;

/**
 * Resolves storefront routes when WordPress uses plain permalinks (?p=…).
 * Primary discriminator: {@see query_var `yatra_page`} — value matches saved URL bases from settings
 * (trip_base, booking_base, destination_base, activity_base, trip_category_base).
 *
 * Single trip (plain) may also be requested as ?{trip_base}=slug (same segment as the trip URL base)
 * without yatra_page. Legacy: ?yatra_trip= / ?yatra_trip_slug=.
 *
 * Taxonomy singles use the same pattern: ?{destination_base}=slug, ?{activity_base}=slug,
 * ?{trip_category_base}=slug. Legacy: ?yatra_page={base}&yatra_*_slug=slug still supported.
 */
final class PlainPageMatcher
{
    /**
     * @return array<string, mixed>|null Route data compatible with {@see Router::handleRouteData()}
     */
    public static function match(): ?array
    {
        // Plain-style query routing (?yatra_page=activity&paged=2) must run even when the site uses
        // pretty permalinks — pagination links use home_url('/') + query args. Without this, the router
        // never sees those URLs and WordPress may 404 on paged front-page requests.

        $trip_base = self::sanitizeBaseSegment(SettingsService::getTripBase());
        $booking_base = self::sanitizeBaseSegment(SettingsService::getBookingBase());
        $dest_base = self::permalinkBase('destination_base', 'destination');
        $act_base = self::permalinkBase('activity_base', 'activity');
        $cat_base = self::permalinkBase('trip_category_base', 'trip-category');

        $raw = $_GET['yatra_page'] ?? '';
        $raw = is_string($raw) ? trim(wp_unslash($raw)) : '';

        // Plain single trip: ?{trip_base}=slug (legacy ?yatra_trip= / ?yatra_trip_slug=)
        $trip_slug_only = self::getTripSlugFromRequest();
        if ($trip_slug_only !== '' && $raw === '') {
            return [
                'type' => 'trip',
                'slug' => $trip_slug_only,
                'base' => $trip_base,
            ];
        }

        if ($raw === '') {
            // On pretty permalinks, trip listing is /{trip_base}/?destination=…&activity=… — those keys
            // match taxonomy plain routing below and must NOT be treated as /{destination_base}/slug/ singles.
            $tripSeg = self::sanitizeBaseSegment($trip_base);
            $cleanPath = trim((string) UrlParser::getCleanRequestPath(), '/');
            $taxPlain = null;
            if (!self::isTripArchiveRequestPath($cleanPath, $tripSeg)) {
                $taxPlain = self::matchTaxonomyPlainBaseSlugs(
                    $tripSeg,
                    $dest_base,
                    $act_base,
                    $cat_base
                );
            }
            if ($taxPlain !== null) {
                return $taxPlain;
            }
        }

        if ($raw === '') {
            if (!empty($_GET['yatra_login_page'])) {
                return [
                    'type' => 'login',
                    'page' => 'main',
                    'base' => 'login',
                ];
            }

            $checkoutToken = isset($_GET['yatra_remaining_checkout']) ? (string) wp_unslash($_GET['yatra_remaining_checkout']) : '';
            $checkoutToken = preg_replace('/[^a-zA-Z0-9_-]/', '', $checkoutToken) ?? '';
            if ($checkoutToken !== '') {
                return [
                    'type' => 'checkout',
                    'token' => $checkoutToken,
                ];
            }

            return null;
        }

        $page = self::sanitizeBaseSegment($raw);
        if ($page === '') {
            return null;
        }

        if ($page === $booking_base && !SettingsService::useCustomBookingPage()) {
            return [
                'type' => 'booking',
                'page' => 'main',
                'base' => $booking_base,
            ];
        }

        $account_base = self::sanitizeBaseSegment(SettingsService::getAccountBase());
        if ($page === $account_base) {
            $tab = isset($_GET['tab']) ? sanitize_key((string) $_GET['tab']) : '';

            return [
                'type' => 'account',
                'page' => self::accountTabToPage($tab),
                'base' => SettingsService::getAccountBase(),
            ];
        }

        if ($page === $trip_base) {
            $slug = self::getTripSlugFromRequest();
            if ($slug !== '') {
                return [
                    'type' => 'trip',
                    'slug' => $slug,
                    'base' => $trip_base,
                ];
            }

            $paged = self::currentPaged();

            return [
                'type' => 'listing',
                'listing_type' => 'trip',
                'base' => $trip_base,
                'paged' => $paged,
            ];
        }

        if ($page === $dest_base) {
            return self::matchTaxonomy('destination', $dest_base, 'yatra_destination_slug');
        }

        if ($page === $act_base) {
            return self::matchTaxonomy('activity', $act_base, 'yatra_activity_slug');
        }

        if ($page === $cat_base) {
            return self::matchTaxonomy('category', $cat_base, 'yatra_category_slug');
        }

        return null;
    }

    private static function matchTaxonomy(string $taxonomyType, string $base, string $legacySlugKey): ?array
    {
        $baseKey = self::sanitizeBaseSegment($base);
        $slug = '';
        if ($baseKey !== '') {
            $fromBase = $_GET[$baseKey] ?? null;
            if (is_string($fromBase)) {
                $slug = sanitize_title(wp_unslash($fromBase));
            }
        }
        if ($slug === '') {
            $legacy = $_GET[$legacySlugKey] ?? '';
            $slug = is_string($legacy) ? sanitize_title(wp_unslash($legacy)) : '';
        }
        if ($slug !== '') {
            return [
                'type' => 'taxonomy',
                'taxonomy_type' => $taxonomyType,
                'slug' => $slug,
                'base' => $base,
                'paged' => self::currentPaged(),
            ];
        }

        return [
            'type' => 'listing',
            'listing_type' => $taxonomyType,
            'base' => $base,
            'paged' => self::currentPaged(),
        ];
    }

    /**
     * Plain taxonomy singles: ?{destination_base}=slug (no yatra_page), same idea as trip.
     * Skips keys identical to trip_base so ?trip= only resolves as a trip.
     *
     * @return array<string, mixed>|null
     */
    /**
     * Trip archive (or /{trip_base}/page/N/) — query params like ?destination= are filters, not taxonomy singles.
     */
    private static function isTripArchiveRequestPath(string $cleanPath, string $tripBaseSanitized): bool
    {
        if ($tripBaseSanitized === '') {
            return false;
        }
        if ($cleanPath === $tripBaseSanitized) {
            return true;
        }

        return (bool) preg_match('/^' . preg_quote($tripBaseSanitized, '/') . '\/page\/\d+$/', $cleanPath);
    }

    private static function matchTaxonomyPlainBaseSlugs(
        string $trip_base_sanitized,
        string $dest_base,
        string $act_base,
        string $cat_base
    ): ?array {
        $pairs = [
            [self::sanitizeBaseSegment($dest_base), 'destination'],
            [self::sanitizeBaseSegment($act_base), 'activity'],
            [self::sanitizeBaseSegment($cat_base), 'category'],
        ];
        foreach ($pairs as [$b, $taxType]) {
            if ($b === '' || $b === $trip_base_sanitized) {
                continue;
            }
            if (!isset($_GET[$b])) {
                continue;
            }
            $raw = $_GET[$b];
            $slug = is_string($raw) ? sanitize_title(wp_unslash($raw)) : '';
            if ($slug === '') {
                continue;
            }

            return [
                'type' => 'taxonomy',
                'taxonomy_type' => $taxType,
                'slug' => $slug,
                'base' => $b,
                'paged' => self::currentPaged(),
            ];
        }

        return null;
    }

    private static function accountTabToPage(string $tab): string
    {
        $allowed = ['dashboard', 'bookings', 'payments', 'documents', 'profile', 'saved-trips'];
        if ($tab === '' || !in_array($tab, $allowed, true)) {
            return 'dashboard';
        }

        return $tab;
    }

    private static function getTripSlugFromRequest(): string
    {
        $key = self::tripSlugQueryKey();
        $slug = $_GET[$key] ?? $_GET['yatra_trip'] ?? $_GET['yatra_trip_slug'] ?? '';
        $slug = is_string($slug) ? sanitize_title(wp_unslash($slug)) : '';

        return $slug;
    }

    /**
     * Query parameter name for single-trip slug in plain mode — matches {@see SettingsService::getTripBase()}.
     */
    private static function tripSlugQueryKey(): string
    {
        $b = self::sanitizeBaseSegment(SettingsService::getTripBase());

        return $b !== '' ? $b : 'trip';
    }

    private static function currentPaged(): int
    {
        $p = get_query_var('paged');
        if ($p !== '' && $p !== null) {
            return max(1, (int) $p);
        }

        if (isset($_GET['paged'])) {
            return max(1, (int) wp_unslash($_GET['paged']));
        }

        if (isset($_GET['page'])) {
            return max(1, (int) wp_unslash($_GET['page']));
        }

        return 1;
    }

    private static function sanitizeBaseSegment(string $value): string
    {
        $value = preg_replace('/[^a-z0-9_-]/i', '', $value) ?? '';

        return $value;
    }

    private static function permalinkBase(string $optionKey, string $default): string
    {
        $raw = SettingsService::getString($optionKey, $default);
        $sanitized = preg_replace('/[^a-z0-9_-]/i', '', $raw) ?? '';

        return $sanitized !== '' ? $sanitized : $default;
    }
}
