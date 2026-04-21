<?php
/**
 * Migration Progress - Orchestrates migrations and tracks progress/logs
 * 
 * @package Yatra\Migration
 * @since 3.0.0
 */

namespace Yatra\Migration;

use Yatra\Constants\ClassificationTypes;
use Yatra\Core\Database;
use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Database\Tables\DeparturesTable;
use Yatra\Database\Tables\DiscountsTable;
use Yatra\Database\Tables\TripsTable;
use Yatra\Database\Tables\TripClassificationsTable;
use Yatra\Utils\Logger;
use Yatra\Migration\TripMigration;
use Yatra\Migration\BookingMigration;
use Yatra\Migration\CustomerMigration;
use Yatra\Migration\DestinationMigration;
use Yatra\Migration\ActivityMigration;
use Yatra\Migration\TripCategoryMigration;
use Yatra\Migration\ReviewMigration;
use Yatra\Migration\EnquiryMigration;
use Yatra\Migration\CouponMigration;
use Yatra\Migration\TourDateMigration;
use Yatra\Migration\TravelerCategoriesMigration;
use Yatra\Migration\AttributeMigration;
use Yatra\Migration\SettingsMigration;
use Yatra\Migration\ServicesMigration;
use Yatra\Migration\ItineraryMigration;
use Yatra\Migration\AvailabilityConditionsMigration;
use Yatra\Migration\ProMigrationReadiness;
use Yatra\Migration\ProFeaturesMigration;
use Yatra\Migration\ProReviewCptMigration;
use Yatra\Migration\ProDownloadsMigration;

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
        'settings',
        'pro_features',
        'destinations',
        'activities',
        'trip_categories',
        'attributes',
        'customers',
        'coupons',
        'reviews',
        'enquiries',
        'trips',
        // Pro CPT downloads/reviews reference old tour posts → need _migrated_to_trip_id from TripMigration.
        'pro_reviews_cpt',
        'pro_downloads',
        'tour_dates',
        'bookings',
        'traveler_categories',
        'itinerary',
        'services',
        'availability_conditions',
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
            'pro_migration' => ProMigrationReadiness::getState(),
        ];
    }

    /**
     * Whether this site still has legacy Yatra (before 3.0) footprints worth migrating.
     *
     * Delegates to {@see MigrationDetector::hasOldData()}: recorded yatra_plugin_version below 3.0.0
     * (old plugin) and/or structural legacy data (tour CPT, old tables, etc.). Normal 3.x options alone
     * must not qualify — see MigrationDetector::countOldSettings().
     */
    public function hasLegacyEnvironment(): bool
    {
        return $this->detector->hasOldData();
    }

    /**
     * True when legacy data exists but migration is incomplete or had failures.
     */
    public function legacyMigrationNeedsAttention(): bool
    {
        if (!$this->hasLegacyEnvironment()) {
            return false;
        }

        $oldData = $this->detector->detectOldData();
        $progress = get_option('yatra_migration_progress', []);

        $anyCountable = false;

        foreach ($this->dataTypesOrder as $type) {
            $count = (int) ($oldData[$type]['count'] ?? 0);
            if ($count === 0) {
                continue;
            }

            $anyCountable = true;

            $st = $progress[$type] ?? [];
            $status = $st['status'] ?? '';
            if ($status !== 'completed') {
                return true;
            }
            if ((int) ($st['failed'] ?? 0) > 0) {
                return true;
            }
        }

        // Legacy environment matched but every per-type count is zero (edge cases / detector drift).
        if (!$anyCountable) {
            return true;
        }

        return false;
    }
    
    /**
     * Migrate specific data type using Action Scheduler for background processing
     */
    public function migrate(string $dataType, bool $force = false): array
    {
        try {
            $this->ensureSchemaUpToDate();

            // Check if Action Scheduler is available
            // Prefer Action Scheduler (bundled with Yatra); fall back to WP-Cron for the same hook.
            $actionId = null;
            if (function_exists('as_schedule_single_action')) {
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
            } elseif (function_exists('wp_schedule_single_event')) {
                wp_schedule_single_event(time(), 'yatra_migrate_data_type', [$dataType, $force]);
                spawn_cron();
            } else {
                throw new \Exception(__('No background scheduler is available (Action Scheduler or WP-Cron).', 'yatra'));
            }

            $this->kickQueueRunner();

            $pro = ProMigrationReadiness::getState();
            $payload = [
                'success' => true,
                'data_type' => $dataType,
                'action_id' => $actionId,
                'message' => "Migration scheduled for {$dataType}. Processing in background...",
                'pro_migration' => $pro,
            ];
            if (!$pro['ready'] && $pro['warning_message'] !== '') {
                $payload['warnings'] = [$pro['warning_message']];
                Logger::warning($pro['warning_message'], [
                    'source' => 'migration',
                    'data_type' => $dataType,
                    'pro_migration' => $pro,
                ]);
            }

            return $payload;

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
                case 'pro_features':
                    $result = (new ProFeaturesMigration($this))->run();
                    break;
                case 'pro_reviews_cpt':
                    $result = (new ProReviewCptMigration($this))->run();
                    break;
                case 'pro_downloads':
                    $result = (new ProDownloadsMigration($this))->run();
                    break;
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
                case 'trip_categories':
                    $result = (new TripCategoryMigration($this))->run();
                    break;
                case 'attributes':
                    $result = (new AttributeMigration($this))->run();
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
                case 'settings':
                    $result = (new SettingsMigration($this))->run();
                    break;
                case 'services':
                    $result = (new ServicesMigration($this))->run();
                    break;
                case 'availability_conditions':
                    $result = (new AvailabilityConditionsMigration($this))->run();
                    break;
                default:
                    throw new \Exception("Unknown data type: {$dataType}");
            }

            // Taxonomy → trip links must work when migrations run out of order (e.g. trips before destinations).
            if ($dataType === 'destinations') {
                $this->repairTripDestinationsForAllLegacyTours();
            } elseif ($dataType === 'activities') {
                $this->repairTripActivitiesForAllLegacyTours();
            } elseif ($dataType === 'trips') {
                $this->repairTripDestinationsForAllLegacyTours();
                $this->repairTripActivitiesForAllLegacyTours();
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
     * Migrate all data types.
     *
     * Queues a full run on Action Scheduler (bundled with Yatra) so work happens outside
     * the admin HTTP request. Falls back to WP-Cron if AS is unavailable. Immediately runs
     * the AS queue runner once so progress starts without waiting for another page load.
     */
    public function migrateAll(bool $force = false): array
    {
        try {
            $this->ensureSchemaUpToDate();
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

            // Initialize progress tracking in DB
            $this->initializeProgress($force);

            $this->scheduleFullMigrationBackgroundRun($force);

            $pro = ProMigrationReadiness::getState();
            if (!$pro['ready'] && $pro['warning_message'] !== '') {
                Logger::warning($pro['warning_message'], [
                    'source' => 'migration',
                    'pro_migration' => $pro,
                ]);
            }

            $payload = [
                'success' => true,
                'message' => 'Migration started successfully.',
                'started_at' => current_time('mysql'),
                'background' => true,
                'pro_migration' => $pro,
            ];
            if (!$pro['ready'] && $pro['warning_message'] !== '') {
                $payload['warnings'] = [$pro['warning_message']];
            }

            return $payload;

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Queue migrateAllDirect on Action Scheduler (preferred) or WP-Cron, and try to start work immediately.
     */
    private function scheduleFullMigrationBackgroundRun(bool $force): void
    {
        // Avoid duplicate full runs from a previous attempt
        if (function_exists('wp_unschedule_hook')) {
            wp_unschedule_hook('yatra_migration_background_run');
        } else {
            wp_clear_scheduled_hook('yatra_migration_background_run', [false]);
            wp_clear_scheduled_hook('yatra_migration_background_run', [true]);
        }
        if (function_exists('as_unschedule_all_actions')) {
            // Empty group + empty args => cancel_actions_by_hook (clears all arg variants)
            as_unschedule_all_actions('yatra_migration_background_run');
        }

        if (function_exists('as_schedule_single_action')) {
            as_schedule_single_action(
                time(),
                'yatra_migration_background_run',
                [$force],
                'yatra_migration'
            );
        } else {
            wp_schedule_single_event(time(), 'yatra_migration_background_run', [$force]);
        }

        spawn_cron();
        $this->kickQueueRunner();
    }

    /**
     * Run Action Scheduler's queue runner (processes pending yatra_migration jobs in this or a follow-up request).
     */
    public function kickQueueRunner(): void
    {
        try {
            if (class_exists(\ActionScheduler::class)) {
                $runner = \ActionScheduler::runner();
                if ($runner && method_exists($runner, 'run')) {
                    $runner->run();

                    return;
                }
            }

            if (class_exists(\ActionScheduler_QueueRunner::class)) {
                $runner = \ActionScheduler_QueueRunner::instance();
                if ($runner && method_exists($runner, 'run')) {
                    $runner->run();
                }
            }
        } catch (\Throwable $e) {
            Logger::warning('kickQueueRunner: ' . $e->getMessage(), [
                'source' => 'migration',
            ]);
        }
    }

    /**
     * Initialize progress tracking in DB before background run
     */
    private function initializeProgress(bool $force = false): void
    {
        $this->ensureSchemaUpToDate();
        $this->forceMigration = $force;

        // Get old data counts
        $detector = new MigrationDetector();
        $oldData = $detector->detectOldData();

        // Initialize progress tracking
        $progress = [];
        foreach ($this->dataTypesOrder as $dataType) {
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

        update_option('yatra_migration_progress', $progress);
        update_option('yatra_migration_started_at', current_time('mysql'));
        delete_option('yatra_migration_rewrite_flushed_for_started_at');
    }

    /**
     * Migrate all data types directly (synchronous, no Action Scheduler).
     *
     * Processes each migration sequentially in the current request.
     * Increases PHP time/memory limits to handle large datasets.
     */
    public function migrateAllDirect(bool $force = false): array
    {
        // Increase PHP limits for long migration
        @set_time_limit(3600);
        @ini_set('memory_limit', '1G');

        // Progress has already been initialized by migrateAll() before scheduling
        // But we refresh the force variable just in case
        $this->forceMigration = $force;

        // Process each data type sequentially
        $results = [];
        $overallSuccess = true;

        foreach ($this->dataTypesOrder as $dataType) {
            try {
                Logger::info("Direct migration: processing {$dataType}", ['source' => 'migration']);
                $result = $this->processMigration($dataType, $force);
                $results[$dataType] = $result;

                if (isset($result['success']) && !$result['success']) {
                    $overallSuccess = false;
                    Logger::error("Direct migration: {$dataType} failed", [
                        'source' => 'migration',
                        'error' => $result['error'] ?? 'Unknown'
                    ]);
                }
            } catch (\Throwable $e) {
                $overallSuccess = false;
                $results[$dataType] = [
                    'success' => false,
                    'data_type' => $dataType,
                    'error' => $e->getMessage(),
                ];
                // Update progress to failed for this type
                $this->updateProgress($dataType, 'failed', 0, 0, 0, 0, null, current_time('mysql'));

                Logger::error("Direct migration: {$dataType} threw exception: {$e->getMessage()}", [
                    'source' => 'migration',
                    'data_type' => $dataType,
                ]);
            }
        }

        // Flush rewrite rules once all types are completed (also retries if finalize was skipped mid-run).
        $this->finalizeProgressIfAllComplete();

        return [
            'success' => $overallSuccess,
            'message' => $overallSuccess
                ? 'All migrations completed successfully.'
                : 'Migration completed with some errors. Check individual results.',
            'mode' => 'direct',
            'results' => $results,
            'data_types' => $this->dataTypesOrder,
        ];
    }

    /**
     * Cancel any pending or running migration jobs and mark status as cancelled.
     */
    public function cancelMigration(): array
    {
        if (function_exists('as_unschedule_all_actions')) {
            as_unschedule_all_actions('', [], 'yatra_migration');
        }
        if (function_exists('wp_unschedule_hook')) {
            wp_unschedule_hook('yatra_migration_background_run');
        } else {
            wp_clear_scheduled_hook('yatra_migration_background_run', [false]);
            wp_clear_scheduled_hook('yatra_migration_background_run', [true]);
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
     * Types with total 0 never get a {@see processMigration()} run; mark them completed so
     * {@see finalizeProgressIfAllComplete()} can detect an all-done run and flush rewrite rules.
     *
     * @param array<string, array<string, mixed>> $progress
     * @return array{0: array<string, array<string, mixed>>, 1: bool}
     */
    private function applyZeroCountAutoComplete(array $progress): array
    {
        $changed = false;
        foreach ($progress as $dataType => $status) {
            $total = isset($status['total']) ? (int) $status['total'] : 0;

            if ($total === 0 && ($status['status'] ?? '') !== 'completed') {
                $progress[$dataType]['status'] = 'completed';
                $progress[$dataType]['completed_at'] = $status['completed_at'] ?? current_time('mysql');
                $changed = true;
            }
        }

        return [$progress, $changed];
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

        // If progress is empty (no migration has been run), set all_complete to false
        $allComplete = !empty($progress);
        $anyRunning = false;

        [$progress, $zeroChanged] = $this->applyZeroCountAutoComplete($progress);
        if ($zeroChanged) {
            $progressChanged = true;
        }

        foreach ($progress as $dataType => $status) {

            if (($status['status'] ?? '') === 'pending' || ($status['status'] ?? '') === 'running') {
                $allComplete = false;
            }

            if (in_array(($status['status'] ?? ''), ['failed', 'cancelled'], true)) {
                $allComplete = false;
            }

            if (($status['status'] ?? '') === 'running') {
                $anyRunning = true;
            }
        }

        if ($progressChanged) {
            update_option('yatra_migration_progress', $progress);
        }

        if ($allComplete && !empty($progress)) {
            $this->finalizeProgressIfAllComplete();
        }

        return [
            'progress' => $progress,
            'started_at' => $startedAt,
            'all_complete' => $allComplete,
            'any_running' => $anyRunning,
            'pro_migration' => ProMigrationReadiness::getState(),
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
        return (bool) $this->getRawPostMeta($oldTripId, '_migrated_to_trip_id');
    }
    
    public function getMigratedTripId(int $oldTripId): ?int
    {
        $newId = $this->getRawPostMeta($oldTripId, '_migrated_to_trip_id');
        return $newId ? (int) $newId : null;
    }
    
    /**
     * Get all post meta for a post using raw SQL.
     * Old post types (tour, yatra-booking, etc.) are NOT registered in the new plugin,
     * so we must use raw queries instead of get_post_meta().
     */
    public function getPostMeta(int $postId): array
    {
        $rows = $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT meta_key, meta_value FROM {$this->wpdb->postmeta} WHERE post_id = %d",
            $postId
        ));

        $result = [];
        foreach ($rows as $row) {
            $result[$row->meta_key] = $row->meta_value;
        }

        return $result;
    }

    /**
     * Get a single post meta value using raw SQL.
     */
    public function getRawPostMeta(int $postId, string $metaKey): ?string
    {
        return $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT meta_value FROM {$this->wpdb->postmeta} WHERE post_id = %d AND meta_key = %s LIMIT 1",
            $postId,
            $metaKey
        ));
    }

    /**
     * Set/update a post meta value using raw SQL.
     */
    public function setRawPostMeta(int $postId, string $metaKey, string $metaValue): void
    {
        $exists = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT meta_id FROM {$this->wpdb->postmeta} WHERE post_id = %d AND meta_key = %s LIMIT 1",
            $postId,
            $metaKey
        ));

        if ($exists) {
            $this->wpdb->update(
                $this->wpdb->postmeta,
                ['meta_value' => $metaValue],
                ['post_id' => $postId, 'meta_key' => $metaKey]
            );
        } else {
            $this->wpdb->insert(
                $this->wpdb->postmeta,
                ['post_id' => $postId, 'meta_key' => $metaKey, 'meta_value' => $metaValue]
            );
        }
    }

    /**
     * Get a single term meta value using raw SQL.
     * Old taxonomies (destination, activity, attributes) are NOT registered in the new plugin.
     */
    public function getRawTermMeta(int $termId, string $metaKey): ?string
    {
        return $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT meta_value FROM {$this->wpdb->termmeta} WHERE term_id = %d AND meta_key = %s LIMIT 1",
            $termId,
            $metaKey
        ));
    }

    /**
     * Latest term meta value when duplicate keys exist (imports / re-saves).
     */
    public function getRawTermMetaLatest(int $termId, string $metaKey): ?string
    {
        return $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT meta_value FROM {$this->wpdb->termmeta} WHERE term_id = %d AND meta_key = %s ORDER BY meta_id DESC LIMIT 1",
            $termId,
            $metaKey
        ));
    }

    /**
     * Set/update a term meta value using raw SQL.
     */
    public function setRawTermMeta(int $termId, string $metaKey, string $metaValue): void
    {
        $exists = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT meta_id FROM {$this->wpdb->termmeta} WHERE term_id = %d AND meta_key = %s LIMIT 1",
            $termId,
            $metaKey
        ));

        if ($exists) {
            $this->wpdb->update(
                $this->wpdb->termmeta,
                ['meta_value' => $metaValue],
                ['term_id' => $termId, 'meta_key' => $metaKey]
            );
        } else {
            $this->wpdb->insert(
                $this->wpdb->termmeta,
                ['term_id' => $termId, 'meta_key' => $metaKey, 'meta_value' => $metaValue]
            );
        }
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
            \Yatra\Services\InstallerService::createDatabaseTables();
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
        $table = TripsTable::getTableName();
        $columns = $this->wpdb->get_col("SHOW COLUMNS FROM {$table}", 0);

        if (empty($columns)) {
            return;
        }

        if (!in_array('discounted_price', $columns, true)) {
            $this->wpdb->query(
                "ALTER TABLE {$table} ADD COLUMN `discounted_price` decimal(10,2) DEFAULT NULL AFTER `original_price`"
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
        delete_option('yatra_migration_rewrite_flushed_for_started_at');

        return [
            'success' => true,
            'message' => 'Migration data cleared.',
        ];
    }

    /**
     * If all data types are marked completed, preserve the progress data for summary display.
     * Note: We no longer delete the progress data so users can see the migration summary.
     */
    private function finalizeProgressIfAllComplete(): void
    {
        $progress = get_option('yatra_migration_progress', []);

        if (empty($progress)) {
            return;
        }

        [$progress, $zeroChanged] = $this->applyZeroCountAutoComplete($progress);
        if ($zeroChanged) {
            update_option('yatra_migration_progress', $progress);
        }

        foreach ($progress as $status) {
            if (($status['status'] ?? '') !== 'completed') {
                return;
            }
        }

        $this->flushRewriteRulesOnceForCurrentMigrationRun();

        // Keep the progress data so the UI can display the summary
        // Only clear logs to save space
        delete_option('yatra_migration_log');
    }

    /**
     * Permalinks and trip/archive routes need a rewrite flush after legacy data moves to 3.x structures.
     * Runs once per migration run (keyed by {@see initializeProgress()} started_at).
     */
    private function flushRewriteRulesOnceForCurrentMigrationRun(): void
    {
        if (!function_exists('flush_rewrite_rules')) {
            return;
        }

        $startedAt = get_option('yatra_migration_started_at');
        if ($startedAt === null || $startedAt === '') {
            return;
        }

        $startedAtStr = is_string($startedAt) ? $startedAt : (string) $startedAt;
        $doneFor = get_option('yatra_migration_rewrite_flushed_for_started_at', '');

        if ($doneFor === $startedAtStr) {
            return;
        }

        flush_rewrite_rules(true);
        update_option('yatra_migration_rewrite_flushed_for_started_at', $startedAtStr, false);

        Logger::info('Rewrite rules flushed after Yatra migration completed.', [
            'source' => 'migration',
            'migration_started_at' => $startedAtStr,
        ]);
    }
    
    /**
     * Migrate coupons from old custom post type
     * NOTE: This is a legacy duplicate method. The primary coupon migration
     * is handled by CouponMigration class with correct meta key mappings.
     * This method is kept for backward compatibility but delegates to CouponMigration.
     */
    public function migrateCoupons(): array
    {
        return (new CouponMigration($this))->run();
    }
    
    /**
     * Migrate tour dates from old table structure.
     *
     * Old table: wp_yatra_tour_dates (start_date, end_date, max_travellers, pricing, active, note_to_customer, note_to_admin)
     * New table: DeparturesTable (trip_id, date, time, max_capacity, booked_count, status, source, price_override, notes)
     */
    public function migrateTourDates(): array
    {
        global $wpdb;

        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        $oldTable = $wpdb->prefix . 'yatra_tour_dates';
        $departuresTable = DeparturesTable::getTableName();

        // Check if old table exists
        if ($wpdb->get_var("SHOW TABLES LIKE '{$oldTable}'") !== $oldTable) {
            return compact('migrated', 'skipped', 'failed');
        }

        // Get all old tour dates
        $oldTourDates = $wpdb->get_results("SELECT * FROM {$oldTable}");
        $total = count($oldTourDates);

        foreach ($oldTourDates as $oldDate) {
            try {
                // Get the migrated trip ID
                $newTripId = $this->getMigratedTripId($oldDate->tour_id);

                if (!$newTripId) {
                    $failed++;
                    $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                // Check if a departure for this trip+date already exists
                $startDate = $oldDate->start_date ?? null;
                if (empty($startDate)) {
                    $skipped++;
                    $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                $exists = $wpdb->get_var($wpdb->prepare(
                    "SELECT id FROM {$departuresTable} WHERE trip_id = %d AND date = %s",
                    $newTripId,
                    $startDate
                ));

                if ($exists && !$this->isForceMigration()) {
                    $skipped++;
                    $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                // Parse pricing override
                $priceOverride = null;
                $priceByTravelerType = null;
                if (!empty($oldDate->pricing)) {
                    $pricing = maybe_unserialize($oldDate->pricing);
                    if (is_numeric($pricing)) {
                        $priceOverride = (float) $pricing;
                    } elseif (is_array($pricing)) {
                        $priceByTravelerType = json_encode($pricing);
                    }
                }

                // Combine notes
                $notes = trim(
                    ($oldDate->note_to_customer ?? '') .
                    (!empty($oldDate->note_to_admin) ? "\n[Admin] " . $oldDate->note_to_admin : '')
                );

                $departureData = [
                    'trip_id' => $newTripId,
                    'date' => $startDate,
                    'time' => null,
                    'max_capacity' => (int) ($oldDate->max_travellers ?? 0),
                    'booked_count' => 0,
                    'status' => !empty($oldDate->active) ? 'upcoming' : 'cancelled',
                    'source' => 'migrated',
                    'price_override' => $priceOverride,
                    'price_by_traveler_type' => $priceByTravelerType,
                    'notes' => !empty($notes) ? $notes : null,
                    'created_at' => $oldDate->created_at ?? current_time('mysql'),
                    'updated_at' => $oldDate->updated_at ?? current_time('mysql'),
                ];

                if ($exists && $this->isForceMigration()) {
                    $wpdb->update($departuresTable, $departureData, ['id' => $exists]);
                    $migrated++;
                } else {
                    $inserted = $wpdb->insert($departuresTable, $departureData);
                    if ($inserted) {
                        $migrated++;
                    } else {
                        $failed++;
                        Logger::error("Failed to insert departure: {$wpdb->last_error}", [
                            'source' => 'migration', 'data_type' => 'tour_dates'
                        ]);
                    }
                }

                $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);

            } catch (\Exception $e) {
                $failed++;
                $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        }

        return compact('migrated', 'skipped', 'failed');
    }

    /**
     * Re-run destination linking for every legacy tour that already has a migrated trip row.
     * Needed when "trips" migrated before "destinations" (term meta did not exist yet).
     */
    public function repairTripDestinationsForAllLegacyTours(): void
    {
        $ids = $this->wpdb->get_col(
            "SELECT ID FROM {$this->wpdb->posts} WHERE post_type = 'tour' AND post_status != 'auto-draft'"
        );
        $n = 0;
        foreach ($ids as $oldId) {
            $oldId = (int) $oldId;
            $newTripId = $this->getMigratedTripId($oldId);
            if (!$newTripId) {
                continue;
            }
            $this->migrateTripDestinations($oldId, $newTripId);
            $n++;
        }
        if ($n > 0) {
            Logger::info("Trip–destination link pass: checked {$n} legacy tour(s) with a migrated trip id.", [
                'source' => 'migration',
            ]);
        }
    }

    /**
     * Re-run activity linking for every legacy tour that already has a migrated trip row.
     */
    public function repairTripActivitiesForAllLegacyTours(): void
    {
        $ids = $this->wpdb->get_col(
            "SELECT ID FROM {$this->wpdb->posts} WHERE post_type = 'tour' AND post_status != 'auto-draft'"
        );
        $n = 0;
        foreach ($ids as $oldId) {
            $oldId = (int) $oldId;
            $newTripId = $this->getMigratedTripId($oldId);
            if (!$newTripId) {
                continue;
            }
            $this->migrateTripActivities($oldId, $newTripId);
            $n++;
        }
        if ($n > 0) {
            Logger::info("Trip–activity link pass: checked {$n} legacy tour(s) with a migrated trip id.", [
                'source' => 'migration',
            ]);
        }
    }

    /**
     * Map a legacy taxonomy term to ClassificationsTable.id after taxonomy migration.
     *
     * Prefer term meta from DestinationMigration/ActivityMigration (handles slug de-duplication e.g. paris vs paris-1).
     */
    private function resolveLegacyTermToClassificationId(
        int $termId,
        string $termSlug,
        string $termName,
        string $legacyTaxonomy,
        string $classificationType
    ): ?int {
        $classificationsTable = ClassificationsTable::getTableName();
        $metaKey = '_yatra_migrated_' . $legacyTaxonomy . '_id';

        $mapped = $this->getRawTermMetaLatest($termId, $metaKey);
        if ($mapped !== null && $mapped !== '') {
            $id = (int) trim((string) $mapped);
            if ($id > 0) {
                $ok = $this->wpdb->get_var($this->wpdb->prepare(
                    "SELECT id FROM {$classificationsTable} WHERE id = %d AND type = %s",
                    $id,
                    $classificationType
                ));
                if ($ok) {
                    return (int) $ok;
                }
            }
        }

        $slug = trim((string) $termSlug);
        if ($slug !== '') {
            $bySlug = $this->wpdb->get_var($this->wpdb->prepare(
                "SELECT id FROM {$classificationsTable} WHERE slug = %s AND type = %s",
                $slug,
                $classificationType
            ));
            if ($bySlug) {
                return (int) $bySlug;
            }
        }

        $name = trim((string) $termName);
        if ($name !== '' && function_exists('sanitize_title')) {
            $fromName = sanitize_title($name);
            if ($fromName !== '' && $fromName !== $slug) {
                $byNameSlug = $this->wpdb->get_var($this->wpdb->prepare(
                    "SELECT id FROM {$classificationsTable} WHERE slug = %s AND type = %s",
                    $fromName,
                    $classificationType
                ));
                if ($byNameSlug) {
                    return (int) $byNameSlug;
                }
            }
        }

        if ($name !== '') {
            $byName = $this->wpdb->get_var($this->wpdb->prepare(
                "SELECT id FROM {$classificationsTable} WHERE type = %s AND name = %s LIMIT 1",
                $classificationType,
                $name
            ));
            if ($byName) {
                return (int) $byName;
            }
        }

        return null;
    }
    
    /**
     * Migrate trip destinations relationship.
     *
     * Uses raw SQL to query wp_term_relationships + wp_term_taxonomy + wp_terms
     * because the old 'destination' taxonomy is NOT registered in the new plugin.
     * Inserts into ClassificationsTable (type=destination) looked up by slug,
     * and links via TripClassificationsTable.
     */
    public function migrateTripDestinations(int $oldTripId, int $newTripId): void
    {
        // Raw SQL: get terms assigned to this post via the 'destination' taxonomy
        $destinations = $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT t.term_id, t.name, t.slug
             FROM {$this->wpdb->terms} t
             INNER JOIN {$this->wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
             INNER JOIN {$this->wpdb->term_relationships} tr ON tt.term_taxonomy_id = tr.term_taxonomy_id
             WHERE tr.object_id = %d AND tt.taxonomy = 'destination'",
            $oldTripId
        ));

        if (empty($destinations)) {
            return;
        }

        $tripClassificationsTable = TripClassificationsTable::getTableName();

        foreach ($destinations as $index => $destination) {
            $termId = (int) $destination->term_id;
            $newDestinationId = $this->resolveLegacyTermToClassificationId(
                $termId,
                (string) ($destination->slug ?? ''),
                (string) ($destination->name ?? ''),
                'destination',
                ClassificationTypes::DESTINATION
            );

            if (!$newDestinationId) {
                Logger::warning('Could not map legacy destination term to a classification row; skipping trip link.', [
                    'source' => 'migration',
                    'old_trip_id' => $oldTripId,
                    'new_trip_id' => $newTripId,
                    'term_id' => $termId,
                    'term_slug' => $destination->slug ?? '',
                    'term_name' => $destination->name ?? '',
                ]);
                continue;
            }

            $exists = $this->wpdb->get_var($this->wpdb->prepare(
                "SELECT id FROM {$tripClassificationsTable}
                 WHERE trip_id = %d AND classification_id = %d AND classification_type = %s",
                $newTripId,
                $newDestinationId,
                ClassificationTypes::DESTINATION
            ));

            if (!$exists) {
                $inserted = $this->wpdb->insert(
                    $tripClassificationsTable,
                    [
                        'trip_id' => $newTripId,
                        'classification_id' => $newDestinationId,
                        'classification_type' => ClassificationTypes::DESTINATION,
                        'relationship_type' => ($index === 0) ? 'primary' : 'secondary',
                        'sort_order' => $index,
                        'is_featured' => ($index === 0) ? 1 : 0,
                        'is_active' => 1,
                        'created_at' => current_time('mysql'),
                        'updated_at' => current_time('mysql'),
                    ]
                );
                if ($inserted === false) {
                    Logger::error('Failed to insert trip–destination classification row: ' . $this->wpdb->last_error, [
                        'source' => 'migration',
                        'new_trip_id' => $newTripId,
                        'classification_id' => $newDestinationId,
                    ]);
                }
            }
        }
    }

    /**
     * Migrate trip activities relationship.
     *
     * Uses raw SQL to query wp_term_relationships + wp_term_taxonomy + wp_terms
     * because the old 'activity' taxonomy is NOT registered in the new plugin.
     * Inserts into ClassificationsTable (type=activity) looked up by slug,
     * and links via TripClassificationsTable.
     */
    public function migrateTripActivities(int $oldTripId, int $newTripId): void
    {
        // Raw SQL: get terms assigned to this post via the 'activity' taxonomy
        $activities = $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT t.term_id, t.name, t.slug
             FROM {$this->wpdb->terms} t
             INNER JOIN {$this->wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
             INNER JOIN {$this->wpdb->term_relationships} tr ON tt.term_taxonomy_id = tr.term_taxonomy_id
             WHERE tr.object_id = %d AND tt.taxonomy = 'activity'",
            $oldTripId
        ));

        if (empty($activities)) {
            return;
        }

        $tripClassificationsTable = TripClassificationsTable::getTableName();

        foreach ($activities as $index => $activity) {
            $termId = (int) $activity->term_id;
            $newActivityId = $this->resolveLegacyTermToClassificationId(
                $termId,
                (string) ($activity->slug ?? ''),
                (string) ($activity->name ?? ''),
                'activity',
                ClassificationTypes::ACTIVITY
            );

            if (!$newActivityId) {
                Logger::warning('Could not map legacy activity term to a classification row; skipping trip link.', [
                    'source' => 'migration',
                    'old_trip_id' => $oldTripId,
                    'new_trip_id' => $newTripId,
                    'term_id' => $termId,
                    'term_slug' => $activity->slug ?? '',
                    'term_name' => $activity->name ?? '',
                ]);
                continue;
            }

            $exists = $this->wpdb->get_var($this->wpdb->prepare(
                "SELECT id FROM {$tripClassificationsTable}
                 WHERE trip_id = %d AND classification_id = %d AND classification_type = %s",
                $newTripId,
                $newActivityId,
                ClassificationTypes::ACTIVITY
            ));

            if (!$exists) {
                $inserted = $this->wpdb->insert(
                    $tripClassificationsTable,
                    [
                        'trip_id' => $newTripId,
                        'classification_id' => $newActivityId,
                        'classification_type' => ClassificationTypes::ACTIVITY,
                        'relationship_type' => ($index === 0) ? 'primary' : 'secondary',
                        'sort_order' => $index,
                        'is_featured' => ($index === 0) ? 1 : 0,
                        'is_active' => 1,
                        'created_at' => current_time('mysql'),
                        'updated_at' => current_time('mysql'),
                    ]
                );
                if ($inserted === false) {
                    Logger::error('Failed to insert trip–activity classification row: ' . $this->wpdb->last_error, [
                        'source' => 'migration',
                        'new_trip_id' => $newTripId,
                        'classification_id' => $newActivityId,
                    ]);
                }
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
        $migrationMetaKeys = [
            '_migrated_to_trip_id',
            '_migrated_to_coupon_id',
            '_migrated_to_customer_id',
            '_migrated_to_booking_id',
            '_migrated_to_payment_id',
        ];
        foreach ($migrationMetaKeys as $metaKey) {
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
     * Clear trip classification relationships before re-inserting fresh links.
     * Uses the unified TripClassificationsTable (not old separate tables).
     */
    public function deleteTripRelationships(int $tripId): void
    {
        $tripClassificationsTable = TripClassificationsTable::getTableName();

        // Delete all classification relationships for this trip (destinations, activities, attributes, etc.)
        $this->wpdb->delete(
            $tripClassificationsTable,
            ['trip_id' => $tripId],
            ['%d']
        );
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

        $this->kickQueueRunner();
    }
}
