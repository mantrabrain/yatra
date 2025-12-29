<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Database\Tables\ReviewsTable;

/**
 * Review Repository
 * 
 * Handles all database operations for trip reviews.
 * 
 * @package Yatra\Repositories
 */
class ReviewRepository extends BaseRepository
{
    /**
     * Get full table name with prefix
     */
    protected function getTableName(): string
    {
        return ReviewsTable::getTableName();
    }

    /**
     * Get trips table name
     */
    protected function getTripsTable(): string
    {
        // Use TripRepository for trips table
        $tripRepository = new \Yatra\Repositories\TripRepository();
        return $tripRepository->getTableName();
    }

    /**
     * Get users table name
     */
    protected function getUsersTable(): string
    {
        return $this->wpdb->users;
    }

    /**
     * Get paginated reviews with filters
     * 
     * @param array $filters Filter options
     * @return array {data: array, total: int, page: int, per_page: int, total_pages: int}
     */
    public function paginate(array $filters = []): array
    {
        $table = $this->getTableName();
        $trips_table = $this->getTripsTable();
        $users_table = $this->getUsersTable();

        // Pagination
        $page = max(1, (int) ($filters['page'] ?? 1));
        $per_page = max(1, min(100, (int) ($filters['per_page'] ?? 20)));
        $offset = ($page - 1) * $per_page;

        // Build WHERE clause
        $where_clauses = ['1=1'];
        $where_values = [];

        if (!empty($filters['status'])) {
            $where_clauses[] = 'r.status = %s';
            $where_values[] = sanitize_text_field($filters['status']);
        }

        if (!empty($filters['trip_id'])) {
            $where_clauses[] = 'r.trip_id = %d';
            $where_values[] = (int) $filters['trip_id'];
        }

        if (!empty($filters['rating'])) {
            $where_clauses[] = 'r.rating = %d';
            $where_values[] = (int) $filters['rating'];
        }

        if (!empty($filters['search'])) {
            $search_like = '%' . $this->wpdb->esc_like(sanitize_text_field($filters['search'])) . '%';
            $where_clauses[] = '(r.review_text LIKE %s OR r.reviewer_name LIKE %s OR r.reviewer_email LIKE %s)';
            $where_values = array_merge($where_values, [$search_like, $search_like, $search_like]);
        }

        $where_sql = implode(' AND ', $where_clauses);

        // Get total count
        $count_query = "SELECT COUNT(*) FROM {$table} r WHERE {$where_sql}";
        if (!empty($where_values)) {
            $count_query = $this->wpdb->prepare($count_query, ...$where_values);
        }
        $total = (int) $this->wpdb->get_var($count_query);

        // Get reviews with trip and user info
        $query = "SELECT r.*, 
                         t.title as trip_title, 
                         t.slug as trip_slug,
                         u.display_name as user_display_name
                  FROM {$table} r
                  LEFT JOIN {$trips_table} t ON r.trip_id = t.id
                  LEFT JOIN {$users_table} u ON r.user_id = u.ID
                  WHERE {$where_sql}
                  ORDER BY r.created_at DESC
                  LIMIT %d OFFSET %d";

        $query_values = array_merge($where_values, [$per_page, $offset]);
        $reviews = $this->wpdb->get_results($this->wpdb->prepare($query, ...$query_values));

        return [
            'data' => $reviews ?: [],
            'total' => $total,
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => (int) ceil($total / $per_page),
        ];
    }

    /**
     * Find review by ID with trip info
     * 
     * @param int $id Review ID
     * @return object|null
     */
    public function findWithTrip(int $id): ?object
    {
        $table = $this->getTableName();
        $trips_table = $this->getTripsTable();
        $users_table = $this->getUsersTable();

        $query = $this->wpdb->prepare(
            "SELECT r.*, 
                    t.title as trip_title, 
                    t.slug as trip_slug,
                    u.display_name as user_display_name
             FROM {$table} r
             LEFT JOIN {$trips_table} t ON r.trip_id = t.id
             LEFT JOIN {$users_table} u ON r.user_id = u.ID
             WHERE r.id = %d",
            $id
        );

        return $this->wpdb->get_row($query) ?: null;
    }

    /**
     * Find approved reviews for a trip
     * 
     * @param int $tripId Trip ID
     * @param int $limit  Limit results
     * @return array
     */
    public function findApprovedByTripId(int $tripId, int $limit = 10): array
    {
        $table = $this->getTableName();
        $users_table = $this->getUsersTable();

        $query = $this->wpdb->prepare(
            "SELECT r.*, u.display_name as user_display_name
             FROM {$table} r
             LEFT JOIN {$users_table} u ON r.user_id = u.ID
             WHERE r.trip_id = %d AND r.status = 'approved'
             ORDER BY r.created_at DESC
             LIMIT %d",
            $tripId,
            $limit
        );

        return $this->wpdb->get_results($query) ?: [];
    }

    /**
     * Find review by user and trip
     * 
     * @param int $userId User ID
     * @param int $tripId Trip ID
     * @return object|null
     */
    public function findByUserAndTrip(int $userId, int $tripId): ?object
    {
        $table = $this->getTableName();

        $query = $this->wpdb->prepare(
            "SELECT * FROM {$table} WHERE user_id = %d AND trip_id = %d",
            $userId,
            $tripId
        );

        return $this->wpdb->get_row($query) ?: null;
    }

    /**
     * Find reviews by user ID
     * 
     * @param int $userId User ID
     * @return array
     */
    public function findByUserId(int $userId): array
    {
        $table = $this->getTableName();
        $trips_table = $this->getTripsTable();

        $query = $this->wpdb->prepare(
            "SELECT r.*, t.title as trip_title
             FROM {$table} r
             LEFT JOIN {$trips_table} t ON r.trip_id = t.id
             WHERE r.user_id = %d
             ORDER BY r.created_at DESC",
            $userId
        );

        return $this->wpdb->get_results($query) ?: [];
    }

    /**
     * Create a new review
     * 
     * @param array $data Review data
     * @return int Review ID on success
     * @throws \Exception on failure
     */
    public function create(array $data): int
    {
        $table = $this->getTableName();

        $insertData = $this->prepareReviewData($data);
        $insertData['created_at'] = current_time('mysql');
        $insertData['updated_at'] = current_time('mysql');

        $result = $this->wpdb->insert($table, $insertData);

        if ($result === false) {
            throw new \Exception('Failed to create review: ' . $this->wpdb->last_error);
        }

        return $this->wpdb->insert_id;
    }

    /**
     * Update a review
     * 
     * @param int   $id   Review ID
     * @param array $data Review data to update
     * @return bool
     */
    public function update(int $id, array $data): bool
    {
        $table = $this->getTableName();

        $updateData = $this->prepareReviewData($data);
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
     * Bulk update review status
     *
     * @param array  $ids    Review IDs
     * @param string $status New status
     * @return int Number of affected rows
     */
    public function bulkUpdateStatus(array $ids, string $status): int
    {
        if (empty($ids)) {
            return 0;
        }

        $table = $this->getTableName();
        $ids   = array_map('intval', $ids);
        $placeholders = implode(',', array_fill(0, count($ids), '%d'));

        $query = $this->wpdb->prepare(
            "UPDATE {$table} SET status = %s, updated_at = %s WHERE id IN ({$placeholders})",
            array_merge([sanitize_text_field($status), current_time('mysql')], $ids)
        );

        $this->wpdb->query($query);

        return (int) $this->wpdb->rows_affected;
    }

    /**
     * Bulk delete reviews
     *
     * @param array $ids Review IDs
     * @return int Number of deleted rows
     */
    public function bulkDelete(array $ids): int
    {
        if (empty($ids)) {
            return 0;
        }

        $table = $this->getTableName();
        $ids   = array_map('intval', $ids);
        $placeholders = implode(',', array_fill(0, count($ids), '%d'));

        $this->wpdb->query($this->wpdb->prepare(
            "DELETE FROM {$table} WHERE id IN ({$placeholders})",
            $ids
        ));

        return (int) $this->wpdb->rows_affected;
    }

    /**
     * Update review status
     * 
     * @param int    $id     Review ID
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
     * Delete a review
     * 
     * @param int $id Review ID
     * @return bool
     */
    public function delete(int $id): bool
    {
        $table = $this->getTableName();

        $result = $this->wpdb->delete($table, ['id' => $id], ['%d']);

        return $result !== false;
    }

    /**
     * Get average rating for a trip
     * 
     * @param int $tripId Trip ID
     * @return float
     */
    public function getAverageRating(int $tripId): float
    {
        $table = $this->getTableName();

        $result = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT AVG(rating) FROM {$table} WHERE trip_id = %d AND status = 'approved'",
            $tripId
        ));

        return round((float) ($result ?? 0), 1);
    }

    /**
     * Get review count for a trip
     * 
     * @param int $tripId Trip ID
     * @return int
     */
    public function getReviewCount(int $tripId): int
    {
        $table = $this->getTableName();

        return (int) $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE trip_id = %d AND status = 'approved'",
            $tripId
        ));
    }

    /**
     * Get rating distribution for a trip
     * 
     * @param int $tripId Trip ID
     * @return array
     */
    public function getRatingDistribution(int $tripId): array
    {
        $table = $this->getTableName();

        $results = $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT rating, COUNT(*) as count 
             FROM {$table} 
             WHERE trip_id = %d AND status = 'approved'
             GROUP BY rating
             ORDER BY rating DESC",
            $tripId
        ), OBJECT_K);

        $distribution = [];
        for ($i = 5; $i >= 1; $i--) {
            $distribution[$i] = (int) ($results[$i]->count ?? 0);
        }

        return $distribution;
    }

    /**
     * Get review statistics
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

        // Pending count
        $pending = (int) ($statusStats['pending']->count ?? 0);

        // Average rating
        $avgRating = (float) $this->wpdb->get_var(
            "SELECT AVG(rating) FROM {$table} WHERE status = 'approved'"
        );

        // This month
        $thisMonth = (int) $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE created_at >= %s",
            date('Y-m-01 00:00:00')
        ));

        return [
            'total' => array_sum(array_column((array) $statusStats, 'count')),
            'by_status' => $statusStats,
            'pending' => $pending,
            'average_rating' => round($avgRating, 1),
            'this_month' => $thisMonth,
        ];
    }

    /**
     * Check if user can edit review (within 24 hours)
     * 
     * @param int $reviewId Review ID
     * @param int $userId   User ID
     * @return bool
     */
    public function canUserEdit(int $reviewId, int $userId): bool
    {
        $review = $this->find($reviewId);

        if (!$review) {
            return false;
        }

        // Must be the review owner
        if ((int) $review->user_id !== $userId) {
            return false;
        }

        // Must be within 24 hours
        $createdTime = strtotime($review->created_at);
        $hoursSinceCreation = (time() - $createdTime) / 3600;

        if ($hoursSinceCreation > 24) {
            return false;
        }

        // Must not be approved
        if ($review->status === 'approved') {
            return false;
        }

        return true;
    }

    /**
     * Prepare review data for insert/update
     * 
     * @param array $data Raw data
     * @return array Sanitized data
     */
    private function prepareReviewData(array $data): array
    {
        $prepared = [];

        if (array_key_exists('trip_id', $data)) {
            $prepared['trip_id'] = (int) $data['trip_id'];
        }

        if (array_key_exists('user_id', $data)) {
            $prepared['user_id'] = $data['user_id'] ? (int) $data['user_id'] : null;
        }

        if (array_key_exists('rating', $data)) {
            $prepared['rating'] = max(1, min(5, (int) $data['rating']));
        }

        if (array_key_exists('review_text', $data)) {
            $prepared['review_text'] = sanitize_textarea_field((string) $data['review_text']);
        }

        if (array_key_exists('reviewer_name', $data)) {
            $prepared['reviewer_name'] = sanitize_text_field((string) $data['reviewer_name']);
        }

        if (array_key_exists('reviewer_email', $data)) {
            $prepared['reviewer_email'] = sanitize_email((string) $data['reviewer_email']);
        }

        if (array_key_exists('status', $data)) {
            $prepared['status'] = sanitize_text_field((string) $data['status']);
        }

        if (array_key_exists('admin_response', $data)) {
            $prepared['admin_response'] = sanitize_textarea_field((string) $data['admin_response']);
        }

        if (array_key_exists('responded_by', $data)) {
            $prepared['responded_by'] = (int) $data['responded_by'];
        }

        if (array_key_exists('responded_at', $data) && $data['responded_at']) {
            $prepared['responded_at'] = sanitize_text_field($data['responded_at']);
        }

        return $prepared;
    }

    /**
     * Check if reviews table exists
     */
    public function tableExists(): bool
    {
        global $wpdb;
        $tableName = $this->getTableName();
        
        return (bool) $wpdb->get_var(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
             WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = '{$tableName}'"
        );
    }
}

