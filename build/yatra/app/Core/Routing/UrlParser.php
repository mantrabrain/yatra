<?php

declare(strict_types=1);

namespace Yatra\Core\Routing;

/**
 * URL Parser for extracting clean request paths from WordPress requests
 *
 * Handles URL parsing logic that was duplicated across all handler methods
 */
class UrlParser
{
    /**
     * Get the clean request path from current WordPress request
     *
     * @return string Clean request path without site subdirectory
     */
    public static function getCleanRequestPath(): string
    {
        global $wp;

        $request_path = '';

        // Method 1: Get from $wp->request if available
        if (isset($wp) && isset($wp->request)) {
            $request_path = trim((string) $wp->request, '/');
        }

        // Method 2: Fallback to parsing REQUEST_URI
        if (empty($request_path)) {
            $request_uri = $_SERVER['REQUEST_URI'] ?? '';
            $parsed_uri = wp_parse_url($request_uri);
            $path = $parsed_uri['path'] ?? '';
            $path = trim($path, '/');

            // Remove site subdirectory if WordPress is installed in subdir
            $home_path = wp_parse_url(home_url('/'), PHP_URL_PATH);
            $home_path = $home_path ? trim($home_path, '/') : '';
            if ($home_path && str_starts_with($path, $home_path)) {
                $path = trim(substr($path, strlen($home_path)), '/');
            }

            $request_path = $path;
        }

        return $request_path;
    }

    /**
     * Extract slug from URL path using pattern matching
     *
     * @param string $path Request path
     * @param string $base Base path to match against
     * @return string|null Extracted slug or null if no match
     */
    public static function extractSlugFromPath(string $path, string $base): ?string
    {
        $escaped_base = preg_quote($base, '/');
        $pattern = '/^' . $escaped_base . '\/([^\/]+)\/?$/';

        if (preg_match($pattern, $path, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Extract token from URL path using pattern matching
     *
     * @param string $path Request path
     * @param string $pattern Regex pattern to match
     * @return string|null Extracted token or null if no match
     */
    public static function extractTokenFromPath(string $path, string $pattern): ?string
    {
        if (preg_match($pattern, $path, $matches)) {
            return $matches[1];
        }

        return null;
    }
}
