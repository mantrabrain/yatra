<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Repositories\BaseRepository;
use Yatra\Database\Tables\TripItineraryDaysTable;

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
        return $wpdb->prefix . 'yatra_new_trip_itinerary_day_entry';
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
        // Using table class for itinerary days
        $tableDays = TripItineraryDaysTable::getTableName();

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
     * This creates either a day entry (in days table) or an activity entry (in entries table)
     */
    public function createEntry(array $data): int
    {
        error_log("[YATRA DEBUG] ItineraryRepository::createEntry - Input data: " . print_r($data, true));
        
        global $wpdb;
        $tableEntries = $this->getTableName(); // yatra_new_trip_itinerary_day_entry
        $tableDays = TripItineraryDaysTable::getTableName();

        // Determine if this is a day entry or an activity entry
        // Day entries have no item_type_id and item_id
        $isDayEntry = empty($data['item_type_id']) && empty($data['item_id']);
        
        error_log("[YATRA DEBUG] ItineraryRepository::createEntry - isDayEntry: " . ($isDayEntry ? 'TRUE' : 'FALSE'));

        if ($isDayEntry) {
            // Creating a DAY entry - store in days table
            error_log("[YATRA DEBUG] Creating DAY entry in days table");
            
            // Check if day already exists for this trip and day number
            $existingDay = $wpdb->get_row(
                $wpdb->prepare(
                    "SELECT id FROM `{$tableDays}` WHERE trip_id = %d AND day_number = %d",
                    (int) $data['trip_id'],
                    (int) $data['day']
                )
            );
            
            if ($existingDay) {
                // Day already exists, update it
                error_log("[YATRA DEBUG] Day already exists with ID: {$existingDay->id}, updating...");
                
                $wpdb->update(
                    $tableDays,
                    [
                        'title' => sanitize_text_field($data['day_title'] ?? $data['title'] ?? ''),
                        'description' => wp_kses_post($data['day_description'] ?? $data['description'] ?? ''),
                    ],
                    ['id' => $existingDay->id],
                    ['%s', '%s'],
                    ['%d']
                );
                
                return (int) $existingDay->id;
            } else {
                // Create new day
                error_log("[YATRA DEBUG] Creating new day entry");
                
                $wpdb->insert(
                    $tableDays,
                    [
                        'trip_id' => (int) $data['trip_id'],
                        'day_number' => (int) $data['day'],
                        'title' => sanitize_text_field($data['day_title'] ?? $data['title'] ?? ''),
                        'description' => wp_kses_post($data['day_description'] ?? $data['description'] ?? ''),
                        'order' => (int) $data['day'],
                    ],
                    ['%d', '%d', '%s', '%s', '%d']
                );
                
                $dayId = (int) $wpdb->insert_id;
                error_log("[YATRA DEBUG] Created day with ID: {$dayId}");
                
                return $dayId;
            }
        } else {
            // Creating an ACTIVITY entry - store in entries table
            error_log("[YATRA DEBUG] Creating ACTIVITY entry in entries table");
            
            // First, ensure the day exists
            $dayId = $this->getOrCreateDay(
                (int) $data['trip_id'],
                (int) $data['day'],
                $data['day_title'] ?? null,
                $data['day_description'] ?? null,
                true // Allow existing days
            );
            
            error_log("[YATRA DEBUG] Using day_id: {$dayId}");
            
            // Format time field
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
            
            // Insert activity entry
            $wpdb->insert(
                $tableEntries,
                [
                    'day_id' => $dayId,
                    'trip_id' => (int) $data['trip_id'],
                    'title' => sanitize_text_field($data['title'] ?? ''),
                    'description' => wp_kses_post($data['description'] ?? ''),
                    'item_type_id' => !empty($data['item_type_id']) ? (int) $data['item_type_id'] : null,
                    'item_id' => !empty($data['item_id']) ? (int) $data['item_id'] : null,
                    'item_type' => $data['item_type'] ?? null,
                    'item_name' => $data['item_name'] ?? null,
                    'item_icon' => $data['item_icon'] ?? null,
                    'time' => $timeField,
                    'start_time' => !empty($data['start_time']) ? sanitize_text_field($data['start_time']) : null,
                    'end_time' => !empty($data['end_time']) ? sanitize_text_field($data['end_time']) : null,
                    'time_type' => !empty($data['time_type']) ? sanitize_text_field($data['time_type']) : 'exact',
                    'location' => !empty($data['location']) ? sanitize_text_field($data['location']) : null,
                    'duration' => !empty($data['duration']) ? sanitize_text_field($data['duration']) : null,
                    'cost' => !empty($data['cost']) ? (float) $data['cost'] : null,
                    'cost_per_person' => !empty($data['cost_per_person']) ? 1 : 0,
                    'notes' => !empty($data['notes']) ? sanitize_textarea_field($data['notes']) : null,
                    'included_items' => !empty($data['included_items']) ? json_encode($data['included_items']) : null,
                    'excluded_items' => !empty($data['excluded_items']) ? json_encode($data['excluded_items']) : null,
                    'status' => !empty($data['status']) ? sanitize_text_field($data['status']) : 'publish',
                    'order' => (int) $maxOrder + 1,
                ],
                [
                    '%d', '%d', '%s', '%s', '%d', '%d', '%s', '%s', '%s',
                    '%s', '%s', '%s', '%s', '%s', '%s', '%f', '%d', '%s',
                    '%s', '%s', '%s', '%d'
                ]
            );
            
            $entryId = (int) $wpdb->insert_id;
            error_log("[YATRA DEBUG] Created activity entry with ID: {$entryId}");
            
            return $entryId;
        }
    }

    /**
     * Update itinerary entry
     */
    public function updateEntry(int $entryId, array $data): bool
    {
        global $wpdb;
        $tableEntries = $this->getTableName();
        $tableDays = TripItineraryDaysTable::getTableName();

        // First check if this is a day entry (stored in days table)
        $dayEntry = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM `{$tableDays}` WHERE id = %d", $entryId)
        );

        if ($dayEntry) {
            // This is a day entry - update in days table
            $updateData = [];
            $updateFormat = [];

            if (isset($data['day_title']) || isset($data['title'])) {
                $updateData['title'] = sanitize_text_field($data['day_title'] ?? $data['title'] ?? '');
                $updateFormat[] = '%s';
            }

            if (isset($data['day_description']) || isset($data['description'])) {
                $updateData['description'] = wp_kses_post($data['day_description'] ?? $data['description'] ?? '');
                $updateFormat[] = '%s';
            }

            if (isset($data['day'])) {
                $updateData['day_number'] = (int) $data['day'];
                $updateFormat[] = '%d';
            }

            if (!empty($updateData)) {
                $result = $wpdb->update(
                    $tableDays,
                    $updateData,
                    ['id' => $entryId],
                    $updateFormat,
                    ['%d']
                );
                return $result !== false;
            }

            return true;
        }

        // Get existing activity entry to get day_id
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
        $tableDays = TripItineraryDaysTable::getTableName();
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
        $tableDays = TripItineraryDaysTable::getTableName();
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

        // Note: Images are stored in metadata in the new structure, not in a separate table

        return true;
    }

    /**
     * Get item_type_id and item_id from activity_type string
     */
    private function getItemIdsFromActivityType(string $activityType): ?array
    {
        global $wpdb;
        $itemRepository = new \Yatra\Repositories\ItemRepository();
        $itemTypeRepository = new \Yatra\Repositories\ItemTypeRepository();
        $tableItems = $itemRepository->getTableName();
        $tableItemTypes = $itemTypeRepository->getTableName();

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
        $itemRepository = new \Yatra\Repositories\ItemRepository();
        $itemTypeRepository = new \Yatra\Repositories\ItemTypeRepository();
        $tableItems = $itemRepository->getTableName();
        $tableItemTypes = $itemTypeRepository->getTableName();

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
     * @param int $entryId Entry ID
     * @return object|null Entry object with relations or null if not found
     */
    public function getEntryWithRelations(int $entryId): ?\stdClass
    {
        global $wpdb;
        $tableEntries = $this->getTableName();
        $tableDays = TripItineraryDaysTable::getTableName();
        
        // First check if this is a day entry (stored in days table)
        $dayEntry = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM `{$tableDays}` WHERE id = %d", $entryId)
        );
        
        if ($dayEntry) {
            // This is a day entry - create entry object from day data
            $entry = (object) [
                'id' => $dayEntry->id,
                'trip_id' => $dayEntry->trip_id,
                'day_id' => $dayEntry->id,
                'day' => $dayEntry->day_number, // Add 'day' field for form compatibility
                'title' => $dayEntry->title,
                'description' => $dayEntry->description,
                'location' => null,
                'duration' => null,
                'time' => null,
                'start_time' => null,
                'end_time' => null,
                'time_type' => 'exact',
                'cost' => null,
                'cost_per_person' => false,
                'notes' => $dayEntry->notes ?? null,
                'included_items' => [],
                'excluded_items' => [],
                'item_type_id' => 0,
                'item_id' => 0,
                'status' => 'publish',
                'order' => $dayEntry->order ?? $dayEntry->day_number,
                'images' => [],
                'day_number' => $dayEntry->day_number,
                'day_title' => $dayEntry->title,
                'day_description' => $dayEntry->description,
            ];
            
            error_log("[YATRA DEBUG] ItineraryRepository::getEntryWithRelations - Day entry found:");
            error_log("[YATRA DEBUG]   id: " . $entry->id);
            error_log("[YATRA DEBUG]   day_number: " . $entry->day_number);
            error_log("[YATRA DEBUG]   day_title: '" . ($entry->day_title ?? 'NULL') . "'");
            error_log("[YATRA DEBUG]   day_description: '" . ($entry->day_description ?? 'NULL') . "'");
            
            return $entry;
        }
        
        // If not a day entry, look in the entries table (for activities)
        $entry = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM `{$tableEntries}` WHERE id = %d", $entryId)
        );

        if (!$entry) {
            return null;
        }

        // Get day info for activity entries
        $day = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM `{$tableDays}` WHERE id = %d", (int) $entry->day_id)
        );
        
        if ($day) {
            error_log("[YATRA DEBUG] ItineraryRepository::getEntryWithRelations - Day data found:");
            error_log("[YATRA DEBUG]   day_id: " . $day->id);
            error_log("[YATRA DEBUG]   day_number: " . $day->day_number);
            error_log("[YATRA DEBUG]   day_title: '" . ($day->title ?? 'NULL') . "'");
            error_log("[YATRA DEBUG]   day_description: '" . ($day->description ?? 'NULL') . "'");
            
            $entry->day = (int) $day->day_number; // Add 'day' field for form compatibility
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

        // Images are stored in metadata in the new structure
        $entry->images = [];

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
     * Handles both day entries (from days table) and activity entries (from entries table)
     */
    public function delete(int $id): bool
    {
        global $wpdb;
        $tableEntries = $this->getTableName();
        $tableDays = TripItineraryDaysTable::getTableName();

        // First check if this is a day ID (from days table)
        $dayEntry = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM `{$tableDays}` WHERE id = %d", $id)
        );

        if ($dayEntry) {
            // This is a day entry - delete the day and all its activities
            error_log("[YATRA DEBUG] Deleting day entry with ID: {$id}");
            
            // Delete all activity entries for this day (CASCADE will handle this via foreign key)
            // But we'll do it explicitly for clarity
            $wpdb->delete($tableEntries, ['day_id' => $id], ['%d']);
            
            // Delete the day itself
            $result = $wpdb->delete($tableDays, ['id' => $id], ['%d']);
            
            return $result !== false;
        }

        // Check if this is an activity entry ID (from entries table)
        $activityEntry = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM `{$tableEntries}` WHERE id = %d", $id)
        );

        if ($activityEntry) {
            // This is an activity entry - just delete it
            error_log("[YATRA DEBUG] Deleting activity entry with ID: {$id}");
            
            $result = $wpdb->delete($tableEntries, ['id' => $id], ['%d']);
            
            return $result !== false;
        }

        // Entry not found in either table
        error_log("[YATRA DEBUG] Entry not found with ID: {$id}");
        return false;
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
        
        $tableDays = TripItineraryDaysTable::getTableName();

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
        
        // Day entries are now stored in the days table itself
        $tableDays = TripItineraryDaysTable::getTableName();
        
        // Get the day entry ID from the days table
        $entryId = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT id FROM `{$tableDays}` 
                 WHERE id = %d",
                $dayId
            )
        );
        
        return $entryId ? (int) $entryId : null;
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
        
        $tableDays = TripItineraryDaysTable::getTableName();
        
        return $wpdb->get_row($wpdb->prepare(
            "SELECT day_number FROM `{$tableDays}` WHERE id = %d",
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
     * Get all itinerary entries for a specific trip
     */
    public function getByTripId(int $tripId): array
    {
        global $wpdb;
        $tableEntries = $this->getTableName();
        $tableDays = TripItineraryDaysTable::getTableName();
        // Note: tableItems and tableImages are not used in new structure
        
        // Get days for this trip first
        $days = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM `{$tableDays}` 
             WHERE trip_id = %d
             ORDER BY day_number ASC",
            $tripId
        )) ?: [];
        
        error_log('[ITINERARY REPOSITORY DEBUG] Days query: ' . $wpdb->last_query);
        error_log('[ITINERARY REPOSITORY DEBUG] Days found: ' . count($days));
        error_log('[ITINERARY REPOSITORY DEBUG] Days data: ' . json_encode($days));
        
        $allEntries = [];
        
        // Process each day
        foreach ($days as $day) {
            $dayNumber = (int) $day->day_number;
            
            error_log("[YATRA DEBUG] Processing day {$dayNumber} with id: {$day->id}");
            
            // Add day entry (summary of the day)
            $dayEntry = (object) [
                'id' => $day->id, // Use actual day ID from days table
                'trip_id' => $tripId,
                'day_id' => $day->id,
                'day' => $dayNumber,
                'day_number' => $dayNumber,
                'day_title' => $day->title,
                'title' => $day->title,
                'day_description' => $day->description,
                'description' => $day->description,
                'item_type_id' => 0, // 0 indicates this is a day entry
                'item_id' => 0, // 0 indicates this is a day entry
                'item_type' => null,
                'item_name' => null,
                'item_icon' => null,
                'time' => null,
                'start_time' => null,
                'end_time' => null,
                'time_type' => 'exact',
                'location' => null,
                'duration' => null,
                'cost' => null,
                'cost_per_person' => false,
                'notes' => $day->notes ?? null,
                'status' => 'publish',
                'order' => $day->order ?? $day->day_number
            ];
            
            error_log("[YATRA DEBUG] Created day entry: id={$dayEntry->id}, item_type_id={$dayEntry->item_type_id}, item_id={$dayEntry->item_id}");
            $allEntries[] = $dayEntry;
            
            // Get entries for this specific day
            $dayEntries = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM `{$tableEntries}` 
                 WHERE day_id = %d
                 ORDER BY `order` ASC",
                $day->id
            )) ?: [];
            
            // Add individual entries for this day
            foreach ($dayEntries as $entry) {
                // Decode included/excluded items JSON
                $includedItems = $this->decodeAmenityItems($entry->included_items ?? null);
                $excludedItems = $this->decodeAmenityItems($entry->excluded_items ?? null);
                
                $entryObj = (object) [
                    'id' => $entry->id,
                    'trip_id' => $entry->trip_id,
                    'day_id' => $entry->day_id,
                    'day' => $dayNumber,
                    'day_number' => $dayNumber,
                    'day_title' => $day->title,
                    'title' => $entry->title,
                    'description' => $entry->description,
                    'item_type_id' => $entry->item_type_id,
                    'item_id' => $entry->item_id,
                    'item_type' => $entry->item_type,
                    'item_name' => null, // Will be populated from item tables if needed
                    'item_icon' => null, // Will be populated from item tables if needed
                    'time' => $entry->time,
                    'start_time' => $entry->start_time,
                    'end_time' => $entry->end_time,
                    'time_type' => $entry->time_type ?? 'exact',
                    'location' => $entry->location,
                    'duration' => $entry->duration,
                    'cost' => $entry->cost,
                    'cost_per_person' => $entry->cost_per_person ?? false,
                    'notes' => $entry->notes,
                    'included_items' => $includedItems,
                    'excluded_items' => $excludedItems,
                    'status' => $entry->status ?? 'publish',
                    'order' => $entry->order ?? 0
                ];
                $allEntries[] = $entryObj;
            }
        }
        
        return $allEntries;
    }

    /**
     * Find day entry by trip and day number
     * 
     * @param int $tripId Trip ID
     * @param int $dayNumber Day number
     * @return object|null Day entry object or null if not found
     */
    public function findDayEntryByTripAndDayNumber(int $tripId, int $dayNumber): ?object
    {
        global $wpdb;
        // Query the days table, not the entries table
        $tableDays = TripItineraryDaysTable::getTableName();
        
        // Find the day record for the given trip and day number
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM `{$tableDays}` 
             WHERE trip_id = %d 
             AND day_number = %d
             LIMIT 1",
            $tripId,
            $dayNumber
        ));
    }

    /**
     * Find day by trip and day number (alias for findDayEntryByTripAndDayNumber)
     * 
     * @param int $tripId Trip ID
     * @param int $dayNumber Day number
     * @return object|null Day record object or null if not found
     */
    public function findDayByTripAndDayNumber(int $tripId, int $dayNumber): ?object
    {
        return $this->findDayEntryByTripAndDayNumber($tripId, $dayNumber);
    }
}

