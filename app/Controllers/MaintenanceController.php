<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Core\Database;

/**
 * Maintenance Controller
 * Provides administrative maintenance actions.
 */
class MaintenanceController extends BaseController
{
    /**
     * Register routes
     */
    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        $base = 'maintenance';

        register_rest_route($namespace, '/' . $base . '/regenerate-tables', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'regenerate_tables'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);
    }

    /**
     * Permission check
     */
    public function check_permission(?WP_REST_Request $request = null): bool
    {
        if (!is_user_logged_in()) {
            return false;
        }

        // Require admin-level capability
        return current_user_can('manage_options') || current_user_can('yatra_edit_trips');
    }

    /**
     * Regenerate database tables
     */
    public function regenerate_tables(WP_REST_Request $request)
    {
        try {
            Database::createTables();
            return $this->success_response([
                'message' => __('Database tables regenerated successfully.', 'yatra'),
            ]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }
}

