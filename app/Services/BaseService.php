<?php

declare(strict_types=1);

namespace Yatra\Services;

/**
 * Base Service Class
 * Contains business logic layer
 */
abstract class BaseService
{
    /**
     * Get repository instance
     */
    abstract protected function getRepository();

    /**
     * Get all items
     */
    public function getAll(array $args = []): array
    {
        return $this->getRepository()->all($args);
    }

    /**
     * Get item by ID
     */
    public function getById(int $id): ?\stdClass
    {
        return $this->getRepository()->find($id);
    }

    /**
     * Create new item
     */
    public function create(array $data): int
    {
        // Validate data
        $this->validate($data);

        // Process data before creation
        $data = $this->processBeforeCreate($data);

        // Create record
        $id = $this->getRepository()->create($data);

        // Process after creation
        $this->processAfterCreate($id, $data);

        return $id;
    }

    /**
     * Update item
     */
    public function update(int $id, array $data): bool
    {
        // Validate data
        $this->validate($data, $id);

        // Process data before update
        $data = $this->processBeforeUpdate($id, $data);

        // Update record
        $result = $this->getRepository()->update($id, $data);

        // Process after update
        if ($result) {
            $this->processAfterUpdate($id, $data);
        }

        return $result;
    }

    /**
     * Delete item
     */
    public function delete(int $id): bool
    {
        // Process before delete
        $this->processBeforeDelete($id);

        // Delete record
        $result = $this->getRepository()->delete($id);

        // Process after delete
        if ($result) {
            $this->processAfterDelete($id);
        }

        return $result;
    }

    /**
     * Validate data (override in child classes)
     */
    protected function validate(array $data, ?int $id = null): void
    {
        // Override in child classes
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

