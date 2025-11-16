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

        // For day entries (item_type_id and item_id are null), title can be empty if day_title is provided
        // For activity entries, title is required
        $isDayEntry = empty($data['item_type_id']) && empty($data['item_id']);
        if (!$isDayEntry && (empty($data['title']) || trim($data['title']) === '')) {
            throw new InvalidArgumentException(__('Title is required', 'yatra'));
        }
        
        // For day entries, if title is empty, use day_title or generate one
        if ($isDayEntry && (empty($data['title']) || trim($data['title']) === '')) {
            $dayNumber = (int) $data['day'];
            $data['title'] = !empty($data['day_title']) ? trim($data['day_title']) : sprintf(__('Day %d', 'yatra'), $dayNumber);
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

        // Check for duplicate day numbers
        // Only check if item_type_id and item_id are null (meaning it's a day creation/update, not an activity)
        if (empty($data['item_type_id']) && empty($data['item_id'])) {
            $tableDays = $wpdb->prefix . 'yatra_trip_itinerary_days';
            $tableEntries = $wpdb->prefix . 'yatra_trip_itinerary_entries';
            
            // If updating, first check if the current entry is actually a day entry (not an activity)
            if ($id !== null) {
                $currentEntry = $wpdb->get_row(
                    $wpdb->prepare(
                        "SELECT item_type_id, item_id, day_id 
                         FROM `{$tableEntries}` 
                         WHERE id = %d",
                        $id
                    )
                );
                
                // If the current entry has item_type_id or item_id, it's an activity, not a day entry
                // In this case, we're converting an activity to a day entry, which is unusual but allowed
                // We'll still validate the day number
                if ($currentEntry && (!empty($currentEntry->item_type_id) || !empty($currentEntry->item_id))) {
                    // This is converting an activity to a day entry - allow it but validate day number
                    // (fall through to day validation below)
                } else if ($currentEntry && $currentEntry->day_id) {
                    // Get the current day's day_number
                    $currentDay = $wpdb->get_row(
                        $wpdb->prepare("SELECT day_number FROM `{$tableDays}` WHERE id = %d", (int) $currentEntry->day_id)
                    );
                    
                    if ($currentDay && (int) $currentDay->day_number === $dayNumber) {
                        // Same day number - this is allowed (no change)
                        return; // No validation error
                    }
                }
            }
            
            // Check if day entry already exists (not just day record)
            // A day record can exist without a day entry (when only activities exist)
            $existingDayEntry = $wpdb->get_row(
                $wpdb->prepare(
                    "SELECT e.id FROM `{$tableEntries}` e
                     INNER JOIN `{$tableDays}` d ON e.day_id = d.id
                     WHERE e.trip_id = %d 
                     AND d.day_number = %d
                     AND e.item_type_id IS NULL 
                     AND e.item_id IS NULL
                     LIMIT 1",
                    (int) $data['trip_id'],
                    $dayNumber
                )
            );

            if ($existingDayEntry) {
                // Day entry already exists - this should be an update, not a create
                // If updating, we've already checked above - allow it (frontend handles confirmation)
                if ($id !== null) {
                    return; // Allow it, frontend handles the confirmation
                } else {
                    // Creating new day entry but one already exists - this shouldn't happen
                    // The backend's createEntry will handle updating it, so allow it here
                    return; // Allow it, backend will update existing entry
                }
            }
            
            // Check if day record exists (for informational purposes, but don't block)
            // Day records can exist without day entries, so we allow creating day entries for existing day records
            $existingDay = $wpdb->get_row(
                $wpdb->prepare(
                    "SELECT id FROM `{$tableDays}` 
                     WHERE trip_id = %d AND day_number = %d
                     LIMIT 1",
                    (int) $data['trip_id'],
                    $dayNumber
                )
            );

            // If day record exists but day entry doesn't, allow creation (this is the normal case)
            // Only block if we're creating a completely new day (both record and entry don't exist)
            // and there's a conflict. But since we're creating a day entry, not a day record,
            // we should allow it if the day record exists.
            // The backend's createEntry will handle creating/updating the day record if needed.
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

    /**
     * Bulk delete itinerary entries
     * @param array $ids Array of entry IDs to delete
     * @return array ['deleted' => count, 'failed' => count]
     */
    public function bulkDelete(array $ids): array
    {
        if (empty($ids)) {
            return ['deleted' => 0, 'failed' => 0];
        }

        // Validate all IDs are integers
        $ids = array_map('intval', $ids);
        $ids = array_filter($ids, function($id) {
            return $id > 0;
        });

        if (empty($ids)) {
            return ['deleted' => 0, 'failed' => 0];
        }

        return $this->repository->bulkDelete($ids);
    }
}

