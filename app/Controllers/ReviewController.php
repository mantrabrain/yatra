<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Review REST API Controller
 * 
 * Handles CRUD operations for trip reviews
 * 
 * @package Yatra
 */
class ReviewController extends BaseController
{
    /**
     * @var string Table name
     */
    private string $table;

    /**
     * @var string Trips table name
     */
    private string $trips_table;

    /**
     * Constructor
     */
    public function __construct()
    {
        global $wpdb;
        $this->table = $wpdb->prefix . 'yatra_reviews';
        $this->trips_table = $wpdb->prefix . 'yatra_trips';
    }

    /**
     * Register routes
     */
    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        $base = 'reviews';

        register_rest_route($namespace, '/' . $base, [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'check_permission'],
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'check_permission'],
            ],
            [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_item'],
                'permission_callback' => [$this, 'check_permission'],
            ],
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_item'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Bulk actions
        register_rest_route($namespace, '/' . $base . '/bulk', [
            [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'bulk_action'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Stats endpoint
        register_rest_route($namespace, '/' . $base . '/stats', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_stats'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);
    }

    /**
     * Get all reviews with filtering and pagination
     */
    public function get_items(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $this->ensureTableExists();

        $page = (int) ($request->get_param('page') ?: 1);
        $per_page = (int) ($request->get_param('per_page') ?: 10);
        $offset = ($page - 1) * $per_page;

        $orderby = $request->get_param('orderby') ?: 'created_at';
        $order = strtoupper($request->get_param('order') ?: 'DESC');
        $order = in_array($order, ['ASC', 'DESC']) ? $order : 'DESC';

        // Whitelist orderby columns and handle special cases
        $allowed_orderby = ['id', 'rating', 'status', 'created_at', 'author_name', 'trip_title', 'customer_name'];
        
        // Map frontend field names to database columns
        $orderby_map = [
            'trip_title' => 't.title',
            'customer_name' => 'r.author_name',
        ];
        
        if (isset($orderby_map[$orderby])) {
            $orderby = $orderby_map[$orderby];
        } elseif (in_array($orderby, $allowed_orderby)) {
            $orderby = 'r.' . $orderby;
        } else {
            $orderby = 'r.created_at';
        }

        // Build WHERE clause
        $where = [];
        $params = [];

        // Status filter
        $status = $request->get_param('status');
        if ($status && $status !== 'all') {
            $where[] = 'r.status = %s';
            $params[] = $status;
        }

        // Rating filter
        $rating = $request->get_param('rating');
        if ($rating && $rating !== 'all') {
            $where[] = 'r.rating = %d';
            $params[] = (int) $rating;
        }

        // Trip filter
        $trip_id = $request->get_param('trip_id');
        if ($trip_id) {
            $where[] = 'r.trip_id = %d';
            $params[] = (int) $trip_id;
        }

        // Search
        $search = $request->get_param('search');
        if ($search) {
            $like = '%' . $wpdb->esc_like($search) . '%';
            $where[] = '(r.author_name LIKE %s OR r.title LIKE %s OR r.content LIKE %s OR t.title LIKE %s)';
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
        }

        $where_sql = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        // Get total count
        $count_sql = "SELECT COUNT(*) FROM {$this->table} r 
                      LEFT JOIN {$this->trips_table} t ON r.trip_id = t.id
                      {$where_sql}";
        
        if (!empty($params)) {
            $count_sql = $wpdb->prepare($count_sql, ...$params);
        }
        $total = (int) $wpdb->get_var($count_sql);

        // Get items
        $sql = "SELECT r.*, t.title as trip_title 
                FROM {$this->table} r
                LEFT JOIN {$this->trips_table} t ON r.trip_id = t.id
                {$where_sql}
                ORDER BY {$orderby} {$order}
                LIMIT %d OFFSET %d";

        $params[] = $per_page;
        $params[] = $offset;

        $items = $wpdb->get_results($wpdb->prepare($sql, ...$params));

        // Format items
        $formatted = array_map(function ($item) {
            return [
                'id' => (int) $item->id,
                'trip_id' => (int) $item->trip_id,
                'trip_title' => $item->trip_title ?? 'Unknown Trip',
                'user_id' => (int) ($item->user_id ?? 0),
                'rating' => (int) $item->rating,
                'title' => $item->title ?? '',
                'comment' => $item->content ?? '',
                'customer_name' => $item->author_name ?? 'Anonymous',
                'customer_email' => $item->author_email ?? '',
                'customer_location' => $item->author_location ?? '',
                'status' => $item->status ?? 'pending',
                'verified' => (bool) ($item->user_id > 0),
                'helpful_count' => (int) ($item->helpful_count ?? 0),
                'created_at' => $item->created_at ?? '',
                'updated_at' => $item->updated_at ?? '',
            ];
        }, $items ?: []);

        return $this->success_response([
            'data' => $formatted,
            'total' => $total,
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => ceil($total / $per_page),
        ]);
    }

    /**
     * Get single review
     */
    public function get_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $id = (int) $request->get_param('id');

        $item = $wpdb->get_row($wpdb->prepare(
            "SELECT r.*, t.title as trip_title 
             FROM {$this->table} r
             LEFT JOIN {$this->trips_table} t ON r.trip_id = t.id
             WHERE r.id = %d",
            $id
        ));

        if (!$item) {
            return new WP_Error('not_found', __('Review not found.', 'yatra'), ['status' => 404]);
        }

        return $this->success_response([
            'id' => (int) $item->id,
            'trip_id' => (int) $item->trip_id,
            'trip_title' => $item->trip_title ?? 'Unknown Trip',
            'user_id' => (int) ($item->user_id ?? 0),
            'rating' => (int) $item->rating,
            'title' => $item->title ?? '',
            'comment' => $item->content ?? '',
            'customer_name' => $item->author_name ?? 'Anonymous',
            'customer_email' => $item->author_email ?? '',
            'customer_location' => $item->author_location ?? '',
            'status' => $item->status ?? 'pending',
            'verified' => (bool) ($item->user_id > 0),
            'helpful_count' => (int) ($item->helpful_count ?? 0),
            'created_at' => $item->created_at ?? '',
            'updated_at' => $item->updated_at ?? '',
        ]);
    }

    /**
     * Create new review
     */
    public function create_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $this->ensureTableExists();

        $data = $request->get_json_params();

        // Validate required fields
        if (empty($data['trip_id'])) {
            return new WP_Error('missing_trip_id', __('Trip ID is required.', 'yatra'), ['status' => 400]);
        }

        if (empty($data['customer_name'])) {
            return new WP_Error('missing_customer_name', __('Customer name is required.', 'yatra'), ['status' => 400]);
        }

        if (empty($data['rating']) || (int) $data['rating'] < 1 || (int) $data['rating'] > 5) {
            return new WP_Error('invalid_rating', __('Rating must be between 1 and 5.', 'yatra'), ['status' => 400]);
        }

        if (empty($data['comment'])) {
            return new WP_Error('missing_comment', __('Review comment is required.', 'yatra'), ['status' => 400]);
        }

        // Prepare insert data
        $insert_data = [
            'trip_id' => (int) $data['trip_id'],
            'user_id' => isset($data['user_id']) ? (int) $data['user_id'] : 0,
            'rating' => (int) $data['rating'],
            'title' => sanitize_text_field($data['title'] ?? ''),
            'content' => sanitize_textarea_field($data['comment']),
            'author_name' => sanitize_text_field($data['customer_name']),
            'author_email' => sanitize_email($data['customer_email'] ?? ''),
            'author_location' => sanitize_text_field($data['customer_location'] ?? ''),
            'status' => in_array($data['status'] ?? 'pending', ['pending', 'approved', 'rejected']) ? $data['status'] : 'pending',
            'created_at' => current_time('mysql'),
        ];

        $format = ['%d', '%d', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s'];

        $result = $wpdb->insert($this->table, $insert_data, $format);

        if ($result === false) {
            return new WP_Error('create_failed', __('Failed to create review.', 'yatra'), ['status' => 500]);
        }

        $review_id = $wpdb->insert_id;

        // Return the created review
        $request->set_param('id', $review_id);
        return $this->get_item($request);
    }

    /**
     * Update review (approve, reject, edit)
     */
    public function update_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $id = (int) $request->get_param('id');
        $data = $request->get_json_params();

        // Check if review exists
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$this->table} WHERE id = %d",
            $id
        ));

        if (!$exists) {
            return new WP_Error('not_found', __('Review not found.', 'yatra'), ['status' => 404]);
        }

        // Build update data
        $update = [];
        $format = [];

        if (isset($data['status'])) {
            $allowed_status = ['pending', 'approved', 'rejected', 'spam', 'trash'];
            if (in_array($data['status'], $allowed_status)) {
                $update['status'] = $data['status'];
                $format[] = '%s';
            }
        }

        if (isset($data['rating'])) {
            $update['rating'] = max(1, min(5, (int) $data['rating']));
            $format[] = '%d';
        }

        if (isset($data['title'])) {
            $update['title'] = sanitize_text_field($data['title']);
            $format[] = '%s';
        }

        if (isset($data['comment'])) {
            $update['content'] = sanitize_textarea_field($data['comment']);
            $format[] = '%s';
        }

        if (isset($data['customer_name'])) {
            $update['author_name'] = sanitize_text_field($data['customer_name']);
            $format[] = '%s';
        }

        if (isset($data['customer_email'])) {
            $update['author_email'] = sanitize_email($data['customer_email']);
            $format[] = '%s';
        }

        if (isset($data['customer_location'])) {
            $update['author_location'] = sanitize_text_field($data['customer_location']);
            $format[] = '%s';
        }

        if (isset($data['trip_id'])) {
            $update['trip_id'] = (int) $data['trip_id'];
            $format[] = '%d';
        }

        if (empty($update)) {
            return new WP_Error('no_data', __('No valid data to update.', 'yatra'), ['status' => 400]);
        }

        $update['updated_at'] = current_time('mysql');
        $format[] = '%s';

        $result = $wpdb->update($this->table, $update, ['id' => $id], $format, ['%d']);

        if ($result === false) {
            return new WP_Error('update_failed', __('Failed to update review.', 'yatra'), ['status' => 500]);
        }

        return $this->get_item($request);
    }

    /**
     * Delete review
     */
    public function delete_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $id = (int) $request->get_param('id');

        $result = $wpdb->delete($this->table, ['id' => $id], ['%d']);

        if ($result === false) {
            return new WP_Error('delete_failed', __('Failed to delete review.', 'yatra'), ['status' => 500]);
        }

        return $this->success_response(['message' => __('Review deleted successfully.', 'yatra')]);
    }

    /**
     * Bulk actions (approve, reject, delete)
     */
    public function bulk_action(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $data = $request->get_json_params();
        $action = $data['action'] ?? '';
        $ids = $data['ids'] ?? [];

        if (empty($ids) || !is_array($ids)) {
            return new WP_Error('invalid_ids', __('No reviews selected.', 'yatra'), ['status' => 400]);
        }

        $ids = array_map('intval', $ids);
        $placeholders = implode(',', array_fill(0, count($ids), '%d'));

        switch ($action) {
            case 'approve':
                $result = $wpdb->query($wpdb->prepare(
                    "UPDATE {$this->table} SET status = 'approved', updated_at = %s WHERE id IN ($placeholders)",
                    current_time('mysql'),
                    ...$ids
                ));
                $message = __('Reviews approved successfully.', 'yatra');
                break;

            case 'reject':
                $result = $wpdb->query($wpdb->prepare(
                    "UPDATE {$this->table} SET status = 'rejected', updated_at = %s WHERE id IN ($placeholders)",
                    current_time('mysql'),
                    ...$ids
                ));
                $message = __('Reviews rejected successfully.', 'yatra');
                break;

            case 'delete':
                $result = $wpdb->query($wpdb->prepare(
                    "DELETE FROM {$this->table} WHERE id IN ($placeholders)",
                    ...$ids
                ));
                $message = __('Reviews deleted successfully.', 'yatra');
                break;

            default:
                return new WP_Error('invalid_action', __('Invalid action.', 'yatra'), ['status' => 400]);
        }

        if ($result === false) {
            return new WP_Error('action_failed', __('Action failed.', 'yatra'), ['status' => 500]);
        }

        return $this->success_response(['message' => $message, 'affected' => $result]);
    }

    /**
     * Get review statistics
     */
    public function get_stats(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $this->ensureTableExists();

        $stats = [
            'total' => 0,
            'pending' => 0,
            'approved' => 0,
            'rejected' => 0,
            'average_rating' => 0,
            'by_rating' => [
                '5' => 0,
                '4' => 0,
                '3' => 0,
                '2' => 0,
                '1' => 0,
            ],
        ];

        // Total counts by status
        $counts = $wpdb->get_results(
            "SELECT status, COUNT(*) as count FROM {$this->table} GROUP BY status"
        );

        foreach ($counts as $row) {
            $stats[$row->status] = (int) $row->count;
            $stats['total'] += (int) $row->count;
        }

        // Average rating (approved only)
        $avg = $wpdb->get_var(
            "SELECT AVG(rating) FROM {$this->table} WHERE status = 'approved'"
        );
        $stats['average_rating'] = round((float) $avg, 1);

        // Rating distribution
        $ratings = $wpdb->get_results(
            "SELECT rating, COUNT(*) as count FROM {$this->table} WHERE status = 'approved' GROUP BY rating"
        );

        foreach ($ratings as $row) {
            $stats['by_rating'][(string) $row->rating] = (int) $row->count;
        }

        return $this->success_response($stats);
    }

    /**
     * Ensure the reviews table exists
     */
    private function ensureTableExists(): void
    {
        global $wpdb;

        $table_exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $this->table));

        if (!$table_exists) {
            $charset = $wpdb->get_charset_collate();

            $sql = "CREATE TABLE IF NOT EXISTS {$this->table} (
                id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
                trip_id bigint(20) UNSIGNED NOT NULL,
                user_id bigint(20) UNSIGNED DEFAULT 0,
                rating tinyint(1) UNSIGNED NOT NULL,
                title varchar(255) DEFAULT NULL,
                content text NOT NULL,
                author_name varchar(100) NOT NULL,
                author_email varchar(100) DEFAULT NULL,
                author_location varchar(100) DEFAULT NULL,
                status enum('pending','approved','rejected') DEFAULT 'pending',
                helpful_count int(11) UNSIGNED DEFAULT 0,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY idx_trip_id (trip_id),
                KEY idx_user_id (user_id),
                KEY idx_status (status),
                KEY idx_rating (rating)
            ) {$charset};";

            require_once ABSPATH . 'wp-admin/includes/upgrade.php';
            dbDelta($sql);
        }
    }
}

