<?php

namespace Yatra\Database\Tables;

/**
 * Base Table Class
 * 
 * Parent class for all database table classes.
 * Handles WordPress prefix and provides common functionality.
 */
abstract class BaseTable
{
    /**
     * Table name without prefix (to be defined in child classes)
     */
    protected static string $table = '';

    /**
     * Get the full table name with WordPress prefix
     */
    public static function getTableName(): string
    {
        global $wpdb;
        return $wpdb->prefix . static::$table;
    }

    /**
     * Get the charset collate for table creation
     */
    public static function getCharsetCollate(): string
    {
        global $wpdb;
        return $wpdb->get_charset_collate();
    }

    /**
     * Get the complete table schema as raw SQL CREATE TABLE statement
     */
    abstract public static function getSchema(): string;
}
