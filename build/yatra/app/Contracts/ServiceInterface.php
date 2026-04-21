<?php

declare(strict_types=1);

namespace Yatra\Contracts;

/**
 * Service Interface
 * 
 * Defines standard contract for all service classes
 */
interface ServiceInterface
{
    /**
     * Get item by ID
     */
    public function getById(int $id): ?\stdClass;

    /**
     * Get all items with filters
     */
    public function getAll(array $filters = []): array;

    /**
     * Create new item
     */
    public function create(array $data): int;

    /**
     * Update existing item
     */
    public function update(int $id, array $data): bool;

    /**
     * Delete item
     */
    public function delete(int $id): bool;

    /**
     * Validate data for creation
     */
    public function validateCreate(array $data): void;

    /**
     * Validate data for update
     */
    public function validateUpdate(int $id, array $data): void;
}
