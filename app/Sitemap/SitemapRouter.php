<?php

declare(strict_types=1);

namespace Yatra\Sitemap;

/**
 * Serves Yatra's single consolidated sitemap at /yatra-sitemap.xml — every
 * trip, destination, activity, category and listing page in one <urlset>.
 *
 * Discovery is guaranteed two ways: a rewrite rule (clean routing) and a
 * raw-path fallback in template_redirect (so it works immediately on existing
 * installs before rewrite rules are re-flushed). The URL is also added to
 * robots.txt, which every search engine honours regardless of SEO plugin.
 */
class SitemapRouter
{
    private const QUERY_VAR = 'yatra_sitemap';
    private const SLUG = 'yatra-sitemap';
    private const REWRITE_OPTION = 'yatra_sitemap_rewrite_version';
    private const REWRITE_VERSION = '2';

    private SitemapService $service;
    private SitemapRenderer $renderer;

    public function __construct(SitemapService $service, SitemapRenderer $renderer)
    {
        $this->service = $service;
        $this->renderer = $renderer;
    }

    public function register(): void
    {
        add_action('init', [$this, 'addRewriteRules']);
        add_filter('query_vars', [$this, 'addQueryVar']);
        add_action('template_redirect', [$this, 'maybeRender'], 0);
        add_filter('robots_txt', [$this, 'addToRobots'], 10, 2);
    }

    public function addRewriteRules(): void
    {
        add_rewrite_rule('^' . self::SLUG . '\.xml$', 'index.php?' . self::QUERY_VAR . '=1', 'top');

        // One-time flush so the pretty URL routes natively on existing installs
        // (new installs flush on activation). The template_redirect fallback
        // covers the window before this runs.
        if (get_option(self::REWRITE_OPTION) !== self::REWRITE_VERSION) {
            flush_rewrite_rules(false);
            update_option(self::REWRITE_OPTION, self::REWRITE_VERSION, false);
        }
    }

    /**
     * @param string[] $vars
     * @return string[]
     */
    public function addQueryVar(array $vars): array
    {
        $vars[] = self::QUERY_VAR;
        return $vars;
    }

    public function maybeRender(): void
    {
        $requested = get_query_var(self::QUERY_VAR) !== '';

        // Fallback: resolve straight off the request path when the rewrite rule
        // has not been flushed yet (or is shadowed by another plugin).
        if (!$requested) {
            $path = (string) wp_parse_url((string) ($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH);
            $requested = (bool) preg_match('~/' . self::SLUG . '\.xml$~', $path);
        }

        if (!$requested) {
            return;
        }

        if (!headers_sent()) {
            status_header(200);
            nocache_headers();
            header('Content-Type: application/xml; charset=UTF-8');
            header('X-Robots-Tag: noindex, follow', true);
        }

        echo $this->renderer->urlset($this->service->getAllEntries()); // phpcs:ignore WordPress.Security.EscapeOutput -- renderer escapes each node.
        exit;
    }

    /**
     * Absolute URL of the sitemap (robots.txt, admin UI, SEO integrations).
     * Static so callers don't need to build the service/renderer just for a URL.
     */
    public static function sitemapUrl(): string
    {
        // Plain permalinks: fall back to the query-var form, which always works.
        if (get_option('permalink_structure') === '') {
            return add_query_arg(self::QUERY_VAR, '1', home_url('/'));
        }

        return home_url('/' . self::SLUG . '.xml');
    }

    /**
     * @param string $output Existing robots.txt body.
     * @param bool   $public Whether the site is set to be indexed.
     */
    public function addToRobots(string $output, $public): string
    {
        if (!$public) {
            return $output;
        }

        return rtrim($output) . "\nSitemap: " . esc_url(self::sitemapUrl()) . "\n";
    }
}
