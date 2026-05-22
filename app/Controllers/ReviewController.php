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
        
        // List reviews + create review (admin)
        register_rest_route($namespace, '/' . $base, [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getReviews'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
            [
                // The admin "Add New Review" form (resources/js/pages/ReviewForm.tsx)
                // POSTs here. Distinct from the public-facing
                // `POST /trips/{trip_id}/reviews` route below: the admin path
                // bypasses the "already reviewed this trip" gate, accepts
                // any DB-valid status (incl. spam/trash post-3.0.5 migration),
                // and stamps `created_by` with the current admin user id.
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'createReview'],
                'permission_callback' => [$this, 'checkAdminPermission'],
            ],
        ]);

        // Bulk actions
        register_rest_route($namespace, '/' . $base . '/bulk', [
            [
                'methods'  => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'bulkAction'],
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

        

        // Map database fields to frontend expected fields
        $mappedData = array_map(function($review) {
            // ReviewService returns arrays, not objects
            return (object) [
                'id' => $review['id'] ?? null,
                'trip_id' => $review['trip_id'] ?? null,
                'trip_title' => $review['trip_title'] ?? '',
                'trip_slug' => $review['trip_slug'] ?? '',
                'customer_name' => $review['author_name'] ?? '',
                'customer_email' => $review['author_email'] ?? '',
                'rating' => $review['rating'] ?? 0,
                'title' => $review['title'] ?? '',
                'content' => $review['content'] ?? '',
                'status' => $review['status'] ?? '',
                'verified' => false, // TODO: Add verified field to database
                'created_at' => $review['created_at'] ?? null,
            ];
        }, $result['data']);

        return new WP_REST_Response([
            'success' => true,
            'data' => $mappedData,
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
        $data = $this->mapAdminReviewPayload($request->get_json_params() ?? []);

        $result = $this->reviewService->updateReview($id, $data);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result);
    }

    /**
     * POST /reviews — Admin "Add New Review" endpoint.
     *
     * The admin React form posts the operator-curated fields here. This
     * path differs from `submitReview` (which the public review form uses)
     * in three ways:
     *
     *   1. No "already reviewed this trip" gate — admins should be able to
     *      enter reviews on behalf of customers without tripping the
     *      duplicate-prevention guard.
     *   2. Honours the operator-supplied `status` rather than deriving it
     *      from the `reviews.auto_approve` setting — the admin is the
     *      authority for whether the row is pending / approved / spam etc.
     *   3. Stamps `created_by` with the current admin user id so audits
     *      can attribute who added the review.
     */
    public function createReview(WP_REST_Request $request): WP_REST_Response
    {
        $data = $this->mapAdminReviewPayload($request->get_json_params() ?? []);

        // created_by is set here (controller) rather than in the service
        // so the service stays input-agnostic — service methods may also
        // be called from CLI / cron / tests where there's no current user.
        $data['created_by'] = get_current_user_id() ?: null;

        $result = $this->reviewService->createReviewAsAdmin($data);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result, 201);
    }

    /**
     * Translate the admin form's payload shape into the field names the
     * service + repository expect.
     *
     * The admin React form (resources/js/pages/ReviewForm.tsx) ships:
     *   - customer_name, customer_email, comment, verified, status
     *
     * The DB columns (and {@see ReviewRepository::prepareReviewData()})
     * speak:
     *   - author_name, author_email, content, status
     *   (no `verified` column exists yet — silently dropped)
     *
     * Doing this map at the controller layer keeps the service free of
     * UI-specific aliases, and means future UIs can either send the
     * legacy alias names or the canonical names with no double-mapping.
     *
     * @param array<string, mixed> $payload Raw JSON from the request.
     * @return array<string, mixed> Canonical, service-ready payload.
     */
    private function mapAdminReviewPayload(array $payload): array
    {
        // Field aliases: admin-side name → canonical DB-column name.
        $aliases = [
            'customer_name'  => 'author_name',
            'customer_email' => 'author_email',
            'comment'        => 'content',
        ];

        foreach ($aliases as $from => $to) {
            if (array_key_exists($from, $payload) && !array_key_exists($to, $payload)) {
                $payload[$to] = $payload[$from];
            }
            // Don't unset the alias — leaving both is harmless because
            // prepareReviewData ignores unknown keys, and it keeps the
            // payload introspectable in logs.
        }

        // `verified` has no column in wp_yatra_reviews yet. Drop it
        // explicitly so a future log of the payload doesn't suggest the
        // value was honoured.
        if (array_key_exists('verified', $payload)) {
            unset($payload['verified']);
        }

        // Clamp status to the actual enum. Anything else gets coerced to
        // 'pending' so we never write '' (the silent-truncation pit that
        // motivated the Upgrade_3_0_5 migration in the first place).
        if (array_key_exists('status', $payload)) {
            $allowed = ['pending', 'approved', 'rejected', 'spam', 'trash'];
            $status = is_string($payload['status']) ? $payload['status'] : '';
            $payload['status'] = in_array($status, $allowed, true) ? $status : 'pending';
        }

        return $payload;
    }

    /**
     * PUT /reviews/bulk - Bulk actions
     */
    public function bulkAction(WP_REST_Request $request): WP_REST_Response
    {
        $data   = $request->get_json_params();
        $action = $data['action'] ?? '';
        $ids    = $data['ids'] ?? [];

        if (empty($ids) || !is_array($ids)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('No items selected.', 'yatra'),
            ], 400);
        }

        switch ($action) {
            case 'delete':
                $result = $this->reviewService->bulkDelete($ids);
                break;
            case 'mark_approved':
                $result = $this->reviewService->bulkUpdateStatus($ids, 'approved');
                break;
            case 'mark_pending':
                $result = $this->reviewService->bulkUpdateStatus($ids, 'pending');
                break;
            case 'mark_spam':
                $result = $this->reviewService->bulkUpdateStatus($ids, 'spam');
                break;
            case 'mark_trash':
                $result = $this->reviewService->bulkUpdateStatus($ids, 'trash');
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
