<?php

declare(strict_types=1);

namespace Yatra\Core\Routing;

use Yatra\Services\SettingsService;

/**
 * Enforces permalink mode: plain sites must not resolve path-based (pretty) plugin routes;
 * pretty sites redirect plain query-string routing to canonical pretty URLs.
 */
final class PermalinkCanonical
{
    public static function enforce(): void
    {
        if (!apply_filters('yatra_enforce_permalink_canonical', true)) {
            return;
        }

        if (is_admin() || wp_doing_ajax() || wp_doing_cron() || (defined('REST_REQUEST') && REST_REQUEST)) {
            return;
        }

        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        if ($method !== 'GET' && $method !== 'HEAD') {
            return;
        }

        $plain_wp = self::isPlainWordPressPermalink();

        $path = UrlParser::getCleanRequestPath();

        if ($plain_wp) {
            if ($path !== '' && PrettyRouteMatcher::match($path) !== null) {
                global $wp_query;
                $wp_query->set_404();
                status_header(404);
                nocache_headers();
            }

            return;
        }

        if (!self::requestHasPlainYatraRoutingQuery()) {
            return;
        }

        $current = self::currentRequestUrl();
        $target = self::buildPrettyCanonicalUrl();
        $target = apply_filters('yatra_permalink_canonical_redirect_target', $target, $current);

        if ($target === null || $target === '') {
            return;
        }

        $target = self::mergePreservedMarketingArgs($current, $target);

        $stripped = self::stripPlainYatraArgsFromUrl($current);
        if (self::urlsAreCanonicallyEqual($stripped, $target)) {
            return;
        }

        wp_safe_redirect($target, 301);
        exit;
    }

    public static function isPlainWordPressPermalink(): bool
    {
        return (string) get_option('permalink_structure', '') === '';
    }

    /**
     * True when the request path is the trip archive or its paged variant (e.g. /trip/, /trip/page/2/).
     * Query params {@see destination_base} / {@see activity_base} are listing filters here, not plain taxonomy routing.
     */
    private static function isTripArchivePath(): bool
    {
        $tripSeg = preg_replace('/[^a-z0-9_-]/i', '', SettingsService::getTripBase()) ?: 'trip';
        if ($tripSeg === '') {
            return false;
        }
        $cleanPath = trim(UrlParser::getCleanRequestPath(), '/');
        if ($cleanPath === $tripSeg) {
            return true;
        }

        return (bool) preg_match('/^' . preg_quote($tripSeg, '/') . '\/page\/\d+$/', $cleanPath);
    }

    /**
     * True when the request carries plain-style Yatra routing parameters (query string).
     */
    public static function requestHasPlainYatraRoutingQuery(): bool
    {
        foreach (['yatra_page', 'yatra_trip', 'yatra_trip_slug', 'yatra_destination_slug', 'yatra_activity_slug', 'yatra_category_slug',
            'yatra_booking_confirmation', 'yatra_remaining_checkout', 'yatra_verify_email'] as $key) {
            if (!isset($_GET[$key])) {
                continue;
            }
            $v = wp_unslash($_GET[$key]);
            if (is_string($v) && trim($v) !== '') {
                return true;
            }
        }

        $tripSlugKey = preg_replace('/[^a-z0-9_-]/i', '', SettingsService::getTripBase()) ?: 'trip';
        if (isset($_GET[$tripSlugKey]) && is_string($_GET[$tripSlugKey]) && trim(wp_unslash($_GET[$tripSlugKey])) !== '') {
            return true;
        }

        foreach (
            [
                SettingsService::getDestinationBase(),
                SettingsService::getActivityBase(),
                SettingsService::getTripCategoryBase(),
            ] as $base
        ) {
            $bk = preg_replace('/[^a-z0-9_-]/i', '', $base) ?: '';
            if ($bk === '' || $bk === $tripSlugKey) {
                continue;
            }
            if (isset($_GET[$bk]) && is_string($_GET[$bk]) && trim(wp_unslash($_GET[$bk])) !== '') {
                if (self::isTripArchivePath()) {
                    continue;
                }
                return true;
            }
        }

        if (!empty($_GET['reference']) && is_string($_GET['reference']) && trim(wp_unslash($_GET['reference'])) !== '') {
            return true;
        }

        $booking_base = SettingsService::getBookingBase();
        if (!empty($_GET['trip']) && is_string($_GET['trip']) && trim(wp_unslash($_GET['trip'])) !== '') {
            $yp = isset($_GET['yatra_page']) ? (string) wp_unslash($_GET['yatra_page']) : '';
            $yp = preg_replace('/[^a-z0-9_-]/i', '', $yp) ?? '';
            if ($yp === $booking_base) {
                return true;
            }
        }

        if (isset($_GET['paged']) && (int) wp_unslash($_GET['paged']) > 1) {
            return isset($_GET['yatra_page']) && is_string($_GET['yatra_page']) && trim(wp_unslash($_GET['yatra_page'])) !== '';
        }

        if (isset($_GET['page']) && (int) wp_unslash($_GET['page']) > 1) {
            return isset($_GET['yatra_page']) && is_string($_GET['yatra_page']) && trim(wp_unslash($_GET['yatra_page'])) !== '';
        }

        return false;
    }

    /**
     * Build the canonical pretty URL for the current plain query request, or null if unknown.
     */
    public static function buildPrettyCanonicalUrl(): ?string
    {
        $ref = isset($_GET['reference']) ? sanitize_text_field(wp_unslash((string) $_GET['reference'])) : '';
        $conf = isset($_GET['yatra_booking_confirmation']) ? sanitize_text_field(wp_unslash((string) $_GET['yatra_booking_confirmation'])) : '';
        $bookingRef = $conf !== '' ? $conf : $ref;
        if ($bookingRef !== '') {
            if (function_exists('yatra_get_booking_confirmation_url')) {
                return yatra_get_booking_confirmation_url($bookingRef);
            }

            return null;
        }

        $rem = isset($_GET['yatra_remaining_checkout']) ? (string) wp_unslash($_GET['yatra_remaining_checkout']) : '';
        if ($rem !== '') {
            $t = preg_replace('/[^a-zA-Z0-9_-]/', '', $rem) ?? '';
            if ($t !== '') {
                $pb = SettingsService::getPermalinkBases();

                return trailingslashit(home_url('/' . $pb['remaining_checkout_prefix'] . '/' . $t . '/'));
            }
        }

        $verify = isset($_GET['yatra_verify_email']) ? (string) wp_unslash($_GET['yatra_verify_email']) : '';
        if ($verify !== '') {
            $t = preg_replace('/[^a-zA-Z0-9_-]/', '', $verify) ?? '';
            if ($t !== '') {
                $pb = SettingsService::getPermalinkBases();

                return trailingslashit(home_url('/' . $pb['email_verification_prefix'] . '/' . $t . '/'));
            }
        }

        $trip_base = SettingsService::getTripBase();
        $booking_base = SettingsService::getBookingBase();
        $account_base = SettingsService::getAccountBase();
        $dest_base = SettingsService::getDestinationBase();
        $act_base = SettingsService::getActivityBase();
        $cat_base = SettingsService::getTripCategoryBase();

        $rawPage = isset($_GET['yatra_page']) ? trim(wp_unslash((string) $_GET['yatra_page'])) : '';
        $page = $rawPage !== '' ? (preg_replace('/[^a-z0-9_-]/i', '', $rawPage) ?? '') : '';

        $tripSlugKey = preg_replace('/[^a-z0-9_-]/i', '', $trip_base) ?: 'trip';
        $tripSlug = '';
        if (isset($_GET[$tripSlugKey])) {
            $tripSlug = \Yatra\Helpers\SlugHelper::generate(wp_unslash((string) $_GET[$tripSlugKey]));
        } elseif (isset($_GET['yatra_trip'])) {
            $tripSlug = \Yatra\Helpers\SlugHelper::generate(wp_unslash((string) $_GET['yatra_trip']));
        } elseif (isset($_GET['yatra_trip_slug'])) {
            $tripSlug = \Yatra\Helpers\SlugHelper::generate(wp_unslash((string) $_GET['yatra_trip_slug']));
        }

        if ($page === '' && $tripSlug !== '') {
            return trailingslashit(home_url('/' . $trip_base . '/' . $tripSlug . '/'));
        }

        if ($page === '') {
            if (self::isTripArchivePath()) {
                return null;
            }
            foreach (
                [
                    [$dest_base, 'yatra_destination_slug'],
                    [$act_base, 'yatra_activity_slug'],
                    [$cat_base, 'yatra_category_slug'],
                ] as [$tbase, $legacySlugKey]
            ) {
                $bk = preg_replace('/[^a-z0-9_-]/i', '', $tbase) ?: '';
                if ($bk === '' || $bk === $tripSlugKey) {
                    continue;
                }
                $s = '';
                if (isset($_GET[$bk])) {
                    $s = \Yatra\Helpers\SlugHelper::generate(wp_unslash((string) $_GET[$bk]));
                }
                if ($s === '' && isset($_GET[$legacySlugKey])) {
                    $s = \Yatra\Helpers\SlugHelper::generate(wp_unslash((string) $_GET[$legacySlugKey]));
                }
                if ($s !== '') {
                    return trailingslashit(home_url('/' . $tbase . '/' . $s . '/'));
                }
            }

            return null;
        }

        $paged = self::plainPagedFromRequest();

        if ($page === $account_base) {
            $tab = isset($_GET['tab']) ? sanitize_key((string) wp_unslash($_GET['tab'])) : '';
            $accountPage = self::accountQueryTabToPage($tab);

            return self::accountPrettyUrl($account_base, $accountPage);
        }

        if ($page === $trip_base) {
            if ($tripSlug !== '') {
                return trailingslashit(home_url('/' . $trip_base . '/' . $tripSlug . '/'));
            }
            if ($paged > 1) {
                return trailingslashit(home_url('/' . $trip_base . '/page/' . $paged . '/'));
            }

            return function_exists('yatra_get_trip_listing_url') ? yatra_get_trip_listing_url() : trailingslashit(home_url('/' . $trip_base . '/'));
        }

        if ($page === $booking_base && !SettingsService::useCustomBookingPage()) {
            $tripParam = isset($_GET['trip']) ? \Yatra\Helpers\SlugHelper::generate(wp_unslash((string) $_GET['trip'])) : '';
            if ($tripParam !== '') {
                return function_exists('yatra_get_booking_url') ? yatra_get_booking_url($tripParam) : trailingslashit(home_url('/' . $booking_base . '/' . $tripParam . '/'));
            }

            return function_exists('yatra_get_checkout_url') ? yatra_get_checkout_url() : trailingslashit(home_url('/' . $booking_base . '/'));
        }

        if ($page === $booking_base && SettingsService::useCustomBookingPage()) {
            $page_id = SettingsService::getBookingPageId();
            if ($page_id > 0) {
                $url = get_permalink((int) $page_id);
                if ($url) {
                    $tripParam = isset($_GET['trip']) ? \Yatra\Helpers\SlugHelper::generate(wp_unslash((string) $_GET['trip'])) : '';
                    if ($tripParam !== '') {
                        return add_query_arg('trip', $tripParam, $url);
                    }

                    return $url;
                }
            }

            return null;
        }

        foreach (
            [
                [$dest_base, 'yatra_destination_slug'],
                [$act_base, 'yatra_activity_slug'],
                [$cat_base, 'yatra_category_slug'],
            ] as [$base, $legacySlugKey]
        ) {
            if ($page !== $base) {
                continue;
            }
            $bk = preg_replace('/[^a-z0-9_-]/i', '', $base) ?: '';
            $slug = '';
            if ($bk !== '' && isset($_GET[$bk])) {
                $slug = \Yatra\Helpers\SlugHelper::generate(wp_unslash((string) $_GET[$bk]));
            }
            if ($slug === '' && isset($_GET[$legacySlugKey])) {
                $slug = \Yatra\Helpers\SlugHelper::generate(wp_unslash((string) $_GET[$legacySlugKey]));
            }
            $url = trailingslashit(home_url('/' . $base . '/'));
            if ($slug !== '') {
                $url = trailingslashit(home_url('/' . $base . '/' . $slug . '/'));
                if ($paged > 1) {
                    $url = trailingslashit(home_url('/' . $base . '/' . $slug . '/page/' . $paged . '/'));
                }
            } elseif ($paged > 1) {
                $url = add_query_arg('paged', (string) $paged, $url);
            }

            return $url;
        }

        return null;
    }

    private static function plainPagedFromRequest(): int
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

    private static function accountQueryTabToPage(string $tab): string
    {
        $allowed = ['dashboard', 'bookings', 'payments', 'documents', 'profile', 'saved-trips'];
        if ($tab === '' || !in_array($tab, $allowed, true)) {
            return 'dashboard';
        }

        return $tab;
    }

    private static function accountPrettyUrl(string $account_base, string $page): string
    {
        $segmentMap = [
            'dashboard' => '',
            'profile' => 'profile',
            'bookings' => 'bookings',
            'payments' => 'payments',
            'documents' => 'documents',
            'saved-trips' => 'saved-trips',
        ];
        $seg = $segmentMap[$page] ?? '';

        if ($seg === '') {
            return trailingslashit(home_url('/' . $account_base . '/'));
        }

        return trailingslashit(home_url('/' . $account_base . '/' . $seg . '/'));
    }

    private static function currentRequestUrl(): string
    {
        $scheme = is_ssl() ? 'https://' : 'http://';
        $host = isset($_SERVER['HTTP_HOST']) ? (string) $_SERVER['HTTP_HOST'] : '';
        $uri = isset($_SERVER['REQUEST_URI']) ? (string) $_SERVER['REQUEST_URI'] : '';

        return esc_url_raw($scheme . $host . $uri);
    }

    private static function urlsAreCanonicallyEqual(string $current, string $target): bool
    {
        $a = wp_parse_url($current);
        $b = wp_parse_url($target);
        if ($a === false || $b === false) {
            return false;
        }

        $pathA = isset($a['path']) ? untrailingslashit($a['path']) : '';
        $pathB = isset($b['path']) ? untrailingslashit($b['path']) : '';
        if ($pathA !== $pathB) {
            return false;
        }

        parse_str($a['query'] ?? '', $qa);
        parse_str($b['query'] ?? '', $qb);

        foreach (self::plainQueryKeysToStrip() as $k) {
            unset($qa[$k], $qb[$k]);
        }

        return $qa == $qb;
    }

    /**
     * @return list<string>
     */
    private static function plainQueryKeysToStrip(): array
    {
        $tripKey = preg_replace('/[^a-z0-9_-]/i', '', SettingsService::getTripBase()) ?: 'trip';
        $destKey = preg_replace('/[^a-z0-9_-]/i', '', SettingsService::getDestinationBase()) ?: 'destination';
        $actKey = preg_replace('/[^a-z0-9_-]/i', '', SettingsService::getActivityBase()) ?: 'activity';
        $catKey = preg_replace('/[^a-z0-9_-]/i', '', SettingsService::getTripCategoryBase()) ?: 'trip-category';

        return array_values(array_unique([
            'yatra_page',
            'yatra_trip',
            'yatra_trip_slug',
            'yatra_destination_slug',
            'yatra_activity_slug',
            'yatra_category_slug',
            'yatra_booking_confirmation',
            'yatra_remaining_checkout',
            'yatra_verify_email',
            'reference',
            'trip',
            'paged',
            'page',
            $tripKey,
            $destKey,
            $actKey,
            $catKey,
        ]));
    }

    private static function stripPlainYatraArgsFromUrl(string $url): string
    {
        $parts = wp_parse_url($url);
        if ($parts === false) {
            return $url;
        }

        parse_str($parts['query'] ?? '', $q);
        foreach (self::plainQueryKeysToStrip() as $k) {
            unset($q[$k]);
        }

        $path = $parts['path'] ?? '/';
        $scheme = isset($parts['scheme']) ? $parts['scheme'] . '://' : '';
        $host = $parts['host'] ?? '';
        $port = isset($parts['port']) ? ':' . $parts['port'] : '';
        $rebuilt = $scheme . $host . $port . $path;
        if ($q !== []) {
            $rebuilt = add_query_arg($q, $rebuilt);
        }
        if (!empty($parts['fragment'])) {
            $rebuilt .= '#' . $parts['fragment'];
        }

        return $rebuilt;
    }

    private static function mergePreservedMarketingArgs(string $current, string $target): string
    {
        $keys = apply_filters(
            'yatra_permalink_canonical_preserve_query_keys',
            ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid']
        );
        if (!is_array($keys) || $keys === []) {
            return $target;
        }

        $parts = wp_parse_url($current);
        if ($parts === false) {
            return $target;
        }
        parse_str($parts['query'] ?? '', $q);
        $extra = [];
        foreach ($keys as $k) {
            if (!is_string($k) || $k === '') {
                continue;
            }
            if (isset($q[$k]) && $q[$k] !== '' && $q[$k] !== null) {
                $extra[$k] = $q[$k];
            }
        }

        if ($extra === []) {
            return $target;
        }

        return add_query_arg($extra, $target);
    }
}
