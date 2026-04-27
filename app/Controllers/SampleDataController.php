<?php

namespace Yatra\Controllers;

use Yatra\Services\SampleDataService;
use Yatra\WordPress\API;

/**
 * Sample Data Controller
 * 
 * Handles importing sample data for Yatra plugin
 */
class SampleDataController
{
    /**
     * Constructor
     */
    public function __construct()
    {
        add_action('admin_init', [$this, 'handle_import_actions']);
        add_action('admin_notices', [$this, 'show_admin_notices']);
    }

    /**
     * Register REST API routes
     */
    public function register_routes()
    {
        register_rest_route('yatra/v1', '/sample-data/import', [
            [
                'methods' => 'POST',
                'callback' => [$this, 'import_sample_data'],
                'permission_callback' => [$this, 'check_permissions'],
                'args' => [
                    'data_types' => [
                        'type' => 'array',
                        'items' => [
                            'type' => 'string',
                            'enum' => ['trips', 'categories', 'destinations', 'bookings', 'pages']
                        ]
                    ],
                    'overwrite' => [
                        'type' => 'boolean',
                        'default' => false
                    ]
                ]
            ]
        ]);

        register_rest_route('yatra/v1', '/sample-data/status', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'get_import_status'],
                'permission_callback' => [$this, 'check_permissions']
            ]
        ]);

        register_rest_route('yatra/v1', '/sample-data/cleanup', [
            [
                'methods' => 'DELETE',
                'callback' => [$this, 'cleanup_sample_data'],
                'permission_callback' => [$this, 'check_permissions']
            ]
        ]);
    }

    /**
     * Check user permissions
     */
    public function check_permissions()
    {
        return current_user_can('manage_options');
    }

    /**
     * Handle import actions from admin forms
     */
    public function handle_import_actions()
    {
        if (isset($_POST['yatra_import_sample_data']) && 
            isset($_POST['_wpnonce']) && 
            wp_verify_nonce($_POST['_wpnonce'], 'yatra_import_sample_data')) {
            
            $data_types = isset($_POST['data_types']) ? (array) $_POST['data_types'] : [];
            $overwrite = isset($_POST['overwrite']) && $_POST['overwrite'] === '1';
            
            $result = $this->perform_import($data_types, $overwrite);
            
            if ($result['success']) {
                wp_redirect(add_query_arg(['yatra_notice' => 'import_success'], wp_get_referer()));
                exit;
            } else {
                wp_redirect(add_query_arg(['yatra_notice' => 'import_error', 'message' => urlencode($result['message'])], wp_get_referer()));
                exit;
            }
        }

        if (isset($_POST['yatra_cleanup_sample_data']) && 
            isset($_POST['_wpnonce']) && 
            wp_verify_nonce($_POST['_wpnonce'], 'yatra_cleanup_sample_data')) {
            
            $result = $this->perform_cleanup();
            
            if ($result['success']) {
                wp_redirect(add_query_arg(['yatra_notice' => 'cleanup_success'], wp_get_referer()));
                exit;
            } else {
                wp_redirect(add_query_arg(['yatra_notice' => 'cleanup_error', 'message' => urlencode($result['message'])], wp_get_referer()));
                exit;
            }
        }
    }

    /**
     * Import sample data via REST API
     */
    public function import_sample_data($request)
    {
        $data_types = $request->get_param('data_types');
        $overwrite = $request->get_param('overwrite');

        $result = $this->perform_import($data_types, $overwrite);
        
        if ($result['success']) {
            return new \WP_REST_Response([
                'success' => true,
                'message' => $result['message'],
                'data' => $result['data']
            ], 200);
        } else {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $result['message']
            ], 400);
        }
    }

    /**
     * Get import status
     */
    public function get_import_status()
    {
        $service = new SampleDataService();
        $status = $service->get_import_status();
        
        return new \WP_REST_Response($status, 200);
    }

    /**
     * Cleanup sample data via REST API
     */
    public function cleanup_sample_data($request)
    {
        $result = $this->perform_cleanup();
        
        if ($result['success']) {
            return new \WP_REST_Response([
                'success' => true,
                'message' => $result['message']
            ], 200);
        } else {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $result['message']
            ], 400);
        }
    }

    /**
     * Perform the actual import
     */
    private function perform_import($data_types = [], $overwrite = false)
    {
        $service = new SampleDataService();
        
        try {
            // Import all sample data from JSON files
            $result = $service->import_sample_data();
            
            if ($result['success']) {
                // Store import status
                update_option('yatra_sample_data_imported', true);
                update_option('yatra_sample_data_import_date', current_time('mysql'));
                
                return [
                    'success' => true,
                    'message' => $result['message'],
                    'data' => $result['data']
                ];
            } else {
                return [
                    'success' => false,
                    'message' => $result['message'] ?? __('Import failed.', 'yatra')
                ];
            }
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => __('An error occurred during import. Please check the error logs.', 'yatra')
            ];
        }
    }

    /**
     * Perform cleanup of sample data
     */
    private function perform_cleanup()
    {
        $service = new SampleDataService();
        
        try {
            $result = $service->cleanup_sample_data();
            
            if ($result['success']) {
                // Clear import status
                delete_option('yatra_sample_data_imported');
                delete_option('yatra_sample_data_import_date');
                delete_option('yatra_sample_data_types');
                
                return [
                    'success' => true,
                    'message' => __('Sample data cleaned up successfully!', 'yatra')
                ];
            } else {
                return [
                    'success' => false,
                    'message' => $result['message'] ?? __('Cleanup failed.', 'yatra')
                ];
            }
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => __('An error occurred during cleanup. Please check the error logs.', 'yatra')
            ];
        }
    }

    /**
     * Show admin notices
     */
    public function show_admin_notices()
    {
        if (isset($_GET['yatra_notice'])) {
            $notice = sanitize_key($_GET['yatra_notice']);
            $message = '';
            
            switch ($notice) {
                case 'import_success':
                    $message = __('Sample data imported successfully!', 'yatra');
                    $class = 'notice-success';
                    break;
                    
                case 'import_error':
                    $message = isset($_GET['message']) ? 
                        urldecode(sanitize_text_field($_GET['message'])) : 
                        __('Import failed. Please try again.', 'yatra');
                    $class = 'notice-error';
                    break;
                    
                case 'cleanup_success':
                    $message = __('Sample data cleaned up successfully!', 'yatra');
                    $class = 'notice-success';
                    break;
                    
                case 'cleanup_error':
                    $message = isset($_GET['message']) ? 
                        urldecode(sanitize_text_field($_GET['message'])) : 
                        __('Cleanup failed. Please try again.', 'yatra');
                    $class = 'notice-error';
                    break;
                    
                default:
                    return;
            }
            
            printf(
                '<div class="notice %s is-dismissible"><p>%s</p></div>',
                esc_attr($class),
                esc_html($message)
            );
        }
    }

    /**
     * Check if sample data is imported
     */
    public static function is_sample_data_imported()
    {
        return get_option('yatra_sample_data_imported', false);
    }

    /**
     * Get imported data types
     */
    public static function get_imported_data_types()
    {
        return get_option('yatra_sample_data_types', []);
    }

    /**
     * Get import date
     */
    public static function get_import_date()
    {
        return get_option('yatra_sample_data_import_date', '');
    }
}
