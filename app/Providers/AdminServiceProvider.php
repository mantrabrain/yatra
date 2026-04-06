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
    private const UPGRADE_TO_PRO_URL = 'https://wpyatra.com/pricing';

    /**
     * Register services
     */
    public function register(): void
    {
        // Register admin menu
        add_action('admin_menu', [$this, 'registerAdminMenu']);
        // After core + other Yatra submenus register; append external “Upgrade” link (avoids add_submenu_page plugin_basename mangling URLs).
        add_action('admin_menu', [$this, 'registerUpgradeProExternalSubmenu'], 100);

        add_filter('plugin_action_links_' . YATRA_PLUGIN_BASENAME, [$this, 'addPluginUpgradeLink']);
        add_filter('plugin_row_meta', [$this, 'filterPluginRowMeta'], 10, 4);

        // Enqueue admin assets - use priority 20 to run after WordPress core
        add_action('admin_enqueue_scripts', [$this, 'enqueueAdminAssets'], 20);
        
        // Add module type to script tag
        add_filter('script_loader_tag', [$this, 'addModuleTypeToScript'], 10, 2);
        
        // Remove admin wrapper for our page
        add_action('admin_init', [$this, 'removeAdminWrapper']);

        add_action('admin_head', [$this, 'printUpgradeProAdminStyles']);
        add_action('admin_head', [$this, 'printYatraAdminMenuIconStyles']);
        add_action('admin_footer', [$this, 'upgradeProSubmenuOpenInNewTab']);
    }

    /**
     * Size the custom Yatra menu icon (PNG) like core dashicons.
     */
    public function printYatraAdminMenuIconStyles(): void
    {
        if (!function_exists('yatra_get_brand_icon_url') || yatra_get_brand_icon_url() === '') {
            return;
        }

        echo '<style id="yatra-admin-menu-brand-icon">#adminmenu .toplevel_page_yatra div.wp-menu-image img{opacity:1!important;width:20px!important;height:20px!important;padding:6px 0!important;object-fit:contain!important;}</style>';
    }

    /**
     * “Upgrade to Pro” on the Plugins list (free only).
     *
     * @param array<int,string> $links
     * @return array<int,string>
     */
    public function addPluginUpgradeLink(array $links): array
    {
        if (apply_filters('yatra_is_pro_active', false)) {
            return $links;
        }

        $upgrade = sprintf(
            '<a href="%s" class="yatra-upgrade-to-pro-link" target="_blank" rel="noopener noreferrer">%s</a>',
            esc_url(self::UPGRADE_TO_PRO_URL),
            esc_html__('Upgrade to Pro', 'yatra')
        );

        array_unshift($links, $upgrade);

        return $links;
    }

    /**
     * Plugins list row meta: Version, By MantraBrain, View details, Support, Plugin Homepage, Contact, Rate (5★).
     *
     * @param string[]              $plugin_meta
     * @param array<string, mixed> $plugin_data
     * @return string[]
     */
    public function filterPluginRowMeta(array $plugin_meta, string $plugin_file, array $plugin_data, string $status): array
    {
        if ($plugin_file !== YATRA_PLUGIN_BASENAME) {
            return $plugin_meta;
        }

        $home = 'https://wpyatra.com/';
        $org_plugin_page = 'https://wordpress.org/plugins/yatra/';
        $support_url = 'https://wordpress.org/support/plugin/yatra/reviews/?filter=5';
        $contact_url = 'https://mantrabrain.com/contact';
        $rate_url = 'https://wordpress.org/support/plugin/yatra/reviews/#new-post';

        $row = [];

        if (!empty($plugin_data['Version'])) {
            $row[] = sprintf(
                /* translators: %s: plugin version number. */
                __('Version %s'),
                $plugin_data['Version']
            );
        }

        $row[] = sprintf(
            /* translators: %s: linked author name (HTML). */
            __('By %s'),
            '<a href="' . esc_url($home) . '" target="_blank" rel="noopener noreferrer">MantraBrain</a>'
        );

        $row[] = sprintf(
            '<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
            esc_url($org_plugin_page),
            esc_html__('View details', 'yatra')
        );

        $row[] = sprintf(
            '<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
            esc_url($support_url),
            esc_html__('Support', 'yatra')
        );

        $row[] = sprintf(
            '<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
            esc_url($home),
            esc_html__('Plugin Homepage', 'yatra')
        );

        $row[] = sprintf(
            '<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
            esc_url($contact_url),
            esc_html__('Contact', 'yatra')
        );

        $row[] = sprintf(
            '<a href="%s" target="_blank" rel="noopener noreferrer">%s <span aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</span></a>',
            esc_url($rate_url),
            esc_html__('Rate the plugin', 'yatra')
        );

        return $row;
    }

    /**
     * Amber styling for Upgrade to Pro (admin menu + plugins list).
     */
    public function printUpgradeProAdminStyles(): void
    {
        if (apply_filters('yatra_is_pro_active', false)) {
            return;
        }

        if (!is_admin()) {
            return;
        }

        $screen = function_exists('get_current_screen') ? get_current_screen() : null;
        $onPlugins = $screen && $screen->id === 'plugins';

        $pricingHref = esc_attr(self::UPGRADE_TO_PRO_URL);

        // Plain link emphasis only (same layout as other submenu items / plugin row links).
        // Bright orange, bold — reads clearly on default admin submenu and Plugins screen (no button chrome).
        echo '<style id="yatra-upgrade-pro-styles">'
            . '#adminmenu .toplevel_page_yatra .wp-submenu a[href="' . $pricingHref . '"]{color:#f97316!important;font-weight:700!important;}'
            . '#adminmenu .toplevel_page_yatra .wp-submenu a[href="' . $pricingHref . '"]:hover{color:#ea580c!important;}'
            . ($onPlugins
                ? '.plugins-php .yatra-upgrade-to-pro-link{color:#f97316!important;font-weight:700!important;}'
                . '.plugins-php .yatra-upgrade-to-pro-link:hover{color:#ea580c!important;}'
                : '')
            . '</style>';
    }

    /**
     * Open pricing link in a new tab (submenu HTML is generated by core without target="_blank").
     */
    public function upgradeProSubmenuOpenInNewTab(): void
    {
        if (apply_filters('yatra_is_pro_active', false)) {
            return;
        }

        if (!is_admin()) {
            return;
        }

        $url = wp_json_encode(self::UPGRADE_TO_PRO_URL, JSON_UNESCAPED_SLASHES);
        echo '<script>(function(){var u=' . $url . ";document.querySelectorAll('#adminmenu .toplevel_page_yatra .wp-submenu a[href=\"'+u+'\"]').forEach(function(a){a.target='_blank';a.rel='noopener noreferrer';});})();</script>";
    }

    /**
     * Direct external submenu link (WordPress prints href from slug when it is not a registered admin page file).
     *
     * @global array<string,array<int,array<int,mixed>>> $submenu
     */
    public function registerUpgradeProExternalSubmenu(): void
    {
        if (apply_filters('yatra_is_pro_active', false)) {
            return;
        }

        global $submenu;
        if (!isset($submenu['yatra']) || !is_array($submenu['yatra'])) {
            return;
        }

        $submenu['yatra'][] = [
            esc_html__('Upgrade to Pro', 'yatra'),
            'manage_options',
            self::UPGRADE_TO_PRO_URL,
            esc_html__('Upgrade to Pro', 'yatra'),
        ];
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
        $menu_icon = (function_exists('yatra_get_brand_icon_url') && yatra_get_brand_icon_url() !== '')
            ? yatra_get_brand_icon_url()
            : 'dashicons-palmtree';

        add_menu_page(
            __('Yatra', 'yatra'),
            __('Yatra', 'yatra'),
            'manage_options',
            'yatra',
            [$this, 'renderAdminPage'],
            $menu_icon,
            30
        );

        // WordPress would otherwise add a first submenu also titled "Yatra" (duplicate of the parent).
        // A submenu with the same slug as the parent replaces that entry with a distinct label.
        add_submenu_page(
            'yatra',
            __('Yatra Dashboard', 'yatra'),
            __('Dashboard', 'yatra'),
            'manage_options',
            'yatra',
            [$this, 'renderAdminPage']
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

