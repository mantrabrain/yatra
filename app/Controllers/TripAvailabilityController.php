<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\DepartureService;
use Yatra\Services\RecurringRuleService;
use Yatra\Repositories\DepartureRepository;
use Yatra\Repositories\RecurringRuleRepository;

/**
 * Trip Availability Controller
 * REST API endpoints for managing trip departures and recurring rules
 */
class TripAvailabilityController extends BaseController
{
    private DepartureService $departureService;
    private RecurringRuleService $ruleService;

    public function __construct()
    {
        $departureRepo = new DepartureRepository();
        $ruleRepo = new RecurringRuleRepository();
        
        $this->departureService = new DepartureService($departureRepo);
        $this->ruleService = new RecurringRuleService($ruleRepo, $departureRepo);
    }

    /**
     * Register routes
     */
    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        
        // All departures endpoint (without trip ID)
        register_rest_route($namespace, '/departures', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_all_departures'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);
        
        $base = 'trips/(?P<trip_id>[\d]+)/departures';

        // Departures endpoints
        register_rest_route($namespace, '/' . $base, [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_departures'],
                'permission_callback' => [$this, 'check_permission'],
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_departure'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_departure'],
                'permission_callback' => [$this, 'check_permission'],
            ],
            [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_departure'],
                'permission_callback' => [$this, 'check_permission'],
            ],
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_departure'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Past departures endpoint
        register_rest_route($namespace, '/' . $base . '/past', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_past_departures'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Available dates endpoint (for frontend)
        register_rest_route($namespace, '/trips/(?P<trip_id>[\d]+)/available-dates', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_available_dates'],
                'permission_callback' => '__return_true', // Public endpoint
            ],
        ]);

        // Recurring rules endpoints
        $rulesBase = 'trips/(?P<trip_id>[\d]+)/recurring-rules';
        register_rest_route($namespace, '/' . $rulesBase, [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_recurring_rules'],
                'permission_callback' => [$this, 'check_permission'],
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_recurring_rule'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        register_rest_route($namespace, '/' . $rulesBase . '/(?P<id>[\d]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_recurring_rule'],
                'permission_callback' => [$this, 'check_permission'],
            ],
            [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_recurring_rule'],
                'permission_callback' => [$this, 'check_permission'],
            ],
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_recurring_rule'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Preview recurring rule dates
        register_rest_route($namespace, '/' . $rulesBase . '/(?P<id>[\d]+)/preview', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'preview_recurring_rule'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);
    }

    /**
     * Check permission
     */
    public function check_permission(?WP_REST_Request $request = null): bool
    {
        return current_user_can('manage_options');
    }

    // =========================================================================
    // DEPARTURES ENDPOINTS
    // =========================================================================

    /**
     * GET /trips/{trip_id}/departures
     */
    public function get_departures(WP_REST_Request $request): WP_REST_Response
    {
        $tripId = (int) $request->get_param('trip_id');
        $status = $request->get_param('status');
        $source = $request->get_param('source');
        $dateFrom = $request->get_param('date_from');
        $dateTo = $request->get_param('date_to');
        $includePast = $request->get_param('include_past') !== 'false';
        
        $filters = [];
        if ($status) $filters['status'] = $status;
        if ($source) $filters['source'] = $source;
        if ($dateFrom && trim($dateFrom) !== '') $filters['date_from'] = $dateFrom;
        if ($dateTo && trim($dateTo) !== '') $filters['date_to'] = $dateTo;
        $filters['include_past'] = $includePast;
        
        try {
            $departures = $this->departureService->getByTripId($tripId, $filters);
            
            // Get trip information
            $tripRepository = new \Yatra\Repositories\TripRepository();
            $trip = $tripRepository->find($tripId);
            
            // Get booking departure repository for booking links
            $bookingDepartureRepo = new \Yatra\Repositories\BookingDepartureRepository();
            $travellerRepo = new \Yatra\Repositories\TravellerRepository();
            $bookingRepo = new \Yatra\Repositories\BookingRepository();
            
            // Get capacity service to sync capacity from availability
            $capacityService = new \Yatra\Services\CapacityService();
            $departureRepo = new \Yatra\Repositories\DepartureRepository();
            
            return new WP_REST_Response([
                'success' => true,
                'data' => array_map(function ($d) use ($trip, $bookingDepartureRepo, $travellerRepo, $bookingRepo, $capacityService, $departureRepo) {
                    // Sync capacity from availability before returning
                    $date = $d->start_date ?: $d->date;
                    $correctCapacity = $capacityService->getCapacityForDate($d->trip_id, $date);
                    if ($correctCapacity > 0 && $d->max_capacity !== $correctCapacity) {
                        $departureRepo->update($d->id, ['max_capacity' => $correctCapacity]);
                        $d->max_capacity = $correctCapacity;
                    }
                    
                    $departureArray = $d->toArray();
                    
                    // Add trip information
                    if ($trip) {
                        $departureArray['trip'] = [
                            'id' => (int) $trip->id,
                            'title' => $trip->title ?? '',
                            'slug' => $trip->slug ?? '',
                        ];
                    }
                    
                    // Add booking links and get travelers
                    $bookingIds = $bookingDepartureRepo->getBookingsForDeparture($d->id);
                    $departureArray['booking_ids'] = $bookingIds;
                    $departureArray['bookings_count'] = count($bookingIds);
                    
                    // Recalculate revenue for departures with bookings
                    if (!empty($bookingIds)) {
                        try {
                            // Call the service method to recalculate revenue
                            $totalRevenue = 0.00;
                            foreach ($bookingIds as $bookingId) {
                                $booking = $bookingRepo->find($bookingId);
                                if ($booking && !empty($booking->total_amount)) {
                                    $totalRevenue += (float) $booking->total_amount;
                                }
                            }
                            // Set revenue in the array directly
                            $departureArray['total_revenue'] = $totalRevenue;
                        } catch (\Exception $e) {
                            // If any error occurs, leave the original value
                            error_log('Error calculating departure revenue: ' . $e->getMessage());
                        }
                    }
                    
                    // Get all travelers for this departure
                    $allTravelers = [];
                    foreach ($bookingIds as $bookingId) {
                        $travelers = $travellerRepo->getByBookingId($bookingId);
                        $booking = $bookingRepo->find($bookingId);
                        foreach ($travelers as $traveler) {
                            $fields = $traveler['fields'] ?? [];
                            
                            $firstName = $fields['first_name']
                                ?? $traveler['first_name']
                                ?? ($booking->contact_first_name ?? '');
                            $lastName = $fields['last_name']
                                ?? $traveler['last_name']
                                ?? ($booking->contact_last_name ?? '');

                            $email = $fields['email']
                                ?? $fields['contact_email']
                                ?? $fields['primary_email']
                                ?? ($booking->contact_email ?? '');

                            $phone = $fields['phone']
                                ?? $fields['contact_phone']
                                ?? $fields['mobile_phone']
                                ?? $fields['whatsapp']
                                ?? ($booking->contact_phone ?? '');

                            $allTravelers[] = [
                                'id' => (int) $traveler['id'],
                                'booking_id' => $bookingId,
                                'booking_reference' => $booking ? ($booking->reference ?? '') : '',
                                'is_lead' => (bool) ($traveler['is_lead'] ?? false),
                                'first_name' => $firstName,
                                'last_name' => $lastName,
                                'email' => $email,
                                'phone' => $phone,
                            ];
                        }
                    }
                    $departureArray['travelers'] = $allTravelers;
                    $departureArray['travelers_count'] = count($allTravelers);
                    
                    // Format time for display (remove seconds if present)
                    if (!empty($departureArray['time'])) {
                        $time = $departureArray['time'];
                        // Convert HH:MM:SS to HH:MM if needed
                        if (strlen($time) > 5 && substr_count($time, ':') === 2) {
                            $departureArray['time'] = substr($time, 0, 5);
                        }
                    }
                    
                    // Debug: Log time and revenue values
                    error_log('Departure ID: ' . $d->id . ' - Time: ' . ($departureArray['time'] ?? 'NULL') . ' - Revenue: ' . ($departureArray['total_revenue'] ?? 'NULL'));
                    
                    return $departureArray;
                }, $departures),
                'meta' => [
                    'total' => count($departures),
                ],
            ]);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * GET /trips/{trip_id}/departures/{id}
     */
    public function get_departure(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $tripId = (int) $request->get_param('trip_id');

        $repo = new DepartureRepository();
        $departure = $repo->findModel($id);

        if (!$departure) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Departure not found',
            ], 404);
        }

        // Sync capacity from availability before returning
        $capacityService = new \Yatra\Services\CapacityService();
        $date = $departure->start_date ?: $departure->date;
        $correctCapacity = $capacityService->getCapacityForDate($departure->trip_id, $date);
        if ($correctCapacity > 0 && $departure->max_capacity !== $correctCapacity) {
            $repo->update($departure->id, ['max_capacity' => $correctCapacity]);
            $departure->max_capacity = $correctCapacity;
        }

        // Base departure array
        $departureArray = $departure->toArray();

        // Trip information
        $tripRepository = new \Yatra\Repositories\TripRepository();
        $trip = $tripRepository->find($tripId ?: $departure->trip_id);
        if ($trip) {
            // Log trip data for debugging
            \Yatra\Utils\Logger::info("Trip data for departure {$departure->id}: " . json_encode([
                'duration' => $trip->duration ?? 'NULL',
                'group_type' => $trip->group_type ?? 'NULL',
                'difficulty_level' => $trip->difficulty_level ?? 'NULL',
                'min_travelers' => $trip->min_travelers ?? 'NULL',
                'max_travelers' => $trip->max_travelers ?? 'NULL',
            ]));
            
            // Fetch difficulty level name from difficulty_levels table
            $difficultyLevelName = '';
            if (!empty($trip->difficulty_level) && is_numeric($trip->difficulty_level)) {
                $difficultyRepo = new \Yatra\Repositories\DifficultyLevelRepository();
                $difficultyLevel = $difficultyRepo->find((int) $trip->difficulty_level);
                if ($difficultyLevel) {
                    $difficultyLevelName = $difficultyLevel->name ?? '';
                }
            }
            
            // Fetch group type name from traveler_categories table
            $groupTypeName = '';
            if (!empty($trip->group_type) && is_numeric($trip->group_type)) {
                $travelerCategoryRepo = new \Yatra\Repositories\TravelerCategoryRepository();
                $travelerCategory = $travelerCategoryRepo->find((int) $trip->group_type);
                if ($travelerCategory) {
                    $groupTypeName = $travelerCategory->name ?? '';
                }
            }
            
            $departureArray['trip'] = [
                'id' => (int) $trip->id,
                'title' => $trip->title ?? '',
                'slug' => $trip->slug ?? '',
                'summary' => $trip->short_description
                    ?? $trip->excerpt
                    ?? $trip->summary
                    ?? '',
                'starting_location' => $trip->starting_location ?? '',
                'ending_location' => $trip->ending_location ?? '',
                'difficulty_level' => $difficultyLevelName,
                'group_type' => $groupTypeName,
                'min_travelers' => $trip->min_travelers ?? null,
                'max_travelers' => $trip->max_travelers ?? null,
                'duration' => $trip->duration ?? null,
                'price' => $trip->price ?? null,
                'created_at' => $trip->created_at ?? '',
            ];
        }

        // Related bookings and travelers (mirror get_departures logic)
        $bookingDepartureRepo = new \Yatra\Repositories\BookingDepartureRepository();
        $travellerRepo = new \Yatra\Repositories\TravellerRepository();
        $bookingRepo = new \Yatra\Repositories\BookingRepository();

        $bookingIds = $bookingDepartureRepo->getBookingsForDeparture($departure->id);
        $departureArray['booking_ids'] = $bookingIds;
        $departureArray['bookings_count'] = count($bookingIds);

        // Calculate total revenue from bookings (simple sum of total_amount like list endpoint)
        if (!empty($bookingIds)) {
            try {
                $totalRevenue = 0.00;
                foreach ($bookingIds as $bookingId) {
                    $booking = $bookingRepo->find($bookingId);
                    if ($booking && !empty($booking->total_amount)) {
                        $totalRevenue += (float) $booking->total_amount;
                    }
                }
                $departureArray['total_revenue'] = $totalRevenue;
            } catch (\Exception $e) {
                // Leave original value on error
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log('Error calculating single departure revenue: ' . $e->getMessage());
                }
            }
        }

        // Travelers linked to this departure
        $allTravelers = [];
        foreach ($bookingIds as $bookingId) {
            $travelers = $travellerRepo->getByBookingId($bookingId);
            $booking = $bookingRepo->find($bookingId);
            foreach ($travelers as $traveler) {
                $fields = $traveler['fields'] ?? [];

                $firstName = $fields['first_name']
                    ?? $traveler['first_name']
                    ?? ($booking->contact_first_name ?? '');
                $lastName = $fields['last_name']
                    ?? $traveler['last_name']
                    ?? ($booking->contact_last_name ?? '');

                $email = $fields['email']
                    ?? $fields['contact_email']
                    ?? $fields['primary_email']
                    ?? ($booking->contact_email ?? '');

                $phone = $fields['phone']
                    ?? $fields['contact_phone']
                    ?? $fields['mobile_phone']
                    ?? $fields['whatsapp']
                    ?? ($booking->contact_phone ?? '');

                $allTravelers[] = [
                    'id' => (int) $traveler['id'],
                    'booking_id' => $bookingId,
                    'booking_reference' => $booking ? ($booking->reference ?? '') : '',
                    'is_lead' => (bool) ($traveler['is_lead'] ?? false),
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $email,
                    'phone' => $phone,
                ];
            }
        }
        $departureArray['travelers'] = $allTravelers;
        $departureArray['travelers_count'] = count($allTravelers);

        // Format time (HH:MM)
        if (!empty($departureArray['time'])) {
            $time = $departureArray['time'];
            if (strlen($time) > 5 && substr_count($time, ':') === 2) {
                $departureArray['time'] = substr($time, 0, 5);
            }
        }

        return new WP_REST_Response([
            'success' => true,
            'data' => $departureArray,
        ]);
    }

    /**
     * POST /trips/{trip_id}/departures
     */
    public function create_departure(WP_REST_Request $request): WP_REST_Response
    {
        $tripId = (int) $request->get_param('trip_id');
        $data = $request->get_json_params();
        $data['trip_id'] = $tripId;
        
        try {
            $id = $this->departureService->create($data);
            
            $repo = new DepartureRepository();
            $departure = $repo->findModel($id);
            
            return new WP_REST_Response([
                'success' => true,
                'data' => $departure->toArray(),
                'message' => 'Departure created successfully',
            ], 201);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * PUT /trips/{trip_id}/departures/{id}
     */
    public function update_departure(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $data = $request->get_json_params();
        
        try {
            $this->departureService->update($id, $data);
            
            $repo = new DepartureRepository();
            $departure = $repo->findModel($id);
            
            return new WP_REST_Response([
                'success' => true,
                'data' => $departure->toArray(),
                'message' => 'Departure updated successfully',
            ]);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * DELETE /trips/{trip_id}/departures/{id}
     */
    public function delete_departure(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        
        try {
            $this->departureService->delete($id);
            
            return new WP_REST_Response([
                'success' => true,
                'message' => 'Departure deleted successfully',
            ]);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * GET /departures
     * Get departures from all trips
     */
    public function get_all_departures(WP_REST_Request $request): WP_REST_Response
    {
        $status = $request->get_param('status');
        $source = $request->get_param('source');
        $dateFrom = $request->get_param('date_from');
        $dateTo = $request->get_param('date_to');
        $includePast = $request->get_param('include_past') !== 'false';
        
        $filters = [];
        if ($status) $filters['status'] = $status;
        if ($source) $filters['source'] = $source;
        if ($dateFrom && trim($dateFrom) !== '') $filters['date_from'] = $dateFrom;
        if ($dateTo && trim($dateTo) !== '') $filters['date_to'] = $dateTo;
        $filters['include_past'] = $includePast;
        
        try {
            // Get all departures (no trip filter)
            $departures = $this->departureService->getAllDepartures($filters);
            
            // Get repository for additional data
            $bookingDepartureRepo = new \Yatra\Repositories\BookingDepartureRepository();
            $travellerRepo = new \Yatra\Repositories\TravellerRepository();
            $bookingRepo = new \Yatra\Repositories\BookingRepository();
            $tripRepository = new \Yatra\Repositories\TripRepository();
            
            // Get capacity service to sync capacity from availability
            $capacityService = new \Yatra\Services\CapacityService();
            $departureRepo = new \Yatra\Repositories\DepartureRepository();
            
            // Process each departure to add related data
            $processed = array_map(function ($d) use ($tripRepository, $bookingDepartureRepo, $travellerRepo, $bookingRepo, $capacityService, $departureRepo) {
                // Sync capacity from availability before returning
                $date = $d->start_date ?: $d->date;
                $correctCapacity = $capacityService->getCapacityForDate($d->trip_id, $date);
                if ($correctCapacity > 0 && $d->max_capacity !== $correctCapacity) {
                    $departureRepo->update($d->id, ['max_capacity' => $correctCapacity]);
                    $d->max_capacity = $correctCapacity;
                }
                
                $departureArray = $d->toArray();
                
                // Add trip information
                $trip = $tripRepository->find($d->trip_id);
                if ($trip) {
                    $departureArray['trip'] = [
                        'id' => (int) $trip->id,
                        'title' => $trip->title ?? '',
                        'slug' => $trip->slug ?? '',
                    ];
                }
                
                // Add booking links and get travelers
                $bookingIds = $bookingDepartureRepo->getBookingsForDeparture($d->id);
                $departureArray['booking_ids'] = $bookingIds;
                $departureArray['bookings_count'] = count($bookingIds);
                
                // Recalculate revenue for departures with bookings
                if (!empty($bookingIds)) {
                    try {
                        $totalRevenue = 0.00;
                        foreach ($bookingIds as $bookingId) {
                            $booking = $bookingRepo->find($bookingId);
                            if ($booking && !empty($booking->total_amount)) {
                                $totalRevenue += (float) $booking->total_amount;
                            }
                        }
                        $departureArray['total_revenue'] = $totalRevenue;
                    } catch (\Exception $e) {
                        error_log('Error calculating departure revenue: ' . $e->getMessage());
                    }
                }
                
                // Get all travelers for this departure
                $allTravelers = [];
                foreach ($bookingIds as $bookingId) {
                    $travelers = $travellerRepo->getByBookingId($bookingId);
                    $booking = $bookingRepo->find($bookingId);
                    foreach ($travelers as $traveler) {
                        $fields = $traveler['fields'] ?? [];
                        
                        $firstName = $fields['first_name']
                            ?? $traveler['first_name']
                            ?? ($booking->contact_first_name ?? '');
                        $lastName = $fields['last_name']
                            ?? $traveler['last_name']
                            ?? ($booking->contact_last_name ?? '');
                        
                        $email = $fields['email']
                            ?? $fields['contact_email']
                            ?? $fields['primary_email']
                            ?? ($booking->contact_email ?? '');
                        
                        $phone = $fields['phone']
                            ?? $fields['contact_phone']
                            ?? $fields['mobile_phone']
                            ?? $fields['whatsapp']
                            ?? ($booking->contact_phone ?? '');
                        
                        $allTravelers[] = [
                            'id' => (int) $traveler['id'],
                            'booking_id' => $bookingId,
                            'booking_reference' => $booking ? ($booking->reference ?? '') : '',
                            'is_lead' => (bool) ($traveler['is_lead'] ?? false),
                            'first_name' => $firstName,
                            'last_name' => $lastName,
                            'email' => $email,
                            'phone' => $phone,
                        ];
                    }
                }
                $departureArray['travelers'] = $allTravelers;
                $departureArray['travelers_count'] = count($allTravelers);
                
                // Format time for display (remove seconds if present)
                if (!empty($departureArray['time'])) {
                    $time = $departureArray['time'];
                    if (strlen($time) > 5 && substr_count($time, ':') === 2) {
                        $departureArray['time'] = substr($time, 0, 5);
                    }
                }
                
                return $departureArray;
            }, $departures);
            
            return new WP_REST_Response([
                'success' => true,
                'data' => $processed,
                'meta' => [
                    'total' => count($processed),
                ],
            ]);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
    
    /**
     * GET /trips/{trip_id}/departures/past
     */
    public function get_past_departures(WP_REST_Request $request): WP_REST_Response
    {
        $tripId = (int) $request->get_param('trip_id');
        
        try {
            $departures = $this->departureService->getPastByTripId($tripId);
            
            return new WP_REST_Response([
                'success' => true,
                'data' => array_map(function ($d) {
                    return $d->toArray();
                }, $departures),
            ]);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * GET /trips/{trip_id}/available-dates
     * Public endpoint for frontend to get available dates
     */
    public function get_available_dates(WP_REST_Request $request): WP_REST_Response
    {
        $tripId = (int) $request->get_param('trip_id');
        $fromDate = $request->get_param('from_date') ?: date('Y-m-d');
        $toDate = $request->get_param('to_date') ?: date('Y-m-d', strtotime('+12 months'));
        
        try {
            $dates = $this->departureService->getAvailableDates($tripId, $fromDate, $toDate);
            
            return new WP_REST_Response([
                'success' => true,
                'data' => $dates,
            ]);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    // =========================================================================
    // RECURRING RULES ENDPOINTS
    // =========================================================================

    /**
     * GET /trips/{trip_id}/recurring-rules
     */
    public function get_recurring_rules(WP_REST_Request $request): WP_REST_Response
    {
        $tripId = (int) $request->get_param('trip_id');
        $activeOnly = $request->get_param('active_only') === 'true';
        
        try {
            $rules = $this->ruleService->getByTripId($tripId, $activeOnly);
            
            return new WP_REST_Response([
                'success' => true,
                'data' => array_map(function ($r) {
                    return $r->toArray();
                }, $rules),
            ]);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * GET /trips/{trip_id}/recurring-rules/{id}
     */
    public function get_recurring_rule(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        
        $repo = new RecurringRuleRepository();
        $rule = $repo->findModel($id);
        
        if (!$rule) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Recurring rule not found',
            ], 404);
        }
        
        return new WP_REST_Response([
            'success' => true,
            'data' => $rule->toArray(),
        ]);
    }

    /**
     * POST /trips/{trip_id}/recurring-rules
     */
    public function create_recurring_rule(WP_REST_Request $request): WP_REST_Response
    {
        $tripId = (int) $request->get_param('trip_id');
        $data = $request->get_json_params();
        $data['trip_id'] = $tripId;
        
        try {
            $id = $this->ruleService->create($data);
            
            $repo = new RecurringRuleRepository();
            $rule = $repo->findModel($id);
            
            return new WP_REST_Response([
                'success' => true,
                'data' => $rule->toArray(),
                'message' => 'Recurring rule created successfully',
            ], 201);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * PUT /trips/{trip_id}/recurring-rules/{id}
     */
    public function update_recurring_rule(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $data = $request->get_json_params();
        
        try {
            $this->ruleService->update($id, $data);
            
            $repo = new RecurringRuleRepository();
            $rule = $repo->findModel($id);
            
            return new WP_REST_Response([
                'success' => true,
                'data' => $rule->toArray(),
                'message' => 'Recurring rule updated successfully',
            ]);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * DELETE /trips/{trip_id}/recurring-rules/{id}
     */
    public function delete_recurring_rule(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        
        try {
            $this->ruleService->delete($id);
            
            return new WP_REST_Response([
                'success' => true,
                'message' => 'Recurring rule deleted successfully',
            ]);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * GET /trips/{trip_id}/recurring-rules/{id}/preview
     */
    public function preview_recurring_rule(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $count = (int) ($request->get_param('count') ?: 10);
        
        try {
            $dates = $this->ruleService->getPreviewDates($id, $count);
            
            return new WP_REST_Response([
                'success' => true,
                'data' => $dates,
            ]);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}

