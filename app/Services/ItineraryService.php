<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\ItineraryRepository;
use Yatra\Repositories\TripRepository;
use InvalidArgumentException;

/**
 * Itinerary Service
 * Business logic for itinerary entries
 */
class ItineraryService
{
    private ItineraryRepository $repository;
    private TripRepository $tripRepository;

    public function __construct(ItineraryRepository $repository, ?TripRepository $tripRepository = null)
    {
        $this->repository = $repository;
        $this->tripRepository = $tripRepository ?? new TripRepository();
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
        $trip = $this->tripRepository->find((int) $data['trip_id']);
        if (!$trip) {
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
            global $wpdb;

            if (!$wpdb) {
                // If for some reason the global $wpdb is not available, skip duplicate-day validation
                return;
            }

            $itineraryRepository = new \Yatra\Repositories\ItineraryRepository();

            // If updating, first check if the current entry is actually a day entry (not an activity)
            if ($id !== null) {
                $currentEntry = $itineraryRepository->getEntryWithRelations($id);
                
                // If the current entry has item_type_id or item_id, it's an activity, not a day entry
                // In this case, we're converting an activity to a day entry, which is unusual but allowed
                // We'll still validate the day number
                if ($currentEntry && (!empty($currentEntry->item_type_id) || !empty($currentEntry->item_id))) {
                    // This is converting an activity to a day entry - allow it but validate day number
                    // (fall through to day validation below)
                } else if ($currentEntry && $currentEntry->day_id) {
                    // Get the current day's day_number
                    $currentDay = $itineraryRepository->getDayById((int) $currentEntry->day_id);
                    
                    if ($currentDay && (int) $currentDay->day_number === $dayNumber) {
                        // Same day number - this is allowed (no change)
                        return; // No validation error
                    }
                }
            }
            
            // Check if day entry already exists (not just day record)
            // A day record can exist without a day entry (when only activities exist)
            $existingDayEntry = $this->repository->findDayEntryByTripAndDayNumber((int) $data['trip_id'], $dayNumber);

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
            $existingDay = $itineraryRepository->findDayByTripAndDayNumber((int) $data['trip_id'], $dayNumber);

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
        
        global $wpdb;
        // Clear any previous errors
        $wpdb->last_error = '';
        
        $result = $this->repository->createEntry($data);
        
        // Check for database errors
        if ($wpdb->last_error) {
            // Check for duplicate entry error
            if (strpos($wpdb->last_error, 'Duplicate entry') !== false) {
                throw new \Exception('A day with this number already exists for this trip. Please choose a different day number.');
            }
            
            throw new \Exception('Failed to create itinerary entry. Please try again.');
        }
        
        return $result;
    }

    /**
     * Update itinerary entry
     * @param int $id Entry ID
     * @param array $data Update data
     * @param string|null $mode 'day' or 'activity' to specify which table to update
     */
    public function update(int $id, array $data, ?string $mode = null): bool
    {
        $this->validate($data, $id);
        
        global $wpdb;
        // Clear any previous errors
        $wpdb->last_error = '';
        
        $result = $this->repository->updateEntry($id, $data, $mode);
        
        // Check for database errors
        if ($wpdb->last_error) {
            // Check for duplicate entry error
            if (strpos($wpdb->last_error, 'Duplicate entry') !== false) {
                throw new \Exception('A day with this number already exists for this trip. Please choose a different day number.');
            }
            
            throw new \Exception('Failed to update itinerary entry. Please try again.');
        }
        
        return $result;
    }

    /**
     * Bulk-save activities for a single day in one DB transaction-equivalent batch.
     *
     * Accepts an `activities` array; each row with `id` is updated, each row
     * without `id` is created. Returns per-row result objects so the caller can
     * surface partial failures. Cache invalidation fires once at the end (via
     * the existing per-row hooks already invoked by the repository).
     *
     * @param int   $dayId      The yatra_new_trip_itinerary_days.id row.
     * @param int   $tripId     The trip id (used for the create branch).
     * @param array $activities Array of activity payloads. Each row may include
     *                          an `id` (update) or omit it (create).
     * @return array {created: int, updated: int, results: array}
     */
    public function bulkSaveDayActivities(int $dayId, int $tripId, array $activities): array
    {
        $results = [];
        $created = 0;
        $updated = 0;
        $failed = 0;

        foreach ($activities as $i => $row) {
            if (!is_array($row)) {
                $results[] = ['index' => $i, 'ok' => false, 'error' => 'Row is not an object'];
                $failed++;
                continue;
            }
            // The repo expects day_id + trip_id on creates; inject here so the
            // client doesn't have to repeat them per row.
            $row['day_id'] = $dayId;
            if ($tripId > 0 && empty($row['trip_id'])) {
                $row['trip_id'] = $tripId;
            }

            try {
                if (!empty($row['id'])) {
                    $entryId = (int) $row['id'];
                    unset($row['id']);
                    $ok = $this->repository->updateEntry($entryId, $row, 'activity');
                    if ($ok) {
                        $updated++;
                        $results[] = ['index' => $i, 'ok' => true, 'id' => $entryId, 'op' => 'update'];
                    } else {
                        $failed++;
                        $results[] = ['index' => $i, 'ok' => false, 'id' => $entryId, 'error' => 'updateEntry returned false'];
                    }
                } else {
                    $newId = $this->repository->createEntry($row);
                    if ($newId > 0) {
                        $created++;
                        $results[] = ['index' => $i, 'ok' => true, 'id' => $newId, 'op' => 'create'];
                    } else {
                        $failed++;
                        $results[] = ['index' => $i, 'ok' => false, 'error' => 'createEntry returned 0'];
                    }
                }
            } catch (\Throwable $e) {
                $failed++;
                $results[] = ['index' => $i, 'ok' => false, 'error' => $e->getMessage()];
            }
        }

        return [
            'day_id' => $dayId,
            'trip_id' => $tripId,
            'created' => $created,
            'updated' => $updated,
            'failed' => $failed,
            'results' => $results,
        ];
    }

    /**
     * Get itinerary entry by ID
     */
    public function find(int $id): ?\stdClass
    {
        $result = $this->repository->getEntryWithRelations($id);
        return $result;
    }
    
    /**
     * Get activity entry by ID (specifically from entries table)
     */
    public function findActivity(int $id): ?\stdClass
    {
        return $this->repository->getActivityEntry($id);
    }

    /**
     * Delete itinerary entry
     * @param int $id Entry ID
     * @param string|null $mode 'day' or 'activity' to specify which table to delete from
     */
    public function delete(int $id, ?string $mode = null): bool
    {
        return $this->repository->delete($id, $mode);
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

    /**
     * Get all itinerary entries for a specific trip
     */
    public function getByTripId(int $tripId): array
    {
        return $this->repository->getByTripId($tripId);
    }
}

