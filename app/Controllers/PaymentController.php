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
            'page' => max(1, (int) ($request->get_param('page') ?: 1)),
            // Clamp to a sane range: guards the total_pages division below and
            // stops an unbounded ?per_page=999999 query.
            'per_page' => min(100, max(1, (int) ($request->get_param('per_page') ?: 20))),
            'booking_id' => (int) $request->get_param('booking_id'),
            'status' => $request->get_param('status') ?: '',
            'gateway' => $request->get_param('gateway') ?: '',
            'search' => $request->get_param('search') ?: '',
            'date_from' => $request->get_param('date_from') ?: '',
            'date_to' => $request->get_param('date_to') ?: '',
        ];

        $result = $this->paymentService->getPayments($filters);

        return new WP_REST_Response([
            'data' => $result['data'],
            'total' => $result['total'],
            'page' => $filters['page'],
            'per_page' => $filters['per_page'],
            'total_pages' => ceil($result['total'] / $filters['per_page']),
        ], 200);
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
        if (!is_array($data)) {
            $data = [];
        }

        // A valid booking is required.
        if ((int) ($data['booking_id'] ?? 0) <= 0) {
            return new WP_Error('yatra_invalid_booking', __('A valid booking is required.', 'yatra'), ['status' => 400]);
        }

        // Refund-cap gate: this route is gated on the *edit* cap, but a negative
        // amount or an explicit `payment_type=refund` records a refund — which
        // PUT/DELETE already restrict to the dedicated refund capability. Require
        // the same here so an edit-only user can't record a refund via POST.
        $amount = isset($data['amount']) ? (float) $data['amount'] : 0.0;
        $paymentType = isset($data['payment_type']) ? sanitize_key((string) $data['payment_type']) : '';
        if (($paymentType === 'refund' || $amount < 0) && !current_user_can('yatra_refund_bookings')) {
            return new WP_Error(
                'yatra_forbidden',
                __('You are not allowed to record a refund.', 'yatra'),
                ['status' => 403]
            );
        }

        try {
            $payment = $this->paymentService->createPayment($data);
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
