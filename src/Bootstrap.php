<?php

declare(strict_types=1);

namespace Yatra;

use Yatra\Core\Container;
use Yatra\Core\ServiceProvider;
use Yatra\Providers\AppServiceProvider;
use Yatra\Providers\DatabaseServiceProvider;
use Yatra\Providers\AdminServiceProvider;
use Yatra\Providers\ApiServiceProvider;

/**
 * Main Bootstrap class for Yatra plugin
 */
class Bootstrap
{
    /**
     * @var Container
     */
    private Container $container;

    /**
     * @var bool
     */
    private bool $initialized = false;

    /**
     * Bootstrap constructor
     */
    public function __construct()
    {
        $this->container = new Container();
    }

    /**
     * Initialize the plugin
     */
    public function init(): void
    {
        if ($this->initialized) {
            return;
        }

        // Register service providers
        $this->registerServiceProviders();

        // Initialize core components
        $this->initializeCore();

        // Set up WordPress hooks
        $this->setupWordPressHooks();

        $this->initialized = true;
    }

    /**
     * Register service providers
     */
    private function registerServiceProviders(): void
    {
        $providers = [
            AppServiceProvider::class,
            DatabaseServiceProvider::class,
            AdminServiceProvider::class,
            ApiServiceProvider::class,
        ];

        foreach ($providers as $provider) {
            if (class_exists($provider)) {
                $serviceProvider = new $provider($this->container);
                $serviceProvider->register();
            }
        }
        
        // Boot all service providers after registration
        foreach ($providers as $provider) {
            if (class_exists($provider)) {
                $serviceProvider = new $provider($this->container);
                $serviceProvider->boot();
            }
        }
    }

    /**
     * Initialize core components
     */
    private function initializeCore(): void
    {
        // Initialize database
        if ($this->container->has('database')) {
            $this->container->get('database')->connect();
        }

        // Initialize cache
        if ($this->container->has('cache')) {
            $this->container->get('cache')->init();
        }

        // Initialize event system
        if ($this->container->has('events')) {
            $this->container->get('events')->init();
        }
    }

    /**
     * Set up WordPress hooks
     */
    private function setupWordPressHooks(): void
    {
        // Admin hooks - handled by AdminServiceProvider
        // if (is_admin()) {
        //     add_action('admin_menu', [$this, 'setupAdminMenu']);
        //     add_action('admin_enqueue_scripts', [$this, 'enqueueAdminAssets']);
        // }

        // Frontend hooks
        add_action('wp_enqueue_scripts', [$this, 'enqueueFrontendAssets']);
        // add_action('init', [$this, 'initCustomPostTypes']); // Commented out to avoid separate menus
        add_action('init', [$this, 'initShortcodes']);

        // AJAX hooks
        add_action('wp_ajax_yatra_booking', [$this, 'handleBookingAjax']);
        add_action('wp_ajax_nopriv_yatra_booking', [$this, 'handleBookingAjax']);
    }

    /**
     * Enqueue frontend assets
     */
    public function enqueueFrontendAssets(): void
    {
        wp_enqueue_style(
            'yatra-frontend',
            YATRA_PLUGIN_URL . 'public/frontend/css/frontend.css',
            [],
            YATRA_VERSION
        );

        wp_enqueue_script(
            'yatra-frontend',
            YATRA_PLUGIN_URL . 'public/frontend/js/frontend.js',
            ['jquery'],
            YATRA_VERSION,
            true
        );

        wp_localize_script('yatra-frontend', 'yatraFrontend', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('yatra_frontend_nonce'),
            'currency' => get_option('yatra_currency', 'USD'),
            'dateFormat' => get_option('yatra_date_format', 'Y-m-d'),
        ]);
    }

    /**
     * Initialize custom post types
     */
    public function initCustomPostTypes(): void
    {
        // Register Trip post type
        register_post_type('yatra_trip', [
            'labels' => [
                'name' => __('Trips', 'yatra'),
                'singular_name' => __('Trip', 'yatra'),
                'add_new' => __('Add New Trip', 'yatra'),
                'add_new_item' => __('Add New Trip', 'yatra'),
                'edit_item' => __('Edit Trip', 'yatra'),
                'new_item' => __('New Trip', 'yatra'),
                'view_item' => __('View Trip', 'yatra'),
                'search_items' => __('Search Trips', 'yatra'),
                'not_found' => __('No trips found', 'yatra'),
                'not_found_in_trash' => __('No trips found in trash', 'yatra'),
            ],
            'public' => true,
            'has_archive' => true,
            'supports' => ['title', 'editor', 'thumbnail', 'excerpt'],
            'menu_icon' => 'dashicons-palmtree',
            'rewrite' => ['slug' => 'trips'],
            'show_in_rest' => true,
        ]);

        // Register Destination post type
        register_post_type('yatra_destination', [
            'labels' => [
                'name' => __('Destinations', 'yatra'),
                'singular_name' => __('Destination', 'yatra'),
                'add_new' => __('Add New Destination', 'yatra'),
                'add_new_item' => __('Add New Destination', 'yatra'),
                'edit_item' => __('Edit Destination', 'yatra'),
                'new_item' => __('New Destination', 'yatra'),
                'view_item' => __('View Destination', 'yatra'),
                'search_items' => __('Search Destinations', 'yatra'),
                'not_found' => __('No destinations found', 'yatra'),
                'not_found_in_trash' => __('No destinations found in trash', 'yatra'),
            ],
            'public' => true,
            'has_archive' => true,
            'supports' => ['title', 'editor', 'thumbnail', 'excerpt'],
            'menu_icon' => 'dashicons-location',
            'rewrite' => ['slug' => 'destinations'],
            'show_in_rest' => true,
        ]);
    }

    /**
     * Initialize shortcodes
     */
    public function initShortcodes(): void
    {
        add_shortcode('yatra_trips', [$this, 'renderTripsShortcode']);
        add_shortcode('yatra_trip', [$this, 'renderTripShortcode']);
        add_shortcode('yatra_search_form', [$this, 'renderSearchFormShortcode']);
        add_shortcode('yatra_booking_form', [$this, 'renderBookingFormShortcode']);
    }

    /**
     * Handle booking AJAX
     */
    public function handleBookingAjax(): void
    {
        check_ajax_referer('yatra_frontend_nonce', 'nonce');

        $action = sanitize_text_field($_POST['action'] ?? '');
        
        if ($action === 'yatra_booking') {
            $bookingService = $this->container->get('booking_service');
            $result = $bookingService->processBooking($_POST);
            
            wp_send_json($result);
        }
    }

    /**
     * Render trips shortcode
     */
    public function renderTripsShortcode($atts): string
    {
        $atts = shortcode_atts([
            'limit' => 12,
            'destination' => '',
            'type' => '',
            'featured' => false,
        ], $atts);

        ob_start();
        include YATRA_PLUGIN_PATH . 'resources/views/frontend/trips/list.php';
        return ob_get_clean();
    }

    /**
     * Render trip shortcode
     */
    public function renderTripShortcode($atts): string
    {
        $atts = shortcode_atts([
            'id' => 0,
        ], $atts);

        if (!$atts['id']) {
            return '';
        }

        ob_start();
        include YATRA_PLUGIN_PATH . 'resources/views/frontend/trips/single.php';
        return ob_get_clean();
    }

    /**
     * Render search form shortcode
     */
    public function renderSearchFormShortcode($atts): string
    {
        $atts = shortcode_atts([
            'destination' => '',
            'date' => '',
        ], $atts);

        ob_start();
        include YATRA_PLUGIN_PATH . 'resources/views/frontend/search/form.php';
        return ob_get_clean();
    }

    /**
     * Render booking form shortcode
     */
    public function renderBookingFormShortcode($atts): string
    {
        $atts = shortcode_atts([
            'trip_id' => 0,
        ], $atts);

        if (!$atts['trip_id']) {
            return '';
        }

        ob_start();
        include YATRA_PLUGIN_PATH . 'resources/views/frontend/booking/form.php';
        return ob_get_clean();
    }

    /**
     * Get container instance
     */
    public function getContainer(): Container
    {
        return $this->container;
    }
} 