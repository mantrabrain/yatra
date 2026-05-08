<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Server;

/**
 * Read-only taxonomy option lists for the block editor (id + label).
 *
 * Separate from canonical CRUD routes so anyone who can edit posts can pick classifications
 * without requiring yatra_view_trips.
 */
final class BlockEditorChoicesController
{
    private string $namespace = 'yatra/v1';

    public function register_routes(): void
    {
        register_rest_route(
            $this->namespace,
            '/block-editor/taxonomy-choices',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_taxonomy_choices'],
                'permission_callback' => static function (): bool {
                    return current_user_can('edit_posts');
                },
                'args' => [
                    'taxonomy' => [
                        'required' => true,
                        'enum' => ['destination', 'activity', 'trip_category', 'difficulty'],
                        'sanitize_callback' => 'sanitize_key',
                    ],
                ],
            ]
        );
    }

    /**
     * @return \WP_REST_Response|\WP_Error
     */
    public function get_taxonomy_choices(WP_REST_Request $request)
    {
        $taxonomy = (string) $request->get_param('taxonomy');

        $args = [
            'limit' => 500,
            'offset' => 0,
            'order_by' => 'name',
            'order' => 'ASC',
            'where' => ['status' => 'publish'],
        ];

        $items = [];

        try {
            switch ($taxonomy) {
                case 'destination':
                    foreach ((new \Yatra\Services\DestinationService())->getAll($args) as $row) {
                        $id = isset($row->id) ? (int) $row->id : 0;
                        if ($id > 0) {
                            $items[] = [
                                'id' => $id,
                                'name' => (string) ($row->name ?? ''),
                            ];
                        }
                    }
                    break;
                case 'activity':
                    foreach ((new \Yatra\Services\ActivityService())->getAll($args) as $row) {
                        $id = isset($row->id) ? (int) $row->id : 0;
                        if ($id > 0) {
                            $items[] = [
                                'id' => $id,
                                'name' => (string) ($row->name ?? ''),
                            ];
                        }
                    }
                    break;
                case 'trip_category':
                    foreach ((new \Yatra\Services\CategoryService())->getAll($args) as $row) {
                        $id = isset($row->id) ? (int) $row->id : 0;
                        if ($id > 0) {
                            $items[] = [
                                'id' => $id,
                                'name' => (string) ($row->name ?? ''),
                            ];
                        }
                    }
                    break;
                case 'difficulty':
                    $rows = (new \Yatra\Repositories\DifficultyLevelRepository())->getPublished() ?: [];
                    foreach ($rows as $row) {
                        $id = isset($row->id) ? (int) $row->id : 0;
                        if ($id > 0) {
                            $items[] = [
                                'id' => $id,
                                'name' => (string) ($row->name ?? ''),
                            ];
                        }
                    }
                    break;
                default:
                    return new \WP_Error('invalid_taxonomy', 'Invalid taxonomy', ['status' => 400]);
            }
        } catch (\Throwable $e) {
            return new \WP_Error('choices_failed', 'Could not load choices', ['status' => 500]);
        }

        usort($items, static function (array $a, array $b): int {
            return strcasecmp((string) $a['name'], (string) $b['name']);
        });

        return rest_ensure_response(['items' => $items]);
    }
}
