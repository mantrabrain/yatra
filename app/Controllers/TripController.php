<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\TripService;
use Yatra\Repositories\TripRevisionRepository;
use Yatra\Repositories\ItemTypeRepository;
use Yatra\Repositories\ItemRepository;
use Yatra\Models\Trip;

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
                'permission_callback' => [$this, 'check_permission'],
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

        // Search endpoint
        register_rest_route($namespace, '/' . $base . '/search', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'search_items'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Revisions endpoints
        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)/revisions', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_revisions'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        register_rest_route($namespace, '/' . $base . '/(?P<id>[\d]+)/revisions/(?P<revision_id>[\d]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_revision'],
                'permission_callback' => [$this, 'check_permission'],
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

        // Status statistics for admin views
        register_rest_route($namespace, '/' . $base . '/stats', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'getStats'],
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
            $args = [
                'limit' => (int) ($request->get_param('per_page') ?: 10),
                'offset' => ((int) ($request->get_param('page') ?: 1) - 1) * (int) ($request->get_param('per_page') ?: 10),
                'order_by' => $request->get_param('orderby') ?: 'id',
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
                $items = $this->service->getAll($args);
                $total = $this->service->count($args);
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
                    $row = $wpdb->get_row($wpdb->prepare(
                        "SELECT
                            MIN(CASE
                                WHEN discounted_price IS NOT NULL AND discounted_price > 0 THEN discounted_price
                                ELSE original_price
                            END) AS min_price,
                            MAX(CASE
                                WHEN discounted_price IS NOT NULL AND discounted_price > 0 THEN discounted_price
                                ELSE original_price
                            END) AS max_price
                        FROM `{$priceTypeTable}`
                        WHERE trip_id = %d
                          AND (
                               (discounted_price IS NOT NULL AND discounted_price > 0)
                            OR (original_price IS NOT NULL AND original_price > 0)
                          )",
                        (int) $item->id
                    ));

                    if ($row && ($row->min_price !== null || $row->max_price !== null)) {
                        $minPrice = $row->min_price !== null ? (float) $row->min_price : 0.0;
                        $maxPrice = $row->max_price !== null ? (float) $row->max_price : 0.0;

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
                    $inPlaceholders = implode(',', array_fill(0, count($tripIds), '%d'));

                    // Destinations
                    $destTable = $wpdb->prefix . 'yatra_trip_destinations';
                    $destTaxTable = $wpdb->prefix . 'yatra_destinations';
                    $destRows = $wpdb->get_results($wpdb->prepare(
                        "SELECT td.trip_id, d.id, d.name, d.slug
                         FROM `{$destTable}` td
                         INNER JOIN `{$destTaxTable}` d ON td.destination_id = d.id
                         WHERE td.trip_id IN ($inPlaceholders)
                         ORDER BY td.`order` ASC, d.name ASC",
                        ...$tripIds
                    ));

                    $destByTrip = [];
                    foreach ($destRows as $row) {
                        $tId = (int) $row->trip_id;
                        if (!isset($destByTrip[$tId])) {
                            $destByTrip[$tId] = [];
                        }
                        $destByTrip[$tId][] = (object) [
                            'destination_id' => (int) $row->id,
                            'destination_name' => $row->name,
                            'destination_slug' => $row->slug,
                        ];
                    }

                    // Activities
                    $actTable = $wpdb->prefix . 'yatra_trip_activities';
                    $actTaxTable = $wpdb->prefix . 'yatra_activities';
                    $actRows = $wpdb->get_results($wpdb->prepare(
                        "SELECT ta.trip_id, a.id, a.name, a.slug
                         FROM `{$actTable}` ta
                         INNER JOIN `{$actTaxTable}` a ON ta.activity_id = a.id
                         WHERE ta.trip_id IN ($inPlaceholders)
                         ORDER BY ta.`order` ASC, a.name ASC",
                        ...$tripIds
                    ));

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
                    $catRows = $wpdb->get_results($wpdb->prepare(
                        "SELECT ttc.trip_id, tc.id, tc.name, tc.slug
                         FROM `{$catRelTable}` ttc
                         INNER JOIN `{$catTaxTable}` tc ON ttc.category_id = tc.id
                         WHERE ttc.trip_id IN ($inPlaceholders)
                         ORDER BY ttc.`order` ASC, tc.name ASC",
                        ...$tripIds
                    ));

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
                'per_page' => (int) ($request->get_param('per_page') ?: 10),
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
    public function get_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $item = $this->service->getWithRelations($id);

            if (!$item) {
                return $this->error_response('Trip not found', 404);
            }

            return $this->success_response($this->prepare_item_for_response($item, $request));
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Create item
     */
    public function create_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $data = $request->get_json_params();
            
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log("Yatra TripController create_item: difficulty_level=" . ($data['difficulty_level'] ?? 'NOT SET'));
            }
            
            // Extract relationships (fields stored in separate tables)
            $relationships = [
                'destinations' => $data['destinations'] ?? [],
                'activities' => $data['activity_types'] ?? [],
                'trip_category' => $data['trip_category'] ?? [],
                'price_types' => $data['price_types'] ?? [],
                'highlights' => $data['highlights'] ?? [],
                'gallery_images' => $data['gallery_images'] ?? [],
                'faqs' => $data['faqs'] ?? [],
                'itinerary_days' => $data['itinerary_days'] ?? [],
                'availability_dates' => $data['availability_dates'] ?? [],
            ];

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
                $data['availability_dates']
            );

            $id = $this->service->createWithRelations($data, $relationships);

            return $this->success_response([
                'id' => $id,
                'message' => __('Trip created successfully', 'yatra'),
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return $this->error_response($e->getMessage(), 400);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
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

            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log("Yatra TripController update_item: pricing_type=" . ($data['pricing_type'] ?? 'NOT SET'));
                error_log("Yatra TripController update_item: price_types=" . json_encode($data['price_types'] ?? 'NOT SET'));
                error_log("Yatra TripController update_item: difficulty_level=" . ($data['difficulty_level'] ?? 'NOT SET'));
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
                $data['availability_dates']
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

        // Handle FAQs relationship
        if (isset($item->faqs)) {
            $data['faqs'] = array_map(function ($faq) {
                return [
                    'question' => $faq->question ?? '',
                    'answer' => $faq->answer ?? '',
                ];
            }, $item->faqs);
        }

        // Handle itinerary days relationship
        if (isset($item->itinerary_days)) {
            // Itinerary days are complex nested structures, return as-is for now
            // The frontend will handle the structure
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

        // Add user information
        if (isset($data['created_by']) && $data['created_by'] > 0) {
            $user = get_userdata($data['created_by']);
            $data['created_by_name'] = $user ? $user->display_name : __('Unknown', 'yatra');
        }

        if (isset($data['updated_by']) && $data['updated_by'] > 0) {
            $user = get_userdata($data['updated_by']);
            $data['updated_by_name'] = $user ? $user->display_name : __('Unknown', 'yatra');
        }

        return $data;
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

            if (!$trip) {
                return $this->error_response('Trip not found', 404);
            }

            // Fetch availability dates from database (specific dates)
            global $wpdb;
            $availability_table = $wpdb->prefix . 'yatra_trip_availability_dates';
            $specific_dates = $wpdb->get_results($wpdb->prepare(
                "SELECT *, 0 as is_recurring FROM {$availability_table} 
                 WHERE trip_id = %d 
                 AND departure_date >= CURDATE()
                 AND status IN ('available', 'limited')
                 ORDER BY departure_date ASC",
                $id
            )) ?: [];
            
            // Fetch recurring dates
            $recurring_dates = [];
            try {
                $recurringService = new \Yatra\Services\RecurringAvailabilityService(
                    new \Yatra\Repositories\RecurringAvailabilityRepository()
                );
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
            $availability_dates = $this->mergeAvailabilityDates($specific_dates, $recurring_dates);

            // Prepare trip data for template
            $trip_data = (object) [
                'id' => $trip->id,
                'title' => $trip->title ?? '',
                'starting_location' => $trip->starting_location ?? '',
                'ending_location' => $trip->ending_location ?? '',
                'original_price' => isset($trip->original_price) ? (float) $trip->original_price : 0,
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
            $this->render_availability_template($trip_data);
            
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
    private function render_availability_template($trip_data): void
    {
        // Check if we have real availability data
        $has_availability = !empty($trip_data->availability_dates) && is_array($trip_data->availability_dates);

        // Build cards from real availability data or use sample data
        $availability_cards = [];
        $month_filters = [];
        
        // Determine if this is a day trip (duration <= 1 day)
        $is_single_day = ($trip_data->duration_days ?? 1) <= 1;
        
        if ($has_availability) {
            $current_time = time();
            
            foreach ($trip_data->availability_dates as $avail) {
                $departure_date = strtotime($avail->departure_date);
                
                // Check booking cutoff - skip if past cutoff time
                $cutoff_hours = (int) ($avail->cutoff_hours ?? 24); // Default 24 hours before
                $departure_time_str = !empty($avail->departure_time) ? $avail->departure_time : '00:00:00';
                $departure_datetime = strtotime($avail->departure_date . ' ' . $departure_time_str);
                $cutoff_datetime = $departure_datetime - ($cutoff_hours * 3600);
                
                // Skip this availability if we're past the cutoff time
                if ($current_time > $cutoff_datetime) {
                    continue;
                }
                
                // Also skip if no seats available
                $seats = (int) ($avail->seats_available ?? 0);
                if ($seats <= 0) {
                    continue;
                }
                
                $return_date = !empty($avail->return_date) ? strtotime($avail->return_date) : strtotime($avail->departure_date . ' + ' . (($trip_data->duration_days ?? 1) - 1) . ' days');
                
                $original_price = !empty($avail->original_price) ? (float) $avail->original_price : (float) ($trip_data->original_price ?? 0);
                $sale_price = !empty($avail->discounted_price) ? (float) $avail->discounted_price : $original_price;
                
                // Calculate discount
                $discount_percent = 0;
                if ($original_price > 0 && $sale_price < $original_price) {
                    $discount_percent = round((($original_price - $sale_price) / $original_price) * 100);
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
                if (!empty($avail->traveler_pricing)) {
                    // From recurring rule
                    $card_traveler_pricing = is_array($avail->traveler_pricing) ? $avail->traveler_pricing : (json_decode($avail->traveler_pricing, true) ?: []);
                } elseif (!empty($avail->price_types)) {
                    // From specific availability date
                    $card_traveler_pricing = is_array($avail->price_types) ? $avail->price_types : (json_decode($avail->price_types, true) ?: []);
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
                    'seats' => $seats > 10 ? '10+' : (string) $seats,
                    'seats_available' => $seats,
                    'discount_text' => $discount_percent > 0 ? sprintf(__('%d%% OFF', 'yatra'), $discount_percent) : '',
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
                    'seats_available' => 15,
                    'discount_text' => '',
                    'original_price' => $trip_data->original_price ?? 0,
                    'sale_price' => $trip_data->sale_price ?? $trip_data->original_price ?? 0,
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

        // Prepare additional data for the template
        $pricing_type = $trip_data->pricing_type ?? 'regular';
        $price_types = $trip_data->price_types ?? [];
        $is_day_trip = ($trip_data->duration_days ?? 1) <= 1;
        
        // Include the template file
        $template_path = YATRA_PLUGIN_PATH . 'templates/partials/availability-section.php';
        
        if (file_exists($template_path)) {
            include $template_path;
        }
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
}
