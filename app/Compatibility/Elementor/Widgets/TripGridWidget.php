<?php

declare(strict_types=1);

namespace Yatra\Compatibility\Elementor\Widgets;

use Yatra\Blocks\AbstractServerBlock;
use Yatra\Blocks\TourBlock;

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Elementor widget for the yatra/tour block (trip grid with filters).
 *
 * Renders through {@see TourBlock::renderMarkup()}, the block's own render path.
 *
 * @package Yatra\Compatibility\Elementor\Widgets
 * @since 3.1.4
 */
class TripGridWidget extends AbstractBlockWidget
{
    protected function block(): AbstractServerBlock
    {
        // yatra/tour predates AbstractServerBlock; every method that would use
        // the block is overridden below.
        throw new \LogicException('TripGridWidget renders through TourBlock::renderMarkup().');
    }

    public function get_name()
    {
        return 'yatra-trip-grid';
    }

    public function get_title()
    {
        return __('Trip Grid', 'yatra');
    }

    public function get_icon()
    {
        return 'eicon-posts-grid';
    }

    protected function controlSchema(): array
    {
        return [
            ['name' => 'title', 'type' => 'text', 'label' => __('Title', 'yatra'), 'default' => __('Our Trips', 'yatra')],
            [
                'name' => 'order',
                'type' => 'select',
                'label' => __('Order', 'yatra'),
                'default' => 'desc',
                'options' => ['desc' => __('Descending', 'yatra'), 'asc' => __('Ascending', 'yatra')],
            ],
            ['name' => 'per_page', 'type' => 'number', 'label' => __('Number of Trips', 'yatra'), 'default' => 10, 'min' => 1, 'max' => 50],
            ['name' => 'columns', 'type' => 'number', 'label' => __('Columns', 'yatra'), 'default' => 3, 'min' => 1, 'max' => 6],
            [
                'name' => 'featured_priority',
                'type' => 'select',
                'label' => __('Featured Priority', 'yatra'),
                'default' => '',
                'options' => [
                    '' => __('Any', 'yatra'),
                    'featured' => __('Featured', 'yatra'),
                    'new' => __('New', 'yatra'),
                    'limited' => __('Limited Time', 'yatra'),
                ],
            ],
            ['name' => 'show_pagination', 'type' => 'toggle', 'label' => __('Show pagination', 'yatra'), 'default' => true],
            [
                'name' => 'cardLayout',
                'type' => 'select',
                'label' => __('Card layout', 'yatra'),
                'default' => 'inherit',
                'options' => [
                    'inherit' => __('Use site default', 'yatra'),
                    'standard' => __('Standard', 'yatra'),
                    'compact_mobile' => __('Compact (mobile only)', 'yatra'),
                    'compact_all' => __('Compact (everywhere)', 'yatra'),
                ],
            ],
            ['name' => 'destinationIds', 'type' => 'multiselect', 'label' => __('Destinations', 'yatra'), 'options' => self::choices('destination')],
            ['name' => 'activityIds', 'type' => 'multiselect', 'label' => __('Activities', 'yatra'), 'options' => self::choices('activity')],
            ['name' => 'categoryIds', 'type' => 'multiselect', 'label' => __('Trip categories', 'yatra'), 'options' => self::choices('trip_category')],
            ['name' => 'difficultyIds', 'type' => 'multiselect', 'label' => __('Difficulty levels', 'yatra'), 'options' => self::choices('difficulty')],
            ['name' => 'search', 'type' => 'text', 'label' => __('Search', 'yatra'), 'default' => ''],
            ['name' => 'price_min', 'type' => 'text', 'label' => __('Price min', 'yatra'), 'default' => ''],
            ['name' => 'price_max', 'type' => 'text', 'label' => __('Price max', 'yatra'), 'default' => ''],
            ['name' => 'duration_min', 'type' => 'text', 'label' => __('Duration min (days)', 'yatra'), 'default' => ''],
            ['name' => 'duration_max', 'type' => 'text', 'label' => __('Duration max (days)', 'yatra'), 'default' => ''],
        ];
    }

    protected function renderAttributes(array $attributes): string
    {
        $priority = (string) ($attributes['featured_priority'] ?? '');
        $attributes['featured_priority'] = in_array($priority, ['', 'featured', 'new', 'limited'], true) ? $priority : '';
        // Keep the legacy boolean in sync, as the block editor does.
        $attributes['featured'] = $attributes['featured_priority'] === 'featured';
        $attributes['order'] = ($attributes['order'] ?? '') === 'asc' ? 'asc' : 'desc';
        $attributes['per_page'] = max(1, min(50, (int) ($attributes['per_page'] ?? 10)));
        $attributes['columns'] = max(1, min(6, (int) ($attributes['columns'] ?? 3)));
        $attributes['title'] = sanitize_text_field((string) ($attributes['title'] ?? ''));
        foreach (['search', 'price_min', 'price_max', 'duration_min', 'duration_max'] as $key) {
            $attributes[$key] = sanitize_text_field((string) ($attributes[$key] ?? ''));
        }

        return TourBlock::renderMarkup($attributes);
    }

    /**
     * Classification choices, from the same source as the block editor's
     * filter pickers (GET yatra/v1/block-editor/taxonomy-choices).
     *
     * @return array<string, string>
     */
    private static function choices(string $taxonomy): array
    {
        if (! current_user_can('edit_posts')) {
            return [];
        }

        $request = new \WP_REST_Request('GET', '/yatra/v1/block-editor/taxonomy-choices');
        $request->set_param('taxonomy', $taxonomy);
        $response = (new \Yatra\Controllers\BlockEditorChoicesController())->get_taxonomy_choices($request);
        if (is_wp_error($response)) {
            return [];
        }
        $data = $response instanceof \WP_REST_Response ? $response->get_data() : [];

        $options = [];
        foreach ((array) ($data['items'] ?? []) as $item) {
            $options[(string) (int) $item['id']] = (string) $item['name'];
        }

        return $options;
    }
}
