<?php

defined('ABSPATH') || exit;

/**
 * Yatra_Logger class.
 */
class Yatra_Logger implements Yatra_Interface_Logger
{

    /**
     * Stores registered log handlers.
     *
     * @var array
     */
    protected $handlers;

    /**
     * Minimum log level this handler will process.
     *
     * @var int Integer representation of minimum log level to handle.
     */
    protected $threshold;

    /**
     * Constructor for the logger.
     *
     * @param array $handlers Optional. Array of log handlers. If $handlers is not provided, the filter 'yatra_register_log_handlers' will be used to define the handlers. If $handlers is provided, the filter will not be applied and the handlers will be used directly.
     * @param string $threshold Optional. Define an explicit threshold. May be configured via  YATRA_LOG_THRESHOLD. By default, all logs will be processed.
     */
    public function __construct($handlers = null, $threshold = null)
    {
        if (null === $handlers) {
            $handlers = apply_filters('yatra_register_log_handlers', array());
        }


        $register_handlers = array();

        if (!empty($handlers) && is_array($handlers)) {
            foreach ($handlers as $handler) {
                $implements = class_implements($handler);
                if (is_object($handler) && is_array($implements) && in_array('Yatra_Interface_Log_Handler', $implements, true)) {
                    $register_handlers[] = $handler;
                } else {
                    _doing_it_wrong(
                        __METHOD__,
                        sprintf(
                        /* translators: 1: class name 2: Yatra_Interface_Log_Handler */
                            __('The provided handler %1$s does not implement %2$s.', 'yatra'),
                            '<code>' . esc_html(is_object($handler) ? get_class($handler) : $handler) . '</code>',
                            '<code>Yatra_Interface_Log_Handler</code>'
                        ),
                        '3.0'
                    );
                }
            }
        }

        // Support the constant as long as a valid log level has been set for it.
        if (null === $threshold) {
            $threshold = defined('YATRA_LOG_THRESHOLD') ? YATRA_LOG_THRESHOLD : null;
            if (null !== $threshold && !Yatra_Log_Levels::is_valid_level($threshold)) {
                $threshold = null;
            }
        }

        if (null !== $threshold) {
            $threshold = Yatra_Log_Levels::get_level_severity($threshold);
        }

        $this->handlers = $register_handlers;
        $this->threshold = $threshold;
    }

    /**
     * Determine whether to handle or ignore log.
     *
     * @param string $level emergency|alert|critical|error|warning|notice|info|debug.
     * @return bool True if the log should be handled.
     */
    protected function should_handle($level)
    {
        if (null === $this->threshold) {
            return true;
        }
        return $this->threshold <= Yatra_Log_Levels::get_level_severity($level);
    }

    /**
     * Add a log entry.
     *
     * This is not the preferred method for adding log messages. Please use log() or any one of
     * the level methods (debug(), info(), etc.). This method may be deprecated in the future.
     *
     * @param string $handle File handle.
     * @param string $message Message to log.
     * @param string $level Logging level.
     * @return bool
     */
    public function add($handle, $message, $level = Yatra_Log_Levels::NOTICE)
    {
        $message = apply_filters('yatra_logger_add_message', $message, $handle);
        $this->log(
            $level,
            $message,
            array(
                'source' => $handle,
                '_legacy' => true,
            )
        );
        return true;
    }

    /**
     * Add a log entry.
     *
     * @param string $level One of the following:
     *     'emergency': System is unusable.
     *     'alert': Action must be taken immediately.
     *     'critical': Critical conditions.
     *     'error': Error conditions.
     *     'warning': Warning conditions.
     *     'notice': Normal but significant condition.
     *     'info': Informational messages.
     *     'debug': Debug-level messages.
     * @param string $message Log message.
     * @param array $context Optional. Additional information for log handlers.
     */
    public function log($level, $message, $context = array())
    {
        if (!Yatra_Log_Levels::is_valid_level($level)) {
            /* translators: 1: Yatra_Logger::log 2: level */
            _doing_it_wrong(__METHOD__, sprintf(__('%1$s was called with an invalid level "%2$s".', 'yatra'), '<code>Yatra_Logger::log</code>', $level), '3.0');
        }

        if ($this->should_handle($level)) {
            $timestamp = time();

            foreach ($this->handlers as $handler) {
                /**
                 * Filter the logging message. Returning null will prevent logging from occuring since 5.3.
                 *
                 * @param string $message Log message.
                 * @param string $level One of: emergency, alert, critical, error, warning, notice, info, or debug.
                 * @param array $context Additional information for log handlers.
                 * @param object $handler The handler object, such as Yatra_Log_Handler_File. Available since 5.3.
                 * @since 3.1
                 */
                $message = apply_filters('yatra_logger_log_message', $message, $level, $context, $handler);

                if (null !== $message) {
                    $handler->handle($timestamp, $level, $message, $context);
                }
            }
        }
    }

    /**
     * Adds an emergency level message.
     *
     * System is unusable.
     *
     * @param string $message Message to log.
     * @param array $context Log context.
     * @see Yatra_Logger::log
     *
     */
    public function emergency($message, $context = array())
    {
        $this->log(Yatra_Log_Levels::EMERGENCY, $message, $context);
    }

    /**
     * Adds an alert level message.
     *
     * Action must be taken immediately.
     * Example: Entire website down, database unavailable, etc.
     *
     * @param string $message Message to log.
     * @param array $context Log context.
     * @see Yatra_Logger::log
     *
     */
    public function alert($message, $context = array())
    {
        $this->log(Yatra_Log_Levels::ALERT, $message, $context);
    }

    /**
     * Adds a critical level message.
     *
     * Critical conditions.
     * Example: Application component unavailable, unexpected exception.
     *
     * @param string $message Message to log.
     * @param array $context Log context.
     * @see Yatra_Logger::log
     *
     */
    public function critical($message, $context = array())
    {
        $this->log(Yatra_Log_Levels::CRITICAL, $message, $context);
    }

    /**
     * Adds an error level message.
     *
     * Runtime errors that do not require immediate action but should typically be logged
     * and monitored.
     *
     * @param string $message Message to log.
     * @param array $context Log context.
     * @see Yatra_Logger::log
     *
     */
    public function error($message, $context = array())
    {
        $this->log(Yatra_Log_Levels::ERROR, $message, $context);
    }

    /**
     * Adds a warning level message.
     *
     * Exceptional occurrences that are not errors.
     *
     * Example: Use of deprecated APIs, poor use of an API, undesirable things that are not
     * necessarily wrong.
     *
     * @param string $message Message to log.
     * @param array $context Log context.
     * @see Yatra_Logger::log
     *
     */
    public function warning($message, $context = array())
    {
        $this->log(Yatra_Log_Levels::WARNING, $message, $context);
    }

    /**
     * Adds a notice level message.
     *
     * Normal but significant events.
     *
     * @param string $message Message to log.
     * @param array $context Log context.
     * @see Yatra_Logger::log
     *
     */
    public function notice($message, $context = array())
    {
        $this->log(Yatra_Log_Levels::NOTICE, $message, $context);
    }

    /**
     * Adds a info level message.
     *
     * Interesting events.
     * Example: User logs in, SQL logs.
     *
     * @param string $message Message to log.
     * @param array $context Log context.
     * @see Yatra_Logger::log
     *
     */
    public function info($message, $context = array())
    {
        $this->log(Yatra_Log_Levels::INFO, $message, $context);
    }

    /**
     * Adds a debug level message.
     *
     * Detailed debug information.
     *
     * @param string $message Message to log.
     * @param array $context Log context.
     * @see Yatra_Logger::log
     *
     */
    public function debug($message, $context = array())
    {
        $this->log(Yatra_Log_Levels::DEBUG, $message, $context);
    }

    /**
     * Clear entries for a chosen file/source.
     *
     * @param string $source Source/handle to clear.
     * @return bool
     */
    public function clear($source = '')
    {
        if (!$source) {
            return false;
        }
        foreach ($this->handlers as $handler) {
            if (is_callable(array($handler, 'clear'))) {
                $handler->clear($source);
            }
        }
        return true;
    }

    /**
     * Clear all logs older than a defined number of days. Defaults to 30 days.
     *
     * @since 3.4.0
     */
    public function clear_expired_logs()
    {
        $days = absint(apply_filters('yatra_logger_days_to_retain_logs', 30));
        $timestamp = strtotime("-{$days} days");

        foreach ($this->handlers as $handler) {
            if (is_callable(array($handler, 'delete_logs_before_timestamp'))) {
                $handler->delete_logs_before_timestamp($timestamp);
            }
        }
    }
}
