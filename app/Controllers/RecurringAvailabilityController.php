<?php
/**
 * Recurring Availability REST API Controller
 * API endpoints for recurring availability rules management
 * 
 * This is a FREE feature - no Pro plugin required
 * 
 * @package Yatra\Controllers
 * @since 3.0.0
 */

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\RecurringAvailabilityService;
use Yatra\Repositories\RecurringAvailabilityRepository;

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

        // Status counts endpoint
        register_rest_route($namespace, '/' . $base . '/counts', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_counts'],
                'permission_callback' => [$this, 'check_permission'],
                'args' => [
                    'trip_id' => [
                        'required' => true,
                        'type' => 'integer',
                        'validate_callback' => function ($param) {
                            return is_numeric($param) && $param > 0;
                        },
                    ],
                ],
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
     * Get status counts for recurring rules
     */
    public function get_counts(WP_REST_Request $request)
    {
        try {
            $tripId = (int) $request->get_param('trip_id');
            
            $counts = $this->service->getStatusCounts($tripId);
            
            return new WP_REST_Response($counts, 200);
        } catch (\Exception $e) {
            return new WP_Error('error', $e->getMessage(), ['status' => 500]);
        }
    }

    /**
     * Get all rules for a trip
     */
    public function get_items(WP_REST_Request $request)
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

            return new WP_REST_Response([
                'data' => $items,
                'total' => $total,
                'pages' => ceil($total / ($filters['per_page'] ?: 1)),
                'page' => (int) $filters['page'],
                'per_page' => (int) $filters['per_page'],
            ], 200);
        } catch (\Exception $e) {
            return new WP_Error('error', $e->getMessage(), ['status' => 500]);
        }
    }

    /**
     * Get single rule
     */
    public function get_item(WP_REST_Request $request)
    {
        try {
            $id = (int) $request->get_param('id');
            $item = $this->service->find($id);

            if (!$item) {
                return new WP_Error('not_found', 'Rule not found', ['status' => 404]);
            }

            // Add preview data
            $preview = $this->service->previewDates((array) $item, 20);
            $item->preview = $preview;

            return new WP_REST_Response(['data' => $item], 200);
        } catch (\Exception $e) {
            return new WP_Error('error', $e->getMessage(), ['status' => 500]);
        }
    }

    /**
     * Create new rule
     */
    public function create_item(WP_REST_Request $request)
    {
        try {
            $data = $request->get_json_params();
            
            if (empty($data)) {
                $data = $request->get_body_params();
            }

            $id = $this->service->create($data);

            return new WP_REST_Response([
                'id' => $id,
                'message' => __('Recurring rule created successfully', 'yatra'),
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return new WP_Error('validation_error', $e->getMessage(), ['status' => 400]);
        } catch (\Exception $e) {
            return new WP_Error('error', $e->getMessage(), ['status' => 500]);
        }
    }

    /**
     * Update rule
     */
    public function update_item(WP_REST_Request $request)
    {
        try {
            $id = (int) $request->get_param('id');
            $data = $request->get_json_params();
            
            if (empty($data)) {
                $data = $request->get_body_params();
            }

            $existing = $this->service->find($id);
            if (!$existing) {
                return new WP_Error('not_found', 'Rule not found', ['status' => 404]);
            }

            $success = $this->service->update($id, $data);

            if (!$success) {
                return new WP_Error('error', 'Failed to update rule', ['status' => 500]);
            }

            return new WP_REST_Response([
                'message' => __('Recurring rule updated successfully', 'yatra'),
            ], 200);
        } catch (\InvalidArgumentException $e) {
            return new WP_Error('validation_error', $e->getMessage(), ['status' => 400]);
        } catch (\Exception $e) {
            return new WP_Error('error', $e->getMessage(), ['status' => 500]);
        }
    }

    /**
     * Delete rule
     */
    public function delete_item(WP_REST_Request $request)
    {
        try {
            $id = (int) $request->get_param('id');

            $existing = $this->service->find($id);
            if (!$existing) {
                return new WP_Error('not_found', 'Rule not found', ['status' => 404]);
            }

            $success = $this->service->delete($id);

            if (!$success) {
                return new WP_Error('error', 'Failed to delete rule', ['status' => 500]);
            }

            return new WP_REST_Response([
                'message' => __('Recurring rule deleted successfully', 'yatra'),
            ], 200);
        } catch (\Exception $e) {
            return new WP_Error('error', $e->getMessage(), ['status' => 500]);
        }
    }

    /**
     * Preview generated dates from rule data
     */
    public function preview_dates(WP_REST_Request $request)
    {
        try {
            $data = $request->get_json_params();
            
            if (empty($data)) {
                $data = $request->get_body_params();
            }

            if (empty($data['rule_type']) || empty($data['start_date'])) {
                return new WP_Error('validation_error', 'Rule type and start date are required for preview', ['status' => 400]);
            }

            $limit = (int) ($data['preview_limit'] ?? 20);
            $preview = $this->service->previewDates($data, $limit);

            return new WP_REST_Response(['data' => $preview], 200);
        } catch (\Exception $e) {
            return new WP_Error('error', $e->getMessage(), ['status' => 500]);
        }
    }

    /**
     * Generate dates for a trip from all active rules
     */
    public function generate_dates(WP_REST_Request $request)
    {
        try {
            $tripId = (int) $request->get_param('trip_id');
            
            $fromDate = $request->get_param('from_date') ?: date('Y-m-d');
            $toDate = $request->get_param('to_date') ?: date('Y-m-d', strtotime('+90 days'));

            $dates = $this->service->generateDatesForTrip($tripId, $fromDate, $toDate);

            return new WP_REST_Response([
                'data' => $dates,
                'total' => count($dates),
                'from_date' => $fromDate,
                'to_date' => $toDate,
            ], 200);
        } catch (\Exception $e) {
            return new WP_Error('error', $e->getMessage(), ['status' => 500]);
        }
    }

    /**
     * Recurring availability writes — trip-edits cap. Same gate as the
     * other availability controllers. WP admins pass via the Team
     * module's admin-fallback filter.
     */
    public function check_permission(?\WP_REST_Request $request = null): bool
    {
        return current_user_can('yatra_edit_trips');
    }
}

