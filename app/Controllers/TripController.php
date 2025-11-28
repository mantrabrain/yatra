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
            
            // Extract relationships (fields stored in separate tables)
            $relationships = [
                'destinations' => $data['destinations'] ?? [],
                'activities' => $data['activity_types'] ?? [],
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

            // Extract relationships (fields stored in separate tables)
            $relationships = [];
            if (isset($data['destinations'])) {
                $relationships['destinations'] = $data['destinations'];
            }
            if (isset($data['activity_types'])) {
                $relationships['activities'] = $data['activity_types'];
            }
            if (isset($data['price_types'])) {
                $relationships['price_types'] = $data['price_types'];
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

        if (isset($item->price_types)) {
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
                return $img->image_url ?? '';
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

            // Prepare trip data for template
            $trip_data = (object) [
                'id' => $trip->id,
                'title' => $trip->title ?? '',
                'starting_location' => $trip->starting_location ?? '',
                'ending_location' => $trip->ending_location ?? '',
                'original_price' => isset($trip->original_price) ? (float) $trip->original_price : 0,
                'sale_price' => isset($trip->sale_price) ? (float) $trip->sale_price : 0,
                'currency' => $trip->currency ?? 'USD',
            ];

            // Start output buffering
            ob_start();
            
            // Generate availability HTML inline (since we're using dummy data)
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
        // Get trip slug from query var or create from title
        global $wp_query;
        $trip_slug = get_query_var('yatra_trip_slug');
        if (empty($trip_slug) && !empty($trip_data->title)) {
            $trip_slug = sanitize_title($trip_data->title);
        }
        if (empty($trip_slug)) {
            $trip_slug = 'trip';
        }
        
        // Get trip ID from the trip data object (always use this)
        $trip_id = !empty($trip_data->id) ? (int) $trip_data->id : 0;

        $format_price = function($price) {
            return 'USD ' . number_format($price, 0);
        };

        $svg_icon = function($name, $class = '') {
            $icons = [
                'calendar' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
                'info' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/></svg>',
                'users' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
            ];
            return $icons[$name] ?? '';
        };

        $sample_cards = [
            [
                'from_label' => 'From Naples',
                'from_date' => '14 Dec 2025',
                'from_location' => 'Naples, Italy',
                'to_label' => 'To Naples',
                'to_date' => '18 Dec 2025',
                'to_location' => 'Naples, Italy',
                'seats' => '10+',
                'discount_text' => '37% OFF TODAY',
                'original_price' => 2060,
                'sale_price' => 1299,
                'title' => 'Sorrento, Positano, Amalfi, Capri & Pompeii',
                'type' => 'Group Departure',
                'start_date' => '14 Dec 2025',
                'end_date' => '18 Dec 2025',
                'start_location' => 'Naples, Italy',
                'end_location' => 'Naples, Italy',
                'data_month' => 'dec-2025',
                'data_date' => '2025-12-14',
            ],
            [
                'from_label' => 'From Naples',
                'from_date' => '15 Dec 2025',
                'from_location' => 'Naples, Italy',
                'to_label' => 'To Naples',
                'to_date' => '19 Dec 2025',
                'to_location' => 'Naples, Italy',
                'seats' => '8+',
                'discount_text' => '32% OFF TODAY',
                'original_price' => 2060,
                'sale_price' => 1399,
                'title' => 'Amalfi Coast Discovery',
                'type' => 'Group Departure',
                'start_date' => '15 Dec 2025',
                'end_date' => '19 Dec 2025',
                'start_location' => 'Naples, Italy',
                'end_location' => 'Naples, Italy',
                'data_month' => 'dec-2025',
                'data_date' => '2025-12-15',
            ],
            [
                'from_label' => 'From Naples',
                'from_date' => '16 Dec 2025',
                'from_location' => 'Naples, Italy',
                'to_label' => 'To Naples',
                'to_date' => '20 Dec 2025',
                'to_location' => 'Naples, Italy',
                'seats' => '12+',
                'discount_text' => '30% OFF TODAY',
                'original_price' => 2060,
                'sale_price' => 1499,
                'title' => 'Capri & Pompeii Explorer',
                'type' => 'Group Departure',
                'start_date' => '16 Dec 2025',
                'end_date' => '20 Dec 2025',
                'start_location' => 'Naples, Italy',
                'end_location' => 'Naples, Italy',
                'data_month' => 'dec-2025',
                'data_date' => '2025-12-16',
            ],
        ];
        ?>
        <section class="yatra-trip-section yatra-availability-section" id="availability">
            <div class="yatra-availability-header">
                <div class="yatra-availability-header-top">
                    <h2 class="yatra-trip-section-title">
                        <?php echo $svg_icon('calendar', 'yatra-trip-section-title-icon'); ?>
                        Availability
                    </h2>
                    <div class="yatra-availability-sort">
                        <select class="yatra-availability-sort-select" id="availability-sort">
                            <option value="date-asc">Sort by: Date (Earliest)</option>
                            <option value="date-desc">Sort by: Date (Latest)</option>
                            <option value="price-asc">Sort by: Price (Low to High)</option>
                            <option value="price-desc">Sort by: Price (High to Low)</option>
                            <option value="seats-desc">Sort by: Availability (Most)</option>
                        </select>
                    </div>
                </div>
                <p class="yatra-availability-subtitle">Choose your preferred departure date and book your spot</p>
            </div>

            <div class="yatra-availability-filters">
                <button type="button" class="yatra-availability-filter-btn active" data-filter="all">All Dates</button>
                <button type="button" class="yatra-availability-filter-btn" data-filter="dec-2025">Dec 2025</button>
                <button type="button" class="yatra-availability-filter-btn" data-filter="jan-2026">Jan 2026</button>
                <button type="button" class="yatra-availability-filter-btn" data-filter="feb-2026">Feb 2026</button>
                <button type="button" class="yatra-availability-filter-btn" data-filter="mar-2026">Mar 2026</button>
            </div>

            <div class="yatra-availability-list">
                <?php foreach ($sample_cards as $index => $card):
                    $item_id = (string) $index;
                    $sale_price = (string) $card['sale_price'];
                ?>
                <div class="yatra-availability-card <?php echo $index === 0 ? 'open' : ''; ?>"
                     data-month="<?php echo esc_attr($card['data_month']); ?>"
                     data-date="<?php echo esc_attr($card['data_date']); ?>"
                     data-price="<?php echo esc_attr($sale_price); ?>"
                     data-seats="<?php echo esc_attr($card['seats']); ?>"
                     data-item="<?php echo esc_attr($item_id); ?>">
                    
                    <!-- Card Header (Clickable) -->
                    <div class="yatra-availability-card-header yatra-availability-toggle" role="button" tabindex="0" aria-label="Toggle availability details">
                        <div class="yatra-card-header-grid">
                            <!-- From -->
                            <div class="yatra-card-header-item">
                                <div class="yatra-card-header-label"><?php echo esc_html($card['from_label']); ?></div>
                                <div class="yatra-card-header-date"><?php echo esc_html($card['from_date']); ?></div>
                                <div class="yatra-card-header-location"><?php echo esc_html($card['from_location']); ?></div>
                            </div>
                            
                            <!-- To -->
                            <div class="yatra-card-header-item">
                                <div class="yatra-card-header-label"><?php echo esc_html($card['to_label']); ?></div>
                                <div class="yatra-card-header-date"><?php echo esc_html($card['to_date']); ?></div>
                                <div class="yatra-card-header-location"><?php echo esc_html($card['to_location']); ?></div>
                            </div>
                            
                            <!-- Seats -->
                            <div class="yatra-card-header-item">
                                <div class="yatra-card-header-label">Seats remaining</div>
                                <div class="yatra-card-header-seats"><?php echo esc_html($card['seats']); ?></div>
                                <div class="yatra-card-header-sub">per departure</div>
                            </div>
                            
                            <!-- Price -->
                            <div class="yatra-card-header-price">
                                <?php if (!empty($card['discount_text'])): ?>
                                <div class="yatra-card-discount-badge"><?php echo esc_html($card['discount_text']); ?></div>
                                <?php endif; ?>
                                <div class="yatra-card-price-group">
                                    <span class="yatra-card-price-original"><?php echo esc_html($format_price($card['original_price'])); ?></span>
                                    <span class="yatra-card-price-sale"><?php echo esc_html($format_price($card['sale_price'])); ?></span>
                                </div>
                            </div>
                            
                            <!-- Arrow -->
                            <div class="yatra-card-header-arrow">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <!-- Card Body (Expandable) -->
                    <div class="yatra-availability-card-body">
                        <div class="yatra-card-body-content">
                            <div class="yatra-card-tour-header">
                                <h4 class="yatra-card-tour-title"><?php echo esc_html($card['title']); ?></h4>
                                <div class="yatra-card-tour-meta">
                                    <span class="yatra-card-tour-type"><?php echo esc_html($card['type']); ?></span>
                                    <span class="yatra-card-tour-separator">•</span>
                                    <span class="yatra-card-tour-location"><?php echo esc_html($card['from_location']); ?></span>
                                </div>
                            </div>
                            
                            <div class="yatra-card-info-grid">
                                <div class="yatra-card-info-item">
                                    <div class="yatra-card-info-icon">
                                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                        </svg>
                                    </div>
                                    <div class="yatra-card-info-content">
                                        <div class="yatra-card-info-label">Duration</div>
                                        <div class="yatra-card-info-value">
                                            <?php
                                            $start = strtotime($card['data_date']);
                                            $end = strtotime($card['to_date']);
                                            $days = round(($end - $start) / (60 * 60 * 24)) + 1;
                                            echo esc_html((string) $days) . ' ' . ($days === 1 ? 'Day' : 'Days');
                                            ?>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="yatra-card-info-item">
                                    <div class="yatra-card-info-icon">
                                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h-1.5a4.5 4.5 0 00-9 0H7m3-2a4 4 0 100-8 4 4 0 000 8zm-2 10h7a4 4 0 004-4v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2a4 4 0 004 4z"/>
                                        </svg>
                                    </div>
                                    <div class="yatra-card-info-content">
                                        <div class="yatra-card-info-label">Group Size</div>
                                        <div class="yatra-card-info-value">Up to 20 travelers</div>
                                    </div>
                                </div>
                                
                                <div class="yatra-card-info-item">
                                    <div class="yatra-card-info-icon">
                                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                        </svg>
                                    </div>
                                    <div class="yatra-card-info-content">
                                        <div class="yatra-card-info-label">Free Cancellation</div>
                                        <div class="yatra-card-info-value">Up to 24 hours before</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="yatra-card-timeline">
                                <div class="yatra-timeline-item">
                                    <div class="yatra-timeline-dot yatra-timeline-dot-start"></div>
                                    <div class="yatra-timeline-content">
                                        <div class="yatra-timeline-label">Trip start</div>
                                        <div class="yatra-timeline-date"><?php echo esc_html($card['start_date']); ?></div>
                                        <div class="yatra-timeline-location"><?php echo esc_html($card['start_location']); ?></div>
                                    </div>
                                </div>
                                <div class="yatra-timeline-item">
                                    <div class="yatra-timeline-dot yatra-timeline-dot-end"></div>
                                    <div class="yatra-timeline-content">
                                        <div class="yatra-timeline-label">Trip end</div>
                                        <div class="yatra-timeline-date"><?php echo esc_html($card['end_date']); ?></div>
                                        <div class="yatra-timeline-location"><?php echo esc_html($card['end_location']); ?></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="yatra-card-traveler-section">
                                <label class="yatra-card-traveler-label">Travelers</label>
                                <div class="yatra-booking-field-select yatra-participants-select yatra-availability-participants" data-item="<?php echo esc_attr($item_id); ?>">
                                    <div class="yatra-booking-field-icon">
                                        <?php echo $svg_icon('users', 'yatra-icon-sm'); ?>
                                    </div>
                                    <div class="yatra-participants-display yatra-availability-participants-display" data-item="<?php echo esc_attr($item_id); ?>">
                                        Adult x 1
                                    </div>
                                    <svg class="yatra-select-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                    </svg>
                                    <div class="yatra-booking-quantity-selector yatra-availability-quantity-selector" data-item="<?php echo esc_attr($item_id); ?>">
                                        <div class="yatra-quantity-row">
                                            <div class="yatra-quantity-label">
                                                <span class="yatra-quantity-title">Adult</span>
                                                <span class="yatra-quantity-subtitle">(Age 13-99)</span>
                                            </div>
                                            <div class="yatra-quantity-controls">
                                                <button type="button" class="yatra-quantity-btn yatra-quantity-minus" data-target="adults" data-item="<?php echo esc_attr($item_id); ?>" aria-label="Decrease adults">
                                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                                    </svg>
                                                </button>
                                                <input type="number" class="yatra-quantity-input yatra-availability-adults" data-item="<?php echo esc_attr($item_id); ?>" value="1" min="1" max="20" readonly>
                                                <button type="button" class="yatra-quantity-btn yatra-quantity-plus" data-target="adults" data-item="<?php echo esc_attr($item_id); ?>" aria-label="Increase adults">
                                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <div class="yatra-quantity-row">
                                            <div class="yatra-quantity-label">
                                                <span class="yatra-quantity-title">Child</span>
                                                <span class="yatra-quantity-subtitle">(Age 4-12)</span>
                                            </div>
                                            <div class="yatra-quantity-controls">
                                                <button type="button" class="yatra-quantity-btn yatra-quantity-minus" data-target="children" data-item="<?php echo esc_attr($item_id); ?>" aria-label="Decrease children" disabled>
                                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                                    </svg>
                                                </button>
                                                <input type="number" class="yatra-quantity-input yatra-availability-children" data-item="<?php echo esc_attr($item_id); ?>" value="0" min="0" max="10" readonly>
                                                <button type="button" class="yatra-quantity-btn yatra-quantity-plus" data-target="children" data-item="<?php echo esc_attr($item_id); ?>" aria-label="Increase children">
                                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Booking Row at Bottom -->
                        <div class="yatra-card-booking-row">
                            <div class="yatra-card-total-box">
                                <div class="yatra-card-total-label">Total</div>
                                <div class="yatra-card-total-note" data-item="<?php echo esc_attr($item_id); ?>">for 1 traveler</div>
                                <div class="yatra-card-total-amount" data-item="<?php echo esc_attr($item_id); ?>" data-base-price="<?php echo esc_attr($sale_price); ?>" data-currency="USD">
                                    <?php echo esc_html($format_price($card['sale_price'])); ?>
                                </div>
                            </div>
                            <button type="button" 
                               class="yatra-card-book-btn" 
                               data-trip-id="<?php echo esc_attr($trip_id); ?>"
                               data-date="<?php echo esc_attr($card['data_date']); ?>"
                               data-price="<?php echo esc_attr($sale_price); ?>"
                               data-item="<?php echo esc_attr($item_id); ?>">
                                Book Now
                            </button>
                        </div>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>

            <div class="yatra-availability-load-more">
                <button type="button" class="yatra-availability-load-more-btn">Load more departures</button>
            </div>

        </section>
        <?php
    }
}
