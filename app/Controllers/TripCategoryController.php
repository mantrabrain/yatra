<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\TripCategoryService;

/**
 * Trip Category REST API Controller
 * 
 * Endpoints:
 * - GET    /trip-categories                   - List categories
 * - POST   /trip-categories                   - Create category
 * - GET    /trip-categories/{id}              - Get single category
 * - PUT    /trip-categories/{id}              - Update category
 * - DELETE /trip-categories/{id}              - Delete category
 * - GET    /trip-categories/{id}/subcategories - Get subcategories
 */
class TripCategoryController extends BaseController
{
    protected string $rest_base = 'trip-categories';

    private TripCategoryService $service;

    public function __construct()
    {
        $this->service = new TripCategoryService();
    }

    public function register_routes(): void
    {
        // Register CRUD routes with additional args
        $this->registerCrudRoutes(array_merge(
            $this->getStatusArg(),
            [
                'hierarchical' => [
                    'default' => false,
                    'sanitize_callback' => 'rest_sanitize_boolean',
                ],
                'parent_id' => [
                    'default' => null,
                    'sanitize_callback' => 'absint',
                ],
            ]
        ));

        // Additional route: Get subcategories
        $this->registerRoute('/' . $this->rest_base . '/(?P<id>[\d]+)/subcategories', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_subcategories'],
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

        return match ($request->get_method()) {
            'GET' => current_user_can('yatra_view_trips'),
            'POST', 'PUT', 'PATCH', 'DELETE' => current_user_can('yatra_edit_trips'),
            default => current_user_can('manage_options'),
        };
    }

    public function get_items(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $params = $this->getPaginationParams($request);

            $args = [
                'limit' => $params['per_page'],
                'offset' => ($params['page'] - 1) * $params['per_page'],
                'order_by' => $params['orderby'],
                'order' => $params['order'],
            ];

            if (!empty($params['search'])) {
                $args['search'] = $params['search'];
            }

            $status = $request->get_param('status');
            if ($status && $status !== 'all') {
                $args['status'] = sanitize_text_field($status);
            }

            // Handle hierarchical and parent_id
            $hierarchical = $request->get_param('hierarchical');
            if ($hierarchical) {
                $items = $this->service->getHierarchical($args);
            } else {
                $parent_id = $request->get_param('parent_id');
                if ($parent_id !== null) {
                    $items = $this->service->getSubcategories((int) $parent_id, $args);
                } else {
                    $items = $this->service->getAll($args);
                }
            }

            $total = $this->service->count($args);

            $prepared = array_map([$this, 'prepareItem'], $items);

            return $this->paginated_response($prepared, $total, $params['page'], $params['per_page']);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    public function get_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $item = $this->service->getById($this->getId($request));

            if (!$item) {
                return $this->not_found(__('Category not found', 'yatra'));
            }

            return $this->success_response($this->prepareItem($item));
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    public function get_subcategories(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $subcategories = $this->service->getSubcategories($this->getId($request));

            $prepared = array_map([$this, 'prepareItem'], $subcategories);

            return $this->success_response($prepared);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    public function create_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = $this->service->create($this->getBody($request));

            return $this->success_response([
                'id' => $id,
                'message' => __('Category created successfully', 'yatra'),
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return $this->validation_error($e->getMessage());
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    public function update_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $result = $this->service->update($this->getId($request), $this->getBody($request));

            if (!$result) {
                return $this->error_response(__('Failed to update category', 'yatra'), 500);
            }

            return $this->success_response([
                'message' => __('Category updated successfully', 'yatra'),
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->validation_error($e->getMessage());
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    public function delete_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $result = $this->service->delete($this->getId($request));

            if (!$result) {
                return $this->error_response(__('Failed to delete category', 'yatra'), 500);
            }

            return $this->success_response([
                'message' => __('Category deleted successfully', 'yatra'),
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->validation_error($e->getMessage());
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    private function prepareItem($item): array
    {
        $prepared = (array) $item;

        if (isset($prepared['icon']) && is_string($prepared['icon'])) {
            $prepared['icon'] = maybe_unserialize($prepared['icon']);
        }
        if (isset($prepared['icon'])) {
            $prepared['icon'] = $this->convert_icon_attachment_id_to_url($prepared['icon']);
        }

        // Add parent name
        if (!empty($prepared['parent_id'])) {
            $parent = $this->service->getById((int) $prepared['parent_id']);
            $prepared['parent_name'] = $parent ? $parent->name : null;
        }

        if (!empty($prepared['created_by'])) {
            $user = get_userdata((int) $prepared['created_by']);
            $prepared['created_by_name'] = $user ? esc_html($user->display_name) : null;
        }

        if (!empty($prepared['updated_by'])) {
            $user = get_userdata((int) $prepared['updated_by']);
            $prepared['updated_by_name'] = $user ? esc_html($user->display_name) : null;
        }

        return $prepared;
    }
}
