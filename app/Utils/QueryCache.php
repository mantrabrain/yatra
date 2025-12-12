<?php

declare(strict_types=1);

namespace Yatra\Utils;

/**
 * Query Result Cache Manager
 * 
 * Specialized caching for database query results with intelligent invalidation
 */
class QueryCache
{
    /**
     * Cache expensive query results with automatic invalidation
     */
    public static function getQueryResult(string $sql, array $params = [], int $duration = 600): mixed
    {
        // Create cache key from SQL and parameters
        $cacheKey = self::generateQueryCacheKey($sql, $params);
        
        return Cache::remember($cacheKey, function() use ($sql, $params) {
            global $wpdb;
            
            $startTime = microtime(true);
            
            // Execute query based on type
            if (empty($params)) {
                $result = $wpdb->get_results($sql);
            } else {
                $result = $wpdb->get_results($wpdb->prepare($sql, ...$params));
            }
            
            $executionTime = microtime(true) - $startTime;
            
            // Log slow queries
            if ($executionTime > 1.0) {
                Logger::warning("Slow query cached", [
                    'execution_time' => $executionTime,
                    'sql' => $sql,
                    'params' => $params
                ]);
            } else {
                Logger::debug("Query result cached", [
                    'execution_time' => $executionTime,
                    'cache_key' => substr($cacheKey, 0, 50) . '...'
                ]);
            }
            
            return $result;
        }, $duration);
    }

    /**
     * Cache single row query results
     */
    public static function getRow(string $sql, array $params = [], int $duration = 600): ?\stdClass
    {
        $cacheKey = self::generateQueryCacheKey($sql . '_ROW', $params);
        
        return Cache::remember($cacheKey, function() use ($sql, $params) {
            global $wpdb;
            
            if (empty($params)) {
                return $wpdb->get_row($sql);
            } else {
                return $wpdb->get_row($wpdb->prepare($sql, ...$params));
            }
        }, $duration);
    }

    /**
     * Cache single value query results
     */
    public static function getVar(string $sql, array $params = [], int $duration = 600): mixed
    {
        $cacheKey = self::generateQueryCacheKey($sql . '_VAR', $params);
        
        return Cache::remember($cacheKey, function() use ($sql, $params) {
            global $wpdb;
            
            if (empty($params)) {
                return $wpdb->get_var($sql);
            } else {
                return $wpdb->get_var($wpdb->prepare($sql, ...$params));
            }
        }, $duration);
    }

    /**
     * Cache count queries
     */
    public static function getCount(string $table, array $conditions = [], int $duration = 300): int
    {
        $cacheKey = 'count_' . $table . '_' . md5(serialize($conditions));
        
        return (int) Cache::remember($cacheKey, function() use ($table, $conditions) {
            global $wpdb;
            
            $sql = "SELECT COUNT(*) FROM {$wpdb->prefix}{$table}";
            $params = [];
            
            if (!empty($conditions)) {
                $whereClauses = [];
                foreach ($conditions as $field => $value) {
                    $whereClauses[] = "{$field} = %s";
                    $params[] = $value;
                }
                $sql .= " WHERE " . implode(' AND ', $whereClauses);
            }
            
            if (empty($params)) {
                return (int) $wpdb->get_var($sql);
            } else {
                return (int) $wpdb->get_var($wpdb->prepare($sql, ...$params));
            }
        }, $duration);
    }

    /**
     * Invalidate query cache by table
     */
    public static function invalidateByTable(string $table): void
    {
        // Clear all query caches that might involve this table
        $patterns = [
            Cache::PREFIX_QUERY_RESULT,
            'count_' . $table . '_',
        ];
        
        foreach ($patterns as $pattern) {
            Cache::clearByPrefix($pattern);
        }
        
        Logger::info("Query cache invalidated for table", ['table' => $table]);
    }

    /**
     * Invalidate all query caches
     */
    public static function invalidateAll(): void
    {
        Cache::clearByPrefix(Cache::PREFIX_QUERY_RESULT);
        Cache::clearByPrefix('count_');
        
        Logger::info("All query caches invalidated");
    }

    /**
     * Generate cache key for query
     */
    private static function generateQueryCacheKey(string $sql, array $params = []): string
    {
        // Normalize SQL (remove extra whitespace, convert to lowercase)
        $normalizedSql = preg_replace('/\s+/', ' ', trim(strtolower($sql)));
        
        // Create hash from SQL and parameters
        $hash = md5($normalizedSql . serialize($params));
        
        return Cache::PREFIX_QUERY_RESULT . $hash;
    }

    /**
     * Get query cache statistics
     */
    public static function getStats(): array
    {
        return [
            'cache_backend' => Cache::getAvailableBackends()[0] ?? 'none',
            'total_cached_queries' => self::getCachedQueryCount(),
        ];
    }

    /**
     * Get count of cached queries (approximate)
     */
    private static function getCachedQueryCount(): int
    {
        // This is an approximation - actual implementation would depend on cache backend
        return 0; // Placeholder
    }
}
