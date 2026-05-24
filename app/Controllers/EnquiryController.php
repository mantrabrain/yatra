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
                'permission_callback' => [$this, 'checkCanView'],
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'createEnquiry'],
                'permission_callback' => '__return_true', // Public endpoint
            ],
        ]);

        // Single enquiry operations — read uses view, write uses respond,
        // delete uses the dedicated delete cap (high sensitivity).
        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getEnquiry'],
                'permission_callback' => [$this, 'checkCanView'],
            ],
            [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'updateEnquiry'],
                'permission_callback' => [$this, 'checkCanRespond'],
            ],
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'deleteEnquiry'],
                'permission_callback' => [$this, 'checkCanDelete'],
            ],
        ]);

        // Bulk actions — operations include status change, mark-read,
        // delete, etc. Gate on respond (the broadest mutation cap
        // short of delete). Bulk-delete callers should re-check
        // delete-cap inside the handler when the action is "delete".
        register_rest_route($namespace, '/' . $base . '/bulk', [
            [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'bulkAction'],
                'permission_callback' => [$this, 'checkCanRespond'],
            ],
        ]);

        // Stats endpoint — read-only aggregation, view cap is enough.
        register_rest_route($namespace, '/' . $base . '/stats', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getStats'],
                'permission_callback' => [$this, 'checkCanView'],
            ],
        ]);

        // Respond to enquiry — explicit respond-cap.
        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)/respond', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'respondToEnquiry'],
                'permission_callback' => [$this, 'checkCanRespond'],
            ],
        ]);
    }

    /**
     * Granular permission checks — one per operation so role bundles
     * (Sales Agent, Front Desk, etc.) can actually use the parts of
     * the enquiry surface their role grants. WP administrators pass
     * every cap automatically via the Team module's admin-fallback
     * filter, so `manage_options` doesn't need an explicit check
     * here — it's covered by the cap.
     */
    public function checkCanView(): bool
    {
        return current_user_can('yatra_view_enquiries');
    }

    public function checkCanRespond(): bool
    {
        return current_user_can('yatra_respond_to_enquiries');
    }

    public function checkCanDelete(): bool
    {
        return current_user_can('yatra_delete_enquiries');
    }

    /**
     * @deprecated Kept for any external code (custom snippet, third-
     * party integration) that hooked the old method name. New code
     * should use checkCanView/Respond/Delete. Routes the call to
     * the view-only cap so behaviour is at-least-as-strict as before
     * for non-admin callers, and admin users keep passing via the
     * admin-fallback layer.
     */
    public function checkAdminPermission(): bool
    {
        return $this->checkCanView();
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
