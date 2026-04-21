<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Admin\StatsUsage;

/**
 * REST endpoints for opt-in usage telemetry (admin only).
 */
class UsageTrackingController extends BaseController
{
    protected string $rest_base = 'usage-tracking';

    public function register_routes(): void
    {
        register_rest_route($this->namespace, '/' . $this->rest_base . '/status', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_status'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        register_rest_route($this->namespace, '/' . $this->rest_base . '/settings', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'update_settings'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        register_rest_route($this->namespace, '/' . $this->rest_base . '/send', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'send_now'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        register_rest_route($this->namespace, '/' . $this->rest_base . '/preview', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'preview_payload'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        register_rest_route($this->namespace, '/' . $this->rest_base . '/clear-cache', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'clear_cache'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        register_rest_route($this->namespace, '/' . $this->rest_base . '/delete-snapshots', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'delete_snapshots'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);
    }

    public function check_permission(?WP_REST_Request $request = null): bool
    {
        unset($request);

        return current_user_can('manage_options') || current_user_can('manage_yatra');
    }

    public function get_status(WP_REST_Request $request): WP_REST_Response
    {
        unset($request);
        $u = StatsUsage::instance();

        return new WP_REST_Response([
            'success' => true,
            'data' => [
                'enabled' => $u->is_enabled(),
                'last_sync' => (int) get_option(StatsUsage::OPT_LAST_SYNC, 0),
                'next_scheduled' => $u->get_next_scheduled(),
                'retry_count' => (int) get_option(StatsUsage::OPT_RETRY_COUNT, 0),
                'next_retry' => (int) get_option(StatsUsage::OPT_NEXT_RETRY, 0),
                'instance_id' => $u->ensure_instance_id(),
                'last_send_error' => $u->get_last_send_error(),
            ],
        ]);
    }

    public function update_settings(WP_REST_Request $request): WP_REST_Response
    {
        $body = $request->get_json_params();
        if (!is_array($body)) {
            $body = [];
        }
        $enabled = !empty($body['enabled']);
        $u = StatsUsage::instance();
        if ($enabled) {
            $u->enable(true);
        } else {
            $u->disable();
        }

        return new WP_REST_Response([
            'success' => true,
            'message' => __('Preference saved.', 'yatra'),
            'data' => ['enabled' => $u->is_enabled()],
        ]);
    }

    public function send_now(WP_REST_Request $request): WP_REST_Response
    {
        $u = StatsUsage::instance();
        $body = $request->get_json_params();
        $body = is_array($body) ? $body : [];
        $force = !empty($body['force']);

        if (!$u->is_enabled() && !$force) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Sharing is turned off. Enable it above, or use “Send now” for a one-time test send.', 'yatra'),
            ], 400);
        }

        // force=true skips opt-in check (same permission as this endpoint — trusted admins only).
        $ok = $u->sync(!$force);

        $lastErr = $u->get_last_send_error();
        $message = $ok
            ? __('Sent successfully.', 'yatra')
            : __('Send failed; will retry with backoff.', 'yatra');
        if (!$ok && is_array($lastErr)) {
            $hint = '';
            if (!empty($lastErr['code'])) {
                $hint .= ' HTTP ' . (string) $lastErr['code'];
            }
            if (!empty($lastErr['wp_error'])) {
                $hint .= ($hint !== '' ? ' — ' : '') . (string) $lastErr['wp_error'];
            }
            if ($hint === '' && !empty($lastErr['body'])) {
                $hint = ' ' . (string) $lastErr['body'];
            }
            if ($hint !== '') {
                $message .= ' ' . $hint;
            }
        }

        return new WP_REST_Response([
            'success' => $ok,
            'message' => $message,
            'detail' => $lastErr,
        ], $ok ? 200 : 502);
    }

    public function preview_payload(WP_REST_Request $request): WP_REST_Response
    {
        unset($request);
        $u = StatsUsage::instance();
        $payload = $u->build_payload();

        return new WP_REST_Response([
            'success' => true,
            'data' => [
                'json' => wp_json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
            ],
        ]);
    }

    public function clear_cache(WP_REST_Request $request): WP_REST_Response
    {
        unset($request);
        StatsUsage::instance()->clear_local_cache();

        return new WP_REST_Response([
            'success' => true,
            'message' => __('Local telemetry cache cleared.', 'yatra'),
        ]);
    }

    public function delete_snapshots(WP_REST_Request $request): WP_REST_Response
    {
        unset($request);
        StatsUsage::instance()->delete_snapshots();

        return new WP_REST_Response([
            'success' => true,
            'message' => __('Local snapshots removed.', 'yatra'),
        ]);
    }
}
