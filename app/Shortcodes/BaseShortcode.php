<?php

declare(strict_types=1);

namespace Yatra\Shortcodes;

use Yatra\Services\SettingsService;

/**
 * Base Shortcode Class
 *
 * Provides common functionality for all Yatra shortcodes
 */
abstract class BaseShortcode
{
    /**
     * The shortcode tag
     */
    protected string $tag;

    /**
     * Default attributes for the shortcode
     */
    protected array $default_attributes = [];

    /**
     * Constructor
     */
    public function __construct(string $tag, array $default_attributes = [])
    {
        $this->tag = $tag;
        $this->default_attributes = $default_attributes;
    }

    /**
     * Register the shortcode
     */
    public function register(): void
    {
        add_shortcode($this->tag, [$this, 'render']);
    }

    /**
     * Render the shortcode
     */
    public function render(array $atts = []): string
    {
        $atts = shortcode_atts($this->default_attributes, $atts, $this->tag);

        try {
            return $this->renderContent($atts);
        } catch (\Exception $e) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                return sprintf(
                    '<div class="yatra-error">Shortcode Error: %s</div>',
                    esc_html($e->getMessage())
                );
            }
            return '';
        }
    }

    /**
     * Render the shortcode content
     * Must be implemented by child classes
     */
    abstract protected function renderContent(array $atts): string;

    /**
     * Get the shortcode tag
     */
    public function getTag(): string
    {
        return $this->tag;
    }

    /**
     * Load a template file
     */
    protected function loadTemplate(string $template_path, array $data = []): string
    {
        $full_path = $this->getTemplatePath($template_path);
        
        if (!file_exists($full_path)) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                return sprintf(
                    '<div class="yatra-error">Template not found: %s</div>',
                    esc_html($full_path)
                );
            }
            return '';
        }

        // Extract data to make variables available in template
        if (!empty($data)) {
            extract($data);
        }

        ob_start();
        include $full_path;
        return ob_get_clean();
    }

    /**
     * Get plugin template path
     */
    protected function getTemplatePath(string $template): string
    {
        return YATRA_PLUGIN_PATH . 'templates/' . $template;
    }
}
