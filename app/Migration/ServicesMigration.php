<?php

namespace Yatra\Migration;

use Yatra\Migration\MigrationProgress;
use Yatra\Utils\Logger;

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

        error_log("[Yatra Migration] ========================================");
        error_log("[Yatra Migration] Starting Services Migration");
        error_log("[Yatra Migration] ========================================");

        try {
            // Check if Yatra Pro tables exist (created by Pro plugin)
            $services_table = $wpdb->prefix . 'yatra_additional_services';
            $trip_services_table = $wpdb->prefix . 'yatra_trip_services';
            
            $services_exists = $wpdb->get_var("SHOW TABLES LIKE '{$services_table}'");
            $trip_services_exists = $wpdb->get_var("SHOW TABLES LIKE '{$trip_services_table}'");
            
            if (!$services_exists || !$trip_services_exists) {
                error_log("[Yatra Migration] ========================================");
                error_log("[Yatra Migration] ERROR: Yatra Pro tables not found!");
                error_log("[Yatra Migration] Services migration requires Yatra Pro to be activated.");
                error_log("[Yatra Migration] Required tables:");
                error_log("[Yatra Migration]   - {$services_table}: " . ($services_exists ? 'EXISTS' : 'MISSING'));
                error_log("[Yatra Migration]   - {$trip_services_table}: " . ($trip_services_exists ? 'EXISTS' : 'MISSING'));
                error_log("[Yatra Migration] ========================================");
                return [
                    'migrated' => 0,
                    'skipped' => 0,
                    'failed' => 0,
                ];
            }
            
            error_log("[Yatra Migration] Yatra Pro tables verified");

            // Check if services data exists in database (regardless of plugin/module status)
            $services_count = $wpdb->get_var(
                "SELECT COUNT(*) FROM {$wpdb->term_taxonomy} WHERE taxonomy = 'services'"
            );
            
            error_log("[Yatra Migration] Services taxonomy count: {$services_count}");
            
            // List all taxonomies for debugging
            $all_taxonomies = $wpdb->get_results(
                "SELECT DISTINCT taxonomy, COUNT(*) as count FROM {$wpdb->term_taxonomy} GROUP BY taxonomy"
            );
            error_log("[Yatra Migration] All taxonomies in database:");
            foreach ($all_taxonomies as $tax) {
                error_log("[Yatra Migration]   - {$tax->taxonomy}: {$tax->count} terms");
            }
            
            if ($services_count == 0) {
                error_log("[Yatra Migration] ========================================");
                error_log("[Yatra Migration] NO OLD SERVICES DATA FOUND");
                error_log("[Yatra Migration] The old 'services' taxonomy has no terms.");
                error_log("[Yatra Migration] This means:");
                error_log("[Yatra Migration]   1. The yatra-services plugin was never used, OR");
                error_log("[Yatra Migration]   2. No services were ever created in the old system");
                error_log("[Yatra Migration] ========================================");
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
            error_log("[Yatra Migration] Found {$total} services to migrate");
            error_log("[Yatra Migration] ========================================");
            error_log("[Yatra Migration] OLD SERVICES DATA DUMP:");
            
            if ($total > 0) {
                foreach ($services as $service) {
                    error_log("[Yatra Migration] Service #{$service->term_id}:");
                    error_log("[Yatra Migration]   Name: {$service->name}");
                    error_log("[Yatra Migration]   Slug: {$service->slug}");
                    error_log("[Yatra Migration]   Description: {$service->description}");
                    
                    // Get all meta for this service
                    $service_meta = $wpdb->get_results($wpdb->prepare(
                        "SELECT meta_key, meta_value FROM {$wpdb->termmeta} WHERE term_id = %d",
                        $service->term_id
                    ));
                    
                    if ($service_meta) {
                        error_log("[Yatra Migration]   Meta data:");
                        foreach ($service_meta as $meta) {
                            error_log("[Yatra Migration]     - {$meta->meta_key}: {$meta->meta_value}");
                        }
                    }
                    
                    // Get tours associated with this service
                    $tours = $wpdb->get_results($wpdb->prepare(
                        "SELECT tr.object_id, p.post_title 
                         FROM {$wpdb->term_relationships} tr
                         LEFT JOIN {$wpdb->posts} p ON tr.object_id = p.ID
                         WHERE tr.term_taxonomy_id IN (
                             SELECT term_taxonomy_id FROM {$wpdb->term_taxonomy} 
                             WHERE term_id = %d AND taxonomy = 'services'
                         )",
                        $service->term_id
                    ));
                    
                    if ($tours) {
                        error_log("[Yatra Migration]   Associated with " . count($tours) . " tours:");
                        foreach ($tours as $tour) {
                            error_log("[Yatra Migration]     - Tour #{$tour->object_id}: {$tour->post_title}");
                        }
                    } else {
                        error_log("[Yatra Migration]   No tours associated");
                    }
                    error_log("[Yatra Migration]   ---");
                }
            }
            error_log("[Yatra Migration] ========================================");

            foreach ($services as $service) {
                try {
                    error_log("[Yatra Migration] Processing service: {$service->name} (ID: {$service->term_id})");

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

                    error_log("[Yatra Migration] Service meta - price_type: {$price_type}, price_per: {$price_per}, price: {$service_price}, required: " . ($is_required ? 'yes' : 'no'));

                    // Migrate service associations with tours/trips to custom table
                    $services_migrated = $this->migrateServiceToTrips($service->term_id, $service->name, $service->slug, $service->description, $price_type, $price_per, $service_price, $is_required);

                    $migrated += $services_migrated;
                    error_log("[Yatra Migration] Successfully migrated service '{$service->name}' to {$services_migrated} trips");

                } catch (\Exception $e) {
                    $failed++;
                    error_log("[Yatra Migration] Exception migrating service '{$service->name}': " . $e->getMessage());
                    Logger::error("Service migration exception", [
                        'source' => 'migration',
                        'service_id' => $service->term_id,
                        'error' => $e->getMessage()
                    ]);
                }

                $this->updateProgress('services', 'running', $migrated, $skipped, $failed, $total, null, null);
            }

        } catch (\Exception $e) {
            error_log("[Yatra Migration] Services migration exception: " . $e->getMessage());
            Logger::error("Services migration failed", [
                'source' => 'migration',
                'error' => $e->getMessage()
            ]);
        }

        error_log("[Yatra Migration] ========================================");
        error_log("[Yatra Migration] Services Migration Complete");
        error_log("[Yatra Migration] Migrated: {$migrated}, Skipped: {$skipped}, Failed: {$failed}");
        error_log("[Yatra Migration] ========================================");

        return [
            'migrated' => $migrated,
            'skipped' => $skipped,
            'failed' => $failed,
        ];
    }

    /**
     * Migrate service from old taxonomy to Yatra Pro additional services tables
     */
    private function migrateServiceToTrips(int $oldServiceId, string $serviceName, string $serviceSlug, string $description, string $priceType, string $pricePer, float $servicePrice, bool $isRequired): int
    {
        global $wpdb;
        $services_table = $wpdb->prefix . 'yatra_additional_services';
        $trip_services_table = $wpdb->prefix . 'yatra_trip_services';
        $migrated_count = 0;

        // First, check if service already exists in master table
        $service_id = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$services_table} WHERE name = %s",
            $serviceName
        ));

        // If service doesn't exist, create it in master table
        if (!$service_id) {
            $inserted = $wpdb->insert(
                $services_table,
                [
                    'name' => $serviceName,
                    'description' => $description,
                    'price' => $servicePrice,
                    'price_type' => $priceType,
                    'price_per' => $pricePer,
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
                error_log("[Yatra Migration] Created service '{$serviceName}' in master table (ID: {$service_id})");
            } else {
                error_log("[Yatra Migration] Failed to create service '{$serviceName}': " . $wpdb->last_error);
                return 0;
            }
        } else {
            error_log("[Yatra Migration] Service '{$serviceName}' already exists (ID: {$service_id})");
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
            error_log("[Yatra Migration] No tours associated with service ID {$oldServiceId}");
            return 0;
        }

        error_log("[Yatra Migration] Found " . count($tours) . " tours associated with service ID {$oldServiceId}");

        foreach ($tours as $tour) {
            // Get the migrated trip ID
            $newTripId = get_post_meta($tour->object_id, '_migrated_to_trip_id', true);
            
            if (!$newTripId) {
                error_log("[Yatra Migration] Tour {$tour->object_id} not migrated yet, skipping service association");
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
                    error_log("[Yatra Migration] Service relationship already exists for trip {$newTripId}, skipping");
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
                error_log("[Yatra Migration] Linked service '{$serviceName}' to trip {$newTripId}");
            } else {
                error_log("[Yatra Migration] Failed to link service to trip {$newTripId}: " . $wpdb->last_error);
            }
        }

        return $migrated_count;
    }
}
