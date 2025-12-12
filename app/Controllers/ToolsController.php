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
    }

    /**
     * Export Yatra data
     */
    public function exportData(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            global $wpdb;
            
            // Get selected data types from request
            $selected_data_types = $request->get_param('data_types') ?: [];
            
            $export_data = [
                'version' => YATRA_VERSION,
                'export_date' => current_time('mysql'),
                'data' => []
            ];

            // Export based on selected data types with table existence checks and batch processing
            $batch_size = 1000; // Process 1000 records at a time
            
            if (empty($selected_data_types) || in_array('trips', $selected_data_types)) {
                $trips_table = $wpdb->prefix . 'yatra_trips';
                $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$trips_table'");
                if ($table_exists) {
                    $total_trips = (int) $wpdb->get_var("SELECT COUNT(*) FROM $trips_table");
                    $trips = [];
                    
                    for ($offset = 0; $offset < $total_trips; $offset += $batch_size) {
                        $batch = $wpdb->get_results("SELECT * FROM $trips_table LIMIT $batch_size OFFSET $offset");
                        $trips = array_merge($trips, $batch);
                    }
                    
                    $export_data['data']['trips'] = $trips;
                } else {
                    $export_data['data']['trips'] = [];
                }
            }

            if (empty($selected_data_types) || in_array('destinations', $selected_data_types)) {
                $destinations_table = $wpdb->prefix . 'yatra_destinations';
                $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$destinations_table'");
                if ($table_exists) {
                    $total_destinations = (int) $wpdb->get_var("SELECT COUNT(*) FROM $destinations_table");
                    $destinations = [];
                    
                    for ($offset = 0; $offset < $total_destinations; $offset += $batch_size) {
                        $batch = $wpdb->get_results("SELECT * FROM $destinations_table LIMIT $batch_size OFFSET $offset");
                        $destinations = array_merge($destinations, $batch);
                    }
                    
                    $export_data['data']['destinations'] = $destinations;
                } else {
                    $export_data['data']['destinations'] = [];
                }
            }

            if (empty($selected_data_types) || in_array('activities', $selected_data_types)) {
                $activities_table = $wpdb->prefix . 'yatra_activities';
                $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$activities_table'");
                if ($table_exists) {
                    $total_activities = (int) $wpdb->get_var("SELECT COUNT(*) FROM $activities_table");
                    $activities = [];
                    
                    for ($offset = 0; $offset < $total_activities; $offset += $batch_size) {
                        $batch = $wpdb->get_results("SELECT * FROM $activities_table LIMIT $batch_size OFFSET $offset");
                        $activities = array_merge($activities, $batch);
                    }
                    
                    $export_data['data']['activities'] = $activities;
                } else {
                    $export_data['data']['activities'] = [];
                }
            }

            if (empty($selected_data_types) || in_array('bookings', $selected_data_types)) {
                $bookings_table = $wpdb->prefix . 'yatra_bookings';
                $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$bookings_table'");
                if ($table_exists) {
                    $total_bookings = (int) $wpdb->get_var("SELECT COUNT(*) FROM $bookings_table");
                    $bookings = [];
                    
                    for ($offset = 0; $offset < $total_bookings; $offset += $batch_size) {
                        $batch = $wpdb->get_results("SELECT * FROM $bookings_table LIMIT $batch_size OFFSET $offset");
                        $bookings = array_merge($bookings, $batch);
                    }
                    
                    $export_data['data']['bookings'] = $bookings;
                } else {
                    $export_data['data']['bookings'] = [];
                }
            }

            if (empty($selected_data_types) || in_array('customers', $selected_data_types)) {
                $customers_table = $wpdb->prefix . 'yatra_customers';
                $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$customers_table'");
                if ($table_exists) {
                    $total_customers = (int) $wpdb->get_var("SELECT COUNT(*) FROM $customers_table");
                    $customers = [];
                    
                    for ($offset = 0; $offset < $total_customers; $offset += $batch_size) {
                        $batch = $wpdb->get_results("SELECT * FROM $customers_table LIMIT $batch_size OFFSET $offset");
                        $customers = array_merge($customers, $batch);
                    }
                    
                    $export_data['data']['customers'] = $customers;
                } else {
                    $export_data['data']['customers'] = [];
                }
            }

            if (empty($selected_data_types) || in_array('reviews', $selected_data_types)) {
                $reviews_table = $wpdb->prefix . 'yatra_reviews';
                $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$reviews_table'");
                if ($table_exists) {
                    $total_reviews = (int) $wpdb->get_var("SELECT COUNT(*) FROM $reviews_table");
                    $reviews = [];
                    
                    for ($offset = 0; $offset < $total_reviews; $offset += $batch_size) {
                        $batch = $wpdb->get_results("SELECT * FROM $reviews_table LIMIT $batch_size OFFSET $offset");
                        $reviews = array_merge($reviews, $batch);
                    }
                    
                    $export_data['data']['reviews'] = $reviews;
                } else {
                    $export_data['data']['reviews'] = [];
                }
            }

            if (empty($selected_data_types) || in_array('payments', $selected_data_types)) {
                $payments_table = $wpdb->prefix . 'yatra_booking_payments';
                $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$payments_table'");
                if ($table_exists) {
                    $total_payments = (int) $wpdb->get_var("SELECT COUNT(*) FROM $payments_table");
                    $payments = [];
                    
                    for ($offset = 0; $offset < $total_payments; $offset += $batch_size) {
                        $batch = $wpdb->get_results("SELECT * FROM $payments_table LIMIT $batch_size OFFSET $offset");
                        $payments = array_merge($payments, $batch);
                    }
                    
                    $export_data['data']['payments'] = $payments;
                } else {
                    $export_data['data']['payments'] = [];
                }
            }

            if (empty($selected_data_types) || in_array('enquiries', $selected_data_types)) {
                $enquiries_table = $wpdb->prefix . 'yatra_enquiries';
                $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$enquiries_table'");
                if ($table_exists) {
                    $total_enquiries = (int) $wpdb->get_var("SELECT COUNT(*) FROM $enquiries_table");
                    $enquiries = [];
                    
                    for ($offset = 0; $offset < $total_enquiries; $offset += $batch_size) {
                        $batch = $wpdb->get_results("SELECT * FROM $enquiries_table LIMIT $batch_size OFFSET $offset");
                        $enquiries = array_merge($enquiries, $batch);
                    }
                    
                    $export_data['data']['enquiries'] = $enquiries;
                } else {
                    $export_data['data']['enquiries'] = [];
                }
            }

            if (empty($selected_data_types) || in_array('coupons', $selected_data_types)) {
                // Check if coupons table exists
                $coupons_table = $wpdb->prefix . 'yatra_coupons';
                $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$coupons_table'");
                if ($table_exists) {
                    $coupons = $wpdb->get_results("SELECT * FROM $coupons_table");
                    $export_data['data']['coupons'] = $coupons;
                } else {
                    $export_data['data']['coupons'] = [];
                }
            }

            if (empty($selected_data_types) || in_array('settings', $selected_data_types)) {
                // Export all Yatra-related settings
                $settings = [
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
                $export_data['data']['settings'] = $settings;
            }

            Logger::info('Data exported successfully with selected types: ' . implode(', ', $selected_data_types));

            // Create JSON file content
            $json_content = json_encode($export_data, JSON_PRETTY_PRINT);
            $filename = 'yatra-export-' . date('Y-m-d-H-i-s') . '.json';

            // Set headers for file download
            header('Content-Type: application/json');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            header('Content-Length: ' . strlen($json_content));
            
            // Output the file content
            echo $json_content;
            exit;

        } catch (\Exception $e) {
            Logger::error('Export failed: ' . $e->getMessage());
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Import Yatra data
     */
    public function importData(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $import_data = $request->get_param('import_data');
            
            if (empty($import_data) || !is_array($import_data)) {
                return $this->error_response(__('Invalid import data', 'yatra'), 400);
            }

            global $wpdb;
            $imported_count = 0;

            // Import trips
            if (!empty($import_data['data']['trips'])) {
                foreach ($import_data['data']['trips'] as $trip) {
                    $trip = (array) $trip;
                    unset($trip['id']); // Remove ID to create new records
                    $wpdb->insert($wpdb->prefix . 'yatra_trips', $trip);
                    $imported_count++;
                }
            }

            // Import destinations
            if (!empty($import_data['data']['destinations'])) {
                foreach ($import_data['data']['destinations'] as $destination) {
                    $destination = (array) $destination;
                    unset($destination['id']);
                    $wpdb->insert($wpdb->prefix . 'yatra_destinations', $destination);
                    $imported_count++;
                }
            }

            // Import activities
            if (!empty($import_data['data']['activities'])) {
                foreach ($import_data['data']['activities'] as $activity) {
                    $activity = (array) $activity;
                    unset($activity['id']);
                    $wpdb->insert($wpdb->prefix . 'yatra_activities', $activity);
                    $imported_count++;
                }
            }

            Logger::info("Data imported successfully. {$imported_count} records imported.");

            return $this->success_response([
                'message' => sprintf(__('%d records imported successfully', 'yatra'), $imported_count),
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
    public function getSystemStatus(WP_REST_Request $request): WP_REST_Response|WP_Error
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
    public function getLogs(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $type = $request->get_param('type');
            $page = max(1, (int) $request->get_param('page', 1));
            $per_page = min(100, max(10, (int) $request->get_param('per_page', 50)));

            $logs = $this->getLogsByType($type, $page, $per_page);

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
    public function clearLogs(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $type = $request->get_param('type');
            
            // Clear logs based on type
            $cleared = $this->clearLogsByType($type);

            Logger::info("Logs cleared: {$type}");

            return $this->success_response([
                'message' => sprintf(__('%s logs cleared successfully', 'yatra'), ucfirst($type)),
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
        global $wpdb;
        return $wpdb->get_var("SELECT VERSION()") ?: 'Unknown';
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
     * Create export job (background processing)
     */
    public function createExportJob(WP_REST_Request $request): WP_REST_Response|WP_Error
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
    public function getExportJobStatus(WP_REST_Request $request): WP_REST_Response|WP_Error
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
    public function downloadExportFile(WP_REST_Request $request): WP_REST_Response|WP_Error
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
    public function deleteExportJob(WP_REST_Request $request): WP_REST_Response|WP_Error
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
    public function createImportJob(WP_REST_Request $request): WP_REST_Response|WP_Error
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
            
            // Parse file to get available data types if none specified
            if (empty($dataTypes)) {
                $content = file_get_contents($filePath);
                $importData = json_decode($content, true);
                
                if ($importData && isset($importData['data'])) {
                    $dataTypes = array_keys($importData['data']);
                }
            }
            
            if (empty($dataTypes)) {
                @unlink($filePath);
                return $this->error_response(__('No valid data types found in import file', 'yatra'), 400);
            }
            
            $jobId = ExportImportService::createImportJob($filePath, $dataTypes, $userId);
            
            return $this->success_response([
                'job_id' => $jobId,
                'message' => __('Import job created and queued for processing', 'yatra'),
                'data_types' => $dataTypes,
            ]);
            
        } catch (\Exception $e) {
            Logger::error('Failed to create import job: ' . $e->getMessage());
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get import job status
     */
    public function getImportJobStatus(WP_REST_Request $request): WP_REST_Response|WP_Error
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
    public function deleteImportJob(WP_REST_Request $request): WP_REST_Response|WP_Error
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
    public function getActiveJobs(WP_REST_Request $request): WP_REST_Response|WP_Error
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
    public function getAllJobs(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $userId = get_current_user_id();
            
            global $wpdb;
            
            $options = $wpdb->get_results(
                "SELECT option_name, option_value FROM {$wpdb->options} 
                 WHERE option_name LIKE 'yatra_job_%'"
            );
            
            Logger::info("Found " . count($options) . " job options in database for user {$userId}");
            
            $jobs = [];
            $filteredCount = 0;
            
            foreach ($options as $option) {
                $jobData = maybe_unserialize($option->option_value);
                
                if (!is_array($jobData)) {
                    continue;
                }
                
                // Filter by user
                if (($jobData['user_id'] ?? 0) !== $userId) {
                    $filteredCount++;
                    continue;
                }
                
                $jobs[] = $jobData;
            }
            
            Logger::info("Returning " . count($jobs) . " jobs (filtered out {$filteredCount} jobs)");
            
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
    public function clearAllCache(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            global $wpdb;
            
            // Clear transients
            $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '%_transient_yatra_%'");
            $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '%_transient_timeout_yatra_%'");
            
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
}
