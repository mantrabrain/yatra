<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Database\Tables\DiscountsTable;

/**
 * Discount Repository
 * Handles database operations for discounts
 */
class DiscountRepository extends BaseRepository
{
    protected function getTableName(): string
    {
        return DiscountsTable::getTableName();
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

    /**
     * Get all active group discounts
     * 
     * @return array Array of group discount objects
     */
    public function getActiveGroupDiscounts(): array
    {
        global $wpdb;
        $table = $this->getTableName();
        $today = date('Y-m-d');

        // Query for active group discounts applicable to this trip
        // Check both is_group_discount=1 OR discount_mode IN ('group', 'both') for backward compatibility
        $query = "SELECT * FROM `{$table}` 
            WHERE (is_group_discount = 1 OR discount_mode IN ('group', 'both'))
            AND status = 'publish'";
        
        return $wpdb->get_results($query) ?: [];
    }
}

