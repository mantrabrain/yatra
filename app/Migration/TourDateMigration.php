<?php

namespace Yatra\Migration;

use Yatra\Migration\MigrationProgress;

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
            return [
                'migrated' => 0,
                'skipped' => 0,
                'failed' => 0,
            ];
        }

        $oldTourDates = $wpdb->get_results("SELECT * FROM {$oldTable}");
        $total = count($oldTourDates);

        foreach ($oldTourDates as $oldDate) {
            try {
                $exists = $wpdb->get_var($wpdb->prepare(
                    "SELECT id FROM {$wpdb->prefix}yatra_departures 
                     WHERE old_tour_date_id = %d",
                    $oldDate->id
                ));

                if ($exists) {
                    $skipped++;
                    $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                $newTripId = $this->getMigratedTripId($oldDate->tour_id);

                if (!$newTripId) {
                    $failed++;
                    $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                $departureData = [
                    'trip_id' => $newTripId,
                    'start_date' => $oldDate->start_date,
                    'end_date' => $oldDate->end_date,
                    'max_travelers' => $oldDate->max_travellers ?? 0,
                    'available_seats' => $oldDate->max_travellers ?? 0,
                    'price_override' => !empty($oldDate->pricing) ? maybe_unserialize($oldDate->pricing) : null,
                    'status' => $oldDate->active ? 'confirmed' : 'cancelled',
                    'notes' => $oldDate->note_to_customer ?? '',
                    'admin_notes' => $oldDate->note_to_admin ?? '',
                    'old_tour_date_id' => $oldDate->id,
                    'created_at' => $oldDate->created_at,
                    'updated_at' => $oldDate->updated_at,
                ];

                $wpdb->insert(
                    $wpdb->prefix . 'yatra_departures',
                    $departureData
                );

                if ($wpdb->insert_id) {
                    $migrated++;
                } else {
                    $failed++;
                }

                $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
            } catch (\Exception $e) {
                $failed++;
                $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
                error_log("Tour date migration failed for ID {$oldDate->id}: " . $e->getMessage());
            }
        }

        return [
            'migrated' => $migrated,
            'skipped' => $skipped,
            'failed' => $failed,
        ];
    }
}
