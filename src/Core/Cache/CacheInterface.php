<?php

declare(strict_types=1);

namespace Yatra\Core\Cache;

/**
 * Cache interface
 */
interface CacheInterface
{
    /**
     * Get a value from cache
     */
    public function get(string $key, $default = null);

    /**
     * Set a value in cache
     */
    public function set(string $key, $value, int $ttl = 3600): bool;

    /**
     * Delete a value from cache
     */
    public function delete(string $key): bool;

    /**
     * Check if a key exists in cache
     */
    public function has(string $key): bool;

    /**
     * Clear all cache
     */
    public function clear(): bool;

    /**
     * Get multiple values from cache
     */
    public function getMultiple(array $keys, $default = null): array;

    /**
     * Set multiple values in cache
     */
    public function setMultiple(array $values, int $ttl = 3600): bool;

    /**
     * Delete multiple values from cache
     */
    public function deleteMultiple(array $keys): bool;

    /**
     * Increment a numeric value
     */
    public function increment(string $key, int $value = 1): int;

    /**
     * Decrement a numeric value
     */
    public function decrement(string $key, int $value = 1): int;
} 