<?php

declare(strict_types=1);

namespace Yatra\Core;

use Yatra\Core\Routing\Router;
use Yatra\Core\Routing\PermalinkCanonical;
use Yatra\Core\Routing\UrlParser;
use Yatra\Core\Routing\PageContext;
use Yatra\Core\Template\FseTemplates;
use Yatra\Services\SettingsService;
use Yatra\Core\Handlers\BookingConfirmationPageHandler;

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

        // FSE Site Editor integration — virtual block templates + page-content block.
        // No-ops on classic themes.
        FseTemplates::init();

        // Prevent WP::handle_404() from marking Yatra URLs as 404 in the first place.
        // This is the proper WordPress way — fires before status_header(404) is sent and
        // before FSE locate_block_template() reads is_404() to pick 404.html.
        add_filter('pre_handle_404', [self::class, 'preventCore404'], 10, 2);

        // Strip the `error404` body class for Yatra requests so FSE themes don't apply
        // 404-specific styling to plugin pages.
        add_filter('body_class', [self::class, 'filterBodyClass'], 20);

        add_action('template_redirect', [PermalinkCanonical::class, 'enforce'], 0);

        // Initialize the main router for template handling. Handlers configure
        // $wp_query + a virtual WP_Post here and stash the chosen template in
        // PageContext; they do NOT include or exit, so the full template-loader
        // pipeline (template hierarchy resolution, wp_head, wp_footer, plugin
        // template_include hooks) continues to run normally.
        add_action('template_redirect', [self::class, 'handleTemplateRedirect'], 1);

        // Hand off to WordPress's template-loader: if a Yatra handler queued a
        // template via PageContext, swap it in here. Priority 99 ensures we run
        // after FSE's locate_block_template() (default priority 10) so we win
        // over the theme's block-template choice without disabling FSE for the
        // rest of the site.
        add_filter('template_include', [self::class, 'filterTemplateInclude'], 99);
    }

    /**
     * Short-circuit WP::handle_404() for Yatra-owned URLs.
     *
     * Returning true tells WordPress core to skip setting is_404 / status_header(404).
     * This keeps FSE/block themes from resolving to 404.html and pulling the wrong
     * header template part. The Router still runs on template_redirect to actually
     * render the page; this filter only prevents the premature 404 marking.
     *
     * @param bool      $preempt  Whether to short-circuit default 404 handling.
     * @param \WP_Query $wp_query The main WP_Query instance (unused — detection uses globals).
     * @return bool
     */
    public static function preventCore404($preempt, /** @noinspection PhpUnusedParameterInspection */ $wp_query)
    {
        if ($preempt) {
            return $preempt;
        }
        if (!self::isYatraRequest()) {
            return $preempt;
        }
        // Mirror what WP::handle_404() does on success: do NOT set is_404, but ensure
        // status header is 200 so downstream caches / CDNs behave correctly.
        status_header(200);
        nocache_headers();
        return true;
    }

    /**
     * Remove the `error404` body class for Yatra pages so FSE themes render normal page chrome.
     *
     * @param array $classes
     * @return array
     */
    public static function filterBodyClass(array $classes): array
    {
        $ctx = PageContext::instance();
        $isYatra = self::isYatraRequest() || $ctx->isHandled();
        if (!$isYatra) {
            return $classes;
        }

        $classes = array_values(array_filter($classes, static function ($c) {
            return $c !== 'error404' && $c !== 'error-404';
        }));

        if (!in_array('yatra-page', $classes, true)) {
            $classes[] = 'yatra-page';
        }

        foreach ($ctx->getBodyClasses() as $extra) {
            if (!in_array($extra, $classes, true)) {
                $classes[] = $extra;
            }
        }

        return $classes;
    }

    /**
     * Public detection helper — true when the current request belongs to a Yatra route.
     * Centralises the logic previously in shouldClear404ForYatraRouting() so it can be
     * reused by pre_handle_404 and body_class filters.
     */
    public static function isYatraRequest(): bool
    {
        return self::shouldClear404ForYatraRouting();
    }

    /**
     * `template_include` filter — choose between PHP template and FSE block template.
     *
     * Decision flow when a Yatra handler has queued a template:
     *   1. If the admin has customised the matching virtual block template in the
     *      Site Editor (wp_template post with source = 'custom'), defer to FSE —
     *      WP renders the customised block template, which embeds Yatra content
     *      via the `yatra/page-content` server block. Their edits take effect.
     *   2. Otherwise return Yatra's PHP template. It's faster, cache-friendly,
     *      and the path the plugin tested most.
     *
     * For non-Yatra requests, return $template unchanged so the theme/FSE keep control.
     */
    public static function filterTemplateInclude(string $template): string
    {
        $ctx = PageContext::instance();
        if (!$ctx->hasTemplate()) {
            return $template;
        }

        // If the admin has saved a Site-Editor customisation for this page
        // type, render via WordPress's block-template canvas with the saved
        // content. loadCustomisedCanvas() returns null if no customisation
        // exists (the common case) or returns template-canvas.php with the
        // canvas globals primed.
        $pageType = $ctx->getPageType();
        if ($pageType !== '') {
            $canvas = FseTemplates::loadCustomisedCanvas($pageType);
            if ($canvas !== null) {
                return $canvas;
            }
        }

        $selected = $ctx->getTemplate();
        return $selected !== null ? $selected : $template;
    }

    /**
     * Handle template_redirect:
     *   1. Clear residual is_404 (paged-home quirk; pre_handle_404 catches the rest).
     *   2. Run the Router — handlers configure $wp_query and queue a template.
     *   3. Fall through to WordPress's template-loader. Our template_include
     *      filter at priority 99 swaps in the Yatra template if one was queued.
     *
     * No include + exit here — that was the source of the FSE breakage.
     */
    public static function handleTemplateRedirect(): void
    {
        global $wp_query;

        if (!empty($wp_query->is_404) && self::shouldClear404ForYatraRouting()) {
            $wp_query->is_404 = false;
            status_header(200);
        }

        if (!empty($wp_query->is_404)) {
            return;
        }

        if (!self::$router) {
            self::$router = new Router();
        }

        $handled = self::$router->route();

        // Plain-permalink fallback: ?yatra_booking_confirmation=... still needs
        // an explicit dispatch because PlainPageMatcher doesn't know about it.
        if (!$handled) {
            $confirmationId = get_query_var('yatra_booking_confirmation')
                ?: ($_GET['yatra_booking_confirmation'] ?? ($_GET['reference'] ?? ($_GET['booking_id'] ?? '')));
            if (!empty($confirmationId)) {
                $handler = new BookingConfirmationPageHandler();
                $handler->handle([
                    'confirmation_id' => sanitize_text_field((string) $confirmationId),
                ]);
            }
        }

        // No exit. The selected Yatra template (if any) is in PageContext;
        // filterTemplateInclude() will return it from the template_include filter.
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
                SettingsService::getDestinationBase(),
                SettingsService::getActivityBase(),
                SettingsService::getTripCategoryBase(),
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
        $verifyPrefix = SettingsService::getPermalinkBases()['email_verification_prefix'];
        if ($verifyPath !== '' && strpos($verifyPath, $verifyPrefix . '/') === 0) {
            return true;
        }

        return (bool) apply_filters('yatra_clear_404_for_routing', false);
    }

    /**
     * Add rewrite rules for trip permalinks and listing pages
     */
    public static function addTripRewriteRules(): void
    {
        $bases = SettingsService::getPermalinkBases();
        $trip_base = $bases['trip_base'];
        $booking_base = $bases['booking_base'];
        $account_base = $bases['account_base'];
        $destination_base = $bases['destination_base'];
        $activity_base = $bases['activity_base'];
        $trip_category_base = $bases['trip_category_base'];
        $bookingConfirmSeg = $bases['booking_flow_confirmation_segment'];
        $legacyBookingConfirmation = $bases['legacy_booking_confirmation_prefix'];
        $remainingCheckout = $bases['remaining_checkout_prefix'];
        $emailVerifyPrefix = $bases['email_verification_prefix'];

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

        // Add rewrite rule for email verification: /{email_verification_prefix}/{token}/
        add_rewrite_rule(
            '^' . $emailVerifyPrefix . '/([a-zA-Z0-9_-]+)/?$',
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

        // Pageless booking confirmation: /{booking_base}/{confirmation_segment}/{reference}/ (before trip slug rule)
        add_rewrite_rule(
            '^' . $booking_base . '/' . $bookingConfirmSeg . '/([a-zA-Z0-9_-]+)/?$',
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

        // Legacy booking confirmation: /{legacy_booking_confirmation_prefix}/{reference}
        add_rewrite_rule(
            '^' . $legacyBookingConfirmation . '/([a-zA-Z0-9_-]+)/?$',
            'index.php?yatra_booking_confirmation=$matches[1]',
            'top'
        );

        // Remaining checkout: /{remaining_checkout_prefix}/{token}/
        add_rewrite_rule(
            '^' . $remainingCheckout . '/([a-zA-Z0-9_-]+)/?$',
            'index.php?yatra_remaining_checkout=$matches[1]',
            'top'
        );

        /**
         * Fires after Yatra registers its core rewrite tags/rules.
         *
         * Use {@see \Yatra\Services\SettingsService::getPermalinkBases()} for the same slugs/helpers use.
         *
         * @param array<string, string> $bases
         */
        do_action('yatra_register_rewrite_rules', $bases);
        
        // Check if rewrite rules need flushing (only flush once after plugin update/activation)
        $rewrite_version = get_option('yatra_rewrite_rules_version', '0');
        $current_version = '1.0.9'; // Increment this when rewrite rules change
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
        $pb = SettingsService::getPermalinkBases();
        $yatra_vars[] = $pb['trip_base'];
        $yatra_vars[] = $pb['destination_base'];
        $yatra_vars[] = $pb['activity_base'];
        $yatra_vars[] = $pb['trip_category_base'];

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
