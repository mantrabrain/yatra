<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Constants\ClassificationTypes;
use Yatra\Database\Tables\BookingsTable;
use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Database\Tables\DiscountsTable;
use Yatra\Database\Tables\TripItineraryDayEntryTable;
use Yatra\Database\Tables\TripItineraryDaysTable;
use Yatra\Repositories\ExportImportRepository;
use Yatra\Utils\Logger;

/**
 * Export/Import Service
 * 
 * Handles background export and import processing using Action Scheduler.
 * Jobs are queued and processed asynchronously to avoid PHP timeout issues.
 */
class ExportImportService
{
    private ExportImportRepository $repository;
    
    private const EXPORT_ACTION = 'yatra_process_export_job';
    private const IMPORT_ACTION = 'yatra_process_import_job';
    private const JOB_OPTION_PREFIX = 'yatra_job_';
    private const BATCH_SIZE = 500;

    /**
     * Unprefixed physical table names (Yatra 3.x uses yatra_* — not legacy yatra_trips, etc.).
     *
     * @var array<string, string>
     */
    private const TABLE_SUFFIX_MAP = [
        'trips' => 'yatra_trips',
        'bookings' => 'yatra_bookings',
        'customers' => 'yatra_customers',
        'reviews' => 'yatra_reviews',
        'payments' => 'yatra_booking_payments',
        'enquiries' => 'yatra_enquiries',
        'discounts' => 'yatra_discounts',
        'travelers' => 'yatra_booking_travellers',
        'traveler_meta' => 'yatra_booking_traveller_meta',
        'availability' => 'yatra_trip_availability_dates',
        'availability_rules' => 'yatra_trip_availability_rules',
        'departures' => 'yatra_trip_departures',
        'booking_departures' => 'yatra_booking_departures',
        'trip_classifications' => 'yatra_trip_classifications',
        'trip_content' => 'yatra_trip_content',
        'trip_revisions' => 'yatra_trip_revisions',
    ];

    /**
     * Free core map + optional suffixes from Yatra Pro (or other add-ons) via
     * {@see 'yatra_export_import_table_map'}.
     *
     * @return array<string, string> data_type_key => table suffix without wp_prefix
     */
    private static function getMergedTableMap(): array
    {
        return array_merge(self::TABLE_SUFFIX_MAP, (array) apply_filters('yatra_export_import_table_map', []));
    }

    public function __construct()
    {
        $this->repository = new ExportImportRepository();
    }

    /**
     * Get MySQL version
     */
    public function getMySQLVersion(): string
    {
        return $this->repository->getMySQLVersion();
    }

    /**
     * Get job options for user
     */
    public function getJobOptionsForUser(int $userId): array
    {
        return $this->repository->getJobOptionsForUser($userId);
    }

    /**
     * Register Action Scheduler hooks
     */
    public static function register(): void
    {
        add_action(self::EXPORT_ACTION, [self::class, 'processExportJob'], 10, 1);
        add_action(self::IMPORT_ACTION, [self::class, 'processImportJob'], 10, 1);
    }

    /**
     * Nudge WP-Cron and run Action Scheduler pending actions so queued export/import jobs
     * actually start during the REST request (same approach as {@see MigrationProgress::kickQueueRunner}).
     */
    private static function kickActionSchedulerQueue(): void
    {
        if (function_exists('spawn_cron')) {
            spawn_cron();
        }

        try {
            if (class_exists(\ActionScheduler::class)) {
                $runner = \ActionScheduler::runner();
                if ($runner !== null && method_exists($runner, 'run')) {
                    $runner->run();

                    return;
                }
            }

            if (class_exists(\ActionScheduler_QueueRunner::class)) {
                $runner = \ActionScheduler_QueueRunner::instance();
                if ($runner !== null && method_exists($runner, 'run')) {
                    $runner->run();
                }
            }
        } catch (\Throwable $e) {
            Logger::warning('Action Scheduler queue kick failed: ' . $e->getMessage(), [
                'source' => 'export_import',
            ]);
        }
    }

    /**
     * Create a new export job
     * 
     * @param array $dataTypes Data types to export
     * @param int $userId User who requested the export
     * @return string Job ID
     */
    public static function createExportJob(array $dataTypes, int $userId): string
    {
        $dataTypes = self::normalizeExportDataTypes($dataTypes);

        $jobId = 'export_' . uniqid() . '_' . time();
        
        // Store job metadata in options
        $jobData = [
            'id' => $jobId,
            'type' => 'export',
            'status' => 'pending',
            'data_types' => $dataTypes,
            'user_id' => $userId,
            'progress' => 0,
            'total_records' => 0,
            'processed_records' => 0,
            'file_path' => '',
            'file_url' => '',
            'error' => '',
            'created_at' => current_time('mysql'),
            'started_at' => null,
            'completed_at' => null,
        ];
        
        update_option(self::JOB_OPTION_PREFIX . $jobId, $jobData, false);
        
        // Schedule with Action Scheduler, then kick the runner so work starts in this request
        // (otherwise many hosts leave jobs pending until WP-Cron, and the UI stays at 0/0).
        if (function_exists('as_enqueue_async_action')) {
            as_enqueue_async_action(self::EXPORT_ACTION, [$jobId], 'yatra');
            self::kickActionSchedulerQueue();
            $fresh = self::getJobStatus($jobId);
            if ($fresh && ($fresh['status'] ?? '') === 'pending') {
                self::processExportJob($jobId);
            }
        } else {
            self::processExportJob($jobId);
        }
        
        Logger::info("Export job created: {$jobId}");
        
        return $jobId;
    }

    /**
     * Create a new import job
     * 
     * @param string $filePath Path to the import file
     * @param array $dataTypes Data types to import
     * @param int $userId User who requested the import
     * @return string Job ID
     */
    public static function createImportJob(string $filePath, array $dataTypes, int $userId): string
    {
        $importAll = in_array('all', $dataTypes, true);
        $dataTypes = array_values(array_filter(
            array_unique($dataTypes),
            static function ($t) {
                return is_string($t) && $t !== 'all';
            }
        ));

        $jobId = 'import_' . uniqid() . '_' . time();
        
        $jobData = [
            'id' => $jobId,
            'type' => 'import',
            'status' => 'pending',
            'data_types' => $dataTypes,
            'import_all' => $importAll,
            'user_id' => $userId,
            'file_path' => $filePath,
            'progress' => 0,
            'total_records' => 0,
            'processed_records' => 0,
            'error' => '',
            'created_at' => current_time('mysql'),
            'started_at' => null,
            'completed_at' => null,
        ];
        
        update_option(self::JOB_OPTION_PREFIX . $jobId, $jobData, false);
        
        if (function_exists('as_enqueue_async_action')) {
            as_enqueue_async_action(self::IMPORT_ACTION, [$jobId], 'yatra');
            self::kickActionSchedulerQueue();
            $fresh = self::getJobStatus($jobId);
            if ($fresh && ($fresh['status'] ?? '') === 'pending') {
                self::processImportJob($jobId);
            }
        } else {
            self::processImportJob($jobId);
        }
        
        Logger::info("Import job created: {$jobId}");
        
        return $jobId;
    }

    /**
     * Get job status
     * 
     * @param string $jobId Job ID
     * @return array|null Job data or null if not found
     */
    public static function getJobStatus(string $jobId): ?array
    {
        $jobData = get_option(self::JOB_OPTION_PREFIX . $jobId);
        return $jobData ?: null;
    }

    /**
     * Update job status
     * 
     * @param string $jobId Job ID
     * @param array $updates Fields to update
     */
    private static function updateJob(string $jobId, array $updates): void
    {
        $jobData = get_option(self::JOB_OPTION_PREFIX . $jobId);
        if ($jobData) {
            $jobData = array_merge($jobData, $updates);
            update_option(self::JOB_OPTION_PREFIX . $jobId, $jobData, false);
        }
    }

    /**
     * Process export job (called by Action Scheduler)
     * 
     * @param string $jobId Job ID
     */
    public static function processExportJob(string $jobId): void
    {
        $repository = new ExportImportRepository();
        global $wpdb;
        
        $jobData = self::getJobStatus($jobId);
        if (!$jobData) {
            Logger::error("Export job not found: {$jobId}");
            return;
        }

        $status = $jobData['status'] ?? '';
        if ($status === 'completed' || $status === 'failed') {
            return;
        }
        if ($status === 'running') {
            return;
        }
        if ($status !== 'pending') {
            return;
        }
        
        // Mark as running
        self::updateJob($jobId, [
            'status' => 'running',
            'started_at' => current_time('mysql'),
        ]);
        
        try {
            $dataTypes = $jobData['data_types'] ?? [];
            $exportData = [
                'version' => YATRA_VERSION,
                'export_date' => current_time('mysql'),
                'job_id' => $jobId,
                'data' => []
            ];
            
            $processedRecords = 0;
            
            $expandedTypes = self::expandDataTypesForExport($dataTypes);

            $settingsBundleForExport = null;
            if ($dataTypes === [] || in_array('settings', $dataTypes, true)) {
                $settingsBundleForExport = self::collectAllYatraOptionsForExport();
            }
            $settingsWeight = $settingsBundleForExport !== null ? max(1, count($settingsBundleForExport)) : 0;

            $totalRecords = self::countExportRecords($expandedTypes) + $settingsWeight;
            self::updateJob($jobId, ['total_records' => $totalRecords]);
            
            foreach ($expandedTypes as $dataType) {
                if ($dataType === 'settings') {
                    continue;
                }

                if ($dataType === 'itinerary') {
                    $daysTable = TripItineraryDaysTable::getTableName();
                    $entriesTable = TripItineraryDayEntryTable::getTableName();
                    $allDays = [];
                    $allEntries = [];

                    if ($repository->tableExists($daysTable)) {
                        $dayTotal = $repository->getRecordCount($daysTable);
                        for ($offset = 0; $offset < $dayTotal; $offset += self::BATCH_SIZE) {
                            $batch = $repository->getBatchRecords($daysTable, $offset, self::BATCH_SIZE);
                            $allDays = array_merge($allDays, $batch);
                            $processedRecords += count($batch);
                            $progress = $totalRecords > 0 ? round(($processedRecords / $totalRecords) * 100) : 0;
                            self::updateJob($jobId, [
                                'processed_records' => $processedRecords,
                                'progress' => $progress,
                            ]);
                        }
                    }

                    if ($repository->tableExists($entriesTable)) {
                        $entryTotal = $repository->getRecordCount($entriesTable);
                        for ($offset = 0; $offset < $entryTotal; $offset += self::BATCH_SIZE) {
                            $batch = $repository->getBatchRecords($entriesTable, $offset, self::BATCH_SIZE);
                            $allEntries = array_merge($allEntries, $batch);
                            $processedRecords += count($batch);
                            $progress = $totalRecords > 0 ? round(($processedRecords / $totalRecords) * 100) : 0;
                            self::updateJob($jobId, [
                                'processed_records' => $processedRecords,
                                'progress' => $progress,
                            ]);
                        }
                    }

                    $exportData['data']['itinerary'] = [
                        'days' => $allDays,
                        'entries' => $allEntries,
                    ];
                    continue;
                }

                $classType = self::classificationTypeForDataType($dataType);
                if ($classType !== null) {
                    $tableName = ClassificationsTable::getTableName();
                    if (!$repository->tableExists($tableName)) {
                        $exportData['data'][$dataType] = [];
                        continue;
                    }
                    $total = $repository->getClassificationCount($tableName, $classType);
                    $records = [];
                    for ($offset = 0; $offset < $total; $offset += self::BATCH_SIZE) {
                        $batch = $repository->getClassificationBatch($tableName, $classType, $offset, self::BATCH_SIZE);
                        $records = array_merge($records, $batch);
                        $processedRecords += count($batch);
                        $progress = $totalRecords > 0 ? round(($processedRecords / $totalRecords) * 100) : 0;
                        self::updateJob($jobId, [
                            'processed_records' => $processedRecords,
                            'progress' => $progress,
                        ]);
                    }
                    $exportData['data'][$dataType] = $records;
                    continue;
                }

                $tableMap = self::getMergedTableMap();
                if (!isset($tableMap[$dataType])) {
                    continue;
                }
                
                $tableName = $wpdb->prefix . $tableMap[$dataType];
                if (!$repository->tableExists($tableName)) {
                    $exportData['data'][$dataType] = [];
                    continue;
                }
                
                $total = $repository->getRecordCount($tableName);
                $records = [];
                
                for ($offset = 0; $offset < $total; $offset += self::BATCH_SIZE) {
                    $batch = $repository->getBatchRecords($tableName, $offset, self::BATCH_SIZE);
                    $records = array_merge($records, $batch);
                    $processedRecords += count($batch);
                    
                    $progress = $totalRecords > 0 ? round(($processedRecords / $totalRecords) * 100) : 0;
                    self::updateJob($jobId, [
                        'processed_records' => $processedRecords,
                        'progress' => $progress,
                    ]);
                }
                
                $exportData['data'][$dataType] = $records;
            }
            
            if ($settingsBundleForExport !== null) {
                $exportData['data']['settings'] = (array) apply_filters('yatra_export_settings_bundle', $settingsBundleForExport);
                $processedRecords += $settingsWeight;
                $progress = $totalRecords > 0 ? min(100, (int) round(($processedRecords / $totalRecords) * 100)) : 100;
                self::updateJob($jobId, [
                    'processed_records' => $processedRecords,
                    'progress' => $progress,
                ]);
            }
            
            // Write to file
            $uploadDir = wp_upload_dir();
            $exportDir = $uploadDir['basedir'] . '/yatra-exports';
            
            if (!file_exists($exportDir)) {
                wp_mkdir_p($exportDir);
                // Add .htaccess to protect directory
                file_put_contents($exportDir . '/.htaccess', 'deny from all');
            }
            
            $filename = 'yatra-export-' . date('Y-m-d-H-i-s') . '-' . substr($jobId, 0, 8) . '.json';
            $filePath = $exportDir . '/' . $filename;
            $fileUrl = $uploadDir['baseurl'] . '/yatra-exports/' . $filename;
            
            file_put_contents($filePath, json_encode($exportData, JSON_PRETTY_PRINT));
            
            // Mark as completed
            self::updateJob($jobId, [
                'status' => 'completed',
                'progress' => 100,
                'file_path' => $filePath,
                'file_url' => $fileUrl,
                'completed_at' => current_time('mysql'),
            ]);
            
            Logger::info("Export job completed: {$jobId}, file: {$filename}");
            
        } catch (\Exception $e) {
            self::updateJob($jobId, [
                'status' => 'failed',
                'error' => $e->getMessage(),
                'completed_at' => current_time('mysql'),
            ]);
            Logger::error("Export job failed: {$jobId}, error: " . $e->getMessage());
        }
    }

    /**
     * Process import job (called by Action Scheduler)
     * 
     * @param string $jobId Job ID
     */
    public static function processImportJob(string $jobId): void
    {
        // Per-job state: without this a second import in the same request would
        // inherit the first one's "already here" set.
        self::$importPreExisting = [];
        self::$importSkippedOldIds = [];

        $repository = new ExportImportRepository();
        global $wpdb;
        
        $jobData = self::getJobStatus($jobId);
        if (!$jobData) {
            Logger::error("Import job not found: {$jobId}");
            return;
        }

        $status = $jobData['status'] ?? '';
        if ($status === 'completed' || $status === 'failed') {
            return;
        }
        if ($status === 'running') {
            return;
        }
        if ($status !== 'pending') {
            return;
        }
        
        // Mark as running
        self::updateJob($jobId, [
            'status' => 'running',
            'started_at' => current_time('mysql'),
            'import_stats' => [], // Initialize import statistics
        ]);
        
        try {
            $filePath = $jobData['file_path'] ?? '';
            $dataTypes = $jobData['data_types'] ?? [];
            
            if (!file_exists($filePath)) {
                throw new \Exception('Import file not found');
            }
            
            $content = file_get_contents($filePath);
            $jsonError = null;
            
            // Add detailed JSON error logging
            $importData = json_decode($content, true);
            switch (json_last_error()) {
                case JSON_ERROR_NONE:
                    break;
                case JSON_ERROR_DEPTH:
                    $jsonError = 'Maximum stack depth exceeded';
                    break;
                case JSON_ERROR_STATE_MISMATCH:
                    $jsonError = 'Underflow or the modes mismatch';
                    break;
                case JSON_ERROR_CTRL_CHAR:
                    $jsonError = 'Unexpected control character found';
                    break;
                case JSON_ERROR_SYNTAX:
                    $jsonError = 'Syntax error, malformed JSON';
                    break;
                case JSON_ERROR_UTF8:
                    $jsonError = 'Malformed UTF-8 characters';
                    break;
                default:
                    $jsonError = 'Unknown JSON error';
                    break;
            }
            
            if ($jsonError) {
                Logger::error("JSON decode error: {$jsonError}, file: {$filePath}");
                throw new \Exception('Invalid JSON format: ' . $jsonError);
            }
            
            if (!$importData) {
                Logger::error("Empty import data, file: {$filePath}");
                throw new \Exception('Empty import data');
            }
            
            // Handle both formats: direct data array or wrapped in 'data' key
            if (isset($importData['data'])) {
                // Standard format with 'data' wrapper
                $dataContainer = $importData['data'];
            } else if (is_array($importData) && !empty($importData)) {
                // Direct data format without wrapper
                $dataContainer = $importData;
            } else {
                Logger::error("No valid data structure found in import file: {$filePath}");
                throw new \Exception('Invalid import file format: No data structure found');
            }
            
            if (!empty($jobData['import_all'])) {
                $dataTypes = array_keys($dataContainer);
            }

            $dataTypes = self::sortImportDataTypes($dataTypes);

            /**
             * Last chance to create any table the file needs.
             *
             * Yatra Pro deliberately does not create its tables on activation —
             * each module creates its own when it is switched on. That is fine
             * for a running site and wrong for a restore: a backup taken from a
             * site that used Email Automation, Dynamic Pricing or Consent Forms
             * arrives at a fresh install whose tables for those do not exist
             * yet, and every one of those rows was counted as a failure and
             * dropped. On the migration this was tested against that silently
             * lost 2,440 rows — the entire email history, pricing history and
             * template set.
             *
             * Pro listens for this and brings its tables into being so the data
             * has somewhere to land; whether the operator later switches those
             * modules on is a separate decision from whether their data survived
             * the move.
             *
             * @param list<string> $dataTypes Data types present in the file.
             */
            do_action('yatra_export_import_prepare_tables', $dataTypes);

            $mapper = new ExportImportIdMapper();

            $totalRecords = 0;
            foreach ($dataTypes as $dt) {
                if (!isset($dataContainer[$dt])) {
                    continue;
                }
                $payload = $dataContainer[$dt];
                if ($dt === 'itinerary' && is_array($payload) && isset($payload['days'], $payload['entries']) && is_array($payload['days']) && is_array($payload['entries'])) {
                    $totalRecords += count($payload['days']) + count($payload['entries']);
                } elseif ($dt === 'settings' && is_array($payload)) {
                    $totalRecords += max(1, count($payload));
                } elseif (is_array($payload)) {
                    $totalRecords += count($payload);
                }
            }
            
            self::updateJob($jobId, ['total_records' => $totalRecords]);
            
            $processedRecords = 0;
            $importStats = [];
            
            foreach ($dataTypes as $dataType) {
                if ($dataType === 'settings') {
                    if (!isset($dataContainer['settings']) || !is_array($dataContainer['settings'])) {
                        Logger::warning('Skipping settings: not found or invalid in import file');
                    continue;
                }
                    $settingsRows = $dataContainer['settings'];
                    self::importSettings($settingsRows);
                    $n = max(1, is_array($settingsRows) ? count($settingsRows) : 0);
                    $importStats['settings'] = ['total' => $n, 'imported' => $n, 'failed' => 0];
                    $processedRecords += $n;
                    $progress = $totalRecords > 0 ? round(($processedRecords / $totalRecords) * 100) : 0;
                    self::updateJob($jobId, [
                        'processed_records' => $processedRecords,
                        'progress' => $progress,
                    ]);
                    continue;
                }
                
                if ($dataType === 'itinerary') {
                    if (!isset($dataContainer['itinerary']) || !is_array($dataContainer['itinerary'])) {
                        Logger::warning('Skipping itinerary: not found in import file');
                    continue;
                }
                    $payload = $dataContainer['itinerary'];
                    if (!isset($payload['days'], $payload['entries']) || !is_array($payload['days']) || !is_array($payload['entries'])) {
                        Logger::warning('Skipping itinerary: expected { days, entries } from Yatra 3 export; legacy flat arrays are not supported');
                        continue;
                    }
                    $daysTable = TripItineraryDaysTable::getTableName();
                    $entriesTable = TripItineraryDayEntryTable::getTableName();
                    $dayTotal = count($payload['days']);
                    $entryTotal = count($payload['entries']);
                    $importStats['itinerary'] = [
                        'total' => $dayTotal + $entryTotal,
                        'imported' => 0,
                        'failed' => 0,
                        'skipped' => 0,
                    ];
                
                    foreach (array_chunk($payload['days'], self::BATCH_SIZE) as $batch) {
                    foreach ($batch as $record) {
                        $record = (array) $record;
                            $oldDayId = (int) ($record['id'] ?? 0);
                            unset($record['id']);
                            try {
                                // Itinerary has its own import path, so it needs the
                                // same recognition the main loop does: a trip already
                                // here already has its days, and re-inserting them is
                                // what made every one of these fail on a second run.
                                $oldTripIdForDay = (int) ($record['trip_id'] ?? 0);
                                if ($oldTripIdForDay > 0 && !empty(self::$importSkippedOldIds['trips'][$oldTripIdForDay])) {
                                    $importStats['itinerary']['skipped'] = ($importStats['itinerary']['skipped'] ?? 0) + 1;
                                    if ($oldDayId > 0) {
                                        self::$importSkippedOldIds['itinerary_days'][$oldDayId] = true;
                                    }
                                    continue;
                                }

                                if (isset($record['trip_id'])) {
                                    $mappedTrip = $mapper->map('trips', $record['trip_id']);
                                    $record['trip_id'] = $mappedTrip;
                                }
                                if (empty($record['trip_id'])) {
                                    $importStats['itinerary']['failed']++;
                                    continue;
                                }
                                $tableColumns = $repository->getTableColumns($daysTable);
                            $filteredRecord = [];
                            foreach ($record as $key => $value) {
                                    if (in_array($key, $tableColumns, true)) {
                                    $filteredRecord[$key] = $value;
                                }
                            }
                                if ($filteredRecord === []) {
                                    $importStats['itinerary']['failed']++;
                                    continue;
                                }
                                $newId = $repository->insertRecordReturningId($daysTable, $filteredRecord);
                                if ($newId === null) {
                                    $importStats['itinerary']['failed']++;
                                    continue;
                                }
                                    $processedRecords++;
                                $importStats['itinerary']['imported']++;
                                if ($oldDayId > 0) {
                                    $mapper->remember('itinerary_days', $oldDayId, $newId);
                            }
                        } catch (\Exception $e) {
                                Logger::error('Itinerary day import error: ' . $e->getMessage());
                                $importStats['itinerary']['failed']++;
                            }
                        }
                        $progress = $totalRecords > 0 ? round(($processedRecords / $totalRecords) * 100) : 0;
                        self::updateJob($jobId, [
                            'processed_records' => $processedRecords,
                            'progress' => $progress,
                        ]);
                    }

                    foreach (array_chunk($payload['entries'], self::BATCH_SIZE) as $batch) {
                        foreach ($batch as $record) {
                            $record = (array) $record;
                            unset($record['id']);
                            try {
                                $oldDayRef = (int) ($record['day_id'] ?? 0);
                                if ($oldDayRef > 0 && !empty(self::$importSkippedOldIds['itinerary_days'][$oldDayRef])) {
                                    $importStats['itinerary']['skipped'] = ($importStats['itinerary']['skipped'] ?? 0) + 1;
                                    continue;
                                }

                                if (isset($record['day_id'])) {
                                    $record['day_id'] = $mapper->map('itinerary_days', $record['day_id']);
                                }
                                if (isset($record['trip_id'])) {
                                    $record['trip_id'] = $mapper->map('trips', $record['trip_id']);
                                }
                                if (array_key_exists('item_type_id', $record)) {
                                    $record['item_type_id'] = $mapper->mapFkNullable('classifications', $record['item_type_id']);
                                }
                                if (array_key_exists('item_id', $record)) {
                                    $record['item_id'] = $mapper->mapFkNullable('classifications', $record['item_id']);
                                }
                                if (empty($record['day_id']) || empty($record['trip_id'])) {
                                    $importStats['itinerary']['failed']++;
                                    continue;
                                }
                                $tableColumns = $repository->getTableColumns($entriesTable);
                                $filteredRecord = [];
                                foreach ($record as $key => $value) {
                                    if (in_array($key, $tableColumns, true)) {
                                        $filteredRecord[$key] = $value;
                                    }
                                }
                                if ($filteredRecord === []) {
                                    $importStats['itinerary']['failed']++;
                                    continue;
                                }
                                $newId = $repository->insertRecordReturningId($entriesTable, $filteredRecord);
                                if ($newId === null) {
                                    $importStats['itinerary']['failed']++;
                                    continue;
                                }
                                $processedRecords++;
                                $importStats['itinerary']['imported']++;
                            } catch (\Exception $e) {
                                Logger::error('Itinerary entry import error: ' . $e->getMessage());
                                $importStats['itinerary']['failed']++;
                            }
                        }
                    $progress = $totalRecords > 0 ? round(($processedRecords / $totalRecords) * 100) : 0;
                    self::updateJob($jobId, [
                        'processed_records' => $processedRecords,
                        'progress' => $progress,
                    ]);
                }

                    Logger::info(
                        "Imported itinerary: {$importStats['itinerary']['imported']} ok, {$importStats['itinerary']['failed']} failed"
                    );
                    continue;
                }

                if (!isset($dataContainer[$dataType]) || !is_array($dataContainer[$dataType])) {
                    Logger::warning("Skipping data type not found in import file: {$dataType}");
                    continue;
                }

                $mergedMap = self::getMergedTableMap();
                $classType = self::classificationTypeForDataType($dataType);
                if ($classType !== null) {
                    $tableName = ClassificationsTable::getTableName();
                } elseif (isset($mergedMap[$dataType])) {
                    $tableName = $wpdb->prefix . $mergedMap[$dataType];
                } else {
                    Logger::warning("Skipping unknown import data type: {$dataType}");
                    continue;
                }

                self::importTableRowsWithMapping(
                    $repository,
                    $mapper,
                    $jobId,
                    $dataType,
                    $tableName,
                    $dataContainer[$dataType],
                    $processedRecords,
                    $totalRecords,
                    $importStats
                );
            }
            
            // Mark as completed with detailed statistics
            self::updateJob($jobId, [
                'status' => 'completed',
                'progress' => 100,
                'completed_at' => current_time('mysql'),
                'import_stats' => $importStats,
                'processed_records' => $processedRecords,
                'seen_notification' => false, // Flag to track if notification has been seen
            ]);
            
            // Clean up import file
            @unlink($filePath);
            
            Logger::info("Import job completed: {$jobId}, records: {$processedRecords}, stats: " . json_encode($importStats));
            
        } catch (\Exception $e) {
            self::updateJob($jobId, [
                'status' => 'failed',
                'error' => $e->getMessage(),
                'completed_at' => current_time('mysql'),
            ]);
            Logger::error("Import job failed: {$jobId}, error: " . $e->getMessage());
        }
    }

    /**
     * @param string[] $dataTypes
     * @return string[]
     */
    private static function normalizeExportDataTypes(array $dataTypes): array
    {
        $dataTypes = array_values(array_filter($dataTypes, static function ($t): bool {
            return is_string($t) && $t !== '';
        }));
        if (in_array('all', $dataTypes, true)) {
            return self::getAllExportableTypeKeys();
        }

        return array_values(array_unique($dataTypes));
    }

    /**
     * @return string[]
     */
    private static function getAllExportableTypeKeys(): array
    {
        $base = [
            'settings',
            'destinations',
            'activities',
            'categories',
            'difficulty_levels',
            // The classifications table holds eight kinds of row and only the
            // four above were ever exported. Traveller categories, attributes
            // and itinerary item types are operator-configured data too, and
            // leaving them out silently dropped them from every backup — and
            // took the trip links that pointed at them down with it, because
            // those could no longer resolve on import.
            'traveler_categories',
            'attributes',
            'itinerary_item_types',
            'itinerary_items',
            'trips',
            'itinerary',
        ];
        $mergedKeys = array_keys(self::getMergedTableMap());
        $keys = array_values(array_unique(array_merge($base, $mergedKeys)));

        return array_values(array_unique((array) apply_filters('yatra_export_all_data_types', $keys)));
    }

    /**
     * Rows found to be already present during the current import, as
     * entity => [id => true]. Children of these are skipped: the parent is
     * already here, so its children are too.
     *
     * @var array<string, array<int, bool>>
     */
    private static $importPreExisting = [];

    /**
     * Export-side ids skipped during this import, as entity => [oldId => true].
     *
     * Needed for depth: when a booking is recognised, its travellers are skipped
     * too, and those travellers never get an id mapping — so their meta rows had
     * nothing to resolve `traveller_id` against and were rejected. Remembering
     * the skip by export id lets the whole subtree be skipped cleanly.
     *
     * @var array<string, array<int, bool>>
     */
    private static $importSkippedOldIds = [];

    /**
     * Natural-key columns that are themselves foreign keys, so they hold the
     * export's id and must be translated to this site's before matching.
     *
     * @var array<string, array<string, string>> dataType => [column => entity]
     */
    private const IMPORT_NATURAL_KEY_FKS = [
        'availability' => ['trip_id' => 'trips'],
    ];

    /**
     * Business identity per data type, used to recognise a row the importer has
     * already brought in.
     *
     * Import inserts every row with a fresh id, so without this a second run
     * duplicated everything that had no unique constraint (bookings, trip
     * content, availability) and rejected everything that had one — on a real
     * site that meant all 69 customers failing because `uk_email` refused them.
     * Matching on the natural key instead lets an existing row be reused.
     *
     * @var array<string, list<string>>
     */
    private const IMPORT_NATURAL_KEYS = [
        'trips'            => ['slug'],
        'customers'        => ['email'],
        'bookings'         => ['reference'],
        'discounts'        => ['code'],
        'email_templates'  => ['template_key'],
        'consent_requests' => ['token'],
        'availability'     => ['trip_id', 'departure_date', 'departure_time'],

        // The four taxonomies share one table, which already carries a UNIQUE
        // KEY on (type, slug). Without an identity here the slug was handed to
        // ensureUniqueSlug() first, which renamed "hiking" to "hiking-i1" and so
        // re-imported every term as a new one instead of recognising it.
        'destinations'      => ['type', 'slug'],
        'activities'        => ['type', 'slug'],
        'categories'        => ['type', 'slug'],
        'difficulty_levels' => ['type', 'slug'],
        'traveler_categories'  => ['type', 'slug'],
        'attributes'           => ['type', 'slug'],
        'itinerary_item_types' => ['type', 'slug'],
        'itinerary_items'      => ['type', 'slug'],

        // Catalogue rows an operator maintains by name. Nothing about them is
        // unique at the database level, so a re-import simply added a second
        // "Trip Liability Waiver" beside the first. The name alone would be the
        // obvious key, but nothing stops a site holding two services called
        // "Transfer" at different prices, and keying on the name would drop one
        // of them from a restore. Each key therefore carries enough of the row
        // to tell two genuinely different ones apart, while an unchanged row
        // still matches itself exactly.
        'additional_service_catalog' => ['name', 'price', 'price_type', 'price_per'],
        'consent_forms'              => ['name', 'version'],
        'dynamic_pricing_rules'      => ['name', 'rule_type', 'adjustment_type', 'adjustment_value'],

        // email_logs deliberately has no natural key. The obvious candidate,
        // (recipient_email, template_key, sent_at), collides on real data — a
        // 1,231-row log here held 419 rows that share one with another row,
        // because a booking can send the same template to the same address
        // within the same second. Keying on it would silently drop those rows
        // from a restore, and losing history is worse than repeating it, so a
        // re-import appends the log again rather than risk discarding it.
    ];

    /**
     * Owning parent for rows that carry no identity of their own.
     *
     * A trip's content, itinerary and departures belong to that trip. When the
     * trip is recognised as already present its children are already present
     * too, so re-inserting them is what produced duplicate itineraries and
     * duplicate departure rows on a second import.
     *
     * @var array<string, array{0: string, 1: string}> dataType => [entity, fk column]
     */
    private const IMPORT_PRIMARY_PARENT = [
        'trip_classifications'        => [['trips', 'trip_id']],
        'trip_content'                => [['trips', 'trip_id']],
        'trip_revisions'              => [['trips', 'trip_id']],
        'itinerary'                   => [['trips', 'trip_id']],
        'availability_rules'          => [['trips', 'trip_id']],
        'departures'                  => [['trips', 'trip_id']],
        'reviews'                     => [['trips', 'trip_id']],
        'enquiries'                   => [['trips', 'trip_id']],
        'pricing_history'             => [['trips', 'trip_id']],
        'trip_demand_scores'          => [['trips', 'trip_id']],
        'trip_additional_services'    => [['trips', 'trip_id'], ['services', 'service_id']],
        'trip_consent_forms'          => [['trips', 'trip_id'], ['consent_forms', 'form_id']],
        // Two parents, and either is enough: a booking_departures row cannot be
        // new if the departure it points at is already here. This is what left
        // 240 of them failing — departures are skipped as children of a trip, so
        // they carry no id mapping and `departure_id` could not resolve.
        'booking_departures'          => [['bookings', 'booking_id'], ['departures', 'departure_id']],
        'booking_additional_services' => [['bookings', 'booking_id'], ['services', 'service_id']],
        'travelers'                   => [['bookings', 'booking_id']],
        'payments'                    => [['bookings', 'booking_id']],
        'google_calendar_events'      => [['bookings', 'booking_id'], ['departures', 'departure_id']],
        'signed_consents'             => [['bookings', 'booking_id'], ['consent_forms', 'form_id']],
        'traveler_meta'               => [['travelers', 'traveller_id']],
        'recovery_email_logs'         => [['abandoned_bookings', 'abandoned_booking_id']],
        'abandoned_bookings'          => [['trips', 'trip_id']],
        'email_sequence_steps'        => [['email_sequences', 'sequence_id']],
        'email_queue'                 => [['email_sequences', 'sequence_id']],
    ];

    /**
     * Id of the row this site already holds for the record being imported, or
     * null when it is genuinely new.
     *
     * Two ways a row can already be here: it carries a business key that
     * matches (a trip slug, a customer email), or it is a child of a parent we
     * just recognised, in which case the parent brought its children with it.
     *
     * Returns [skip, existingId]. existingId is only meaningful for a natural-key
     * match — a child skipped because its parent was already here has no row of
     * its own to map to, and mapping it to the parent's id would corrupt anything
     * referencing the child (traveller meta being the obvious one).
     *
     * @param array<string, mixed> $record
     * @return array{0: bool, 1: int|null}
     */
    private static function findExistingRowId(
        ExportImportRepository $repository,
        string $tableName,
        string $dataType,
        array $record,
        ExportImportIdMapper $mapper
    ): array {
        $naturalKeys = (array) apply_filters('yatra_import_natural_keys', self::IMPORT_NATURAL_KEYS);

        if (isset($naturalKeys[$dataType])) {
            $criteria = [];
            foreach ((array) $naturalKeys[$dataType] as $column) {
                if (!array_key_exists($column, $record)) {
                    return [false, null];
                }
                $value = $record[$column];

                // A null part of a composite key is meaningful — an availability
                // date with no departure time is still that date — so it is
                // matched as IS NULL rather than abandoning the lookup. Only a
                // key that is empty in every part identifies nothing.
                if ($value === null || $value === '') {
                    $criteria[$column] = null;
                    continue;
                }
                if (!is_scalar($value)) {
                    return [false, null];
                }

                $keyFks = self::IMPORT_NATURAL_KEY_FKS[$dataType] ?? [];
                if (isset($keyFks[$column])) {
                    $mapped = $mapper->map($keyFks[$column], $value);
                    if ($mapped === null) {
                        // Parent not on this site: nothing here can match.
                        return [false, null];
                    }
                    $value = $mapped;
                }

                $criteria[$column] = $value;
            }

            if ($criteria === [] || count(array_filter($criteria, static fn($v) => $v !== null)) === 0) {
                return [false, null];
            }

            $existingId = $repository->findRowIdBy($tableName, $criteria);

            return $existingId !== null ? [true, $existingId] : [false, null];
        }

        $parents = (array) apply_filters('yatra_import_primary_parent', self::IMPORT_PRIMARY_PARENT);
        foreach ((array) ($parents[$dataType] ?? []) as $parent) {
            [$parentEntity, $fkColumn] = $parent;
            if (empty($record[$fkColumn])) {
                continue;
            }
            $parentOldId = (int) $record[$fkColumn];

            // Matched on the export's id rather than ours: a skipped row has no
            // id here, so anything hanging off it could not be resolved any
            // other way.
            if ($parentOldId > 0 && !empty(self::$importSkippedOldIds[$parentEntity][$parentOldId])) {
                return [true, null];
            }

            $mappedParentId = (int) $mapper->map($parentEntity, $record[$fkColumn]);
            if ($mappedParentId > 0 && !empty(self::$importPreExisting[$parentEntity][$mappedParentId])) {
                return [true, null];
            }
        }

        return [false, null];
    }

    /**
     * @param array<int, mixed> $records
     * @param array<string, array{total: int, imported: int, failed: int}> $importStats
     */
    private static function importTableRowsWithMapping(
        ExportImportRepository $repository,
        ExportImportIdMapper $mapper,
        string $jobId,
        string $dataType,
        string $tableName,
        array $records,
        int &$processedRecords,
        int $totalRecords,
        array &$importStats
    ): void {
        global $wpdb;

        $importStats[$dataType] = [
            'total' => count($records),
            'imported' => 0,
            'failed' => 0,
            'skipped' => 0,
        ];
        Logger::info('Importing ' . $dataType . ': Found ' . count($records) . ' records');

        foreach (array_chunk($records, self::BATCH_SIZE) as $batch) {
            foreach ($batch as $record) {
                $record = (array) $record;
                $oldId = (int) ($record['id'] ?? 0);
                unset($record['id']);

                try {
                    // Recognise a row this site already has. Deliberately before the
                    // ensureUnique* helpers below, which would otherwise rename the
                    // very value being matched on ("SUMMER10" -> "SUMMER10-i1") and
                    // turn every re-import into a fresh duplicate.
                    [$alreadyHere, $existingId] = self::findExistingRowId($repository, $tableName, $dataType, $record, $mapper);
                    if ($alreadyHere) {
                        $importStats[$dataType]['skipped']++;
                        $entity = self::entityKeyForDataType($dataType);
                        if ($entity !== null && $oldId > 0) {
                            self::$importSkippedOldIds[$entity][$oldId] = true;
                        }
                        if ($entity !== null && $oldId > 0 && $existingId !== null) {
                            // Point this export's id at the row already here, so
                            // children attach to it instead of dangling.
                            $mapper->remember($entity, $oldId, $existingId);
                            self::$importPreExisting[$entity][$existingId] = true;
                        }
                        continue;
                    }

                    self::applyForeignKeyRemapping($mapper, $dataType, $record);

                    if ($dataType === 'bookings' && isset($record['reference']) && $record['reference'] !== '') {
                        $record['reference'] = self::ensureUniqueBookingReference((string) $record['reference']);
                    }

                    if (in_array($dataType, ['dynamic_pricing_rules', 'email_sequences'], true)) {
                        if (array_key_exists('trip_ids', $record) && $record['trip_ids'] !== null && $record['trip_ids'] !== '') {
                            $record['trip_ids'] = self::remapTripIdsTextField($mapper, (string) $record['trip_ids']);
                        }
                    }

                    if ($dataType === 'consent_requests' && isset($record['token']) && $record['token'] !== '') {
                        $record['token'] = self::ensureUniqueConsentRequestToken((string) $record['token']);
                    }

                    if ($dataType === 'email_templates' && isset($record['template_key']) && $record['template_key'] !== '') {
                        $record['template_key'] = self::ensureUniqueEmailTemplateKey((string) $record['template_key']);
                    }

                    if ($dataType === 'discounts') {
                        if (array_key_exists('trip_ids', $record)) {
                            $tripIdsVal = $record['trip_ids'];
                            $record['trip_ids'] = self::remapDiscountTripIdsField(
                                $mapper,
                                $tripIdsVal === null ? null : (string) $tripIdsVal
                            );
                        }
                        if (isset($record['code']) && $record['code'] !== '') {
                            $record['code'] = self::ensureUniqueDiscountCode((string) $record['code']);
                        }
                    }

                    if (self::rowHasInvalidRequiredFks($dataType, $record)) {
                        $importStats[$dataType]['failed']++;
                        continue;
                    }

                    $tableColumns = $repository->getTableColumns($tableName);
                    $filteredRecord = [];
                    foreach ($record as $key => $value) {
                        if (in_array($key, $tableColumns, true)) {
                            $filteredRecord[$key] = $value;
                        }
                    }

                    if ($filteredRecord === []) {
                        $importStats[$dataType]['failed']++;
                        continue;
                    }

                    if (isset($filteredRecord['slug'])) {
                        $suffix = str_replace($wpdb->prefix, '', $tableName);
                        $filteredRecord['slug'] = \Yatra\Helpers\SlugHelper::generateUniqueFromDatabase(
                            (string) $filteredRecord['slug'],
                            $suffix,
                            'slug'
                        );
                    }

                    $newId = $repository->insertRecordReturningId($tableName, $filteredRecord);
                    if ($newId === null) {
                        $importStats[$dataType]['failed']++;
                        continue;
                    }

                    $processedRecords++;
                    $importStats[$dataType]['imported']++;

                    $entity = self::entityKeyForDataType($dataType);
                    if ($entity !== null && $oldId > 0) {
                        $mapper->remember($entity, $oldId, $newId);
                    }
                } catch (\Exception $e) {
                    Logger::error('Error importing ' . $dataType . ': ' . $e->getMessage());
                    $importStats[$dataType]['failed']++;
                }
            }

            $progress = $totalRecords > 0 ? round(($processedRecords / $totalRecords) * 100) : 0;
            self::updateJob($jobId, [
                'processed_records' => $processedRecords,
                'progress' => $progress,
            ]);
        }
    }

    private static function entityKeyForDataType(string $dataType): ?string
    {
        switch ($dataType) {
            case 'destinations':
            case 'activities':
            case 'categories':
            case 'difficulty_levels':
            case 'traveler_categories':
            case 'attributes':
            case 'itinerary_item_types':
            case 'itinerary_items':
                return 'classifications';
            case 'trips':
                return 'trips';
            case 'customers':
                return 'customers';
            case 'bookings':
                return 'bookings';
            case 'payments':
                return 'payments';
            case 'availability':
                return 'availability';
            case 'departures':
                return 'departures';
            case 'travelers':
                return 'travelers';
            case 'discounts':
                return 'discounts';
            case 'additional_service_catalog':
                return 'services';
            case 'consent_forms':
                return 'consent_forms';
            case 'signed_consents':
                return 'signed_consents';
            case 'consent_requests':
                return 'consent_requests';
            case 'dynamic_pricing_rules':
                return 'dynamic_pricing_rules';
            case 'abandoned_bookings':
                return 'abandoned_bookings';
            case 'email_templates':
                return 'email_templates';
            case 'email_sequences':
                return 'email_sequences';
            case 'email_sequence_steps':
                return 'email_sequence_steps';
            default:
                return null;
        }
    }

    private static function rowHasInvalidRequiredFks(string $dataType, array $row): bool
    {
        switch ($dataType) {
            case 'trip_classifications':
                return empty($row['trip_id'] ?? null) || empty($row['classification_id'] ?? null);
            case 'trip_content':
            case 'trip_revisions':
            case 'availability_rules':
            case 'availability':
            case 'departures':
            case 'trip_additional_services':
                return empty($row['trip_id'] ?? null);
            case 'trip_consent_forms':
                return empty($row['trip_id'] ?? null) || empty($row['form_id'] ?? null);
            case 'pricing_history':
            case 'trip_demand_scores':
                return empty($row['trip_id'] ?? null);
            case 'consent_requests':
                return empty($row['form_id'] ?? null) || empty($row['booking_id'] ?? null);
            case 'signed_consents':
                return empty($row['form_id'] ?? null);
            case 'abandoned_bookings':
                return empty($row['trip_id'] ?? null);
            case 'recovery_email_logs':
                return empty($row['abandoned_booking_id'] ?? null);
            case 'email_sequence_steps':
                return empty($row['sequence_id'] ?? null);
            case 'booking_departures':
            case 'travelers':
            case 'payments':
                return empty($row['booking_id'] ?? null);
            case 'traveler_meta':
                return empty($row['traveller_id'] ?? null);
            case 'booking_additional_services':
                return empty($row['booking_id'] ?? null) || empty($row['service_id'] ?? null);
            case 'bookings':
                return empty($row['trip_id'] ?? null);
            case 'reviews':
                return empty($row['trip_id'] ?? null);
            default:
                return false;
        }
    }

    private static function applyForeignKeyRemapping(ExportImportIdMapper $m, string $dataType, array &$row): void
    {
        switch ($dataType) {
            case 'trips':
                if (array_key_exists('difficulty_level', $row)) {
                    $row['difficulty_level'] = $m->mapFkNullable('classifications', $row['difficulty_level']);
                }
                break;
            case 'trip_classifications':
                if (isset($row['trip_id'])) {
                    $row['trip_id'] = $m->map('trips', $row['trip_id']);
                }
                if (isset($row['classification_id'])) {
                    $row['classification_id'] = $m->map('classifications', $row['classification_id']);
                }
                break;
            case 'trip_content':
            case 'trip_revisions':
                if (isset($row['trip_id'])) {
                    $row['trip_id'] = $m->map('trips', $row['trip_id']);
                }
                break;
            case 'availability_rules':
            case 'availability':
                if (isset($row['trip_id'])) {
                    $row['trip_id'] = $m->map('trips', $row['trip_id']);
                }
                break;
            case 'departures':
                if (isset($row['trip_id'])) {
                    $row['trip_id'] = $m->map('trips', $row['trip_id']);
                }
                break;
            case 'trip_additional_services':
                if (isset($row['trip_id'])) {
                    $row['trip_id'] = $m->map('trips', $row['trip_id']);
                }
                if (isset($row['service_id'])) {
                    $row['service_id'] = $m->map('services', $row['service_id']);
                }
                break;
            case 'bookings':
                if (isset($row['trip_id'])) {
                    $row['trip_id'] = $m->map('trips', $row['trip_id']);
                }
                if (array_key_exists('customer_id', $row)) {
                    $row['customer_id'] = $m->mapFkNullable('customers', $row['customer_id']);
                }
                if (array_key_exists('availability_id', $row)) {
                    $row['availability_id'] = $m->mapFkNullable('availability', $row['availability_id']);
                }
                break;
            case 'booking_departures':
                if (isset($row['booking_id'])) {
                    $row['booking_id'] = $m->map('bookings', $row['booking_id']);
                }
                if (isset($row['departure_id'])) {
                    $row['departure_id'] = $m->map('departures', $row['departure_id']);
                }
                break;
            case 'booking_additional_services':
                if (isset($row['booking_id'])) {
                    $row['booking_id'] = $m->map('bookings', $row['booking_id']);
                }
                if (isset($row['service_id'])) {
                    $row['service_id'] = $m->map('services', $row['service_id']);
                }
                break;
            case 'travelers':
                if (isset($row['booking_id'])) {
                    $row['booking_id'] = $m->map('bookings', $row['booking_id']);
                }
                break;
            case 'traveler_meta':
                if (isset($row['traveller_id'])) {
                    $row['traveller_id'] = $m->map('travelers', $row['traveller_id']);
                }
                break;
            case 'payments':
                if (isset($row['booking_id'])) {
                    $row['booking_id'] = $m->map('bookings', $row['booking_id']);
                }
                if (array_key_exists('customer_id', $row)) {
                    $row['customer_id'] = $m->mapFkNullable('customers', $row['customer_id']);
                }
                break;
            case 'google_calendar_events':
                if (isset($row['booking_id']) && (int) $row['booking_id'] !== 0) {
                    $mapped = $m->map('bookings', $row['booking_id']);
                    $row['booking_id'] = $mapped ?? 0;
                }
                if (array_key_exists('departure_id', $row)) {
                    $row['departure_id'] = $m->mapFkNullable('departures', $row['departure_id']);
                }
                break;
            case 'reviews':
                if (isset($row['trip_id'])) {
                    $row['trip_id'] = $m->map('trips', $row['trip_id']);
                }
                break;
            case 'enquiries':
                if (array_key_exists('trip_id', $row)) {
                    $row['trip_id'] = $m->mapFkNullable('trips', $row['trip_id']);
                }
                break;
            case 'destinations':
            case 'activities':
            case 'categories':
            case 'difficulty_levels':
                if (array_key_exists('parent_id', $row)) {
                    $row['parent_id'] = $m->mapFkNullable('classifications', $row['parent_id']);
                }
                break;
            case 'trip_consent_forms':
                if (isset($row['trip_id'])) {
                    $row['trip_id'] = $m->map('trips', $row['trip_id']);
                }
                if (isset($row['form_id'])) {
                    $row['form_id'] = $m->map('consent_forms', $row['form_id']);
                }
                break;
            case 'signed_consents':
                if (isset($row['form_id'])) {
                    $row['form_id'] = $m->map('consent_forms', $row['form_id']);
                }
                if (array_key_exists('booking_id', $row)) {
                    $row['booking_id'] = $m->mapFkNullable('bookings', $row['booking_id']);
                }
                break;
            case 'consent_requests':
                if (isset($row['form_id'])) {
                    $row['form_id'] = $m->map('consent_forms', $row['form_id']);
                }
                if (isset($row['booking_id'])) {
                    $row['booking_id'] = $m->map('bookings', $row['booking_id']);
                }
                if (array_key_exists('signed_consent_id', $row)) {
                    $row['signed_consent_id'] = $m->mapFkNullable('signed_consents', $row['signed_consent_id']);
                }
                break;
            case 'pricing_history':
            case 'trip_demand_scores':
                if (isset($row['trip_id'])) {
                    $row['trip_id'] = $m->map('trips', $row['trip_id']);
                }
                break;
            case 'abandoned_bookings':
                if (isset($row['trip_id'])) {
                    $row['trip_id'] = $m->map('trips', $row['trip_id']);
                }
                if (array_key_exists('recovered_booking_id', $row)) {
                    $row['recovered_booking_id'] = $m->mapFkNullable('bookings', $row['recovered_booking_id']);
                }
                break;
            case 'recovery_email_logs':
                if (isset($row['abandoned_booking_id'])) {
                    $row['abandoned_booking_id'] = $m->map('abandoned_bookings', $row['abandoned_booking_id']);
                }
                break;
            case 'email_sequence_steps':
                if (isset($row['sequence_id'])) {
                    $row['sequence_id'] = $m->map('email_sequences', $row['sequence_id']);
                }
                if (array_key_exists('template_id', $row)) {
                    $row['template_id'] = $m->mapFkNullable('email_templates', $row['template_id']);
                }
                break;
            case 'email_queue':
                if (array_key_exists('sequence_id', $row)) {
                    $row['sequence_id'] = $m->mapFkNullable('email_sequences', $row['sequence_id']);
                }
                if (array_key_exists('step_id', $row)) {
                    $row['step_id'] = $m->mapFkNullable('email_sequence_steps', $row['step_id']);
                }
                if (array_key_exists('template_id', $row)) {
                    $row['template_id'] = $m->mapFkNullable('email_templates', $row['template_id']);
                }
                break;
            case 'email_logs':
                if (array_key_exists('template_id', $row)) {
                    $row['template_id'] = $m->mapFkNullable('email_templates', $row['template_id']);
                }
                if (array_key_exists('sequence_id', $row)) {
                    $row['sequence_id'] = $m->mapFkNullable('email_sequences', $row['sequence_id']);
                }
                break;
            default:
                break;
        }
    }

    /**
     * Remap trip id lists stored as JSON array, comma-separated ids, or a single id (Pro + discounts).
     */
    private static function remapTripIdsTextField(ExportImportIdMapper $m, string $value): string
    {
        $trimmed = trim($value);
        if ($trimmed === '' || $trimmed === '[]') {
            return $value;
        }

        $decoded = json_decode($trimmed, true);
        if (is_array($decoded)) {
            $out = [];
            foreach ($decoded as $tid) {
                $new = $m->map('trips', $tid);
                if ($new !== null) {
                    $out[] = $new;
                }
            }

            return json_encode($out);
        }

        if (strpos($trimmed, ',') !== false) {
            $parts = preg_split('/\s*,\s*/', $trimmed) ?: [];
            $out = [];
            foreach ($parts as $p) {
                if ($p === '') {
                    continue;
                }
                $new = $m->map('trips', $p);
                if ($new !== null) {
                    $out[] = (string) $new;
                }
            }

            return implode(',', $out);
        }

        $single = $m->map('trips', $trimmed);

        return $single !== null ? (string) $single : '';
    }

    /**
     * Does this table exist?
     *
     * The import de-duplicates keys against tables owned by Yatra Pro modules.
     * On a free-only site — or one where the owning module has never been
     * enabled — those tables are absent, and probing one logs a database error
     * for every record imported. Nothing to collide with in that case, so the
     * callers below keep the incoming value.
     *
     * Cached for the request: each caller runs once per imported row.
     */
    private static function tableExists(string $table): bool
    {
        static $cache = [];

        if (!array_key_exists($table, $cache)) {
            global $wpdb;
            $cache[$table] = (bool) $wpdb->get_var(
                $wpdb->prepare('SHOW TABLES LIKE %s', $table)
            );
        }

        return $cache[$table];
    }

    private static function ensureUniqueConsentRequestToken(string $token): string
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_consent_requests';

        // Trip Consent is a Pro module; without it there is no table to clash with.
        if (!self::tableExists($table)) {
            return $token;
        }

        $base = $token;
        $candidate = $base;
        for ($n = 0; $n < 5000; $n++) {
            $exists = (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM `{$table}` WHERE `token` = %s",
                    $candidate
                )
            );
            if ($exists === 0) {
                return $candidate;
            }
            $candidate = $base . '-' . wp_generate_password(8, false);
        }

        return $base . '-' . wp_generate_password(12, false);
    }

    private static function ensureUniqueEmailTemplateKey(string $key): string
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_email_templates';

        // Email Automation is a Pro module; without it there is no table to clash with.
        if (!self::tableExists($table)) {
            return $key;
        }

        $base = $key;
        $candidate = $base;
        for ($n = 0; $n < 5000; $n++) {
            $exists = (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM `{$table}` WHERE `template_key` = %s",
                    $candidate
                )
            );
            if ($exists === 0) {
                return $candidate;
            }
            $candidate = $base . '-i' . ($n + 1);
        }

        return $base . '-' . wp_generate_password(6, false);
    }

    private static function ensureUniqueDiscountCode(string $code): string
    {
        global $wpdb;
        $table = DiscountsTable::getTableName();
        $base = $code;
        $candidate = $base;
        for ($n = 0; $n < 5000; $n++) {
            $exists = (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM `{$table}` WHERE `code` = %s",
                    $candidate
                )
            );
            if ($exists === 0) {
                return $candidate;
            }
            $candidate = $base . '-i' . ($n + 1);
        }

        return $base . '-' . wp_generate_password(6, false);
    }

    private static function ensureUniqueBookingReference(string $reference): string
    {
        global $wpdb;
        $table = BookingsTable::getTableName();
        $base = $reference;
        $candidate = $base;
        for ($n = 0; $n < 5000; $n++) {
            $exists = (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM `{$table}` WHERE `reference` = %s",
                    $candidate
                )
            );
            if ($exists === 0) {
                return $candidate;
            }
            $candidate = $base . '-i' . ($n + 1);
        }

        return $base . '-' . wp_generate_password(6, false);
    }

    private static function remapDiscountTripIdsField(ExportImportIdMapper $m, ?string $tripIdsJson): ?string
    {
        if ($tripIdsJson === null || $tripIdsJson === '') {
            return $tripIdsJson;
        }
        $decoded = json_decode($tripIdsJson, true);
        if (!is_array($decoded)) {
            return $tripIdsJson;
        }

        return self::remapTripIdsTextField($m, $tripIdsJson);
    }

    private static function classificationTypeForDataType(string $dataType): ?string
    {
        switch ($dataType) {
            case 'destinations':
                return ClassificationTypes::DESTINATION;
            case 'activities':
                return ClassificationTypes::ACTIVITY;
            case 'categories':
                return ClassificationTypes::CATEGORY;
            case 'difficulty_levels':
                return ClassificationTypes::DIFFICULTY;
            case 'traveler_categories':
                return ClassificationTypes::TRAVELER_TYPE;
            case 'attributes':
                return ClassificationTypes::ATTRIBUTE;
            case 'itinerary_item_types':
                return ClassificationTypes::ITEM_TYPE;
            case 'itinerary_items':
                return ClassificationTypes::ITEM;
            default:
                return null;
        }
    }

    /**
     * @param string[] $dataTypes
     * @return string[]
     */
    private static function expandDataTypesForExport(array $dataTypes): array
    {
        $out = array_values(array_unique($dataTypes));

        if (in_array('trips', $out, true)) {
            foreach (['trip_classifications', 'trip_content', 'trip_revisions'] as $extra) {
                if (!in_array($extra, $out, true)) {
                    $out[] = $extra;
                }
            }
        }
        if (in_array('travelers', $out, true) && !in_array('traveler_meta', $out, true)) {
            $out[] = 'traveler_meta';
        }
        if (in_array('bookings', $out, true) && !in_array('booking_departures', $out, true)) {
            $out[] = 'booking_departures';
        }
        if (in_array('availability', $out, true) && !in_array('availability_rules', $out, true)) {
            $out[] = 'availability_rules';
        }
        return apply_filters('yatra_export_import_expand_types', $out, $dataTypes);
    }

    /**
     * Best-effort ordering so parents (classifications, trips) import before dependents.
     *
     * @param string[] $dataTypes
     * @return string[]
     */
    private static function sortImportDataTypes(array $dataTypes): array
    {
        $order = [
            'settings',
            'destinations',
            'activities',
            'categories',
            'difficulty_levels',
            'traveler_categories',
            'attributes',
            'itinerary_item_types',
            'itinerary_items',
            'additional_service_catalog',
            'consent_forms',
            'email_templates',
            'email_sequences',
            'email_sequence_steps',
            'trips',
            'trip_content',
            'trip_classifications',
            'trip_revisions',
            'itinerary',
            'availability_rules',
            'availability',
            'trip_additional_services',
            'trip_consent_forms',
            'dynamic_pricing_rules',
            'trip_demand_scores',
            'pricing_history',
            'departures',
            'customers',
            'bookings',
            'booking_departures',
            'booking_additional_services',
            'signed_consents',
            'consent_requests',
            'abandoned_bookings',
            'recovery_email_logs',
            'recovery_statistics',
            'email_queue',
            'email_logs',
            'travelers',
            'traveler_meta',
            'payments',
            'google_calendar_events',
            'reviews',
            'enquiries',
            'discounts',
        ];
        $dataTypes = array_values(array_unique($dataTypes));
        usort($dataTypes, static function (string $a, string $b) use ($order): int {
            $ia = array_search($a, $order, true);
            $ib = array_search($b, $order, true);
            $ia = $ia === false ? 999 : $ia;
            $ib = $ib === false ? 999 : $ib;

            return $ia <=> $ib;
        });

        return $dataTypes;
    }

    /**
     * Count total records to export (must stay aligned with {@see processExportJob()}).
     */
    private static function countExportRecords(array $dataTypes): int
    {
        global $wpdb;
        $repository = new ExportImportRepository();
        $total = 0;
        
        foreach ($dataTypes as $dataType) {
            if ($dataType === 'settings') {
                continue;
            }
            if ($dataType === 'itinerary') {
                $daysTable = TripItineraryDaysTable::getTableName();
                $entriesTable = TripItineraryDayEntryTable::getTableName();
                if ($repository->tableExists($daysTable)) {
                    $total += $repository->getRecordCount($daysTable);
                }
                if ($repository->tableExists($entriesTable)) {
                    $total += $repository->getRecordCount($entriesTable);
                }
                continue;
            }
            $classType = self::classificationTypeForDataType($dataType);
            if ($classType !== null) {
                $tableName = ClassificationsTable::getTableName();
                if ($repository->tableExists($tableName)) {
                    $total += $repository->getClassificationCount($tableName, $classType);
                }
                continue;
            }
            $merged = self::getMergedTableMap();
            if (!isset($merged[$dataType])) {
                continue;
            }
            $tableName = $wpdb->prefix . $merged[$dataType];
            if ($repository->tableExists($tableName)) {
                $total += $repository->getRecordCount($tableName);
            }
        }
        
        return $total;
    }

    /**
     * @return array<string, mixed>
     */
    private static function collectAllYatraOptionsForExport(): array
    {
        global $wpdb;

        $rows = $wpdb->get_results(
            "SELECT option_name, option_value FROM {$wpdb->options} 
             WHERE option_name LIKE 'yatra_%' 
             AND option_name NOT LIKE 'yatra_job_%' 
             AND option_name NOT LIKE 'yatra_migration_%'"
        );
        if (!is_array($rows)) {
            return [];
        }

        $out = [];
        foreach ($rows as $row) {
            $name = (string) $row->option_name;
            if (strpos($name, 'yatra_transient') === 0) {
                continue;
            }
            $out[$name] = maybe_unserialize($row->option_value);
        }

        return $out;
    }

    /**
     * Import settings
     */
    private static function importSettings(array $settings): void
    {
        $permalinkChanged = false;

        foreach ($settings as $key => $value) {
            if (!is_string($key) || strpos($key, 'yatra_') !== 0) {
                continue;
            }
            if (!preg_match('/^[a-zA-Z0-9_\-]+$/', $key)) {
                continue;
            }

            if (!$permalinkChanged && self::settingAffectsPermalinks($key)) {
                $existing = get_option($key, null);
                if ($existing !== $value) {
                    $permalinkChanged = true;
                }
            }

            update_option($key, $value);
        }

        // Settings are cached per request, so without this the rest of the
        // import still sees the pre-import values.
        if (class_exists(\Yatra\Services\SettingsService::class)) {
            \Yatra\Services\SettingsService::reload();
        }

        // A restored permalink base rewrites the trip and taxonomy URLs, but the
        // rules behind them are only rebuilt on a flush. Without this the site
        // keeps serving the old structure until someone happens to open
        // Settings > Permalinks — until then trip links resolve to nothing and
        // WordPress sends the visitor to the front page.
        if ($permalinkChanged) {
            // Deliberately not flush_rewrite_rules() here: the rules currently in
            // memory were built during init from the pre-import bases, so
            // regenerating now would just write the stale set back. Clearing the
            // cached rules makes WordPress rebuild them on the next request, by
            // which time init has read the imported values.
            delete_option('rewrite_rules');
            Logger::info('Import changed permalink settings; cached rewrite rules cleared for rebuild.');
        }
    }

    /**
     * Does this option take part in building URLs?
     */
    private static function settingAffectsPermalinks(string $key): bool
    {
        return (bool) preg_match('/_base$|_prefix$|_segment$|permalink/i', $key);
    }

    /**
     * Delete a job and its associated files
     * 
     * @param string $jobId Job ID
     */
    public static function deleteJob(string $jobId): bool
    {
        $jobData = self::getJobStatus($jobId);
        
        if (!$jobData) {
            return false;
        }
        
        // Delete export file if exists
        if (!empty($jobData['file_path'])) {
            if (file_exists($jobData['file_path'])) {
                $deleted = unlink($jobData['file_path']);
                if (!$deleted) {
                    Logger::error("Failed to delete export file: {$jobData['file_path']}");
                } else {
                    Logger::info("Successfully deleted export file: {$jobData['file_path']}");
                }
            } else {
                Logger::warning("Export file not found for deletion: {$jobData['file_path']}");
            }
        }
        
        // Instead of deleting the option, mark it as deleted
        // This ensures it won't show up in active jobs but will be cleaned up later
        $jobData['status'] = 'deleted';
        $jobData['deleted_at'] = current_time('mysql');
        update_option(self::JOB_OPTION_PREFIX . $jobId, $jobData, false);
        
        return true;
    }

    /**
     * Get active jobs for a user (pending, running, or recently completed)
     * 
     * @param int $userId User ID
     * @return array List of active jobs
     */
    public static function getActiveJobs(int $userId): array
    {
        $repository = new ExportImportRepository();
        
        $options = $repository->getAllJobOptions();
        
        $jobs = [];
        $cutoff = strtotime('-1 hour'); // Show jobs from last hour
        
        foreach ($options as $option) {
            $jobData = maybe_unserialize($option->option_value);
            
            if (!is_array($jobData)) {
                continue;
            }
            
            // Filter by user
            if (($jobData['user_id'] ?? 0) !== $userId) {
                continue;
            }
            
            // Only include pending/running jobs
            // Completed jobs should not be shown again after page refresh
            $status = $jobData['status'] ?? '';
            
            if ($status === 'pending' || $status === 'running') {
                $jobs[] = $jobData;
            }
        }
        
        // Sort by created_at descending
        usort($jobs, function($a, $b) {
            return strtotime($b['created_at'] ?? '0') - strtotime($a['created_at'] ?? '0');
        });
        
        return $jobs;
    }

    /**
     * Clean up old completed jobs (older than 24 hours)
     */
    public static function cleanupOldJobs(): void
    {
        $repository = new ExportImportRepository();
        
        $options = $repository->getAllJobOptions();
        
        $cutoff = strtotime('-24 hours');
        
        foreach ($options as $option) {
            $jobData = maybe_unserialize($option->option_value);
            
            if (!is_array($jobData)) {
                continue;
            }
            
            $completedAt = $jobData['completed_at'] ?? null;
            
            if ($completedAt && strtotime($completedAt) < $cutoff) {
                $jobId = str_replace(self::JOB_OPTION_PREFIX, '', $option->option_name);
                self::deleteJob($jobId);
            }
        }
    }

    /**
     * Export data from a specific table with batch processing
     */
    private static function exportTableData(string $table_name, int $batch_size): array
    {
        $repository = new ExportImportRepository();
        
        // Check if table exists
        $table_exists = $repository->tableExists($table_name);
        if (!$table_exists) {
            return [];
        }

        // Get total records
        $total_records = $repository->getRecordCount($table_name);
        if ($total_records === 0) {
            return [];
        }

        $data = [];
        
        // Process in batches to avoid memory issues
        for ($offset = 0; $offset < $total_records; $offset += $batch_size) {
            $batch = $repository->getBatchRecords($table_name, $offset, $batch_size);
            
            if ($batch) {
                $data = array_merge($data, $batch);
            }
        }

        return $data;
    }

      /**
     * Get export summary statistics
     */
    public static function getExportSummary(): array
    {
        $tables = [];
        
        $summary = [
            'total_tables' => 0,
            'existing_tables' => 0,
            'total_records' => 0,
            'tables' => $tables
        ];

        foreach ($tables as $table) {
            $summary['total_tables']++;
            if ($table['exists']) {
                $summary['existing_tables']++;
                $summary['total_records'] += $table['record_count'];
            }
        }

        return $summary;
    }
}
