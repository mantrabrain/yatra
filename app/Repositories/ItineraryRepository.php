<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Repositories\BaseRepository;
use Yatra\Database\Tables\TripItineraryDaysTable;
use Yatra\Database\Tables\TripItineraryDayEntryTable;
use Yatra\Utils\QueryCache;
use Yatra\Utils\Cache;

/**
 * Itinerary Repository
 * Handles database operations for itinerary entries
 */
class ItineraryRepository extends BaseRepository
{
    protected function getTableName(): string
    {
        return TripItineraryDayEntryTable::getTableName();
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
        // Use QueryCache for caching day existence checks
        $cacheKey = Cache::KEY_DAY_EXISTS . "_{$tripId}_day_{$dayNumber}";
        
        $existingDay = $this->cacheQueryResult($cacheKey, function() use ($tripId, $dayNumber) {
            global $wpdb;
            $tableDays = TripItineraryDaysTable::getTableName();
            
            return $wpdb->get_row(
                $wpdb->prepare(
                    "SELECT * FROM `{$tableDays}` 
                     WHERE trip_id = %d AND day_number = %d",
                    $tripId,
                    $dayNumber
                )
            );
        }, Cache::DURATION_SHORT); // Cache for 10 minutes

        if ($existingDay) {
            // If not allowing existing days (for new day creation), throw error
            if (!$allowExisting) {
                // Get all existing day numbers for this trip
                $existingDays = $this->cacheQueryResult(Cache::KEY_DAY_EXISTS . '_existing_days_trip_' . $tripId, function() use ($tripId) {
                    global $wpdb;
                    $tableDays = TripItineraryDaysTable::getTableName();
                    
                    return $wpdb->get_col(
                        $wpdb->prepare(
                            "SELECT day_number FROM `{$tableDays}` 
                             WHERE trip_id = %d 
                             ORDER BY day_number ASC",
                            $tripId
                        )
                    ) ?: [];
                }, Cache::DURATION_SHORT);
                
                // Get next available day number
                $maxDay = $this->cacheQueryResult(Cache::KEY_DAY_EXISTS . '_max_day_trip_' . $tripId, function() use ($tripId) {
                    global $wpdb;
                    $tableDays = TripItineraryDaysTable::getTableName();
                    
                    return $wpdb->get_var(
                        $wpdb->prepare(
                            "SELECT MAX(day_number) FROM `{$tableDays}` WHERE trip_id = %d",
                            $tripId
                        )
                    ) ?: 0;
                }, Cache::DURATION_SHORT);
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
                $result = $wpdb->update(
                    $tableDays,
                    $updateData,
                    ['id' => (int) $existingDay->id],
                    $updateFormat,
                    ['%d']
                );
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
        $wpdb->insert(
            $tableDays,
            $insertData,
            ['%d', '%d', '%s', '%s', '%d']
        );
        return (int) $wpdb->insert_id;
    }

    /**
     * Create itinerary entry
     * This creates either a day entry (in days table) or an activity entry (in entries table)
     */
    public function createEntry(array $data): int
    {
        global $wpdb;
        $tableEntries = $this->getTableName(); // yatra_new_trip_itinerary_day_entry
        $tableDays = TripItineraryDaysTable::getTableName();

        // Determine if this is a day entry or an activity entry
        // Day entries have no item_type_id and item_id (or they are explicitly 0)
        // Note: empty() treats "0" as empty, so we need explicit checks
        $itemTypeId = isset($data['item_type_id']) && $data['item_type_id'] !== '' && $data['item_type_id'] !== '0' && $data['item_type_id'] !== 0 ? (int) $data['item_type_id'] : null;
        $itemId = isset($data['item_id']) && $data['item_id'] !== '' && $data['item_id'] !== '0' && $data['item_id'] !== 0 ? (int) $data['item_id'] : null;
        $isDayEntry = $itemTypeId === null && $itemId === null;
        
        if ($isDayEntry) {
            // Creating a DAY entry - store in days table
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

                do_action('yatra_itinerary_day_updated', (int) $existingDay->id, $data);

                return (int) $existingDay->id;
            } else {
                // Create new day
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
                // Fire hook for cache invalidation
                do_action('yatra_itinerary_day_created', $dayId, $data);
                
                return $dayId;
            }
        } else {
            // Creating an ACTIVITY entry - store in entries table
            // First, ensure the day exists
            $dayId = $this->getOrCreateDay(
                (int) $data['trip_id'],
                (int) $data['day'],
                $data['day_title'] ?? null,
                $data['day_description'] ?? null,
                true // Allow existing days
            );
            
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
                    'location_latitude' => !empty($data['location_latitude']) ? (float) $data['location_latitude'] : null,
                    'location_longitude' => !empty($data['location_longitude']) ? (float) $data['location_longitude'] : null,
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
                    '%s', '%s', '%s', '%s', '%s', '%s', '%f', '%f', '%f', '%d', '%s',
                    '%s', '%s', '%s', '%d'
                ]
            );
            
            $entryId = (int) $wpdb->insert_id;
            // Fire hook for cache invalidation
            do_action('yatra_itinerary_activity_created', $entryId, $data);
            
            return $entryId;
        }
    }

    /**
     * Update itinerary entry
     * @param int $entryId Entry ID
     * @param array $data Update data
     * @param string|null $mode 'day' or 'activity' to specify which table to update
     */
    public function updateEntry(int $entryId, array $data, ?string $mode = null): bool
    {
        global $wpdb;
        $tableEntries = $this->getTableName();
        $tableDays = TripItineraryDaysTable::getTableName();

        // Use mode parameter to determine which table to update
        // If mode is 'day', update days table
        if ($mode === 'day') {
            // Update day entry in days table
            $dayEntry = $wpdb->get_row(
                $wpdb->prepare("SELECT * FROM `{$tableDays}` WHERE id = %d", $entryId)
            );
            
            if (!$dayEntry) {
                return false;
            }
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

            // Only update day_number if it's actually changing to avoid unique constraint violation
            if (isset($data['day']) && (int) $data['day'] !== (int) $dayEntry->day_number) {
                $updateData['day_number'] = (int) $data['day'];
                $updateFormat[] = '%d';
            }

            if (!empty($updateData)) {
                // Suppress error display - errors will be caught by service layer
                $wpdb->suppress_errors();
                
                $result = $wpdb->update(
                    $tableDays,
                    $updateData,
                    ['id' => $entryId],
                    $updateFormat,
                    ['%d']
                );
                
                // Re-enable error display
                $wpdb->show_errors();
                
                // Fire hook for cache invalidation
                do_action('yatra_itinerary_day_updated', $entryId, $data);
                
                return $result !== false;
            }

            return true;
        }

        // Mode is 'activity' or not specified - update activity entry only
        // Get existing activity entry
        $existingEntry = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM `{$tableEntries}` WHERE id = %d", $entryId)
        );

        if (!$existingEntry) {
            return false;
        }

        // When mode='activity', we ONLY update the activity entry itself
        // We do NOT touch the day table at all
        // The day_id should remain the same unless explicitly changed

        // Format time field. We must distinguish "field not present in payload"
        // (don't touch the column) from "field present but empty" (the user
        // cleared the time and we should write null). Without this, switching an
        // activity to time_type=duration/flexible left a stale "08:00 - 17:00"
        // in the legacy `time` column even though start_time/end_time got
        // nulled — so list views and the public template kept showing the old
        // time range.
        $timeField = null;
        $timeFieldExplicit = false;
        if (array_key_exists('start_time', $data) || array_key_exists('end_time', $data) || array_key_exists('time', $data)) {
            $timeFieldExplicit = true;
            if (!empty($data['start_time']) && !empty($data['end_time'])) {
                $timeField = $data['start_time'] . ' - ' . $data['end_time'];
            } elseif (!empty($data['start_time'])) {
                $timeField = $data['start_time'];
            } elseif (!empty($data['time'])) {
                $timeField = $data['time'];
            }
            // else: keep $timeField=null so the column gets cleared.
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

        if ($timeFieldExplicit) {
            $updateData['time'] = $timeField; // may be null — that's the clear-on-edit case
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

        if (isset($data['location_latitude'])) {
            $updateData['location_latitude'] = !empty($data['location_latitude']) ? (float) $data['location_latitude'] : null;
            $updateFormat[] = '%f';
        }

        if (isset($data['location_longitude'])) {
            $updateData['location_longitude'] = !empty($data['location_longitude']) ? (float) $data['location_longitude'] : null;
            $updateFormat[] = '%f';
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

        if (isset($data['gallery'])) {
            if (!empty($data['gallery']) && is_array($data['gallery'])) {
                // Process gallery items to ensure attachment IDs are properly saved
                $processedGallery = [];
                foreach ($data['gallery'] as $item) {
                    $processedItem = [
                        'id' => $item['id'] ?? '',
                        'attachment_id' => isset($item['attachment_id']) ? (int) $item['attachment_id'] : 0,
                        'type' => $item['type'] ?? 'image',
                        'alt_text' => $item['alt_text'] ?? '',
                        'caption' => $item['caption'] ?? '',
                    ];
                    
                    // Keep URL and thumbnail_url for reference but they'll be regenerated from attachment_id
                    if (isset($item['url'])) {
                        $processedItem['url'] = $item['url'];
                    }
                    if (isset($item['thumbnail_url'])) {
                        $processedItem['thumbnail_url'] = $item['thumbnail_url'];
                    }
                    
                    $processedGallery[] = $processedItem;
                }
                $updateData['gallery'] = json_encode($processedGallery);
            } else {
                $updateData['gallery'] = null;
            }
            $updateFormat[] = '%s';
        }

        if (isset($data['video_url'])) {
            $updateData['video_url'] = !empty($data['video_url']) ? esc_url_raw($data['video_url']) : null;
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

        // Activity ordering: written by the React drag-and-drop reorder UI on the
        // day-edit page. Backed by the existing `order` smallint column (idx_day_order
        // index covers it). We accept 0+; clamp to non-negative.
        if (isset($data['order'])) {
            $updateData['order'] = max(0, (int) $data['order']);
            $updateFormat[] = '%d';
        }

        // Note: We do NOT update day_id when mode='activity'
        // The activity stays in its current day unless explicitly moved via different logic

        if (!empty($updateData)) {
            $wpdb->update(
                $tableEntries,
                $updateData,
                ['id' => $entryId],
                $updateFormat,
                ['%d']
            );
            
            // Fire hook for cache invalidation
            do_action('yatra_itinerary_activity_updated', $entryId, $data);
        }

        // Note: Images are stored in metadata in the new structure, not in a separate table

        return true;
    }

    /**
     * Get item_type_id and item_id from activity_type string
     */
    private function getItemIdsFromActivityType(string $activityType): ?array
    {
        // Use QueryCache for caching activity type lookups
        $cacheKey = Cache::KEY_ACTIVITY_TYPE_LOOKUP . '_' . md5($activityType);

        $result = $this->cacheQueryResult($cacheKey, function () use ($activityType) {
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
                return (object) [
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
                    return (object) [
                        'item_type_id' => (int) $itemType->id,
                        'item_id' => (int) $firstItem->id,
                    ];
                }
            }

            return null;
        }, Cache::DURATION_LOOKUPS);

        return $result ? [
            'item_type_id' => (int) $result->item_type_id,
            'item_id' => (int) $result->item_id,
        ] : null;
    }

    /**
     * Get activity type from item_type_id and item_id
     */
    private function getActivityTypeFromItems(int $itemTypeId, int $itemId): ?string
    {
        if ($itemTypeId <= 0 || $itemId <= 0) {
            return null;
        }

        // Use QueryCache for caching activity type lookups
        $cacheKey = Cache::KEY_ACTIVITY_TYPE_FROM_ITEMS . '_' . $itemTypeId . '_' . $itemId;
        
        return $this->cacheQueryResult($cacheKey, function() use ($itemTypeId, $itemId) {
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
        }, Cache::DURATION_LOOKUPS);
    }

    /**
     * Get activity entry with related data (from entries table)
     * @param int $entryId Entry ID
     * @return object|null Entry object with relations or null if not found
     */
    public function getActivityEntry(int $entryId): ?\stdClass
    {
        // Use QueryCache for caching activity entry with joins
        $cacheKey = Cache::KEY_ACTIVITY_ENTRY . '_' . $entryId;
        
        return $this->cacheQueryResult($cacheKey, function() use ($entryId) {
            global $wpdb;
            $tableEntries = $this->getTableName();
            $tableDays = TripItineraryDaysTable::getTableName();
            $tableClassifications = \Yatra\Database\Tables\ClassificationsTable::getTableName();
            
            $entry = $wpdb->get_row(
                $wpdb->prepare(
                    "SELECT e.*, 
                            i.name as item_name,
                            it.name as item_type_name,
                            it.icon as item_type_icon
                     FROM `{$tableEntries}` e
                     LEFT JOIN `{$tableClassifications}` i ON e.item_id = i.id AND i.type = 'item'
                     LEFT JOIN `{$tableClassifications}` it ON e.item_type_id = it.id AND it.type = 'item_type'
                     WHERE e.id = %d",
                    $entryId
                )
            );
            
            if (!$entry) {
                return null;
            }
            
            // Get day info
            $day = $wpdb->get_row(
                $wpdb->prepare("SELECT * FROM `{$tableDays}` WHERE id = %d", (int) $entry->day_id)
            );
        
        if ($day) {
            $entry->day = (int) $day->day_number;
            $entry->day_number = (int) $day->day_number;
            $entry->day_title = $day->title;
            $entry->day_description = $day->description;
        }
        
        // Decode included/excluded items JSON columns
        $entry->included_items = $this->decodeAmenityItems($entry->included_items ?? null);
        $entry->excluded_items = $this->decodeAmenityItems($entry->excluded_items ?? null);
        
        // Images are stored in metadata
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
        }, Cache::DURATION_ITINERARY); // Cache for 30 minutes
    }
    
    /**
     * Get entry with related data
     * @param int $entryId Entry ID
     * @return object|null Entry object with relations or null if not found
     */
    public function getEntryWithRelations(int $entryId): ?\stdClass
    {
        // Use QueryCache for caching this expensive query with joins
        $cacheKey = Cache::KEY_ITINERARY_ENTRY_WITH_RELATIONS . '_' . $entryId;
        
        return $this->cacheQueryResult($cacheKey, function() use ($entryId) {
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
            
        
            return $entry;
        }
        
        // If not a day entry, look in the entries table (for activities)
        $tableClassifications = \Yatra\Database\Tables\ClassificationsTable::getTableName();
        
        $sql = $wpdb->prepare(
            "SELECT e.*, 
                    i.name as item_name,
                    it.name as item_type_name,
                    it.icon as item_type_icon
             FROM `{$tableEntries}` e
             LEFT JOIN `{$tableClassifications}` i ON e.item_id = i.id AND i.type = 'item'
             LEFT JOIN `{$tableClassifications}` it ON e.item_type_id = it.id AND it.type = 'item_type'
             WHERE e.id = %d",
            $entryId
        );
        
        $entry = $wpdb->get_row($sql);

        if (!$entry) {
            return null;
        }
        
        // Debug: Log the actual values from database
        // Get day info for activity entries
        $day = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM `{$tableDays}` WHERE id = %d", (int) $entry->day_id)
        );
        
        if ($day) {
            $entry->day = (int) $day->day_number; // Add 'day' field for form compatibility
            $entry->day_number = (int) $day->day_number;
            $entry->day_title = $day->title;
            $entry->day_description = $day->description;
            
            } else {
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
        }, Cache::DURATION_ITINERARY); // Cache for 30 minutes
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
     * @param int $id Entry ID
     * @param string|null $mode 'day' or 'activity' to specify which table to delete from
     */
    public function delete(int $id, ?string $mode = null): bool
    {
        global $wpdb;
        $tableEntries = $this->getTableName();
        $tableDays = TripItineraryDaysTable::getTableName();

        // If mode is explicitly 'activity', skip day entry check
        if ($mode === 'activity') {
            $dayEntry = null;
        } else {
            // Check if this is a day ID (from days table)
            $dayEntry = $wpdb->get_row(
                $wpdb->prepare("SELECT * FROM `{$tableDays}` WHERE id = %d", $id)
            );
        }

        if ($dayEntry) {
            // This is a day entry - delete the day and all its activities
            // Delete all activity entries for this day (CASCADE will handle this via foreign key)
            // But we'll do it explicitly for clarity
            $wpdb->delete($tableEntries, ['day_id' => $id], ['%d']);
            
            // Delete the day itself
            $result = $wpdb->delete($tableDays, ['id' => $id], ['%d']);
            
            // Fire hook for cache invalidation
            do_action('yatra_itinerary_day_deleted', $id);
            
            return $result !== false;
        }

        // Check if this is an activity entry ID (from entries table)
        $activityEntry = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM `{$tableEntries}` WHERE id = %d", $id)
        );

        if ($activityEntry) {
            // This is an activity entry - just delete it
            $result = $wpdb->delete($tableEntries, ['id' => $id], ['%d']);
            
            // Fire hook for cache invalidation
            do_action('yatra_itinerary_activity_deleted', $id);
            
            return $result !== false;
        }

        // Entry not found in either table
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
        // Use Cache for caching this expensive query with joins (Updated: 2026-02-28)
        $cacheKey = Cache::KEY_ITINERARY_BY_TRIP_ID . '_' . $tripId;
        
        return $this->cacheQueryResult($cacheKey, function() use ($tripId) {
            global $wpdb;
            $tableEntries = $this->getTableName();
            $tableDays = TripItineraryDaysTable::getTableName();
            
            // Get days for this trip first
            $days = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM `{$tableDays}` 
                 WHERE trip_id = %d
                 ORDER BY day_number ASC",
                $tripId
            )) ?: [];
            
            $allEntries = [];
        
        // Process each day
        foreach ($days as $day) {
            $dayNumber = (int) $day->day_number;
            
            // Add day entry (summary of the day)
            $dayEntryObj = (object) [
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
                'order' => $day->order ?? $dayNumber
            ];
            
            $allEntries[] = $dayEntryObj;
            
            // Get activities for this day
            $tableClassifications = \Yatra\Database\Tables\ClassificationsTable::getTableName();
            $activities = $wpdb->get_results($wpdb->prepare(
                "SELECT e.*, 
                        i.name as item_name,
                        it.name as item_type_name,
                        it.icon as item_type_icon
                 FROM `{$tableEntries}` e
                 LEFT JOIN `{$tableClassifications}` i ON e.item_id = i.id AND i.type = 'item'
                 LEFT JOIN `{$tableClassifications}` it ON e.item_type_id = it.id AND it.type = 'item_type'
                 WHERE e.day_id = %d
                 ORDER BY e.order ASC",
                $day->id
            )) ?: [];
            
            // Add activities to entries
            foreach ($activities as $entry) {
                $includedItems = $this->decodeAmenityItems($entry->included_items ?? null);
                $excludedItems = $this->decodeAmenityItems($entry->excluded_items ?? null);
                
                $entryObj = (object) [
                    'id' => $entry->id,
                    'trip_id' => $tripId,
                    'day_id' => $day->id,
                    'day' => $dayNumber,
                    'day_number' => $dayNumber,
                    'day_title' => $day->title,
                    'day_description' => $day->description,
                    'title' => $entry->title,
                    'description' => $entry->description,
                    'item_type_id' => $entry->item_type_id,
                    'item_id' => $entry->item_id,
                    'item_type' => $entry->item_type_name,
                    'item_name' => $entry->item_name,
                    'item_icon' => $entry->item_type_icon,
                    'time' => $entry->time,
                    'start_time' => $entry->start_time,
                    'end_time' => $entry->end_time,
                    'time_type' => $entry->time_type ?? 'exact',
                    'location' => $entry->location,
                    'location_latitude' => $entry->location_latitude,
                    'location_longitude' => $entry->location_longitude,
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
        }, Cache::DURATION_ITINERARY); // Cache for 30 minutes
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

    /**
     * Get all published itinerary entries with coordinates for a trip
     * Used for map display functionality
     * 
     * @param int $tripId Trip ID
     * @return array Array of entries with coordinates and day information
     */
    public function getEntriesWithCoordinatesForMap(int $tripId): array
    {
        // Validate trip ID
        if (empty($tripId) || $tripId <= 0) {
            return [];
        }
        
        global $wpdb;
        
        $entries_table = TripItineraryDayEntryTable::getTableName();
        $days_table = TripItineraryDaysTable::getTableName();
        
        return $wpdb->get_results($wpdb->prepare(
            "SELECT e.*, d.day_number, d.title as day_title
             FROM {$entries_table} e
             LEFT JOIN {$days_table} d ON e.day_id = d.id
             WHERE e.trip_id = %d 
             AND e.location_latitude IS NOT NULL 
             AND e.location_longitude IS NOT NULL
             AND e.status = 'publish'
             ORDER BY d.day_number ASC, e.order ASC",
            $tripId
        )) ?: [];
    }
}
