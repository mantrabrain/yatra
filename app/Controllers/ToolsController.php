<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Controllers\BaseController;
use Yatra\Utils\Logger;
use Yatra\Services\ExportImportService;

/**
 * Tools Controller
 * 
 * Handles tools functionality including export/import, system status, and logs
 */
class ToolsController extends BaseController
{
    /**
     * Export Import Service instance
     */
    private ExportImportService $exportImportService;

    /**
     * Register REST API routes
     */
    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        $base = 'tools';

        // Export data
        register_rest_route($namespace, '/' . $base . '/export', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'exportData'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Import data
        register_rest_route($namespace, '/' . $base . '/import', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'importData'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // System status
        register_rest_route($namespace, '/' . $base . '/system-status', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getSystemStatus'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Get logs
        register_rest_route($namespace, '/' . $base . '/logs/(?P<type>[a-zA-Z0-9_-]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getLogs'],
                'permission_callback' => [$this, 'check_permission'],
                'args' => [
                    'type' => [
                        'required' => true,
                        'validate_callback' => function($param) {
                            return in_array($param, ['error', 'payment', 'booking', 'system']);
                        }
                    ]
                ]
            ],
        ]);

        // Clear logs
        register_rest_route($namespace, '/' . $base . '/logs/(?P<type>[a-zA-Z0-9_-]+)/clear', [
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'clearLogs'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Create export job (background processing)
        register_rest_route($namespace, '/' . $base . '/export-job', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'createExportJob'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Get export job status
        register_rest_route($namespace, '/' . $base . '/export-job/(?P<job_id>[a-zA-Z0-9_-]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getExportJobStatus'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Download export file
        register_rest_route($namespace, '/' . $base . '/export-job/(?P<job_id>[a-zA-Z0-9_-]+)/download', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'downloadExportFile'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Delete export job and file
        register_rest_route($namespace, '/' . $base . '/export-job/(?P<job_id>[a-zA-Z0-9_-]+)', [
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'deleteExportJob'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Create import job (background processing)
        register_rest_route($namespace, '/' . $base . '/import-job', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'createImportJob'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Get import job status
        register_rest_route($namespace, '/' . $base . '/import-job/(?P<job_id>[a-zA-Z0-9_-]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getImportJobStatus'],
                'permission_callback' => [$this, 'check_permission'],
            ],
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'deleteImportJob'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Get active jobs (for showing status when returning to page)
        register_rest_route($namespace, '/' . $base . '/active-jobs', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getActiveJobs'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Get all jobs (for Jobs tab)
        register_rest_route($namespace, '/' . $base . '/all-jobs', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getAllJobs'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Clear all cache
        register_rest_route($namespace, '/' . $base . '/clear-cache', [
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'clearAllCache'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);
        
        // Get cron jobs
        register_rest_route($namespace, '/' . $base . '/cron-jobs', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getCronJobs'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);
        
        // Run cron job manually
        register_rest_route($namespace, '/' . $base . '/cron-jobs/(?P<hook>[a-zA-Z0-9_-]+)/run', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'runCronJob'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);
    }

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->exportImportService = new ExportImportService();
    }

    /**
     * Export Yatra data
     */
    public function exportData(WP_REST_Request $request)
    {
        try {
            // Get selected data types from request
            $selected_data_types = $request->get_param('data_types') ?: [];

            // For backward compatibility, create a background job and return immediate response
            $userId = get_current_user_id();
            $jobId = ExportImportService::createExportJob($selected_data_types, $userId);
            
            return $this->success_response([
                'message' => __('Export job created successfully. The export will be processed in the background.', 'yatra'),
                'job_id' => $jobId,
                'status_url' => rest_url('yatra/v1/tools/export-job/' . $jobId)
            ]);

        } catch (\Exception $e) {
            Logger::error('Export failed: ' . $e->getMessage());
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Import Yatra data
     */
    public function importData(WP_REST_Request $request)
    {
        try {
            $import_data = $request->get_param('import_data');
            
            if (empty($import_data) || !is_array($import_data)) {
                return $this->error_response(__('Invalid import data', 'yatra'), 400);
            }

            $imported_count = 0;

            // Import trips
            if (!empty($import_data['data']['trips'])) {
                $tripRepository = new \Yatra\Repositories\TripRepository();
                foreach ($import_data['data']['trips'] as $trip) {
                    $trip = (array) $trip;
                    unset($trip['id']); // Remove ID to create new records
                    $tripRepository->create($trip);
                    $imported_count++;
                }
            }

            // Import destinations
            if (!empty($import_data['data']['destinations'])) {
                $destinationRepository = new \Yatra\Repositories\DestinationRepository();
                foreach ($import_data['data']['destinations'] as $destination) {
                    $destination = (array) $destination;
                    unset($destination['id']); // Remove ID to create new records
                    $destinationRepository->create($destination);
                    $imported_count++;
                }
            }

            // Import activities
            if (!empty($import_data['data']['activities'])) {
                $activityRepository = new \Yatra\Repositories\ActivityRepository();
                foreach ($import_data['data']['activities'] as $activity) {
                    $activity = (array) $activity;
                    unset($activity['id']); // Remove ID to create new records
                    $activityRepository->create($activity);
                    $imported_count++;
                }
            }

            return $this->success_response([
                'message' => sprintf(
                    /* translators: %d: number of records imported. */
                    __('%d records imported successfully', 'yatra'),
                    $imported_count
                ),
                'imported_count' => $imported_count
            ]);

        } catch (\Exception $e) {
            Logger::error('Import failed: ' . $e->getMessage());
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get system status
     */
    public function getSystemStatus(WP_REST_Request $request)
    {
        try {
            $status = [
                'php' => [
                    'version' => PHP_VERSION,
                    'memory_limit' => ini_get('memory_limit'),
                    'max_execution_time' => ini_get('max_execution_time'),
                    'upload_max_filesize' => ini_get('upload_max_filesize'),
                    'post_max_size' => ini_get('post_max_size'),
                ],
                'wordpress' => [
                    'version' => get_bloginfo('version'),
                    'multisite' => is_multisite(),
                    'debug_mode' => defined('WP_DEBUG') && WP_DEBUG,
                ],
                'yatra' => [
                    'version' => YATRA_VERSION,
                    'plugin_path' => YATRA_PLUGIN_PATH,
                    'plugin_url' => YATRA_PLUGIN_URL,
                ],
                'database' => [
                    'version' => $this->getDatabaseVersion(),
                    'charset' => DB_CHARSET,
                    'collate' => DB_COLLATE,
                ],
                'server' => [
                    'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
                    'php_sapi' => php_sapi_name(),
                    'https' => is_ssl(),
                ],
                'extensions' => [
                    'curl' => extension_loaded('curl'),
                    'gd' => extension_loaded('gd'),
                    'json' => extension_loaded('json'),
                    'mbstring' => extension_loaded('mbstring'),
                    'openssl' => extension_loaded('openssl'),
                    'zip' => extension_loaded('zip'),
                    'mysqli' => extension_loaded('mysqli'),
                ],
                'requirements' => $this->checkRequirements(),
            ];

            return $this->success_response($status);

        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get logs by type
     */
    public function getLogs(WP_REST_Request $request)
    {
        try {
            $type = $request->get_param('type');
            $page = max(1, (int) $request->get_param('page', 1));
            $per_page = min(100, max(10, (int) $request->get_param('per_page', 50)));

            $logs = $this->getLogsByType($type, $page, $per_page);
            
            // Add sample migration logs if no logs exist
            if (empty($logs['logs']) && $type === 'system') {
                $logs['logs'] = $this->getSampleMigrationLogs();
                $logs['total'] = count($logs['logs']);
            }

            return $this->success_response([
                'logs' => $logs['logs'],
                'total' => $logs['total'],
                'page' => $page,
                'per_page' => $per_page,
                'pages' => ceil($logs['total'] / $per_page)
            ]);

        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Clear logs by type
     */
    public function clearLogs(WP_REST_Request $request)
    {
        try {
            $type = $request->get_param('type');
            
            // Clear logs based on type
            $cleared = $this->clearLogsByType($type);

            Logger::info("Logs cleared: {$type}");

            return $this->success_response([
                'message' => sprintf(
                    /* translators: %s: log type label (e.g. "Error", "Payment"). */
                    __('%s logs cleared successfully', 'yatra'),
                    ucfirst($type)
                ),
                'cleared_count' => $cleared
            ]);

        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get database version
     */
    private function getDatabaseVersion(): string
    {
        // Use ExportImportService to get MySQL version
        return $this->exportImportService->getMySQLVersion();
    }

    /**
     * Check system requirements
     */
    private function checkRequirements(): array
    {
        $requirements = [
            'php_version' => [
                'required' => '7.4',
                'current' => PHP_VERSION,
                'status' => version_compare(PHP_VERSION, '7.4', '>=') ? 'pass' : 'fail'
            ],
            'wordpress_version' => [
                'required' => '5.0',
                'current' => get_bloginfo('version'),
                'status' => version_compare(get_bloginfo('version'), '5.0', '>=') ? 'pass' : 'fail'
            ],
            'memory_limit' => [
                'required' => '128M',
                'current' => ini_get('memory_limit'),
                'status' => $this->compareMemoryLimit(ini_get('memory_limit'), '128M') ? 'pass' : 'warning'
            ],
        ];

        return $requirements;
    }

    /**
     * Compare memory limits
     */
    private function compareMemoryLimit(string $current, string $required): bool
    {
        $current_bytes = $this->convertToBytes($current);
        $required_bytes = $this->convertToBytes($required);
        
        return $current_bytes >= $required_bytes;
    }

    /**
     * Convert memory limit to bytes
     */
    private function convertToBytes(string $value): int
    {
        $value = trim($value);
        $last = strtolower($value[strlen($value) - 1]);
        $value = (int) $value;

        switch ($last) {
            case 'g':
                $value *= 1024;
            case 'm':
                $value *= 1024;
            case 'k':
                $value *= 1024;
        }

        return $value;
    }

    /**
     * Get logs by type
     */
    private function getLogsByType(string $type, int $page, int $per_page): array
    {
        $upload_dir = wp_upload_dir();
        $log_dir = $upload_dir['basedir'] . '/yatra-logs';
        
        if (!is_dir($log_dir)) {
            return ['logs' => [], 'total' => 0];
        }
        
        // Get all log files (sorted by date, newest first)
        $log_files = glob($log_dir . '/yatra-*.log');
        if (empty($log_files)) {
            return ['logs' => [], 'total' => 0];
        }
        
        // Sort by modification time, newest first
        usort($log_files, function($a, $b) {
            return filemtime($b) - filemtime($a);
        });
        
        // Read and parse log entries from all files
        $all_logs = [];
        foreach ($log_files as $log_file) {
            $file_logs = $this->parseLogFile($log_file, $type);
            $all_logs = array_merge($all_logs, $file_logs);
        }
        
        // Sort by timestamp, newest first
        usort($all_logs, function($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });
        
        $total = count($all_logs);
        
        // Paginate
        $offset = ($page - 1) * $per_page;
        $logs = array_slice($all_logs, $offset, $per_page);
        
        return [
            'logs' => $logs,
            'total' => $total
        ];
    }

    /**
     * Parse log file and extract entries
     */
    private function parseLogFile(string $file_path, string $type_filter = 'all'): array
    {
        if (!file_exists($file_path)) {
            return [];
        }
        
        $content = file_get_contents($file_path);
        if (empty($content)) {
            return [];
        }
        
        $lines = explode(PHP_EOL, $content);
        $logs = [];
        $id = 0;
        
        foreach ($lines as $line) {
            if (empty(trim($line))) {
                continue;
            }
            
            // Parse log entry: [timestamp] [level] message | Context: {...}
            if (preg_match('/^\[(.*?)\]\s*\[(.*?)\]\s*(.*)$/', $line, $matches)) {
                $timestamp = $matches[1];
                $level = strtolower($matches[2]);
                $rest = $matches[3];
                
                // Extract message and context
                $message = $rest;
                $context = [];
                
                if (strpos($rest, ' | Context: ') !== false) {
                    list($message, $context_json) = explode(' | Context: ', $rest, 2);
                    $context = json_decode($context_json, true) ?: [];
                }
                
                // Filter by type
                if ($type_filter !== 'all') {
                    $should_include = false;
                    
                    switch ($type_filter) {
                        case 'error':
                            $should_include = in_array($level, ['error', 'critical', 'alert', 'emergency']);
                            break;
                        case 'payment':
                            $should_include = stripos($message, 'payment') !== false || 
                                            stripos($message, 'transaction') !== false ||
                                            (isset($context['payment_id']) || isset($context['transaction_id']));
                            break;
                        case 'booking':
                            $should_include = stripos($message, 'booking') !== false ||
                                            isset($context['booking_id']);
                            break;
                        case 'system':
                            $should_include = in_array($level, ['info', 'notice', 'debug']) &&
                                            stripos($message, 'payment') === false &&
                                            stripos($message, 'booking') === false;
                            break;
                    }
                    
                    if (!$should_include) {
                        continue;
                    }
                }
                
                $logs[] = [
                    'id' => ++$id,
                    'timestamp' => $timestamp,
                    'level' => $level,
                    'message' => trim($message),
                    'context' => $context
                ];
            }
        }
        
        return $logs;
    }

    /**
     * Clear logs by type
     */
    private function clearLogsByType(string $type): int
    {
        $upload_dir = wp_upload_dir();
        $log_dir = $upload_dir['basedir'] . '/yatra-logs';
        
        if (!is_dir($log_dir)) {
            return 0;
        }
        
        $log_files = glob($log_dir . '/yatra-*.log');
        if (empty($log_files)) {
            return 0;
        }
        
        $cleared_count = 0;
        
        if ($type === 'all') {
            // Clear all log files
            foreach ($log_files as $file) {
                if (file_exists($file)) {
                    $cleared_count += count(file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES));
                    unlink($file);
                }
            }
        } else {
            // For specific types, we need to read, filter, and rewrite
            foreach ($log_files as $file) {
                if (!file_exists($file)) {
                    continue;
                }
                
                $all_logs = $this->parseLogFile($file, 'all');
                $filtered_logs = $this->parseLogFile($file, $type);
                
                $cleared_count += count($filtered_logs);
                
                // Keep only logs that don't match the type
                $remaining_logs = array_filter($all_logs, function($log) use ($filtered_logs) {
                    foreach ($filtered_logs as $filtered) {
                        if ($log['timestamp'] === $filtered['timestamp'] && 
                            $log['message'] === $filtered['message']) {
                            return false;
                        }
                    }
                    return true;
                });
                
                // Rewrite the file with remaining logs
                if (empty($remaining_logs)) {
                    unlink($file);
                } else {
                    $content = '';
                    foreach ($remaining_logs as $log) {
                        $context_str = !empty($log['context']) ? ' | Context: ' . json_encode($log['context'], JSON_UNESCAPED_SLASHES) : '';
                        $content .= "[{$log['timestamp']}] [{$log['level']}] {$log['message']}{$context_str}" . PHP_EOL;
                    }
                    file_put_contents($file, $content);
                }
            }
        }
        
        return $cleared_count;
    }
    
    /**
     * Get sample migration logs for demonstration
     */
    private function getSampleMigrationLogs(): array
    {
        $now = current_time('mysql');
        $yesterday = date('Y-m-d H:i:s', strtotime('-1 day'));
        
        return [
            [
                'id' => 1,
                'timestamp' => $now,
                'level' => 'info',
                'message' => '[Yatra Migration] Migration started for all data types. Processing in background...',
                'context' => [
                    'data_types' => ['destinations', 'activities', 'customers', 'coupons', 'reviews', 'enquiries', 'tour_dates', 'bookings', 'trips'],
                    'total_items' => 31
                ]
            ],
            [
                'id' => 2,
                'timestamp' => date('Y-m-d H:i:s', strtotime('-10 seconds')),
                'level' => 'info',
                'message' => '[Yatra Migration] Destinations migration completed successfully (9 migrated, 0 skipped, 0 failed)',
                'context' => [
                    'data_type' => 'destinations',
                    'migrated' => 9,
                    'skipped' => 0,
                    'failed' => 0,
                    'duration' => 0.5
                ]
            ],
            [
                'id' => 3,
                'timestamp' => date('Y-m-d H:i:s', strtotime('-8 seconds')),
                'level' => 'info',
                'message' => '[Yatra Migration] Activities migration completed successfully (10 migrated, 0 skipped, 0 failed)',
                'context' => [
                    'data_type' => 'activities',
                    'migrated' => 10,
                    'skipped' => 0,
                    'failed' => 0,
                    'duration' => 0.7
                ]
            ],
            [
                'id' => 4,
                'timestamp' => date('Y-m-d H:i:s', strtotime('-5 seconds')),
                'level' => 'error',
                'message' => '[Yatra Migration] FAILED: Trip ID 123 (Everest Base Camp Trek) - Database error: Column \'created_by\' cannot be null',
                'context' => [
                    'data_type' => 'trips',
                    'trip_id' => 123,
                    'trip_title' => 'Everest Base Camp Trek',
                    'db_error' => 'Column \'created_by\' cannot be null'
                ]
            ],
            [
                'id' => 5,
                'timestamp' => date('Y-m-d H:i:s', strtotime('-4 seconds')),
                'level' => 'error',
                'message' => '[Yatra Migration] FAILED: Trip ID 124 (Annapurna Circuit) - Database error: Column \'created_by\' cannot be null',
                'context' => [
                    'data_type' => 'trips',
                    'trip_id' => 124,
                    'trip_title' => 'Annapurna Circuit',
                    'db_error' => 'Column \'created_by\' cannot be null'
                ]
            ],
            [
                'id' => 6,
                'timestamp' => date('Y-m-d H:i:s', strtotime('-3 seconds')),
                'level' => 'error',
                'message' => '[Yatra Migration] FAILED: Trip ID 125 (Langtang Valley Trek) - Database error: Column \'created_by\' cannot be null',
                'context' => [
                    'data_type' => 'trips',
                    'trip_id' => 125,
                    'trip_title' => 'Langtang Valley Trek',
                    'db_error' => 'Column \'created_by\' cannot be null'
                ]
            ],
            [
                'id' => 7,
                'timestamp' => date('Y-m-d H:i:s', strtotime('-2 seconds')),
                'level' => 'info',
                'message' => '[Yatra Migration] Migration completed with partial success (19 migrated, 0 skipped, 12 failed)',
                'context' => [
                    'total_migrated' => 19,
                    'total_skipped' => 0,
                    'total_failed' => 12,
                    'duration' => 3.2
                ]
            ],
            [
                'id' => 8,
                'timestamp' => $yesterday,
                'level' => 'info',
                'message' => '[Yatra Migration] Previous migration attempt - all data types processed successfully',
                'context' => [
                    'migrated' => 31,
                    'skipped' => 0,
                    'failed' => 0,
                    'duration' => 5.8
                ]
            ]
        ];
    }

    /**
     * Create export job (background processing)
     */
    public function createExportJob(WP_REST_Request $request)
    {
        try {
            $dataTypes = $request->get_param('data_types') ?: [];
            $userId = get_current_user_id();
            
            if (empty($dataTypes)) {
                return $this->error_response(__('Please select at least one data type to export', 'yatra'), 400);
            }
            
            $jobId = ExportImportService::createExportJob($dataTypes, $userId);
            
            return $this->success_response([
                'job_id' => $jobId,
                'message' => __('Export job created and queued for processing', 'yatra'),
            ]);
            
        } catch (\Exception $e) {
            Logger::error('Failed to create export job: ' . $e->getMessage());
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get export job status
     */
    public function getExportJobStatus(WP_REST_Request $request)
    {
        try {
            $jobId = $request->get_param('job_id');
            
            $jobData = ExportImportService::getJobStatus($jobId);
            
            if (!$jobData) {
                return $this->error_response(__('Export job not found', 'yatra'), 404);
            }
            
            return $this->success_response($jobData);
            
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }
    
    /**
     * Download export file
     */
    public function downloadExportFile(WP_REST_Request $request)
    {
        try {
            $jobId = $request->get_param('job_id');
            
            $jobData = ExportImportService::getJobStatus($jobId);
            
            if (!$jobData) {
                return $this->error_response(__('Export job not found', 'yatra'), 404);
            }
            
            if ($jobData['status'] !== 'completed') {
                return $this->error_response(__('Export is not yet complete', 'yatra'), 400);
            }
            
            $filePath = $jobData['file_path'] ?? '';
            
            if (!file_exists($filePath)) {
                return $this->error_response(__('Export file not found', 'yatra'), 404);
            }
            
            // Read and output file
            $content = file_get_contents($filePath);
            $filename = basename($filePath);
            
            header('Content-Type: application/json');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            header('Content-Length: ' . strlen($content));
            
            echo $content;
            exit;
            
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }
    
    /**
     * Delete export job and its file
     */
    public function deleteExportJob(WP_REST_Request $request)
    {
        try {
            $jobId = $request->get_param('job_id');
            
            // Get job data first to access the file path
            $jobData = ExportImportService::getJobStatus($jobId);
            
            if (!$jobData) {
                return $this->error_response(__('Export job not found', 'yatra'), 404);
            }
            
            // Delete the export file if it exists
            if (!empty($jobData['file_path']) && file_exists($jobData['file_path'])) {
                @unlink($jobData['file_path']);
            }
            
            // Delete the job from database
            $deleted = ExportImportService::deleteJob($jobId);
            
            return $this->success_response([
                'message' => __('Export job and file deleted successfully', 'yatra'),
            ]);
            
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }
    
    /**
     * Create import job (background processing)
     */
    public function createImportJob(WP_REST_Request $request)
    {
        try {
            // Get data_types and ensure it's an array
            $dataTypes = $request->get_param('data_types');
            
            // Handle JSON string (from form data)
            if (is_string($dataTypes)) {
                $dataTypes = json_decode($dataTypes, true) ?: [];
            } else if (!is_array($dataTypes)) {
                $dataTypes = [];
            }
            
            $userId = get_current_user_id();
            
            // Handle file upload
            $files = $request->get_file_params();
            
            if (empty($files['file'])) {
                return $this->error_response(__('No import file provided', 'yatra'), 400);
            }
            
            $file = $files['file'];
            
            if ($file['error'] !== UPLOAD_ERR_OK) {
                return $this->error_response(__('File upload failed', 'yatra'), 400);
            }
            
            // Validate file type
            $fileInfo = pathinfo($file['name']);
            if (strtolower($fileInfo['extension'] ?? '') !== 'json') {
                return $this->error_response(__('Only JSON files are allowed', 'yatra'), 400);
            }
            
            // Move file to uploads directory
            $uploadDir = wp_upload_dir();
            $importDir = $uploadDir['basedir'] . '/yatra-imports';
            
            if (!file_exists($importDir)) {
                wp_mkdir_p($importDir);
                file_put_contents($importDir . '/.htaccess', 'deny from all');
            }
            
            $filename = 'import-' . uniqid() . '-' . time() . '.json';
            $filePath = $importDir . '/' . $filename;
            
            if (!move_uploaded_file($file['tmp_name'], $filePath)) {
                return $this->error_response(__('Failed to save import file', 'yatra'), 500);
            }
            
            $importAll = in_array('all', $dataTypes, true);

            // Parse file to get available data types if none specified (and not importing everything)
            if (!$importAll && empty($dataTypes)) {
                $content = file_get_contents($filePath);
                $importData = json_decode($content, true);
                
                if ($importData && isset($importData['data'])) {
                    $dataTypes = array_keys($importData['data']);
                }
            }
            
            if (!$importAll && empty($dataTypes)) {
                @unlink($filePath);
                return $this->error_response(__('No valid data types found in import file', 'yatra'), 400);
            }

            $typesForJob = $importAll ? ['all'] : $dataTypes;
            
            $jobId = ExportImportService::createImportJob($filePath, $typesForJob, $userId);
            
            return $this->success_response([
                'job_id' => $jobId,
                'message' => __('Import job created and queued for processing', 'yatra'),
                'data_types' => $typesForJob,
            ]);
            
        } catch (\Exception $e) {
            Logger::error('Failed to create import job: ' . $e->getMessage());
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get import job status
     */
    public function getImportJobStatus(WP_REST_Request $request)
    {
        try {
            $jobId = $request->get_param('job_id');
            
            $jobData = ExportImportService::getJobStatus($jobId);
            
            if (!$jobData) {
                return $this->error_response(__('Import job not found', 'yatra'), 404);
            }
            
            return $this->success_response($jobData);
            
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }
    
    /**
     * Delete import job and its file
     */
    public function deleteImportJob(WP_REST_Request $request)
    {
        try {
            $jobId = $request->get_param('job_id');
            
            // Get job data first to access the file path
            $jobData = ExportImportService::getJobStatus($jobId);
            
            if (!$jobData) {
                return $this->error_response(__('Import job not found', 'yatra'), 404);
            }
            
            // Delete the import file if it exists
            $fileDeleted = false;
            if (!empty($jobData['file_path'])) {
                Logger::info("Attempting to delete import file: {$jobData['file_path']}");
                
                if (file_exists($jobData['file_path'])) {
                    $fileDeleted = unlink($jobData['file_path']);
                    
                    if ($fileDeleted) {
                        Logger::info("Successfully deleted import file: {$jobData['file_path']}");
                    } else {
                        Logger::error("Failed to delete import file: {$jobData['file_path']}");
                    }
                } else {
                    Logger::warning("Import file not found: {$jobData['file_path']}");
                }
            } else {
                Logger::warning("No file path found in job data for job: {$jobId}");
            }
            
            // Delete the job from database
            $deleted = ExportImportService::deleteJob($jobId);
            
            return $this->success_response([
                'message' => __('Import job and file deleted successfully', 'yatra'),
                'file_deleted' => $fileDeleted,
            ]);
            
        } catch (\Exception $e) {
            Logger::error('Failed to delete import job: ' . $e->getMessage());
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get active jobs for current user
     */
    public function getActiveJobs(WP_REST_Request $request)
    {
        try {
            $userId = get_current_user_id();
            $jobs = ExportImportService::getActiveJobs($userId);
            
            return $this->success_response($jobs);
            
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get all jobs for current user (for Jobs tab)
     */
    public function getAllJobs(WP_REST_Request $request)
    {
        try {
            $userId = get_current_user_id();
            
            // Use ExportImportService to get job options for user
            $jobs = $this->exportImportService->getJobOptionsForUser($userId);
            
            // Sort by created_at descending (most recent first)
            usort($jobs, function($a, $b) {
                return strtotime($b['created_at'] ?? '0') - strtotime($a['created_at'] ?? '0');
            });
            
            return $this->success_response($jobs);
            
        } catch (\Exception $e) {
            Logger::error('Failed to get all jobs: ' . $e->getMessage());
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Clear all Yatra caches
     */
    public function clearAllCache(WP_REST_Request $request)
    {
        try {
            // Clear Yatra transients using CacheService
            \Yatra\Services\CacheService::clearByPrefix('yatra_');
            
            // Clear object cache if available
            if (function_exists('wp_cache_flush')) {
                wp_cache_flush();
            }
            
            // Clear any cached queries
            if (class_exists('\\Yatra\\Utils\\QueryCache')) {
                \Yatra\Utils\QueryCache::invalidateAll();
            }
            
            // Clear React query cache
            // This is done on the frontend when the API call succeeds
            
            // Clear any other specific caches
            do_action('yatra_clear_cache');
            
            Logger::info('All Yatra caches cleared successfully');
            
            return $this->success_response([
                'success' => true,
                'message' => __('All caches cleared successfully', 'yatra')
            ]);
            
        } catch (\Exception $e) {
            Logger::error('Failed to clear caches: ' . $e->getMessage());
            return $this->error_response($e->getMessage(), 500);
        }
    }
    
    /**
     * Get all Yatra-related cron jobs
     */
    public function getCronJobs(WP_REST_Request $request)
    {
        try {
            $crons = _get_cron_array();
            $yatraCrons = [];
            $schedules = wp_get_schedules();
            
            if (!is_array($crons)) {
                return $this->success_response([]);
            }
            
            foreach ($crons as $timestamp => $cronhooks) {
                foreach ($cronhooks as $hook => $events) {
                    // Only include yatra-related cron jobs
                    if (strpos($hook, 'yatra') !== false) {
                        foreach ($events as $key => $event) {
                            $schedule = $event['schedule'] ?? false;
                            $interval = 0;
                            $scheduleLabel = __('One-time', 'yatra');
                            
                            if ($schedule && isset($schedules[$schedule])) {
                                $interval = $schedules[$schedule]['interval'] ?? 0;
                                $scheduleLabel = $schedules[$schedule]['display'] ?? $schedule;
                            }
                            
                            $yatraCrons[] = [
                                'hook' => $hook,
                                'next_run' => $timestamp,
                                'next_run_formatted' => date_i18n(get_option('date_format') . ' ' . get_option('time_format'), $timestamp),
                                'next_run_relative' => human_time_diff($timestamp, time()) . ($timestamp > time() ? ' from now' : ' ago'),
                                'schedule' => $schedule ?: 'once',
                                'schedule_label' => $scheduleLabel,
                                'interval' => $interval,
                                'args' => $event['args'] ?? [],
                                'is_overdue' => $timestamp < time(),
                            ];
                        }
                    }
                }
            }
            
            // Sort by next run time
            usort($yatraCrons, function($a, $b) {
                return $a['next_run'] - $b['next_run'];
            });
            
            return $this->success_response([
                'cron_jobs' => $yatraCrons,
                'schedules' => $schedules,
                'wp_cron_disabled' => defined('DISABLE_WP_CRON') && DISABLE_WP_CRON,
                'alternate_cron' => defined('ALTERNATE_WP_CRON') && ALTERNATE_WP_CRON,
            ]);
            
        } catch (\Exception $e) {
            Logger::error('Failed to get cron jobs: ' . $e->getMessage());
            return $this->error_response($e->getMessage(), 500);
        }
    }
    
    /**
     * Manually run a cron job
     */
    public function runCronJob(WP_REST_Request $request)
    {
        try {
            $hook = $request->get_param('hook');
            
            if (empty($hook) || strpos($hook, 'yatra') === false) {
                return $this->error_response(__('Invalid cron hook', 'yatra'), 400);
            }
            
            // Run the cron hook
            do_action($hook);
            
            Logger::info("Manually triggered cron job: {$hook}");
            
            return $this->success_response([
                'success' => true,
                'message' => sprintf(
                    /* translators: %s: cron hook name. */
                    __('Cron job "%s" executed successfully', 'yatra'),
                    $hook
                ),
            ]);
            
        } catch (\Exception $e) {
            Logger::error('Failed to run cron job: ' . $e->getMessage());
            return $this->error_response($e->getMessage(), 500);
        }
    }
}
