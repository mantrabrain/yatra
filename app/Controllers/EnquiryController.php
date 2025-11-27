<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Enquiry REST API Controller
 * 
 * Handles CRUD operations for customer enquiries
 * 
 * @package Yatra
 */
class EnquiryController extends BaseController
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
        $this->table = $wpdb->prefix . 'yatra_enquiries';
        $this->trips_table = $wpdb->prefix . 'yatra_trips';
    }

    /**
     * Register routes
     */
    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        $base = 'enquiries';

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

        // Respond to enquiry endpoint
        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)/respond', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'respond_to_enquiry'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);
    }

    /**
     * Get all enquiries with filtering and pagination
     */
    public function get_items(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;

        $page = max(1, (int) $request->get_param('page') ?: 1);
        $per_page = min(100, max(1, (int) $request->get_param('per_page') ?: 10));
        $search = sanitize_text_field($request->get_param('search') ?: '');
        $status = sanitize_text_field($request->get_param('status') ?: '');
        $orderby = sanitize_text_field($request->get_param('orderby') ?: 'created_at');
        $order = strtoupper(sanitize_text_field($request->get_param('order') ?: 'DESC'));

        // Validate order
        $order = in_array($order, ['ASC', 'DESC']) ? $order : 'DESC';

        // Validate orderby - allow sorting by trip_title and customer_name
        $valid_orderby = ['id', 'name', 'email', 'status', 'created_at', 'updated_at', 'trip_title', 'customer_name'];
        if (!in_array($orderby, $valid_orderby)) {
            $orderby = 'created_at';
        }

        // Build query
        $where_clauses = [];
        $where_values = [];

        if (!empty($search)) {
            $where_clauses[] = '(e.name LIKE %s OR e.email LIKE %s OR e.message LIKE %s OR t.title LIKE %s)';
            $search_term = '%' . $wpdb->esc_like($search) . '%';
            $where_values[] = $search_term;
            $where_values[] = $search_term;
            $where_values[] = $search_term;
            $where_values[] = $search_term;
        }

        if (!empty($status) && $status !== 'all') {
            $where_clauses[] = 'e.status = %s';
            $where_values[] = $status;
        }

        $where_sql = !empty($where_clauses) ? 'WHERE ' . implode(' AND ', $where_clauses) : '';

        // Map orderby to actual column
        $orderby_map = [
            'trip_title' => 't.title',
            'customer_name' => 'e.name',
        ];
        $actual_orderby = isset($orderby_map[$orderby]) ? $orderby_map[$orderby] : "e.{$orderby}";

        // Count total
        $count_query = "SELECT COUNT(*) FROM {$this->table} e LEFT JOIN {$this->trips_table} t ON e.trip_id = t.id {$where_sql}";
        if (!empty($where_values)) {
            $count_query = $wpdb->prepare($count_query, ...$where_values);
        }
        $total = (int) $wpdb->get_var($count_query);

        // Get items
        $offset = ($page - 1) * $per_page;
        $query = "SELECT e.*, t.title as trip_title, t.slug as trip_slug 
                  FROM {$this->table} e 
                  LEFT JOIN {$this->trips_table} t ON e.trip_id = t.id 
                  {$where_sql} 
                  ORDER BY {$actual_orderby} {$order} 
                  LIMIT %d OFFSET %d";
        
        $query_values = array_merge($where_values, [$per_page, $offset]);
        $items = $wpdb->get_results($wpdb->prepare($query, ...$query_values));

        // Format items
        $formatted_items = array_map(function($item) {
            return [
                'id' => (int) $item->id,
                'trip_id' => $item->trip_id ? (int) $item->trip_id : null,
                'trip_title' => $item->trip_title ?: null,
                'trip_slug' => $item->trip_slug ?: null,
                'name' => $item->name,
                'email' => $item->email,
                'phone' => $item->phone,
                'message' => $item->message,
                'adults' => (int) $item->adults,
                'children' => (int) $item->children,
                'number_of_travelers' => (int) $item->adults + (int) $item->children,
                'travel_date' => $item->travel_date,
                'preferred_travel_date' => $item->travel_date,
                'status' => $item->status,
                'response_notes' => $item->response_notes,
                'responded_at' => $item->responded_at,
                'created_at' => $item->created_at,
                'updated_at' => $item->updated_at,
            ];
        }, $items);

        return new WP_REST_Response([
            'items' => $formatted_items,
            'total' => $total,
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => (int) ceil($total / $per_page),
        ], 200);
    }

    /**
     * Get single enquiry
     */
    public function get_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $id = (int) $request->get_param('id');

        $item = $wpdb->get_row($wpdb->prepare(
            "SELECT e.*, t.title as trip_title, t.slug as trip_slug 
             FROM {$this->table} e 
             LEFT JOIN {$this->trips_table} t ON e.trip_id = t.id 
             WHERE e.id = %d",
            $id
        ));

        if (!$item) {
            return new WP_Error('not_found', __('Enquiry not found', 'yatra'), ['status' => 404]);
        }

        return new WP_REST_Response([
            'id' => (int) $item->id,
            'trip_id' => $item->trip_id ? (int) $item->trip_id : null,
            'trip_title' => $item->trip_title ?: null,
            'trip_slug' => $item->trip_slug ?: null,
            'name' => $item->name,
            'email' => $item->email,
            'phone' => $item->phone,
            'message' => $item->message,
            'adults' => (int) $item->adults,
            'children' => (int) $item->children,
            'number_of_travelers' => (int) $item->adults + (int) $item->children,
            'travel_date' => $item->travel_date,
            'preferred_travel_date' => $item->travel_date,
            'status' => $item->status,
            'response_notes' => $item->response_notes,
            'responded_at' => $item->responded_at,
            'ip_address' => $item->ip_address,
            'user_agent' => $item->user_agent,
            'source' => $item->source,
            'created_at' => $item->created_at,
            'updated_at' => $item->updated_at,
        ], 200);
    }

    /**
     * Create new enquiry
     */
    public function create_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $data = $request->get_json_params();

        // Validate required fields
        if (empty($data['name'])) {
            return new WP_Error('missing_name', __('Name is required', 'yatra'), ['status' => 400]);
        }

        if (empty($data['email']) || !is_email($data['email'])) {
            return new WP_Error('invalid_email', __('Valid email is required', 'yatra'), ['status' => 400]);
        }

        if (empty($data['message'])) {
            return new WP_Error('missing_message', __('Message is required', 'yatra'), ['status' => 400]);
        }

        // Prepare insert data
        $insert_data = [
            'trip_id' => !empty($data['trip_id']) ? (int) $data['trip_id'] : null,
            'name' => sanitize_text_field($data['name']),
            'email' => sanitize_email($data['email']),
            'phone' => !empty($data['phone']) ? sanitize_text_field($data['phone']) : null,
            'message' => sanitize_textarea_field($data['message']),
            'adults' => !empty($data['adults']) ? (int) $data['adults'] : 1,
            'children' => !empty($data['children']) ? (int) $data['children'] : 0,
            'travel_date' => !empty($data['travel_date']) ? sanitize_text_field($data['travel_date']) : null,
            'status' => 'new',
            'source' => !empty($data['source']) ? sanitize_text_field($data['source']) : 'website',
            'ip_address' => $this->get_client_ip(),
            'user_agent' => !empty($_SERVER['HTTP_USER_AGENT']) ? substr(sanitize_text_field($_SERVER['HTTP_USER_AGENT']), 0, 500) : null,
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
        ];

        $result = $wpdb->insert($this->table, $insert_data);

        if ($result === false) {
            return new WP_Error('db_error', __('Failed to create enquiry', 'yatra'), ['status' => 500]);
        }

        $id = $wpdb->insert_id;

        return new WP_REST_Response([
            'id' => $id,
            'message' => __('Enquiry created successfully', 'yatra'),
        ], 201);
    }

    /**
     * Update enquiry
     */
    public function update_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $id = (int) $request->get_param('id');
        $data = $request->get_json_params();

        // Check if enquiry exists
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table} WHERE id = %d",
            $id
        ));

        if (!$existing) {
            return new WP_Error('not_found', __('Enquiry not found', 'yatra'), ['status' => 404]);
        }

        // Prepare update data
        $update_data = [];
        $update_format = [];

        if (isset($data['status'])) {
            $valid_statuses = ['new', 'responded', 'closed', 'converted', 'spam'];
            if (in_array($data['status'], $valid_statuses)) {
                $update_data['status'] = $data['status'];
                $update_format[] = '%s';

                // If marking as responded, set responded_at and responded_by
                if ($data['status'] === 'responded' && $existing->status !== 'responded') {
                    $update_data['responded_at'] = current_time('mysql');
                    $update_data['responded_by'] = get_current_user_id();
                    $update_format[] = '%s';
                    $update_format[] = '%d';
                }
            }
        }

        if (isset($data['response_notes'])) {
            $update_data['response_notes'] = sanitize_textarea_field($data['response_notes']);
            $update_format[] = '%s';
        }

        if (isset($data['name'])) {
            $update_data['name'] = sanitize_text_field($data['name']);
            $update_format[] = '%s';
        }

        if (isset($data['email'])) {
            $update_data['email'] = sanitize_email($data['email']);
            $update_format[] = '%s';
        }

        if (isset($data['phone'])) {
            $update_data['phone'] = sanitize_text_field($data['phone']);
            $update_format[] = '%s';
        }

        if (isset($data['message'])) {
            $update_data['message'] = sanitize_textarea_field($data['message']);
            $update_format[] = '%s';
        }

        if (empty($update_data)) {
            return new WP_Error('no_data', __('No data to update', 'yatra'), ['status' => 400]);
        }

        $update_data['updated_at'] = current_time('mysql');
        $update_format[] = '%s';

        $result = $wpdb->update(
            $this->table,
            $update_data,
            ['id' => $id],
            $update_format,
            ['%d']
        );

        if ($result === false) {
            return new WP_Error('db_error', __('Failed to update enquiry', 'yatra'), ['status' => 500]);
        }

        return new WP_REST_Response([
            'id' => $id,
            'message' => __('Enquiry updated successfully', 'yatra'),
        ], 200);
    }

    /**
     * Delete enquiry
     */
    public function delete_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $id = (int) $request->get_param('id');

        $result = $wpdb->delete($this->table, ['id' => $id], ['%d']);

        if ($result === false) {
            return new WP_Error('db_error', __('Failed to delete enquiry', 'yatra'), ['status' => 500]);
        }

        if ($result === 0) {
            return new WP_Error('not_found', __('Enquiry not found', 'yatra'), ['status' => 404]);
        }

        return new WP_REST_Response([
            'message' => __('Enquiry deleted successfully', 'yatra'),
        ], 200);
    }

    /**
     * Bulk action on enquiries
     */
    public function bulk_action(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $data = $request->get_json_params();
        $action = sanitize_text_field($data['action'] ?? '');
        $ids = array_map('intval', $data['ids'] ?? []);

        if (empty($ids)) {
            return new WP_Error('no_ids', __('No enquiries selected', 'yatra'), ['status' => 400]);
        }

        $valid_actions = ['delete', 'mark_responded', 'mark_closed', 'mark_spam'];
        if (!in_array($action, $valid_actions)) {
            return new WP_Error('invalid_action', __('Invalid action', 'yatra'), ['status' => 400]);
        }

        $placeholders = implode(',', array_fill(0, count($ids), '%d'));
        $affected = 0;

        switch ($action) {
            case 'delete':
                $affected = $wpdb->query($wpdb->prepare(
                    "DELETE FROM {$this->table} WHERE id IN ({$placeholders})",
                    ...$ids
                ));
                break;

            case 'mark_responded':
                $affected = $wpdb->query($wpdb->prepare(
                    "UPDATE {$this->table} SET status = 'responded', responded_at = %s, responded_by = %d, updated_at = %s WHERE id IN ({$placeholders})",
                    current_time('mysql'),
                    get_current_user_id(),
                    current_time('mysql'),
                    ...$ids
                ));
                break;

            case 'mark_closed':
                $affected = $wpdb->query($wpdb->prepare(
                    "UPDATE {$this->table} SET status = 'closed', updated_at = %s WHERE id IN ({$placeholders})",
                    current_time('mysql'),
                    ...$ids
                ));
                break;

            case 'mark_spam':
                $affected = $wpdb->query($wpdb->prepare(
                    "UPDATE {$this->table} SET status = 'spam', updated_at = %s WHERE id IN ({$placeholders})",
                    current_time('mysql'),
                    ...$ids
                ));
                break;
        }

        return new WP_REST_Response([
            'message' => sprintf(__('%d enquiries updated', 'yatra'), $affected),
            'affected' => $affected,
        ], 200);
    }

    /**
     * Get enquiry statistics
     */
    public function get_stats(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;

        $stats = $wpdb->get_results(
            "SELECT status, COUNT(*) as count FROM {$this->table} GROUP BY status",
            OBJECT_K
        );

        $total = $wpdb->get_var("SELECT COUNT(*) FROM {$this->table}");
        $today = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->table} WHERE DATE(created_at) = %s",
            current_time('Y-m-d')
        ));
        $this_week = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->table} WHERE created_at >= %s",
            date('Y-m-d', strtotime('-7 days'))
        ));

        return new WP_REST_Response([
            'total' => (int) $total,
            'today' => (int) $today,
            'this_week' => (int) $this_week,
            'new' => isset($stats['new']) ? (int) $stats['new']->count : 0,
            'responded' => isset($stats['responded']) ? (int) $stats['responded']->count : 0,
            'closed' => isset($stats['closed']) ? (int) $stats['closed']->count : 0,
            'converted' => isset($stats['converted']) ? (int) $stats['converted']->count : 0,
            'spam' => isset($stats['spam']) ? (int) $stats['spam']->count : 0,
        ], 200);
    }

    /**
     * Respond to an enquiry - sends email to customer
     */
    public function respond_to_enquiry(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $id = (int) $request->get_param('id');
        $data = $request->get_json_params();

        // Validate message
        if (empty($data['message'])) {
            return new WP_Error('missing_message', __('Response message is required', 'yatra'), ['status' => 400]);
        }

        // Get the enquiry
        $enquiry = $wpdb->get_row($wpdb->prepare(
            "SELECT e.*, t.title as trip_title 
             FROM {$this->table} e 
             LEFT JOIN {$this->trips_table} t ON e.trip_id = t.id 
             WHERE e.id = %d",
            $id
        ));

        if (!$enquiry) {
            return new WP_Error('not_found', __('Enquiry not found', 'yatra'), ['status' => 404]);
        }

        $response_message = sanitize_textarea_field($data['message']);
        $customer_email = $enquiry->email;
        $customer_name = $enquiry->name;

        // Build email subject
        $subject = sprintf(
            __('Re: Your enquiry about %s', 'yatra'),
            $enquiry->trip_title ?: __('our travel services', 'yatra')
        );

        // Build email body
        $body = sprintf(__("Dear %s,\n\n", 'yatra'), $customer_name);
        $body .= sprintf(__("Thank you for your enquiry. Here is our response:\n\n", 'yatra'));
        $body .= $response_message . "\n\n";
        $body .= "---\n";
        $body .= sprintf(__("Your original message:\n%s\n\n", 'yatra'), $enquiry->message);
        $body .= sprintf(__("Best regards,\n%s\n", 'yatra'), get_bloginfo('name'));

        // Get headers for HTML email
        $headers = [
            'Content-Type: text/plain; charset=UTF-8',
            'From: ' . get_bloginfo('name') . ' <' . get_option('admin_email') . '>',
        ];

        // Send email
        $sent = wp_mail($customer_email, $subject, $body, $headers);

        if (!$sent) {
            return new WP_Error('email_failed', __('Failed to send email. Please check your server email settings.', 'yatra'), ['status' => 500]);
        }

        // Update enquiry status and add response notes
        $wpdb->update(
            $this->table,
            [
                'status' => 'responded',
                'response_notes' => $response_message,
                'responded_at' => current_time('mysql'),
                'responded_by' => get_current_user_id(),
                'updated_at' => current_time('mysql'),
            ],
            ['id' => $id],
            ['%s', '%s', '%s', '%d', '%s'],
            ['%d']
        );

        return new WP_REST_Response([
            'message' => __('Response sent successfully', 'yatra'),
            'email_sent_to' => $customer_email,
        ], 200);
    }

    /**
     * Get client IP address
     */
    private function get_client_ip(): string
    {
        $ip_keys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR'];
        
        foreach ($ip_keys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = sanitize_text_field($_SERVER[$key]);
                // Handle comma-separated IPs (from proxies)
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return '0.0.0.0';
    }
}

