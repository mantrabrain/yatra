<?php

declare(strict_types=1);

namespace Yatra\Providers;

use Yatra\Blocks\TourBlock;
use Yatra\Blocks\ActivityBlock;
use Yatra\Blocks\DestinationBlock;

/**
 * Block Service Provider
 * 
 * Registers all Gutenberg blocks for Yatra
 * Maintains backward compatibility with old plugin blocks
 * 
 * @package Yatra\Providers
 * @since 3.0.0
 */
class BlockServiceProvider
{
    /**
     * Register blocks
     */
    public function register(): void
    {
        // Register blocks on init hook when WordPress is ready
        add_action('init', [$this, 'registerBlocksOnInit'], 10);
        
        // Register Yatra block category
        add_filter('block_categories_all', [$this, 'registerBlockCategory'], 10, 2);
    }
    
    /**
     * Register blocks on init hook
     */
    public function registerBlocksOnInit(): void
    {
        // Initialize all blocks
        new TourBlock();
        new ActivityBlock();
        new DestinationBlock();
    }
    
    /**
     * Register Yatra block category
     * 
     * @param array $categories Existing block categories
     * @param \WP_Block_Editor_Context $context Block editor context
     * @return array Modified categories
     */
    public function registerBlockCategory(array $categories, \WP_Block_Editor_Context $context): array
    {
        // Add Yatra category at the beginning
        array_unshift($categories, [
            'slug' => 'yatra',
            'title' => __('Yatra', 'yatra'),
            'icon' => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" fill="currentColor"/></svg>',
        ]);
        
        return $categories;
    }
}
