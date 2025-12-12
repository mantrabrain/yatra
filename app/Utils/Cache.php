<?php

declare(strict_types=1);

namespace Yatra\Utils;

/**
 * Yatra Cache Manager
 * 
 * Provides intelligent caching with multiple backends and automatic invalidation
 */
class Cache
{
    /**
     * Cache prefixes for different data types
     */
    public const PREFIX_TABLE_EXISTS = 'yatra_table_exists_';
    public const PREFIX_TRIP_DATA = 'yatra_trip_';
    public const PREFIX_BOOKING_DATA = 'yatra_booking_';
    public const PREFIX_CUSTOMER_DATA = 'yatra_customer_';
    public const PREFIX_ACTIVITY_DATA = 'yatra_activity_';
    public const PREFIX_DESTINATION_DATA = 'yatra_destination_';
    public const PREFIX_QUERY_RESULT = 'yatra_query_';
    public const PREFIX_STATS = 'yatra_stats_';

    /**
     * Cache durations (in seconds)
     */
    public const DURATION_TABLE_EXISTS = 3600; // 1 hour
    public const DURATION_TRIP_DATA = 1800; // 30 minutes
    public const DURATION_BOOKING_DATA = 900; // 15 minutes
    public const DURATION_CUSTOMER_DATA = 1800; // 30 minutes
    public const DURATION_ACTIVITY_DATA = 3600; // 1 hour
    public const DURATION_DESTINATION_DATA = 3600; // 1 hour
    public const DURATION_QUERY_RESULT = 600; // 10 minutes
    public const DURATION_STATS = 300; // 5 minutes

    /**
     * Cache backend preference order
     */
    private static array $backends = ['redis', 'memcached', 'transient', 'memory'];

    /**
     * In-memory cache for current request
     */
    private static array $memoryCache = [];

    /**
     * Available cache backends
     */
    private static ?array $availableBackends = null;

    /**
     * Get cached value
     */
    public static function get(string $key): mixed
    {
        // Try memory cache first (fastest)
        if (isset(self::$memoryCache[$key])) {
            Logger::debug("Cache hit (memory)", ['key' => $key]);
            return self::$memoryCache[$key];
        }

        // Try external cache backends
        foreach (self::getAvailableBackends() as $backend) {
            $value = self::getFromBackend($backend, $key);
            if ($value !== null) {
                // Store in memory cache for subsequent requests
                self::$memoryCache[$key] = $value;
                Logger::debug("Cache hit ({$backend})", ['key' => $key]);
                return $value;
            }
        }

        Logger::debug("Cache miss", ['key' => $key]);
        return null;
    }

    /**
     * Set cached value
     */
    public static function set(string $key, mixed $value, int $duration = 3600): bool
    {
        // Always store in memory cache
        self::$memoryCache[$key] = $value;

        // Store in external cache backends
        $success = false;
        foreach (self::getAvailableBackends() as $backend) {
            if (self::setToBackend($backend, $key, $value, $duration)) {
                $success = true;
                Logger::debug("Cache set ({$backend})", ['key' => $key, 'duration' => $duration]);
            }
        }

        return $success;
    }

    /**
     * Delete cached value
     */
    public static function delete(string $key): bool
    {
        // Remove from memory cache
        unset(self::$memoryCache[$key]);

        // Remove from external cache backends
        $success = false;
        foreach (self::getAvailableBackends() as $backend) {
            if (self::deleteFromBackend($backend, $key)) {
                $success = true;
                Logger::debug("Cache delete ({$backend})", ['key' => $key]);
            }
        }

        return $success;
    }

    /**
     * Clear cache by prefix
     */
    public static function clearByPrefix(string $prefix): bool
    {
        // Clear memory cache
        foreach (array_keys(self::$memoryCache) as $key) {
            if (str_starts_with($key, $prefix)) {
                unset(self::$memoryCache[$key]);
            }
        }

        // Clear external cache backends
        $success = false;
        foreach (self::getAvailableBackends() as $backend) {
            if (self::clearPrefixFromBackend($backend, $prefix)) {
                $success = true;
                Logger::debug("Cache clear prefix ({$backend})", ['prefix' => $prefix]);
            }
        }

        return $success;
    }

    /**
     * Get or set cached value (cache-aside pattern)
     */
    public static function remember(string $key, callable $callback, int $duration = 3600): mixed
    {
        $value = self::get($key);
        
        if ($value !== null) {
            return $value;
        }

        // Generate value and cache it
        $value = $callback();
        self::set($key, $value, $duration);
        
        Logger::debug("Cache remember", ['key' => $key, 'duration' => $duration]);
        return $value;
    }

    /**
     * Cache table existence check
     */
    public static function tableExists(string $tableName, callable $checkCallback): bool
    {
        $key = self::PREFIX_TABLE_EXISTS . $tableName;
        
        return (bool) self::remember($key, $checkCallback, self::DURATION_TABLE_EXISTS);
    }

    /**
     * Cache trip data
     */
    public static function getTripData(int $tripId, callable $fetchCallback): mixed
    {
        $key = self::PREFIX_TRIP_DATA . $tripId;
        
        return self::remember($key, $fetchCallback, self::DURATION_TRIP_DATA);
    }

    /**
     * Cache booking data
     */
    public static function getBookingData(int $bookingId, callable $fetchCallback): mixed
    {
        $key = self::PREFIX_BOOKING_DATA . $bookingId;
        
        return self::remember($key, $fetchCallback, self::DURATION_BOOKING_DATA);
    }

    /**
     * Cache query results
     */
    public static function getQueryResult(string $queryHash, callable $queryCallback): mixed
    {
        $key = self::PREFIX_QUERY_RESULT . $queryHash;
        
        return self::remember($key, $queryCallback, self::DURATION_QUERY_RESULT);
    }

    /**
     * Cache statistics
     */
    public static function getStats(string $statsKey, callable $calculateCallback): mixed
    {
        $key = self::PREFIX_STATS . $statsKey;
        
        return self::remember($key, $calculateCallback, self::DURATION_STATS);
    }

    /**
     * Invalidate related caches when data changes
     */
    public static function invalidateTrip(int $tripId): void
    {
        self::delete(self::PREFIX_TRIP_DATA . $tripId);
        self::clearByPrefix(self::PREFIX_QUERY_RESULT);
        self::clearByPrefix(self::PREFIX_STATS);
        
        Logger::info("Cache invalidated for trip", ['trip_id' => $tripId]);
    }

    /**
     * Invalidate booking-related caches
     */
    public static function invalidateBooking(int $bookingId): void
    {
        self::delete(self::PREFIX_BOOKING_DATA . $bookingId);
        self::clearByPrefix(self::PREFIX_STATS);
        
        Logger::info("Cache invalidated for booking", ['booking_id' => $bookingId]);
    }

    /**
     * Get available cache backends
     */
    private static function getAvailableBackends(): array
    {
        if (self::$availableBackends === null) {
            self::$availableBackends = [];
            
            foreach (self::$backends as $backend) {
                if (self::isBackendAvailable($backend)) {
                    self::$availableBackends[] = $backend;
                }
            }
            
            // Always have memory as fallback
            if (!in_array('memory', self::$availableBackends)) {
                self::$availableBackends[] = 'memory';
            }
        }
        
        return self::$availableBackends;
    }

    /**
     * Check if cache backend is available
     */
    private static function isBackendAvailable(string $backend): bool
    {
        return match ($backend) {
            'redis' => extension_loaded('redis') && class_exists('Redis'),
            'memcached' => extension_loaded('memcached') && class_exists('Memcached'),
            'transient' => function_exists('get_transient'),
            'memory' => true,
            default => false,
        };
    }

    /**
     * Get value from specific backend
     */
    private static function getFromBackend(string $backend, string $key): mixed
    {
        return match ($backend) {
            'redis' => self::getFromRedis($key),
            'memcached' => self::getFromMemcached($key),
            'transient' => self::getFromTransient($key),
            'memory' => self::$memoryCache[$key] ?? null,
            default => null,
        };
    }

    /**
     * Set value to specific backend
     */
    private static function setToBackend(string $backend, string $key, mixed $value, int $duration): bool
    {
        return match ($backend) {
            'redis' => self::setToRedis($key, $value, $duration),
            'memcached' => self::setToMemcached($key, $value, $duration),
            'transient' => self::setToTransient($key, $value, $duration),
            'memory' => true, // Already handled above
            default => false,
        };
    }

    /**
     * Delete from specific backend
     */
    private static function deleteFromBackend(string $backend, string $key): bool
    {
        return match ($backend) {
            'redis' => self::deleteFromRedis($key),
            'memcached' => self::deleteFromMemcached($key),
            'transient' => self::deleteFromTransient($key),
            'memory' => true, // Already handled above
            default => false,
        };
    }

    /**
     * Clear prefix from specific backend
     */
    private static function clearPrefixFromBackend(string $backend, string $prefix): bool
    {
        return match ($backend) {
            'redis' => self::clearPrefixFromRedis($prefix),
            'memcached' => self::clearPrefixFromMemcached($prefix),
            'transient' => self::clearPrefixFromTransient($prefix),
            'memory' => true, // Already handled above
            default => false,
        };
    }

    /**
     * Redis backend methods
     */
    private static function getFromRedis(string $key): mixed
    {
        try {
            if (!class_exists('Redis')) return null;
            
            $redis = new \Redis();
            $redis->connect('127.0.0.1', 6379);
            
            $value = $redis->get($key);
            $redis->close();
            
            return $value !== false ? unserialize($value) : null;
        } catch (\Exception $e) {
            Logger::warning("Redis cache error", ['error' => $e->getMessage()]);
            return null;
        }
    }

    private static function setToRedis(string $key, mixed $value, int $duration): bool
    {
        try {
            if (!class_exists('Redis')) return false;
            
            $redis = new \Redis();
            $redis->connect('127.0.0.1', 6379);
            
            $result = $redis->setex($key, $duration, serialize($value));
            $redis->close();
            
            return $result;
        } catch (\Exception $e) {
            Logger::warning("Redis cache error", ['error' => $e->getMessage()]);
            return false;
        }
    }

    private static function deleteFromRedis(string $key): bool
    {
        try {
            if (!class_exists('Redis')) return false;
            
            $redis = new \Redis();
            $redis->connect('127.0.0.1', 6379);
            
            $result = $redis->del($key) > 0;
            $redis->close();
            
            return $result;
        } catch (\Exception $e) {
            Logger::warning("Redis cache error", ['error' => $e->getMessage()]);
            return false;
        }
    }

    private static function clearPrefixFromRedis(string $prefix): bool
    {
        try {
            if (!class_exists('Redis')) return false;
            
            $redis = new \Redis();
            $redis->connect('127.0.0.1', 6379);
            
            $keys = $redis->keys($prefix . '*');
            if (!empty($keys)) {
                $redis->del($keys);
            }
            $redis->close();
            
            return true;
        } catch (\Exception $e) {
            Logger::warning("Redis cache error", ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * WordPress Transient backend methods
     */
    private static function getFromTransient(string $key): mixed
    {
        if (!function_exists('get_transient')) return null;
        
        $value = get_transient($key);
        return $value !== false ? $value : null;
    }

    private static function setToTransient(string $key, mixed $value, int $duration): bool
    {
        if (!function_exists('set_transient')) return false;
        
        return set_transient($key, $value, $duration);
    }

    private static function deleteFromTransient(string $key): bool
    {
        if (!function_exists('delete_transient')) return false;
        
        return delete_transient($key);
    }

    private static function clearPrefixFromTransient(string $prefix): bool
    {
        global $wpdb;
        
        if (!$wpdb) return false;
        
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
            '_transient_' . $prefix . '%'
        ));
        
        return true;
    }

    /**
     * Memcached backend methods (simplified implementations)
     */
    private static function getFromMemcached(string $key): mixed
    {
        // Simplified - would need proper Memcached connection management
        return null;
    }

    private static function setToMemcached(string $key, mixed $value, int $duration): bool
    {
        // Simplified - would need proper Memcached connection management
        return false;
    }

    private static function deleteFromMemcached(string $key): bool
    {
        // Simplified - would need proper Memcached connection management
        return false;
    }

    private static function clearPrefixFromMemcached(string $prefix): bool
    {
        // Simplified - would need proper Memcached connection management
        return false;
    }

    /**
     * Clear all caches
     */
    public static function flush(): void
    {
        self::$memoryCache = [];
        
        foreach (self::getAvailableBackends() as $backend) {
            self::clearPrefixFromBackend($backend, 'yatra_');
        }
        
        Logger::info("All caches flushed");
    }

    /**
     * Get cache statistics
     */
    public static function getCacheStats(): array
    {
        return [
            'memory_cache_size' => count(self::$memoryCache),
            'available_backends' => self::getAvailableBackends(),
            'memory_usage' => memory_get_usage(true),
        ];
    }
}
