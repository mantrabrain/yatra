<?php

declare(strict_types=1);

namespace Yatra\Sitemap\Integrations;

/**
 * Links Yatra's consolidated sitemap into Rank Math's sitemap index. Like
 * Yoast, Rank Math owns sitemap generation and exposes a filterable index XML
 * string.
 */
class RankMathIntegration extends AbstractIndexIntegration
{
    public function register(): void
    {
        // Priority 11: Rank Math builds the index at the default priority (10),
        // so we append after it (per Rank Math's documented example).
        add_filter('rank_math/sitemap/index', [$this, 'append'], 11);
    }
}
