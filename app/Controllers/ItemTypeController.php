<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\ItemTypeService;
use Yatra\Repositories\BaseRepository;

/**
 * Item Type REST API Controller
 * 
 * Endpoints:
 * - GET    /item-types       - List item types
 * - POST   /item-types       - Create item type
 * - GET    /item-types/{id}  - Get single item type
 * - PUT    /item-types/{id}  - Update item type
 * - DELETE /item-types/{id}  - Delete item type
 */
class ItemTypeController extends BaseController
{
    protected string $rest_base = 'item-types';

    private ItemTypeService $service;

    public function __construct()
    {
        $this->service = new ItemTypeService();
    }

    public function register_routes(): void
    {
        $this->registerCrudRoutes($this->getStatusArg());

        // Status statistics for admin views (All / Published / Draft / Trash)
        register_rest_route($this->namespace, '/' . $this->rest_base . '/stats', [
            [
                'methods'  => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getStats'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);
    }

    /**
     * GET /item-types/stats
     * Return stable status counts for admin list views.
     */
    public function getStats(WP_REST_Request $request)
    {
        try {
            $stats = $this->service->getStatusCounts();
            return $this->success_response($stats);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
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

        switch ($request->get_method()) {
            case 'GET':
                return current_user_can('yatra_view_trips');
            case 'POST':
            case 'PUT':
            case 'PATCH':
            case 'DELETE':
                return current_user_can('yatra_edit_trips');
            default:
                return current_user_can('manage_options');
        }
    }

    public function get_items(WP_REST_Request $request)
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

            $repository = $this->service->getRepositoryInstance();
            $prepared = array_map(fn($item) => $this->prepareItem($item, $repository), $items);

            return $this->paginated_response($prepared, $total, $params['page'], $params['per_page']);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    public function get_item(WP_REST_Request $request)
    {
        try {
            $item = $this->service->getById($this->getId($request));

            if (!$item) {
                return $this->not_found(__('Item type not found', 'yatra'));
            }

            $repository = $this->service->getRepositoryInstance();
            return $this->success_response($this->prepareItem($item, $repository));
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    public function create_item(WP_REST_Request $request)
    {
        try {
            $id = $this->service->create($this->getBody($request));

            // Get the created item type to return full data
            $repository = $this->service->getRepositoryInstance();
            $itemType = $repository->find($id);

            return $this->success_response([
                'id' => $id,
                'message' => __('Item type created successfully', 'yatra'),
                'data' => $itemType,
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return $this->validation_error($e->getMessage());
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    public function update_item(WP_REST_Request $request)
    {
        try {
            $result = $this->service->update($this->getId($request), $this->getBody($request));

            if (!$result) {
                return $this->error_response(__('Failed to update item type', 'yatra'), 500);
            }

            return $this->success_response([
                'message' => __('Item type updated successfully', 'yatra'),
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->validation_error($e->getMessage());
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    public function delete_item(WP_REST_Request $request)
    {
        try {
            $result = $this->service->delete($this->getId($request));

            if (!$result) {
                return $this->error_response(__('Failed to delete item type', 'yatra'), 500);
            }

            return $this->success_response([
                'message' => __('Item type deleted successfully', 'yatra'),
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    private function prepareItem($item, ?BaseRepository $repository = null): array
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

        // Add items count
        if ($repository && !empty($prepared['id'])) {
            $prepared['items_count'] = $repository->countItemsByType((int) $prepared['id']);
        } else {
            $prepared['items_count'] = 0;
        }

        return $prepared;
    }
}
