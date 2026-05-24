<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use Yatra\Services\NoticeService;

defined('ABSPATH') || exit;

final class NoticeController extends BaseController
{
    /**
     * @var string
     */
    protected string $rest_base = 'notices';

    /**
     * Admin-notice dismissal — gated on the umbrella admin-access
     * cap so any team member who can see the Yatra admin can dismiss
     * the notices they see. The legacy `manage_yatra` cap was never
     * registered anywhere, so the previous OR-arm did nothing in
     * practice. WP admins pass via the Team module's admin-fallback
     * filter.
     */
    public function check_permission(?\WP_REST_Request $request = null): bool
    {
        return current_user_can('yatra_access_admin');
    }

    public function register_routes(): void
    {
        register_rest_route($this->namespace, '/' . $this->rest_base, [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'index'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[a-z0-9_\\-]+)/dismiss', [
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'dismiss'],
                'permission_callback' => [$this, 'check_permission'],
                'args' => [
                    'id' => [
                        'required' => true,
                        'type' => 'string',
                    ],
                ],
            ],
        ]);
    }

    public function index(WP_REST_Request $request): WP_REST_Response
    {
        return rest_ensure_response([
            'success' => true,
            'data' => NoticeService::getActiveNoticesForCurrentUser(),
        ]);
    }

    public function dismiss(WP_REST_Request $request): WP_REST_Response
    {
        $id = sanitize_key((string) $request->get_param('id'));
        $result = NoticeService::dismissForCurrentUser($id);
        if ($result === true) {
            return rest_ensure_response(['success' => true]);
        }

        $response = rest_ensure_response([
            'success' => false,
            'code' => $result->get_error_code(),
            'message' => $result->get_error_message(),
        ]);
        $response->set_status((int) ($result->get_error_data()['status'] ?? 400));
        return $response;
    }
}

