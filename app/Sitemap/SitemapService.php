<?php

declare(strict_types=1);

namespace Yatra\Sitemap;

use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Database\Tables\TripsTable;

/**
 * Single source of truth for every public Yatra URL that belongs in a sitemap.
 *
 * Yatra stores trips and classifications (destinations / activities /
 * categories) in custom tables, not as WordPress posts, so no sitemap
 * generator (WP core, Yoast, Rank Math, AIOSEO) can discover them on its own.
 * This service enumerates every such URL with its last-modified date.
 *
 * Everything is exposed as ONE consolidated list (getAllEntries) so Yatra
 * publishes a single, clean /yatra-sitemap.xml. Per-type access is kept
 * internal/available but the public sitemap is one file.
 *
 * Each entry is: ['loc' => absolute URL, 'lastmod' => W3C datetime|''].
 */
class SitemapService
{
    public const TYPE_ARCHIVE = 'archive';
    public const TYPE_TRIP = 'trip';
    public const TYPE_DESTINATION = 'destination';
    public const TYPE_ACTIVITY = 'activity';
    public const TYPE_CATEGORY = 'category';

    /** Order entries appear in the consolidated sitemap. */
    private const TYPES = [
        self::TYPE_ARCHIVE,
        self::TYPE_TRIP,
        self::TYPE_DESTINATION,
        self::TYPE_ACTIVITY,
        self::TYPE_CATEGORY,
    ];

    private const CACHE_KEY = 'yatra_sitemap_entries_all';
    private const CACHE_TTL = HOUR_IN_SECONDS;

    /** sitemaps.org caps a single sitemap file at 50,000 URLs. */
    private const MAX_URLS = 50000;

    /**
     * Every public Yatra URL, merged into one de-duplicated, cached list.
     *
     * @return array<int, array{loc: string, lastmod: string}>
     */
    public function getAllEntries(): array
    {
        static $runtime = null;
        if ($runtime !== null) {
            return $runtime;
        }

        $cached = get_transient(self::CACHE_KEY);
        if (is_array($cached)) {
            $runtime = $cached;
            return $cached;
        }

        $entries = [];
        foreach (self::TYPES as $type) {
            foreach ($this->entriesForType($type) as $entry) {
                $entries[] = $entry;
            }
        }
        $entries = $this->dedupe($entries);

        /**
         * Final say over the sitemap's entries — lets integrations drop
         * noindex URLs, add multilingual alternates, etc.
         *
         * @param array<int, array{loc: string, lastmod: string}> $entries
         */
        $entries = (array) apply_filters('yatra_sitemap_entries', $entries);

        // Never emit more than a single sitemap file may legally hold. Realistic
        // travel catalogues are orders of magnitude below this; the cap is a
        // safety valve so an extreme catalogue can't produce an invalid file.
        $max = (int) apply_filters('yatra_sitemap_max_urls', self::MAX_URLS);
        if ($max > 0 && count($entries) > $max) {
            $entries = array_slice($entries, 0, $max);
        }

        set_transient(self::CACHE_KEY, $entries, self::CACHE_TTL);
        $runtime = $entries;

        return $entries;
    }

    public function getCount(): int
    {
        return count($this->getAllEntries());
    }

    /**
     * Newest lastmod across all entries (for index <lastmod> in SEO plugins).
     */
    public function getLatestLastmod(): string
    {
        $latest = '';
        foreach ($this->getAllEntries() as $entry) {
            if ($entry['lastmod'] !== '' && $entry['lastmod'] > $latest) {
                $latest = $entry['lastmod'];
            }
        }

        return $latest;
    }

    /**
     * Drop the cached list. Call when a trip or classification changes.
     */
    public static function flushCache(): void
    {
        delete_transient(self::CACHE_KEY);
    }

    /**
     * @return array<int, array{loc: string, lastmod: string}>
     */
    private function entriesForType(string $type): array
    {
        switch ($type) {
            case self::TYPE_ARCHIVE:
                return $this->archiveEntries();
            case self::TYPE_TRIP:
                return $this->tripEntries();
            case self::TYPE_DESTINATION:
            case self::TYPE_ACTIVITY:
            case self::TYPE_CATEGORY:
                return $this->classificationEntries($type);
            default:
                return [];
        }
    }

    /**
     * The trip listing page plus each taxonomy index page.
     *
     * @return array<int, array{loc: string, lastmod: string}>
     */
    private function archiveEntries(): array
    {
        $entries = [];

        $listing = yatra_get_trip_listing_url();
        if ($listing !== '') {
            $entries[] = ['loc' => $listing, 'lastmod' => ''];
        }

        if (function_exists('yatra_get_taxonomy_listing_url')) {
            foreach (['destination', 'activity', 'trip-category'] as $listingType) {
                $url = yatra_get_taxonomy_listing_url($listingType);
                if ($url !== '' && $url !== home_url('/')) {
                    $entries[] = ['loc' => $url, 'lastmod' => ''];
                }
            }
        }

        return $entries;
    }

    /**
     * @return array<int, array{loc: string, lastmod: string}>
     */
    private function tripEntries(): array
    {
        global $wpdb;

        $table = TripsTable::getTableName();
        $rows = $wpdb->get_results(
            "SELECT id, slug, updated_at
               FROM `{$table}`
              WHERE status IN ('publish', 'published')
                AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00')
                AND slug <> ''
           ORDER BY updated_at DESC"
        );

        $entries = [];
        foreach ((array) $rows as $row) {
            $loc = yatra_get_trip_permalink($row);
            if ($loc === '') {
                continue;
            }
            $entries[] = ['loc' => $loc, 'lastmod' => $this->toW3c((string) ($row->updated_at ?? ''))];
        }

        return $entries;
    }

    /**
     * @return array<int, array{loc: string, lastmod: string}>
     */
    private function classificationEntries(string $type): array
    {
        global $wpdb;

        $table = ClassificationsTable::getTableName();
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT id, slug, updated_at
                   FROM `{$table}`
                  WHERE type = %s
                    AND status = 'publish'
                    AND slug <> ''
               ORDER BY updated_at DESC",
                $type
            )
        );

        $resolver = $this->permalinkResolver($type);

        $entries = [];
        foreach ((array) $rows as $row) {
            $loc = $resolver($row);
            if ($loc === '') {
                continue;
            }
            $entries[] = ['loc' => $loc, 'lastmod' => $this->toW3c((string) ($row->updated_at ?? ''))];
        }

        return $entries;
    }

    /**
     * @return callable(object): string
     */
    private function permalinkResolver(string $type): callable
    {
        switch ($type) {
            case self::TYPE_DESTINATION:
                return static fn ($row) => yatra_get_destination_permalink($row);
            case self::TYPE_ACTIVITY:
                return static fn ($row) => yatra_get_activity_permalink($row);
            case self::TYPE_CATEGORY:
                return static fn ($row) => yatra_get_category_permalink($row);
            default:
                return static fn ($row) => '';
        }
    }

    /**
     * Convert a MySQL datetime to a W3C / ISO-8601 string for <lastmod>.
     */
    private function toW3c(string $mysqlDate): string
    {
        $mysqlDate = trim($mysqlDate);
        if ($mysqlDate === '' || strpos($mysqlDate, '0000-00-00') === 0) {
            return '';
        }

        $timestamp = strtotime($mysqlDate);
        if ($timestamp === false) {
            return '';
        }

        return gmdate('Y-m-d\TH:i:s+00:00', $timestamp);
    }

    /**
     * @param array<int, array{loc: string, lastmod: string}> $entries
     * @return array<int, array{loc: string, lastmod: string}>
     */
    private function dedupe(array $entries): array
    {
        $seen = [];
        $out = [];
        foreach ($entries as $entry) {
            $loc = $entry['loc'];
            if ($loc === '' || isset($seen[$loc])) {
                continue;
            }
            $seen[$loc] = true;
            $out[] = $entry;
        }

        return $out;
    }
}
