<?php
/**
 * Migration Service - Handles data migration from old Yatra versions to 3.0.0
 * 
 * @package Yatra\Migration
 * @since 3.0.0
 */

namespace Yatra\Migration;

use Yatra\Core\Database;

class MigrationService
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
     * Get migration status
     */
    public function getStatus(): array
    {
        return [
            'has_old_data' => $this->detector->hasOldData(),
            'old_data' => $this->detector->detectOldData(),
            'migration_log' => $this->getMigrationLog(),
        ];
    }
    
    /**
     * Migrate specific data type using Action Scheduler for background processing
     */
    public function migrate(string $dataType): array
    {
        try {
            // Check if Action Scheduler is available
            if (!function_exists('as_schedule_single_action')) {
                throw new \Exception('WooCommerce Action Scheduler is not available');
            }
            
            // Schedule the migration to run in the background
            $actionId = as_schedule_single_action(
                time(),
                'yatra_migrate_data_type',
                [
                    'data_type' => $dataType,
                ],
                'yatra_migration'
            );
            
            return [
                'success' => true,
                'data_type' => $dataType,
                'action_id' => $actionId,
                'message' => "Migration scheduled for {$dataType}. Processing in background...",
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'data_type' => $dataType,
                'error' => $e->getMessage(),
            ];
        }
    }
    
    /**
     * Process migration for a specific data type (called by Action Scheduler)
     */
    public function processMigration(string $dataType): array
    {
        $startTime = microtime(true);
        
        // Update progress to 'running'
        $this->updateProgress($dataType, 'running', 0, 0, 0, 0, current_time('mysql'), null);
        
        try {
            switch ($dataType) {
                case 'trips':
                    $result = $this->migrateTrips();
                    break;
                case 'bookings':
                    $result = $this->migrateBookings();
                    break;
                case 'customers':
                    $result = $this->migrateCustomers();
                    break;
                case 'destinations':
                    $result = $this->migrateDestinations();
                    break;
                case 'activities':
                    $result = $this->migrateActivities();
                    break;
                case 'trip_categories':
                    $result = $this->migrateCategories();
                    break;
                case 'reviews':
                    $result = $this->migrateReviews();
                    break;
                case 'enquiries':
                    $result = $this->migrateEnquiries();
                    break;
                case 'coupons':
                    $result = $this->migrateCoupons();
                    break;
                case 'tour_dates':
                    $result = $this->migrateTourDates();
                    break;
                default:
                    throw new \Exception("Unknown data type: {$dataType}");
            }
            
            $duration = microtime(true) - $startTime;
            
            // Update progress to 'completed'
            $total = $result['migrated'] + $result['skipped'] + $result['failed'];
            $this->updateProgress(
                $dataType, 
                'completed', 
                $result['migrated'], 
                $result['skipped'], 
                $result['failed'],
                $total,
                null,
                current_time('mysql')
            );
            
            // Log migration
            $this->logMigration($dataType, $result, $duration);
            
            return [
                'success' => true,
                'data_type' => $dataType,
                'migrated' => $result['migrated'],
                'skipped' => $result['skipped'],
                'failed' => $result['failed'],
                'duration' => round($duration, 2),
            ];
            
        } catch (\Exception $e) {
            // Update progress to 'failed'
            $this->updateProgress($dataType, 'failed', 0, 0, 0, 0, null, current_time('mysql'));
            
            return [
                'success' => false,
                'data_type' => $dataType,
                'error' => $e->getMessage(),
            ];
        }
    }
    
    /**
     * Update migration progress for a specific data type
     */
    private function updateProgress(
        string $dataType, 
        string $status, 
        int $migrated, 
        int $skipped, 
        int $failed,
        int $total,
        ?string $startedAt,
        ?string $completedAt
    ): void {
        $progress = get_option('yatra_migration_progress', []);
        
        if (!isset($progress[$dataType])) {
            $progress[$dataType] = [];
        }
        
        $progress[$dataType]['status'] = $status;
        $progress[$dataType]['migrated'] = $migrated;
        $progress[$dataType]['skipped'] = $skipped;
        $progress[$dataType]['failed'] = $failed;
        $progress[$dataType]['total'] = $total;
        
        if ($startedAt !== null) {
            $progress[$dataType]['started_at'] = $startedAt;
        }
        
        if ($completedAt !== null) {
            $progress[$dataType]['completed_at'] = $completedAt;
        }
        
        update_option('yatra_migration_progress', $progress);
    }
    
    /**
     * Migrate all data types using Action Scheduler
     */
    public function migrateAll(): array
    {
        try {
            // Check if Action Scheduler is available
            if (!function_exists('as_schedule_single_action')) {
                throw new \Exception('WooCommerce Action Scheduler is not available');
            }
            
            $dataTypes = ['trips', 'destinations', 'activities', 'trip_categories', 'customers', 'bookings', 'coupons', 'reviews', 'enquiries', 'tour_dates'];
            
            // Initialize migration progress tracking
            $progress = [];
            foreach ($dataTypes as $dataType) {
                $progress[$dataType] = [
                    'status' => 'pending',
                    'migrated' => 0,
                    'skipped' => 0,
                    'failed' => 0,
                    'total' => 0,
                    'started_at' => null,
                    'completed_at' => null,
                ];
            }
            
            // Save initial progress state
            update_option('yatra_migration_progress', $progress);
            update_option('yatra_migration_started_at', current_time('mysql'));
            
            // Schedule migrations for each data type
            $scheduledActions = [];
            foreach ($dataTypes as $dataType) {
                $actionId = as_schedule_single_action(
                    time(),
                    'yatra_migrate_data_type',
                    [
                        'data_type' => $dataType,
                    ],
                    'yatra_migration'
                );
                
                $scheduledActions[$dataType] = $actionId;
            }
            
            return [
                'success' => true,
                'message' => 'Migration started for all data types. Processing in background...',
                'scheduled_actions' => $scheduledActions,
                'data_types' => $dataTypes,
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
    
    /**
     * Get migration progress
     */
    public function getMigrationProgress(): array
    {
        $progress = get_option('yatra_migration_progress', []);
        $startedAt = get_option('yatra_migration_started_at', null);
        
        // Check if all migrations are complete
        $allComplete = true;
        $anyRunning = false;
        
        foreach ($progress as $dataType => $status) {
            if ($status['status'] === 'pending' || $status['status'] === 'running') {
                $allComplete = false;
            }
            if ($status['status'] === 'running') {
                $anyRunning = true;
            }
        }
        
        return [
            'progress' => $progress,
            'started_at' => $startedAt,
            'all_complete' => $allComplete,
            'any_running' => $anyRunning,
        ];
    }
    
    /**
     * Migrate trips from old custom post type to new structure
     */
    private function migrateTrips(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;
        
        // Get old trips
        $oldTrips = $this->wpdb->get_results(
            "SELECT * FROM {$this->wpdb->posts} 
             WHERE post_type = 'tour' AND post_status != 'trash'"
        );
        
        foreach ($oldTrips as $oldTrip) {
            try {
                // Check if already migrated
                if ($this->isTripMigrated($oldTrip->ID)) {
                    $skipped++;
                    continue;
                }
                
                // Get post meta
                $meta = $this->getPostMeta($oldTrip->ID);
                
                // Insert into new trips table
                $inserted = $this->wpdb->insert(
                    $this->wpdb->prefix . 'yatra_trips',
                    [
                        'name' => $oldTrip->post_title,
                        'slug' => $oldTrip->post_name,
                        'description' => $oldTrip->post_content,
                        'excerpt' => $oldTrip->post_excerpt,
                        'duration_days' => $meta['yatra_tour_meta_tour_duration_days'] ?? 1,
                        'duration_nights' => $meta['yatra_tour_meta_tour_duration_nights'] ?? 0,
                        'group_size' => $meta['yatra_tour_meta_tour_group_size'] ?? 10,
                        'original_price' => $meta['yatra_tour_meta_tour_price'] ?? 0,
                        'sale_price' => $meta['yatra_tour_meta_tour_sale_price'] ?? null,
                        'featured_image' => get_post_thumbnail_id($oldTrip->ID) ?: null,
                        'gallery_images' => $meta['yatra_tour_meta_gallery_images'] ?? null,
                        'status' => $oldTrip->post_status === 'publish' ? 'active' : 'inactive',
                        'created_at' => $oldTrip->post_date,
                        'updated_at' => $oldTrip->post_modified,
                    ]
                );
                
                if ($inserted) {
                    $newTripId = $this->wpdb->insert_id;
                    
                    // Store mapping for reference
                    update_post_meta($oldTrip->ID, '_migrated_to_trip_id', $newTripId);
                    
                    $migrated++;
                } else {
                    $failed++;
                }
                
            } catch (\Exception $e) {
                $failed++;
            }
        }
        
        return compact('migrated', 'skipped', 'failed');
    }
    
    /**
     * Migrate bookings
     */
    private function migrateBookings(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;
        
        $oldTable = $this->wpdb->prefix . 'yatra_booking';
        
        if (!$this->tableExists($oldTable)) {
            return compact('migrated', 'skipped', 'failed');
        }
        
        $oldBookings = $this->wpdb->get_results("SELECT * FROM {$oldTable}");
        
        foreach ($oldBookings as $oldBooking) {
            try {
                // Map old trip ID to new trip ID
                $newTripId = $this->getMigratedTripId($oldBooking->tour_id ?? 0);
                
                if (!$newTripId) {
                    $skipped++;
                    continue;
                }
                
                // Insert into new bookings table
                $inserted = $this->wpdb->insert(
                    $this->wpdb->prefix . 'yatra_bookings',
                    [
                        'trip_id' => $newTripId,
                        'customer_id' => $oldBooking->customer_id ?? null,
                        'booking_code' => $oldBooking->booking_code ?? uniqid('YTR-'),
                        'total_travelers' => $oldBooking->number_of_person ?? 1,
                        'total_price' => $oldBooking->total_price ?? 0,
                        'paid_amount' => $oldBooking->paid_amount ?? 0,
                        'due_amount' => $oldBooking->due_amount ?? 0,
                        'status' => $oldBooking->status ?? 'pending',
                        'booking_date' => $oldBooking->booking_date ?? current_time('mysql'),
                        'travel_date' => $oldBooking->tour_date ?? null,
                        'created_at' => $oldBooking->created_at ?? current_time('mysql'),
                        'updated_at' => $oldBooking->updated_at ?? current_time('mysql'),
                    ]
                );
                
                if ($inserted) {
                    $migrated++;
                } else {
                    $failed++;
                }
                
            } catch (\Exception $e) {
                $failed++;
            }
        }
        
        return compact('migrated', 'skipped', 'failed');
    }
    
    /**
     * Migrate customers
     */
    private function migrateCustomers(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;
        
        $oldTable = $this->wpdb->prefix . 'yatra_customer';
        
        if (!$this->tableExists($oldTable)) {
            return compact('migrated', 'skipped', 'failed');
        }
        
        $oldCustomers = $this->wpdb->get_results("SELECT * FROM {$oldTable}");
        
        foreach ($oldCustomers as $oldCustomer) {
            try {
                $inserted = $this->wpdb->insert(
                    $this->wpdb->prefix . 'yatra_customers',
                    [
                        'first_name' => $oldCustomer->first_name ?? '',
                        'last_name' => $oldCustomer->last_name ?? '',
                        'email' => $oldCustomer->email ?? '',
                        'phone' => $oldCustomer->phone ?? '',
                        'country' => $oldCustomer->country ?? '',
                        'city' => $oldCustomer->city ?? '',
                        'address' => $oldCustomer->address ?? '',
                        'created_at' => $oldCustomer->created_at ?? current_time('mysql'),
                        'updated_at' => $oldCustomer->updated_at ?? current_time('mysql'),
                    ]
                );
                
                if ($inserted) {
                    $migrated++;
                } else {
                    $failed++;
                }
                
            } catch (\Exception $e) {
                $failed++;
            }
        }
        
        return compact('migrated', 'skipped', 'failed');
    }
    
    /**
     * Migrate destinations from taxonomy to new table
     */
    private function migrateDestinations(): array
    {
        return $this->migrateTaxonomy('destination', 'yatra_destinations');
    }
    
    /**
     * Migrate activities from taxonomy to new table
     */
    private function migrateActivities(): array
    {
        return $this->migrateTaxonomy('activity', 'yatra_activities');
    }
    
    /**
     * Migrate categories
     */
    private function migrateCategories(): array
    {
        return $this->migrateTaxonomy('tour_category', 'yatra_trip_categories');
    }
    
    /**
     * Migrate difficulty levels
     */
    private function migrateDifficultyLevels(): array
    {
        return $this->migrateTaxonomy('difficulty', 'yatra_difficulty_levels');
    }
    
    /**
     * Generic taxonomy migration
     */
    private function migrateTaxonomy(string $taxonomy, string $newTable): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;
        
        $terms = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT t.*, tt.description 
                 FROM {$this->wpdb->terms} t
                 INNER JOIN {$this->wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
                 WHERE tt.taxonomy = %s",
                $taxonomy
            )
        );
        
        foreach ($terms as $term) {
            try {
                $inserted = $this->wpdb->insert(
                    $this->wpdb->prefix . $newTable,
                    [
                        'name' => $term->name,
                        'slug' => $term->slug,
                        'description' => $term->description ?? '',
                        'created_at' => current_time('mysql'),
                        'updated_at' => current_time('mysql'),
                    ]
                );
                
                if ($inserted) {
                    $migrated++;
                } else {
                    $failed++;
                }
                
            } catch (\Exception $e) {
                $failed++;
            }
        }
        
        return compact('migrated', 'skipped', 'failed');
    }
    
    /**
     * Migrate reviews
     */
    private function migrateReviews(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;
        
        // Reviews migration logic here
        
        return compact('migrated', 'skipped', 'failed');
    }
    
    /**
     * Migrate enquiries
     */
    private function migrateEnquiries(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;
        
        // Enquiries migration logic here
        
        return compact('migrated', 'skipped', 'failed');
    }
    
    /**
     * Helper methods
     */
    
    private function tableExists(string $table): bool
    {
        $result = $this->wpdb->get_var(
            $this->wpdb->prepare("SHOW TABLES LIKE %s", $table)
        );
        return $result === $table;
    }
    
    private function isTripMigrated(int $oldTripId): bool
    {
        return (bool) get_post_meta($oldTripId, '_migrated_to_trip_id', true);
    }
    
    private function getMigratedTripId(int $oldTripId): ?int
    {
        $newId = get_post_meta($oldTripId, '_migrated_to_trip_id', true);
        return $newId ? (int) $newId : null;
    }
    
    private function getPostMeta(int $postId): array
    {
        $meta = get_post_meta($postId);
        $result = [];
        
        foreach ($meta as $key => $value) {
            $result[$key] = is_array($value) && count($value) === 1 ? $value[0] : $value;
        }
        
        return $result;
    }
    
    private function logMigration(string $dataType, array $result, float $duration): void
    {
        $log = get_option('yatra_migration_log', []);
        
        $log[] = [
            'data_type' => $dataType,
            'migrated' => $result['migrated'],
            'skipped' => $result['skipped'],
            'failed' => $result['failed'],
            'duration' => $duration,
            'timestamp' => current_time('mysql'),
        ];
        
        update_option('yatra_migration_log', $log);
    }
    
    private function getMigrationLog(): array
    {
        return get_option('yatra_migration_log', []);
    }
    
    /**
     * Migrate coupons from old custom post type
     */
    private function migrateCoupons(): array
    {
        global $wpdb;
        
        $migrated = 0;
        $skipped = 0;
        $failed = 0;
        
        // Get all old coupons
        $oldCoupons = $wpdb->get_results(
            "SELECT * FROM {$wpdb->posts} 
             WHERE post_type = 'yatra-coupons' 
             AND post_status IN ('publish', 'draft')"
        );
        
        foreach ($oldCoupons as $oldCoupon) {
            try {
                // Check if already migrated
                if (get_post_meta($oldCoupon->ID, '_migrated_to_coupon_id', true)) {
                    $skipped++;
                    continue;
                }
                
                // Get all coupon meta data
                $meta = $this->getPostMeta($oldCoupon->ID);
                
                // Create new coupon in yatra_coupons table
                $couponData = [
                    'code' => $oldCoupon->post_title,
                    'description' => $oldCoupon->post_content,
                    'discount_type' => $meta['yatra_coupon_discount_type'] ?? 'percentage',
                    'discount_amount' => floatval($meta['yatra_coupon_discount_amount'] ?? 0),
                    'minimum_amount' => floatval($meta['yatra_coupon_minimum_amount'] ?? 0),
                    'maximum_amount' => floatval($meta['yatra_coupon_maximum_amount'] ?? 0),
                    'usage_limit' => intval($meta['yatra_coupon_usage_limit'] ?? 0),
                    'usage_count' => intval($meta['yatra_coupon_usage_count'] ?? 0),
                    'start_date' => $meta['yatra_coupon_start_date'] ?? null,
                    'end_date' => $meta['yatra_coupon_end_date'] ?? null,
                    'status' => $oldCoupon->post_status === 'publish' ? 'active' : 'inactive',
                    'created_at' => $oldCoupon->post_date,
                    'updated_at' => $oldCoupon->post_modified,
                ];
                
                $wpdb->insert(
                    $wpdb->prefix . 'yatra_coupons',
                    $couponData
                );
                
                $newCouponId = $wpdb->insert_id;
                
                if ($newCouponId) {
                    // Mark as migrated
                    update_post_meta($oldCoupon->ID, '_migrated_to_coupon_id', $newCouponId);
                    $migrated++;
                } else {
                    $failed++;
                }
                
            } catch (\Exception $e) {
                $failed++;
                error_log("Coupon migration failed for ID {$oldCoupon->ID}: " . $e->getMessage());
            }
        }
        
        return [
            'migrated' => $migrated,
            'skipped' => $skipped,
            'failed' => $failed,
        ];
    }
    
    /**
     * Migrate tour dates from old table structure
     */
    private function migrateTourDates(): array
    {
        global $wpdb;
        
        $migrated = 0;
        $skipped = 0;
        $failed = 0;
        
        $oldTable = $wpdb->prefix . 'yatra_tour_dates';
        
        // Check if old table exists
        if ($wpdb->get_var("SHOW TABLES LIKE '{$oldTable}'") !== $oldTable) {
            return [
                'migrated' => 0,
                'skipped' => 0,
                'failed' => 0,
            ];
        }
        
        // Get all old tour dates
        $oldTourDates = $wpdb->get_results("SELECT * FROM {$oldTable}");
        
        foreach ($oldTourDates as $oldDate) {
            try {
                // Check if already migrated
                $exists = $wpdb->get_var($wpdb->prepare(
                    "SELECT id FROM {$wpdb->prefix}yatra_departures 
                     WHERE old_tour_date_id = %d",
                    $oldDate->id
                ));
                
                if ($exists) {
                    $skipped++;
                    continue;
                }
                
                // Get the migrated trip ID
                $newTripId = $this->getMigratedTripId($oldDate->tour_id);
                
                if (!$newTripId) {
                    $failed++;
                    continue;
                }
                
                // Create new departure
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
                
            } catch (\Exception $e) {
                $failed++;
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
