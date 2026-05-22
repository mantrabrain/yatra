<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Database\Tables\BookingsTable;
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

    /**
     * Strip unknown keys (e.g. created_by_name) before wpdb writes.
     * Never allow updating the primary key from payloads.
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function filterToWritableDiscountColumnsForInsert(array $data): array
    {
        unset($data['id']);

        return array_intersect_key($data, array_flip(DiscountsTable::getWritableColumnNames()));
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function filterToWritableDiscountColumnsForUpdate(array $data): array
    {
        unset($data['id']);
        $allowed = array_values(array_diff(
            DiscountsTable::getWritableColumnNames(),
            ['created_at', 'created_by']
        ));

        return array_intersect_key($data, array_flip($allowed));
    }

    public function update(int $id, array $data): bool
    {
        return parent::update($id, $this->filterToWritableDiscountColumnsForUpdate($data));
    }

    public function create(array $data): int
    {
        return parent::create($this->filterToWritableDiscountColumnsForInsert($data));
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
        // Status: admin UI uses "publish"; legacy rows may use "active" as live (see DiscountService::isLive).
        $query = "SELECT * FROM `{$table}` 
            WHERE (is_group_discount = 1 OR discount_mode IN ('group', 'both'))
            AND status IN ('publish', 'active')";
        
        return $wpdb->get_results($query) ?: [];
    }
    
    /**
     * Count how many bookings have used a specific discount code
     * 
     * @param string $code Discount code
     * @return int Number of bookings that used this code
     */
    public function countUsage(string $code): int
    {
        global $wpdb;

        // Canonical bookings table — post 3.0.5 rename. Previous code had
        // a fallback probe for `yatra_new_bookings`; that's no longer
        // needed since the migration guarantees the canonical name.
        $bookingsTable = BookingsTable::getTableName();

        $count = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM `{$bookingsTable}` 
                WHERE discount_code = %s 
                AND status NOT IN ('cancelled', 'failed')",
                $code
            )
        );
        
        return (int) ($count ?? 0);
    }

    /**
     * Status counts for admin toolbar (matches wp_yatra_discounts.status values).
     *
     * @return array{all: int, publish: int, draft: int, trash: int, expired: int}
     */
    public function getAdminStatusCounts(): array
    {
        $table = esc_sql($this->table);
        $all = (int) $this->wpdb->get_var("SELECT COUNT(*) FROM `{$table}`");

        $rows = $this->wpdb->get_results(
            "SELECT `status`, COUNT(*) AS c FROM `{$table}` GROUP BY `status`"
        ) ?: [];

        $map = [
            'publish' => 0,
            'draft' => 0,
            'trash' => 0,
            'expired' => 0,
        ];

        foreach ($rows as $row) {
            $st = (string) ($row->status ?? '');
            if (isset($map[$st])) {
                $map[$st] = (int) $row->c;
            }
        }

        return [
            'all' => $all,
            'publish' => $map['publish'],
            'draft' => $map['draft'],
            'trash' => $map['trash'],
            'expired' => $map['expired'],
        ];
    }
}

