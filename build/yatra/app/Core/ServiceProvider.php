<?php

declare(strict_types=1);

namespace Yatra\Core;

/**
 * Base Service Provider
 */
abstract class ServiceProvider
{
    /**
     * @var Container
     */
    protected Container $container;

    /**
     * Constructor
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
     * Boot services
     */
    public function boot(): void
    {
        // Override in child classes if needed
    }
}

