<?php

namespace Yatra\Migration;

use Yatra\Utils\Logger;
use Yatra\Migration\MigrationProgress;
use Yatra\Database\Tables\TripsTable;
use Yatra\Database\Tables\TripContentTable;
use Yatra\Database\Tables\TripAvailabilityDatesTable;

class TripMigration extends BaseMigration
{
    public function __construct(MigrationProgress $service)
    {
        parent::__construct($service);
    }

    public function run(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        // Get all tours from old system (including all statuses except trash)
        $oldTrips = $this->wpdb->get_results(
            "SELECT * FROM {$this->wpdb->posts} 
             WHERE post_type = 'tour' AND post_status != 'trash'"
        );

        $total = count($oldTrips);
        
        // Count existing trips in new system
        $existingTripsCount = $this->wpdb->get_var(
            "SELECT COUNT(*) FROM " . TripsTable::getTableName()
        );
        
        // List all tour IDs and titles for debugging
        foreach ($oldTrips as $idx => $trip) {
            }

        foreach ($oldTrips as $oldTrip) {
            try {
                // Always re-migrate trips on every run - no skip logic
                $meta = $this->getPostMeta($oldTrip->ID);

                $status = ($oldTrip->post_status === 'publish') ? 'publish' : 'draft';

                $baseSlug = $oldTrip->post_name ?: sanitize_title($oldTrip->post_title);
                $slug = $baseSlug;
                $existingTripId = null;
                
                if ($this->isForceMigration()) {
                    // Force migration: Always insert new (create duplicates)
                    $slug = $this->generateUniqueSlug($baseSlug, 'yatra_trips');
                    } else {
                    // Regular migration: Check if already exists
                    $existingTripId = $this->wpdb->get_var($this->wpdb->prepare(
                        "SELECT id FROM " . TripsTable::getTableName() . " WHERE slug = %s",
                        $baseSlug
                    ));
                    
                    if (!$existingTripId) {
                        // Generate unique slug for new insert
                        $slug = $this->generateUniqueSlug($baseSlug, 'yatra_trips');
                    }
                }

                // Raw SQL: get_post_thumbnail_id internally calls get_post_meta for _thumbnail_id
                $featuredImageId = $this->getRawPostMeta($oldTrip->ID, '_thumbnail_id');
                $featuredImageId = $featuredImageId ? (int) $featuredImageId : null;
                $createdBy = intval($oldTrip->post_author);

                $regularPrice = $this->getLegacyMetaValue($meta, [
                    'yatra_tour_meta_regular_price',
                    'yatra_tour_meta_tour_price',
                    'yatra_tour_meta_price',
                    'yatra_tour_meta_price_per_person',
                ]);

                $salePrice = $this->getLegacyMetaValue($meta, [
                    'yatra_tour_meta_sales_price',
                    'yatra_tour_meta_sale_price',
                    'yatra_tour_meta_tour_sale_price',
                ]);

                $maxTravelersMeta = $this->getLegacyMetaValue($meta, [
                    'yatra_tour_meta_tour_group_size',
                    'yatra_tour_meta_group_size',
                    'yatra_tour_maximum_number_of_traveller',
                    'yatra_tour_meta_group_max',
                ]);

                $pricePerMeta = strtolower((string) $this->getLegacyMetaValue($meta, [
                    'yatra_tour_meta_price_per',
                ], 'person'));

                $regularPriceFloat = $regularPrice !== null ? (float) $regularPrice : 0.0;
                $salePriceFloat = $salePrice !== null && $salePrice !== ''
                    ? (float) $salePrice
                    : null;

                if ($salePriceFloat !== null && $salePriceFloat <= 0) {
                    $salePriceFloat = null;
                }

                if ($salePriceFloat !== null && $salePriceFloat >= $regularPriceFloat) {
                    $salePriceFloat = null;
                }

                $maxTravelers = $maxTravelersMeta !== null && $maxTravelersMeta !== ''
                    ? (int) $maxTravelersMeta
                    : 10;

                $tripData = [
                    'title' => $oldTrip->post_title,
                    'slug' => $slug,
                    'description' => $oldTrip->post_content,
                    'short_description' => $oldTrip->post_excerpt,
                    'trip_details' => $oldTrip->post_content,
                    'duration_days' => intval($meta['yatra_tour_meta_tour_duration_days'] ?? 1),
                    'duration_nights' => intval($meta['yatra_tour_meta_tour_duration_nights'] ?? 0),
                    'max_travelers' => $maxTravelers > 0 ? $maxTravelers : 10,
                    'original_price' => $regularPriceFloat,
                    'sale_price' => $salePriceFloat,
                    'discounted_price' => $salePriceFloat,
                    'price_per_person' => $pricePerMeta !== 'group' ? 1 : 0,
                    'featured_image' => $featuredImageId ?: null,
                    'status' => $status,
                    'created_at' => $oldTrip->post_date,
                    'updated_at' => $oldTrip->post_modified,
                    'created_by' => $createdBy,
                    'updated_by' => $createdBy,
                ];

                if ($existingTripId && !$this->isForceMigration()) {
                    // Regular migration: Update existing trip
                    $updateData = $tripData;
                    unset($updateData['created_at']); // Don't update created_at
                    
                    $updated = $this->wpdb->update(
                        TripsTable::getTableName(),
                        $updateData,
                        ['id' => $existingTripId]
                    );
                    
                    if ($updated !== false) {
                        $newTripId = $existingTripId;
                        $this->deleteTripRelationships($newTripId);
                        $migrated++;
                        } else {
                        $failed++;
                        Logger::error("Failed to update trip ID {$oldTrip->ID}: {$this->wpdb->last_error}", [
                            'source' => 'migration',
                            'data_type' => 'trips',
                            'trip_id' => $oldTrip->ID,
                            'trip_title' => $oldTrip->post_title,
                            'db_error' => $this->wpdb->last_error
                        ]);
                        $this->updateProgress('trips', 'running', $migrated, $skipped, $failed, $total, null, null);
                        continue;
                    }
                } else {
                    // Force migration OR new trip: Insert new
                    $mode = $this->isForceMigration() ? 'Force mode' : 'Regular mode (new trip)';
                    $inserted = $this->wpdb->insert(
                        TripsTable::getTableName(),
                        $tripData
                    );

                    if ($inserted) {
                        $newTripId = $this->wpdb->insert_id;
                        $migrated++;
                        } else {
                        $failed++;
                        Logger::error("Failed to insert trip ID {$oldTrip->ID} into database", [
                            'source' => 'migration',
                            'data_type' => 'trips',
                            'trip_id' => $oldTrip->ID,
                            'trip_title' => $oldTrip->post_title,
                            'db_error' => $this->wpdb->last_error
                        ]);
                        $this->updateProgress('trips', 'running', $migrated, $skipped, $failed, $total, null, null);
                        continue;
                    }
                }

                $this->setRawPostMeta($oldTrip->ID, '_migrated_to_trip_id', (string) $newTripId);

                $this->migrateTripDestinations($oldTrip->ID, $newTripId);
                $this->migrateTripActivities($oldTrip->ID, $newTripId);
                $this->migrateTripGallery($oldTrip->ID, $newTripId, $meta);
                $this->migrateTripHighlights($oldTrip->ID, $newTripId, $meta);
                $this->migrateTripFAQs($oldTrip->ID, $newTripId, $meta);
                $this->migrateTripAvailabilityDates($oldTrip->ID, $newTripId, $meta, $tripData);

                $this->updateProgress('trips', 'running', $migrated, $skipped, $failed, $total, null, null);

                usleep(100000);
            } catch (\Exception $e) {
                $failed++;
                Logger::error("Exception migrating trip ID {$oldTrip->ID}: {$e->getMessage()}", [
                    'source' => 'migration',
                    'data_type' => 'trips',
                    'trip_id' => $oldTrip->ID,
                    'trip_title' => $oldTrip->post_title,
                    'error' => $e->getMessage()
                ]);

                $this->updateProgress('trips', 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        }

        return compact('migrated', 'skipped', 'failed');
    }

    /**
     * Migrate trip gallery images from old tour system
     */
    private function migrateTripGallery(int $oldTourId, int $newTripId, array $meta): void
    {
        global $wpdb;
        $table = TripContentTable::getTableName();
        
        // Clear existing gallery for this trip (unless force migration)
        if (!$this->isForceMigration()) {
            $deleted = $wpdb->delete($table, ['trip_id' => $newTripId], ['%d']);
            if ($deleted) {
                }
        }
        
        // Direct database query to find ALL gallery-related meta
        $allGalleryMeta = $wpdb->get_results($wpdb->prepare(
            "SELECT meta_key, meta_value FROM {$wpdb->postmeta} 
             WHERE post_id = %d 
             AND (meta_key LIKE '%%gallery%%' OR meta_key LIKE '%%image%%' OR meta_key LIKE '%%photo%%')
             ORDER BY meta_key",
            $oldTourId
        ));
        
        if (!empty($allGalleryMeta)) {
            foreach ($allGalleryMeta as $metaRow) {
                }
        } else {
            }
        
        $galleryImages = [];
        
        // The primary gallery meta key from old Yatra system
        $galleryKeys = [
            'yatra_tour_meta_gallery',  // Primary: comma-separated attachment IDs
            'yatra_tour_slider_items',  // Slider items: comma-separated attachment IDs
            'yatra_tour_gallery',
            'yatra_tour_meta_gallery_images',
            'yatra_gallery',
            'tour_gallery',
            'yatra_tour_images',
            'yatra_tour_meta_images',
            'yatra_images',
            'tour_images',
            'yatra_tour_photos',
            'yatra_tour_meta_photos',
            'yatra_photos',
            'tour_photos',
            '_yatra_gallery',
            '_tour_gallery'
        ];
        
        foreach ($galleryKeys as $key) {
            if (isset($meta[$key]) && !empty($meta[$key])) {
                $galleryData = $meta[$key];
                // Handle comma-separated attachment IDs (e.g., "0,27,26,25,24,23,22,19,18")
                if (is_string($galleryData) && strpos($galleryData, ',') !== false) {
                    $attachmentIds = array_filter(array_map('intval', explode(',', $galleryData)));
                    if (!empty($attachmentIds)) {
                        $galleryImages = $attachmentIds;
                        break;
                    }
                }
                // Handle single attachment ID
                elseif (is_numeric($galleryData) && intval($galleryData) > 0) {
                    $galleryImages = [intval($galleryData)];
                    break;
                }
                // Handle serialized data
                elseif (is_string($galleryData)) {
                    $unserialized = maybe_unserialize($galleryData);
                    if (is_array($unserialized) && !empty($unserialized)) {
                        $galleryImages = $unserialized;
                        break;
                    }
                }
                // Handle array data
                elseif (is_array($galleryData) && !empty($galleryData)) {
                    $galleryImages = $galleryData;
                    break;
                }
            }
        }
        
        // Log what keys were checked
        // If no gallery meta found, try to get attached images to the tour post
        if (empty($galleryImages)) {
            // Raw SQL: get_attached_media won't reliably work for unregistered CPT parents
            $attachedImages = $this->wpdb->get_results($this->wpdb->prepare(
                "SELECT ID, post_excerpt FROM {$this->wpdb->posts}
                 WHERE post_parent = %d AND post_type = 'attachment' AND post_mime_type LIKE 'image%%'
                 ORDER BY menu_order ASC",
                $oldTourId
            ));
            if (!empty($attachedImages)) {
                foreach ($attachedImages as $attachment) {
                    $galleryImages[] = [
                        'id' => $attachment->ID,
                        'url' => wp_get_attachment_url($attachment->ID),
                        'thumbnail_url' => wp_get_attachment_thumb_url($attachment->ID),
                        'alt_text' => $this->getRawPostMeta($attachment->ID, '_wp_attachment_image_alt') ?? '',
                        'caption' => $attachment->post_excerpt
                    ];
                }
            } else {
                }
        }
        
        // Migrate gallery images to new format
        if (empty($galleryImages)) {
            return;
        }
        
        $order = 0;
        $migrated = 0;
        $failed = 0;
        
        foreach ($galleryImages as $index => $image) {
                $imageUrl = '';
                $thumbnailUrl = '';
                $altText = '';
                $caption = '';
                $imageId = null;
                
                // Handle different image data formats
                if (is_numeric($image)) {
                    // Simple attachment ID (most common format from old Yatra)
                    $imageId = (int) $image;
                    
                    // Skip invalid IDs (like 0)
                    if ($imageId <= 0) {
                        continue;
                    }
                    
                    $imageUrl = wp_get_attachment_url($imageId);
                    if (!$imageUrl) {
                        continue;
                    }
                    
                    $thumbnailUrl = wp_get_attachment_thumb_url($imageId) ?: $imageUrl;
                    $altText = $this->getRawPostMeta($imageId, '_wp_attachment_image_alt') ?? '';
                    $attachment = get_post($imageId);
                    if ($attachment) {
                        $caption = $attachment->post_excerpt ?: '';
                    }
                    
                    } elseif (is_string($image)) {
                    // URL string
                    $imageUrl = $image;
                    $thumbnailUrl = $imageUrl;
                } elseif (is_array($image)) {
                    // Array format
                    $imageId = !empty($image['id']) ? (int) $image['id'] : null;
                    $imageUrl = $image['url'] ?? $image['image_url'] ?? $image['src'] ?? '';
                    $thumbnailUrl = $image['thumbnail_url'] ?? $image['thumb'] ?? $imageUrl;
                    $altText = $image['alt_text'] ?? $image['alt'] ?? '';
                    $caption = $image['caption'] ?? $image['description'] ?? '';
                }
                
                if (!empty($imageUrl)) {
                    $result = $wpdb->insert(
                        $table,
                        [
                            'trip_id' => $newTripId,
                            'image_id' => $imageId ?: null,
                            'image_url' => $imageUrl,
                            'thumbnail_url' => $thumbnailUrl,
                            'alt_text' => $altText,
                            'caption' => $caption,
                            'order' => $order,
                            'is_featured' => $order === 0 ? 1 : 0, // First image is featured
                            'image_type' => 'gallery',
                            'created_at' => current_time('mysql')
                        ],
                        ['%d', '%d', '%s', '%s', '%s', '%s', '%d', '%d', '%s', '%s']
                    );
                    
                    if ($result) {
                        $migrated++;
                        $order++;
                        } else {
                        $failed++;
                        }
                } else {
                    }
        }
        
        }

    /**
     * Migrate trip highlights from old tour system
     */
    private function migrateTripHighlights(int $oldTourId, int $newTripId, array $meta): void
    {
        global $wpdb;
        $table = TripContentTable::getTableName();
        
        // Clear existing highlights for this trip
        $wpdb->delete($table, ['trip_id' => $newTripId, 'content_type' => 'highlight'], ['%d', '%s']);
        
        $highlights = [];
        
        // Try different possible highlights meta keys
        $highlightsKeys = [
            'yatra_tour_highlights',
            'yatra_tour_meta_highlights',
            'yatra_highlights',
            'tour_highlights',
            'yatra_tour_features',
            'yatra_tour_meta_features',
            'yatra_features',
            'tour_features'
        ];
        
        foreach ($highlightsKeys as $key) {
            if (!empty($meta[$key])) {
                $highlightsData = $meta[$key];
                if (is_string($highlightsData)) {
                    $highlightsData = maybe_unserialize($highlightsData);
                }
                
                if (is_array($highlightsData) && !empty($highlightsData)) {
                    $highlights = $highlightsData;
                    break;
                }
            }
        }
        
        // Migrate highlights
        if (!empty($highlights)) {
            $order = 0;
            foreach ($highlights as $highlight) {
                $title = '';
                $description = '';
                $icon = '';
                
                if (is_string($highlight)) {
                    // Simple string - treat as title
                    $title = $highlight;
                } elseif (is_array($highlight)) {
                    $title = $highlight['title'] ?? $highlight['name'] ?? $highlight['text'] ?? '';
                    $description = $highlight['description'] ?? $highlight['content'] ?? '';
                    $icon = $highlight['icon'] ?? $highlight['icon_class'] ?? '';
                }
                
                if (!empty($title)) {
                    $wpdb->insert(
                        $table,
                        [
                            'trip_id' => $newTripId,
                            'highlight_text' => $title,
                            'highlight_icon' => $icon,
                            'order' => $order,
                            'created_at' => current_time('mysql')
                        ],
                        ['%d', '%s', '%s', '%d', '%s']
                    );
                    $order++;
                }
            }
            
            }
    }

    /**
     * Migrate trip FAQs from old tour system
     */
    private function migrateTripFAQs(int $oldTourId, int $newTripId, array $meta): void
    {
        global $wpdb;
        $table = TripContentTable::getTableName();
        
        // Clear existing FAQs for this trip (unless force migration)
        if (!$this->isForceMigration()) {
            $deleted = $wpdb->delete($table, ['trip_id' => $newTripId, 'content_type' => 'faq'], ['%d', '%s']);
            if ($deleted) {
                }
        }
        
        $faqs = [];
        
        // The primary FAQ meta key from old Yatra system
        $faqKeys = [
            'faq_repeator',  // Primary: serialized array with faq_heading and faq_description
            'yatra_tour_faqs',
            'yatra_tour_meta_faqs',
            'yatra_faqs',
            'tour_faqs',
            'yatra_tour_faq',
            'yatra_tour_meta_faq',
            'yatra_faq',
            'tour_faq'
        ];
        
        foreach ($faqKeys as $key) {
            if (isset($meta[$key]) && !empty($meta[$key])) {
                $faqData = $meta[$key];
                if (is_string($faqData)) {
                    $faqData = maybe_unserialize($faqData);
                    }
                
                if (is_array($faqData) && !empty($faqData)) {
                    // Check if this is the faq_repeator format with faq_heading and faq_description
                    if (isset($faqData['faq_heading']) && isset($faqData['faq_description'])) {
                        $headings = $faqData['faq_heading'];
                        $descriptions = $faqData['faq_description'];
                        
                        if (is_array($headings) && is_array($descriptions)) {
                            // Convert to standard format
                            $faqs = [];
                            $count = min(count($headings), count($descriptions));
                            for ($i = 0; $i < $count; $i++) {
                                if (!empty($headings[$i]) && !empty($descriptions[$i])) {
                                    $faqs[] = [
                                        'question' => $headings[$i],
                                        'answer' => $descriptions[$i]
                                    ];
                                }
                            }
                            break;
                        }
                    } else {
                        // Standard array format
                        $faqs = $faqData;
                        break;
                    }
                }
            }
        }
        
        // Migrate FAQs
        if (empty($faqs)) {
            return;
        }
        
        $order = 0;
        $migrated = 0;
        $failed = 0;
        
        foreach ($faqs as $faq) {
            $question = '';
            $answer = '';
            
            if (is_array($faq)) {
                $question = $faq['question'] ?? $faq['q'] ?? $faq['title'] ?? '';
                $answer = $faq['answer'] ?? $faq['a'] ?? $faq['content'] ?? $faq['description'] ?? '';
            }
            
            if (!empty($question) && !empty($answer)) {
                $result = $wpdb->insert(
                    $table,
                    [
                        'trip_id' => $newTripId,
                        'question' => wp_kses_post($question),
                        'answer' => wp_kses_post($answer),
                        'order' => $order,
                        'created_at' => current_time('mysql')
                    ],
                    ['%d', '%s', '%s', '%d', '%s']
                );
                
                if ($result) {
                    $migrated++;
                    $order++;
                    } else {
                    $failed++;
                    }
            } else {
                }
        }
        
        }

    /**
     * Migrate availability date ranges from old tour system
     */
    private function migrateTripAvailabilityDates(int $oldTourId, int $newTripId, array $meta, array $tripData): void
    {
        global $wpdb;
        $table = TripAvailabilityDatesTable::getTableName();
        
        // Clear existing availability dates for this trip (for re-migration)
        if ($this->isForceMigration()) {
            // In force mode, don't delete - allow duplicates
        } else {
            // In regular mode, clear existing to avoid duplicates
            $wpdb->delete($table, ['trip_id' => $newTripId], ['%d']);
        }
        
        // Try different possible availability date meta keys from old Yatra
        $availabilityKeys = [
            'yatra_tour_meta_availability_date_ranges',  // Most common format from old system
            'yatra_tour_availability_date_ranges',
            'yatra_tour_meta_availability_dates',
            'yatra_tour_availability_dates',
            'yatra_availability_dates',
            'tour_availability_dates',
            'yatra_tour_fixed_departure_dates',
            'yatra_tour_meta_fixed_departure',
            'yatra_fixed_departure_dates',
        ];
        
        $availabilityData = null;
        $foundKey = null;
        
        // Also try direct database query to ensure we're not missing data
        $directMetaQuery = $wpdb->get_results($wpdb->prepare(
            "SELECT meta_key, meta_value FROM {$wpdb->prefix}postmeta WHERE post_id = %d AND meta_key LIKE %s",
            $oldTourId,
            '%availability%'
        ));
        
        if (!empty($directMetaQuery)) {
            foreach ($directMetaQuery as $metaRow) {
                }
        }
        
        foreach ($availabilityKeys as $key) {
            if (isset($meta[$key])) {
                $availabilityData = $meta[$key];
                if (is_string($availabilityData)) {
                    $availabilityData = maybe_unserialize($availabilityData);
                    if (is_array($availabilityData) || is_object($availabilityData)) {
                        }
                }
                
                // Check if it's an empty array string like '[]'
                if (is_string($availabilityData) && trim($availabilityData) === '[]') {
                    continue;
                }
                
                if (!empty($availabilityData)) {
                    $foundKey = $key;
                    break;
                }
            }
        }
        
        if (empty($availabilityData)) {
            return;
        }
        
        // Parse availability date ranges
        $dateRanges = [];
        
        // First, try to decode as JSON if it's a string (common format in database)
        if (is_string($availabilityData)) {
            $jsonDecoded = json_decode($availabilityData, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($jsonDecoded)) {
                $availabilityData = $jsonDecoded;
                }
        }
        
        if (is_array($availabilityData)) {
            // Handle array format
            foreach ($availabilityData as $dateRange) {
                if (is_array($dateRange) || is_object($dateRange)) {
                    // Convert object to array if needed
                    $dateRange = (array) $dateRange;
                    
                    // Format: ['start' => '2025-12-25', 'end' => '2026-01-18']
                    $start = $dateRange['start'] ?? $dateRange['start_date'] ?? $dateRange['from'] ?? null;
                    $end = $dateRange['end'] ?? $dateRange['end_date'] ?? $dateRange['to'] ?? null;
                    
                    if ($start && $end) {
                        $dateRanges[] = ['start' => $start, 'end' => $end];
                        }
                } elseif (is_string($dateRange)) {
                    // Format: "2025-12-25 - 2026-01-18"
                    $parts = preg_split('/\s*[-–—]\s*/', $dateRange, 2);
                    if (count($parts) === 2) {
                        $dateRanges[] = ['start' => trim($parts[0]), 'end' => trim($parts[1])];
                        }
                }
            }
        } elseif (is_string($availabilityData)) {
            // Handle plain string format with multiple ranges separated by comma or newline
            $lines = preg_split('/[,\n\r]+/', $availabilityData);
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line)) continue;
                
                // Format: "2025-12-25 - 2026-01-18"
                $parts = preg_split('/\s*[-–—]\s*/', $line, 2);
                if (count($parts) === 2) {
                    $dateRanges[] = ['start' => trim($parts[0]), 'end' => trim($parts[1])];
                    }
            }
        }
        
        if (empty($dateRanges)) {
            return;
        }
        
        // Create availability dates for each range
        $created = 0;
        foreach ($dateRanges as $range) {
            $startDate = $range['start'];
            $endDate = $range['end'];
            
            // Validate dates
            if (!strtotime($startDate) || !strtotime($endDate)) {
                continue;
            }
            
            // Calculate duration
            $start = new \DateTime($startDate);
            $end = new \DateTime($endDate);
            $duration = $start->diff($end)->days;
            
            // Determine if single day or multi-day trip
            $isSingleDay = $duration === 0 || ($tripData['duration_days'] ?? 1) === 1;
            
            // Create availability date entry
            $availabilityEntry = [
                'trip_id' => $newTripId,
                'departure_date' => $startDate,
                'arrival_date' => $isSingleDay ? $startDate : $endDate,
                'return_date' => $endDate,
                'departure_time' => null,
                'arrival_time' => null,
                'seats_total' => $tripData['max_travelers'] ?? 10,
                'seats_available' => $tripData['max_travelers'] ?? 10,
                'seats_reserved' => 0,
                'seats_waitlist' => 0,
                'pricing_type' => 'regular',
                'original_price' => $tripData['original_price'] ?? null,
                'discounted_price' => $tripData['sale_price'] ?? null,
                'discount_percentage' => null,
                'price_types' => null,
                'status' => 'available',
                'from_location' => null,
                'to_location' => null,
                'special_notes' => null,
                'cutoff_date' => null,
                'cutoff_hours' => 24,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ];
            
            $inserted = $wpdb->insert(
                $table,
                $availabilityEntry,
                ['%d', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%d', '%d', '%s', '%f', '%f', '%f', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s']
            );
            
            if ($inserted) {
                $created++;
                } else {
                }
        }
        
        if ($created > 0) {
            }
    }
}
