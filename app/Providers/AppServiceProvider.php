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

        // Add rewrite rules for trip permalinks
        add_action('init', [$this, 'addTripRewriteRules'], 10);

        // Register frontend account page - use early priority to catch before 404
        add_action('template_redirect', [$this, 'handleAccountPage'], 1);

        // Handle trip single page - use early priority to catch before 404
        add_action('template_redirect', [$this, 'handleTripPage'], 1);

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
                html {
                    font-size: 1em !important;
                }
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
     * Add rewrite rules for trip permalinks
     */
    public function addTripRewriteRules(): void
    {
        // Get trip_base from settings (stored with yatra_ prefix)
        $trip_base = get_option('yatra_trip_base', 'trip');
        
        // Sanitize trip_base (only allow alphanumeric, hyphens, underscores)
        $trip_base = preg_replace('/[^a-z0-9_-]/i', '', $trip_base);
        if (empty($trip_base)) {
            $trip_base = 'trip';
        }

        // Add query var first (must be registered before rewrite rules)
        add_rewrite_tag('%yatra_trip_slug%', '([^&]+)');

        // Add rewrite rule: {trip_base}/{trip_slug}
        add_rewrite_rule(
            '^' . $trip_base . '/([^/]+)/?$',
            'index.php?yatra_trip_slug=$matches[1]',
            'top'
        );

        // Debug logging
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(sprintf('Yatra: Registered rewrite rule for trip_base: %s', $trip_base));
        }
    }

    /**
     * Handle trip single page
     */
    public function handleTripPage(): void
    {
        global $wp_query, $wp;

        // Get trip_base from settings
        $trip_base = get_option('yatra_trip_base', 'trip');
        $trip_base = preg_replace('/[^a-z0-9_-]/i', '', $trip_base);
        if (empty($trip_base)) {
            $trip_base = 'trip';
        }

        // Method 1: Try to get from query var (if rewrite rules are working)
        $trip_slug = get_query_var('yatra_trip_slug');
        
        // Method 2: If query var is empty, check request path directly
        if (empty($trip_slug)) {
            $request_path = '';
            
            // Get from $wp->request if available
            if (isset($wp) && isset($wp->request)) {
                $request_path = trim((string) $wp->request, '/');
            }
            
            // Fallback: parse from REQUEST_URI
            if (empty($request_path)) {
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

            // Check if request path matches trip pattern: {trip_base}/{slug}
            if (!empty($request_path)) {
                $escaped_base = preg_quote($trip_base, '/');
                $pattern = '/^' . $escaped_base . '\/([^\/]+)\/?$/';
                if (preg_match($pattern, $request_path, $matches)) {
                    $trip_slug = $matches[1];
                }
            }
        }

        // Debug logging
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(sprintf(
                'Yatra Trip Page Check - Trip Base: "%s", Trip Slug: "%s", Request Path: "%s", Query Var: "%s"',
                $trip_base,
                $trip_slug ?? 'empty',
                $request_path ?? 'empty',
                get_query_var('yatra_trip_slug') ?: 'empty'
            ));
        }

        if (empty($trip_slug)) {
            return;
        }

        // Get trip from database by slug
        global $wpdb;
        $table_trips = $wpdb->prefix . 'yatra_trips';
        
        // First try with publish status
        $trip = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$table_trips} WHERE slug = %s AND status = 'publish' AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00') LIMIT 1",
            $trip_slug
        ));

        // If not found, try without status check (for draft trips during development)
        if (!$trip) {
            $trip = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$table_trips} WHERE slug = %s AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00') LIMIT 1",
                $trip_slug
            ));
            
            if ($trip && defined('WP_DEBUG') && WP_DEBUG) {
                error_log(sprintf('Yatra: Trip found but status is "%s" (not publish) for slug: %s', $trip->status ?? 'unknown', $trip_slug));
            }
        }

        if (!$trip) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                // Check if trip exists at all
                $exists = $wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM {$table_trips} WHERE slug = %s",
                    $trip_slug
                ));
                if ($exists > 0) {
                    $status_info = $wpdb->get_row($wpdb->prepare(
                        "SELECT status, deleted_at FROM {$table_trips} WHERE slug = %s LIMIT 1",
                        $trip_slug
                    ));
                    error_log(sprintf(
                        'Yatra: Trip exists but not accessible - Slug: %s, Status: %s, Deleted: %s',
                        $trip_slug,
                        $status_info->status ?? 'unknown',
                        $status_info->deleted_at ?? 'NULL'
                    ));
                } else {
                    error_log(sprintf('Yatra: Trip not found in database for slug: %s', $trip_slug));
                }
            }
            return; // Let WordPress handle 404
        }

        // Prevent 404 handling
        $wp_query->is_404 = false;
        status_header(200);

        // Set up query vars for template
        $wp_query->set('yatra_trip_id', $trip->id);
        $wp_query->set('yatra_trip', $trip);

        // Enqueue trip page assets
        $this->enqueueTripPageAssets();

        // Load the trip single page template
        $template = YATRA_PLUGIN_PATH . 'templates/single-trip.php';
        
        if (file_exists($template)) {
            include $template;
            exit;
        } else {
            // Fallback: simple template
            $this->renderTripTemplate($trip);
            exit;
        }
    }

    /**
     * Enqueue trip page assets
     */
    private function enqueueTripPageAssets(): void
    {
        // Enqueue CSS
        $css_file = YATRA_PLUGIN_PATH . 'public/css/trip.css';
        if (file_exists($css_file)) {
            $css_url = str_replace(YATRA_PLUGIN_PATH, YATRA_PLUGIN_URL, $css_file);
            $css_version = YATRA_VERSION . '.' . filemtime($css_file);
            wp_enqueue_style(
                'yatra-trip',
                $css_url,
                [],
                $css_version
            );
        }

        // Enqueue JS
        $js_file = YATRA_PLUGIN_PATH . 'public/js/trip.js';
        if (file_exists($js_file)) {
            $js_url = str_replace(YATRA_PLUGIN_PATH, YATRA_PLUGIN_URL, $js_file);
            $js_version = YATRA_VERSION . '.' . filemtime($js_file);
            wp_enqueue_script(
                'yatra-trip',
                $js_url,
                ['jquery'],
                $js_version,
                true
            );

            // Localize script with trip data
            global $wp_query;
            $trip_id = $wp_query->get('yatra_trip_id') ?: 1;
            wp_localize_script('yatra-trip', 'yatraTripData', [
                'tripId' => $trip_id,
                'restUrl' => rest_url('yatra/v1'),
                'nonce' => wp_create_nonce('wp_rest'),
            ]);
        }
    }

    /**
     * Render trip template (fallback if template file doesn't exist)
     */
    private function renderTripTemplate($trip): void
    {
        get_header();
        ?>
        <div class="yatra-single-trip" style="max-width: 1200px; margin: 0 auto; padding: 40px 20px;">
            <h1><?php echo esc_html($trip->title); ?></h1>
            <?php if (!empty($trip->description)): ?>
                <div class="trip-description">
                    <?php echo wp_kses_post($trip->description); ?>
                </div>
            <?php endif; ?>
        </div>
        <?php
        get_footer();
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

