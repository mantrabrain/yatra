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
     * Generate a slug from a string
     * Uses WordPress sanitize_title() function
     * 
     * @param string $text The text to convert to a slug
     * @return string A URL-friendly slug
     */
    public static function generate(string $text): string
    {
        if (empty($text)) {
            return '';
        }

        // Use WordPress's sanitize_title function for consistency
        return sanitize_title($text);
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

