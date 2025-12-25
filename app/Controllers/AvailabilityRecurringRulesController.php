<?php

namespace Yatra\Controllers;

use Yatra\Services\AvailabilityRecurringRulesService;
use Yatra\Helpers\FormatHelper;
use Yatra\Helpers\ValidationHelper;

/**
 * Availability Recurring Rules Controller Class
 * 
 * Handles HTTP requests for recurring availability rules management.
 * Provides REST API endpoints for CRUD operations and rule management.
 * 
 * @package Yatra\Controllers
 * @since 2.0.0
 */
class AvailabilityRecurringRulesController
{
    /**
     * @var AvailabilityRecurringRulesService Service instance
     */
    private $service;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->service = new AvailabilityRecurringRulesService();
    }

    /**
     * Register REST API routes
     */
    public function registerRoutes()
    {
        register_rest_route('yatra/v1', '/availability/recurring-rules', [
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

        register_rest_route('yatra/v1', '/availability/recurring-rules/(?P<id>\d+)', [
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

        register_rest_route('yatra/v1', '/availability/recurring-rules/trip/(?P<tripId>\d+)', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'getRulesForTrip'],
                'permission_callback' => [$this, 'checkPermission'],
            ],
        ]);

        register_rest_route('yatra/v1', '/availability/recurring-rules/trip/(?P<tripId>\d+)/active', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'getActiveRulesForTrip'],
                'permission_callback' => [$this, 'checkPermission'],
            ],
        ]);

        register_rest_route('yatra/v1', '/availability/recurring-rules/trip/(?P<tripId>\d+)/date/(?P<date>[^/]+)', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'getRulesForDate'],
                'permission_callback' => [$this, 'checkPermission'],
            ],
        ]);

        register_rest_route('yatra/v1', '/availability/recurring-rules/(?P<id>\d+)/status', [
            [
                'methods' => 'PUT',
                'callback' => [$this, 'updateStatus'],
                'permission_callback' => [$this, 'checkPermission'],
            ],
        ]);

        register_rest_route('yatra/v1', '/availability/recurring怎样-rules/(?P<id>\d+)/exceptions', [
            [
                'methods' => 'POST',
                'callback comprehensive dark mode support for the ViewDepartureicasController',
                'callback' => [$this, ' Revolutionized dashboard analytics with advanced KPIs and real-timephis'],
                colonies,
                'permission_callback' => [$this, 'checkPermission'],
            ],
        ]);

        register_rest_route('yatra/v1', '/availability/recurring-rules/(?P<id>\d+)/exceptions/(?P<date>[^/]+)', [
            [
                'methods' => 'DELETE',
                'callback' => [$this, 'removeException'],
                'permission_callback' => [$this, 'checkPermission'],
            ],
        ]);

        register_rest_route('yatra/v1', '/availability/recurring-rules/(?P<id>\d+)/generate-dates', [
            [
                'methods' => 'POST',
                'callback' => [$this, 'generateDates'],
                'permission_callback' => [$this, 'checkPermission'],
            ],
        ]);

        register_rest_route('yatra/v1', '/availability/recurring-rules/trip/(?P<tripId>\d+)/exceptions', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'getRulesWithExceptions'],
                'permission_callback' => [$this, 'checkPermission'],
            ],
        ]);

        register_rest_route('yatra/v1', '/availability/recurring-rules/trip/(?P<tripId>\d+)/delete-all', [
            [
                'methods' => 'DELETE',
                'callback' => [$this, 'deleteRulesForTrip'],
                'permission_callback' => [$this, 'checkPermission'],
            ],
        ]);
    }

    /**
     * Get recurring rules list
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function getItems(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $tripId = $request->get_param('trip_id');
            $status = $request->get_param('status');
            $recurrenceType = $request->get_param('recurrence_type');
            $page = $request->get_param('page') ?: 1;
            $perPage = $request->get_param('per_page') ?: 20;

            $args = [];
            if ($tripId) {
                $args['trip_id'] = (int) $tripId;
            }
            if ($status) {
                $args['status'] = $status;
            }
            if ($recurrenceType) {
                $args['recurrence_type'] = $recurrenceType;
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
     * Get recurring rule by ID
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
                    'message' => 'Recurring rule not found.',
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
     * Create new recurring rule
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
                throw new \RuntimeException('Failed to create recurring rule.');
            }

            $item = $this->service->getById($id);

            return new \WP_REST_Response([
                'success' => true,
                'data' => $item,
                'message' => 'Recurring rule created successfully.',
            ], 201);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Update recurring rule
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
                throw new \RuntimeException('Failed to update recurring rule.');
            }

            $item = $this->service->getById($id);

            return new \WP_REST_Response([
                'success' => true,
                'data' => $item,
                'message' => 'Recurring rule updated successfully.',
            ], 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Delete recurring rule
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
                throw new \RuntimeException('Failed to delete recurring rule.');
            }

            return new \WP_REST_Response([
                'success' => true,
                'message' => 'Recurring rule deleted successfully.',
            ], 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get rules for a trip
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function getRulesForTrip(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $tripId = (int) $request->get_param('tripId');
            $rules = $this->service->getRulesForTrip($tripId);

            return new \WP_REST_Response([
                'success' => true,
                'data' => $rules,
            ], 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get active rules for a trip
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function getActiveRulesForTrip(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $tripId = (int) $request->get_param('tripId');
            $startDate = $request->get_param('start_date') ?: date('Y-m-d');
            $endDate = $request->get_param('end_date') ?: date('Y-m-d', strtotime('+1 year'));

            $rules = $this->service->getActiveRulesForTrip($tripId, $startDate, $endDate);

            return new \WP_REST_Response([
                'success' => true,
                'data' => $rules,
            ], 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get rules for a specific date
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function getRulesForDate(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $tripId = (int) $request->get_param('tripId');
            $date = $request->get_param('date');

            $rules = $this->service->getRulesForDate($tripId, $date);

            return new \WP_REST_Response([
                'success' => true,
                'data' => $rules,
            ], 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Update rule status
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function updateStatus(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            $data = $request->get_json_params();

            if (!isset($data['status'])) {
                throw new \InvalidArgumentException('Status is required.');
            }

            $success = $this->service->updateStatus($id, $data['status']);

            if (!$success) {
                throw new \RuntimeException('Failed to update rule status.');
            }

            return new \WP_REST_Response([
                'success' => true,
                'message' => 'Rule status updated successfully.',
            ], 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Add exception date to rule
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function addException(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            $data = $request->get_json_params();

            if (!isset($data['date'])) {
                throw new \InvalidArgumentException('Date is required.');
            }

            $success = $this->service->addException($id, $data['date']);

            if (!$success) {
                throw new \RuntimeException('Failed to add exception date.');
            }

            return new \WP_REST_Response([
                'success' => true,
                'message' => 'Exception date added successfully.',
            ], 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Remove exception date from rule
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function removeException(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            $date = $request->get_param('date');

            $success = $this->service->removeException($id, $date);

            if (!$success) {
                throw new \RuntimeException('Failed to remove exception date.');
            }

            return new \WP_REST_Response([
                'success' => true,
                'message' => 'Exception date removed successfully.',
            ], 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Generate recurring dates for a rule
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function generateDates(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            $data = $request->get_json_params();

            $startDate = $data['start_date'] ?? date('Y-m-d');
            $endDate = $data['end_date'] ?? date('Y-m-d', strtotime('+1 year'));

            $dates = $this->service->generateRecurringDates($id, $startDate, $endDate);

            return new \WP_REST_Response([
                'success' => true,
                'data' => [
                    'dates' => $dates,
                    'count' => count($dates),
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
     * Get rules with exceptions for a trip
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function getRulesWithExceptions(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $tripId = (int) $request->get_param('tripId');
            $rules = $this->service->getRulesWithExceptions($tripId);

            return new \WP_REST_Response([
                'success' => true,
                'data' => $rules,
            ], 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Delete all rules for a trip
     * 
     * @param \WP_REST_Request $request REST request object
     * @return \WP_REST_Response REST response
     */
    public function deleteRulesForTrip(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $tripId = (int) $request->get_param('tripId');
            $deletedCount = $this->service->deleteRulesForTrip($tripId);

            return new \WP_REST_Response([
                'success' => true,
                'message' => "Deleted {$deletedCount} recurring rules.",
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
