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
    /**
     * Constructor
     */
    public function __construct()
    {
        // Register block immediately - BlockServiceProvider handles timing
        $this->register();
    }

    /**
     * Get block attributes
     * Matches old plugin structure for backward compatibility
     * 
     * @return array Block attributes definition
     */
    public function getAttributes(): array
    {
        return [
            'order' => [
                'type' => 'string',
                'default' => 'asc',
            ],
            'columns' => [
                'type' => 'number',
                'default' => 3,
            ],
            'per_page' => [
                'type' => 'number',
                'default' => -1,
            ],
            'title' => [
                'type' => 'string',
                'default' => 'Activity Listings',
            ],
            'show_pagination' => [
                'type' => 'boolean',
                'default' => true,
            ],
        ];
    }

    /**
     * Block render callback
     * Uses BlockDataService to share logic with shortcodes
     * 
     * @param array $attributes Block attributes
     * @param string $content Block content
     * @return string Rendered HTML
     */
    public function renderCallback(array $attributes, string $content): string
    {
        // Explicitly enqueue the styles needed for frontend display (same as shortcode)
        wp_enqueue_style('yatra-activity-shortcode', \YATRA_PLUGIN_URL . 'assets/css/shortcodes/activity-shortcode.css', array(), '3.0.0');
        
        // Use the shared service to render the block with real data
        return BlockDataService::renderActivityBlock($attributes);
    }

    /**
     * Register the block
     * Uses same block name as old plugin for backward compatibility
     */
    public function register(): void
    {
        // Check if block is already registered to prevent duplicates
        if (\WP_Block_Type_Registry::get_instance()->is_registered('yatra/activity')) {
            return;
        }
        
        // Register the block script
        wp_register_script(
            'yatra-activity-block-editor',
            \YATRA_PLUGIN_URL . 'resources/js/blocks/activity/block.js',
            ['wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n'],
            '3.0.0',
            true
        );

        // Enqueue listing CSS for editor
        wp_register_style(
            'yatra-listing',
            \YATRA_PLUGIN_URL . 'assets/css/listing.css',
            array(),
            '3.0.0'
        );
        
        // Enqueue shortcode-specific CSS (same as shortcode)
        wp_register_style(
            'yatra-activity-shortcode',
            \YATRA_PLUGIN_URL . 'assets/css/shortcodes/activity-shortcode.css',
            array(),
            '3.0.0'
        );
        
        // Enqueue activity shortcode JavaScript
        wp_register_script(
            'yatra-activity-shortcode',
            \YATRA_PLUGIN_URL . 'assets/js/activity-shortcode.js',
            array('jquery'),
            '3.0.0',
            true
        );
        
        // Register the block type
        register_block_type('yatra/activity', [
            'api_version' => 3,
            'title' => __('Activity', 'yatra'),
            'version' => '3.0.1', // Force refresh
            'category' => 'yatra',
            'description' => __('Display activity listings with customizable options', 'yatra'),
            'icon' => 'buddicons-pm',
            'keywords' => ['activity', 'things to do', 'yatra'],
            'attributes' => $this->getAttributes(),
            'render_callback' => [$this, 'renderCallback'],
            'editor_script' => 'yatra-activity-block-editor',
            'editor_style' => ['yatra-listing', 'yatra-activity-shortcode'],
            'style' => ['yatra-activity-shortcode'],
            'script' => ['yatra-activity-shortcode'],
            'supports' => [
                'align' => ['wide', 'full'],
                'html' => false,
            ],
        ]);
    }
}
