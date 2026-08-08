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
use Yatra\Database\Tables\BookingsTable;
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

        // Collection routes — view cap for reads, edit cap for writes.
        register_rest_route($namespace, '/' . $base, [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'check_view_permission'],
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

        // Read-only list of dates a trip's recurring rules generate, for the
        // admin calendar. The main /availability list reads only the stored
        // availability_dates table, so a trip configured purely with recurring
        // rules showed an empty calendar. These are virtual (governed by the
        // rule, not individually editable), so the calendar renders them
        // read-only — hence a separate endpoint rather than mixing them into
        // the paginated, action-bearing /availability list.
        register_rest_route($namespace, '/' . $base . '/generated', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_generated_dates'],
                'permission_callback' => [$this, 'check_view_permission'],
                'args' => [
                    'trip_id' => [
                        'required' => true,
                        'type' => 'integer',
                        'validate_callback' => function ($param) {
                            return is_numeric($param) && $param > 0;
                        },
                    ],
                ],
            ],
        ]);

        // Single item routes — view cap for read, edit cap for the
        // mutations. Delete uses edit as well — there's no separate
        // "delete availability date" cap in the registry because
        // removing a date is functionally part of trip availability
        // editing, not a destructive operation in its own right.
        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'check_view_permission'],
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
    public function get_items(WP_REST_Request $request)
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
            $bookingsTable = BookingsTable::getTableName();

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

            // Use AvailabilityService to update booking availability IDs
            if (!empty($availabilityIdByDate)) {
                $this->service->updateBookingAvailabilityIds((int) $tripId, $availabilityIdByDate);
            }

            $data = array_map(function ($item) use ($request) {
                $prepared = $this->prepare_item_for_response($item, $request);

                // Booked is derived from the bookings' own (trip, date, time)
                // identity, not the fragile availability_id join — see
                // AvailabilityService::getBookedCountForSlot. Each row passes its
                // own departure_time so multi-departure dates report per slot.
                $bookedCount = $this->service->getBookedCountForSlot(
                    (int) ($prepared['trip_id'] ?? 0),
                    (string) ($prepared['departure_date'] ?? ''),
                    !empty($prepared['departure_time']) ? (string) $prepared['departure_time'] : null
                );

                $seatsTotal = (int) ($prepared['seats_total'] ?? 0);
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

    public function duplicate_item(WP_REST_Request $request)
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
     * Read-only dates generated by a trip's recurring rules, for the admin
     * calendar. Resolves through AvailabilityResolutionService so Booked /
     * Available reflect real bookings (same (trip, date, time) count the storefront
     * uses), and returns ONLY rule-generated dates — specific availability rows
     * already come from the main list, and trip-default (flexible) dates are left
     * out so this overlay is scoped to the recurring-rules gap it exists to fill.
     */
    public function get_generated_dates(WP_REST_Request $request)
    {
        try {
            $tripId = (int) $request->get_param('trip_id');

            // Fall back to sane defaults for missing OR malformed dates rather than
            // passing junk into the resolver (a bad date string errored the query).
            $normalizeDate = static function ($value, string $fallback): string {
                $value = sanitize_text_field((string) $value);
                if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
                    $ts = strtotime($value);
                    if ($ts !== false && date('Y-m-d', $ts) === $value) {
                        return $value;
                    }
                }
                return $fallback;
            };
            $fromDate = $normalizeDate($request->get_param('from_date'), date('Y-m-d'));
            $toDate = $normalizeDate($request->get_param('to_date'), date('Y-m-d', strtotime('+12 months')));

            $resolver = new \Yatra\Services\AvailabilityResolutionService();
            $resolved = $resolver->getAllAvailabilityDates($tripId, $fromDate, $toDate);

            $dates = [];
            foreach ($resolved as $slot) {
                if (($slot->source ?? '') !== 'recurring_rule') {
                    continue;
                }
                $total = (int) ($slot->seats_total ?? 0);
                $available = (int) ($slot->seats_available ?? 0);
                $dates[] = [
                    'id' => (string) ($slot->id ?? ''),
                    'trip_id' => $tripId,
                    'departure_date' => (string) ($slot->departure_date ?? ''),
                    'departure_time' => $slot->departure_time ?? null,
                    'arrival_date' => $slot->arrival_date ?? ($slot->departure_date ?? ''),
                    'arrival_time' => $slot->arrival_time ?? null,
                    'total_seats' => $total,
                    'seats_total' => $total,
                    'available_seats' => $available,
                    'seats_available' => $available,
                    'booked_seats' => max(0, $total - $available),
                    'waitlist_count' => 0,
                    'status' => (string) ($slot->status ?? 'available'),
                    'is_blocked' => !empty($slot->is_blocked),
                    'original_price' => $slot->original_price ?? null,
                    'discounted_price' => $slot->discounted_price ?? null,
                    // Marks this as a read-only, rule-generated entry so the
                    // calendar shows it without edit/delete affordances.
                    'is_virtual' => true,
                    'source' => 'rule',
                ];
            }

            return new WP_REST_Response(['dates' => $dates, 'total' => count($dates)], 200);
        } catch (\Exception $e) {
            return new WP_Error('availability_generated_error', $e->getMessage(), ['status' => 500]);
        }
    }

    /**
     * Get single availability date
     */
    public function get_item(WP_REST_Request $request)
    {
        try {
            $id = (int) $request->get_param('id');
            $item = $this->service->getById($id);

            if (!$item) {
                return new WP_Error(
                    'availability_not_found',
                    'Availability date not found',
                    ['status' => 404]
                );
            }

            $prepared = $this->prepare_item_for_response($item, $request);

            // Booked derived from the bookings' (trip, date, time) identity, the
            // same way the list does — not the fragile availability_id join.
            if (!empty($prepared['id'])) {
                $bookedCount = $this->service->getBookedCountForSlot(
                    (int) ($prepared['trip_id'] ?? 0),
                    (string) ($prepared['departure_date'] ?? ''),
                    !empty($prepared['departure_time']) ? (string) $prepared['departure_time'] : null
                );

                $seatsTotal = (int) ($prepared['seats_total'] ?? 0);
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
    public function create_item(WP_REST_Request $request)
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
    public function update_item(WP_REST_Request $request)
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
    public function delete_item(WP_REST_Request $request)
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
        $data = (array) $item;
        
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
        
        // Decode price_types JSON string from DB and ensure it's an array
        if (isset($data['price_types']) && is_string($data['price_types'])) {
            $decoded = json_decode($data['price_types'], true);
            $data['price_types'] = is_array($decoded) ? $decoded : [];
        } elseif (!isset($data['price_types']) || !is_array($data['price_types'])) {
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
    /**
     * Write permission — trip-edits cap. Adding, updating, deleting,
     * and duplicating availability dates all mutate trip data, so the
     * registered `yatra_edit_trips` cap is the right gate. WP admins
     * pass via the Team module's admin-fallback filter.
     */
    public function check_permission(?WP_REST_Request $request = null): bool
    {
        return current_user_can('yatra_edit_trips');
    }

    /**
     * Read permission — view-trips cap. Listing availability dates is
     * a read-only operation against trip data; Sales Agent / Front
     * Desk / Guide / Accountant / Auditor roles all hold this.
     */
    public function check_view_permission(?WP_REST_Request $request = null): bool
    {
        return current_user_can('yatra_view_trips');
    }
}

