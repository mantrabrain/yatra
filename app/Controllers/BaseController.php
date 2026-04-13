<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Exceptions\YatraException;
use Yatra\Exceptions\ValidationException;

/**
 * Base REST API Controller
 * 
 * Provides common functionality for all REST controllers including:
 * - Standard CRUD route registration
 * - Pagination arguments
 * - Response helpers
 * - Permission checking
 * 
 * @package Yatra\Controllers
 */
abstract class BaseController
{
    /**
     * API namespace
     */
    protected string $namespace = 'yatra/v1';

    /**
     * Resource base (e.g., 'trips', 'activities')
     * Override in child classes
     */
    protected string $rest_base = '';

    /**
     * Register REST API routes
     * Override in child classes or use registerCrudRoutes()
     */
    abstract public function register_routes(): void;

    /**
     * Register standard CRUD routes
     * 
     * Registers:
     * - GET    /{base}        - List items
     * - POST   /{base}        - Create item
     * - GET    /{base}/{id}   - Get single item
     * - PUT    /{base}/{id}   - Update item
     * - DELETE /{base}/{id}   - Delete item
     * 
     * @param array $additionalArgs Additional args for collection route
     * @param array $options Options: ['list', 'create', 'read', 'update', 'delete']
     */
    protected function registerCrudRoutes(array $additionalArgs = [], array $options = []): void
    {
        $base = $this->rest_base;
        
        if (empty($base)) {
            return;
        }

        // Default options - all CRUD operations enabled
        $defaults = [
            'list' => true,
            'create' => true,
            'read' => true,
            'update' => true,
            'delete' => true,
        ];
        $options = array_merge($defaults, $options);

        // Collection routes
        $collectionRoutes = [];

        if ($options['list']) {
            $collectionRoutes[] = [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'check_permission'],
                'args' => array_merge($this->getPaginationArgs(), $additionalArgs),
            ];
        }

        if ($options['create']) {
            $collectionRoutes[] = [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => [$this, 'check_permission'],
            ];
        }

        if (!empty($collectionRoutes)) {
            register_rest_route($this->namespace, '/' . $base, $collectionRoutes);
        }

        // Single item routes
        $itemRoutes = [];

        if ($options['read']) {
            $itemRoutes[] = [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'check_permission'],
            ];
        }

        if ($options['update']) {
            $itemRoutes[] = [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_item'],
                'permission_callback' => [$this, 'check_permission'],
            ];
        }

        if ($options['delete']) {
            $itemRoutes[] = [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_item'],
                'permission_callback' => [$this, 'check_permission'],
            ];
        }

        if (!empty($itemRoutes)) {
            register_rest_route($this->namespace, '/' . $base . '/(?P<id>[\d]+)', $itemRoutes);
        }
    }

    /**
     * Register a custom route
     * 
     * @param string $route Route path (appended to namespace)
     * @param array  $args  Route arguments
     */
    protected function registerRoute(string $route, array $args): void
    {
        register_rest_route($this->namespace, $route, $args);
    }

    /**
     * Get standard pagination arguments
     */
    protected function getPaginationArgs(): array
    {
        return [
            'page' => [
                'default' => 1,
                'sanitize_callback' => 'absint',
                'validate_callback' => function($value) {
                    return is_numeric($value) && $value > 0;
                },
            ],
            'per_page' => [
                'default' => 10,
                'sanitize_callback' => 'absint',
                'validate_callback' => function($value) {
                    // Allow up to 1000 for bulk operations like dropdowns
                    return is_numeric($value) && $value > 0 && $value <= 1000;
                },
            ],
            'orderby' => [
                'default' => 'id',
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'order' => [
                'default' => 'DESC',
                'sanitize_callback' => function($value) {
                    return strtoupper($value) === 'ASC' ? 'ASC' : 'DESC';
                },
            ],
            'search' => [
                'default' => '',
                'sanitize_callback' => 'sanitize_text_field',
            ],
        ];
    }

    /**
     * Get status filter argument
     */
    protected function getStatusArg(string $default = 'all'): array
    {
        return [
            'status' => [
                'default' => $default,
                'sanitize_callback' => 'sanitize_text_field',
            ],
        ];
    }

    /**
     * Extract pagination params from request
     */
    protected function getPaginationParams(WP_REST_Request $request): array
    {
        return [
            'page' => (int) $request->get_param('page') ?: 1,
            'per_page' => (int) $request->get_param('per_page') ?: 10,
            'orderby' => $request->get_param('orderby') ?: 'id',
            'order' => strtoupper($request->get_param('order') ?: 'DESC'),
            'search' => $request->get_param('search') ?: '',
        ];
    }

    /**
     * Get items (GET /items)
     */
    public function get_items(WP_REST_Request $request)
    {
        return new WP_Error('not_implemented', __('Method not implemented', 'yatra'), ['status' => 501]);
    }

    /**
     * Get single item (GET /items/{id})
     */
    public function get_item(WP_REST_Request $request)
    {
        return new WP_Error('not_implemented', __('Method not implemented', 'yatra'), ['status' => 501]);
    }

    /**
     * Create item (POST /items)
     */
    public function create_item(WP_REST_Request $request)
    {
        return new WP_Error('not_implemented', __('Method not implemented', 'yatra'), ['status' => 501]);
    }

    /**
     * Update item (PUT /items/{id})
     */
    public function update_item(WP_REST_Request $request)
    {
        return new WP_Error('not_implemented', __('Method not implemented', 'yatra'), ['status' => 501]);
    }

    /**
     * Delete item (DELETE /items/{id})
     */
    public function delete_item(WP_REST_Request $request)
    {
        return new WP_Error('not_implemented', __('Method not implemented', 'yatra'), ['status' => 501]);
    }

    /**
     * Check permissions
     * Override in child classes for specific capability checks
     */
    public function check_permission(?WP_REST_Request $request = null): bool
    {
        return current_user_can('manage_options');
    }

    /**
     * Check if user can view (read-only)
     */
    public function check_read_permission(?WP_REST_Request $request = null): bool
    {
        return current_user_can('manage_options');
    }

    /**
     * Public access (no auth required)
     */
    public function public_access(?WP_REST_Request $request = null): bool
    {
        return true;
    }

    /**
     * Public permission callback that bypasses WordPress cookie validation
     * 
     * This is needed for endpoints that should work without authentication,
     * especially for guest users. Using __return_true alone causes WordPress
     * to validate cookies when they're present, leading to "Cookie check failed" errors.
     * 
     * This method explicitly tells WordPress to skip cookie validation.
     */
    public function public_permission_callback(?WP_REST_Request $request = null): bool
    {
        // Remove cookie validation requirement for this endpoint
        // This allows guest users to access the endpoint without nonce validation
        remove_filter('rest_authentication_errors', 'rest_cookie_check_errors', 100);
        return true;
    }

    /**
     * Prepare item for response
     */
    protected function prepare_item_for_response($item, WP_REST_Request $request): array
    {
        return (array) $item;
    }

    /**
     * Prepare collection for response
     */
    protected function prepare_collection_for_response(array $items, WP_REST_Request $request): array
    {
        return array_map(fn($item) => $this->prepare_item_for_response($item, $request), $items);
    }

    /**
     * Send success response
     */
    protected function success_response($data, int $status = 200): WP_REST_Response
    {
        return new WP_REST_Response($data, $status);
    }

    /**
     * Send paginated response
     */
    protected function paginated_response(array $items, int $total, int $page, int $perPage): WP_REST_Response
    {
        $response = new WP_REST_Response([
            'data' => $items,
            'total' => $total,
            'pages' => (int) ceil($total / $perPage),
            'page' => $page,
            'per_page' => $perPage,
        ], 200);

        // Add pagination headers
        $response->header('X-WP-Total', $total);
        $response->header('X-WP-TotalPages', (int) ceil($total / $perPage));

        return $response;
    }

    /**
     * Send error response
     */
    protected function error_response(string $message, int $status = 400, array $data = []): WP_Error
    {
        return new WP_Error('yatra_error', $message, array_merge(['status' => $status], $data));
    }

    /**
     * Handle Yatra exceptions and convert to appropriate WP_Error
     */
    protected function handle_exception(\Exception $e): WP_Error
    {
        if ($e instanceof ValidationException) {
            return new WP_Error(
                $e->getErrorCode(),
                $e->getMessage(),
                [
                    'status' => $e->getCode(),
                    'validation_errors' => $e->getErrors(),
                    'context' => $e->getContext()
                ]
            );
        }

        if ($e instanceof YatraException) {
            return new WP_Error(
                $e->getErrorCode(),
                $e->getMessage(),
                [
                    'status' => $e->getCode(),
                    'context' => $e->getContext()
                ]
            );
        }

        // Generic exception handling
        $status = method_exists($e, 'getCode') && $e->getCode() > 0 ? $e->getCode() : 500;
        return new WP_Error('server_error', $e->getMessage(), ['status' => $status]);
    }

    /**
     * Send not found response
     */
    protected function not_found(string $message = ''): WP_Error
    {
        return $this->error_response($message ?: __('Resource not found', 'yatra'), 404);
    }

    /**
     * Send validation error response
     */
    protected function validation_error(string $message, array $errors = []): WP_Error
    {
        return $this->error_response($message, 422, ['errors' => $errors]);
    }

    /**
     * Convert attachment ID to URL in icon field
     *
     * @return mixed
     */
    protected function convert_icon_attachment_id_to_url($icon)
    {
        if (empty($icon)) {
            return $icon;
        }

        if (is_string($icon)) {
            return $icon;
        }

        if (is_array($icon) && isset($icon['type'], $icon['value'])) {
            if ($icon['type'] === 'image' && is_numeric($icon['value'])) {
                $url = wp_get_attachment_image_url((int) $icon['value'], 'full');
                if ($url) {
                    $icon['value'] = $url;
                }
            }
        }

        return $icon;
    }

    /**
     * Get ID from request
     */
    protected function getId(WP_REST_Request $request): int
    {
        return (int) $request->get_param('id');
    }

    /**
     * Get JSON body from request
     */
    protected function getBody(WP_REST_Request $request): array
    {
        return $request->get_json_params() ?: [];
    }
}
