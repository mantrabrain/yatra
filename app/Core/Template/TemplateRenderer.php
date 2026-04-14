<?php

declare(strict_types=1);

namespace Yatra\Core\Template;

use Yatra\Core\Assets\BaseAssetManager;

/**
 * Template Renderer
 *
 * Handles template loading and rendering with proper error handling
 */
class TemplateRenderer
{
    /**
     * Render a template with data
     *
     * @param string $template_path Path to template file
     * @param array $data Data to pass to template
     * @param BaseAssetManager|null $asset_manager Asset manager to enqueue assets
     * @return bool True if rendered successfully, false otherwise
     */
    public static function render(string $template_path, array $data = [], ?BaseAssetManager $asset_manager = null): bool
    {
        if (!file_exists($template_path)) {
            self::logError("Template not found: {$template_path}");
            return false;
        }

        // Enqueue assets if asset manager provided
        if ($asset_manager) {
            $asset_manager->enqueueAssets();
        }

        // Extract data for template use
        if (!empty($data)) {
            extract($data);
        }

        // Include template
        include $template_path;

        return true;
    }

    /**
     * Get template path for a specific template
     *
     * @param string $template Template name (without .php extension)
     * @return string Full path to template
     */
    public static function getTemplatePath(string $template): string
    {
        return YATRA_PLUGIN_PATH . 'templates/' . $template . '.php';
    }

    /**
     * Check if template exists
     *
     * @param string $template Template name
     * @return bool True if template exists
     */
    public static function templateExists(string $template): bool
    {
        $path = self::getTemplatePath($template);
        return file_exists($path);
    }

    /**
     * Log error message
     *
     * @param string $message Error message
     */
    private static function logError(string $message): void
    {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            }
    }
}
