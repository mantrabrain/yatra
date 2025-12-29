<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Utils\Logger;
use Yatra\Repositories\ExportImportRepository;

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
     * Create a new export job
     * 
     * @param array $dataTypes Data types to export
     * @param int $userId User who requested the export
     * @return string Job ID
     */
    public static function createExportJob(array $dataTypes, int $userId): string
    {
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
        
        // Schedule the job with Action Scheduler
        if (function_exists('as_enqueue_async_action')) {
            as_enqueue_async_action(self::EXPORT_ACTION, [$jobId], 'yatra');
        } else {
            // Fallback: process immediately if Action Scheduler not available
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
        $jobId = 'import_' . uniqid() . '_' . time();
        
        $jobData = [
            'id' => $jobId,
            'type' => 'import',
            'status' => 'pending',
            'data_types' => $dataTypes,
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
        
        // Schedule the job with Action Scheduler
        if (function_exists('as_enqueue_async_action')) {
            as_enqueue_async_action(self::IMPORT_ACTION, [$jobId], 'yatra');
        } else {
            // Fallback: process immediately if Action Scheduler not available
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
            
            $totalRecords = 0;
            $processedRecords = 0;
            
            // Count total records first
            $totalRecords = self::countExportRecords($dataTypes);
            self::updateJob($jobId, ['total_records' => $totalRecords]);
            
            // Export each data type with batch processing
            $tableMap = self::getTableMap();
            
            foreach ($dataTypes as $dataType) {
                if (!isset($tableMap[$dataType])) {
                    continue;
                }
                
                $tableName = $wpdb->prefix . $tableMap[$dataType];
                $tableExists = $repository->tableExists($tableName);
                
                if (!$tableExists) {
                    $exportData['data'][$dataType] = [];
                    continue;
                }
                
                $total = $repository->getRecordCount($tableName);
                $records = [];
                
                for ($offset = 0; $offset < $total; $offset += self::BATCH_SIZE) {
                    $batch = $repository->getBatchRecords($tableName, $offset, self::BATCH_SIZE);
                    $records = array_merge($records, $batch);
                    $processedRecords += count($batch);
                    
                    // Update progress
                    $progress = $totalRecords > 0 ? round(($processedRecords / $totalRecords) * 100) : 0;
                    self::updateJob($jobId, [
                        'processed_records' => $processedRecords,
                        'progress' => $progress,
                    ]);
                }
                
                $exportData['data'][$dataType] = $records;
            }
            
            // Export settings if requested
            if (empty($dataTypes) || in_array('settings', $dataTypes)) {
                $exportData['data']['settings'] = self::exportSettings();
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
        $repository = new ExportImportRepository();
        global $wpdb;
        
        $jobData = self::getJobStatus($jobId);
        if (!$jobData) {
            Logger::error("Import job not found: {$jobId}");
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
            
            // Count total records
            $totalRecords = 0;
            foreach ($dataTypes as $dataType) {
                if (isset($dataContainer[$dataType]) && is_array($dataContainer[$dataType])) {
                    $totalRecords += count($dataContainer[$dataType]);
                }
            }
            
            self::updateJob($jobId, ['total_records' => $totalRecords]);
            
            $processedRecords = 0;
            $tableMap = self::getTableMap();
            
            // Initialize import statistics for tracking
            $importStats = [];
            
            foreach ($dataTypes as $dataType) {
                if (!isset($dataContainer[$dataType]) || !is_array($dataContainer[$dataType])) {
                    Logger::warning("Skipping data type not found in import file: {$dataType}");
                    continue;
                }
                
                if ($dataType === 'settings') {
                    self::importSettings($dataContainer['settings']);
                    continue;
                }
                
                if (!isset($tableMap[$dataType])) {
                    continue;
                }
                
                $tableName = $wpdb->prefix . $tableMap[$dataType];
                $records = $dataContainer[$dataType];
                
                // Initialize statistics for this data type
                $importStats[$dataType] = [
                    'total' => count($records),
                    'imported' => 0,
                    'failed' => 0,
                ];
                
                Logger::info("Importing {$dataType}: Found " . count($records) . " records");
                
                // Process in batches
                $batches = array_chunk($records, self::BATCH_SIZE);
                
                foreach ($batches as $batch) {
                    foreach ($batch as $record) {
                        $record = (array) $record;
                        unset($record['id']); // Remove ID to create new records
                        
                        try {
                            // Get table columns to ensure we only insert valid fields
                            $tableColumns = $repository->getTableColumns($tableName);
                            
                            // Filter record to only include valid columns
                            $filteredRecord = [];
                            foreach ($record as $key => $value) {
                                if (in_array($key, $tableColumns)) {
                                    $filteredRecord[$key] = $value;
                                }
                            }
                            
                            // Only insert if we have valid data
                            if (!empty($filteredRecord)) {
                                // Handle slug conflicts by generating unique slugs
                                if (isset($filteredRecord['slug'])) {
                                    // Get the table name without prefix for SlugHelper
                                    $tableNameWithoutPrefix = str_replace($wpdb->prefix, '', $tableName);
                                    
                                    // Generate a unique slug
                                    $filteredRecord['slug'] = \Yatra\Helpers\SlugHelper::generateUniqueFromDatabase(
                                        $filteredRecord['slug'],
                                        $tableNameWithoutPrefix,
                                        'slug'
                                    );
                                    
                                    Logger::info("Generated unique slug: {$filteredRecord['slug']} for import into {$tableNameWithoutPrefix}");
                                }
                                
                                $result = $repository->insertRecord($tableName, $filteredRecord);
                                if ($result === false) {
                                    $importStats[$dataType]['failed']++;
                                } else {
                                    $processedRecords++;
                                    $importStats[$dataType]['imported']++;
                                }
                            } else {
                                Logger::warning("No valid columns found for record in {$tableName}");
                            }
                        } catch (\Exception $e) {
                            Logger::error("Error inserting record: " . $e->getMessage());
                            // Continue with next record instead of failing the whole import
                            continue;
                        }
                    }
                    
                    // Update progress
                    $progress = $totalRecords > 0 ? round(($processedRecords / $totalRecords) * 100) : 0;
                    self::updateJob($jobId, [
                        'processed_records' => $processedRecords,
                        'progress' => $progress,
                    ]);
                }
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
     * Get table name mapping for data types
     */
    private static function getTableMap(): array
    {
        return [
            'trips' => 'yatra_trips',
            'destinations' => 'yatra_destinations',
            'activities' => 'yatra_activities',
            'bookings' => 'yatra_bookings',
            'customers' => 'yatra_customers',
            'reviews' => 'yatra_reviews',
            'payments' => 'yatra_booking_payments',
            'enquiries' => 'yatra_enquiries',
            'coupons' => 'yatra_coupons',
            'travelers' => 'yatra_travelers',
            'departures' => 'yatra_departures',
            'categories' => 'yatra_trip_categories',
            'difficulty_levels' => 'yatra_difficulty_levels',
            'discounts' => 'yatra_discounts',
            'availability' => 'yatra_trip_availability_dates',
            'itinerary' => 'yatra_trip_itinerary_entries',
        ];
    }

    /**
     * Count total records to export
     */
    private static function countExportRecords(array $dataTypes): int
    {
        $repository = new ExportImportRepository();
        
        $total = 0;
        $tableMap = self::getTableMap();
        
        foreach ($dataTypes as $dataType) {
            if ($dataType === 'settings') {
                continue;
            }
            
            if (!isset($tableMap[$dataType])) {
                continue;
            }
            
            $tableName = $wpdb->prefix . $tableMap[$dataType];
            $tableExists = $repository->tableExists($tableName);
            
            if ($tableExists) {
                $count = $repository->getRecordCount($tableName);
                $total += $count;
            }
        }
        
        return $total;
    }

    /**
     * Export all Yatra settings
     */
    private static function exportSettings(): array
    {
        return [
            'yatra_settings' => get_option('yatra_settings', []),
            'yatra_currency' => get_option('yatra_currency', 'USD'),
            'yatra_version' => get_option('yatra_version', ''),
            'yatra_db_version' => get_option('yatra_db_version', ''),
            'yatra_license_key' => get_option('yatra_license_key', ''),
            'yatra_license_status' => get_option('yatra_license_status', ''),
            'yatra_email_settings' => get_option('yatra_email_settings', []),
            'yatra_payment_settings' => get_option('yatra_payment_settings', []),
            'yatra_booking_settings' => get_option('yatra_booking_settings', []),
            'yatra_display_settings' => get_option('yatra_display_settings', []),
            'yatra_security_settings' => get_option('yatra_security_settings', []),
            'yatra_integration_settings' => get_option('yatra_integration_settings', []),
        ];
    }

    /**
     * Import settings
     */
    private static function importSettings(array $settings): void
    {
        foreach ($settings as $key => $value) {
            if (strpos($key, 'yatra_') === 0) {
                update_option($key, $value);
            }
        }
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
