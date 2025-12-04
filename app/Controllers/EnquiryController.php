<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\EnquiryService;

/**
 * Enquiry REST API Controller
 * 
 * Handles HTTP requests only - delegates business logic to EnquiryService.
 * 
 * NO DATABASE QUERIES OR BUSINESS LOGIC IN THIS FILE.
 * 
 * @package Yatra\Controllers
 */
class EnquiryController extends BaseController
{
    /**
     * Enquiry service instance
     */
    private EnquiryService $enquiryService;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->enquiryService = new EnquiryService();
    }

    /**
     * Register routes
     */
    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        $base = 'enquiries';

        // List & Create
        register_rest_route($namespace, '/' . $base, [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getEnquiries'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'createEnquiry'],
                'permission_callback' => '__return_true', // Public endpoint
            ],
        ]);

        // Single enquiry operations
        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getEnquiry'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
            [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'updateEnquiry'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'deleteEnquiry'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
        ]);

        // Bulk actions
        register_rest_route($namespace, '/' . $base . '/bulk', [
            [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'bulkAction'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
        ]);

        // Stats endpoint
        register_rest_route($namespace, '/' . $base . '/stats', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getStats'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
        ]);

        // Respond to enquiry
        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)/respond', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'respondToEnquiry'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
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
     * GET /enquiries - List all enquiries
     */
    public function getEnquiries(WP_REST_Request $request): WP_REST_Response
    {
        $filters = [
            'page' => (int) ($request->get_param('page') ?: 1),
            'per_page' => (int) ($request->get_param('per_page') ?: 20),
            'status' => $request->get_param('status') ?: '',
            'trip_id' => (int) $request->get_param('trip_id'),
            'search' => $request->get_param('search') ?: '',
            'date_from' => $request->get_param('date_from') ?: '',
            'date_to' => $request->get_param('date_to') ?: '',
        ];

        $result = $this->enquiryService->getEnquiries($filters);

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
     * GET /enquiries/{id} - Get single enquiry
     */
    public function getEnquiry(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');

        $enquiry = $this->enquiryService->getEnquiry($id);

        if (!$enquiry) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Enquiry not found.', 'yatra'),
            ], 404);
        }

        return new WP_REST_Response([
            'success' => true,
            'data' => $enquiry,
        ]);
    }

    /**
     * POST /enquiries - Create enquiry (public endpoint)
     */
    public function createEnquiry(WP_REST_Request $request): WP_REST_Response
    {
        $data = $request->get_json_params();

        // Handle both JSON and form data
        if (empty($data)) {
            $data = $request->get_params();
        }

        $result = $this->enquiryService->createEnquiry($data);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result, 201);
    }

    /**
     * PUT /enquiries/{id} - Update enquiry
     */
    public function updateEnquiry(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $data = $request->get_json_params();

        $result = $this->enquiryService->updateEnquiry($id, $data);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result);
    }

    /**
     * DELETE /enquiries/{id} - Delete enquiry
     */
    public function deleteEnquiry(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');

        $result = $this->enquiryService->deleteEnquiry($id);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result);
    }

    /**
     * PUT /enquiries/bulk - Bulk actions
     */
    public function bulkAction(WP_REST_Request $request): WP_REST_Response
    {
        $data = $request->get_json_params();
        $action = $data['action'] ?? '';
        $ids = $data['ids'] ?? [];

        if (empty($ids) || !is_array($ids)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('No items selected.', 'yatra'),
            ], 400);
        }

        switch ($action) {
            case 'delete':
                $result = $this->enquiryService->bulkDelete($ids);
                break;

            case 'mark_read':
                $result = $this->enquiryService->bulkUpdateStatus($ids, 'read');
                break;

            case 'mark_pending':
                $result = $this->enquiryService->bulkUpdateStatus($ids, 'pending');
                break;

            case 'mark_spam':
                $result = $this->enquiryService->bulkUpdateStatus($ids, 'spam');
                break;

            case 'mark_trash':
                $result = $this->enquiryService->bulkUpdateStatus($ids, 'trash');
                break;

            case 'archive':
                $result = $this->enquiryService->bulkUpdateStatus($ids, 'archived');
                break;

            default:
                return new WP_REST_Response([
                    'success' => false,
                    'message' => __('Invalid action.', 'yatra'),
                ], 400);
        }

        return new WP_REST_Response($result);
    }

    /**
     * GET /enquiries/stats - Get statistics
     */
    public function getStats(WP_REST_Request $request): WP_REST_Response
    {
        $stats = $this->enquiryService->getStats();

        return new WP_REST_Response([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * POST /enquiries/{id}/respond - Respond to enquiry
     */
    public function respondToEnquiry(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $data = $request->get_json_params();
        $response = $data['response'] ?? '';

        if (empty(trim($response))) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Response message is required.', 'yatra'),
            ], 400);
        }

        $result = $this->enquiryService->respondToEnquiry($id, $response);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result);
    }
}
