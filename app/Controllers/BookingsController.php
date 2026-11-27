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
        
        // List bookings — view cap.
        register_rest_route($this->namespace, '/bookings', [
            'methods' => 'GET',
            'callback' => [$this, 'getBookings'],
            'permission_callback' => [$this, 'checkCanView'],
        ]);

        // Get single booking — view cap.
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'getBooking'],
            'permission_callback' => [$this, 'checkCanView'],
            'args' => [
                'id' => [
                    'required' => true,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);

        // Create booking — create cap.
        register_rest_route($this->namespace, '/bookings', [
            'methods' => 'POST',
            'callback' => [$this, 'createBooking'],
            'permission_callback' => [$this, 'checkCanCreate'],
        ]);

        // Update booking — edit cap.
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'updateBooking'],
            'permission_callback' => [$this, 'checkCanEdit'],
        ]);

        // Delete booking — critical-sensitivity delete cap. Only
        // Owner role gets this by default.
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'deleteBooking'],
            'permission_callback' => [$this, 'checkCanDelete'],
        ]);

        // Update booking status — dedicated change-status cap so
        // Front Desk (who has this cap but NOT edit) can flip
        // confirmed → checked-in without being able to mutate other
        // fields.
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)/status', [
            'methods' => 'PUT',
            'callback' => [$this, 'updateBookingStatus'],
            'permission_callback' => [$this, 'checkCanChangeStatus'],
        ]);

        // Get booking statistics — view cap (aggregates only).
        register_rest_route($this->namespace, '/bookings/stats', [
            'methods' => 'GET',
            'callback' => [$this, 'getBookingStats'],
            'permission_callback' => [$this, 'checkCanView'],
        ]);

        // Send booking email — edit cap. Sending a transactional
        // re-confirmation is a write-side operation against the
        // customer's record.
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)/send-email', [
            'methods' => 'POST',
            'callback' => [$this, 'sendBookingEmail'],
            'permission_callback' => [$this, 'checkCanEdit'],
        ]);

        // =====================
        // PAYMENTS ROUTES
        // =====================

        // Get booking payments — view cap.
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)/payments', [
            'methods' => 'GET',
            'callback' => [$this, 'getBookingPayments'],
            'permission_callback' => [$this, 'checkCanView'],
        ]);

        // Add payment to booking — edit cap (modifies the booking's
        // payment state). Refunds + payment deletion live on the
        // dedicated PaymentController with their own high-sensitivity
        // caps.
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)/payments', [
            'methods' => 'POST',
            'callback' => [$this, 'addPayment'],
            'permission_callback' => [$this, 'checkCanEdit'],
        ]);

        // NOTE: Payment CRUD operations moved to PaymentController
        // This keeps BookingsController focused on booking operations only

        // =====================
        // BOOKING WORKSPACE (3.2)
        // =====================

        // Timeline: creation, payments/refunds (from the ledger) and the activity log.
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)/activity', [
            'methods' => 'GET',
            'callback' => [$this, 'getBookingActivity'],
            'permission_callback' => [$this, 'checkCanView'],
        ]);

        // Internal note (staff only, never sent to the customer).
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)/notes', [
            'methods' => 'POST',
            'callback' => [$this, 'addBookingNote'],
            'permission_callback' => [$this, 'checkCanEdit'],
        ]);

        // Mark a customer's change/cancellation request as handled.
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)/requests/(?P<request_id>[a-f0-9-]{36})/resolve', [
            'methods' => 'POST',
            'callback' => [$this, 'resolveCustomerRequest'],
            'permission_callback' => [$this, 'checkCanEdit'],
        ]);

        // Discount or surcharge with a reason.
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)/adjustments', [
            'methods' => 'POST',
            'callback' => [$this, 'adjustBookingPrice'],
            'permission_callback' => [$this, 'checkCanEdit'],
        ]);

        // Payment links: ask the customer to pay part of the balance.
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)/payment-links', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'listPaymentLinks'],
                'permission_callback' => [$this, 'checkCanEdit'],
            ],
            [
                'methods' => 'POST',
                'callback' => [$this, 'createPaymentLink'],
                'permission_callback' => [$this, 'checkCanEdit'],
            ],
        ]);
        register_rest_route($this->namespace, '/bookings/(?P<id>\d+)/payment-links/(?P<link>[a-z0-9]{8})', [
            'methods' => 'DELETE',
            'callback' => [$this, 'cancelPaymentLink'],
            'permission_callback' => [$this, 'checkCanEdit'],
        ]);

        // CSV exports: the bookings list (with its filters) and a departure manifest.
        register_rest_route($this->namespace, '/bookings/export', [
            'methods' => 'GET',
            'callback' => [$this, 'exportBookings'],
            'permission_callback' => [$this, 'checkCanExport'],
        ]);
        register_rest_route($this->namespace, '/bookings/manifest', [
            'methods' => 'GET',
            'callback' => [$this, 'exportManifest'],
            'permission_callback' => [$this, 'checkCanExport'],
            'args' => [
                'trip_id' => ['required' => false, 'sanitize_callback' => 'absint'],
                'date' => ['required' => false, 'sanitize_callback' => 'sanitize_text_field'],
                'departure_id' => ['required' => false, 'sanitize_callback' => 'absint'],
            ],
        ]);

        // =====================
        // TRAVELERS ROUTES
        // =====================

        // Travelers list — view cap.
        register_rest_route($this->namespace, '/travelers', [
            'methods' => 'GET',
            'callback' => [$this, 'getTravelers'],
            'permission_callback' => [$this, 'checkCanView'],
        ]);

        // Traveler bulk actions — edit cap.
        register_rest_route($this->namespace, '/travelers/bulk', [
            'methods' => 'PUT',
            'callback' => [$this, 'bulkTravelers'],
            'permission_callback' => [$this, 'checkCanEdit'],
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
     * Granular permission checks — one per operation. WP administrators
     * pass every cap via the Team module's admin-fallback filter
     * (priority 7 / 8), so an explicit `manage_options` check isn't
     * needed at this layer — the cap covers it.
     */
    public function checkCanView(): bool
    {
        return current_user_can('yatra_view_bookings');
    }

    public function checkCanCreate(): bool
    {
        return current_user_can('yatra_create_bookings');
    }

    public function checkCanEdit(): bool
    {
        return current_user_can('yatra_edit_bookings');
    }

    public function checkCanDelete(): bool
    {
        // Critical-sensitivity cap. By default only the Owner role
        // holds this — Manager, Sales Agent, Front Desk, etc. cannot
        // delete bookings even when they can edit them.
        return current_user_can('yatra_delete_bookings');
    }

    public function checkCanExport(): bool
    {
        return current_user_can('yatra_export_bookings');
    }

    /** GET /bookings/{id}/activity */
    public function getBookingActivity(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        if (!$this->bookingService->getBooking($id)) {
            return new WP_REST_Response(['success' => false, 'message' => __('Booking not found.', 'yatra')], 404);
        }

        return new WP_REST_Response(['success' => true, 'data' => (new \Yatra\Services\BookingActivityService())->timeline($id)]);
    }

    /** POST /bookings/{id}/notes {note} */
    public function addBookingNote(WP_REST_Request $request): WP_REST_Response
    {
        $result = (new \Yatra\Services\BookingActivityService())->addNote(
            (int) $request->get_param('id'),
            (string) $request->get_param('note')
        );

        return new WP_REST_Response($result, $result['success'] ? 201 : 400);
    }

    /** POST /bookings/{id}/requests/{request_id}/resolve */
    public function resolveCustomerRequest(WP_REST_Request $request): WP_REST_Response
    {
        $result = (new \Yatra\Services\CustomerRequestService())->resolve(
            (int) $request->get_param('id'),
            (string) $request->get_param('request_id')
        );

        return new WP_REST_Response($result, $result['success'] ? 200 : 400);
    }

    /** POST /bookings/{id}/adjustments {kind: discount|surcharge, amount, reason} */
    public function adjustBookingPrice(WP_REST_Request $request): WP_REST_Response
    {
        $result = (new \Yatra\Services\BookingActivityService())->adjustPrice(
            (int) $request->get_param('id'),
            (string) $request->get_param('kind'),
            (float) $request->get_param('amount'),
            (string) $request->get_param('reason')
        );

        return new WP_REST_Response($result, $result['success'] ? 200 : 400);
    }

    /** GET /bookings/export — CSV of the bookings list with the same filters. */
    public function exportBookings(WP_REST_Request $request): WP_REST_Response
    {
        $filters = [];
        foreach (['status', 'payment_status', 'search', 'date_from', 'date_to', 'created_from', 'created_to', 'orderby', 'order'] as $key) {
            $value = $request->get_param($key);
            if (is_string($value) && $value !== '') {
                $filters[$key] = sanitize_text_field($value);
            }
        }
        if ((int) $request->get_param('trip_id') > 0) {
            $filters['trip_id'] = (int) $request->get_param('trip_id');
        }

        return new WP_REST_Response(['success' => true, 'data' => (new \Yatra\Services\BookingExportService())->bookingsCsv($filters)]);
    }

    /** GET /bookings/manifest?trip_id=&date= — everyone travelling on one departure. */
    public function exportManifest(WP_REST_Request $request): WP_REST_Response
    {
        $departureId = (int) $request->get_param('departure_id');
        $date = (string) $request->get_param('date');
        if ($departureId <= 0 && (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || (int) $request->get_param('trip_id') <= 0)) {
            return new WP_REST_Response(['success' => false, 'message' => __('Invalid date.', 'yatra')], 400);
        }

        return new WP_REST_Response([
            'success' => true,
            'data' => (new \Yatra\Services\BookingExportService())->manifestCsv((int) $request->get_param('trip_id'), $date, $departureId),
        ]);
    }

    public function checkCanChangeStatus(): bool
    {
        // Separate from edit — Front Desk has this without the
        // broader edit cap so they can confirm/check-in bookings
        // without being able to mutate other fields.
        return current_user_can('yatra_change_booking_status');
    }

    /**
     * @deprecated Kept for any external code (snippet, integration)
     * that referenced the old method name. Routes to the view-only
     * cap — safer than the old `view OR manage_options` shorthand,
     * and admin users still pass via the admin-fallback layer.
     */
    public function checkAdminPermission(): bool
    {
        return $this->checkCanView();
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
            // Booked-on window (date_from/date_to filter the travel date).
            'created_from' => $request->get_param('created_from') ?: '',
            'created_to' => $request->get_param('created_to') ?: '',
            // Column sorting from the table headers — whitelisted in the repository.
            'orderby' => $request->get_param('orderby') ?: '',
            'order' => $request->get_param('order') ?: '',
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

            // When is the outstanding balance due? Core does not decide payment
            // schedules; Yatra Pro's Scheduled Payments module does, so core asks
            // and shows whatever comes back. Nothing answers when Pro is absent,
            // older, or the feature is off, and the payload is then exactly what
            // it has always been.
            $schedule = apply_filters('yatra_booking_payment_schedule', null, (object) $booking);
            if (is_array($schedule)) {
                if (is_array($booking)) {
                    $booking['payment_schedule'] = $schedule;
                } else {
                    $booking->payment_schedule = $schedule;
                }
            }

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

            // createBooking() returns booking_id/reference, not 'data': reading
            // $result['data'] raised a PHP warning on every admin booking (and
            // could corrupt the JSON where warnings are displayed).
            $bookingId = (int) ($result['booking_id'] ?? ($result['data']['id'] ?? 0));
            Logger::info("Booking created successfully", ['booking_id' => $bookingId]);
            $created = $bookingId > 0 ? $this->bookingService->getBooking($bookingId) : null;

            return $this->success_response($created ?? $result, 201);
            
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

            $bookingRepository = new \Yatra\Repositories\BookingRepository();
            $before = $bookingRepository->find($id);

            $result = $this->bookingService->updateBooking($id, $data);

            // What the edit changed, for the booking's history.
            if (!empty($result['success']) && $before) {
                $after = $bookingRepository->find($id);
                if ($after) {
                    (new \Yatra\Services\BookingActivityService())->recordEdit($id, $before, $after);
                }
            }

            if (!$result['success']) {
                Logger::warning("Booking update failed", ['booking_id' => $id, 'data' => $data, 'result' => $result]);
                return $this->error_response($result['message'] ?? 'Failed to update booking', 400);
            }

            Logger::info("Booking updated successfully", ['booking_id' => $id]);
            return $this->success_response($result['data'] ?? null);
            
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

        // Optional, and only used when cancelling: the reason reaches the
        // customer's cancellation email through {{cancellation_reason}}.
        $reason = isset($data['cancellation_reason'])
            ? sanitize_textarea_field((string) $data['cancellation_reason'])
            : '';

        $result = $this->bookingService->updateStatus($id, $status, $reason);

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
        $data = is_array($data) ? $data : [];
        $data['booking_id'] = $bookingId;

        // A recorded payment can't be more than what is still owed (a typo of
        // 99999 marked a $1,080 booking paid with $100k received). To take
        // more, raise the price first (Adjust price).
        $booking = (new \Yatra\Repositories\BookingRepository())->find($bookingId);
        $amount = round((float) ($data['amount'] ?? 0), 2);
        $status = (string) ($data['status'] ?? 'completed');
        if ($booking && $amount > 0 && in_array($status, ['completed', 'paid'], true) && empty($data['allow_overpayment'])) {
            $due = round(max(0.0, (float) ($booking->amount_due ?? ((float) $booking->total_amount - (float) $booking->amount_paid))), 2);
            if ($amount > $due + 0.009) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => $due > 0
                        ? sprintf(
                            /* translators: %s: balance still due, formatted. */
                            __('That is more than the balance due (%s). Record at most the balance, or use Adjust price first if the customer owes more.', 'yatra'),
                            yatra_format_price($due, (string) ($booking->currency ?: \Yatra\Services\SettingsService::getCurrency()), false)
                        )
                        : __('This booking is already fully paid. Use Adjust price first if the customer owes more.', 'yatra'),
                ], 400);
            }
        }

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
        $bookingDate = !empty($createdAt) ? mysql2date(get_option('date_format'), (string) $createdAt) : '';
        $travelDateRaw = $booking['travel_date'] ?? '';
        $travelDate = !empty($travelDateRaw) ? mysql2date(get_option('date_format'), (string) $travelDateRaw) : '';

        // Return date. Prefer the booking's STORED end_date — the actual booked
        // return (accounts for a flexible window or a trip duration changed after
        // booking). Fall back to the trip duration only when no end is stored:
        // duration_days is INCLUSIVE, so the return is travel_date + (days - 1)
        // (matches BookingRepository::calculateEndDate; a bare "+ duration_days"
        // was one day too far and implied an extra night — see ItineraryPdfBuilder).
        $returnDate = '';
        $storedEnd = (string) ($booking['end_date'] ?? '');
        if ($storedEnd !== '' && ($travelDateRaw === '' || $storedEnd >= $travelDateRaw)) {
            $returnDate = mysql2date(get_option('date_format'), (string) $storedEnd);
        } elseif (!empty($travelDateRaw) && $trip && !empty($trip->duration_days)) {
            $returnOffset = max(0, (int) $trip->duration_days - 1);
            $returnTimestamp = strtotime((string) $travelDateRaw . ' +' . $returnOffset . ' days');
            $returnDate = ($returnTimestamp ? (string) mysql2date(get_option('date_format'), date('Y-m-d', $returnTimestamp)) : '');
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
            'company_address_lines' => \Yatra\Helpers\FormatHelper::companyAddressLines(),
            'company_email' => $companyEmail,
            'company_phone' => $companyPhone,
            'customer_name' => $customerName,
            'customer_email' => (string) ($booking['contact_email'] ?? $booking['customer_email'] ?? ''),
            'customer_address_lines' => FormatHelper::customerAddressLines($booking),
            'booking_ref' => $bookingRef,
            'booking_date' => $bookingDate,
            'booking_status' => ucfirst($statusRaw ?: 'pending'),
            'status_class' => in_array(strtolower($statusRaw), ['confirmed', 'completed', 'success'], true) ? 'confirmed' :
                (in_array(strtolower($statusRaw), ['cancelled'], true) ? 'cancelled' : 'pending'),
            'trip_title' => $trip ? ($trip->title ?? $booking['trip_title'] ?? __('Trip Booking', 'yatra')) : ($booking['trip_title'] ?? __('Trip Booking', 'yatra')),
            // Trip duration comes from duration_days/duration_nights (there is no
            // `duration` column — accessing it caused a blank value + PHP notice).
            'trip_duration' => $trip
                ? yatra_format_duration(
                    (int) ($trip->duration_days ?? 0),
                    isset($trip->duration_nights) ? (int) $trip->duration_nights : null,
                    // Hour-based day tours: "8 hours" instead of "1 day". Absent
                    // or NULL on every day-based trip, which keeps its wording.
                    (int) ($trip->duration_hours ?? 0)
                )
                : '',
            'trip_difficulty' => $trip ? ($trip->difficulty_name ?? '') : '',
            'departure_location' => $trip ? ($trip->departure_location ?? '') : '',
            'destination' => $trip ? ($trip->destination ?? '') : '',
            'travel_date' => $travelDate,
            'return_date' => $returnDate,
            'currency_symbol' => $currencySymbol,
            'total_amount' => yatra_format_price((float) ($booking['total_amount'] ?? 0), $currency, false),
            'amount_paid' => yatra_format_price((float) ($booking['amount_paid'] ?? 0), $currency, false),
            'amount_due' => yatra_format_price((float) ($booking['amount_due'] ?? 0), $currency, false),
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
        $builder = new \Yatra\Services\ItineraryPdfBuilder();
        if (!$builder->pdfService()->isAvailable()) {
            return new WP_Error(
                'pdf_engine_missing',
                __('Itinerary PDF generator is not installed. Please run composer install to install dompdf/dompdf.', 'yatra'),
                ['status' => 500]
            );
        }

        $bookingId = (int) ($booking['id'] ?? 0);
        $bookingRef = $bookingId > 0
            ? 'YTR-' . strtoupper(str_pad((string) $bookingId, 8, '0', STR_PAD_LEFT))
            : 'PENDING';
        $filename = 'Travel-Itinerary-' . $bookingRef . '.pdf';

        // The builder accepts the booking array shape directly — just
        // forward `id` as `booking_id` so the reference resolves the
        // same as the legacy code, and let it normalise everything else.
        $source = $booking + ['booking_id' => $bookingId];
        $pdfBinary = $builder->build($source);

        if ($isPreview) {
            return new WP_REST_Response([
                'success' => true,
                'pdf_data' => base64_encode($pdfBinary),
                'filename' => $filename,
            ]);
        }

        $builder->pdfService()->outputPdfDownload($pdfBinary, $filename);
        exit;
    }

    public function listPaymentLinks(WP_REST_Request $request): WP_REST_Response
    {
        $booking = (new \Yatra\Repositories\BookingRepository())->find((int) $request->get_param('id'));
        if (!$booking) {
            return new WP_REST_Response(['success' => false, 'message' => __('Booking not found.', 'yatra')], 404);
        }

        return new WP_REST_Response([
            'success' => true,
            'data' => \Yatra\Services\PaymentLinkService::forBooking($booking),
            'can_pay_online' => \Yatra\Services\PaymentLinkService::canPayOnline(),
        ], 200);
    }

    public function createPaymentLink(WP_REST_Request $request): WP_REST_Response
    {
        $body = (array) $request->get_json_params();
        $result = \Yatra\Services\PaymentLinkService::create(
            (int) $request->get_param('id'),
            (float) ($body['amount'] ?? 0),
            (string) ($body['note'] ?? ''),
            !empty($body['send_email'])
        );
        if (empty($result['success'])) {
            return new WP_REST_Response($result, 400);
        }
        // In the booking's history (as a note by the operator who made it).
        try {
            $booking = (new \Yatra\Repositories\BookingRepository())->find((int) $request->get_param('id'));
            (new \Yatra\Services\BookingActivityService())->addNote((int) $request->get_param('id'), sprintf(
                /* translators: %s: amount. */
                __('Payment link created for %s.', 'yatra'),
                yatra_format_price((float) ($result['link']['amount'] ?? 0), (string) ($booking->currency ?? ''), false)
            ) . (!empty($body['send_email']) ? ' ' . __('Emailed to the customer.', 'yatra') : ''));
        } catch (\Throwable $e) {
            // History is informational.
        }

        return new WP_REST_Response($result, 201);
    }

    public function cancelPaymentLink(WP_REST_Request $request): WP_REST_Response
    {
        $bookingId = (int) $request->get_param('id');
        $linkId = (string) $request->get_param('link');
        $amount = null;
        $booking = (new \Yatra\Repositories\BookingRepository())->find($bookingId);
        if ($booking) {
            foreach (\Yatra\Services\PaymentLinkService::forBooking($booking) as $link) {
                if ($link['id'] === $linkId) {
                    $amount = (float) $link['amount'];
                }
            }
        }
        $ok = \Yatra\Services\PaymentLinkService::cancel($bookingId, $linkId);
        if ($ok && $amount !== null) {
            try {
                (new \Yatra\Services\BookingActivityService())->addNote($bookingId, sprintf(
                    /* translators: %s: amount. */
                    __('Payment link for %s cancelled.', 'yatra'),
                    yatra_format_price($amount, (string) ($booking->currency ?? ''), false)
                ));
            } catch (\Throwable $e) {
                // History is informational.
            }
        }

        return new WP_REST_Response(['success' => $ok, 'message' => $ok ? __('Payment link cancelled.', 'yatra') : __('This link is no longer open.', 'yatra')], $ok ? 200 : 400);
    }
}
