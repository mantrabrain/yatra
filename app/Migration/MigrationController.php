<?php
/**
 * Migration Controller - REST API endpoints for migration
 * 
 * @package Yatra\Migration
 * @since 3.0.0
 */

namespace Yatra\Migration;

use WP_REST_Request;
use WP_REST_Response;
use Yatra\Migration\MigrationProgress;

class MigrationController
{
    private $service;
    
    public function __construct()
    {
        $this->service = new MigrationProgress();
    }

    /**
     * Clear migration data (progress/logs)
     */
    public function clear(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $result = $this->service->clearMigrationData();

            return new WP_REST_Response($result, 200);

        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Register REST API routes
     */
    public function registerRoutes(): void
    {
        register_rest_route('yatra/v1', '/migration/status', [
            'methods' => 'GET',
            'callback' => [$this, 'getStatus'],
            'permission_callback' => [$this, 'checkPermission'],
        ]);
        
        register_rest_route('yatra/v1', '/migration/migrate', [
            'methods' => 'POST',
            'callback' => [$this, 'migrate'],
            'permission_callback' => [$this, 'checkPermission'],
            'args' => [
                'data_type' => [
                    'required' => true,
                    'type' => 'string',
                ],
                'force' => [
                    'type' => 'boolean',
                    'default' => false,
                ],
            ],
        ]);
        
        register_rest_route('yatra/v1', '/migration/migrate-all', [
            'methods' => 'POST',
            'callback' => [$this, 'migrateAll'],
            'permission_callback' => [$this, 'checkPermission'],
            'args' => [
                'force' => [
                    'type' => 'boolean',
                    'default' => false,
                ],
            ],
        ]);
        
        register_rest_route('yatra/v1', '/migration/progress', [
            'methods' => 'GET',
            'callback' => [$this, 'getProgress'],
            'permission_callback' => [$this, 'checkPermission'],
        ]);
        
        register_rest_route('yatra/v1', '/migration/cancel', [
            'methods' => 'POST',
            'callback' => [$this, 'cancel'],
            'permission_callback' => [$this, 'checkPermission'],
        ]);

        register_rest_route('yatra/v1', '/migration/clear', [
            'methods' => 'POST',
            'callback' => [$this, 'clear'],
            'permission_callback' => [$this, 'checkPermission'],
        ]);
    }
    
    /**
     * Get migration status
     */
    public function getStatus(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $status = $this->service->getStatus();
            
            return new WP_REST_Response($status, 200);
            
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Migrate specific data type
     */
    public function migrate(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $dataType = $request->get_param('data_type');
            $force = (bool) $request->get_param('force');
            
            $result = $this->service->migrate($dataType, $force);
            
            return new WP_REST_Response($result, 200);
            
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Migrate all data types
     */
    public function migrateAll(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $force = (bool) $request->get_param('force');
            $results = $this->service->migrateAll($force);
            
            // Return results directly - service already returns proper structure
            return new WP_REST_Response($results, 200);
            
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Get migration progress
     */
    public function getProgress(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $progress = $this->service->getMigrationProgress();
            
            return new WP_REST_Response($progress, 200);
            
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Cancel migration
     */
    public function cancel(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $result = $this->service->cancelMigration();
            
            return new WP_REST_Response($result, 200);
            
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Check if user has permission
     */
    public function checkPermission(): bool
    {
        return current_user_can('manage_options');
    }
}
