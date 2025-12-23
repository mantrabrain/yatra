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

        foreach ($oldTourDates as $oldDate) {
            try {
                // Check if already migrated
                $existsInDepartures = $wpdb->get_var($wpdb->prepare(
                    "SELECT id FROM {$wpdb->prefix}yatra_departures 
                     WHERE old_tour_date_id = %d",
                    $oldDate->id
                ));
                
                $existsInAvailability = $wpdb->get_var($wpdb->prepare(
                    "SELECT id FROM {$wpdb->prefix}yatra_trip_availability_dates 
                     WHERE trip_id = (SELECT trip_id FROM {$wpdb->prefix}yatra_departures WHERE old_tour_date_id = %d LIMIT 1)
                     AND departure_date = %s",
                    $oldDate->id,
                    $oldDate->start_date
                ));

                if (!$this->isForceMigration() && $existsInDepartures && $existsInAvailability) {
                    $skipped++;
                    $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
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

                // 1. Migrate to yatra_departures (for tracking actual departures)
                if (!$existsInDepartures) {
                    $departureData = [
                        'trip_id' => $newTripId,
                        'start_date' => $oldDate->start_date,
                        'end_date' => $oldDate->end_date,
                        'max_travelers' => $oldDate->max_travellers ?? 0,
                        'available_seats' => $oldDate->max_travellers ?? 0,
                        'price_override' => !empty($pricing) ? json_encode($pricing) : null,
                        'status' => $oldDate->active ? 'confirmed' : 'cancelled',
                        'notes' => $oldDate->note_to_customer ?? '',
                        'admin_notes' => $oldDate->note_to_admin ?? '',
                        'old_tour_date_id' => $oldDate->id,
                        'created_at' => $oldDate->created_at ?? current_time('mysql'),
                        'updated_at' => $oldDate->updated_at ?? current_time('mysql'),
                    ];

                    $wpdb->insert(
                        $wpdb->prefix . 'yatra_departures',
                        $departureData
                    );
                    
                    if (!$wpdb->insert_id) {
                        $failed++;
                        Logger::error("Failed to insert departure", [
                            'source' => 'migration',
                            'tour_date_id' => $oldDate->id,
                            'error' => $wpdb->last_error
                        ]);
                        $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
                        continue;
                    }
                }

                // 2. Migrate to yatra_trip_availability_dates (for customer booking)
                if (!$existsInAvailability) {
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
                    
                    if (!$wpdb->insert_id) {
                        $failed++;
                        Logger::error("Failed to insert availability date", [
                            'source' => 'migration',
                            'tour_date_id' => $oldDate->id,
                            'error' => $wpdb->last_error
                        ]);
                        $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
                        continue;
                    }
                }

                $migrated++;
                Logger::info("Migrated tour date to both departures and availability", [
                    'source' => 'migration',
                    'old_tour_date_id' => $oldDate->id,
                    'new_trip_id' => $newTripId,
                    'departure_date' => $oldDate->start_date,
                    'return_date' => $oldDate->end_date
                ]);
                
                $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
            } catch (\Exception $e) {
                $failed++;
                Logger::error("Tour date migration exception", [
                    'source' => 'migration',
                    'tour_date_id' => $oldDate->id,
                    'error' => $e->getMessage()
                ]);
                $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        }

        return [
            'migrated' => $migrated,
            'skipped' => $skipped,
            'failed' => $failed,
        ];
    }
}
