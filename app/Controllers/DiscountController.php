<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\DiscountService;

/**
 * Discount REST API Controller
 */
class DiscountController extends BaseController
{
    private DiscountService $service;

    public function __construct()
    {
        $this->service = new DiscountService();
    }

    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        $base = 'discounts';

        register_rest_route($namespace, '/' . $base, [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'check_permission'],
                'args' => [
                    'page' => [
                        'default' => 1,
                        'sanitize_callback' => 'absint',
                    ],
                    'per_page' => [
                        'default' => 10,
                        'sanitize_callback' => 'absint',
                    ],
                    'orderby' => [
                        'default' => 'created_at',
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'order' => [
                        'default' => 'DESC',
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'search' => [
                        'default' => '',
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'status' => [
                        'default' => 'all',
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'type' => [
                        'default' => 'all',
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                ],
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

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

    public function check_permission(?WP_REST_Request $request = null): bool
    {
        if ($request === null) {
            return true;
        }

        if (!is_user_logged_in()) {
            return false;
        }

        if (current_user_can('manage_options')) {
            return true;
        }

        $method = $request->get_method();
        $has_permission = false;

        switch ($method) {
            case 'GET':
                $has_permission = current_user_can('yatra_view_bookings');
                break;
            
            case 'POST':
            case 'PUT':
            case 'PATCH':
            case 'DELETE':
                $has_permission = current_user_can('yatra_edit_bookings');
                break;
            
            default:
                $has_permission = current_user_can('manage_options');
        }

        return $has_permission;
    }

    public function get_items(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $per_page = absint($request->get_param('per_page') ?: 10);
            $page = absint($request->get_param('page') ?: 1);
            
            $allowed_order_by = ['id', 'code', 'type', 'amount', 'usage_count', 'expiry_date', 'status', 'created_at', 'updated_at'];
            $orderby = $request->get_param('orderby') ?: 'created_at';
            $orderby = in_array($orderby, $allowed_order_by, true) ? $orderby : 'created_at';
            
            $order = strtoupper($request->get_param('order') ?: 'DESC');
            $order = in_array($order, ['ASC', 'DESC'], true) ? $order : 'DESC';
            
            $args = [
                'limit' => $per_page,
                'offset' => ($page - 1) * $per_page,
                'order_by' => $orderby,
                'order' => $order,
            ];

            $search = $request->get_param('search');
            if ($search) {
                $args['search'] = sanitize_text_field($search);
            }

            $status = $request->get_param('status');
            if ($status) {
                $allowed_statuses = ['all', 'draft', 'publish', 'trash'];
                if (in_array($status, $allowed_statuses, true)) {
                    $args['status'] = $status;
                }
            }

            $type = $request->get_param('type');
            if ($type) {
                $allowed_types = ['all', 'percentage', 'fixed'];
                if (in_array($type, $allowed_types, true)) {
                    $args['type'] = $type;
                }
            }

            $items = $this->service->getAll($args);
            $total = $this->service->count($args);

            $prepared_items = array_map(function ($item) {
                $prepared = (array) $item;
                
                // Unserialize trip_ids
                if (isset($prepared['trip_ids']) && is_string($prepared['trip_ids'])) {
                    $prepared['trip_ids'] = maybe_unserialize($prepared['trip_ids']);
                }

                // Ensure boolean fields are properly converted
                $prepared['first_time_customer_only'] = (bool) ($prepared['first_time_customer_only'] ?? false);
                $prepared['is_group_discount'] = (bool) ($prepared['is_group_discount'] ?? false);
                
                // If group discount is disabled, ensure related fields are null
                if (!$prepared['is_group_discount']) {
                    $prepared['min_group_size'] = null;
                    $prepared['group_discount_type'] = null;
                    $prepared['group_discount_amount'] = null;
                }

                // Add user names
                if (!empty($prepared['created_by'])) {
                    $user = get_userdata((int) $prepared['created_by']);
                    $prepared['created_by_name'] = $user ? esc_html($user->display_name) : null;
                }

                if (!empty($prepared['updated_by'])) {
                    $user = get_userdata((int) $prepared['updated_by']);
                    $prepared['updated_by_name'] = $user ? esc_html($user->display_name) : null;
                }

                return $prepared;
            }, $items);

            return $this->success_response([
                'data' => $prepared_items,
                'total' => $total,
                'page' => (int) ($request->get_param('page') ?: 1),
                'per_page' => (int) ($request->get_param('per_page') ?: 10),
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    public function get_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $item = $this->service->getById($id);

            if (!$item) {
                return $this->error_response('Discount not found', 404);
            }

            $prepared = (array) $item;

            // Unserialize trip_ids
            if (isset($prepared['trip_ids']) && is_string($prepared['trip_ids'])) {
                $prepared['trip_ids'] = maybe_unserialize($prepared['trip_ids']);
            }

            // Ensure boolean fields are properly converted
            $prepared['first_time_customer_only'] = (bool) ($prepared['first_time_customer_only'] ?? false);
            $prepared['is_group_discount'] = (bool) ($prepared['is_group_discount'] ?? false);
            
            // If group discount is disabled, ensure related fields are null
            if (!$prepared['is_group_discount']) {
                $prepared['min_group_size'] = null;
                $prepared['group_discount_type'] = null;
                $prepared['group_discount_amount'] = null;
            }

            // Add user names
            if (!empty($prepared['created_by'])) {
                $user = get_userdata((int) $prepared['created_by']);
                $prepared['created_by_name'] = $user ? esc_html($user->display_name) : null;
            }

            if (!empty($prepared['updated_by'])) {
                $user = get_userdata((int) $prepared['updated_by']);
                $prepared['updated_by_name'] = $user ? esc_html($user->display_name) : null;
            }

            return $this->success_response($prepared);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    public function create_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $data = $request->get_json_params();
            $id = $this->service->create($data);

            return $this->success_response([
                'id' => $id,
                'message' => 'Discount created successfully',
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return $this->error_response($e->getMessage(), 400);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    public function update_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $data = $request->get_json_params();

            $result = $this->service->update($id, $data);

            if (!$result) {
                return $this->error_response('Failed to update discount', 500);
            }

            return $this->success_response([
                'message' => 'Discount updated successfully',
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->error_response($e->getMessage(), 400);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    public function delete_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $result = $this->service->delete($id);

            if (!$result) {
                return $this->error_response('Failed to delete discount', 500);
            }

            return $this->success_response([
                'message' => 'Discount deleted successfully',
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }
}

