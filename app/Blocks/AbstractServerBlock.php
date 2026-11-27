<?php

declare(strict_types=1);

namespace Yatra\Blocks;

use Yatra\Providers\FrontendAssetsProvider;

/**
 * Base class for the server-rendered Yatra blocks added in 3.1.4
 * (search, deals, login, my account and the single-trip section blocks).
 *
 * Each block keeps its definition in resources/js/blocks/{slug}/block.json and
 * its editor bundle in assets/dist/blocks/{slug}.js, exactly like
 * {@see TourBlock}. The markup comes from render(), which the Elementor
 * widgets call too ({@see \Yatra\Compatibility\Elementor\Widgets}), so a block
 * and its widget always print the same HTML.
 *
 * @package Yatra\Blocks
 * @since 3.1.4
 */
abstract class AbstractServerBlock
{
    /**
     * Folder under resources/js/blocks/ (e.g. "trip-gallery"). The block is named yatra/{slug}.
     */
    abstract public function slug(): string;

    /**
     * Block / widget title (translated).
     */
    abstract public function title(): string;

    /**
     * Render the block markup. Attributes arrive from a block, a pattern or an
     * Elementor widget, so every value is sanitized here, never trusted.
     *
     * @param array<string, mixed> $attributes
     */
    abstract public function render(array $attributes): string;

    /**
     * Inspector / Elementor controls, in display order.
     *
     * Each entry: name, type (text|number|toggle|select|trip), label, and
     * optionally default, options (value => label), min, max, help.
     *
     * @return list<array<string, mixed>>
     */
    public function controls(): array
    {
        return [];
    }

    /**
     * Dashicon / eicon-agnostic icon name used by Elementor (eicon-*).
     */
    public function elementorIcon(): string
    {
        return 'eicon-site-search';
    }

    /**
     * Style handles the block editor loads into its canvas for the live preview.
     *
     * @return list<string>
     */
    protected function editorStyles(): array
    {
        return ['yatra-common', 'yatra-blocks'];
    }

    public function name(): string
    {
        return 'yatra/' . $this->slug();
    }

    /**
     * Editor script handle (matches "editorScript" in block.json).
     */
    public function editorHandle(): string
    {
        return 'yatra-' . $this->slug() . '-block-editor';
    }

    /**
     * Register the block type. Called on init (see BlockServiceProvider).
     */
    public function register(): void
    {
        BlockEditorScript::reclaimBlockName($this->name());

        if (! BlockEditorScript::register($this->editorHandle(), $this->slug(), BlockEditorScript::editorDependencies())) {
            return;
        }

        self::registerSharedStyles();

        $metadata = BlockEditorScript::blockJsonPath($this->slug());
        if (! is_readable($metadata)) {
            return;
        }

        register_block_type_from_metadata(
            $metadata,
            [
                'render_callback' => [$this, 'renderCallback'],
                'editor_style' => $this->editorStyles(),
            ]
        );
    }

    /**
     * @param array<string, mixed> $attributes Block attributes
     * @param string $content Block content (unused, dynamic block)
     */
    public function renderCallback(array $attributes, string $content = ''): string
    {
        unset($content);

        return $this->render($attributes);
    }

    /**
     * Load Yatra's shared front-end files plus the small block stylesheet.
     * Idempotent; called from every render path (block, widget, preview).
     */
    protected function ensureAssets(): void
    {
        FrontendAssetsProvider::ensureCommonAssets();
        self::registerSharedStyles();
        if (! is_admin()) {
            wp_enqueue_style('yatra-blocks');
        }
    }

    /**
     * Register the style handles the new blocks use (front end and editor canvas).
     */
    public static function registerSharedStyles(): void
    {
        FrontendAssetsProvider::registerCoreFrontendStylesheets();

        $deps = FrontendAssetsProvider::shortcodeStyleDependencies();
        $styles = [
            'yatra-blocks' => 'assets/css/blocks.css',
            // Editor-canvas copies of front-end files (the front end enqueues them
            // under their own handles through FrontendAssetsProvider).
            'yatra-blocks-trip-preview' => 'assets/css/trip.css',
            'yatra-blocks-trip-search-preview' => 'assets/css/shortcodes/trip-search-shortcode.css',
            'yatra-blocks-login-preview' => 'assets/css/shortcodes/login-shortcode.css',
        ];

        foreach ($styles as $handle => $relative) {
            if (wp_style_is($handle, 'registered')) {
                continue;
            }
            $path = \YATRA_PLUGIN_PATH . $relative;
            if (! is_readable($path)) {
                continue;
            }
            wp_register_style(
                $handle,
                \YATRA_PLUGIN_URL . $relative,
                $deps,
                YATRA_VERSION . '.' . filemtime($path)
            );
        }
    }

    /**
     * Wrapper attributes: the block-supports classes (align, custom class name)
     * when rendered as a block, a plain class attribute otherwise (Elementor).
     */
    protected function wrapperAttributes(string $class): string
    {
        $attributes = '';
        if (function_exists('get_block_wrapper_attributes') && class_exists('\\WP_Block_Supports')
            && ! empty(\WP_Block_Supports::$block_to_render)
            && (\WP_Block_Supports::$block_to_render['blockName'] ?? '') === $this->name()) {
            $attributes = get_block_wrapper_attributes(['class' => $class]);
        }

        return $attributes !== '' ? $attributes : 'class="' . esc_attr($class) . '"';
    }

    /**
     * Normalise a boolean-ish attribute (bool, "yes"/"no", "1"/"0", Elementor "yes"/"").
     *
     * @param mixed $value
     */
    protected static function bool($value, bool $default): bool
    {
        if (is_bool($value)) {
            return $value;
        }
        if ($value === null) {
            return $default;
        }
        $value = strtolower(trim((string) $value));
        if (in_array($value, ['1', 'yes', 'true', 'on'], true)) {
            return true;
        }
        if (in_array($value, ['0', 'no', 'false', 'off', ''], true)) {
            return false;
        }

        return $default;
    }

    /**
     * Pick a value from a fixed list, falling back to the default.
     *
     * @param mixed $value
     * @param list<string> $allowed
     */
    protected static function oneOf($value, array $allowed, string $default): string
    {
        $value = is_scalar($value) ? strtolower(trim((string) $value)) : '';

        return in_array($value, $allowed, true) ? $value : $default;
    }

    /**
     * Clamp an integer attribute.
     *
     * @param mixed $value
     */
    protected static function int($value, int $default, int $min, int $max): int
    {
        if (! is_numeric($value)) {
            return $default;
        }

        return max($min, min($max, (int) $value));
    }

    /**
     * Shared "card layout" options (mirrors yatra/tour).
     *
     * @return array<string, string>
     */
    protected static function cardLayoutOptions(): array
    {
        return [
            'inherit' => __('Use site default', 'yatra'),
            'standard' => __('Standard', 'yatra'),
            'compact_mobile' => __('Compact (mobile only)', 'yatra'),
            'compact_all' => __('Compact (everywhere)', 'yatra'),
        ];
    }
}
