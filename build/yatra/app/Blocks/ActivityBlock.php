<?php

declare(strict_types=1);

namespace Yatra\Blocks;

use Yatra\Services\BlockDataService;

/**
 * Activity Block
 *
 * Gutenberg block for displaying activity listings
 * Maintains backward compatibility with old yatra/activity block
 *
 * @package Yatra\Blocks
 * @since 3.0.0
 */
class ActivityBlock
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
        wp_enqueue_style('yatra-activity-shortcode', \YATRA_PLUGIN_URL . 'assets/css/shortcodes/activity-shortcode.css', [], YATRA_VERSION);

        return BlockDataService::renderActivityBlock($attributes);
    }

    public function register(): void
    {
        BlockEditorScript::reclaimBlockName('yatra/activity');

        $editorDeps = BlockEditorScript::editorDependencies();
        if (! BlockEditorScript::register('yatra-activity-block-editor', 'activity', $editorDeps)) {
            return;
        }

        wp_register_style(
            'yatra-listing',
            \YATRA_PLUGIN_URL . 'assets/css/listing.css',
            [],
            YATRA_VERSION
        );

        wp_register_style(
            'yatra-activity-shortcode',
            \YATRA_PLUGIN_URL . 'assets/css/shortcodes/activity-shortcode.css',
            [],
            YATRA_VERSION
        );

        wp_register_script(
            'yatra-activity-shortcode',
            \YATRA_PLUGIN_URL . 'assets/js/activity-shortcode.js',
            ['jquery'],
            YATRA_VERSION,
            true
        );

        $block = register_block_type_from_metadata(
            BlockEditorScript::blockJsonPath('activity'),
            [
                'render_callback' => [$this, 'renderCallback'],
                'editor_style' => ['yatra-listing', 'yatra-activity-shortcode'],
                'style' => ['yatra-activity-shortcode'],
                'script' => 'yatra-activity-shortcode',
            ]
        );

        if ($block === false) {
            register_block_type('yatra/activity', [
                'api_version' => 3,
                'title' => __('Activity', 'yatra'),
                'category' => 'yatra',
                'description' => __('Display activity listings with customizable options', 'yatra'),
                'icon' => 'buddicons-pm',
                'keywords' => ['activity', 'things to do', 'yatra'],
                'render_callback' => [$this, 'renderCallback'],
                'editor_script' => 'yatra-activity-block-editor',
                'editor_style' => ['yatra-listing', 'yatra-activity-shortcode'],
                'style' => ['yatra-activity-shortcode'],
                'script' => 'yatra-activity-shortcode',
                'supports' => [
                    'align' => ['wide', 'full'],
                    'html' => false,
                    'inserter' => true,
                ],
            ]);
        }
    }
}
