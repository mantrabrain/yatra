<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\DifficultyLevelService;

/**
 * Difficulty Level REST API Controller
 */
class DifficultyLevelController extends BaseController
{
    /**
     * @var DifficultyLevelService
     */
    private DifficultyLevelService $service;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->service = new DifficultyLevelService();
    }

    /**
     * Register routes
     */
    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        $base = 'difficulty-levels';

        // Register collection route (GET /difficulty-levels, POST /difficulty-levels)
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
                        'default' => 'level_order',
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'order' => [
                        'default' => 'ASC',
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
                ],
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Register single item route (GET /difficulty-levels/{id}, PUT /difficulty-levels/{id}, DELETE /difficulty-levels/{id})
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
     * Check permissions for difficulty level endpoints
     */
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
                $has_permission = current_user_can('yatra_view_trips');
                break;
            
            case 'POST':
                $has_permission = current_user_can('yatra_edit_trips');
                break;
            
            case 'PUT':
            case 'PATCH':
                $has_permission = current_user_can('yatra_edit_trips');
                break;
            
            case 'DELETE':
                $has_permission = current_user_can('yatra_edit_trips');
                break;
            
            default:
                $has_permission = current_user_can('manage_options');
        }

        return $has_permission;
    }

    /**
     * Get items
     */
    public function get_items(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $per_page = absint($request->get_param('per_page') ?: 10);
            $page = absint($request->get_param('page') ?: 1);
            
            $allowed_order_by = ['id', 'name', 'slug', 'status', 'level_order', 'created_at', 'updated_at'];
            $orderby = $request->get_param('orderby') ?: 'level_order';
            $orderby = in_array($orderby, $allowed_order_by, true) ? $orderby : 'level_order';
            
            $order = strtoupper($request->get_param('order') ?: 'ASC');
            $order = in_array($order, ['ASC', 'DESC'], true) ? $order : 'ASC';
            
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

            $items = $this->service->getAll($args);
            $total = $this->service->count($args);

            // Prepare items with user names
            $prepared_items = array_map(function ($item) {
                $prepared = (array) $item;
                
                // Unserialize icon if needed
                if (isset($prepared['icon']) && is_string($prepared['icon'])) {
                    $prepared['icon'] = maybe_unserialize($prepared['icon']);
                }
                
                // Convert attachment ID to URL for images
                if (isset($prepared['icon'])) {
                    $prepared['icon'] = $this->convert_icon_attachment_id_to_url($prepared['icon']);
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

    /**
     * Get single item
     */
    public function get_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $item = $this->service->getById($id);

            if (!$item) {
                return $this->error_response('Difficulty level not found', 404);
            }

            $prepared = (array) $item;

            // Unserialize icon if needed
            if (isset($prepared['icon']) && is_string($prepared['icon'])) {
                $prepared['icon'] = maybe_unserialize($prepared['icon']);
            }
            
            // Convert attachment ID to URL for images
            if (isset($prepared['icon'])) {
                $prepared['icon'] = $this->convert_icon_attachment_id_to_url($prepared['icon']);
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

    /**
     * Create item
     */
    public function create_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $data = $request->get_json_params();
            $id = $this->service->create($data);

            return $this->success_response([
                'id' => $id,
                'message' => 'Difficulty level created successfully',
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return $this->error_response($e->getMessage(), 400);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Update item
     */
    public function update_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $data = $request->get_json_params();

            $result = $this->service->update($id, $data);

            if (!$result) {
                return $this->error_response('Failed to update difficulty level', 500);
            }

            return $this->success_response([
                'message' => 'Difficulty level updated successfully',
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->error_response($e->getMessage(), 400);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Delete item
     */
    public function delete_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $result = $this->service->delete($id);

            if (!$result) {
                return $this->error_response('Failed to delete difficulty level', 500);
            }

            return $this->success_response([
                'message' => 'Difficulty level deleted successfully',
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }
}

