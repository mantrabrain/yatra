<?php

declare(strict_types=1);

namespace Yatra\Core;

use Yatra\Core\Routing\Router;
use Yatra\Core\Routing\PermalinkCanonical;
use Yatra\Core\Routing\UrlParser;
use Yatra\Services\SettingsService;
use Yatra\Core\Handlers\BookingConfirmationPageHandler;
use Yatra\Repositories\BookingRepository;

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

        // Early template include for booking confirmation (plain permalinks safety net)
        add_filter('template_include', [self::class, 'maybeLoadBookingConfirmationTemplate'], 0);

        add_action('template_redirect', [PermalinkCanonical::class, 'enforce'], 0);

        // Initialize the main router for template handling
        add_action('template_redirect', [self::class, 'handleTemplateRedirect'], 1);
    }

    /**
     * Early template include for booking confirmation (plain permalinks)
     */
    public static function maybeLoadBookingConfirmationTemplate(string $template): string
    {
        global $wp_query;
        if (!empty($wp_query->is_404)) {
            return $template;
        }

        $confirmationId = get_query_var('yatra_booking_confirmation')
            ?: ($_GET['yatra_booking_confirmation'] ?? ($_GET['reference'] ?? ($_GET['booking_id'] ?? '')));
        if (empty($confirmationId)) {
            return $template;
        }

        if (defined('WP_DEBUG') && WP_DEBUG) {
            }

        $bookingRepo = new BookingRepository();
        $booking = $bookingRepo->findByConfirmationSegment((string) $confirmationId);
        if (!$booking) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                }
            return $template;
        }

        // Prevent 404 and set globals
        global $wp_query;
        $wp_query->is_404 = false;
        status_header(200);
        $GLOBALS['yatra_booking'] = $booking;
        $wp_query->set('yatra_booking_confirmation', $confirmationId);
        $wp_query->set('yatra_booking', $booking);

        $template_path = YATRA_PLUGIN_PATH . 'templates/booking-confirmation.php';
        if (file_exists($template_path)) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                }
            return $template_path;
        }

        if (defined('WP_DEBUG') && WP_DEBUG) {
            }
        return $template;
    }

    /**
     * Handle template redirect using the new routing system
     */
    public static function handleTemplateRedirect(): void
    {
        global $wp_query;

        // WordPress often sets 404 for ?paged=N on the front page when the main blog query has no Nth page.
        // Yatra listings use the same query vars (?yatra_page=…&paged=2); clear 404 so routing can run.
        if (!empty($wp_query->is_404) && self::shouldClear404ForYatraRouting()) {
            $wp_query->is_404 = false;
            status_header(200);
        }

        if (!empty($wp_query->is_404)) {
            return;
        }

        // Early plain-permalink handling for booking confirmation via query var
        $confirmationId = get_query_var('yatra_booking_confirmation')
            ?: ($_GET['yatra_booking_confirmation'] ?? ($_GET['reference'] ?? ($_GET['booking_id'] ?? '')));
        if (!empty($confirmationId)) {
            $bookingRepo = new BookingRepository();
            $booking = $bookingRepo->findByConfirmationSegment((string) $confirmationId);
            if ($booking) {
                global $wp_query;
                $wp_query->is_404 = false;
                status_header(200);
                $GLOBALS['yatra_booking'] = $booking;
                $wp_query->set('yatra_booking_confirmation', $confirmationId);
                $wp_query->set('yatra_booking', $booking);
                $template_path = YATRA_PLUGIN_PATH . 'templates/booking-confirmation.php';
                if (file_exists($template_path)) {
                    include $template_path;
                    exit;
                }
            }
        }

        if (!self::$router) {
            self::$router = new Router();
        }

        // Let the router handle the request
        $handled = self::$router->route();

        // If router didn't handle it, let WordPress continue normally
        if (!$handled) {
            // Plain permalinks: routing uses ?yatra_page={base from settings} (see PlainPageMatcher).

            // Plain permalink fallback: handle ?yatra_booking_confirmation=
            if (!$handled) {
                $confirmationId = get_query_var('yatra_booking_confirmation') ?: ($_GET['yatra_booking_confirmation'] ?? '');
                if (!empty($confirmationId)) {
                    $handler = new BookingConfirmationPageHandler();
                    $handled = $handler->handle([
                        'confirmation_id' => sanitize_text_field($confirmationId),
                    ]);
                }
            }

            // Plain permalink fallback: login endpoint removed (use [yatra_login] shortcode instead)
        }

        // If still not handled, continue normally
        if (!$handled) {
            return;
        }

        // If router handled it, exit to prevent further processing
        exit;
    }

    /**
     * True when this request should be routed by Yatra even if WP marked it 404 (paged home quirk).
     */
    private static function shouldClear404ForYatraRouting(): bool
    {
        if (is_admin() || wp_doing_ajax() || wp_doing_cron()) {
            return false;
        }

        $yatraPage = isset($_GET['yatra_page']) ? trim((string) wp_unslash($_GET['yatra_page'])) : '';
        if ($yatraPage !== '') {
            return true;
        }

        $qv = (string) get_query_var('yatra_page');
        if ($qv !== '') {
            return true;
        }

        // Plain trip / taxonomy slug keys (same idea as {@see PermalinkCanonical::requestHasPlainYatraRoutingQuery})
        $tripKey = preg_replace('/[^a-zA-Z0-9_-]/', '', (string) SettingsService::getTripBase()) ?: 'trip';
        if (isset($_GET[$tripKey]) && is_string($_GET[$tripKey]) && trim(wp_unslash($_GET[$tripKey])) !== '') {
            return true;
        }

        foreach (
            [
                SettingsService::getString('destination_base', 'destination'),
                SettingsService::getString('activity_base', 'activity'),
                SettingsService::getString('trip_category_base', 'trip-category'),
            ] as $base
        ) {
            $bk = preg_replace('/[^a-zA-Z0-9_-]/', '', $base) ?: '';
            if ($bk === '' || $bk === $tripKey) {
                continue;
            }
            if (isset($_GET[$bk]) && is_string($_GET[$bk]) && trim(wp_unslash($_GET[$bk])) !== '') {
                return true;
            }
        }

        foreach (['yatra_trip', 'yatra_trip_slug', 'yatra_destination_slug', 'yatra_activity_slug', 'yatra_category_slug', 'yatra_booking_confirmation', 'yatra_verify_email'] as $key) {
            if (!isset($_GET[$key])) {
                continue;
            }
            $v = wp_unslash($_GET[$key]);
            if (is_string($v) && trim($v) !== '') {
                return true;
            }
        }

        if ((string) get_query_var('yatra_verify_email') !== '') {
            return true;
        }

        $verifyPath = trim(UrlParser::getCleanRequestPath(), '/');
        if ($verifyPath !== '' && strpos($verifyPath, 'yatra-verify-email/') === 0) {
            return true;
        }

        return (bool) apply_filters('yatra_clear_404_for_routing', false);
    }

    /**
     * Add rewrite rules for trip permalinks and listing pages
     */
    public static function addTripRewriteRules(): void
    {
        // Use centralized SettingsService for all settings
        $trip_base = SettingsService::getTripBase();
        $booking_base = SettingsService::getBookingBase();
        $account_base = SettingsService::getAccountBase();
        $account_base = preg_replace('/[^a-z0-9_-]/i', '', $account_base) ?: 'account';

        // Get other bases with sanitization
        $destination_base = SettingsService::getString('destination_base', 'destination');
        $destination_base = preg_replace('/[^a-z0-9_-]/i', '', $destination_base) ?: 'destination';

        $activity_base = SettingsService::getString('activity_base', 'activity');
        $activity_base = preg_replace('/[^a-z0-9_-]/i', '', $activity_base) ?: 'activity';

        $trip_category_base = SettingsService::getString('trip_category_base', 'trip-category');
        $trip_category_base = preg_replace('/[^a-z0-9_-]/i', '', $trip_category_base) ?: 'trip-category';

        // Add query vars first (must be registered before rewrite rules)
        // Single-trip slug query var matches trip URL base (e.g. trip=, tours=)
        add_rewrite_tag('%' . $trip_base . '%', '([^&]+)');
        add_rewrite_tag('%yatra_booking_confirmation%', '([^&]+)');
        add_rewrite_tag('%yatra_remaining_checkout%', '([^&]+)');
        add_rewrite_tag('%yatra_verify_email%', '([^&]+)');
        // Single taxonomy page tags
        add_rewrite_tag('%yatra_destination_slug%', '([^&]+)');
        add_rewrite_tag('%yatra_activity_slug%', '([^&]+)');
        add_rewrite_tag('%yatra_category_slug%', '([^&]+)');
        add_rewrite_tag('%yatra_page%', '([a-zA-Z0-9_-]+)');
        add_rewrite_tag('%paged%', '([0-9]+)');

        // Add rewrite rule for email verification: /yatra-verify-email/{token}/
        add_rewrite_rule(
            '^yatra-verify-email/([a-zA-Z0-9_-]+)/?$',
            'index.php?yatra_verify_email=$matches[1]',
            'top'
        );

        // Trip listing pagination: {trip_base}/page/{n}/
        add_rewrite_rule(
            '^' . $trip_base . '/page/([0-9]+)/?$',
            'index.php?yatra_page=' . $trip_base . '&paged=$matches[1]',
            'top'
        );

        // Trip listing (page 1): {trip_base}/
        add_rewrite_rule(
            '^' . $trip_base . '/?$',
            'index.php?yatra_page=' . $trip_base,
            'top'
        );

        // Customer account (pageless): /{account_base}/ and /{account_base}/{tab}/
        // Must be real rewrite rules so WordPress doesn't 404 before Yatra Router runs.
        add_rewrite_rule(
            '^' . $account_base . '/?$',
            'index.php?yatra_page=' . $account_base . '&yatra_account_page=dashboard',
            'top'
        );

        add_rewrite_rule(
            '^' . $account_base . '/([^/]+)/?$',
            'index.php?yatra_page=' . $account_base . '&yatra_account_page=$matches[1]',
            'top'
        );

        // Single trip: {trip_base}/{trip_slug}/
        add_rewrite_rule(
            '^' . $trip_base . '/([^/]+)/?$',
            'index.php?yatra_page=' . $trip_base . '&' . $trip_base . '=$matches[1]',
            'top'
        );

        // Taxonomy: single + pagination (yatra_page = base from settings; paged = WP pagination)
        add_rewrite_rule(
            '^' . $destination_base . '/([^/]+)/page/([0-9]+)/?$',
            'index.php?yatra_page=' . $destination_base . '&yatra_destination_slug=$matches[1]&paged=$matches[2]',
            'top'
        );

        add_rewrite_rule(
            '^' . $destination_base . '/([^/]+)/?$',
            'index.php?yatra_page=' . $destination_base . '&yatra_destination_slug=$matches[1]',
            'top'
        );

        add_rewrite_rule(
            '^' . $destination_base . '/?$',
            'index.php?yatra_page=' . $destination_base,
            'top'
        );

        add_rewrite_rule(
            '^' . $activity_base . '/([^/]+)/page/([0-9]+)/?$',
            'index.php?yatra_page=' . $activity_base . '&yatra_activity_slug=$matches[1]&paged=$matches[2]',
            'top'
        );

        add_rewrite_rule(
            '^' . $activity_base . '/([^/]+)/?$',
            'index.php?yatra_page=' . $activity_base . '&yatra_activity_slug=$matches[1]',
            'top'
        );

        add_rewrite_rule(
            '^' . $activity_base . '/?$',
            'index.php?yatra_page=' . $activity_base,
            'top'
        );

        add_rewrite_rule(
            '^' . $trip_category_base . '/([^/]+)/page/([0-9]+)/?$',
            'index.php?yatra_page=' . $trip_category_base . '&yatra_category_slug=$matches[1]&paged=$matches[2]',
            'top'
        );

        add_rewrite_rule(
            '^' . $trip_category_base . '/([^/]+)/?$',
            'index.php?yatra_page=' . $trip_category_base . '&yatra_category_slug=$matches[1]',
            'top'
        );

        add_rewrite_rule(
            '^' . $trip_category_base . '/?$',
            'index.php?yatra_page=' . $trip_category_base,
            'top'
        );

        // Pageless booking confirmation: /{booking_base}/confirmation/{reference}/ (before trip slug rule)
        add_rewrite_rule(
            '^' . $booking_base . '/confirmation/([a-zA-Z0-9_-]+)/?$',
            'index.php?yatra_booking_confirmation=$matches[1]',
            'top'
        );

        // Booking with trip slug: /{booking_base}/{trip}/
        add_rewrite_rule(
            '^' . $booking_base . '/([^/]+)/?$',
            'index.php?yatra_page=' . $booking_base . '&trip=$matches[1]',
            'top'
        );

        // Booking hub (Settings → booking base, e.g. /book/)
        add_rewrite_rule(
            '^' . $booking_base . '/?$',
            'index.php?yatra_page=' . $booking_base,
            'top'
        );

        // Add rewrite rule for booking confirmation page slug: /booking-confirmation/{reference}
        add_rewrite_rule(
            '^booking-confirmation/([a-zA-Z0-9_-]+)/?$',
            'index.php?yatra_booking_confirmation=$matches[1]',
            'top'
        );

        // Add rewrite rule for remaining checkout: /remaining-checkout/{token}/
        add_rewrite_rule(
            '^remaining-checkout/([a-zA-Z0-9_-]+)/?$',
            'index.php?yatra_remaining_checkout=$matches[1]',
            'top'
        );
        
        // Check if rewrite rules need flushing (only flush once after plugin update/activation)
        $rewrite_version = get_option('yatra_rewrite_rules_version', '0');
        $current_version = '1.0.8'; // Increment this when rewrite rules change
        if ($rewrite_version !== $current_version) {
            flush_rewrite_rules(false);
            update_option('yatra_rewrite_rules_version', $current_version);
        }
    }

    /**
     * Add custom query vars for Yatra functionality
     */
    public static function addCustomQueryVars(array $vars): array
    {
        $yatra_vars = [
            'yatra_trip', // legacy plain/pretty query var for trip slug
            'yatra_booking_confirmation',
            'yatra_remaining_checkout',
            'yatra_verify_email',
            'yatra_account_page',
            'yatra_destination_slug',
            'yatra_activity_slug',
            'yatra_category_slug',
            'yatra_page',
            'paged',
        ];

        // Add dynamic base names for plain permalink support
        $trip_base = SettingsService::getTripBase();
        $destination_base = SettingsService::getString('destination_base', 'destination');
        $activity_base = SettingsService::getString('activity_base', 'activity');
        $category_base = SettingsService::getString('trip_category_base', 'trip-category');

        $yatra_vars[] = $trip_base;
        $yatra_vars[] = $destination_base;
        $yatra_vars[] = $activity_base;
        $yatra_vars[] = $category_base;

        return array_merge($vars, $yatra_vars);
    }

    /**
     * Get client IP address
     */
    private static function getClientIp(): string
    {
        $ip_keys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
        
        foreach ($ip_keys as $key) {
            if (!empty($_SERVER[$key])) {
                $ips = explode(',', $_SERVER[$key]);
                $ip = trim($ips[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
}
