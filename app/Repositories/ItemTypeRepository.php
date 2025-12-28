<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Constants\ClassificationTypes;
use Yatra\Database\Tables\ClassificationsTable;

/**
 * Item Type Repository
 * Handles database operations for item types using unified ClassificationsTable
 */
class ItemTypeRepository extends BaseRepository
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
        
        // Always filter by type = 'item_type' for item types
        $type_condition = "WHERE type = %s";
        
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
                
        
        $results = $this->wpdb->get_results($this->wpdb->prepare($sql, ClassificationTypes::ITEM_TYPE)) ?: [];

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
     * Get all item types with automatic type filtering
     */
    public function all(array $args = []): array
    {
        // Always filter by type = 'item_type' for item types
        if (!isset($args['where']['type'])) {
            $args['where']['type'] = ClassificationTypes::ITEM_TYPE;
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
                "SELECT * FROM `{$table}` WHERE type = %s AND slug = %s",
                ClassificationTypes::ITEM_TYPE,
                $slug
            )
        );

        return $result ?: null;
    }

    /**
     * Get published item types
     */
    public function getPublished(array $args = []): array
    {
        $args['where']['type'] = ClassificationTypes::ITEM_TYPE;
        $args['where']['status'] = 'publish';
        return $this->all($args);
    }

    /**
     * Get item types by status
     */
    public function getByStatus(string $status, array $args = []): array
    {
        $args['where']['type'] = ClassificationTypes::ITEM_TYPE;
        $args['where']['status'] = $status;
        return $this->all($args);
    }

    /**
     * Search item types
     */
    public function search(string $search, array $args = []): array
    {
        $table = esc_sql($this->table);
        $where = $this->buildWhereClause($args);
        $order = $this->buildOrderClause($args);
        $limit = $this->buildLimitClause($args);

        $search_where = $this->wpdb->prepare(
            "WHERE type = %s AND (name LIKE %s OR slug LIKE %s OR description LIKE %s)",
            ClassificationTypes::ITEM_TYPE,
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

    /**
     * Count items by item type ID
     */
    public function countItemsByType(int $item_type_id): int
    {
        global $wpdb;
        
        // Use ClassificationsTable for items with parent_id relationship
        $table = ClassificationsTable::getTableName();
        $count = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM `{$table}` WHERE `type` = %s AND `parent_id` = %d",
                ClassificationTypes::ITEM,
                $item_type_id
            )
        );
        return (int) $count;
    }
}

