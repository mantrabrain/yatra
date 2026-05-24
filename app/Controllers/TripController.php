<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Repositories\RecurringAvailabilityRepository;
use Yatra\Services\RecurringAvailabilityService;
use Yatra\Database\Tables\TripsTable;
use Yatra\Services\TripService;
use Yatra\Repositories\TripRevisionRepository;
use Yatra\Repositories\ItemTypeRepository;
use Yatra\Repositories\ItemRepository;
use Yatra\Repositories\TravelerCategoryRepository;
use Yatra\Models\Trip;
use Yatra\Validators\TripValidator;
use Yatra\Exceptions\TripNotFoundException;
use Yatra\Services\SettingsService;
use Yatra\Exceptions\ValidationException;
use Yatra\Database\Tables\TripAvailabilityDatesTable;
use Yatra\Services\TripPricingService;

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
 

       register_rest_route($namespace, '/' . $base, [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'check_view_permission'],
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => [$this, 'check_create_permission'],
            ],
        ]);

        // Duplicate is a create — produces a new trip row.
        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)/duplicate', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'duplicate_item'],
                'permission_callback' => [$this, 'check_create_permission'],
            ],
        ]);

        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'check_view_permission'],
            ],
            [
                // EDITABLE covers both content edits AND publish/unpublish
                // state changes (the React form sends both via PUT).
                // We accept either edit OR publish cap — handlers should
                // refuse to change `status` when the user holds only the
                // edit cap, but the route gate lets both through.
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_item'],
                'permission_callback' => [$this, 'check_edit_or_publish_permission'],
            ],
            [
                // Soft-delete (trash) → edit cap. Trash is reversible
                // and is the day-to-day "remove from catalogue" action.
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_item'],
                'permission_callback' => [$this, 'check_edit_permission'],
            ],
        ]);

        // Permanent delete — bypasses trash. High-sensitivity action,
        // gated on the dedicated delete cap.
        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)/permanent-delete', [
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'permanent_delete_item'],
                'permission_callback' => [$this, 'check_delete_permission'],
            ],
        ]);

        // Search endpoint — view cap.
        register_rest_route($namespace, '/' . $base . '/search', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'search_items'],
                'permission_callback' => [$this, 'check_view_permission'],
            ],
        ]);

        // Revisions list — view cap.
        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)/revisions', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_revisions'],
                'permission_callback' => [$this, 'check_view_permission'],
            ],
        ]);

        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)/revisions/(?P<revision_id>[\d]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_revision'],
                'permission_callback' => [$this, 'check_view_permission'],
            ],
            [
                // Restoring a revision overwrites the live trip → edit cap.
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'restore_revision'],
                'permission_callback' => [$this, 'check_edit_permission'],
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

        // Status statistics for admin views — view cap.
        register_rest_route($namespace, '/' . $base . '/stats', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getStats'],
                'permission_callback' => [$this, 'check_view_permission'],
            ],
        ]);

        // Test endpoint — view cap (read-only diagnostic).
        register_rest_route($namespace, '/' . $base . '/test', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [$this, 'test_endpoint'],
            'permission_callback' => [$this, 'check_view_permission'],
        ]);

        // Trip-attribute assignments — trip-taxonomy edits go here.
        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)/attributes', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_trip_attributes'],
                'permission_callback' => [$this, 'check_view_permission'],
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'update_trip_attributes'],
                'permission_callback' => [$this, 'check_taxonomy_permission'],
            ],
        ]);

        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)/attributes/(?P<attribute_id>[\d]+)', [
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_trip_attribute'],
                'permission_callback' => [$this, 'check_taxonomy_permission'],
            ],
        ]);
    }

    /**
     * Granular cap checks for every Trip endpoint. Overrides the
     * BaseController defaults (which gate everything on `manage_options`
     * and locked out every yatra_* role from the trips REST surface).
     * WP admins pass via the Team module's admin-fallback filter.
     */
    public function check_view_permission(?WP_REST_Request $request = null): bool
    {
        return current_user_can('yatra_view_trips');
    }

    public function check_create_permission(?WP_REST_Request $request = null): bool
    {
        return current_user_can('yatra_create_trips');
    }

    public function check_edit_permission(?WP_REST_Request $request = null): bool
    {
        return current_user_can('yatra_edit_trips');
    }

    /**
     * EDITABLE / PUT routes that may carry either a content edit or a
     * status change pass when the caller holds EITHER cap. The actual
     * handler should refuse to change `status` when only `edit` is
     * held — that's a future hardening, but the route gate already
     * keeps non-trip-staff out.
     */
    public function check_edit_or_publish_permission(?WP_REST_Request $request = null): bool
    {
        return current_user_can('yatra_edit_trips')
            || current_user_can('yatra_publish_trips');
    }

    public function check_delete_permission(?WP_REST_Request $request = null): bool
    {
        return current_user_can('yatra_delete_trips');
    }

    public function check_taxonomy_permission(?WP_REST_Request $request = null): bool
    {
        return current_user_can('yatra_manage_trip_taxonomies');
    }

    /**
     * Get statistics for admin trip views (status counts)
     */
    public function getStats(WP_REST_Request $request)
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
    public function duplicate_item(WP_REST_Request $request)
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
    public function get_items(WP_REST_Request $request)
    {
        try {
            // For admin listing, show more items by default to see all trips
            $default_limit = 20; // Increased from 10 to show all trips
            $orderbyRaw = $request->get_param('orderby') ?: 'id';
            // UI sends "price"; the trips table has sale_price (no "price" column).
            if ($orderbyRaw === 'price') {
                $orderbyRaw = 'sale_price';
            }

            $args = [
                'limit' => (int) ($request->get_param('per_page') ?: $default_limit),
                'offset' => ((int) ($request->get_param('page') ?: 1) - 1) * (int) ($request->get_param('per_page') ?: $default_limit),
                'order_by' => $orderbyRaw,
                'order' => strtoupper($request->get_param('order') ?: 'DESC'),
            ];

        
            // Add status filter
            $status = $request->get_param('status');
            if ($status && $status !== 'all') {
                $args['where']['status'] = $status;
              
            }

            // Add search
            $search = $request->get_param('search');
            if ($search) {
                $items = $this->service->search($search, $args);
                $total = count($items);
          
            } else {
                // For admin listing, include all trips regardless of status or soft delete
                $args['include_deleted'] = true;
                // Must not use BaseService::getAll() — it caches list results while count() does not, which broke the admin grid.
                $items = $this->service->getAllForAdminList($args);
                $total = $this->service->count($args);
          
            }

            // Ensure traveler-based pricing trips have a usable base price in list view
            if (!empty($items)) {

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
                    // Attach bookings_count computed from bookings table (trips.bookings_count is not reliably maintained)
                    $bookingsCountMap = $this->service->getBookingsCountMap($tripIds);
                    foreach ($items as $item) {
                        $tId = isset($item->id) ? (int) $item->id : 0;
                        if ($tId > 0) {
                            $item->bookings_count = (int) ($bookingsCountMap[$tId] ?? 0);
                        }
                    }

                    // Destinations
                    $destByTrip = [];
                    foreach ($tripIds as $id) {
                        $destinations = $this->service->getTripDestinations($id);
                        $destByTrip[$id] = [];
                        
                        foreach ($destinations as $destination) {
                            $destByTrip[$id][] = (object) [
                                'id' => (int) ($destination->classification_id ?? 0),
                                'name' => $destination->name ?? '',
                                'slug' => $destination->slug ?? '',
                                'debug_classification_id' => $destination->classification_id,
                                'debug_trip_id' => $destination->trip_id,
                            ];
                        }
                    }

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
                            'id' => (int) $row->id,
                            'name' => $row->name,
                            'slug' => $row->slug,
                        ];
                    }

                    // Use TripService to get categories
                    $catByTrip = [];
                    foreach ($tripIds as $id) {
                        $categories = $this->service->getTripCategories($id);
                        $catByTrip[$id] = [];
                        
                        foreach ($categories as $category) {
                            $catByTrip[$id][] = (object) [
                                'id' => (int) ($category->classification_id ?? 0),
                                'name' => $category->category_name ?? '',
                                'slug' => $category->category_slug ?? '',
                            ];
                        }
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
                            $item->activity_types = $actByTrip[$id];
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
                
                foreach ($allItems as $item) {
                    }
                
                $meta['available_items'] = array_map(function ($item) {
                    // Items use parent_id to link to their item type (not type_id)
                    $mappedItem = [
                        'id' => (int) $item->id,
                        'name' => esc_html($item->name),
                        'type_id' => (int) ($item->parent_id ?? 0), // parent_id is the item type ID
                    ];
                    return $mappedItem;
                }, $allItems);
                
            }

            $response = [
                'data' => $this->prepare_collection_for_response($items, $request),
                'total' => $total,
                'page' => (int) ($request->get_param('page') ?: 1),
                'per_page' => $args['limit'], // Use the actual limit from args
            ];

      

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
    public function get_item(WP_REST_Request $request)
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
    public function create_item(WP_REST_Request $request)
    {
        try {
            $rawData = $request->get_json_params();
            $rawData = apply_filters('yatra_trip_create_raw_data', $rawData, $request);
            
            // Map old field names to new table schema
            if (isset($rawData['booking_deadline'])) {
                $rawData['booking_deadline_hours'] = is_numeric($rawData['booking_deadline']) ? (int) $rawData['booking_deadline'] : 24;
                unset($rawData['booking_deadline']);
            }
            
            // Validate and sanitize input data
            TripValidator::validateCreate($rawData);
            $data = TripValidator::sanitize($rawData);
            
            // Ensure JSON fields stay in main data (not relationships)
            if (isset($rawData['included_items'])) {
                $data['included_items'] = wp_json_encode($rawData['included_items']);
            }
            if (isset($rawData['excluded_items'])) {
                $data['excluded_items'] = wp_json_encode($rawData['excluded_items']);
            }
            if (isset($rawData['frontend_tabs'])) {
                $data['frontend_tabs'] = wp_json_encode($rawData['frontend_tabs']);
            }
            if (isset($rawData['default_time_slots'])) {
                $data['default_time_slots'] = wp_json_encode($rawData['default_time_slots']);
            }
            
            // Handle featured_priority field
            if (isset($rawData['featured_priority'])) {
                $data['featured_priority'] = $rawData['featured_priority'];
            }
            // Remove legacy/removed columns not present in trips table
            foreach (['currency', 'testimonials', 'countries', 'regions', 'tags'] as $deprecatedKey) {
                if (isset($data[$deprecatedKey])) {
                    unset($data[$deprecatedKey]);
                }
            }
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
                'downloadable_items' => $rawData['downloadable_items'] ?? [],
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
        } catch (\InvalidArgumentException $e) {
            return $this->error_response($e->getMessage(), $e->getCode() >= 400 ? $e->getCode() : 400);
        } catch (\Exception $e) {
            return $this->handle_exception($e);
        }
    }

    /**
     * Update item
     */
    public function update_item(WP_REST_Request $request)
    {
        try {
            $id = (int) $request->get_param('id');
            $data = $request->get_json_params();
            $data = apply_filters('yatra_trip_update_raw_data', $data, $id, $request);

            // Map old field names to new table schema
            if (isset($data['booking_deadline'])) {
                $data['booking_deadline_hours'] = is_numeric($data['booking_deadline']) ? (int) $data['booking_deadline'] : 24;
                unset($data['booking_deadline']);
            }
            
            // Ensure JSON fields stay in main data (not relationships)
            if (isset($data['included_items'])) {
                $data['included_items'] = is_string($data['included_items']) ? $data['included_items'] : wp_json_encode($data['included_items']);
            }
            if (isset($data['excluded_items'])) {
                $data['excluded_items'] = is_string($data['excluded_items']) ? $data['excluded_items'] : wp_json_encode($data['excluded_items']);
            }
            if (isset($data['frontend_tabs'])) {
                $data['frontend_tabs'] = is_string($data['frontend_tabs']) ? $data['frontend_tabs'] : wp_json_encode($data['frontend_tabs']);
            }
            if (isset($data['testimonial_review_ids'])) {
                $data['testimonial_review_ids'] = is_string($data['testimonial_review_ids']) ? $data['testimonial_review_ids'] : wp_json_encode($data['testimonial_review_ids']);
            }
            if (isset($data['default_time_slots'])) {
                $data['default_time_slots'] = is_string($data['default_time_slots']) ? $data['default_time_slots'] : wp_json_encode($data['default_time_slots']);

            }
            
            // Handle featured_priority field (already in $data for update)
            // Remove legacy/removed columns not present in trips table
            foreach (['currency', 'testimonials', 'countries', 'regions', 'tags'] as $deprecatedKey) {
                if (isset($data[$deprecatedKey])) {
                    unset($data[$deprecatedKey]);
                }
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
                    }
            }
            if (isset($data['highlights'])) {
                $relationships['highlights'] = $data['highlights'];
            }
            if (isset($data['landmarks'])) {
                $relationships['landmarks'] = $data['landmarks'];
            }
            if (isset($data['gallery_images'])) {
                $relationships['gallery_images'] = $data['gallery_images'];
            }
            if (isset($data['faqs'])) {
                $relationships['faqs'] = $data['faqs'];
            }
            if (isset($data['downloadable_items'])) {
                $relationships['downloadable_items'] = $data['downloadable_items'];
            }
            if (isset($data['itinerary_days'])) {
                $relationships['itinerary_days'] = $data['itinerary_days'];
            }
            if (isset($data['availability_dates'])) {
                $relationships['availability_dates'] = $data['availability_dates'];
            }
            if (isset($data['attributes'])) {
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
            // Note: included_items, excluded_items, frontend_tabs stay in main data as JSON
            unset(
                $data['destinations'], 
                $data['activity_types'], 
                $data['trip_category'],
                $data['highlights'],
                $data['landmarks'],
                $data['gallery_images'],
                $data['faqs'],
                $data['downloadable_items'],
                $data['itinerary_days'],
                $data['availability_dates'],
                $data['attributes']
            );
            
            // Update via service to persist main data and relations
            $updated = $this->service->updateWithRelations($id, $data, $relationships);

            if (!$updated) {
                return $this->error_response(__('Failed to update trip', 'yatra'), 500);
            }

            $trip = $this->service->getWithRelations($id);
            $prepared = $this->prepare_item_for_response($trip, $request);

            return $this->success_response($prepared, 200);
        } catch (\InvalidArgumentException $e) {
            return $this->error_response($e->getMessage(), 400);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Delete item (soft delete)
     */
    public function delete_item(WP_REST_Request $request)
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
    public function permanent_delete_item(WP_REST_Request $request)
    {
        try {
            $id = (int) $request->get_param('id');
            
            // DEBUG: Log permanent delete attempt
            if (defined('WP_DEBUG') && WP_DEBUG) {
                }
            
            $result = $this->service->permanentDelete($id);

            if (!$result) {
                return $this->error_response(__('Failed to permanently delete trip', 'yatra'), 500);
            }

            // DEBUG: Log successful delete
            if (defined('WP_DEBUG') && WP_DEBUG) {
                }

            return $this->success_response([
                'message' => __('Trip permanently deleted', 'yatra'),
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Search items
     */
    public function search_items(WP_REST_Request $request)
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
    public function get_revisions(WP_REST_Request $request)
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
    public function get_revision(WP_REST_Request $request)
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
    public function restore_revision(WP_REST_Request $request)
    {
        try {
            // Check permissions — admin fallback ensures site owners
            // always pass even when the Team module isn't active and
            // the yatra_edit_trips cap isn't on the admin role.
            if (
                !current_user_can('manage_options')
                && !current_user_can('yatra_edit_trips')
            ) {
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
            'testimonial_review_ids',
            'default_time_slots',
        ];

        foreach ($jsonFields as $field) {
            if (isset($data[$field]) && is_string($data[$field])) {
                $decoded = maybe_unserialize($data[$field]);
                $data[$field] = is_array($decoded) ? $decoded : (json_decode($data[$field], true) ?: []);
            }
        }

        // Ensure testimonial_review_ids is always a clean array of integers
        if (isset($data['testimonial_review_ids'])) {
            if (!is_array($data['testimonial_review_ids'])) {
                $data['testimonial_review_ids'] = [];
            } else {
                // Filter out null values and ensure all values are integers
                $data['testimonial_review_ids'] = array_values(array_filter(
                    array_map('intval', $data['testimonial_review_ids']),
                    function($id) { return $id > 0; }
                ));
            }
        } else {
            $data['testimonial_review_ids'] = [];
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
            'has_default_time_slots',
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
                    'id' => (int) ($dest->id ?? 0),
                    'name' => $dest->name ?? '',
                    'slug' => $dest->slug ?? '',
                    'is_primary' => (bool) ($dest->is_primary ?? false),
                    'order' => (int) ($dest->order ?? 0),
                ];
            }, $item->destinations);
        }

        if (isset($item->activities)) {
            $data['activity_types'] = array_map(function ($act) {
                return [
                    'id' => (int) ($act->classification_id ?? 0),
                    'name' => $act->activity_name ?? '',
                    'slug' => $act->activity_slug ?? '',
                    'is_primary' => (bool) ($act->is_primary ?? false),
                    'order' => (int) ($act->order ?? 0),
                ];
            }, $item->activities);
        }

        if (isset($item->trip_category)) {
            // Check if trip_category is an array (from relation table) or string (old serialized data)
            if (is_array($item->trip_category)) {
                $data['trip_category'] = array_map(function ($cat) {
                    return [
                        'id' => (int) ($cat->classification_id ?? $cat->category_id ?? $cat->id ?? 0),
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
                }
        } else {
            $data['trip_category'] = [];
            if (defined('WP_DEBUG') && WP_DEBUG) {
                }
        }

        if (isset($item->price_types)) {
            // Normalize to array
            $rawPriceTypes = $item->price_types;
            if (is_string($rawPriceTypes)) {
                $decoded = json_decode($rawPriceTypes, true);
                $rawPriceTypes = is_array($decoded) ? $decoded : [];
            } elseif (!is_array($rawPriceTypes)) {
                $rawPriceTypes = [];
            }

            $data['price_types'] = array_map(function ($pt) {
                // Normalize array to object for consistent access
                if (is_array($pt)) {
                    $pt = (object) $pt;
                }
                return [
                    'id' => isset($pt->id) ? (int) $pt->id : 0,
                    'category_id' => isset($pt->category_id) ? (int) $pt->category_id : null,
                    'category_label' => $pt->category_label ?? ($pt->label ?? ''),
                    'category_slug' => $pt->category_slug ?? '',
                    'original_price' => isset($pt->original_price) ? (float) $pt->original_price : null,
                    'discounted_price' => isset($pt->discounted_price) ? (float) $pt->discounted_price : null,
                    'sale_price' => isset($pt->sale_price) ? (float) $pt->sale_price : null,
                    'is_default' => isset($pt->is_default) ? (bool) $pt->is_default : false,
                    'min_quantity' => isset($pt->min_quantity) ? (int) $pt->min_quantity : 0,
                    'max_quantity' => isset($pt->max_quantity) ? (int) $pt->max_quantity : null,
                    'valid_from' => $pt->valid_from ?? null,
                    'valid_to' => $pt->valid_to ?? null,
                ];
            }, $rawPriceTypes);
            } else {
            $data['price_types'] = [];
        }

        // Handle highlights relationship (send simple strings to match form expectations)
        if (isset($item->highlights)) {
            $data['highlights'] = array_map(function ($h) {
                if (is_object($h) && isset($h->text)) {
                    return $h->text;
                }
                if (is_array($h) && isset($h['text'])) {
                    return $h['text'];
                }
                if (is_object($h) && isset($h->highlight_text)) {
                    return $h->highlight_text;
                }
                if (is_array($h) && isset($h['highlight_text'])) {
                    return $h['highlight_text'];
                }
                return is_string($h) ? $h : '';
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

        // Handle FAQs relationship (already normalized in repository)
        if (isset($item->faqs)) {
            $data['faqs'] = array_map(function ($faq) {
                return [
                    'question'    => $faq->question ?? '',
                    'answer'      => $faq->answer ?? '',
                    'category'    => $faq->category ?? '',
                    'is_featured' => isset($faq->is_featured) ? (bool) $faq->is_featured : false,
                    'order'       => isset($faq->order) ? (int) $faq->order : 0,
                ];
            }, $item->faqs);
        } else {
            $data['faqs'] = [];
        }

        // Handle downloadable_items relationship (already normalized in repository)
        if (isset($item->downloadable_items)) {
            $data['downloadable_items'] = array_map(function ($download) {
                return [
                    'id' => isset($download->id) ? (int) $download->id : null,
                    'title' => $download->title ?? '',
                    'description' => $download->description ?? '',
                    'attachment_id' => isset($download->attachment_id) ? (int) $download->attachment_id : null,
                    'attachment_url' => $download->content_url ?? '',
                    'attachment_title' => $download->title ?? '',
                    'visibility' => $download->visibility ?? 'booked_only',
                    'enabled' => isset($download->is_downloadable) ? (bool) $download->is_downloadable : true,
                    'sort_order' => isset($download->sort_order) ? (int) $download->sort_order : 0,
                ];
            }, $item->downloadable_items);
        } else {
            $data['downloadable_items'] = [];
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

                        // Decode gallery JSON column on the entry so the React form
                        // can re-populate the gallery picker without an extra fetch.
                        $gallery = [];
                        if (isset($entry->gallery)) {
                            if (is_array($entry->gallery)) {
                                $gallery = $entry->gallery;
                            } elseif (is_string($entry->gallery) && $entry->gallery !== '') {
                                $decoded = json_decode($entry->gallery, true);
                                $gallery = is_array($decoded) ? $decoded : [];
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
                            // The entries table has lat/lng/gallery/video_url + an `order`
                            // smallint column — but until this serializer included them, the
                            // /trips/{id} response never carried them. The React activity
                            // load mapper sorts by `entry.order`; without it, every entry
                            // arrived with order=null, the sort fell through to id-order,
                            // and drag-sort reorders never appeared to persist on reload.
                            'location_latitude' => isset($entry->location_latitude) ? $entry->location_latitude : null,
                            'location_longitude' => isset($entry->location_longitude) ? $entry->location_longitude : null,
                            'duration' => $entry->duration ?? '',
                            'cost' => isset($entry->cost) ? (float) $entry->cost : null,
                            'cost_per_person' => isset($entry->cost_per_person) ? (bool) $entry->cost_per_person : false,
                            'notes' => $entry->notes ?? '',
                            'item_type_id' => isset($entry->item_type_id) ? (int) $entry->item_type_id : null,
                            'item_id' => isset($entry->item_id) ? (int) $entry->item_id : null,
                            'status' => $entry->status ?? 'active',
                            'order' => isset($entry->order) ? (int) $entry->order : 0,
                            'gallery' => $gallery,
                            'video_url' => $entry->video_url ?? '',
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

        // Add featured image URL
        if (isset($data['featured_image']) && $data['featured_image'] > 0) {
            $imageUrl = wp_get_attachment_image_url($data['featured_image'], 'medium');
            $data['featured_image_url'] = $imageUrl ?: '';
        } else {
            $data['featured_image_url'] = '';
        }

        // Add permalink (respects WordPress permalink structure: plain vs pretty)
        if (!empty($data['slug'])) {
            $data['permalink'] = yatra_get_trip_permalink($item);
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
    public function get_availability_template(WP_REST_Request $request)
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
            
            // Get traveler data from request
            $num_travelers = (int) ($request->get_param('num_travelers') ?? 1);
            $travelers_json = $request->get_param('travelers');
            $travelers = [];
            
            if ($travelers_json) {
                $decoded = json_decode($travelers_json, true);
                if (is_array($decoded)) {
                    $travelers = $decoded;
                }
            }
            
            // Get selected date if provided
            $selected_date = sanitize_text_field((string) ($request->get_param('date') ?? ''));

            // Month filter for list: "all" or lowercase key e.g. "jan-2026" (matches data-month on cards)
            $month_filter = sanitize_text_field((string) ($request->get_param('month_filter') ?? ''));
            if ($month_filter === '') {
                $month_filter = sanitize_text_field((string) ($request->get_param('month') ?? 'all'));
            }
            $month_filter = strtolower($month_filter ?: 'all');
            // Accept YYYY-MM from JS (locale-safe); map to same M-Y keys used on cards
            if ($month_filter !== 'all' && preg_match('/^(\d{4})-(\d{2})$/', $month_filter, $mm)) {
                $ts = strtotime(sprintf('%04d-%02d-01', (int) $mm[1], (int) $mm[2]));
                if ($ts) {
                    $month_filter = strtolower(date('M-Y', $ts));
                }
            }

            $page = max(1, (int) ($request->get_param('page') ?? 1));
            $per_page = (int) ($request->get_param('per_page') ?? 10);
            $per_page = max(1, min(50, $per_page));
            $partial = (int) ($request->get_param('partial') ?? 0) === 1;

            // Fetch availability dates using centralized resolution service
            $resolutionService = new \Yatra\Services\AvailabilityResolutionService();
            
            // Always show all dates from today onwards (selected_date is only for highlighting)
            $fromDate = date('Y-m-d');
            $toDate = date('Y-m-d', strtotime('+12 months'));
            
            $availability_dates = $resolutionService->getAllAvailabilityDates($id, $fromDate, $toDate);

            // Determine if this is a day trip
            $is_single_day = ($trip->duration_days ?? 1) <= 1;
            
            // Auto-select month and date
            $auto_selected_month = '';
            $auto_selected_date = '';
            
            if (!empty($availability_dates)) {
                // Legacy UI hint: month of selected date (response JSON); list filter uses month_filter
                if (!empty($selected_date)) {
                    // Use selected date's month (always month-based now)
                    $selected_timestamp = strtotime($selected_date);
                    $auto_selected_month = strtolower(date('M-Y', $selected_timestamp));
                } else {
                    // Use first available date's month (always month-based now)
                    $first_avail = reset($availability_dates);
                    if (!empty($first_avail->departure_date)) {
                        $first_date = strtotime($first_avail->departure_date);
                        $auto_selected_month = strtolower(date('M-Y', $first_date));
                    }
                }
                
                // Find closest available date
                if (!empty($selected_date)) {
                    // Check if selected date is available
                    $date_found = false;
                    foreach ($availability_dates as $avail) {
                        if (!empty($avail->departure_date) && $avail->departure_date === $selected_date) {
                            $auto_selected_date = $selected_date;
                            $date_found = true;
                            break;
                        }
                    }
                    
                    // If selected date not available, find closest
                    if (!$date_found) {
                        $selected_timestamp = strtotime($selected_date);
                        $closest_date = null;
                        $min_diff = PHP_INT_MAX;
                        
                        foreach ($availability_dates as $avail) {
                            if (!empty($avail->departure_date)) {
                                $avail_timestamp = strtotime($avail->departure_date);
                                $diff = abs($avail_timestamp - $selected_timestamp);
                                
                                if ($diff < $min_diff) {
                                    $min_diff = $diff;
                                    $closest_date = $avail->departure_date;
                                }
                            }
                        }
                        
                        $auto_selected_date = $closest_date ?? '';
                    }
                } else {
                    // No date provided, select first available date
                    $first_avail = reset($availability_dates);
                    $auto_selected_date = $first_avail->departure_date ?? '';
                }
            }

            // Prepare trip data for template
            $trip_data = (object) [
                'id' => $trip->id,
                'title' => $trip->title ?? '',
                'starting_location' => $trip->starting_location ?? '',
                'ending_location' => $trip->ending_location ?? '',
                'original_price' => isset($trip->original_price) ? (float) $trip->original_price : 0,
                'discounted_price' => isset($trip->discounted_price) ? (float) $trip->discounted_price : 0,
                'sale_price' => isset($trip->sale_price) ? (float) $trip->sale_price : 0,
                'currency' => SettingsService::getCurrency(),
                'duration_days' => isset($trip->duration_days) ? (int) $trip->duration_days : 1,
                'max_travelers' => isset($trip->max_travelers) ? (int) $trip->max_travelers : 20,
                'min_travelers' => isset($trip->min_travelers) ? (int) $trip->min_travelers : 1,
                'pricing_type' => $trip->pricing_type ?? 'regular',
                'price_types' => $trip->price_types ?? [], // Include price_types for traveler-based pricing
                'availability_dates' => $availability_dates,
            ];

            // Start output buffering
            ob_start();

            $slice_meta = $this->render_availability_template(
                $trip_data,
                $sort_key,
                $travelers,
                $num_travelers,
                $selected_date,
                $auto_selected_month,
                $auto_selected_date,
                $month_filter,
                $page,
                $per_page,
                $partial
            );

            $html = ob_get_clean();

            $payload = [
                'html' => $html,
                'selected_month' => $month_filter,
                'selected_date' => $auto_selected_date,
                'month_filter' => $month_filter,
                'sort' => $sort_key,
                'total' => $slice_meta['total'],
                'page' => $slice_meta['page'],
                'per_page' => $slice_meta['per_page'],
                'has_more' => $slice_meta['has_more'],
                'loaded_count' => $slice_meta['loaded_count'],
                'partial' => $partial,
            ];

            return $this->success_response($payload);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Normalize departure date to Y-m-d for comparisons (handles datetime strings).
     */
    private static function normalizeAvailabilityDateString(?string $value): string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return '';
        }
        if (preg_match('/^(\d{4}-\d{2}-\d{2})/', $value, $m)) {
            return $m[1];
        }

        return $value;
    }

    /**
     * Paginate filtered availability cards (after sort).
     * When $pin_date is Y-m-d and that departure exists in the filtered list, the page is
     * adjusted so that row is included (fixes sidebar picking e.g. Aug 13 while page 1 only had Aug 1–10).
     *
     * @return array{items: array, total: int, page: int, per_page: int, has_more: bool, loaded_count: int}
     */
    private function computeAvailabilityPage(
        array $sorted_cards,
        string $month_filter,
        int $page,
        int $per_page,
        string $pin_date = ''
    ): array {
        $month_filter = strtolower($month_filter ?: 'all');
        $filtered = $sorted_cards;
        if ($month_filter !== 'all') {
            $filtered = array_values(array_filter(
                $sorted_cards,
                static function (array $c) use ($month_filter): bool {
                    return (string) ($c['data_month'] ?? '') === $month_filter;
                }
            ));
        }

        $total = count($filtered);
        $per_page = max(1, min(50, $per_page));
        $page = max(1, $page);

        $pin_date = trim($pin_date);
        if ($pin_date !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $pin_date)) {
            $pin_norm = self::normalizeAvailabilityDateString($pin_date);
            foreach ($filtered as $idx => $c) {
                $card_norm = self::normalizeAvailabilityDateString((string) ($c['data_date'] ?? ''));
                if ($card_norm !== '' && $card_norm === $pin_norm) {
                    $page = (int) (floor((int) $idx / $per_page) + 1);
                    break;
                }
            }
        }

        $offset = ($page - 1) * $per_page;
        $items = array_slice($filtered, $offset, $per_page);
        $loaded_count = $offset + count($items);

        return [
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'per_page' => $per_page,
            'has_more' => $loaded_count < $total,
            'loaded_count' => $loaded_count,
        ];
    }

    /**
     * Render availability template (full section or card fragment only).
     *
     * @return array{total: int, page: int, per_page: int, has_more: bool, loaded_count: int}
     */
    private function render_availability_template(
        $trip_data,
        string $sort_key = 'date-asc',
        array $travelers = [],
        int $num_travelers = 1,
        string $selected_date = '',
        string $auto_selected_month = '',
        string $auto_selected_date = '',
        string $month_filter = 'all',
        int $page = 1,
        int $per_page = 10,
        bool $fragment_cards_only = false
    ): array {
        // Check if we have real availability data
        $has_availability = !empty($trip_data->availability_dates) && is_array($trip_data->availability_dates);

        // Build cards from real availability data or use sample data
        $availability_cards = [];
        $month_filters = [];

        // Availability priority (same as the resolver):
        // 1) manual availability dates, 2) recurring rules, 3) trip defaults.
        // For UI counts + filters we want the list to reflect that priority (not a mixed set).
        $availability_dates_for_render = $has_availability ? $trip_data->availability_dates : [];
        if ($has_availability) {
            $by_source = [
                'availability_date' => [],
                'recurring_rule' => [],
                'trip_default' => [],
            ];
            foreach ($trip_data->availability_dates as $a) {
                if (!is_object($a)) {
                    continue;
                }
                $src = strtolower(trim((string) ($a->source ?? '')));
                if (isset($by_source[$src])) {
                    $by_source[$src][] = $a;
                }
            }
            if (!empty($by_source['availability_date'])) {
                $availability_dates_for_render = $by_source['availability_date'];
            } elseif (!empty($by_source['recurring_rule'])) {
                $availability_dates_for_render = $by_source['recurring_rule'];
            } elseif (!empty($by_source['trip_default'])) {
                $availability_dates_for_render = $by_source['trip_default'];
            }
        }
        
        // Determine if this is a day trip (duration <= 1 day)
        $is_single_day = ($trip_data->duration_days ?? 1) <= 1;

        $traveler_category_labels = [];
        $traveler_category_meta = [];
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
            foreach ($availability_dates_for_render as $avail_for_cats) {
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
                // Use 'name' field from database, not 'label'
                if (!empty($cat->id) && isset($cat->name)) {
                    $traveler_category_labels[(string) $cat->id] = (string) $cat->name;
                }
                // Parse metadata for pricing_mode, age_min, age_max, min_pax, max_pax
                $meta = !empty($cat->metadata) ? (is_string($cat->metadata) ? json_decode($cat->metadata, true) : (array) $cat->metadata) : [];
                $traveler_category_meta[(string) $cat->id] = [
                    'pricing_mode' => $meta['pricing_mode'] ?? 'per_person',
                    'age_min'      => isset($meta['age_min']) ? (int) $meta['age_min'] : null,
                    'age_max'      => isset($meta['age_max']) ? (int) $meta['age_max'] : null,
                    'min_pax'      => isset($meta['min_pax']) ? (int) $meta['min_pax'] : null,
                    'max_pax'      => isset($meta['max_pax']) ? (int) $meta['max_pax'] : null,
                ];
            }
        }

        $enrich_price_types = static function ($price_types_raw) use ($traveler_category_labels, $traveler_category_meta): array {
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

            return array_map(static function ($pt) use ($traveler_category_labels, $traveler_category_meta) {
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

                // Enrich with category metadata (pricing_mode, age, pax limits)
                if ($cat_id !== null && isset($traveler_category_meta[(string) $cat_id])) {
                    $meta = $traveler_category_meta[(string) $cat_id];
                    // Always use category metadata pricing_mode to ensure correct mode from database
                    $pt['pricing_mode'] = $meta['pricing_mode'];
                    if (!isset($pt['age_min'])) $pt['age_min'] = $meta['age_min'];
                    if (!isset($pt['age_max'])) $pt['age_max'] = $meta['age_max'];
                    if (!isset($pt['min_pax'])) $pt['min_pax'] = $meta['min_pax'];
                    if (!isset($pt['max_pax'])) $pt['max_pax'] = $meta['max_pax'];
                }

                // Payable amount (honors price / sale_price / discounted_price like TripPricingService)
                if (!isset($pt['effective_price'])) {
                    $eff = TripPricingService::resolveCategoryEffectivePrice($pt);
                    $pt['effective_price'] = $eff;
                    $orig = (float) ($pt['original_price'] ?? 0);
                    if ($orig <= 0 && isset($pt['price'])) {
                        $orig = (float) $pt['price'];
                    }
                    if ($orig > 0 && $eff > 0 && $eff < $orig) {
                        if (!isset($pt['discounted_price']) || (float) $pt['discounted_price'] <= 0) {
                            $pt['discounted_price'] = $eff;
                        }
                    }
                    if ($orig > 0 && (!isset($pt['original_price']) || (float) $pt['original_price'] <= 0)) {
                        $pt['original_price'] = $orig;
                    }
                }

                return $pt;
            }, $decoded);
        };

        if (!empty($trip_data->price_types)) {
            $trip_data->price_types = $enrich_price_types($trip_data->price_types);
        }

        $dp_display_settings = apply_filters('yatra_get_dynamic_pricing_display_settings', [
            'show_original_price' => true,
            'show_savings_badge' => true,
            'show_urgency_messages' => false,
        ]);
        
        if ($has_availability) {
            $current_time = time();

            foreach ($availability_dates_for_render as $avail) {
                if (empty($avail->departure_date)) {
                    // Skip entries without a valid departure date
                    continue;
                }

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
                
                // Pricing: Use centralized TripPricingService (single source of truth)
                $cardPricing = \Yatra\Services\TripPricingService::resolveCardPricing($avail, $trip_data);
                $card_pricing_type = $cardPricing['pricing_type'];
                $sale_price = $cardPricing['sale_price'];
                $original_price = $cardPricing['original_price'];
                
                // Store base prices before dynamic pricing
                $base_original_price = $original_price;
                $base_sale_price = $sale_price;
                
                // Apply dynamic pricing if enabled (Pro DynamicPricingModule hooks here).
                // Single pass on the effective sale price; list/original stays for strikethrough. Context supplies both for "regular vs discounted" rule base.
                if (apply_filters('yatra_dynamic_pricing_enabled', false)) {
                    $dp_context = [
                        'departure_date' => $avail->departure_date ?? null,
                        'spots_remaining' => $seats,
                        'availability_id' => $avail->id ?? null,
                        'original_price' => $base_original_price,
                        'discounted_price' => $base_sale_price,
                    ];
                    $sale_price = apply_filters('yatra_availability_price', $base_sale_price, $trip_data->id, $dp_context);
                }
                
                // Savings badge: surge vs pre-DP sale first when DP raises price; else total % off vs list
                // (covers regular + traveler-based + date-level pricing; DP stacked on sale is reflected in final vs list).
                $discount_text = $this->computeAvailabilitySavingsBadgeText(
                    $base_original_price,
                    $base_sale_price,
                    $sale_price,
                    (bool) apply_filters('yatra_dynamic_pricing_enabled', false)
                );

                // Dynamic Pricing → Display: hide savings / surge % badge on card when disabled.
                if (is_array($dp_display_settings) && !filter_var($dp_display_settings['show_savings_badge'] ?? true, FILTER_VALIDATE_BOOLEAN)) {
                    $discount_text = '';
                }

                $dp_card_fields = $this->buildAvailabilityDynamicPricingCardFields(
                    $dp_display_settings,
                    (int) $trip_data->id,
                    [
                        'departure_date' => $avail->departure_date ?? null,
                        'spots_remaining' => $seats,
                        'availability_id' => $avail->id ?? null,
                        'base_sale_price' => $base_sale_price,
                        'base_original_price' => $base_original_price,
                        'sale_price' => $sale_price,
                        'original_price' => $original_price,
                    ]
                );

                // Use month-based filters for both day trips and multi-day trips for better navigation
                // This prevents overwhelming users with too many individual date filters
                $month_key = strtolower(date('M-Y', $departure_date));
                $month_filters[$month_key] = date_i18n('M Y', $departure_date);
                
                $from_location = !empty($avail->from_location) ? $avail->from_location : ($trip_data->starting_location ?? '');
                $to_location = !empty($avail->to_location) ? $avail->to_location : ($trip_data->ending_location ?? $from_location);
                
                // For day trips, format time; for multi-day trips, format date
                $departure_time = !empty($avail->departure_time) ? $avail->departure_time : null;
                $arrival_time = !empty($avail->arrival_time) ? $avail->arrival_time : null;
                
                // Format display strings based on trip type (respect Yatra Settings date/time formats)
                $yatra_date_format = \Yatra\Services\SettingsService::getString('date_format', 'Y-m-d');
                $yatra_time_format = \Yatra\Services\SettingsService::getString('time_format', 'H:i');

                if ($is_single_day && $departure_time) {
                    // Day trip: Show time as main value, date as sub-label
                    $from_display = date_i18n($yatra_time_format, strtotime($departure_time)); // e.g., "14:30" or "2:30 PM"
                    $to_display = $arrival_time ? date_i18n($yatra_time_format, strtotime($arrival_time)) : '';
                    // Show day-trip header date using configured format
                    $date_display = date_i18n($yatra_date_format, $departure_date);
                    $from_label = __('Start', 'yatra');
                    $to_label = __('End', 'yatra');
                } else {
                    // Multi-day trip: Show dates
                    $from_display = date_i18n($yatra_date_format, $departure_date);
                    $to_display = date_i18n($yatra_date_format, $return_date);
                    $date_display = ''; // Not needed for multi-day
                    $from_label = __('Departure', 'yatra');
                    $to_label = __('Return', 'yatra');
                }
                
                // Use month-based keys for filtering for both day trips and multi-day trips
                $filter_key = strtolower(date('M-Y', $departure_date));
                
                // Must match {@see TripPricingService::resolveCardPricing}: trip-level mode wins; do not
                // treat inherited stale price_types on a date as traveler-based when the trip is regular.
                $card_pricing_type = $cardPricing['pricing_type'];
                $card_traveler_pricing = [];
                $pts_for_card = $cardPricing['price_types'] ?? [];
                if (!empty($pts_for_card) && is_array($pts_for_card)) {
                    $card_traveler_pricing = $enrich_price_types($pts_for_card);
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
                ] + $dp_card_fields;
            }
        }
        
        // Use sample data only if no real availability
        if (empty($availability_cards)) {
            $sample_original = (float) ($trip_data->original_price ?? $trip_data->price ?? 0);
            $sample_sale = \Yatra\Services\TripPricingService::resolveRegularCurrentPrice($trip_data) ?: $sample_original;
            $sample_date = date('Y-m-d', strtotime('+7 days'));
            $sample_seats = 15;
            
            // Store base prices before dynamic pricing
            $base_sample_original = $sample_original;
            $base_sample_sale = $sample_sale;
            
            // Apply dynamic pricing to sample card (sale line only; list price unchanged for display)
            if (apply_filters('yatra_dynamic_pricing_enabled', false)) {
                $sample_sale = apply_filters('yatra_availability_price', $base_sample_sale, $trip_data->id, [
                    'departure_date' => $sample_date,
                    'spots_remaining' => $sample_seats,
                    'availability_id' => 'sample-1',
                    'original_price' => $base_sample_original,
                    'discounted_price' => $base_sample_sale,
                ]);
            }
            
            $sample_discount_text = $this->computeAvailabilitySavingsBadgeText(
                $base_sample_original,
                $base_sample_sale,
                $sample_sale,
                (bool) apply_filters('yatra_dynamic_pricing_enabled', false)
            );

            if (is_array($dp_display_settings) && !filter_var($dp_display_settings['show_savings_badge'] ?? true, FILTER_VALIDATE_BOOLEAN)) {
                $sample_discount_text = '';
            }

            $sample_dp_fields = $this->buildAvailabilityDynamicPricingCardFields(
                $dp_display_settings,
                (int) $trip_data->id,
                [
                    'departure_date' => $sample_date,
                    'spots_remaining' => $sample_seats,
                    'availability_id' => 'sample-1',
                    'base_sale_price' => $base_sample_sale,
                    'base_original_price' => $base_sample_original,
                    'sale_price' => $sample_sale,
                    'original_price' => $sample_original,
                ]
            );
            
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
                ] + $sample_dp_fields,
            ];
            $month_filters[strtolower(date('M-Y', strtotime('+7 days')))] = date_i18n('M Y', strtotime('+7 days'));
        }

        $sorted_cards = $this->sortAvailabilityCards($availability_cards, $sort_key);

        $pin_date = '';
        if (!$fragment_cards_only) {
            $pin_candidate = trim((string) $selected_date);
            if ($pin_candidate !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $pin_candidate)) {
                $pin_date = $pin_candidate;
            }
        }

        $slice = $this->computeAvailabilityPage($sorted_cards, $month_filter, $page, $per_page, $pin_date);

        $pricing_type = $trip_data->pricing_type ?? 'regular';
        $price_types = $trip_data->price_types ?? [];
        $is_day_trip = ($trip_data->duration_days ?? 1) <= 1;

        $initial_travelers = $travelers;
        $initial_num_travelers = $num_travelers;
        $initial_selected_date = $selected_date;

        $selected_month_filter = strtolower($month_filter ?: 'all');
        $selected_date_filter = !empty($selected_date) ? $selected_date : $auto_selected_date;

        if ($fragment_cards_only) {
            foreach ($slice['items'] as $index => $card) {
                include YATRA_PLUGIN_PATH . 'templates/partials/availability-card.php';
            }

            return $slice;
        }

        $availability_cards = $slice['items'];
        $availability_total_matching = $slice['total'];
        $availability_page = $slice['page'];
        $availability_per_page = $slice['per_page'];
        $availability_has_more = $slice['has_more'];
        $availability_loaded_count = $slice['loaded_count'];

        // Month filter active but no matching departures while other months exist
        $availability_filtered_no_results = $selected_month_filter !== 'all'
            && $slice['total'] === 0
            && !empty($month_filters);

        $template_path = YATRA_PLUGIN_PATH . 'templates/partials/availability-section.php';

        if (file_exists($template_path)) {
            include $template_path;
        }

        return $slice;
    }

    /**
     * "% OFF" / "+%" badge for availability cards after dynamic pricing is applied to the sale line.
     *
     * - If dynamic pricing is on and the final price is above the pre-DP sale, show surge vs that sale (priority).
     * - Otherwise, if list/original on the card is above the final price, show total % off vs list (trip/date
     *   discount + any extra DP discount in one number — never understates vs showing only the old catalog %).
     * - If there is no list price but DP reduced the promo-only anchor, show % off vs that anchor.
     *
     * Works for regular, traveler-based (uses same header O/B/F from {@see TripPricingService::resolveCardPricing}),
     * and availability date pricing (already in O/B from the card resolver).
     */
    private function computeAvailabilitySavingsBadgeText(
        float $base_original_price,
        float $base_sale_price,
        float $final_sale_price,
        bool $dynamic_pricing_enabled
    ): string {
        $O = max(0.0, $base_original_price);
        $B = max(0.0, $base_sale_price);
        $F = max(0.0, $final_sale_price);
        $eps = 0.005;

        if ($dynamic_pricing_enabled && $B > $eps && $F > $B + $eps) {
            $p = (int) round((($F - $B) / $B) * 100);

            /* translators: %d: dynamic pricing increase percentage. */
            return $p > 0 ? sprintf(__('+%d%%', 'yatra'), $p) : '';
        }

        if ($O > $eps && $F < $O - $eps) {
            $p = (int) round((($O - $F) / $O) * 100);

            /* translators: %d: discount percentage. */
            return $p > 0 ? sprintf(__('%d%% OFF', 'yatra'), $p) : '';
        }

        if ($O <= $eps && $B > $eps && $F < $B - $eps) {
            $p = (int) round((($B - $F) / $B) * 100);

            /* translators: %d: discount percentage. */
            return $p > 0 ? sprintf(__('%d%% OFF', 'yatra'), $p) : '';
        }

        return '';
    }

    /**
     * Per-departure-card dynamic pricing display flags + urgency lines (Pro fills via filter).
     *
     * @param array<string, mixed> $display_settings From yatra_get_dynamic_pricing_display_settings
     * @param array<string, mixed> $context        departure_date, spots_remaining, prices, availability_id, …
     * @return array{dynamic_pricing_display: array<string, bool>, dynamic_pricing_urgency_messages: array<int, string>}
     */
    private function buildAvailabilityDynamicPricingCardFields(array $display_settings, int $trip_id, array $context): array
    {
        $display = [
            'show_original_price' => filter_var($display_settings['show_original_price'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'show_savings_badge' => filter_var($display_settings['show_savings_badge'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'show_urgency_messages' => filter_var($display_settings['show_urgency_messages'] ?? false, FILTER_VALIDATE_BOOLEAN),
        ];

        $meta = apply_filters(
            'yatra_availability_card_dynamic_pricing_meta',
            ['urgency_messages' => []],
            array_merge($context, [
                'trip_id' => $trip_id,
                'display' => $display,
                'dp_display_settings' => $display_settings,
            ])
        );

        $urgency = [];
        if (is_array($meta) && !empty($meta['urgency_messages']) && is_array($meta['urgency_messages'])) {
            foreach ($meta['urgency_messages'] as $m) {
                $line = sanitize_text_field((string) $m);
                if ($line !== '') {
                    $urgency[] = $line;
                }
            }
            $urgency = array_values(array_unique($urgency));
        }

        return [
            'dynamic_pricing_display' => $display,
            'dynamic_pricing_urgency_messages' => $urgency,
        ];
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
    public function get_date_pricing(\WP_REST_Request $request)
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
                        $pt_orig = (float) ($pt->original_price ?? 0);
                        $pt_disc = (float) ($pt->sale_price ?? $pt->discounted_price ?? $pt->effective_price ?? $price);
                        if ($pt_disc <= 0) {
                            $pt_disc = $price;
                        }
                        $price = apply_filters('yatra_availability_price', $price, $trip_id, [
                            'departure_date' => $date,
                            'price_type_id' => $pt->id ?? null,
                            'original_price' => $pt_orig > 0 ? $pt_orig : $price,
                            'discounted_price' => $pt_disc > 0 ? $pt_disc : $price,
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
    public function get_public_trips(WP_REST_Request $request)
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
    public function get_trip_attributes(WP_REST_Request $request)
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
                $row = is_array($attr) ? (object) $attr : $attr;

                $value = $row->value ?? null;
                if (isset($row->value_serialized) && $row->value_serialized && $value !== null && $value !== '') {
                    $unserialized = @unserialize((string) $value, ['allowed_classes' => false]);
                    if ($unserialized !== false || (string) $value === 'b:0;') {
                        $value = $unserialized;
                    }
                }

                $fieldType = isset($row->field_type) ? trim((string) $row->field_type, '"') : 'text';
                $fieldOptions = $row->field_options ?? null;
                if (is_string($fieldOptions)) {
                    $fieldOptions = trim($fieldOptions, '"');
                    $decoded = json_decode($fieldOptions, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $fieldOptions = $decoded;
                    }
                }

                $linkId = (int) ($row->relationship_id ?? $row->id ?? 0);
                $attributeId = (int) ($row->attribute_id ?? 0);

                $formatted_attributes[] = [
                    'id' => $linkId > 0 ? $linkId : $attributeId,
                    'attribute_id' => $attributeId,
                    'name' => (string) ($row->name ?? ''),
                    'field_type' => $fieldType,
                    'field_options' => $fieldOptions,
                    'value' => $value,
                    'created_at' => (string) ($row->created_at ?? ''),
                    'updated_at' => (string) ($row->updated_at ?? ''),
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
        return $this->success_response(['message' => 'Test endpoint working', 'timestamp' => date('Y-m-d H:i:s')]);
    }

    /**
     * Update trip attributes
     */
    public function update_trip_attributes(WP_REST_Request $request)
    {
        try {
            $trip_id = (int) $request->get_param('id');
            $attributes = $request->get_param('attributes') ?? [];
            
            if (!$trip_id) {
                return $this->error_response('Trip ID is required', 400);
            }

            if (!is_array($attributes)) {
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

            // Use TripService to update trip attributes
            $result = $this->service->updateTripAttributes($trip_id, $formattedAttributes);
            return $this->success_response(['message' => 'Trip attributes updated successfully']);
        } catch (\InvalidArgumentException $e) {
            return $this->error_response($e->getMessage(), $e->getCode() >= 400 ? $e->getCode() : 400);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Delete trip attribute
     */
    public function delete_trip_attribute(WP_REST_Request $request)
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
