<?php

declare(strict_types=1);

namespace Yatra\Repositories;

/**
 * Discount Repository
 * Handles database operations for discounts
 */
class DiscountRepository extends BaseRepository
{
    protected function getTableName(): string
    {
        global $wpdb;
        return $wpdb->prefix . 'yatra_discounts';
    }

    public function findByCode(string $code): ?\stdClass
    {
        $table = esc_sql($this->table);
        $result = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM `{$table}` WHERE code = %s",
                $code
            )
        );
        return $result ?: null;
    }

    public function getByStatus(string $status, array $args = []): array
    {
        $args['where']['status'] = $status;
        return $this->all($args);
    }

    public function getByType(string $type, array $args = []): array
    {
        $args['where']['type'] = $type;
        return $this->all($args);
    }

    public function search(string $search_term, array $args = []): array
    {
        $table = esc_sql($this->table);
        $search_term = '%' . esc_like($search_term) . '%';
        
        $where_conditions = ["(`code` LIKE %s OR `description` LIKE %s)"];
        $where_values = [$search_term, $search_term];

        if (isset($args['where'])) {
            foreach ($args['where'] as $key => $value) {
                $key = preg_replace('/[^a-zA-Z0-9_]/', '', $key); // Sanitize column name
                $where_conditions[] = "`{$key}` = %s";
                $where_values[] = $value;
            }
        }

        $where_clause = 'WHERE ' . implode(' AND ', $where_conditions);
        $order = $this->buildOrderClause($args);
        $limit = $this->buildLimitClause($args);

        $query = $this->wpdb->prepare(
            "SELECT * FROM `{$table}` {$where_clause} {$order} {$limit}",
            ...$where_values
        );

        return $this->wpdb->get_results($query) ?: [];
    }
}

