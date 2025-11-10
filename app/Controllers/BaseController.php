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
     * Override in child classes for specific capability checks
     */
    public function check_permission(?WP_REST_Request $request = null): bool
    {
        // Default: require manage_options capability
        // Child classes should override this for specific capabilities
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

    /**
     * Convert attachment ID to URL in icon field
     * Handles IconPickerValue format: { type: 'icon'|'image', value: string }
     * For images, converts attachment ID to URL
     */
    protected function convert_icon_attachment_id_to_url($icon): mixed
    {
        if (empty($icon)) {
            return $icon;
        }

        // If it's a string (old format), return as is
        if (is_string($icon)) {
            return $icon;
        }

        // If it's an array/object with type and value
        if (is_array($icon) && isset($icon['type']) && isset($icon['value'])) {
            // If it's an image type and value is numeric (attachment ID), convert to URL
            if ($icon['type'] === 'image' && is_numeric($icon['value'])) {
                $attachment_id = (int) $icon['value'];
                $image_url = wp_get_attachment_image_url($attachment_id, 'full');
                if ($image_url) {
                    $icon['value'] = $image_url;
                }
            }
            // If it's already a URL (backward compatibility), keep it
            elseif ($icon['type'] === 'image' && (strpos($icon['value'], 'http://') === 0 || strpos($icon['value'], 'https://') === 0)) {
                // Already a URL, keep it
            }
        }

        return $icon;
    }
}

