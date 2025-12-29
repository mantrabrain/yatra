<?php

declare(strict_types=1);

namespace Yatra\Core;

/**
 * Base Service Class
 * 
 * Abstract base class for all Yatra services
 * Provides common functionality and structure
 * 
 * @package Yatra\Core
 */
abstract class Service
{
    /**
     * Service constructor
     */
    public function __construct()
    {
        $this->init();
    }

    /**
     * Initialize the service
     * Override this method in child classes
     * 
     * @return void
     */
    protected function init(): void
    {
        // Override in child classes
    }

    /**
     * Get service name
     * Override this method in child classes
     * 
     * @return string
     */
    public function getName(): string
    {
        return static::class;
    }

    /**
     * Check if service is active
     * Override this method in child classes
     * 
     * @return bool
     */
    public function isActive(): bool
    {
        return true;
    }
}
