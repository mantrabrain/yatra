<?php
/**
 * License Controller for Yatra Free
 * Proxy controller that shows upgrade message or delegates to Pro
 */

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;

class LicenseController
{
    /**
     * Get license information
     * Shows upgrade message for free version
     */
    public function get_license(WP_REST_Request $request): WP_REST_Response
    {
        return new WP_REST_Response([
            'is_pro' => false,
            'upgrade_url' => 'https://wpyatra.com/pricing',
        ], 200);
    }

    /**
     * Activate license - not available in free version
     */
    public function activate_license(WP_REST_Request $request): WP_REST_Response
    {
        return new WP_REST_Response([
            'status' => 'error',
            'notice' => __('Yatra Pro is required to activate a license. Please upgrade to Pro.', 'yatra'),
        ], 400);
    }

    /**
     * Deactivate license - not available in free version
     */
    public function deactivate_license(WP_REST_Request $request): WP_REST_Response
    {
        return new WP_REST_Response([
            'status' => 'error',
            'notice' => __('Yatra Pro is required to manage licenses. Please upgrade to Pro.', 'yatra'),
        ], 400);
    }

    /**
     * Check license status - not available in free version
     */
    public function check_license(WP_REST_Request $request): WP_REST_Response
    {
        return new WP_REST_Response([
            'status' => 'error',
            'notice' => __('Yatra Pro is required to check license status. Please upgrade to Pro.', 'yatra'),
        ], 400);
    }

    /**
     * Register REST API routes
     */
    public function register_routes()
    {
        // Get license info
        register_rest_route('yatra/v1', '/license', [
            'methods' => 'GET',
            'callback' => [$this, 'get_license'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ]);

        // Activate license
        register_rest_route('yatra/v1', '/license/activate', [
            'methods' => 'POST',
            'callback' => [$this, 'activate_license'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
            'args' => [
                'license_key' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);

        // Deactivate license
        register_rest_route('yatra/v1', '/license/deactivate', [
            'methods' => 'POST',
            'callback' => [$this, 'deactivate_license'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ]);

        // Check license status
        register_rest_route('yatra/v1', '/license/check', [
            'methods' => 'POST',
            'callback' => [$this, 'check_license'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ]);
    }
}
