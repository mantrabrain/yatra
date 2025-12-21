<?php
/**
 * Simplified Migration Service - Direct execution without Action Scheduler
 * 
 * @package Yatra\Migration
 * @since 3.0.0
 */

namespace Yatra\Migration;

use Yatra\Utils\Logger;

class SimpleMigrationService
{
    private $wpdb;
    private $detector;
    
    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->detector = new MigrationDetector();
    }
    
    /**
     * Migrate all data types in one request with progress updates
     */
    public function migrateAllSync(): array
    {
        set_time_limit(300); // 5 minutes
        
        $dataTypes = ['trips', 'destinations', 'activities', 'customers', 'bookings', 'coupons', 'reviews', 'enquiries', 'tour_dates'];
        
        $results = [];
        $totalItems = 0;
        $processedItems = 0;
        
        // Calculate total items
        $oldData = $this->detector->detectOldData();
        foreach ($dataTypes as $type) {
            $totalItems += $oldData[$type]['count'] ?? 0;
        }
        
        Logger::info("Starting migration of {$totalItems} total items", ['source' => 'migration']);
        
        // Process each data type
        foreach ($dataTypes as $dataType) {
            $count = $oldData[$dataType]['count'] ?? 0;
            
            if ($count === 0) {
                $results[$dataType] = [
                    'migrated' => 0,
                    'skipped' => 0,
                    'failed' => 0,
                    'total' => 0
                ];
                continue;
            }
            
            Logger::info("Migrating {$dataType}: {$count} items", ['source' => 'migration', 'data_type' => $dataType]);
            
            try {
                $result = $this->migrateDataType($dataType);
                $results[$dataType] = $result;
                $processedItems += ($result['migrated'] + $result['skipped'] + $result['failed']);
                
                Logger::info("Completed {$dataType}: " . json_encode($result), [
                    'source' => 'migration',
                    'data_type' => $dataType
                ]);
                
            } catch (\Exception $e) {
                Logger::error("Failed to migrate {$dataType}: " . $e->getMessage(), [
                    'source' => 'migration',
                    'data_type' => $dataType,
                    'error' => $e->getMessage()
                ]);
                
                $results[$dataType] = [
                    'migrated' => 0,
                    'skipped' => 0,
                    'failed' => $count,
                    'total' => $count,
                    'error' => $e->getMessage()
                ];
            }
        }
        
        $totalMigrated = array_sum(array_column($results, 'migrated'));
        $totalFailed = array_sum(array_column($results, 'failed'));
        
        Logger::info("Migration completed: {$totalMigrated} migrated, {$totalFailed} failed", [
            'source' => 'migration',
            'results' => $results
        ]);
        
        return [
            'success' => true,
            'total_items' => $totalItems,
            'processed_items' => $processedItems,
            'total_migrated' => $totalMigrated,
            'total_failed' => $totalFailed,
            'results' => $results
        ];
    }
    
    /**
     * Migrate specific data type
     */
    private function migrateDataType(string $dataType): array
    {
        switch ($dataType) {
            case 'trips':
                return $this->migrateTrips();
            case 'destinations':
                return $this->migrateDestinations();
            case 'activities':
                return $this->migrateActivities();
            case 'customers':
                return $this->migrateCustomers();
            case 'bookings':
                return $this->migrateBookings();
            case 'coupons':
                return $this->migrateCoupons();
            case 'reviews':
                return $this->migrateReviews();
            case 'enquiries':
                return $this->migrateEnquiries();
            case 'tour_dates':
                return $this->migrateTourDates();
            default:
                throw new \Exception("Unknown data type: {$dataType}");
        }
    }
    
    /**
     * Migrate trips - simplified version
     */
    private function migrateTrips(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;
        
        // Get old trips
        $oldTrips = $this->wpdb->get_results(
            "SELECT * FROM {$this->wpdb->posts} 
             WHERE post_type = 'tour' 
             AND post_status IN ('publish', 'draft')
             LIMIT 100"
        );
        
        foreach ($oldTrips as $oldTrip) {
            try {
                // Check if already migrated
                if (get_post_meta($oldTrip->ID, '_migrated_to_trip_id', true)) {
                    $skipped++;
                    continue;
                }
                
                // Map status: only 'publish' becomes 'active', everything else becomes 'inactive' (draft)
                $status = ($oldTrip->post_status === 'publish') ? 'active' : 'inactive';
                
                // Simple insert - just essential fields
                $inserted = $this->wpdb->insert(
                    $this->wpdb->prefix . 'yatra_trips',
                    [
                        'name' => $oldTrip->post_title,
                        'slug' => $oldTrip->post_name,
                        'description' => $oldTrip->post_content,
                        'status' => $status,
                        'created_at' => $oldTrip->post_date,
                        'updated_at' => $oldTrip->post_modified,
                    ]
                );
                
                if ($inserted) {
                    update_post_meta($oldTrip->ID, '_migrated_to_trip_id', $this->wpdb->insert_id);
                    $migrated++;
                } else {
                    $failed++;
                    Logger::error("Failed to insert trip: {$this->wpdb->last_error}", [
                        'source' => 'migration',
                        'trip_id' => $oldTrip->ID
                    ]);
                }
                
            } catch (\Exception $e) {
                $failed++;
                Logger::error("Exception migrating trip: " . $e->getMessage(), [
                    'source' => 'migration',
                    'trip_id' => $oldTrip->ID
                ]);
            }
        }
        
        return compact('migrated', 'skipped', 'failed', 'total');
    }
    
    // Placeholder methods for other data types
    private function migrateDestinations(): array { return ['migrated' => 0, 'skipped' => 0, 'failed' => 0]; }
    private function migrateActivities(): array { return ['migrated' => 0, 'skipped' => 0, 'failed' => 0]; }
    private function migrateCustomers(): array { return ['migrated' => 0, 'skipped' => 0, 'failed' => 0]; }
    private function migrateBookings(): array { return ['migrated' => 0, 'skipped' => 0, 'failed' => 0]; }
    private function migrateCoupons(): array { return ['migrated' => 0, 'skipped' => 0, 'failed' => 0]; }
    private function migrateReviews(): array { return ['migrated' => 0, 'skipped' => 0, 'failed' => 0]; }
    private function migrateEnquiries(): array { return ['migrated' => 0, 'skipped' => 0, 'failed' => 0]; }
    private function migrateTourDates(): array { return ['migrated' => 0, 'skipped' => 0, 'failed' => 0]; }
}
