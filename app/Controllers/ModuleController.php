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

    public function toggle_module(WP_REST_Request $request)
    {
        $slug = sanitize_key($request->get_param('slug'));
        $enabled = filter_var($request->get_param('enabled'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

        if ($enabled === null) {
            return $this->error_response(__('Enabled flag is required.', 'yatra'), 400);
        }

        $modules = ModuleManager::getModules();
        $module_exists = false;
        $target_module = null;

        foreach ($modules as $module) {
            if ($module['slug'] === $slug) {
                $module_exists = true;
                $target_module = $module;
                break;
            }
        }

        if (!$module_exists || !$target_module) {
            return $this->error_response(__('Module not found.', 'yatra'), 404);
        }

        // Check if trying to enable a premium module without Pro
        if ($enabled && !empty($target_module['is_premium']) && !$target_module['is_available']) {
            return $this->error_response(
                sprintf(
                    __('%s is a premium module. Yatra Pro is required to enable this module.', 'yatra'),
                    $target_module['name']
                ),
                403
            );
        }

        // Check if trying to enable a module that requires Pro but Pro is not active
        if ($enabled && !empty($target_module['requires_pro'])) {
            $pro_active = apply_filters('yatra_is_pro_active', false);
            if (!$pro_active) {
                return $this->error_response(
                    sprintf(
                        __('%s requires Yatra Pro. Please install and activate Yatra Pro to enable this module.', 'yatra'),
                        $target_module['name']
                    ),
                    403
                );
            }
        }

        // Agency-tier gate: even with Pro active, the white-label/agency-only
        // modules need an Agency Yearly or Lifetime license.
        if ($enabled && !empty($target_module['requires_agency'])) {
            if (!apply_filters('yatra_is_agency_active', false)) {
                return $this->error_response(
                    sprintf(
                        __('%s is available on the Yatra Pro Agency plan only. Upgrade your license to enable it.', 'yatra'),
                        $target_module['name']
                    ),
                    403
                );
            }
        }

        $updated = ModuleManager::setModuleStatus($slug, (bool) $enabled);

        return $this->success_response([
            'data' => $updated,
        ]);
    }

    public function bulk_toggle(WP_REST_Request $request)
    {
        $items = $request->get_param('items');
        if (!is_array($items) || empty($items)) {
            return $this->error_response(__('No module changes supplied.', 'yatra'), 400);
        }

        $modules = ModuleManager::getModules();
        $module_map = [];
        foreach ($modules as $module) {
            $module_map[$module['slug']] = $module;
        }

        $sanitized = [];
        $blocked_modules = [];

        foreach ($items as $item) {
            if (empty($item['slug'])) {
                continue;
            }

            $slug = sanitize_key($item['slug']);
            $enabled = filter_var($item['enabled'] ?? false, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($enabled === null) {
                continue;
            }

            // Check if module exists
            if (!isset($module_map[$slug])) {
                continue;
            }

            $target_module = $module_map[$slug];

            // Check if trying to enable a premium module without Pro
            if ($enabled && !empty($target_module['is_premium']) && !$target_module['is_available']) {
                $blocked_modules[] = $target_module['name'];
                continue;
            }

            // Check if trying to enable a module that requires Pro but Pro is not active
            if ($enabled && !empty($target_module['requires_pro'])) {
                $pro_active = apply_filters('yatra_is_pro_active', false);
                if (!$pro_active) {
                    $blocked_modules[] = $target_module['name'];
                    continue;
                }
            }

            if ($enabled && !empty($target_module['requires_agency'])) {
                if (!apply_filters('yatra_is_agency_active', false)) {
                    $blocked_modules[] = $target_module['name'];
                    continue;
                }
            }

            $sanitized[] = [
                'slug' => $slug,
                'enabled' => (bool) $enabled,
            ];
        }

        if (empty($sanitized) && !empty($blocked_modules)) {
            return $this->error_response(
                sprintf(
                    __('The following modules require Yatra Pro: %s', 'yatra'),
                    implode(', ', $blocked_modules)
                ),
                403
            );
        }

        if (!empty($blocked_modules)) {
            // Partial success - some modules processed, some blocked
            $updated = ModuleManager::setMultipleStatuses($sanitized);
            
            return $this->success_response([
                'data' => $updated,
                'message' => sprintf(
                    __('Some modules were skipped because they require Yatra Pro: %s', 'yatra'),
                    implode(', ', $blocked_modules)
                ),
            ]);
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


