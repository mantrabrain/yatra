<?php

declare(strict_types=1);

namespace Yatra\Providers;

use Yatra\Blocks\TourBlock;
use Yatra\Blocks\ActivityBlock;
use Yatra\Blocks\DestinationBlock;
use Yatra\Blocks\TripCategoryBlock;
use Yatra\Blocks\AbstractServerBlock;
use Yatra\Blocks\BlockPatterns;
use Yatra\Blocks\DealsBlock;
use Yatra\Blocks\LoginBlock;
use Yatra\Blocks\MyAccountBlock;
use Yatra\Blocks\TripBookingBlock;
use Yatra\Blocks\TripFactsBlock;
use Yatra\Blocks\TripFaqBlock;
use Yatra\Blocks\TripGalleryBlock;
use Yatra\Blocks\TripIncludesBlock;
use Yatra\Blocks\TripItineraryBlock;
use Yatra\Blocks\TripMapBlock;
use Yatra\Blocks\TripReviewsBlock;
use Yatra\Blocks\TripSearchBlock;
use Yatra\Compatibility\Elementor\WidgetManager as ElementorWidgets;
use Yatra\Core\Container;
use Yatra\Core\ServiceProvider;

/**
 * Block Service Provider
 * 
 * Registers all Gutenberg blocks for Yatra
 * Maintains backward compatibility with old plugin blocks
 * 
 * @package Yatra\Providers
 * @since 3.0.0
 */
class BlockServiceProvider extends ServiceProvider
{
    public function __construct(Container $container)
    {
        parent::__construct($container);
    }

    /**
     * Register blocks
     */
    public function register(): void
    {
        // Priority 100 so other plugins (or old stubs) register first; we reclaim + register full assets last.
        if (did_action('init')) {
            $this->registerBlocksOnInit();
        } else {
            add_action('init', [$this, 'registerBlocksOnInit'], 100);
        }
        
        // Register Yatra block category
        add_filter('block_categories_all', [$this, 'registerBlockCategory'], 10, 2);

        // Themes/plugins that turn off on-demand block assets (classic themes,
        // Elementor) make WordPress enqueue every registered block's style and
        // script on every page. Drop Yatra's on pages without Yatra content; a
        // Yatra block that does render re-enqueues them (WP_Block::render()).
        add_action('wp_enqueue_scripts', [$this, 'dequeueUnusedBlockAssets'], 100);

        // Block patterns (Appearance → Editor / inserter "Patterns" → Yatra).
        add_action('init', [BlockPatterns::class, 'register'], 110);

        // Elementor widgets for the same blocks — only when Elementor is active.
        if (did_action('elementor/loaded')) {
            ElementorWidgets::register();
        } else {
            add_action('elementor/loaded', [ElementorWidgets::class, 'register']);
        }
    }

    /**
     * Dequeue yatra/* block style/script handles WordPress queued globally
     * (enqueue_block_assets with on-demand loading off) on a page that shows no
     * Yatra content. Pages with Yatra content keep loading them in <head> as before.
     *
     * @since 3.1.4
     */
    public function dequeueUnusedBlockAssets(): void
    {
        if (is_admin() || \Yatra\Providers\FrontendAssetsProvider::shouldLoadOnThisRequest()) {
            return;
        }
        if (function_exists('wp_should_load_block_assets_on_demand') && wp_should_load_block_assets_on_demand()) {
            return;
        }

        foreach (\WP_Block_Type_Registry::get_instance()->get_all_registered() as $name => $type) {
            if (strpos((string) $name, 'yatra/') !== 0) {
                continue;
            }
            foreach ((array) ($type->style_handles ?? []) as $handle) {
                wp_dequeue_style($handle);
            }
            foreach (array_merge((array) ($type->script_handles ?? []), (array) ($type->view_script_handles ?? [])) as $handle) {
                wp_dequeue_script($handle);
            }
        }
    }

    /**
     * Server-rendered blocks added in 3.1.4 (also rendered by the Elementor widgets).
     *
     * @return list<AbstractServerBlock>
     */
    public static function serverBlocks(): array
    {
        static $blocks = null;
        if ($blocks === null) {
            $blocks = [
                new TripSearchBlock(),
                new DealsBlock(),
                new LoginBlock(),
                new MyAccountBlock(),
                new TripGalleryBlock(),
                new TripItineraryBlock(),
                new TripFactsBlock(),
                new TripBookingBlock(),
                new TripFaqBlock(),
                new TripIncludesBlock(),
                new TripMapBlock(),
                new TripReviewsBlock(),
            ];
        }

        return $blocks;
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
        new TripCategoryBlock();

        foreach (self::serverBlocks() as $block) {
            $block->register();
        }
    }
    
    /**
     * Register Yatra block category
     * 
     * @param array $categories Existing block categories
     * @param \WP_Block_Editor_Context|null $context Block editor context
     * @return array Modified categories
     */
    public function registerBlockCategory(array $categories, ?\WP_Block_Editor_Context $context = null): array
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
