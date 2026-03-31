<?php

declare(strict_types=1);

namespace Yatra\Providers;

use Yatra\Core\ServiceProvider;
use Yatra\Core\Container;
use Yatra\Core\Modules\ModuleManager;

/**
 * Admin Service Provider
 * Handles admin menu, assets, and pages
 */
class AdminServiceProvider extends ServiceProvider
{
    /**
     * Register services
     */
    public function register(): void
    {
        // Register admin menu
        add_action('admin_menu', [$this, 'registerAdminMenu']);

        // Enqueue admin assets - use priority 20 to run after WordPress core
        add_action('admin_enqueue_scripts', [$this, 'enqueueAdminAssets'], 20);
        
        // Add module type to script tag
        add_filter('script_loader_tag', [$this, 'addModuleTypeToScript'], 10, 2);
        
        // Remove admin wrapper for our page
        add_action('admin_init', [$this, 'removeAdminWrapper']);
    }
    
    /**
     * Add type="module" attribute to yatra-admin script
     */
    public function addModuleTypeToScript(string $tag, string $handle): string
    {
        if ($handle === 'yatra-admin') {
            // Check if type="module" is already present
            if (strpos($tag, 'type="module"') === false && strpos($tag, "type='module'") === false) {
                // Replace the script tag to add type="module"
                $tag = str_replace('<script ', '<script type="module" ', $tag);
            }
        }
        return $tag;
    }
    
    /**
     * Remove WordPress admin wrapper for Yatra page
     */
    public function removeAdminWrapper(): void
    {
        $screen = get_current_screen();
        if ($screen && $screen->id === 'toplevel_page_yatra') {
            // Remove admin notices wrapper
            remove_action('admin_notices', 'wp_admin_notices');
        }
    }

    /**
     * Register admin menu
     */
    public function registerAdminMenu(): void
    {
        add_menu_page(
            __('Yatra', 'yatra'),
            __('Yatra', 'yatra'),
            'manage_options',
            'yatra',
            [$this, 'renderAdminPage'],
            'dashicons-palmtree',
            30
        );
    }

    /**
     * Enqueue admin assets
     */
    public function enqueueAdminAssets(string $hook): void
    {
        // Use centralized AdminAssetsProvider
        $adminAssetsProvider = new \Yatra\Providers\AdminAssetsProvider();
        $adminAssetsProvider->enqueueAssets($hook);
    }


    /**
     * Render admin page
     */
    public function renderAdminPage(): void
    {
        // Load admin template
        $template = YATRA_PLUGIN_PATH . 'templates/admin.php';
        
        if (file_exists($template)) {
            include $template;
        } else {
            echo '<div class="wrap"><h1>Yatra Admin</h1><p>Admin template not found.</p></div>';
        }
    }
}

