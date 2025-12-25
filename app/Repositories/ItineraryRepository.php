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
     * @param string|null $dayDescription Day description (optional)
     * @param bool $allowExisting If false, throws exception if day already exists (for new day creation)
     * @return int Day ID
     * @throws \InvalidArgumentException If day exists and $allowExisting is false
     */
    public function getOrCreateDay(int $tripId, int $dayNumber, ?string $dayTitle = null, ?string $dayDescription = null, bool $allowExisting = true): int
    {
        error_log("[YATRA DEBUG] ItineraryRepository::getOrCreateDay - Called with:");
        error_log("[YATRA DEBUG]   trip_id: $tripId");
        error_log("[YATRA DEBUG]   day_number: $dayNumber");
        error_log("[YATRA DEBUG]   day_title: " . ($dayTitle ?? 'NULL'));
        error_log("[YATRA DEBUG]   day_description: " . ($dayDescription ?? 'NULL'));
        error_log("[YATRA DEBUG]   allowExisting: " . ($allowExisting ? 'TRUE' : 'FALSE'));
        
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
            
            // Update day title and description if provided
            $updateData = [];
            $updateFormat = [];
            
            if ($dayTitle !== null) {
                $updateData['title'] = sanitize_text_field($dayTitle);
                $updateFormat[] = '%s';
            }
            
            if ($dayDescription !== null) {
                $updateData['description'] = wp_kses_post($dayDescription);
                $updateFormat[] = '%s';
            }
            
            if (!empty($updateData)) {
                error_log("[YATRA DEBUG] ItineraryRepository::getOrCreateDay - Updating existing day with data: " . print_r($updateData, true));
                $result = $wpdb->update(
                    $tableDays,
                    $updateData,
                    ['id' => (int) $existingDay->id],
                    $updateFormat,
                    ['%d']
                );
                error_log("[YATRA DEBUG] ItineraryRepository::getOrCreateDay - Update result: $result");
                error_log("[YATRA DEBUG] ItineraryRepository::getOrCreateDay - WPDB last_error: " . $wpdb->last_error);
            }
            return (int) $existingDay->id;
        }

        // Create new day
        $insertData = [
            'trip_id' => $tripId,
            'day_number' => $dayNumber,
            'title' => $dayTitle ? sanitize_text_field($dayTitle) : null,
            'description' => $dayDescription ? wp_kses_post($dayDescription) : null,
            'order' => $dayNumber - 1,
        ];
        error_log("[YATRA DEBUG] ItineraryRepository::getOrCreateDay - Creating new day with data: " . print_r($insertData, true));
        $wpdb->insert(
            $tableDays,
            $insertData,
            ['%d', '%d', '%s', '%s', '%d']
        );
        error_log("[YATRA DEBUG] ItineraryRepository::getOrCreateDay - Insert result: " . $wpdb->insert_id);
        error_log("[YATRA DEBUG] ItineraryRepository::getOrCreateDay - WPDB last_error: " . $wpdb->last_error);

        return (int) $wpdb->insert_id;
    }

    /**
     * Create itinerary entry
     */
    public function createEntry(array $data): int
    {
        error_log("[YATRA DEBUG] ItineraryRepository::createEntry - Input data: " . print_r($data, true));
        error_log("[YATRA DEBUG] ItineraryRepository::createEntry - day_description: " . ($data['day_description'] ?? 'NOT_SET'));
        
        global $wpdb;
        $tableEntries = $this->getTableName();
        $tableDays = $wpdb->prefix . 'yatra_trip_itinerary_days';
        $tableItems = $wpdb->prefix . 'yatra_trip_itinerary_entry_items';
        $tableImages = $wpdb->prefix . 'yatra_trip_itinerary_entry_images';

        // Get or create day
        // If item_type_id and item_id are null, it's a day entry
        // For day entries, we allow existing days (because we might be updating)
        // For activities, we also allow existing days
        $isDayCreation = empty($data['item_type_id']) && empty($data['item_id']);
        error_log("[YATRA DEBUG] ItineraryRepository::createEntry - Calling getOrCreateDay with:");
        error_log("[YATRA DEBUG]   trip_id: " . (int) $data['trip_id']);
        error_log("[YATRA DEBUG]   day: " . (int) $data['day']);
        error_log("[YATRA DEBUG]   day_title: " . ($data['day_title'] ?? null));
        error_log("[YATRA DEBUG]   day_description: " . ($data['day_description'] ?? null));
        
        $dayId = $this->getOrCreateDay(
            (int) $data['trip_id'],
            (int) $data['day'],
            $data['day_title'] ?? null,
            $data['day_description'] ?? null,
            true // Always allow existing days - we'll check for duplicate day entries separately
        );

        // If this is a day entry (item_type_id and item_id are null), check if a day entry already exists
        // If it does, update it instead of creating a new one
        if ($isDayCreation) {
            // Check for existing day entry by trip_id and day_number (more robust than just day_id)
            // This ensures we find the day entry even if day_id changes
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
                    (int) $data['day']
                )
            );
            
            if ($existingDayEntry) {
                // Day entry already exists, update it instead of creating a new one
                return $this->updateEntry((int) $existingDayEntry->id, $data) ? (int) $existingDayEntry->id : 0;
            }
        }

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
        if (isset($data['day']) || isset($data['day_title']) || isset($data['day_description'])) {
            $newDayNumber = isset($data['day']) ? (int) $data['day'] : null;
            $newDayTitle = $data['day_title'] ?? null;
            $newDayDescription = $data['day_description'] ?? null;
            
            if ($newDayNumber !== null) {
                // Get current day number from existing entry's day
                $tableDays = $wpdb->prefix . 'yatra_trip_itinerary_days';
                $currentDay = $wpdb->get_row(
                    $wpdb->prepare("SELECT day_number FROM `{$tableDays}` WHERE id = %d", $dayId)
                );
                $currentDayNumber = $currentDay ? (int) $currentDay->day_number : null;
                
                // If day number hasn't changed, just update the title and description if needed
                if ($currentDayNumber !== null && $newDayNumber === $currentDayNumber) {
                    $updateData = [];
                    $updateFormat = [];
                    
                    if ($newDayTitle !== null) {
                        $updateData['title'] = sanitize_text_field($newDayTitle);
                        $updateFormat[] = '%s';
                    }
                    
                    if ($newDayDescription !== null) {
                        $updateData['description'] = wp_kses_post($newDayDescription);
                        $updateFormat[] = '%s';
                    }
                    
                    if (!empty($updateData)) {
                        $wpdb->update(
                            $tableDays,
                            $updateData,
                            ['id' => $dayId],
                            $updateFormat,
                            ['%d']
                        );
                    }
                    // Keep using the same dayId, no need to call getOrCreateDay
                } else {
                    // Day number changed - allow using existing days (activities can be moved to existing days)
                    $dayId = $this->getOrCreateDay($tripId, $newDayNumber, $newDayTitle, $newDayDescription, true);
                }
            } elseif ($newDayTitle !== null || $newDayDescription !== null) {
                $tableDays = $wpdb->prefix . 'yatra_trip_itinerary_days';
                $updateData = [];
                $updateFormat = [];
                
                if ($newDayTitle !== null) {
                    $updateData['title'] = sanitize_text_field($newDayTitle);
                    $updateFormat[] = '%s';
                }
                
                if ($newDayDescription !== null) {
                    $updateData['description'] = wp_kses_post($newDayDescription);
                    $updateFormat[] = '%s';
                }
                
                if (!empty($updateData)) {
                    $wpdb->update(
                        $tableDays,
                        $updateData,
                        ['id' => $dayId],
                        $updateFormat,
                        ['%d']
                    );
                }
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
            error_log("[YATRA DEBUG] ItineraryRepository::getEntryWithRelations - Day data found:");
            error_log("[YATRA DEBUG]   day_id: " . $day->id);
            error_log("[YATRA DEBUG]   day_number: " . $day->day_number);
            error_log("[YATRA DEBUG]   day_title: '" . ($day->title ?? 'NULL') . "'");
            error_log("[YATRA DEBUG]   day_description: '" . ($day->description ?? 'NULL') . "'");
            
            $entry->day_number = (int) $day->day_number;
            $entry->day_title = $day->title;
            $entry->day_description = $day->description;
            
            error_log("[YATRA DEBUG] ItineraryRepository::getEntryWithRelations - Set entry->day_description: '" . ($entry->day_description ?? 'NULL') . "'");
        } else {
            error_log("[YATRA DEBUG] ItineraryRepository::getEntryWithRelations - No day data found for day_id: " . (int) $entry->day_id);
        }

        // Decode included/excluded items JSON columns (stored directly on the entry)
        $entry->included_items = $this->decodeAmenityItems($entry->included_items ?? null);
        $entry->excluded_items = $this->decodeAmenityItems($entry->excluded_items ?? null);

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
     * Decode included/excluded items JSON column
     */
    private function decodeAmenityItems($value): array
    {
        if (empty($value)) {
            return [];
        }

        if (is_array($value)) {
            return $value;
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : [];
        }

        return [];
    }

    /**
     * Delete entry and related data
     * If deleting a day entry, also delete all activities for that day
     */
    public function delete(int $id): bool
    {
        global $wpdb;
        $tableEntries = $this->getTableName();
        $tableImages = $wpdb->prefix . 'yatra_trip_itinerary_entry_images';
        $tableDays = $wpdb->prefix . 'yatra_trip_itinerary_days';

        // Get the entry to check if it's a day entry
        $entry = $wpdb->get_row(
            $wpdb->prepare("SELECT day_id, item_type_id, item_id FROM `{$tableEntries}` WHERE id = %d", $id)
        );

        if (!$entry) {
            return false;
        }

        $dayId = (int) $entry->day_id;
        $isDayEntry = ($entry->item_type_id === null || $entry->item_type_id === 0) && 
                      ($entry->item_id === null || $entry->item_id === 0);

        // If this is a day entry, delete all entries for this day (activities + day entry)
        if ($isDayEntry) {
            // Get all entry IDs for this day
            $dayEntryIds = $wpdb->get_col(
                $wpdb->prepare("SELECT id FROM `{$tableEntries}` WHERE day_id = %d", $dayId)
            );

            if (!empty($dayEntryIds)) {
                // Delete images for all entries
                $placeholders = implode(',', array_fill(0, count($dayEntryIds), '%d'));
                $wpdb->query(
                    $wpdb->prepare(
                        "DELETE FROM `{$tableImages}` WHERE entry_id IN ($placeholders)",
                        ...$dayEntryIds
                    )
                );

                // Delete all entries for this day
                $wpdb->delete($tableEntries, ['day_id' => $dayId], ['%d']);

                // Delete the day itself
                $wpdb->delete($tableDays, ['id' => $dayId], ['%d']);
            }

            return true;
        }

        // For activity entries, just delete the entry and its images
        // Delete related images
        $wpdb->delete($tableImages, ['entry_id' => $id], ['%d']);

        // Delete entry
        $result = $wpdb->delete($tableEntries, ['id' => $id], ['%d']);

        return $result !== false;
    }

    /**
     * Bulk delete entries
     * @param array $ids Array of entry IDs to delete
     * @return array ['deleted' => count, 'failed' => count]
     */
    public function bulkDelete(array $ids): array
    {
        global $wpdb;
        $tableEntries = $this->getTableName();
        $tableImages = $wpdb->prefix . 'yatra_trip_itinerary_entry_images';
        $tableDays = $wpdb->prefix . 'yatra_trip_itinerary_days';

        if (empty($ids)) {
            return ['deleted' => 0, 'failed' => 0];
        }

        // Sanitize IDs
        $ids = array_map('intval', $ids);
        $ids = array_filter($ids, function($id) {
            return $id > 0;
        });

        if (empty($ids)) {
            return ['deleted' => 0, 'failed' => 0];
        }

        $deleted = 0;
        $failed = 0;
        $processedDayIds = []; // Track days we've already processed

        foreach ($ids as $id) {
            try {
                // Get the entry to check if it's a day entry
                $entry = $wpdb->get_row(
                    $wpdb->prepare("SELECT day_id, item_type_id, item_id FROM `{$tableEntries}` WHERE id = %d", $id)
                );

                if (!$entry) {
                    $failed++;
                    continue;
                }

                $dayId = (int) $entry->day_id;
                $isDayEntry = ($entry->item_type_id === null || $entry->item_type_id === 0) && 
                              ($entry->item_id === null || $entry->item_id === 0);

                // If this is a day entry, delete all entries for this day
                if ($isDayEntry) {
                    // Skip if we've already processed this day
                    if (in_array($dayId, $processedDayIds)) {
                        continue;
                    }

                    $processedDayIds[] = $dayId;

                    // Get all entry IDs for this day
                    $dayEntryIds = $wpdb->get_col(
                        $wpdb->prepare("SELECT id FROM `{$tableEntries}` WHERE day_id = %d", $dayId)
                    );

                    if (!empty($dayEntryIds)) {
                        // Delete images for all entries
                        $placeholders = implode(',', array_fill(0, count($dayEntryIds), '%d'));
                        $wpdb->query(
                            $wpdb->prepare(
                                "DELETE FROM `{$tableImages}` WHERE entry_id IN ($placeholders)",
                                ...$dayEntryIds
                            )
                        );

                        // Delete all entries for this day
                        $wpdb->delete($tableEntries, ['day_id' => $dayId], ['%d']);

                        // Delete the day itself
                        $wpdb->delete($tableDays, ['id' => $dayId], ['%d']);
                    }

                    $deleted++;
                } else {
                    // For activity entries, just delete the entry and its images
                    // Delete related images
                    $wpdb->delete($tableImages, ['entry_id' => $id], ['%d']);

                    // Delete entry
                    $result = $wpdb->delete($tableEntries, ['id' => $id], ['%d']);

                    if ($result !== false) {
                        $deleted++;
                    } else {
                        $failed++;
                    }
                }
            } catch (\Exception $e) {
                $failed++;
            }
        }

        return ['deleted' => $deleted, 'failed' => $failed];
    }

    /**
     * Get day entry ID by day_id
     * Returns the entry ID where item_type_id and item_id are null for a given day_id
     */
    public function getDayEntryIdByDayId(int $dayId): ?int
    {
        global $wpdb;
        $tableEntries = $this->getTableName();
        $tableDays = $wpdb->prefix . 'yatra_trip_itinerary_days';
        
        // First, try to find existing day entry
        $entryId = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT id FROM `{$tableEntries}` 
                 WHERE day_id = %d 
                 AND (item_type_id IS NULL OR item_type_id = 0)
                 AND (item_id IS NULL OR item_id = 0)
                 LIMIT 1",
                $dayId
            )
        );
        
        if ($entryId) {
            return (int) $entryId;
        }
        
        // Day entry doesn't exist - get day info and create it
        $day = $wpdb->get_row(
            $wpdb->prepare("SELECT trip_id, day_number, title FROM `{$tableDays}` WHERE id = %d", $dayId)
        );
        
        if (!$day) {
            return null; // Day doesn't exist
        }
        
        // Create the day entry
        $wpdb->insert(
            $tableEntries,
            [
                'trip_id' => (int) $day->trip_id,
                'day_id' => $dayId,
                'title' => $day->title ?: sprintf(__('Day %d', 'yatra'), (int) $day->day_number),
                'description' => '',
                'location' => null,
                'duration' => null,
                'time' => null,
                'start_time' => null,
                'end_time' => null,
                'time_type' => 'exact',
                'cost' => null,
                'cost_per_person' => 0,
                'notes' => null,
                'included_items' => null,
                'excluded_items' => null,
                'item_type_id' => null,
                'item_id' => null,
                'status' => 'draft',
                'order' => 0,
            ],
            ['%d', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%f', '%d', '%s', '%s', '%s', '%d', '%d', '%s', '%d']
        );
        
        return (int) $wpdb->insert_id;
    }

    /**
     * Get day by ID
     * 
     * @param int $dayId Day ID
     * @return object|null Day object or null if not found
     */
    public function getDayById(int $dayId): ?object
    {
        global $wpdb;
        $tableDays = $wpdb->prefix . 'yatra_trip_itinerary_days';
        
        return $wpdb->get_row($wpdb->prepare(
            "SELECT day_number FROM `{$tableDays}` WHERE id = %d",
            $dayId
        ));
    }

    /**
     * Check if day entry exists for trip and day number
     * 
     * @param int $tripId Trip ID
     * @param int $dayNumber Day number
     * @return object|null Day entry object or null if not found
     */
    public function findDayEntryByTripAndDayNumber(int $tripId, int $dayNumber): ?object
    {
        global $wpdb;
        $tableEntries = $this->getTableName();
        $tableDays = $wpdb->prefix . 'yatra_trip_itinerary_days';
        
        return $wpdb->get_row($wpdb->prepare(
            "SELECT e.id FROM `{$tableEntries}` e
             INNER JOIN `{$tableDays}` d ON e.day_id = d.id
             WHERE e.trip_id = %d 
             AND d.day_number = %d
             AND e.item_type_id IS NULL 
             AND e.item_id IS NULL
             LIMIT 1",
            $tripId,
            $dayNumber
        ));
    }

    /**
     * Check if day record exists for trip and day number
     * 
     * @param int $tripId Trip ID
     * @param int $dayNumber Day number
     * @return object|null Day record object or null if not found
     */
    public function findDayByTripAndDayNumber(int $tripId, int $dayNumber): ?object
    {
        global $wpdb;
        $tableDays = $wpdb->prefix . 'yatra_trip_itinerary_days';
        
        return $wpdb->get_row($wpdb->prepare(
            "SELECT id FROM `{$tableDays}` 
             WHERE trip_id = %d AND day_number = %d
             LIMIT 1",
            $tripId,
            $dayNumber
        ));
    }
}

