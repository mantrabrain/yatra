<?php
/**
 * API keys (3.3): Settings → API Access.
 *
 * Keys are WordPress application passwords (core's own, hashed, revocable),
 * named "Yatra: …" so this screen lists only the ones made here. A key acts
 * as the user it belongs to, with that user's permissions — so the screen
 * lets you make a key for a dedicated user (e.g. one with a Yatra staff
 * role) rather than for an administrator. Nothing new is invented for
 * authentication: requests use HTTP Basic auth exactly as WordPress
 * documents for application passwords.
 *
 * @package Yatra\Controllers
 * @since 3.3.0
 */

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;

class ApiKeysController extends BaseController
{
    public const PREFIX = 'Yatra: ';

    public function register_routes(): void
    {
        register_rest_route('yatra/v1', '/api-keys', [
            ['methods' => 'GET', 'callback' => [$this, 'index'], 'permission_callback' => [$this, 'canManage']],
            ['methods' => 'POST', 'callback' => [$this, 'create'], 'permission_callback' => [$this, 'canManage']],
        ]);
        register_rest_route('yatra/v1', '/api-keys/(?P<user>\d+)/(?P<uuid>[a-f0-9\-]{36})', [
            ['methods' => 'DELETE', 'callback' => [$this, 'revoke'], 'permission_callback' => [$this, 'canManage']],
        ]);
    }

    public function canManage(): bool
    {
        return current_user_can('manage_options');
    }

    private static function available(): bool
    {
        return class_exists('\\WP_Application_Passwords') && function_exists('wp_is_application_passwords_available') && wp_is_application_passwords_available();
    }

    public function index(WP_REST_Request $request): WP_REST_Response
    {
        $keys = [];
        if (class_exists('\\WP_Application_Passwords')) {
            $users = get_users(['meta_key' => \WP_Application_Passwords::USERMETA_KEY_APPLICATION_PASSWORDS, 'fields' => ['ID', 'user_login', 'display_name'], 'number' => 200]);
            foreach ($users as $user) {
                foreach ((array) \WP_Application_Passwords::get_user_application_passwords((int) $user->ID) as $item) {
                    $name = (string) ($item['name'] ?? '');
                    if (strpos($name, self::PREFIX) !== 0) {
                        continue;
                    }
                    $keys[] = [
                        'uuid' => (string) $item['uuid'],
                        'name' => substr($name, strlen(self::PREFIX)),
                        'user_id' => (int) $user->ID,
                        'user' => (string) $user->user_login,
                        'created' => !empty($item['created']) ? gmdate('c', (int) $item['created']) : null,
                        'last_used' => !empty($item['last_used']) ? gmdate('c', (int) $item['last_used']) : null,
                    ];
                }
            }
        }
        $candidates = [];
        foreach (get_users(['fields' => ['ID', 'user_login', 'display_name'], 'number' => 200, 'capability__in' => ['yatra_view_bookings', 'yatra_view_trips', 'manage_options']]) as $u) {
            if (current_user_can('edit_user', (int) $u->ID)) {
                $candidates[] = ['id' => (int) $u->ID, 'login' => (string) $u->user_login, 'name' => (string) $u->display_name, 'is_admin' => user_can((int) $u->ID, 'manage_options')];
            }
        }

        return new WP_REST_Response([
            'success' => true,
            'available' => self::available(),
            'https' => is_ssl() || wp_is_using_https(),
            'rest_base' => esc_url_raw(rest_url('yatra/v1/')),
            'keys' => $keys,
            'users' => $candidates,
        ], 200);
    }

    public function create(WP_REST_Request $request): WP_REST_Response
    {
        if (!self::available()) {
            return new WP_REST_Response(['success' => false, 'message' => __('WordPress application passwords are turned off on this site (they need HTTPS).', 'yatra')], 400);
        }
        $name = trim(sanitize_text_field((string) $request->get_param('name')));
        if ($name === '') {
            return new WP_REST_Response(['success' => false, 'message' => __('Give the key a name, e.g. the app that will use it.', 'yatra')], 400);
        }
        $userId = (int) ($request->get_param('user_id') ?: get_current_user_id());
        $user = get_userdata($userId);
        if (!$user || !current_user_can('edit_user', $userId)) {
            return new WP_REST_Response(['success' => false, 'message' => __('You can\'t make a key for that user.', 'yatra')], 403);
        }
        if (!wp_is_application_passwords_available_for_user($user)) {
            return new WP_REST_Response(['success' => false, 'message' => __('Application passwords are turned off for that user.', 'yatra')], 400);
        }
        $created = \WP_Application_Passwords::create_new_application_password($userId, ['name' => self::PREFIX . (function_exists('mb_substr') ? mb_substr($name, 0, 80) : substr($name, 0, 80))]);
        if (is_wp_error($created)) {
            return new WP_REST_Response(['success' => false, 'message' => $created->get_error_message()], 400);
        }
        [$password, $item] = $created;

        return new WP_REST_Response([
            'success' => true,
            // Shown once; WordPress stores only a hash.
            'key' => [
                'uuid' => (string) $item['uuid'],
                'name' => $name,
                'user' => (string) $user->user_login,
                'user_id' => $userId,
                'password' => \WP_Application_Passwords::chunk_password($password),
            ],
        ], 201);
    }

    public function revoke(WP_REST_Request $request): WP_REST_Response
    {
        $userId = (int) $request->get_param('user');
        $uuid = (string) $request->get_param('uuid');
        if (!current_user_can('edit_user', $userId) || !class_exists('\\WP_Application_Passwords')) {
            return new WP_REST_Response(['success' => false], 403);
        }
        $item = \WP_Application_Passwords::get_user_application_password($userId, $uuid);
        if (!$item || strpos((string) ($item['name'] ?? ''), self::PREFIX) !== 0) {
            return new WP_REST_Response(['success' => false, 'message' => __('Key not found.', 'yatra')], 404);
        }
        $deleted = \WP_Application_Passwords::delete_application_password($userId, $uuid);

        return new WP_REST_Response(['success' => !is_wp_error($deleted)], is_wp_error($deleted) ? 400 : 200);
    }
}
