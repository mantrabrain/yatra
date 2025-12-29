<?php

declare(strict_types=1);

namespace Yatra\Core\Assets;

/**
 * Base Asset Manager
 *
 * Handles asset enqueuing for different page types
 */
abstract class BaseAssetManager
{
    /**
     * Page type this manager handles
     */
    protected string $page_type;

    /**
     * Asset handles to enqueue
     */
    protected array $styles = [];
    protected array $scripts = [];

    /**
     * Localize data for scripts
     */
    protected array $localize_data = [];

    /**
     * Constructor
     */
    public function __construct(string $page_type)
    {
        $this->page_type = $page_type;
    }

    /**
     * Enqueue assets for this page type
     */
    public function enqueueAssets(): void
    {
        $this->enqueueStyles();
        $this->enqueueScripts();
        $this->localizeScripts();
    }

    /**
     * Enqueue styles
     */
    protected function enqueueStyles(): void
    {
        foreach ($this->styles as $handle) {
            wp_enqueue_style($handle);
        }
    }

    /**
     * Enqueue scripts
     */
    protected function enqueueScripts(): void
    {
        foreach ($this->scripts as $handle) {
            wp_enqueue_script($handle);
        }
    }

    /**
     * Localize scripts with data
     */
    protected function localizeScripts(): void
    {
        foreach ($this->localize_data as $script_handle => $data) {
            wp_localize_script($script_handle, $data['object_name'], $data['data']);
        }
    }

    /**
     * Add style to enqueue
     */
    protected function addStyle(string $handle): void
    {
        $this->styles[] = $handle;
    }

    /**
     * Add script to enqueue
     */
    protected function addScript(string $handle): void
    {
        $this->scripts[] = $handle;
    }

    /**
     * Add localization data
     */
    protected function addLocalization(string $script_handle, string $object_name, array $data): void
    {
        $this->localize_data[$script_handle] = [
            'object_name' => $object_name,
            'data' => $data
        ];
    }

    /**
     * Get page type
     */
    public function getPageType(): string
    {
        return $this->page_type;
    }
}
