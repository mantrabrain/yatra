<?php

declare(strict_types=1);

namespace Yatra\Api;

use Yatra\Models\Activity;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

class ActivitiesApi
{
    public function __construct()
    {
        add_action('rest_api_init', [$this, 'registerRoutes']);
    }

    public function registerRoutes(): void
    {
        register_rest_route('yatra/v1', '/activities', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'getActivities'],
                'permission_callback' => [$this, 'checkPermissions'],
            ],
            [
                'methods' => 'POST',
                'callback' => [$this, 'createActivity'],
                'permission_callback' => [$this, 'checkPermissions'],
            ],
        ]);

        register_rest_route('yatra/v1', '/activities/(?P<id>\d+)', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'getActivity'],
                'permission_callback' => [$this, 'checkPermissions'],
            ],
            [
                'methods' => 'PUT',
                'callback' => [$this, 'updateActivity'],
                'permission_callback' => [$this, 'checkPermissions'],
            ],
            [
                'methods' => 'DELETE',
                'callback' => [$this, 'deleteActivity'],
                'permission_callback' => [$this, 'checkPermissions'],
            ],
        ]);
    }

    public function checkPermissions(): bool
    {
        return current_user_can('manage_options');
    }

    public function getActivities(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $activities = Activity::getAll();
            return new WP_REST_Response([
                'success' => true,
                'data' => $activities
            ], 200);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getActivity(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            $activity = Activity::getById($id);
            
            if (!$activity) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => 'Activity not found'
                ], 404);
            }

            return new WP_REST_Response([
                'success' => true,
                'data' => $activity
            ], 200);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function createActivity(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $params = $request->get_params();
            
            // Validate required fields
            if (empty($params['name'])) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => 'Activity name is required'
                ], 400);
            }

            // Pass form data directly to the model for processing
            $data = [
                'name' => sanitize_text_field($params['name'] ?? ''),
                'description' => sanitize_textarea_field($params['description'] ?? ''),
                'duration' => sanitize_text_field($params['duration'] ?? ''),
                'category' => sanitize_text_field($params['category'] ?? ''),
                'icon' => sanitize_text_field($params['icon'] ?? ''),
                'difficulty' => sanitize_text_field($params['difficulty'] ?? 'Easy'),
                'status' => 'active'
            ];

            $activity = Activity::createActivity($data);
            
            if (!$activity) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => 'Failed to create activity'
                ], 500);
            }

            return new WP_REST_Response([
                'success' => true,
                'message' => 'Activity created successfully',
                'data' => $activity
            ], 201);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function updateActivity(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            $params = $request->get_params();
            
            // Validate required fields
            if (empty($params['name'])) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => 'Activity name is required'
                ], 400);
            }

            // Pass form data directly to the model for processing
            $data = [
                'name' => sanitize_text_field($params['name'] ?? ''),
                'description' => sanitize_textarea_field($params['description'] ?? ''),
                'duration' => sanitize_text_field($params['duration'] ?? ''),
                'category' => sanitize_text_field($params['category'] ?? ''),
                'icon' => sanitize_text_field($params['icon'] ?? ''),
                'difficulty' => sanitize_text_field($params['difficulty'] ?? 'Easy'),
                'status' => 'active'
            ];

            $result = Activity::updateActivity($id, $data);
            
            if (!$result) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => 'Failed to update activity'
                ], 500);
            }

            return new WP_REST_Response([
                'success' => true,
                'message' => 'Activity updated successfully',
                'data' => $result
            ], 200);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteActivity(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            
            if (!$id) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => 'Invalid activity ID'
                ], 400);
            }

            $result = Activity::deleteActivity($id);
            
            if (!$result) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => 'Failed to delete activity'
                ], 500);
            }

            return new WP_REST_Response([
                'success' => true,
                'message' => 'Activity deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
} 