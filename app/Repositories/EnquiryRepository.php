<?php

declare(strict_types=1);

namespace Yatra\Repositories;

/**
 * Enquiry Repository
 * 
 * Handles all database operations for customer enquiries.
 * 
 * @package Yatra\Repositories
 */
class EnquiryRepository extends BaseRepository
{
    /**
     * Table name without prefix
     */
    private const TABLE_NAME = 'yatra_enquiries';

    /**
     * Get full table name with prefix
     */
    protected function getTableName(): string
    {
        return $this->wpdb->prefix . self::TABLE_NAME;
    }

    /**
     * Get trips table name
     */
    protected function getTripsTable(): string
    {
        return $this->wpdb->prefix . 'yatra_trips';
    }

    /**
     * Get paginated enquiries with filters
     * 
     * @param array $filters Filter options
     * @return array {data: array, total: int, page: int, per_page: int, total_pages: int}
     */
    public function paginate(array $filters = []): array
    {
        $table = $this->getTableName();
        $trips_table = $this->getTripsTable();

        // Pagination
        $page = max(1, (int) ($filters['page'] ?? 1));
        $per_page = max(1, min(100, (int) ($filters['per_page'] ?? 20)));
        $offset = ($page - 1) * $per_page;

        // Build WHERE clause
        $where_clauses = ['1=1'];
        $where_values = [];

        if (!empty($filters['status'])) {
            $where_clauses[] = 'e.status = %s';
            $where_values[] = sanitize_text_field($filters['status']);
        }

        if (!empty($filters['trip_id'])) {
            $where_clauses[] = 'e.trip_id = %d';
            $where_values[] = (int) $filters['trip_id'];
        }

        if (!empty($filters['search'])) {
            $search_like = '%' . $this->wpdb->esc_like(sanitize_text_field($filters['search'])) . '%';
            $where_clauses[] = '(e.name LIKE %s OR e.email LIKE %s OR e.phone LIKE %s OR e.message LIKE %s)';
            $where_values = array_merge($where_values, [$search_like, $search_like, $search_like, $search_like]);
        }

        if (!empty($filters['date_from'])) {
            $where_clauses[] = 'e.created_at >= %s';
            $where_values[] = sanitize_text_field($filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $where_clauses[] = 'e.created_at <= %s';
            $where_values[] = sanitize_text_field($filters['date_to']);
        }

        $where_sql = implode(' AND ', $where_clauses);

        // Get total count
        $count_query = "SELECT COUNT(*) FROM {$table} e WHERE {$where_sql}";
        if (!empty($where_values)) {
            $count_query = $this->wpdb->prepare($count_query, ...$where_values);
        }
        $total = (int) $this->wpdb->get_var($count_query);

        // Get enquiries with trip info
        $query = "SELECT e.*, t.title as trip_title, t.slug as trip_slug
                  FROM {$table} e
                  LEFT JOIN {$trips_table} t ON e.trip_id = t.id
                  WHERE {$where_sql}
                  ORDER BY e.created_at DESC
                  LIMIT %d OFFSET %d";

        $query_values = array_merge($where_values, [$per_page, $offset]);
        $enquiries = $this->wpdb->get_results($this->wpdb->prepare($query, ...$query_values));

        return [
            'data' => $enquiries ?: [],
            'total' => $total,
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => (int) ceil($total / $per_page),
        ];
    }

    /**
     * Find enquiry by ID with trip info
     * 
     * @param int $id Enquiry ID
     * @return object|null
     */
    public function findWithTrip(int $id): ?object
    {
        $table = $this->getTableName();
        $trips_table = $this->getTripsTable();

        $query = $this->wpdb->prepare(
            "SELECT e.*, t.title as trip_title, t.slug as trip_slug
             FROM {$table} e
             LEFT JOIN {$trips_table} t ON e.trip_id = t.id
             WHERE e.id = %d",
            $id
        );

        return $this->wpdb->get_row($query) ?: null;
    }

    /**
     * Find enquiries by trip ID
     * 
     * @param int $tripId Trip ID
     * @return array
     */
    public function findByTripId(int $tripId): array
    {
        $table = $this->getTableName();

        $query = $this->wpdb->prepare(
            "SELECT * FROM {$table} WHERE trip_id = %d ORDER BY created_at DESC",
            $tripId
        );

        return $this->wpdb->get_results($query) ?: [];
    }

    /**
     * Find enquiries by email
     * 
     * @param string $email Email address
     * @return array
     */
    public function findByEmail(string $email): array
    {
        $table = $this->getTableName();

        $query = $this->wpdb->prepare(
            "SELECT * FROM {$table} WHERE email = %s ORDER BY created_at DESC",
            sanitize_email($email)
        );

        return $this->wpdb->get_results($query) ?: [];
    }

    /**
     * Create a new enquiry
     * 
     * @param array $data Enquiry data
     * @return int Enquiry ID on success
     * @throws \Exception on failure
     */
    public function create(array $data): int
    {
        $table = $this->getTableName();

        $insertData = $this->prepareEnquiryData($data);
        $insertData['created_at'] = current_time('mysql');
        $insertData['updated_at'] = current_time('mysql');

        $result = $this->wpdb->insert($table, $insertData);

        if ($result === false) {
            throw new \Exception('Failed to create enquiry: ' . $this->wpdb->last_error);
        }

        return $this->wpdb->insert_id;
    }

    /**
     * Update an enquiry
     * 
     * @param int   $id   Enquiry ID
     * @param array $data Enquiry data to update
     * @return bool
     */
    public function update(int $id, array $data): bool
    {
        $table = $this->getTableName();

        $updateData = $this->prepareEnquiryData($data);
        $updateData['updated_at'] = current_time('mysql');

        $result = $this->wpdb->update(
            $table,
            $updateData,
            ['id' => $id],
            null,
            ['%d']
        );

        return $result !== false;
    }

    /**
     * Update enquiry status
     * 
     * @param int    $id     Enquiry ID
     * @param string $status New status
     * @return bool
     */
    public function updateStatus(int $id, string $status): bool
    {
        $table = $this->getTableName();

        $result = $this->wpdb->update(
            $table,
            [
                'status' => sanitize_text_field($status),
                'updated_at' => current_time('mysql'),
            ],
            ['id' => $id]
        );

        return $result !== false;
    }

    /**
     * Add response to enquiry
     * 
     * @param int    $id       Enquiry ID
     * @param string $response Response message
     * @param int    $userId   User who responded
     * @return bool
     */
    public function addResponse(int $id, string $response, int $userId): bool
    {
        $table = $this->getTableName();

        $result = $this->wpdb->update(
            $table,
            [
                'response' => sanitize_textarea_field($response),
                'responded_by' => $userId,
                'responded_at' => current_time('mysql'),
                'status' => 'responded',
                'updated_at' => current_time('mysql'),
            ],
            ['id' => $id]
        );

        return $result !== false;
    }

    /**
     * Delete an enquiry
     * 
     * @param int $id Enquiry ID
     * @return bool
     */
    public function delete(int $id): bool
    {
        $table = $this->getTableName();

        $result = $this->wpdb->delete($table, ['id' => $id], ['%d']);

        return $result !== false;
    }

    /**
     * Bulk update enquiry status
     * 
     * @param array  $ids    Enquiry IDs
     * @param string $status New status
     * @return int Number of affected rows
     */
    public function bulkUpdateStatus(array $ids, string $status): int
    {
        if (empty($ids)) {
            return 0;
        }

        $table = $this->getTableName();
        $ids = array_map('intval', $ids);
        $placeholders = implode(',', array_fill(0, count($ids), '%d'));

        $query = $this->wpdb->prepare(
            "UPDATE {$table} SET status = %s, updated_at = %s WHERE id IN ({$placeholders})",
            array_merge([sanitize_text_field($status), current_time('mysql')], $ids)
        );

        $this->wpdb->query($query);

        return (int) $this->wpdb->rows_affected;
    }

    /**
     * Bulk delete enquiries
     * 
     * @param array $ids Enquiry IDs
     * @return int Number of deleted rows
     */
    public function bulkDelete(array $ids): int
    {
        if (empty($ids)) {
            return 0;
        }

        $table = $this->getTableName();
        $ids = array_map('intval', $ids);
        $placeholders = implode(',', array_fill(0, count($ids), '%d'));

        $this->wpdb->query($this->wpdb->prepare(
            "DELETE FROM {$table} WHERE id IN ({$placeholders})",
            $ids
        ));

        return (int) $this->wpdb->rows_affected;
    }

    /**
     * Get enquiry statistics
     * 
     * @return array
     */
    public function getStats(): array
    {
        $table = $this->getTableName();

        // Total by status
        $statusStats = $this->wpdb->get_results(
            "SELECT status, COUNT(*) as count FROM {$table} GROUP BY status",
            OBJECT_K
        );

        // Unread count
        $unread = (int) $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$table} WHERE status = 'pending' OR status = 'new'"
        );

        // This week
        $thisWeek = (int) $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE created_at >= %s",
            date('Y-m-d 00:00:00', strtotime('-7 days'))
        ));

        // Average response time (for responded enquiries)
        $avgResponseTime = $this->wpdb->get_var(
            "SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, responded_at)) 
             FROM {$table} 
             WHERE responded_at IS NOT NULL"
        );

        return [
            'total' => array_sum(array_column((array) $statusStats, 'count')),
            'by_status' => $statusStats,
            'unread' => $unread,
            'this_week' => $thisWeek,
            'avg_response_hours' => round((float) ($avgResponseTime ?? 0), 1),
        ];
    }

    /**
     * Prepare enquiry data for insert/update
     * 
     * @param array $data Raw data
     * @return array Sanitized data
     */
    private function prepareEnquiryData(array $data): array
    {
        $prepared = [];

        if (array_key_exists('trip_id', $data)) {
            $prepared['trip_id'] = $data['trip_id'] ? (int) $data['trip_id'] : null;
        }

        if (array_key_exists('name', $data)) {
            $prepared['name'] = sanitize_text_field((string) $data['name']);
        }

        if (array_key_exists('email', $data)) {
            $prepared['email'] = sanitize_email((string) $data['email']);
        }

        if (array_key_exists('phone', $data)) {
            $prepared['phone'] = sanitize_text_field((string) $data['phone']);
        }

        if (array_key_exists('subject', $data)) {
            $prepared['subject'] = sanitize_text_field((string) $data['subject']);
        }

        if (array_key_exists('message', $data)) {
            $prepared['message'] = sanitize_textarea_field((string) $data['message']);
        }

        if (array_key_exists('status', $data)) {
            $prepared['status'] = sanitize_text_field((string) $data['status']);
        }

        if (array_key_exists('response', $data)) {
            $prepared['response'] = sanitize_textarea_field((string) $data['response']);
        }

        if (array_key_exists('responded_by', $data)) {
            $prepared['responded_by'] = (int) $data['responded_by'];
        }

        if (array_key_exists('responded_at', $data) && $data['responded_at']) {
            $prepared['responded_at'] = sanitize_text_field($data['responded_at']);
        }

        if (array_key_exists('travel_date', $data) && $data['travel_date']) {
            $prepared['travel_date'] = sanitize_text_field($data['travel_date']);
        }

        if (array_key_exists('travelers_count', $data)) {
            $prepared['travelers_count'] = (int) $data['travelers_count'];
        }

        return $prepared;
    }
}

