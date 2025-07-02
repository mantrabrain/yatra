<?php

declare(strict_types=1);

namespace Yatra\Core\Database;

/**
 * Query builder for building complex database queries
 */
class QueryBuilder
{
    /**
     * @var Connection
     */
    private $connection;

    /**
     * @var string
     */
    private $table;

    /**
     * @var array
     */
    private $select = ['*'];

    /**
     * @var array
     */
    private $where = [];

    /**
     * @var array
     */
    private $orderBy = [];

    /**
     * @var array
     */
    private $groupBy = [];

    /**
     * @var array
     */
    private $joins = [];

    /**
     * @var int
     */
    private $limit = 0;

    /**
     * @var int
     */
    private $offset = 0;

    /**
     * QueryBuilder constructor
     */
    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    /**
     * Set the table name
     */
    public function table(string $table): self
    {
        $this->table = $this->connection->getTableName($table);
        return $this;
    }

    /**
     * Set select columns
     */
    public function select(array $columns): self
    {
        $this->select = $columns;
        return $this;
    }

    /**
     * Add where condition
     */
    public function where(string $column, string $operator, $value): self
    {
        $this->where[] = [
            'column' => $column,
            'operator' => $operator,
            'value' => $value,
            'boolean' => 'AND'
        ];
        return $this;
    }

    /**
     * Add or where condition
     */
    public function orWhere(string $column, string $operator, $value): self
    {
        $this->where[] = [
            'column' => $column,
            'operator' => $operator,
            'value' => $value,
            'boolean' => 'OR'
        ];
        return $this;
    }

    /**
     * Add where in condition
     */
    public function whereIn(string $column, array $values): self
    {
        $placeholders = implode(',', array_fill(0, count($values), '%s'));
        $this->where[] = [
            'column' => $column,
            'operator' => 'IN',
            'value' => '(' . $placeholders . ')',
            'values' => $values,
            'boolean' => 'AND'
        ];
        return $this;
    }

    /**
     * Add where null condition
     */
    public function whereNull(string $column): self
    {
        $this->where[] = [
            'column' => $column,
            'operator' => 'IS NULL',
            'value' => null,
            'boolean' => 'AND'
        ];
        return $this;
    }

    /**
     * Add where not null condition
     */
    public function whereNotNull(string $column): self
    {
        $this->where[] = [
            'column' => $column,
            'operator' => 'IS NOT NULL',
            'value' => null,
            'boolean' => 'AND'
        ];
        return $this;
    }

    /**
     * Add join
     */
    public function join(string $table, string $first, string $operator, string $second, string $type = 'INNER'): self
    {
        $this->joins[] = [
            'table' => $this->connection->getTableName($table),
            'first' => $first,
            'operator' => $operator,
            'second' => $second,
            'type' => $type
        ];
        return $this;
    }

    /**
     * Add left join
     */
    public function leftJoin(string $table, string $first, string $operator, string $second): self
    {
        return $this->join($table, $first, $operator, $second, 'LEFT');
    }

    /**
     * Add right join
     */
    public function rightJoin(string $table, string $first, string $operator, string $second): self
    {
        return $this->join($table, $first, $operator, $second, 'RIGHT');
    }

    /**
     * Add order by
     */
    public function orderBy(string $column, string $direction = 'ASC'): self
    {
        $this->orderBy[] = [
            'column' => $column,
            'direction' => strtoupper($direction)
        ];
        return $this;
    }

    /**
     * Add group by
     */
    public function groupBy(string $column): self
    {
        $this->groupBy[] = $column;
        return $this;
    }

    /**
     * Set limit
     */
    public function limit(int $limit): self
    {
        $this->limit = $limit;
        return $this;
    }

    /**
     * Set offset
     */
    public function offset(int $offset): self
    {
        $this->offset = $offset;
        return $this;
    }

    /**
     * Get the SQL query
     */
    public function toSql(): string
    {
        $sql = $this->buildSelect();
        $sql .= $this->buildFrom();
        $sql .= $this->buildJoins();
        $sql .= $this->buildWhere();
        $sql .= $this->buildGroupBy();
        $sql .= $this->buildOrderBy();
        $sql .= $this->buildLimit();

        return $sql;
    }

    /**
     * Execute the query and get results
     */
    public function get(): array
    {
        $sql = $this->toSql();
        $values = $this->getWhereValues();

        if (empty($values)) {
            return $this->connection->getResults($sql);
        }

        return $this->connection->getResults($sql, ...$values);
    }

    /**
     * Execute the query and get first result
     */
    public function first()
    {
        $this->limit(1);
        $results = $this->get();
        return $results[0] ?? null;
    }

    /**
     * Count results
     */
    public function count(): int
    {
        $originalSelect = $this->select;
        $this->select = ['COUNT(*) as count'];
        
        $result = $this->first();
        $count = $result ? (int) $result->count : 0;
        
        $this->select = $originalSelect;
        return $count;
    }

    /**
     * Check if exists
     */
    public function exists(): bool
    {
        return $this->count() > 0;
    }

    /**
     * Build select clause
     */
    private function buildSelect(): string
    {
        $columns = implode(', ', $this->select);
        return "SELECT {$columns}";
    }

    /**
     * Build from clause
     */
    private function buildFrom(): string
    {
        return " FROM {$this->table}";
    }

    /**
     * Build joins
     */
    private function buildJoins(): string
    {
        if (empty($this->joins)) {
            return '';
        }

        $sql = '';
        foreach ($this->joins as $join) {
            $sql .= " {$join['type']} JOIN {$join['table']} ON {$join['first']} {$join['operator']} {$join['second']}";
        }

        return $sql;
    }

    /**
     * Build where clause
     */
    private function buildWhere(): string
    {
        if (empty($this->where)) {
            return '';
        }

        $sql = ' WHERE';
        $first = true;

        foreach ($this->where as $condition) {
            if (!$first) {
                $sql .= " {$condition['boolean']}";
            }

            if ($condition['operator'] === 'IN') {
                $sql .= " {$condition['column']} {$condition['operator']} {$condition['value']}";
            } elseif (in_array($condition['operator'], ['IS NULL', 'IS NOT NULL'])) {
                $sql .= " {$condition['column']} {$condition['operator']}";
            } else {
                $sql .= " {$condition['column']} {$condition['operator']} %s";
            }

            $first = false;
        }

        return $sql;
    }

    /**
     * Build group by clause
     */
    private function buildGroupBy(): string
    {
        if (empty($this->groupBy)) {
            return '';
        }

        $columns = implode(', ', $this->groupBy);
        return " GROUP BY {$columns}";
    }

    /**
     * Build order by clause
     */
    private function buildOrderBy(): string
    {
        if (empty($this->orderBy)) {
            return '';
        }

        $orders = [];
        foreach ($this->orderBy as $order) {
            $orders[] = "{$order['column']} {$order['direction']}";
        }

        $columns = implode(', ', $orders);
        return " ORDER BY {$columns}";
    }

    /**
     * Build limit clause
     */
    private function buildLimit(): string
    {
        if ($this->limit === 0) {
            return '';
        }

        $sql = " LIMIT {$this->limit}";
        
        if ($this->offset > 0) {
            $sql .= " OFFSET {$this->offset}";
        }

        return $sql;
    }

    /**
     * Get where values for prepared statement
     */
    private function getWhereValues(): array
    {
        $values = [];

        foreach ($this->where as $condition) {
            if ($condition['operator'] === 'IN') {
                $values = array_merge($values, $condition['values']);
            } elseif (!in_array($condition['operator'], ['IS NULL', 'IS NOT NULL'])) {
                $values[] = $condition['value'];
            }
        }

        return $values;
    }
} 