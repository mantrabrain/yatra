<?php

declare(strict_types=1);

namespace Yatra\Utils;

/**
 * Yatra Logger
 * 
 * Centralized logging system with different log levels and contexts
 */
class Logger
{
    /**
     * Log levels
     */
    public const EMERGENCY = 'emergency';
    public const ALERT = 'alert';
    public const CRITICAL = 'critical';
    public const ERROR = 'error';
    public const WARNING = 'warning';
    public const NOTICE = 'notice';
    public const INFO = 'info';
    public const DEBUG = 'debug';

    /**
     * Log file path
     */
    private static ?string $logFile = null;

    /**
     * Initialize logger
     */
    public static function init(): void
    {
        if (self::$logFile === null) {
            $upload_dir = wp_upload_dir();
            $log_dir = $upload_dir['basedir'] . '/yatra-logs';
            
            if (!file_exists($log_dir)) {
                wp_mkdir_p($log_dir);
            }
            
            self::$logFile = $log_dir . '/yatra-' . date('Y-m-d') . '.log';
        }
    }

    /**
     * Log emergency message
     */
    public static function emergency(string $message, array $context = []): void
    {
        self::log(self::EMERGENCY, $message, $context);
    }

    /**
     * Log alert message
     */
    public static function alert(string $message, array $context = []): void
    {
        self::log(self::ALERT, $message, $context);
    }

    /**
     * Log critical message
     */
    public static function critical(string $message, array $context = []): void
    {
        self::log(self::CRITICAL, $message, $context);
    }

    /**
     * Log error message
     */
    public static function error(string $message, array $context = []): void
    {
        self::log(self::ERROR, $message, $context);
    }

    /**
     * Log warning message
     */
    public static function warning(string $message, array $context = []): void
    {
        self::log(self::WARNING, $message, $context);
    }

    /**
     * Log notice message
     */
    public static function notice(string $message, array $context = []): void
    {
        self::log(self::NOTICE, $message, $context);
    }

    /**
     * Log info message
     */
    public static function info(string $message, array $context = []): void
    {
        self::log(self::INFO, $message, $context);
    }

    /**
     * Log debug message
     */
    public static function debug(string $message, array $context = []): void
    {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            self::log(self::DEBUG, $message, $context);
        }
    }

    /**
     * Log message with level
     */
    public static function log(string $level, string $message, array $context = []): void
    {
        self::init();

        $timestamp = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? ' | Context: ' . json_encode($context, JSON_UNESCAPED_SLASHES) : '';
        $logEntry = "[{$timestamp}] [{$level}] {$message}{$contextStr}" . PHP_EOL;

        // Write to file
        file_put_contents(self::$logFile, $logEntry, FILE_APPEND | LOCK_EX);

        // Also log to WordPress debug log for critical errors
        if (in_array($level, [self::EMERGENCY, self::ALERT, self::CRITICAL, self::ERROR])) {
            }
    }

    /**
     * Log database query performance
     */
    public static function queryPerformance(string $query, float $executionTime, array $context = []): void
    {
        $context['execution_time'] = $executionTime;
        $context['query'] = $query;
        
        $level = $executionTime > 1.0 ? self::WARNING : self::DEBUG;
        self::log($level, "Database query executed in {$executionTime}s", $context);
    }

    /**
     * Log API request
     */
    public static function apiRequest(string $endpoint, string $method, array $data = [], ?float $responseTime = null): void
    {
        $context = [
            'endpoint' => $endpoint,
            'method' => $method,
            'data_size' => count($data),
        ];
        
        if ($responseTime !== null) {
            $context['response_time'] = $responseTime;
        }
        
        self::info("API request: {$method} {$endpoint}", $context);
    }

    /**
     * Log validation errors
     */
    public static function validationError(string $entity, array $errors, array $data = []): void
    {
        $context = [
            'entity' => $entity,
            'errors' => $errors,
            'data_keys' => array_keys($data),
        ];
        
        self::warning("Validation failed for {$entity}", $context);
    }

    /**
     * Log business logic events
     */
    public static function businessEvent(string $event, array $context = []): void
    {
        self::info("Business event: {$event}", $context);
    }

    /**
     * Get log file path
     */
    public static function getLogFile(): ?string
    {
        self::init();
        return self::$logFile;
    }

    /**
     * Clear old log files (keep last 30 days)
     */
    public static function cleanup(): void
    {
        $upload_dir = wp_upload_dir();
        $log_dir = $upload_dir['basedir'] . '/yatra-logs';
        
        if (!is_dir($log_dir)) {
            return;
        }
        
        $files = glob($log_dir . '/yatra-*.log');
        $cutoff = time() - (30 * 24 * 60 * 60); // 30 days ago
        
        foreach ($files as $file) {
            if (filemtime($file) < $cutoff) {
                unlink($file);
            }
        }
    }
}
