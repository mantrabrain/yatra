<?php

declare(strict_types=1);

namespace Yatra\Blocks;

/**
 * Resolves the Gutenberg editor script URL for yatra/tour, yatra/activity, yatra/destination.
 *
 * Prefer Vite output under assets/dist/blocks/ (present after npm run build). Fall back to
 * legacy IIFE scripts under resources/js/blocks/{slug}/block.js (dev or when dist is missing).
 */
final class BlockEditorScript
{
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
        if (is_readable($distPath)) {
            return [
                'url' => YATRA_PLUGIN_URL . 'assets/dist/blocks/' . $slug . '.js',
                'module' => true,
            ];
        }

        $legacyPath = YATRA_PLUGIN_PATH . 'resources/js/blocks/' . $slug . '/block.js';
        if (is_readable($legacyPath)) {
            return [
                'url' => YATRA_PLUGIN_URL . 'resources/js/blocks/' . $slug . '/block.js',
                'module' => false,
            ];
        }

        return null;
    }

    public static function blockJsonPath(string $slug): string
    {
        $slug = preg_replace('/[^a-z]/', '', strtolower($slug));

        return YATRA_PLUGIN_PATH . 'resources/js/blocks/' . $slug . '/block.json';
    }

    /**
     * @param list<string> $deps
     */
    public static function register(string $handle, string $slug, array $deps): bool
    {
        $bundle = self::resolveEditorBundle($slug);
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
        }

        return true;
    }
}
