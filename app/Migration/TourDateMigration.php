<?php

namespace Yatra\Migration;

use Yatra\Migration\MigrationProgress;
use Yatra\Utils\Logger;

class TourDateMigration extends BaseMigration
{
    public function __construct(MigrationProgress $service)
    {
        parent::__construct($service);
    }

    public function run(): array
    {
        global $wpdb;

        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        $oldTable = $wpdb->prefix . 'yatra_tour_dates';

        if ($wpdb->get_var("SHOW TABLES LIKE '{$oldTable}'") !== $oldTable) {
            Logger::info("No old yatra_tour_dates table found", ['source' => 'migration']);
            return [
                'migrated' => 0,
                'skipped' => 0,
                'failed' => 0,
            ];
        }

        $oldTourDates = $wpdb->get_results("SELECT * FROM {$oldTable}");
        $total = count($oldTourDates);
        
        Logger::info("Found {$total} tour dates to migrate", [
            'source' => 'migration',
            'count' => $total
        ]);

        error_log("[Yatra Migration] ========================================");
        error_log("[Yatra Migration] Starting Tour Dates Migration");
        error_log("[Yatra Migration] Found {$total} tour dates in old system");
        error_log("[Yatra Migration] Force migration: " . ($this->isForceMigration() ? 'YES' : 'NO'));
        error_log("[Yatra Migration] ========================================");

        foreach ($oldTourDates as $oldDate) {
            try {
                error_log("[Yatra Migration] Processing tour date ID {$oldDate->id} for tour {$oldDate->tour_id}");
                
                // Check if already migrated (only for regular migration)
                $existsInAvailability = null;
                
                if (!$this->isForceMigration()) {
                    $existsInAvailability = $wpdb->get_var($wpdb->prepare(
                        "SELECT id FROM {$wpdb->prefix}yatra_trip_availability_dates 
                         WHERE trip_id IN (
                             SELECT meta_value FROM {$wpdb->prefix}postmeta 
                             WHERE post_id = %d AND meta_key = '_migrated_to_trip_id'
                         )
                         AND departure_date = %s",
                        $oldDate->tour_id,
                        $oldDate->start_date
                    ));

                    if ($existsInAvailability) {
                        error_log("[Yatra Migration] Tour date {$oldDate->id} already migrated, skipping...");
                        $skipped++;
                        $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
                        continue;
                    }
                } else {
                    error_log("[Yatra Migration] Force mode: Will insert new tour date records");
                }

                $newTripId = $this->getMigratedTripId($oldDate->tour_id);

                if (!$newTripId) {
                    $failed++;
                    Logger::debug("Skipping tour date - trip not migrated yet", [
                        'source' => 'migration',
                        'old_tour_id' => $oldDate->tour_id,
                        'tour_date_id' => $oldDate->id
                    ]);
                    $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                // Parse pricing if available
                $pricing = !empty($oldDate->pricing) ? maybe_unserialize($oldDate->pricing) : null;
                $originalPrice = null;
                $discountedPrice = null;
                
                if (is_array($pricing)) {
                    $originalPrice = $pricing['regular_price'] ?? $pricing['price'] ?? null;
                    $discountedPrice = $pricing['sale_price'] ?? $pricing['discounted_price'] ?? null;
                }
                
                error_log("[Yatra Migration] Pricing data: original={$originalPrice}, discounted={$discountedPrice}");

                // Migrate to yatra_trip_availability_dates
                if (!$existsInAvailability || $this->isForceMigration()) {
                    $maxTravelers = intval($oldDate->max_travellers ?? 0);
                    if ($maxTravelers <= 0) {
                        $maxTravelers = 10; // Default
                    }
                    
                    // Determine status based on active flag
                    $availabilityStatus = 'available';
                    if (!$oldDate->active) {
                        $availabilityStatus = 'cancelled';
                    }

                    $availabilityData = [
                        'trip_id' => $newTripId,
                        'departure_date' => $oldDate->start_date,
                        'return_date' => $oldDate->end_date,
                        'seats_total' => $maxTravelers,
                        'seats_available' => $maxTravelers,
                        'seats_reserved' => 0,
                        'seats_waitlist' => 0,
                        'pricing_type' => 'regular',
                        'original_price' => $originalPrice,
                        'discounted_price' => $discountedPrice,
                        'status' => $availabilityStatus,
                        'special_notes' => $oldDate->note_to_customer ?? null,
                        'created_at' => $oldDate->created_at ?? current_time('mysql'),
                        'updated_at' => $oldDate->updated_at ?? current_time('mysql'),
                    ];

                    $wpdb->insert(
                        $wpdb->prefix . 'yatra_trip_availability_dates',
                        $availabilityData
                    );
                    
                    $insertedId = $wpdb->insert_id;
                    
                    if (!$insertedId) {
                        $failed++;
                        error_log("[Yatra Migration] Failed to insert availability for tour date {$oldDate->id}: " . $wpdb->last_error);
                        Logger::error("Failed to insert availability date", [
                            'source' => 'migration',
                            'tour_date_id' => $oldDate->id,
                            'error' => $wpdb->last_error
                        ]);
                        $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
                        continue;
                    }
                    error_log("[Yatra Migration] Inserted availability ID {$insertedId} for tour date {$oldDate->id} (departure: {$oldDate->start_date}, return: {$oldDate->end_date})");
                }

                $migrated++;
                error_log("[Yatra Migration] Successfully migrated tour date {$oldDate->id} to trip {$newTripId}");
                Logger::info("Migrated tour date to availability", [
                    'source' => 'migration',
                    'old_tour_date_id' => $oldDate->id,
                    'new_trip_id' => $newTripId,
                    'departure_date' => $oldDate->start_date,
                    'return_date' => $oldDate->end_date
                ]);
                
                $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
            } catch (\Exception $e) {
                $failed++;
                error_log("[Yatra Migration] Exception migrating tour date {$oldDate->id}: " . $e->getMessage());
                Logger::error("Tour date migration exception", [
                    'source' => 'migration',
                    'tour_date_id' => $oldDate->id,
                    'error' => $e->getMessage()
                ]);
                $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        }

        error_log("[Yatra Migration] ========================================");
        error_log("[Yatra Migration] Tour Dates Migration Complete");
        error_log("[Yatra Migration] Migrated: {$migrated}, Skipped: {$skipped}, Failed: {$failed}");
        error_log("[Yatra Migration] ========================================");

        return [
            'migrated' => $migrated,
            'skipped' => $skipped,
            'failed' => $failed,
        ];
    }
}
