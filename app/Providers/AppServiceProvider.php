<?php

declare(strict_types=1);

namespace Yatra\Providers;

use Yatra\Core\ServiceProvider;
use Yatra\Core\Container;
use Yatra\Core\Modules\ModuleManager;
use Yatra\Controllers\SingleTripController;
use Yatra\Helpers\CurrencyHelper;
use Yatra\Services\SettingsService;
use Yatra\Repositories\ReviewRepository;
use Yatra\Repositories\EnquiryRepository;
use Yatra\Repositories\TripRepository;
use Yatra\Repositories\BookingRepository;
use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Database\Tables\TripClassificationsTable;
use Yatra\Database\Tables\TripsTable;
use Yatra\Database\Tables\ReviewsTable;
use Yatra\Database\Tables\BookingsTable;
use Yatra\Database\Tables\BookingPaymentsTable;
use Yatra\Database\Tables\ScheduledPaymentsTable;
use Yatra\Database\Tables\PaymentTokensTable;
use Yatra\Database\Tables\CustomersTable;
use Yatra\Database\Tables\BookingTravellersTable;
use Yatra\Database\Tables\BookingTravellerMetaTable;
use Yatra\Database\Tables\BookingDeparturesTable;
use Yatra\Database\Tables\DiscountsTable;
use Yatra\Database\Tables\EnquiriesTable;

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
        error_log('Yatra: AppServiceProvider::boot() called');
        // Load text domain
        add_action('init', [$this, 'loadTextDomain'], 1);

        // Customize REST API authentication error messages
        add_filter('rest_authentication_errors', [$this, 'customizeRestAuthErrors'], 10, 1);

        // Start session early for booking management (both frontend and REST API)
        add_action('init', [$this, 'startSession'], 1);
        add_action('rest_api_init', [$this, 'startSession'], 1);
        
        
        // Register cron jobs for booking reminders and expiry
        \Yatra\Services\BookingCronService::register();
        
        // Register scheduled payment processing (only if Pro enables it via filter)
        if (apply_filters('yatra_enable_scheduled_payments', false)) {
            \Yatra\Services\ScheduledPaymentService::register();
        }
        
        // Register export/import background job handlers
        \Yatra\Services\ExportImportService::register();

        // Register departure status update cron job
        add_action('init', function() {
            \Yatra\Services\DepartureCronService::registerCronHook();
        }, 5);
        add_action('yatra_daily_departure_status_update', function() {
            $service = new \Yatra\Services\DepartureCronService();
            $service->dailyStatusUpdate();
        });

        // Initialize plugin settings
        add_action('init', [$this, 'initSettings'], 5);
        
        // Ensure database tables exist
        add_action('init', [$this, 'ensureTablesExist'], 5);
        
        // Force flush rewrite rules if using plain permalinks to ensure REST API works
        add_action('init', function() {
            $permalink_structure = get_option('permalink_structure');
            if (empty($permalink_structure)) {
                // Plain permalinks - ensure REST API rewrite rules are flushed
                $flushed = get_option('yatra_rest_rewrite_flushed');
                if (!$flushed) {
                    flush_rewrite_rules();
                    update_option('yatra_rest_rewrite_flushed', true);
                    error_log('Yatra: Flushed rewrite rules for plain permalinks');
                }
            }
        }, 999);

        // Add rewrite rules for trip permalinks
        add_action('init', [$this, 'addTripRewriteRules'], 10);
        
        // Register custom query vars
        add_filter('query_vars', [$this, 'addCustomQueryVars']);

        // Register shortcodes
        add_action('init', [$this, 'registerShortcodes'], 10);

        // Register frontend account page - use early priority to catch before 404
        add_action('template_redirect', [$this, 'handleAccountPage'], 1);

        // Handle trip single page - use early priority to catch before 404
        add_action('template_redirect', [$this, 'handleTripPage'], 1);

        // Handle listing pages - use early priority to catch before 404
        add_action('template_redirect', [$this, 'handleListingPages'], 1);

        // Handle single taxonomy pages (destination, activity, category)
        add_action('template_redirect', [$this, 'handleSingleTaxonomyPage'], 1);

        // Handle booking page - use early priority to catch before 404
        add_action('template_redirect', [$this, 'handleBookingPage'], 1);
        
        // Handle booking confirmation page
        add_action('template_redirect', [$this, 'handleBookingConfirmationPage'], 1);
        
        // Handle invoice download
        add_action('template_redirect', [$this, 'handleInvoiceDownload'], 1);
        
        // Handle remaining checkout page
        add_action('template_redirect', [$this, 'handleRemainingCheckoutPage'], 1);

        // Ensure frontend bundles are marked as ES modules
        add_filter('script_loader_tag', [$this, 'addFrontendModuleType'], 10, 2);

        // Add "Edit Trip" to admin bar on single trip page
        add_action('admin_bar_menu', [$this, 'addEditTripAdminBarLink'], 80);
        
        // Add admin bar CSS for trip edit link
        add_action('wp_head', [$this, 'addAdminBarTripEditCSS']);

        // AJAX handler for review submission
        add_action('wp_ajax_yatra_submit_review', [$this, 'handleReviewSubmission']);
        add_action('wp_ajax_nopriv_yatra_submit_review', [$this, 'handleReviewSubmissionNoPriv']);

        // AJAX handler for enquiry submission (allow both logged in and guest users)
        add_action('wp_ajax_yatra_submit_enquiry', [$this, 'handleEnquirySubmission']);
        add_action('wp_ajax_nopriv_yatra_submit_enquiry', [$this, 'handleEnquirySubmission']);

        // Authentication (login, register, email verification)
        add_action('rest_api_init', [\Yatra\Controllers\AuthController::class, 'registerRoutes']);
        
        // Test endpoint to verify REST API is working
        add_action('rest_api_init', function() {
            register_rest_route('yatra/v1', '/test', [
                'methods' => 'GET',
                'callback' => function() {
                    return new \WP_REST_Response(['message' => 'Yatra REST API is working!'], 200);
                },
                'permission_callback' => '__return_true'
            ]);
            
            // Debug: List all registered yatra routes
            add_action('rest_api_init', function() {
                $server = rest_get_server();
                $routes = $server->get_routes();
                $yatra_routes = array_filter(array_keys($routes), function($route) {
                    return strpos($route, '/yatra/v1') === 0;
                });
                error_log('Yatra: All registered yatra/v1 routes: ' . print_r($yatra_routes, true));
            }, 999);
        });
        
        // REMOVED: BookingsController is already registered by RouteServiceProvider
        // The duplicate registration was causing conflicts
        // add_action('rest_api_init', function() {
        //     error_log('Yatra: Registering BookingsController routes');
        //     $bookingsController = new \Yatra\Controllers\BookingsController();
        //     $bookingsController->register_routes();
        //     error_log('Yatra: BookingsController routes registered');
        // });
        
        // License management (shows upgrade message in free, full functionality in Pro)
        // Only register Free version routes if Pro is not active
        add_action('rest_api_init', function() {
            if (!defined('YATRA_PRO_VERSION')) {
                $licenseController = new \Yatra\Controllers\LicenseController();
                $licenseController->register_routes();
            }
        });
        add_filter('authenticate', [\Yatra\Controllers\AuthController::class, 'blockUnverifiedUserLogin'], 30, 3);
        add_action('init', [\Yatra\Controllers\AuthController::class, 'registerCustomerRole'], 5);
        add_action('init', [\Yatra\Controllers\AuthController::class, 'handleWpLoginResendVerification'], 1);
        add_action('template_redirect', [\Yatra\Controllers\AuthController::class, 'handleEmailVerification'], 1);
        add_filter('login_message', [\Yatra\Controllers\AuthController::class, 'customLoginMessages']);
        add_filter('wp_login_errors', [\Yatra\Controllers\AuthController::class, 'customLoginErrors']);
    }

    /**
     * Start PHP session for booking management
     */
    public function startSession(): void
    {
        // Start output buffering to prevent accidental output from breaking sessions
        if (!ob_get_level()) {
            ob_start();
        }
        
        if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
            // Set session cookie parameters for better compatibility
            if (PHP_VERSION_ID >= 70300) {
                session_set_cookie_params([
                    'lifetime' => 0,
                    'path' => COOKIEPATH ?: '/',
                    'domain' => COOKIE_DOMAIN ?: '',
                    'secure' => is_ssl(),
                    'httponly' => true,
                    'samesite' => 'Lax'
                ]);
            }
            session_start();
        }
    }

    /**
     * Handle review submission for logged-in users
     */
    public function handleReviewSubmission(): void
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['yatra_review_nonce'] ?? '', 'yatra_submit_review')) {
            wp_send_json_error(['message' => __('Your session has expired. Please refresh the page and try again.', 'yatra')]);
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

        // Use ReviewRepository
        $reviewRepository = new ReviewRepository();

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
            $result = $reviewRepository->update($review_id, [
                'rating' => $rating,
                'title' => $title,
                'content' => $content,
            ]);

            if (!$result) {
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

            $result = $reviewRepository->create([
                'trip_id' => $trip_id,
                'user_id' => $user_id,
                'rating' => $rating,
                'title' => $title,
                'content' => $content,
                'author_name' => $author_name,
                'author_email' => $author_email,
                'status' => $status,
            ]);

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
     * Handle enquiry form submission
     */
    public function handleEnquirySubmission(): void
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['yatra_enquiry_nonce'] ?? '', 'yatra_submit_enquiry')) {
            wp_send_json_error(['message' => __('Your session has expired. Please refresh the page and try again.', 'yatra')]);
        }

        // Get and validate form data
        $trip_id = (int) ($_POST['trip_id'] ?? 0);
        $name = sanitize_text_field($_POST['name'] ?? '');
        $email = sanitize_email($_POST['email'] ?? '');
        $phone = sanitize_text_field($_POST['phone'] ?? '');
        $message = sanitize_textarea_field($_POST['message'] ?? '');
        $travel_date = sanitize_text_field($_POST['travel_date'] ?? '');
        $adults = (int) ($_POST['adults'] ?? 1);
        $children = (int) ($_POST['children'] ?? 0);

        // Validate required fields
        if (empty($name)) {
            wp_send_json_error(['message' => __('Please enter your name.', 'yatra')]);
        }

        if (empty($email) || !is_email($email)) {
            wp_send_json_error(['message' => __('Please enter a valid email address.', 'yatra')]);
        }

        if (empty($message) || strlen($message) < 10) {
            wp_send_json_error(['message' => __('Please enter a message (at least 10 characters).', 'yatra')]);
        }

        // Validate adults (at least 1)
        if ($adults < 1) {
            $adults = 1;
        }

        // Validate travel date format if provided
        $travel_date_formatted = null;
        if (!empty($travel_date)) {
            $date = \DateTime::createFromFormat('Y-m-d', $travel_date);
            if ($date) {
                $travel_date_formatted = $date->format('Y-m-d');
            }
        }

        // Get client IP
        $ip_address = $this->getClientIp();

        // Get user agent
        $user_agent = !empty($_SERVER['HTTP_USER_AGENT']) 
            ? substr(sanitize_text_field($_SERVER['HTTP_USER_AGENT']), 0, 500) 
            : null;

        // Use EnquiryRepository
        $enquiryRepository = new EnquiryRepository();

        // Insert enquiry
        $enquiry_id = $enquiryRepository->create([
            'trip_id' => $trip_id > 0 ? $trip_id : null,
            'name' => $name,
            'email' => $email,
            'phone' => $phone ?: null,
            'message' => $message,
            'adults' => $adults,
            'children' => $children,
            'travel_date' => $travel_date_formatted,
            'status' => 'new',
            'source' => 'website',
            'ip_address' => $ip_address,
            'user_agent' => $user_agent,
        ]);

        if (!$enquiry_id) {
            wp_send_json_error(['message' => __('Failed to submit enquiry. Please try again.', 'yatra')]);
        }

        // Send email notification if enabled
        $this->sendEnquiryNotificationEmail($enquiry_id, [
            'trip_id' => $trip_id,
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'message' => $message,
            'adults' => $adults,
            'children' => $children,
            'travel_date' => $travel_date_formatted,
        ]);

        wp_send_json_success([
            'message' => __('Thank you for your enquiry! We will get back to you as soon as possible.', 'yatra'),
        ]);
    }

    /**
     * Send email notification for new enquiry
     */
    private function sendEnquiryNotificationEmail(int $enquiry_id, array $data): void
    {
        // Get admin email
        $admin_email = get_option('admin_email');
        
        // Get trip title if available
        $trip_title = '';
        if (!empty($data['trip_id'])) {
            $tripRepository = new TripRepository();
            $trip = $tripRepository->find((int) $data['trip_id']);
            $trip_title = $trip ? $trip->title : '';
        }

        // Build email subject
        $subject = sprintf(
            __('[%s] New Enquiry from %s', 'yatra'),
            get_bloginfo('name'),
            $data['name']
        );

        // Build email body
        $body = sprintf(__("New enquiry received:\n\n", 'yatra'));
        $body .= sprintf(__("Name: %s\n", 'yatra'), $data['name']);
        $body .= sprintf(__("Email: %s\n", 'yatra'), $data['email']);
        
        if (!empty($data['phone'])) {
            $body .= sprintf(__("Phone: %s\n", 'yatra'), $data['phone']);
        }
        
        if (!empty($trip_title)) {
            $body .= sprintf(__("Trip: %s\n", 'yatra'), $trip_title);
        }
        
        $body .= sprintf(__("Travelers: %d Adults, %d Children\n", 'yatra'), $data['adults'], $data['children']);
        
        if (!empty($data['travel_date'])) {
            $body .= sprintf(__("Preferred Date: %s\n", 'yatra'), $data['travel_date']);
        }
        
        $body .= sprintf(__("\nMessage:\n%s\n", 'yatra'), $data['message']);
        
        // Add link to admin
        $admin_url = admin_url('admin.php?page=yatra&subpage=enquiries&action=view&id=' . $enquiry_id);
        $body .= sprintf(__("\nView in admin: %s\n", 'yatra'), $admin_url);

        // Send email
        wp_mail($admin_email, $subject, $body);
    }

    /**
     * Get client IP address
     */
    private function getClientIp(): string
    {
        $ip_keys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR'];
        
        foreach ($ip_keys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = sanitize_text_field($_SERVER[$key]);
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return '0.0.0.0';
    }

    /**
     * Add CSS for the Edit Trip/Taxonomy admin bar links
     */
    public function addAdminBarTripEditCSS(): void
    {
        // Only output CSS if user can see admin bar
        if (!is_user_logged_in() || !is_admin_bar_showing()) {
            return;
        }

        // Check if we're on a trip page or taxonomy page
        global $trip;
        $taxonomy_data = $GLOBALS['yatra_taxonomy_data'] ?? null;
        
        if (empty($trip) && empty($taxonomy_data)) {
            return;
        }

        echo '<style>
            #wpadminbar #wp-admin-bar-yatra-edit-trip > .ab-item:before,
            #wpadminbar #wp-admin-bar-yatra-edit-destination > .ab-item:before,
            #wpadminbar #wp-admin-bar-yatra-edit-activity > .ab-item:before,
            #wpadminbar #wp-admin-bar-yatra-edit-category > .ab-item:before {
                content: "\f464";
                font-family: dashicons;
                top: 2px;
            }
        </style>';
    }

    /**
     * Add "Edit Trip" link to admin bar on single trip page
     * Add "Edit Destination/Activity/Category" links on taxonomy pages
     *
     * @param \WP_Admin_Bar $admin_bar
     */
    public function addEditTripAdminBarLink($admin_bar): void
    {
        // Only for logged-in users who can edit
        if (!is_user_logged_in() || !current_user_can('edit_posts')) {
            return;
        }

        // Check if we're on a single trip page
        global $trip;
        if (!empty($trip) && !empty($trip->id)) {
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
            return;
        }

        // Check if we're on a taxonomy page (destination, activity, category)
        $taxonomy_data = $GLOBALS['yatra_taxonomy_data'] ?? null;
        if (!empty($taxonomy_data) && !empty($taxonomy_data['entity']) && !empty($taxonomy_data['type'])) {
            $entity = $taxonomy_data['entity'];
            $type = $taxonomy_data['type'];
            
            // Map type to admin tab (React-based UI under subpage=trips)
            $type_config = [
                'destination' => [
                    'tab' => 'destinations',
                    'label' => __('Edit Destination', 'yatra'),
                    'icon_id' => 'yatra-edit-destination',
                ],
                'activity' => [
                    'tab' => 'activities',
                    'label' => __('Edit Activity', 'yatra'),
                    'icon_id' => 'yatra-edit-activity',
                ],
                'category' => [
                    'tab' => 'categories',
                    'label' => __('Edit Category', 'yatra'),
                    'icon_id' => 'yatra-edit-category',
                ],
            ];
            
            if (isset($type_config[$type])) {
                $config = $type_config[$type];
                // Use the unified Trips React admin with appropriate tab
                $edit_url = admin_url('admin.php?page=yatra&subpage=trips&tab=' . $config['tab'] . '&action=edit&id=' . (int) $entity->id);
                
                $admin_bar->add_node([
                    'id'    => $config['icon_id'],
                    'title' => $config['label'],
                    'href'  => $edit_url,
                    'meta'  => [
                        'title' => sprintf(__('Edit this %s in Yatra admin', 'yatra'), $type),
                    ],
                ]);
            }
        }
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
     * Ensure required database tables exist
     * Creates missing tables if they don't exist
     * 
     * All table definitions are centralized in \Yatra\Core\Database
     */
    public function ensureTablesExist(): void
    {
        global $wpdb;
        $required_tables = [
            TripsTable::getTableName(),
            BookingsTable::getTableName(),
            BookingPaymentsTable::getTableName(),
            ScheduledPaymentsTable::getTableName(),
            PaymentTokensTable::getTableName(),
            CustomersTable::getTableName(),
            BookingTravellersTable::getTableName(),
            BookingTravellerMetaTable::getTableName(),
            BookingDeparturesTable::getTableName(),
            ReviewsTable::getTableName(),
            DiscountsTable::getTableName(),
            EnquiriesTable::getTableName(),
        ];

        $missing_table = false;
        foreach ($required_tables as $table_name) {
            $table_exists = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = %s AND table_name = %s",
                DB_NAME,
                $table_name
            ));

            if (!$table_exists) {
                $missing_table = true;
                break;
            }
        }

        if ($missing_table) {
            // Use centralized Database class to create ALL tables
            \Yatra\Core\Database::createTables();
        }
        
        // Always run updateTables to ensure schema is up to date
        // This handles migrations for existing installations
        \Yatra\Core\Database::updateTables();
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
        global $booking;
        
        // Parse shortcode attributes
        $atts = shortcode_atts([
            'trip_slug' => '',
        ], $atts, 'yatra_booking');
        
        // Prepare booking data from session (uses SettingsService internally)
        $booking = $this->prepareBookingData();

        // Enqueue booking assets with booking data
        $this->enqueueBookingPageAssets($booking);

        // Start output buffering
        ob_start();

        // Handle error states with modern UI
        if (!empty($booking->error)) {
            ?>
            <style>
                .yatra-error-page {
                    min-height: 50vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                }
                .yatra-error-card {
                    max-width: 480px;
                    width: 100%;
                    background: #ffffff;
                    border-radius: 20px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
                    padding: 48px 40px;
                    text-align: center;
                }
                .yatra-error-icon {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 24px;
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .yatra-error-icon svg {
                    width: 40px;
                    height: 40px;
                    color: #d97706;
                }
                .yatra-error-icon.error {
                    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
                }
                .yatra-error-icon.error svg {
                    color: #dc2626;
                }
                .yatra-error-title {
                    font-size: 26px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0 0 12px;
                    line-height: 1.3;
                }
                .yatra-error-message {
                    font-size: 15px;
                    color: #64748b;
                    margin: 0 0 32px;
                    line-height: 1.6;
                }
                .yatra-error-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .yatra-error-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 14px 28px;
                    border-radius: 10px;
                    font-size: 15px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                .yatra-error-btn-primary {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: #ffffff;
                    box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.4);
                }
                .yatra-error-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px 0 rgba(59, 130, 246, 0.5);
                    color: #ffffff;
                }
                .yatra-error-btn-secondary {
                    background: #f1f5f9;
                    color: #475569;
                }
                .yatra-error-btn-secondary:hover {
                    background: #e2e8f0;
                    color: #334155;
                }
                .yatra-error-divider {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin: 24px 0;
                    color: #94a3b8;
                    font-size: 13px;
                }
                .yatra-error-divider::before,
                .yatra-error-divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: #e2e8f0;
                }
            </style>
            <div class="yatra-error-page">
                <div class="yatra-error-card">
                    <?php if ($booking->error === 'no_session') : ?>
                        <div class="yatra-error-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                            </svg>
                        </div>
                        <h2 class="yatra-error-title"><?php esc_html_e('No Trip Selected', 'yatra'); ?></h2>
                        <p class="yatra-error-message">
                            <?php esc_html_e('It looks like you haven\'t selected a trip yet. Browse our amazing destinations and find your perfect adventure!', 'yatra'); ?>
                        </p>
                    <?php else : ?>
                        <div class="yatra-error-icon error">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                        </div>
                        <h2 class="yatra-error-title"><?php esc_html_e('Trip Not Available', 'yatra'); ?></h2>
                        <p class="yatra-error-message">
                            <?php esc_html_e('Sorry, the trip you\'re looking for is no longer available. Don\'t worry, we have plenty of other exciting adventures waiting for you!', 'yatra'); ?>
                        </p>
                    <?php endif; ?>
                    <div class="yatra-error-actions">
                        <a href="<?php echo esc_url(home_url('/trip/')); ?>" class="yatra-error-btn yatra-error-btn-primary">
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                            <?php esc_html_e('Explore Trips', 'yatra'); ?>
                        </a>
                        <div class="yatra-error-divider"><?php esc_html_e('or', 'yatra'); ?></div>
                        <a href="<?php echo esc_url(home_url()); ?>" class="yatra-error-btn yatra-error-btn-secondary">
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                            </svg>
                            <?php esc_html_e('Back to Home', 'yatra'); ?>
                        </a>
                    </div>
                </div>
            </div>
            <?php
            return ob_get_clean();
        }

        // Extract data from booking object for the template
        $trip = $booking->trip;
        $travel_date = $booking->travel_date;
        $total_travelers = $booking->travelers;
        $deposit_required = $booking->deposit_required;
        $deposit_percentage = $booking->deposit_percentage;
        $partial_payment = $booking->partial_payment;
        $partial_payment_percentage = $booking->partial_payment_percentage;
        $enabled_gateways = $booking->enabled_gateways;

        // Include the shared booking content partial (same as booking.php uses)
        $template_path = YATRA_PLUGIN_PATH . 'templates/partials/booking-content.php';
        
        if (file_exists($template_path)) {
            include $template_path;
        } else {
            echo '<p>' . esc_html__('Booking template not found.', 'yatra') . '</p>';
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
        // Enqueue common CSS first
        $this->enqueueCommonAssets();
        
        // Enqueue listing CSS for saved trips display
        $listing_css = YATRA_PLUGIN_PATH . 'public/css/listing.css';
        if (file_exists($listing_css)) {
            $css_url = str_replace(YATRA_PLUGIN_PATH, YATRA_PLUGIN_URL, $listing_css);
            $css_version = YATRA_VERSION . '.' . filemtime($listing_css);
            wp_enqueue_style(
                'yatra-listing',
                $css_url,
                ['yatra-common'],
                $css_version
            );
        }

        // Destination listing specific styles (icons, placeholders, etc.)
        $listing_page = get_query_var('yatra_listing_page');
        if ($listing_page === 'destination') {
            $dest_css_file = YATRA_PLUGIN_PATH . 'assets/css/destination.css';
            if (file_exists($dest_css_file)) {
                $dest_css_url     = str_replace(YATRA_PLUGIN_PATH, YATRA_PLUGIN_URL, $dest_css_file);
                $dest_css_version = YATRA_VERSION . '.' . filemtime($dest_css_file);
                wp_enqueue_style(
                    'yatra-destination',
                    $dest_css_url,
                    ['yatra-listing'],
                    $dest_css_version
                );
            }
        }
        
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
                ['yatra-common', 'yatra-listing'],
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
            
            // Localize script with API data and currency settings
            wp_localize_script('yatra-account-page', 'yatraAdmin', [
                'apiUrl' => rest_url('yatra/v1'),
                'nonce' => wp_create_nonce('wp_rest'),
                'currentUser' => $current_user->ID,
                'siteUrl' => home_url(),
                'locale' => get_locale(),
                'currency' => SettingsService::getCurrency(),
                'currencyPosition' => SettingsService::getCurrencyPosition(),
                'decimalPlaces' => SettingsService::getInt('decimal_places', 2),
                'thousandSeparator' => SettingsService::getString('thousand_separator', ','),
                'decimalSeparator' => SettingsService::getString('decimal_separator', '.'),
                'date_format' => SettingsService::get('date_format', 'Y-m-d'),
                'time_format' => SettingsService::get('time_format', 'H:i'),
            ]);
        }
    }

    /**
     * Add custom query vars for Yatra
     */
    public function addCustomQueryVars(array $vars): array
    {
        $vars[] = 'yatra_trip_slug';
        $vars[] = 'yatra_listing_page';
        $vars[] = 'yatra_booking_page';
        $vars[] = 'yatra_booking_confirmation';
        $vars[] = 'yatra_verify_email';
        // Single taxonomy pages
        $vars[] = 'yatra_destination_slug';
        $vars[] = 'yatra_activity_slug';
        $vars[] = 'yatra_category_slug';
        return $vars;
    }

    /**
     * Add rewrite rules for trip permalinks and listing pages
     */
    public function addTripRewriteRules(): void
    {
        // Use centralized SettingsService for all settings
        $trip_base = SettingsService::getTripBase();
        $booking_base = SettingsService::getBookingBase();
        $use_booking_page = SettingsService::useCustomBookingPage();
        
        // Get other bases with sanitization
        $destination_base = SettingsService::getString('destination_base', 'destination');
        $destination_base = preg_replace('/[^a-z0-9_-]/i', '', $destination_base) ?: 'destination';
        
        $activity_base = SettingsService::getString('activity_base', 'activity');
        $activity_base = preg_replace('/[^a-z0-9_-]/i', '', $activity_base) ?: 'activity';
        
        $trip_category_base = SettingsService::getString('trip_category_base', 'trip-category');
        $trip_category_base = preg_replace('/[^a-z0-9_-]/i', '', $trip_category_base) ?: 'trip-category';

        // Add query vars first (must be registered before rewrite rules)
        add_rewrite_tag('%yatra_trip_slug%', '([^&]+)');
        add_rewrite_tag('%yatra_listing_page%', '([^&]+)');
        add_rewrite_tag('%yatra_booking_page%', '([^&]+)');
        add_rewrite_tag('%yatra_booking_confirmation%', '([^&]+)');
        add_rewrite_tag('%yatra_remaining_checkout%', '([^&]+)');
        add_rewrite_tag('%yatra_verify_email%', '([^&]+)');
        // Single taxonomy page tags
        add_rewrite_tag('%yatra_destination_slug%', '([^&]+)');
        add_rewrite_tag('%yatra_activity_slug%', '([^&]+)');
        add_rewrite_tag('%yatra_category_slug%', '([^&]+)');
        
        // Add rewrite rule for email verification: /yatra-verify-email/{token}/
        add_rewrite_rule(
            '^yatra-verify-email/([a-zA-Z0-9_-]+)/?$',
            'index.php?yatra_verify_email=$matches[1]',
            'top'
        );

        // Add rewrite rule for trip single page: {trip_base}/{trip_slug}
        add_rewrite_rule(
            '^' . $trip_base . '/([^/]+)/?$',
            'index.php?yatra_trip_slug=$matches[1]',
            'top'
        );

        // Add rewrite rules for SINGLE taxonomy pages (must come before listing pages)
        // Single destination: /destination/{slug}/
        add_rewrite_rule(
            '^' . $destination_base . '/([^/]+)/?$',
            'index.php?yatra_destination_slug=$matches[1]',
            'top'
        );

        // Single activity: /activity/{slug}/
        add_rewrite_rule(
            '^' . $activity_base . '/([^/]+)/?$',
            'index.php?yatra_activity_slug=$matches[1]',
            'top'
        );

        // Single trip category: /trip-category/{slug}/
        add_rewrite_rule(
            '^' . $trip_category_base . '/([^/]+)/?$',
            'index.php?yatra_category_slug=$matches[1]',
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
        if (!$use_booking_page) {
            // Booking page: /{booking_base}/{trip_slug}
            add_rewrite_rule(
                '^' . $booking_base . '/([^/]+)/?$',
                'index.php?yatra_booking_page=$matches[1]',
                'top'
            );
            
            // Booking page without trip slug (session-based): /{booking_base}/
            add_rewrite_rule(
                '^' . $booking_base . '/?$',
                'index.php?yatra_booking_page=session',
                'top'
            );
        }
        
        // Add rewrite rule for remaining checkout page
        add_rewrite_rule(
            '^remaining-checkout/([^/]+)/?$',
            'index.php?yatra_remaining_checkout=$matches[1]',
            'top'
        );
    }

    /**
     * Handle trip single page
     */
    public function handleTripPage(): void
    {
        global $wp_query, $wp;

        // Use SettingsService for trip_base
        $trip_base = SettingsService::getTripBase();

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
            // Set proper 404 status
            $wp_query->set_404();
            status_header(404);
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

            // Check if request path matches listing page patterns using SettingsService
            if (!empty($request_path)) {
                $trip_base = SettingsService::getTripBase();
                $destination_base = SettingsService::getString('destination_base', 'destination');
                $destination_base = preg_replace('/[^a-z0-9_-]/i', '', $destination_base) ?: 'destination';
                $activity_base = SettingsService::getString('activity_base', 'activity');
                $activity_base = preg_replace('/[^a-z0-9_-]/i', '', $activity_base) ?: 'activity';
                $trip_category_base = SettingsService::getString('trip_category_base', 'trip-category');
                $trip_category_base = preg_replace('/[^a-z0-9_-]/i', '', $trip_category_base) ?: 'trip-category';
                
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

        // If this is the /trip listing, prepare real trips with filters + pagination
        if ($listing_page === 'trip') {
            global $wpdb;

            $trip_table         = TripsTable::getTableName();
            $dest_rel_table     = TripClassificationsTable::getTableName();
            $dest_table         = ClassificationsTable::getTableName();
            $act_rel_table      = TripClassificationsTable::getTableName();
            $act_table          = ClassificationsTable::getTableName();
            $cat_table          = ClassificationsTable::getTableName();
            $cat_rel_table      = TripClassificationsTable::getTableName();
            $reviews_table      = ReviewsTable::getTableName();

            // Pagination
            
            // For trip listing page, use proper MVC architecture
            if ($listing_page === 'trip') {
                // Use controller to handle the request
                $controller = new \Yatra\Controllers\TripListingController();
                
                // Process request if valid
                if ($controller->shouldProcessRequest($_GET)) {
                    $controller->handleTripListing($_GET);
                }
            }

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
    }

    /**
     * Handle single taxonomy pages (destination, activity, category)
     * Shows trips filtered by the selected destination/activity/category
     */
    public function handleSingleTaxonomyPage(): void
    {
        global $wp_query, $wpdb;

        // Check which taxonomy we're viewing
        $destination_slug = get_query_var('yatra_destination_slug');
        $activity_slug = get_query_var('yatra_activity_slug');
        $category_slug = get_query_var('yatra_category_slug');

        // Determine type and slug
        $type = '';
        $slug = '';

        if (!empty($destination_slug)) {
            $type = 'destination';
            $slug = sanitize_text_field($destination_slug);
        } elseif (!empty($activity_slug)) {
            $type = 'activity';
            $slug = sanitize_text_field($activity_slug);
        } elseif (!empty($category_slug)) {
            $type = 'category';
            $slug = sanitize_text_field($category_slug);
        }

        if (empty($type) || empty($slug)) {
            return;
        }

        // Get the entity from database
        $entity = null;
        $trips = [];

        switch ($type) {
            case 'destination':
                $table = $wpdb->prefix . 'yatra_destinations';
                $entity = $wpdb->get_row($wpdb->prepare(
                    "SELECT * FROM {$table} WHERE slug = %s AND status IN ('publish', 'published')",
                    $slug
                ));
                if ($entity) {
                    // Get trips for this destination
                    $trips_table = $wpdb->prefix . 'yatra_trips';
                    $relation_table = $wpdb->prefix . 'yatra_trip_destinations';
                    $trips = $wpdb->get_results($wpdb->prepare(
                        "SELECT t.* FROM {$trips_table} t
                         INNER JOIN {$relation_table} td ON t.id = td.trip_id
                         WHERE td.destination_id = %d 
                         AND t.status IN ('publish', 'published')
                         AND (t.deleted_at IS NULL OR t.deleted_at = '0000-00-00 00:00:00')
                         ORDER BY t.created_at DESC",
                        $entity->id
                    ));
                    
                }
                break;

            case 'activity':
                $table = $wpdb->prefix . 'yatra_activities';
                $entity = $wpdb->get_row($wpdb->prepare(
                    "SELECT * FROM {$table} WHERE slug = %s AND status IN ('publish', 'published')",
                    $slug
                ));
                if ($entity) {
                    // Get trips for this activity
                    $trips_table = $wpdb->prefix . 'yatra_trips';
                    $relation_table = $wpdb->prefix . 'yatra_trip_activities';
                    $trips = $wpdb->get_results($wpdb->prepare(
                        "SELECT t.* FROM {$trips_table} t
                         INNER JOIN {$relation_table} ta ON t.id = ta.trip_id
                         WHERE ta.activity_id = %d AND t.status IN ('publish', 'published')
                         AND (t.deleted_at IS NULL OR t.deleted_at = '0000-00-00 00:00:00')
                         ORDER BY t.created_at DESC",
                        $entity->id
                    ));
                }
                break;

            case 'category':
                $table = $wpdb->prefix . 'yatra_trip_categories';
                $entity = $wpdb->get_row($wpdb->prepare(
                    "SELECT * FROM {$table} WHERE slug = %s AND status IN ('publish', 'published')",
                    $slug
                ));
                if ($entity) {
                    // Get trips for this category
                    $trips_table = $wpdb->prefix . 'yatra_trips';
                    $relation_table = $wpdb->prefix . 'yatra_trip_trip_categories';
                    $trips = $wpdb->get_results($wpdb->prepare(
                        "SELECT t.* FROM {$trips_table} t
                         INNER JOIN {$relation_table} tc ON t.id = tc.trip_id
                         WHERE tc.category_id = %d AND t.status IN ('publish', 'published')
                         AND (t.deleted_at IS NULL OR t.deleted_at = '0000-00-00 00:00:00')
                         ORDER BY t.created_at DESC",
                        $entity->id
                    ));
                }
                break;
        }

        // If entity not found, return 404
        if (!$entity) {
            return; // Let WordPress handle the 404
        }

        // Prepare trips with additional data
        foreach ($trips as $trip) {
            // Add permalink
            $trip->permalink = yatra_get_trip_permalink($trip);
            
            // Get featured image URL
            if (!empty($trip->featured_image)) {
                $trip->featured_image_url = wp_get_attachment_url($trip->featured_image);
            } else {
                // Fallback to first gallery image
                $gallery_table = $wpdb->prefix . 'yatra_trip_gallery_images';
                $first_image = $wpdb->get_row($wpdb->prepare(
                    "SELECT image_url FROM {$gallery_table} WHERE trip_id = %d ORDER BY `order` ASC LIMIT 1",
                    $trip->id
                ));
                $trip->featured_image_url = $first_image ? $first_image->image_url : '';
            }
            
            // Get destinations for this trip
            $dest_table = $wpdb->prefix . 'yatra_destinations';
            $trip_dest_table = $wpdb->prefix . 'yatra_trip_destinations';
            $trip->destinations = $wpdb->get_results($wpdb->prepare(
                "SELECT d.name, d.slug FROM {$dest_table} d
                 INNER JOIN {$trip_dest_table} td ON d.id = td.destination_id
                 WHERE td.trip_id = %d",
                $trip->id
            ));
            $trip->location = !empty($trip->destinations) ? $trip->destinations[0]->name : '';
            
            // Get activities for this trip
            $act_table = $wpdb->prefix . 'yatra_activities';
            $trip_act_table = $wpdb->prefix . 'yatra_trip_activities';
            $trip->activities = $wpdb->get_results($wpdb->prepare(
                "SELECT a.name, a.slug FROM {$act_table} a
                 INNER JOIN {$trip_act_table} ta ON a.id = ta.activity_id
                 WHERE ta.trip_id = %d",
                $trip->id
            ));
            
            // Get categories for this trip - including parent/child
            $cat_table = $wpdb->prefix . 'yatra_trip_categories';
            $trip_cat_table = $wpdb->prefix . 'yatra_trip_trip_categories';
            $trip->categories = $wpdb->get_results($wpdb->prepare(
                "SELECT DISTINCT c.id, c.name, c.slug, c.parent_id FROM {$cat_table} c
                 INNER JOIN {$trip_cat_table} tc ON c.id = tc.category_id
                 WHERE tc.trip_id = %d AND c.status IN ('publish', 'published')
                 ORDER BY c.parent_id ASC, c.name ASC",
                $trip->id
            ));
            
            // Get difficulty name - try multiple possible table names
            if (!empty($trip->difficulty)) {
                $possible_tables = [
                    $wpdb->prefix . 'yatra_trip_difficulties',
                    $wpdb->prefix . 'yatra_difficulties',
                    $wpdb->prefix . 'yatra_difficulty_levels'
                ];
                
                foreach ($possible_tables as $difficulty_table) {
                    $table_exists = $wpdb->get_var("SHOW TABLES LIKE '{$difficulty_table}'");
                    if ($table_exists) {
                        $difficulty_name = $wpdb->get_var($wpdb->prepare(
                            "SELECT name FROM {$difficulty_table} WHERE id = %s OR slug = %s LIMIT 1",
                            $trip->difficulty, $trip->difficulty
                        ));
                        if ($difficulty_name) {
                            $trip->difficulty_name = $difficulty_name;
                            break;
                        }
                    }
                }
                
                // Don't create fake difficulty names - only use real database values
                // Removed fallback that was creating difficulty names from slugs
            }
            
            // Calculate average rating
            $reviews_table = $wpdb->prefix . 'yatra_reviews';
            $trip->average_rating = $wpdb->get_var($wpdb->prepare(
                "SELECT AVG(rating) FROM {$reviews_table} WHERE trip_id = %d AND status = 'approved'",
                $trip->id
            )) ?: 0;
            $trip->review_count = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$reviews_table} WHERE trip_id = %d AND status = 'approved'",
                $trip->id
            )) ?: 0;

            // Compute effective min price based on pricing type
            $trip->effective_price_min = 0;
            
            // Check if this is traveler-based pricing
            if (!empty($trip->pricing_type) && $trip->pricing_type === 'traveler_based') {
                // Query price types table for minimum and maximum prices
                $price_types_table = $wpdb->prefix . 'yatra_trip_price_types';
                // Get all price type data for discount calculation
                $all_price_types = $wpdb->get_results($wpdb->prepare(
                    "SELECT 
                        original_price,
                        discounted_price,
                        CASE 
                            WHEN discounted_price IS NOT NULL AND discounted_price > 0 THEN discounted_price 
                            ELSE original_price 
                        END as effective_price,
                        CASE 
                            WHEN discounted_price IS NOT NULL AND discounted_price > 0 AND original_price > 0 
                            THEN ROUND(((original_price - discounted_price) / original_price) * 100)
                            ELSE 0
                        END as discount_percentage
                    FROM {$price_types_table} 
                    WHERE trip_id = %d AND (
                        (discounted_price IS NOT NULL AND discounted_price > 0) OR 
                        (original_price IS NOT NULL AND original_price > 0)
                    )
                    ORDER BY effective_price ASC",
                    $trip->id
                ));
                
                if ($all_price_types && count($all_price_types) > 0) {
                    // Find minimum effective price and its corresponding original price
                    $min_price_row = $all_price_types[0]; // First row has minimum effective price
                    $trip->effective_price_min = (float)$min_price_row->effective_price;
                    $trip->min_category_original_price = (float)$min_price_row->original_price;
                    
                    // Find highest discount percentage among all categories
                    $max_discount = 0;
                    foreach ($all_price_types as $price_type) {
                        if ($price_type->discount_percentage > $max_discount) {
                            $max_discount = $price_type->discount_percentage;
                        }
                    }
                    $trip->max_discount_percentage = $max_discount;
                }
            } else {
                // Regular pricing logic
                if (!empty($trip->discounted_price) && (float)$trip->discounted_price > 0) {
                    $trip->effective_price_min = (float)$trip->discounted_price;
                } elseif (!empty($trip->sale_price) && (float)$trip->sale_price > 0) {
                    $trip->effective_price_min = (float)$trip->sale_price;
                } elseif (!empty($trip->original_price) && (float)$trip->original_price > 0) {
                    $trip->effective_price_min = (float)$trip->original_price;
                }
            }

            if (
                $trip->pricing_type === 'traveler_based'
            ) {
                $priceTypeTable = $wpdb->prefix . 'yatra_trip_price_types';

                $row = $wpdb->get_row($wpdb->prepare(
                    "SELECT
                        MAX(CASE
                            WHEN discounted_price IS NOT NULL AND discounted_price > 0 THEN discounted_price
                            ELSE original_price
                        END) AS max_price
                     FROM `{$priceTypeTable}`
                     WHERE trip_id = %d
                       AND (
                            (discounted_price IS NOT NULL AND discounted_price > 0)
                         OR (original_price IS NOT NULL AND original_price > 0)
                       )",
                    (int) $trip->id
                ));

                if ($row && $row->max_price !== null) {
                    $maxPrice = (float) $row->max_price;

                    if ($maxPrice > 0) {
                        $trip->effective_price_max = $maxPrice;
                    }
                }
            }
        }

        // Prevent 404 handling
        $wp_query->is_404 = false;
        status_header(200);

        // Set up template variables
        $taxonomy_data = [
            'type' => $type,
            'entity' => $entity,
            'trips' => $trips,
        ];

        // Enqueue listing page assets
        $this->enqueueListingPageAssets();

        // Load the appropriate template based on type
        $template_path = '';

        switch ($type) {
            case 'destination':
                // Re-use the trip listing template so design + sidebar match /trip exactly
                $template_path = YATRA_PLUGIN_PATH . 'templates/listing-trip.php';
                // Context for listing-trip: which destination and its trips
                $GLOBALS['yatra_taxonomy_context'] = [
                    'type'  => 'destination',
                    'entity'=> $entity,
                    'trips' => $trips,
                ];
                break;

            case 'activity':
                // Re-use the trip listing template so design + sidebar match /trip exactly
                $template_path = YATRA_PLUGIN_PATH . 'templates/listing-trip.php';
                // Context for listing-trip: which activity and its trips
                $GLOBALS['yatra_taxonomy_context'] = [
                    'type'  => 'activity',
                    'entity'=> $entity,
                    'trips' => $trips,
                ];
                break;

            case 'category':
                $template_path = YATRA_PLUGIN_PATH . 'templates/single-taxonomy.php';
                // Make data available to template
                $GLOBALS['yatra_taxonomy_data'] = $taxonomy_data;
                break;
        }

        if (file_exists($template_path)) {
            include $template_path;
            exit;
        } else {
            wp_die(sprintf('Single %s template not found: %s', $type, $template_path));
        }
    }

    /**
     * Handle booking page routing
     * 
     * Logic:
     * 1. If "Use Custom Page for Booking" is checked AND page is selected → Don't handle, let WordPress handle the custom page
     * 2. If NOT using custom page → Use "Default Booking URL Base" from settings (e.g., /bookings/)
     * 3. If booking base is empty → Fall back to /book/
     */
    public function handleBookingPage(): void
    {
        global $wp_query, $wp, $booking;

        // Step 1: If custom booking page is set up, don't handle anything here
        // WordPress will handle the custom page with the [yatra_booking] shortcode
        if (SettingsService::useCustomBookingPage()) {
            return;
        }

        // Step 2: Get the booking base from settings (or default to 'book')
        $booking_base = SettingsService::getBookingBase(); // Returns sanitized base or 'book'

        // Step 3: Get the current request path
        $request_path = isset($wp->request) ? trim((string) $wp->request, '/') : '';
        
        if (empty($request_path)) {
            $request_uri = $_SERVER['REQUEST_URI'] ?? '';
            $path = trim(wp_parse_url($request_uri, PHP_URL_PATH) ?? '', '/');
            $home_path = trim(wp_parse_url(home_url('/'), PHP_URL_PATH) ?? '', '/');
            if ($home_path && str_starts_with($path, $home_path)) {
                $path = trim(substr($path, strlen($home_path)), '/');
            }
            $request_path = $path;
        }

        // Step 4: Check if URL matches our booking base
        // Match: /bookings or /bookings/ or /bookings/something
        if ($request_path !== $booking_base && !str_starts_with($request_path, $booking_base . '/')) {
            return; // Not our URL
        }

        // Step 5: This IS our booking URL - handle it
        $wp_query->is_404 = false;
        status_header(200);

        // Prepare booking data from session first (needed for localized script data)
        $booking = $this->prepareBookingData();

        // Enqueue booking page assets with localized data
        $this->enqueueBookingPageAssets($booking);

        // Load the booking page template
        $template_path = YATRA_PLUGIN_PATH . 'templates/booking.php';

        if (file_exists($template_path)) {
            include $template_path;
            exit;
        } else {
            wp_die(__('Booking page template not found.', 'yatra'));
        }
    }

    /**
     * Handle invoice download request
     */
    public function handleInvoiceDownload(): void
    {
        // Check for invoice download request
        if (empty($_GET['yatra_invoice'])) {
            return;
        }

        $paymentId = (int) $_GET['yatra_invoice'];
        
        if ($paymentId <= 0) {
            wp_die(__('Invalid payment ID.', 'yatra'), __('Error', 'yatra'), ['response' => 400]);
        }

        // Verify nonce
        if (empty($_GET['_wpnonce']) || !wp_verify_nonce($_GET['_wpnonce'], 'wp_rest')) {
            wp_die(__('Your session has expired. Please refresh the page and try again.', 'yatra'), __('Session Expired', 'yatra'), ['response' => 403]);
        }

        // Must be logged in
        if (!is_user_logged_in()) {
            wp_die(__('You must be logged in to download invoices.', 'yatra'), __('Error', 'yatra'), ['response' => 401]);
        }

        $paymentRepository = new \Yatra\Repositories\PaymentRepository();
        $payment = $paymentRepository->findWithBooking($paymentId);

        if (!$payment) {
            wp_die(__('Payment not found.', 'yatra'), __('Error', 'yatra'), ['response' => 404]);
        }

        // Verify user owns this payment or is admin
        $currentUserId = get_current_user_id();
        $bookingUserId = (int) ($payment->booking_user_id ?? $payment->user_id ?? 0);
        
        if ($bookingUserId && $currentUserId !== $bookingUserId && !current_user_can('manage_options')) {
            wp_die(__('You do not have permission to access this invoice.', 'yatra'), __('Error', 'yatra'), ['response' => 403]);
        }

        // Get trip details
        $trip = null;
        if (!empty($payment->trip_id)) {
            $tripRepository = new \Yatra\Repositories\TripRepository();
            $trip = $tripRepository->find((int) $payment->trip_id);
        }

        // Get company settings
        $companyName = SettingsService::get('company_name', get_bloginfo('name'));
        $companyAddress = SettingsService::get('company_address', '');
        $companyEmail = SettingsService::get('company_email', get_option('admin_email'));
        $companyPhone = SettingsService::get('company_phone', '');
        $currencySymbol = yatra_get_currency_symbol(SettingsService::getCurrency());

        // Format dates
        $paymentDate = !empty($payment->created_at) ? date_i18n(get_option('date_format'), strtotime($payment->created_at)) : date_i18n(get_option('date_format'));
        $travelDate = !empty($payment->travel_date) ? date_i18n(get_option('date_format'), strtotime($payment->travel_date)) : '';

        // Generate invoice HTML
        $invoiceHtml = $this->generateInvoiceHtml($payment, $trip, [
            'company_name' => $companyName,
            'company_address' => $companyAddress,
            'company_email' => $companyEmail,
            'company_phone' => $companyPhone,
            'currency_symbol' => $currencySymbol,
            'payment_date' => $paymentDate,
            'travel_date' => $travelDate,
        ]);

        // Output invoice
        header('Content-Type: text/html; charset=utf-8');
        echo $invoiceHtml;
        exit;
    }

    /**
     * Generate invoice HTML
     */
    private function generateInvoiceHtml(object $payment, ?object $trip, array $data): string
    {
        $currencySymbol = $data['currency_symbol'];

        $amount = number_format((float) ($payment->amount ?? 0), 2);
        $bookingTotal = number_format((float) ($payment->booking_total_amount ?? $payment->amount ?? 0), 2);
        $amountPaid = number_format((float) ($payment->booking_amount_paid ?? $payment->amount ?? 0), 2);
        $amountDue = number_format((float) ($payment->booking_amount_due ?? 0), 2);

        $customerName = trim(($payment->contact_first_name ?? '') . ' ' . ($payment->contact_last_name ?? ''));
        if (empty($customerName)) {
            $customerName = $payment->customer_name ?? __('Customer', 'yatra');
        }
        $customerEmail = $payment->contact_email ?? $payment->customer_email ?? '';

        $tripTitle = $trip->title ?? $payment->trip_title ?? __('Trip Booking', 'yatra');
        $bookingRef = $payment->booking_reference ?? $payment->booking_number ?? '';
        $paymentRef = $payment->reference ?? 'PAY-' . $payment->id;
        $paymentMethod = ucfirst($payment->gateway ?? $payment->payment_method ?? 'Online');
        $paymentStatus = ucfirst($payment->status ?? 'completed');

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - {$paymentRef}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #333; background: #f5f5f5; padding: 20px; }
        .invoice { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .invoice-header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #fff; padding: 30px 40px; }
        .invoice-header h1 { font-size: 28px; font-weight: 700; margin-bottom: 5px; }
        .invoice-header p { opacity: 0.9; font-size: 14px; }
        .invoice-body { padding: 40px; }
        .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 30px; flex-wrap: wrap; gap: 20px; }
        .invoice-meta-block h3 { font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; letter-spacing: 0.5px; }
        .invoice-meta-block p { font-size: 14px; color: #111; margin-bottom: 4px; }
        .invoice-meta-block strong { font-weight: 600; }
        .invoice-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        .invoice-table th { background: #f9fafb; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
        .invoice-table td { padding: 16px; border-bottom: 1px solid #e5e7eb; }
        .invoice-table .amount { text-align: right; font-weight: 600; }
        .invoice-totals { margin-top: 20px; border-top: 2px solid #e5e7eb; padding-top: 20px; }
        .invoice-total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
        .invoice-total-row.grand-total { font-size: 18px; font-weight: 700; color: #1e40af; border-top: 2px solid #1e40af; margin-top: 10px; padding-top: 15px; }
        .invoice-footer { background: #f9fafb; padding: 20px 40px; text-align: center; font-size: 12px; color: #6b7280; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .status-completed, .status-paid { background: #d1fae5; color: #065f46; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .print-btn { display: block; margin: 20px auto; padding: 12px 24px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
        .print-btn:hover { background: #2563eb; }
        @media print { 
            body { background: #fff; padding: 0; } 
            .invoice { box-shadow: none; } 
            .print-btn { display: none; }
        }
    </style>
</head>
<body>
    <div class="invoice">
        <div class="invoice-header">
            <h1>{$data['company_name']}</h1>
            <p>Payment Invoice</p>
        </div>
        <div class="invoice-body">
            <div class="invoice-meta">
                <div class="invoice-meta-block">
                    <h3>Invoice To</h3>
                    <p><strong>{$customerName}</strong></p>
                    <p>{$customerEmail}</p>
                </div>
                <div class="invoice-meta-block">
                    <h3>Invoice Details</h3>
                    <p><strong>Invoice #:</strong> {$paymentRef}</p>
                    <p><strong>Date:</strong> {$data['payment_date']}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-{$payment->status}">{$paymentStatus}</span></p>
                </div>
                <div class="invoice-meta-block">
                    <h3>Company</h3>
                    <p>{$data['company_name']}</p>
                    <p>{$data['company_address']}</p>
                    <p>{$data['company_email']}</p>
                    <p>{$data['company_phone']}</p>
                </div>
            </div>

            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Booking Ref</th>
                        <th>Travel Date</th>
                        <th class="amount">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong>{$tripTitle}</strong><br>
                            <small style="color: #6b7280;">Payment via {$paymentMethod}</small>
                        </td>
                        <td>{$bookingRef}</td>
                        <td>{$data['travel_date']}</td>
                        <td class="amount">{$currencySymbol}{$amount}</td>
                    </tr>
                </tbody>
            </table>

            <div class="invoice-totals">
                <div class="invoice-total-row">
                    <span>Booking Total</span>
                    <span>{$currencySymbol}{$bookingTotal}</span>
                </div>
                <div class="invoice-total-row">
                    <span>Total Paid</span>
                    <span style="color: #059669;">{$currencySymbol}{$amountPaid}</span>
                </div>
                <div class="invoice-total-row">
                    <span>Balance Due</span>
                    <span>{$currencySymbol}{$amountDue}</span>
                </div>
                <div class="invoice-total-row grand-total">
                    <span>This Payment</span>
                    <span>{$currencySymbol}{$amount}</span>
                </div>
            </div>
        </div>
        <div class="invoice-footer">
            <p>Thank you for your booking! If you have any questions, please contact us at {$data['company_email']}</p>
            <p style="margin-top: 10px;">This invoice was generated on {$data['payment_date']}</p>
        </div>
    </div>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
</body>
</html>
HTML;
    }

    /**
     * Handle remaining checkout page (legacy URL - redirect to main checkout)
     */
    public function handleRemainingCheckoutPage(): void
    {
        global $wp;

        // Get the current request path
        $request_path = isset($wp->request) ? trim((string) $wp->request, '/') : '';
        
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

        // Check if URL matches remaining checkout base - redirect to main checkout
        if ($request_path === 'remaining-checkout' || str_starts_with($request_path, 'remaining-checkout/')) {
            // Redirect to main checkout URL - session type determines behavior
            wp_safe_redirect(yatra_get_checkout_url());
            exit;
        }
    }

    /**
     * Prepare booking page data from session
     * 
     * @return object Booking data object
     */
    private function prepareBookingData(): object
    {
        // Check for remaining payment session first (takes priority)
        $is_remaining = yatra_has_remaining_session();
        $session = $is_remaining ? yatra_get_remaining_session() : yatra_get_booking_session();
        $session_type = $is_remaining ? 'remaining' : 'booking';

        // Initialize booking data object using SettingsService
        // Flexible payments (deposit/partial) are Pro features - check if module is enabled
        $flexible_payments_enabled = apply_filters('yatra_flexible_payments_enabled', false);
        
        $booking = (object) [
            'has_session' => false,
            'session_type' => $session_type,
            'trip' => null,
            'travel_date' => '',
            'travelers' => 1,
            'deposit_required' => $flexible_payments_enabled && SettingsService::isEnabled('deposit_required'),
            'deposit_percentage' => SettingsService::getInt('deposit_percentage', 20),
            'partial_payment' => $flexible_payments_enabled && SettingsService::isEnabled('partial_payment'),
            'partial_payment_percentage' => SettingsService::getInt('partial_payment_percentage', 30),
            'enabled_gateways' => [],
            'error' => null,
            // Cancellation & Refund Policy
            'cancellation_policy' => SettingsService::get('cancellation_policy', 'full_refund'),
            'cancellation_days' => SettingsService::getInt('cancellation_days', 7),
            'refund_policy' => SettingsService::get('refund_policy', ''),
            // Login requirements
            'require_login' => SettingsService::isEnabled('require_login'),
            'allow_guest_checkout' => SettingsService::isEnabled('allow_guest_checkout'),
        ];

        // Check if we have valid session (remaining or booking)
        if (!$is_remaining && !yatra_has_booking_session()) {
            $booking->error = 'no_session';
            return $booking;
        }

        $booking->has_session = true;
        $trip_id = (int) ($session['trip_id'] ?? 0);
        $booking->travel_date = $session['travel_date'] ?? '';
        $booking->travelers = max(1, (int) ($session['travelers'] ?? 1));
        
        // Remaining payment specific data
        $booking->is_remaining_payment = $is_remaining;
        $booking->existing_booking_id = (int) ($session['booking_id'] ?? $session['existing_booking_id'] ?? 0);
        $booking->booking_reference = $session['booking_reference'] ?? '';
        $booking->remaining_amount = isset($session['remaining_amount']) ? (float) $session['remaining_amount'] : null;
        $booking->amount_paid = isset($session['amount_paid']) ? (float) $session['amount_paid'] : null;
        $booking->total_amount = isset($session['total_amount']) ? (float) $session['total_amount'] : null;
        
        // Contact info from remaining session
        $booking->contact_first_name = $session['contact_first_name'] ?? '';
        $booking->contact_last_name = $session['contact_last_name'] ?? '';
        $booking->contact_email = $session['contact_email'] ?? '';
        $booking->contact_phone = $session['contact_phone'] ?? '';

        if (is_user_logged_in()) {
            $user_id = get_current_user_id();
            $user = wp_get_current_user();

            if (empty($booking->contact_email) && !empty($user->user_email)) {
                $booking->contact_email = (string) $user->user_email;
            }

            if (empty($booking->contact_first_name) && !empty($user->first_name)) {
                $booking->contact_first_name = (string) $user->first_name;
            }

            if (empty($booking->contact_last_name) && !empty($user->last_name)) {
                $booking->contact_last_name = (string) $user->last_name;
            }

            if ((empty($booking->contact_first_name) || empty($booking->contact_last_name)) && !empty($user->display_name)) {
                $name_parts = preg_split('/\s+/', (string) $user->display_name, -1, PREG_SPLIT_NO_EMPTY);
                if (is_array($name_parts) && !empty($name_parts)) {
                    if (empty($booking->contact_first_name)) {
                        $booking->contact_first_name = (string) $name_parts[0];
                    }
                    if (empty($booking->contact_last_name) && count($name_parts) > 1) {
                        $booking->contact_last_name = (string) implode(' ', array_slice($name_parts, 1));
                    }
                }
            }

            if (empty($booking->contact_phone) && $user_id > 0) {
                $phone_meta_keys = [
                    'contact_phone',
                    'phone',
                    'billing_phone',
                    'woocommerce_billing_phone',
                    'user_phone',
                ];

                foreach ($phone_meta_keys as $meta_key) {
                    $meta_val = get_user_meta($user_id, $meta_key, true);
                    if (!empty($meta_val)) {
                        $booking->contact_phone = sanitize_text_field((string) $meta_val);
                        break;
                    }
                }
            }
        }
        
        // Session-based availability data
        $booking->departure_time = $session['departure_time'] ?? '';
        $booking->availability_id = $session['availability_id'] ?? null;
        $booking->pricing_type = $session['pricing_type'] ?? 'regular';
        $booking->price_types = $session['price_types'] ?? [];
        $booking->traveler_counts = $session['traveler_counts'] ?? [];
        $booking->is_day_trip = $session['is_day_trip'] ?? false;
        $booking->session_price = isset($session['trip_price']) ? (float) $session['trip_price'] : 0;

        // Fetch trip from database using TripRepository
        $tripRepository = new TripRepository();
        $trip = $tripRepository->findPublished($trip_id);

        if (!$trip) {
            yatra_clear_booking_session();
            $booking->has_session = false;
            $booking->error = 'trip_not_found';
            return $booking;
        }

        // Use session price if available, otherwise use trip price
        $price = $booking->session_price > 0 ? $booking->session_price : (!empty($trip->sale_price) ? (float) $trip->sale_price : (float) $trip->original_price);
        
        // If no pricing_type from session, use trip's
        if (empty($booking->pricing_type) || $booking->pricing_type === 'regular') {
            $booking->pricing_type = $trip->pricing_type ?? 'regular';
        }
        
        // If no price_types from session and traveler_based, get from trip
        if (empty($booking->price_types) && $booking->pricing_type === 'traveler_based') {
            // Fetch price types from database
            global $wpdb;
            $price_types_table = $wpdb->prefix . 'yatra_trip_price_types';
            $categories_table = $wpdb->prefix . 'yatra_traveler_categories';
            
            $price_types = $wpdb->get_results($wpdb->prepare(
                "SELECT pt.*, tc.label as category_label, tc.slug as category_slug, tc.age_min, tc.age_max
                 FROM {$price_types_table} pt
                 LEFT JOIN {$categories_table} tc ON pt.category_id = tc.id
                 WHERE pt.trip_id = %d
                 ORDER BY pt.id ASC",
                $trip_id
            ));
            
            foreach ($price_types as $pt) {
                $pt->effective_price = $pt->sale_price ?? $pt->discounted_price ?? $pt->original_price ?? 0;
            }
            
            $booking->price_types = $price_types;
        }

        // Prepare trip data
        $booking->trip = (object) [
            'id' => (int) $trip->id,
            'title' => $trip->title,
            'slug' => $trip->slug,
            'featured_image' => $trip->featured_image ?: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80',
            'duration_days' => (int) $trip->duration_days,
            'duration_nights' => (int) $trip->duration_nights,
            'difficulty_level' => $trip->difficulty_level,
            'min_travelers' => (int) ($trip->min_travelers ?: 1),
            'max_travelers' => (int) ($trip->max_travelers ?: 20),
            'original_price' => (float) $trip->original_price,
            'sale_price' => (float) $trip->sale_price,
            'price' => $price,
            'currency' => SettingsService::getCurrency(),
            'currencyPosition' => SettingsService::getCurrencyPosition(),
            'decimalPlaces' => SettingsService::getInt('decimal_places', 2),
            'thousandSeparator' => SettingsService::getString('thousand_separator', ','),
            'decimalSeparator' => SettingsService::getString('decimal_separator', '.'),
            'starting_location' => $trip->starting_location,
            'ending_location' => $trip->ending_location,
            'pricing_type' => $booking->pricing_type,
        ];

        if ($booking->is_remaining_payment) {
            $booking->deposit_required = false;
            $booking->partial_payment = false;
        }

        // Load enabled payment gateways
        $booking->enabled_gateways = $this->getEnabledGateways();

        // Calculate applicable group discount
        $booking->group_discount = null;
        if (!empty($booking->traveler_counts) && !empty($booking->price_types)) {
            $discountService = new \Yatra\Services\DiscountService();
            $booking->group_discount = $discountService->calculateGroupDiscount(
                (int) $trip_id,
                $booking->traveler_counts,
                $booking->price_types
            );
        }

        return $booking;
    }

    /**
     * Get enabled payment gateways
     * 
     * @return array Enabled gateways
     */
    private function getEnabledGateways(): array
    {
        // Use SettingsService to get gateway configurations
        $gateway_configs = SettingsService::get('gateway_configs', []);
        $gateway_order = SettingsService::get('gateway_order', []);
        
        // Fallback: Check database directly if SettingsService returns empty
        if (empty($gateway_configs)) {
            $db_configs = get_option('yatra_gateway_configs', []);
            if (!empty($db_configs)) {
                if (is_string($db_configs)) {
                    $db_configs = maybe_unserialize($db_configs);
                }
                $gateway_configs = $db_configs;
            }
        }
        
        if (empty($gateway_order)) {
            $db_order = get_option('yatra_gateway_order', []);
            if (!empty($db_order)) {
                if (is_string($db_order)) {
                    $db_order = maybe_unserialize($db_order);
                }
                $gateway_order = $db_order;
            }
        }
        
        $enabled_gateways = [];
        
        // Debug logging
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra Gateway Debug - gateway_configs: ' . print_r($gateway_configs, true));
            error_log('Yatra Gateway Debug - gateway_order: ' . print_r($gateway_order, true));
        }

        if (class_exists('Yatra\PaymentGateways\PaymentGatewayRegistry')) {
            $registry = \Yatra\PaymentGateways\PaymentGatewayRegistry::getInstance();
            $all_gateways = $registry->getAll();
            
            // Sort by gateway_order if available
            if (!empty($gateway_order)) {
                $sorted_gateways = [];
                foreach ($gateway_order as $gateway_id) {
                    if (isset($all_gateways[$gateway_id])) {
                        $sorted_gateways[$gateway_id] = $all_gateways[$gateway_id];
                    }
                }
                foreach ($all_gateways as $gateway_id => $gateway) {
                    if (!isset($sorted_gateways[$gateway_id])) {
                        $sorted_gateways[$gateway_id] = $gateway;
                    }
                }
                $all_gateways = $sorted_gateways;
            }
            
            foreach ($all_gateways as $gateway_id => $gateway) {
                $config = $gateway_configs[$gateway_id] ?? [];
                
                // Check if gateway is enabled (support both 'enabled' and '1' formats)
                $enabled_value = $config['enabled'] ?? false;
                $is_enabled = !empty($enabled_value) || $enabled_value === '1' || $enabled_value === true;
                
                // Debug logging for each gateway
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log("[Yatra] Gateway {$gateway_id}: enabled=" . var_export($enabled_value, true) . ", is_enabled=" . var_export($is_enabled, true));
                }
                
                if ($is_enabled) {
                    // Use custom values from config if available, otherwise use gateway defaults
                    $enabled_gateways[$gateway_id] = [
                        'id' => $gateway_id,
                        'title' => !empty($config['title']) ? $config['title'] : $gateway->getTitle(),
                        'description' => !empty($config['description']) ? $config['description'] : $gateway->getDescription(),
                        'icon' => !empty($config['icon']) ? $config['icon'] : $gateway->getIcon(),
                        'is_offline' => $gateway->isOffline(),
                    ];
                }
            }
        }

        // Fallback if no gateways enabled
        if (empty($enabled_gateways)) {
            $enabled_gateways = [
                'pay_later' => [
                    'id' => 'pay_later',
                    'title' => __('Book Now, Pay Later', 'yatra'),
                    'description' => __('Reserve now and pay before the trip', 'yatra'),
                    'icon' => '',
                    'is_offline' => true,
                ],
            ];
        }

        return $enabled_gateways;
    }

    /**
     * Enqueue booking page assets
     * 
     * @param object|null $booking Booking data object
     */
    private function enqueueBookingPageAssets(?object $booking = null): void
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

        // Enqueue Stripe CSS
        $stripe_css = YATRA_PLUGIN_PATH . 'public/css/stripe.css';
        if (file_exists($stripe_css)) {
            $stripe_css_url = str_replace(YATRA_PLUGIN_PATH, YATRA_PLUGIN_URL, $stripe_css);
            $css_version = YATRA_VERSION . '.' . filemtime($stripe_css);
            wp_enqueue_style(
                'yatra-stripe',
                $stripe_css_url,
                [],
                $css_version
            );
        }

        // Enqueue JS
        $js_file = YATRA_PLUGIN_PATH . 'public/js/booking.js';
        if (file_exists($js_file)) {
            $js_url = str_replace(YATRA_PLUGIN_PATH, YATRA_PLUGIN_URL, $js_file);
            $js_version = YATRA_VERSION . '.' . filemtime($js_file);
            
            // Enqueue Stripe.js as a dependency
            wp_enqueue_script(
                'yatra-stripe',
                YATRA_PLUGIN_URL . 'public/js/stripe.js',
                ['jquery'],
                $js_version,
                true
            );
            
            // Enqueue main booking script with Stripe as a dependency
            wp_enqueue_script(
                'yatra-booking',
                $js_url,
                ['jquery', 'yatra-stripe'],
                $js_version,
                true
            );

            // Get Stripe settings from gateway configs with backward compatibility
            $gateway_configs = get_option('yatra_gateway_configs', []);
            if (is_string($gateway_configs)) {
                $gateway_configs = maybe_unserialize($gateway_configs);
            }

            $stripe_settings = $gateway_configs['stripe'] ?? [];

            // Fallback to legacy option keys if needed
            if (empty($stripe_settings)) {
                $legacy_settings = get_option('yatra_payment_gateway_stripe', []);
                if (is_array($legacy_settings)) {
                    $stripe_settings = $legacy_settings;
                }
            }

            $is_test_mode = !empty($stripe_settings['test_mode']) && $stripe_settings['test_mode'] !== 'no';
            $publishable_key = $stripe_settings['api_key']
                ?? ($is_test_mode ? ($stripe_settings['test_publishable_key'] ?? '') : ($stripe_settings['live_publishable_key'] ?? ''));

            $enabled_methods_raw = $stripe_settings['enabled_methods'] ?? 'card,google_pay,apple_pay';
            if (is_string($enabled_methods_raw)) {
                $enabled_methods_raw = explode(',', $enabled_methods_raw);
            }
            if (!is_array($enabled_methods_raw)) {
                $enabled_methods_raw = ['card'];
            }
            $enabled_methods = array_values(array_filter(array_map(static function ($method) {
                return trim((string) $method);
            }, $enabled_methods_raw)));

            if (empty($enabled_methods)) {
                $enabled_methods = ['card'];
            }

            // Localize script with booking data using SettingsService
            $localized_data = [
                'apiUrl' => rest_url('yatra/v1'),
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('wp_rest'),
                'stripe' => [
                    'publishableKey' => $publishable_key,
                    'isTestMode' => $is_test_mode,
                    'enabledMethods' => $enabled_methods,
                ],
                'depositPercentage' => $booking->deposit_percentage ?? SettingsService::getInt('deposit_percentage', 20),
                'partialPercentage' => $booking->partial_payment_percentage ?? SettingsService::getInt('partial_payment_percentage', 30),
                'tripPrice' => 0,
                'currency' => SettingsService::getCurrency(),
                'currencyPosition' => SettingsService::getCurrencyPosition(),
                'decimalPlaces' => SettingsService::getInt('decimal_places', 2),
                'thousandSeparator' => SettingsService::getString('thousand_separator', ','),
                'decimalSeparator' => SettingsService::getString('decimal_separator', '.'),
                'minTravelers' => 1,
                'maxTravelers' => 20,
                'sessionType' => $booking->session_type ?? 'booking',
                'isRemainingPayment' => !empty($booking->is_remaining_payment),
                'existingBookingId' => $booking->existing_booking_id ?? 0,
                'bookingReference' => $booking->booking_reference ?? '',
                'remainingAmount' => $booking->remaining_amount ?? 0,
                'totalAmount' => $booking->total_amount ?? 0,
                'amountPaid' => $booking->amount_paid ?? 0,
                'tripTitle' => $booking->trip->title ?? __('Trip Booking', 'yatra'),
                'tripSlug' => $booking->trip->slug ?? '',
                'travelerCount' => $booking->travelers ?? 1,
                'contactEmail' => $booking->contact_email ?? '',
                'contactFirstName' => $booking->contact_first_name ?? '',
                'contactLastName' => $booking->contact_last_name ?? '',
                'contactPhone' => $booking->contact_phone ?? '',
            ];

            // Add trip-specific data if available
            if ($booking && $booking->trip) {
                $localized_data['tripPrice'] = $booking->trip->price ?? 0;
                // Always use global currency setting
                $localized_data['currency'] = SettingsService::getCurrency();
                $localized_data['minTravelers'] = $booking->trip->min_travelers ?? 1;
                $localized_data['maxTravelers'] = $booking->trip->max_travelers ?? 20;
                $localized_data['tripTitle'] = $booking->trip->title ?? __('Trip Booking', 'yatra');
                
                // Add group discounts for this trip
                try {
                    $discountService = new \Yatra\Services\DiscountService();
                    $groupDiscounts = $discountService->getGroupDiscountsForTrip((int) $booking->trip->id);
                    $localized_data['groupDiscounts'] = $groupDiscounts;
                } catch (\Exception $e) {
                    $localized_data['groupDiscounts'] = [];
                }
            }

            $localized_data['companyCountry'] = SettingsService::get('company_country', 'US');
            $localized_data['siteName'] = get_bloginfo('name');

            if (!empty($booking->is_remaining_payment)) {
                $localized_data['paymentDue'] = $booking->remaining_amount ?? 0;
            }
            
            // Add gateway-specific frontend data
            $registry = \Yatra\PaymentGateways\PaymentGatewayRegistry::getInstance();
            $localized_data['gateways'] = $registry->getFrontendData();

            wp_localize_script('yatra-booking', 'yatraBookingData', $localized_data);
            
            // Enqueue gateway-specific scripts
            $registry->enqueueScripts();
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
        // Enqueue common CSS
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
        
        // Enqueue capacity CSS
        $capacity_css = YATRA_PLUGIN_PATH . 'assets/css/yatra-capacity.css';
        if (file_exists($capacity_css)) {
            $capacity_css_url = str_replace(YATRA_PLUGIN_PATH, YATRA_PLUGIN_URL, $capacity_css);
            $css_version = YATRA_VERSION . '.' . filemtime($capacity_css);
            wp_enqueue_style(
                'yatra-capacity',
                $capacity_css_url,
                ['yatra-common'],
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

        // Enqueue wishlist JS
        $wishlist_js_file = YATRA_PLUGIN_PATH . 'public/js/listing-wishlist.js';
        if (file_exists($wishlist_js_file)) {
            $wishlist_js_url = str_replace(YATRA_PLUGIN_PATH, YATRA_PLUGIN_URL, $wishlist_js_file);
            $wishlist_js_version = YATRA_VERSION . '.' . filemtime($wishlist_js_file);
            wp_enqueue_script(
                'yatra-listing-wishlist',
                $wishlist_js_url,
                ['yatra-listing'],
                $wishlist_js_version,
                true
            );
            
            // Localize script with required data
            wp_localize_script('yatra-listing-wishlist', 'yatraAdmin', [
                'rest_url' => rest_url(),
                'nonce' => wp_create_nonce('wp_rest'),
                'is_logged_in' => is_user_logged_in(),
                'login_url' => wp_login_url()
            ]);
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
        
        // Enqueue availability cards clean CSS
        $availability_css = YATRA_PLUGIN_PATH . 'public/css/availability-cards-clean.css';
        if (file_exists($availability_css)) {
            $availability_css_url = str_replace(YATRA_PLUGIN_PATH, YATRA_PLUGIN_URL, $availability_css);
            $availability_css_version = YATRA_VERSION . '.' . filemtime($availability_css);
            wp_enqueue_style(
                'yatra-availability-cards-clean',
                $availability_css_url,
                ['yatra-trip'],
                $availability_css_version
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
            global $trip;
            
            // Get trip ID and slug from the global $trip object
            $trip_id = !empty($trip->id) ? (int) $trip->id : 0;
            $trip_slug = !empty($trip->slug) ? $trip->slug : '';
            
            // Get currency settings from SettingsService
            $currency = SettingsService::getCurrency();
            $currency_position = SettingsService::getCurrencyPosition();
            $decimal_places = SettingsService::getInt('decimal_places', 2);
            $thousand_separator = SettingsService::getString('thousand_separator', ',');
            $decimal_separator = SettingsService::getString('decimal_separator', '.');
            $currency_symbol = CurrencyHelper::getSymbol($currency);
            
            wp_localize_script('yatra-trip', 'yatraTripData', [
                'tripId' => $trip_id,
                'tripSlug' => $trip_slug,
                'apiUrl' => rest_url('yatra/v1'),
                'restUrl' => rest_url('yatra/v1'),
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('wp_rest'),
                'bookingUrl' => yatra_get_checkout_url(),
                'isLoggedIn' => is_user_logged_in(),
                'loginUrl' => wp_login_url(get_permalink()),
                'currency' => $currency,
                'currencySymbol' => $currency_symbol,
                'currencyPosition' => $currency_position,
                'decimalPlaces' => $decimal_places,
                'thousandSeparator' => $thousand_separator,
                'decimalSeparator' => $decimal_separator,
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
     * Handle booking confirmation page
     */
    public function handleBookingConfirmationPage(): void
    {
        global $wp_query, $wp;

        // Check for query var first
        $booking_reference = get_query_var('yatra_booking_confirmation', '');
        $booking = null;
        $bookingRepository = new BookingRepository();
        $tripRepository = new TripRepository();
        $reviewRepository = new ReviewRepository();

        // Also check URL path directly
        if (empty($booking_reference)) {
            $request_path = isset($wp->request) ? trim($wp->request, '/') : '';

            if (preg_match('/^booking-confirmation\/([^\/]+)\/?$/', $request_path, $matches)) {
                $booking_reference = $matches[1];
            }
        }

        // Also check GET parameter (for custom confirmation pages)
        if (empty($booking_reference) && !empty($_GET['booking'])) {
            $booking_reference = sanitize_text_field($_GET['booking']);
        }

        // Support legacy URLs that provide booking_id instead of reference
        $legacyBookingId = null;
        if (empty($booking_reference) && !empty($_GET['booking_id'])) {
            $legacyBookingId = absint($_GET['booking_id']);
            if ($legacyBookingId > 0) {
                $bookingById = $bookingRepository->findWithTrip($legacyBookingId);
                if ($bookingById && !empty($bookingById->reference)) {
                    $booking_reference = $bookingById->reference;

                    $redirectUrl = home_url('/booking-confirmation/' . rawurlencode($booking_reference) . '/');
                    wp_safe_redirect($redirectUrl);
                    exit;
                }
            }
        }

        if (empty($booking_reference)) {
            return;
        }

        // Fetch booking from database using BookingRepository (if not already loaded)
        global $booking_data;
        if (!$booking) {
            $booking = $bookingRepository->findByReferenceWithTrip($booking_reference);
        }

        if (!$booking) {
            // Show 404 for invalid booking reference
            $wp_query->set_404();
            status_header(404);
            return;
        }

        // Handle payment gateway returns (generic - each gateway checks if it should handle)
        error_log('[Yatra] Checking payment return handlers. GET params: ' . print_r($_GET, true));
        $registry = \Yatra\PaymentGateways\PaymentGatewayRegistry::getInstance();
        foreach ($registry->getAll() as $gateway) {
            $gatewayId = $gateway->getId();
            if (method_exists($gateway, 'shouldHandleReturn')) {
                $shouldHandle = $gateway->shouldHandleReturn($_GET);
                error_log("[Yatra] Gateway {$gatewayId} shouldHandleReturn: " . ($shouldHandle ? 'yes' : 'no'));
                if ($shouldHandle) {
                    error_log("[Yatra] Calling handlePaymentReturn for {$gatewayId}");
                    $gateway->handlePaymentReturn($booking, $bookingRepository);
                    // Reload booking to make sure we have the latest status/details updated by the gateway
                    $booking = $bookingRepository->findByReferenceWithTrip($booking_reference);
                    break;
                }
            }
        }

        if (!$booking) {
            $wp_query->set_404();
            status_header(404);
            return;
        }

        // Parse JSON data
        $booking->travelers = json_decode($booking->travelers_data, true) ?: [];
        $booking->contact = json_decode($booking->contact_data, true) ?: [];
        $booking->emergency = json_decode($booking->emergency_contact, true) ?: [];

        // Normalize enriched trip data
        $booking->trip_average_rating = isset($booking->trip_average_rating)
            ? round((float) $booking->trip_average_rating, 1)
            : null;
        $booking->trip_review_count = isset($booking->trip_review_count)
            ? (int) $booking->trip_review_count
            : 0;

        $booking->trip_destinations_list = !empty($booking->trip_destinations)
            ? array_filter(array_map('trim', explode(',', $booking->trip_destinations)))
            : [];
        $booking->trip_activities_list = !empty($booking->trip_activities)
            ? array_filter(array_map('trim', explode(',', $booking->trip_activities)))
            : [];
        $booking->trip_categories_list = !empty($booking->trip_categories)
            ? array_filter(array_map('trim', explode(',', $booking->trip_categories)))
            : [];

        // Enrich trip metadata if still missing
        if ((empty($booking->trip_destinations_list) || empty($booking->trip_activities_list) || empty($booking->trip_categories_list) || empty($booking->featured_image)) && !empty($booking->trip_id)) {
            $relatedTrip = $tripRepository->findWithRelations((int) $booking->trip_id);
            if ($relatedTrip) {
                if (empty($booking->trip_destinations_list) && !empty($relatedTrip->destinations)) {
                    $booking->trip_destinations_list = array_values(array_filter(array_unique(array_map(static function ($destination) {
                        return trim($destination->destination_name ?? $destination->name ?? '');
                    }, $relatedTrip->destinations))));
                }

                if (empty($booking->trip_activities_list) && !empty($relatedTrip->activities)) {
                    $booking->trip_activities_list = array_values(array_filter(array_unique(array_map(static function ($activity) {
                        return trim($activity->activity_name ?? $activity->name ?? '');
                    }, $relatedTrip->activities))));
                }

                if (empty($booking->trip_categories_list) && !empty($relatedTrip->trip_category)) {
                    $booking->trip_categories_list = array_values(array_filter(array_unique(array_map(static function ($category) {
                        return trim($category->category_name ?? $category->name ?? '');
                    }, $relatedTrip->trip_category))));
                }

                if (empty($booking->featured_image) && !empty($relatedTrip->featured_image)) {
                    $booking->featured_image = $relatedTrip->featured_image;
                }
            }
        }

        if ((null === $booking->trip_average_rating || $booking->trip_average_rating <= 0) && !empty($booking->trip_id)) {
            $booking->trip_average_rating = $reviewRepository->getAverageRating((int) $booking->trip_id);
        }

        if (empty($booking->trip_review_count) && !empty($booking->trip_id)) {
            $booking->trip_review_count = $reviewRepository->getReviewCount((int) $booking->trip_id);
        }

        // Make booking data globally available
        $booking_data = $booking;
        $GLOBALS['yatra_booking'] = $booking;

        // Prevent 404
        $wp_query->is_404 = false;
        status_header(200);

        // Enqueue styles
        wp_enqueue_style(
            'yatra-booking-confirmation',
            plugins_url('public/css/booking.css', dirname(__DIR__)),
            [],
            YATRA_VERSION
        );

        // Load template
        $template_path = YATRA_PLUGIN_PATH . 'templates/booking-confirmation.php';
        if (file_exists($template_path)) {
            include $template_path;
        } else {
            // Fallback template
            get_header();
            $this->renderConfirmationFallback($booking);
            get_footer();
        }

        exit;
    }

    /**
     * Fallback confirmation template
     */
    private function renderConfirmationFallback($booking): void
    {
        ?>
        <div class="yatra-confirmation-page" style="max-width: 800px; margin: 60px auto; padding: 0 20px; text-align: center;">
            <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 16px; padding: 40px;">
                <svg style="width: 80px; height: 80px; color: #22c55e; margin-bottom: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="9,12 12,15 16,10"></polyline>
                </svg>
                <h1 style="font-size: 32px; margin-bottom: 12px; color: #166534;">Booking Confirmed!</h1>
                <p style="font-size: 18px; color: #15803d; margin-bottom: 24px;">Thank you for your booking.</p>
                
                <div style="background: white; border-radius: 12px; padding: 24px; margin-top: 24px; text-align: left;">
                    <h2 style="font-size: 20px; margin-bottom: 16px; color: #111827;">Booking Details</h2>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div>
                            <p style="color: #6b7280; margin-bottom: 4px;">Reference</p>
                            <p style="font-weight: 600; color: #111827;"><?php echo esc_html($booking->reference); ?></p>
                        </div>
                        <div>
                            <p style="color: #6b7280; margin-bottom: 4px;">Status</p>
                            <p style="font-weight: 600; color: #22c55e;"><?php echo esc_html(ucfirst($booking->status)); ?></p>
                        </div>
                        <div>
                            <p style="color: #6b7280; margin-bottom: 4px;">Trip</p>
                            <p style="font-weight: 600; color: #111827;"><?php echo esc_html($booking->trip_title); ?></p>
                        </div>
                        <div>
                            <p style="color: #6b7280; margin-bottom: 4px;">Travel Date</p>
                            <p style="font-weight: 600; color: #111827;"><?php echo esc_html(date_i18n(get_option('date_format'), strtotime($booking->travel_date))); ?></p>
                        </div>
                        <div>
                            <p style="color: #6b7280; margin-bottom: 4px;">Travelers</p>
                            <p style="font-weight: 600; color: #111827;"><?php echo esc_html($booking->travelers_count); ?></p>
                        </div>
                        <div>
                            <p style="color: #6b7280; margin-bottom: 4px;">Total Amount</p>
                            <p style="font-weight: 600; color: #111827;"><?php echo esc_html(yatra_format_price($booking->total_amount)); ?></p>
                        </div>
                    </div>
                </div>
                
                <p style="margin-top: 24px; color: #6b7280;">A confirmation email has been sent to <strong><?php echo esc_html($booking->contact_email); ?></strong></p>
                
                <a href="<?php echo esc_url(home_url('/')); ?>" style="display: inline-block; margin-top: 24px; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                    Return to Home
                </a>
            </div>
        </div>
        <?php
    }

    /**
     * Customize REST API authentication error messages
     * Replaces technical messages with user-friendly ones
     */
    public function customizeRestAuthErrors($error)
    {
        // If there's already an error, customize it
        if (is_wp_error($error)) {
            $error_code = $error->get_error_code();
            $error_message = $error->get_error_message();
            
            // Replace technical cookie/nonce error messages
            if (strpos($error_message, 'cookie') !== false || 
                strpos($error_message, 'Cookie') !== false ||
                strpos($error_code, 'rest_cookie') !== false) {
                return new \WP_Error(
                    'rest_authentication_failed',
                    __('Your session has expired. Please refresh the page and try again.', 'yatra'),
                    ['status' => 403]
                );
            }
            
            // Replace nonce verification errors
            if (strpos($error_message, 'nonce') !== false || 
                strpos($error_message, 'Nonce') !== false) {
                return new \WP_Error(
                    'rest_authentication_failed',
                    __('Your session has expired. Please refresh the page and try again.', 'yatra'),
                    ['status' => 403]
                );
            }
        }
        
        return $error;
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
