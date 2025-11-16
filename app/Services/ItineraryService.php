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

        // Check for duplicate day numbers when creating new entries (not when updating)
        // Only check if item_type_id and item_id are null (meaning it's a day creation, not an activity)
        if ($id === null && empty($data['item_type_id']) && empty($data['item_id'])) {
            $tableDays = $wpdb->prefix . 'yatra_trip_itinerary_days';
            $existingDay = $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM `{$tableDays}` 
                     WHERE trip_id = %d AND day_number = %d",
                    (int) $data['trip_id'],
                    $dayNumber
                )
            );

            if ($existingDay > 0) {
                // Get all existing day numbers for this trip
                $existingDays = $wpdb->get_col(
                    $wpdb->prepare(
                        "SELECT day_number FROM `{$tableDays}` 
                         WHERE trip_id = %d 
                         ORDER BY day_number ASC",
                        (int) $data['trip_id']
                    )
                ) ?: [];
                
                // Get next available day number
                $maxDay = $wpdb->get_var(
                    $wpdb->prepare(
                        "SELECT MAX(day_number) FROM `{$tableDays}` WHERE trip_id = %d",
                        (int) $data['trip_id']
                    )
                ) ?: 0;
                $nextDay = (int) $maxDay + 1;
                
                // Format existing days list (e.g., "1, 2" or "1, 2, 3")
                $existingDaysList = implode(', ', $existingDays);
                
                throw new InvalidArgumentException(
                    sprintf(
                        __('Day %s already exists for this trip. Please use day %d instead.', 'yatra'),
                        $existingDaysList,
                        $nextDay
                    )
                );
            }
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

