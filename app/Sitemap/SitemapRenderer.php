<?php

declare(strict_types=1);

namespace Yatra\Sitemap;

/**
 * Renders sitemaps.org XML.
 *
 *  - urlset():        the consolidated /yatra-sitemap.xml document.
 *  - indexEntries():  a single <sitemap> pointer to that file, for injecting
 *                     into an SEO plugin's sitemap index (Yoast, Rank Math).
 *
 * Pure string output — no I/O, no platform coupling. Every node is escaped.
 */
class SitemapRenderer
{
    /**
     * A <urlset> document.
     *
     * @param array<int, array{loc: string, lastmod: string}> $entries
     */
    public function urlset(array $entries): string
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        foreach ($entries as $entry) {
            $loc = (string) ($entry['loc'] ?? '');
            if ($loc === '') {
                continue;
            }
            $xml .= "\t<url>\n";
            $xml .= "\t\t<loc>" . esc_url($loc) . "</loc>\n";
            $lastmod = (string) ($entry['lastmod'] ?? '');
            if ($lastmod !== '') {
                $xml .= "\t\t<lastmod>" . esc_html($lastmod) . "</lastmod>\n";
            }
            $xml .= "\t</url>\n";
        }

        $xml .= '</urlset>' . "\n";

        return $xml;
    }

    /**
     * One or more inner <sitemap> nodes — for injecting into another plugin's
     * sitemap index (Yoast, Rank Math) without our document wrapper.
     *
     * @param array<int, array{loc: string, lastmod: string}> $sitemaps
     */
    public function indexEntries(array $sitemaps): string
    {
        $xml = '';
        foreach ($sitemaps as $sitemap) {
            $loc = (string) ($sitemap['loc'] ?? '');
            if ($loc === '') {
                continue;
            }
            $xml .= "\t<sitemap>\n";
            $xml .= "\t\t<loc>" . esc_url($loc) . "</loc>\n";
            $lastmod = (string) ($sitemap['lastmod'] ?? '');
            if ($lastmod !== '') {
                $xml .= "\t\t<lastmod>" . esc_html($lastmod) . "</lastmod>\n";
            }
            $xml .= "\t</sitemap>\n";
        }

        return $xml;
    }
}
