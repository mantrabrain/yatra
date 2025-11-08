<?php

declare(strict_types=1);

namespace Yatra\Core;

/**
 * Simple Dependency Injection Container
 */
class Container
{
    /**
     * @var array
     */
    private array $bindings = [];

    /**
     * @var array
     */
    private array $instances = [];

    /**
     * Bind a class or closure to the container
     */
    public function bind(string $abstract, $concrete): void
    {
        $this->bindings[$abstract] = $concrete;
    }

    /**
     * Bind a singleton instance
     */
    public function singleton(string $abstract, $concrete): void
    {
        $this->bind($abstract, $concrete);
        $this->instances[$abstract] = null;
    }

    /**
     * Resolve a class from the container
     */
    public function make(string $abstract)
    {
        // Return if already resolved as singleton
        if (isset($this->instances[$abstract]) && $this->instances[$abstract] !== null) {
            return $this->instances[$abstract];
        }

        // Get concrete implementation
        $concrete = $this->bindings[$abstract] ?? $abstract;

        // If concrete is a closure, call it
        if (is_callable($concrete) && !is_string($concrete)) {
            $instance = $concrete($this);
        } else {
            $instance = $this->build($concrete);
        }

        // Store singleton instance
        if (isset($this->instances[$abstract])) {
            $this->instances[$abstract] = $instance;
        }

        return $instance;
    }

    /**
     * Build an instance of a class
     */
    private function build(string $class)
    {
        $reflection = new \ReflectionClass($class);
        
        if (!$reflection->isInstantiable()) {
            throw new \Exception("Class {$class} is not instantiable");
        }

        $constructor = $reflection->getConstructor();

        if ($constructor === null) {
            return new $class();
        }

        $parameters = $constructor->getParameters();
        $dependencies = [];

        foreach ($parameters as $parameter) {
            $type = $parameter->getType();

            if ($type === null || $type->isBuiltin()) {
                if ($parameter->isDefaultValueAvailable()) {
                    $dependencies[] = $parameter->getDefaultValue();
                } else {
                    throw new \Exception("Cannot resolve dependency {$parameter->getName()}");
                }
            } else {
                $dependency = $type->getName();
                $dependencies[] = $this->make($dependency);
            }
        }

        return $reflection->newInstanceArgs($dependencies);
    }

    /**
     * Check if abstract is bound
     */
    public function has(string $abstract): bool
    {
        return isset($this->bindings[$abstract]);
    }

    /**
     * Get an instance (alias for make)
     */
    public function get(string $abstract)
    {
        return $this->make($abstract);
    }
}

