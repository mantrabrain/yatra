<?php

declare(strict_types=1);

namespace Yatra\Repositories\Concerns;

use Yatra\Utils\Cache;

/**
 * Query-result caching for repository classes (DB reads, external API payloads composed here).
 * Do not use for WordPress options — call {@see get_option()} directly without wrapping in {@see Cache}.
 *
 * Pair reads with invalidation on writes: override {@see \Yatra\Repositories\BaseRepository::afterWrite}
 * or fire domain hooks that {@see \Yatra\Hooks\CacheHooks} / {@see \Yatra\Utils\Cache} handle.
 */
trait CachesQueryResults
{
    /**
     * @param callable(): mixed $callback
     *
     * @return mixed
     */
    protected function cacheQueryResult(string $key, callable $callback, int $duration = 3600)
    {
        return Cache::remember($key, $callback, $duration);
    }

    /**
     * Lets application services keep orchestration while storing cache keys and TTLs on the repository.
     *
     * @param callable(): mixed $callback
     *
     * @return mixed
     */
    public function withQueryCache(string $key, callable $callback, int $duration = 3600)
    {
        return $this->cacheQueryResult($key, $callback, $duration);
    }
}
