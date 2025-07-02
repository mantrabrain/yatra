<?php
namespace Yatra\Api;

use Yatra\Admin\Settings;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Handles REST API endpoints for Yatra settings.
 */
class SettingsApi
{
    /**
     * Register the REST API route for settings.
     */
    public function register()
    {
        add_action('rest_api_init', function () {
            register_rest_route('yatra/v1', '/settings', [
                'methods' => 'POST',
                'callback' => [$this, 'handleRestSaveSettings'],
                'permission_callback' => [$this, 'checkPermissions'],
            ]);
        });
    }

    /**
     * Check if user has permission to access settings.
     *
     * @return bool|WP_Error
     */
    public function checkPermissions()
    {
        // Check if user is logged in
        if (!is_user_logged_in()) {
            return new \WP_Error(
                'rest_forbidden',
                __('You must be logged in to access this endpoint.', 'yatra'),
                ['status' => 401]
            );
        }

        // Check if user has administrator capabilities
        if (!current_user_can('manage_options')) {
            return new \WP_Error(
                'rest_forbidden',
                __('You do not have permission to access this endpoint.', 'yatra'),
                ['status' => 403]
            );
        }

        return true;
    }

    /**
     * Handle saving settings via REST API.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function handleRestSaveSettings($request)
    {
        // Log the request for debugging
        error_log('Yatra Settings API: Request received from user ID: ' . get_current_user_id());
        
        $params = $request->get_params();
        $active_tab = $params['active_tab'] ?? null;
        
        if (!$active_tab) {
            error_log('Yatra Settings API: No active tab specified');
            return new WP_REST_Response([
                'success' => false,
                'message' => 'No tab specified.',
                'errors' => ['active_tab' => 'No tab specified.']
            ], 400);
        }

        // Validate that the active tab exists in our config
        $settings = new Settings();
        $config = $settings->get_config();
        $valid_tabs = array_column($config, 'id');
        
        if (!in_array($active_tab, $valid_tabs)) {
            error_log('Yatra Settings API: Invalid tab specified: ' . $active_tab);
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Invalid tab specified.',
                'errors' => ['active_tab' => 'Invalid tab specified.']
            ], 400);
        }

        try {
            // Simulate POST for save logic
            $_POST = $params;
            $result = $settings->save($active_tab);
            
            if ($result && $result['success']) {
                error_log('Yatra Settings API: Settings saved successfully for tab: ' . $active_tab);
                return new WP_REST_Response([
                    'success' => true,
                    'message' => 'Settings saved successfully.',
                    'data' => $result
                ], 200);
            } else {
                error_log('Yatra Settings API: Failed to save settings for tab: ' . $active_tab);
                return new WP_REST_Response([
                    'success' => false,
                    'message' => 'Failed to save settings.',
                    'errors' => $result['errors'] ?? ['general' => 'Unknown error occurred.']
                ], 400);
            }
        } catch (\Exception $e) {
            error_log('Yatra Settings API: Exception occurred: ' . $e->getMessage());
            return new WP_REST_Response([
                'success' => false,
                'message' => 'An error occurred while saving settings.',
                'errors' => ['exception' => $e->getMessage()]
            ], 500);
        }
    }
} 