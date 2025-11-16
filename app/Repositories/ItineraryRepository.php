<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Repositories\BaseRepository;

/**
 * Itinerary Repository
 * Handles database operations for itinerary entries
 */
class ItineraryRepository extends BaseRepository
{
    /**
     * Get table name
     */
    protected function getTableName(): string
    {
        global $wpdb;
        return $wpdb->prefix . 'yatra_trip_itinerary_entries';
    }

    /**
     * Get or create a day for a trip
     * 
     * @param int $tripId Trip ID
     * @param int $dayNumber Day number
     * @param string|null $dayTitle Day title (optional)
     * @param bool $allowExisting If false, throws exception if day already exists (for new day creation)
     * @return int Day ID
     * @throws \InvalidArgumentException If day exists and $allowExisting is false
     */
    public function getOrCreateDay(int $tripId, int $dayNumber, ?string $dayTitle = null, bool $allowExisting = true): int
    {
        global $wpdb;
        $tableDays = $wpdb->prefix . 'yatra_trip_itinerary_days';

        // Check if day exists
        $existingDay = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT id FROM `{$tableDays}` 
                 WHERE trip_id = %d AND day_number = %d
                 LIMIT 1",
                $tripId,
                $dayNumber
            )
        );

        if ($existingDay) {
            // If not allowing existing days (for new day creation), throw error
            if (!$allowExisting) {
                // Get all existing day numbers for this trip
                $existingDays = $wpdb->get_col(
                    $wpdb->prepare(
                        "SELECT day_number FROM `{$tableDays}` 
                         WHERE trip_id = %d 
                         ORDER BY day_number ASC",
                        $tripId
                    )
                ) ?: [];
                
                // Get next available day number
                $maxDay = $wpdb->get_var(
                    $wpdb->prepare(
                        "SELECT MAX(day_number) FROM `{$tableDays}` WHERE trip_id = %d",
                        $tripId
                    )
                ) ?: 0;
                $nextDay = (int) $maxDay + 1;
                
                // Format existing days list (e.g., "1, 2" or "1, 2, 3")
                $existingDaysList = implode(', ', $existingDays);
                
                throw new \InvalidArgumentException(
                    sprintf(
                        __('Day %s already exists for this trip. Please use day %d instead.', 'yatra'),
                        $existingDaysList,
                        $nextDay
                    )
                );
            }
            
            // Update day title if provided
            if ($dayTitle !== null) {
                $wpdb->update(
                    $tableDays,
                    ['title' => sanitize_text_field($dayTitle)],
                    ['id' => (int) $existingDay->id],
                    ['%s'],
                    ['%d']
                );
            }
            return (int) $existingDay->id;
        }

        // Create new day
        $wpdb->insert(
            $tableDays,
            [
                'trip_id' => $tripId,
                'day_number' => $dayNumber,
                'title' => $dayTitle ? sanitize_text_field($dayTitle) : null,
                'order' => $dayNumber - 1,
            ],
            ['%d', '%d', '%s', '%d']
        );

        return (int) $wpdb->insert_id;
    }

    /**
     * Create itinerary entry
     */
    public function createEntry(array $data): int
    {
        global $wpdb;
        $tableEntries = $this->getTableName();
        $tableItems = $wpdb->prefix . 'yatra_trip_itinerary_entry_items';
        $tableImages = $wpdb->prefix . 'yatra_trip_itinerary_entry_images';

        // Get or create day
        // If item_type_id and item_id are null, it's a day creation - don't allow existing days
        // Otherwise, it's an activity - allow using existing days
        $isDayCreation = empty($data['item_type_id']) && empty($data['item_id']);
        $dayId = $this->getOrCreateDay(
            (int) $data['trip_id'],
            (int) $data['day'],
            $data['day_title'] ?? null,
            !$isDayCreation // Allow existing only if it's an activity, not a day creation
        );

        // Format time field (combine start_time and end_time if needed)
        $timeField = null;
        if (!empty($data['start_time']) && !empty($data['end_time'])) {
            $timeField = $data['start_time'] . ' - ' . $data['end_time'];
        } elseif (!empty($data['start_time'])) {
            $timeField = $data['start_time'];
        }

        // Get max order for this day
        $maxOrder = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT MAX(`order`) FROM `{$tableEntries}` WHERE day_id = %d",
                $dayId
            )
        ) ?: 0;

        // Prepare included_items and excluded_items as JSON
        $includedItemsJson = !empty($data['included_items']) && is_array($data['included_items']) 
            ? json_encode($data['included_items']) 
            : null;
        $excludedItemsJson = !empty($data['excluded_items']) && is_array($data['excluded_items']) 
            ? json_encode($data['excluded_items']) 
            : null;
        
        // Insert entry with all fields
        $wpdb->insert(
            $tableEntries,
            [
                'trip_id' => (int) $data['trip_id'],
                'day_id' => $dayId,
                'title' => sanitize_text_field($data['title']),
                'description' => !empty($data['description']) ? wp_kses_post($data['description']) : null,
                'time' => $timeField,
                'start_time' => !empty($data['start_time']) ? sanitize_text_field($data['start_time']) : null,
                'end_time' => !empty($data['end_time']) ? sanitize_text_field($data['end_time']) : null,
                'time_type' => !empty($data['time_type']) ? sanitize_text_field($data['time_type']) : 'exact',
                'location' => !empty($data['location']) ? sanitize_text_field($data['location']) : null,
                'duration' => !empty($data['duration']) ? sanitize_text_field($data['duration']) : null,
                'cost' => !empty($data['cost']) ? (float) $data['cost'] : null,
                'cost_per_person' => !empty($data['cost_per_person']) ? 1 : 0,
                'notes' => !empty($data['notes']) ? wp_kses_post($data['notes']) : null,
                'included_items' => $includedItemsJson,
                'excluded_items' => $excludedItemsJson,
                'item_type_id' => !empty($data['item_type_id']) ? (int) $data['item_type_id'] : null,
                'item_id' => !empty($data['item_id']) ? (int) $data['item_id'] : null,
                'status' => !empty($data['status']) ? sanitize_text_field($data['status']) : 'draft',
                'order' => (int) $maxOrder + 1,
            ],
            ['%d', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%f', '%d', '%s', '%s', '%s', '%d', '%d', '%s', '%d']
        );

        $entryId = (int) $wpdb->insert_id;

        // Note: included_items and excluded_items are no longer stored in a separate table
        // They can be stored as JSON in the entry if needed in the future

        // Save images if provided
        if (!empty($data['images']) && is_array($data['images'])) {
            foreach ($data['images'] as $index => $imageUrl) {
                if (!empty($imageUrl)) {
                    $wpdb->insert(
                        $tableImages,
                        [
                            'entry_id' => $entryId,
                            'image_url' => esc_url_raw($imageUrl),
                            'order' => $index,
                        ],
                        ['%d', '%s', '%d']
                    );
                }
            }
        }

        return $entryId;
    }

    /**
     * Update itinerary entry
     */
    public function updateEntry(int $entryId, array $data): bool
    {
        global $wpdb;
        $tableEntries = $this->getTableName();
        $tableImages = $wpdb->prefix . 'yatra_trip_itinerary_entry_images';

        // Get existing entry to get day_id
        $existingEntry = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM `{$tableEntries}` WHERE id = %d", $entryId)
        );

        if (!$existingEntry) {
            return false;
        }

        $dayId = (int) $existingEntry->day_id;
        $tripId = (int) $existingEntry->trip_id;

        // Update day if day_number or day_title changed
        if (isset($data['day']) || isset($data['day_title'])) {
            $newDayNumber = isset($data['day']) ? (int) $data['day'] : null;
            $newDayTitle = $data['day_title'] ?? null;
            
            if ($newDayNumber !== null) {
                // When updating, allow using existing days (activities can be moved to existing days)
                $dayId = $this->getOrCreateDay($tripId, $newDayNumber, $newDayTitle, true);
            } elseif ($newDayTitle !== null) {
                $tableDays = $wpdb->prefix . 'yatra_trip_itinerary_days';
                $wpdb->update(
                    $tableDays,
                    ['title' => sanitize_text_field($newDayTitle)],
                    ['id' => $dayId],
                    ['%s'],
                    ['%d']
                );
            }
        }

        // Format time field
        $timeField = null;
        if (!empty($data['start_time']) && !empty($data['end_time'])) {
            $timeField = $data['start_time'] . ' - ' . $data['end_time'];
        } elseif (!empty($data['start_time'])) {
            $timeField = $data['start_time'];
        } elseif (isset($data['time'])) {
            $timeField = $data['time'];
        }

        // Prepare included_items and excluded_items as JSON
        $includedItemsJson = null;
        if (isset($data['included_items'])) {
            if (is_array($data['included_items'])) {
                $includedItemsJson = json_encode($data['included_items']);
            } elseif (is_string($data['included_items'])) {
                $includedItemsJson = $data['included_items'];
            }
        }
        
        $excludedItemsJson = null;
        if (isset($data['excluded_items'])) {
            if (is_array($data['excluded_items'])) {
                $excludedItemsJson = json_encode($data['excluded_items']);
            } elseif (is_string($data['excluded_items'])) {
                $excludedItemsJson = $data['excluded_items'];
            }
        }
        
        // Prepare update data
        $updateData = [];
        $updateFormat = [];

        if (isset($data['title'])) {
            $updateData['title'] = sanitize_text_field($data['title']);
            $updateFormat[] = '%s';
        }

        if (isset($data['description'])) {
            $updateData['description'] = !empty($data['description']) ? wp_kses_post($data['description']) : null;
            $updateFormat[] = '%s';
        }

        if ($timeField !== null) {
            $updateData['time'] = $timeField;
            $updateFormat[] = '%s';
        }

        if (isset($data['start_time'])) {
            $updateData['start_time'] = !empty($data['start_time']) ? sanitize_text_field($data['start_time']) : null;
            $updateFormat[] = '%s';
        }

        if (isset($data['end_time'])) {
            $updateData['end_time'] = !empty($data['end_time']) ? sanitize_text_field($data['end_time']) : null;
            $updateFormat[] = '%s';
        }

        if (isset($data['time_type'])) {
            $updateData['time_type'] = sanitize_text_field($data['time_type']);
            $updateFormat[] = '%s';
        }

        if (isset($data['location'])) {
            $updateData['location'] = !empty($data['location']) ? sanitize_text_field($data['location']) : null;
            $updateFormat[] = '%s';
        }

        if (isset($data['duration'])) {
            $updateData['duration'] = !empty($data['duration']) ? sanitize_text_field($data['duration']) : null;
            $updateFormat[] = '%s';
        }

        if (isset($data['cost'])) {
            $updateData['cost'] = !empty($data['cost']) ? (float) $data['cost'] : null;
            $updateFormat[] = '%f';
        }

        if (isset($data['cost_per_person'])) {
            $updateData['cost_per_person'] = !empty($data['cost_per_person']) ? 1 : 0;
            $updateFormat[] = '%d';
        }

        if (isset($data['notes'])) {
            $updateData['notes'] = !empty($data['notes']) ? wp_kses_post($data['notes']) : null;
            $updateFormat[] = '%s';
        }

        if ($includedItemsJson !== null) {
            $updateData['included_items'] = $includedItemsJson;
            $updateFormat[] = '%s';
        }

        if ($excludedItemsJson !== null) {
            $updateData['excluded_items'] = $excludedItemsJson;
            $updateFormat[] = '%s';
        }

        if (isset($data['item_type_id'])) {
            $updateData['item_type_id'] = !empty($data['item_type_id']) ? (int) $data['item_type_id'] : null;
            $updateFormat[] = '%d';
        }

        if (isset($data['item_id'])) {
            $updateData['item_id'] = !empty($data['item_id']) ? (int) $data['item_id'] : null;
            $updateFormat[] = '%d';
        }

        if (isset($data['status'])) {
            $updateData['status'] = sanitize_text_field($data['status']);
            $updateFormat[] = '%s';
        }

        if ($dayId !== (int) $existingEntry->day_id) {
            $updateData['day_id'] = $dayId;
            $updateFormat[] = '%d';
        }

        if (!empty($updateData)) {
            $wpdb->update(
                $tableEntries,
                $updateData,
                ['id' => $entryId],
                $updateFormat,
                ['%d']
            );
        }

        // Note: included_items and excluded_items are no longer stored in a separate table

        // Update images if provided
        if (isset($data['images']) && is_array($data['images'])) {
            // Delete existing images
            $wpdb->delete($tableImages, ['entry_id' => $entryId], ['%d']);

            // Insert new images
            foreach ($data['images'] as $index => $imageUrl) {
                if (!empty($imageUrl)) {
                    $wpdb->insert(
                        $tableImages,
                        [
                            'entry_id' => $entryId,
                            'image_url' => esc_url_raw($imageUrl),
                            'order' => $index,
                        ],
                        ['%d', '%s', '%d']
                    );
                }
            }
        }

        return true;
    }

    /**
     * Get item_type_id and item_id from activity_type string
     */
    private function getItemIdsFromActivityType(string $activityType): ?array
    {
        global $wpdb;
        $tableItems = $wpdb->prefix . 'yatra_items';
        $tableItemTypes = $wpdb->prefix . 'yatra_item_types';

        // First try to find by item name (exact match)
        $item = $wpdb->get_row(
            $wpdb->prepare("SELECT id, type_id FROM `{$tableItems}` WHERE name = %s LIMIT 1", $activityType)
        );

        if ($item) {
            return [
                'item_type_id' => (int) $item->type_id,
                'item_id' => (int) $item->id,
            ];
        }

        // Fallback: try to find by item type name
        $itemType = $wpdb->get_row(
            $wpdb->prepare("SELECT id FROM `{$tableItemTypes}` WHERE name = %s LIMIT 1", $activityType)
        );

        if ($itemType) {
            // Get first item of this type
            $firstItem = $wpdb->get_row(
                $wpdb->prepare("SELECT id FROM `{$tableItems}` WHERE type_id = %d LIMIT 1", (int) $itemType->id)
            );

            if ($firstItem) {
                return [
                    'item_type_id' => (int) $itemType->id,
                    'item_id' => (int) $firstItem->id,
                ];
            }

            // Return just the type if no items found
            return [
                'item_type_id' => (int) $itemType->id,
                'item_id' => 0,
            ];
        }

        return null;
    }

    /**
     * Get activity type from item_type_id and item_id
     */
    private function getActivityTypeFromItems(int $itemTypeId, int $itemId): ?string
    {
        if ($itemTypeId <= 0 || $itemId <= 0) {
            return null;
        }

        global $wpdb;
        $tableItems = $wpdb->prefix . 'yatra_items';
        $tableItemTypes = $wpdb->prefix . 'yatra_item_types';

        // Get item name
        $item = $wpdb->get_row(
            $wpdb->prepare("SELECT name FROM `{$tableItems}` WHERE id = %d", $itemId)
        );

        if ($item && !empty($item->name)) {
            return $item->name;
        }

        // Fallback: get item type name
        $itemType = $wpdb->get_row(
            $wpdb->prepare("SELECT name FROM `{$tableItemTypes}` WHERE id = %d", $itemTypeId)
        );

        return $itemType && !empty($itemType->name) ? $itemType->name : null;
    }

    /**
     * Get entry with related data
     */
    public function getEntryWithRelations(int $entryId): ?\stdClass
    {
        global $wpdb;
        $tableEntries = $this->getTableName();
        $tableImages = $wpdb->prefix . 'yatra_trip_itinerary_entry_images';
        $tableDays = $wpdb->prefix . 'yatra_trip_itinerary_days';

        // Get entry
        $entry = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM `{$tableEntries}` WHERE id = %d", $entryId)
        );

        if (!$entry) {
            return null;
        }

        // Get day info
        $day = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM `{$tableDays}` WHERE id = %d", (int) $entry->day_id)
        );

        if ($day) {
            $entry->day_number = (int) $day->day_number;
            $entry->day_title = $day->title;
        }

        // Note: included_items and excluded_items are no longer stored in a separate table
        $entry->included_items = [];
        $entry->excluded_items = [];

        // Get images
        $images = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT image_url FROM `{$tableImages}` 
                 WHERE entry_id = %d
                 ORDER BY `order` ASC",
                $entryId
            )
        );

        $entry->images = array_map(function ($img) {
            return $img->image_url ?? '';
        }, $images);

        // Parse time field to start_time and end_time
        if (!empty($entry->time)) {
            $timeParts = preg_split('/\s*-\s*|\s+to\s+/i', $entry->time);
            if (count($timeParts) >= 2) {
                $entry->start_time = trim($timeParts[0]);
                $entry->end_time = trim($timeParts[1]);
            } elseif (count($timeParts) === 1) {
                $entry->start_time = trim($timeParts[0]);
                $entry->end_time = null;
            }
        }

        // item_type_id and item_id are now stored directly in the entry
        // No need to map from activity_type anymore

        return $entry;
    }

    /**
     * Delete entry and related data
     */
    public function delete(int $id): bool
    {
        global $wpdb;
        $tableEntries = $this->getTableName();
        $tableImages = $wpdb->prefix . 'yatra_trip_itinerary_entry_images';

        // Note: included_items and excluded_items table has been removed

        // Delete related images
        $wpdb->delete($tableImages, ['entry_id' => $id], ['%d']);

        // Delete entry
        $result = $wpdb->delete($tableEntries, ['id' => $id], ['%d']);

        return $result !== false;
    }
}

