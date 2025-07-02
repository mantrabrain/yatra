<?php

declare(strict_types=1);

namespace Yatra\Core\Database;

/**
 * Database connection manager
 */
class Connection
{
    /**
     * @var \wpdb
     */
    private $wpdb;

    /**
     * @var bool
     */
    private $connected = false;

    /**
     * Connection constructor
     */
    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
    }

    /**
     * Connect to database
     */
    public function connect(): bool
    {
        if ($this->connected) {
            return true;
        }

        // Test connection
        $result = $this->wpdb->get_var("SELECT 1");
        
        if ($result === null) {
            throw new \Exception('Database connection failed');
        }

        $this->connected = true;
        return true;
    }

    /**
     * Get database instance
     */
    public function getDatabase(): \wpdb
    {
        return $this->wpdb;
    }

    /**
     * Execute a query
     */
    public function query(string $query, ...$args)
    {
        if (!empty($args)) {
            $query = $this->wpdb->prepare($query, ...$args);
        }

        return $this->wpdb->query($query);
    }

    /**
     * Get a single row
     */
    public function getRow(string $query, ...$args)
    {
        if (!empty($args)) {
            $query = $this->wpdb->prepare($query, ...$args);
        }

        return $this->wpdb->get_row($query);
    }

    /**
     * Get multiple rows
     */
    public function getResults(string $query, ...$args)
    {
        if (!empty($args)) {
            $query = $this->wpdb->prepare($query, ...$args);
        }

        return $this->wpdb->get_results($query);
    }

    /**
     * Get a single value
     */
    public function getVar(string $query, ...$args)
    {
        if (!empty($args)) {
            $query = $this->wpdb->prepare($query, ...$args);
        }

        return $this->wpdb->get_var($query);
    }

    /**
     * Get a single column
     */
    public function getCol(string $query, ...$args)
    {
        if (!empty($args)) {
            $query = $this->wpdb->prepare($query, ...$args);
        }

        return $this->wpdb->get_col($query);
    }

    /**
     * Insert a row
     */
    public function insert(string $table, array $data, array $format = null): int
    {
        $result = $this->wpdb->insert($table, $data, $format);
        
        if ($result === false) {
            throw new \Exception('Insert failed: ' . $this->wpdb->last_error);
        }

        return $this->wpdb->insert_id;
    }

    /**
     * Update rows
     */
    public function update(string $table, array $data, array $where, array $format = null, array $whereFormat = null): int
    {
        $result = $this->wpdb->update($table, $data, $where, $format, $whereFormat);
        
        if ($result === false) {
            throw new \Exception('Update failed: ' . $this->wpdb->last_error);
        }

        return $result;
    }

    /**
     * Delete rows
     */
    public function delete(string $table, array $where, array $whereFormat = null): int
    {
        $result = $this->wpdb->delete($table, $where, $whereFormat);
        
        if ($result === false) {
            throw new \Exception('Delete failed: ' . $this->wpdb->last_error);
        }

        return $result;
    }

    /**
     * Get table name with prefix
     */
    public function getTableName(string $table): string
    {
        return $this->wpdb->prefix . $table;
    }

    /**
     * Check if table exists
     */
    public function tableExists(string $table): bool
    {
        $tableName = $this->getTableName($table);
        $result = $this->wpdb->get_var("SHOW TABLES LIKE '{$tableName}'");
        return $result === $tableName;
    }

    /**
     * Get last error
     */
    public function getLastError(): string
    {
        return $this->wpdb->last_error;
    }

    /**
     * Get last query
     */
    public function getLastQuery(): string
    {
        return $this->wpdb->last_query;
    }

    /**
     * Begin transaction
     */
    public function beginTransaction(): void
    {
        $this->wpdb->query('START TRANSACTION');
    }

    /**
     * Commit transaction
     */
    public function commit(): void
    {
        $this->wpdb->query('COMMIT');
    }

    /**
     * Rollback transaction
     */
    public function rollback(): void
    {
        $this->wpdb->query('ROLLBACK');
    }

    /**
     * Check if connected
     */
    public function isConnected(): bool
    {
        return $this->connected;
    }
} 