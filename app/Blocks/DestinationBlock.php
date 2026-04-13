<?php

declare(strict_types=1);

namespace Yatra\Blocks;

use Yatra\Services\BlockDataService;

/**
 * Destination Block
 *
 * Gutenberg block for displaying destination listings
 * Maintains backward compatibility with old yatra/destination block
 *
 * @package Yatra\Blocks
 * @since 3.0.0
 */
class DestinationBlock
{
    public function __construct()
    {
        $this->register();
    }

    /**
     * Block render callback
     * Uses BlockDataService to share logic with shortcodes
     *
     * @param array<string, mixed> $attributes Block attributes
     * @param string $content Block content
     */
    public function renderCallback(array $attributes, string $content): string
    {
        wp_enqueue_style('yatra-destination-shortcode', \YATRA_PLUGIN_URL . 'assets/css/shortcodes/destination-shortcode.css', [], YATRA_VERSION);

        return BlockDataService::renderDestinationBlock($attributes);
    }

    /**
     * Register the block (metadata + render callback)
     */
    public function register(): void
    {
        BlockEditorScript::reclaimBlockName('yatra/destination');

        $editorDeps = BlockEditorScript::editorDependencies();
        if (! BlockEditorScript::register('yatra-destination-block-editor', 'destination', $editorDeps)) {
            return;
        }

        wp_register_style(
            'yatra-listing',
            \YATRA_PLUGIN_URL . 'assets/css/listing.css',
            [],
            YATRA_VERSION
        );

        wp_register_style(
            'yatra-destination-shortcode',
            \YATRA_PLUGIN_URL . 'assets/css/shortcodes/destination-shortcode.css',
            [],
            YATRA_VERSION
        );

        wp_register_script(
            'yatra-destination-shortcode',
            \YATRA_PLUGIN_URL . 'assets/js/destination-shortcode.js',
            ['jquery'],
            YATRA_VERSION,
            true
        );

        $block = register_block_type_from_metadata(
            BlockEditorScript::blockJsonPath('destination'),
            [
                'render_callback' => [$this, 'renderCallback'],
                'editor_style' => ['yatra-listing', 'yatra-destination-shortcode'],
                'style' => ['yatra-destination-shortcode'],
                'script' => 'yatra-destination-shortcode',
            ]
        );

        if ($block === false) {
            register_block_type('yatra/destination', [
                'api_version' => 3,
                'title' => __('Destination', 'yatra'),
                'category' => 'yatra',
                'description' => __('Display destination listings with customizable options', 'yatra'),
                'icon' => 'admin-site',
                'keywords' => ['destination', 'place', 'location', 'yatra'],
                'render_callback' => [$this, 'renderCallback'],
                'editor_script' => 'yatra-destination-block-editor',
                'editor_style' => ['yatra-listing', 'yatra-destination-shortcode'],
                'style' => ['yatra-destination-shortcode'],
                'script' => 'yatra-destination-shortcode',
                'supports' => [
                    'align' => ['wide', 'full'],
                    'html' => false,
                    'inserter' => true,
                ],
            ]);
        }
    }
}
