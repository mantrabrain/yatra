<?php

declare(strict_types=1);

namespace Yatra\Blocks;

/**
 * Trip Search Block (yatra/trip-search)
 *
 * The [yatra_search] search bar. Each field can follow the global
 * Settings → Search & Listing toggle (default) or be forced on/off.
 *
 * @package Yatra\Blocks
 * @since 3.1.4
 */
class TripSearchBlock extends AbstractShortcodeBlock
{
    /**
     * Search-bar fields that accept a per-placement override.
     */
    private const FIELDS = ['keyword', 'destination', 'activities', 'duration', 'budget', 'date'];

    public function slug(): string
    {
        return 'trip-search';
    }

    public function title(): string
    {
        return __('Trip Search', 'yatra');
    }

    public function elementorIcon(): string
    {
        return 'eicon-search';
    }

    protected function shortcodeTag(): string
    {
        return 'yatra_search';
    }

    protected function editorStyles(): array
    {
        return ['yatra-common', 'yatra-blocks', 'yatra-blocks-trip-search-preview'];
    }

    public function controls(): array
    {
        $options = [
            '' => __('Use site setting', 'yatra'),
            'yes' => __('Show', 'yatra'),
            'no' => __('Hide', 'yatra'),
        ];
        $labels = [
            'keyword' => __('Keyword field', 'yatra'),
            'destination' => __('Destination field', 'yatra'),
            'activities' => __('Activities field', 'yatra'),
            'duration' => __('Duration field', 'yatra'),
            'budget' => __('Budget field', 'yatra'),
            'date' => __('Date field', 'yatra'),
        ];

        $controls = [];
        foreach (self::FIELDS as $field) {
            $controls[] = [
                'name' => $field,
                'type' => 'select',
                'label' => $labels[$field],
                'default' => '',
                'options' => $options,
            ];
        }

        return $controls;
    }

    protected function shortcodeAttributes(array $attributes): array
    {
        $atts = [];
        foreach (self::FIELDS as $field) {
            $value = self::oneOf($attributes[$field] ?? '', ['', 'yes', 'no'], '');
            if ($value !== '') {
                $atts[$field] = $value;
            }
        }

        return $atts;
    }
}
