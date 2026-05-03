<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\DiscountService;
use Yatra\Repositories\DiscountRepository;
use Yatra\Models\Discount;

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

    /**
     * DB columns only — list responses add display keys (e.g. created_by_name) that must not be sent to wpdb->update().
     *
     * @var list<string>
     */
    private const DISCOUNT_WRITABLE_FIELDS = [
        'code',
        'description',
        'type',
        'amount',
        'max_discount_amount',
        'usage_limit',
        'usage_limit_per_customer',
        'usage_count',
        'valid_from',
        'expiry_date',
        'status',
        'applicable_to',
        'trip_ids',
        'min_amount',
        'first_time_customer_only',
        'is_group_discount',
        'discount_mode',
        'min_group_size',
        'max_group_size',
        'group_discount_type',
        'group_discount_amount',
        'group_discount_mode',
        'group_discount_ranges',
        'category_discounts',
        'updated_by',
    ];

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

        register_rest_route($this->namespace, '/' . $this->rest_base . '/stats', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_stats'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

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
        // Discoverability is read-only: list published group tiers for the trip page. Booking/calculation
        // still gates on {@see apply_filters('yatra_advanced_discount_enabled')} inside DiscountService.
        // Discount is a simple DTO model (not Eloquent), so use repository + PHP filtering.
        $repo = new DiscountRepository();
        $rows = $repo->getActiveGroupDiscounts();

        $today = date('Y-m-d');

        $discounts = array_values(array_filter(array_map(function ($row) use ($today, $tripId) {
            $arr = (array) $row;
            $discount = Discount::fromArray($arr);

            // Match {@see DiscountRepository::getActiveGroupDiscounts()}: group savings may be stored
            // with discount_mode group/both while is_group_discount stayed 0 on older rows.
            $discountMode = strtolower((string) ($arr['discount_mode'] ?? ''));
            $isGroupEligible = !empty($discount->is_group_discount)
                || in_array($discountMode, ['group', 'both'], true);
            if (!$isGroupEligible) {
                return null;
            }

            $status = strtolower((string) ($arr['status'] ?? $discount->status ?? ''));
            if (!in_array($status, ['publish', 'active'], true)) {
                return null;
            }

            $validFrom = is_string($discount->valid_from) ? trim($discount->valid_from) : '';
            if ($validFrom !== '' && $validFrom !== '0000-00-00' && $validFrom > $today) {
                return null;
            }

            $expiry = is_string($discount->expiry_date) ? trim($discount->expiry_date) : '';
            if ($expiry !== '' && $expiry !== '0000-00-00' && $expiry < $today) {
                return null;
            }

            $applicableTo = (string) ($discount->applicable_to ?? 'all');
            if ($applicableTo === 'all') {
                return $discount;
            }

            if ($applicableTo === 'specific_trips') {
                $tripIds = self::normalizeDiscountTripIds($discount->trip_ids);
                if (in_array($tripId, $tripIds, true)) {
                    return $discount;
                }
            }

            return null;
        }, $rows)));

        usort($discounts, function (Discount $a, Discount $b) {
            return (int) ($a->min_group_size ?? 0) <=> (int) ($b->min_group_size ?? 0);
        });

        $result = [];
        foreach ($discounts as $discount) {
            $ranges = $discount->group_discount_ranges;
            if (!empty($ranges) && is_array($ranges)) {
                $tiersFromRanges = 0;
                foreach ($ranges as $rangeRow) {
                    $r = is_array($rangeRow) ? $rangeRow : (array) $rangeRow;
                    $min = isset($r['min_group_size']) && $r['min_group_size'] !== '' ? (int) $r['min_group_size'] : 0;
                    $maxRaw = $r['max_group_size'] ?? null;
                    $max = ($maxRaw !== null && $maxRaw !== '') ? (int) $maxRaw : null;
                    $dType = (($r['discount_type'] ?? 'percentage') === 'fixed') ? 'fixed' : 'percentage';
                    $dAmount = (float) ($r['discount_amount'] ?? $r['amount'] ?? 0);
                    if ($dAmount <= 0) {
                        continue;
                    }
                    $result[] = [
                        'id' => $discount->id,
                        'min_group_size' => $min,
                        'max_group_size' => $max,
                        'discount_type' => $dType,
                        'discount_amount' => $dAmount,
                        'discount_mode' => $discount->group_discount_mode ?? 'total',
                        'category_discounts' => $discount->category_discounts,
                        'range_label' => $this->formatGroupSizeRangeInts($min, $max),
                        'discount_label' => $this->formatDiscountAmountLabel($dType, $dAmount),
                    ];
                    $tiersFromRanges++;
                }
                if ($tiersFromRanges > 0) {
                    continue;
                }
            }

            $label = $this->formatDiscountLabel($discount);
            $isCategoryBased = ($discount->group_discount_mode ?? '') === 'category_based'
                && !empty($discount->category_discounts);
            if ($label === '' && !$isCategoryBased) {
                continue;
            }
            if ($label === '' && $isCategoryBased) {
                $label = __('Varies by category', 'yatra');
            }

            $result[] = [
                'id' => $discount->id,
                'min_group_size' => $discount->min_group_size,
                'max_group_size' => $discount->max_group_size,
                'discount_type' => $discount->group_discount_type,
                'discount_amount' => $discount->group_discount_amount,
                'discount_mode' => $discount->group_discount_mode,
                'category_discounts' => $discount->category_discounts,
                'range_label' => $this->formatGroupSizeRange($discount),
                'discount_label' => $label,
            ];
        }

        return $result;
    }

    /**
     * Trip IDs stored on a discount (serialized array, JSON array, or comma-separated).
     *
     * @param mixed $tripIds
     * @return list<int>
     */
    private static function normalizeDiscountTripIds($tripIds): array
    {
        if ($tripIds === null || $tripIds === '') {
            return [];
        }
        if (is_array($tripIds)) {
            return array_values(array_unique(array_map('absint', $tripIds)));
        }
        if (!is_string($tripIds)) {
            return [];
        }
        $trim = trim($tripIds);
        if ($trim === '') {
            return [];
        }
        if ($trim[0] === '[' || $trim[0] === '{') {
            $decoded = json_decode($trim, true);
            if (is_array($decoded)) {
                return array_values(array_unique(array_map('absint', $decoded)));
            }
        }
        $unser = maybe_unserialize($tripIds);
        if (is_array($unser)) {
            return array_values(array_unique(array_map('absint', $unser)));
        }

        $parts = array_map('trim', explode(',', $trim));

        return array_values(array_unique(array_map('absint', array_filter($parts, static function ($p) {
            return $p !== '';
        }))));
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
            /* translators: 1: discount label, 2: range label */
            return sprintf(__('Up to %1$s for %2$s', 'yatra'), $discounts[0]['discount_label'], $uniqueRanges[0]);
        }

        $firstDiscount = $discounts[0];
        /* translators: 1: discount label, 2: minimum group size */
        return sprintf(__('Up to %1$s for groups starting at %2$d people', 'yatra'), $firstDiscount['discount_label'], (int) $firstDiscount['min_group_size']);
    }

    /**
     * Format group size range for display
     */
    private function formatGroupSizeRange($discount): string
    {
        $min = (int) ($discount->min_group_size ?? 0);
        $max = isset($discount->max_group_size) && (int) $discount->max_group_size > 0
            ? (int) $discount->max_group_size
            : null;

        return $this->formatGroupSizeRangeInts($min, $max);
    }

    /**
     * Group size range label from explicit bounds (used for tier rows from group_discount_ranges).
     */
    private function formatGroupSizeRangeInts(int $min, ?int $max): string
    {
        if ($max !== null && $max > 0) {
            /* translators: 1: min group size, 2: max group size */
            return sprintf(__('%1$d-%2$d people', 'yatra'), $min, $max);
        }

        /* translators: %d: minimum group size */
        return sprintf(__('%d+ people', 'yatra'), $min);
    }

    /**
     * Format discount label for display
     */
    private function formatDiscountAmountLabel(string $discountType, float $amount): string
    {
        if ($discountType === 'percentage') {
            /* translators: %s: discount percentage */
            return sprintf(__('%s%% off', 'yatra'), $this->formatDiscountNumberForDisplay($amount));
        }

        /* translators: %s: discount amount */
        return sprintf(__('%s off', 'yatra'), '$' . number_format($amount, 2));
    }

    private function formatDiscountNumberForDisplay(float $amount): string
    {
        if (abs($amount - round($amount)) < 0.00001) {
            return (string) (int) round($amount);
        }

        return rtrim(rtrim(number_format($amount, 2, '.', ''), '0'), '.');
    }

    /**
     * Format discount label for display
     */
    private function formatDiscountLabel($discount): string
    {
        $type = $discount->group_discount_type ?? 'percentage';
        $amt = (float) ($discount->group_discount_amount ?? 0);

        if ($amt > 0) {
            return $this->formatDiscountAmountLabel($type === 'fixed' ? 'fixed' : 'percentage', $amt);
        }

        return '';
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

    /**
     * GET /discounts/stats — counts per status for admin toolbar tabs
     */
    public function get_stats(WP_REST_Request $request)
    {
        try {
            return $this->success_response($this->service->getAdminStatusCounts());
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
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
            $data = $this->filterDiscountWritablePayload($this->getBody($request) ?: [], true);
            
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
            $data = $this->filterDiscountWritablePayload($this->getBody($request) ?: [], false);
            
            // Check if Advanced Discount module is required for this discount type
            $discount_mode = $data['discount_mode'] ?? 'promo';
            $is_group_discount = !empty($data['is_group_discount']);
            
            if (($discount_mode === 'group' || $discount_mode === 'both' || $is_group_discount) 
                && !apply_filters('yatra_advanced_discount_enabled', false)) {
                return $this->validation_error(__('Advanced Discount module is required for Group Discounts. Please enable it in Modules.', 'yatra'));
            }
            
            $result = $this->service->update($this->getId($request), $data);

            if (!$result) {
                global $wpdb;
                $detail = (defined('WP_DEBUG') && WP_DEBUG && !empty($wpdb->last_error))
                    ? ' ' . $wpdb->last_error
                    : '';

                return $this->error_response(__('Failed to update discount', 'yatra') . $detail, 500);
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

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function filterDiscountWritablePayload(array $data, bool $forCreate): array
    {
        $fields = self::DISCOUNT_WRITABLE_FIELDS;
        if ($forCreate) {
            $fields[] = 'created_by';
        }

        return array_intersect_key($data, array_flip($fields));
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

        if (!empty($prepared['created_by'])) {
            $user = get_userdata((int) $prepared['created_by']);
            $prepared['created_by_name'] = $user ? esc_html($user->display_name) : null;
        }

        if (!empty($prepared['updated_by'])) {
            $user = get_userdata((int) $prepared['updated_by']);
            $prepared['updated_by_name'] = $user ? esc_html($user->display_name) : null;
        }
        
        // Calculate actual usage count from bookings
        if (!empty($prepared['code'])) {
            $discountRepository = new \Yatra\Repositories\DiscountRepository();
            $prepared['usage_count'] = $discountRepository->countUsage($prepared['code']);
        }

        return $prepared;
    }
}
