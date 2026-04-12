<?php

namespace Yatra\Migration;

use Yatra\Migration\MigrationProgress;
use Yatra\Utils\Logger;

// NOTE: YatraPro classes are NOT imported with `use` statements to avoid
// fatal "class not found" errors when Yatra Pro is not active.
// Instead, we check at runtime with class_exists().

class ServicesMigration extends BaseMigration
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

        try {
            // Check if Yatra Pro table classes are available at runtime
            if (!class_exists('\\YatraPro\\Database\\Tables\\AdditionalServicesTable') ||
                !class_exists('\\YatraPro\\Database\\Tables\\TripAdditionalServicesTable')) {
                Logger::info('ServicesMigration: Yatra Pro table classes not available, skipping', [
                    'source' => 'migration',
                    'data_type' => 'services',
                ]);
                return compact('migrated', 'skipped', 'failed');
            }

            // Check if Yatra Pro tables exist (created by Pro plugin)
            $services_table = \YatraPro\Database\Tables\AdditionalServicesTable::getTableName();
            $trip_services_table = \YatraPro\Database\Tables\TripAdditionalServicesTable::getTableName();
            
            $services_exists = $wpdb->get_var("SHOW TABLES LIKE '{$services_table}'");
            $trip_services_exists = $wpdb->get_var("SHOW TABLES LIKE '{$trip_services_table}'");
            
            if (!$services_exists || !$trip_services_exists) {
                return [
                    'migrated' => 0,
                    'skipped' => 0,
                    'failed' => 0,
                ];
            }
            
            // Check if services data exists in database (regardless of plugin/module status)
            $services_count = $wpdb->get_var(
                "SELECT COUNT(*) FROM {$wpdb->term_taxonomy} WHERE taxonomy = 'services'"
            );
            
            if ($services_count == 0) {
                return [
                    'migrated' => 0,
                    'skipped' => 0,
                    'failed' => 0,
                ];
            }

            // Get all service terms directly from database
            $services = $wpdb->get_results(
                "SELECT t.term_id, t.name, t.slug, tt.description 
                 FROM {$wpdb->terms} t
                 INNER JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
                 WHERE tt.taxonomy = 'services'"
            );

            $total = count($services);
            foreach ($services as $service) {
                try {
                    // Get service meta directly from database
                    $price_type = $wpdb->get_var($wpdb->prepare(
                        "SELECT meta_value FROM {$wpdb->termmeta} WHERE term_id = %d AND meta_key = 'price_type'",
                        $service->term_id
                    )) ?: 'fixed';
                    
                    $price_per = $wpdb->get_var($wpdb->prepare(
                        "SELECT meta_value FROM {$wpdb->termmeta} WHERE term_id = %d AND meta_key = 'price_per'",
                        $service->term_id
                    )) ?: 'tour';
                    
                    $service_price = floatval($wpdb->get_var($wpdb->prepare(
                        "SELECT meta_value FROM {$wpdb->termmeta} WHERE term_id = %d AND meta_key = 'service_price'",
                        $service->term_id
                    )));
                    
                    $is_required = (bool) $wpdb->get_var($wpdb->prepare(
                        "SELECT meta_value FROM {$wpdb->termmeta} WHERE term_id = %d AND meta_key = 'is_required'",
                        $service->term_id
                    ));

                    // Migrate service associations with tours/trips to custom table
                    $services_migrated = $this->migrateServiceToTrips($service->term_id, $service->name, $service->description, $price_type, $price_per, $service_price, $is_required);

                    $migrated += $services_migrated;
                } catch (\Exception $e) {
                    $failed++;
                    Logger::error("Service migration exception", [
                        'source' => 'migration',
                        'service_id' => $service->term_id,
                        'error' => $e->getMessage()
                    ]);
                }

                $this->updateProgress('services', 'running', $migrated, $skipped, $failed, $total, null, null);
            }

        } catch (\Throwable $e) {
            Logger::error("Services migration failed", [
                'source' => 'migration',
                'error' => $e->getMessage()
            ]);
        }

        return [
            'migrated' => $migrated,
            'skipped' => $skipped,
            'failed' => $failed,
        ];
    }

    /**
     * Migrate service from old taxonomy to Yatra Pro additional services tables
     */
    private function migrateServiceToTrips(int $oldServiceId, string $serviceName, string $description, string $priceType, string $pricePer, float $servicePrice, bool $isRequired): int
    {
        global $wpdb;
        $services_table = \YatraPro\Database\Tables\AdditionalServicesTable::getTableName();
        $trip_services_table = \YatraPro\Database\Tables\TripAdditionalServicesTable::getTableName();
        $migrated_count = 0;

        // First, check if service already exists in master table
        $service_id = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$services_table} WHERE name = %s",
            $serviceName
        ));

        $priceTypeNorm = in_array($priceType, ['fixed', 'percentage'], true) ? $priceType : 'fixed';
        // Legacy 2.x used price_per=tour; 3.x enum is person|booking|day.
        $pricePerNorm = match ($pricePer) {
            'person' => 'person',
            'day' => 'day',
            'tour', 'booking' => 'booking',
            default => 'booking',
        };

        // If service doesn't exist, create it in master table
        if (!$service_id) {
            $inserted = $wpdb->insert(
                $services_table,
                [
                    'name' => $serviceName,
                    'description' => $description,
                    'price' => $servicePrice,
                    'price_type' => $priceTypeNorm,
                    'price_per' => $pricePerNorm,
                    'status' => 'publish',
                    'applicable_to' => 'specific_trips',
                    'is_required' => $isRequired ? 1 : 0,
                    'sort_order' => 0,
                    'created_at' => current_time('mysql'),
                ],
                ['%s', '%s', '%f', '%s', '%s', '%s', '%s', '%d', '%d', '%s']
            );

            if ($inserted) {
                $service_id = $wpdb->insert_id;
                } else {
                return 0;
            }
        } else {
            }

        // Get all tours that had this service
        $tours = $wpdb->get_results($wpdb->prepare(
            "SELECT object_id FROM {$wpdb->term_relationships} 
             WHERE term_taxonomy_id IN (
                 SELECT term_taxonomy_id FROM {$wpdb->term_taxonomy} 
                 WHERE term_id = %d AND taxonomy = 'services'
             )",
            $oldServiceId
        ));

        if (empty($tours)) {
            return 0;
        }

        foreach ($tours as $tour) {
            // Get the migrated trip ID
            $newTripId = $this->getRawPostMeta((int) $tour->object_id, '_migrated_to_trip_id');
            
            if (!$newTripId) {
                continue;
            }

            // Check if relationship already exists
            if (!$this->isForceMigration()) {
                $existing = $wpdb->get_var($wpdb->prepare(
                    "SELECT id FROM {$trip_services_table} WHERE trip_id = %d AND service_id = %d",
                    $newTripId,
                    $service_id
                ));
                
                if ($existing) {
                    continue;
                }
            }

            // Insert trip-service relationship (minimal - just IDs)
            $inserted = $wpdb->insert(
                $trip_services_table,
                [
                    'trip_id' => $newTripId,
                    'service_id' => $service_id,
                ],
                ['%d', '%d']
            );

            if ($inserted) {
                $migrated_count++;
                } else {
                }
        }

        return $migrated_count;
    }
}
