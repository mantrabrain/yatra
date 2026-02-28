<?php

namespace Yatra\Migration;

use Yatra\Utils\Logger;

/**
 * Itinerary Migration - Migrate trip itineraries from old Yatra versions
 * 
 * This class migrates itinerary data from old tour posts to the new itinerary structure.
 * It handles various old itinerary data formats and converts them to the new
 * yatra_trip_itinerary_days and yatra_trip_itinerary_entries tables.
 */
class ItineraryMigration extends BaseMigration
{
    public function __construct(MigrationProgress $service)
    {
        parent::__construct($service);
    }

    /**
     * Run the itinerary migration
     */
    public function run(): array
    {
        // CRITICAL DEBUG: Log immediately to see if this method is called
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        try {
            // Get all old tours that have been migrated to new trips
            $oldToursWithItinerary = $this->getOldToursWithItinerary();
            $total = count($oldToursWithItinerary);

            Logger::info("Itinerary Migration: Starting migration", [
                'total_tours_with_itinerary' => $total,
                'force_migration' => $this->service->isForceMigration()
            ]);

            foreach ($oldToursWithItinerary as $oldTour) {
                try {
                    // Get the new trip ID from migration mapping
                    $newTripId = $this->getMigratedTripId($oldTour->ID);
                    
                    if (!$newTripId) {
                        Logger::info("Tour not migrated yet, skipping itinerary", [
                            'old_tour_id' => $oldTour->ID,
                            'tour_title' => $oldTour->post_title
                        ]);
                        $skipped++;
                        continue;
                    }

                    // Check if itinerary already exists for this trip (skip for normal migration)
                    if (!$this->service->isForceMigration() && $this->hasItinerary($newTripId)) {
                        Logger::info("Itinerary already exists, skipping", [
                            'trip_id' => $newTripId,
                            'old_tour_id' => $oldTour->ID
                        ]);
                        $skipped++;
                        continue;
                    }

                    // During force migration, we delete existing itinerary and recreate
                    if ($this->service->isForceMigration() && $this->hasItinerary($newTripId)) {
                        Logger::info("Force migration: deleting existing itinerary", [
                            'trip_id' => $newTripId,
                            'old_tour_id' => $oldTour->ID
                        ]);
                        $this->deleteTripItinerary($newTripId);
                    }

                    // Extract and migrate itinerary data
                    $itineraryData = $this->extractItineraryData($oldTour->ID);
                    
                    if (empty($itineraryData)) {
                        Logger::info("No itinerary data found for tour", [
                            'old_tour_id' => $oldTour->ID,
                            'tour_title' => $oldTour->post_title
                        ]);
                        $skipped++;
                        continue;
                    }

                    // Create itinerary in new structure
                    $result = $this->createItinerary($newTripId, $itineraryData, $oldTour->ID);
                    
                    if ($result) {
                        $migrated++;
                        Logger::info("Itinerary migrated successfully", [
                            'trip_id' => $newTripId,
                            'old_tour_id' => $oldTour->ID,
                            'tour_title' => $oldTour->post_title,
                            'days_count' => count($itineraryData)
                        ]);
                    } else {
                        $failed++;
                        Logger::error("Failed to migrate itinerary", [
                            'trip_id' => $newTripId,
                            'old_tour_id' => $oldTour->ID
                        ]);
                    }

                } catch (\Exception $e) {
                    $failed++;
                    Logger::error("Exception during itinerary migration", [
                        'old_tour_id' => $oldTour->ID,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            }

            Logger::info("Itinerary Migration: Completed", [
                'migrated' => $migrated,
                'skipped' => $skipped,
                'failed' => $failed,
                'total' => $total,
                'force_migration' => $this->service->isForceMigration()
            ]);

            return compact('migrated', 'skipped', 'failed', 'total');

        } catch (\Exception $e) {
            Logger::error("Itinerary Migration failed", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'migrated' => $migrated,
                'skipped' => $skipped,
                'failed' => $failed + 1,
                'total' => $total ?? 0
            ];
        }
    }

    /**
     * Get old tours that might have itinerary data
     */
    private function getOldToursWithItinerary(): array
    {
        // Get ALL tours (not just published) for debugging
        $tours = $this->wpdb->get_results(
            "SELECT * FROM {$this->wpdb->posts} 
             WHERE post_type = 'tour'"
        );

        Logger::info("Itinerary Migration: Found tours", [
            'total_tours' => count($tours)
        ]);

        // Debug: Check first tour before filtering
        if (!empty($tours)) {
            $firstTour = reset($tours);
            $firstMeta = $this->getPostMeta($firstTour->ID);
            }

        // Filter tours that have itinerary-related meta data
        $toursWithItinerary = array_filter($tours, function($tour) {
            $meta = $this->getPostMeta($tour->ID);
            
            // Aggressive debug: Log all meta keys for this tour
            Logger::info("Itinerary Migration: Tour meta keys", [
                'tour_id' => $tour->ID,
                'tour_title' => $tour->post_title,
                'meta_keys' => array_keys($meta),
                'content_preview' => substr($tour->post_content, 0, 200)
            ]);
            
            // Check for various possible itinerary meta keys
            $itineraryKeys = [
                'itinerary_repeator',  // This is the actual key found in the database
                'itinerary_label',
                'yatra_tour_itinerary',
                'yatra_tour_meta_itinerary',
                'yatra_itinerary',
                'tour_itinerary',
                'yatra_tour_days',
                'yatra_tour_meta_days',
                'yatra_days',
                'tour_days',
                'yatra_tour_schedule',
                'yatra_tour_meta_schedule',
                'yatra_schedule',
                'tour_schedule'
            ];

            foreach ($itineraryKeys as $key) {
                if (!empty($meta[$key])) {
                    Logger::info("Itinerary Migration: Found itinerary meta", [
                        'tour_id' => $tour->ID,
                        'meta_key' => $key,
                        'meta_value' => $meta[$key]
                    ]);
                    return true;
                }
            }

            // Also check if tour content might contain itinerary information
            // (some tours might have itinerary in the content)
            if (strpos($tour->post_content, 'Day') !== false || 
                strpos($tour->post_content, 'itinerary') !== false ||
                strpos($tour->post_content, 'schedule') !== false) {
                Logger::info("Itinerary Migration: Found itinerary in content", [
                    'tour_id' => $tour->ID,
                    'has_day' => strpos($tour->post_content, 'Day') !== false,
                    'has_itinerary' => strpos($tour->post_content, 'itinerary') !== false,
                    'has_schedule' => strpos($tour->post_content, 'schedule') !== false
                ]);
                return true;
            }

            return false;
        });

        Logger::info("Itinerary Migration: Tours with itinerary", [
            'tours_with_itinerary' => count($toursWithItinerary)
        ]);

        return $toursWithItinerary;
    }

    /**
     * Extract itinerary data from old tour meta
     */
    private function extractItineraryData(int $oldTourId): array
    {
        $meta = $this->getPostMeta($oldTourId);
        $itineraryData = [];

        // Try different possible meta keys for itinerary data
        $itineraryKeys = [
            'itinerary_repeator',  // This is the actual key found in the database
            'itinerary_label',
            'yatra_tour_itinerary',
            'yatra_tour_meta_itinerary',
            'yatra_itinerary',
            'tour_itinerary'
        ];

        foreach ($itineraryKeys as $key) {
            if (!empty($meta[$key])) {
                $itineraryData = $this->parseItineraryData($meta[$key]);
                if (!empty($itineraryData)) {
                    break;
                }
            }
        }

        // If no structured data found, try to parse from content
        if (empty($itineraryData)) {
            $tour = get_post($oldTourId);
            if ($tour) {
                $itineraryData = $this->parseItineraryFromContent($tour->post_content);
            }
        }

        return $itineraryData;
    }

    /**
     * Parse itinerary data from meta value
     */
    private function parseItineraryData($itineraryData): array
    {
        $parsed = [];

        // Handle different data formats
        if (is_string($itineraryData)) {
            // Try to unserialize if it's serialized data
            $unserialized = @unserialize($itineraryData);
            if ($unserialized !== false) {
                $itineraryData = $unserialized;
            } else {
                // Try to decode JSON
                $decoded = @json_decode($itineraryData, true);
                if ($decoded !== null) {
                    $itineraryData = $decoded;
                }
            }
        }

        // Handle the specific itinerary_repeator structure
        if (is_array($itineraryData) && isset($itineraryData['itinerary_heading'])) {
            $headings = $itineraryData['itinerary_heading'] ?? [];
            $titles = $itineraryData['itinerary_title'] ?? [];
            $details = $itineraryData['itinerary_details'] ?? [];
            
            $maxDays = max(count($headings), count($titles), count($details));
            
            for ($i = 0; $i < $maxDays; $i++) {
                $dayTitle = !empty($titles[$i]) ? $titles[$i] : $headings[$i] ?? '';
                $dayDescription = $details[$i] ?? '';
                
                if (!empty($dayTitle) || !empty($dayDescription)) {
                    $parsed[] = [
                        'day_number' => $i + 1,
                        'title' => sanitize_text_field($dayTitle),
                        'description' => wp_kses_post($dayDescription),
                        'entries' => [] // No separate entries in this format
                    ];
                }
            }
        }
        // Handle generic array format
        elseif (is_array($itineraryData)) {
            foreach ($itineraryData as $dayData) {
                if (is_array($dayData) && !empty($dayData['title'])) {
                    $parsed[] = [
                        'day_number' => intval($dayData['day'] ?? $dayData['day_number'] ?? (count($parsed) + 1)),
                        'title' => sanitize_text_field($dayData['title'] ?? $dayData['day_title'] ?? ''),
                        'description' => wp_kses_post($dayData['description'] ?? $dayData['content'] ?? ''),
                        'entries' => $this->parseDayEntries($dayData['entries'] ?? $dayData['activities'] ?? [])
                    ];
                }
            }
        }

        return $parsed;
    }

    /**
     * Parse day entries/activities
     */
    private function parseDayEntries($entries): array
    {
        $parsedEntries = [];

        if (!is_array($entries)) {
            return $parsedEntries;
        }

        foreach ($entries as $entry) {
            if (is_array($entry) && !empty($entry['title'])) {
                $parsedEntries[] = [
                    'title' => sanitize_text_field($entry['title'] ?? $entry['activity'] ?? ''),
                    'description' => wp_kses_post($entry['description'] ?? $entry['content'] ?? ''),
                    'time' => sanitize_text_field($entry['time'] ?? $entry['time_of_day'] ?? ''),
                    'start_time' => sanitize_text_field($entry['start_time'] ?? ''),
                    'end_time' => sanitize_text_field($entry['end_time'] ?? ''),
                    'location' => sanitize_text_field($entry['location'] ?? ''),
                    'order' => intval($entry['order'] ?? count($parsedEntries)),
                    'item_type_id' => null, // Will be set to default activity type
                    'item_id' => null
                ];
            }
        }

        return $parsedEntries;
    }

    /**
     * Parse itinerary from tour content (fallback method)
     */
    private function parseItineraryFromContent(string $content): array
    {
        $itinerary = [];
        
        // Simple regex to extract day-based content
        // This is a basic implementation - can be enhanced based on actual content structure
        preg_match_all('/(?:Day\s*(\d+)|(\d+)\.\s*Day)[\s:]*([^\n]*(?:\n(?!Day|\d+\.)[^\n]*)*)/i', $content, $matches, PREG_SET_ORDER);

        foreach ($matches as $match) {
            $dayNumber = intval($match[1] ?: $match[2]);
            $dayContent = trim($match[3] ?? '');
            
            if ($dayNumber > 0 && !empty($dayContent)) {
                // Extract title from first line
                $lines = explode("\n", $dayContent);
                $title = trim($lines[0] ?? "Day $dayNumber");
                $description = trim(implode("\n", array_slice($lines, 1)));
                
                $itinerary[] = [
                    'day_number' => $dayNumber,
                    'title' => sanitize_text_field($title),
                    'description' => wp_kses_post($description),
                    'entries' => []
                ];
            }
        }

        return $itinerary;
    }

    /**
     * Clean day title and description by removing "Day {index} -" pattern
     */
    private function cleanDayData(string $title, string $description): array
    {
        // Remove "Day {number} -" pattern from title and description
        $pattern = '/^Day\s+\d+\s*-\s*/i';
        
        $cleanTitle = preg_replace($pattern, '', trim($title));
        $cleanDescription = preg_replace($pattern, '', trim($description));
        
        return [
            'title' => $cleanTitle,
            'description' => $cleanDescription
        ];
    }

    /**
     * Create itinerary in new structure
     */
    private function createItinerary(int $tripId, array $itineraryData, int $oldTourId): bool
    {
        try {
            $tableDays = $this->wpdb->prefix . 'yatra_trip_itinerary_days';
            $tableEntries = $this->wpdb->prefix . 'yatra_trip_itinerary_entries';
            
            // Get current user ID for tracking
            $currentUserId = get_current_user_id();
            if (!$currentUserId) {
                $currentUserId = 1; // Fallback to admin
            }

            foreach ($itineraryData as $dayData) {
                // Clean day title and description
                $cleanedData = $this->cleanDayData($dayData['title'], $dayData['description']);
                
                // Create day
                $dayResult = $this->wpdb->insert(
                    $tableDays,
                    [
                        'trip_id' => $tripId,
                        'day_number' => $dayData['day_number'],
                        'title' => $cleanedData['title'],
                        'description' => $cleanedData['description'],
                        'order' => $dayData['day_number'] - 1,
                        'created_at' => current_time('mysql'),
                        'updated_at' => current_time('mysql')
                    ],
                    ['%d', '%d', '%s', '%s', '%d', '%s', '%s']
                );
                
                if (!$dayResult) {
                    Logger::error("Failed to create itinerary day", [
                        'trip_id' => $tripId,
                        'day_number' => $dayData['day_number'],
                        'wpdb_error' => $this->wpdb->last_error
                    ]);
                    continue;
                }

                $dayId = $this->wpdb->insert_id;

                // Create entries for this day
                foreach ($dayData['entries'] as $entryData) {
                    $entryResult = $this->wpdb->insert(
                        $tableEntries,
                        [
                            'trip_id' => $tripId,
                            'day_id' => $dayId,
                            'title' => $entryData['title'],
                            'description' => $entryData['description'],
                            'time' => $entryData['time'],
                            'start_time' => $entryData['start_time'],
                            'end_time' => $entryData['end_time'],
                            'location' => $entryData['location'],
                            'item_type_id' => $entryData['item_type_id'],
                            'item_id' => $entryData['item_id'],
                            'status' => 'publish',
                            'order' => $entryData['order'],
                            'created_at' => current_time('mysql'),
                            'updated_at' => current_time('mysql')
                        ],
                        ['%d', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%s', '%d', '%s', '%s']
                    );

                    if (!$entryResult) {
                        Logger::error("Failed to create itinerary entry", [
                            'trip_id' => $tripId,
                            'day_id' => $dayId,
                            'entry_title' => $entryData['title'],
                            'wpdb_error' => $this->wpdb->last_error
                        ]);
                    }
                }
            }

            Logger::info("Itinerary created successfully", [
                'trip_id' => $tripId,
                'old_tour_id' => $oldTourId,
                'days_created' => count($itineraryData)
            ]);

            return true;

        } catch (\Exception $e) {
            Logger::error("Exception creating itinerary", [
                'trip_id' => $tripId,
                'old_tour_id' => $oldTourId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Check if trip already has itinerary
     */
    private function hasItinerary(int $tripId): bool
    {
        $tableDays = $this->wpdb->prefix . 'yatra_trip_itinerary_days';
        
        $count = (int) $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(*) FROM {$tableDays} WHERE trip_id = %d",
            $tripId
        ));

        return $count > 0;
    }

    /**
     * Delete existing itinerary for a trip
     */
    private function deleteTripItinerary(int $tripId): void
    {
        $tableDays = $this->wpdb->prefix . 'yatra_trip_itinerary_days';
        $tableEntries = $this->wpdb->prefix . 'yatra_trip_itinerary_entries';
        $tableImages = $this->wpdb->prefix . 'yatra_trip_itinerary_entry_images';

        // Delete entries first (foreign key constraint)
        $this->wpdb->delete($tableEntries, ['trip_id' => $tripId], ['%d']);
        
        // Delete images
        $this->wpdb->query($this->wpdb->prepare(
            "DELETE ti FROM {$tableImages} ti 
             INNER JOIN {$tableEntries} te ON ti.entry_id = te.id 
             WHERE te.trip_id = %d",
            $tripId
        ));
        
        // Delete days
        $this->wpdb->delete($tableDays, ['trip_id' => $tripId], ['%d']);
    }

    /**
     * Get migrated trip ID from old tour ID
     */
    protected function getMigratedTripId(int $oldTourId): ?int
    {
        $tripId = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT meta_value FROM {$this->wpdb->postmeta} 
             WHERE meta_key = '_migrated_to_trip_id' AND post_id = %d",
            $oldTourId
        ));
        
        Logger::info("Itinerary Migration: Trip mapping check", [
            'old_tour_id' => $oldTourId,
            'new_trip_id' => $tripId,
            'found_mapping' => !empty($tripId)
        ]);
        
        return $tripId;
    }
}
