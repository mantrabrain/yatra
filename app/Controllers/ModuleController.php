<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Core\Modules\ModuleManager;

class ModuleController extends BaseController
{
    public function register_routes(): void
    {
        $namespace = 'yatra/v1';

        register_rest_route($namespace, '/modules', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_modules'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        register_rest_route($namespace, '/modules/(?P<slug>[a-z0-9_\-]+)/toggle', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'toggle_module'],
                'permission_callback' => [$this, 'check_permission'],
                'args' => [
                    'slug' => [
                        'required' => true,
                        'sanitize_callback' => 'sanitize_key',
                    ],
                    'enabled' => [
                        'required' => true,
                        'validate_callback' => function ($value) {
                            return is_bool($value) || $value === 'true' || $value === 'false' || $value === 1 || $value === 0;
                        },
                    ],
                ],
            ],
        ]);

        register_rest_route($namespace, '/modules/bulk-toggle', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'bulk_toggle'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);
    }

    public function check_permission(?WP_REST_Request $request = null): bool
    {
        if (!is_user_logged_in()) {
            return false;
        }

        if (current_user_can('manage_options')) {
            return true;
        }

        return current_user_can('yatra_edit_trips');
    }

    public function get_modules(): WP_REST_Response
    {
        return $this->success_response([
            'data' => ModuleManager::getModules(),
        ]);
    }

    public function toggle_module(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $slug = sanitize_key($request->get_param('slug'));
        $enabled = filter_var($request->get_param('enabled'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

        if ($enabled === null) {
            return $this->error_response(__('Enabled flag is required.', 'yatra'), 400);
        }

        $modules = ModuleManager::getModules();
        $exists = array_filter($modules, static fn ($module) => $module['slug'] === $slug);

        if (empty($exists)) {
            return $this->error_response(__('Module not found.', 'yatra'), 404);
        }

        $updated = ModuleManager::setModuleStatus($slug, (bool) $enabled);

        return $this->success_response([
            'data' => $updated,
        ]);
    }

    public function bulk_toggle(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $items = $request->get_param('items');
        if (!is_array($items) || empty($items)) {
            return $this->error_response(__('No module changes supplied.', 'yatra'), 400);
        }

        $sanitized = [];
        foreach ($items as $item) {
            if (empty($item['slug'])) {
                continue;
            }

            $enabled = filter_var($item['enabled'] ?? false, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($enabled === null) {
                continue;
            }

            $sanitized[] = [
                'slug' => sanitize_key($item['slug']),
                'enabled' => (bool) $enabled,
            ];
        }

        if (empty($sanitized)) {
            return $this->error_response(__('No valid module changes supplied.', 'yatra'), 400);
        }

        $updated = ModuleManager::setMultipleStatuses($sanitized);

        return $this->success_response([
            'data' => $updated,
        ]);
    }
}


