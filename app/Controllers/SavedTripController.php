<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use Yatra\Services\SavedTripService;

/**
 * Saved Trip REST API Controller
 * 
 * Handles HTTP requests for saved trips/wishlist functionality.
 * 
 * @package Yatra\Controllers
 */
class SavedTripController extends BaseController
{
    private SavedTripService $savedTripService;

    public function __construct()
    {
        $this->savedTripService = new SavedTripService();
    }

    /**
     * Register routes
     */
    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        $base = 'saved-trips';

        // Check if trip is saved
        register_rest_route($namespace, '/' . $base . '/check/(?P<trip_id>\d+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'checkSaved'],
                'permission_callback' => [$this, 'checkUserPermission'],
            ],
        ]);

        // Save trip
        register_rest_route($namespace, '/' . $base, [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'saveTrip'],
                'permission_callback' => [$this, 'checkUserPermission'],
            ],
        ]);

        // Remove saved trip
        register_rest_route($namespace, '/' . $base . '/(?P<trip_id>\d+)', [
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'removeTrip'],
                'permission_callback' => [$this, 'checkUserPermission'],
            ],
        ]);

        // Get user's saved trips
        register_rest_route($namespace, '/' . $base, [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getSavedTrips'],
                'permission_callback' => [$this, 'checkUserPermission'],
            ],
        ]);
    }

    /**
     * Check user permission (must be logged in)
     */
    public function checkUserPermission(): bool
    {
        return is_user_logged_in();
    }

    /**
     * GET /saved-trips/check/{trip_id} - Check if trip is saved
     */
    public function checkSaved(WP_REST_Request $request): WP_REST_Response
    {
        $userId = get_current_user_id();
        $tripId = (int) $request->get_param('trip_id');

        $isSaved = $this->savedTripService->isSaved($userId, $tripId);

        return new WP_REST_Response([
            'success' => true,
            'data' => [
                'is_saved' => $isSaved,
            ],
        ]);
    }

    /**
     * POST /saved-trips - Save trip
     */
    public function saveTrip(WP_REST_Request $request): WP_REST_Response
    {
        $userId = get_current_user_id();
        $data = $request->get_json_params();
        
        // Debug: log received data
        error_log("Yatra SavedTripController: Received data: " . json_encode($data));
        error_log("Yatra SavedTripController: User ID: $userId");
        
        // Try multiple possible parameter names
        $tripId = 0;
        if (isset($data['trip_id'])) {
            $tripId = (int) $data['trip_id'];
        } elseif (isset($data['tripId'])) {
            $tripId = (int) $data['tripId'];
        } elseif (isset($data['id'])) {
            $tripId = (int) $data['id'];
        } elseif ($request->get_param('trip_id')) {
            $tripId = (int) $request->get_param('trip_id');
        }

        error_log("Yatra SavedTripController: Extracted trip ID: $tripId");

        if (!$tripId || $tripId <= 0) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Trip ID is required.', 'yatra'),
            ], 400);
        }

        // Verify trip ID is valid (must be > 0)
        // Note: User ID and Trip ID can be the same number (e.g., both 1), so we don't block that
        // Instead, we verify the trip exists in the database
        
        error_log("Yatra SavedTripController: Calling saveTrip with userId=$userId, tripId=$tripId");
        $result = $this->savedTripService->saveTrip($userId, $tripId);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result);
    }

    /**
     * DELETE /saved-trips/{trip_id} - Remove saved trip
     */
    public function removeTrip(WP_REST_Request $request): WP_REST_Response
    {
        $userId = get_current_user_id();
        $tripId = (int) $request->get_param('trip_id');

        $result = $this->savedTripService->removeTrip($userId, $tripId);

        if (!$result['success']) {
            return new WP_REST_Response($result, 400);
        }

        return new WP_REST_Response($result);
    }

    /**
     * GET /saved-trips - Get user's saved trips
     */
    public function getSavedTrips(WP_REST_Request $request): WP_REST_Response
    {
        $userId = get_current_user_id();

        $trips = $this->savedTripService->getUserSavedTrips($userId);

        return new WP_REST_Response([
            'success' => true,
            'data' => $trips,
        ]);
    }
}

