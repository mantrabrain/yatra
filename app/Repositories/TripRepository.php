<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Models\Trip;

/**
 * Trip Repository
 * Handles database operations for trips with comprehensive field support
 * 
 * Expert-level repository design:
 * - Relationship management (destinations, activities)
 * - JSON field handling
 * - Soft delete support
 * - Optimized queries with proper indexing
 */
class TripRepository extends BaseRepository
{
    /**
     * Get table name
     */
    protected function getTableName(): string
    {
        global $wpdb;
        return $wpdb->prefix . 'yatra_trips';
    }

    /**
     * Find published/active trip by ID
     *
     * @param int $id Trip ID
     * @return \stdClass|null
     */
    public function findPublished(int $id): ?\stdClass
    {
        $table = esc_sql($this->table);
        $query = "SELECT * FROM `{$table}` WHERE id = %d AND status IN ('publish', 'published', 'active')";

        if ($this->hasSoftDelete()) {
            $query .= " AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00')";
        }

        $result = $this->wpdb->get_row(
            $this->wpdb->prepare($query, $id)
        );

        return $result ?: null;
    }

    /**
     * Find by slug
     */
    public function findBySlug(string $slug): ?\stdClass
    {
        $table = esc_sql($this->table);
        $query = "SELECT * FROM `{$table}` WHERE slug = %s";
        
        if ($this->hasSoftDelete()) {
            $query .= " AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00')";
        }
        
        $result = $this->wpdb->get_row(
            $this->wpdb->prepare($query, $slug)
        );

        return $result ?: null;
    }

    /**
     * Find by ID with relationships
     */
    public function findWithRelations(int $id): ?\stdClass
    {
        $trip = $this->find($id);
        
        if (!$trip) {
            return null;
        }

        // Load destinations
        $trip->destinations = $this->getDestinations($id);
        
        // Load activities
        $trip->activities = $this->getActivities($id);
        
        // Load price types
        $trip->price_types = $this->getPriceTypes($id);
        
        // Load gallery images
        $trip->gallery_images = $this->getGalleryImages($id);
        
        // Load highlights
        $trip->highlights = $this->getHighlights($id);
        
        // Load FAQs
        $trip->faqs = $this->getFaqs($id);
        
        // Load availability dates
        $trip->availability_dates = $this->getAvailabilityDates($id);

        // Load itinerary days with entries
        $trip->itinerary_days = $this->getItineraryDays($id);

        return $trip;
    }

    /**
     * Get destinations for a trip
     */
    public function getDestinations(int $tripId): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_destinations';
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT td.*, d.name as destination_name, d.slug as destination_slug 
                 FROM `{$table}` td
                 LEFT JOIN `{$wpdb->prefix}yatra_destinations` d ON td.destination_id = d.id
                 WHERE td.trip_id = %d
                 ORDER BY td.`order` ASC, td.id ASC",
                $tripId
            )
        ) ?: [];
    }

    /**
     * Get activities for a trip
     */
    public function getActivities(int $tripId): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_activities';
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT ta.*, a.name as activity_name, a.slug as activity_slug 
                 FROM `{$table}` ta
                 LEFT JOIN `{$wpdb->prefix}yatra_activities` a ON ta.activity_id = a.id
                 WHERE ta.trip_id = %d
                 ORDER BY ta.`order` ASC, ta.id ASC",
                $tripId
            )
        ) ?: [];
    }

    /**
     * Get price types for a trip
     */
    public function getPriceTypes(int $tripId): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_price_types';
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT tpt.*, tc.label as category_label, tc.slug as category_slug 
                 FROM `{$table}` tpt
                 LEFT JOIN `{$wpdb->prefix}yatra_traveler_categories` tc ON tpt.category_id = tc.id
                 WHERE tpt.trip_id = %d
                 ORDER BY tpt.id ASC",
                $tripId
            )
        ) ?: [];
    }

    /**
     * Get gallery images for a trip
     */
    public function getGalleryImages(int $tripId): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_gallery_images';
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM `{$table}` 
                 WHERE trip_id = %d
                 ORDER BY `order` ASC, id ASC",
                $tripId
            )
        ) ?: [];
    }

    /**
     * Get highlights for a trip
     */
    public function getHighlights(int $tripId): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_highlights';
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM `{$table}` 
                 WHERE trip_id = %d
                 ORDER BY `order` ASC, id ASC",
                $tripId
            )
        ) ?: [];
    }

    /**
     * Get FAQs for a trip
     */
    public function getFaqs(int $tripId): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_faqs';
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM `{$table}` 
                 WHERE trip_id = %d
                 ORDER BY `order` ASC, id ASC",
                $tripId
            )
        ) ?: [];
    }

    /**
     * Get availability dates for a trip
     */
    public function getAvailabilityDates(int $tripId): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_availability_dates';
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM `{$table}` 
                 WHERE trip_id = %d
                 ORDER BY departure_date ASC",
                $tripId
            )
        ) ?: [];
    }

    /**
     * Get itinerary days with entries for a trip
     */
    public function getItineraryDays(int $tripId): array
    {
        global $wpdb;
        $tableDays = $wpdb->prefix . 'yatra_trip_itinerary_days';
        $tableEntries = $wpdb->prefix . 'yatra_trip_itinerary_entries';
        $tableEntryImages = $wpdb->prefix . 'yatra_trip_itinerary_entry_images';
        
        // Check if tables exist, return empty array if they don't
        $table_exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM information_schema.tables 
             WHERE table_schema = %s AND table_name = %s",
            DB_NAME,
            $tableDays
        ));
        
        if (!$table_exists) {
            // Tables don't exist yet, return empty array
            return [];
        }
        
        // Get all days for this trip
        $days = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM `{$tableDays}` 
                 WHERE trip_id = %d
                 ORDER BY `order` ASC, day_number ASC",
                $tripId
            )
        ) ?: [];
        
        // For each day, load its entries
        foreach ($days as $day) {
            $dayId = (int) $day->id;
            
            // Get entries for this day
            $entries = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT * FROM `{$tableEntries}` 
                     WHERE day_id = %d
                     ORDER BY `order` ASC",
                    $dayId
                )
            ) ?: [];
            
            // For each entry, load images
            foreach ($entries as $entry) {
                $entryId = (int) $entry->id;
                
                // Decode included/excluded items JSON stored directly on the entry
                $entry->included_items = $this->decodeAmenityItems($entry->included_items ?? null);
                $entry->excluded_items = $this->decodeAmenityItems($entry->excluded_items ?? null);
                
                // Get images for this entry
                $images = $wpdb->get_results(
                    $wpdb->prepare(
                        "SELECT * FROM `{$tableEntryImages}` 
                         WHERE entry_id = %d
                         ORDER BY `order` ASC",
                        $entryId
                    )
                ) ?: [];
                
                $entry->images = array_map(function ($img) {
                    return $img->image_url ?? '';
                }, $images);
            }
            
            // Attach entries to day
            $day->entries = $entries;
        }
        
        return $days;
    }

    /**
     * Save destinations for a trip
     */
    public function saveDestinations(int $tripId, array $destinationIds): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_destinations';
        
        // Delete existing
        $wpdb->delete($table, ['trip_id' => $tripId], ['%d']);
        
        // Insert new
        if (!empty($destinationIds)) {
            foreach ($destinationIds as $index => $destinationId) {
                $wpdb->insert(
                    $table,
                    [
                        'trip_id' => $tripId,
                        'destination_id' => (int) $destinationId,
                        'is_primary' => $index === 0 ? 1 : 0,
                        'order' => $index,
                    ],
                    ['%d', '%d', '%d', '%d']
                );
            }
        }
    }

    /**
     * Save activities for a trip
     */
    public function saveActivities(int $tripId, array $activityIds): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_activities';
        
        // Delete existing
        $wpdb->delete($table, ['trip_id' => $tripId], ['%d']);
        
        // Insert new
        if (!empty($activityIds)) {
            foreach ($activityIds as $index => $activityId) {
                $wpdb->insert(
                    $table,
                    [
                        'trip_id' => $tripId,
                        'activity_id' => (int) $activityId,
                        'is_primary' => $index === 0 ? 1 : 0,
                        'order' => $index,
                    ],
                    ['%d', '%d', '%d', '%d']
                );
            }
        }
    }

    /**
     * Save price types for a trip
     */
    public function savePriceTypes(int $tripId, array $priceTypes): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_price_types';
        
        // Delete existing
        $wpdb->delete($table, ['trip_id' => $tripId], ['%d']);
        
        // Insert new
        if (!empty($priceTypes)) {
            foreach ($priceTypes as $priceType) {
                $wpdb->insert(
                    $table,
                    [
                        'trip_id' => $tripId,
                        'category_id' => (int) ($priceType['category_id'] ?? 0),
                        'original_price' => (float) ($priceType['original_price'] ?? 0),
                        'discounted_price' => isset($priceType['discounted_price']) ? (float) $priceType['discounted_price'] : null,
                        'sale_price' => isset($priceType['sale_price']) ? (float) $priceType['sale_price'] : null,
                        'is_default' => (bool) ($priceType['is_default'] ?? false) ? 1 : 0,
                        'min_quantity' => isset($priceType['min_quantity']) ? (int) $priceType['min_quantity'] : 1,
                        'max_quantity' => isset($priceType['max_quantity']) ? (int) $priceType['max_quantity'] : null,
                        'valid_from' => $priceType['valid_from'] ?? null,
                        'valid_to' => $priceType['valid_to'] ?? null,
                    ],
                    ['%d', '%d', '%f', '%f', '%f', '%d', '%d', '%d', '%s', '%s']
                );
            }
        }
    }

    /**
     * Save highlights for a trip
     */
    public function saveHighlights(int $tripId, array $highlights): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_highlights';
        
        // Delete existing
        $wpdb->delete($table, ['trip_id' => $tripId], ['%d']);
        
        // Insert new
        if (!empty($highlights)) {
            foreach ($highlights as $index => $highlight) {
                $highlightText = is_string($highlight) ? $highlight : ($highlight['text'] ?? $highlight['highlight_text'] ?? '');
                if (!empty($highlightText)) {
                    $wpdb->insert(
                        $table,
                        [
                            'trip_id' => $tripId,
                            'highlight_text' => sanitize_text_field($highlightText),
                            'highlight_icon' => is_array($highlight) ? ($highlight['icon'] ?? null) : null,
                            'highlight_image_id' => is_array($highlight) ? ($highlight['image_id'] ?? null) : null,
                            'order' => $index,
                            'is_featured' => is_array($highlight) && isset($highlight['is_featured']) ? (int) $highlight['is_featured'] : 0,
                        ],
                        ['%d', '%s', '%s', '%d', '%d', '%d']
                    );
                }
            }
        }
    }

    /**
     * Save gallery images for a trip
     */
    public function saveGalleryImages(int $tripId, array $galleryImages): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_gallery_images';
        
        // Delete existing
        $wpdb->delete($table, ['trip_id' => $tripId], ['%d']);
        
        // Insert new
        if (!empty($galleryImages)) {
            foreach ($galleryImages as $index => $image) {
                $imageUrl = is_string($image) ? $image : ($image['url'] ?? $image['image_url'] ?? '');
                if (!empty($imageUrl)) {
                    $wpdb->insert(
                        $table,
                        [
                            'trip_id' => $tripId,
                            'image_url' => esc_url_raw($imageUrl),
                            'image_id' => is_array($image) && isset($image['id']) ? (int) $image['id'] : 0,
                            'thumbnail_url' => is_array($image) ? ($image['thumbnail_url'] ?? null) : null,
                            'alt_text' => is_array($image) ? ($image['alt_text'] ?? null) : null,
                            'caption' => is_array($image) ? ($image['caption'] ?? null) : null,
                            'order' => $index,
                            'is_featured' => is_array($image) && isset($image['is_featured']) ? (int) $image['is_featured'] : 0,
                        ],
                        ['%d', '%s', '%d', '%s', '%s', '%s', '%d', '%d']
                    );
                }
            }
        }
    }

    /**
     * Save FAQs for a trip
     */
    public function saveFaqs(int $tripId, array $faqs): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_faqs';
        
        // Delete existing
        $wpdb->delete($table, ['trip_id' => $tripId], ['%d']);
        
        // Insert new
        if (!empty($faqs)) {
            foreach ($faqs as $index => $faq) {
                if (is_array($faq) && !empty($faq['question']) && !empty($faq['answer'])) {
                    $wpdb->insert(
                        $table,
                        [
                            'trip_id' => $tripId,
                            'question' => sanitize_text_field($faq['question']),
                            'answer' => wp_kses_post($faq['answer']),
                            'category' => isset($faq['category']) ? sanitize_text_field($faq['category']) : null,
                            'order' => $index,
                            'is_featured' => isset($faq['is_featured']) ? (int) $faq['is_featured'] : 0,
                        ],
                        ['%d', '%s', '%s', '%s', '%d', '%d']
                    );
                }
            }
        }
    }

    /**
     * Save itinerary days for a trip
     */
    public function saveItinerary(int $tripId, array $itineraryDays): void
    {
        global $wpdb;
        $tableDays = $wpdb->prefix . 'yatra_trip_itinerary_days';
        $tableEntries = $wpdb->prefix . 'yatra_trip_itinerary_entries';
        
        // Delete existing itinerary
        $wpdb->delete($tableEntries, ['trip_id' => $tripId], ['%d']);
        $wpdb->delete($tableDays, ['trip_id' => $tripId], ['%d']);
        
        // Insert new itinerary
        if (!empty($itineraryDays)) {
            foreach ($itineraryDays as $dayIndex => $day) {
                if (is_array($day)) {
                    $insertResult = $wpdb->insert(
                        $tableDays,
                        [
                            'trip_id' => $tripId,
                            'day_number' => $day['day_number'] ?? ($dayIndex + 1),
                            'title' => isset($day['title']) ? sanitize_text_field($day['title']) : null,
                            'description' => isset($day['description']) ? wp_kses_post($day['description']) : null,
                            'order' => $dayIndex,
                        ],
                        ['%d', '%d', '%s', '%s', '%d']
                    );
                    
                    // Save entries for this day
                    if ($insertResult !== false && isset($day['entries']) && is_array($day['entries'])) {
                        $dayId = $wpdb->insert_id;
                        foreach ($day['entries'] as $entryIndex => $entry) {
                            if (is_array($entry) && !empty($entry['title'])) {
                                $wpdb->insert(
                                    $tableEntries,
                                    [
                                        'trip_id' => $tripId,
                                        'day_id' => $dayId,
                                        'title' => sanitize_text_field($entry['title']),
                                        'description' => isset($entry['description']) ? wp_kses_post($entry['description']) : null,
                                        'time' => isset($entry['time']) ? sanitize_text_field($entry['time']) : null,
                                        'location' => isset($entry['location']) ? sanitize_text_field($entry['location']) : null,
                                        'item_type_id' => isset($entry['item_type_id']) ? (int) $entry['item_type_id'] : null,
                                        'item_id' => isset($entry['item_id']) ? (int) $entry['item_id'] : null,
                                        'order' => $entryIndex,
                                    ],
                                    ['%d', '%d', '%s', '%s', '%s', '%s', '%d', '%d', '%d']
                                );
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Save availability dates for a trip
     */
    public function saveAvailabilityDates(int $tripId, array $availabilityDates): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_availability_dates';
        
        // Delete existing
        $wpdb->delete($table, ['trip_id' => $tripId], ['%d']);
        
        // Insert new
        if (!empty($availabilityDates)) {
            foreach ($availabilityDates as $date) {
                if (is_array($date) && !empty($date['departure_date'])) {
                    $wpdb->insert(
                        $table,
                        [
                            'trip_id' => $tripId,
                            'departure_date' => sanitize_text_field($date['departure_date']),
                            'return_date' => isset($date['return_date']) ? sanitize_text_field($date['return_date']) : null,
                            'available_spots' => isset($date['available_spots']) ? (int) $date['available_spots'] : null,
                            'price_override' => isset($date['price_override']) ? (float) $date['price_override'] : null,
                            'is_blackout' => isset($date['is_blackout']) ? (int) $date['is_blackout'] : 0,
                        ],
                        ['%d', '%s', '%s', '%d', '%f', '%d']
                    );
                }
            }
        }
    }

    /**
     * Create trip with relationships
     */
    public function createWithRelations(array $data, array $relationships = []): int
    {
        // Extract relationship data
        $destinations = $relationships['destinations'] ?? [];
        $activities = $relationships['activities'] ?? [];
        $priceTypes = $relationships['price_types'] ?? [];
        $highlights = $relationships['highlights'] ?? [];
        $galleryImages = $relationships['gallery_images'] ?? [];
        $faqs = $relationships['faqs'] ?? [];
        $itineraryDays = $relationships['itinerary_days'] ?? [];
        $availabilityDates = $relationships['availability_dates'] ?? [];
        
        // Remove relationship data from main data (these should not be in the main table)
        unset(
            $data['destinations'], 
            $data['activities'], 
            $data['price_types'],
            $data['highlights'],
            $data['gallery_images'],
            $data['faqs'],
            $data['itinerary_days'],
            $data['availability_dates']
        );
        
        // Create main trip record
        $tripId = $this->create($data);
        
        // Save relationships
        if (!empty($destinations)) {
            $this->saveDestinations($tripId, $destinations);
        }
        
        if (!empty($activities)) {
            $this->saveActivities($tripId, $activities);
        }
        
        if (!empty($priceTypes)) {
            $this->savePriceTypes($tripId, $priceTypes);
        }
        
        if (!empty($highlights)) {
            $this->saveHighlights($tripId, $highlights);
        }
        
        if (!empty($galleryImages)) {
            $this->saveGalleryImages($tripId, $galleryImages);
        }
        
        if (!empty($faqs)) {
            $this->saveFaqs($tripId, $faqs);
        }
        
        if (!empty($itineraryDays)) {
            $this->saveItinerary($tripId, $itineraryDays);
        }
        
        if (!empty($availabilityDates)) {
            $this->saveAvailabilityDates($tripId, $availabilityDates);
        }
        
        return $tripId;
    }

    /**
     * Update trip with relationships
     */
    public function updateWithRelations(int $id, array $data, array $relationships = []): bool
    {
        // Extract relationship data
        $destinations = $relationships['destinations'] ?? null;
        $activities = $relationships['activities'] ?? null;
        $priceTypes = $relationships['price_types'] ?? null;
        $highlights = $relationships['highlights'] ?? null;
        $galleryImages = $relationships['gallery_images'] ?? null;
        $faqs = $relationships['faqs'] ?? null;
        $itineraryDays = $relationships['itinerary_days'] ?? null;
        $availabilityDates = $relationships['availability_dates'] ?? null;
        
        // Remove relationship data from main data (these should not be in the main table)
        unset(
            $data['destinations'], 
            $data['activities'], 
            $data['price_types'],
            $data['highlights'],
            $data['gallery_images'],
            $data['faqs'],
            $data['itinerary_days'],
            $data['availability_dates']
        );
        
        // Update main trip record
        $result = $this->update($id, $data);
        
        // Update relationships if provided
        if ($destinations !== null) {
            $this->saveDestinations($id, $destinations);
        }
        
        if ($activities !== null) {
            $this->saveActivities($id, $activities);
        }
        
        if ($priceTypes !== null) {
            $this->savePriceTypes($id, $priceTypes);
        }
        
        if ($highlights !== null) {
            $this->saveHighlights($id, $highlights);
        }
        
        if ($galleryImages !== null) {
            $this->saveGalleryImages($id, $galleryImages);
        }
        
        if ($faqs !== null) {
            $this->saveFaqs($id, $faqs);
        }
        
        if ($itineraryDays !== null) {
            $this->saveItinerary($id, $itineraryDays);
        }
        
        if ($availabilityDates !== null) {
            $this->saveAvailabilityDates($id, $availabilityDates);
        }
        
        return $result;
    }

    /**
     * Soft delete a trip
     */
    public function softDelete(int $id, int $userId): bool
    {
        return $this->update($id, [
            'deleted_at' => current_time('mysql'),
            'deleted_by' => $userId,
        ]);
    }

    /**
     * Restore a soft-deleted trip
     */
    public function restore(int $id): bool
    {
        return $this->update($id, [
            'deleted_at' => null,
            'deleted_by' => null,
        ]);
    }

    /**
     * Get active trips (not deleted, published)
     */
    public function getActive(array $args = []): array
    {
        $args['where']['deleted_at'] = null;
        $args['where']['status'] = 'published';
        return $this->all($args);
    }

    /**
     * Build where clause (override to handle soft deletes)
     */
    protected function buildWhereClause(array $args): string
    {
        $where = parent::buildWhereClause($args);
        
        // Add soft delete filter if not explicitly requested
        if (!isset($args['include_deleted']) || !$args['include_deleted']) {
            if ($where) {
                $where .= ' AND (deleted_at IS NULL OR deleted_at = \'0000-00-00 00:00:00\')';
            } else {
                $where = 'WHERE (deleted_at IS NULL OR deleted_at = \'0000-00-00 00:00:00\')';
            }
        }
        
        return $where;
    }

    /**
     * Count trips by status
     */
    public function countByStatus(string $status): int
    {
        $table = esc_sql($this->table);
        $count = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SELECT COUNT(*) FROM `{$table}` 
                 WHERE status = %s 
                 AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00')",
                $status
            )
        );
        
        return (int) $count;
    }

    /**
     * Search trips by keyword
     */
    public function search(string $keyword, array $args = []): array
    {
        $table = esc_sql($this->table);
        $where = $this->buildWhereClause($args);
        $order = $this->buildOrderClause($args);
        $limit = $this->buildLimitClause($args);
        
        $searchTerm = '%' . $this->wpdb->esc_like($keyword) . '%';
        
        $query = $this->wpdb->prepare(
            "SELECT * FROM `{$table}` 
             {$where} 
             AND (title LIKE %s OR description LIKE %s OR short_description LIKE %s)
             {$order} {$limit}",
            $searchTerm,
            $searchTerm,
            $searchTerm
        );
        
        return $this->wpdb->get_results($query) ?: [];
    }

    /**
     * Decode included/excluded items JSON column stored on itinerary entries
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
}
