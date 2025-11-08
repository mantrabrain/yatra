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
    public function find(int $id): ?\stdClass
    {
        $table = esc_sql($this->table);
        $result = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM `{$table}` WHERE id = %d",
                $id
            )
        );

        return $result ?: null;
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

        return $this->wpdb->get_results($query) ?: [];
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
                $conditions[] = $this->wpdb->prepare("{$key} = %s", $value);
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
        $order = $args['order'] ?? 'DESC';

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
            if (is_string($value)) {
                $sanitized[$key] = sanitize_text_field($value);
            } elseif (is_numeric($value)) {
                $sanitized[$key] = $value;
            } elseif (is_array($value)) {
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

