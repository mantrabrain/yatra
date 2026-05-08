<?php

declare(strict_types=1);

namespace Yatra\Helpers;

/**
 * Builds {@see \Yatra\Repositories\TripRepository::findWithFilters()} payloads from trip shortcode/block attributes.
 *
 * Classification filters use **numeric classification IDs only** (comma-separated in shortcodes / arrays in blocks).
 */
final class TripListingFilterBuilder
{
    /**
     * @return int[]
     */
    public static function parsePositiveIntCsv($value): array
    {
        if ($value === null || $value === '') {
            return [];
        }
        $raw = \is_array($value) ? \implode(',', $value) : (string) $value;
        $parts = \preg_split('/\s*,\s*/', $raw, -1, PREG_SPLIT_NO_EMPTY);
        if ($parts === false || $parts === []) {
            return [];
        }

        $ids = [];
        foreach ($parts as $part) {
            $trim = \trim((string) $part);
            if ($trim === '' || !\preg_match('/^\d+$/', $trim)) {
                return [];
            }
            $n = (int) $trim;
            if ($n > 0) {
                $ids[] = $n;
            }
        }

        return $ids === [] ? [] : \array_values(\array_unique($ids));
    }

    /**
     * Prefer block/editor array of IDs, then fall back to legacy CSV string attributes (strict digits only).
     *
     * @param array<string, mixed> $atts
     * @param string ...$legacyCsvKeys Tried in order
     *
     * @return int[]
     */
    public static function positiveIntIdsFromAtts(array $atts, string $arrayKey, string ...$legacyCsvKeys): array
    {
        if (!empty($atts[$arrayKey]) && \is_array($atts[$arrayKey])) {
            $ids = [];
            foreach ($atts[$arrayKey] as $v) {
                if (\is_int($v) || \is_float($v)) {
                    $n = (int) $v;
                } elseif (\is_string($v) && \preg_match('/^\d+$/', \trim($v))) {
                    $n = (int) \trim($v);
                } else {
                    $n = 0;
                }
                if ($n > 0) {
                    $ids[] = $n;
                }
            }
            $ids = \array_values(\array_unique($ids));
            if ($ids !== []) {
                return $ids;
            }
        }

        foreach ($legacyCsvKeys as $legacyKey) {
            $parsed = self::parsePositiveIntCsv($atts[$legacyKey] ?? '');
            if ($parsed !== []) {
                return $parsed;
            }
        }

        return [];
    }

    /**
     * Filters for TripRepository::findWithFilters merged with sort / pagination outside.
     *
     * @param array<string, mixed> $atts Normalized attributes (mixed types from REST/shortcode/AJAX).
     *
     * @return array<string, mixed>
     */
    public static function buildFindWithFiltersArray(array $atts): array
    {
        $filters = [];

        // Featured Priority — single source of truth (admin form values: featured | new | limited).
        // Accept both snake_case (shortcode) and camelCase (block).
        $featuredPriorityRaw = '';
        if (isset($atts['featured_priority']) && is_string($atts['featured_priority']) && $atts['featured_priority'] !== '') {
            $featuredPriorityRaw = $atts['featured_priority'];
        } elseif (isset($atts['featuredPriority']) && is_string($atts['featuredPriority']) && $atts['featuredPriority'] !== '') {
            $featuredPriorityRaw = $atts['featuredPriority'];
        }
        $featuredPriority = strtolower(trim((string) $featuredPriorityRaw));
        if ($featuredPriority === 'none') {
            $featuredPriority = '';
        }
        if ($featuredPriority !== '' && !in_array($featuredPriority, ['featured', 'new', 'limited'], true)) {
            $featuredPriority = '';
        }

        // Back-compat: `featured="1"` (shortcode) and `featured: true` (block) are aliases for
        // featured_priority="featured" — the admin form's Featured Priority dropdown is the
        // single source of truth (the legacy is_featured column is never set by the trip form).
        $featuredRaw = $atts['featured'] ?? false;
        $isLegacyFeatured = $featuredRaw === '1'
            || $featuredRaw === 1
            || $featuredRaw === true
            || (is_string($featuredRaw) && in_array(strtolower($featuredRaw), ['true', 'yes', 'on'], true));
        if ($isLegacyFeatured && $featuredPriority === '') {
            $featuredPriority = 'featured';
        }

        if ($featuredPriority !== '') {
            $filters['featured_priority'] = $featuredPriority;
        }

        $search = \sanitize_text_field((string) ($atts['search'] ?? ''));
        if ($search !== '') {
            $filters['search'] = $search;
        }

        self::attachDestinationActivityCategory($filters, $atts);

        $diffIds = self::positiveIntIdsFromAtts($atts, 'difficultyIds', 'difficulty');
        if ($diffIds !== []) {
            $filters['difficulty'] = $diffIds;
        }

        $priceMinRaw = $atts['price_min'] ?? '';
        if ($priceMinRaw !== '' && $priceMinRaw !== null && is_numeric((string) $priceMinRaw) && (float) $priceMinRaw > 0) {
            $filters['price_min'] = (float) $priceMinRaw;
        }

        $priceMaxRaw = $atts['price_max'] ?? '';
        if ($priceMaxRaw !== '' && $priceMaxRaw !== null && is_numeric((string) $priceMaxRaw) && (float) $priceMaxRaw > 0) {
            $filters['price_max'] = (float) $priceMaxRaw;
        }

        $durMin = $atts['duration_min'] ?? '';
        if ($durMin !== '' && $durMin !== null && is_numeric((string) $durMin) && (int) $durMin > 0) {
            $filters['duration_min'] = (int) $durMin;
        }

        $durMax = $atts['duration_max'] ?? '';
        if ($durMax !== '' && $durMax !== null && is_numeric((string) $durMax) && (int) $durMax > 0) {
            $filters['duration_max'] = (int) $durMax;
        }

        $order = \strtolower((string) ($atts['order'] ?? 'desc'));
        $filters['sort'] = $order === 'asc' ? 'date_asc' : '';

        return $filters;
    }

    /**
     * @param array<string, mixed> $filters
     * @param array<string, mixed> $atts
     */
    private static function attachDestinationActivityCategory(array &$filters, array $atts): void
    {
        $destIds = self::positiveIntIdsFromAtts($atts, 'destinationIds', 'destination_ids', 'destination');
        if ($destIds !== []) {
            $filters['destination_ids'] = $destIds;
        }

        $actIds = self::positiveIntIdsFromAtts($atts, 'activityIds', 'activity_ids', 'activity');
        if ($actIds !== []) {
            $filters['activity_ids'] = $actIds;
        }

        $catIds = self::positiveIntIdsFromAtts($atts, 'categoryIds', 'category_ids', 'category');
        if ($catIds !== []) {
            $filters['category_ids'] = $catIds;
        }
    }

    /**
     * Restrict listing queries to numeric classification IDs.
     *
     * @param array<string, mixed> $where Passed by reference (BaseRepository WHERE map)
     * @param array<string, mixed> $atts
     * @param string ...$legacyCsvKeys e.g. 'destination_ids', 'destination'
     */
    public static function applyTaxonomyWhere(
        array &$where,
        array $atts,
        string $arrayKey,
        string ...$legacyCsvKeys
    ): void {
        $ids = self::positiveIntIdsFromAtts($atts, $arrayKey, ...$legacyCsvKeys);
        if ($ids === []) {
            return;
        }
        unset($where['slug']);
        unset($where['id']);
        $where['id'] = $ids;
    }
}
