<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\CustomerService;
use Yatra\Validators\CustomerValidator;
use Yatra\Exceptions\ValidationException;
use Yatra\Utils\Logger;

/**
 * Customer REST API Controller
 * 
 * Handles HTTP requests only - delegates business logic to CustomerService.
 * 
 * NO DATABASE QUERIES OR BUSINESS LOGIC IN THIS FILE.
 * 
 * @package Yatra\Controllers
 */
class CustomerController extends BaseController
{
    /**
     * Customer service instance
     */
    private CustomerService $customerService;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->customerService = new CustomerService();
    }

    /**
     * Register routes
     */
    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        $base = 'customers';

        // =====================
        // CUSTOMER (FRONTEND) ROUTES
        // =====================
        
        // Get current customer profile
        register_rest_route($namespace, '/' . $base . '/me', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getMe'],
                'permission_callback' => [$this, 'checkCustomerPermission'],
            ],
            [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'updateMe'],
                'permission_callback' => [$this, 'checkCustomerPermission'],
            ],
        ]);

        // Current customer's bookings
        register_rest_route($namespace, '/' . $base . '/my-bookings', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getMyBookings'],
                'permission_callback' => [$this, 'checkCustomerPermission'],
            ],
        ]);

        register_rest_route($namespace, '/' . $base . '/my-bookings/(?P<id>\d+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getMyBooking'],
                'permission_callback' => [$this, 'checkCustomerPermission'],
                'args' => [
                    'id' => [
                        'required' => true,
                        'type' => 'integer',
                        'sanitize_callback' => 'absint',
                    ],
                ],
            ],
        ]);

        // Current customer's payments
        register_rest_route($namespace, '/' . $base . '/my-payments', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getMyPayments'],
                'permission_callback' => [$this, 'checkCustomerPermission'],
            ],
        ]);

        // Current customer's documents
        register_rest_route($namespace, '/' . $base . '/my-documents', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getMyDocuments'],
                'permission_callback' => [$this, 'checkCustomerPermission'],
            ],
        ]);

        // Current customer's support tickets
        register_rest_route($namespace, '/' . $base . '/my-support-tickets', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getMySupportTickets'],
                'permission_callback' => [$this, 'checkCustomerPermission'],
            ],
        ]);

        // =====================
        // ADMIN ROUTES
        // =====================

        // List & Create customers
        register_rest_route($namespace, '/' . $base, [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getCustomers'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'createCustomer'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
        ]);

        // Single customer operations
        register_rest_route($namespace, '/' . $base . '/(?P<id>\d+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getCustomer'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
            [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'updateCustomer'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'deleteCustomer'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
        ]);

        // Customer's bookings (admin)
        register_rest_route($namespace, '/' . $base . '/(?P<id>\d+)/bookings', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getCustomerBookings'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
        ]);

        // Merge customers
        register_rest_route($namespace, '/' . $base . '/merge', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'mergeCustomers'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
        ]);
    }

    /**
     * Check if user is logged in
     */
    public function checkCustomerPermission(): bool
    {
        return is_user_logged_in();
    }

    /**
     * Check admin permission
     */
    public function checkAdminPermission(): bool
    {
        return current_user_can('manage_options') || current_user_can('yatra_manage_customers');
    }

    // =========================================================================
    // FRONTEND ENDPOINTS (Current User)
    // =========================================================================

    /**
     * GET /customers/me - Get current customer profile
     */
    public function getMe(WP_REST_Request $request): WP_REST_Response
    {
        $userId = get_current_user_id();

        $customer = $this->customerService->getCustomerByUserId($userId);

        if (!$customer) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Customer profile not found.', 'yatra'),
            ], 404);
        }

        return new WP_REST_Response([
            'success' => true,
            'data' => $customer,
        ]);
    }

    /**
     * PUT /customers/me - Update current customer profile
     */
    public function updateMe(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $userId = get_current_user_id();
            $data = $request->get_json_params();

            Logger::apiRequest('/customers/me', 'PUT', $data);

            $customer = $this->customerService->getCustomerByUserId($userId);

            if (!$customer) {
                Logger::warning("Customer profile not found for user", ['user_id' => $userId]);
                return $this->not_found(__('Customer profile not found', 'yatra'));
            }

            $customerId = (int) $customer['id'];
            
            // Validate and sanitize input data
            CustomerValidator::validateUpdate($data, $customerId);
            $data = CustomerValidator::sanitize($data);

            $result = $this->customerService->updateCustomer($customerId, $data);

            if (!$result['success']) {
                Logger::warning("Customer profile update failed", ['customer_id' => $customerId, 'user_id' => $userId, 'result' => $result]);
                return $this->error_response($result['message'] ?? 'Failed to update customer profile', 400);
            }

            Logger::info("Customer profile updated successfully", ['customer_id' => $customerId, 'user_id' => $userId]);
            return $this->success_response($result['data']);
            
        } catch (\Exception $e) {
            Logger::error("Failed to update customer profile", ['user_id' => $userId ?? 0, 'data' => $data ?? [], 'error' => $e->getMessage()]);
            return $this->handle_exception($e);
        }
    }

    /**
     * GET /customers/my-bookings - Get current customer's bookings
     */
    public function getMyBookings(WP_REST_Request $request): WP_REST_Response
    {
        $userId = get_current_user_id();

        // Get bookings by user ID (checks both customer_id and user_id)
        $bookings = $this->customerService->getBookingsByUserId($userId);

        return new WP_REST_Response([
            'success' => true,
            'data' => $bookings,
        ]);
    }

    public function getMyBooking(WP_REST_Request $request): WP_REST_Response
    {
        $userId = get_current_user_id();
        $bookingId = (int) $request->get_param('id');

        $booking = $this->customerService->getBookingDetailsForUser($userId, $bookingId);

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
     * GET /customers/my-payments - Get current customer's payments
     */
    public function getMyPayments(WP_REST_Request $request): WP_REST_Response
    {
        $userId = get_current_user_id();

        $customer = $this->customerService->getCustomerByUserId($userId);

        if ($customer) {
            $payments = $this->customerService->getCustomerPayments((int) $customer['id']);
        } else {
            $payments = $this->customerService->getPaymentsByUserId($userId);
        }

        return new WP_REST_Response([
            'success' => true,
            'data' => $payments,
        ]);
    }

    /**
     * GET /customers/my-documents - Get current customer's documents
     */
    public function getMyDocuments(WP_REST_Request $request): WP_REST_Response
    {
        $userId = get_current_user_id();

        $customer = $this->customerService->getCustomerByUserId($userId);

        if (!$customer) {
            $bookings = $this->customerService->getBookingsByUserId($userId, 1000);
            $documents = $this->customerService->getDocumentsForBookings($bookings, 0);

            return new WP_REST_Response([
                'success' => true,
                'data' => is_array($documents) ? $documents : [],
            ]);
        }

        $documents = $this->customerService->getCustomerDocuments((int) $customer['id']);

        return new WP_REST_Response([
            'success' => true,
            'data' => $documents,
        ]);
    }

    /**
     * GET /customers/my-support-tickets - Get current customer's support tickets
     */
    public function getMySupportTickets(WP_REST_Request $request): WP_REST_Response
    {
        $userId = get_current_user_id();

        $customer = $this->customerService->getCustomerByUserId($userId);

        if (!$customer) {
            return new WP_REST_Response([
                'success' => true,
                'data' => [],
            ]);
        }

        $tickets = $this->customerService->getCustomerSupportTickets((int) $customer['id']);

        return new WP_REST_Response([
            'success' => true,
            'data' => $tickets,
        ]);
    }

    // =========================================================================
    // ADMIN ENDPOINTS
    // =========================================================================

    /**
     * GET /customers - List all customers
     */
    public function getCustomers(WP_REST_Request $request): WP_REST_Response
    {
        $filters = [
            'page' => (int) ($request->get_param('page') ?: 1),
            'per_page' => (int) ($request->get_param('per_page') ?: 20),
            'status' => $request->get_param('status') ?: '',
            'search' => $request->get_param('search') ?: '',
            'orderby' => $request->get_param('orderby') ?: 'created_at',
            'order' => $request->get_param('order') ?: 'desc',
        ];

        $result = $this->customerService->getCustomers($filters);

        return new WP_REST_Response([
            'success' => true,
            'data' => $result['data'],
            'total' => $result['total'],
            'page' => $result['page'],
            'per_page' => $result['per_page'],
            'pages' => $result['pages'] ?? $result['total_pages'] ?? 1,
        ]);
    }

    /**
     * GET /customers/{id} - Get single customer
     */
    public function getCustomer(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');

        $customer = $this->customerService->getCustomer($id);

        if (!$customer) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Customer not found.', 'yatra'),
            ], 404);
        }

        return new WP_REST_Response([
            'success' => true,
            'data' => $customer,
        ]);
    }

    /**
     * POST /customers - Create customer
     */
    public function createCustomer(WP_REST_Request $request): WP_REST_Response
    {
        $data = $request->get_json_params();

        $result = $this->customerService->createCustomer($data);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result, 201);
    }

    /**
     * PUT /customers/{id} - Update customer
     */
    public function updateCustomer(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $data = $request->get_json_params();

        $result = $this->customerService->updateCustomer($id, $data);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result);
    }

    /**
     * DELETE /customers/{id} - Delete customer
     */
    public function deleteCustomer(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');

        $result = $this->customerService->deleteCustomer($id);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result);
    }

    /**
     * GET /customers/{id}/bookings - Get customer's bookings (admin)
     */
    public function getCustomerBookings(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $limit = (int) ($request->get_param('limit') ?: 10);

        $bookings = $this->customerService->getCustomerBookings($id, $limit);

        return new WP_REST_Response([
            'success' => true,
            'data' => $bookings,
        ]);
    }

    /**
     * POST /customers/merge - Merge two customers
     */
    public function mergeCustomers(WP_REST_Request $request): WP_REST_Response
    {
        $data = $request->get_json_params();
        $sourceId = (int) ($data['source_id'] ?? 0);
        $targetId = (int) ($data['target_id'] ?? 0);

        if (!$sourceId || !$targetId) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Both source and target customer IDs are required.', 'yatra'),
            ], 400);
        }

        $result = $this->customerService->mergeCustomers($sourceId, $targetId);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result);
    }
}
