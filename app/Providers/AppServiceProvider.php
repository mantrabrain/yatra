<?php

declare(strict_types=1);

namespace Yatra\Providers;

use Yatra\Core\ServiceProvider;
use Yatra\Core\Container;
use Yatra\Core\Modules\ModuleManager;

/**
 * Application Service Provider
 * Handles general plugin initialization
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Register services
     */
    public function register(): void
    {
        // Register core services
        $this->container->singleton('database', function() {
            // Database connection can be registered here
            return new \stdClass();
        });
    }

    /**
     * Boot services
     */
    public function boot(): void
    {
        // Load text domain
        add_action('plugins_loaded', [$this, 'loadTextDomain']);

        // Initialize plugin settings
        add_action('init', [$this, 'initSettings'], 5);

        // Register frontend account page - use early priority to catch before 404
        add_action('template_redirect', [$this, 'handleAccountPage'], 1);

        // Ensure frontend bundles are marked as ES modules
        add_filter('script_loader_tag', [$this, 'addFrontendModuleType'], 10, 2);
    }

    /**
     * Load plugin text domain
     */
    public function loadTextDomain(): void
    {
        load_plugin_textdomain(
            'yatra',
            false,
            dirname(YATRA_PLUGIN_BASENAME) . '/resources/lang'
        );
    }

    /**
     * Initialize plugin settings
     */
    public function initSettings(): void
    {
        // Set default options if not exist
        if (get_option('yatra_version') === false) {
            add_option('yatra_version', YATRA_VERSION);
        }

        ModuleManager::initializeDefaults();
    }

    /**
     * Handle frontend account page
     */
    public function handleAccountPage(): void
    {
        // Get account page slug from settings (default fallback)
        $account_page_slug = get_option('yatra_customer_account_page', '');
        if ($account_page_slug === '' || $account_page_slug === false) {
            // Backward compatibility with legacy combined option
            $legacy_settings = get_option('yatra_settings', []);
            if (is_array($legacy_settings) && !empty($legacy_settings['customer_account_page'])) {
                $account_page_slug = $legacy_settings['customer_account_page'];
            }
        }
        if ($account_page_slug === '' || $account_page_slug === false) {
            $account_page_slug = '/my-account';
        }
        $account_page_slug = trim($account_page_slug);
        if ($account_page_slug === '') {
            $account_page_slug = 'my-account';
        }
        $normalized_slug = trim($account_page_slug, '/');

        // Determine current request path relative to site root
        $request_path = '';
        global $wp;
        if (isset($wp) && isset($wp->request)) {
            $request_path = trim((string) $wp->request, '/');
        }

        if ($request_path === '') {
            $request_uri = $_SERVER['REQUEST_URI'] ?? '';
            $parsed_uri = wp_parse_url($request_uri);
            $path = $parsed_uri['path'] ?? '';
            $path = trim($path, '/');

            // Remove site subdirectory (if WordPress is installed in subdir)
            $home_path = wp_parse_url(home_url('/'), PHP_URL_PATH);
            $home_path = $home_path ? trim($home_path, '/') : '';
            if ($home_path && str_starts_with($path, $home_path)) {
                $path = trim(substr($path, strlen($home_path)), '/');
            }
            $request_path = $path;
        }

        // Debug logging
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(sprintf(
                'Yatra Account Page Check - Slug: "%s", Request Path: "%s"',
                $normalized_slug,
                $request_path
            ));
        }

        if ($request_path === trim($normalized_slug, '/')) {
            // Prevent 404 handling
            global $wp_query;
            $wp_query->is_404 = false;
            status_header(200);

            // Load the account page template
            $template = YATRA_PLUGIN_PATH . 'templates/account-page.php';
            
            if (file_exists($template)) {
                // Enqueue account page assets directly
                $this->enqueueAccountPageAssets();
                
                // Load template
                include $template;
                exit;
            } else {
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log('Yatra: Account page template not found at: ' . $template);
                }
            }
        }
    }

    /**
     * Enqueue account page assets
     */
    public function enqueueAccountPageAssets(): void
    {
        // Check for CSS file (could be app.css or index.css)
        $css_files = [
            YATRA_PLUGIN_PATH . 'public/css/app.css',
            YATRA_PLUGIN_PATH . 'public/css/index.css',
        ];
        
        $css_file = null;
        foreach ($css_files as $file) {
            if (file_exists($file)) {
                $css_file = $file;
                break;
            }
        }
        
        if ($css_file) {
            $css_url = str_replace(YATRA_PLUGIN_PATH, YATRA_PLUGIN_URL, $css_file);
            $css_version = YATRA_VERSION . '.' . filemtime($css_file);
            wp_enqueue_style(
                'yatra-account-page',
                $css_url,
                [],
                $css_version
            );
            
            // Add critical inline styles to ensure layout works
            $inline_css = '
                #yatra-account-page-root .flex.flex-col.lg\\:flex-row {
                    display: flex !important;
                }
                #yatra-account-page-root aside {
                    display: block !important;
                    visibility: visible !important;
                }
                #yatra-account-page-root section {
                    display: block !important;
                    visibility: visible !important;
                    flex: 1 1 0% !important;
                }
                @media (min-width: 1024px) {
                    #yatra-account-page-root .lg\\:flex-row {
                        flex-direction: row !important;
                    }
                    #yatra-account-page-root .lg\\:w-64 {
                        width: 16rem !important;
                        flex-shrink: 0 !important;
                    }
                }
            ';
            wp_add_inline_style('yatra-account-page', $inline_css);
        }
        
        // Check for account page JS
        $account_js = YATRA_PLUGIN_PATH . 'public/js/account-page.js';
        
        if (file_exists($account_js)) {
            $js_version = YATRA_VERSION . '.' . filemtime($account_js);
            wp_enqueue_script(
                'yatra-account-page',
                YATRA_PLUGIN_URL . 'public/js/account-page.js',
                [],
                $js_version,
                true
            );
            
            // Get current user
            $current_user = wp_get_current_user();
            
            // Localize script with API data
            wp_localize_script('yatra-account-page', 'yatraAdmin', [
                'apiUrl' => rest_url('yatra/v1'),
                'nonce' => wp_create_nonce('wp_rest'),
                'currentUser' => $current_user->ID,
                'siteUrl' => home_url(),
                'locale' => get_locale(),
            ]);
        }
    }

    /**
     * Add type="module" to frontend React bundles
     */
    public function addFrontendModuleType(string $tag, string $handle): string
    {
        static $module_handles = ['yatra-account-page'];

        if (in_array($handle, $module_handles, true)) {
            if (strpos($tag, 'type="module"') === false && strpos($tag, "type='module'") === false) {
                $tag = str_replace('<script ', '<script type="module" ', $tag);
            }
        }

        return $tag;
    }
}

