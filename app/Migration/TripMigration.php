<?php

namespace Yatra\Migration;

use Yatra\Utils\Logger;
use Yatra\Migration\MigrationProgress;

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

        $oldTrips = $this->wpdb->get_results(
            "SELECT * FROM {$this->wpdb->posts} 
             WHERE post_type = 'tour' AND post_status != 'trash'"
        );

        $total = count($oldTrips);

        foreach ($oldTrips as $oldTrip) {
            try {
                if (!$this->isForceMigration() && $this->isTripMigrated($oldTrip->ID)) {
                    $skipped++;
                    $this->updateProgress('trips', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                $meta = $this->getPostMeta($oldTrip->ID);

                $status = ($oldTrip->post_status === 'publish') ? 'published' : 'draft';

                $baseSlug = $oldTrip->post_name ?: sanitize_title($oldTrip->post_title);
                $slug = $baseSlug;
                $existingTripId = null;

                if ($this->isForceMigration() && !empty($baseSlug)) {
                    $existingTripId = $this->wpdb->get_var($this->wpdb->prepare(
                        "SELECT id FROM {$this->wpdb->prefix}yatra_trips WHERE slug = %s",
                        $baseSlug
                    ));
                }

                if (!$existingTripId) {
                    $slug = $this->generateUniqueSlug($slug, 'yatra_trips');
                }

                $featuredImageId = get_post_thumbnail_id($oldTrip->ID);
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

                error_log("[Yatra Migration] Attempting to insert trip ID {$oldTrip->ID}: " . json_encode([
                    'title' => $tripData['title'],
                    'slug' => $tripData['slug'],
                    'status' => $tripData['status']
                ]));

                if ($existingTripId) {
                    $this->wpdb->update(
                        $this->wpdb->prefix . 'yatra_trips',
                        $tripData,
                        ['id' => $existingTripId]
                    );
                    $newTripId = $existingTripId;
                    $this->deleteTripRelationships($newTripId);
                    $migrated++;
                } else {
                    $inserted = $this->wpdb->insert(
                        $this->wpdb->prefix . 'yatra_trips',
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

                update_post_meta($oldTrip->ID, '_migrated_to_trip_id', $newTripId);

                $this->migrateTripDestinations($oldTrip->ID, $newTripId);
                $this->migrateTripActivities($oldTrip->ID, $newTripId);
                $this->migrateTripGallery($oldTrip->ID, $newTripId, $meta);
                $this->migrateTripHighlights($oldTrip->ID, $newTripId, $meta);
                $this->migrateTripFAQs($oldTrip->ID, $newTripId, $meta);

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

                error_log("[Yatra Migration] FAILED: Exception migrating trip ID {$oldTrip->ID} ({$oldTrip->post_title}): " . $e->getMessage());

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
        $table = $wpdb->prefix . 'yatra_trip_gallery_images';
        
        // Clear existing gallery for this trip
        $wpdb->delete($table, ['trip_id' => $newTripId], ['%d']);
        
        $galleryImages = [];
        
        // Try different possible gallery meta keys
        $galleryKeys = [
            'yatra_tour_gallery',
            'yatra_tour_meta_gallery',
            'yatra_gallery',
            'tour_gallery',
            'yatra_tour_images',
            'yatra_tour_meta_images',
            'yatra_images',
            'tour_images',
            'yatra_tour_photos',
            'yatra_tour_meta_photos',
            'yatra_photos',
            'tour_photos'
        ];
        
        foreach ($galleryKeys as $key) {
            if (!empty($meta[$key])) {
                $galleryData = $meta[$key];
                if (is_string($galleryData)) {
                    $galleryData = maybe_unserialize($galleryData);
                }
                
                if (is_array($galleryData) && !empty($galleryData)) {
                    $galleryImages = $galleryData;
                    break;
                }
            }
        }
        
        // If no gallery meta found, try to get attached images to the tour post
        if (empty($galleryImages)) {
            $attachedImages = get_attached_media('image', $oldTourId);
            if (!empty($attachedImages)) {
                foreach ($attachedImages as $attachment) {
                    $galleryImages[] = [
                        'id' => $attachment->ID,
                        'url' => wp_get_attachment_url($attachment->ID),
                        'thumbnail_url' => wp_get_attachment_thumb_url($attachment->ID),
                        'alt_text' => get_post_meta($attachment->ID, '_wp_attachment_image_alt', true),
                        'caption' => $attachment->post_excerpt
                    ];
                }
            }
        }
        
        // Migrate gallery images to new format
        if (!empty($galleryImages)) {
            $order = 0;
            foreach ($galleryImages as $index => $image) {
                $imageUrl = '';
                $thumbnailUrl = '';
                $altText = '';
                $caption = '';
                $imageId = null;
                
                // Handle different image data formats
                if (is_numeric($image)) {
                    // Simple attachment ID
                    $imageId = (int) $image;
                    $imageUrl = wp_get_attachment_url($imageId);
                    $thumbnailUrl = wp_get_attachment_thumb_url($imageId);
                    $altText = get_post_meta($imageId, '_wp_attachment_image_alt', true);
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
                    $wpdb->insert(
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
                    $order++;
                }
            }
            
            error_log("[Yatra Migration] Migrated " . $order . " gallery images for tour ID {$oldTourId} to trip ID {$newTripId}");
        }
    }

    /**
     * Migrate trip highlights from old tour system
     */
    private function migrateTripHighlights(int $oldTourId, int $newTripId, array $meta): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_highlights';
        
        // Clear existing highlights for this trip
        $wpdb->delete($table, ['trip_id' => $newTripId], ['%d']);
        
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
                            'title' => $title,
                            'description' => $description,
                            'icon' => $icon,
                            'order' => $order,
                            'status' => 'active',
                            'created_at' => current_time('mysql')
                        ],
                        ['%d', '%s', '%s', '%s', '%d', '%s', '%s']
                    );
                    $order++;
                }
            }
            
            error_log("[Yatra Migration] Migrated " . $order . " highlights for tour ID {$oldTourId} to trip ID {$newTripId}");
        }
    }

    /**
     * Migrate trip FAQs from old tour system
     */
    private function migrateTripFAQs(int $oldTourId, int $newTripId, array $meta): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_faqs';
        
        // Clear existing FAQs for this trip
        $wpdb->delete($table, ['trip_id' => $newTripId], ['%d']);
        
        $faqs = [];
        
        // Try different possible FAQ meta keys
        $faqKeys = [
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
            if (!empty($meta[$key])) {
                $faqData = $meta[$key];
                if (is_string($faqData)) {
                    $faqData = maybe_unserialize($faqData);
                }
                
                if (is_array($faqData) && !empty($faqData)) {
                    $faqs = $faqData;
                    break;
                }
            }
        }
        
        // Migrate FAQs
        if (!empty($faqs)) {
            $order = 0;
            foreach ($faqs as $faq) {
                $question = '';
                $answer = '';
                
                if (is_array($faq)) {
                    $question = $faq['question'] ?? $faq['q'] ?? $faq['title'] ?? '';
                    $answer = $faq['answer'] ?? $faq['a'] ?? $faq['content'] ?? $faq['description'] ?? '';
                }
                
                if (!empty($question) && !empty($answer)) {
                    $wpdb->insert(
                        $table,
                        [
                            'trip_id' => $newTripId,
                            'question' => $question,
                            'answer' => $answer,
                            'order' => $order,
                            'status' => 'active',
                            'created_at' => current_time('mysql')
                        ],
                        ['%d', '%s', '%s', '%d', '%s', '%s']
                    );
                    $order++;
                }
            }
            
            error_log("[Yatra Migration] Migrated " . $order . " FAQs for tour ID {$oldTourId} to trip ID {$newTripId}");
        }
    }
}
