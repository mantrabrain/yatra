<?php

declare(strict_types=1);

namespace Yatra\Blocks;

/**
 * Deals Block (yatra/deals)
 *
 * The [yatra_discount_and_deals] grid of discounted trips.
 *
 * @package Yatra\Blocks
 * @since 3.1.4
 */
class DealsBlock extends AbstractShortcodeBlock
{
    public function slug(): string
    {
        return 'deals';
    }

    public function title(): string
    {
        return __('Trip Deals', 'yatra');
    }

    public function elementorIcon(): string
    {
        return 'eicon-price-list';
    }

    protected function shortcodeTag(): string
    {
        return 'yatra_discount_and_deals';
    }

    protected function editorStyles(): array
    {
        return ['yatra-common', 'yatra-blocks', 'yatra-listing', 'yatra-trip-shortcode'];
    }

    public function controls(): array
    {
        return [
            ['name' => 'per_page', 'type' => 'number', 'label' => __('Number of Trips', 'yatra'), 'default' => 10, 'min' => 1, 'max' => 50],
            ['name' => 'columns', 'type' => 'number', 'label' => __('Columns', 'yatra'), 'default' => 3, 'min' => 1, 'max' => 6],
            [
                'name' => 'order',
                'type' => 'select',
                'label' => __('Order', 'yatra'),
                'default' => 'asc',
                'options' => [
                    'asc' => __('Oldest first', 'yatra'),
                    'desc' => __('Newest first', 'yatra'),
                ],
            ],
            [
                'name' => 'card_layout',
                'type' => 'select',
                'label' => __('Card layout', 'yatra'),
                'default' => 'inherit',
                'options' => self::cardLayoutOptions(),
            ],
        ];
    }

    protected function shortcodeAttributes(array $attributes): array
    {
        return [
            'per_page' => (string) self::int($attributes['per_page'] ?? 10, 10, 1, 50),
            'columns' => (string) self::int($attributes['columns'] ?? 3, 3, 1, 6),
            'order' => self::oneOf($attributes['order'] ?? 'asc', ['asc', 'desc'], 'asc'),
            'card_layout' => self::oneOf($attributes['card_layout'] ?? 'inherit', array_keys(self::cardLayoutOptions()), 'inherit'),
        ];
    }
}
