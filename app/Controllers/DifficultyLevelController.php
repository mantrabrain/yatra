<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\DifficultyLevelService;

/**
 * Difficulty Level REST API Controller
 * 
 * Endpoints:
 * - GET    /difficulty-levels       - List difficulty levels
 * - POST   /difficulty-levels       - Create difficulty level
 * - GET    /difficulty-levels/{id}  - Get single difficulty level
 * - PUT    /difficulty-levels/{id}  - Update difficulty level
 * - DELETE /difficulty-levels/{id}  - Delete difficulty level
 */
class DifficultyLevelController extends BaseController
{
    protected string $rest_base = 'difficulty-levels';

    private DifficultyLevelService $service;

    public function __construct()
    {
        $this->service = new DifficultyLevelService();
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
     * GET /difficulty-levels/stats
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
                // Unknown HTTP method — deny explicitly. The earlier
                // fallback to `manage_options` was a regression that
                // silently broadened admin-only access for any verb not
                // in the explicit switch.
                return false;
        }
    }

    public function get_items(WP_REST_Request $request)
    {
        try {
            $params = $this->getPaginationParams($request);

            // Override default orderby for difficulty levels
            $orderby = $request->get_param('orderby') ?: 'sorting';
            $order = strtoupper($request->get_param('order') ?: 'ASC');

            $args = [
                'limit' => $params['per_page'],
                'offset' => ($params['page'] - 1) * $params['per_page'],
                'order_by' => $orderby,
                'order' => $order,
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

            // Attach trip counts to items
            if (!empty($items)) {
                foreach ($items as $item) {
                    $levelId = isset($item->id) ? (int) $item->id : 0;
                    if ($levelId <= 0) {
                        continue;
                    }

                    $tripCount = $this->service->getTripCount($levelId);
                    $item->trip_count = $tripCount;
                }
            }

            $prepared = array_map([$this, 'prepareItem'], $items);

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
                return $this->not_found(__('Difficulty level not found', 'yatra'));
            }

            // Attach trip count for single level
            $levelId = isset($item->id) ? (int) $item->id : 0;
            if ($levelId > 0) {
                $tripCount = $this->service->getTripCountDirect($levelId);
                $item->trip_count = $tripCount;
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

            return $this->success_response([
                'id' => $id,
                'message' => __('Difficulty level created successfully', 'yatra'),
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
                return $this->error_response(__('Failed to update difficulty level', 'yatra'), 500);
            }

            return $this->success_response([
                'message' => __('Difficulty level updated successfully', 'yatra'),
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
                return $this->error_response(__('Failed to delete difficulty level', 'yatra'), 500);
            }

            return $this->success_response([
                'message' => __('Difficulty level deleted successfully', 'yatra'),
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
