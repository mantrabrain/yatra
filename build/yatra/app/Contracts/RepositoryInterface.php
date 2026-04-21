<?php

declare(strict_types=1);

namespace Yatra\Contracts;

/**
 * Repository Interface
 * 
 * Defines standard contract for all repository classes
 */
interface RepositoryInterface
{
    /**
     * Find record by ID
     */
    public function find(int $id): ?\stdClass;

    /**
     * Get all records with optional filters
     */
    public function all(array $filters = []): array;

    /**
     * Create new record
     */
    public function create(array $data): int;

    /**
     * Update existing record
     */
    public function update(int $id, array $data): bool;

    /**
     * Delete record
     */
    public function delete(int $id): bool;

    /**
     * Count records with optional filters
     */
    public function count(array $filters = []): int;

    /**
     * Check if record exists
     */
    public function exists(int $id): bool;

    /**
     * Get paginated results
     */
    public function paginate(int $page = 1, int $perPage = 10, array $filters = []): array;
}
