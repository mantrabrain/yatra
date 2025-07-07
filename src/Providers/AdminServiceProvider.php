<?php

declare(strict_types=1);

namespace Yatra\Providers;

use Yatra\Core\ServiceProvider;
use Yatra\Admin\Settings;
use Yatra\Api\SettingsApi;

class AdminServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Register only a single top-level menu
        add_action('admin_menu', [$this, 'registerAdminMenu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueueAdminAssets']);
        
        // Register AJAX handlers for SPA functionality
        add_action('wp_ajax_yatra_load_admin_page', [$this, 'handleLoadAdminPage']);
        add_action('wp_ajax_yatra_get_dashboard_stats', [$this, 'handleGetDashboardStats']);
        
        // Register Controllers
        new \Yatra\Admin\ActivitiesController();
        new \Yatra\Admin\DestinationsController();
    }

    public function registerAdminMenu(): void
    {
        add_menu_page(
            'Yatra Dashboard',
            'Yatra',
            'manage_options',
            'yatra-app',
            [$this, 'renderAdminPage'],
            'dashicons-palmtree',
            30
        );
    }

    public function enqueueAdminAssets(string $hook): void
    {
        // Only load on our admin page
        if ($hook !== 'toplevel_page_yatra-app') {
            return;
        }

        // Remove WordPress admin styles for our page
        wp_dequeue_style('wp-admin');
        wp_dequeue_style('admin-bar');
        wp_dequeue_style('dashicons');
        
        // Enqueue Google Fonts
        wp_enqueue_style(
            'yatra-google-fonts',
            'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
            [],
            null
        );

        // Enqueue our custom admin styles
        wp_enqueue_style(
            'yatra-admin',
            YATRA_PLUGIN_URL . 'public/admin/css/app.css',
            ['yatra-google-fonts'],
            YATRA_VERSION
        );

        // Enqueue trips-specific styles
        wp_enqueue_style(
            'yatra-trips',
            YATRA_PLUGIN_URL . 'public/admin/css/trips.css',
            ['yatra-admin'],
            YATRA_VERSION
        );

        // Enqueue activities-specific styles only for activities subpage
        if (isset($_GET['subpage']) && $_GET['subpage'] === 'activities') {
            wp_enqueue_style(
                'yatra-activities',
                YATRA_PLUGIN_URL . 'public/admin/css/activity.css',
                ['yatra-admin'],
                YATRA_VERSION
            );
        }

        // Enqueue destinations-specific styles only for destinations subpage
        if (isset($_GET['subpage']) && $_GET['subpage'] === 'destinations') {
            wp_enqueue_style(
                'yatra-destinations',
                YATRA_PLUGIN_URL . 'public/admin/css/destinations.css',
                ['yatra-admin'],
                YATRA_VERSION
            );
        }

        // Enqueue trip.js only for trips subpage
        if (isset($_GET['subpage']) && $_GET['subpage'] === 'trips') {
            // Enqueue SortableJS first
            wp_enqueue_script(
                'sortablejs',
                'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js',
                [],
                '1.15.0',
                true
            );
            
            // Enqueue trip.js with SortableJS dependency
            wp_enqueue_script(
                'yatra-trip',
                YATRA_PLUGIN_URL . 'public/admin/js/trip.js',
                ['yatra-admin', 'sortablejs'],
                YATRA_VERSION,
                true
            );
        }

        // Enqueue our custom admin script
        wp_enqueue_script(
            'yatra-admin',
            YATRA_PLUGIN_URL . 'public/admin/js/app.js',
            ['jquery'],
            YATRA_VERSION,
            true
        );

        // Pass data to JavaScript
        wp_localize_script('yatra-admin', 'yatraAdmin', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'restUrl' => rest_url(),
            'nonce' => wp_create_nonce('wp_rest'),
            'currentPage' => $_GET['page'] ?? 'dashboard',
            'subPage' => $_GET['subpage'] ?? 'dashboard'
        ]);
    }

    public function renderAdminPage(): void
    {
        // Get the current page from URL parameter
        $current_page = $_GET['subpage'] ?? 'dashboard';
        
        // Validate the page parameter
        $valid_pages = ['dashboard', 'trips', 'trips-list', 'destinations', 'activities', 'bookings', 'customers', 'reviews', 'reports', 'settings'];
        if (!in_array($current_page, $valid_pages)) {
            $current_page = 'dashboard';
        }

        // Define the default sidebar menu
        $default_menu = [
            [
                'id'    => 'dashboard',
                'label' => 'Dashboard',
                'icon'  => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                'url'   => '?page=yatra-app&subpage=dashboard',
            ],
            [
                'id'    => 'trips',
                'label' => 'Trips',
                'icon'  => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 20L3 17V4L9 7M9 20L15 17M9 20V7M15 17L21 20V7L15 4M15 17V4M9 7L15 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                'url'   => '?page=yatra-app&subpage=trips',
                'submenu' => [
                    [
                        'id'    => 'trips-list',
                        'label' => 'All Trips',
                        'icon'  => '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 20L3 17V4L9 7M9 20L15 17M9 20V7M15 17L21 20V7L15 4M15 17V4M9 7L15 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                        'url'   => '?page=yatra-app&subpage=trips',
                    ],
                    [
                        'id'    => 'destinations',
                        'label' => 'Destinations',
                        'icon'  => '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                        'url'   => '?page=yatra-app&subpage=destinations',
                    ],
                    [
                        'id'    => 'activities',
                        'label' => 'Activities',
                        'icon'  => '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M8 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                        'url'   => '?page=yatra-app&subpage=activities',
                    ],
                ],
            ],
            [
                'id'    => 'bookings',
                'label' => 'Bookings',
                'icon'  => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                'url'   => '?page=yatra-app&subpage=bookings',
            ],
            [
                'id'    => 'customers',
                'label' => 'Customers',
                'icon'  => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                'url'   => '?page=yatra-app&subpage=customers',
            ],
            [
                'id'    => 'reviews',
                'label' => 'Reviews',
                'icon'  => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                'url'   => '?page=yatra-app&subpage=reviews',
            ],
            [
                'id'    => 'reports',
                'label' => 'Reports',
                'icon'  => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 20V10M12 20V4M6 20V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                'url'   => '?page=yatra-app&subpage=reports',
            ],
            [
                'id'    => 'settings',
                'label' => 'Settings',
                'icon'  => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2579 9.77251 19.9887C9.5799 19.7195 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.7421 9.96512 4.0113 9.77251C4.2805 9.5799 4.48574 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                'url'   => '?page=yatra-app&subpage=settings',
            ],
        ];
        $sidebar_menu = apply_filters('yatra_admin_sidebar_menu', $default_menu);

        // Define the default topbar menu
        $default_topbar_menu = [
            [
                'id'    => 'notifications',
                'label' => 'Notifications',
                'icon'  => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                'url'   => '#',
                'class' => 'yatra-topbar-icon',
            ],
            [
                'id'    => 'profile',
                'label' => wp_get_current_user()->display_name,
                'icon'  => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                'url'   => admin_url('profile.php'),
                'class' => 'yatra-topbar-profile',
            ],
        ];
        $topbar_menu = apply_filters('yatra_admin_topbar_menu', $default_topbar_menu);

        ?>
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <script>document.documentElement.style.visibility = 'hidden';</script>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Yatra - Travel Booking Management</title>
            <style>
            body.yatra-admin-body #wpcontent,
            body.yatra-admin-body #wpfooter,
            body.yatra-admin-body #adminmenumain,
            body.yatra-admin-body #adminmenuback,
            body.yatra-admin-body #wpadminbar,
            body.yatra-admin-body #screen-meta,
            body.yatra-admin-body .notice,
            body.yatra-admin-body .update-nag,
            body.yatra-admin-body .wrap,
            body.yatra-admin-body .updated,
            body.yatra-admin-body .error,
            body.yatra-admin-body .notice-success,
            body.yatra-admin-body .notice-error,
            body.yatra-admin-body .notice-warning,
            body.yatra-admin-body .notice-info {
              display: none !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              height: 100vh !important;
              width: 100vw !important;
              overflow: hidden !important;
              background: #f8fafc !important;
            }
            .yatra-admin-wrapper {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              width: 100vw !important;
              height: 100vh !important;
              z-index: 999999 !important;
              background: #f8fafc !important;
              overflow: auto !important;
            }
            </style>
            <?php wp_head(); ?>
        </head>
        <body class="yatra-admin-body">
            <div id="yatra-app" class="yatra-admin-wrapper" data-current-page="<?php echo esc_attr($current_page); ?>">
                <!-- Sidebar -->
                <aside class="yatra-sidebar">
                    <div class="yatra-sidebar-header">
                        <div class="yatra-logo">
                            <span class="yatra-logo-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </span>
                            <span class="yatra-logo-text">Yatra</span>
                        </div>
                    </div>
                    
                    <nav class="yatra-nav">
                        <ul class="yatra-nav-list">
                            <?php foreach ($sidebar_menu as $item): ?>
                                <li class="yatra-nav-item <?php echo isset($item['submenu']) ? 'has-submenu' : ''; ?>">
                                    <a href="<?php echo esc_url($item['url']); ?>" class="yatra-nav-link <?php echo $current_page === $item['id'] ? 'active' : ''; ?>">
                                        <span class="yatra-nav-icon"><?php echo $item['icon']; ?></span>
                                        <span class="yatra-nav-text"><?php echo esc_html($item['label']); ?></span>
                                        <?php if (isset($item['submenu'])): ?>
                                            <span class="yatra-nav-arrow">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                </svg>
                                            </span>
                                        <?php endif; ?>
                                    </a>
                                    <?php if (isset($item['submenu'])): ?>
                                        <ul class="yatra-submenu">
                                            <?php foreach ($item['submenu'] as $subitem): ?>
                                                <li class="yatra-submenu-item">
                                                    <a href="<?php echo esc_url($subitem['url']); ?>" class="yatra-submenu-link <?php echo $current_page === $subitem['id'] ? 'active' : ''; ?>">
                                                        <span class="yatra-submenu-icon"><?php echo $subitem['icon']; ?></span>
                                                        <span class="yatra-submenu-text"><?php echo esc_html($subitem['label']); ?></span>
                                                    </a>
                                                </li>
                                            <?php endforeach; ?>
                                        </ul>
                                    <?php endif; ?>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </nav>
                </aside>

                <!-- Main Content -->
                <main class="yatra-main-content">
                    <!-- Top Bar -->
                    <header class="yatra-top-bar">
                        <div class="yatra-top-bar-left">
                            <h1 class="yatra-page-title">
                                <?php echo esc_html(ucfirst($current_page)); ?>
                            </h1>
                        </div>
                        <div class="yatra-top-bar-right">
                            <button class="yatra-theme-toggle" id="theme-toggle">
                                <span class="theme-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </span>
                            </button>
                            <?php foreach ($topbar_menu as $item): ?>
                                <a href="<?php echo esc_url($item['url']); ?>" class="<?php echo esc_attr($item['class']); ?>" title="<?php echo esc_attr($item['label']); ?>">
                                    <span><?php echo $item['icon']; ?></span>
                                    <?php if (!empty($item['show_label'])): ?>
                                        <span class="yatra-topbar-label"><?php echo esc_html($item['label']); ?></span>
                                    <?php endif; ?>
                                </a>
                            <?php endforeach; ?>
                            <div class="yatra-user-menu">
                                <span class="yatra-user-name"><?php echo esc_html(wp_get_current_user()->display_name); ?></span>
                                <a href="<?php echo admin_url(); ?>" class="yatra-back-to-wp">← Back to WordPress</a>
                            </div>
                        </div>
                    </header>

                    <!-- Content Area -->
                    <div class="yatra-content-area">
                        <div class="yatra-page-content" id="page-content">
                            <?php $this->renderPageContent($current_page); ?>
                        </div>
                    </div>
                </main>
            </div>
            <?php wp_footer(); ?>
            <script>document.documentElement.style.visibility = 'visible';</script>
        </body>
        </html>
        <?php
    }

    private function renderPageContent(string $page): void
    {
        switch ($page) {
            case 'dashboard':
                $this->renderDashboard();
                break;
            case 'trips':
                $this->renderTrips();
                break;
            case 'destinations':
                $this->renderDestinations();
                break;
            case 'activities':
                $this->renderActivities();
                break;
            case 'bookings':
                $this->renderBookings();
                break;
            case 'customers':
                $this->renderCustomers();
                break;
            case 'reviews':
                $this->renderReviews();
                break;
            case 'reports':
                $this->renderReports();
                break;
            case 'settings':
                $this->renderSettings();
                break;
            default:
                $this->renderDashboard();
        }
    }

    private function renderDashboard(): void
    {
        \Yatra\Core\View::render('admin/dashboard/dashboard');
    }

    private function renderTrips(): void
    {
        $action = $_GET['action'] ?? 'list';
        $tripManager = new \Yatra\Admin\TripManager();
        
        switch ($action) {
            case 'add':
                $this->renderTripForm();
                break;
            case 'edit':
                $this->renderTripForm($_GET['id'] ?? null);
                break;
            case 'view':
                $this->renderTripView($_GET['id'] ?? null);
                break;
            case 'list':
            default:
                $tripManager->renderTripsList();
                break;
        }
    }

    private function renderTripForm($trip_id = null): void
    {
        $trip = null;
        $tripManager = new \Yatra\Admin\TripManager();
        
        if ($trip_id) {
            $trip = $tripManager->getTrip($trip_id);
            if (!$trip) {
                wp_die('Trip not found');
            }
        }
        
        // Load the view file using the View class
        $action = $trip ? 'edit' : 'add';
        \Yatra\Core\View::render('admin/trip/trip', [
            'trip' => $trip,
            'action' => $action
        ]);
    }

    private function renderTripView($trip_id): void
    {
        $tripManager = new \Yatra\Admin\TripManager();
        $trip = $tripManager->getTrip($trip_id);
        
        if (!$trip) {
            wp_die('Trip not found');
        }
        
        \Yatra\Core\View::render('admin/trip/view', [
            'trip' => $trip
        ]);
    }

    private function renderDestinations(): void
    {
        $action = $_GET['action'] ?? 'list';
        
        switch ($action) {
            case 'view':
                $destination_id = intval($_GET['id'] ?? 0);
                if ($destination_id) {
                    $destinationsController = new \Yatra\Admin\DestinationsController();
                    $destinationsController->viewDestination($destination_id);
                } else {
                    wp_die('Invalid destination ID');
                }
                break;
            case 'list':
            default:
                // Load destinations data directly
                $destinations = \Yatra\Models\Destination::getDestinationsForDisplay();
                
                \Yatra\Core\View::render('admin/destinations/destinations', [
                    'destinations' => $destinations
                ]);
                break;
        }
    }

    private function renderActivities(): void
    {
        \Yatra\Core\View::render('admin/activities/activities');
    }

    private function renderBookings(): void
    {
        \Yatra\Core\View::render('admin/bookings/bookings');
    }

    private function renderCustomers(): void
    {
        \Yatra\Core\View::render('admin/customers/customers');
    }

    private function renderReviews(): void
    {
        \Yatra\Core\View::render('admin/reviews/reviews');
    }

    private function renderReports(): void
    {
        \Yatra\Core\View::render('admin/reports/reports');
    }

    private function renderSettings(): void
    {
        $settings = new Settings();
        $settings->render();
    }

    /**
     * AJAX handler for loading admin page content
     */
    public function handleLoadAdminPage(): void
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'yatra_admin_nonce')) {
            wp_send_json_error('Invalid nonce');
        }

        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }

        $page = sanitize_text_field($_POST['page'] ?? 'dashboard');
        $valid_pages = ['dashboard', 'trips', 'trips-list', 'destinations', 'bookings', 'customers', 'reviews', 'reports', 'settings'];
        
        if (!in_array($page, $valid_pages)) {
            wp_send_json_error('Invalid page');
        }

        // Capture the output
        ob_start();
        $this->renderPageContent($page);
        $content = ob_get_clean();

        wp_send_json_success(['content' => $content]);
    }

    /**
     * AJAX handler for getting dashboard statistics
     */
    public function handleGetDashboardStats(): void
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'yatra_admin_nonce')) {
            wp_send_json_error('Invalid nonce');
        }

        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }

        // For now, return mock data
        // In the future, this will query the database for real statistics
        $stats = [
            'totalBookings' => 0,
            'totalRevenue' => 0,
            'activeTrips' => 0,
            'totalCustomers' => 0,
            'pendingBookings' => 0,
            'completedTrips' => 0,
            'averageRating' => 0,
            'totalReviews' => 0
        ];

        wp_send_json_success($stats);
    }
} 