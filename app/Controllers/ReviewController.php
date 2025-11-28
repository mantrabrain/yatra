<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\ReviewService;

/**
 * Review REST API Controller
 * 
 * Handles HTTP requests only - delegates business logic to ReviewService.
 * 
 * NO DATABASE QUERIES OR BUSINESS LOGIC IN THIS FILE.
 * 
 * @package Yatra\Controllers
 */
class ReviewController extends BaseController
{
    /**
     * Review service instance
     */
    private ReviewService $reviewService;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->reviewService = new ReviewService();
    }

    /**
     * Register routes
     */
    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        $base = 'reviews';

        // =====================
        // ADMIN ROUTES
        // =====================
        
        // List reviews
        register_rest_route($namespace, '/' . $base, [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getReviews'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
        ]);

        // Get single review
        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getReview'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
            [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'updateReview'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'deleteReview'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
        ]);

        // Update review status
        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)/status', [
            [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'updateStatus'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
        ]);

        // Stats
        register_rest_route($namespace, '/' . $base . '/stats', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getStats'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
        ]);

        // =====================
        // PUBLIC ROUTES
        // =====================
        
        // Get trip reviews (public)
        register_rest_route($namespace, '/trips/(?P<trip_id>[\d]+)/reviews', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getTripReviews'],
                'permission_callback' => '__return_true',
            ],
        ]);

        // Submit review (authenticated)
        register_rest_route($namespace, '/trips/(?P<trip_id>[\d]+)/reviews', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'submitReview'],
                'permission_callback' => [$this, 'checkReviewPermission'],
            ],
        ]);

        // Check if user can review
        register_rest_route($namespace, '/trips/(?P<trip_id>[\d]+)/can-review', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'canReview'],
                'permission_callback' => '__return_true',
            ],
        ]);

        // User's own review operations
        register_rest_route($namespace, '/my-reviews/(?P<id>[\d]+)', [
            [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'updateMyReview'],
                'permission_callback' => [$this, 'checkUserPermission'],
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
     * Check if user is logged in
     */
    public function checkUserPermission(): bool
    {
        return is_user_logged_in();
    }

    /**
     * Check review submission permission
     */
    public function checkReviewPermission(): bool
    {
        $settings = \Yatra\Services\SettingsService::getSettings();
        $requireLogin = $settings['reviews']['require_login'] ?? true;

        if ($requireLogin) {
            return is_user_logged_in();
        }

        return true;
    }

    // =========================================================================
    // ADMIN ENDPOINTS
    // =========================================================================

    /**
     * GET /reviews - List all reviews (admin)
     */
    public function getReviews(WP_REST_Request $request): WP_REST_Response
    {
        $filters = [
            'page' => (int) ($request->get_param('page') ?: 1),
            'per_page' => (int) ($request->get_param('per_page') ?: 20),
            'status' => $request->get_param('status') ?: '',
            'trip_id' => (int) $request->get_param('trip_id'),
            'rating' => (int) $request->get_param('rating'),
            'search' => $request->get_param('search') ?: '',
        ];

        $result = $this->reviewService->getReviews($filters);

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
     * GET /reviews/{id} - Get single review
     */
    public function getReview(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');

        $review = $this->reviewService->getReview($id);

        if (!$review) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Review not found.', 'yatra'),
            ], 404);
        }

        return new WP_REST_Response([
            'success' => true,
            'data' => $review,
        ]);
    }

    /**
     * PUT /reviews/{id} - Update review
     */
    public function updateReview(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $data = $request->get_json_params();

        $result = $this->reviewService->updateReview($id, $data);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result);
    }

    /**
     * DELETE /reviews/{id} - Delete review
     */
    public function deleteReview(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');

        $result = $this->reviewService->deleteReview($id);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result);
    }

    /**
     * PUT /reviews/{id}/status - Update status
     */
    public function updateStatus(WP_REST_Request $request): WP_REST_Response
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

        $result = $this->reviewService->updateStatus($id, $status);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result);
    }

    /**
     * GET /reviews/stats - Get statistics
     */
    public function getStats(WP_REST_Request $request): WP_REST_Response
    {
        $stats = $this->reviewService->getStats();

        return new WP_REST_Response([
            'success' => true,
            'data' => $stats,
        ]);
    }

    // =========================================================================
    // PUBLIC ENDPOINTS
    // =========================================================================

    /**
     * GET /trips/{trip_id}/reviews - Get trip reviews (public)
     */
    public function getTripReviews(WP_REST_Request $request): WP_REST_Response
    {
        $tripId = (int) $request->get_param('trip_id');
        $limit = (int) ($request->get_param('limit') ?: 10);

        $reviews = $this->reviewService->getTripReviews($tripId, $limit);
        $summary = $this->reviewService->getTripRatingSummary($tripId);

        return new WP_REST_Response([
            'success' => true,
            'data' => [
                'reviews' => $reviews,
                'summary' => $summary,
            ],
        ]);
    }

    /**
     * POST /trips/{trip_id}/reviews - Submit review
     */
    public function submitReview(WP_REST_Request $request): WP_REST_Response
    {
        $tripId = (int) $request->get_param('trip_id');
        $data = $request->get_json_params();

        // Handle both JSON and form data
        if (empty($data)) {
            $data = $request->get_params();
        }

        $data['trip_id'] = $tripId;

        $result = $this->reviewService->submitReview($data);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result, 201);
    }

    /**
     * GET /trips/{trip_id}/can-review - Check if user can review
     */
    public function canReview(WP_REST_Request $request): WP_REST_Response
    {
        $tripId = (int) $request->get_param('trip_id');

        $result = $this->reviewService->canUserReview($tripId);

        return new WP_REST_Response([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * PUT /my-reviews/{id} - Update own review
     */
    public function updateMyReview(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $data = $request->get_json_params();

        // Set user_id to enforce ownership check in service
        $data['user_id'] = get_current_user_id();

        $result = $this->reviewService->updateReview($id, $data);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result);
    }
}
