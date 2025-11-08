<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Base REST API Controller
 */
abstract class BaseController
{
    /**
     * Register REST API routes
     */
    abstract public function register_routes(): void;

    /**
     * Get items (GET /items)
     */
    public function get_items(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        return new WP_Error('not_implemented', 'Method not implemented', ['status' => 501]);
    }

    /**
     * Get single item (GET /items/{id})
     */
    public function get_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        return new WP_Error('not_implemented', 'Method not implemented', ['status' => 501]);
    }

    /**
     * Create item (POST /items)
     */
    public function create_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        return new WP_Error('not_implemented', 'Method not implemented', ['status' => 501]);
    }

    /**
     * Update item (PUT /items/{id})
     */
    public function update_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        return new WP_Error('not_implemented', 'Method not implemented', ['status' => 501]);
    }

    /**
     * Delete item (DELETE /items/{id})
     */
    public function delete_item(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        return new WP_Error('not_implemented', 'Method not implemented', ['status' => 501]);
    }

    /**
     * Check permissions
     */
    public function check_permission(): bool
    {
        return current_user_can('manage_options');
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
        $prepared = [];

        foreach ($items as $item) {
            $prepared[] = $this->prepare_item_for_response($item, $request);
        }

        return $prepared;
    }

    /**
     * Send success response
     */
    protected function success_response($data, int $status = 200): WP_REST_Response
    {
        return new WP_REST_Response($data, $status);
    }

    /**
     * Send error response
     */
    protected function error_response(string $message, int $status = 400, array $data = []): WP_Error
    {
        return new WP_Error('yatra_error', $message, array_merge(['status' => $status], $data));
    }
}

