<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\BookingService;
use Yatra\Services\PaymentService;

/**
 * Bookings REST API Controller
 * 
 * Handles HTTP requests only - delegates business logic to BookingService.
 * 
 * RESPONSIBILITIES:
 * - Extract request parameters
 * - Permission checks
 * - Call service methods
 * - Return WP_REST_Response
 * 
 * NO DATABASE QUERIES OR BUSINESS LOGIC IN THIS FILE.
 * 
 * @package Yatra\Controllers
 */
class BookingsController extends BaseController
{
    /**
     * REST API namespace
     */
    protected string $namespace = 'yatra/v1';

    /**
     * Booking service instance
     */
    private BookingService $bookingService;

    /**
     * Payment service instance
     */
    private PaymentService $paymentService;

    /**
     * Constructor - Initialize services
     */
    public function __construct()
    {
        $this->bookingService = new BookingService();
        $this->paymentService = new PaymentService();
    }

    /**
     * Register REST API routes
     */
    public function register_routes(): void
    {
        // =====================
        // BOOKINGS ROUTES
        // =====================
        
        // List bookings
        register_rest_route($this->namespace, '/bookings', [
            'methods' => 'GET',
            'callback' => [$this, 'getBookings'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);

        // Get single booking
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'getBooking'],
            'permission_callback' => [$this, 'checkAdminPermission'],
            'args' => [
                'id' => [
                    'required' => true,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);

        // Create booking
        register_rest_route($this->namespace, '/bookings', [
            'methods' => 'POST',
            'callback' => [$this, 'createBooking'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);

        // Update booking
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'updateBooking'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);

        // Delete booking
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'deleteBooking'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);

        // Update booking status
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)/status', [
            'methods' => 'PUT',
            'callback' => [$this, 'updateBookingStatus'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);

        // Get booking statistics
        register_rest_route($this->namespace, '/bookings/stats', [
            'methods' => 'GET',
            'callback' => [$this, 'getBookingStats'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);

        // Send booking email
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)/send-email', [
            'methods' => 'POST',
            'callback' => [$this, 'sendBookingEmail'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);

        // =====================
        // PAYMENTS ROUTES
        // =====================
        
        // Get booking payments
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)/payments', [
            'methods' => 'GET',
            'callback' => [$this, 'getBookingPayments'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);

        // Add payment to booking
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)/payments', [
            'methods' => 'POST',
            'callback' => [$this, 'addPayment'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);

        // List all payments
        register_rest_route($this->namespace, '/payments', [
            'methods' => 'GET',
            'callback' => [$this, 'getPayments'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);

        // Create payment
        register_rest_route($this->namespace, '/payments', [
            'methods' => 'POST',
            'callback' => [$this, 'createPayment'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);

        // Get single payment
        register_rest_route($this->namespace, '/payments/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'getPayment'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);

        // Update payment
        register_rest_route($this->namespace, '/payments/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'updatePayment'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);

        // Delete payment
        register_rest_route($this->namespace, '/payments/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'deletePayment'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);

        // =====================
        // TRAVELERS ROUTES
        // =====================
        
        register_rest_route($this->namespace, '/travelers', [
            'methods' => 'GET',
            'callback' => [$this, 'getTravelers'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);

        // Traveler bulk actions
        register_rest_route($this->namespace, '/travelers/bulk', [
            'methods' => 'PUT',
            'callback' => [$this, 'bulkTravelers'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);

        // =====================
        // SCHEDULED PAYMENTS
        // =====================
        
        register_rest_route($this->namespace, '/scheduled-payments', [
            'methods' => 'GET',
            'callback' => [$this, 'getScheduledPayments'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);

        register_rest_route($this->namespace, '/scheduled-payments/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'getScheduledPayment'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);

        register_rest_route($this->namespace, '/scheduled-payments/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'updateScheduledPayment'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);

        register_rest_route($this->namespace, '/scheduled-payments/(?P<id>\d+)/cancel', [
            'methods' => 'POST',
            'callback' => [$this, 'cancelScheduledPayment'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);

        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)/scheduled-payments', [
            'methods' => 'GET',
            'callback' => [$this, 'getBookingScheduledPayments'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);
    }

    /**
     * Check admin permission
     */
    public function checkAdminPermission(): bool
    {
        return current_user_can('manage_options');
    }

    // =========================================================================
    // BOOKING ENDPOINTS
    // =========================================================================

    /**
     * GET /bookings - List all bookings
     */
    public function getBookings(WP_REST_Request $request): WP_REST_Response
    {
        // Extract filters from request
        $filters = [
            'page' => (int) ($request->get_param('page') ?: 1),
            'per_page' => (int) ($request->get_param('per_page') ?: 20),
            'status' => $request->get_param('status') ?: '',
            'payment_status' => $request->get_param('payment_status') ?: '',
            'trip_id' => (int) $request->get_param('trip_id'),
            'search' => $request->get_param('search') ?: '',
            'date_from' => $request->get_param('date_from') ?: '',
            'date_to' => $request->get_param('date_to') ?: '',
        ];

        // Delegate to service
        $result = $this->bookingService->getBookings($filters);

        return new WP_REST_Response([
            'success' => true,
            'data' => $result['data'],
            'meta' => [
                'total' => $result['total'],
                'page' => $result['page'],
                'per_page' => $result['per_page'],
                'total_pages' => $result['total_pages'],
            ],
        ]);
    }

    /**
     * GET /bookings/{id} - Get single booking
     */
    public function getBooking(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');

        $booking = $this->bookingService->getBooking($id);

        if (!$booking) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Booking not found.', 'yatra'),
            ], 404);
        }

        return new WP_REST_Response([
            'success' => true,
            'data' => $booking,
        ]);
    }

    /**
     * POST /bookings - Create booking
     */
    public function createBooking(WP_REST_Request $request): WP_REST_Response
    {
        $data = $request->get_json_params();

        $result = $this->bookingService->createBooking($data);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result, 201);
    }

    /**
     * PUT /bookings/{id} - Update booking
     */
    public function updateBooking(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $data = $request->get_json_params();

        $result = $this->bookingService->updateBooking($id, $data);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result);
    }

    /**
     * DELETE /bookings/{id} - Delete booking
     */
    public function deleteBooking(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');

        $result = $this->bookingService->deleteBooking($id);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result);
    }

    /**
     * PUT /bookings/{id}/status - Update booking status
     */
    public function updateBookingStatus(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $data = $request->get_json_params();
        $status = $data['status'] ?? '';

        if (empty($status)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Status is required.', 'yatra'),
            ], 400);
        }

        $result = $this->bookingService->updateStatus($id, $status);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result);
    }

    /**
     * GET /bookings/stats - Get booking statistics
     */
    public function getBookingStats(WP_REST_Request $request): WP_REST_Response
    {
        $stats = $this->bookingService->getStats();

        return new WP_REST_Response([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * POST /bookings/{id}/send-email - Send booking email
     */
    public function sendBookingEmail(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $data = $request->get_json_params();
        $emailType = $data['type'] ?? 'confirmation';

        $result = $this->bookingService->sendEmail($id, $emailType);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result);
    }

    // =========================================================================
    // PAYMENT ENDPOINTS
    // =========================================================================

    /**
     * GET /bookings/{id}/payments - Get booking payments
     */
    public function getBookingPayments(WP_REST_Request $request): WP_REST_Response
    {
        $bookingId = (int) $request->get_param('id');

        $payments = $this->paymentService->getBookingPayments($bookingId);

        return new WP_REST_Response([
            'success' => true,
            'data' => $payments,
        ]);
    }

    /**
     * POST /bookings/{id}/payments - Add payment to booking
     */
    public function addPayment(WP_REST_Request $request): WP_REST_Response
    {
        $bookingId = (int) $request->get_param('id');
        $data = $request->get_json_params();
        $data['booking_id'] = $bookingId;

        $result = $this->paymentService->createPayment($data);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result, 201);
    }

    /**
     * GET /payments - List all payments
     */
    public function getPayments(WP_REST_Request $request): WP_REST_Response
    {
        $filters = [
            'page' => (int) ($request->get_param('page') ?: 1),
            'per_page' => (int) ($request->get_param('per_page') ?: 20),
            'booking_id' => (int) $request->get_param('booking_id'),
            'status' => $request->get_param('status') ?: '',
            'gateway' => $request->get_param('gateway') ?: '',
            'search' => $request->get_param('search') ?: '',
            'date_from' => $request->get_param('date_from') ?: '',
            'date_to' => $request->get_param('date_to') ?: '',
        ];

        $result = $this->paymentService->getPayments($filters);

        return new WP_REST_Response([
            'success' => true,
            'data' => $result['data'],
            'meta' => [
                'total' => $result['total'],
                'page' => $result['page'],
                'per_page' => $result['per_page'],
                'total_pages' => $result['total_pages'],
            ],
        ]);
    }

    /**
     * POST /payments - Create payment
     */
    public function createPayment(WP_REST_Request $request): WP_REST_Response
    {
        $data = $request->get_json_params();

        $result = $this->paymentService->createPayment($data);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result, 201);
    }

    /**
     * GET /payments/{id} - Get single payment
     */
    public function getPayment(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');

        $payment = $this->paymentService->getPayment($id);

        if (!$payment) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Payment not found.', 'yatra'),
            ], 404);
        }

        return new WP_REST_Response([
            'success' => true,
            'data' => $payment,
        ]);
    }

    /**
     * PUT /payments/{id} - Update payment
     */
    public function updatePayment(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $data = $request->get_json_params();

        $result = $this->paymentService->updatePayment($id, $data);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result);
    }

    /**
     * DELETE /payments/{id} - Delete payment
     */
    public function deletePayment(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');

        $result = $this->paymentService->deletePayment($id);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result);
    }

    // =========================================================================
    // TRAVELERS ENDPOINTS
    // =========================================================================

    /**
     * GET /travelers - Get all travelers
     */
    public function getTravelers(WP_REST_Request $request): WP_REST_Response
    {
        $filters = [
            'page' => (int) ($request->get_param('page') ?: 1),
            'per_page' => (int) ($request->get_param('per_page') ?: 20),
            'search' => $request->get_param('search') ?: '',
            'trip_id' => (int) $request->get_param('trip_id'),
        ];

        $result = $this->bookingService->getTravelers($filters);

        return new WP_REST_Response([
            'success' => true,
            'data' => $result['data'],
            'meta' => $result['meta'] ?? [],
        ]);
    }

    /**
     * PUT /travelers/bulk - Bulk traveler actions
     */
    public function bulkTravelers(WP_REST_Request $request): WP_REST_Response
    {
        $data   = $request->get_json_params();
        $action = $data['action'] ?? '';
        $ids    = $data['ids'] ?? [];

        if (empty($action) || empty($ids) || !is_array($ids)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Action and IDs are required.', 'yatra'),
            ], 400);
        }

        $ids = array_filter(array_map('intval', $ids));

        if (empty($ids)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('No valid traveler IDs provided.', 'yatra'),
            ], 400);
        }

        $result = $this->bookingService->bulkTravelers($ids, (string) $action);

        return new WP_REST_Response($result, $result['success'] ? 200 : 400);
    }

    // =========================================================================
    // SCHEDULED PAYMENTS ENDPOINTS
    // =========================================================================

    /**
     * GET /scheduled-payments - List scheduled payments
     */
    public function getScheduledPayments(WP_REST_Request $request): WP_REST_Response
    {
        $filters = [
            'page' => (int) ($request->get_param('page') ?: 1),
            'per_page' => (int) ($request->get_param('per_page') ?: 20),
            'status' => $request->get_param('status') ?: '',
        ];

        $result = $this->paymentService->getScheduledPayments($filters);

        return new WP_REST_Response([
            'success' => true,
            'data' => $result['data'],
            'meta' => [
                'total' => $result['total'],
                'page' => $result['page'],
                'per_page' => $result['per_page'],
                'total_pages' => $result['total_pages'],
            ],
        ]);
    }

    /**
     * GET /scheduled-payments/{id} - Get single scheduled payment
     */
    public function getScheduledPayment(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');

        $payment = $this->paymentService->getScheduledPayment($id);

        if (!$payment) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Scheduled payment not found.', 'yatra'),
            ], 404);
        }

        return new WP_REST_Response([
            'success' => true,
            'data' => $payment,
        ]);
    }

    /**
     * PUT /scheduled-payments/{id} - Update scheduled payment
     */
    public function updateScheduledPayment(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $data = $request->get_json_params();

        $result = $this->paymentService->updateScheduledPayment($id, $data);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result);
    }

    /**
     * POST /scheduled-payments/{id}/cancel - Cancel scheduled payment
     */
    public function cancelScheduledPayment(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');

        $result = $this->paymentService->cancelScheduledPayment($id);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result);
    }

    /**
     * GET /bookings/{id}/scheduled-payments - Get booking's scheduled payments
     */
    public function getBookingScheduledPayments(WP_REST_Request $request): WP_REST_Response
    {
        $bookingId = (int) $request->get_param('id');

        $payments = $this->paymentService->getBookingScheduledPayments($bookingId);

        return new WP_REST_Response([
            'success' => true,
            'data' => $payments,
        ]);
    }
}
