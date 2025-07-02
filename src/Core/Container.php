<?php

declare(strict_types=1);

namespace Yatra\Core;

/**
 * Simple dependency injection container
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
     * Bind a class or interface to a concrete implementation
     */
    public function bind(string $abstract, $concrete = null): void
    {
        if (is_null($concrete)) {
            $concrete = $abstract;
        }

        $this->bindings[$abstract] = $concrete;
    }

    /**
     * Bind a singleton instance
     */
    public function singleton(string $abstract, $concrete = null): void
    {
        if (is_null($concrete)) {
            $concrete = $abstract;
        }

        $this->bindings[$abstract] = $concrete;
        $this->instances[$abstract] = null;
    }

    /**
     * Resolve a class from the container
     */
    public function make(string $abstract)
    {
        // Return singleton instance if exists
        if (isset($this->instances[$abstract]) && $this->instances[$abstract] !== null) {
            return $this->instances[$abstract];
        }

        $concrete = $this->bindings[$abstract] ?? $abstract;

        if (is_callable($concrete)) {
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
     * Get a resolved instance
     */
    public function get(string $abstract)
    {
        return $this->make($abstract);
    }

    /**
     * Check if a binding exists
     */
    public function has(string $abstract): bool
    {
        return isset($this->bindings[$abstract]) || class_exists($abstract);
    }

    /**
     * Build a concrete instance
     */
    private function build(string $concrete)
    {
        $reflector = new \ReflectionClass($concrete);

        if (!$reflector->isInstantiable()) {
            throw new \Exception("Class {$concrete} is not instantiable");
        }

        $constructor = $reflector->getConstructor();

        if (is_null($constructor)) {
            return new $concrete;
        }

        $dependencies = $this->resolveDependencies($constructor->getParameters());

        return $reflector->newInstanceArgs($dependencies);
    }

    /**
     * Resolve constructor dependencies
     */
    private function resolveDependencies(array $dependencies): array
    {
        $results = [];

        foreach ($dependencies as $dependency) {
            $results[] = $this->resolveDependency($dependency);
        }

        return $results;
    }

    /**
     * Resolve a single dependency
     */
    private function resolveDependency(\ReflectionParameter $dependency)
    {
        $type = $dependency->getType();

        if ($type && !$type->isBuiltin()) {
            return $this->make($type->getName());
        }

        if ($dependency->isDefaultValueAvailable()) {
            return $dependency->getDefaultValue();
        }

        throw new \Exception("Unresolvable dependency: {$dependency->getName()}");
    }
} 