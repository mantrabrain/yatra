<?php
/**
 * Requirements Checker for Yatra Plugin
 *
 * Handles minimum PHP, WordPress version checks and required extensions
 *
 * @package Yatra\Core
 */

namespace Yatra\Core;

class Requirements
{
    /**
     * Minimum PHP version required
     */
    private const MIN_PHP_VERSION = '8.0';

    /**
     * Minimum WordPress version required
     */
    private const MIN_WP_VERSION = '6.0';

    /**
     * Required PHP extensions
     */
    private const REQUIRED_EXTENSIONS = ['curl', 'json', 'mbstring'];

    /**
     * Check if all minimum requirements are met
     *
     * @return bool
     */
    public static function check(): bool
    {
        global $wp_version;

        $errors = [];

        // Check PHP version
        if (version_compare(PHP_VERSION, self::MIN_PHP_VERSION, '<')) {
            $errors[] = sprintf(
                'PHP version %s or higher is required. You are running version %s.',
                self::MIN_PHP_VERSION,
                PHP_VERSION
            );
        }

        // Check WordPress version
        if (version_compare($wp_version, self::MIN_WP_VERSION, '<')) {
            $errors[] = sprintf(
                'WordPress version %s or higher is required. You are running version %s.',
                self::MIN_WP_VERSION,
                $wp_version
            );
        }

        // Check required PHP extensions
        foreach (self::REQUIRED_EXTENSIONS as $extension) {
            if (!extension_loaded($extension)) {
                $errors[] = sprintf(
                    'The PHP extension %s is required but not installed.',
                    $extension
                );
            }
        }

        if (!empty($errors)) {
            add_action('admin_notices', function() use ($errors) {
                echo '<div class="notice notice-error"><p>';
                echo '<strong>Yatra Plugin Error:</strong><br>';
                foreach ($errors as $error) {
                    echo esc_html($error) . '<br>';
                }
                echo '</p></div>';
            });
            return false;
        }

        return true;
    }

    /**
     * Get minimum PHP version
     *
     * @return string
     */
    public static function getMinPhpVersion(): string
    {
        return self::MIN_PHP_VERSION;
    }

    /**
     * Get minimum WordPress version
     *
     * @return string
     */
    public static function getMinWpVersion(): string
    {
        return self::MIN_WP_VERSION;
    }

    /**
     * Get required extensions
     *
     * @return array
     */
    public static function getRequiredExtensions(): array
    {
        return self::REQUIRED_EXTENSIONS;
    }
}
