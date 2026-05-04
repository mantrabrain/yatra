<?php

declare(strict_types=1);

namespace Yatra\Blocks;

use Yatra\Providers\FrontendAssetsProvider;
use Yatra\Services\BlockDataService;

/**
 * Gutenberg block: trip category grid (same UI as destination block).
 */
class TripCategoryBlock
{
    public function __construct()
    {
        $this->register();
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function renderCallback(array $attributes, string $content): string
    {
        FrontendAssetsProvider::registerCoreFrontendStylesheets();
        wp_enqueue_style('yatra-destination-shortcode');

        return BlockDataService::renderTripCategoryBlock($attributes);
    }

    public function register(): void
    {
        BlockEditorScript::reclaimBlockName('yatra/trip-category');

        $editorDeps = BlockEditorScript::editorDependencies();
        if (! BlockEditorScript::register('yatra-trip-category-block-editor', 'trip-category', $editorDeps)) {
            return;
        }

        FrontendAssetsProvider::registerCoreFrontendStylesheets();

        wp_register_style(
            'yatra-listing',
            \YATRA_PLUGIN_URL . 'assets/css/listing.css',
            [],
            YATRA_VERSION
        );

        $destinationShortcodeCss = \YATRA_PLUGIN_PATH . 'assets/css/shortcodes/destination-shortcode.css';
        $destinationShortcodeVer = is_readable($destinationShortcodeCss) ? YATRA_VERSION . '.' . filemtime($destinationShortcodeCss) : YATRA_VERSION;
        wp_register_style(
            'yatra-destination-shortcode',
            \YATRA_PLUGIN_URL . 'assets/css/shortcodes/destination-shortcode.css',
            FrontendAssetsProvider::shortcodeStyleDependencies(),
            $destinationShortcodeVer
        );

        wp_register_script(
            'yatra-trip-category-shortcode',
            \YATRA_PLUGIN_URL . 'assets/js/trip-category-shortcode.js',
            ['jquery'],
            YATRA_VERSION,
            true
        );

        $block = register_block_type_from_metadata(
            BlockEditorScript::blockJsonPath('trip-category'),
            [
                'render_callback' => [$this, 'renderCallback'],
                'editor_style' => ['yatra-listing', 'yatra-destination-shortcode'],
                'style' => ['yatra-destination-shortcode'],
                'script' => 'yatra-trip-category-shortcode',
            ]
        );

        if ($block === false) {
            $fallbackMeta = null;
            $metaPath = BlockEditorScript::blockJsonPath('trip-category');
            if (is_readable($metaPath)) {
                $decoded = wp_json_file_decode($metaPath, ['associative' => true]);
                $fallbackMeta = is_array($decoded) ? $decoded : null;
            }

            register_block_type('yatra/trip-category', [
                'api_version' => 3,
                'title' => __('Trip categories', 'yatra'),
                'category' => 'yatra',
                'description' => __('Display trip category cards with trip counts and pricing (same layout as destinations).', 'yatra'),
                'icon' => 'category',
                'keywords' => ['category', 'trip', 'taxonomy', 'yatra'],
                'attributes' => is_array($fallbackMeta['attributes'] ?? null) ? $fallbackMeta['attributes'] : [],
                'render_callback' => [$this, 'renderCallback'],
                'editor_script' => 'yatra-trip-category-block-editor',
                'editor_style' => ['yatra-listing', 'yatra-destination-shortcode'],
                'style' => ['yatra-destination-shortcode'],
                'script' => 'yatra-trip-category-shortcode',
                'supports' => [
                    'align' => ['wide', 'full'],
                    'html' => false,
                    'inserter' => true,
                ],
            ]);
        }
    }
}
