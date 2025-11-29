<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\RecurringAvailabilityService;
use Yatra\Repositories\RecurringAvailabilityRepository;

/**
 * Recurring Availability REST API Controller
 * API endpoints for recurring availability rules management
 */
class RecurringAvailabilityController extends BaseController
{
    private RecurringAvailabilityService $service;

    public function __construct()
    {
        $this->service = new RecurringAvailabilityService(new RecurringAvailabilityRepository());
    }

    /**
     * Register routes
     */
    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        $base = 'recurring-availability';

        // Collection routes
        register_rest_route($namespace, '/' . $base, [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'check_permission'],
                'args' => [
                    'trip_id' => [
                        'required' => true,
                        'type' => 'integer',
                        'validate_callback' => function ($param) {
                            return is_numeric($param) && $param > 0;
                        },
                    ],
                    'status' => [
                        'type' => 'string',
                        'default' => 'all',
                    ],
                    'rule_type' => [
                        'type' => 'string',
                        'default' => 'all',
                    ],
                    'page' => [
                        'type' => 'integer',
                        'default' => 1,
                        'minimum' => 1,
                    ],
                    'per_page' => [
                        'type' => 'integer',
                        'default' => 50,
                        'minimum' => 1,
                        'maximum' => 100,
                    ],
                ],
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Single item routes
        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'check_permission'],
            ],
            [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_item'],
                'permission_callback' => [$this, 'check_permission'],
            ],
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_item'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Preview generated dates
        register_rest_route($namespace, '/' . $base . '/preview', [
            'methods' => \WP_REST_Server::CREATABLE,
            'callback' => [$this, 'preview_dates'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        // Generate dates for a trip
        register_rest_route($namespace, '/' . $base . '/generate/(?P<trip_id>[\d]+)', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [$this, 'generate_dates'],
            'permission_callback' => [$this, 'check_permission'],
            'args' => [
                'from_date' => [
                    'type' => 'string',
                    'default' => '',
                ],
                'to_date' => [
                    'type' => 'string',
                    'default' => '',
                ],
            ],
        ]);
    }

    /**
     * Get all rules for a trip
     */
    public function get_items(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $tripId = (int) $request->get_param('trip_id');
            
            $filters = [
                'status' => $request->get_param('status') ?? 'all',
                'rule_type' => $request->get_param('rule_type') ?? 'all',
                'search' => $request->get_param('search') ?? '',
                'page' => $request->get_param('page') ?? 1,
                'per_page' => $request->get_param('per_page') ?? 50,
            ];

            $items = $this->service->getByTripId($tripId, $filters);
            $total = $this->service->countByTripId($tripId, $filters);
            
            // Add generated dates count to each rule
            foreach ($items as &$item) {
                $preview = $this->service->previewDates((array) $item, 0);
                $item->generated_count = $preview['total'];
            }

            return $this->success_response([
                'data' => $items,
                'total' => $total,
                'pages' => ceil($total / ($filters['per_page'] ?: 1)),
                'page' => (int) $filters['page'],
                'per_page' => (int) $filters['per_page'],
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get single rule
     */
    public function get_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $item = $this->service->find($id);

            if (!$item) {
                return $this->error_response('Rule not found', 404);
            }

            // Add preview data
            $preview = $this->service->previewDates((array) $item, 20);
            $item->preview = $preview;

            return $this->success_response($item);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Create new rule
     */
    public function create_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $data = $request->get_json_params();
            
            if (empty($data)) {
                $data = $request->get_body_params();
            }

            $id = $this->service->create($data);

            return $this->success_response([
                'id' => $id,
                'message' => __('Recurring rule created successfully', 'yatra'),
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return $this->error_response($e->getMessage(), 400);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Update rule
     */
    public function update_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $data = $request->get_json_params();
            
            if (empty($data)) {
                $data = $request->get_body_params();
            }

            // Check if exists
            $existing = $this->service->find($id);
            if (!$existing) {
                return $this->error_response('Rule not found', 404);
            }

            $success = $this->service->update($id, $data);

            if (!$success) {
                return $this->error_response('Failed to update rule', 500);
            }

            return $this->success_response([
                'message' => __('Recurring rule updated successfully', 'yatra'),
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->error_response($e->getMessage(), 400);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Delete rule
     */
    public function delete_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');

            // Check if exists
            $existing = $this->service->find($id);
            if (!$existing) {
                return $this->error_response('Rule not found', 404);
            }

            $success = $this->service->delete($id);

            if (!$success) {
                return $this->error_response('Failed to delete rule', 500);
            }

            return $this->success_response([
                'message' => __('Recurring rule deleted successfully', 'yatra'),
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Preview generated dates from rule data
     */
    public function preview_dates(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $data = $request->get_json_params();
            
            if (empty($data)) {
                $data = $request->get_body_params();
            }

            // Validate required fields
            if (empty($data['rule_type']) || empty($data['start_date'])) {
                return $this->error_response('Rule type and start date are required for preview', 400);
            }

            $limit = (int) ($data['preview_limit'] ?? 20);
            $preview = $this->service->previewDates($data, $limit);

            return $this->success_response($preview);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Generate dates for a trip from all active rules
     */
    public function generate_dates(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $tripId = (int) $request->get_param('trip_id');
            
            $fromDate = $request->get_param('from_date') ?: date('Y-m-d');
            $toDate = $request->get_param('to_date') ?: date('Y-m-d', strtotime('+90 days'));

            $dates = $this->service->generateDatesForTrip($tripId, $fromDate, $toDate);

            return $this->success_response([
                'data' => $dates,
                'total' => count($dates),
                'from_date' => $fromDate,
                'to_date' => $toDate,
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Check if user has permission
     */
    public function check_permission(?\WP_REST_Request $request = null): bool
    {
        return current_user_can('manage_options');
    }
}

