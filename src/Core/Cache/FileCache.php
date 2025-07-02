<?php

declare(strict_types=1);

namespace Yatra\Core\Cache;

/**
 * File-based cache implementation
 */
class FileCache implements CacheInterface
{
    /**
     * @var string
     */
    private $cachePath;

    /**
     * @var int
     */
    private $defaultTtl;

    /**
     * FileCache constructor
     */
    public function __construct(string $cachePath = null, int $defaultTtl = 3600)
    {
        $this->cachePath = $cachePath ?: YATRA_PLUGIN_PATH . 'storage/cache/';
        $this->defaultTtl = $defaultTtl;
        
        // Create cache directory if it doesn't exist
        if (!is_dir($this->cachePath)) {
            wp_mkdir_p($this->cachePath);
        }
    }

    /**
     * Initialize cache
     */
    public function init(): void
    {
        // Clean expired cache files
        $this->cleanExpired();
    }

    /**
     * Get a value from cache
     */
    public function get(string $key, $default = null)
    {
        $filename = $this->getCacheFilename($key);
        
        if (!file_exists($filename)) {
            return $default;
        }

        $data = $this->readCacheFile($filename);
        
        if ($data === false || $this->isExpired($data)) {
            $this->delete($key);
            return $default;
        }

        return $data['value'];
    }

    /**
     * Set a value in cache
     */
    public function set(string $key, $value, int $ttl = 3600): bool
    {
        $filename = $this->getCacheFilename($key);
        $data = [
            'value' => $value,
            'expires' => time() + $ttl,
            'created' => time()
        ];

        return $this->writeCacheFile($filename, $data);
    }

    /**
     * Delete a value from cache
     */
    public function delete(string $key): bool
    {
        $filename = $this->getCacheFilename($key);
        
        if (file_exists($filename)) {
            return unlink($filename);
        }

        return true;
    }

    /**
     * Check if a key exists in cache
     */
    public function has(string $key): bool
    {
        $filename = $this->getCacheFilename($key);
        
        if (!file_exists($filename)) {
            return false;
        }

        $data = $this->readCacheFile($filename);
        
        if ($data === false || $this->isExpired($data)) {
            $this->delete($key);
            return false;
        }

        return true;
    }

    /**
     * Clear all cache
     */
    public function clear(): bool
    {
        $files = glob($this->cachePath . '*.cache');
        
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }

        return true;
    }

    /**
     * Get multiple values from cache
     */
    public function getMultiple(array $keys, $default = null): array
    {
        $result = [];
        
        foreach ($keys as $key) {
            $result[$key] = $this->get($key, $default);
        }

        return $result;
    }

    /**
     * Set multiple values in cache
     */
    public function setMultiple(array $values, int $ttl = 3600): bool
    {
        $success = true;
        
        foreach ($values as $key => $value) {
            if (!$this->set($key, $value, $ttl)) {
                $success = false;
            }
        }

        return $success;
    }

    /**
     * Delete multiple values from cache
     */
    public function deleteMultiple(array $keys): bool
    {
        $success = true;
        
        foreach ($keys as $key) {
            if (!$this->delete($key)) {
                $success = false;
            }
        }

        return $success;
    }

    /**
     * Increment a numeric value
     */
    public function increment(string $key, int $value = 1): int
    {
        $current = $this->get($key, 0);
        
        if (!is_numeric($current)) {
            $current = 0;
        }

        $newValue = (int) $current + $value;
        $this->set($key, $newValue);
        
        return $newValue;
    }

    /**
     * Decrement a numeric value
     */
    public function decrement(string $key, int $value = 1): int
    {
        return $this->increment($key, -$value);
    }

    /**
     * Get cache filename for key
     */
    private function getCacheFilename(string $key): string
    {
        $hash = md5($key);
        return $this->cachePath . $hash . '.cache';
    }

    /**
     * Read cache file
     */
    private function readCacheFile(string $filename)
    {
        $content = file_get_contents($filename);
        
        if ($content === false) {
            return false;
        }

        $data = unserialize($content);
        
        if ($data === false) {
            return false;
        }

        return $data;
    }

    /**
     * Write cache file
     */
    private function writeCacheFile(string $filename, array $data): bool
    {
        $content = serialize($data);
        return file_put_contents($filename, $content) !== false;
    }

    /**
     * Check if cache data is expired
     */
    private function isExpired(array $data): bool
    {
        return isset($data['expires']) && $data['expires'] < time();
    }

    /**
     * Clean expired cache files
     */
    private function cleanExpired(): void
    {
        $files = glob($this->cachePath . '*.cache');
        
        foreach ($files as $file) {
            if (is_file($file)) {
                $data = $this->readCacheFile($file);
                
                if ($data !== false && $this->isExpired($data)) {
                    unlink($file);
                }
            }
        }
    }

    /**
     * Get cache statistics
     */
    public function getStats(): array
    {
        $files = glob($this->cachePath . '*.cache');
        $totalFiles = count($files);
        $totalSize = 0;
        $expiredFiles = 0;

        foreach ($files as $file) {
            $totalSize += filesize($file);
            
            $data = $this->readCacheFile($file);
            if ($data !== false && $this->isExpired($data)) {
                $expiredFiles++;
            }
        }

        return [
            'total_files' => $totalFiles,
            'total_size' => $totalSize,
            'expired_files' => $expiredFiles,
            'cache_path' => $this->cachePath
        ];
    }
} 