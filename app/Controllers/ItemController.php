<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\ItemService;
use Yatra\Repositories\ItemTypeRepository;
use Yatra\Repositories\ItemRepository;

/**
 * Item REST API Controller
 * 
 * Endpoints:
 * - GET    /items       - List items
 * - POST   /items       - Create item
 * - GET    /items/{id}  - Get single item
 * - PUT    /items/{id}  - Update item
 * - DELETE /items/{id}  - Delete item
 */
class ItemController extends BaseController
{
    protected string $rest_base = 'items';

    private ItemService $service;
    private ItemTypeRepository $itemTypeRepository;
    private ItemRepository $repository;

    public function __construct()
    {
        $this->service = new ItemService();
        $this->itemTypeRepository = new ItemTypeRepository();
        $this->repository = new ItemRepository();
    }

    public function register_routes(): void
    {
        $this->registerCrudRoutes(array_merge(
            $this->getStatusArg(),
            [
                'type_id' => [
                    'default' => 'all',
                    'sanitize_callback' => 'absint',
                ],
            ]
        ));

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
     * GET /items/stats
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

            $type_id = $request->get_param('type_id');
            if ($type_id && $type_id !== 'all') {
                $args['type_id'] = absint($type_id);
            }

            $status = $request->get_param('status');
            if ($status && $status !== 'all') {
                $args['status'] = sanitize_text_field($status);
            }

            $items = $this->service->getAll($args);
            $total = $this->service->count($args);

            $prepared = array_map([$this, 'prepareItem'], $items);

            // Get available item types for filter dropdown
            $all_types = $this->itemTypeRepository->all(['where' => ['status' => 'publish']]);
            $available_types = array_map(function ($type) {
                return [
                    'id' => (int) $type->id,
                    'name' => esc_html($type->name),
                ];
            }, $all_types);

            return new \WP_REST_Response([
                'data' => $prepared,
                'total' => $total,
                'page' => $params['page'],
                'per_page' => $params['per_page'],
                'total_pages' => (int) ceil($total / $params['per_page']),
                'meta' => [
                    'available_types' => array_values($available_types),
                ],
            ], 200);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    public function get_item(WP_REST_Request $request)
    {
        try {
            $item = $this->service->getById($this->getId($request));

            if (!$item) {
                return $this->not_found(__('Item not found', 'yatra'));
            }

            return $this->success_response($this->prepareItem($item));
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    public function create_item(WP_REST_Request $request)
    {
        try {
            $id = $this->service->create($this->getBody($request));

            // Get the created item to return full data
            $item = $this->service->getById($id);

            return $this->success_response([
                'id' => $id,
                'message' => __('Item created successfully', 'yatra'),
                'data' => $item,
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
                return $this->error_response(__('Failed to update item', 'yatra'), 500);
            }

            return $this->success_response([
                'message' => __('Item updated successfully', 'yatra'),
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
                return $this->error_response(__('Failed to delete item', 'yatra'), 500);
            }

            return $this->success_response([
                'message' => __('Item deleted successfully', 'yatra'),
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    private function prepareItem($item): array
    {
        $prepared = (array) $item;

        // For unified ClassificationsTable, items have parent_id = item type ID
        if (!empty($prepared['parent_id'])) {
            $prepared['type_id'] = (int) $prepared['parent_id'];
        }

        // Get item type info
        if (!empty($prepared['type_id'])) {
            $type = $this->itemTypeRepository->find((int) $prepared['type_id']);

            if ($type) {
                $prepared['type_name'] = esc_html($type->name);

                if (!empty($type->icon)) {
                    $icon_data = maybe_unserialize($type->icon);
                    if (is_array($icon_data) && isset($icon_data['value'])) {
                        $prepared['type_icon'] = $icon_data['value'];
                        if (
                            isset($icon_data['type'], $icon_data['provider'])
                            && $icon_data['type'] === 'icon'
                        ) {
                            $p = sanitize_key((string) $icon_data['provider']);
                            if (in_array($p, ['fa-solid', 'fa-regular'], true)) {
                                $prepared['type_icon_provider'] = $p;
                            }
                        }
                    } elseif (is_string($type->icon)) {
                        $prepared['type_icon'] = $type->icon;
                    }
                }
            } else {
                // If type not found, set unknown
                $prepared['type_name'] = __('Unknown', 'yatra');
            }
        } else {
            // If no type_id, set unknown
            $prepared['type_name'] = __('Unknown', 'yatra');
        }

        if (!empty($prepared['created_by'])) {
            $user = get_userdata((int) $prepared['created_by']);
            $prepared['created_by_name'] = $user ? esc_html($user->display_name) : null;
        }

        if (!empty($prepared['updated_by'])) {
            $user = get_userdata((int) $prepared['updated_by']);
            $prepared['updated_by_name'] = $user ? esc_html($user->display_name) : null;
        }

        $prepared['usage_count'] = $this->repository->countUsage((int) $prepared['id']);

        return $prepared;
    }
}
