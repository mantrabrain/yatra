<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\ItineraryRepository;
use InvalidArgumentException;

/**
 * Itinerary Service
 * Business logic for itinerary entries
 */
class ItineraryService
{
    private ItineraryRepository $repository;

    public function __construct(ItineraryRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Validate itinerary entry data
     */
    public function validate(array $data, ?int $id = null): void
    {
        // Required fields
        if (empty($data['trip_id'])) {
            throw new InvalidArgumentException(__('Trip ID is required', 'yatra'));
        }

        if (empty($data['day'])) {
            throw new InvalidArgumentException(__('Day number is required', 'yatra'));
        }

        if (empty($data['title']) || trim($data['title']) === '') {
            throw new InvalidArgumentException(__('Title is required', 'yatra'));
        }

        // Validate trip exists
        global $wpdb;
        $tripTable = $wpdb->prefix . 'yatra_trips';
        $tripExists = $wpdb->get_var(
            $wpdb->prepare("SELECT COUNT(*) FROM `{$tripTable}` WHERE id = %d", (int) $data['trip_id'])
        );

        if (!$tripExists) {
            throw new InvalidArgumentException(__('Trip not found', 'yatra'));
        }

        // Validate day number
        $dayNumber = (int) $data['day'];
        if ($dayNumber < 1) {
            throw new InvalidArgumentException(__('Day number must be at least 1', 'yatra'));
        }
    }

    /**
     * Create itinerary entry
     */
    public function create(array $data): int
    {
        $this->validate($data);
        return $this->repository->createEntry($data);
    }

    /**
     * Update itinerary entry
     */
    public function update(int $id, array $data): bool
    {
        $this->validate($data, $id);
        return $this->repository->updateEntry($id, $data);
    }

    /**
     * Get itinerary entry by ID
     */
    public function find(int $id): ?\stdClass
    {
        return $this->repository->getEntryWithRelations($id);
    }

    /**
     * Delete itinerary entry
     */
    public function delete(int $id): bool
    {
        return $this->repository->delete($id);
    }
}

