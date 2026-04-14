<?php
/**
 * Logging Service
 * 
 * Handles application logging
 * 
 * @package Yatra\Services
 * @since 3.0.0
 */

declare(strict_types=1);

namespace Yatra\Services;

class LoggingService
{
    /**
     * Log levels
     */
    const LEVEL_DEBUG = 'debug';
    const LEVEL_INFO = 'info';
    const LEVEL_WARNING = 'warning';
    const LEVEL_ERROR = 'error';
    
    /**
     * Log a message
     * 
     * @param string $message Log message
     * @param string $level Log level
     * @param array $context Additional context
     */
    public static function log(string $message, string $level = self::LEVEL_INFO, array $context = []): void
    {
        // Check if logging is enabled
        if (!SettingsService::isEnabled('enable_logging')) {
            return;
        }
        
        // Format log entry
        $timestamp = current_time('Y-m-d H:i:s');
        $context_str = !empty($context) ? ' | Context: ' . wp_json_encode($context) : '';
        $log_entry = sprintf('[%s] [%s] %s%s', $timestamp, strtoupper($level), $message, $context_str);
        
        // Write to WordPress debug log if WP_DEBUG_LOG is enabled
        if (defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
            error_log('Yatra: ' . $log_entry);
        }
        
        // Store in database for admin viewing
        self::storeLog($message, $level, $context);
    }
    
    /**
     * Log debug message
     */
    public static function debug(string $message, array $context = []): void
    {
        self::log($message, self::LEVEL_DEBUG, $context);
    }
    
    /**
     * Log info message
     */
    public static function info(string $message, array $context = []): void
    {
        self::log($message, self::LEVEL_INFO, $context);
    }
    
    /**
     * Log warning message
     */
    public static function warning(string $message, array $context = []): void
    {
        self::log($message, self::LEVEL_WARNING, $context);
    }
    
    /**
     * Log error message
     */
    public static function error(string $message, array $context = []): void
    {
        self::log($message, self::LEVEL_ERROR, $context);
    }
    
    /**
     * Store log in database
     */
    private static function storeLog(string $message, string $level, array $context): void
    {
        $logs = get_option('yatra_logs', []);
        
        $logs[] = [
            'timestamp' => current_time('mysql'),
            'level' => $level,
            'message' => $message,
            'context' => $context,
        ];
        
        // Keep only last 1000 logs
        if (count($logs) > 1000) {
            $logs = array_slice($logs, -1000);
        }
        
        update_option('yatra_logs', $logs);
    }
    
    /**
     * Get logs
     * 
     * @param int $limit Number of logs to retrieve
     * @param string|null $level Filter by level
     * @return array
     */
    public static function getLogs(int $limit = 100, ?string $level = null): array
    {
        $logs = get_option('yatra_logs', []);
        
        // Filter by level if specified
        if ($level) {
            $logs = array_filter($logs, function($log) use ($level) {
                return $log['level'] === $level;
            });
        }
        
        // Return last N logs
        return array_slice(array_reverse($logs), 0, $limit);
    }
    
    /**
     * Clear logs
     */
    public static function clearLogs(): void
    {
        delete_option('yatra_logs');
    }
}
