<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\TravelerCategoryService;

/**
 * Traveler Category REST API Controller
 * 
 * Endpoints:
 * - GET    /traveler-categories       - List traveler categories
 * - POST   /traveler-categories       - Create traveler category
 * - GET    /traveler-categories/{id}  - Get single traveler category
 * - PUT    /traveler-categories/{id}  - Update traveler category
 * - DELETE /traveler-categories/{id}  - Delete traveler category
 */
class TravelerCategoryController extends BaseController
{
    protected string $rest_base = 'traveler-categories';

    private TravelerCategoryService $service;

    public function __construct()
    {
        $this->service = new TravelerCategoryService();
    }

    public function register_routes(): void
    {
        $this->registerCrudRoutes($this->getStatusArg());
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

            $items = $this->service->getAll($args);
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
                return $this->not_found(__('Traveler category not found', 'yatra'));
            }

            return $this->success_response($this->prepareItem($item));
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
                'message' => __('Traveler category created successfully', 'yatra'),
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
                return $this->error_response(__('Failed to update traveler category', 'yatra'), 500);
            }

            return $this->success_response([
                'message' => __('Traveler category updated successfully', 'yatra'),
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
                return $this->error_response(__('Failed to delete traveler category', 'yatra'), 500);
            }

            return $this->success_response([
                'message' => __('Traveler category deleted successfully', 'yatra'),
            ]);
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
