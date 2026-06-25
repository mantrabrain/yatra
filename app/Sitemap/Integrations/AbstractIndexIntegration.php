<?php

declare(strict_types=1);

namespace Yatra\Sitemap\Integrations;

use Yatra\Sitemap\SitemapRenderer;
use Yatra\Sitemap\SitemapRouter;
use Yatra\Sitemap\SitemapService;

/**
 * Shared base for SEO plugins whose sitemap index is a filterable XML string
 * (Yoast, Rank Math). We append a single <sitemap> node pointing at Yatra's
 * own consolidated /yatra-sitemap.xml, so the plugin's index links to our one
 * file without us re-implementing its rendering.
 */
abstract class AbstractIndexIntegration
{
    protected SitemapService $service;
    protected SitemapRouter $router;
    protected SitemapRenderer $renderer;

    public function __construct(SitemapService $service, SitemapRouter $router, SitemapRenderer $renderer)
    {
        $this->service = $service;
        $this->router = $router;
        $this->renderer = $renderer;
    }

    abstract public function register(): void;

    /**
     * @param mixed $output Existing index XML (string).
     */
    public function append($output): string
    {
        $pointer = $this->renderer->indexEntries([
            ['loc' => $this->router->sitemapUrl(), 'lastmod' => $this->service->getLatestLastmod()],
        ]);

        return (string) $output . $pointer;
    }
}
