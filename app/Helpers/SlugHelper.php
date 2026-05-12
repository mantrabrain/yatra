<?php

declare(strict_types=1);

namespace Yatra\Helpers;

/**
 * Slug Helper
 * Generates URL-friendly slugs from text
 * Uses WordPress sanitize_title() for consistency
 */
class SlugHelper
{
    /**
     * Generate a slug from a string.
     *
     * Unicode-aware so Cyrillic / CJK / Devanagari / accented Latin survive.
     * We avoid WordPress's sanitize_title() because for non-Latin input it
     * percent-encodes the result (e.g. "моя-семья" → "%d0%bc..."). That
     * percent-encoded form then gets stripped to "-" by `sanitize_text_field()`
     * further down the BaseRepository write path, so the DB stores just a
     * dash. Doing the normalisation here in raw Unicode lets the slug pass
     * through `sanitize_text_field()` unchanged.
     *
     * @param string $text The text to convert to a slug
     * @return string A URL-friendly slug
     */
    public static function generate(string $text): string
    {
        if ($text === '') {
            return '';
        }

        // Decode any percent-encoded UTF-8 first. This matches WordPress core
        // behaviour (see WP::parse_request / get_page_by_path) — when our
        // route matchers receive a slug captured from a rewrite rule, it
        // arrives in its URL-encoded form (e.g. `%D0%BC%D0%BE%D1%8F-...`
        // for "моя-..."). Without this, the regex below would treat the `%`
        // as invalid, strip everything, and produce a meaningless byte
        // string. rawurldecode (instead of urldecode) preserves a literal
        // `+` — a `+` is not URL-encoding for space in path segments, so we
        // shouldn't accidentally turn it into one.
        if (strpos($text, '%') !== false) {
            $decoded = rawurldecode($text);
            if ($decoded !== false && $decoded !== '') {
                $text = $decoded;
            }
        }

        // Lowercase. mb_strtolower handles Cyrillic / Greek / accented Latin
        // correctly (strtolower is byte-wise and would mangle multibyte).
        if (function_exists('mb_strtolower')) {
            $text = mb_strtolower($text, 'UTF-8');
        } else {
            $text = strtolower($text);
        }

        // Strip HTML and decode entities so &amp; etc. don't bleed through.
        $text = wp_strip_all_tags($text);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // Replace whitespace / underscore runs with a single hyphen.
        $text = preg_replace('/[\s_]+/u', '-', $text) ?? '';

        // Keep letters (any script), digits, and hyphens. \pL + \pN with the
        // `u` flag matches Unicode letter and number categories.
        $text = preg_replace('/[^\pL\pN-]+/u', '', $text) ?? '';

        // Collapse multiple consecutive hyphens.
        $text = preg_replace('/-+/u', '-', $text) ?? '';

        // Trim leading / trailing hyphens.
        return trim($text, '-');
    }

    /**
     * Generate a unique slug by appending a number if needed
     * 
     * @param string $baseSlug The base slug
     * @param array $existingSlugs Array of existing slugs to check against
     * @return string A unique slug
     */
    public static function generateUnique(string $baseSlug, array $existingSlugs): string
    {
        $slug = self::generate($baseSlug);
        
        if (empty($slug)) {
            $slug = 'untitled';
        }

        // If slug is already unique, return it
        if (!in_array($slug, $existingSlugs, true)) {
            return $slug;
        }

        // Try appending numbers until we find a unique slug
        $counter = 1;
        $uniqueSlug = $slug . '-' . $counter;
        
        while (in_array($uniqueSlug, $existingSlugs, true)) {
            $counter++;
            $uniqueSlug = $slug . '-' . $counter;
        }

        return $uniqueSlug;
    }

    /**
     * Generate a unique slug by checking against database
     * 
     * @param string $baseSlug The base slug
     * @param string $tableName The table name (without prefix)
     * @param string $columnName The column name (default: 'slug')
     * @param int|null $excludeId ID to exclude from check (for updates)
     * @return string A unique slug
     */
    public static function generateUniqueFromDatabase(
        string $baseSlug,
        string $tableName,
        string $columnName = 'slug',
        ?int $excludeId = null
    ): string {
        global $wpdb;
        
        $slug = self::generate($baseSlug);
        
        if (empty($slug)) {
            $slug = 'untitled';
        }

        // Check if table name already has prefix to avoid double prefix
        if (strpos($tableName, $wpdb->prefix) === 0) {
            $table = $tableName; // Already has prefix
        } else {
            $table = $wpdb->prefix . $tableName; // Add prefix
        }
        $table = esc_sql($table);
        $columnName = esc_sql($columnName);

        // Check if slug exists
        $query = $wpdb->prepare(
            "SELECT COUNT(*) FROM `{$table}` WHERE `{$columnName}` = %s",
            $slug
        );

        // Exclude current ID if updating
        if ($excludeId !== null) {
            $query = $wpdb->prepare(
                "SELECT COUNT(*) FROM `{$table}` WHERE `{$columnName}` = %s AND id != %d",
                $slug,
                $excludeId
            );
        }

        $exists = (int) $wpdb->get_var($query) > 0;

        if (!$exists) {
            return $slug;
        }

        // Try appending numbers until we find a unique slug
        $counter = 1;
        $uniqueSlug = $slug . '-' . $counter;

        while (true) {
            $checkQuery = $wpdb->prepare(
                "SELECT COUNT(*) FROM `{$table}` WHERE `{$columnName}` = %s",
                $uniqueSlug
            );

            if ($excludeId !== null) {
                $checkQuery = $wpdb->prepare(
                    "SELECT COUNT(*) FROM `{$table}` WHERE `{$columnName}` = %s AND id != %d",
                    $uniqueSlug,
                    $excludeId
                );
            }

            $exists = (int) $wpdb->get_var($checkQuery) > 0;

            if (!$exists) {
                return $uniqueSlug;
            }

            $counter++;
            $uniqueSlug = $slug . '-' . $counter;
        }
    }
}

