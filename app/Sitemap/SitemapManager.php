<?php

declare(strict_types=1);

namespace Yatra\Sitemap;

use Yatra\Services\SettingsService;
use Yatra\Sitemap\Integrations\AioseoIntegration;
use Yatra\Sitemap\Integrations\CoreProvider;
use Yatra\Sitemap\Integrations\RankMathIntegration;
use Yatra\Sitemap\Integrations\YoastIntegration;

/**
 * Boots Yatra's sitemap and wires it into whatever generates sitemaps on the
 * site.
 *
 * Yatra trips/classifications live in custom tables, so no sitemap generator
 * can discover them on its own. Strategy:
 *
 *   1. Serve ONE consolidated sitemap at /yatra-sitemap.xml and advertise it in
 *      robots.txt — the universal baseline that works with any/no SEO plugin.
 *   2. Additionally register that one sitemap with whichever system owns the
 *      site's sitemap so it also appears in their index: Yoast, Rank Math or
 *      AIOSEO if present, otherwise WordPress core sitemaps.
 *
 * Exactly one third-party integration is wired (they are mutually exclusive in
 * practice — each disables the others' / core sitemaps), so the sitemap is
 * never listed twice within a single index.
 */
class SitemapManager
{
    private static bool $booted = false;

    public static function init(): void
    {
        if (self::$booted) {
            return;
        }
        self::$booted = true;

        // On by default; user-controllable via the SEO settings toggle and the
        // `yatra_sitemap_enabled` filter. `enable_sitemap` is registered in
        // SettingsService defaults (true), so isEnabled() reflects a saved
        // false correctly.
        $enabled = !class_exists(SettingsService::class) || SettingsService::isEnabled('enable_sitemap');
        if (!apply_filters('yatra_sitemap_enabled', $enabled)) {
            return;
        }

        $service = new SitemapService();
        $renderer = new SitemapRenderer();
        $router = new SitemapRouter($service, $renderer);

        // Canonical, always-on Yatra sitemap + robots.txt advertisement.
        $router->register();

        // Native integration with the active sitemap owner.
        self::registerActiveIntegration($service, $router, $renderer);

        // Keep the cached URL list fresh on content changes.
        foreach (['yatra_trip_created', 'yatra_trip_updated', 'yatra_trip_deleted'] as $hook) {
            add_action($hook, [SitemapService::class, 'flushCache']);
        }
    }

    private static function registerActiveIntegration(
        SitemapService $service,
        SitemapRouter $router,
        SitemapRenderer $renderer
    ): void {
        if (defined('WPSEO_VERSION') || class_exists('WPSEO_Sitemaps')) {
            (new YoastIntegration($service, $router, $renderer))->register();
            return;
        }

        if (defined('RANK_MATH_VERSION') || class_exists('RankMath\\Helper')) {
            (new RankMathIntegration($service, $router, $renderer))->register();
            return;
        }

        if (defined('AIOSEO_VERSION') || function_exists('aioseo')) {
            (new AioseoIntegration($service, $router))->register();
            return;
        }

        // No third-party SEO plugin: integrate with WordPress core sitemaps.
        $registerCore = static function () use ($service): void {
            if (!function_exists('wp_register_sitemap_provider')) {
                return; // Core sitemaps disabled or WP < 5.5.
            }
            if (function_exists('wp_sitemaps_get_server')) {
                wp_sitemaps_get_server(); // ensure base provider class is loaded
            }
            if (class_exists('WP_Sitemaps_Provider')) {
                wp_register_sitemap_provider('yatra', new CoreProvider($service));
            }
        };

        // Providers can boot before OR after `init` depending on the load path,
        // so register immediately when `init` already fired, otherwise hook it.
        if (did_action('init')) {
            $registerCore();
        } else {
            add_action('init', $registerCore, 20);
        }
    }
}
