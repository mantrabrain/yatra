<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\PaymentService;

/**
 * Payment REST API Controller
 * 
 * Handles payment record operations (listing, viewing, managing payments)
 */
class PaymentController extends BaseController
{
    /**
     * REST API namespace
     */
    protected string $namespace = 'yatra/v1';

    /**
     * Payment service instance
     */
    private PaymentService $paymentService;

    /**
     * Constructor - Initialize services
     */
    public function __construct()
    {
        $this->paymentService = new PaymentService();
    }

    /**
     * Register REST API routes
     */
    public function register_routes(): void
    {
        // Payment stats — view cap (read-only aggregates).
        register_rest_route($this->namespace, '/payments/stats', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'getPaymentStats'],
                'permission_callback' => [$this, 'checkCanView'],
            ],
        ]);

        // List + create payments. Create needs the edit-bookings cap
        // because adding a payment mutates the booking's payment state.
        register_rest_route($this->namespace, '/payments', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'getPayments'],
                'permission_callback' => [$this, 'checkCanView'],
            ],
            [
                'methods' => 'POST',
                'callback' => [$this, 'createPayment'],
                'permission_callback' => [$this, 'checkCanEdit'],
            ]
        ]);

        // Single-payment read / update / delete. Update + delete are
        // refund-equivalent operations from the customer's perspective
        // (changing the amount or removing a recorded payment can
        // affect what the customer owes), so we gate them on the
        // dedicated refund cap. Accountant role holds refund without
        // holding edit-bookings, so they can issue refunds without
        // also being able to edit the underlying booking.
        register_rest_route($this->namespace, '/payments/(?P<id>\d+)', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'getPayment'],
                'permission_callback' => [$this, 'checkCanView'],
            ],
            [
                'methods' => 'PUT',
                'callback' => [$this, 'updatePayment'],
                'permission_callback' => [$this, 'checkCanRefund'],
            ],
            [
                'methods' => 'DELETE',
                'callback' => [$this, 'deletePayment'],
                'permission_callback' => [$this, 'checkCanRefund'],
            ]
        ]);

        // Note history. Reading needs only view rights; adding one is an
        // ordinary record-keeping action, so it sits with edit rather than with
        // the refund capability.
        register_rest_route($this->namespace, '/payments/(?P<id>\d+)/notes', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'getPaymentNotes'],
                'permission_callback' => [$this, 'checkCanView'],
            ],
            [
                'methods' => 'POST',
                'callback' => [$this, 'addPaymentNote'],
                'permission_callback' => [$this, 'checkCanEdit'],
            ],
        ]);
    }

    /**
     * GET /payments/{id}/notes — the payment's note history, oldest first.
     */
    public function getPaymentNotes(WP_REST_Request $request): WP_REST_Response
    {
        $paymentId = (int) $request->get_param('id');

        return new WP_REST_Response([
            'success' => true,
            'data' => $this->paymentService->getPaymentNotes($paymentId),
        ]);
    }

    /**
     * POST /payments/{id}/notes — add a note without disturbing the ones already there.
     */
    public function addPaymentNote(WP_REST_Request $request): WP_REST_Response
    {
        $paymentId = (int) $request->get_param('id');
        $params = (array) $request->get_json_params();
        $note = (string) ($params['note'] ?? $request->get_param('note') ?? '');

        $result = $this->paymentService->addPaymentNote($paymentId, $note);

        return new WP_REST_Response($result, !empty($result['success']) ? 200 : 400);
    }

    /**
     * Granular permission checks. WP administrators pass every cap
     * via the Team module's admin-fallback filter, so an explicit
     * `manage_options` check isn't needed at this layer.
     */
    public function checkCanView(): bool
    {
        return current_user_can('yatra_view_bookings');
    }

    public function checkCanEdit(): bool
    {
        return current_user_can('yatra_edit_bookings');
    }

    public function checkCanRefund(): bool
    {
        // Refund cap is high-sensitivity. Held by Owner + Manager +
        // Accountant by default. Sales Agent / Front Desk / Guide
        // can record payments via the create endpoint above but
        // cannot modify or delete existing ones.
        return current_user_can('yatra_refund_bookings');
    }

    /**
     * @deprecated Kept for any external code referencing the old
     * method name. Routes to view — safer than the old "view OR
     * manage_options" shorthand, and admin users still pass via
     * the admin-fallback layer.
     */
    public function checkAdminPermission(): bool
    {
        return $this->checkCanView();
    }

    /**
     * GET /payments/stats - Counts per status for admin toolbar
     */
    public function getPaymentStats(WP_REST_Request $request): WP_REST_Response
    {
        $counts = $this->paymentService->getAdminStatusCounts();

        return new WP_REST_Response($counts, 200);
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
            // Column sorting from the table headers. Both are validated against a
            // whitelist in the repository — never interpolated raw into SQL.
            'orderby' => $request->get_param('orderby') ?: '',
            'order' => $request->get_param('order') ?: '',
        ];

        $result = $this->paymentService->getPayments($filters);
        $result['data'] = $this->withBookingPaymentSchedule((array) $result['data']);

        return new WP_REST_Response([
            'data' => $result['data'],
            'total' => $result['total'],
            'page' => $filters['page'],
            'per_page' => $filters['per_page'],
            'total_pages' => ceil($result['total'] / $filters['per_page']),
        ], 200);
    }

    /**
     * Attach each payment's booking balance and next due date to the row.
     *
     * The Payments screen could say what had been collected but never when the
     * rest was expected, so an operator had to open each booking to find out.
     * Core does not decide payment schedules — Yatra Pro's Scheduled Payments
     * module does — so it asks and passes on whatever comes back. When Pro is
     * absent, older, or the feature is off nothing answers, no `payment_schedule`
     * key is added, and the payload is exactly what it has always been.
     *
     * The bookings behind the page are read in ONE query and the schedule is
     * resolved once per booking, so several payments against the same booking do
     * not each repeat the work.
     *
     * @param array<int, array<string, mixed>> $payments
     * @return array<int, array<string, mixed>>
     */
    private function withBookingPaymentSchedule(array $payments): array
    {
        if ($payments === []) {
            return $payments;
        }

        $bookingIds = [];
        foreach ($payments as $payment) {
            $bookingId = (int) ($payment['booking_id'] ?? 0);
            if ($bookingId > 0) {
                $bookingIds[$bookingId] = $bookingId;
            }
        }

        if ($bookingIds === []) {
            return $payments;
        }

        global $wpdb;
        $table = \Yatra\Database\Tables\BookingsTable::getTableName();
        $placeholders = implode(',', array_fill(0, count($bookingIds), '%d'));

        $bookings = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$table} WHERE id IN ({$placeholders})",
                array_values($bookingIds)
            ),
            OBJECT_K
        );

        if (!is_array($bookings) || $bookings === []) {
            return $payments;
        }

        $schedules = [];
        foreach ($bookings as $bookingId => $booking) {
            $schedule = apply_filters('yatra_booking_payment_schedule', null, $booking);
            if (is_array($schedule)) {
                $schedules[(int) $bookingId] = $schedule;
            }
        }

        if ($schedules === []) {
            return $payments;
        }

        foreach ($payments as $index => $payment) {
            $bookingId = (int) ($payment['booking_id'] ?? 0);
            if (isset($schedules[$bookingId])) {
                $payments[$index]['payment_schedule'] = $schedules[$bookingId];
            }
        }

        return $payments;
    }

    /**
     * GET /payments/{id} - Get single payment
     */
    public function getPayment(WP_REST_Request $request)
    {
        $id = (int) $request->get_param('id');
        $payment = $this->paymentService->getPayment($id);

        if (!$payment) {
            return new WP_Error('payment_not_found', 'Payment not found', ['status' => 404]);
        }

        return new WP_REST_Response($payment, 200);
    }

    /**
     * POST /payments - Create payment
     */
    public function createPayment(WP_REST_Request $request)
    {
        $data = $request->get_json_params();
        
        try {
            $payment = $this->paymentService->createPayment($data);

            // The service reports validation failures (unknown booking, invalid
            // status) as ['success' => false]; answering 201 made the admin form
            // redirect as if the payment had been saved.
            if (is_array($payment) && isset($payment['success']) && !$payment['success']) {
                return new WP_REST_Response($payment, 400);
            }

            return new WP_REST_Response($payment, 201);
        } catch (\Exception $e) {
            return new WP_Error('payment_creation_failed', $e->getMessage(), ['status' => 400]);
        }
    }

    /**
     * PUT /payments/{id} - Update payment
     */
    public function updatePayment(WP_REST_Request $request)
    {
        $id = (int) $request->get_param('id');
        $data = $request->get_json_params();

        try {
            $payment = $this->paymentService->updatePayment($id, $data);
            
            if (!$payment) {
                return new WP_Error('payment_not_found', 'Payment not found', ['status' => 404]);
            }

            if (is_array($payment) && isset($payment['success']) && !$payment['success']) {
                return new WP_REST_Response($payment, 400);
            }

            return new WP_REST_Response($payment, 200);
        } catch (\Exception $e) {
            return new WP_Error('payment_update_failed', $e->getMessage(), ['status' => 400]);
        }
    }

    /**
     * DELETE /payments/{id} - Delete payment
     */
    public function deletePayment(WP_REST_Request $request)
    {
        $id = (int) $request->get_param('id');

        try {
            $result = $this->paymentService->deletePayment($id);
            
            if (!$result) {
                return new WP_Error('payment_not_found', 'Payment not found', ['status' => 404]);
            }

            return new WP_REST_Response(['success' => true], 200);
        } catch (\Exception $e) {
            return new WP_Error('payment_deletion_failed', $e->getMessage(), ['status' => 400]);
        }
    }
}
