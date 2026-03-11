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
     * @var array Fields that contain rich text/HTML content (e.g., from Quill editor)
     * Child repositories MUST override this to specify their rich text fields
     * Example: ['description', 'content', 'notes', 'details']
     */
    protected array $richTextFields = [];

    /**
     * @var array Fields that should be treated as integers
     * Child repositories can override this to add entity-specific integer fields
     * Common fields like 'id', 'created_by', 'updated_by' should be added by child classes
     */
    protected array $integerFields = [];

    /**
     * @var array Fields that contain JSON data
     * Child repositories can override this to specify JSON fields
     * These fields will not be sanitized with sanitize_text_field to preserve JSON structure
     */
    protected array $jsonFields = [];

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
     * Get table name (without prefix)
     */
    public function getTable(): string
    {
        return $this->table;
    }

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

        $results = $this->wpdb->get_results($query) ?: [];

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

        $success = $result !== false;
        
        // DEBUG: Log the result
        if (defined('WP_DEBUG') && WP_DEBUG) {
            }

        return $success;
    }

    /**
     * Delete a record
     */
    public function delete(int $id): bool
    {
        // DEBUG: Log repository delete attempt
        if (defined('WP_DEBUG') && WP_DEBUG) {
            }
        
        $result = $this->wpdb->delete(
            $this->table,
            ['id' => $id],
            ['%d']
        );

        $success = $result !== false;
        
        // DEBUG: Log repository delete result
        if (defined('WP_DEBUG') && WP_DEBUG) {
            if (!$success) {
                }
        }

        return $success;
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

        // DEBUG: Check for soft delete
        if (defined('WP_DEBUG') && WP_DEBUG && strpos($this->table, 'yatra_trips') !== false) {
            }

        // Add soft delete condition if table has deleted_at column and not including deleted
        if ($this->hasSoftDelete() && (!isset($args['include_deleted']) || !$args['include_deleted'])) {
            $conditions[] = "(deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00')";
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
                if (in_array($key, $this->richTextFields, true)) {
                    // Sanitize Quill HTML content (allows safe HTML tags)
                    $sanitized[$key] = \Yatra\Helpers\FormatHelper::sanitizeQuillHtml($value);
                } elseif (in_array($key, $this->jsonFields, true)) {
                    // JSON fields - preserve the JSON string as-is
                    $sanitized[$key] = $value;
                } elseif (in_array($key, $this->integerFields, true)) {
                    $sanitized[$key] = absint($value);
                } else {
                    $sanitized[$key] = sanitize_text_field($value);
                }
            } elseif (is_numeric($value)) {
                // Ensure integers are properly cast
                if (in_array($key, $this->integerFields, true)) {
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

        // DEBUG: Log count method details for yatra_trips
        if (defined('WP_DEBUG') && WP_DEBUG && strpos($this->table, 'yatra_trips') !== false) {
            }

        return (int) $this->wpdb->get_var($query);
    }

    /**
     * Get status counts for admin list views
     */
    public function getStatusCounts(array $args = []): array
    {
        $table = esc_sql($this->table);
        $where = $this->buildWhereClause($args);
        
        $sql = "SELECT status, COUNT(*) as count 
                FROM `{$table}` 
                {$where}
                GROUP BY status";
        
        $results = $this->wpdb->get_results($sql) ?: [];

        $counts = [
            'publish' => 0,
            'draft' => 0,
            'trash' => 0,
            'total' => 0
        ];
        
        foreach ($results as $row) {
            $status = $row->status;
            $count = (int) $row->count;
            
            // Map old status values to new ones if needed
            if ($status === 'active') {
                $status = 'publish';
            } elseif ($status === 'inactive') {
                $status = 'trash';
            }
            
            if (isset($counts[$status])) {
                $counts[$status] = $count;
            }
            $counts['total'] += $count;
        }
        
        return $counts;
    }
}

