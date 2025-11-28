<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\DiscountService;

/**
 * Discount REST API Controller
 * 
 * Endpoints:
 * - GET    /discounts       - List discounts
 * - POST   /discounts       - Create discount
 * - GET    /discounts/{id}  - Get single discount
 * - PUT    /discounts/{id}  - Update discount
 * - DELETE /discounts/{id}  - Delete discount
 */
class DiscountController extends BaseController
{
    protected string $rest_base = 'discounts';

    private DiscountService $service;

    public function __construct()
    {
        $this->service = new DiscountService();
    }

    public function register_routes(): void
    {
        $this->registerCrudRoutes(array_merge(
            $this->getStatusArg(),
            [
                'type' => [
                    'default' => 'all',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ]
        ));
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
            'GET' => current_user_can('yatra_view_bookings'),
            'POST', 'PUT', 'PATCH', 'DELETE' => current_user_can('yatra_edit_bookings'),
            default => current_user_can('manage_options'),
        };
    }

    public function get_items(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $params = $this->getPaginationParams($request);

            // Override default orderby
            $orderby = $request->get_param('orderby') ?: 'created_at';

            $args = [
                'limit' => $params['per_page'],
                'offset' => ($params['page'] - 1) * $params['per_page'],
                'order_by' => $orderby,
                'order' => $params['order'],
            ];

            if (!empty($params['search'])) {
                $args['search'] = $params['search'];
            }

            $status = $request->get_param('status');
            if ($status && $status !== 'all') {
                $args['status'] = sanitize_text_field($status);
            }

            $type = $request->get_param('type');
            if ($type && $type !== 'all' && in_array($type, ['percentage', 'fixed'], true)) {
                $args['type'] = $type;
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
                return $this->not_found(__('Discount not found', 'yatra'));
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
                'message' => __('Discount created successfully', 'yatra'),
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
                return $this->error_response(__('Failed to update discount', 'yatra'), 500);
            }

            return $this->success_response([
                'message' => __('Discount updated successfully', 'yatra'),
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
                return $this->error_response(__('Failed to delete discount', 'yatra'), 500);
            }

            return $this->success_response([
                'message' => __('Discount deleted successfully', 'yatra'),
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    private function prepareItem($item): array
    {
        $prepared = (array) $item;

        if (isset($prepared['trip_ids']) && is_string($prepared['trip_ids'])) {
            $prepared['trip_ids'] = maybe_unserialize($prepared['trip_ids']);
        }

        $prepared['first_time_customer_only'] = (bool) ($prepared['first_time_customer_only'] ?? false);
        $prepared['is_group_discount'] = (bool) ($prepared['is_group_discount'] ?? false);

        if (!$prepared['is_group_discount']) {
            $prepared['min_group_size'] = null;
            $prepared['group_discount_type'] = null;
            $prepared['group_discount_amount'] = null;
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
