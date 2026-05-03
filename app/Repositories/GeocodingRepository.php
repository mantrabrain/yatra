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
    /**
     * @param string $schema Bump when search API parameters change (busts stale cache).
     */
    public function cacheKeySearch(string $query, int $limit, string $schema = 'v4'): string
    {
        return 'yatra_geo_search_' . md5($query . '|' . $limit . '|' . $schema);
    }

    public function cacheKeyReverse(float $lat, float $lng): string
    {
        return 'yatra_geo_reverse_' . md5((string) $lat . '_' . (string) $lng);
    }

    /**
     * @return mixed
     */
    public function getPayload(string $key)
    {
        return Cache::get($key);
    }

    public function setPayload(string $key, $value, int $ttlSeconds): bool
    {
        return Cache::set($key, $value, $ttlSeconds);
    }
}
