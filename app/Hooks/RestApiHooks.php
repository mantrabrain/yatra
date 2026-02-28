<?php

declare(strict_types=1);

namespace Yatra\Hooks;

/**
 * REST API Hooks
 *
 * Handles REST API route registration and related functionality
 */
class RestApiHooks
{
    /**
     * Initialize REST API hooks
     */
    public static function init(): void
    {
        // Authentication (login, register, email verification)
        add_action('rest_api_init', [\Yatra\Controllers\AuthController::class, 'registerRoutes']);

        // Cache management
        if (class_exists('\Yatra\Controllers\CacheController')) {
            add_action('rest_api_init', [\Yatra\Controllers\CacheController::class, 'registerRoutes']);
        }

        // Test endpoint to verify REST API is working
        add_action('rest_api_init', [self::class, 'registerTestEndpoint']);
    }

    /**
     * Register test endpoint for REST API verification
     */
    public static function registerTestEndpoint(): void
    {
        register_rest_route('yatra/v1', '/test', [
            'methods' => 'GET',
            'callback' => [self::class, 'handleTestEndpoint'],
            'permission_callback' => '__return_true'
        ]);
    }

    /**
     * Handle test endpoint request
     */
    public static function handleTestEndpoint(): array
    {
        return [
            'status' => 'success',
            'message' => 'Yatra REST API is working',
            'timestamp' => current_time('timestamp'),
            'version' => YATRA_VERSION ?? 'dev'
        ];
    }
}
