<?php

declare(strict_types=1);

namespace Yatra\Services;

/**
 * Builds view data for the trip listing template (no business queries — only request + listing payload shaping).
 */
final class TripListingPageContextFactory
{
    /**
     * @param array<string, mixed>      $tripListData    Result of TripListingService::getFilteredTrips()
     * @param array<string, mixed>|null $taxonomyContext Optional $GLOBALS['yatra_taxonomy_context']
     * @return array<string, mixed>
     */
    public function buildForTripArchive(array $tripListData, string $requestUri, ?array $taxonomyContext = null, array $filterData = []): array
    {
        $activeFilters = $this->parseActiveFiltersFromRequest();

        $taxonomy = $this->resolveTaxonomyPresentation($taxonomyContext);

        $trips = [];
        $total = 0;
        $pages = 1;
        $currentPage = 1;
        $destOptions = [];
        $actOptions = [];
        $perPage = max(1, (int) ($tripListData['per_page'] ?? 12));

        if (array_key_exists('trips', $tripListData)) {
            $trips = $tripListData['trips'];
            $total = (int) ($tripListData['total'] ?? count($trips));
            $pages = max(1, (int) ($tripListData['pages'] ?? 1));
            $currentPage = max(1, (int) ($tripListData['page'] ?? 1));
            $perPage = max(1, (int) ($tripListData['per_page'] ?? $perPage));
            $destOptions = $tripListData['destinations'] ?? [];
            $actOptions = $tripListData['activities'] ?? [];

            if (!empty($tripListData['filters']) && is_array($tripListData['filters'])) {
                foreach (array_keys($activeFilters) as $k) {
                    if (array_key_exists($k, $tripListData['filters'])) {
                        $activeFilters[$k] = $tripListData['filters'][$k];
                    }
                }
            }
        } elseif (is_array($taxonomyContext) && !empty($taxonomyContext['trips'])) {
            $trips = $taxonomyContext['trips'];
            $total = count($trips);
        }

        if ($pages < $currentPage) {
            $currentPage = $pages;
        }

        $listingTitle = $this->buildListingTitle($taxonomy);
        $displayTotal = $total > 0 ? $total : count($trips);
        $startItem = $displayTotal > 0 ? ($currentPage - 1) * $perPage + 1 : 0;
        $endItem = $displayTotal > 0 ? min($currentPage * $perPage, $displayTotal) : 0;

        $basePath = $this->normalizeListingBasePath($requestUri);

        return [
            'trip_list' => $tripListData,
            'trips' => $trips,
            'total' => $total,
            'pages' => $pages,
            'current_page' => $currentPage,
            'destinations' => $destOptions,
            'activities' => $actOptions,
            'active_filters' => $activeFilters,
            'filter_data' => $filterData,
            'listing_title' => $listingTitle,
            'taxonomy_type' => $taxonomy['type'],
            'taxonomy_slug' => $taxonomy['slug'],
            'taxonomy_name' => $taxonomy['name'],
            'show_taxonomy_context' => $taxonomy['type'] !== '' && $taxonomy['slug'] !== '',
            'results' => [
                'display_total' => $displayTotal,
                'start_item' => $startItem,
                'end_item' => $endItem,
                'per_page' => $perPage,
            ],
            'pagination' => $this->buildPagination($pages, $currentPage, $activeFilters, $basePath),
            'sort_options' => $this->buildSortOptions($activeFilters, $basePath),
        ];
    }

    /**
     * @return array{type: string, slug: string, name: string}
     */
    private function resolveTaxonomyPresentation(?array $taxonomyContext): array
    {
        $out = ['type' => '', 'slug' => '', 'name' => ''];
        if (!is_array($taxonomyContext) || empty($taxonomyContext['type']) || empty($taxonomyContext['entity'])) {
            return $out;
        }
        $entity = $taxonomyContext['entity'];
        $out['type'] = (string) $taxonomyContext['type'];
        $out['slug'] = isset($entity->slug) ? (string) $entity->slug : '';
        $out['name'] = isset($entity->name) ? (string) $entity->name : '';

        return $out;
    }

    /**
     * @param array{type: string, slug: string, name: string} $taxonomy
     */
    private function buildListingTitle(array $taxonomy): string
    {
        if ($taxonomy['type'] === '' || $taxonomy['name'] === '') {
            return __('All Trips', 'yatra');
        }
        if ($taxonomy['type'] === 'destination') {
            return sprintf(
                /* translators: %s is destination name */
                __('Trips to %s', 'yatra'),
                $taxonomy['name']
            );
        }
        if ($taxonomy['type'] === 'activity') {
            return sprintf(
                /* translators: %s is activity name */
                __('Trips with %s', 'yatra'),
                $taxonomy['name']
            );
        }

        return __('All Trips', 'yatra');
    }

    /**
     * @return array<string, mixed>
     */
    private function parseActiveFiltersFromRequest(): array
    {
        $get = $_GET;
        $attrs = [];
        if (isset($get['attributes']) && is_array($get['attributes'])) {
            foreach ($get['attributes'] as $id => $attrData) {
                if (is_array($attrData)) {
                    $attrs[$id] = array_map('sanitize_text_field', $attrData);
                } else {
                    $attrs[$id] = sanitize_text_field((string) $attrData);
                }
            }
        }

        return [
            's' => isset($get['s']) ? sanitize_text_field(wp_unslash((string) $get['s'])) : '',
            'category' => isset($get['category']) ? sanitize_text_field(wp_unslash((string) $get['category'])) : '',
            'destination' => isset($get['destination']) ? sanitize_text_field(wp_unslash((string) $get['destination'])) : '',
            'activity' => isset($get['activity']) ? sanitize_text_field(wp_unslash((string) $get['activity'])) : '',
            'price_min' => !empty($get['price_min']) ? (int) $get['price_min'] : '',
            'price_max' => !empty($get['price_max']) ? (int) $get['price_max'] : '',
            'budget' => isset($get['budget']) ? sanitize_text_field(wp_unslash((string) $get['budget'])) : '',
            'duration' => isset($get['duration']) ? sanitize_text_field(wp_unslash((string) $get['duration'])) : '',
            'trip_type' => isset($get['trip_type']) ? sanitize_text_field(wp_unslash((string) $get['trip_type'])) : '',
            'sort' => isset($get['sort']) ? sanitize_text_field(wp_unslash((string) $get['sort'])) : '',
            'difficulty' => $this->parseGetArray($get, 'difficulty', 'intval'),
            'rating' => $this->parseGetArray($get, 'rating', 'intval'),
            'categories' => $this->parseGetArray($get, 'categories', 'intval'),
            'destinations' => $this->parseGetArray($get, 'destinations', 'intval'),
            'activities' => $this->parseGetArray($get, 'activities', 'intval'),
            'accommodation' => $this->parseGetArray($get, 'accommodation', 'sanitize_text_field'),
            'services' => $this->parseGetArray($get, 'services', 'sanitize_text_field'),
            'offers' => $this->parseGetArray($get, 'offers', 'sanitize_text_field'),
            'booking' => $this->parseGetArray($get, 'booking', 'sanitize_text_field'),
            'age' => $this->parseGetArray($get, 'age', 'sanitize_text_field'),
            'included_services' => $this->parseGetArray($get, 'included_services', 'sanitize_text_field'),
            'special_offers' => $this->parseGetArray($get, 'special_offers', 'sanitize_text_field'),
            'booking_options' => $this->parseGetArray($get, 'booking_options', 'sanitize_text_field'),
            'age_suitability' => $this->parseGetArray($get, 'age_suitability', 'sanitize_text_field'),
            'attributes' => $attrs,
        ];
    }

    /**
     * @param array<string, mixed> $get
     * @param callable(string):mixed $sanitizeCallback
     * @return list<mixed>
     */
    private function parseGetArray(array $get, string $key, callable $sanitizeCallback): array
    {
        if (!isset($get[$key])) {
            return [];
        }
        $value = $get[$key];
        if (is_array($value)) {
            return array_values(array_filter(array_map($sanitizeCallback, $value), static fn ($v) => $v !== '' && $v !== null));
        }
        if (is_string($value) && $value !== '') {
            $parts = array_filter(explode(',', $value));

            return array_values(array_filter(array_map($sanitizeCallback, $parts), static fn ($v) => $v !== '' && $v !== null));
        }

        return [];
    }

    /**
     * @param array<string, mixed> $activeFilters
     * @return list<array{type: string, page?: int, url?: string, is_current?: bool}>
     */
    private function buildPagination(int $totalPages, int $currentPage, array $activeFilters, string $basePath): array
    {
        $totalPages = max(1, $totalPages);
        $currentPage = max(1, min($currentPage, $totalPages));
        $range = 2;
        $items = [];

        for ($p = 1; $p <= $totalPages; $p++) {
            if ($p === 1 || $p === $totalPages || ($p >= $currentPage - $range && $p <= $currentPage + $range)) {
                $items[] = [
                    'type' => 'page',
                    'page' => $p,
                    'url' => $this->buildFilteredUrl($basePath, $activeFilters, $p),
                    'is_current' => $p === $currentPage,
                ];
            } elseif ($p === $currentPage - $range - 1 || $p === $currentPage + $range + 1) {
                $items[] = ['type' => 'ellipsis'];
            }
        }

        return [
            'total_pages' => $totalPages,
            'current_page' => $currentPage,
            'prev_url' => $currentPage > 1
                ? $this->buildFilteredUrl($basePath, $activeFilters, $currentPage - 1)
                : null,
            'next_url' => $currentPage < $totalPages
                ? $this->buildFilteredUrl($basePath, $activeFilters, $currentPage + 1)
                : null,
            'items' => $items,
        ];
    }

    /**
     * @param array<string, mixed> $activeFilters
     * @return list<array{value: string, label: string, url: string, selected: bool}>
     */
    private function buildSortOptions(array $activeFilters, string $basePath): array
    {
        $definitions = [
            '' => __('Recommended', 'yatra'),
            'most_popular' => __('Most Popular', 'yatra'),
            'price_low' => __('Price: Low to High', 'yatra'),
            'price_high' => __('Price: High to Low', 'yatra'),
            'rating_high' => __('Rating: Highest', 'yatra'),
            'duration_short' => __('Duration: Shortest', 'yatra'),
            'duration_long' => __('Duration: Longest', 'yatra'),
        ];

        $current = (string) ($activeFilters['sort'] ?? '');
        $out = [];

        foreach ($definitions as $value => $label) {
            $q = $this->activeFiltersToQuery($activeFilters, ['sort']);
            if ($value !== '') {
                $q['sort'] = $value;
            }
            $out[] = [
                'value' => $value,
                'label' => $label,
                'url' => $this->buildUrl($basePath, $q),
                'selected' => $value === $current,
            ];
        }

        return $out;
    }

    private function normalizeListingBasePath(string $requestUri): string
    {
        $path = strtok($requestUri, '?') ?: '';
        $path = rtrim((string) $path, '/');
        $path = preg_replace('#/page/[0-9]+#', '', $path) ?? $path;

        return $path === '' ? '/' : $path;
    }

    /**
     * @param array<string, mixed> $activeFilters
     * @param list<string>         $excludeKeys
     * @return array<string, mixed>
     */
    private function activeFiltersToQuery(array $activeFilters, array $excludeKeys = []): array
    {
        $query = [];
        foreach ($activeFilters as $k => $v) {
            if (in_array($k, $excludeKeys, true)) {
                continue;
            }
            if ($v === '' || $v === null || $v === []) {
                continue;
            }
            if ($k === 'attributes' && is_array($v)) {
                $clean = [];
                foreach ($v as $attrId => $attrVal) {
                    if ($attrVal === '' || $attrVal === null) {
                        continue;
                    }
                    if (is_array($attrVal)) {
                        $inner = [];
                        foreach ($attrVal as $ik => $iv) {
                            if ($iv === '' || $iv === null) {
                                continue;
                            }
                            $inner[$ik] = $iv;
                        }
                        if ($inner !== []) {
                            $clean[$attrId] = $inner;
                        }
                    } else {
                        $clean[$attrId] = $attrVal;
                    }
                }
                if ($clean !== []) {
                    $query['attributes'] = $clean;
                }

                continue;
            }
            if (is_array($v)) {
                $list = [];
                foreach ($v as $item) {
                    if ($item !== '' && $item !== null) {
                        $list[] = $item;
                    }
                }
                if ($list !== []) {
                    $query[$k] = $list;
                }
            } else {
                $query[$k] = $v;
            }
        }

        return $query;
    }

    /**
     * @param array<string, mixed> $activeFilters
     */
    private function buildFilteredUrl(string $basePath, array $activeFilters, int $page): string
    {
        $q = $this->activeFiltersToQuery($activeFilters, []);
        if ($page > 1) {
            $q['paged'] = $page;
        }

        return $this->buildUrl($basePath, $q);
    }

    /**
     * @param array<string, mixed> $query
     */
    private function buildUrl(string $basePath, array $query): string
    {
        $qs = http_build_query($query, '', '&', PHP_QUERY_RFC3986);

        return $basePath . ($qs !== '' ? '?' . $qs : '');
    }
}
