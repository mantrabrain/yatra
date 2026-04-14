<?php

namespace Yatra\Controllers;

use Yatra\Services\AvailabilitySpecificDatesService;
use Yatra\Helpers\FormatHelper;
use Yatra\Helpers\ValidationHelper;

/**
 * Availability Specific Dates Controller Class
 * 
 * Handles HTTP requests for specific date availability management.
 * Provides REST API endpoints for CRUD operations.
 * 
 * @package Yatra\Controllers
 * @since 2.0.0
 */
class AvailabilitySpecificDatesController
{
    /**
     * @var AvailabilitySpecificDatesService Service instance
     */
    private $service;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->service = new AvailabilitySpecificDatesService();
    }

    /**
     * Register REST API routes
     */
    public function registerRoutes()
    {
        register_rest_route('yatra/v1', '/availability/specific-dates', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'getItems'],
                'permission_callback' => [$this, 'checkPermission'],
            ],
            [
                'methods' => 'POST',
                'callback' => [$this, 'createItem'],
                'permission_callback' => [$this, 'checkPermission'],
            ],
        ]);

        register_rest_route('yatra/v1', '/availability/specific-dates/(?P<id>\d+)', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'getItem'],
                'permission_callback' => [$this, 'checkPermission'],
            ],
            [
                'methods' => 'PUT',
                'callback' => [$this, 'updateItem'],
                'permission_callback' => [$this, 'checkPermission'],
            ],
            [
                'methods' => 'DELETE',
                'callback' => [$this, 'deleteItem'],
                'permission_callback' => [$this, 'checkPermission'],
            ],
        ]);

        register_rest_route('yatra/v1', '/availability/specific-dates/trip/(?P<tripId>\d+)', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'getDatesForTrip'],
                'permission_callback' => [$this, 'checkPermission'],
            ],
        ]);

        register_rest_route('yatra/v1', '/availability/specific-dates/trip/(?P<tripId>\d+)/available', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'getAvailableDates'],
                'permission_callback' => [$this, 'checkPermission'],
            ],
        ]);

        register_rest_route('yatra/v1', '/availability/specific-dates/trip/(?P<tripId>\d+)/check/(?P<date>[^/]+)', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'checkDateAvailability'],
                'permission_callback' => [$this, 'checkPermission'],
            ],
        ]);

        register_rest_route('yatra/v1', '/availability/specific-dates/trip/(?P<tripId>\d+)/booking-count', [
            [
                'methods' => 'POST',
                'callback' => [$this, 'updateBookingCount'],
                'permission_callback' => [$this, 'checkPermission'],
            ],
        ]);

        register_rest_route('yatra/v1', '/availability/specific-dates/trip/(?P<tripId>\d+)/increment', [
            [
                'methods' => 'POST',
                'callback' => [$this, 'incrementBookingCount'],
                'permission_callback' => [$this, 'checkPermission'],
            ],
        ]);

        register_rest_route('yatra/v1', '/availability/specific-dates/trip/(?P<tripId>\d+)/decrement', [
            [
                'methods' => 'POST',
                'callback' => [$this, 'decrementBookingCount'],
                'permission_callback' => [$this, 'checkPermission'],
            ],
        ]);

        register_rest_route('yatra/v1', '/availability/specific-dates/trip/(?P<tripId>\d+)/price-overrides', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'getPriceOverrides'],
                'permission_callback' => [$this, 'checkPermission'],
            ],
        ]);

        register_rest_route('yatra/v1', '/availability/specific-dates/trip/(?P<tripId>\d+)/delete-range', [
            [
                'methods' => 'DELETE',
                'callback' => [$this, 'deleteDateRange'],
                'permission_callback' => [$this, 'checkPermission'],
            ],
        ]);
    }

    /**
     * Get specific dates list
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function getItems(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $tripId = $request->get_param('trip_id');
            $startDate = $request->get_param('start_date');
            $endDate = $request->get_param('end_date');
            $page = $request->get_param('page') ?: 1;
            $perPage = $request->get_param('per_page') ?: 20;

            $args = [];
            if ($tripId) {
                $args['trip_id'] = (int) $tripId;
            }
            if ($startDate) {
                $args['start_date'] = $startDate;
            }
            if ($endDate) {
                $args['end_date'] = $endDate;
            }
            $args['page'] = $page;
            $args['per_page'] = $perPage;

            $result = $this->service->getAll($args);

            return new \WP_REST_Response([
                'success' => true,
                'data' => $result['data'],
                'pagination' => $result['pagination'],
            ], 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get specific date by ID
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function getItem(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            $item = $this->service->getById($id);

            if (!$item) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => 'Specific date record not found.',
                ], 404);
            }

            return new \WP_REST_Response([
                'success' => true,
                'data' => $item,
            ], 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Create new specific date record
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function createItem(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $data = $request->get_json_params();

            if (empty($data)) {
                throw new \InvalidArgumentException('No data provided.');
            }

            $id = $this->service->create($data);

            if (!$id) {
                throw new \RuntimeException('Failed to create specific date record.');
            }

            $item = $this->service->getById($id);

            return new \WP_REST_Response([
                'success' => true,
                'data' => $item,
                'message' => 'Specific date record created successfully.',
            ], 201);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Update specific date record
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function updateItem(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            $data = $request->get_json_params();

            if (empty($data)) {
                throw new \InvalidArgumentException('No data provided.');
            }

            $success = $this->service->update($id, $data);

            if (!$success) {
                throw new \RuntimeException('Failed to update specific date record.');
            }

            $item = $this->service->getById($id);

            return new \WP_REST_Response([
                'success' => true,
                'data' => $item,
                'message' => 'Specific date record updated successfully.',
            ], 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Delete specific date record
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function deleteItem(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            $success = $this->service->delete($id);

            if (!$success) {
                throw new \RuntimeException('Failed to delete specific date record.');
            }

            return new \WP_REST_Response([
                'success' => true,
                'message' => 'Specific date record deleted successfully.',
            ], 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get dates for a trip
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function getDatesForTrip(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $tripId = (int) $request->get_param('tripId');
            $startDate = $request->get_param('start_date') ?: date('Y-m-d');
            $endDate = $request->get_param('end_date') ?: date('Y-m-d', strtotime('+1 year'));

            $dates = $this->service->getDatesForTrip($tripId, $startDate, $endDate);

            return new \WP_REST_Response([
                'success' => true,
                'data' => $dates,
            ], 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get available dates for a trip
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function getAvailableDates(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $tripId = (int) $request->get_param('tripId');
            $startDate = $request->get_param('start_date') ?: date('Y-m-d');
            $endDate = $request->get_param('end_date') ?: date('Y-m-d', strtotime('+1 year'));

            $dates = $this->service->getAvailableDates($tripId, $startDate, $endDate);

            return new \WP_REST_Response([
                'success' => true,
                'data' => $dates,
            ], 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Check date availability
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function checkDateAvailability(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $tripId = (int) $request->get_param('tripId');
            $date = $request->get_param('date');

            $isAvailable = $this->service->isDateAvailable($tripId, $date);
            $availableSlots = $this->service->getAvailableSlots($tripId, $date);

            return new \WP_REST_Response([
                'success' => true,
                'data' => [
                    'is_available' => $isAvailable,
                    'available_slots' => $availableSlots,
                    'date' => $date,
                    'trip_id' => $tripId,
                ],
            ], 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Update booking count
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function updateBookingCount(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $tripId = (int) $request->get_param('tripId');
            $data = $request->get_json_params();

            if (!isset($data['date']) || !isset($data['booking_count'])) {
                throw new \InvalidArgumentException('Date and booking_count are required.');
            }

            $success = $this->service->updateBookingCount($tripId, $data['date'], (int) $data['booking_count']);

            if (!$success) {
                throw new \RuntimeException('Failed to update booking count.');
            }

            return new \WP_REST_Response([
                'success' => true,
                'message' => 'Booking count updated successfully.',
            ], 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Increment booking count
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function incrementBookingCount(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $tripId = (int) $request->get_param('tripId');
            $data = $request->get_json_params();

            if (!isset($data['date'])) {
                throw new \InvalidArgumentException('Date is required.');
            }

            $increment = $data['increment'] ?? 1;
            $success = $this->service->incrementBookingCount($tripId, $data['date'], (int) $increment);

            if (!$success) {
                throw new \RuntimeException('Failed to increment booking count.');
            }

            return new \WP_REST_Response([
                'success' => true,
                'message' => 'Booking count incremented successfully.',
            ], 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Decrement booking count
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function decrementBookingCount(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $tripId = (int) $request->get_param('tripId');
            $data = $request->get_json_params();

            if (!isset($data['date'])) {
                throw new \InvalidArgumentException('Date is required.');
            }

            $decrement = $data['decrement'] ?? 1;
            $success = $this->service->decrementBookingCount($tripId, $data['date'], (int) $decrement);

            if (!$success) {
                throw new \RuntimeException('Failed to decrement booking count.');
            }

            return new \WP_REST_Response([
                'success' => true,
                'message' => 'Booking count decremented successfully.',
            ], 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get price overrides for a trip
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function getPriceOverrides(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $tripId = (int) $request->get_param('tripId');
            $startDate = $request->get_param('start_date') ?: date('Y-m-d');
            $endDate = $request->get_param('end_date') ?: date('Y-m-d', strtotime('+1 year'));

            $overrides = $this->service->getDatesWithPriceOverrides($tripId, $startDate, $endDate);

            return new \WP_REST_Response([
                'success' => true,
                'data' => $overrides,
            ], 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Delete date range for a trip
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function deleteDateRange(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $tripId = (int) $request->get_param('tripId');
            $data = $request->get_json_params();

            if (!isset($data['start_date']) || !isset($data['end_date'])) {
                throw new \InvalidArgumentException('Start date and end date are required.');
            }

            $deletedCount = $this->service->deleteDatesInRange($tripId, $data['start_date'], $data['end_date']);

            return new \WP_REST_Response([
                'success' => true,
                'message' => "Deleted {$deletedCount} specific date records.",
                'deleted_count' => $deletedCount,
            ], 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Check user permissions
     * 
     * @param \WP_REST_Request $request REST request object
     * @return bool Permission status
     */
    public function checkPermission(\WP_REST_Request $request): bool
    {
        // Check if user has capability to manage trips
        return current_user_can('manage_yatra_trips') || current_user_can('manage_options');
    }
}
