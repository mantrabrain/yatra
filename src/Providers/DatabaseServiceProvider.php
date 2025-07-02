<?php

declare(strict_types=1);

namespace Yatra\Providers;

use Yatra\Core\Container;
use Yatra\Core\ServiceProvider;
use Yatra\Core\Database\Connection;
use Yatra\Core\Database\QueryBuilder;
use Yatra\Core\Database\Schema;
use Yatra\Core\Cache\CacheInterface;
use Yatra\Core\Cache\FileCache;

/**
 * Database service provider
 */
class DatabaseServiceProvider extends ServiceProvider
{
    /**
     * Register services
     */
    public function register(): void
    {
        // Register database connection
        $this->container->singleton('database', Connection::class);
        
        // Register query builder
        $this->container->singleton('query_builder', QueryBuilder::class);
        
        // Register schema builder
        $this->container->singleton('schema', Schema::class);
        
        // Register cache
        $this->container->singleton('cache', FileCache::class);
        $this->container->bind(CacheInterface::class, FileCache::class);
    }
} 