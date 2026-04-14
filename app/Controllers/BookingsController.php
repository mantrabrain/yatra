<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Helpers\FormatHelper;
use Yatra\Repositories\TripRepository;
use Yatra\Services\BookingService;
use Yatra\Services\PaymentService;
use Yatra\Services\PdfService;
use Yatra\Services\SettingsService;
use Yatra\Validators\BookingValidator;
use Yatra\Exceptions\ValidationException;
use Yatra\Utils\Logger;

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

        // NOTE: Payment CRUD operations moved to PaymentController
        // This keeps BookingsController focused on booking operations only

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

        // Download travel voucher for a booking
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)/voucher', [
            'methods' => 'GET',
            'callback' => [$this, 'downloadVoucher'],
            'permission_callback' => '__return_true', // Auth checked inside callback
        ]);

        // Download travel itinerary for a booking
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)/itinerary', [
            'methods' => 'GET',
            'callback' => [$this, 'downloadItinerary'],
            'permission_callback' => '__return_true', // Auth checked inside callback
        ]);
    }

    /**
     * Check admin permission
     */
    public function checkAdminPermission(): bool
    {
        // Allow custom booking capability or fallback to manage_options
        if (current_user_can('yatra_view_bookings')) {
            return true;
        }
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
    public function getBooking(WP_REST_Request $request)
    {
        try {
            $id = (int) $request->get_param('id');
            
            if ($id <= 0) {
                throw new ValidationException('Invalid booking ID', ['id' => ['Booking ID must be a positive integer']]);
            }

            Logger::apiRequest("/bookings/{$id}", 'GET');
            
            $booking = $this->bookingService->getBooking($id);

            if (!$booking) {
                Logger::warning("Booking not found", ['booking_id' => $id]);
                return $this->not_found(__('Booking not found', 'yatra'));
            }

            Logger::info("Booking retrieved successfully", ['booking_id' => $id]);
            return $this->success_response($booking);
            
        } catch (\Exception $e) {
            Logger::error("Failed to get booking", ['booking_id' => $id ?? 0, 'error' => $e->getMessage()]);
            return $this->handle_exception($e);
        }
    }

    /**
     * POST /bookings - Create booking
     */
    public function createBooking(WP_REST_Request $request)
    {
        try {
            $data = $request->get_json_params();
            
            // Validate and sanitize input data
            BookingValidator::validateCreate($data);
            $data = BookingValidator::sanitize($data);
            
            Logger::apiRequest('/bookings', 'POST', $data);
            
            $result = $this->bookingService->createBooking($data);

            if (!$result['success']) {
                Logger::warning("Booking creation failed", ['data' => $data, 'result' => $result]);
                return $this->error_response($result['message'] ?? 'Failed to create booking', 400);
            }

            Logger::info("Booking created successfully", ['booking_id' => $result['data']['id'] ?? null]);
            return $this->success_response($result['data'], 201);
            
        } catch (\Exception $e) {
            Logger::error("Failed to create booking", ['data' => $data ?? [], 'error' => $e->getMessage()]);
            return $this->handle_exception($e);
        }
    }

    /**
     * PUT /bookings/{id} - Update booking
     */
    public function updateBooking(WP_REST_Request $request)
    {
        try {
            $id = (int) $request->get_param('id');
            $data = $request->get_json_params();
            
            // Validate and sanitize input data
            BookingValidator::validateUpdate($data, $id);
            $data = BookingValidator::sanitize($data);
            
            Logger::apiRequest("/bookings/{$id}", 'PUT', $data);
            
            $result = $this->bookingService->updateBooking($id, $data);

            if (!$result['success']) {
                Logger::warning("Booking update failed", ['booking_id' => $id, 'data' => $data, 'result' => $result]);
                return $this->error_response($result['message'] ?? 'Failed to update booking', 400);
            }

            Logger::info("Booking updated successfully", ['booking_id' => $id]);
            return $this->success_response($result['data']);
            
        } catch (\Exception $e) {
            Logger::error("Failed to update booking", ['booking_id' => $id ?? 0, 'data' => $data ?? [], 'error' => $e->getMessage()]);
            return $this->handle_exception($e);
        }
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

         return new WP_REST_Response($stats ?? []);

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

    /**
     * GET /bookings/{id}/voucher - Download travel voucher for a booking
     */
    public function downloadVoucher(WP_REST_Request $request)
    {
        $bookingId = (int) $request->get_param('id');
        $isPreview = $request->get_param('preview') === '1';
        $isDownload = $request->get_param('download') === '1';

        if ($bookingId <= 0) {
            return new WP_Error('invalid_booking', __('Invalid booking ID.', 'yatra'), ['status' => 400]);
        }

        // Get booking details
        $booking = $this->bookingService->getBooking($bookingId);

        if (!$booking) {
            return new WP_Error('booking_not_found', __('Booking not found.', 'yatra'), ['status' => 404]);
        }

        // Verify user is logged in and owns this booking (or is admin)
        $currentUserId = get_current_user_id();
        $bookingUserId = (int) ($booking['user_id'] ?? 0);
        
        // Must be logged in
        if (!$currentUserId) {
            return new WP_Error('unauthorized', __('You must be logged in to download vouchers.', 'yatra'), ['status' => 401]);
        }
        
        // Must own the booking or be admin
        if ($bookingUserId && $currentUserId !== $bookingUserId && !current_user_can('manage_options')) {
            return new WP_Error('forbidden', __('You do not have permission to access this voucher.', 'yatra'), ['status' => 403]);
        }

        // Get payment for this booking
        $payments = $this->paymentService->getBookingPayments($bookingId);

        if (empty($payments)) {
            return $this->renderVoucherFromBookingData($booking, $isPreview);
        }

        // Use the first payment (or you could use the latest payment)
        $payment = $payments[0];
        $paymentId = (int) ($payment['id'] ?? 0);

        if ($paymentId <= 0) {
            return new WP_Error('invalid_payment', __('Invalid payment ID.', 'yatra'), ['status' => 400]);
        }

        // Delegate to PaymentGatewayController's download_voucher method
        $paymentGatewayController = new \Yatra\Controllers\PaymentGatewayController();
        
        // Create a new request with the payment ID
        $paymentRequest = new WP_REST_Request('GET', "/payments/{$paymentId}/voucher");
        $paymentRequest->set_param('payment_id', $paymentId);
        $paymentRequest->set_param('preview', $isPreview ? '1' : '');
        $paymentRequest->set_param('download', $isDownload ? '1' : '');

        return $paymentGatewayController->download_voucher($paymentRequest);
    }

    /**
     * GET /bookings/{id}/itinerary - Download travel itinerary for a booking
     */
    public function downloadItinerary(WP_REST_Request $request)
    {
        $bookingId = (int) $request->get_param('id');
        $isPreview = $request->get_param('preview') === '1';
        $isDownload = $request->get_param('download') === '1';

        if ($bookingId <= 0) {
            return new WP_Error('invalid_booking', __('Invalid booking ID.', 'yatra'), ['status' => 400]);
        }

        // Get booking details
        $booking = $this->bookingService->getBooking($bookingId);

        if (!$booking) {
            return new WP_Error('booking_not_found', __('Booking not found.', 'yatra'), ['status' => 404]);
        }

        // Verify user is logged in and owns this booking (or is admin)
        $currentUserId = get_current_user_id();
        $bookingUserId = (int) ($booking['user_id'] ?? 0);
        
        // Must be logged in
        if (!$currentUserId) {
            return new WP_Error('unauthorized', __('You must be logged in to download itineraries.', 'yatra'), ['status' => 401]);
        }
        
        // Must own the booking or be admin
        if ($bookingUserId && $currentUserId !== $bookingUserId && !current_user_can('manage_options')) {
            return new WP_Error('forbidden', __('You do not have permission to access this itinerary.', 'yatra'), ['status' => 403]);
        }

        // Get payment for this booking
        $payments = $this->paymentService->getBookingPayments($bookingId);

        if (empty($payments)) {
            return $this->renderItineraryFromBookingData($booking, $isPreview);
        }

        // Use the first payment (or you could use the latest payment)
        $payment = $payments[0];
        $paymentId = (int) ($payment['id'] ?? 0);

        if ($paymentId <= 0) {
            return new WP_Error('invalid_payment', __('Invalid payment ID.', 'yatra'), ['status' => 400]);
        }

        // Delegate to PaymentGatewayController's download_itinerary method
        $paymentGatewayController = new \Yatra\Controllers\PaymentGatewayController();
        
        // Create a new request with the payment ID
        $paymentRequest = new WP_REST_Request('GET', "/payments/{$paymentId}/itinerary");
        $paymentRequest->set_param('payment_id', $paymentId);
        $paymentRequest->set_param('preview', $isPreview ? '1' : '');
        $paymentRequest->set_param('download', $isDownload ? '1' : '');

        return $paymentGatewayController->download_itinerary($paymentRequest);
    }

    /**
     * Voucher PDF when the booking has no payment rows yet (matches payment-based voucher layout).
     *
     * @param array<string,mixed> $booking From BookingService::getBooking()
     */
    private function renderVoucherFromBookingData(array $booking, bool $isPreview)
    {
        $tripRepository = new TripRepository();
        $trip = null;
        $tripId = (int) ($booking['trip_id'] ?? 0);
        if ($tripId > 0) {
            $trip = $tripRepository->find($tripId);
        }

        $companyName = SettingsService::get('company_name', get_bloginfo('name'));
        $companyAddress = SettingsService::get('company_address', '');
        $companyEmail = SettingsService::get('company_email', get_option('admin_email'));
        $companyPhone = SettingsService::get('company_phone', '');
        $currency = SettingsService::getCurrency();
        $currencySymbol = FormatHelper::getCurrencySymbol($currency);

        $createdAt = $booking['created_at'] ?? $booking['booking_date'] ?? '';
        $bookingDate = !empty($createdAt) ? date_i18n(get_option('date_format'), strtotime((string) $createdAt)) : '';
        $travelDateRaw = $booking['travel_date'] ?? '';
        $travelDate = !empty($travelDateRaw) ? date_i18n(get_option('date_format'), strtotime((string) $travelDateRaw)) : '';

        $returnDate = '';
        if (!empty($travelDateRaw) && $trip && !empty($trip->duration)) {
            $returnTimestamp = strtotime((string) $travelDateRaw . ' +' . (int) $trip->duration . ' days');
            $returnDate = date_i18n(get_option('date_format'), $returnTimestamp);
        }

        $statusRaw = (string) ($booking['booking_status'] ?? $booking['status'] ?? '');
        $bookingRef = (string) ($booking['booking_number'] ?? $booking['reference'] ?? (string) ($booking['id'] ?? ''));
        $filename = 'Travel Voucher #' . $bookingRef . '.pdf';

        $customerName = trim(
            (string) ($booking['contact_first_name'] ?? '') . ' ' . (string) ($booking['contact_last_name'] ?? '')
        ) ?: (string) ($booking['customer_name'] ?? __('Customer', 'yatra'));

        $templateData = [
            'company_name' => $companyName,
            'company_address' => $companyAddress,
            'company_email' => $companyEmail,
            'company_phone' => $companyPhone,
            'customer_name' => $customerName,
            'customer_email' => (string) ($booking['contact_email'] ?? $booking['customer_email'] ?? ''),
            'booking_ref' => $bookingRef,
            'booking_date' => $bookingDate,
            'booking_status' => ucfirst($statusRaw ?: 'pending'),
            'status_class' => in_array(strtolower($statusRaw), ['confirmed', 'completed', 'success'], true) ? 'confirmed' :
                (in_array(strtolower($statusRaw), ['cancelled'], true) ? 'cancelled' : 'pending'),
            'trip_title' => $trip ? ($trip->title ?? $booking['trip_title'] ?? __('Trip Booking', 'yatra')) : ($booking['trip_title'] ?? __('Trip Booking', 'yatra')),
            'trip_duration' => $trip && $trip->duration ? sprintf(__('%d days', 'yatra'), (int) $trip->duration) : '',
            'trip_difficulty' => $trip ? ($trip->difficulty_name ?? '') : '',
            'departure_location' => $trip ? ($trip->departure_location ?? '') : '',
            'destination' => $trip ? ($trip->destination ?? '') : '',
            'travel_date' => $travelDate,
            'return_date' => $returnDate,
            'currency_symbol' => $currencySymbol,
            'total_amount' => number_format((float) ($booking['total_amount'] ?? 0), 2),
            'amount_paid' => number_format((float) ($booking['amount_paid'] ?? 0), 2),
            'amount_due' => number_format((float) ($booking['amount_due'] ?? 0), 2),
            'traveler_count' => (int) ($booking['travelers_count'] ?? $booking['travelers'] ?? 1),
        ];

        $pdfService = new PdfService();
        if (!$pdfService->isAvailable()) {
            return new WP_Error(
                'pdf_engine_missing',
                __('Voucher PDF generator is not installed. Please run composer install to install dompdf/dompdf.', 'yatra'),
                ['status' => 500]
            );
        }

        $pdfBinary = $pdfService->renderTemplateToPdfSafely('pdf/voucher.php', $templateData, [
            'paper' => 'A4',
            'orientation' => 'portrait',
            'default_font' => 'DejaVu Sans',
        ]);

        if ($isPreview) {
            return new WP_REST_Response([
                'success' => true,
                'pdf_data' => base64_encode($pdfBinary),
                'filename' => $filename,
            ]);
        }

        $pdfService->outputPdfDownload($pdfBinary, $filename);
        exit;
    }

    /**
     * Itinerary PDF when the booking has no payment rows yet.
     *
     * @param array<string,mixed> $booking From BookingService::getBooking()
     */
    private function renderItineraryFromBookingData(array $booking, bool $isPreview)
    {
        $tripRepository = new TripRepository();
        $trip = null;
        $tripId = (int) ($booking['trip_id'] ?? 0);
        if ($tripId > 0) {
            $trip = $tripRepository->find($tripId);
        }

        $companyName = SettingsService::get('company_name', get_bloginfo('name'));
        $companyAddress = SettingsService::get('company_address', '');
        $companyEmail = SettingsService::get('company_email', get_option('admin_email'));
        $companyPhone = SettingsService::get('company_phone', '');
        $currency = SettingsService::getCurrency();
        $currencySymbol = FormatHelper::getCurrencySymbol($currency);

        $createdAt = $booking['created_at'] ?? $booking['booking_date'] ?? '';
        $bookingDate = !empty($createdAt) ? date_i18n(get_option('date_format'), strtotime((string) $createdAt)) : '';
        $travelDateRaw = $booking['travel_date'] ?? '';
        $travelDate = !empty($travelDateRaw) ? date_i18n(get_option('date_format'), strtotime((string) $travelDateRaw)) : '';

        $returnDate = '';
        if (!empty($travelDateRaw) && $trip && !empty($trip->duration)) {
            $returnTimestamp = strtotime((string) $travelDateRaw . ' +' . (int) $trip->duration . ' days');
            $returnDate = date_i18n(get_option('date_format'), $returnTimestamp);
        }

        $statusRaw = (string) ($booking['booking_status'] ?? $booking['status'] ?? '');
        $bookingId = (int) ($booking['id'] ?? 0);
        $bookingRef = 'YTR-' . strtoupper(str_pad((string) $bookingId, 8, '0', STR_PAD_LEFT));

        $customerName = trim(
            (string) ($booking['contact_first_name'] ?? '') . ' ' . (string) ($booking['contact_last_name'] ?? '')
        ) ?: (string) ($booking['customer_name'] ?? __('Customer', 'yatra'));

        $pdfService = new PdfService();
        if (!$pdfService->isAvailable()) {
            return new WP_Error(
                'pdf_engine_missing',
                __('Itinerary PDF generator is not installed. Please run composer install to install dompdf/dompdf.', 'yatra'),
                ['status' => 500]
            );
        }

        $filename = 'Travel-Itinerary-' . $bookingRef . '.pdf';

        $templateData = [
            'company_name' => $companyName,
            'company_address' => $companyAddress,
            'company_email' => $companyEmail,
            'company_phone' => $companyPhone,
            'customer_name' => $customerName,
            'customer_email' => (string) ($booking['contact_email'] ?? $booking['customer_email'] ?? ''),
            'booking_ref' => $bookingRef,
            'booking_date' => $bookingDate,
            'booking_status' => ucfirst($statusRaw ?: 'pending'),
            'status_class' => in_array(strtolower($statusRaw), ['confirmed', 'completed', 'success'], true) ? 'confirmed' :
                (in_array(strtolower($statusRaw), ['cancelled'], true) ? 'cancelled' : 'pending'),
            'trip_title' => $trip ? ($trip->title ?? $booking['trip_title'] ?? __('Trip Booking', 'yatra')) : ($booking['trip_title'] ?? __('Trip Booking', 'yatra')),
            'trip_description' => $trip ? ($trip->description ?? $trip->content ?? '') : '',
            'trip_duration' => $trip && $trip->duration ? sprintf(__('%d days', 'yatra'), (int) $trip->duration) : '',
            'trip_difficulty' => $trip ? ($trip->difficulty_name ?? '') : '',
            'trip_highlights' => $trip ? ($trip->highlights ?? $trip->trip_highlights ?? '') : '',
            'trip_includes' => $trip ? ($trip->includes ?? $trip->trip_includes ?? '') : '',
            'trip_excludes' => $trip ? ($trip->excludes ?? $trip->trip_excludes ?? '') : '',
            'departure_location' => $trip ? ($trip->departure_location ?? '') : '',
            'destination' => $trip ? ($trip->destination ?? '') : '',
            'travel_date' => $travelDate,
            'return_date' => $returnDate,
            'currency_symbol' => $currencySymbol,
            'total_amount' => number_format((float) ($booking['total_amount'] ?? 0), 2),
            'amount_paid' => number_format((float) ($booking['amount_paid'] ?? 0), 2),
            'amount_due' => number_format((float) ($booking['amount_due'] ?? 0), 2),
            'traveler_count' => (int) ($booking['travelers_count'] ?? $booking['travelers'] ?? 1),
        ];

        $pdfBinary = $pdfService->renderTemplateToPdfSafely('pdf/itinerary.php', $templateData, [
            'paper' => 'A4',
            'orientation' => 'portrait',
            'default_font' => 'DejaVu Sans',
        ]);

        if ($isPreview) {
            return new WP_REST_Response([
                'success' => true,
                'pdf_data' => base64_encode($pdfBinary),
                'filename' => $filename,
            ]);
        }

        $pdfService->outputPdfDownload($pdfBinary, $filename);
        exit;
    }
}
