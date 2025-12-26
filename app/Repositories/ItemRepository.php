<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Database\Tables\ClassificationsTable;

/**
 * Item Repository
 * Handles database operations for items (item subtypes) using unified ClassificationsTable
 */
class ItemRepository extends BaseRepository
{
    /**
     * Get table name
     */
    protected function getTableName(): string
    {
        return ClassificationsTable::getTableName();
    }

    /**
     * Get status counts for admin list views with automatic type filtering
     */
    public function getStatusCounts(array $args = []): array
    {
        $table = esc_sql($this->table);
        
        // Always filter by type = 'item' for items
        $type_condition = "WHERE type = 'item'";
        
        // Add additional where conditions if provided
        if (isset($args['where']) && !empty($args['where'])) {
            $additional_where = $this->buildWhereClause($args);
            if ($additional_where && $additional_where !== ' WHERE') {
                // Remove the WHERE keyword and add with AND
                $additional_where = str_replace('WHERE ', 'AND ', $additional_where);
                $type_condition .= ' ' . $additional_where;
            }
        }
        
        $sql = "SELECT status, COUNT(*) as count 
                FROM `{$table}` 
                {$type_condition}
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

    /**
     * Count items with automatic type filtering
     */
    public function count(array $args = []): int
    {
        // Always filter by type = 'item' for items
        if (!isset($args['where']['type'])) {
            $args['where']['type'] = 'item';
        }
        
        return parent::count($args);
    }

    /**
     * Get all items with automatic type filtering
     */
    public function all(array $args = []): array
    {
        // Always filter by type = 'item' for items
        if (!isset($args['where']['type'])) {
            $args['where']['type'] = 'item';
        }
        
        return parent::all($args);
    }

    /**
     * Find by slug
     */
    public function findBySlug(string $slug): ?\stdClass
    {
        $table = esc_sql($this->table);
        $result = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM `{$table}` WHERE type = 'item' AND slug = %s",
                $slug
            )
        );

        return $result ?: null;
    }

    /**
     * Get published items
     */
    public function getPublished(array $args = []): array
    {
        $args['where']['type'] = 'item';
        $args['where']['status'] = 'publish';
        return $this->all($args);
    }

    /**
     * Get items by status
     */
    public function getByStatus(string $status, array $args = []): array
    {
        $args['where']['type'] = 'item';
        $args['where']['status'] = $status;
        return $this->all($args);
    }

    /**
     * Get items by type ID
     */
    public function getByTypeId(int $type_id, array $args = []): array
    {
        $args['where']['type'] = 'item';
        $args['where']['parent_id'] = $type_id;
        return $this->all($args);
    }

    /**
     * Search items
     */
    public function search(string $search, array $args = []): array
    {
        $table = esc_sql($this->table);
        $where = $this->buildWhereClause($args);
        $order = $this->buildOrderClause($args);
        $limit = $this->buildLimitClause($args);

        $search_where = $this->wpdb->prepare(
            "WHERE type = 'item' AND (name LIKE %s OR slug LIKE %s OR description LIKE %s)",
            '%' . $this->wpdb->esc_like($search) . '%',
            '%' . $this->wpdb->esc_like($search) . '%',
            '%' . $this->wpdb->esc_like($search) . '%'
        );

        if ($where) {
            $search_where .= ' AND ' . str_replace('WHERE ', '', $where);
        }

        $query = "SELECT * FROM `{$table}` {$search_where} {$order} {$limit}";

        return $this->wpdb->get_results($query) ?: [];
    }
}

