<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\CategoryService;
use Yatra\Database\Tables\TripsTable;
use Yatra\Database\Tables\TripClassificationsTable;

/**
 * Category REST API Controller
 * 
 * Endpoints:
 * - GET    /categories       - List categories
 * - POST   /categories       - Create category
 * - GET    /categories/{id}  - Get single category
 * - PUT    /categories/{id}  - Update category
 * - DELETE /categories/{id}  - Delete category
 */
class CategoryController extends BaseController
{
    /**
     * @var CategoryService
     */
    private CategoryService $service;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->service = new CategoryService();
    }

    /**
     * List categories
     */
    public function list_items(WP_REST_Request $request)
    {
                
        try {
            $params = $this->getPaginationParams($request);

            // Handle status filter
            $status = $request->get_param('status');
            if ($status && $status !== 'all') {
                $args['status'] = sanitize_text_field($status);
            }

            $items = $this->service->getAll($args);
            $total = $this->service->count($args);

            // Attach trip counts to items
            if (!empty($items)) {
                foreach ($items as $item) {
                    $categoryId = isset($item->id) ? (int) $item->id : 0;
                    if ($categoryId <= 0) {
                        continue;
                    }

                    $tripCount = $this->service->getTripCount($categoryId);
                    $item->trip_count = $tripCount;
                }
            }


            $prepared = array_map([$this, 'prepareItem'], $items);
            

            return $this->paginated_response($prepared, $total, $params['page'], $params['per_page']);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get single category
     */
    public function get_item(WP_REST_Request $request)
    {
        try {
            $item = $this->service->getById($this->getId($request));

            if (!$item) {
                return $this->not_found(__('Category not found', 'yatra'));
            }

            // Attach trip count for single category
            $categoryId = isset($item->id) ? (int) $item->id : 0;
            if ($categoryId > 0) {
                $tripCount = $this->service->getTripCount($categoryId);
                $item->trip_count = $tripCount;
            }

            return $this->success_response($this->prepareItem($item));
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Create category
     */
    public function create_item(WP_REST_Request $request)
    {
        try {
            $id = $this->service->create($this->getBody($request));

            return $this->success_response([
                'id' => $id,
                'message' => __('Category created successfully', 'yatra'),
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Update category
     */
    public function update_item(WP_REST_Request $request)
    {
        try {
            $id = $this->getId($request);
            $data = $this->getBody($request);
            

            $result = $this->service->update($id, $data);

            if (!$result) {
                return $this->not_found(__('Category not found', 'yatra'));
            }

            return $this->success_response([
                'id' => $id,
                'message' => __('Category updated successfully', 'yatra'),
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Delete category
     */
    public function delete_item(WP_REST_Request $request)
    {
        try {
            $id = $this->getId($request);
            $result = $this->service->delete($id);

            if (!$result) {
                return $this->not_found(__('Category not found', 'yatra'));
            }

            return $this->success_response([
                'message' => __('Category deleted successfully', 'yatra'),
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get status counts
     */
    public function get_stats(WP_REST_Request $request)
    {
        try {
            $counts = $this->service->getStatusCounts();
            return $this->success_response($counts);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Prepare item for response
     */
    protected function prepareItem($item): array
    {
        
        $data = [
            'id' => (int) $item->id,
            'type' => $item->type,
            'name' => $item->name,
            'slug' => $item->slug,
            'description' => $item->description,
            'parent_id' => $item->parent_id,
            'level' => $item->level,
            'icon' => $item->icon,
            'color' => $item->color,
            'image_id' => $item->image_id,
            'metadata' => isset($item->metadata) && is_string($item->metadata) ? maybe_unserialize($item->metadata) : $item->metadata,
            'sorting' => $item->sorting,
            'is_featured' => !empty($item->is_featured) ? 1 : 0,
            'status' => $item->status,
            'created_at' => $item->created_at,
            'updated_at' => $item->updated_at,
            'created_by' => $item->created_by,
            'updated_by' => $item->updated_by,
        ];
        

        // Add trip count if available
        if (isset($item->trip_count)) {
            $data['trip_count'] = (int) $item->trip_count;
        }

        // Add user names if available
        if (isset($item->created_by_name)) {
            $data['created_by_name'] = $item->created_by_name;
        }
        if (isset($item->updated_by_name)) {
            $data['updated_by_name'] = $item->updated_by_name;
        }

        return $data;
    }
}
