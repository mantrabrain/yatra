<?php

declare(strict_types=1);

namespace Yatra\Core;

/**
 * Abstract service provider base class
 */
abstract class ServiceProvider
{
    /**
     * @var Container
     */
    protected Container $container;

    /**
     * ServiceProvider constructor
     */
    public function __construct(Container $container)
    {
        $this->container = $container;
    }

    /**
     * Register services
     */
    abstract public function register(): void;

    /**
     * Boot services (called after all providers are registered)
     */
    public function boot(): void
    {
        // Override in child classes if needed
    }
} 