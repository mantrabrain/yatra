<?php

declare(strict_types=1);

namespace Yatra\Blocks;

use Yatra\Services\BlockDataService;

/**
 * Tour Block
 *
 * Gutenberg block for displaying tour/trip packages
 * Maintains backward compatibility with old yatra/tour block
 *
 * @package Yatra\Blocks
 * @since 3.0.0
 */
class TourBlock
{
    public function __construct()
    {
        $this->register();
    }

    /**
     * @param array<string, mixed> $attributes Block attributes
     * @param string $content Block content
     */
    public function renderCallback(array $attributes, string $content): string
    {
        wp_enqueue_style('yatra-trip-shortcode', \YATRA_PLUGIN_URL . 'assets/css/shortcodes/trip-shortcode.css', [], YATRA_VERSION);

        return BlockDataService::renderTripBlock($attributes);
    }

    public function register(): void
    {
        if (\WP_Block_Type_Registry::get_instance()->is_registered('yatra/tour')) {
            return;
        }

        $editorDeps = ['wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n'];
        if (! BlockEditorScript::register('yatra-tour-block-editor', 'tour', $editorDeps)) {
            return;
        }

        wp_register_style(
            'yatra-listing',
            \YATRA_PLUGIN_URL . 'assets/css/listing.css',
            [],
            YATRA_VERSION
        );

        wp_register_style(
            'yatra-trip-shortcode',
            \YATRA_PLUGIN_URL . 'assets/css/shortcodes/trip-shortcode.css',
            [],
            YATRA_VERSION
        );

        wp_register_script(
            'yatra-trip-shortcode',
            \YATRA_PLUGIN_URL . 'assets/js/trip-shortcode.js',
            ['jquery'],
            YATRA_VERSION,
            true
        );

        $block = register_block_type_from_metadata(
            BlockEditorScript::blockJsonPath('tour'),
            [
                'render_callback' => [$this, 'renderCallback'],
                'editor_style' => ['yatra-listing', 'yatra-trip-shortcode'],
                'style' => ['yatra-trip-shortcode'],
                'script' => 'yatra-trip-shortcode',
            ]
        );

        if ($block === false) {
            register_block_type('yatra/tour', [
                'api_version' => 3,
                'title' => __('Trip', 'yatra'),
                'category' => 'yatra',
                'description' => __('Display trip listings with customizable options', 'yatra'),
                'icon' => 'palmtree',
                'keywords' => ['tour', 'trip', 'travel', 'yatra'],
                'render_callback' => [$this, 'renderCallback'],
                'editor_script' => 'yatra-tour-block-editor',
                'editor_style' => ['yatra-listing', 'yatra-trip-shortcode'],
                'style' => ['yatra-trip-shortcode'],
                'script' => 'yatra-trip-shortcode',
                'supports' => [
                    'align' => ['wide', 'full'],
                    'html' => false,
                ],
            ]);
        }
    }
}
