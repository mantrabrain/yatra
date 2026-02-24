<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Services\AttributeService;

/**
 * Attribute REST API Controller
 * 
 * Handles REST API endpoints for trip attributes
 * 
 * Endpoints:
 * GET    /yatra/v1/attributes              - List attributes
 * POST   /yatra/v1/attributes              - Create attribute
 * GET    /yatra/v1/attributes/{id}         - Get single attribute
 * PUT    /yatra/v1/attributes/{id}         - Update attribute
 * DELETE /yatra/v1/attributes/{id}         - Delete attribute
 * POST   /yatra/v1/attributes/orders        - Update display orders
 * GET    /yatra/v1/attributes/search        - Search attributes
 * GET    /yatra/v1/attributes/frontend      - Get frontend attributes
 * GET    /yatra/v1/attributes/filterable    - Get filterable attributes
 * GET    /yatra/v1/attributes/values/{id}   - Get attribute values
 * GET    /yatra/v1/trips/{id}/attributes    - Get trip attributes
 * POST   /yatra/v1/trips/{id}/attributes    - Set trip attribute
 * DELETE /yatra/v1/trips/{id}/attributes/{attr_id} - Remove trip attribute
 */
class AttributeController extends BaseController
{
    /**
     * @var AttributeService
     */
    private $attributeService;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->rest_base = 'attributes';
        $this->attributeService = new AttributeService();
    }

    /**
     * Register REST API routes
     */
    public function register_routes(): void
    {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra AttributeController: Registering routes');
        }
        
        // Standard CRUD routes
        $this->registerCrudRoutes();

        // Additional routes
        register_rest_route($this->namespace, "/{$this->rest_base}/search", [
            'methods' => 'GET',
            'callback' => [$this, 'search'],
            'permission_callback' => [$this, 'search_permissions_check'],
            'args' => [
                'q' => [
                    'required' => true,
                    'type' => 'string',
                    'minLength' => 2,
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);

        register_rest_route($this->namespace, "/{$this->rest_base}/frontend", [
            'methods' => 'GET',
            'callback' => [$this, 'get_frontend_attributes'],
            'permission_callback' => '__return_true', // Public endpoint
        ]);

        register_rest_route($this->namespace, "/{$this->rest_base}/filterable", [
            'methods' => 'GET',
            'callback' => [$this, 'get_filterable_attributes'],
            'permission_callback' => '__return_true', // Public endpoint
        ]);

        // Stats endpoint
        register_rest_route($this->namespace, "/{$this->rest_base}/stats", [
            'methods' => 'GET',
            'callback' => [$this, 'getStats'],
            'permission_callback' => [$this, 'get_permissions_check'],
        ]);

        register_rest_route($this->namespace, "/{$this->rest_base}/values/(?P<id>\d+)", [
            'methods' => 'GET',
            'callback' => [$this, 'get_attribute_values'],
            'permission_callback' => '__return_true', // Public endpoint
            'args' => [
                'id' => [
                    'required' => true,
                    'type' => 'integer',
                    'validate_callback' => function($param) {
                        return is_numeric($param) && $param > 0;
                    },
                ],
            ],
        ]);

        register_rest_route($this->namespace, "/{$this->rest_base}/orders", [
            'methods' => 'POST',
            'callback' => [$this, 'update_display_orders'],
            'permission_callback' => [$this, 'check_permission'],
            'args' => [
                'orders' => [
                    'required' => true,
                    'type' => 'array',
                    'validate_callback' => function($param) {
                        return is_array($param) && !empty($param);
                    },
                ],
            ],
        ]);

        register_rest_route($this->namespace, "/{$this->rest_base}/check-slug", [
            'methods' => 'GET',
            'callback' => [$this, 'check_slug'],
            'permission_callback' => [$this, 'get_permissions_check'],
            'args' => [
                'slug' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'exclude_id' => [
                    'required' => false,
                    'type' => 'integer',
                    'validate_callback' => function($param) {
                        return is_numeric($param) && $param > 0;
                    },
                ],
            ],
        ]);

        // Trip attribute routes
        register_rest_route($this->namespace, "/trips/(?P<trip_id>\d+)/attributes", [
            'methods' => 'GET',
            'callback' => [$this, 'get_trip_attributes'],
            'permission_callback' => '__return_true', // Public endpoint
            'args' => [
                'trip_id' => [
                    'required' => true,
                    'type' => 'integer',
                    'validate_callback' => function($param) {
                        return is_numeric($param) && $param > 0;
                    },
                ],
            ],
        ]);

        register_rest_route($this->namespace, "/trips/(?P<trip_id>\d+)/attributes", [
            'methods' => 'POST',
            'callback' => [$this, 'set_trip_attribute'],
            'permission_callback' => [$this, 'update_permissions_check'],
            'args' => [
                'trip_id' => [
                    'required' => true,
                    'type' => 'integer',
                    'validate_callback' => function($param) {
                        return is_numeric($param) && $param > 0;
                    },
                ],
                'attribute_id' => [
                    'required' => true,
                    'type' => 'integer',
                    'validate_callback' => function($param) {
                        return is_numeric($param) && $param > 0;
                    },
                ],
                'value' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'wp_kses_post',
                ],
            ],
        ]);

        register_rest_route($this->namespace, "/trips/(?P<trip_id>\d+)/attributes/(?P<attribute_id>\d+)", [
            'methods' => 'DELETE',
            'callback' => [$this, 'remove_trip_attribute'],
            'permission_callback' => [$this, 'update_permissions_check'],
            'args' => [
                'trip_id' => [
                    'required' => true,
                    'type' => 'integer',
                    'validate_callback' => function($param) {
                        return is_numeric($param) && $param > 0;
                    },
                ],
                'attribute_id' => [
                    'required' => true,
                    'type' => 'integer',
                    'validate_callback' => function($param) {
                        return is_numeric($param) && $param > 0;
                    },
                ],
            ],
        ]);
    }

    /**
     * Get all attributes
     */
    public function get_items(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $params = $request->get_params();
            
            // Get pagination parameters
            $page = isset($params['page']) ? (int) $params['page'] : 1;
            $perPage = isset($params['per_page']) ? (int) $params['per_page'] : 10;
            
            // Build filters
            $filters = [];
            if (!empty($params['status'])) {
                $filters['status'] = $params['status'];
            }
            if (!empty($params['field_type'])) {
                $filters['field_type'] = $params['field_type'];
            }
            if (!empty($params['show_on_frontend'])) {
                $filters['show_on_frontend'] = $params['show_on_frontend'];
            }
            if (!empty($params['show_in_filters'])) {
                $filters['show_in_filters'] = $params['show_in_filters'];
            }
            
            // Add search filter
            if (!empty($params['search'])) {
                $filters['search'] = $params['search'];
            }
            
            // Add sorting
            if (!empty($params['orderby'])) {
                $filters['orderby'] = $params['orderby'];
            }
            if (!empty($params['order'])) {
                $filters['order'] = $params['order'];
            }

            // Get paginated results
            $result = $this->attributeService->paginate($page, $perPage, $filters);
            $total = $this->attributeService->count($filters);
            
            // Process icon fields and metadata for all attributes
            foreach ($result as $attribute) {
                // Parse metadata JSON and extract attribute properties
                if (!empty($attribute->metadata)) {
                    $metadata = json_decode($attribute->metadata, true);
                    if (is_array($metadata)) {
                        // Add metadata fields as properties to the attribute object
                        $attribute->field_type = $metadata['field_type'] ?? null;
                        $attribute->required = $metadata['required'] ?? false;
                        $attribute->show_on_frontend = $metadata['show_on_frontend'] ?? false;
                        $attribute->show_in_filters = $metadata['show_in_filters'] ?? false;
                        $attribute->filter_type = $metadata['filter_type'] ?? null;
                        $attribute->searchable = $metadata['searchable'] ?? false;
                        $attribute->display_order = $metadata['display_order'] ?? 0;
                        $attribute->default_value = $metadata['default_value'] ?? null;
                        $attribute->placeholder = $metadata['placeholder'] ?? null;
                        $attribute->field_options = $metadata['field_options'] ?? null;
                        $attribute->validation_rules = $metadata['validation_rules'] ?? null;
                    }
                }
                
                if (!empty($attribute->icon)) {
                    $icon_data = maybe_unserialize($attribute->icon);
                    if (is_array($icon_data)) {
                        // Resolve image URLs for image type icons
                        if ($icon_data['type'] === 'image' && !empty($icon_data['value'])) {
                            $value = $icon_data['value'];
                            $image_url = '';
                            
                            if (is_numeric($value)) {
                                $maybe_url = wp_get_attachment_image_url((int) $value, 'large');
                                if (!empty($maybe_url)) {
                                    $image_url = $maybe_url;
                                }
                            } elseif (is_string($value) && filter_var($value, FILTER_VALIDATE_URL)) {
                                $image_url = $value;
                            }
                            
                            $icon_data['value'] = $image_url;
                        }
                        $attribute->icon = $icon_data;
                    } else {
                        // Handle legacy string format
                        $attribute->icon = [
                            'type' => 'icon',
                            'value' => $attribute->icon
                        ];
                    }
                } else {
                    $attribute->icon = null;
                }
            }
            
            return $this->paginated_response($result, $total, $page, $perPage);
            
        } catch (\Exception $e) {
            return $this->error_response('Failed to retrieve attributes: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Create attribute
     */
    public function create_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $data = $this->prepare_item_for_database($request);
            
            // Debug logging for icon data
            error_log('DEBUG: Create attribute - Icon data in prepared data: ' . var_export(isset($data['icon']) ? $data['icon'] : 'NOT SET', true));
            
            // Handle slug conflicts by generating unique slug if needed
            $originalSlug = $data['slug'];
            $slug = $originalSlug;
            $counter = 1;
            
            while ($this->attributeService->slugExists($slug)) {
                $slug = $originalSlug . '-' . $counter;
                $counter++;
            }
            
            $data['slug'] = $slug;
            
            $attributeId = $this->attributeService->createAttribute($data);
            
            if ($attributeId) {
                $attribute = $this->attributeService->getById($attributeId);
                
                // Parse metadata JSON and extract attribute properties
                if (!empty($attribute->metadata)) {
                    $metadata = json_decode($attribute->metadata, true);
                    if (is_array($metadata)) {
                        // Add metadata fields as properties to the attribute object
                        $attribute->field_type = $metadata['field_type'] ?? null;
                        $attribute->required = $metadata['required'] ?? false;
                        $attribute->show_on_frontend = $metadata['show_on_frontend'] ?? false;
                        $attribute->show_in_filters = $metadata['show_in_filters'] ?? false;
                        $attribute->filter_type = $metadata['filter_type'] ?? null;
                        $attribute->searchable = $metadata['searchable'] ?? false;
                        $attribute->display_order = $metadata['display_order'] ?? 0;
                        $attribute->default_value = $metadata['default_value'] ?? null;
                        $attribute->placeholder = $metadata['placeholder'] ?? null;
                        $attribute->field_options = $metadata['field_options'] ?? null;
                        $attribute->validation_rules = $metadata['validation_rules'] ?? null;
                    }
                }
                
                return $this->success_response($attribute, 201);
            }
            
            return $this->error_response('Failed to create attribute', 500);
            
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 400);
        }
    }

    /**
     * Get single attribute
     */
    public function get_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            
            $attribute = $this->attributeService->getById($id);
            
            if (!$attribute) {
                return $this->error_response('Attribute not found', 404);
            }
            
            // Parse metadata JSON and extract attribute properties
            if (!empty($attribute->metadata)) {
                $metadata = json_decode($attribute->metadata, true);
                if (is_array($metadata)) {
                    // Add metadata fields as properties to the attribute object
                    $attribute->field_type = $metadata['field_type'] ?? null;
                    $attribute->required = $metadata['required'] ?? false;
                    $attribute->show_on_frontend = $metadata['show_on_frontend'] ?? false;
                    $attribute->show_in_filters = $metadata['show_in_filters'] ?? false;
                    $attribute->filter_type = $metadata['filter_type'] ?? null;
                    $attribute->searchable = $metadata['searchable'] ?? false;
                    $attribute->display_order = $metadata['display_order'] ?? 0;
                    $attribute->default_value = $metadata['default_value'] ?? null;
                    $attribute->placeholder = $metadata['placeholder'] ?? null;
                    $attribute->field_options = $metadata['field_options'] ?? null;
                    $attribute->validation_rules = $metadata['validation_rules'] ?? null;
                }
            }
            
            // Process icon field - unserialize if it's serialized
            if (!empty($attribute->icon)) {
                $icon_data = maybe_unserialize($attribute->icon);
                if (is_array($icon_data)) {
                    // Resolve image URLs for image type icons
                    if ($icon_data['type'] === 'image' && !empty($icon_data['value'])) {
                        $value = $icon_data['value'];
                        $image_url = '';
                        
                        if (is_numeric($value)) {
                            $maybe_url = wp_get_attachment_image_url((int) $value, 'large');
                            if (!empty($maybe_url)) {
                                $image_url = $maybe_url;
                            }
                        } elseif (is_string($value) && filter_var($value, FILTER_VALIDATE_URL)) {
                            $image_url = $value;
                        }
                        
                        $icon_data['value'] = $image_url;
                    }
                    $attribute->icon = $icon_data;
                } else {
                    // Handle legacy string format
                    $attribute->icon = [
                        'type' => 'icon',
                        'value' => $attribute->icon
                    ];
                }
            } else {
                $attribute->icon = null;
            }
            
            return $this->success_response($attribute);
            
        } catch (\Exception $e) {
            return $this->error_response('Failed to retrieve attribute: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update attribute
     */
    public function update_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $data = $this->prepare_item_for_database($request);
            
            $result = $this->attributeService->updateAttribute($id, $data);
            
            if ($result) {
                $attribute = $this->attributeService->getById($id);
                
                // Parse metadata JSON and extract attribute properties
                if (!empty($attribute->metadata)) {
                    $metadata = json_decode($attribute->metadata, true);
                    if (is_array($metadata)) {
                        // Add metadata fields as properties to the attribute object
                        $attribute->field_type = $metadata['field_type'] ?? null;
                        $attribute->required = $metadata['required'] ?? false;
                        $attribute->show_on_frontend = $metadata['show_on_frontend'] ?? false;
                        $attribute->show_in_filters = $metadata['show_in_filters'] ?? false;
                        $attribute->filter_type = $metadata['filter_type'] ?? null;
                        $attribute->searchable = $metadata['searchable'] ?? false;
                        $attribute->display_order = $metadata['display_order'] ?? 0;
                        $attribute->default_value = $metadata['default_value'] ?? null;
                        $attribute->placeholder = $metadata['placeholder'] ?? null;
                        $attribute->field_options = $metadata['field_options'] ?? null;
                        $attribute->validation_rules = $metadata['validation_rules'] ?? null;
                    }
                }
                
                return $this->success_response($attribute);
            }
            
            return $this->error_response('Failed to update attribute', 500);
            
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 400);
        }
    }

    /**
     * Delete attribute
     */
    public function delete_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            
            $result = $this->attributeService->deleteAttribute($id);
            
            if ($result) {
                return $this->success_response(['deleted' => true]);
            }
            
            return $this->error_response('Failed to delete attribute', 500);
            
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 400);
        }
    }

    /**
     * Get attribute values
     */
    public function get_attribute_values(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            
            $values = $this->attributeService->getAttributeValues($id);
            
            return $this->success_response($values);
            
        } catch (\Exception $e) {
            return $this->error_response('Failed to retrieve attribute values: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update display orders
     */
    public function update_orders(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $orders = $request->get_param('orders');
            
            $result = $this->attributeService->updateDisplayOrders($orders);
            
            if ($result) {
                return $this->success_response(['updated' => true]);
            }
            
            return $this->error_response('Failed to update display orders', 500);
            
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 400);
        }
    }

    /**
     * Update display orders
     */
    public function update_display_orders(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $orders = $request->get_param('orders');
            
            $result = $this->attributeService->updateDisplayOrders($orders);
            
            if ($result) {
                return $this->success_response(['message' => 'Display orders updated successfully']);
            }
            
            return $this->error_response('Failed to update display orders', 500);
            
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 400);
        }
    }

    /**
     * Check if slug exists and suggest unique slug if needed
     */
    public function check_slug(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $slug = sanitize_title($request->get_param('slug'));
            $excludeId = $request->get_param('exclude_id');
            
            if (empty($slug)) {
                return $this->error_response('Slug is required', 400);
            }
            
            // Check if slug exists (excluding current attribute if editing)
            $exists = $this->attributeService->slugExists($slug, $excludeId);
            
            if (!$exists) {
                return $this->success_response([
                    'exists' => false,
                    'suggested_slug' => $slug
                ]);
            }
            
            // Generate unique slug
            $originalSlug = $slug;
            $counter = 1;
            
            while ($this->attributeService->slugExists($slug, $excludeId)) {
                $slug = $originalSlug . '-' . $counter;
                $counter++;
                
                // Prevent infinite loop
                if ($counter > 100) {
                    break;
                }
            }
            
            return $this->success_response([
                'exists' => true,
                'suggested_slug' => $slug
            ]);
            
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 400);
        }
    }

    /**
     * Get trip attributes
     */
    public function get_trip_attributes(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $tripId = (int) $request->get_param('trip_id');
            
            $attributes = $this->attributeService->getTripAttributes($tripId);
            
            return $this->success_response($attributes);
            
        } catch (\Exception $e) {
            return $this->error_response('Failed to retrieve trip attributes: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Set trip attribute
     */
    public function set_trip_attribute(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $tripId = (int) $request->get_param('trip_id');
            $attributeId = (int) $request->get_param('attribute_id');
            $value = $request->get_param('value');
            
            $result = $this->attributeService->setTripAttribute($tripId, $attributeId, $value);
            
            if ($result) {
                return $this->success_response(['set' => true]);
            }
            
            return $this->error_response('Failed to set trip attribute', 500);
            
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 400);
        }
    }

    /**
     * Remove trip attribute
     */
    public function remove_trip_attribute(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $tripId = (int) $request->get_param('trip_id');
            $attributeId = (int) $request->get_param('attribute_id');
            
            $result = $this->attributeService->removeTripAttribute($tripId, $attributeId);
            
            if ($result) {
                return $this->success_response(['removed' => true]);
            }
            
            return $this->error_response('Failed to remove trip attribute', 500);
            
        } catch (\Exception $e) {
            return $this->error_response('Failed to remove trip attribute: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Prepare item for database
     */
    private function prepare_item_for_database(WP_REST_Request $request): array
    {
        $data = [];
        
        // Basic fields
        if ($request->has_param('name')) {
            $data['name'] = sanitize_text_field($request->get_param('name'));
        }
        
        if ($request->has_param('slug')) {
            $data['slug'] = sanitize_title($request->get_param('slug'));
        }
        
        if ($request->has_param('description')) {
            $data['description'] = wp_kses_post($request->get_param('description'));
        }
        
        // Handle icon field
        if ($request->has_param('icon')) {
            $icon = $request->get_param('icon');
            if (is_array($icon)) {
                // Sanitize icon array
                $data['icon'] = [
                    'type' => isset($icon['type']) && in_array($icon['type'], ['icon', 'image'], true)
                        ? $icon['type']
                        : 'icon',
                    'value' => isset($icon['value']) 
                        ? sanitize_text_field($icon['value'])
                        : '',
                ];
            } elseif (is_string($icon)) {
                // Handle legacy string format
                $data['icon'] = sanitize_text_field($icon);
            }
        }
        
        if ($request->has_param('field_type')) {
            $data['field_type'] = sanitize_text_field($request->get_param('field_type'));
        }
        
        if ($request->has_param('field_options')) {
            $options = $request->get_param('field_options');
            if (is_array($options)) {
                $data['field_options'] = $options;
            }
        }
        
        if ($request->has_param('default_value')) {
            $data['default_value'] = sanitize_text_field($request->get_param('default_value'));
        }
        
        if ($request->has_param('placeholder')) {
            $data['placeholder'] = sanitize_text_field($request->get_param('placeholder'));
        }
        
        if ($request->has_param('required')) {
            $data['required'] = (bool) $request->get_param('required');
        }
        
        if ($request->has_param('validation_rules')) {
            $rules = $request->get_param('validation_rules');
            if (is_array($rules)) {
                $data['validation_rules'] = $rules;
            }
        }
        
        if ($request->has_param('display_order')) {
            $data['display_order'] = (int) $request->get_param('display_order');
        }
        
        if ($request->has_param('show_on_frontend')) {
            $data['show_on_frontend'] = (bool) $request->get_param('show_on_frontend');
        }
        
        if ($request->has_param('show_in_filters')) {
            $data['show_in_filters'] = (bool) $request->get_param('show_in_filters');
        }
        
        if ($request->has_param('filter_type')) {
            $data['filter_type'] = sanitize_text_field($request->get_param('filter_type'));
        }
        
        if ($request->has_param('searchable')) {
            $data['searchable'] = (bool) $request->get_param('searchable');
        }
        
        if ($request->has_param('status')) {
            $data['status'] = sanitize_text_field($request->get_param('status'));
        }
        
        return $data;
    }

    /**
     * Check permissions for read operations
     */
    public function get_permissions_check(): bool
    {
        return current_user_can('manage_options');
    }

    /**
     * Check permissions for create/update/delete operations
     */
    public function check_permission(?WP_REST_Request $request = null): bool
    {
        $hasPermission = current_user_can('manage_options');
        
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra AttributeController: Permission check - ' . ($hasPermission ? 'GRANTED' : 'DENIED'));
        }
        
        return $hasPermission;
    }

    /**
     * Check permissions for search operations
     */
    public function search_permissions_check(): bool
    {
        return current_user_can('manage_options');
    }

    /**
     * Check permissions for update operations
     */
    public function update_permissions_check(): bool
    {
        return current_user_can('manage_options');
    }

    /**
     * Get item schema
     */
    public function get_item_schema(): array
    {
        return [
            '$schema' => 'http://json-schema.org/draft-04/schema#',
            'title' => 'attribute',
            'type' => 'object',
            'properties' => [
                'id' => [
                    'description' => 'Unique identifier for the attribute.',
                    'type' => 'integer',
                    'readonly' => true,
                ],
                'name' => [
                    'description' => 'Attribute name.',
                    'type' => 'string',
                    'required' => true,
                ],
                'slug' => [
                    'description' => 'URL-friendly identifier.',
                    'type' => 'string',
                ],
                'description' => [
                    'description' => 'Attribute description.',
                    'type' => 'string',
                ],
                'field_type' => [
                    'description' => 'Form field type.',
                    'type' => 'string',
                    'enum' => ['text_field', 'number', 'email', 'url', 'textarea', 'select', 'radio', 'checkbox', 'date', 'time', 'color'],
                    'default' => 'text_field',
                ],
                'field_options' => [
                    'description' => 'Options for select/radio/checkbox fields.',
                    'type' => 'array',
                ],
                'default_value' => [
                    'description' => 'Default value.',
                    'type' => 'string',
                ],
                'placeholder' => [
                    'description' => 'Field placeholder text.',
                    'type' => 'string',
                ],
                'required' => [
                    'description' => 'Whether attribute is required.',
                    'type' => 'boolean',
                    'default' => false,
                ],
                'validation_rules' => [
                    'description' => 'Validation rules.',
                    'type' => 'array',
                ],
                'display_order' => [
                    'description' => 'Display order.',
                    'type' => 'integer',
                    'default' => 0,
                ],
                'show_on_frontend' => [
                    'description' => 'Show on trip pages.',
                    'type' => 'boolean',
                    'default' => true,
                ],
                'show_in_filters' => [
                    'description' => 'Show in trip listing filters.',
                    'type' => 'boolean',
                    'default' => false,
                ],
                'filter_type' => [
                    'description' => 'How to filter this attribute.',
                    'type' => 'string',
                    'enum' => ['exact', 'partial', 'range', 'dropdown'],
                    'default' => 'exact',
                ],
                'searchable' => [
                    'description' => 'Include in search index.',
                    'type' => 'boolean',
                    'default' => false,
                ],
                'status' => [
                    'description' => 'Attribute status.',
                    'type' => 'string',
                    'enum' => ['publish', 'draft', 'trash'],
                    'default' => 'publish',
                ],
                'created_at' => [
                    'description' => 'Creation date.',
                    'type' => 'string',
                    'format' => 'date-time',
                    'readonly' => true,
                ],
                'updated_at' => [
                    'description' => 'Last updated date.',
                    'type' => 'string',
                    'format' => 'date-time',
                    'readonly' => true,
                ],
            ],
        ];
    }

    /**
     * Get attribute statistics
     * GET /attributes/stats
     */
    public function getStats(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $stats = $this->attributeService->getStatusCounts();
            return $this->success_response($stats);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }
}
