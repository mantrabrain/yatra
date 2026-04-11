<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Utils\Logger;
use Yatra\Services\CacheService;
use Yatra\Contracts\ServiceInterface;
use Yatra\Utils\Cache;

/**
 * Enhanced Base Service Class
 * 
 * Provides enterprise-grade service layer with:
 * - Integrated caching
 * - Comprehensive logging
 * - Transaction support
 * - Event hooks
 * - Performance monitoring
 */
abstract class BaseService implements ServiceInterface
{
    /**
     * Get repository instance
     */
    abstract protected function getRepository();

    /**
     * Get all items with caching
     */
    public function getAll(array $filters = []): array
    {
        $startTime = microtime(true);
        
        // Check if caching is enabled
        if ($this->isCacheEnabled()) {
            $cacheKey = $this->getCacheKey('all', $filters);
            
            $result = $this->getCachedResult($cacheKey, function() use ($filters) {
                return $this->getRepository()->all($filters);
            });
        } else {
            // Bypass cache and get fresh data
            Logger::debug("Cache disabled, getting fresh data", ['service' => static::class, 'filters' => $filters]);
            $result = $this->getRepository()->all($filters);
        }
        
        $executionTime = microtime(true) - $startTime;
        Logger::debug("Service getAll executed", [
            'service' => static::class,
            'filters' => $filters,
            'execution_time' => $executionTime,
            'result_count' => count($result)
        ]);
        
        return $result;
    }

    /**
     * Get item by ID with caching
     */
    public function getById(int $id): ?\stdClass
    {
        if ($id <= 0) {
            Logger::warning("Invalid ID provided to getById", ['service' => static::class, 'id' => $id]);
            return null;
        }
        
        $startTime = microtime(true);
        
        // Check if caching is enabled
        if ($this->isCacheEnabled()) {
            $cacheKey = $this->getCacheKey('entity', ['id' => $id]);
            
            $result = $this->getCachedResult($cacheKey, function() use ($id) {
                return $this->getRepository()->find($id);
            });
        } else {
            // Bypass cache and get fresh data
            Logger::debug("Cache disabled, getting fresh data", ['service' => static::class, 'id' => $id]);
            $result = $this->getRepository()->find($id);
        }
        
        $executionTime = microtime(true) - $startTime;
        Logger::debug("Service getById executed", [
            'service' => static::class,
            'id' => $id,
            'execution_time' => $executionTime,
            'found' => $result !== null,
            'cache_enabled' => $this->isCacheEnabled()
        ]);
        
        return $result;
    }

    /**
     * Create new item with enhanced error handling and logging
     */
    public function create(array $data): int
    {
        $startTime = microtime(true);
        
        try {
            Logger::info("Service create started", [
                'service' => static::class,
                'data_keys' => array_keys($data)
            ]);
            
            // Validate data
            $this->validateCreate($data);

            // Process data before creation
            $data = $this->processBeforeCreate($data);

            // Fire before create hook
            $this->fireHook('before_create', $data);

            // Create record
            $id = $this->getRepository()->create($data);

            // Process after creation
            $this->processAfterCreate($id, $data);
            
            // Fire after create hook
            $this->fireHook('after_create', $id, $data);
            
            // Clear related caches
            $this->invalidateRelatedCaches($id, 'create');
            
            $executionTime = microtime(true) - $startTime;
            Logger::info("Service create completed", [
                'service' => static::class,
                'id' => $id,
                'execution_time' => $executionTime
            ]);

            return $id;
            
        } catch (\Exception $e) {
            $executionTime = microtime(true) - $startTime;
            Logger::error("Service create failed", [
                'service' => static::class,
                'data_keys' => array_keys($data),
                'execution_time' => $executionTime,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Update item with enhanced error handling and logging
     */
    public function update(int $id, array $data): bool
    {
        $startTime = microtime(true);
        
        try {
            if ($id <= 0) {
                throw new \InvalidArgumentException('Invalid ID provided for update');
            }
            
            Logger::info("Service update started", [
                'service' => static::class,
                'id' => $id,
                'data_keys' => array_keys($data)
            ]);
            
            // Validate data
            $this->validateUpdate($id, $data);

            // Process data before update
            $data = $this->processBeforeUpdate($id, $data);
            
            // Fire before update hook
            $this->fireHook('before_update', $id, $data);

            // Update record
            $result = $this->getRepository()->update($id, $data);

            if ($result) {
                // Process after update
                $this->processAfterUpdate($id, $data);
                
                // Fire after update hook
                $this->fireHook('after_update', $id, $data);
                
                // Clear related caches
                $this->invalidateRelatedCaches($id, 'update');
            }
            
            $executionTime = microtime(true) - $startTime;
            Logger::info("Service update completed", [
                'service' => static::class,
                'id' => $id,
                'success' => $result,
                'execution_time' => $executionTime
            ]);

            return $result;
            
        } catch (\Exception $e) {
            $executionTime = microtime(true) - $startTime;
            Logger::error("Service update failed", [
                'service' => static::class,
                'id' => $id,
                'data_keys' => array_keys($data),
                'execution_time' => $executionTime,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Delete item with enhanced error handling and logging
     */
    public function delete(int $id): bool
    {
        $startTime = microtime(true);
        
        try {
            if ($id <= 0) {
                throw new \InvalidArgumentException('Invalid ID provided for delete');
            }
            
            Logger::info("Service delete started", [
                'service' => static::class,
                'id' => $id
            ]);
            
            // Process before delete
            $this->processBeforeDelete($id);
            
            // Fire before delete hook
            $this->fireHook('before_delete', $id);

            // Delete record
            $result = $this->getRepository()->delete($id);

            if ($result) {
                // Process after delete
                $this->processAfterDelete($id);
                
                // Fire after delete hook
                $this->fireHook('after_delete', $id);
                
                // Clear related caches
                $this->invalidateRelatedCaches($id, 'delete');
            }
            
            $executionTime = microtime(true) - $startTime;
            Logger::info("Service delete completed", [
                'service' => static::class,
                'id' => $id,
                'success' => $result,
                'execution_time' => $executionTime
            ]);

            return $result;
            
        } catch (\Exception $e) {
            $executionTime = microtime(true) - $startTime;
            Logger::error("Service delete failed", [
                'service' => static::class,
                'id' => $id,
                'execution_time' => $executionTime,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Validate data for creation (implement ServiceInterface)
     */
    public function validateCreate(array $data): void
    {
        // Default implementation - override in child classes
        $this->validate($data);
    }

    /**
     * Validate data for update (implement ServiceInterface)
     */
    public function validateUpdate(int $id, array $data): void
    {
        // Default implementation - override in child classes
        $this->validate($data, $id);
    }

    /**
     * Legacy validate method (override in child classes)
     */
    protected function validate(array $data, ?int $id = null): void
    {
        // Override in child classes
    }

    /**
     * Count items with caching
     */
    public function count(array $filters = []): int
    {
        if ($this->isCacheEnabled()) {
            $cacheKey = $this->getCacheKey('count', $filters);
            
            return (int) $this->getCachedResult($cacheKey, function() use ($filters) {
                return $this->getRepository()->count($filters);
            }, 300); // 5 minute cache for counts
        } else {
            // Bypass cache and get fresh data
            Logger::debug("Cache disabled, getting fresh count", ['service' => static::class, 'filters' => $filters]);
            return $this->getRepository()->count($filters);
        }
    }

    /**
     * Check if item exists
     */
    public function exists(int $id): bool
    {
        if ($id <= 0) {
            return false;
        }
        
        if ($this->isCacheEnabled()) {
            $cacheKey = $this->getCacheKey('exists', ['id' => $id]);
            
            return (bool) $this->getCachedResult($cacheKey, function() use ($id) {
                return $this->getRepository()->exists($id);
            }, 600); // 10 minute cache for existence checks
        } else {
            // Bypass cache and get fresh data
            Logger::debug("Cache disabled, checking existence directly", ['service' => static::class, 'id' => $id]);
            return $this->getRepository()->exists($id);
        }
    }

    /**
     * Get paginated results with caching
     */
    public function paginate(int $page = 1, int $perPage = 10, array $filters = []): array
    {
        if ($this->isCacheEnabled()) {
            $cacheKey = $this->getCacheKey('paginate', [
                'page' => $page,
                'per_page' => $perPage,
                'filters' => $filters
            ]);
            
            return $this->getCachedResult($cacheKey, function() use ($page, $perPage, $filters) {
                return $this->executePaginateQuery($page, $perPage, $filters);
            });
        } else {
            // Bypass cache and get fresh data
            Logger::debug("Cache disabled, getting fresh pagination", ['service' => static::class, 'page' => $page, 'per_page' => $perPage]);
            return $this->executePaginateQuery($page, $perPage, $filters);
        }
    }

    /**
     * Execute pagination query
     */
    private function executePaginateQuery(int $page, int $perPage, array $filters): array
    {
        $repository = $this->getRepository();
        
        // Handle different paginate method signatures
        if (method_exists($repository, 'paginate')) {
            // Try the new signature first: paginate(int $page, int $perPage, array $filters)
            try {
                return $repository->paginate($page, $perPage, $filters);
            } catch (ArgumentCountError $e) {
                // Fall back to old signature: paginate(array $filters)
                $filters['page'] = $page;
                $filters['per_page'] = $perPage;
                return $repository->paginate($filters);
            }
        } else {
            // Fallback to all method with pagination parameters
            $filters['limit'] = $perPage;
            $filters['offset'] = ($page - 1) * $perPage;
            return $repository->all($filters);
        }
    }

    /**
     * Check if caching is enabled (delegates to {@see Cache::isEnabled()} then backend probe).
     */
    protected function isCacheEnabled(): bool
    {
        try {
            if (!\Yatra\Utils\Cache::isEnabled()) {
                return false;
            }

            if (!$this->isCacheBackendAvailable()) {
                Logger::warning("Cache enabled but backend not available, disabling cache");
                return false;
            }

            return true;
        } catch (\Exception $e) {
            Logger::error("Failed to check cache enabled status", [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Check if cache backend is available
     */
    private function isCacheBackendAvailable(): bool
    {
        try {
            // Test basic cache operation
            $testKey = 'yatra_cache_test_' . time();
            $testValue = 'test_value';
            
            Cache::set($testKey, $testValue, 1);
            $retrieved = Cache::get($testKey);
            
            // Clean up test key
            Cache::delete($testKey);
            
            return $retrieved === $testValue;
            
        } catch (\Exception $e) {
            Logger::warning("Cache backend availability check failed", [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Clear cache for entity
     */
    protected function clearEntityCache(int $id): void
    {
        if (!$this->isCacheEnabled()) {
            return; // No cache to clear
        }

        $entityType = strtolower(str_replace(['\\', 'Service'], ['_', ''], static::class));
        
        // Clear specific entity cache
        $this->clearCacheByPattern("{$entityType}_entity_{$id}");
        
        // Clear related list caches
        $this->clearCacheByPattern("{$entityType}_all");
        $this->clearCacheByPattern("{$entityType}_count");
        $this->clearCacheByPattern("{$entityType}_exists_{$id}");
        $this->clearCacheByPattern("{$entityType}_paginate");
        
        // Clear query result caches
        $this->clearCacheByPattern(Cache::PREFIX_QUERY_RESULT);
        
        Logger::info("Entity cache cleared", [
            'service' => static::class,
            'entity_id' => $id,
            'entity_type' => $entityType
        ]);
    }

    /**
     * Clear all cache for this service
     */
    protected function clearAllServiceCache(): void
    {
        if (!$this->isCacheEnabled()) {
            return; // No cache to clear
        }

        $entityType = strtolower(str_replace(['\\', 'Service'], ['_', ''], static::class));
        
        // Clear all caches related to this service
        $this->clearCacheByPattern($entityType);
        
        Logger::info("All service cache cleared", [
            'service' => static::class,
            'entity_type' => $entityType
        ]);
    }

    /**
     * Clear cache by pattern
     */
    private function clearCacheByPattern(string $pattern): void
    {
        try {
            Cache::clearByPrefix($pattern);
        } catch (\Exception $e) {
            Logger::warning("Failed to clear cache pattern", [
                'pattern' => $pattern,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get cached result or execute callback with performance monitoring
     */
    protected function getCachedResult(string $cacheKey, callable $callback, int $duration = 1800): mixed
    {
        $startTime = microtime(true);
        
        try {
            if ($this->isCacheEnabled()) {
                $result = Cache::remember($cacheKey, $callback, $duration);
                
                // Record cache performance metrics
                $this->recordCacheMetrics($cacheKey, $startTime, true);
                
                return $result;
            } else {
                // Bypass cache and execute callback directly
                $result = $callback();
                
                // Record non-cache performance metrics
                $this->recordCacheMetrics($cacheKey, $startTime, false);
                
                return $result;
            }
            
        } catch (\Exception $e) {
            // Fallback to direct execution on cache failure
            Logger::warning("Cache operation failed, falling back to direct execution", [
                'cache_key' => $cacheKey,
                'error' => $e->getMessage()
            ]);
            
            $result = $callback();
            $this->recordCacheMetrics($cacheKey, $startTime, false, $e);
            
            return $result;
        }
    }

    /**
     * Record cache performance metrics
     */
    private function recordCacheMetrics(string $cacheKey, float $startTime, bool $cacheUsed, ?\Exception $error = null): void
    {
        $executionTime = microtime(true) - $startTime;
        
        $metrics = [
            'cache_key' => substr($cacheKey, 0, 50) . '...',
            'cache_used' => $cacheUsed,
            'execution_time' => round($executionTime * 1000, 2), // in milliseconds
            'service' => static::class,
            'timestamp' => time()
        ];
        
        if ($error) {
            $metrics['error'] = $error->getMessage();
            Logger::warning("Cache performance recorded with error", $metrics);
        } else {
            Logger::debug("Cache performance recorded", $metrics);
        }
        
        // Store metrics for analytics (optional - can be extended)
        $this->storeCacheMetrics($metrics);
    }

    /**
     * Store cache metrics for analytics
     */
    private function storeCacheMetrics(array $metrics): void
    {
        try {
            // Store metrics in WordPress options for analytics
            $existingMetrics = get_option('yatra_cache_metrics', []);
            $existingMetrics[] = $metrics;
            
            // Keep only last 1000 entries to prevent bloat
            if (count($existingMetrics) > 1000) {
                $existingMetrics = array_slice($existingMetrics, -1000);
            }
            
            update_option('yatra_cache_metrics', $existingMetrics);
            
        } catch (\Exception $e) {
            // Don't let metrics storage failures break the main functionality
            Logger::debug("Failed to store cache metrics", [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Generate cache key for service operations
     */
    protected function getCacheKey(string $operation, array $params = []): string
    {
        $serviceClass = strtolower(str_replace(['\\', 'Service'], ['_', ''], static::class));
        $paramsHash = md5(serialize($params));
        
        return "service_{$serviceClass}_{$operation}_{$paramsHash}";
    }

    /**
     * Fire WordPress hooks for service events
     */
    protected function fireHook(string $action, ...$args): void
    {
        $serviceClass = strtolower(str_replace(['\\', 'Service'], ['_', ''], static::class));
        $hookName = "yatra_{$serviceClass}_{$action}";
        
        do_action($hookName, ...$args);
        
        Logger::debug("Service hook fired", [
            'hook' => $hookName,
            'args_count' => count($args)
        ]);
    }

    /**
     * Invalidate related caches
     */
    protected function invalidateRelatedCaches(int $id, string $operation): void
    {
        // Clear entity cache
        $this->clearEntityCache($id);
        
        // Clear all service cache for list operations
        $this->clearAllServiceCache();
        
        // Clear related entity caches based on operation type
        $this->clearRelatedEntityCaches($id, $operation);
        
        Logger::debug("Related caches invalidated", [
            'service' => static::class,
            'entity_id' => $id,
            'operation' => $operation
        ]);
    }

    /**
     * Clear related entity caches
     */
    protected function clearRelatedEntityCaches(int $id, string $operation): void
    {
        // Override in child classes to clear specific related caches
        // For example: TripService would clear destination, activity caches
        // AttributeService would clear trip-related caches, etc.
    }

    /**
     * Process data before create (override in child classes)
     */
    protected function processBeforeCreate(array $data): array
    {
        return $data;
    }

    /**
     * Process after create (override in child classes)
     */
    protected function processAfterCreate(int $id, array $data): void
    {
        // Override in child classes
    }

    /**
     * Process data before update (override in child classes)
     */
    protected function processBeforeUpdate(int $id, array $data): array
    {
        return $data;
    }

    /**
     * Process after update (override in child classes)
     */
    protected function processAfterUpdate(int $id, array $data): void
    {
        // Override in child classes
    }

    /**
     * Process before delete (override in child classes)
     */
    protected function processBeforeDelete(int $id): void
    {
        // Override in child classes
    }

    /**
     * Process after delete (override in child classes)
     */
    protected function processAfterDelete(int $id): void
    {
        // Override in child classes
    }
}

