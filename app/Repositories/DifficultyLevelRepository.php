<?php

declare(strict_types=1);

namespace Yatra\Repositories;

/**
 * Difficulty Level Repository
 * Handles database operations for difficulty levels
 */
class DifficultyLevelRepository extends BaseRepository
{
    /**
     * Rich text fields
     */
    protected array $richTextFields = ['description'];

    /**
     * Integer fields
     */
    protected array $integerFields = ['id', 'level_order', 'created_by', 'updated_by'];

    /**
     * Get table name
     */
    protected function getTableName(): string
    {
        global $wpdb;
        return $wpdb->prefix . 'yatra_difficulty_levels';
    }

    /**
     * Find by slug
     */
    public function findBySlug(string $slug): ?\stdClass
    {
        $table = esc_sql($this->table);
        $result = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM `{$table}` WHERE slug = %s",
                $slug
            )
        );

        return $result ?: null;
    }

    /**
     * Get published difficulty levels
     */
    public function getPublished(array $args = []): array
    {
        $args['where']['status'] = 'publish';
        return $this->all($args);
    }

    /**
     * Get difficulty levels by status
     */
    public function getByStatus(string $status, array $args = []): array
    {
        $args['where']['status'] = $status;
        return $this->all($args);
    }

    /**
     * Get difficulty levels ordered by level_order
     */
    public function getOrdered(array $args = []): array
    {
        $args['order_by'] = 'level_order';
        $args['order'] = 'ASC';
        return $this->all($args);
    }

    /**
     * Search difficulty levels
     */
    public function search(string $search, array $args = []): array
    {
        $table = esc_sql($this->table);
        $where = $this->buildWhereClause($args);
        $order = $this->buildOrderClause($args);
        $limit = $this->buildLimitClause($args);

        $search_where = $this->wpdb->prepare(
            "WHERE (name LIKE %s OR slug LIKE %s OR description LIKE %s)",
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

