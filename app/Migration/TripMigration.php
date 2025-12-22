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
}
