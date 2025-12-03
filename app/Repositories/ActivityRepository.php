<?php

declare(strict_types=1);

namespace Yatra\Repositories;

/**
 * Activity Repository
 * Handles database operations for activities
 */
class ActivityRepository extends BaseRepository
{
    /**
     * Get table name
     */
    protected function getTableName(): string
    {
        global $wpdb;
        return $wpdb->prefix . 'yatra_activities';
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
     * Get published activities
     */
    public function getPublished(array $args = []): array
    {
        $args['where']['status'] = 'publish';
        return $this->all($args);
    }

    /**
     * Get activities by status
     */
    public function getByStatus(string $status, array $args = []): array
    {
        $args['where']['status'] = $status;
        return $this->all($args);
    }

    /**
     * Search activities
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

    /**
     * Bulk update status for multiple activities
     */
    public function bulkUpdateStatus(array $ids, string $status): bool
    {
        if (empty($ids)) {
            return false;
        }

        $table = esc_sql($this->table);
        $placeholders = implode(',', array_fill(0, count($ids), '%d'));
        $sql = "UPDATE `{$table}` SET status = %s, updated_at = %s WHERE id IN ({$placeholders})";
        $params = array_merge([$status, current_time('mysql')], $ids);

        $prepared = $this->wpdb->prepare($sql, $params);
        return $this->wpdb->query($prepared) !== false;
    }

    /**
     * Permanently delete multiple activities
     */
    public function bulkDelete(array $ids): bool
    {
        if (empty($ids)) {
            return false;
        }

        $table = esc_sql($this->table);
        $placeholders = implode(',', array_fill(0, count($ids), '%d'));
        $sql = "DELETE FROM `{$table}` WHERE id IN ({$placeholders})";

        $prepared = $this->wpdb->prepare($sql, $ids);
        return $this->wpdb->query($prepared) !== false;
    }

    /**
     * Get counts per status for admin views
     */
    public function getStatusCounts(): array
    {
        $table = esc_sql($this->table);
        
        // Debug logging
        error_log('ActivityRepository - Table name: ' . $table);
        
        // Get counts for each status
        $query = "SELECT status, COUNT(*) as count FROM `{$table}` WHERE 1=1 GROUP BY status";
        error_log('ActivityRepository - Query: ' . $query);
        
        $results = $this->wpdb->get_results($query, ARRAY_A) ?: [];
        error_log('ActivityRepository - Raw results: ' . print_r($results, true));

        $counts = [];
        foreach ($results as $row) {
            $counts[$row['status']] = (int) $row['count'];
        }

        // Ensure we have entries for all main statuses even if count is 0
        $counts['publish'] = $counts['publish'] ?? 0;
        $counts['draft'] = $counts['draft'] ?? 0;
        $counts['trash'] = $counts['trash'] ?? 0;

        error_log('ActivityRepository - Final counts: ' . print_r($counts, true));
        return $counts;
    }
}
