<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\AvailabilityService;
use Yatra\Repositories\AvailabilityRepository;

/**
 * Availability REST API Controller
 * API endpoints for trip availability dates management
 */
class AvailabilityController extends BaseController
{
    private AvailabilityService $service;

    public function __construct()
    {
        $this->service = new AvailabilityService(new AvailabilityRepository());
    }

    /**
     * Register routes
     */
    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        $base = 'availability';

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
                    'month' => [
                        'type' => 'string',
                        'default' => 'all',
                    ],
                    'search' => [
                        'type' => 'string',
                        'default' => '',
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
    }

    /**
     * Get all availability dates for a trip
     */
    public function get_items(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $tripId = (int) $request->get_param('trip_id');
            
            if ($tripId <= 0) {
                return new WP_Error(
                    'invalid_trip_id',
                    'Valid trip_id is required',
                    ['status' => 400]
                );
            }

            $filters = [
                'status' => $request->get_param('status') ?? 'all',
                'month' => $request->get_param('month') ?? 'all',
                'search' => $request->get_param('search') ?? '',
                'page' => (int) ($request->get_param('page') ?? 1),
                'per_page' => (int) ($request->get_param('per_page') ?? 50),
            ];

            $items = $this->service->getByTripId($tripId, $filters);
            $total = $this->service->countByTripId($tripId, $filters);

            $data = array_map(function ($item) use ($request) {
                return $this->prepare_item_for_response($item, $request);
            }, $items);

            return new WP_REST_Response([
                'dates' => $data,
                'total' => $total,
                'page' => $filters['page'],
                'per_page' => $filters['per_page'],
            ], 200);
        } catch (\Exception $e) {
            return new WP_Error(
                'availability_fetch_error',
                $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    /**
     * Get single availability date
     */
    public function get_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $item = $this->service->find($id);

            if (!$item) {
                return new WP_Error(
                    'availability_not_found',
                    'Availability date not found',
                    ['status' => 404]
                );
            }

            return new WP_REST_Response($this->prepare_item_for_response($item, $request), 200);
        } catch (\Exception $e) {
            return new WP_Error(
                'availability_fetch_error',
                $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    /**
     * Create availability date
     */
    public function create_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $data = $request->get_json_params();
            
            if (empty($data)) {
                $data = $request->get_body_params();
            }

            $item = $this->service->create($data);

            return new WP_REST_Response($this->prepare_item_for_response($item, $request), 201);
        } catch (\InvalidArgumentException $e) {
            return new WP_Error(
                'validation_error',
                $e->getMessage(),
                ['status' => 400]
            );
        } catch (\Exception $e) {
            return new WP_Error(
                'availability_create_error',
                $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    /**
     * Update availability date
     */
    public function update_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $data = $request->get_json_params();
            
            if (empty($data)) {
                $data = $request->get_body_params();
            }

            $item = $this->service->update($id, $data);

            return new WP_REST_Response($this->prepare_item_for_response($item, $request), 200);
        } catch (\InvalidArgumentException $e) {
            return new WP_Error(
                'validation_error',
                $e->getMessage(),
                ['status' => 400]
            );
        } catch (\Exception $e) {
            return new WP_Error(
                'availability_update_error',
                $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    /**
     * Delete availability date
     */
    public function delete_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $this->service->delete($id);

            return new WP_REST_Response([
                'message' => 'Availability date deleted successfully',
                'id' => $id,
            ], 200);
        } catch (\InvalidArgumentException $e) {
            return new WP_Error(
                'validation_error',
                $e->getMessage(),
                ['status' => 400]
            );
        } catch (\Exception $e) {
            return new WP_Error(
                'availability_delete_error',
                $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    /**
     * Prepare item for response
     */
    protected function prepare_item_for_response($item, WP_REST_Request $request): array
    {
        $data = $item->toArray();
        
        // Format prices as strings for frontend
        if (isset($data['original_price'])) {
            $data['original_price'] = $data['original_price'] !== null ? number_format((float) $data['original_price'], 2, '.', '') : null;
        }
        if (isset($data['discounted_price'])) {
            $data['discounted_price'] = $data['discounted_price'] !== null ? number_format((float) $data['discounted_price'], 2, '.', '') : null;
        }
        if (isset($data['discount_percentage'])) {
            $data['discount_percentage'] = $data['discount_percentage'] !== null ? number_format((float) $data['discount_percentage'], 2, '.', '') : null;
        }
        
        // Ensure status matches frontend expectations
        if ($data['status'] === 'blocked' || !empty($data['is_blocked'])) {
            $data['status'] = 'blocked';
            $data['is_blocked'] = true;
        }
        
        return $data;
    }

    /**
     * Check permission
     */
    public function check_permission(?WP_REST_Request $request = null): bool
    {
        return current_user_can('manage_options');
    }
}

