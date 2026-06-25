<?php

declare(strict_types=1);

namespace Yatra\Sitemap\Integrations;

use Yatra\Sitemap\SitemapService;

/**
 * Feeds Yatra URLs into WordPress core sitemaps (wp-sitemap.xml), used when no
 * third-party SEO plugin has taken over sitemap generation. Flat provider (no
 * subtypes): all Yatra URLs appear under a single wp-sitemap-yatra-N.xml,
 * mirroring the consolidated /yatra-sitemap.xml.
 *
 * Only referenced after WP_Sitemaps_Provider is confirmed loaded (see
 * SitemapManager), so extending the core class is safe.
 */
class CoreProvider extends \WP_Sitemaps_Provider
{
    private SitemapService $service;

    public function __construct(SitemapService $service)
    {
        $this->service = $service;
        $this->name = 'yatra';
        $this->object_type = 'yatra';
    }

    /**
     * @param int    $page_number
     * @param string $object_subtype
     * @return array<int, array{loc: string, lastmod: string}>
     */
    public function get_url_list($page_number, $object_subtype = ''): array
    {
        $entries = $this->service->getAllEntries();

        $perPage = $this->maxUrls();
        $offset = ((int) $page_number - 1) * $perPage;

        $list = [];
        foreach (array_slice($entries, $offset, $perPage) as $entry) {
            // Core's renderer reads 'loc'; lastmod is surfaced only if a site
            // opts in via the wp_sitemaps_index_entry filter.
            $list[] = ['loc' => $entry['loc'], 'lastmod' => $entry['lastmod']];
        }

        return $list;
    }

    /**
     * @param string $object_subtype
     */
    public function get_max_num_pages($object_subtype = ''): int
    {
        $count = $this->service->getCount();
        if ($count === 0) {
            return 0;
        }

        return (int) ceil($count / $this->maxUrls());
    }

    private function maxUrls(): int
    {
        $max = function_exists('wp_sitemaps_get_max_urls')
            ? (int) wp_sitemaps_get_max_urls($this->object_type)
            : 2000;

        return $max > 0 ? $max : 2000;
    }
}
