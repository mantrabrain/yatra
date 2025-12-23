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
            // Check if services data exists in database (regardless of plugin/module status)
            $services_count = $wpdb->get_var(
                "SELECT COUNT(*) FROM {$wpdb->term_taxonomy} WHERE taxonomy = 'services'"
            );
            
            if ($services_count == 0) {
                error_log("[Yatra Migration] No services found in database");
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

            // Note: We don't register taxonomy or activate modules
            // The premium Additional Services module will handle that when activated
            // We just migrate the data so it's ready when the module is enabled

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

                    // Check if service already exists in new system (check database directly)
                    $existing_term_id = null;
                    if (!$this->isForceMigration()) {
                        $existing_term_id = $wpdb->get_var($wpdb->prepare(
                            "SELECT t.term_id FROM {$wpdb->terms} t
                             INNER JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
                             WHERE t.slug = %s AND tt.taxonomy = 'yatra_additional_services'",
                            $service->slug
                        ));
                        
                        if ($existing_term_id) {
                            error_log("[Yatra Migration] Service '{$service->name}' already exists, skipping");
                            $skipped++;
                            continue;
                        }
                    }

                    // Insert service term directly into database
                    $wpdb->insert(
                        $wpdb->terms,
                        [
                            'name' => $service->name,
                            'slug' => $service->slug,
                            'term_group' => 0,
                        ],
                        ['%s', '%s', '%d']
                    );
                    
                    $new_term_id = $wpdb->insert_id;
                    
                    if (!$new_term_id) {
                        $failed++;
                        error_log("[Yatra Migration] Failed to insert service term '{$service->name}': " . $wpdb->last_error);
                        continue;
                    }
                    
                    // Insert term taxonomy
                    $wpdb->insert(
                        $wpdb->term_taxonomy,
                        [
                            'term_id' => $new_term_id,
                            'taxonomy' => 'yatra_additional_services',
                            'description' => $service->description,
                            'parent' => 0,
                            'count' => 0,
                        ],
                        ['%d', '%s', '%s', '%d', '%d']
                    );
                    
                    $term_taxonomy_id = $wpdb->insert_id;
                    
                    if (!$term_taxonomy_id) {
                        $failed++;
                        error_log("[Yatra Migration] Failed to insert service taxonomy '{$service->name}': " . $wpdb->last_error);
                        continue;
                    }

                    // Add term meta directly to database
                    $meta_inserts = [
                        ['term_id' => $new_term_id, 'meta_key' => 'price_type', 'meta_value' => $price_type],
                        ['term_id' => $new_term_id, 'meta_key' => 'price_per', 'meta_value' => $price_per],
                        ['term_id' => $new_term_id, 'meta_key' => 'service_price', 'meta_value' => $service_price],
                        ['term_id' => $new_term_id, 'meta_key' => 'is_required', 'meta_value' => $is_required ? '1' : '0'],
                        ['term_id' => $new_term_id, 'meta_key' => 'status', 'meta_value' => 'active'],
                        ['term_id' => $new_term_id, 'meta_key' => 'old_service_id', 'meta_value' => $service->term_id],
                    ];
                    
                    foreach ($meta_inserts as $meta) {
                        $wpdb->insert($wpdb->termmeta, $meta, ['%d', '%s', '%s']);
                    }

                    // Migrate service associations with tours/trips
                    $this->migrateServiceAssociations($service->term_id, $new_term_id);

                    $migrated++;
                    error_log("[Yatra Migration] Successfully migrated service '{$service->name}' (new ID: {$new_term_id})");

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
     * Migrate service associations from old tours to new trips
     */
    private function migrateServiceAssociations(int $oldServiceId, int $newServiceId): void
    {
        global $wpdb;

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
            return;
        }

        error_log("[Yatra Migration] Found " . count($tours) . " tours associated with service ID {$oldServiceId}");

        foreach ($tours as $tour) {
            // Get the migrated trip ID
            $newTripId = get_post_meta($tour->object_id, '_migrated_to_trip_id', true);
            
            if (!$newTripId) {
                error_log("[Yatra Migration] Tour {$tour->object_id} not migrated yet, skipping service association");
                continue;
            }

            // Associate service with new trip
            wp_set_object_terms($newTripId, $newServiceId, 'yatra_additional_services', true);
            error_log("[Yatra Migration] Associated service {$newServiceId} with trip {$newTripId}");
        }
    }
}
