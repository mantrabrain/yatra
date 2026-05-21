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
        // White-label-specific hooks (all_plugins rebrand, dependency name
        // rewrite, brand-color CSS injection) live in Pro's WhiteLabel
        // module — see yatra-pro/app/Modules/WhiteLabel/Hooks/AdminHooks.php.
        // The plugin_row_meta filter above stays here because it serves a
        // dual purpose (links + version row); white-label conditional logic
        // inside it reads filter-backed brand helpers, so Pro overrides it
        // transparently without owning the hook.

        // Enqueue admin assets - use priority 20 to run after WordPress core
        add_action('admin_enqueue_scripts', [$this, 'enqueueAdminAssets'], 20);
        
        // Add module type to script tag
        add_filter('script_loader_tag', [$this, 'addModuleTypeToScript'], 10, 2);
        
        // Remove admin wrapper for our page
        add_action('admin_init', [$this, 'removeAdminWrapper']);

        add_action('admin_print_styles', [$this, 'printYatraReactAdminCriticalCss'], 0);
        add_filter('admin_body_class', [$this, 'filterYatraReactAdminBodyClass']);
        add_action('admin_head', [$this, 'printUpgradeProAdminStyles']);
        add_action('admin_head', [$this, 'printYatraAdminMenuIconStyles']);
        add_action('admin_head', [$this, 'printHideYatraSetupWizardSubmenu']);
        add_action('admin_footer', [$this, 'upgradeProSubmenuOpenInNewTab']);
    }

    /**
     * Whether the current request is the main Yatra React admin screen (admin.php?page=yatra).
     */
    private function isYatraMainReactAdminScreen(): bool
    {
        if (!is_admin()) {
            return false;
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- screen detection only
        if (isset($_GET['page']) && $_GET['page'] === 'yatra') {
            return true;
        }

        $screen = function_exists('get_current_screen') ? get_current_screen() : null;

        return $screen && $screen->id === 'toplevel_page_yatra';
    }

    /**
     * Critical CSS + dark-mode init in &lt;head&gt; (before body) to prevent FOUC / flicker of native wp-admin chrome.
     *
     * Previously this lived in templates/admin.php (body), so the menu painted before hide rules applied.
     */
    public function printYatraReactAdminCriticalCss(): void
    {
        if (!$this->isYatraMainReactAdminScreen()) {
            return;
        }

        $app_js = YATRA_PLUGIN_PATH . 'assets/admin/dist/js/app.js';
        $has_build = file_exists($app_js);

        ?>
<script id="yatra-admin-dark-init">
(function(){var d=localStorage.getItem('yatra-dark-mode');if(d==='true'){document.documentElement.classList.add('dark');}})();
</script>
<style id="yatra-react-admin-critical">
    #wpadminbar,
    #adminmenumain,
    #adminmenuback,
    #adminmenuwrap,
    #wpfooter,
    #screen-meta,
    #screen-meta-links {
        display: none !important;
    }

    #wpcontent {
        margin-left: 0 !important;
        padding: 0 !important;
    }

    #wpbody,
    #wpbody-content {
        margin: 0 !important;
        padding: 0 !important;
        padding-top: 0 !important;
    }

    .wrap {
        margin: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
    }

    html,
    body.wp-admin {
        margin: 0 !important;
        padding: 0 !important;
        height: 100% !important;
        overflow: <?php echo $has_build ? 'hidden' : 'auto'; ?> !important;
    }

    /* Match React Layout shell (gray-50 / gray-900) so the pre-JS phase is not a flat white flash */
    body.yatra-react-admin-shell {
        background: #f9fafb !important;
    }

    html.dark body.yatra-react-admin-shell {
        background: #111827 !important;
    }

    #yatra-app-root {
        width: 100vw;
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
        z-index: 99999;
        background: #f9fafb;
    }

    html.dark #yatra-app-root {
        background: #111827;
    }

    /* HTML/CSS-only boot UI (no JS); React replaces #yatra-app-root contents on mount */
    .yatra-admin-boot-splash {
        box-sizing: border-box;
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 1rem;
        z-index: 1;
    }

    .yatra-admin-boot-spinner {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid rgba(79, 70, 229, 0.2);
        border-top-color: #4f46e5;
        animation: yatra-boot-spin 0.7s linear infinite;
    }

    html.dark .yatra-admin-boot-spinner {
        border-color: rgba(129, 140, 248, 0.25);
        border-top-color: #a5b4fc;
    }

    .yatra-admin-boot-text {
        margin: 0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        color: #6b7280;
    }

    html.dark .yatra-admin-boot-text {
        color: #9ca3af;
    }

    @keyframes yatra-boot-spin {
        to {
            transform: rotate(360deg);
        }
    }

    .yatra-build-message {
        padding: 40px;
        text-align: center;
        max-width: 800px;
        margin: 50px auto;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .yatra-build-message h1 {
        margin-bottom: 20px;
        color: #333;
    }

    .yatra-build-message code {
        display: block;
        background: #f5f5f5;
        padding: 15px;
        margin: 15px 0;
        border-radius: 4px;
        text-align: left;
        border-left: 4px solid #0073aa;
    }
</style>
        <?php
    }

    /**
     * Marker class for the React shell (optional hooks / debugging).
     *
     * @param string $classes Space-separated classes.
     */
    public function filterYatraReactAdminBodyClass(string $classes): string
    {
        if ($this->isYatraMainReactAdminScreen()) {
            $classes .= ' yatra-react-admin-shell';
        }

        return $classes;
    }

    /**
     * Hide Setup Wizard in the Yatra submenu while keeping it registered (required for direct URL access).
     */
    public function printHideYatraSetupWizardSubmenu(): void
    {
        if (!apply_filters('yatra_enable_setup_wizard', true)) {
            return;
        }

        if (!apply_filters('yatra_hide_setup_wizard_submenu', true)) {
            return;
        }

        echo '<style id="yatra-hide-setup-submenu">'
            . '#adminmenu .toplevel_page_yatra .wp-submenu li:has(> a[href*="page=yatra-setup"]){display:none!important;}'
            . '</style>';
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

        $is_white_label = function_exists('yatra_is_white_label_active') && yatra_is_white_label_active();
        $brand_company = function_exists('yatra_get_brand_company') ? yatra_get_brand_company() : 'MantraBrain';
        $brand_home = function_exists('yatra_get_brand_website_url') ? yatra_get_brand_website_url() : 'https://wpyatra.com/';
        $brand_support = function_exists('yatra_get_brand_support_url') ? yatra_get_brand_support_url() : 'https://wordpress.org/support/plugin/yatra/reviews/?filter=5';

        $home = $brand_home;
        $org_plugin_page = 'https://wordpress.org/plugins/yatra/';
        $support_url = $brand_support;
        $contact_url = $brand_home;
        $rate_url = 'https://wordpress.org/support/plugin/yatra/reviews/?filter=5';

        $row = [];

        if (!empty($plugin_data['Version'])) {
            $row[] = sprintf(
                /* translators: %s: plugin version number. */
                __('Version %s', 'yatra'),
                $plugin_data['Version']
            );
        }

        $row[] = sprintf(
            /* translators: %s: linked author name (HTML). */
            __('By %s', 'yatra'),
            '<a href="' . esc_url($home) . '" target="_blank" rel="noopener noreferrer">' . esc_html($brand_company) . '</a>'
        );

        // White-label sites should not link clients off to wp.org / Yatra rating
        // pages. Show only the agency's own support + homepage links.
        if (!$is_white_label) {
            $row[] = sprintf(
                '<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
                esc_url($org_plugin_page),
                esc_html__('View details', 'yatra')
            );
        }

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

        if (!$is_white_label) {
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
        }

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

        $brand_name = function_exists('yatra_get_brand_name') ? yatra_get_brand_name() : 'Yatra';

        add_menu_page(
            $brand_name,
            $brand_name,
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
            /* translators: %s: branded plugin name. */
            sprintf(__('%s Dashboard', 'yatra'), $brand_name),
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

