<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\ActivityService;
use Yatra\Database\Tables\TripsTable;
use Yatra\Database\Tables\TripClassificationsTable;
use Yatra\Validators\ActivityValidator;
use Yatra\Exceptions\ValidationException;
use Yatra\Utils\Logger;
use Yatra\Helpers\FormatHelper;

/**
 * Activity REST API Controller
 * 
 * Endpoints:
 * - GET    /activities       - List activities
 * - POST   /activities       - Create activity
 * - GET    /activities/{id}  - Get single activity
 * - PUT    /activities/{id}  - Update activity
 * - DELETE /activities/{id}  - Delete activity
 */
class ActivityController extends BaseController
{
    /**
     * REST API base
     */
    protected string $rest_base = 'activities';

    /**
     * @var ActivityService
     */
    private ActivityService $service;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->service = new ActivityService();
    }

    /**
     * Register routes
     */
    public function register_routes(): void
    {
        // Register standard CRUD routes with status filter
        $this->registerCrudRoutes($this->getStatusArg());

        register_rest_route($this->namespace, '/' . $this->rest_base . '/bulk', [
            'methods' => \WP_REST_Server::CREATABLE,
            'callback' => [$this, 'bulkAction'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route($this->namespace, '/' . $this->rest_base . '/stats', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [$this, 'getStats'],
            'permission_callback' => [$this, 'check_permission'],
        ]);
    }

    /**
     * Check permissions for activity endpoints
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

        switch ($method) {
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

    /**
     * Get items
     */
    public function get_items(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $params = $this->getPaginationParams($request);
            
            Logger::apiRequest('/activities', 'GET', $params);

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

            // Attach trip counts for each activity
            if (!empty($items)) {
                foreach ($items as $item) {
                    $activityId = isset($item->id) ? (int) $item->id : 0;
                    if ($activityId <= 0) {
                        continue;
                    }

                    $tripCount = $this->service->getTripCount($activityId);
                    $item->trip_count = $tripCount;
                }
            }

            $prepared = array_map([$this, 'prepareActivity'], $items);

            Logger::info("Activities retrieved successfully", ['count' => count($prepared), 'total' => $total]);
            return $this->paginated_response($prepared, $total, $params['page'], $params['per_page']);
            
        } catch (\Exception $e) {
            Logger::error("Failed to get activities", ['error' => $e->getMessage(), 'params' => $params ?? []]);
            return $this->handle_exception($e);
        }
    }

    /**
     * Get single item
     */
    public function get_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = $this->getId($request);
            
            if ($id <= 0) {
                throw new ValidationException('Invalid activity ID', ['id' => ['Activity ID must be a positive integer']]);
            }

            Logger::apiRequest("/activities/{$id}", 'GET');
            
            $item = $this->service->getById($id);

            if (!$item) {
                Logger::warning("Activity not found", ['activity_id' => $id]);
                return $this->not_found(__('Activity not found', 'yatra'));
            }

            // Attach trip count for single activity
            $activityId = isset($item->id) ? (int) $item->id : 0;
            if ($activityId > 0) {
                $tripCount = $this->service->getTripCount($activityId);
                $item->trip_count = $tripCount;
            }

            Logger::info("Activity retrieved successfully", ['activity_id' => $id]);
            return $this->success_response($this->prepareActivity($item));
            
        } catch (\Exception $e) {
            Logger::error("Failed to get activity", ['activity_id' => isset($id) ? $id : 0, 'error' => $e->getMessage()]);
            return $this->handle_exception($e);
        }
    }

    /**
     * Create item
     */
    public function create_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $data = $this->getBody($request);
            
            // Validate and sanitize input data
            ActivityValidator::validateCreate($data);
            $data = ActivityValidator::sanitize($data);
            
            // Description will be sanitized in the Service layer with FormatHelper::sanitizeQuillHtml()
            
            Logger::apiRequest('/activities', 'POST', $data);
            
            $id = $this->service->create($data);

            Logger::info("Activity created successfully", ['activity_id' => $id]);
            return $this->success_response([
                'id' => $id,
                'message' => __('Activity created successfully', 'yatra'),
            ], 201);
            
        } catch (\Exception $e) {
            Logger::error("Failed to create activity", ['data' => $data ?? [], 'error' => $e->getMessage()]);
            return $this->handle_exception($e);
        }
    }

    /**
     * Update item
     */
    public function update_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = $this->getId($request);
            $data = $this->getBody($request);
            
            // Description will be sanitized in the Service layer with FormatHelper::sanitizeQuillHtml()
            
            $result = $this->service->update($id, $data);

            if (!$result) {
                return $this->error_response(__('Failed to update activity', 'yatra'), 500);
            }

            return $this->success_response([
                'message' => __('Activity updated successfully', 'yatra'),
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->validation_error($e->getMessage());
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
            $result = $this->service->delete($this->getId($request));

            if (!$result) {
                return $this->error_response(__('Failed to delete activity', 'yatra'), 500);
            }

            return $this->success_response([
                'message' => __('Activity deleted successfully', 'yatra'),
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Bulk actions endpoint
     */
    public function bulkAction(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $data = $request->get_json_params();
            $action = sanitize_text_field($data['action'] ?? '');
            $ids = array_filter(array_map('absint', $data['ids'] ?? []));

            if (empty($action)) {
                return $this->validation_error(__('Action is required', 'yatra'));
            }

            if (empty($ids)) {
                return $this->validation_error(__('No activities selected', 'yatra'));
            }

            switch ($action) {
                case 'trash':
                    $result = $this->service->bulkUpdateStatus($ids, 'trash');
                    break;
                case 'publish':
                    $result = $this->service->bulkUpdateStatus($ids, 'publish');
                    break;
                case 'draft':
                    $result = $this->service->bulkUpdateStatus($ids, 'draft');
                    break;
                case 'restore':
                    $result = $this->service->bulkUpdateStatus($ids, 'publish');
                    break;
                case 'delete':
                    $result = $this->service->bulkDelete($ids);
                    break;
                default:
                    throw new \InvalidArgumentException(__('Invalid action', 'yatra'));
            }

            return $this->success_response($result);
        } catch (\InvalidArgumentException $e) {
            return $this->validation_error($e->getMessage());
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get statistics for admin views
     */
    public function getStats(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $stats = $this->service->getStatusCounts();
            return $this->success_response($stats);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Prepare activity for response
     */
    private function prepareActivity($item): array
    {
        $prepared = (array) $item;

        // Handle icon
        if (isset($prepared['icon']) && is_string($prepared['icon'])) {
            $prepared['icon'] = maybe_unserialize($prepared['icon']);
        }
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
    }
}
