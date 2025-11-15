<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\TripService;
use Yatra\Repositories\TripRevisionRepository;
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

            return $this->success_response([
                'data' => $this->prepare_collection_for_response($items, $request),
                'total' => $total,
                'page' => (int) ($request->get_param('page') ?: 1),
                'per_page' => (int) ($request->get_param('per_page') ?: 10),
            ]);
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
                    'accommodation' => $day->accommodation ?? '',
                    'meal_plan' => $day->meals ?? $day->meal_plan ?? '', // Database uses 'meals', form uses 'meal_plan'
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
                            'time' => $entry->time ?? '',
                            'title' => $entry->title ?? '',
                            'description' => $entry->description ?? '',
                            'location' => $entry->location ?? '',
                            'duration' => $entry->duration ?? '',
                            'activity_type' => $entry->activity_type ?? '',
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
}
