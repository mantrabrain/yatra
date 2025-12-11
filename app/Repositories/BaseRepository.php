<?php

declare(strict_types=1);

namespace Yatra\Repositories;

/**
 * Base Repository Class
 * Provides common database operations using $wpdb
 */
abstract class BaseRepository
{
    /**
     * @var \wpdb
     */
    protected $wpdb;

    /**
     * @var string Table name (without prefix)
     */
    protected string $table;

    /**
     * Constructor
     */
    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->table = $this->getTableName();
    }

    /**
     * Get full table name with prefix
     */
    abstract protected function getTableName(): string;

    /**
     * Find a record by ID
     */
    public function find(int $id, bool $includeDeleted = false): ?\stdClass
    {
        $table = esc_sql($this->table);
        $query = "SELECT * FROM `{$table}` WHERE id = %d";
        
        if (!$includeDeleted && $this->hasSoftDelete()) {
            $query .= " AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00')";
        }
        
        $result = $this->wpdb->get_row(
            $this->wpdb->prepare($query, $id)
        );

        return $result ?: null;
    }

    /**
     * Check if table has soft delete column
     */
    protected function hasSoftDelete(): bool
    {
        // Check if deleted_at column exists
        $table = esc_sql($this->table);
        $column = $this->wpdb->get_var(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() 
             AND TABLE_NAME = '{$table}' 
             AND COLUMN_NAME = 'deleted_at'"
        );
        
        return (int) $column > 0;
    }

    /**
     * Get all records
     */
    public function all(array $args = []): array
    {
        $table = esc_sql($this->table);
        $where = $this->buildWhereClause($args);
        $order = $this->buildOrderClause($args);
        $limit = $this->buildLimitClause($args);

        $query = "SELECT * FROM `{$table}` {$where} {$order} {$limit}";

        // DEBUG: Log query execution for TripRepository
        if (defined('WP_DEBUG') && WP_DEBUG && strpos($table, 'yatra_trips') !== false) {
            error_log('YATRA TRIP QUERY DEBUG - Table: ' . $table);
            error_log('YATRA TRIP QUERY DEBUG - Final SQL: ' . $query);
        }

        $results = $this->wpdb->get_results($query) ?: [];
        
        // DEBUG: Log results for TripRepository
        if (defined('WP_DEBUG') && WP_DEBUG && strpos($table, 'yatra_trips') !== false) {
            error_log('YATRA TRIP QUERY DEBUG - Query returned ' . count($results) . ' results');
            if ($this->wpdb->last_error) {
                error_log('YATRA TRIP QUERY DEBUG - SQL Error: ' . $this->wpdb->last_error);
            }
        }

        return $results;
    }

    /**
     * Create a new record
     */
    public function create(array $data): int
    {
        $data = $this->sanitizeData($data);
        $data['created_at'] = current_time('mysql');
        $data['updated_at'] = current_time('mysql');

        $result = $this->wpdb->insert($this->table, $data);

        if ($result === false) {
            throw new \Exception('Failed to create record: ' . $this->wpdb->last_error);
        }

        return $this->wpdb->insert_id;
    }

    /**
     * Update a record
     */
    public function update(int $id, array $data): bool
    {
        $data = $this->sanitizeData($data);
        $data['updated_at'] = current_time('mysql');

        $result = $this->wpdb->update(
            $this->table,
            $data,
            ['id' => $id],
            null,
            ['%d']
        );

        return $result !== false;
    }

    /**
     * Delete a record
     */
    public function delete(int $id): bool
    {
        $result = $this->wpdb->delete(
            $this->table,
            ['id' => $id],
            ['%d']
        );

        return $result !== false;
    }

    /**
     * Build WHERE clause
     */
    protected function buildWhereClause(array $args): string
    {
        $conditions = [];

        if (isset($args['where'])) {
            foreach ($args['where'] as $key => $value) {
                // Sanitize column name to prevent SQL injection
                $key = preg_replace('/[^a-zA-Z0-9_]/', '', $key);

                if ($value === null) {
                    $conditions[] = "`{$key}` IS NULL";
                } elseif ($value === 'NOT NULL') {
                    $conditions[] = "`{$key}` IS NOT NULL";
                } elseif (is_array($value) && !empty($value)) {
                    $placeholders = implode(',', array_fill(0, count($value), '%s'));
                    $conditions[] = $this->wpdb->prepare(
                        "`{$key}` IN ({$placeholders})",
                        ...$value
                    );
                } else {
                    $conditions[] = $this->wpdb->prepare("`{$key}` = %s", $value);
                }
            }
        }

        return !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';
    }

    /**
     * Build ORDER BY clause
     */
    protected function buildOrderClause(array $args): string
    {
        $order_by = $args['order_by'] ?? 'id';
        $order = strtoupper($args['order'] ?? 'DESC');

        // Map common order_by aliases to actual column names
        $column_map = [
            'name' => 'name',
            'title' => 'title',
            'status' => 'status',
            'date' => 'created_at',
            'created_at' => 'created_at',
            'updated_at' => 'updated_at',
        ];

        $order_by = $column_map[$order_by] ?? $order_by;

        // Sanitize order_by to prevent SQL injection
        $order_by = preg_replace('/[^a-zA-Z0-9_]/', '', $order_by);
        $order = in_array($order, ['ASC', 'DESC'], true) ? $order : 'DESC';

        return "ORDER BY {$order_by} {$order}";
    }

    /**
     * Build LIMIT clause
     */
    protected function buildLimitClause(array $args): string
    {
        if (isset($args['limit'])) {
            $limit = (int) $args['limit'];
            $offset = isset($args['offset']) ? (int) $args['offset'] : 0;
            return "LIMIT {$offset}, {$limit}";
        }

        return '';
    }

    /**
     * Sanitize data before insert/update
     */
    protected function sanitizeData(array $data): array
    {
        $sanitized = [];

        foreach ($data as $key => $value) {
            // Skip internal fields that are handled separately
            if (in_array($key, ['created_at', 'updated_at'], true)) {
                $sanitized[$key] = $value;
                continue;
            }

            if (is_string($value)) {
                // Use appropriate sanitization based on field type
                if ($key === 'description') {
                    $sanitized[$key] = sanitize_textarea_field($value);
                } elseif (in_array($key, ['created_by', 'updated_by', 'id'], true)) {
                    $sanitized[$key] = absint($value);
                } else {
                $sanitized[$key] = sanitize_text_field($value);
                }
            } elseif (is_numeric($value)) {
                // Ensure integers are properly cast
                if (in_array($key, ['created_by', 'updated_by', 'id'], true)) {
                    $sanitized[$key] = absint($value);
                } else {
                $sanitized[$key] = $value;
                }
            } elseif (is_array($value)) {
                // Arrays should already be serialized by service layer
                $sanitized[$key] = maybe_serialize($value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    /**
     * Count records
     */
    public function count(array $args = []): int
    {
        $table = esc_sql($this->table);
        $where = $this->buildWhereClause($args);
        $query = "SELECT COUNT(*) FROM `{$table}` {$where}";

        return (int) $this->wpdb->get_var($query);
    }
}

