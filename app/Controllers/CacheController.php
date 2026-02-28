<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Utils\Logger;
use Yatra\Utils\Cache;

/**
 * Cache Management Controller
 * Handles cache operations for admin interface
 */
class CacheController extends BaseController
{
    /**
     * Register REST API routes
     */
    public function register_routes(): void
    {
        register_rest_route('yatra/v1', '/cache/stats', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getStats'],
                'permission_callback' => [$this, 'checkPermissions']
            ]
        ]);

        register_rest_route('yatra/v1', '/cache/view', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getAllCacheData'],
                'permission_callback' => [$this, 'checkPermissions']
            ]
        ]);

        register_rest_route('yatra/v1', '/cache/status', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getCacheStatus'],
                'permission_callback' => [$this, 'checkPermissions']
            ]
        ]);

        register_rest_route('yatra/v1', '/cache/enable', [
            [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'enableCache'],
                'permission_callback' => [$this, 'checkPermissions']
            ]
        ]);

        register_rest_route('yatra/v1', '/cache/disable', [
            [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'disableCache'],
                'permission_callback' => [$this, 'checkPermissions']
            ]
        ]);

        register_rest_route('yatra/v1', '/cache/clear-item', [
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'clearCacheItem'],
                'permission_callback' => [$this, 'checkPermissions']
            ]
        ]);

        register_rest_route('yatra/v1', '/cache/clear-all', [
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'clearAll'],
                'permission_callback' => [$this, 'checkPermissions']
            ]
        ]);

        register_rest_route('yatra/v1', '/cache/clear-pattern', [
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'clearByPattern'],
                'permission_callback' => [$this, 'checkPermissions']
            ]
        ]);

        register_rest_route('yatra/v1', '/cache/toggle', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'toggleCache'],
                'permission_callback' => [$this, 'checkPermissions']
            ]
        ]);

        register_rest_route('yatra/v1', '/cache/warm', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'warmCache'],
                'permission_callback' => [$this, 'checkPermissions']
            ]
        ]);
    }

    /**
     * Register REST API routes (alias for compatibility)
     */
    public static function registerRoutes(): void
    {
        $instance = new self();
        $instance->register_routes();
    }

    /**
     * Check permissions for cache operations
     */
    public function checkPermissions(): bool
    {
        return current_user_can('manage_options');
    }

    /**
     * Get cache statistics
     */
    public function getStats(): WP_REST_Response|WP_Error
    {
        try {
            $metrics = get_option('yatra_cache_metrics', []);
            $stats = [
                'total_operations' => count($metrics),
                'cache_hits' => 0,
                'cache_misses' => 0,
                'avg_execution_time' => 0,
                'cache_enabled' => get_option('yatra_cache_enabled', true),
                'cache_backend_available' => function_exists('get_transient'),
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

            return $this->success_response($stats);

        } catch (\Exception $e) {
            Logger::error('Failed to get cache statistics', ['error' => $e->getMessage()]);
            return $this->error_response('Failed to get cache statistics');
        }
    }

    /**
     * Get all cache data for viewing
     */
    public function getAllCacheData(): WP_REST_Response|WP_Error
    {
        try {
            $cacheData = [];
            
            // Get ALL Yatra-related transients
            global $wpdb;
            
            // Debug: Check if any transients exist at all
            $allTransients = $wpdb->get_results(
                "SELECT option_name, option_value, option_id 
                 FROM {$wpdb->options} 
                 WHERE option_name LIKE '_transient_%' 
                 ORDER BY option_name LIMIT 10"
            );
            
            Logger::debug('All transients in database', ['count' => count($allTransients)]);
            if (!empty($allTransients)) {
                Logger::debug('Sample transients', array_slice($allTransients, 0, 3));
            }
            
            // Get Yatra-specific transients (both free and pro)
            $transients = $wpdb->get_results(
                "SELECT option_name, option_value, option_id 
                 FROM {$wpdb->options} 
                 WHERE (option_name LIKE '_transient_yatra_%' OR option_name LIKE '_transient_yatra_pro_%')
                 ORDER BY option_name"
            );
            
            // Debug: Log Yatra transients found
            Logger::debug('Yatra transients found', ['count' => count($transients)]);
            Logger::debug('Yatra transient names', array_column($transients, 'option_name'));
            
            // Filter out timeout transients, keep only data transients
            $transients = array_filter($transients, function($transient) {
                return !strpos($transient->option_name, '_transient_timeout_');
            });
            
            Logger::debug('Yatra data transients after filtering', ['count' => count($transients)]);

            foreach ($transients as $transient) {
                $key = str_replace('_transient_', '', $transient->option_name);
                $value = maybe_unserialize($transient->option_value);
                
                // Get expiration time from timeout option
                $timeoutOption = '_transient_timeout_' . $key;
                $expiration = get_option($timeoutOption);
                $expiresAt = $expiration ? date('Y-m-d H:i:s', (int)$expiration) : 'Never expires';
                
                // Format value for better display
                $displayValue = $this->formatCacheValue($value);
                
                $cacheData[] = [
                    'key' => $key,
                    'type' => 'transient',
                    'value' => $displayValue,
                    'size' => strlen($transient->option_value),
                    'created_at' => current_time('mysql'),
                    'expires_at' => $expiresAt,
                    'option_id' => $transient->option_id
                ];
            }

            // Get memory cache data
            $memoryCache = Cache::getCacheStats();
            if (!empty($memoryCache['memory_cache_size'])) {
                $cacheData[] = [
                    'key' => 'memory_cache',
                    'type' => 'memory',
                    'value' => 'Memory cache data (' . $memoryCache['memory_cache_size'] . ' items)',
                    'size' => $memoryCache['memory_usage'] ?? 0,
                    'created_at' => current_time('mysql'),
                    'expires_at' => 'End of request',
                    'option_id' => null
                ];
            }

            return $this->success_response([
                'success' => true,
                'message' => 'Cache data retrieved',
                'data' => [
                    'cache_data' => $cacheData,
                    'total_items' => count($cacheData),
                    'total_size' => array_sum(array_column($cacheData, 'size'))
                ]
            ]);

        } catch (\Exception $e) {
            Logger::error('Failed to get cache data', ['error' => $e->getMessage()]);
            return $this->error_response('Failed to get cache data');
        }
    }

    /**
     * Clear specific cache item
     */
    public function clearCacheItem(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $key = $request->get_param('key');
            $type = $request->get_param('type');

            if (empty($key)) {
                return $this->error_response('Cache key is required');
            }

            $success = false;
            $message = '';

            switch ($type) {
                case 'transient':
                    $success = delete_transient($key);
                    // Also delete the timeout entry
                    delete_option('_transient_timeout_' . $key);
                    $message = $success ? 'Transient cache cleared' : 'Failed to clear transient cache';
                    break;
                case 'memory':
                    // Memory cache is handled by the Cache class
                    Cache::delete($key);
                    $success = true;
                    $message = 'Memory cache cleared';
                    break;
                default:
                    // Try to clear from all available backends
                    Cache::delete($key);
                    $success = true;
                    $message = 'Cache cleared from all backends';
                    break;
            }

            if ($success) {
                Logger::info("Cache item cleared", ['key' => $key, 'type' => $type]);
                return $this->success_response([
                'success' => true,
                'message' => $message,
                'data' => ['key' => $key, 'type' => $type]
            ]);
            } else {
                return $this->error_response('Failed to clear cache item');
            }

        } catch (\Exception $e) {
            Logger::error('Failed to clear cache item', ['error' => $e->getMessage()]);
            return $this->error_response('Failed to clear cache item');
        }
    }

    /**
     * Get transient creation time
     */
    private function getTransientCreatedTime(string $optionName): string
    {
        global $wpdb;
        
        $result = $wpdb->get_var($wpdb->prepare(
            "SELECT option_added FROM {$wpdb->options} WHERE option_name = %s",
            $optionName
        ));
        
        return $result ? date('Y-m-d H:i:s', strtotime($result)) : 'Unknown';
    }

    /**
     * Get transient expiration time
     */
    private function getTransientExpirationTime(string $optionName): string
    {
        global $wpdb;
        
        $timeoutKey = '_transient_timeout_' . str_replace('_transient_', '', $optionName);
        $timeout = $wpdb->get_var($wpdb->prepare(
            "SELECT option_value FROM {$wpdb->options} WHERE option_name = %s",
            $timeoutKey
        ));
        
        return $timeout ? date('Y-m-d H:i:s', $timeout) : 'No expiration';
    }

    /**
     * Clear all cache
     */
    public function clearAll(): WP_REST_Response|WP_Error
    {
        try {
            $startTime = microtime(true);
            
            // Clear all Yatra cache
            Cache::clearByPrefix('yatra_');
            
            $executionTime = round((microtime(true) - $startTime) * 1000, 2);
            
            Logger::info('All cache cleared', ['execution_time' => $executionTime]);
            
            return $this->success_response([
                'success' => true,
                'message' => 'All cache cleared',
                'data' => [
                    'execution_time' => $executionTime
                ]
            ]);
            
        } catch (\Exception $e) {
            Logger::error('Failed to clear all cache', ['error' => $e->getMessage()]);
            return $this->error_response('Failed to clear all cache');
        }
    }

    /**
     * Clear cache by pattern
     */
    public function clearByPattern(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $pattern = $request->get_param('pattern');
            
            if (empty($pattern)) {
                return $this->error_response('Pattern is required');
            }
            
            $startTime = microtime(true);
            
            // Clear cache by pattern
            Cache::clearByPrefix($pattern);
            
            $executionTime = round((microtime(true) - $startTime) * 1000, 2);
            
            Logger::info('Cache cleared by pattern', [
                'pattern' => $pattern,
                'execution_time' => $executionTime
            ]);
            
            return $this->success_response([
                'success' => true,
                'message' => 'Cache cleared by pattern',
                'data' => [
                    'pattern' => $pattern,
                    'execution_time' => $executionTime
                ]
            ]);

        } catch (\Exception $e) {
            Logger::error('Failed to clear cache by pattern', [
                'pattern' => $pattern ?? 'unknown',
                'error' => $e->getMessage()
            ]);
            return $this->error_response('Failed to clear cache by pattern');
        }
    }

    /**
     * Toggle cache enabled status
     */
    public function toggleCache(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $enabled = $request->get_param('enabled');
            $enabled = filter_var($enabled, FILTER_VALIDATE_BOOLEAN);
            
            update_option('yatra_cache_enabled', $enabled);
            
            Logger::info('Cache status toggled', ['enabled' => $enabled]);
            
            return $this->success_response([
                'success' => true,
                'message' => 'Cache status updated',
                'data' => [
                    'cache_enabled' => $enabled
                ]
            ]);

        } catch (\Exception $e) {
            Logger::error('Failed to toggle cache status', ['error' => $e->getMessage()]);
            return $this->error_response('Failed to toggle cache status');
        }
    }

    /**
     * Warm cache
     */
    public function warmCache(): WP_REST_Response|WP_Error
    {
        try {
            $startTime = microtime(true);
            $warmed = [];
            
            // Warm common cache patterns
            $patterns = [
                'yatra_frontend_attributes',
                'yatra_filterable_attributes',
                'trip_listing_filter_options',
            ];
            
            foreach ($patterns as $pattern) {
                // Clear existing cache for this pattern
                Cache::clearByPrefix($pattern);
                $warmed[] = $pattern;
            }
            
            $executionTime = round((microtime(true) - $startTime) * 1000, 2);
            
            Logger::info('Cache warmed', [
                'warmed_patterns' => $warmed,
                'execution_time' => $executionTime
            ]);
            
            return $this->success_response([
                'success' => true,
                'message' => 'Cache warmed',
                'data' => [
                    'warmed_patterns' => $warmed,
                    'execution_time' => $executionTime
                ]
            ]);

        } catch (\Exception $e) {
            Logger::error('Failed to warm cache', ['error' => $e->getMessage()]);
            return $this->error_response('Failed to warm cache');
        }
    }

    /**
     * Format cache value for better display
     */
    private function formatCacheValue($value): string
    {
        // Return actual data as JSON for frontend to display
        if (is_array($value) || is_object($value)) {
            return json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        }
        
        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }
        
        if (is_null($value)) {
            return 'null';
        }
        
        if (is_string($value)) {
            // Return the actual string value
            return $value;
        }
        
        if (is_numeric($value)) {
            return (string) $value;
        }
        
        return 'Unknown type: ' . gettype($value);
    }

    /**
     * Get cache status
     */
    public function getCacheStatus(): WP_REST_Response|WP_Error
    {
        try {
            $status = \Yatra\Utils\Cache::getStatus();
            
            Logger::info('Cache status retrieved', $status);
            
            return $this->success_response([
                'success' => true,
                'message' => 'Cache status retrieved',
                'data' => $status
            ]);
            
        } catch (\Exception $e) {
            Logger::error('Failed to get cache status', ['error' => $e->getMessage()]);
            return $this->error_response('Failed to get cache status');
        }
    }

    /**
     * Enable cache
     */
    public function enableCache(): WP_REST_Response|WP_Error
    {
        try {
            $success = \Yatra\Utils\Cache::enableForTesting();
            
            if ($success) {
                Logger::info('Cache enabled successfully');
                return $this->success_response([
                    'success' => true,
                    'message' => 'Cache enabled successfully',
                    'data' => ['cache_enabled' => true]
                ]);
            } else {
                return $this->error_response('Failed to enable cache');
            }
            
        } catch (\Exception $e) {
            Logger::error('Failed to enable cache', ['error' => $e->getMessage()]);
            return $this->error_response('Failed to enable cache');
        }
    }

    /**
     * Disable cache
     */
    public function disableCache(): WP_REST_Response|WP_Error
    {
        try {
            $success = \Yatra\Utils\Cache::disableForTesting();
            
            if ($success) {
                Logger::info('Cache disabled successfully');
                return $this->success_response([
                    'success' => true,
                    'message' => 'Cache disabled successfully',
                    'data' => ['cache_enabled' => false]
                ]);
            } else {
                return $this->error_response('Failed to disable cache');
            }
            
        } catch (\Exception $e) {
            Logger::error('Failed to disable cache', ['error' => $e->getMessage()]);
            return $this->error_response('Failed to disable cache');
        }
    }

    
}
