<?php

declare(strict_types=1);

namespace Yatra\Core\Handlers;

/**
 * Base Page Handler
 *
 * Provides common functionality for all page handlers
 */
abstract class BasePageHandler
{
    /**
     * Handle the page request
     *
     * @param array $route_data Route data from RouteMatcher
     * @return bool True if handled successfully
     */
    abstract public function handle(array $route_data): bool;

    /**
     * Set query vars for backward compatibility
     *
     * @param array $vars Query vars to set
     */
    protected function setQueryVars(array $vars): void
    {
        global $wp_query;

        foreach ($vars as $key => $value) {
            $wp_query->set($key, $value);
        }
    }

    /**
     * Set 404 status
     */
    protected function set404(): void
    {
        global $wp_query;

        $wp_query->set_404();
        status_header(404);
    }

    /**
     * Prevent 404 handling and set 200 status
     */
    protected function prevent404(): void
    {
        global $wp_query;

        $wp_query->is_404 = false;
        status_header(200);
    }

    /**
     * Set global variable
     *
     * @param string $name Variable name
     * @param mixed $value Variable value
     */
    protected function setGlobal(string $name, $value): void
    {
        $GLOBALS[$name] = $value;
    }

    /**
     * Log error message
     *
     * @param string $message Error message
     */
    protected function logError(string $message): void
    {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra PageHandler: ' . $message);
        }
    }

    /**
     * Exit with optional message
     *
     * @param string|null $message Optional exit message
     */
    protected function exit(?string $message = null): void
    {
        if ($message && defined('WP_DEBUG') && WP_DEBUG) {
            echo '<!-- ' . esc_html($message) . ' -->';
        }
        exit;
    }
}
