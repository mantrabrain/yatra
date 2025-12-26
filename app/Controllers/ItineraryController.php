<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\ItineraryService;
use Yatra\Repositories\ItineraryRepository;

/**
 * Itinerary REST API Controller
 * API endpoints for itinerary entries management
 */
class ItineraryController extends BaseController
{
    private ItineraryService $service;

    public function __construct()
    {
        $this->service = new ItineraryService(new ItineraryRepository());
    }

    /**
     * Register routes
     */
    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        $base = 'itinerary';

        // Collection routes
        register_rest_route($namespace, '/' . $base, [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => [$this, 'check_permission'],
            ],
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'bulk_delete_items'],
                'permission_callback' => [$this, 'check_permission'],
            ],
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items_by_trip'],
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

        // Get day entry ID by day_id
        register_rest_route($namespace, '/' . $base . '/day-entry-by-day-id/(?P<day_id>[\d]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_day_entry_id_by_day_id'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);
    }

    /**
     * Get items by trip ID
     */
    public function get_items_by_trip(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $trip_id = (int) $request->get_param('trip_id');
            
            if (!$trip_id) {
                return $this->error_response('Trip ID is required', 400);
            }

            $items = $this->service->getByTripId($trip_id);
            
            // Debug logging
            error_log('[ITINERARY CONTROLLER DEBUG] Raw items from service: ' . json_encode($items));
            error_log('[ITINERARY CONTROLLER DEBUG] Items count: ' . count($items));
            
            $prepared_items = array_map(function ($item) use ($request) {
                $prepared = $this->prepare_item_for_response($item, $request);
                error_log('[ITINERARY CONTROLLER DEBUG] Prepared item: ' . json_encode($prepared));
                return $prepared;
            }, $items);

            error_log('[ITINERARY CONTROLLER DEBUG] Final prepared items: ' . json_encode($prepared_items));
            
            $response = $this->success_response($prepared_items);
            error_log('[ITINER Beautify DEBUG] Final response data: ' . json_encode($response->get_data()));
            
            return $response;
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get item
     */
    public function get_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            error_log("[YATRA DEBUG] ItineraryController::get_item - Called with id: {$id}");
            
            $item = $this->service->find($id);
            
            if (!$item) {
                error_log("[YATRA DEBUG] ItineraryController::get_item - Item not found for id: {$id}");
                return $this->error_response('Itinerary entry not found', 404);
            }
            
            error_log("[YATRA DEBUG] ItineraryController::get_item - Raw item from service: " . json_encode($item));
            
            $prepared = $this->prepare_item_for_response($item, $request);
            error_log("[YATRA DEBUG] ItineraryController::get_item - Prepared item: " . json_encode($prepared));
            
            return $this->success_response($prepared);
        } catch (\Exception $e) {
            error_log("[YATRA DEBUG] ItineraryController::get_item - Error: " . $e->getMessage());
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
            error_log("[YATRA DEBUG] ItineraryController::create_item - Received data: " . print_r($data, true));
            error_log("[YATRA DEBUG] ItineraryController::create_item - day_description: " . ($data['day_description'] ?? 'NOT_SET'));
            $id = $this->service->create($data);

            return $this->success_response([
                'id' => $id,
                'message' => __('Itinerary entry created successfully', 'yatra'),
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
            error_log("[YATRA DEBUG] ItineraryController::update_item - ID: $id, Received data: " . print_r($data, true));
            error_log("[YATRA DEBUG] ItineraryController::update_item - day_description: " . ($data['day_description'] ?? 'NOT_SET'));

            $result = $this->service->update($id, $data);

            if (!$result) {
                return $this->error_response('Failed to update itinerary entry', 500);
            }

            return $this->success_response([
                'message' => __('Itinerary entry updated successfully', 'yatra'),
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->error_response($e->getMessage(), 400);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Delete item
     */
    public function delete_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $result = $this->service->delete($id);

            if (!$result) {
                return $this->error_response('Failed to delete itinerary entry', 500);
            }

            return $this->success_response([
                'message' => __('Itinerary entry deleted successfully', 'yatra'),
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Bulk delete items
     */
    public function bulk_delete_items(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $data = $request->get_json_params();
            $ids = $data['ids'] ?? [];

            if (empty($ids) || !is_array($ids)) {
                return $this->error_response('No IDs provided for bulk delete', 400);
            }

            $result = $this->service->bulkDelete($ids);

            return $this->success_response([
                'deleted' => $result['deleted'],
                'failed' => $result['failed'],
                'message' => sprintf(
                    __('%d item(s) deleted successfully. %d item(s) failed to delete.', 'yatra'),
                    $result['deleted'],
                    $result['failed']
                ),
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get day entry ID by day_id
     */
    public function get_day_entry_id_by_day_id(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $dayId = (int) $request->get_param('day_id');
            error_log("[YATRA DEBUG] ItineraryController::get_day_entry_id_by_day_id - Called with day_id: {$dayId}");
            
            $repository = new ItineraryRepository();
            $dayEntryId = $repository->getDayEntryIdByDayId($dayId);
            
            error_log("[YATRA DEBUG] ItineraryController::get_day_entry_id_by_day_id - Retrieved day_entry_id: " . ($dayEntryId ?? 'NULL'));

            return $this->success_response([
                'day_entry_id' => $dayEntryId,
            ]);
        } catch (\Exception $e) {
            error_log("[YATRA DEBUG] ItineraryController::get_day_entry_id_by_day_id - Error: " . $e->getMessage());
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Prepare item for response
     */
    protected function prepare_item_for_response($item, WP_REST_Request $request): array
    {
        // Parse included_items and excluded_items from JSON if they're strings
        $includedItems = $item->included_items ?? [];
        if (is_string($includedItems)) {
            $decoded = json_decode($includedItems, true);
            $includedItems = is_array($decoded) ? $decoded : [];
        }
        
        $excludedItems = $item->excluded_items ?? [];
        if (is_string($excludedItems)) {
            $decoded = json_decode($excludedItems, true);
            $excludedItems = is_array($decoded) ? $decoded : [];
        }
        
        return [
            'id' => (int) $item->id,
            'trip_id' => (int) $item->trip_id,
            'day_id' => (int) $item->day_id,
            'day' => isset($item->day_number) ? (int) $item->day_number : null,
            'day_title' => $item->day_title ?? null,
            'day_description' => $item->day_description ?? null,
            'title' => $item->title ?? '',
            'description' => $item->description ?? '',
            'time' => $item->time ?? null,
            'start_time' => $item->start_time ?? null,
            'end_time' => $item->end_time ?? null,
            'time_type' => $item->time_type ?? 'exact',
            'location' => $item->location ?? null,
            'duration' => $item->duration ?? null,
            'cost' => isset($item->cost) ? (float) $item->cost : null,
            'cost_per_person' => isset($item->cost_per_person) ? (bool) $item->cost_per_person : false,
            'notes' => $item->notes ?? null,
            'item_type_id' => isset($item->item_type_id) ? (int) $item->item_type_id : null,
            'item_id' => isset($item->item_id) ? (int) $item->item_id : null,
            'included_items' => $includedItems,
            'excluded_items' => $excludedItems,
            'status' => $item->status ?? 'draft',
            'images' => $item->images ?? [],
            'order' => (int) ($item->order ?? 0),
            'created_at' => $item->created_at ?? null,
            'updated_at' => $item->updated_at ?? null,
        ];
    }
}

