<?php
/**
 * Availability REST API Controller
 * API endpoints for trip availability dates management
 * 
 * This is a FREE feature - no Pro plugin required
 * 
 * @package Yatra\Controllers
 * @since 3.0.0
 */

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\AvailabilityService;
use Yatra\Repositories\AvailabilityRepository;

class AvailabilityController extends BaseController
{
    private AvailabilityService $service;

    public function __construct()
    {
        $this->service = new AvailabilityService(new AvailabilityRepository());
    }

    /**
     * Register routes
     */
    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        $base = 'availability';

        // Collection routes
        register_rest_route($namespace, '/' . $base, [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'check_permission'],
                'args' => [
                    'trip_id' => [
                        'required' => true,
                        'type' => 'integer',
                        'validate_callback' => function ($param) {
                            return is_numeric($param) && $param > 0;
                        },
                    ],
                    'status' => [
                        'type' => 'string',
                        'default' => 'all',
                    ],
                    'month' => [
                        'type' => 'string',
                        'default' => 'all',
                    ],
                    'search' => [
                        'type' => 'string',
                        'default' => '',
                    ],
                    'page' => [
                        'type' => 'integer',
                        'default' => 1,
                        'minimum' => 1,
                    ],
                    'per_page' => [
                        'type' => 'integer',
                        'default' => 50,
                        'minimum' => 1,
                        'maximum' => 100,
                    ],
                ],
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Single item routes
        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)', [
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

        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)/duplicate', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'duplicate_item'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);
    }

    /**
     * Get all availability dates for a trip
     */
    public function get_items(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $tripId = (int) $request->get_param('trip_id');
            
            if ($tripId <= 0) {
                return new WP_Error(
                    'invalid_trip_id',
                    'Valid trip_id is required',
                    ['status' => 400]
                );
            }

            $filters = [
                'status' => $request->get_param('status') ?? 'all',
                'month' => $request->get_param('month') ?? 'all',
                'search' => $request->get_param('search') ?? '',
                'page' => (int) ($request->get_param('page') ?? 1),
                'per_page' => (int) ($request->get_param('per_page') ?? 50),
            ];

            $items = $this->service->getByTripId($tripId, $filters);
            $total = $this->service->countByTripId($tripId, $filters);

            global $wpdb;
            $bookingsTable = $wpdb->prefix . 'yatra_bookings';

            $availabilityIdByDate = [];
            $dateCounts = [];
            foreach ($items as $item) {
                $date = (string) ($item->departure_date ?? '');
                if ($date === '') {
                    continue;
                }
                $dateCounts[$date] = ($dateCounts[$date] ?? 0) + 1;
                $availabilityIdByDate[$date] = (int) ($item->id ?? 0);
            }

            foreach ($dateCounts as $date => $count) {
                if ($count !== 1) {
                    unset($availabilityIdByDate[$date]);
                }
            }

            if (!empty($availabilityIdByDate)) {
                foreach ($availabilityIdByDate as $date => $availabilityId) {
                    if ($availabilityId <= 0) {
                        continue;
                    }
                    $wpdb->query(
                        $wpdb->prepare(
                            "UPDATE {$bookingsTable}
                             SET availability_id = %d
                             WHERE trip_id = %d
                               AND travel_date = %s
                               AND (availability_id IS NULL OR availability_id = 0)",
                            $availabilityId,
                            (int) $tripId,
                            $date
                        )
                    );
                }
            }

            $activeBookingStatuses = [
                'pending',
                'confirmed',
                'processing',
                'completed',
                'on_hold',
            ];
            $placeholders = implode(',', array_fill(0, count($activeBookingStatuses), '%s'));

            // Aggregate bookings count per availability date for this trip
            $countsByAvailabilityId = [];

            $rows = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT availability_id, SUM(travelers_count) AS booked_count
                     FROM {$bookingsTable}
                     WHERE trip_id = %d
                       AND availability_id IS NOT NULL
                       AND status IN ({$placeholders})
                     GROUP BY availability_id",
                    array_merge([(int) $tripId], $activeBookingStatuses)
                ),
                ARRAY_A
            );

            foreach ($rows as $row) {
                $aid = (int) ($row['availability_id'] ?? 0);
                if ($aid > 0) {
                    $countsByAvailabilityId[$aid] = (int) ($row['booked_count'] ?? 0);
                }
            }

            $data = array_map(function ($item) use ($request, $countsByAvailabilityId) {
                $prepared = $this->prepare_item_for_response($item, $request);

                $availabilityId = (int) ($prepared['id'] ?? 0);
                $bookedCount = 0;

                if ($availabilityId > 0 && isset($countsByAvailabilityId[$availabilityId])) {
                    $bookedCount = (int) $countsByAvailabilityId[$availabilityId];
                }

                $seatsTotal = (int) ($prepared['seats_total'] ?? 0);
                $seatsReserved = (int) ($prepared['seats_reserved'] ?? 0);
                $available = max(0, $seatsTotal - $bookedCount);

                $prepared['booked_seats'] = $bookedCount;
                $prepared['total_seats'] = $seatsTotal;
                $prepared['available_seats'] = $available;
                $prepared['seats_available'] = $available;

                // Preserve original database status - don't override calculated status
                // The status should reflect what's actually stored in the database
                $original_status = $prepared['status'] ?? 'available';
                
                // Only update status if seats are actually sold out (0 available)
                if ($available === 0 && $original_status !== 'blocked' && $original_status !== 'closed' && $original_status !== 'cancelled') {
                    $prepared['status'] = 'sold_out';
                }
                // For all other cases, preserve the original database status
                // This allows 'available', 'limited', 'blocked', 'closed', 'cancelled' to show correctly

                return $prepared;
            }, $items);

            return new WP_REST_Response([
                'dates' => $data,
                'total' => $total,
                'page' => $filters['page'],
                'per_page' => $filters['per_page'],
            ], 200);
        } catch (\Exception $e) {
            return new WP_Error(
                'availability_fetch_error',
                $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    public function duplicate_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $data = $request->get_json_params();

            if (empty($data)) {
                $data = $request->get_body_params();
            }

            $item = $this->service->duplicate($id, is_array($data) ? $data : []);

            return new WP_REST_Response($this->prepare_item_for_response($item, $request), 201);
        } catch (\InvalidArgumentException $e) {
            return new WP_Error(
                'validation_error',
                $e->getMessage(),
                ['status' => 400]
            );
        } catch (\Exception $e) {
            return new WP_Error(
                'availability_duplicate_error',
                $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    /**
     * Get single availability date
     */
    public function get_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $item = $this->service->find($id);

            if (!$item) {
                return new WP_Error(
                    'availability_not_found',
                    'Availability date not found',
                    ['status' => 404]
                );
            }

            $prepared = $this->prepare_item_for_response($item, $request);

            // Compute live booked seats for this availability_id
            if (!empty($prepared['id'])) {
                global $wpdb;
                $bookingsTable = $wpdb->prefix . 'yatra_bookings';
                $activeBookingStatuses = [
                    'pending',
                    'confirmed',
                    'processing',
                    'completed',
                    'on_hold',
                ];
                $placeholders = implode(',', array_fill(0, count($activeBookingStatuses), '%s'));

                $bookedCount = (int) $wpdb->get_var(
                    $wpdb->prepare(
                        "SELECT COALESCE(SUM(travelers_count), 0)
                         FROM {$bookingsTable}
                         WHERE availability_id = %d
                           AND status IN ({$placeholders})",
                        array_merge([(int) $prepared['id']], $activeBookingStatuses)
                    )
                );

                $seatsTotal = (int) ($prepared['seats_total'] ?? 0);
                $seatsReserved = (int) ($prepared['seats_reserved'] ?? 0);
                $available = max(0, $seatsTotal - $bookedCount);

                $prepared['booked_seats'] = $bookedCount;
                $prepared['seats_available'] = $available;
            }

            return new WP_REST_Response($prepared, 200);
        } catch (\Exception $e) {
            return new WP_Error(
                'availability_fetch_error',
                $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    /**
     * Create availability date
     */
    public function create_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $data = $request->get_json_params();
            
            if (empty($data)) {
                $data = $request->get_body_params();
            }

            $item = $this->service->create($data);
            
            // Trigger hook to sync departure capacity
            do_action('yatra_availability_updated', $item->id);

            return new WP_REST_Response($this->prepare_item_for_response($item, $request), 201);
        } catch (\InvalidArgumentException $e) {
            return new WP_Error(
                'validation_error',
                $e->getMessage(),
                ['status' => 400]
            );
        } catch (\Exception $e) {
            return new WP_Error(
                'availability_create_error',
                $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    /**
     * Update availability date
     */
    public function update_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $data = $request->get_json_params();
            
            if (empty($data)) {
                $data = $request->get_body_params();
            }

            $item = $this->service->update($id, $data);
            
            // Trigger hook to sync departure capacity
            do_action('yatra_availability_updated', $id);

            return new WP_REST_Response($this->prepare_item_for_response($item, $request), 200);
        } catch (\InvalidArgumentException $e) {
            return new WP_Error(
                'validation_error',
                $e->getMessage(),
                ['status' => 400]
            );
        } catch (\Exception $e) {
            return new WP_Error(
                'availability_update_error',
                $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    /**
     * Delete availability date
     */
    public function delete_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $this->service->delete($id);

            return new WP_REST_Response([
                'message' => 'Availability date deleted successfully',
                'id' => $id,
            ], 200);
        } catch (\InvalidArgumentException $e) {
            return new WP_Error(
                'validation_error',
                $e->getMessage(),
                ['status' => 400]
            );
        } catch (\Exception $e) {
            return new WP_Error(
                'availability_delete_error',
                $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    /**
     * Prepare item for response
     */
    protected function prepare_item_for_response($item, WP_REST_Request $request): array
    {
        $data = $item->toArray();
        
        // Format prices as strings for frontend
        if (isset($data['original_price'])) {
            $data['original_price'] = $data['original_price'] !== null ? number_format((float) $data['original_price'], 2, '.', '') : null;
        }
        if (isset($data['discounted_price'])) {
            $data['discounted_price'] = $data['discounted_price'] !== null ? number_format((float) $data['discounted_price'], 2, '.', '') : null;
        }
        if (isset($data['discount_percentage'])) {
            $data['discount_percentage'] = $data['discount_percentage'] !== null ? number_format((float) $data['discount_percentage'], 2, '.', '') : null;
        }
        
        // Ensure pricing_type has a default value
        if (!isset($data['pricing_type']) || empty($data['pricing_type'])) {
            $data['pricing_type'] = 'regular';
        }
        
        // Ensure price_types is an array
        if (!isset($data['price_types']) || !is_array($data['price_types'])) {
            $data['price_types'] = [];
        }
        
        // Ensure status matches frontend expectations
        if ($data['status'] === 'blocked' || !empty($data['is_blocked'])) {
            $data['status'] = 'blocked';
            $data['is_blocked'] = true;
        }
        
        return $data;
    }

    /**
     * Check permission
     */
    public function check_permission(?WP_REST_Request $request = null): bool
    {
        return current_user_can('manage_options');
    }
}

