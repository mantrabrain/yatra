<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use Yatra\Services\WteImportService;
use Yatra\Utils\Logger;

/**
 * WP Travel Engine Import Controller
 *
 * Tools > Import from WP Travel Engine. Routes live under
 * yatra/v1/tools/import/wte/... and use the same capability check as the
 * other Tools endpoints.
 */
class WteImportController extends BaseController
{
    /**
     * @var WteImportService
     */
    private WteImportService $service;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->service = new WteImportService();
    }

    /**
     * Register REST API routes
     */
    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        $base = 'tools/import/wte';

        // What WP Travel Engine data exists.
        register_rest_route($namespace, '/' . $base . '/detect', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'detect'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Dry run.
        register_rest_route($namespace, '/' . $base . '/scan', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'scan'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Step 1: destinations, activities, trip types, difficulties, traveller categories.
        register_rest_route($namespace, '/' . $base . '/terms', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'importTerms'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);

        // Step 2: one batch of trips.
        register_rest_route($namespace, '/' . $base . '/trips', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'importTrips'],
                'permission_callback' => [$this, 'check_permission'],
                'args' => [
                    'offset' => [
                        'type' => 'integer',
                        'default' => 0,
                        'minimum' => 0,
                        'sanitize_callback' => 'absint',
                    ],
                    'limit' => [
                        'type' => 'integer',
                        'default' => WteImportService::DEFAULT_BATCH,
                        'minimum' => 1,
                        'maximum' => WteImportService::MAX_BATCH,
                        'sanitize_callback' => 'absint',
                    ],
                    'update_existing' => [
                        'type' => 'boolean',
                        'default' => false,
                        'sanitize_callback' => 'rest_sanitize_boolean',
                    ],
                ],
            ],
        ]);
    }

    /**
     * GET /tools/import/wte/detect
     */
    public function detect(WP_REST_Request $request)
    {
        try {
            return $this->success_response($this->service->detect());
        } catch (\Throwable $e) {
            return $this->failure($e);
        }
    }

    /**
     * POST /tools/import/wte/scan
     */
    public function scan(WP_REST_Request $request)
    {
        try {
            return $this->success_response($this->service->scan());
        } catch (\Throwable $e) {
            return $this->failure($e);
        }
    }

    /**
     * POST /tools/import/wte/terms
     */
    public function importTerms(WP_REST_Request $request)
    {
        try {
            return $this->success_response(['terms' => $this->service->importTerms()]);
        } catch (\Throwable $e) {
            return $this->failure($e);
        }
    }

    /**
     * POST /tools/import/wte/trips
     */
    public function importTrips(WP_REST_Request $request)
    {
        try {
            return $this->success_response($this->service->importTripsBatch(
                (int) $request->get_param('offset'),
                (int) $request->get_param('limit'),
                (bool) $request->get_param('update_existing')
            ));
        } catch (\Throwable $e) {
            return $this->failure($e);
        }
    }

    /**
     * Error response (409 while another import holds the lock).
     */
    private function failure(\Throwable $e): \WP_Error
    {
        $status = (int) $e->getCode() === 409 ? 409 : 500;
        if ($status !== 409) {
            Logger::error('WP Travel Engine import failed: ' . $e->getMessage());
        }

        return $this->error_response($e->getMessage(), $status);
    }
}
