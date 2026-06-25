<?php

declare(strict_types=1);

namespace Yatra\Sitemap\Integrations;

use Yatra\Sitemap\SitemapService;
use Yatra\Sitemap\SitemapRouter;

/**
 * Links Yatra's consolidated sitemap into All in One SEO's sitemap index via
 * the `aioseo_sitemap_indexes` filter — a simple URL pointer (loc/lastmod/
 * count), which is lower-risk than AIOSEO's page-object `additional_pages`
 * filter. AIOSEO then lists /yatra-sitemap.xml as a sub-sitemap in its index.
 *
 * Note: AIOSEO must have XML sitemaps enabled. Even if this index injection is
 * unavailable on a given AIOSEO version, the robots.txt advertisement still
 * exposes /yatra-sitemap.xml, so discovery is never lost.
 */
class AioseoIntegration
{
    private SitemapService $service;
    private SitemapRouter $router;

    public function __construct(SitemapService $service, SitemapRouter $router)
    {
        $this->service = $service;
        $this->router = $router;
    }

    public function register(): void
    {
        add_filter('aioseo_sitemap_indexes', [$this, 'addIndex']);
    }

    /**
     * @param mixed $indexes
     * @return array<int, array<string, mixed>>
     */
    public function addIndex($indexes): array
    {
        $indexes = is_array($indexes) ? $indexes : [];

        $indexes[] = [
            'loc' => $this->router->sitemapUrl(),
            'lastmod' => $this->service->getLatestLastmod() ?: gmdate('Y-m-d\TH:i:s+00:00'),
            'count' => $this->service->getCount(),
        ];

        return $indexes;
    }
}
