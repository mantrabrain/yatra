<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\ItemTypeService;

/**
 * Item Type REST API Controller
 */
class ItemTypeController extends BaseController
{
    /**
     * @var ItemTypeService
     */
    private ItemTypeService $service;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->service = new ItemTypeService();
    }

    /**
     * Register routes
     */
    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        $base = 'item-types';

        // Register collection route (GET /item-types, POST /item-types)
        $result1 = register_rest_route($namespace, '/' . $base, [
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
                        'default' => 'id',
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
                ],
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Register single item route (GET /item-types/{id}, PUT /item-types/{id}, DELETE /item-types/{id})
        $result2 = register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)', [
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

        // Debug: Log registration results
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: ItemType routes registration - Collection: ' . ($result1 ? 'SUCCESS' : 'FAILED'));
            error_log('Yatra: ItemType routes registration - Single: ' . ($result2 ? 'SUCCESS' : 'FAILED'));
        }
    }

    /**
     * Check permissions for item type endpoints
     */
    public function check_permission(?WP_REST_Request $request = null): bool
    {
        // During route registration, $request might be null - allow registration to proceed
        if ($request === null) {
            return true;
        }

        // Debug: Log all permission checks
        if (defined('WP_DEBUG') && WP_DEBUG) {
            $route = $request->get_route();
            $cleanRoute = strtok($route, '?');
            error_log(sprintf(
                'Yatra: Permission check for %s %s (clean: %s) - User ID: %d, Logged in: %s',
                $request->get_method(),
                $route,
                $cleanRoute,
                get_current_user_id(),
                is_user_logged_in() ? 'yes' : 'no'
            ));
        }

        // Check if user is logged in
        if (!is_user_logged_in()) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Yatra: Permission denied - user not logged in');
            }
            return false;
        }

        // Always allow users with manage_options (admins)
        if (current_user_can('manage_options')) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Yatra: Permission granted - user has manage_options');
            }
            return true;
        }

        // Get the request method to determine required capability
        $method = $request->get_method();
        $has_permission = false;

        switch ($method) {
            case 'GET':
                // View item types requires yatra_view_trips capability
                $has_permission = current_user_can('yatra_view_trips');
                break;
            
            case 'POST':
                // Create item type requires yatra_edit_trips capability
                $has_permission = current_user_can('yatra_edit_trips');
                break;
            
            case 'PUT':
            case 'PATCH':
                // Update item type requires yatra_edit_trips capability
                $has_permission = current_user_can('yatra_edit_trips');
                break;
            
            case 'DELETE':
                // Delete item type requires yatra_edit_trips capability
                $has_permission = current_user_can('yatra_edit_trips');
                break;
            
            default:
                // Default to manage_options for unknown methods
                $has_permission = current_user_can('manage_options');
        }

        // Debug logging
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(sprintf(
                'Yatra: Permission %s for %s %s - User ID: %d, Has yatra_edit_trips: %s, Has yatra_view_trips: %s, Has manage_options: %s',
                $has_permission ? 'granted' : 'denied',
                $method,
                $request->get_route(),
                get_current_user_id(),
                current_user_can('yatra_edit_trips') ? 'yes' : 'no',
                current_user_can('yatra_view_trips') ? 'yes' : 'no',
                current_user_can('manage_options') ? 'yes' : 'no'
            ));
        }

        return $has_permission;
    }

    /**
     * Get items
     */
    public function get_items(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra: get_items called for route: ' . $request->get_route());
        }

        try {
            // Sanitize pagination parameters
            $per_page = absint($request->get_param('per_page') ?: 10);
            $page = absint($request->get_param('page') ?: 1);
            
            // Sanitize order_by - only allow safe column names
            $allowed_order_by = ['id', 'name', 'slug', 'status', 'created_at', 'updated_at'];
            $orderby = $request->get_param('orderby') ?: 'id';
            $orderby = in_array($orderby, $allowed_order_by, true) ? $orderby : 'id';
            
            // Sanitize order direction
            $order = strtoupper($request->get_param('order') ?: 'DESC');
            $order = in_array($order, ['ASC', 'DESC'], true) ? $order : 'DESC';
            
            $args = [
                'limit' => $per_page,
                'offset' => ($page - 1) * $per_page,
                'order_by' => $orderby,
                'order' => $order,
            ];

            // Sanitize and add search
            $search = $request->get_param('search');
            if ($search) {
                $args['search'] = sanitize_text_field($search);
            }

            // Sanitize and add status filter
            $status = $request->get_param('status');
            if ($status) {
                $allowed_statuses = ['all', 'draft', 'publish', 'trash'];
                if (in_array($status, $allowed_statuses, true)) {
                    $args['status'] = $status;
                }
            }

            $items = $this->service->getAll($args);
            $total = $this->service->count($args);

            // Get repository to count items
            $repository = $this->service->getRepositoryInstance();

            // Prepare items with user names and items count
            $prepared_items = array_map(function ($item) use ($repository) {
                $prepared = (array) $item;
                
                // Unserialize icon if needed
                if (isset($prepared['icon']) && is_string($prepared['icon'])) {
                    $prepared['icon'] = maybe_unserialize($prepared['icon']);
                }

                // Add user names (escaped for output)
                if (!empty($prepared['created_by'])) {
                    $user = get_userdata((int) $prepared['created_by']);
                    $prepared['created_by_name'] = $user ? esc_html($user->display_name) : null;
                }

                if (!empty($prepared['updated_by'])) {
                    $user = get_userdata((int) $prepared['updated_by']);
                    $prepared['updated_by_name'] = $user ? esc_html($user->display_name) : null;
                }

                // Calculate items count for this item type
                if (!empty($prepared['id'])) {
                    $prepared['items_count'] = $repository->countItemsByType((int) $prepared['id']);
                } else {
                    $prepared['items_count'] = 0;
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
                return $this->error_response('Item type not found', 404);
            }

            $prepared = (array) $item;

            // Unserialize icon if needed
            if (isset($prepared['icon']) && is_string($prepared['icon'])) {
                $prepared['icon'] = maybe_unserialize($prepared['icon']);
            }

            // Add user names (escaped for output)
            if (!empty($prepared['created_by'])) {
                $user = get_userdata((int) $prepared['created_by']);
                $prepared['created_by_name'] = $user ? esc_html($user->display_name) : null;
            }

            if (!empty($prepared['updated_by'])) {
                $user = get_userdata((int) $prepared['updated_by']);
                $prepared['updated_by_name'] = $user ? esc_html($user->display_name) : null;
            }

            // Calculate items count for this item type
            $repository = $this->service->getRepositoryInstance();
            if (!empty($prepared['id'])) {
                $prepared['items_count'] = $repository->countItemsByType((int) $prepared['id']);
            } else {
                $prepared['items_count'] = 0;
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
                'message' => 'Item type created successfully',
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
                return $this->error_response('Failed to update item type', 500);
            }

            return $this->success_response([
                'message' => 'Item type updated successfully',
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
                return $this->error_response('Failed to delete item type', 500);
            }

            return $this->success_response([
                'message' => 'Item type deleted successfully',
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }
}

