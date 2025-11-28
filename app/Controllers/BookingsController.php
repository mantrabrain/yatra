<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Repositories\TravellerRepository;

/**
 * Bookings REST API Controller
 * Manages booking CRUD operations for admin
 */
class BookingsController extends BaseController
{
    /**
     * REST API namespace
     */
    protected string $namespace = 'yatra/v1';

    /**
     * @var TravellerRepository
     */
    private TravellerRepository $travellerRepository;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->travellerRepository = new TravellerRepository();
    }

    /**
     * Register REST API routes
     */
    public function register_routes(): void
    {
        // Get all bookings
        register_rest_route($this->namespace, '/bookings', [
            'methods' => 'GET',
            'callback' => [$this, 'get_bookings'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        // Get single booking
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_booking'],
            'permission_callback' => [$this, 'check_admin_permission'],
            'args' => [
                'id' => [
                    'required' => true,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);

        // Update booking
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'update_booking'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        // Delete booking
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'delete_booking'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        // Update booking status
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)/status', [
            'methods' => 'PUT',
            'callback' => [$this, 'update_booking_status'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        // Get booking payments
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)/payments', [
            'methods' => 'GET',
            'callback' => [$this, 'get_booking_payments'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        // Add payment to booking
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)/payments', [
            'methods' => 'POST',
            'callback' => [$this, 'add_payment'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        // Get all payments (for payments page)
        register_rest_route($this->namespace, '/payments', [
            'methods' => 'GET',
            'callback' => [$this, 'get_all_payments'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        // Get booking statistics
        register_rest_route($this->namespace, '/bookings/stats', [
            'methods' => 'GET',
            'callback' => [$this, 'get_booking_stats'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        // Send booking email
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)/send-email', [
            'methods' => 'POST',
            'callback' => [$this, 'send_booking_email'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        // Get all travelers from bookings
        register_rest_route($this->namespace, '/travelers', [
            'methods' => 'GET',
            'callback' => [$this, 'get_travelers'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);
    }

    /**
     * Check admin permission
     */
    public function check_admin_permission(): bool
    {
        return current_user_can('manage_options');
    }

    /**
     * Get all bookings with filtering and pagination
     */
    public function get_bookings(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;
        
        $bookings_table = $wpdb->prefix . 'yatra_bookings';
        $trips_table = $wpdb->prefix . 'yatra_trips';
        
        // Pagination
        $page = max(1, (int) $request->get_param('page') ?: 1);
        $per_page = max(1, min(100, (int) $request->get_param('per_page') ?: 20));
        $offset = ($page - 1) * $per_page;
        
        // Filters
        $status = sanitize_text_field($request->get_param('status') ?: '');
        $payment_status = sanitize_text_field($request->get_param('payment_status') ?: '');
        $search = sanitize_text_field($request->get_param('search') ?: '');
        $trip_id = (int) $request->get_param('trip_id');
        $date_from = sanitize_text_field($request->get_param('date_from') ?: '');
        $date_to = sanitize_text_field($request->get_param('date_to') ?: '');
        
        // Build WHERE clause
        $where_clauses = ['1=1'];
        $where_values = [];
        
        if ($status) {
            $where_clauses[] = 'b.status = %s';
            $where_values[] = $status;
        }
        
        if ($payment_status) {
            $where_clauses[] = 'b.payment_status = %s';
            $where_values[] = $payment_status;
        }
        
        if ($trip_id) {
            $where_clauses[] = 'b.trip_id = %d';
            $where_values[] = $trip_id;
        }
        
        if ($search) {
            $search_like = '%' . $wpdb->esc_like($search) . '%';
            $where_clauses[] = '(b.reference LIKE %s OR b.contact_email LIKE %s OR b.contact_first_name LIKE %s OR b.contact_last_name LIKE %s OR b.contact_phone LIKE %s)';
            $where_values = array_merge($where_values, [$search_like, $search_like, $search_like, $search_like, $search_like]);
        }
        
        if ($date_from) {
            $where_clauses[] = 'b.travel_date >= %s';
            $where_values[] = $date_from;
        }
        
        if ($date_to) {
            $where_clauses[] = 'b.travel_date <= %s';
            $where_values[] = $date_to;
        }
        
        $where_sql = implode(' AND ', $where_clauses);
        
        // Get total count
        $count_query = "SELECT COUNT(*) FROM {$bookings_table} b WHERE {$where_sql}";
        if (!empty($where_values)) {
            $count_query = $wpdb->prepare($count_query, ...$where_values);
        }
        $total = (int) $wpdb->get_var($count_query);
        
        // Get bookings
        $query = "SELECT b.*, t.title as trip_title, t.slug as trip_slug, t.featured_image
                  FROM {$bookings_table} b
                  LEFT JOIN {$trips_table} t ON b.trip_id = t.id
                  WHERE {$where_sql}
                  ORDER BY b.created_at DESC
                  LIMIT %d OFFSET %d";
        
        $query_values = array_merge($where_values, [$per_page, $offset]);
        $bookings = $wpdb->get_results($wpdb->prepare($query, ...$query_values));
        
        // Format bookings
        $formatted_bookings = array_map(function($booking) {
            return $this->format_booking($booking);
        }, $bookings);
        
        return new WP_REST_Response([
            'success' => true,
            'data' => $formatted_bookings,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $per_page,
                'total_pages' => ceil($total / $per_page),
            ],
        ]);
    }

    /**
     * Get single booking
     */
    public function get_booking(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;
        
        $booking_id = (int) $request->get_param('id');
        
        $bookings_table = $wpdb->prefix . 'yatra_bookings';
        $trips_table = $wpdb->prefix . 'yatra_trips';
        $payments_table = $wpdb->prefix . 'yatra_booking_payments';
        
        $booking = $wpdb->get_row($wpdb->prepare(
            "SELECT b.*, t.title as trip_title, t.slug as trip_slug, t.featured_image,
                    t.duration_days, t.duration_nights, t.difficulty_level,
                    t.starting_location, t.ending_location
             FROM {$bookings_table} b
             LEFT JOIN {$trips_table} t ON b.trip_id = t.id
             WHERE b.id = %d",
            $booking_id
        ));
        
        if (!$booking) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Booking not found.', 'yatra'),
            ], 404);
        }
        
        // Get payments
        $payments = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$payments_table} WHERE booking_id = %d ORDER BY created_at DESC",
            $booking_id
        ));
        
        $formatted_booking = $this->format_booking($booking, true);
        $formatted_booking['payments'] = array_map(function($payment) {
            return [
                'id' => (int) $payment->id,
                'transaction_id' => $payment->transaction_id,
                'gateway' => $payment->gateway,
                'amount' => (float) $payment->amount,
                'currency' => $payment->currency,
                'status' => $payment->status,
                'payment_type' => $payment->payment_type,
                'notes' => $payment->notes,
                'processed_at' => $payment->processed_at,
                'created_at' => $payment->created_at,
            ];
        }, $payments);
        
        return new WP_REST_Response([
            'success' => true,
            'data' => $formatted_booking,
        ]);
    }

    /**
     * Update booking
     */
    public function update_booking(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;
        
        $booking_id = (int) $request->get_param('id');
        $data = $request->get_json_params();
        
        $bookings_table = $wpdb->prefix . 'yatra_bookings';
        
        // Check if booking exists
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$bookings_table} WHERE id = %d",
            $booking_id
        ));
        
        if (!$exists) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Booking not found.', 'yatra'),
            ], 404);
        }
        
        // Prepare update data
        $update_data = [];
        $update_format = [];
        
        $allowed_fields = [
            'status' => '%s',
            'payment_status' => '%s',
            'travel_date' => '%s',
            'contact_first_name' => '%s',
            'contact_last_name' => '%s',
            'contact_email' => '%s',
            'contact_phone' => '%s',
            'contact_country' => '%s',
            'special_requests' => '%s',
            'internal_notes' => '%s',
            'amount_paid' => '%f',
            'amount_due' => '%f',
        ];
        
        foreach ($allowed_fields as $field => $format) {
            if (isset($data[$field])) {
                $update_data[$field] = $field === 'contact_email' 
                    ? sanitize_email($data[$field])
                    : ($format === '%f' ? (float) $data[$field] : sanitize_text_field($data[$field]));
                $update_format[] = $format;
            }
        }
        
        // Handle JSON fields
        if (isset($data['contact_data'])) {
            $update_data['contact_data'] = wp_json_encode($data['contact_data']);
            $update_format[] = '%s';
        }
        
        if (isset($data['emergency_contact'])) {
            $update_data['emergency_contact'] = wp_json_encode($data['emergency_contact']);
            $update_format[] = '%s';
        }
        
        // Handle travelers update using repository
        $travelers_updated = false;
        if (isset($data['travelers_data']) && is_array($data['travelers_data'])) {
            // Sanitize travelers data
            $sanitized_travelers = [];
            foreach ($data['travelers_data'] as $traveler) {
                if (is_array($traveler)) {
                    $sanitized_traveler = [];
                    foreach ($traveler as $key => $value) {
                        // Skip internal metadata fields
                        if (strpos($key, '_') === 0) {
                            continue;
                        }
                        $sanitized_traveler[sanitize_key($key)] = sanitize_text_field((string) $value);
                    }
                    $sanitized_travelers[] = $sanitized_traveler;
                }
            }
            
            // Save travelers using repository (replaces all existing travelers)
            if (!empty($sanitized_travelers)) {
                $travelers_with_lead = [];
                foreach ($sanitized_travelers as $index => $fields) {
                    $travelers_with_lead[] = [
                        'is_lead' => ($index === 0),
                        'fields' => $fields,
                    ];
                }
                $this->travellerRepository->saveTravellersForBooking($booking_id, $travelers_with_lead);
                $travelers_updated = true;
                
                // Update travelers count
                $update_data['travelers_count'] = count($sanitized_travelers);
                $update_format[] = '%d';
            }
        }
        
        // Update timestamps based on status
        if (isset($data['status'])) {
            if ($data['status'] === 'confirmed' && empty($update_data['confirmed_at'])) {
                $update_data['confirmed_at'] = current_time('mysql');
                $update_format[] = '%s';
            } elseif ($data['status'] === 'completed' && empty($update_data['completed_at'])) {
                $update_data['completed_at'] = current_time('mysql');
                $update_format[] = '%s';
            } elseif ($data['status'] === 'cancelled') {
                $update_data['cancelled_at'] = current_time('mysql');
                $update_data['cancelled_by'] = get_current_user_id();
                $update_format[] = '%s';
                $update_format[] = '%d';
            }
        }
        
        $update_data['updated_at'] = current_time('mysql');
        $update_format[] = '%s';
        
        $result = $wpdb->update(
            $bookings_table,
            $update_data,
            ['id' => $booking_id],
            $update_format,
            ['%d']
        );
        
        if ($result === false) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Failed to update booking.', 'yatra'),
            ], 500);
        }
        
        return new WP_REST_Response([
            'success' => true,
            'message' => __('Booking updated successfully.', 'yatra'),
        ]);
    }

    /**
     * Delete booking
     */
    public function delete_booking(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;
        
        $booking_id = (int) $request->get_param('id');
        
        $bookings_table = $wpdb->prefix . 'yatra_bookings';
        $payments_table = $wpdb->prefix . 'yatra_booking_payments';
        
        // Check if booking exists
        $booking = $wpdb->get_row($wpdb->prepare(
            "SELECT id, status FROM {$bookings_table} WHERE id = %d",
            $booking_id
        ));
        
        if (!$booking) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Booking not found.', 'yatra'),
            ], 404);
        }
        
        // Delete travelers first (this also deletes their meta)
        $this->travellerRepository->deleteByBookingId($booking_id);
        
        // Delete payments
        $wpdb->delete($payments_table, ['booking_id' => $booking_id], ['%d']);
        
        // Delete booking
        $result = $wpdb->delete($bookings_table, ['id' => $booking_id], ['%d']);
        
        if ($result === false) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Failed to delete booking.', 'yatra'),
            ], 500);
        }
        
        return new WP_REST_Response([
            'success' => true,
            'message' => __('Booking deleted successfully.', 'yatra'),
        ]);
    }

    /**
     * Update booking status
     */
    public function update_booking_status(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;
        
        $booking_id = (int) $request->get_param('id');
        $data = $request->get_json_params();
        
        $new_status = sanitize_text_field($data['status'] ?? '');
        
        $valid_statuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled', 'refunded', 'failed', 'on_hold'];
        
        if (!in_array($new_status, $valid_statuses, true)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Invalid status.', 'yatra'),
            ], 400);
        }
        
        $bookings_table = $wpdb->prefix . 'yatra_bookings';
        
        $update_data = [
            'status' => $new_status,
            'updated_at' => current_time('mysql'),
        ];
        $update_format = ['%s', '%s'];
        
        // Set timestamps based on status
        if ($new_status === 'confirmed') {
            $update_data['confirmed_at'] = current_time('mysql');
            $update_format[] = '%s';
        } elseif ($new_status === 'completed') {
            $update_data['completed_at'] = current_time('mysql');
            $update_format[] = '%s';
        } elseif ($new_status === 'cancelled') {
            $update_data['cancelled_at'] = current_time('mysql');
            $update_data['cancelled_by'] = get_current_user_id();
            $update_data['cancellation_reason'] = sanitize_textarea_field($data['reason'] ?? '');
            $update_format = array_merge($update_format, ['%s', '%d', '%s']);
        }
        
        $result = $wpdb->update(
            $bookings_table,
            $update_data,
            ['id' => $booking_id],
            $update_format,
            ['%d']
        );
        
        if ($result === false) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Failed to update status.', 'yatra'),
            ], 500);
        }
        
        return new WP_REST_Response([
            'success' => true,
            'message' => __('Status updated successfully.', 'yatra'),
        ]);
    }

    /**
     * Get booking payments
     */
    public function get_booking_payments(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;
        
        $booking_id = (int) $request->get_param('id');
        $payments_table = $wpdb->prefix . 'yatra_booking_payments';
        
        $payments = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$payments_table} WHERE booking_id = %d ORDER BY created_at DESC",
            $booking_id
        ));
        
        return new WP_REST_Response([
            'success' => true,
            'data' => array_map(function($payment) {
                return [
                    'id' => (int) $payment->id,
                    'booking_id' => (int) $payment->booking_id,
                    'transaction_id' => $payment->transaction_id,
                    'gateway' => $payment->gateway,
                    'amount' => (float) $payment->amount,
                    'currency' => $payment->currency,
                    'status' => $payment->status,
                    'payment_type' => $payment->payment_type,
                    'notes' => $payment->notes,
                    'processed_at' => $payment->processed_at,
                    'created_at' => $payment->created_at,
                ];
            }, $payments),
        ]);
    }

    /**
     * Add payment to booking
     */
    public function add_payment(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;
        
        $booking_id = (int) $request->get_param('id');
        $data = $request->get_json_params();
        
        $bookings_table = $wpdb->prefix . 'yatra_bookings';
        $payments_table = $wpdb->prefix . 'yatra_booking_payments';
        
        // Get booking
        $booking = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$bookings_table} WHERE id = %d",
            $booking_id
        ));
        
        if (!$booking) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Booking not found.', 'yatra'),
            ], 404);
        }
        
        // Validate amount
        $amount = (float) ($data['amount'] ?? 0);
        if ($amount <= 0) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Invalid payment amount.', 'yatra'),
            ], 400);
        }
        
        // Insert payment
        $result = $wpdb->insert(
            $payments_table,
            [
                'booking_id' => $booking_id,
                'transaction_id' => sanitize_text_field($data['transaction_id'] ?? ''),
                'gateway' => sanitize_text_field($data['gateway'] ?? 'manual'),
                'amount' => $amount,
                'currency' => sanitize_text_field($data['currency'] ?? $booking->currency),
                'status' => sanitize_text_field($data['status'] ?? 'completed'),
                'payment_type' => sanitize_text_field($data['payment_type'] ?? 'partial'),
                'notes' => sanitize_textarea_field($data['notes'] ?? ''),
                'processed_at' => current_time('mysql'),
                'created_at' => current_time('mysql'),
            ],
            ['%d', '%s', '%s', '%f', '%s', '%s', '%s', '%s', '%s', '%s']
        );
        
        if ($result === false) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Failed to add payment.', 'yatra'),
            ], 500);
        }
        
        // Update booking amounts
        $new_amount_paid = (float) $booking->amount_paid + $amount;
        $new_amount_due = max(0, (float) $booking->total_amount - $new_amount_paid);
        
        $new_payment_status = 'pending';
        if ($new_amount_paid >= (float) $booking->total_amount) {
            $new_payment_status = 'paid';
        } elseif ($new_amount_paid > 0) {
            $new_payment_status = 'partial';
        }
        
        $wpdb->update(
            $bookings_table,
            [
                'amount_paid' => $new_amount_paid,
                'amount_due' => $new_amount_due,
                'payment_status' => $new_payment_status,
                'payment_date' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ],
            ['id' => $booking_id],
            ['%f', '%f', '%s', '%s', '%s'],
            ['%d']
        );
        
        return new WP_REST_Response([
            'success' => true,
            'message' => __('Payment added successfully.', 'yatra'),
            'data' => [
                'payment_id' => $wpdb->insert_id,
                'amount_paid' => $new_amount_paid,
                'amount_due' => $new_amount_due,
                'payment_status' => $new_payment_status,
            ],
        ]);
    }

    /**
     * Get all payments
     */
    public function get_all_payments(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;
        
        $payments_table = $wpdb->prefix . 'yatra_booking_payments';
        $bookings_table = $wpdb->prefix . 'yatra_bookings';
        $trips_table = $wpdb->prefix . 'yatra_trips';
        
        // Pagination
        $page = max(1, (int) $request->get_param('page') ?: 1);
        $per_page = max(1, min(100, (int) $request->get_param('per_page') ?: 20));
        $offset = ($page - 1) * $per_page;
        
        // Filters
        $status = sanitize_text_field($request->get_param('status') ?: '');
        $gateway = sanitize_text_field($request->get_param('gateway') ?: '');
        $search = sanitize_text_field($request->get_param('search') ?: '');
        
        // Build WHERE clause
        $where_clauses = ['1=1'];
        $where_values = [];
        
        if ($status) {
            $where_clauses[] = 'p.status = %s';
            $where_values[] = $status;
        }
        
        if ($gateway) {
            $where_clauses[] = 'p.gateway = %s';
            $where_values[] = $gateway;
        }
        
        if ($search) {
            $search_like = '%' . $wpdb->esc_like($search) . '%';
            $where_clauses[] = '(p.transaction_id LIKE %s OR b.reference LIKE %s OR b.contact_email LIKE %s)';
            $where_values = array_merge($where_values, [$search_like, $search_like, $search_like]);
        }
        
        $where_sql = implode(' AND ', $where_clauses);
        
        // Get total count
        $count_query = "SELECT COUNT(*) FROM {$payments_table} p LEFT JOIN {$bookings_table} b ON p.booking_id = b.id WHERE {$where_sql}";
        if (!empty($where_values)) {
            $count_query = $wpdb->prepare($count_query, ...$where_values);
        }
        $total = (int) $wpdb->get_var($count_query);
        
        // Get payments
        $query = "SELECT p.*, b.reference as booking_reference, b.contact_email, 
                         b.contact_first_name, b.contact_last_name, t.title as trip_title
                  FROM {$payments_table} p
                  LEFT JOIN {$bookings_table} b ON p.booking_id = b.id
                  LEFT JOIN {$trips_table} t ON b.trip_id = t.id
                  WHERE {$where_sql}
                  ORDER BY p.created_at DESC
                  LIMIT %d OFFSET %d";
        
        $query_values = array_merge($where_values, [$per_page, $offset]);
        $payments = $wpdb->get_results($wpdb->prepare($query, ...$query_values));
        
        return new WP_REST_Response([
            'success' => true,
            'data' => array_map(function($payment) {
                return [
                    'id' => (int) $payment->id,
                    'booking_id' => (int) $payment->booking_id,
                    'booking_reference' => $payment->booking_reference,
                    'customer_name' => trim(($payment->contact_first_name ?? '') . ' ' . ($payment->contact_last_name ?? '')),
                    'customer_email' => $payment->contact_email,
                    'trip_title' => $payment->trip_title,
                    'transaction_id' => $payment->transaction_id,
                    'gateway' => $payment->gateway,
                    'amount' => (float) $payment->amount,
                    'currency' => $payment->currency,
                    'status' => $payment->status,
                    'payment_type' => $payment->payment_type,
                    'notes' => $payment->notes,
                    'processed_at' => $payment->processed_at,
                    'created_at' => $payment->created_at,
                ];
            }, $payments),
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $per_page,
                'total_pages' => ceil($total / $per_page),
            ],
        ]);
    }

    /**
     * Get booking statistics
     */
    public function get_booking_stats(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;
        
        $bookings_table = $wpdb->prefix . 'yatra_bookings';
        $payments_table = $wpdb->prefix . 'yatra_booking_payments';
        
        // Get counts by status
        $status_counts = $wpdb->get_results(
            "SELECT status, COUNT(*) as count FROM {$bookings_table} GROUP BY status"
        );
        
        $statuses = [];
        foreach ($status_counts as $row) {
            $statuses[$row->status] = (int) $row->count;
        }
        
        // Get total revenue
        $total_revenue = (float) $wpdb->get_var(
            "SELECT SUM(amount) FROM {$payments_table} WHERE status = 'completed'"
        );
        
        // Get pending payments
        $pending_amount = (float) $wpdb->get_var(
            "SELECT SUM(amount_due) FROM {$bookings_table} WHERE status NOT IN ('cancelled', 'refunded', 'failed')"
        );
        
        // Get this month's bookings
        $this_month_count = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$bookings_table} WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())"
        );
        
        // Get this month's revenue
        $this_month_revenue = (float) $wpdb->get_var(
            "SELECT SUM(amount) FROM {$payments_table} WHERE status = 'completed' AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())"
        );
        
        return new WP_REST_Response([
            'success' => true,
            'data' => [
                'statuses' => $statuses,
                'total_revenue' => $total_revenue ?: 0,
                'pending_amount' => $pending_amount ?: 0,
                'this_month_bookings' => $this_month_count,
                'this_month_revenue' => $this_month_revenue ?: 0,
            ],
        ]);
    }

    /**
     * Send booking email
     */
    public function send_booking_email(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;
        
        $booking_id = (int) $request->get_param('id');
        $data = $request->get_json_params();
        
        $email_type = sanitize_text_field($data['type'] ?? 'confirmation');
        
        $bookings_table = $wpdb->prefix . 'yatra_bookings';
        $trips_table = $wpdb->prefix . 'yatra_trips';
        
        $booking = $wpdb->get_row($wpdb->prepare(
            "SELECT b.*, t.title as trip_title FROM {$bookings_table} b
             LEFT JOIN {$trips_table} t ON b.trip_id = t.id
             WHERE b.id = %d",
            $booking_id
        ));
        
        if (!$booking) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Booking not found.', 'yatra'),
            ], 404);
        }
        
        $to = $booking->contact_email;
        $subject = '';
        $body = '';
        
        switch ($email_type) {
            case 'confirmation':
                $subject = sprintf(__('[%s] Booking Confirmation - %s', 'yatra'), get_bloginfo('name'), $booking->reference);
                $body = sprintf(__("Your booking %s has been confirmed.\n\nTrip: %s\nTravel Date: %s\n\nThank you!", 'yatra'), 
                    $booking->reference, $booking->trip_title, $booking->travel_date);
                break;
                
            case 'reminder':
                $subject = sprintf(__('[%s] Booking Reminder - %s', 'yatra'), get_bloginfo('name'), $booking->reference);
                $body = sprintf(__("This is a reminder for your upcoming trip.\n\nBooking: %s\nTrip: %s\nTravel Date: %s\n\nWe look forward to seeing you!", 'yatra'),
                    $booking->reference, $booking->trip_title, $booking->travel_date);
                break;
                
            case 'payment':
                $subject = sprintf(__('[%s] Payment Reminder - %s', 'yatra'), get_bloginfo('name'), $booking->reference);
                $body = sprintf(__("This is a payment reminder for your booking.\n\nBooking: %s\nAmount Due: %s\n\nPlease complete your payment.", 'yatra'),
                    $booking->reference, yatra_format_price($booking->amount_due, $booking->currency));
                break;
                
            default:
                $subject = sanitize_text_field($data['subject'] ?? '');
                $body = sanitize_textarea_field($data['message'] ?? '');
        }
        
        if (empty($subject) || empty($body)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Email subject and message are required.', 'yatra'),
            ], 400);
        }
        
        $sent = wp_mail($to, $subject, $body);
        
        return new WP_REST_Response([
            'success' => $sent,
            'message' => $sent ? __('Email sent successfully.', 'yatra') : __('Failed to send email.', 'yatra'),
        ]);
    }

    /**
     * Format booking data
     */
    private function format_booking($booking, bool $include_details = false): array
    {
        $formatted = [
            'id' => (int) $booking->id,
            'reference' => $booking->reference,
            'trip_id' => (int) $booking->trip_id,
            'trip_title' => $booking->trip_title ?? '',
            'trip_slug' => $booking->trip_slug ?? '',
            'trip_image' => $booking->featured_image ?? '',
            'customer_name' => trim(($booking->contact_first_name ?? '') . ' ' . ($booking->contact_last_name ?? '')),
            'customer_email' => $booking->contact_email,
            'customer_phone' => $booking->contact_phone,
            'travel_date' => $booking->travel_date,
            'travelers_count' => (int) $booking->travelers_count,
            'total_amount' => (float) $booking->total_amount,
            'amount_paid' => (float) $booking->amount_paid,
            'amount_due' => (float) $booking->amount_due,
            'currency' => $booking->currency,
            'payment_method' => $booking->payment_method,
            'payment_gateway' => $booking->payment_gateway,
            'payment_status' => $booking->payment_status,
            'status' => $booking->status,
            'created_at' => $booking->created_at,
            'updated_at' => $booking->updated_at,
        ];
        
        if ($include_details) {
            $formatted['user_id'] = $booking->user_id ? (int) $booking->user_id : null;
            $formatted['contact_first_name'] = $booking->contact_first_name;
            $formatted['contact_last_name'] = $booking->contact_last_name;
            $formatted['contact_country'] = $booking->contact_country;
            $formatted['contact_data'] = json_decode($booking->contact_data ?? '{}', true);
            $formatted['emergency_contact'] = json_decode($booking->emergency_contact ?? '{}', true);
            
            // Fetch travelers from normalized tables using repository
            $travellers = $this->travellerRepository->getByBookingId((int) $booking->id);
            
            // Format travelers for API response
            $formatted['travelers_data'] = array_map(function($traveller) {
                $fields = $traveller['fields'] ?? [];
                // Include traveller metadata
                $fields['_traveller_id'] = (int) $traveller['id'];
                $fields['_is_lead'] = (bool) $traveller['is_lead'];
                $fields['_traveller_index'] = (int) $traveller['traveller_index'];
                return $fields;
            }, $travellers);
            
            // Also provide the raw travellers with full metadata
            $formatted['travellers'] = $travellers;
            
            // Legacy support: provide flat array as 'travelers' (backward compatible)
            $formatted['travelers'] = array_map(function($traveller) {
                return $traveller['fields'] ?? [];
            }, $travellers);
            
            $formatted['special_requests'] = $booking->special_requests;
            $formatted['internal_notes'] = $booking->internal_notes;
            $formatted['discount_amount'] = (float) $booking->discount_amount;
            $formatted['discount_code'] = $booking->discount_code;
            $formatted['payment_session_id'] = $booking->payment_session_id;
            $formatted['payment_transaction_id'] = $booking->payment_transaction_id;
            $formatted['payment_date'] = $booking->payment_date;
            $formatted['payment_notes'] = $booking->payment_notes;
            $formatted['cancellation_reason'] = $booking->cancellation_reason;
            $formatted['cancelled_at'] = $booking->cancelled_at;
            $formatted['confirmed_at'] = $booking->confirmed_at;
            $formatted['completed_at'] = $booking->completed_at;
            $formatted['ip_address'] = $booking->ip_address;
            $formatted['newsletter_optin'] = (bool) $booking->newsletter_optin;
            
            // Trip details
            if (isset($booking->duration_days)) {
                $formatted['trip_details'] = [
                    'duration_days' => (int) $booking->duration_days,
                    'duration_nights' => (int) $booking->duration_nights,
                    'difficulty_level' => $booking->difficulty_level,
                    'starting_location' => $booking->starting_location,
                    'ending_location' => $booking->ending_location,
                ];
            }
        }
        
        return $formatted;
    }

    /**
     * Get all travelers from bookings using normalized tables
     */
    public function get_travelers(\WP_REST_Request $request): \WP_REST_Response
    {
        $page = max(1, (int) $request->get_param('page') ?: 1);
        $per_page = max(1, min(100, (int) $request->get_param('per_page') ?: 20));
        $search = sanitize_text_field($request->get_param('search') ?: '');
        $trip_id = (int) $request->get_param('trip_id') ?: 0;

        // Use repository to search travelers
        $result = $this->travellerRepository->search($search, $trip_id, $page, $per_page);

        // Format travelers for API response
        $formatted_travelers = array_map(function($traveller) {
            $fields = $traveller['fields'] ?? [];
            
            return array_merge([
                'id' => (int) $traveller['id'],
                'booking_id' => (int) $traveller['booking_id'],
                'booking_reference' => $traveller['booking_reference'] ?? '',
                'trip_id' => (int) ($traveller['trip_id'] ?? 0),
                'trip_title' => $traveller['trip_title'] ?? '',
                'travel_date' => $traveller['travel_date'] ?? '',
                'traveler_index' => (int) $traveller['traveller_index'],
                'is_lead' => (bool) $traveller['is_lead'],
            ], $fields);
        }, $result['data']);

        return new \WP_REST_Response([
            'success' => true,
            'data' => $formatted_travelers,
            'meta' => [
                'total' => $result['total'],
                'page' => $page,
                'per_page' => $per_page,
                'total_pages' => ceil($result['total'] / $per_page),
            ],
        ]);
    }
}

