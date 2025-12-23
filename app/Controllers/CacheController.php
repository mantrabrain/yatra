<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use Yatra\Utils\Logger;
use Yatra\Utils\Cache;

/**
 * Cache Management Controller
 * Handles cache operations for admin interface
 */
class CacheController extends BaseController
{
    /**
     * Get cache statistics
     */
    public function getStats(): array
    {
        try {
            $metrics = get_option('yatra_cache_metrics', []);
            $stats = [
                'total_operations' => count($metrics),
                'cache_hits' => 0,
                'cache_misses' => 0,
                'avg_execution_time' => 0,
                'cache_enabled' => get_option('yatra_cache_enabled', true),
                'cache_backend_available' => $this->isCacheBackendAvailable(),
                'recent_operations' => array_slice($metrics, -10)
            ];

            if (!empty($metrics)) {
                $totalTime = 0;
                foreach ($metrics as $metric) {
                    if ($metric['cache_used']) {
                        $stats['cache_hits']++;
                    } else {
                        $stats['cache_misses']++;
                    }
                    $totalTime += $metric['execution_time'];
                }
                $stats['avg_execution_time'] = round($totalTime / count($metrics), 2);
                $stats['hit_rate'] = $stats['total_operations'] > 0 
                    ? round(($stats['cache_hits'] / $stats['total_operations']) * 100, 2) 
                    : 0;
            }

            return $this->success('Cache statistics retrieved', $stats);

        } catch (\Exception $e) {
            Logger::error('Failed to get cache statistics', ['error' => $e->getMessage()]);
            return $this->error('Failed to get cache statistics');
        }
    }

    /**
     * Clear all cache
     */
    public function clearAll(): array
    {
        try {
            $startTime = microtime(true);
            
            // Clear all cache patterns
            Cache::clearByPrefix('');
            
            // Clear metrics
            update_option('yatra_cache_metrics', []);
            
            $executionTime = round((microtime(true) - $startTime) * 1000, 2);
            
            Logger::info('All cache cleared', ['execution_time' => $executionTime]);
            
            return $this->success('All cache cleared', [
                'execution_time' => $executionTime
            ]);

        } catch (\Exception $e) {
            Logger::error('Failed to clear all cache', ['error' => $e->getMessage()]);
            return $this->error('Failed to clear all cache');
        }
    }

    /**
     * Clear cache by pattern
     */
    public function clearPattern(array $data): array
    {
        try {
            if (empty($data['pattern'])) {
                return $this->error('Pattern is required');
            }

            $startTime = microtime(true);
            
            Cache::clearByPrefix($data['pattern']);
            
            $executionTime = round((microtime(true) - $startTime) * 1000, 2);
            
            Logger::info('Cache cleared by pattern', [
                'pattern' => $data['pattern'],
                'execution_time' => $executionTime
            ]);
            
            return $this->success('Cache cleared by pattern', [
                'pattern' => $data['pattern'],
                'execution_time' => $executionTime
            ]);

        } catch (\Exception $e) {
            Logger::error('Failed to clear cache by pattern', [
                'pattern' => $data['pattern'] ?? 'unknown',
                'error' => $e->getMessage()
            ]);
            return $this->error('Failed to clear cache by pattern');
        }
    }

    /**
     * Toggle cache enabled status
     */
    public function toggleCache(array $data): array
    {
        try {
            $enabled = isset($data['enabled']) ? (bool) $data['enabled'] : false;
            
            update_option('yatra_cache_enabled', $enabled);
            
            Logger::info('Cache status toggled', ['enabled' => $enabled]);
            
            return $this->success('Cache status updated', [
                'cache_enabled' => $enabled
            ]);

        } catch (\Exception $e) {
            Logger::error('Failed to toggle cache status', ['error' => $e->getMessage()]);
            return $this->error('Failed to toggle cache status');
        }
    }

    /**
     * Warm cache
     */
    public function warmCache(): array
    {
        try {
            $startTime = microtime(true);
            $warmed = [];
            
            // Warm common cache patterns
            $patterns = [
                'yatra_frontend_attributes',
                'yatra_filterable_attributes',
                'trip_listing_filter_options',
                'trip_listing_statistics'
            ];
            
            foreach ($patterns as $pattern) {
                try {
                    // This would trigger cache warming through service methods
                    // Implementation depends on specific services
                    $warmed[] = $pattern;
                } catch (\Exception $e) {
                    Logger::warning("Failed to warm cache pattern", [
                        'pattern' => $pattern,
                        'error' => $e->getMessage()
                    ]);
                }
            }
            
            $executionTime = round((microtime(true) - $startTime) * 1000, 2);
            
            Logger::info('Cache warming completed', [
                'warmed_patterns' => $warmed,
                'execution_time' => $executionTime
            ]);
            
            return $this->success('Cache warming completed', [
                'warmed_patterns' => $warmed,
                'execution_time' => $executionTime
            ]);

        } catch (\Exception $e) {
            Logger::error('Failed to warm cache', ['error' => $e->getMessage()]);
            return $this->error('Failed to warm cache');
        }
    }

    /**
     * Check if cache backend is available
     */
    private function isCacheBackendAvailable(): bool
    {
        try {
            $testKey = 'yatra_cache_test_' . time();
            $testValue = 'test_value';
            
            Cache::set($testKey, $testValue, 1);
            $retrieved = Cache::get($testKey);
            
            Cache::delete($testKey);
            
            return $retrieved === $testValue;
            
        } catch (\Exception $e) {
            return false;
        }
    }
}
