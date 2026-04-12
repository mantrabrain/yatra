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
                    $slug = $this->generateUniqueSlug($baseSlug, 'yatra_new_trips');
                } else {
                    // Regular migration: Check if already exists
                    $existingTripId = $this->wpdb->get_var($this->wpdb->prepare(
                        "SELECT id FROM " . TripsTable::getTableName() . " WHERE slug = %s",
                        $baseSlug
                    ));
                    
                    if (!$existingTripId) {
                        // Generate unique slug for new insert
                        $slug = $this->generateUniqueSlug($baseSlug, 'yatra_new_trips');
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

                $minTravelersMeta = $this->getLegacyMetaValue($meta, [
                    'yatra_tour_minimum_pax',
                ]);
                $minTravelers = $minTravelersMeta !== null && $minTravelersMeta !== ''
                    ? max(1, (int) $minTravelersMeta)
                    : 1;

                $durationDays = intval($meta['yatra_tour_meta_tour_duration_days'] ?? 1);
                $durationNights = intval($meta['yatra_tour_meta_tour_duration_nights'] ?? 0);
                $tripType = ($durationDays <= 1 && $durationNights < 1) ? 'single_day' : 'multi_day';

                $isFeatured = !empty($meta['yatra_tour_meta_tour_featured']) ? 1 : 0;

                $legacyTourType = $meta['yatra_tour_meta_tour_type'] ?? 'regular';
                $customFields = [];
                if (!empty($meta['yatra_tour_meta_disable_booking'])) {
                    $customFields['legacy_disable_booking'] = true;
                }
                if ($legacyTourType === 'external') {
                    $extUrl = $meta['yatra_tour_meta_tour_external_url'] ?? '';
                    if ($extUrl !== '') {
                        $customFields['external_booking_url'] = esc_url_raw((string) $extUrl);
                    }
                    $extBtn = $meta['yatra_tour_meta_tour_external_button_text'] ?? '';
                    if ($extBtn !== '') {
                        $customFields['external_booking_button_text'] = sanitize_text_field((string) $extBtn);
                    }
                }

                $tripData = [
                    'title' => $oldTrip->post_title,
                    'slug' => $slug,
                    'description' => $oldTrip->post_content,
                    'short_description' => $oldTrip->post_excerpt,
                    'trip_details' => $oldTrip->post_content,
                    'trip_type' => $tripType,
                    'duration_days' => $durationDays,
                    'duration_nights' => $durationNights,
                    'min_travelers' => $minTravelers,
                    'max_travelers' => $maxTravelers > 0 ? $maxTravelers : 10,
                    'original_price' => $regularPriceFloat,
                    'sale_price' => $salePriceFloat,
                    'discounted_price' => $salePriceFloat,
                    'featured_image' => $featuredImageId ?: null,
                    'is_featured' => $isFeatured,
                    'status' => $status,
                    'created_at' => $oldTrip->post_date,
                    'updated_at' => $oldTrip->post_modified,
                    'created_by' => $createdBy,
                    'updated_by' => $createdBy,
                ];
                if (!empty($customFields)) {
                    $tripData['custom_fields'] = wp_json_encode($customFields);
                }

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

                // Migrate trip classifications (destinations, activities, categories, attributes)
                $this->migrateTripDestinations($oldTrip->ID, $newTripId);
                $this->migrateTripActivities($oldTrip->ID, $newTripId);
                $this->migrateTripCategories($oldTrip->ID, $newTripId);
                $this->migrateTripAttributes($oldTrip->ID, $newTripId);
                
                // Migrate trip content (gallery, highlights, FAQs)
                $this->migrateTripGallery($oldTrip->ID, $newTripId, $meta);
                $this->migrateTripHighlights($oldTrip->ID, $newTripId, $meta);
                $this->migrateTripFAQs($oldTrip->ID, $newTripId, $meta);
                
                // Migrate pricing and availability
                $this->migrateTripPricing($oldTrip->ID, $newTripId, $meta);
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
        
        // Clear existing gallery images for this trip (unless force migration)
        if (!$this->isForceMigration()) {
            $deleted = $wpdb->delete($table, ['trip_id' => $newTripId, 'content_type' => 'image'], ['%d', '%s']);
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
                    $imageMetadata = [];
                    if ($imageId) {
                        $imageMetadata['image_id'] = $imageId;
                    }
                    if (!empty($altText)) {
                        $imageMetadata['alt_text'] = $altText;
                    }

                    $result = $wpdb->insert(
                        $table,
                        [
                            'trip_id' => $newTripId,
                            'content_type' => 'image',
                            'title' => !empty($altText) ? $altText : (!empty($caption) ? $caption : null),
                            'description' => !empty($caption) ? $caption : null,
                            'content_url' => $imageUrl,
                            'thumbnail_url' => $thumbnailUrl,
                            'metadata' => !empty($imageMetadata) ? json_encode($imageMetadata) : null,
                            'sort_order' => $order,
                            'is_featured' => $order === 0 ? 1 : 0,
                            'created_at' => current_time('mysql')
                        ],
                        ['%d', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%s']
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
                    $highlightMetadata = [];
                    if (!empty($icon)) {
                        $highlightMetadata['icon'] = $icon;
                    }
                    if (!empty($description)) {
                        $highlightMetadata['description'] = $description;
                    }

                    $wpdb->insert(
                        $table,
                        [
                            'trip_id' => $newTripId,
                            'content_type' => 'highlight',
                            'title' => $title,
                            'description' => !empty($description) ? $description : null,
                            'metadata' => !empty($highlightMetadata) ? json_encode($highlightMetadata) : null,
                            'sort_order' => $order,
                            'created_at' => current_time('mysql')
                        ],
                        ['%d', '%s', '%s', '%s', '%s', '%d', '%s']
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
                        'content_type' => 'faq',
                        'title' => wp_kses_post($question),
                        'description' => wp_kses_post($answer),
                        'sort_order' => $order,
                        'created_at' => current_time('mysql')
                    ],
                    ['%d', '%s', '%s', '%s', '%d', '%s']
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
     * Migrate trip categories relationship
     */
    private function migrateTripCategories(int $oldTripId, int $newTripId): void
    {
        global $wpdb;
        
        // Categories: legacy sites used `trip_category` (3.x) or `tour_category` (some 2.x builds).
        $categories = $wpdb->get_results($wpdb->prepare(
            "SELECT t.term_id, t.name, t.slug, tt.taxonomy AS source_taxonomy
             FROM {$wpdb->terms} t
             INNER JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
             INNER JOIN {$wpdb->term_relationships} tr ON tt.term_taxonomy_id = tr.term_taxonomy_id
             WHERE tr.object_id = %d AND tt.taxonomy IN ('trip_category', 'tour_category')",
            $oldTripId
        ));

        if (empty($categories)) {
            return;
        }

        $classificationsTable = \Yatra\Database\Tables\ClassificationsTable::getTableName();
        $tripClassificationsTable = \Yatra\Database\Tables\TripClassificationsTable::getTableName();

        foreach ($categories as $index => $category) {
            // Find the migrated category in ClassificationsTable
            $newCategoryId = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$classificationsTable} WHERE slug = %s AND type = %s",
                $category->slug,
                \Yatra\Constants\ClassificationTypes::CATEGORY
            ));

            if (!$newCategoryId) {
                // Term meta from {@see BaseMigration::migrateTaxonomy}: _yatra_migrated_{taxonomy}_id
                $sourceTax = isset($category->source_taxonomy) && is_string($category->source_taxonomy)
                    ? $category->source_taxonomy
                    : 'trip_category';
                $mappedId = $this->getRawTermMeta(
                    (int) $category->term_id,
                    sprintf('_yatra_migrated_%s_id', $sourceTax)
                );
                if (!$mappedId && $sourceTax === 'trip_category') {
                    $mappedId = $this->getRawTermMeta((int) $category->term_id, '_yatra_migrated_tour_category_id');
                } elseif (!$mappedId && $sourceTax === 'tour_category') {
                    $mappedId = $this->getRawTermMeta((int) $category->term_id, '_yatra_migrated_trip_category_id');
                }
                if (!$mappedId) {
                    $mappedId = $this->getRawTermMeta((int) $category->term_id, '_yatra_migrated_category_id');
                }
                if ($mappedId) {
                    $newCategoryId = (int) $mappedId;
                }
            }

            if ($newCategoryId) {
                // Check if relationship already exists
                $exists = $wpdb->get_var($wpdb->prepare(
                    "SELECT id FROM {$tripClassificationsTable}
                     WHERE trip_id = %d AND classification_id = %d AND classification_type = %s",
                    $newTripId,
                    $newCategoryId,
                    \Yatra\Constants\ClassificationTypes::CATEGORY
                ));

                if (!$exists) {
                    $wpdb->insert(
                        $tripClassificationsTable,
                        [
                            'trip_id' => $newTripId,
                            'classification_id' => $newCategoryId,
                            'classification_type' => \Yatra\Constants\ClassificationTypes::CATEGORY,
                            'relationship_type' => 'primary',
                            'sort_order' => $index,
                            'is_active' => 1,
                            'created_at' => current_time('mysql'),
                            'updated_at' => current_time('mysql'),
                        ]
                    );
                }
            }
        }
    }

    /**
     * Migrate trip attributes with values
     */
    private function migrateTripAttributes(int $oldTripId, int $newTripId): void
    {
        global $wpdb;
        
        // Get custom attributes from post meta
        $attributesData = $this->getRawPostMeta($oldTripId, 'tour_meta_custom_attributes');
        
        if (empty($attributesData)) {
            return;
        }

        // Unserialize if needed
        if (is_string($attributesData)) {
            $attributesData = maybe_unserialize($attributesData);
        }

        if (!is_array($attributesData) || empty($attributesData)) {
            return;
        }

        $classificationsTable = \Yatra\Database\Tables\ClassificationsTable::getTableName();
        $tripClassificationsTable = \Yatra\Database\Tables\TripClassificationsTable::getTableName();

        $order = 0;
        foreach ($attributesData as $termId => $attributeValue) {
            // Get the old attribute term
            $attribute = $wpdb->get_row($wpdb->prepare(
                "SELECT t.term_id, t.name, t.slug
                 FROM {$wpdb->terms} t
                 INNER JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
                 WHERE t.term_id = %d AND tt.taxonomy = 'attributes'",
                $termId
            ));

            if (!$attribute) {
                continue;
            }

            // Find the migrated attribute in ClassificationsTable
            $newAttributeId = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$classificationsTable} WHERE slug = %s AND type = %s",
                $attribute->slug,
                \Yatra\Constants\ClassificationTypes::ATTRIBUTE
            ));

            if (!$newAttributeId) {
                // Try looking up by term meta mapping
                $mappedId = $this->getRawTermMeta((int) $attribute->term_id, '_yatra_migrated_attributes_id');
                if ($mappedId) {
                    $newAttributeId = (int) $mappedId;
                }
            }

            if ($newAttributeId) {
                // Check if relationship already exists
                $exists = $wpdb->get_var($wpdb->prepare(
                    "SELECT id FROM {$tripClassificationsTable}
                     WHERE trip_id = %d AND classification_id = %d AND classification_type = %s",
                    $newTripId,
                    $newAttributeId,
                    \Yatra\Constants\ClassificationTypes::ATTRIBUTE
                ));

                if (!$exists) {
                    // Store attribute value in metadata JSON
                    $metadata = json_encode(['value' => $attributeValue]);
                    
                    $wpdb->insert(
                        $tripClassificationsTable,
                        [
                            'trip_id' => $newTripId,
                            'classification_id' => $newAttributeId,
                            'classification_type' => \Yatra\Constants\ClassificationTypes::ATTRIBUTE,
                            'relationship_type' => 'primary',
                            'sort_order' => $order,
                            'metadata' => $metadata,
                            'is_active' => 1,
                            'created_at' => current_time('mysql'),
                            'updated_at' => current_time('mysql'),
                        ]
                    );
                    $order++;
                }
            }
        }
    }

    /**
     * Migrate trip pricing (traveler categories with pricing values)
     * 
     * Old Plugin Structure:
     * - Single Pricing: yatra_tour_meta_regular_price, yatra_tour_meta_sales_price
     * - Multiple Pricing: yatra_multiple_pricing (serialized array)
     *   - Fields: pricing_label, regular_price, sales_price, pricing_per, group_size, minimum_pax, maximum_pax
     * 
     * New Plugin Structure:
     * - pricing_type: 'regular' or 'traveler_based'
     * - price_types: JSON array with category_id, original_price, discounted_price, pricing_mode
     */
    private function migrateTripPricing(int $oldTripId, int $newTripId, array $meta): void
    {
        global $wpdb;
        
        $classificationsTable = \Yatra\Database\Tables\ClassificationsTable::getTableName();
        $tripsTable = \Yatra\Database\Tables\TripsTable::getTableName();
        
        // Get multiple pricing data from old plugin (stored in yatra_multiple_pricing meta key)
        $multiplePricing = $meta['yatra_multiple_pricing'] ?? null;
        
        if (is_string($multiplePricing)) {
            $multiplePricing = maybe_unserialize($multiplePricing);
        }

        // Check if we have valid multiple pricing data
        if (empty($multiplePricing) || !is_array($multiplePricing)) {
            // No multiple pricing, trip will use regular pricing (already migrated in main trip data)
            return;
        }

        // Build price_types array for traveler-based pricing
        $priceTypes = [];
        
        foreach ($multiplePricing as $pricingId => $pricing) {
            if (!is_array($pricing)) {
                continue;
            }

            // Old plugin uses 'pricing_label' field for category name
            $label = trim($pricing['pricing_label'] ?? '');
            if (empty($label)) {
                continue;
            }

            // Find the traveler category by label (case-insensitive)
            $categoryId = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$classificationsTable} WHERE LOWER(name) = LOWER(%s) AND type = %s",
                $label,
                \Yatra\Constants\ClassificationTypes::TRAVELER_TYPE
            ));

            if (!$categoryId) {
                // Category doesn't exist in new system, skip this pricing entry
                continue;
            }

            // Extract pricing values - old plugin uses 'regular_price' and 'sales_price'
            $regularPrice = floatval($pricing['regular_price'] ?? 0);
            $salePrice = floatval($pricing['sales_price'] ?? 0);
            
            // Get pricing mode from old plugin (person/group)
            $pricingPer = $pricing['pricing_per'] ?? 'person';
            // Map old pricing_per to new pricing_mode
            $pricingMode = ($pricingPer === 'group') ? 'per_group' : 'per_person';
            
            // Get group size if pricing is per group
            $groupSize = intval($pricing['group_size'] ?? 1);
            
            // Get min/max travelers (pax)
            $minPax = intval($pricing['minimum_pax'] ?? 1);
            $maxPax = intval($pricing['maximum_pax'] ?? 1);
            
            // Ensure min is at least 1
            if ($minPax < 1) {
                $minPax = 1;
            }
            
            // Ensure max is at least equal to min
            if ($maxPax < $minPax) {
                $maxPax = $minPax;
            }

            // Only add if regular price is valid
            if ($regularPrice > 0) {
                $priceType = [
                    'category_id' => (int) $categoryId,
                    'label' => $label,
                    'original_price' => $regularPrice,
                    'discounted_price' => ($salePrice > 0 && $salePrice < $regularPrice) ? $salePrice : null,
                    'pricing_mode' => $pricingMode,
                    'min_travelers' => $minPax,
                    'max_travelers' => $maxPax,
                ];
                
                // Add group_size if pricing is per group
                if ($pricingMode === 'per_group' && $groupSize > 0) {
                    $priceType['group_size'] = $groupSize;
                }
                
                $priceTypes[] = $priceType;
            }
        }

        // If we have valid price types, update the trip
        if (!empty($priceTypes)) {
            // Encode price_types as JSON
            $priceTypesJson = json_encode($priceTypes);
            
            // Update trip with price_types JSON AND set pricing_type to 'traveler_based'
            $wpdb->update(
                $tripsTable,
                [
                    'price_types' => $priceTypesJson,
                    'pricing_type' => 'traveler_based'
                ],
                ['id' => $newTripId],
                ['%s', '%s'],
                ['%d']
            );
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
