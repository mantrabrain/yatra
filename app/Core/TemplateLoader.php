<?php

declare(strict_types=1);

namespace Yatra\Core;

use Yatra\Core\Routing\Router;
use Yatra\Services\SettingsService;
use Yatra\Core\Handlers\TripPageHandler;
use Yatra\Core\Handlers\TaxonomyPageHandler;
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

        // Initialize the main router for template handling
        add_action('template_redirect', [self::class, 'handleTemplateRedirect'], 1);
    }

    /**
     * Early template include for booking confirmation (plain permalinks)
     */
    public static function maybeLoadBookingConfirmationTemplate(string $template): string
    {
        $confirmationId = get_query_var('yatra_booking_confirmation') ?: ($_GET['yatra_booking_confirmation'] ?? ($_GET['reference'] ?? ''));
        if (empty($confirmationId)) {
            return $template;
        }

        if (defined('WP_DEBUG') && WP_DEBUG) {
            }

        $bookingRepo = new BookingRepository();
        $booking = $bookingRepo->findByReferenceWithTrip($confirmationId) ?: $bookingRepo->findByReference($confirmationId);
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
        // Early plain-permalink handling for booking confirmation via query var
        $confirmationId = get_query_var('yatra_booking_confirmation') ?: ($_GET['yatra_booking_confirmation'] ?? ($_GET['reference'] ?? ''));
        if (!empty($confirmationId)) {
            $bookingRepo = new BookingRepository();
            $booking = $bookingRepo->findByReferenceWithTrip($confirmationId) ?: $bookingRepo->findByReference($confirmationId);
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
            // Get dynamic bases for plain permalink support
            $trip_base = SettingsService::getTripBase();
            $destination_base = SettingsService::getString('destination_base', 'destination');
            $activity_base = SettingsService::getString('activity_base', 'activity');
            $category_base = SettingsService::getString('trip_category_base', 'trip-category');

            // Plain permalink fallback: handle ?yatra_trip_slug= or ?{trip_base}= requests
            $slug = get_query_var('yatra_trip_slug') ?: (get_query_var($trip_base) ?: ($_GET['yatra_trip_slug'] ?? ($_GET[$trip_base] ?? '')));
            if (!empty($slug)) {
                $handler = new TripPageHandler();
                $handled = $handler->handle([
                    'type' => 'trip',
                    'slug' => sanitize_title($slug),
                    'base' => $trip_base,
                ]);
            }

            // Plain permalink fallback: handle ?yatra_activity_slug= or ?{activity_base}= requests
            if (!$handled) {
                $slug = get_query_var('yatra_activity_slug') ?: (get_query_var($activity_base) ?: ($_GET['yatra_activity_slug'] ?? ($_GET[$activity_base] ?? '')));
                if (!empty($slug)) {
                    $handler = new TaxonomyPageHandler();
                    $handled = $handler->handle([
                        'type' => 'taxonomy',
                        'taxonomy_type' => 'activity',
                        'slug' => sanitize_title($slug),
                        'base' => $activity_base,
                    ]);
                }
            }

            // Plain permalink fallback: handle ?yatra_destination_slug= or ?{destination_base}= requests
            if (!$handled) {
                $slug = get_query_var('yatra_destination_slug') ?: (get_query_var($destination_base) ?: ($_GET['yatra_destination_slug'] ?? ($_GET[$destination_base] ?? '')));
                if (!empty($slug)) {
                    $handler = new TaxonomyPageHandler();
                    $handled = $handler->handle([
                        'type' => 'taxonomy',
                        'taxonomy_type' => 'destination',
                        'slug' => sanitize_title($slug),
                        'base' => $destination_base,
                    ]);
                }
            }

            // Plain permalink fallback: handle ?yatra_category_slug= or ?{category_base}= requests
            if (!$handled) {
                $slug = get_query_var('yatra_category_slug') ?: (get_query_var($category_base) ?: ($_GET['yatra_category_slug'] ?? ($_GET[$category_base] ?? '')));
                if (!empty($slug)) {
                    $handler = new TaxonomyPageHandler();
                    $handled = $handler->handle([
                        'type' => 'taxonomy',
                        'taxonomy_type' => 'category',
                        'slug' => sanitize_title($slug),
                        'base' => $category_base,
                    ]);
                }
            }

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

            // Plain permalink fallback: handle ?yatra_login_page= or login requests
            if (!$handled) {
                $loginPage = get_query_var('yatra_login_page') ?: ($_GET['yatra_login_page'] ?? '');
                if (!empty($loginPage)) {
                    try {
                        // Security: Validate login page request
                        if ($this->validateLoginRequest()) {
                            $handler = new \Yatra\Core\Handlers\LoginPageHandler();
                            $handled = $handler->handle([]);
                        } else {
                            // Log security violation
                            if (defined('WP_DEBUG') && WP_DEBUG) {
                                error_log('Yatra TemplateLoader: Invalid login request detected from IP: ' . $this->getClientIp());
                            }
                        }
                    } catch (Exception $e) {
                        // Log error for debugging
                        if (defined('WP_DEBUG') && WP_DEBUG) {
                            error_log('Yatra TemplateLoader Login Handler Error: ' . $e->getMessage());
                        }
                        
                        // Fallback to default behavior
                        $handled = false;
                    }
                }
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
        add_rewrite_tag('%yatra_login_page%', '([^&]+)');
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

        // Add rewrite rule for login page: /login
        add_rewrite_rule(
            '^login/?$',
            'index.php?yatra_login_page=1',
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

        // Add rewrite rule for booking confirmation page slug: /booking-confirmation/{reference}
        add_rewrite_rule(
            '^booking-confirmation/([a-zA-Z0-9_-]+)/?$',
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
            'yatra_login_page',
            'yatra_destination_slug',
            'yatra_activity_slug',
            'yatra_category_slug',
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
     * Validate login page request for security
     */
    private function validateLoginRequest(): bool
    {
        // Check request method
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            return false;
        }

        // Check for suspicious parameters
        $suspicious_params = ['exec', 'system', 'eval', 'passthru', 'shell_exec'];
        foreach ($suspicious_params as $param) {
            if (isset($_GET[$param]) || isset($_POST[$param])) {
                return false;
            }
        }

        // Rate limiting check
        $ip = $this->getClientIp();
        $transient_key = 'yatra_login_request_limit_' . md5($ip);
        $requests = get_transient($transient_key) ?: 0;
        
        // Allow 50 requests per 10 minutes
        if ($requests >= 50) {
            return false;
        }
        
        set_transient($transient_key, $requests + 1, 10 * MINUTE_IN_SECONDS);
        
        return true;
    }

    /**
     * Get client IP address
     */
    private function getClientIp(): string
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
