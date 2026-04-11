<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Utils\Cache;

/**
 * Geocoding response cache (Nominatim). Not DB-backed; centralizes cache keys for external lookups.
 * Does not wrap {@see get_option()}.
 */
final class GeocodingRepository
{
    public function cacheKeySearch(string $query, int $limit): string
    {
        return 'yatra_geo_search_' . md5($query . '|' . $limit);
    }

    public function cacheKeyReverse(float $lat, float $lng): string
    {
        return 'yatra_geo_reverse_' . md5((string) $lat . '_' . (string) $lng);
    }

    public function getPayload(string $key): mixed
    {
        return Cache::get($key);
    }

    public function setPayload(string $key, mixed $value, int $ttlSeconds): bool
    {
        return Cache::set($key, $value, $ttlSeconds);
    }
}
