<?php

declare(strict_types=1);

namespace Yatra\Blocks;

use Yatra\Services\BlockDataService;

/**
 * Tour Block
 * 
 * Gutenberg block for displaying tour/trip packages
 * Maintains backward compatibility with old yatra/tour block
 * 
 * @package Yatra\Blocks
 * @since 3.0.0
 */
class TourBlock
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
                'default' => 'desc',
            ],
            'featured' => [
                'type' => 'boolean',
                'default' => false,
            ],
            'per_page' => [
                'type' => 'number',
                'default' => 10,
            ],
            'columns' => [
                'type' => 'number',
                'default' => 3,
            ],
            'title' => [
                'type' => 'string',
                'default' => 'Our Trips',
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
        wp_enqueue_style('yatra-trip-shortcode', \YATRA_PLUGIN_URL . 'assets/css/shortcodes/trip-shortcode.css', array(), '3.0.0');
        
        // Use the shared service to render the block with real data
        return BlockDataService::renderTripBlock($attributes);
    }

    /**
     * Register the block
     * Uses same block name as old plugin for backward compatibility
     */
    public function register(): void
    {
        // Check if block is already registered
        if (\WP_Block_Type_Registry::get_instance()->is_registered('yatra/tour')) {
            return;
        }

        // Register the block script
        wp_register_script(
            'yatra-tour-block-editor',
            \YATRA_PLUGIN_URL . 'resources/js/blocks/tour/block.js',
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
        
        // Enqueue shortcode-specific CSS (same as BlockDataService)
        wp_register_style(
            'yatra-trip-shortcode',
            \YATRA_PLUGIN_URL . 'assets/css/shortcodes/trip-shortcode.css',
            array(),
            '3.0.0'
        );
        
        // Enqueue trip shortcode JavaScript
        wp_register_script(
            'yatra-trip-shortcode',
            \YATRA_PLUGIN_URL . 'assets/js/trip-shortcode.js',
            array('jquery'),
            '3.0.0',
            true
        );

        // Register the block
        $result = register_block_type('yatra/tour', [
            'api_version' => 3,
            'title' => 'Trip',
            'version' => '3.0.1', // Force refresh
            'category' => 'yatra',
            'description' => 'Display trip listings with customizable options',
            'icon' => 'palmtree',
            'keywords' => ['tour', 'trip', 'travel', 'yatra'],
            'attributes' => $this->getAttributes(),
            'render_callback' => [$this, 'renderCallback'],
            'editor_script' => 'yatra-tour-block-editor',
            'editor_style' => ['yatra-listing', 'yatra-trip-shortcode'],
            'style' => ['yatra-trip-shortcode'],
            'script' => ['yatra-trip-shortcode'],
            'supports' => [
                'align' => ['wide', 'full'],
                'html' => false,
            ],
        ]);
    }
}
