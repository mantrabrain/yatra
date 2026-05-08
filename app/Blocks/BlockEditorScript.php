<?php

declare(strict_types=1);

namespace Yatra\Blocks;

/**
 * Resolves the Gutenberg editor script URL for yatra/tour, yatra/activity, yatra/destination, yatra/trip-category.
 *
 * Prefer Vite output under assets/dist/blocks/ (present after npm run build). Fall back to
 * legacy IIFE scripts under resources/js/blocks/{slug}/block.js (dev or when dist is missing).
 */
final class BlockEditorScript
{
    /**
     * Script handles registered for Yatra blocks (used to force-enqueue in the block editor).
     *
     * @var list<string>
     */
    private static array $registeredEditorHandles = [];

    private static bool $enqueueHookAdded = false;

    /**
     * Editor script handles built as ESM (Vite dist). WP_Scripts::do_item() does not pass
     * wp_script_add_data( $h, 'type', 'module' ) into wp_get_script_attributes(), so we add
     * type="module" via the wp_script_attributes filter.
     *
     * @var array<string, true>
     */
    private static array $esModuleHandles = [];

    private static bool $scriptAttributesFilterAdded = false;

    /**
     * @return array{url: string, module: bool}|null
     */
    public static function resolveEditorBundle(string $slug): ?array
    {
        $slug = preg_replace('/[^a-z]/', '', strtolower($slug));
        if ($slug === '') {
            return null;
        }

        $distPath = YATRA_PLUGIN_PATH . 'assets/dist/blocks/' . $slug . '.js';
        if (file_exists($distPath) && is_readable($distPath)) {
            // Built by `node scripts/build-blocks.mjs` as a single IIFE (no `import`), so a normal script tag works.
            return [
                'url' => YATRA_PLUGIN_URL . 'assets/dist/blocks/' . $slug . '.js',
                'module' => false,
            ];
        }

        $legacyPath = YATRA_PLUGIN_PATH . 'resources/js/blocks/' . $slug . '/block.js';
        if (file_exists($legacyPath) && is_readable($legacyPath)) {
            return [
                'url' => YATRA_PLUGIN_URL . 'resources/js/blocks/' . $slug . '/block.js',
                'module' => false,
            ];
        }

        return null;
    }

    /**
     * Dependencies for block editor scripts. Include wp-data / wp-hooks so the editor runtime
     * matches what @wordpress/block-editor and @wordpress/components expect when scripts load.
     *
     * @return list<string>
     */
    public static function editorDependencies(): array
    {
        return [
            'wp-blocks',
            'wp-element',
            'wp-block-editor',
            'wp-components',
            'wp-i18n',
            'wp-api-fetch',
            'wp-data',
            'wp-hooks',
            'wp-server-side-render',
        ];
    }

    public static function blockJsonPath(string $slug): string
    {
        // Keep hyphens for on-disk paths (e.g. trip-category/block.json). Editor bundles still use
        // letters-only slugs in resolveEditorBundle() (e.g. tripcategory.js).
        $slug = strtolower((string) $slug);
        $slug = preg_replace('/[^a-z0-9_-]/', '', $slug);

        return YATRA_PLUGIN_PATH . 'resources/js/blocks/' . $slug . '/block.json';
    }

    /**
     * Drop a prior registration of the same block name so this plugin can register the full definition.
     * Legacy add-ons or partial loads sometimes register yatra/* blocks without editor assets, which hides
     * them from the inserter or leaves them broken.
     *
     * @param string $name Full block name, e.g. yatra/tour
     */
    public static function reclaimBlockName(string $name): void
    {
        if (!apply_filters('yatra_reclaim_block_registration', true, $name)) {
            return;
        }

        if (\WP_Block_Type_Registry::get_instance()->is_registered($name)) {
            unregister_block_type($name);
        }
    }

    /**
     * @param list<string> $deps
     */
    public static function register(string $handle, string $slug, array $deps): bool
    {
        $bundle = self::resolveEditorBundle($slug);
        if ($bundle === null) {
            /**
             * Last resort: try legacy path even if resolve failed (e.g. open_basedir quirks).
             */
            $slugClean = preg_replace('/[^a-z]/', '', strtolower($slug)) ?? '';
            if ($slugClean !== '') {
                $legacyPath = YATRA_PLUGIN_PATH . 'resources/js/blocks/' . $slugClean . '/block.js';
                if (file_exists($legacyPath)) {
                    $bundle = [
                        'url' => YATRA_PLUGIN_URL . 'resources/js/blocks/' . $slugClean . '/block.js',
                        'module' => false,
                    ];
                }
            }
        }
        if ($bundle === null) {


            return false;
        }

        wp_register_script(
            $handle,
            $bundle['url'],
            $deps,
            YATRA_VERSION,
            true
        );

        if ($bundle['module']) {
            wp_script_add_data($handle, 'type', 'module');
            self::$esModuleHandles[$handle] = true;
            self::ensureEsModuleAttributesFilter();
        }

        if (function_exists('wp_set_script_translations')) {
            wp_set_script_translations($handle, 'yatra', YATRA_PLUGIN_PATH . 'i18n/languages');
        }

        if (! in_array($handle, self::$registeredEditorHandles, true)) {
            self::$registeredEditorHandles[] = $handle;
        }
        self::ensureEnqueueBlockEditorAssetsHook();

        return true;
    }

    /**
     * Ensure Yatra block editor scripts are enqueued in Gutenberg (defensive; core usually does this).
     */
    private static function ensureEnqueueBlockEditorAssetsHook(): void
    {
        if (self::$enqueueHookAdded) {
            return;
        }
        self::$enqueueHookAdded = true;
        add_action('enqueue_block_editor_assets', [self::class, 'enqueueRegisteredEditorScripts'], 20);
    }

    public static function enqueueRegisteredEditorScripts(): void
    {
        foreach (self::$registeredEditorHandles as $handle) {
            if (wp_script_is($handle, 'registered')) {
                wp_enqueue_script($handle);
            }
        }
    }

    private static function ensureEsModuleAttributesFilter(): void
    {
        if (self::$scriptAttributesFilterAdded) {
            return;
        }
        self::$scriptAttributesFilterAdded = true;
        add_filter('wp_script_attributes', [self::class, 'filterEsModuleScriptAttributes'], 20, 1);
        // Core builds $attr before merging wp_script_add_data(…, 'type', 'module'); the attributes filter
        // should add type, but some hosts/plugins strip it — ensure the final <script> tag is a module.
        add_filter('script_loader_tag', [self::class, 'filterScriptLoaderTag'], 20, 3);
    }

    /**
     * @param array<string, string|bool> $attributes
     * @return array<string, string|bool>
     */
    public static function filterEsModuleScriptAttributes(array $attributes): array
    {
        $id = isset($attributes['id']) && is_string($attributes['id']) ? $attributes['id'] : '';
        if ($id === '' || substr($id, -3) !== '-js') {
            return $attributes;
        }

        $handle = substr($id, 0, -3);
        if ($handle === '' || empty(self::$esModuleHandles[$handle])) {
            return $attributes;
        }

        if (!empty($attributes['type'])) {
            return $attributes;
        }

        $attributes['type'] = 'module';

        return $attributes;
    }

    /**
     * Fallback: guarantee type="module" on the printed tag (see class docblock).
     *
     * @param string $tag    Full script tag HTML.
     * @param string $handle Script handle.
     * @param string $src    Source URL (unused).
     */
    public static function filterScriptLoaderTag(string $tag, string $handle, string $src): string
    {
        unset($src);
        if ($handle === '' || empty(self::$esModuleHandles[$handle])) {
            return $tag;
        }
        if (preg_match('/\btype\s*=\s*["\']?module["\']?/i', $tag)) {
            return $tag;
        }

        return (string) preg_replace('/<script\b/i', '<script type="module"', $tag, 1);
    }
}
