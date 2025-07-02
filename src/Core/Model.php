<?php

declare(strict_types=1);

namespace Yatra\Core;

use Yatra\Core\Database\Connection;
use Yatra\Core\Database\QueryBuilder;

/**
 * Base Model class for database operations
 */
abstract class Model
{
    /**
     * @var string
     */
    protected $table;

    /**
     * @var array
     */
    protected $fillable = [];

    /**
     * @var array
     */
    protected $casts = [];

    /**
     * @var QueryBuilder
     */
    private static $queryBuilder;

    /**
     * @var Connection
     */
    private static $connection;

    /**
     * Get query builder instance
     */
    protected static function getQueryBuilder(): QueryBuilder
    {
        if (!self::$queryBuilder) {
            self::$connection = new Connection();
            self::$queryBuilder = new QueryBuilder(self::$connection);
        }
        return self::$queryBuilder;
    }

    /**
     * Get connection instance
     */
    protected static function getConnection(): Connection
    {
        if (!self::$connection) {
            self::$connection = new Connection();
        }
        return self::$connection;
    }

    /**
     * Start a new query
     */
    public static function query(): QueryBuilder
    {
        $instance = new static();
        return self::getQueryBuilder()->table($instance->table);
    }

    /**
     * Add where clause
     */
    public static function where(string $column, string $operator, $value): QueryBuilder
    {
        return self::query()->where($column, $operator, $value);
    }

    /**
     * Add order by clause
     */
    public static function orderBy(string $column, string $direction = 'ASC'): QueryBuilder
    {
        return self::query()->orderBy($column, $direction);
    }

    /**
     * Get all records
     */
    public static function all(): array
    {
        return self::query()->get();
    }

    /**
     * Get records with query builder
     */
    public static function get(): array
    {
        return self::query()->get();
    }

    /**
     * Get first record
     */
    public static function first()
    {
        return self::query()->first();
    }

    /**
     * Find by ID
     */
    public static function find($id)
    {
        return self::where('id', '=', $id)->first();
    }

    /**
     * Create a new record
     */
    public static function create(array $data)
    {
        $instance = new static();
        $fillableData = array_intersect_key($data, array_flip($instance->fillable));
        
        $connection = self::getConnection();
        $tableName = $connection->getTableName($instance->table);
        
        $id = $connection->insert($tableName, $fillableData);
        
        if ($id) {
            return self::find($id);
        }
        
        return null;
    }

    /**
     * Update records
     */
    public static function update(array $data): int
    {
        $instance = new static();
        $fillableData = array_intersect_key($data, array_flip($instance->fillable));
        
        $connection = self::getConnection();
        $tableName = $connection->getTableName($instance->table);
        
        return $connection->update($tableName, $fillableData, ['id' => $data['id']]);
    }

    /**
     * Delete records
     */
    public static function delete(): int
    {
        $instance = new static();
        $connection = self::getConnection();
        $tableName = $connection->getTableName($instance->table);
        
        // Get the current query conditions
        $queryBuilder = self::getQueryBuilder();
        $sql = $queryBuilder->toSql();
        
        // For now, just delete all (this is a simplified version)
        // In a full implementation, you'd want to preserve the where conditions
        return $connection->delete($tableName, []);
    }

    /**
     * Count records
     */
    public static function count(): int
    {
        return self::query()->count();
    }

    /**
     * Check if exists
     */
    public static function exists(): bool
    {
        return self::query()->exists();
    }

    /**
     * Get table name
     */
    public function getTable(): string
    {
        return $this->table;
    }

    /**
     * Get fillable fields
     */
    public function getFillable(): array
    {
        return $this->fillable;
    }

    /**
     * Get casts
     */
    public function getCasts(): array
    {
        return $this->casts;
    }
} 