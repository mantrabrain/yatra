<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Utils\Logger;
use Yatra\Services\CacheService;
use Yatra\Contracts\ServiceInterface;

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
        
        // TEMPORARILY DISABLE CACHING FOR DEBUGGING TRIP SERVICE
        if (defined('WP_DEBUG') && WP_DEBUG && static::class === 'Yatra\\Services\\TripService') {
            error_log('[YATRA DEBUG] TripService getAll - CACHE DISABLED FOR DEBUGGING');
            $result = $this->getRepository()->all($filters);
            
            $executionTime = microtime(true) - $startTime;
            error_log('[YATRA DEBUG] TripService getAll - Direct DB query result count: ' . count($result));
            error_log('[YATRA DEBUG] TripService getAll - Execution time: ' . round($executionTime * 1000, 2) . 'ms');
            
            return $result;
        }
        
        // Normal caching for other services
        $cacheKey = $this->getCacheKey('all', $filters);
        
        $result = $this->getCachedResult($cacheKey, function() use ($filters) {
            return $this->getRepository()->all($filters);
        });
        
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
        $cacheKey = $this->getCacheKey('entity', ['id' => $id]);
        
        $result = $this->getCachedResult($cacheKey, function() use ($id) {
            return $this->getRepository()->find($id);
        });
        
        $executionTime = microtime(true) - $startTime;
        Logger::debug("Service getById executed", [
            'service' => static::class,
            'id' => $id,
            'execution_time' => $executionTime,
            'found' => $result !== null
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
        $cacheKey = $this->getCacheKey('count', $filters);
        
        return (int) $this->getCachedResult($cacheKey, function() use ($filters) {
            return $this->getRepository()->count($filters);
        }, 300); // 5 minute cache for counts
    }

    /**
     * Check if item exists
     */
    public function exists(int $id): bool
    {
        if ($id <= 0) {
            return false;
        }
        
        $cacheKey = $this->getCacheKey('exists', ['id' => $id]);
        
        return (bool) $this->getCachedResult($cacheKey, function() use ($id) {
            return $this->getRepository()->exists($id);
        }, 600); // 10 minute cache for existence checks
    }

    /**
     * Get paginated results with caching
     */
    public function paginate(int $page = 1, int $perPage = 10, array $filters = []): array
    {
        $cacheKey = $this->getCacheKey('paginate', [
            'page' => $page,
            'per_page' => $perPage,
            'filters' => $filters
        ]);
        
        return $this->getCachedResult($cacheKey, function() use ($page, $perPage, $filters) {
            return $this->getRepository()->paginate($page, $perPage, $filters);
        });
    }

    /**
     * Get cached result or execute callback
     */
    protected function getCachedResult(string $cacheKey, callable $callback, int $duration = 1800): mixed
    {
        return CacheService::remember($cacheKey, $callback, $duration);
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
        $serviceClass = strtolower(str_replace(['\\', 'Service'], ['_', ''], static::class));
        
        // Clear entity-specific caches
        CacheService::invalidateEntity($serviceClass, $id);
        
        // Clear service-level caches
        $prefix = "service_{$serviceClass}_";
        CacheService::clearByPrefix($prefix);
        
        Logger::debug("Service caches invalidated", [
            'service' => $serviceClass,
            'id' => $id,
            'operation' => $operation
        ]);
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

