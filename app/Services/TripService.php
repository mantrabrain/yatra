<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\TripRepository;

/**
 * Trip Service
 * Contains business logic for trips
 */
class TripService extends BaseService
{
    /**
     * @var TripRepository
     */
    private TripRepository $repository;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->repository = new TripRepository();
    }

    /**
     * Get repository
     */
    protected function getRepository(): TripRepository
    {
        return $this->repository;
    }

    /**
     * Validate trip data
     */
    protected function validate(array $data, ?int $id = null): void
    {
        if (empty($data['title'])) {
            throw new \InvalidArgumentException('Trip title is required');
        }

        if (empty($data['slug'])) {
            throw new \InvalidArgumentException('Trip slug is required');
        }

        // Check if slug is unique (when creating or updating to different slug)
        $existing = $this->repository->findBySlug($data['slug']);
        if ($existing && ($id === null || $existing->id !== $id)) {
            throw new \InvalidArgumentException('Trip slug must be unique');
        }
    }

    /**
     * Process before create
     */
    protected function processBeforeCreate(array $data): array
    {
        // Generate slug if not provided
        if (empty($data['slug']) && !empty($data['title'])) {
            $data['slug'] = sanitize_title($data['title']);
        }

        // Set default status
        if (empty($data['status'])) {
            $data['status'] = 'draft';
        }

        return $data;
    }

    /**
     * Get active trips
     */
    public function getActiveTrips(array $args = []): array
    {
        return $this->repository->getActive($args);
    }

    /**
     * Count items
     */
    public function count(array $args = []): int
    {
        return $this->repository->count($args);
    }
}

