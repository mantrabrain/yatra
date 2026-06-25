<?php

declare(strict_types=1);

namespace Yatra\Sitemap\Integrations;

/**
 * Links Yatra's consolidated sitemap into Yoast SEO's index
 * (sitemap_index.xml). Yoast disables WordPress core sitemaps, so without this
 * Yatra would only be discoverable via robots.txt, not inside Yoast's index.
 */
class YoastIntegration extends AbstractIndexIntegration
{
    public function register(): void
    {
        add_filter('wpseo_sitemap_index', [$this, 'append']);
    }
}
