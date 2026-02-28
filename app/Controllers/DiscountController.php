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

        // Group discount discoverability endpoint
        register_rest_route($this->namespace, '/' . $this->rest_base . '/group-discounts', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_group_discounts'],
                'permission_callback' => [$this, 'check_public_permission'],
                'args' => [
                    'trip_ids' => [
                        'required' => false,
                        'type' => 'array',
                        'items' => ['type' => 'integer'],
                        'description' => 'Array of trip IDs to check for group discounts',
                    ],
                ],
            ],
        ]);
    }

    public function check_public_permission(?WP_REST_Request $request = null): bool
    {
        // Allow public access to group discount discoverability
        return true;
    }

    /**
     * Get group discount availability for trips
     * Public endpoint for frontend discoverability
     */
    public function get_group_discounts(WP_REST_Request $request)
    {
        try {
            $tripIds = $request->get_param('trip_ids');

            if (empty($tripIds) || !is_array($tripIds)) {
                return $this->error_response(__('Trip IDs are required', 'yatra'), 400);
            }

            // Sanitize trip IDs
            $tripIds = array_map('absint', array_filter($tripIds));

            if (empty($tripIds)) {
                return $this->error_response(__('Valid trip IDs are required', 'yatra'), 400);
            }

            $result = [];

            foreach ($tripIds as $tripId) {
                $groupDiscounts = $this->getTripGroupDiscounts($tripId);
                $result[$tripId] = [
                    'has_group_discounts' => !empty($groupDiscounts),
                    'discounts' => $groupDiscounts,
                    'summary' => $this->generateGroupDiscountSummary($groupDiscounts),
                ];
            }

            return $this->success_response($result);

        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get group discounts for a specific trip
     */
    private function getTripGroupDiscounts(int $tripId): array
    {
        // Check if Advanced Discount module is enabled - group discounts are a Pro feature
        if (!apply_filters('yatra_advanced_discount_enabled', false)) {
            return [];
        }
        
        $discounts = \Yatra\Models\Discount::where('is_group_discount', true)
            ->where('status', 'publish')
            ->where(function($query) {
                $query->whereNull('valid_from')
                      ->orWhere('valid_from', '<=', date('Y-m-d'));
            })
            ->where(function($query) {
                $query->whereNull('expiry_date')
                      ->orWhere('expiry_date', '>=', date('Y-m-d'));
            })
            ->where(function($query) use ($tripId) {
                $query->where('applicable_to', 'all')
                      ->orWhere(function($subQuery) use ($tripId) {
                          $subQuery->where('applicable_to', 'specific_trips')
                                   ->whereJsonContains('trip_ids', $tripId);
                      });
            })
            ->orderBy('min_group_size', 'asc')
            ->get();

        $result = [];
        foreach ($discounts as $discount) {
            $result[] = [
                'id' => $discount->id,
                'min_group_size' => $discount->min_group_size,
                'max_group_size' => $discount->max_group_size,
                'discount_type' => $discount->group_discount_type,
                'discount_amount' => $discount->group_discount_amount,
                'discount_mode' => $discount->group_discount_mode,
                'category_discounts' => $discount->category_discounts,
                'range_label' => $this->formatGroupSizeRange($discount),
                'discount_label' => $this->formatDiscountLabel($discount),
            ];
        }

        return $result;
    }

    /**
     * Generate summary text for group discounts
     */
    private function generateGroupDiscountSummary(array $discounts): string
    {
        if (empty($discounts)) {
            return '';
        }

        $ranges = array_map(function($discount) {
            return $discount['range_label'];
        }, $discounts);

        $uniqueRanges = array_unique($ranges);

        if (count($uniqueRanges) === 1) {
            return "Up to {$discounts[0]['discount_label']} for {$uniqueRanges[0]}";
        } else {
            $firstDiscount = $discounts[0];
            return "Up to {$firstDiscount['discount_label']} for groups starting at {$firstDiscount['min_group_size']} people";
        }
    }

    /**
     * Format group size range for display
     */
    private function formatGroupSizeRange($discount): string
    {
        if ($discount->max_group_size) {
            return "{$discount->min_group_size}-{$discount->max_group_size} people";
        } else {
            return "{$discount->min_group_size}+ people";
        }
    }

    /**
     * Format discount label for display
     */
    private function formatDiscountLabel($discount): string
    {
        if ($discount->group_discount_type === 'percentage') {
            return "{$discount->group_discount_amount}% off";
        } else {
            return "$" . number_format($discount->group_discount_amount, 2) . " off";
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
                return current_user_can('yatra_view_bookings');
            case 'POST':
            case 'PUT':
            case 'PATCH':
            case 'DELETE':
                return current_user_can('yatra_edit_bookings');
            default:
                return current_user_can('manage_options');
        }
    }

    public function get_items(WP_REST_Request $request)
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

    public function get_item(WP_REST_Request $request)
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

    public function create_item(WP_REST_Request $request)
    {
        try {
            $data = $this->getBody($request);
            
            // Check if Advanced Discount module is required for this discount type
            $discount_mode = $data['discount_mode'] ?? 'promo';
            $is_group_discount = !empty($data['is_group_discount']);
            
            if (($discount_mode === 'group' || $discount_mode === 'both' || $is_group_discount) 
                && !apply_filters('yatra_advanced_discount_enabled', false)) {
                return $this->validation_error(__('Advanced Discount module is required for Group Discounts. Please enable it in Modules.', 'yatra'));
            }
            
            $id = $this->service->create($data);

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

    public function update_item(WP_REST_Request $request)
    {
        try {
            $data = $this->getBody($request);
            
            // Check if Advanced Discount module is required for this discount type
            $discount_mode = $data['discount_mode'] ?? 'promo';
            $is_group_discount = !empty($data['is_group_discount']);
            
            if (($discount_mode === 'group' || $discount_mode === 'both' || $is_group_discount) 
                && !apply_filters('yatra_advanced_discount_enabled', false)) {
                return $this->validation_error(__('Advanced Discount module is required for Group Discounts. Please enable it in Modules.', 'yatra'));
            }
            
            $result = $this->service->update($this->getId($request), $data);

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

    public function delete_item(WP_REST_Request $request)
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
        
        // Ensure trip_ids is always an array
        if (!is_array($prepared['trip_ids'])) {
            $prepared['trip_ids'] = [];
        }

        // Deserialize category_discounts if it's a JSON string
        if (isset($prepared['category_discounts']) && is_string($prepared['category_discounts'])) {
            $prepared['category_discounts'] = json_decode($prepared['category_discounts'], true) ?: [];
        }
        
        // Deserialize group_discount_ranges if it's a JSON string
        if (isset($prepared['group_discount_ranges']) && is_string($prepared['group_discount_ranges'])) {
            $prepared['group_discount_ranges'] = json_decode($prepared['group_discount_ranges'], true) ?: [];
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
