<?php
/**
 * Migration Progress - Orchestrates migrations and tracks progress/logs
 * 
 * @package Yatra\Migration
 * @since 3.0.0
 */

namespace Yatra\Migration;

use Yatra\Core\Database;
use Yatra\Utils\Logger;
use Yatra\Migration\TripMigration;
use Yatra\Migration\BookingMigration;
use Yatra\Migration\CustomerMigration;
use Yatra\Migration\DestinationMigration;
use Yatra\Migration\ActivityMigration;
use Yatra\Migration\ReviewMigration;
use Yatra\Migration\EnquiryMigration;
use Yatra\Migration\CouponMigration;
use Yatra\Migration\TourDateMigration;
use Yatra\Migration\TravelerCategoriesMigration;

class MigrationProgress
{
    private $wpdb;
    private $detector;
    private $logger;
    /**
     * When true, migration routines will reprocess records even if they were previously migrated.
     *
     * @var bool
     */
    private bool $forceMigration = false;
    /**
     * Tracks whether we've already ensured DB schema is up to date for this request.
     *
     * @var bool
     */
    private bool $schemaEnsured = false;
    /**
     * Ordered list of migration data types to maintain consistent processing
     *
     * @var string[]
     */
    private array $dataTypesOrder = [
        'destinations',
        'activities',
        'customers',
        'coupons',
        'reviews',
        'enquiries',
        'trips',
        'tour_dates',
        'bookings',
        'traveler_categories',
        'itinerary',
    ];
    
    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->detector = new MigrationDetector();
        $this->logger = new Logger();
    }

    /**
     * Expose wpdb for migration helpers.
     */
    public function getWpdb(): \wpdb
    {
        return $this->wpdb;
    }

    /**
     * Whether force migration is enabled for this run.
     */
    public function isForceMigration(): bool
    {
        return $this->forceMigration;
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
    public function migrate(string $dataType, bool $force = false): array
    {
        try {
            $this->ensureSchemaUpToDate();

            // Check if Action Scheduler is available
            if (!function_exists('as_schedule_single_action')) {
                throw new \Exception('WooCommerce Action Scheduler is not available');
            }
            
            // Schedule the migration to run in the background
            $actionArgs = [
                'data_type' => $dataType,
            ];

            if ($force) {
                $actionArgs['force'] = true;
            }

            $actionId = as_schedule_single_action(
                time(),
                'yatra_migrate_data_type',
                $actionArgs,
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
    public function processMigration(string $dataType, bool $force = false): array
    {
        // Ensure schema is ready for this request before touching tables
        $this->ensureSchemaUpToDate();

        $this->forceMigration = $force;
        Logger::info("Starting migration for: {$dataType}", ['source' => 'migration']);
        
        $startTime = microtime(true);
        
        // Get total count before starting migration
        $detector = new \Yatra\Migration\MigrationDetector();
        $oldData = $detector->detectOldData();
        $total = $oldData[$dataType]['count'] ?? 0;
        
        Logger::info("Found {$total} items to migrate for {$dataType}", [
            'source' => 'migration',
            'data_type' => $dataType,
            'total' => $total
        ]);
        
        // Update progress to 'running' with total count
        $this->updateProgress($dataType, 'running', 0, 0, 0, $total, current_time('mysql'), null);
        
        try {
            switch ($dataType) {
                case 'trips':
                    $result = (new TripMigration($this))->run();
                    break;
                case 'bookings':
                    $result = (new BookingMigration($this))->run();
                    break;
                case 'customers':
                    $result = (new CustomerMigration($this))->run();
                    break;
                case 'destinations':
                    $result = (new DestinationMigration($this))->run();
                    break;
                case 'activities':
                    $result = (new ActivityMigration($this))->run();
                    break;
                case 'reviews':
                    $result = (new ReviewMigration($this))->run();
                    break;
                case 'enquiries':
                    $result = (new EnquiryMigration($this))->run();
                    break;
                case 'coupons':
                    $result = (new CouponMigration($this))->run();
                    break;
                case 'tour_dates':
                    $result = (new TourDateMigration($this))->run();
                    break;
                case 'traveler_categories':
                    $result = (new TravelerCategoriesMigration($this))->run();
                    break;
                case 'itinerary':
                    $result = (new ItineraryMigration($this))->run();
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
            
            // Log migration completion
            Logger::info("Migration completed for {$dataType}", [
                'source' => 'migration',
                'data_type' => $dataType,
                'migrated' => $result['migrated'],
                'skipped' => $result['skipped'],
                'failed' => $result['failed'],
                'duration' => round($duration, 2)
            ]);
            
            if ($result['failed'] > 0) {
                Logger::warning("{$result['failed']} items failed to migrate for {$dataType}", [
                    'source' => 'migration',
                    'data_type' => $dataType,
                    'failed_count' => $result['failed']
                ]);
            }
            
            // Log migration
            $this->logMigration($dataType, $result, $duration);
            
            // If every data type is now complete, clear progress options
            $this->finalizeProgressIfAllComplete();

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
            
            error_log("[Yatra Migration] FAILED: Migration failed for {$dataType}: {$e->getMessage()}");
            
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
    public function updateProgress(
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
    public function migrateAll(bool $force = false): array
    {
        try {
            $this->ensureSchemaUpToDate();

            // Check if Action Scheduler is available
            if (!function_exists('as_schedule_single_action')) {
                throw new \Exception('WooCommerce Action Scheduler is not available');
            }

            $this->forceMigration = $force;

            if ($this->forceMigration) {
                $this->resetMigratedData();
            }
            
            // Check if migration is already running
            $progress = $this->getMigrationProgress();
            if ($progress['any_running'] && !$progress['all_complete']) {
                return [
                    'success' => false,
                    'error' => 'Migration is already in progress. Please wait for it to complete.',
                ];
            }
            
            // Get old data counts first
            $detector = new MigrationDetector();
            $oldData = $detector->detectOldData();
            
            // Initialize migration progress tracking with actual counts
            $progress = [];
            foreach ($this->dataTypesOrder as $dataType) {
                // Get the count from old data detection
                $count = isset($oldData[$dataType]) ? (int)$oldData[$dataType]['count'] : 0;
                
                $progress[$dataType] = [
                    'status' => 'pending',
                    'migrated' => 0,
                    'skipped' => 0,
                    'failed' => 0,
                    'total' => $count,
                    'started_at' => null,
                    'completed_at' => null,
                ];
            }
            
            // Save initial progress state
            update_option('yatra_migration_progress', $progress);
            update_option('yatra_migration_started_at', current_time('mysql'));
            
            // Schedule migrations for each data type
            $scheduledActions = [];
            foreach ($this->dataTypesOrder as $dataType) {
                error_log("[Yatra Migration] Scheduling action for: {$dataType}");
                
                $args = [
                    'data_type' => $dataType,
                ];

                if ($this->forceMigration) {
                    $args['force'] = true;
                }

                $actionId = as_schedule_single_action(
                    time(),
                    'yatra_migrate_data_type',
                    $args,
                    'yatra_migration'
                );
                
                error_log("[Yatra Migration] Action scheduled for {$dataType}, ID: {$actionId}");
                
                $scheduledActions[$dataType] = $actionId;
            }
            
            error_log("[Yatra Migration] All actions scheduled: " . json_encode($scheduledActions));
            
            $response = [
                'success' => true,
                'message' => 'Migration started for all data types. Processing in background...',
                'scheduled_actions' => $scheduledActions,
                'data_types' => $this->dataTypesOrder,
            ];

            // Immediately try to kick the queue once to avoid waiting for cron
            $this->maybeKickActionScheduler(get_option('yatra_migration_progress', []), true);

            return $response;
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Cancel any pending or running migration jobs and mark status as cancelled.
     */
    public function cancelMigration(): array
    {
        if (function_exists('as_unschedule_all_actions')) {
            as_unschedule_all_actions('yatra_migrate_data_type', [], 'yatra_migration');
        }

        $progress = get_option('yatra_migration_progress', []);
        $updated = false;

        foreach ($progress as $dataType => $status) {
            if (in_array($status['status'] ?? '', ['pending', 'running'], true)) {
                $progress[$dataType]['status'] = 'cancelled';
                $progress[$dataType]['completed_at'] = current_time('mysql');
                $updated = true;
            }
        }

        if ($updated) {
            update_option('yatra_migration_progress', $progress);
        }

        Logger::info('Migration cancelled', ['source' => 'migration']);

        return [
            'success' => true,
            'message' => 'Migration cancelled successfully.',
            'progress' => $progress,
        ];
    }

    /**
     * Get migration progress for all data types.
     */
    public function getMigrationProgress(): array
    {
        $progress = get_option('yatra_migration_progress', []);

        // Attempt to automatically process pending migrations if Action Scheduler queue isn't running
        $this->maybeKickActionScheduler($progress);

        // Refresh after potential processing
        $progress = get_option('yatra_migration_progress', []);
        $startedAt = get_option('yatra_migration_started_at', null);
        $progressChanged = false;

        $allComplete = true;
        $anyRunning = false;

        foreach ($progress as $dataType => $status) {
            $total = isset($status['total']) ? (int) $status['total'] : 0;

            // If there is nothing to migrate for this type, auto-complete it
            if ($total === 0 && ($status['status'] ?? '') !== 'completed') {
                $progress[$dataType]['status'] = 'completed';
                $progress[$dataType]['completed_at'] = $status['completed_at'] ?? current_time('mysql');
                $progressChanged = true;
                $status = $progress[$dataType];
            }

            if (($status['status'] ?? '') === 'pending' || ($status['status'] ?? '') === 'running') {
                $allComplete = false;
            }

            if (($status['status'] ?? '') === 'running') {
                $anyRunning = true;
            }
        }

        if ($progressChanged) {
            update_option('yatra_migration_progress', $progress);
        }

        return [
            'progress' => $progress,
            'started_at' => $startedAt,
            'all_complete' => $allComplete,
            'any_running' => $anyRunning,
        ];
    }

    /**
     * Check if a table exists.
     */
    public function tableExists(string $table): bool
    {
        $result = $this->wpdb->get_var(
            $this->wpdb->prepare("SHOW TABLES LIKE %s", $table)
        );
        return $result === $table;
    }
    
    /**
     * Generate unique slug by adding suffix if slug already exists
     */
    public function generateUniqueSlug(string $baseSlug, string $table): string
    {
        $slug = $baseSlug;
        $suffix = 1;
        
        // Check if slug exists
        while ($this->wpdb->get_var($this->wpdb->prepare(
            "SELECT id FROM {$this->wpdb->prefix}{$table} WHERE slug = %s",
            $slug
        ))) {
            $slug = $baseSlug . '-' . $suffix;
            $suffix++;
        }
        
        return $slug;
    }
    
    public function isTripMigrated(int $oldTripId): bool
    {
        return (bool) get_post_meta($oldTripId, '_migrated_to_trip_id', true);
    }
    
    public function getMigratedTripId(int $oldTripId): ?int
    {
        $newId = get_post_meta($oldTripId, '_migrated_to_trip_id', true);
        return $newId ? (int) $newId : null;
    }
    
    public function getPostMeta(int $postId): array
    {
        $meta = get_post_meta($postId);
        $result = [];
        
        foreach ($meta as $key => $value) {
            $result[$key] = is_array($value) && count($value) === 1 ? $value[0] : $value;
        }
        
        return $result;
    }

    /**
     * Fetch the first non-empty legacy meta value from several possible keys.
     */
    public function getLegacyMetaValue(array $meta, array $keys, $default = null)
    {
        foreach ($keys as $key) {
            if (isset($meta[$key])) {
                $value = $meta[$key];
                if (is_array($value)) {
                    $value = reset($value);
                }
                if ($value !== '' && $value !== null) {
                    return $value;
                }
            }
        }

        return $default;
    }

    /**
     * Make sure the core Yatra database schema is up to date before migrations run.
     */
    private function ensureSchemaUpToDate(): void
    {
        if ($this->schemaEnsured) {
            return;
        }

        try {
            Database::createTables();
        } catch (\Throwable $e) {
            Logger::error('Failed to ensure Yatra tables exist before migration', [
                'source' => 'migration',
                'error' => $e->getMessage(),
            ]);
        }

        $this->ensureTripPricingColumns();

        $this->schemaEnsured = true;
    }

    /**
     * Some legacy installs may miss newer pricing columns; add them if needed.
     */
    private function ensureTripPricingColumns(): void
    {
        $table = $this->wpdb->prefix . 'yatra_trips';
        $columns = $this->wpdb->get_col("SHOW COLUMNS FROM {$table}", 0);

        if (empty($columns)) {
            return;
        }

        if (!in_array('discounted_price', $columns, true)) {
            $this->wpdb->query(
                "ALTER TABLE {$table} ADD COLUMN `discounted_price` decimal(10,2) DEFAULT NULL AFTER `original_price`"
            );
        }

        if (!in_array('price_per_person', $columns, true)) {
            $this->wpdb->query(
                "ALTER TABLE {$table} ADD COLUMN `price_per_person` tinyint(1) DEFAULT 1 AFTER `currency`"
            );
        }
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
     * Manually clear migration progress and logs (used by UI dismiss action).
     */
    public function clearMigrationData(): array
    {
        delete_option('yatra_migration_progress');
        delete_option('yatra_migration_started_at');
        delete_option('yatra_migration_log');

        return [
            'success' => true,
            'message' => 'Migration data cleared.',
        ];
    }

    /**
     * If all data types are marked completed, clear migration progress options.
     */
    private function finalizeProgressIfAllComplete(): void
    {
        $progress = get_option('yatra_migration_progress', []);

        if (empty($progress)) {
            return;
        }

        foreach ($progress as $status) {
            if (($status['status'] ?? '') !== 'completed') {
                return;
            }
        }

        delete_option('yatra_migration_progress');
        delete_option('yatra_migration_started_at');
        delete_option('yatra_migration_log');
    }
    
    /**
     * Migrate coupons from old custom post type
     */
    public function migrateCoupons(): array
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
        $total = count($oldCoupons);
        
        foreach ($oldCoupons as $oldCoupon) {
            try {
                // Check if already migrated
                if (get_post_meta($oldCoupon->ID, '_migrated_to_coupon_id', true)) {
                    $skipped++;
                    $this->updateProgress('coupons', 'running', $migrated, $skipped, $failed, $total, null, null);
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
                    $this->updateProgress('coupons', 'running', $migrated, $skipped, $failed, $total, null, null);
                } else {
                    $failed++;
                    $this->updateProgress('coupons', 'running', $migrated, $skipped, $failed, $total, null, null);
                }
                
            } catch (\Exception $e) {
                $failed++;
                $this->updateProgress('coupons', 'running', $migrated, $skipped, $failed, $total, null, null);
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
    public function migrateTourDates(): array
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
        $total = count($oldTourDates);
        
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
                    $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }
                
                // Get the migrated trip ID
                $newTripId = $this->getMigratedTripId($oldDate->tour_id);
                
                if (!$newTripId) {
                    $failed++;
                    $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
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
                    $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
                } else {
                    $failed++;
                    $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
                }
                
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
    
    /**
     * Migrate trip destinations relationship
     */
    public function migrateTripDestinations(int $oldTripId, int $newTripId): void
    {
        // Get old trip destinations from taxonomy relationships
        $destinations = wp_get_post_terms($oldTripId, 'destination', ['fields' => 'all']);
        
        if (empty($destinations) || is_wp_error($destinations)) {
            return;
        }
        
        foreach ($destinations as $index => $destination) {
            // Find the migrated destination ID
            $newDestinationId = $this->wpdb->get_var($this->wpdb->prepare(
                "SELECT id FROM {$this->wpdb->prefix}yatra_destinations WHERE slug = %s",
                $destination->slug
            ));
            
            if ($newDestinationId) {
                $this->wpdb->insert(
                    $this->wpdb->prefix . 'yatra_trip_destinations',
                    [
                        'trip_id' => $newTripId,
                        'destination_id' => $newDestinationId,
                        'is_primary' => ($index === 0) ? 1 : 0,
                        'order' => $index,
                        'created_at' => current_time('mysql'),
                    ]
                );
            }
        }
    }
    
    /**
     * Migrate trip activities relationship
     */
    public function migrateTripActivities(int $oldTripId, int $newTripId): void
    {
        // Get old trip activities from taxonomy relationships
        $activities = wp_get_post_terms($oldTripId, 'activity', ['fields' => 'all']);
        
        if (empty($activities) || is_wp_error($activities)) {
            return;
        }
        
        foreach ($activities as $index => $activity) {
            // Find the migrated activity ID
            $newActivityId = $this->wpdb->get_var($this->wpdb->prepare(
                "SELECT id FROM {$this->wpdb->prefix}yatra_activities WHERE slug = %s",
                $activity->slug
            ));
            
            if ($newActivityId) {
                $this->wpdb->insert(
                    $this->wpdb->prefix . 'yatra_trip_activities',
                    [
                        'trip_id' => $newTripId,
                        'activity_id' => $newActivityId,
                        'is_primary' => ($index === 0) ? 1 : 0,
                        'order' => $index,
                        'created_at' => current_time('mysql'),
                    ]
                );
            }
        }
    }
    
    /**
     * Reset migrated state so a forced re-run can rebuild everything.
     */
    private function resetMigratedData(): void
    {
        global $wpdb;

        delete_option('yatra_migration_progress');
        delete_option('yatra_migration_started_at');

        // For forced runs we only clear the mapping meta so records can reprocess.
        foreach (['_migrated_to_trip_id', '_migrated_to_coupon_id'] as $metaKey) {
            $wpdb->query(
                $wpdb->prepare(
                    "DELETE FROM {$wpdb->postmeta} WHERE meta_key = %s",
                    $metaKey
                )
            );
        }

        $wpdb->query("DELETE FROM {$wpdb->termmeta} WHERE meta_key LIKE '_yatra_migrated_%'");
        $wpdb->query("DELETE FROM {$wpdb->termmeta} WHERE meta_key LIKE '_yatra_force_migration_%'");
    }

    /**
     * Clear trip relationship tables before re-inserting fresh links.
     */
    public function deleteTripRelationships(int $tripId): void
    {
        $tables = [
            'yatra_trip_destinations',
            'yatra_trip_activities',
        ];

        foreach ($tables as $table) {
            $this->wpdb->delete(
                $this->wpdb->prefix . $table,
                ['trip_id' => $tripId],
                ['%d']
            );
        }
    }

    /**
     * Truncate table if it exists; fallback to DELETE when TRUNCATE fails.
     */
    public function truncateTableIfExists(string $table): void
    {
        global $wpdb;
        $exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table));
        if ($exists !== $table) {
            return;
        }

        $result = $wpdb->query("TRUNCATE TABLE {$table}");
        if ($result === false) {
            $wpdb->query("DELETE FROM {$table}");
        }
    }

    /**
     * Attempt to manually kick Action Scheduler to process pending migration jobs.
     *
     * @param array $progress Current migration progress array.
     * @param bool  $force    When true, always attempt to kick the runner regardless of status.
     */
    private function maybeKickActionScheduler(array $progress, bool $force = false): void
    {
        // Bail if Action Scheduler core functions are unavailable
        if (!class_exists('\ActionScheduler') && !function_exists('as_has_scheduled_action')) {
            return;
        }

        $hasPending = $force;

        if (!$hasPending) {
            foreach ($progress as $status) {
                if (isset($status['status']) && in_array($status['status'], ['pending', 'running'], true)) {
                    $hasPending = true;
                    break;
                }
            }
        }

        if (!$hasPending) {
            return;
        }

        try {
            if (class_exists('\ActionScheduler')) {
                $runner = \ActionScheduler::runner();
                if ($runner && method_exists($runner, 'run')) {
                    $runner->run();
                    return;
                }
            }

            if (class_exists('\ActionScheduler_QueueRunner')) {
                $runner = \ActionScheduler_QueueRunner::instance();
                if ($runner && method_exists($runner, 'run')) {
                    $runner->run();
                }
            }
        } catch (\Throwable $e) {
            error_log('[Yatra Migration] Failed to manually kick Action Scheduler: ' . $e->getMessage());
        }
    }
}
