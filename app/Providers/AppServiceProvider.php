<?php

declare(strict_types=1);

namespace Yatra\Providers;

use Yatra\Core\ServiceProvider;
use Yatra\Core\Container;
use Yatra\Core\Modules\ModuleManager;
use Yatra\Controllers\SingleTripController;

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

        // Register shortcodes
        add_action('init', [$this, 'registerShortcodes'], 10);

        // Register frontend account page - use early priority to catch before 404
        add_action('template_redirect', [$this, 'handleAccountPage'], 1);

        // Handle trip single page - use early priority to catch before 404
        add_action('template_redirect', [$this, 'handleTripPage'], 1);

        // Handle listing pages - use early priority to catch before 404
        add_action('template_redirect', [$this, 'handleListingPages'], 1);

        // Handle booking page - use early priority to catch before 404
        add_action('template_redirect', [$this, 'handleBookingPage'], 1);

        // Ensure frontend bundles are marked as ES modules
        add_filter('script_loader_tag', [$this, 'addFrontendModuleType'], 10, 2);

        // Add "Edit Trip" to admin bar on single trip page
        add_action('admin_bar_menu', [$this, 'addEditTripAdminBarLink'], 80);
        
        // Add admin bar CSS for trip edit link
        add_action('wp_head', [$this, 'addAdminBarTripEditCSS']);

        // AJAX handler for review submission
        add_action('wp_ajax_yatra_submit_review', [$this, 'handleReviewSubmission']);
        add_action('wp_ajax_nopriv_yatra_submit_review', [$this, 'handleReviewSubmissionNoPriv']);
    }

    /**
     * Handle review submission for logged-in users
     */
    public function handleReviewSubmission(): void
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['yatra_review_nonce'] ?? '', 'yatra_submit_review')) {
            wp_send_json_error(['message' => __('Security check failed.', 'yatra')]);
        }

        $trip_id = (int) ($_POST['trip_id'] ?? 0);
        $rating = (int) ($_POST['rating'] ?? 0);
        $title = sanitize_text_field($_POST['title'] ?? '');
        $content = sanitize_textarea_field($_POST['content'] ?? '');

        // Validate trip ID
        if ($trip_id <= 0) {
            wp_send_json_error(['message' => __('Invalid trip.', 'yatra')]);
        }

        // Validate rating
        $min_rating = (int) \Yatra\Services\SettingsService::getMinimumRating();
        if ($rating < $min_rating || $rating > 5) {
            wp_send_json_error(['message' => sprintf(__('Rating must be between %d and 5.', 'yatra'), $min_rating)]);
        }

        // Validate content
        if (strlen($content) < 20) {
            wp_send_json_error(['message' => __('Review must be at least 20 characters.', 'yatra')]);
        }

        // Get user ID and check permissions
        $user_id = get_current_user_id();
        
        // Check if this is an edit request
        $action_type = sanitize_text_field($_POST['action_type'] ?? 'create');
        $review_id = (int) ($_POST['review_id'] ?? 0);
        
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_reviews';

        // Check if table exists, if not create it
        $table_exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table));
        if (!$table_exists) {
            $this->createReviewsTable();
        }
        
        if ($action_type === 'edit' && $review_id > 0) {
            // Editing existing review
            $existing_review = yatra_get_user_review($trip_id, $user_id);
            
            if (!$existing_review || (int) $existing_review->id !== $review_id) {
                wp_send_json_error(['message' => __('Review not found or you do not have permission to edit it.', 'yatra')]);
            }
            
            if (!yatra_can_edit_review($existing_review)) {
                wp_send_json_error(['message' => __('The edit window (24 hours) for this review has passed.', 'yatra')]);
            }
            
            // Update the review
            $result = $wpdb->update(
                $table,
                [
                    'rating' => $rating,
                    'title' => $title,
                    'content' => $content,
                    'updated_at' => current_time('mysql'),
                ],
                ['id' => $review_id, 'user_id' => $user_id],
                ['%d', '%s', '%s', '%s'],
                ['%d', '%d']
            );
            
            if ($result === false) {
                wp_send_json_error(['message' => __('Failed to update review. Please try again.', 'yatra')]);
            }
            
            wp_send_json_success(['message' => __('Your review has been updated!', 'yatra')]);
        } else {
            // Creating new review
            if (!yatra_can_review($trip_id, $user_id)) {
                wp_send_json_error(['message' => __('You cannot review this trip.', 'yatra')]);
            }

            // Get user info
            $user = wp_get_current_user();
            $author_name = $user->display_name ?: $user->user_login;
            $author_email = $user->user_email;

            // Determine status based on settings
            $status = \Yatra\Services\SettingsService::autoApproveReviews() ? 'approved' : 'pending';

            $result = $wpdb->insert($table, [
                'trip_id' => $trip_id,
                'user_id' => $user_id,
                'rating' => $rating,
                'title' => $title,
                'content' => $content,
                'author_name' => $author_name,
                'author_email' => $author_email,
                'status' => $status,
                'created_at' => current_time('mysql'),
            ], ['%d', '%d', '%d', '%s', '%s', '%s', '%s', '%s', '%s']);

            if ($result === false) {
                wp_send_json_error(['message' => __('Failed to save review. Please try again.', 'yatra')]);
            }

            $message = $status === 'approved' 
                ? __('Thank you for your review!', 'yatra')
                : __('Thank you! Your review will be published after moderation.', 'yatra');

            wp_send_json_success(['message' => $message]);
        }
    }

    /**
     * Handle review submission for non-logged-in users
     */
    public function handleReviewSubmissionNoPriv(): void
    {
        wp_send_json_error(['message' => __('Please log in to submit a review.', 'yatra')]);
    }

    /**
     * Create reviews table if it doesn't exist
     */
    private function createReviewsTable(): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_reviews';
        $charset = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE IF NOT EXISTS {$table} (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            trip_id bigint(20) UNSIGNED NOT NULL,
            user_id bigint(20) UNSIGNED DEFAULT 0,
            rating tinyint(1) UNSIGNED NOT NULL,
            title varchar(255) DEFAULT NULL,
            content text NOT NULL,
            author_name varchar(100) NOT NULL,
            author_email varchar(100) DEFAULT NULL,
            author_location varchar(100) DEFAULT NULL,
            status enum('pending','approved','rejected') DEFAULT 'pending',
            helpful_count int(11) UNSIGNED DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_trip_id (trip_id),
            KEY idx_user_id (user_id),
            KEY idx_status (status),
            KEY idx_rating (rating)
        ) {$charset};";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql);
    }

    /**
     * Add CSS for the Edit Trip admin bar link
     */
    public function addAdminBarTripEditCSS(): void
    {
        // Only output CSS if we're on a single trip page and user can see admin bar
        global $trip;
        if (empty($trip) || !is_user_logged_in() || !is_admin_bar_showing()) {
            return;
        }

        echo '<style>
            #wpadminbar #wp-admin-bar-yatra-edit-trip > .ab-item:before {
                content: "\f464";
                font-family: dashicons;
                top: 2px;
            }
        </style>';
    }

    /**
     * Add "Edit Trip" link to admin bar on single trip page
     *
     * @param \WP_Admin_Bar $admin_bar
     */
    public function addEditTripAdminBarLink($admin_bar): void
    {
        // Only for logged-in users who can edit trips
        if (!is_user_logged_in() || !current_user_can('edit_posts')) {
            return;
        }

        // Check if we're on a single trip page
        global $trip;
        if (empty($trip) || empty($trip->id)) {
            return;
        }

        // Build the edit URL for the trip
        $edit_url = admin_url('admin.php?page=yatra&subpage=trips&action=edit&id=' . (int) $trip->id);

        // Add the Edit Trip node
        $admin_bar->add_node([
            'id'    => 'yatra-edit-trip',
            'title' => __('Edit Trip', 'yatra'),
            'href'  => $edit_url,
            'meta'  => [
                'title' => __('Edit this trip in Yatra admin', 'yatra'),
            ],
        ]);
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
     * Register shortcodes
     */
    public function registerShortcodes(): void
    {
        add_shortcode('yatra_booking', [$this, 'renderBookingShortcode']);
    }

    /**
     * Render the booking shortcode
     */
    public function renderBookingShortcode(array $atts = []): string
    {
        // Parse shortcode attributes
        $atts = shortcode_atts([
            'trip_slug' => '',
        ], $atts, 'yatra_booking');

        // Get trip slug from URL parameter or shortcode attribute
        $trip_slug = !empty($atts['trip_slug']) ? $atts['trip_slug'] : '';
        
        // Try to get from query string if not set
        if (empty($trip_slug) && isset($_GET['trip'])) {
            $trip_slug = sanitize_text_field($_GET['trip']);
        }

        // Enqueue booking assets
        $this->enqueueBookingPageAssets();

        // Start output buffering
        ob_start();

        // Set up the trip slug for the template
        set_query_var('yatra_booking_trip_slug', $trip_slug);

        // Include the booking template
        $template_path = YATRA_PLUGIN_PATH . 'templates/booking.php';
        
        if (file_exists($template_path)) {
            // We need to render just the booking form, not the full page
            include YATRA_PLUGIN_PATH . 'templates/booking-form.php';
        } else {
            echo '<p>' . esc_html__('Booking form template not found.', 'yatra') . '</p>';
        }

        return ob_get_clean();
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
     * Add rewrite rules for trip permalinks and listing pages
     */
    public function addTripRewriteRules(): void
    {
        // Get permalink bases from settings (stored with yatra_ prefix)
        $trip_base = get_option('yatra_trip_base', 'trip');
        $destination_base = get_option('yatra_destination_base', 'destination');
        $activity_base = get_option('yatra_activity_base', 'activity');
        $trip_category_base = get_option('yatra_trip_category_base', 'trip-category');
        $booking_base = get_option('yatra_booking_base', 'book');
        
        // Check if using custom booking page
        $use_booking_page = get_option('yatra_use_booking_page', false);
        
        // Sanitize bases (only allow alphanumeric, hyphens, underscores)
        $trip_base = preg_replace('/[^a-z0-9_-]/i', '', $trip_base);
        if (empty($trip_base)) {
            $trip_base = 'trip';
        }
        
        $destination_base = preg_replace('/[^a-z0-9_-]/i', '', $destination_base);
        if (empty($destination_base)) {
            $destination_base = 'destination';
        }
        
        $activity_base = preg_replace('/[^a-z0-9_-]/i', '', $activity_base);
        if (empty($activity_base)) {
            $activity_base = 'activity';
        }
        
        $trip_category_base = preg_replace('/[^a-z0-9_-]/i', '', $trip_category_base);
        if (empty($trip_category_base)) {
            $trip_category_base = 'trip-category';
        }
        
        $booking_base = preg_replace('/[^a-z0-9_-]/i', '', $booking_base);
        if (empty($booking_base)) {
            $booking_base = 'book';
        }

        // Add query vars first (must be registered before rewrite rules)
        add_rewrite_tag('%yatra_trip_slug%', '([^&]+)');
        add_rewrite_tag('%yatra_listing_page%', '([^&]+)');
        add_rewrite_tag('%yatra_booking_page%', '([^&]+)');

        // Add rewrite rule for trip single page: {trip_base}/{trip_slug}
        add_rewrite_rule(
            '^' . $trip_base . '/([^/]+)/?$',
            'index.php?yatra_trip_slug=$matches[1]',
            'top'
        );

        // Add rewrite rules for listing pages
        // Trip listing: /trip/
        add_rewrite_rule(
            '^' . $trip_base . '/?$',
            'index.php?yatra_listing_page=trip',
            'top'
        );

        // Destination listing: /destination/
        add_rewrite_rule(
            '^' . $destination_base . '/?$',
            'index.php?yatra_listing_page=destination',
            'top'
        );

        // Activity listing: /activity/
        add_rewrite_rule(
            '^' . $activity_base . '/?$',
            'index.php?yatra_listing_page=activity',
            'top'
        );

        // Trip category listing: /trip-category/
        add_rewrite_rule(
            '^' . $trip_category_base . '/?$',
            'index.php?yatra_listing_page=trip-category',
            'top'
        );

        // Only add booking page rewrite rule if NOT using custom booking page
        if (!$use_booking_page) {            // Booking page: /{booking_base}/{trip_slug}
            add_rewrite_rule(
                '^' . $booking_base . '/([^/]+)/?$',
                'index.php?yatra_booking_page=$matches[1]',
                'top'
            );
        }

        // Debug logging
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(sprintf('Yatra: Registered rewrite rules for trip_base: %s, destination_base: %s, activity_base: %s, trip_category_base: %s, booking_base: %s (custom page: %s)', 
                $trip_base, $destination_base, $activity_base, $trip_category_base, $booking_base, $use_booking_page ? 'yes' : 'no'));
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

        // Use SingleTripController to get prepared trip data
        $controller = new SingleTripController();
        $trip_data = $controller->getBySlug($trip_slug);

        if (!$trip_data) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log(sprintf('Yatra: Trip not found for slug: %s', $trip_slug));
            }
            return; // Let WordPress handle 404
        }

        // Prevent 404 handling
        $wp_query->is_404 = false;
        status_header(200);

        // Set up global $trip object (similar to WordPress $post)
        global $trip;
        $trip = $trip_data;

        // Also set up query vars for backward compatibility
        $wp_query->set('yatra_trip_id', $trip->id);
        $wp_query->set('yatra_trip', $trip);
        $wp_query->set('yatra_trip_slug', $trip_slug);

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
     * Handle listing pages (trip, destination, activity, trip-category)
     */
    public function handleListingPages(): void
    {
        global $wp_query, $wp;

        // Get listing page type from query var
        $listing_page = get_query_var('yatra_listing_page');
        
        // If query var is empty, check request path directly
        if (empty($listing_page)) {
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

            // Check if request path matches listing page patterns
            if (!empty($request_path)) {
                $trip_base = get_option('yatra_trip_base', 'trip');
                $destination_base = get_option('yatra_destination_base', 'destination');
                $activity_base = get_option('yatra_activity_base', 'activity');
                $trip_category_base = get_option('yatra_trip_category_base', 'trip-category');
                
                // Sanitize bases
                $trip_base = preg_replace('/[^a-z0-9_-]/i', '', $trip_base);
                $destination_base = preg_replace('/[^a-z0-9_-]/i', '', $destination_base);
                $activity_base = preg_replace('/[^a-z0-9_-]/i', '', $activity_base);
                $trip_category_base = preg_replace('/[^a-z0-9_-]/i', '', $trip_category_base);
                
                // Check if path matches any listing page base (exact match, no trailing slug)
                if ($request_path === $trip_base) {
                    $listing_page = 'trip';
                } elseif ($request_path === $destination_base) {
                    $listing_page = 'destination';
                } elseif ($request_path === $activity_base) {
                    $listing_page = 'activity';
                } elseif ($request_path === $trip_category_base) {
                    $listing_page = 'trip-category';
                }
            }
        }

        if (empty($listing_page)) {
            return;
        }

        // Prevent 404 handling
        $wp_query->is_404 = false;
        status_header(200);

        // Set up query vars for template
        $wp_query->set('yatra_listing_page', $listing_page);

        // Enqueue listing page assets
        $this->enqueueListingPageAssets();

        // Load the appropriate listing page template
        $template_path = YATRA_PLUGIN_PATH . 'templates/listing-' . $listing_page . '.php';
        
        if (file_exists($template_path)) {
            include $template_path;
            exit;
        } else {
            // Fallback: simple message
            wp_die(sprintf('Listing page template not found for: %s', esc_html($listing_page)));
        }
    }

    /**
     * Handle booking page routing
     */
    public function handleBookingPage(): void
    {
        global $wp_query, $wp;

        // Get booking_base from settings
        $booking_base = get_option('yatra_booking_base', 'book');
        $booking_base = preg_replace('/[^a-z0-9_-]/i', '', $booking_base);
        if (empty($booking_base)) {
            $booking_base = 'book';
        }

        // Check if using custom booking page
        $use_booking_page = get_option('yatra_use_booking_page', false);
        
        if ($use_booking_page) {
            return;
        }

        // Method 1: Try to get from query var (if rewrite rules are working)
        $booking_trip_slug = get_query_var('yatra_booking_page');
        
        // Method 2: If query var is empty, check request path directly
        if (empty($booking_trip_slug)) {
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

            // Check if request path matches booking pattern: {booking_base}/{slug}
            if (!empty($request_path)) {
                $escaped_base = preg_quote($booking_base, '/');
                $pattern = '/^' . $escaped_base . '\/([^\/]+)\/?$/';
                if (preg_match($pattern, $request_path, $matches)) {
                    $booking_trip_slug = $matches[1];
                }
            }
        }

        if (empty($booking_trip_slug)) {
            return;
        }

        // Prevent 404 handling
        $wp_query->is_404 = false;
        status_header(200);

        // Enqueue booking page assets
        $this->enqueueBookingPageAssets();

        // Set up query vars for template
        $wp_query->set('yatra_booking_trip_slug', $booking_trip_slug);

        // Load the booking page template
        $template_path = YATRA_PLUGIN_PATH . 'templates/booking.php';

        if (file_exists($template_path)) {
            include $template_path;
            exit;
        } else {
            // Fallback: simple message
            wp_die(sprintf('Booking page template not found for trip: %s', esc_html($booking_trip_slug)));
        }
    }

    /**
     * Enqueue booking page assets
     */
    private function enqueueBookingPageAssets(): void
    {
        // Enqueue common CSS first
        $this->enqueueCommonAssets();

        // Enqueue booking CSS
        $css_file = YATRA_PLUGIN_PATH . 'public/css/booking.css';
        if (file_exists($css_file)) {
            $css_url = str_replace(YATRA_PLUGIN_PATH, YATRA_PLUGIN_URL, $css_file);
            $css_version = YATRA_VERSION . '.' . filemtime($css_file);
            wp_enqueue_style(
                'yatra-booking',
                $css_url,
                ['yatra-common'],
                $css_version
            );
        }

        // Enqueue JS
        $js_file = YATRA_PLUGIN_PATH . 'public/js/booking.js';
        if (file_exists($js_file)) {
            $js_url = str_replace(YATRA_PLUGIN_PATH, YATRA_PLUGIN_URL, $js_file);
            $js_version = YATRA_VERSION . '.' . filemtime($js_file);
            wp_enqueue_script(
                'yatra-booking',
                $js_url,
                ['jquery'],
                $js_version,
                true
            );
        }
    }

    /**
     * Enqueue listing page assets
     */
    /**
     * Enqueue common CSS (loaded as dependency for all page styles)
     */
    private function enqueueCommonAssets(): void
    {
        $css_file = YATRA_PLUGIN_PATH . 'public/css/common.css';
        if (file_exists($css_file)) {
            $css_url = str_replace(YATRA_PLUGIN_PATH, YATRA_PLUGIN_URL, $css_file);
            $css_version = YATRA_VERSION . '.' . filemtime($css_file);
            wp_enqueue_style(
                'yatra-common',
                $css_url,
                [],
                $css_version
            );
        }
    }

    private function enqueueListingPageAssets(): void
    {
        // Enqueue common CSS first
        $this->enqueueCommonAssets();

        // Enqueue listing CSS
        $css_file = YATRA_PLUGIN_PATH . 'public/css/listing.css';
        if (file_exists($css_file)) {
            $css_url = str_replace(YATRA_PLUGIN_PATH, YATRA_PLUGIN_URL, $css_file);
            $css_version = YATRA_VERSION . '.' . filemtime($css_file);
            wp_enqueue_style(
                'yatra-listing',
                $css_url,
                ['yatra-common'],
                $css_version
            );
        }

        // Enqueue JS
        $js_file = YATRA_PLUGIN_PATH . 'public/js/listing.js';
        if (file_exists($js_file)) {
            $js_url = str_replace(YATRA_PLUGIN_PATH, YATRA_PLUGIN_URL, $js_file);
            $js_version = YATRA_VERSION . '.' . filemtime($js_file);
            wp_enqueue_script(
                'yatra-listing',
                $js_url,
                [],
                $js_version,
                true
            );
        }
    }

    /**
     * Enqueue trip page assets
     */
    private function enqueueTripPageAssets(): void
    {
        // Enqueue common CSS first
        $this->enqueueCommonAssets();

        // Enqueue trip CSS
        $css_file = YATRA_PLUGIN_PATH . 'public/css/trip.css';
        if (file_exists($css_file)) {
            $css_url = str_replace(YATRA_PLUGIN_PATH, YATRA_PLUGIN_URL, $css_file);
            $css_version = YATRA_VERSION . '.' . filemtime($css_file);
            wp_enqueue_style(
                'yatra-trip',
                $css_url,
                ['yatra-common'],
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
                'ajaxUrl' => admin_url('admin-ajax.php'),
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

