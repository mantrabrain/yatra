<?php
/**
 * Polyfills for PHP 8 string helpers when running on PHP 7.4.
 * WordPress core also defines these when missing; this file is a no-op if they already exist.
 */

if (!function_exists('str_contains')) {
    /**
     * @param string $haystack
     * @param string $needle
     */
    function str_contains($haystack, $needle)
    {
        if ($needle === '') {
            return true;
        }

        return strpos((string) $haystack, (string) $needle) !== false;
    }
}

if (!function_exists('str_starts_with')) {
    /**
     * @param string $haystack
     * @param string $needle
     */
    function str_starts_with($haystack, $needle)
    {
        if ($needle === '') {
            return true;
        }

        return strncmp((string) $haystack, (string) $needle, strlen((string) $needle)) === 0;
    }
}
