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
        // List all payments
        register_rest_route($this->namespace, '/payments', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'getPayments'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
            [
                'methods' => 'POST',
                'callback' => [$this, 'createPayment'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ]
        ]);

        // Get single payment
        register_rest_route($this->namespace, '/payments/(?P<id>\d+)', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'getPayment'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
            [
                'methods' => 'PUT',
                'callback' => [$this, 'updatePayment'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
            [
                'methods' => 'DELETE',
                'callback' => [$this, 'deletePayment'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ]
        ]);
    }

    /**
     * Check admin permission
     */
    public function checkAdminPermission(): bool
    {
        return current_user_can('manage_options');
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
