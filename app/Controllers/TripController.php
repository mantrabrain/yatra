<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Database\Tables\TripsTable;
use Yatra\Services\TripService;
use Yatra\Repositories\TripRevisionRepository;
use Yatra\Repositories\ItemTypeRepository;
use Yatra\Repositories\ItemRepository;
use Yatra\Repositories\TravelerCategoryRepository;
use Yatra\Models\Trip;
use Yatra\Validators\TripValidator;
use Yatra\Exceptions\TripNotFoundException;
use Yatra\Exceptions\ValidationException;
use Yatra\Database\Tables\TripAvailabilityDatesTable;

/**
 * Trip REST API Controller
 * Comprehensive API endpoints for trip management
 * 
 * Expert-level controller design:
 * - Full field support
 * - Relationship handling
 * - Proper data transformation
 * - Error handling
 */
class TripController extends BaseController
{
    /**
     * @var TripService
     */
    private TripService $service;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->service = new TripService();
    }

    /**
     * Register routes
     */
    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        $base = 'trips';

        // Debug: Log route registration
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra TripController: Registering routes for namespace: ' . $namespace . ', base: ' . $base);
        }

        // Add a simple test endpoint first
        register_rest_route($namespace, '/test', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => function() {
                    return new \WP_REST_Response(['message' => 'TripController test endpoint working', 'timestamp' => time()], 200);
                },
                'permission_callback' => '__return_true',
            ],
        ]);

        register_rest_route($namespace, '/' . $base, [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'check_read_permission'],
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Duplicate trip: POST /trips/{id}/duplicate
        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)/duplicate', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'duplicate_item'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'check_read_permission'],
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

        // Permanent delete endpoint
        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)/permanent-delete', [
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'permanent_delete_item'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Search endpoint
        register_rest_route($namespace, '/' . $base . '/search', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'search_items'],
                'permission_callback' => [$this, 'check_read_permission'],
            ],
        ]);

        // Revisions endpoints
        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)/revisions', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_revisions'],
                'permission_callback' => [$this, 'check_read_permission'],
            ],
        ]);

        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)/revisions/(?P<revision_id>[\d]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_revision'],
                'permission_callback' => [$this, 'check_read_permission'],
            ],
            [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'restore_revision'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Availability template endpoint (public, no auth required)
        // Register BEFORE the generic /trips/{id} route to ensure it matches first
        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)/availability-template', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_availability_template'],
                'permission_callback' => '__return_true', // Public endpoint
            ],
        ]);

        // Date-specific pricing endpoint (public, no auth required)
        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)/date-pricing', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_date_pricing'],
                'permission_callback' => '__return_true', // Public endpoint
            ],
        ]);

        // Public endpoint for frontend trip listings
        register_rest_route($namespace, '/' . $base . '/public', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_public_trips'],
                'permission_callback' => '__return_true', // Public endpoint
            ],
        ]);

        // Status statistics for admin views
        register_rest_route($namespace, '/' . $base . '/stats', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getStats'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Trip attributes endpoints
        // Test endpoint to verify routing works
        register_rest_route($namespace, '/' . $base . '/test', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [$this, 'test_endpoint'],
            'permission_callback' => '__return_true', // Temporarily bypass auth for testing
        ]);

        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)/attributes', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_trip_attributes'],
                'permission_callback' => '__return_true', // Temporarily bypass auth for testing
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'update_trip_attributes'],
                'permission_callback' => '__return_true', // Temporarily bypass auth for testing
            ],
        ]);

        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)/attributes/(?P<attribute_id>[\d]+)', [
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_trip_attribute'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);
    }

    /**
     * Get statistics for admin trip views (status counts)
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
     * Duplicate trip
     *
     * Endpoint: POST /trips/{id}/duplicate
     */
    public function duplicate_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');

            if ($id <= 0) {
                return $this->error_response(__('Invalid trip ID', 'yatra'), 400);
            }

            $newId = $this->service->duplicate($id);

            return $this->success_response([
                'message' => __('Trip duplicated as draft', 'yatra'),
                'id'      => $newId,
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->error_response($e->getMessage(), 400);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get items
     */
    public function get_items(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            // For admin listing, show more items by default to see all trips
            $default_limit = 20; // Increased from 10 to show all trips
            $args = [
                'limit' => (int) ($request->get_param('per_page') ?: $default_limit),
                'offset' => ((int) ($request->get_param('page') ?: 1) - 1) * (int) ($request->get_param('per_page') ?: $default_limit),
                'order_by' => $request->get_param('orderby') ?: 'id',
                'order' => strtoupper($request->get_param('order') ?: 'DESC'),
            ];

            // DEBUG: Log request parameters
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('[YATRA DEBUG] TripController get_items - Request params:');
                error_log('[YATRA DEBUG] - per_page: ' . $args['limit']);
                error_log('[YATRA DEBUG] - page: ' . ((int) ($request->get_param('page') ?: 1)));
                error_log('[YATRA DEBUG] - offset: ' . $args['offset']);
                error_log('[YATRA DEBUG] - status filter: ' . ($request->get_param('status') ?: 'none'));
                error_log('[YATRA DEBUG] - search: ' . ($request->get_param('search') ?: 'none'));
            }

            // Add status filter
            $status = $request->get_param('status');
            if ($status && $status !== 'all') {
                $args['where']['status'] = $status;
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log('[YATRA DEBUG] TripController - Applied status filter: ' . $status);
                }
            }

            // Add search
            $search = $request->get_param('search');
            if ($search) {
                $items = $this->service->search($search, $args);
                $total = count($items);
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log('[YATRA DEBUG] TripController - Search results: ' . count($items));
                }
            } else {
                // DEBUG: Use TripService to get trip counts
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    $direct_count = $this->service->count();
                    $publish_count = $this->service->countByStatus('publish');
                    $trash_count = $this->service->countByStatus('trash');
                    error_log('[YATRA DEBUG] TripController - Direct SQL count: ' . $direct_count);
                    error_log('[YATRA DEBUG] TripController - Status distribution: publish=' . $publish_count . ', trash=' . $trash_count);
                }
                
                // For admin listing, include all trips regardless of status or soft delete
                $args['include_deleted'] = true;
                $items = $this->service->getAll($args);
                $total = $this->service->count($args);
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log('[YATRA DEBUG] TripController - getAll results (with include_deleted): ' . count($items));
                    error_log('[YATRA DEBUG] TripController - Total count (with include_deleted): ' . $total);
                }
            }

            // Ensure traveler-based pricing trips have a usable base price in list view
            if (!empty($items)) {
                global $wpdb;
                $priceTypeTable = $wpdb->prefix . 'yatra_trip_price_types';

                foreach ($items as $item) {
                    // Skip if we already have a flat price set
                    $flatSale   = isset($item->sale_price) ? (float) $item->sale_price : 0.0;
                    $flatDisc   = isset($item->discounted_price) ? (float) $item->discounted_price : 0.0;
                    $flatOrig   = isset($item->original_price) ? (float) $item->original_price : 0.0;
                    $hasFlatAny = ($flatSale > 0) || ($flatDisc > 0) || ($flatOrig > 0);

                    if ($hasFlatAny) {
                        continue;
                    }

                    // Only compute for traveler-based pricing trips
                    $pricingType = $item->pricing_type ?? '';
                    if ($pricingType !== 'traveler_based') {
                        continue;
                    }

                    // Find the lowest and highest non-zero price across discount/original in price types
                    $tripService = new \Yatra\Services\TripService();
                    $priceRange = $tripService->getTripPriceRange((int) $item->id);
                    
                    if ($priceRange['min_price'] > 0 || $priceRange['max_price'] > 0) {
                        $minPrice = $priceRange['min_price'];
                        $maxPrice = $priceRange['max_price'];

                        if ($minPrice > 0) {
                            // Use min price as effective sale_price for list display
                            $item->sale_price = $minPrice;
                            $item->traveler_min_price = $minPrice;
                        }
                        if ($maxPrice > 0) {
                            $item->traveler_max_price = $maxPrice;
                        }
                    }
                }

                // Hydrate lightweight relationships for list view (destinations, activities, categories)
                $tripIds = array_map(static function ($item) {
                    return isset($item->id) ? (int) $item->id : 0;
                }, $items);
                $tripIds = array_values(array_filter($tripIds));

                if (!empty($tripIds)) {
                    // Destinations
                    $destByTrip = [];
                    foreach ($tripIds as $id) {
                        $row = $this->service->getWithRelations($id);
                        $destByTrip[$id] = [];
                        
                        if ($row && isset($row->destinations)) {
                            foreach ($row->destinations as $destination) {
                                $destByTrip[$id][] = (object) [
                                    'destination_id' => (int) $destination->id,
                                    'destination_name' => $destination->name,
                                    'destination_slug' => $destination->slug,
                                ];
                            }
                        }
                    }

                    // Activities
                    $actTable = $wpdb->prefix . 'yatra_trip_activities';
                    $actTaxTable = $wpdb->prefix . 'yatra_activities';
                    // Use TripService to get destinations
                    $destRows = $this->service->getTripDestinations($id);

                    // Use TripService to get activities
                    $actRows = [];
                    foreach ($tripIds as $id) {
                        $activities = $this->service->getTripActivities($id);
                        $actRows = array_merge($actRows, $activities);
                    }

                    $actByTrip = [];
                    foreach ($actRows as $row) {
                        $tId = (int) $row->trip_id;
                        if (!isset($actByTrip[$tId])) {
                            $actByTrip[$tId] = [];
                        }
                        $actByTrip[$tId][] = (object) [
                            'activity_id' => (int) $row->id,
                            'activity_name' => $row->name,
                            'activity_slug' => $row->slug,
                        ];
                    }

                    // Trip categories
                    $catRelTable = $wpdb->prefix . 'yatra_trip_trip_categories';
                    $catTaxTable = $wpdb->prefix . 'yatra_trip_categories';
                    // Use TripService to get categories
                    $catRows = [];
                    foreach ($tripIds as $id) {
                        $categories = $this->service->getTripCategories($id);
                        $catRows = array_merge($catRows, $categories);
                    }

                    $catByTrip = [];
                    foreach ($catRows as $row) {
                        $tId = (int) $row->trip_id;
                        if (!isset($catByTrip[$tId])) {
                            $catByTrip[$tId] = [];
                        }
                        $catByTrip[$tId][] = (object) [
                            'category_id' => (int) $row->id,
                            'category_name' => $row->name,
                            'category_slug' => $row->slug,
                        ];
                    }

                    // Attach grouped relations back to items so prepare_item_for_response can format them
                    foreach ($items as $item) {
                        $id = isset($item->id) ? (int) $item->id : 0;
                        if ($id <= 0) {
                            continue;
                        }
                        if (isset($destByTrip[$id])) {
                            $item->destinations = $destByTrip[$id];
                        }
                        if (isset($actByTrip[$id])) {
                            $item->activities = $actByTrip[$id];
                        }
                        if (isset($catByTrip[$id])) {
                            $item->trip_category = $catByTrip[$id];
                        }
                    }
                }
            }

            // Check if itinerary meta is requested (for Itinerary page)
            $include_meta = $request->get_param('include_itinerary_meta');
            $meta = [];
            
            if ($include_meta) {
                // Get available item types for itinerary mapping
                $itemTypeRepo = new ItemTypeRepository();
                $itemTypes = $itemTypeRepo->all(['where' => ['status' => 'publish']]);
                $meta['available_item_types'] = array_map(function ($type) {
                    $iconData = maybe_unserialize($type->icon ?? '');
                    $iconValue = '';
                    if (is_array($iconData) && isset($iconData['value'])) {
                        $iconValue = $iconData['value'];
                    } elseif (is_string($type->icon)) {
                        $iconValue = $type->icon;
                    }
                    
                    return [
                        'id' => (int) $type->id,
                        'name' => esc_html($type->name),
                        'icon' => $iconValue,
                        'color' => $type->color ?? 'gray',
                    ];
                }, $itemTypes);

                // Get available items for itinerary mapping
                $itemRepo = new ItemRepository();
                $allItems = $itemRepo->all(['where' => ['status' => 'publish']]);
                $meta['available_items'] = array_map(function ($item) {
                    return [
                        'id' => (int) $item->id,
                        'name' => esc_html($item->name),
                        'type_id' => (int) ($item->type_id ?? 0),
                    ];
                }, $allItems);
            }

            $response = [
                'data' => $this->prepare_collection_for_response($items, $request),
                'total' => $total,
                'page' => (int) ($request->get_param('page') ?: 1),
                'per_page' => $args['limit'], // Use the actual limit from args
            ];

            // DEBUG: Log final response
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('[YATRA DEBUG] TripController - Final response:');
                error_log('[YATRA DEBUG] - data count: ' . count($response['data']));
                error_log('[YATRA DEBUG] - total: ' . $response['total']);
                error_log('[YATRA DEBUG] - page: ' . $response['page']);
                error_log('[YATRA DEBUG] - per_page: ' . $response['per_page']);
            }

            if (!empty($meta)) {
                $response['meta'] = $meta;
            }

            return $this->success_response($response);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get single item
     */
    public function get_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            
            if ($id <= 0) {
                throw new ValidationException('Invalid trip ID', ['id' => ['Trip ID must be a positive integer']]);
            }
            
            // For editing, include deleted items so admins can edit trips in trash
            $item = $this->service->getWithRelations($id, true);

            if (!$item) {
                return $this->error_response('Trip not found', 404);
            }

            return $this->success_response($this->prepare_item_for_response($item, $request));
        } catch (\Exception $e) {
            return $this->handle_exception($e);
        }
    }

    /**
     * Create item
     */
    public function create_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $rawData = $request->get_json_params();
            $rawData = apply_filters('yatra_trip_create_raw_data', $rawData, $request);
            
            // Map old field names to new table schema
            if (isset($rawData['booking_deadline'])) {
                $rawData['booking_deadline_hours'] = $rawData['booking_deadline'];
                unset($rawData['booking_deadline']);
            }
            
            // Validate and sanitize input data
            TripValidator::validateCreate($rawData);
            $data = TripValidator::sanitize($rawData);
            $data = apply_filters('yatra_trip_create_sanitized_data', $data, $rawData, $request);
            
            // Extract relationships (fields stored in separate tables)
            $relationships = [
                'destinations' => $rawData['destinations'] ?? [],
                'activities' => $rawData['activity_types'] ?? [],
                'trip_category' => $rawData['trip_category'] ?? [],
                'price_types' => $rawData['price_types'] ?? [],
                'highlights' => $rawData['highlights'] ?? [],
                'gallery_images' => $rawData['gallery_images'] ?? [],
                'faqs' => $rawData['faqs'] ?? [],
                'itinerary_days' => $rawData['itinerary_days'] ?? [],
                'availability_dates' => $rawData['availability_dates'] ?? [],
            ];

            $relationships = apply_filters('yatra_trip_create_relationships', $relationships, $rawData, $request);

            $extraUnsetKeys = apply_filters('yatra_trip_create_unset_keys', [], $rawData, $relationships, $request);
            if (is_array($extraUnsetKeys) && !empty($extraUnsetKeys)) {
                foreach ($extraUnsetKeys as $key) {
                    if (is_string($key) && isset($rawData[$key])) {
                        unset($rawData[$key]);
                    }
                    if (is_string($key) && isset($data[$key])) {
                        unset($data[$key]);
                    }
                }
            }

            $id = $this->service->createWithRelations($data, $relationships);

            return $this->success_response([
                'id' => $id,
                'message' => __('Trip created successfully', 'yatra'),
            ], 201);
        } catch (\Exception $e) {
            return $this->handle_exception($e);
        }
    }

    /**
     * Update item
     */
    public function update_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $data = $request->get_json_params();
            $data = apply_filters('yatra_trip_update_raw_data', $data, $id, $request);

            // Map old field names to new table schema
            if (isset($data['booking_deadline'])) {
                $data['booking_deadline_hours'] = $data['booking_deadline'];
                unset($data['booking_deadline']);
            }

            // Extract relationships (fields stored in separate tables)
            $relationships = [];
            if (isset($data['destinations'])) {
                $relationships['destinations'] = $data['destinations'];
            }
            if (isset($data['activity_types'])) {
                $relationships['activities'] = $data['activity_types'];
            }
            if (isset($data['trip_category'])) {
                $relationships['trip_category'] = $data['trip_category'];
            }
            if (isset($data['price_types'])) {
                $relationships['price_types'] = $data['price_types'];
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log("Yatra TripController update_item: Added price_types to relationships: " . json_encode($data['price_types']));
                }
            }
            if (isset($data['highlights'])) {
                $relationships['highlights'] = $data['highlights'];
            }
            if (isset($data['gallery_images'])) {
                $relationships['gallery_images'] = $data['gallery_images'];
            }
            if (isset($data['faqs'])) {
                $relationships['faqs'] = $data['faqs'];
            }
            if (isset($data['itinerary_days'])) {
                $relationships['itinerary_days'] = $data['itinerary_days'];
            }
            if (isset($data['availability_dates'])) {
                $relationships['availability_dates'] = $data['availability_dates'];
            }
            if (isset($data['attributes'])) {
                error_log("Yatra TripController: update_item - RAW attributes from request: " . json_encode($data['attributes']));
                $relationships['attributes'] = $data['attributes'];
            }

            $relationships = apply_filters('yatra_trip_update_relationships', $relationships, $data, $request);

            // Validate and sanitize input data
            TripValidator::validateUpdate($data, $id);
            $data = TripValidator::sanitize($data);
            $data = apply_filters('yatra_trip_update_sanitized_data', $data, $id, $relationships, $request);

            $extraUnsetKeys = apply_filters('yatra_trip_update_unset_keys', [], $data, $relationships, $request);
            if (is_array($extraUnsetKeys) && !empty($extraUnsetKeys)) {
                foreach ($extraUnsetKeys as $key) {
                    if (is_string($key) && isset($data[$key])) {
                        unset($data[$key]);
                    }
                }
            }

            // Remove relationships from main data (these should not be in the main table)
            unset(
                $data['destinations'], 
                $data['activity_types'], 
                $data['trip_category'],
                $data['price_types'],
                $data['highlights'],
                $data['gallery_images'],
                $data['faqs'],
                $data['itinerary_days'],
                $data['availability_dates'],
                $data['attributes']
            );

            $result = $this->service->updateWithRelations($id, $data, $relationships);

            if (!$result) {
                return $this->error_response(__('Failed to update trip', 'yatra'), 500);
            }

            return $this->success_response([
                'message' => __('Trip updated successfully', 'yatra'),
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->error_response($e->getMessage(), 400);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Delete item (soft delete)
     */
    public function delete_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $result = $this->service->softDelete($id);

            if (!$result) {
                return $this->error_response(__('Failed to delete trip', 'yatra'), 500);
            }

            return $this->success_response([
                'message' => __('Trip deleted successfully', 'yatra'),
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Permanent delete item (hard delete)
     */
    public function permanent_delete_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            
            // DEBUG: Log permanent delete attempt
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('[YATRA DEBUG] TripController - Attempting permanent delete for trip ID: ' . $id);
            }
            
            $result = $this->service->permanentDelete($id);

            if (!$result) {
                error_log('[YATRA DEBUG] TripController - Permanent delete failed for trip ID: ' . $id);
                return $this->error_response(__('Failed to permanently delete trip', 'yatra'), 500);
            }

            // DEBUG: Log successful delete
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('[YATRA DEBUG] TripController - Successfully permanently deleted trip ID: ' . $id);
            }

            return $this->success_response([
                'message' => __('Trip permanently deleted', 'yatra'),
            ]);
        } catch (\Exception $e) {
            error_log('[YATRA DEBUG] TripController - Exception during permanent delete: ' . $e->getMessage());
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Search items
     */
    public function search_items(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $keyword = $request->get_param('keyword') ?: $request->get_param('search');
            
            if (empty($keyword)) {
                return $this->error_response(__('Search keyword is required', 'yatra'), 400);
            }

            $args = [
                'limit' => (int) ($request->get_param('per_page') ?: 10),
                'offset' => ((int) ($request->get_param('page') ?: 1) - 1) * (int) ($request->get_param('per_page') ?: 10),
                'order_by' => $request->get_param('orderby') ?: 'id',
                'order' => strtoupper($request->get_param('order') ?: 'DESC'),
            ];

            $items = $this->service->search($keyword, $args);

            return $this->success_response([
                'data' => $this->prepare_collection_for_response($items, $request),
                'total' => count($items),
                'page' => (int) ($request->get_param('page') ?: 1),
                'per_page' => (int) ($request->get_param('per_page') ?: 10),
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get revisions for a trip
     */
    public function get_revisions(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $revisionRepository = new TripRevisionRepository();
            
            $args = [
                'order_by' => 'version',
                'order' => 'DESC',
            ];
            
            $revisions = $revisionRepository->findByTripId($id, $args);
            
            $prepared = array_map(function ($revision) {
                $user = get_userdata($revision->created_by);
                return [
                    'id' => (int) $revision->id,
                    'trip_id' => (int) $revision->trip_id,
                    'version' => (int) $revision->version,
                    'status' => $revision->status ?? 'inherit',
                    'created_at' => $revision->created_at,
                    'created_by' => (int) $revision->created_by,
                    'created_by_name' => $user ? $user->display_name : __('Unknown', 'yatra'),
                ];
            }, $revisions);

            return $this->success_response($prepared);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get single revision
     */
    public function get_revision(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $revisionId = (int) $request->get_param('revision_id');
            $revisionRepository = new TripRevisionRepository();
            
            $revision = $revisionRepository->findRevision($revisionId);
            
            if (!$revision) {
                return $this->error_response(__('Revision not found', 'yatra'), 404);
            }

            if ((int) $revision->trip_id !== $id) {
                return $this->error_response(__('Revision does not belong to this trip', 'yatra'), 400);
            }

            // Unserialize the data
            $data = maybe_unserialize($revision->data);
            
            $user = get_userdata($revision->created_by);
            
            $prepared = [
                'id' => (int) $revision->id,
                'trip_id' => (int) $revision->trip_id,
                'version' => (int) $revision->version,
                'status' => $revision->status ?? 'inherit',
                'data' => $data,
                'created_at' => $revision->created_at,
                'created_by' => (int) $revision->created_by,
                'created_by_name' => $user ? $user->display_name : __('Unknown', 'yatra'),
            ];

            return $this->success_response($prepared);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Restore a revision (WordPress-style)
     */
    public function restore_revision(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            // Check permissions
            if (!current_user_can('yatra_edit_trips')) {
                return $this->error_response(__('You do not have permission to restore revisions', 'yatra'), 403);
            }

            $id = (int) $request->get_param('id');
            $revisionId = (int) $request->get_param('revision_id');

            if (!$id || !$revisionId) {
                return $this->error_response(__('Invalid trip ID or revision ID', 'yatra'), 400);
            }

            // Restore the revision
            $result = $this->service->restoreRevision($id, $revisionId);

            if (!$result) {
                return $this->error_response(__('Failed to restore revision', 'yatra'), 500);
            }

            // Get the updated trip
            $trip = $this->service->getWithRelations($id);
            $prepared = $this->prepare_item_for_response($trip, $request);

            return $this->success_response($prepared, __('Revision restored successfully', 'yatra'), 200);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Prepare item for response
     */
    protected function prepare_item_for_response($item, WP_REST_Request $request): array
    {
        if (!$item) {
            return [];
        }

        // Convert to array if it's an object
        $data = is_object($item) ? (array) $item : $item;

        // Parse JSON fields
        $jsonFields = [
            'highlights',
            'testimonials',
            'countries',
            'regions',
            'landmarks',
            'tags',
            'included_items',
            'excluded_items',
            'gallery_images',
            'price_types',
            'itinerary_days',
            'faqs',
            'frontend_tabs',
            'availability_dates',
            'blackout_dates',
            'custom_fields',
            'pricing_rules',
            'booking_rules',
        ];

        foreach ($jsonFields as $field) {
            if (isset($data[$field]) && is_string($data[$field])) {
                $decoded = maybe_unserialize($data[$field]);
                $data[$field] = is_array($decoded) ? $decoded : (json_decode($data[$field], true) ?: []);
            }
        }

        // Convert boolean fields
        $booleanFields = [
            'flexible_dates',
            'fixed_departures_only',
            'seasonal_auto_enable',
            'price_per_person',
            'deposit_required',
            'payment_plans_enabled',
            'tax_included',
            'group_pricing_enabled',
            'early_bird_discount_enabled',
            'last_minute_discount_enabled',
            'waitlist_enabled',
            'instant_booking',
            'requires_approval',
            'booking_confirmation_email',
            'booking_reminder_email',
            'travel_insurance_required',
            'accommodation_included',
            'transportation_included',
            'international_flights_included',
            'domestic_flights_included',
            'is_featured',
        ];

        foreach ($booleanFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = (bool) $data[$field];
            }
        }

        // Convert numeric fields
        $numericFields = [
            'id',
            'map_zoom_level',
            'duration_days',
            'duration_nights',
            'duration_hours',
            'booking_window_days',
            'booking_deadline_hours',
            'min_travelers',
            'max_travelers',
            'max_travelers_per_booking',
            'waitlist_capacity',
            'reminder_days_before',
            'age_min',
            'age_max',
            'passport_validity_months',
            'group_size_min',
            'group_size_max',
            'early_bird_days',
            'last_minute_days',
            'version',
            'featured_order',
            'sort_order',
            'views_count',
            'bookings_count',
            'reviews_count',
            'created_by',
            'updated_by',
            'deleted_by',
        ];

        foreach ($numericFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = is_numeric($data[$field]) ? (int) $data[$field] : null;
            }
        }

        // Convert float fields
        $floatFields = [
            'original_price',
            'discounted_price',
            'sale_price',
            'traveler_min_price',
            'traveler_max_price',
            'deposit_amount',
            'deposit_percentage',
            'tax_rate',
            'service_charge',
            'service_charge_percentage',
            'group_discount_percentage',
            'group_discount_amount',
            'early_bird_discount',
            'last_minute_discount',
            'revenue_total',
            'conversion_rate',
            'avg_rating',
        ];

        foreach ($floatFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = is_numeric($data[$field]) ? (float) $data[$field] : null;
            }
        }

        // Handle relationships if loaded
        if (isset($item->destinations)) {
            $data['destinations'] = array_map(function ($dest) {
                return [
                    'id' => (int) $dest->destination_id,
                    'name' => $dest->destination_name ?? '',
                    'slug' => $dest->destination_slug ?? '',
                    'is_primary' => (bool) $dest->is_primary,
                    'order' => (int) $dest->order,
                ];
            }, $item->destinations);
        }

        if (isset($item->activities)) {
            $data['activity_types'] = array_map(function ($act) {
                return [
                    'id' => (int) $act->activity_id,
                    'name' => $act->activity_name ?? '',
                    'slug' => $act->activity_slug ?? '',
                    'is_primary' => (bool) $act->is_primary,
                    'order' => (int) $act->order,
                ];
            }, $item->activities);
        }

        if (isset($item->trip_category)) {
            // Check if trip_category is an array (from relation table) or string (old serialized data)
            if (is_array($item->trip_category)) {
                $data['trip_category'] = array_map(function ($cat) {
                    return [
                        'id' => (int) ($cat->category_id ?? $cat->id ?? 0),
                        'name' => $cat->category_name ?? $cat->name ?? '',
                        'slug' => $cat->category_slug ?? $cat->slug ?? '',
                        'is_primary' => (bool) ($cat->is_primary ?? false),
                        'order' => (int) ($cat->order ?? 0),
                    ];
                }, $item->trip_category);
            } else {
                // It's likely old serialized data - set to empty array
                $data['trip_category'] = [];
            }
            
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log("Yatra: prepare_item_for_response - trip_category formatted: " . json_encode($data['trip_category']));
            }
        } else {
            $data['trip_category'] = [];
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log("Yatra: prepare_item_for_response - trip_category not set in item");
            }
        }

        if (isset($item->price_types)) {
            error_log("Yatra prepare_item_for_response: price_types found, count=" . count($item->price_types));
            $data['price_types'] = array_map(function ($pt) {
                return [
                    'id' => (int) $pt->id,
                    'category_id' => (int) $pt->category_id,
                    'category_label' => $pt->category_label ?? '',
                    'category_slug' => $pt->category_slug ?? '',
                    'original_price' => (float) $pt->original_price,
                    'discounted_price' => isset($pt->discounted_price) ? (float) $pt->discounted_price : null,
                    'sale_price' => isset($pt->sale_price) ? (float) $pt->sale_price : null,
                    'is_default' => (bool) $pt->is_default,
                    'min_quantity' => (int) $pt->min_quantity,
                    'max_quantity' => isset($pt->max_quantity) ? (int) $pt->max_quantity : null,
                    'valid_from' => $pt->valid_from,
                    'valid_to' => $pt->valid_to,
                ];
            }, $item->price_types);
            error_log("Yatra prepare_item_for_response: price_types formatted=" . json_encode($data['price_types']));
        } else {
            error_log("Yatra prepare_item_for_response: price_types NOT SET on item");
            $data['price_types'] = [];
        }

        // Handle highlights relationship
        if (isset($item->highlights)) {
            $data['highlights'] = array_map(function ($h) {
                return $h->highlight_text ?? '';
            }, $item->highlights);
        }

        // Handle gallery images relationship
        if (isset($item->gallery_images)) {
            $data['gallery_images'] = array_map(function ($img) {
                return [
                    'id' => (int) ($img->image_id ?? 0),
                    'url' => $img->image_url ?? '',
                    'thumbnail_url' => $img->thumbnail_url ?? '',
                    'alt_text' => $img->alt_text ?? '',
                    'caption' => $img->caption ?? '',
                    'order' => (int) ($img->order ?? 0),
                    'is_featured' => (bool) ($img->is_featured ?? false),
                ];
            }, $item->gallery_images);
        }

        if (isset($item->itinerary_days)) {
            $data['itinerary_days'] = array_map(function ($day) {
                $dayData = [
                    'id' => isset($day->id) ? (int) $day->id : null,
                    'day_number' => isset($day->day_number) ? (int) $day->day_number : 0,
                    'title' => $day->title ?? '',
                    'description' => $day->description ?? '',
                    'entries' => [],
                ];

                // Load entries if they exist
                if (isset($day->entries) && is_array($day->entries)) {
                    $dayData['entries'] = array_map(function ($entry) {
                        // Handle included_items - already array from repository or JSON string
                        $includedItems = [];
                        if (isset($entry->included_items)) {
                            if (is_array($entry->included_items)) {
                                $includedItems = $entry->included_items;
                            } elseif (is_string($entry->included_items)) {
                                $decoded = json_decode($entry->included_items, true);
                                $includedItems = is_array($decoded) ? $decoded : [];
                            }
                        }

                        // Handle excluded_items - already array from repository or JSON string
                        $excludedItems = [];
                        if (isset($entry->excluded_items)) {
                            if (is_array($entry->excluded_items)) {
                                $excludedItems = $entry->excluded_items;
                            } elseif (is_string($entry->excluded_items)) {
                                $decoded = json_decode($entry->excluded_items, true);
                                $excludedItems = is_array($decoded) ? $decoded : [];
                            }
                        }

                        // Handle images - already array from repository or JSON string
                        $images = [];
                        if (isset($entry->images)) {
                            if (is_array($entry->images)) {
                                $images = $entry->images;
                            } elseif (is_string($entry->images)) {
                                $decoded = json_decode($entry->images, true);
                                $images = is_array($decoded) ? $decoded : [];
                            }
                        }

                        return [
                            'id' => isset($entry->id) ? (int) $entry->id : null,
                            'day_id' => isset($entry->day_id) ? (int) $entry->day_id : null,
                            'time' => $entry->time ?? '',
                            'start_time' => $entry->start_time ?? null,
                            'end_time' => $entry->end_time ?? null,
                            'time_type' => $entry->time_type ?? 'exact',
                            'title' => $entry->title ?? '',
                            'description' => $entry->description ?? '',
                            'location' => $entry->location ?? '',
                            'duration' => $entry->duration ?? '',
                            'cost' => isset($entry->cost) ? (float) $entry->cost : null,
                            'cost_per_person' => isset($entry->cost_per_person) ? (bool) $entry->cost_per_person : false,
                            'notes' => $entry->notes ?? '',
                            'item_type_id' => isset($entry->item_type_id) ? (int) $entry->item_type_id : null,
                            'item_id' => isset($entry->item_id) ? (int) $entry->item_id : null,
                            'status' => $entry->status ?? 'active',
                            'created_at' => $entry->created_at ?? '',
                            'updated_at' => $entry->updated_at ?? '',
                            'included_items' => $includedItems,
                            'excluded_items' => $excludedItems,
                            'images' => $images,
                        ];
                    }, $day->entries);
                }

                return $dayData;
            }, $item->itinerary_days);
        }

        // Handle availability dates relationship
        if (isset($item->availability_dates)) {
            $data['availability_dates'] = array_map(function ($date) {
                return [
                    'id' => isset($date->id) ? (int) $date->id : null,
                    'departure_date' => $date->departure_date ?? '',
                    'arrival_date' => $date->arrival_date ?? '',
                    'return_date' => $date->return_date ?? '',
                    'seats_total' => isset($date->seats_total) ? (int) $date->seats_total : 0,
                    'seats_available' => isset($date->seats_available) ? (int) $date->seats_available : 0,
                    'original_price' => isset($date->original_price) ? (float) $date->original_price : null,
                    'discounted_price' => isset($date->discounted_price) ? (float) $date->discounted_price : null,
                    'status' => $date->status ?? 'available',
                ];
            }, $item->availability_dates);
        }

        // Handle attributes relationship
        if (isset($item->attributes)) {
            $attributes = [];
            foreach ($item->attributes as $attribute) {
                $attributeId = isset($attribute->attribute_id) ? (int) $attribute->attribute_id : ((isset($attribute->id) ? (int) $attribute->id : null));

                if (!$attributeId) {
                    continue;
                }

                $value = $attribute->value ?? null;
                if (!empty($attribute->value_serialized) && is_string($value)) {
                    $unserialized = maybe_unserialize($value);
                    $value = $unserialized !== false ? $unserialized : $value;
                }

                $attributes[$attributeId] = $value;
            }

            $data['attributes'] = $attributes;
        }

        // Add user information
        if (isset($data['created_by']) && $data['created_by'] > 0) {
            $user = get_userdata($data['created_by']);
            $data['created_by_name'] = $user ? $user->display_name : __('Unknown', 'yatra');
        }

        if (isset($data['updated_by']) && $data['updated_by'] > 0) {
            $user = get_userdata($data['updated_by']);
            $data['updated_by_name'] = $user ? $user->display_name : __('Unknown', 'yatra');
        }

        return apply_filters('yatra_trip_prepare_item_for_response', $data, $item, $request);
    }

    /**
     * Prepare collection for response
     */
    protected function prepare_collection_for_response(array $items, WP_REST_Request $request): array
    {
        return array_map(function ($item) use ($request) {
            return $this->prepare_item_for_response($item, $request);
        }, $items);
    }

    /**
     * Get availability template HTML
     * Returns the HTML for the availability section
     */
    public function get_availability_template(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $trip = $this->service->getWithRelations($id);

            $sort_key = sanitize_text_field((string) ($request->get_param('sort') ?? 'date-asc'));
            $allowed_sorts = ['date-asc', 'date-desc', 'price-asc', 'price-desc', 'seats-desc'];
            if (!in_array($sort_key, $allowed_sorts, true)) {
                $sort_key = 'date-asc';
            }

            if (!$trip) {
                return $this->error_response('Trip not found', 404);
            }

            // Fetch availability dates from database (specific dates)
            // Use TripService to get availability dates
            $availability = $this->service->getTripWithAvailability($id);
            $specific_dates = $availability ? [$availability] : [];

            // Generate recurring dates
            $recurring_dates = [];
            try {
                $recurringService = new \Yatra\Services\RecurringAvailabilityService();
                $fromDate = date('Y-m-d');
                $toDate = date('Y-m-d', strtotime('+90 days')); // Show next 90 days
                $generatedDates = $recurringService->generateDatesForTrip($id, $fromDate, $toDate);
                
                // Convert to objects to match specific dates format
                foreach ($generatedDates as $date) {
                    $recurring_dates[] = (object) array_merge($date, ['is_recurring' => 1]);
                }
            } catch (\Exception $e) {
                // Log error but continue with specific dates only
                error_log('Yatra: Failed to generate recurring dates - ' . $e->getMessage());
            }
            
            // Merge and deduplicate (specific dates take priority)
            $availability_dates = array_merge($specific_dates, $recurring_dates);

            // Prepare trip data for template
            $trip_data = (object) [
                'id' => $trip->id,
                'title' => $trip->title ?? '',
                'starting_location' => $trip->starting_location ?? '',
                'ending_location' => $trip->ending_location ?? '',
                'original_price' => isset($trip->original_price) ? (float) $trip->original_price : 0,
                'discounted_price' => isset($trip->discounted_price) ? (float) $trip->discounted_price : 0,
                'sale_price' => isset($trip->sale_price) ? (float) $trip->sale_price : 0,
                'currency' => $trip->currency ?? 'USD',
                'duration_days' => isset($trip->duration_days) ? (int) $trip->duration_days : 1,
                'max_travelers' => isset($trip->max_travelers) ? (int) $trip->max_travelers : 20,
                'min_travelers' => isset($trip->min_travelers) ? (int) $trip->min_travelers : 1,
                'pricing_type' => $trip->pricing_type ?? 'regular',
                'price_types' => $trip->price_types ?? [], // Include price_types for traveler-based pricing
                'availability_dates' => $availability_dates,
            ];

            // Start output buffering
            ob_start();
            
            // Generate availability HTML
            $this->render_availability_template($trip_data, $sort_key);
            
            $html = ob_get_clean();

            return $this->success_response([
                'html' => $html,
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Render availability template
     */
    private function render_availability_template($trip_data, string $sort_key = 'date-asc'): void
    {
        // Check if we have real availability data
        $has_availability = !empty($trip_data->availability_dates) && is_array($trip_data->availability_dates);

        // Build cards from real availability data or use sample data
        $availability_cards = [];
        $month_filters = [];
        
        // Determine if this is a day trip (duration <= 1 day)
        $is_single_day = ($trip_data->duration_days ?? 1) <= 1;

        $traveler_category_labels = [];
        $traveler_category_ids = [];
        $add_category_ids = static function ($price_types_raw) use (&$traveler_category_ids): void {
            if (empty($price_types_raw)) {
                return;
            }

            $decoded = $price_types_raw;
            if (is_string($price_types_raw)) {
                $decoded = json_decode($price_types_raw, true) ?: [];
            }

            if (!is_array($decoded)) {
                return;
            }

            foreach ($decoded as $pt) {
                if (is_object($pt)) {
                    $pt = (array) $pt;
                }
                if (!is_array($pt)) {
                    continue;
                }
                $cat_id = $pt['category_id'] ?? null;
                if ($cat_id !== null && $cat_id !== '') {
                    $traveler_category_ids[] = (string) $cat_id;
                }
            }
        };

        if (!empty($trip_data->price_types) && is_array($trip_data->price_types)) {
            $add_category_ids($trip_data->price_types);
        }

        if ($has_availability) {
            foreach ($trip_data->availability_dates as $avail_for_cats) {
                if (!empty($avail_for_cats->price_types)) {
                    $add_category_ids($avail_for_cats->price_types);
                }
                if (!empty($avail_for_cats->traveler_pricing)) {
                    $add_category_ids($avail_for_cats->traveler_pricing);
                }
            }
        }

        $traveler_category_ids = array_values(array_unique(array_filter($traveler_category_ids)));
        if (!empty($traveler_category_ids)) {
            $traveler_category_repo = new TravelerCategoryRepository();
            $categories = $traveler_category_repo->all([
                'where' => [
                    'id' => $traveler_category_ids,
                ],
            ]);
            foreach ($categories as $cat) {
                if (!empty($cat->id) && isset($cat->label)) {
                    $traveler_category_labels[(string) $cat->id] = (string) $cat->label;
                }
            }
        }

        $enrich_price_types = static function ($price_types_raw) use ($traveler_category_labels): array {
            if (empty($price_types_raw)) {
                return [];
            }

            $decoded = $price_types_raw;
            if (is_string($price_types_raw)) {
                $decoded = json_decode($price_types_raw, true) ?: [];
            }

            if (!is_array($decoded)) {
                return [];
            }

            return array_map(static function ($pt) use ($traveler_category_labels) {
                if (is_object($pt)) {
                    $pt = (array) $pt;
                }
                if (!is_array($pt)) {
                    return $pt;
                }

                if (empty($pt['category_label']) && !empty($pt['traveler_category_label'])) {
                    $pt['category_label'] = $pt['traveler_category_label'];
                }

                $cat_id = $pt['category_id'] ?? null;
                if ((empty($pt['category_label']) && empty($pt['label'])) && $cat_id !== null) {
                    $label = $traveler_category_labels[(string) $cat_id] ?? null;
                    if (!empty($label)) {
                        $pt['category_label'] = $label;
                    }
                }

                if (empty($pt['label']) && !empty($pt['category_label'])) {
                    $pt['label'] = $pt['category_label'];
                }

                return $pt;
            }, $decoded);
        };

        if (!empty($trip_data->price_types)) {
            $trip_data->price_types = $enrich_price_types($trip_data->price_types);
        }
        
        if ($has_availability) {
            $current_time = time();
            
            foreach ($trip_data->availability_dates as $avail) {
                $departure_date = strtotime($avail->departure_date);
                
                // Check booking cutoff - show all dates regardless of cutoff time
                $cutoff_hours = (int) ($avail->cutoff_hours ?? 24); // Default 24 hours before
                $departure_time_str = !empty($avail->departure_time) ? $avail->departure_time : '00:00:00';
                $departure_datetime = strtotime($avail->departure_date . ' ' . $departure_time_str);
                $cutoff_datetime = $departure_datetime - ($cutoff_hours * 3600);
                
                // Show all dates even if past cutoff time
                $is_past_cutoff = $current_time > $cutoff_datetime;
                
                // Show all dates even if no seats available
                $seats = (int) ($avail->seats_available ?? 0);
                $is_sold_out = $seats <= 0;
                
                // Use arrival_date if set, otherwise return_date, otherwise calculate from duration
                $return_date = !empty($avail->arrival_date) ? strtotime($avail->arrival_date) : 
                              (!empty($avail->return_date) ? strtotime($avail->return_date) : 
                              strtotime($avail->departure_date . ' + ' . (($trip_data->duration_days ?? 1) - 1) . ' days'));
                
                // Pricing fallback: Use availability pricing if set, otherwise use trip default
                $original_price = isset($avail->original_price) && $avail->original_price !== null && $avail->original_price > 0
                    ? (float) $avail->original_price 
                    : (float) ($trip_data->original_price ?? $trip_data->price ?? 0);
                
                $sale_price = isset($avail->discounted_price) && $avail->discounted_price !== null && $avail->discounted_price > 0
                    ? (float) $avail->discounted_price 
                    : (float) ($trip_data->discounted_price ?? $original_price);
                
                // Store base prices before dynamic pricing
                $base_original_price = $original_price;
                $base_sale_price = $sale_price;
                
                // Apply dynamic pricing if enabled
                if (apply_filters('yatra_dynamic_pricing_enabled', false)) {
                    $original_price = apply_filters('yatra_availability_price', $original_price, $trip_data->id, [
                        'departure_date' => $avail->departure_date ?? null,
                        'spots_remaining' => $seats,
                        'availability_id' => $avail->id ?? null,
                    ]);
                    $sale_price = apply_filters('yatra_availability_price', $sale_price, $trip_data->id, [
                        'departure_date' => $avail->departure_date ?? null,
                        'spots_remaining' => $seats,
                        'availability_id' => $avail->id ?? null,
                    ]);
                }
                
                // Calculate discount/surge pricing badge
                $discount_percent = 0;
                $discount_text = '';
                
                // First check if there's a base discount (discounted_price < original_price)
                if ($base_original_price > 0 && $base_sale_price < $base_original_price) {
                    $discount_percent = round((($base_original_price - $base_sale_price) / $base_original_price) * 100);
                    $discount_text = $discount_percent > 0 ? sprintf(__('%d%% OFF', 'yatra'), $discount_percent) : '';
                }
                // Then check if dynamic pricing increased the price
                elseif ($base_sale_price > 0 && $sale_price > $base_sale_price) {
                    $surge_percent = round((($sale_price - $base_sale_price) / $base_sale_price) * 100);
                    $discount_text = $surge_percent > 0 ? sprintf(__('+%d%%', 'yatra'), $surge_percent) : '';
                }
                
                // For day trips, use day-based filters; for multi-day trips, use month-based filters
                if ($is_single_day) {
                    $day_key = date('Y-m-d', $departure_date);
                    $today = date('Y-m-d');
                    $tomorrow = date('Y-m-d', strtotime('+1 day'));
                    
                    // Show "Today", "Tomorrow", or day name with date
                    if ($day_key === $today) {
                        $month_filters[$day_key] = __('Today', 'yatra');
                    } elseif ($day_key === $tomorrow) {
                        $month_filters[$day_key] = __('Tomorrow', 'yatra');
                    } else {
                        $month_filters[$day_key] = date_i18n('D, j M', $departure_date); // e.g., "Sat, 30 Nov"
                    }
                } else {
                    $month_key = strtolower(date('M-Y', $departure_date));
                    $month_filters[$month_key] = date('M Y', $departure_date);
                }
                
                $from_location = !empty($avail->from_location) ? $avail->from_location : ($trip_data->starting_location ?? '');
                $to_location = !empty($avail->to_location) ? $avail->to_location : ($trip_data->ending_location ?? $from_location);
                
                // For day trips, format time; for multi-day trips, format date
                $departure_time = !empty($avail->departure_time) ? $avail->departure_time : null;
                $arrival_time = !empty($avail->arrival_time) ? $avail->arrival_time : null;
                
                // Format display strings based on trip type
                if ($is_single_day && $departure_time) {
                    // Day trip: Show time as main value, date as sub-label
                    $from_display = date_i18n('g:i A', strtotime($departure_time)); // e.g., "9:00 AM"
                    $to_display = $arrival_time ? date_i18n('g:i A', strtotime($arrival_time)) : ''; // e.g., "5:00 PM"
                    $date_display = date_i18n('l, j M Y', $departure_date); // e.g., "Saturday, 30 Nov 2025"
                    $from_label = __('Start', 'yatra');
                    $to_label = __('End', 'yatra');
                } else {
                    // Multi-day trip: Show dates
                    $from_display = date_i18n('j M Y', $departure_date);
                    $to_display = date_i18n('j M Y', $return_date);
                    $date_display = ''; // Not needed for multi-day
                    $from_label = __('Departure', 'yatra');
                    $to_label = __('Return', 'yatra');
                }
                
                // Use the same key format for filtering
                $filter_key = $is_single_day 
                    ? date('Y-m-d', $departure_date)
                    : strtolower(date('M-Y', $departure_date));
                
                // Determine pricing for this availability card
                // Priority: 1. Availability date pricing, 2. Rule pricing (inherited), 3. Trip pricing
                $card_pricing_type = $avail->pricing_type ?? $trip_data->pricing_type ?? 'regular';
                $card_traveler_pricing = [];
                
                // Get traveler pricing from availability or rule
                if (!empty($avail->price_types)) {
                    // From specific availability date (priority)
                    $card_traveler_pricing = is_string($avail->price_types) ? (json_decode($avail->price_types, true) ?: []) : (is_array($avail->price_types) ? $avail->price_types : []);
                } elseif (!empty($avail->traveler_pricing)) {
                    // From recurring rule (fallback)
                    $card_traveler_pricing = is_string($avail->traveler_pricing) ? (json_decode($avail->traveler_pricing, true) ?: []) : (is_array($avail->traveler_pricing) ? $avail->traveler_pricing : []);
                }

                if (!empty($card_traveler_pricing) && is_array($card_traveler_pricing)) {
                    $card_traveler_pricing = $enrich_price_types($card_traveler_pricing);
                }
                
                // If no availability-specific pricing, fall back to trip pricing
                if (empty($card_traveler_pricing) && $card_pricing_type === 'traveler_based' && !empty($trip_data->price_types)) {
                    $card_traveler_pricing = $trip_data->price_types;
                }
                
                $availability_cards[] = [
                    'id' => $avail->id,
                    'from_label' => $from_label,
                    'from_date' => $from_display,
                    'from_location' => $from_location,
                    'to_label' => $to_label,
                    'to_date' => $to_display,
                    'to_location' => $to_location,
                    'date_display' => $date_display, // For day trips: "Saturday, 30 Nov 2025"
                    'date' => $avail->departure_date, // Raw date for dynamic pricing
                    'spots_remaining' => $seats, // For dynamic pricing
                    'seats' => $seats > 10 ? '10+' : (string) $seats,
                    'seats_available' => $seats,
                    'discount_text' => $discount_text,
                    'original_price' => $original_price,
                    'sale_price' => $sale_price,
                    'title' => $trip_data->title,
                    'type' => __('Group Departure', 'yatra'),
                    'start_date' => $from_display,
                    'end_date' => $to_display,
                    'start_location' => $from_location,
                    'end_location' => $to_location,
                    'data_month' => $filter_key,
                    'data_date' => $avail->departure_date,
                    'departure_time' => $departure_time,
                    'arrival_time' => $arrival_time,
                    'is_day_trip' => $is_single_day,
                    'status' => $avail->status ?? 'available',
                    'is_limited' => $seats <= 5 && $seats > 0,
                    'is_sold_out' => $is_sold_out,
                    // Card-specific pricing
                    'pricing_type' => $card_pricing_type,
                    'traveler_pricing' => $card_traveler_pricing,
                    'is_recurring' => !empty($avail->is_recurring),
                    'rule_id' => $avail->rule_id ?? null,
                ];
            }
        }
        
        // Use sample data only if no real availability
        if (empty($availability_cards)) {
            $sample_original = $trip_data->original_price ?? $trip_data->price ?? 0;
            $sample_sale = $trip_data->discounted_price ?? $trip_data->original_price ?? $trip_data->price ?? 0;
            $sample_date = date('Y-m-d', strtotime('+7 days'));
            $sample_seats = 15;
            
            // Store base prices before dynamic pricing
            $base_sample_original = $sample_original;
            $base_sample_sale = $sample_sale;
            
            // Apply dynamic pricing to sample card
            if (apply_filters('yatra_dynamic_pricing_enabled', false)) {
                $sample_original = apply_filters('yatra_availability_price', $sample_original, $trip_data->id, [
                    'departure_date' => $sample_date,
                    'spots_remaining' => $sample_seats,
                    'availability_id' => 'sample-1',
                ]);
                $sample_sale = apply_filters('yatra_availability_price', $sample_sale, $trip_data->id, [
                    'departure_date' => $sample_date,
                    'spots_remaining' => $sample_seats,
                    'availability_id' => 'sample-1',
                ]);
            }
            
            // Calculate discount/surge pricing badge for sample card
            $sample_discount_text = '';
            if ($base_sample_original > 0 && $base_sample_sale < $base_sample_original) {
                $discount_percent = round((($base_sample_original - $base_sample_sale) / $base_sample_original) * 100);
                $sample_discount_text = $discount_percent > 0 ? sprintf(__('%d%% OFF', 'yatra'), $discount_percent) : '';
            }
            elseif ($base_sample_sale > 0 && $sample_sale > $base_sample_sale) {
                $surge_percent = round((($sample_sale - $base_sample_sale) / $base_sample_sale) * 100);
                $sample_discount_text = $surge_percent > 0 ? sprintf(__('+%d%%', 'yatra'), $surge_percent) : '';
            }
            
            $availability_cards = [
                [
                    'id' => 'sample-1',
                    'from_label' => __('Departure', 'yatra'),
                    'from_date' => date_i18n('j M Y', strtotime('+7 days')),
                    'from_location' => $trip_data->starting_location ?: __('Starting Point', 'yatra'),
                    'to_label' => __('Return', 'yatra'),
                    'to_date' => date_i18n('j M Y', strtotime('+' . (7 + ($trip_data->duration_days ?? 5) - 1) . ' days')),
                    'to_location' => $trip_data->ending_location ?: ($trip_data->starting_location ?: __('Ending Point', 'yatra')),
                    'seats' => '10+',
                    'seats_available' => $sample_seats,
                    'discount_text' => $sample_discount_text,
                    'original_price' => $sample_original,
                    'sale_price' => $sample_sale,
                    'title' => $trip_data->title,
                    'type' => __('Group Departure', 'yatra'),
                    'start_date' => date_i18n('j M Y', strtotime('+7 days')),
                    'end_date' => date_i18n('j M Y', strtotime('+' . (7 + ($trip_data->duration_days ?? 5) - 1) . ' days')),
                    'start_location' => $trip_data->starting_location ?: __('Starting Point', 'yatra'),
                    'end_location' => $trip_data->ending_location ?: ($trip_data->starting_location ?: __('Ending Point', 'yatra')),
                    'data_month' => strtolower(date('M-Y', strtotime('+7 days'))),
                    'data_date' => date('Y-m-d', strtotime('+7 days')),
                    'status' => 'available',
                    'is_limited' => false,
                    // Use trip-level pricing for sample data
                    'pricing_type' => $trip_data->pricing_type ?? 'regular',
                    'traveler_pricing' => $trip_data->price_types ?? [],
                    'is_recurring' => false,
                    'rule_id' => null,
                ],
            ];
            $month_filters[strtolower(date('M-Y', strtotime('+7 days')))] = date('M Y', strtotime('+7 days'));
        }

        $availability_cards = $this->sortAvailabilityCards($availability_cards, $sort_key);

        // DEBUG: Output all trip data
        echo '<!-- TRIP DATA DEBUG -->';
        echo '<!-- Trip ID: ' . ($trip_data->id ?? 'NO ID') . ' -->';
        echo '<!-- Trip original_price: ' . var_export($trip_data->original_price ?? null, true) . ' -->';
        echo '<!-- Trip sale_price: ' . var_export($trip_data->sale_price ?? null, true) . ' -->';
        echo '<!-- Trip discounted_price: ' . var_export($trip_data->discounted_price ?? null, true) . ' -->';
        echo '<!-- Trip price: ' . var_export($trip_data->price ?? null, true) . ' -->';
        echo '<!-- Trip pricing_type: ' . ($trip_data->pricing_type ?? 'regular') . ' -->';
        echo '<!-- All Trip Data: ' . var_export($trip_data, true) . ' -->';
        
        // Prepare additional data for the template
        $pricing_type = $trip_data->pricing_type ?? 'regular';
        $price_types = $trip_data->price_types ?? [];
        $is_day_trip = ($trip_data->duration_days ?? 1) <= 1;
        
        // Include the template file
        $template_path = YATRA_PLUGIN_PATH . 'templates/partials/availability-section.php';
        
        if (file_exists($template_path)) {
            $sort_key = $sort_key;
            include $template_path;
        }
    }

    private function sortAvailabilityCards(array $cards, string $sort_key): array
    {
        $sort_key = sanitize_text_field($sort_key);

        usort($cards, function ($a, $b) use ($sort_key) {
            $aDate = (string) ($a['data_date'] ?? '');
            $bDate = (string) ($b['data_date'] ?? '');
            $aTime = (string) ($a['departure_time'] ?? '');
            $bTime = (string) ($b['departure_time'] ?? '');

            $aDateTime = trim($aDate . ' ' . $aTime);
            $bDateTime = trim($bDate . ' ' . $bTime);

            $aPrice = (float) ($a['sale_price'] ?? 0);
            $bPrice = (float) ($b['sale_price'] ?? 0);

            $aSeats = (int) ($a['seats_available'] ?? 0);
            $bSeats = (int) ($b['seats_available'] ?? 0);

            if ($sort_key === 'date-desc') {
                $cmp = strcmp($bDateTime, $aDateTime);
            } elseif ($sort_key === 'price-asc') {
                $cmp = $aPrice <=> $bPrice;
            } elseif ($sort_key === 'price-desc') {
                $cmp = $bPrice <=> $aPrice;
            } elseif ($sort_key === 'seats-desc') {
                $cmp = $bSeats <=> $aSeats;
            } else {
                $cmp = strcmp($aDateTime, $bDateTime);
            }

            if ($cmp !== 0) {
                return $cmp;
            }

            return strcmp($aDateTime, $bDateTime);
        });

        return $cards;
    }

    /**
     * Merge specific availability dates with recurring generated dates
     * Specific dates take priority over recurring dates for the same date
     * 
     * @param array $specificDates Array of specific date objects from database
     * @param array $recurringDates Array of generated recurring date objects
     * @return array Merged and sorted availability dates
     */
    private function mergeAvailabilityDates(array $specificDates, array $recurringDates): array
    {
        // Index specific dates by departure_date + departure_time for quick lookup
        $specificIndex = [];
        foreach ($specificDates as $date) {
            $key = $date->departure_date . '_' . ($date->departure_time ?? '');
            $specificIndex[$key] = true;
        }
        
        // Filter out recurring dates that conflict with specific dates
        $filteredRecurring = [];
        foreach ($recurringDates as $date) {
            $key = $date->departure_date . '_' . ($date->departure_time ?? '');
            if (!isset($specificIndex[$key])) {
                $filteredRecurring[] = $date;
            }
        }
        
        // Merge both arrays
        $merged = array_merge($specificDates, $filteredRecurring);
        
        // Sort by departure_date, then departure_time
        usort($merged, function ($a, $b) {
            $dateCompare = strcmp($a->departure_date, $b->departure_date);
            if ($dateCompare !== 0) {
                return $dateCompare;
            }
            return strcmp($a->departure_time ?? '', $b->departure_time ?? '');
        });
        
        return $merged;
    }

    /**
     * Get date-specific pricing and availability info
     */
    public function get_date_pricing(\WP_REST_Request $request): \WP_REST_Response|\WP_Error
    {
        try {
            $trip_id = (int) $request->get_param('id');
            $date = sanitize_text_field($request->get_param('date'));

            if (!$date) {
                return $this->error_response('Date parameter is required', 400);
            }

            $trip = $this->service->getWithRelations($trip_id);
            if (!$trip) {
                return $this->error_response('Trip not found', 404);
            }

            // Use TripService to count departures for this date
            $departures_count = $this->service->countDeparturesByDate($trip_id, $date);

            // Generate travelers HTML with dynamic pricing
            ob_start();
            $pricing_type = $trip->pricing_type ?? 'regular';
            $price_types = $trip->price_types ?? [];
            
            if ($pricing_type === 'traveler_based' && !empty($price_types)) {
                // Apply dynamic pricing to each price type
                $dp_enabled = apply_filters('yatra_dynamic_pricing_enabled', false);
                
                foreach ($price_types as &$pt) {
                    $pt = is_array($pt) ? (object) $pt : $pt;
                    $price = 0;
                    
                    if (isset($pt->sale_price) && $pt->sale_price > 0) {
                        $price = (float) $pt->sale_price;
                    } elseif (isset($pt->original_price) && $pt->original_price > 0) {
                        $price = (float) $pt->original_price;
                    }
                    
                    // Apply dynamic pricing
                    if ($dp_enabled && $price > 0) {
                        $price = apply_filters('yatra_availability_price', $price, $trip_id, [
                            'departure_date' => $date,
                            'price_type_id' => $pt->id ?? null,
                        ]);
                    }
                    
                    $pt->effective_price = $price;
                }
                
                // Render traveler-based pricing HTML
                include YATRA_ABSPATH . '/templates/partials/booking-form-fields.php';
            } else {
                // Regular pricing - simple number input
                echo '<div class="yatra-booking-field">';
                echo '<label for="num_travelers">' . esc_html__('Number of Travelers', 'yatra') . '</label>';
                echo '<input type="number" id="num_travelers" name="num_travelers" value="1" min="1" max="' . esc_attr($trip->max_travelers ?? 20) . '" />';
                echo '</div>';
            }
            
            $travelers_html = ob_get_clean();

            return $this->success_response([
                'success' => true,
                'departures_count' => (int) $departures_count,
                'travelers_html' => $travelers_html,
                'pricing_type' => $pricing_type,
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get public trips for frontend display
     * Only returns published trips, excludes soft-deleted trips
     */
    public function get_public_trips(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $args = [
                'limit' => (int) ($request->get_param('per_page') ?: 20),
                'offset' => ((int) ($request->get_param('page') ?: 1) - 1) * (int) ($request->get_param('per_page') ?: 20),
                'order_by' => $request->get_param('orderby') ?: 'created_at',
                'order' => strtoupper($request->get_param('order') ?: 'DESC'),
                // Only return published trips for public endpoint
                'where' => ['status' => ['publish']],
                // Never include deleted trips for public endpoint
                'include_deleted' => false,
            ];

            // Add search if provided
            $search = $request->get_param('search');
            if ($search) {
                $items = $this->service->search($search, $args);
                $total = count($items);
            } else {
                $items = $this->service->getAll($args);
                $total = $this->service->count($args);
            }

            return $this->success_response([
                'data' => $items,
                'total' => $total,
                'per_page' => (int) ($request->get_param('per_page') ?: 20),
                'page' => (int) ($request->get_param('page') ?: 1),
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get trip attributes
     */
    public function get_trip_attributes(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $trip_id = (int) $request->get_param('id');
            
            if (!$trip_id) {
                return $this->error_response('Trip ID is required', 400);
            }

            // Use TripService to get trip attributes
            $attributes = $this->service->getTripAttributes($trip_id);

            $formatted_attributes = [];
            foreach ($attributes as $attr) {
                $value = $attr->value;
                if ($attr->value_serialized) {
                    $value = unserialize($value);
                }
                
                $formatted_attributes[] = [
                    'id' => $attr->id,
                    'attribute_id' => $attr->attribute_id,
                    'name' => $attr->name,
                    'field_type' => $attr->field_type,
                    'field_options' => $attr->field_options,
                    'value' => $value,
                    'created_at' => $attr->created_at,
                    'updated_at' => $attr->updated_at
                ];
            }

            return $this->success_response($formatted_attributes);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Test endpoint to verify routing works
     */
    public function test_endpoint(): WP_REST_Response
    {
        error_log("Yatra TripController: test_endpoint called successfully!");
        return $this->success_response(['message' => 'Test endpoint working', 'timestamp' => date('Y-m-d H:i:s')]);
    }

    /**
     * Update trip attributes
     */
    public function update_trip_attributes(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        // Add immediate log to verify method is called
        error_log("Yatra TripController: update_trip_attributes - ENTRY POINT - " . date('Y-m-d H:i:s'));
        
        try {
            error_log("Yatra TripController: update_trip_attributes - METHOD CALLED");
            
            $trip_id = (int) $request->get_param('id');
            $attributes = $request->get_param('attributes') ?? [];
            
            error_log("Yatra TripController: update_trip_attributes - RAW INPUT: trip_id={$trip_id}, attributes=" . json_encode($attributes));
            
            if (!$trip_id) {
                error_log("Yatra TripController: update_trip_attributes - ERROR: Trip ID is required");
                return $this->error_response('Trip ID is required', 400);
            }

            if (!is_array($attributes)) {
                error_log("Yatra TripController: update_trip_attributes - ERROR: Attributes must be an array");
                return $this->error_response('Attributes must be an array', 400);
            }

            // Prepare attributes for TripService
            $formattedAttributes = [];
            foreach ($attributes as $attribute_id => $value) {
                $formattedAttributes[] = [
                    'attribute_id' => $attribute_id,
                    'value' => $value
                ];
            }

            error_log("Yatra TripController: update_trip_attributes - FORMATTED: " . json_encode($formattedAttributes));

            // Use TripService to update trip attributes
            error_log("Yatra TripController: update_trip_attributes - CALLING SERVICE");
            $result = $this->service->updateTripAttributes($trip_id, $formattedAttributes);
            error_log("Yatra TripController: update_trip_attributes - SERVICE RESULT: " . var_export($result, true));
            
            return $this->success_response(['message' => 'Trip attributes updated successfully']);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Delete trip attribute
     */
    public function delete_trip_attribute(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $trip_id = (int) $request->get_param('id');
            $attribute_id = (int) $request->get_param('attribute_id');
            
            if (!$trip_id || !$attribute_id) {
                return $this->error_response('Trip ID and Attribute ID are required', 400);
            }

            // Use TripService to delete trip attribute
            $result = $this->service->deleteTripAttribute($trip_id, $attribute_id);
            
            if (!$result) {
                return $this->error_response('Failed to delete trip attribute', 500);
            }
            
            return $this->success_response(['message' => 'Trip attribute deleted successfully']);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }
}
