<?php

declare(strict_types=1);

namespace Yatra\Core\Database;

/**
 * Database schema builder
 */
class Schema
{
    /**
     * @var Connection
     */
    private $connection;

    /**
     * Schema constructor
     */
    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    /**
     * Create a new table
     */
    public function createTable(string $table, callable $callback): void
    {
        $blueprint = new Blueprint($table);
        $callback($blueprint);

        $sql = $this->buildCreateTableSql($blueprint);
        $this->connection->query($sql);
    }

    /**
     * Drop a table
     */
    public function dropTable(string $table): void
    {
        $tableName = $this->connection->getTableName($table);
        $sql = "DROP TABLE IF EXISTS {$tableName}";
        $this->connection->query($sql);
    }

    /**
     * Check if table exists
     */
    public function hasTable(string $table): bool
    {
        return $this->connection->tableExists($table);
    }

    /**
     * Add column to table
     */
    public function addColumn(string $table, string $column, string $type, array $options = []): void
    {
        $tableName = $this->connection->getTableName($table);
        $columnDefinition = $this->buildColumnDefinition($type, $options);
        $sql = "ALTER TABLE {$tableName} ADD COLUMN {$column} {$columnDefinition}";
        $this->connection->query($sql);
    }

    /**
     * Drop column from table
     */
    public function dropColumn(string $table, string $column): void
    {
        $tableName = $this->connection->getTableName($table);
        $sql = "ALTER TABLE {$tableName} DROP COLUMN {$column}";
        $this->connection->query($sql);
    }

    /**
     * Rename column
     */
    public function renameColumn(string $table, string $from, string $to): void
    {
        $tableName = $this->connection->getTableName($table);
        $sql = "ALTER TABLE {$tableName} CHANGE {$from} {$to}";
        $this->connection->query($sql);
    }

    /**
     * Add index to table
     */
    public function addIndex(string $table, array $columns, string $name = null): void
    {
        $tableName = $this->connection->getTableName($table);
        $indexName = $name ?: $this->generateIndexName($table, $columns);
        $columnList = implode(', ', $columns);
        $sql = "ALTER TABLE {$tableName} ADD INDEX {$indexName} ({$columnList})";
        $this->connection->query($sql);
    }

    /**
     * Drop index from table
     */
    public function dropIndex(string $table, string $name): void
    {
        $tableName = $this->connection->getTableName($table);
        $sql = "ALTER TABLE {$tableName} DROP INDEX {$name}";
        $this->connection->query($sql);
    }

    /**
     * Add foreign key
     */
    public function addForeignKey(string $table, string $column, string $references, string $on, string $onDelete = null, string $onUpdate = null): void
    {
        $tableName = $this->connection->getTableName($table);
        $referencesTable = $this->connection->getTableName($references);
        $constraintName = $this->generateForeignKeyName($table, $column);
        
        $sql = "ALTER TABLE {$tableName} ADD CONSTRAINT {$constraintName} FOREIGN KEY ({$column}) REFERENCES {$referencesTable} ({$on})";
        
        if ($onDelete) {
            $sql .= " ON DELETE {$onDelete}";
        }
        
        if ($onUpdate) {
            $sql .= " ON UPDATE {$onUpdate}";
        }
        
        $this->connection->query($sql);
    }

    /**
     * Drop foreign key
     */
    public function dropForeignKey(string $table, string $name): void
    {
        $tableName = $this->connection->getTableName($table);
        $sql = "ALTER TABLE {$tableName} DROP FOREIGN KEY {$name}";
        $this->connection->query($sql);
    }

    /**
     * Build create table SQL
     */
    private function buildCreateTableSql(Blueprint $blueprint): string
    {
        $tableName = $this->connection->getTableName($blueprint->getTable());
        $columns = $this->buildColumns($blueprint);
        $indexes = $this->buildIndexes($blueprint);
        $foreignKeys = $this->buildForeignKeys($blueprint);
        
        $sql = "CREATE TABLE {$tableName} (";
        $sql .= implode(', ', array_merge($columns, $indexes, $foreignKeys));
        $sql .= ") " . $this->getCharsetCollate();
        
        return $sql;
    }

    /**
     * Build columns
     */
    private function buildColumns(Blueprint $blueprint): array
    {
        $columns = [];
        
        foreach ($blueprint->getColumns() as $column) {
            $definition = $this->buildColumnDefinition($column['type'], $column['options']);
            $columns[] = "{$column['name']} {$definition}";
        }
        
        return $columns;
    }

    /**
     * Build column definition
     */
    private function buildColumnDefinition(string $type, array $options = []): string
    {
        $definition = strtoupper($type);
        
        if (isset($options['length'])) {
            $definition .= "({$options['length']})";
        }
        
        if (isset($options['unsigned']) && $options['unsigned']) {
            $definition .= ' UNSIGNED';
        }
        
        if (isset($options['nullable']) && !$options['nullable']) {
            $definition .= ' NOT NULL';
        }
        
        if (isset($options['default'])) {
            $definition .= " DEFAULT '{$options['default']}'";
        }
        
        if (isset($options['auto_increment']) && $options['auto_increment']) {
            $definition .= ' AUTO_INCREMENT';
        }
        
        if (isset($options['primary']) && $options['primary']) {
            $definition .= ' PRIMARY KEY';
        }
        
        if (isset($options['unique']) && $options['unique']) {
            $definition .= ' UNIQUE';
        }
        
        return $definition;
    }

    /**
     * Build indexes
     */
    private function buildIndexes(Blueprint $blueprint): array
    {
        $indexes = [];
        
        foreach ($blueprint->getIndexes() as $index) {
            $columns = implode(', ', $index['columns']);
            $indexes[] = "INDEX {$index['name']} ({$columns})";
        }
        
        return $indexes;
    }

    /**
     * Build foreign keys
     */
    private function buildForeignKeys(Blueprint $blueprint): array
    {
        $foreignKeys = [];
        
        foreach ($blueprint->getForeignKeys() as $foreignKey) {
            $referencesTable = $this->connection->getTableName($foreignKey['references']);
            $sql = "FOREIGN KEY ({$foreignKey['column']}) REFERENCES {$referencesTable} ({$foreignKey['on']})";
            
            if (isset($foreignKey['on_delete'])) {
                $sql .= " ON DELETE {$foreignKey['on_delete']}";
            }
            
            if (isset($foreignKey['on_update'])) {
                $sql .= " ON UPDATE {$foreignKey['on_update']}";
            }
            
            $foreignKeys[] = $sql;
        }
        
        return $foreignKeys;
    }

    /**
     * Generate index name
     */
    private function generateIndexName(string $table, array $columns): string
    {
        return $table . '_' . implode('_', $columns) . '_index';
    }

    /**
     * Generate foreign key name
     */
    private function generateForeignKeyName(string $table, string $column): string
    {
        return $table . '_' . $column . '_foreign';
    }

    /**
     * Get charset collate
     */
    private function getCharsetCollate(): string
    {
        return $this->connection->getDatabase()->get_charset_collate();
    }
}

/**
 * Blueprint for table creation
 */
class Blueprint
{
    /**
     * @var string
     */
    private $table;

    /**
     * @var array
     */
    private $columns = [];

    /**
     * @var array
     */
    private $indexes = [];

    /**
     * @var array
     */
    private $foreignKeys = [];

    /**
     * Blueprint constructor
     */
    public function __construct(string $table)
    {
        $this->table = $table;
    }

    /**
     * Get table name
     */
    public function getTable(): string
    {
        return $this->table;
    }

    /**
     * Get columns
     */
    public function getColumns(): array
    {
        return $this->columns;
    }

    /**
     * Get indexes
     */
    public function getIndexes(): array
    {
        return $this->indexes;
    }

    /**
     * Get foreign keys
     */
    public function getForeignKeys(): array
    {
        return $this->foreignKeys;
    }

    /**
     * Add integer column
     */
    public function integer(string $name, array $options = []): self
    {
        $this->columns[] = [
            'name' => $name,
            'type' => 'INT',
            'options' => $options
        ];
        return $this;
    }

    /**
     * Add big integer column
     */
    public function bigInteger(string $name, array $options = []): self
    {
        $this->columns[] = [
            'name' => $name,
            'type' => 'BIGINT',
            'options' => $options
        ];
        return $this;
    }

    /**
     * Add string column
     */
    public function string(string $name, int $length = 255, array $options = []): self
    {
        $options['length'] = $length;
        $this->columns[] = [
            'name' => $name,
            'type' => 'VARCHAR',
            'options' => $options
        ];
        return $this;
    }

    /**
     * Add text column
     */
    public function text(string $name, array $options = []): self
    {
        $this->columns[] = [
            'name' => $name,
            'type' => 'TEXT',
            'options' => $options
        ];
        return $this;
    }

    /**
     * Add long text column
     */
    public function longText(string $name, array $options = []): self
    {
        $this->columns[] = [
            'name' => $name,
            'type' => 'LONGTEXT',
            'options' => $options
        ];
        return $this;
    }

    /**
     * Add decimal column
     */
    public function decimal(string $name, int $precision = 8, int $scale = 2, array $options = []): self
    {
        $options['length'] = "{$precision},{$scale}";
        $this->columns[] = [
            'name' => $name,
            'type' => 'DECIMAL',
            'options' => $options
        ];
        return $this;
    }

    /**
     * Add boolean column
     */
    public function boolean(string $name, array $options = []): self
    {
        $this->columns[] = [
            'name' => $name,
            'type' => 'BOOLEAN',
            'options' => $options
        ];
        return $this;
    }

    /**
     * Add date column
     */
    public function date(string $name, array $options = []): self
    {
        $this->columns[] = [
            'name' => $name,
            'type' => 'DATE',
            'options' => $options
        ];
        return $this;
    }

    /**
     * Add datetime column
     */
    public function dateTime(string $name, array $options = []): self
    {
        $this->columns[] = [
            'name' => $name,
            'type' => 'DATETIME',
            'options' => $options
        ];
        return $this;
    }

    /**
     * Add timestamp column
     */
    public function timestamp(string $name, array $options = []): self
    {
        $this->columns[] = [
            'name' => $name,
            'type' => 'TIMESTAMP',
            'options' => $options
        ];
        return $this;
    }

    /**
     * Add JSON column
     */
    public function json(string $name, array $options = []): self
    {
        $this->columns[] = [
            'name' => $name,
            'type' => 'JSON',
            'options' => $options
        ];
        return $this;
    }

    /**
     * Add enum column
     */
    public function enum(string $name, array $values, array $options = []): self
    {
        $valuesList = "'" . implode("','", $values) . "'";
        $options['values'] = $valuesList;
        $this->columns[] = [
            'name' => $name,
            'type' => 'ENUM',
            'options' => $options
        ];
        return $this;
    }

    /**
     * Add index
     */
    public function index(array $columns, string $name = null): self
    {
        $this->indexes[] = [
            'name' => $name ?: $this->generateIndexName($columns),
            'columns' => $columns
        ];
        return $this;
    }

    /**
     * Add foreign key
     */
    public function foreign(string $column, string $references, string $on, string $onDelete = null, string $onUpdate = null): self
    {
        $this->foreignKeys[] = [
            'column' => $column,
            'references' => $references,
            'on' => $on,
            'on_delete' => $onDelete,
            'on_update' => $onUpdate
        ];
        return $this;
    }

    /**
     * Generate index name
     */
    private function generateIndexName(array $columns): string
    {
        return $this->table . '_' . implode('_', $columns) . '_index';
    }
} 