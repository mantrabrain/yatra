<?php
/**
 * Yatra Helper Functions
 * 
 * @package Yatra
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

use Yatra\Database\Tables\BookingsTable;
use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Database\Tables\ReviewsTable;
use Yatra\Database\Tables\TripsTable;
use Yatra\Services\SettingsService;
use Yatra\Constants\ClassificationTypes;

/**
 * Get a plugin setting value
 * 
 * @param string $key     Setting key
 * @param mixed  $default Default value
 * @return mixed
 */
function yatra_get_setting(string $key, $default = null)
{
    return SettingsService::get($key, $default);
}

/**
 * Check if a setting is enabled
 * 
 * @param string $key Setting key
 * @return bool
 */
function yatra_setting_enabled(string $key): bool
{
    return SettingsService::isEnabled($key);
}

/**
 * Check if reviews are enabled
 * 
 * @return bool
 */
function yatra_reviews_enabled(): bool
{
    return SettingsService::reviewsEnabled();
}

/**
 * Get booking form configuration
 * 
 * @return array
 */
function yatra_get_booking_form_config(): array
{
    // Check if Dynamic Form Field module is enabled via Pro plugin
    $is_dynamic_enabled = apply_filters('yatra_dynamic_form_field_enabled', false);
    
    if ($is_dynamic_enabled) {
        // Pro module is active - use customizable form config
        return SettingsService::getBookingFormConfig();
    }
    
    // Free version - return default static form config
    return SettingsService::getDefaultBookingFormConfig();
}

/**
 * Check if user can leave a review for a trip
 * 
 * @param int      $trip_id Trip ID
 * @param int|null $user_id User ID (defaults to current user)
 * @return bool
 */
function yatra_can_review(int $trip_id, ?int $user_id = null): bool
{
    // Reviews must be enabled
    if (!SettingsService::reviewsEnabled()) {
        return false;
    }

    // Get user ID
    if ($user_id === null) {
        $user_id = get_current_user_id();
    }

    // If booking required, check if user has booked this trip
    if (SettingsService::requireBookingForReview()) {
        if ($user_id === 0) {
            return false; // Guest can't review if booking required
        }
        
        // Check if user has a completed booking for this trip
        global $wpdb;
        $table = BookingsTable::getTableName();
        $has_booking = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} 
             WHERE trip_id = %d AND customer_id = %d AND status = 'completed'",
            $trip_id,
            $user_id
        ));
        
        if (!$has_booking) {
            return false;
        }
    }

    // Check if user already reviewed this trip (but allow if within edit window)
    if ($user_id > 0) {
        $existing_review = yatra_get_user_review($trip_id, $user_id);
        if ($existing_review && !yatra_can_edit_review($existing_review)) {
            return false;
        }
    }

    return true;
}

/**
 * Get user's existing review for a trip
 * 
 * @param int      $trip_id Trip ID
 * @param int|null $user_id User ID (defaults to current user)
 * @return object|null Review object or null
 */
function yatra_get_user_review(int $trip_id, ?int $user_id = null): ?object
{
    if ($user_id === null) {
        $user_id = get_current_user_id();
    }
    
    if ($user_id === 0) {
        return null;
    }
    
    global $wpdb;
    $table = ReviewsTable::getTableName();
    $review = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$table} WHERE trip_id = %d AND user_id = %d ORDER BY created_at DESC LIMIT 1",
        $trip_id,
        $user_id
    ));
    
    return $review ?: null;
}

/**
 * Check if a review can be edited (within 24 hours of creation and not approved)
 * 
 * @param object $review Review object with created_at and status fields
 * @return bool
 */
function yatra_can_edit_review(object $review): bool
{
    if (empty($review->created_at)) {
        return false;
    }
    
    // Don't allow editing if review is approved
    if (isset($review->status) && $review->status === 'approved') {
        return false;
    }
    
    $created_time = strtotime($review->created_at);
    $current_time = current_time('timestamp');
    $hours_since_creation = ($current_time - $created_time) / 3600;
    
    // Allow editing within 24 hours (only for pending/rejected reviews)
    return $hours_since_creation <= 24;
}

/**
 * Get time remaining to edit a review
 * 
 * @param object $review Review object with created_at field
 * @return string Human-readable time remaining (e.g., "5 hours", "30 minutes")
 */
function yatra_get_review_edit_time_remaining(object $review): string
{
    if (empty($review->created_at)) {
        return '';
    }
    
    $created_time = strtotime($review->created_at);
    $current_time = current_time('timestamp');
    $seconds_since_creation = $current_time - $created_time;
    $seconds_remaining = (24 * 3600) - $seconds_since_creation;
    
    if ($seconds_remaining <= 0) {
        return '';
    }
    
    $hours = floor($seconds_remaining / 3600);
    $minutes = floor(($seconds_remaining % 3600) / 60);
    
    if ($hours > 0) {
        return sprintf(_n('%d hour', '%d hours', $hours, 'yatra'), $hours);
    }
    
    return sprintf(_n('%d minute', '%d minutes', $minutes, 'yatra'), $minutes);
}

/**
 * Get the booking URL for a trip
 * 
 * @param string $trip_slug The trip slug
 * @param array  $params    Optional URL parameters (date, adults, children, price)
 * @return string The booking URL
 */
function yatra_get_booking_url(string $trip_slug, array $params = []): string
{
    $permalink_structure = get_option('permalink_structure');
    $is_plain = empty($permalink_structure);

    // Check if using custom booking page via SettingsService
    if (SettingsService::useCustomBookingPage()) {
        $page_url = get_permalink(SettingsService::getBookingPageId());
        if ($page_url) {
            $params['trip'] = $trip_slug;
            return add_query_arg($params, $page_url);
        }
    }
    
    // Using default dynamic URL
    $booking_base = SettingsService::getBookingBase();
    if ($is_plain) {
        // Plain permalinks: rely on query var to route booking page
        $params['trip'] = $trip_slug;
        $url = add_query_arg(
            array_merge(['yatra_booking_page' => 'main'], $params),
            home_url('/')
        );
        // params already appended; avoid double-adding later
        return $url;
    }

    $url = home_url('/' . $booking_base . '/' . $trip_slug);

    if (!empty($params)) {
        $url = add_query_arg($params, $url);
    }
    
    return $url;
}

/**
 * Format price with currency
 * 
 * @param float       $amount   The amount to format
 * @param string|null $currency The currency code (optional, uses global setting if not provided)
 * @return string Formatted price
 */
if (!function_exists('yatra_format_price')) {
    function yatra_format_price(float $amount, ?string $currency = null): string
    {
        if (empty($amount) || $amount == 0) {
            return __('Contact for pricing', 'yatra');
        }
        
        // Get currency from global settings if not provided
        if (empty($currency)) {
            $currency = SettingsService::getCurrency();
        }
        
        // Get formatting settings from global settings
        $currency_position = SettingsService::getCurrencyPosition();
        $decimal_places = SettingsService::getInt('decimal_places', 2);
        $thousand_separator = SettingsService::getString('thousand_separator', ',');
        $decimal_separator = SettingsService::getString('decimal_separator', '.');
        
        // Format the amount with proper separators
        $formatted_amount = number_format($amount, $decimal_places, $decimal_separator, $thousand_separator);
        
        // Get currency symbol
        $currency_symbol = yatra_get_currency_symbol($currency);
        
        // Position currency based on settings
        if ($currency_position === 'right' || $currency_position === 'after') {
            return $formatted_amount . ' ' . $currency_symbol;
        }
        
        return $currency_symbol . ' ' . $formatted_amount;
    }
}

/**
 * Get currency symbol from currency code
 * 
 * @param string $currency_code The currency code (e.g., 'USD', 'EUR', 'NPR')
 * @return string The currency symbol or code
 */
if (!function_exists('yatra_get_currency_symbol')) {
    function yatra_get_currency_symbol(string $currency_code): string
    {
        $symbols = [
            'USD' => '$',
            'EUR' => '€',
            'GBP' => '£',
            'JPY' => '¥',
            'CNY' => '¥',
            'INR' => '₹',
            'NPR' => 'Rs',
            'AUD' => 'A$',
            'CAD' => 'C$',
            'CHF' => 'CHF',
            'NZD' => 'NZ$',
            'SGD' => 'S$',
            'HKD' => 'HK$',
            'KRW' => '₩',
            'THB' => '฿',
            'MYR' => 'RM',
            'PHP' => '₱',
            'IDR' => 'Rp',
            'VND' => '₫',
            'BRL' => 'R$',
            'MXN' => 'MX$',
            'RUB' => '₽',
            'ZAR' => 'R',
            'AED' => 'د.إ',
            'SAR' => '﷼',
            'TRY' => '₺',
            'SEK' => 'kr',
            'NOK' => 'kr',
            'DKK' => 'kr',
            'PLN' => 'zł',
            'CZK' => 'Kč',
            'HUF' => 'Ft',
            'ILS' => '₪',
            'TWD' => 'NT$',
            'PKR' => '₨',
            'BDT' => '৳',
            'LKR' => 'Rs',
            'EGP' => 'E£',
            'NGN' => '₦',
            'KES' => 'KSh',
            // Ghanaian cedi – use plain symbol without the GH prefix
            'GHS' => '₵',
            'GHC' => '₵',
            'ARS' => 'AR$',
            'CLP' => 'CL$',
            'COP' => 'CO$',
            'PEN' => 'S/',
        ];
        
        return $symbols[strtoupper($currency_code)] ?? $currency_code;
    }
}

/**
 * Format duration (days/nights)
 * 
 * @param int      $days   Number of days
 * @param int|null $nights Number of nights (optional)
 * @return string Formatted duration
 */
if (!function_exists('yatra_format_duration')) {
    function yatra_format_duration(int $days, ?int $nights = null): string
    {
        if ($days && $nights) {
            return $days . ' Days / ' . $nights . ' Nights';
        } elseif ($days) {
            return $days . ' Day' . ($days > 1 ? 's' : '');
        }
        return 'Flexible';
    }
}

/**
 * Render SVG icon
 * 
 * @param string $icon_name Icon name
 * @param string $class     Optional CSS class
 * @return string SVG markup
 */
if (!function_exists('yatra_svg_icon')) {
    function yatra_svg_icon(string $icon_name, string $class = ''): string
    {
        static $icons = null;
        
        // Load icons from JSON file once
        if ($icons === null) {
            $icons_file = dirname(__FILE__) . '/icons.json';
            if (file_exists($icons_file)) {
                $icons_data = json_decode(file_get_contents($icons_file), true);
                $icons = [];
                
                // Convert JSON data to PHP array
                foreach ($icons_data as $name => $data) {
                    if (isset($data['svg'])) {
                        $icons[$name] = (string) $data['svg'];
                    }
                }
            } else {
                $icons = [];
            }
        }

        $svg = $icons[$icon_name] ?? '';

        if ($svg === '' || !is_string($svg)) {
            return '';
        }

        if ($class !== '') {
            $class_attr = esc_attr($class);

            if (preg_match('/<svg[^>]*\sclass="([^"]*)"/i', $svg, $m)) {
                $existing = trim((string) ($m[1] ?? ''));
                $merged = trim($existing . ' ' . $class_attr);
                $svg = preg_replace('/(<svg[^>]*\sclass=")([^"]*)(")/i', '$1' . $merged . '$3', $svg, 1);
            } else {
                $svg = preg_replace('/<svg\b/i', '<svg class="' . $class_attr . '"', $svg, 1);
            }
        }

        return (string) $svg;
    }
}

/**
 * Get booking base URL slug
 * 
 * @return string The booking base slug
 */
function yatra_get_booking_base(): string
{
    // Check if using custom booking page
    if (SettingsService::useCustomBookingPage()) {
        $booking_page_id = SettingsService::getBookingPageId();
        if ($booking_page_id > 0) {
            $page = get_post($booking_page_id);
            if ($page) {
                return $page->post_name;
            }
        }
    }
    
    return SettingsService::getBookingBase();
}

/**
 * Check if the current page is a booking page
 * 
 * @return bool
 */
function yatra_is_booking_page(): bool
{
    global $wp_query;
    
    // Check for custom booking page
    if (SettingsService::useCustomBookingPage()) {
        $booking_page_id = SettingsService::getBookingPageId();
        if ($booking_page_id > 0 && is_page($booking_page_id)) {
            return true;
        }
    }
    
    // Check for booking page query var (set by BookingPageHandler)
    if (!empty($wp_query->get('yatra_booking_page'))) {
        return true;
    }
    
    // Check for dynamic booking URL
    return !empty($wp_query->get('yatra_booking_trip_slug'));
}

/**
 * Get the global trip object
 * 
 * Similar to WordPress get_post(), this function returns the current trip object
 * when on a single trip page.
 * 
 * @return object|null The trip object or null if not on a trip page
 */
function yatra_get_trip(): ?object
{
    global $trip;
    return $trip ?? null;
}

/**
 * Check if we're on a single trip page
 * 
 * @return bool True if on a single trip page
 */
function yatra_is_single_trip(): bool
{
    
    global $wp_query;
    return !empty($wp_query->get('yatra_trip_id'));
}

/**
 * Get a trip field value with default fallback
 * 
 * @param string $field   The field name
 * @param mixed  $default Default value if field is empty
 * @return mixed The field value or default
 */
function yatra_get_trip_field(string $field, $default = '')
{
    global $trip;
    
    if (!$trip || !isset($trip->$field)) {
        return $default;
    }
    
    return $trip->$field ?: $default;
}

/**
 * Echo a trip field value with escaping
 * 
 * @param string $field   The field name
 * @param string $escape  Escape function: 'html', 'attr', 'url', 'js', 'none'
 * @param mixed  $default Default value if field is empty
 */
function yatra_trip_field(string $field, string $escape = 'html', $default = ''): void
{
    $value = yatra_get_trip_field($field, $default);
    
    switch ($escape) {
        case 'html':
            echo esc_html($value);
            break;
        case 'attr':
            echo esc_attr($value);
            break;
        case 'url':
            echo esc_url($value);
            break;
        case 'js':
            echo esc_js($value);
            break;
        case 'none':
        case 'kses':
            echo wp_kses_post($value);
            break;
        default:
            echo esc_html($value);
    }
}

/**
 * ============================================
 * BOOKING SESSION MANAGEMENT
 * ============================================
 */

/**
 * Start WordPress session if not already started
 */
function yatra_start_session(): void
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
                'path' => defined('COOKIEPATH') ? COOKIEPATH : '/',
                'domain' => defined('COOKIE_DOMAIN') ? COOKIE_DOMAIN : '',
                'secure' => is_ssl(),
                'httponly' => true,
                'samesite' => 'Lax'
            ]);
        }
        session_start();
    }
}

/**
 * Set booking session data
 * 
 * @param array $data Booking data to store
 */
function yatra_set_booking_session(array $data): void
{
    yatra_start_session();
    
    // Clear any existing remaining payment session to avoid conflicts
    unset($_SESSION['yatra_remaining']);
    
    $session_data = array_merge(
        $_SESSION['yatra_booking'] ?? [],
        $data,
        ['timestamp' => time()]
    );
    
    $_SESSION['yatra_booking'] = $session_data;
    
    // ALWAYS store in transient as backup (not just for REST API)
    // This ensures data persists across all request types
    // Generate or reuse booking token
    $booking_token = $_SESSION['yatra_booking_token'] ?? 'yatra_booking_' . wp_generate_password(32, false);
    $_SESSION['yatra_booking_token'] = $booking_token;
    $session_data['booking_token'] = $booking_token;
    
    // Store in transient (expires in 30 minutes)
    try {
        $transient_set = set_transient($booking_token, $session_data, 1800);
    } catch (Exception $e) {
        // Continue without transient - session fallback will be used
    }
    
    }

/**
 * Get booking session data
 * 
 * @param string|null $key Specific key to retrieve, or null for all data
 * @param mixed $default Default value if key not found
 * @return mixed
 */
function yatra_get_booking_session(?string $key = null, $default = null)
{
    yatra_start_session();
    
    $booking_data = $_SESSION['yatra_booking'] ?? [];
    
    // If session is empty, try to restore from transient (REST API → page load transition)
    if (empty($booking_data) || empty($booking_data['trip_id'])) {
        // Check for booking token in URL or session
        $booking_token = $_GET['booking_token'] ?? $_SESSION['yatra_booking_token'] ?? null;
        
        if ($booking_token) {
            try {
                $transient_data = get_transient($booking_token);
                
                if ($transient_data && is_array($transient_data) && !empty($transient_data['trip_id'])) {
                    // Validate transient data integrity
                    if (isset($transient_data['timestamp']) && (time() - $transient_data['timestamp']) < 1800) {
                        $booking_data = $transient_data;
                        // Restore to session
                        $_SESSION['yatra_booking'] = $booking_data;
                        $_SESSION['yatra_booking_token'] = $booking_token;
                    }
                }
            } catch (Exception $e) {
                // Continue without transient data
            }
        }
    }
    
    // Check if session is expired (30 minutes)
    if (!empty($booking_data['timestamp'])) {
        $session_age = time() - $booking_data['timestamp'];
        if ($session_age > 1800) { // 30 minutes
            yatra_clear_booking_session();
            return $key ? $default : [];
        }
    }
    
    if ($key === null) {
        return $booking_data;
    }
    
    return $booking_data[$key] ?? $default;
}

/**
 * Clear booking session data (PHP session, booking token, and REST backup transient).
 *
 * Without removing the token and transient, yatra_get_booking_session() can repopulate
 * checkout data from the transient on the next request after a completed booking.
 */
function yatra_clear_booking_session(): void
{
    yatra_start_session();

    $token = $_SESSION['yatra_booking_token'] ?? null;
    if (is_string($token) && $token !== '') {
        delete_transient($token);
    }

    unset($_SESSION['yatra_booking'], $_SESSION['yatra_booking_token']);
}

/**
 * Check if booking session exists and is valid
 * 
 * @return bool
 */
function yatra_has_booking_session(): bool
{
    $booking_data = yatra_get_booking_session();
    return !empty($booking_data) && !empty($booking_data['trip_id']);
}

/**
 * ============================================
 * REMAINING PAYMENT SESSION MANAGEMENT
 * ============================================
 */

/**
 * Set remaining payment session data
 * 
 * @param array $data Remaining payment data to store
 */
function yatra_set_remaining_session(array $data): void
{
    yatra_start_session();
    
    // Clear checkout session fully (including token + transient) before remaining-payment flow
    yatra_clear_booking_session();
    
    $_SESSION['yatra_remaining'] = array_merge(
        $data,
        ['timestamp' => time()]
    );
    
    // Ensure session data is written to storage immediately
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_write_close();
    }
}

/**
 * Get remaining payment session data
 * 
 * @param string|null $key Specific key to retrieve, or null for all data
 * @param mixed $default Default value if key not found
 * @return mixed
 */
function yatra_get_remaining_session(?string $key = null, $default = null)
{
    yatra_start_session();
    
    $remaining_data = $_SESSION['yatra_remaining'] ?? [];
    
    // Check if session is expired (30 minutes)
    if (!empty($remaining_data['timestamp'])) {
        $session_age = time() - $remaining_data['timestamp'];
        if ($session_age > 1800) { // 30 minutes
            yatra_clear_remaining_session();
            return $key ? $default : [];
        }
    }
    
    if ($key === null) {
        return $remaining_data;
    }
    
    return $remaining_data[$key] ?? $default;
}

/**
 * Clear remaining payment session data
 */
function yatra_clear_remaining_session(): void
{
    yatra_start_session();
    unset($_SESSION['yatra_remaining']);
}

/**
 * Check if remaining payment session exists and is valid
 * 
 * @return bool
 */
function yatra_has_remaining_session(): bool
{
    $remaining_data = yatra_get_remaining_session();
    return !empty($remaining_data) && !empty($remaining_data['booking_id']);
}

/**
 * Get the active checkout session type
 * 
 * @return string|null 'remaining' if remaining session exists, 'booking' if booking session exists, null if neither
 */
function yatra_get_checkout_session_type(): ?string
{
    if (yatra_has_remaining_session()) {
        return 'remaining';
    }
    
    if (yatra_has_booking_session()) {
        return 'booking';
    }
    
    return null;
}

/**
 * Get the active checkout session data (remaining or booking)
 * 
 * @return array Session data with 'type' key indicating session type
 */
function yatra_get_active_checkout_session(): array
{
    if (yatra_has_remaining_session()) {
        $data = yatra_get_remaining_session();
        $data['session_type'] = 'remaining';
        return $data;
    }
    
    if (yatra_has_booking_session()) {
        $data = yatra_get_booking_session();
        $data['session_type'] = 'booking';
        return $data;
    }
    
    return [];
}

/**
 * Get booking/checkout URL
 * 
 * Logic:
 * 1. If custom booking page is set → return that page's URL
 * 2. Otherwise → return dynamic URL using booking_base from settings (e.g., /bookings/)
 * 
 * @return string Booking URL
 */
function yatra_get_checkout_url(): string
{
    $permalink_structure = get_option('permalink_structure');
    $is_plain = empty($permalink_structure);

    // Check if custom booking page is set via SettingsService
    if (SettingsService::useCustomBookingPage()) {
        $page_id = SettingsService::getBookingPageId();
        if ($page_id > 0) {
            return get_permalink($page_id);
        }
    }
    
    // Default dynamic URL using booking base from settings
    $base = SettingsService::getBookingBase();
    if ($is_plain) {
        // Plain permalinks: route via query var
        return add_query_arg(['yatra_booking_page' => 'main'], home_url('/'));
    }

    return home_url('/' . $base . '/');
}

/**
 * ============================================
 * PERMALINK HELPERS
 * ============================================
 */

/**
 * Get destination permalink
 * 
 * @param object|int $destination Destination object with slug property, or destination ID
 * @return string Destination permalink URL
 */
function yatra_get_destination_permalink($destination): string
{
    if (is_numeric($destination)) {
        global $wpdb;
        $table = ClassificationsTable::getTableName();
        $destination = $wpdb->get_row($wpdb->prepare(
            "SELECT slug FROM {$table} WHERE id = %d AND type = %s",
            (int) $destination,
            ClassificationTypes::DESTINATION
        ));
    }
    
    $slug = is_object($destination) ? ($destination->slug ?? '') : '';
    
    if (empty($slug)) {
        return '';
    }
    
    $base = SettingsService::getString('destination_base', 'destination');
    
    return home_url('/' . $base . '/' . $slug . '/');
}

/**
 * Get activity permalink
 * 
 * @param object|int $activity Activity object with slug property, or activity ID
 * @return string Activity permalink URL
 */
function yatra_get_activity_permalink($activity): string
{
    if (is_numeric($activity)) {
        global $wpdb;
        $table = ClassificationsTable::getTableName();
        $activity = $wpdb->get_row($wpdb->prepare(
            "SELECT slug FROM {$table} WHERE id = %d AND type = %s",
            (int) $activity,
            ClassificationTypes::ACTIVITY
        ));
    }
    
    $slug = is_object($activity) ? ($activity->slug ?? '') : '';
    
    if (empty($slug)) {
        return '';
    }
    
    $base = SettingsService::getString('activity_base', 'activity');
    
    return home_url('/' . $base . '/' . $slug . '/');
}

/**
 * Get trip category permalink
 * 
 * @param object|int $category Category object with slug property, or category ID
 * @return string Category permalink URL
 */
function yatra_get_category_permalink($category): string
{
    if (is_numeric($category)) {
        global $wpdb;
        $table = ClassificationsTable::getTableName();
        $category = $wpdb->get_row($wpdb->prepare(
            "SELECT slug FROM {$table} WHERE id = %d AND type = %s",
            (int) $category,
            ClassificationTypes::CATEGORY
        ));
    }
    
    $slug = is_object($category) ? ($category->slug ?? '') : '';
    
    if (empty($slug)) {
        return '';
    }
    
    $base = SettingsService::getString('trip_category_base', 'trip-category');
    
    return home_url('/' . $base . '/' . $slug . '/');
}

/**
 * Get trip permalink
 * 
 * @param object|int $trip Trip object with slug property, or trip ID
 * @return string Trip permalink URL
 */
function yatra_get_trip_permalink($trip): string
{
    if (is_numeric($trip)) {
        global $wpdb;
        $table = TripsTable::getTableName();
        $trip = $wpdb->get_row($wpdb->prepare(
            "SELECT slug FROM {$table} WHERE id = %d",
            (int) $trip
        ));
    }
    
    $slug = is_object($trip) ? ($trip->slug ?? '') : '';
    
    if (empty($slug)) {
        return '';
    }
    
    $base = SettingsService::getTripBase();
    $permalink_structure = get_option('permalink_structure');
    $is_plain = empty($permalink_structure);
    
    if ($is_plain) {
        return add_query_arg(['yatra_trip_slug' => $slug], home_url('/'));
    }
    
    return home_url('/' . $base . '/' . $slug . '/');
}

/**
 * Canonical URL for the trip archive / filter listing (respects Settings trip base).
 */
function yatra_get_trip_listing_url(): string
{
    $base = SettingsService::getTripBase();

    return trailingslashit(home_url('/' . $base . '/'));
}

/**
 * Check if we're on a trip listing page
 * 
 * @return bool True if on a trip listing page
 */
function yatra_is_trip_listing(): bool
{
    global $yatra_trip_list;

    // Check for trip list context (base trip listing page)
    if (!empty($yatra_trip_list)) {
        return true;
    }

    // Check if we're on the main trips listing page
    $trip_base = SettingsService::getTripBase();
    $request_uri = $_SERVER['REQUEST_URI'] ?? '';
    $parsed_url = parse_url($request_uri, PHP_URL_PATH);
    
    if ($parsed_url && strpos($parsed_url, '/' . $trip_base) === 0) {
        $path_parts = array_values(array_filter(explode('/', trim($parsed_url, '/'))));
        if ($path_parts === [] || ($path_parts[0] ?? '') !== $trip_base) {
            return false;
        }
        // /trip/ or /trip/page/2/ (WordPress paged archives)
        if (count($path_parts) === 1) {
            return true;
        }
        if (count($path_parts) === 3 && ($path_parts[1] ?? '') === 'page' && ctype_digit((string) ($path_parts[2] ?? ''))) {
            return true;
        }
    }
    
    return false;
}

/**
 * Check if we're on a taxonomy page (destination, activity, category)
 * 
 * @return bool True if on a taxonomy page
 */
function yatra_is_taxonomy_page(): bool
{
    global $yatra_taxonomy_data;
    return !empty($yatra_taxonomy_data);
}

/**
 * Check if we're on an activity listing page
 * 
 * @return bool True if on an activity listing page
 */
function yatra_is_activity_listing(): bool
{
    return isset($_GET['yatra_page_type']) && $_GET['yatra_page_type'] === 'activities';
}

/**
 * Check if we're on a destination listing page
 * 
 * @return bool True if on a destination listing page
 */
function yatra_is_destination_listing(): bool
{
    return isset($_GET['yatra_page_type']) && $_GET['yatra_page_type'] === 'destinations';
}

/**
 * Check if we're on an account page
 * 
 * @return bool True if on an account page
 */
function yatra_is_account_page(): bool
{
    if (!empty($GLOBALS['yatra_loading_react_account_page'])) {
        return true;
    }

    if ((string) get_query_var('yatra_account_page') !== '') {
        return true;
    }

    global $post;
    if ($post && function_exists('has_shortcode') && isset($post->post_content)
        && has_shortcode((string) $post->post_content, 'yatra_my_account')) {
        return true;
    }

    if (!$post) {
        return false;
    }

    $accountPageId = get_option('yatra_my_account_page');
    return $accountPageId && (int) $post->ID === (int) $accountPageId;
}

/**
 * Get difficulty level permalink
 * 
 * @param object|int $difficulty Difficulty object with slug property, or difficulty ID
 * @return string Difficulty permalink URL
 */
function yatra_get_difficulty_permalink($difficulty): string
{
    if (is_numeric($difficulty)) {
        global $wpdb;
        $table = ClassificationsTable::getTableName();
        $difficulty = $wpdb->get_row($wpdb->prepare(
            "SELECT slug FROM {$table} WHERE id = %d AND type = %s",
            (int) $difficulty,
            ClassificationTypes::DIFFICULTY
        ));
    }
    
    $slug = is_object($difficulty) ? ($difficulty->slug ?? '') : '';
    
    if (empty($slug)) {
        return '';
    }
    
    $base = SettingsService::getString('difficulty_base', 'difficulty');
    
    return home_url('/' . $base . '/' . $slug . '/');
}

/**
 * Load a template file with theme override support
 *
 * This function allows themes to override plugin templates by placing them in:
 * theme/yatra/template-name.php
 *
 * If no theme override exists, loads from plugin templates directory.
 *
 * @param string $template_name Template file name (without .php extension)
 * @param array  $args          Arguments to extract and make available in template
 * @param string $template_path Template path within plugin (default: 'templates/')
 * @param array  $data          Alternative data array (won't be extracted, available as $data)
 * @return void
 */
function yatra_get_template(string $template_name, array $args = [], string $template_path = 'templates/', array $data = []): void
{
    $template_name = ltrim($template_name, '/');
    
    // Check if theme has override
    $theme_template = locate_template([
        'yatra/' . $template_name . '.php',
        'yatra/' . $template_name
    ]);
    
    if ($theme_template) {
        // Load from theme
        $template_file = $theme_template;
    } else {
        // Load from plugin
        $template_file = YATRA_PLUGIN_PATH . ltrim($template_path, '/') . '/' . $template_name . '.php';
    }
    
    // Extract arguments to make them available as individual variables
    if (!empty($args)) {
        extract($args);
    }
    
    // Make data available as $data array (not extracted)
    if (!empty($data)) {
        $data = $data;
    }
    
    // Include the template
    if (file_exists($template_file)) {
        include $template_file;
    }
}

/**
 * Enqueue single trip scripts and styles
 *
 * @return void
 */
function yatra_enqueue_single_trip_scripts(): void
{
    // Only enqueue on single trip pages
    if (!is_single() || get_post_type() !== 'trip') {
        return;
    }
    
    // Enqueue the single trip JavaScript
    wp_enqueue_script(
        'yatra-single-trip',
        YATRA_PLUGIN_URL . 'assets/js/single-trip.js',
        ['jquery'],
        YATRA_VERSION,
        true
    );
    
    // Localize script data
    global $trip;
    if ($trip) {
        wp_localize_script(
            'yatra-single-trip',
            'yatraSingleTripData',
            [
                'tripId' => (int) $trip->id,
                'basePrice' => (float) ($trip->base_price ?? 0),
                'currencySymbol' => yatra_get_currency_symbol(\Yatra\Services\SettingsService::getCurrency()),
                'apiUrls' => [
                    'groupDiscounts' => rest_url('yatra/v1/discounts/group-discounts')
                ]
            ]
        );
    }
}

/**
 * Calculate base price for single trip display using CalculationService
 * 
 * @param object $trip Trip object
 * @return array Pricing data including base_price, has_availability, has_traveler_pricing, pricing_type
 */
function yatra_single_trip_calculate_base_price($trip) {
    // Check if availability dates exist (PRIORITY)
    $has_availability = !empty($trip->availability_dates) && is_array($trip->availability_dates) && count($trip->availability_dates) > 0;
    
    // Determine pricing type from trip settings
    $pricing_type = $trip->pricing_type ?? 'regular';
    $has_traveler_pricing = ($pricing_type === 'traveler_based' && !empty($trip->price_types));
    
    // Use CalculationService for consistent pricing
    $calculationService = new \Yatra\Services\CalculationService();
    
    // Determine base price using CalculationService logic
    $trip_price = 0;
    
    if ($has_availability) {
        // Get the lowest price from availability dates
        $min_price = PHP_FLOAT_MAX;
        foreach ($trip->availability_dates as $avail) {
            $avail_price = $avail->effective_price ?? $avail->original_price ?? 0;
            if ($avail_price > 0 && $avail_price < $min_price) {
                $min_price = $avail_price;
            }

            // Also check price_types within availability if traveler-based
            if (!empty($avail->price_types) && is_array($avail->price_types)) {
                foreach ($avail->price_types as $pt) {
                    $pt = (object)$pt;
                    $pt_price = (float)($pt->effective_price ?? $pt->discounted_price ?? $pt->original_price ?? 0);
                    if ($pt_price > 0 && $pt_price < $min_price) {
                        $min_price = $pt_price;
                    }
                }
            }
        }

        // If no price found from availability, check traveler-based pricing
        if ($min_price >= PHP_FLOAT_MAX && $has_traveler_pricing) {
            foreach ($trip->price_types as $pt) {
                $pt_price = (float)($pt->effective_price ?? $pt->discounted_price ?? $pt->original_price ?? 0);
                if ($pt_price > 0 && $pt_price < $min_price) {
                    $min_price = $pt_price;
                }
            }
        }

        $trip_price = ($min_price < PHP_FLOAT_MAX) ? $min_price : ($trip->sale_price ?: $trip->original_price);
    } elseif ($has_traveler_pricing) {
        // Get default or first traveler category price
        $default_price_type = null;
        foreach ($trip->price_types as $pt) {
            if (!empty($pt->is_default)) {
                $default_price_type = $pt;
                break;
            }
        }
        if (!$default_price_type && !empty($trip->price_types)) {
            $default_price_type = $trip->price_types[0];
        }

        // Get the price from the price type - check multiple possible fields
        if ($default_price_type) {
            $trip_price = 0;
            // Try effective_price first, then discounted_price, then original_price
            if (!empty($default_price_type->effective_price) && $default_price_type->effective_price > 0) {
                $trip_price = (float)$default_price_type->effective_price;
            } elseif (!empty($default_price_type->discounted_price) && $default_price_type->discounted_price > 0) {
                $trip_price = (float)$default_price_type->discounted_price;
            } elseif (!empty($default_price_type->original_price) && $default_price_type->original_price > 0) {
                $trip_price = (float)$default_price_type->original_price;
            } elseif (!empty($default_price_type->sale_price) && $default_price_type->sale_price > 0) {
                $trip_price = (float)$default_price_type->sale_price;
            }

            // If still no price, try to get the minimum from all price types
            if ($trip_price <= 0) {
                foreach ($trip->price_types as $pt) {
                    $pt_price = (float)($pt->effective_price ?? $pt->discounted_price ?? $pt->original_price ?? 0);
                    if ($pt_price > 0 && ($trip_price <= 0 || $pt_price < $trip_price)) {
                        $trip_price = $pt_price;
                    }
                }
            }
        } else {
            $trip_price = $trip->sale_price ?: $trip->original_price;
        }
    } else {
        // Regular pricing
        $trip_price = $trip->sale_price > 0 ? $trip->sale_price : $trip->original_price;
    }

    // Apply CalculationService filter for dynamic pricing (pro plugins)
    $base_price = apply_filters('yatra_calculate_base_amount', $trip_price, [
        'trip_price' => $trip_price,
        'travelers_count' => 1,
        'traveler_counts' => ['default' => 1],
        'pricing_type' => $pricing_type,
        'price_types' => $trip->price_types ?? [],
        'trip_id' => $trip->id ?? 0
    ]);

    return [
        'base_price' => $base_price,
        'has_availability' => $has_availability,
        'has_traveler_pricing' => $has_traveler_pricing,
        'pricing_type' => $pricing_type
    ];
}

/**
 * Get group discounts data for single trip
 * 
 * @param int $trip_id Trip ID
 * @return array Group discounts data including has_group_discounts and group_discounts_data
 */
function yatra_single_trip_get_group_discounts($trip_id) {
    $has_group_discounts = false;
    $group_discounts_data = [];
    
    try {
        // Call the group discount API to get detailed discount information
        $api_url = rest_url('yatra/v1/discounts/group-discounts');
        $response = wp_remote_post($api_url, [
            'method' => 'GET',
            'body' => [
                'trip_ids' => [$trip_id]
            ],
            'headers' => [
                'Content-Type' => 'application/json',
            ],
        ]);

        if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
            $data = json_decode(wp_remote_retrieve_body($response), true);
            if (isset($data[$trip_id]) && $data[$trip_id]['has_group_discounts']) {
                $has_group_discounts = true;
                $group_discounts_data = $data[$trip_id]['discounts'];
            }
        }
    } catch (Exception $e) {
        // Silently fail if API call fails - don't break the page
        $has_group_discounts = false;
    }
    
    return [
        'has_group_discounts' => $has_group_discounts,
        'group_discounts_data' => $group_discounts_data
    ];
}

// Hook into WordPress enqueue system
add_action('wp_enqueue_scripts', 'yatra_enqueue_single_trip_scripts');

// Yatra page type detection functions
if (!function_exists('yatra_is_trip_page')) {
    function yatra_is_trip_page() {
        global $trip;
        return isset($trip) && !empty($trip);
    }
}

if (!function_exists('yatra_is_destination_page')) {
    function yatra_is_destination_page() {
        global $destination, $yatra_taxonomy_data;
        
        // Check direct global first
        if (isset($destination) && !empty($destination)) {
            return true;
        }
        
        // Check taxonomy data
        if (isset($yatra_taxonomy_data) && !empty($yatra_taxonomy_data) && $yatra_taxonomy_data->type === 'destination') {
            return true;
        }
        
        return false;
    }
}

if (!function_exists('yatra_is_activity_page')) {
    function yatra_is_activity_page() {
        global $activity, $yatra_taxonomy_data;
        
        // Check direct global first
        if (isset($activity) && !empty($activity)) {
            return true;
        }
        
        // Check taxonomy data
        if (isset($yatra_taxonomy_data) && !empty($yatra_taxonomy_data) && $yatra_taxonomy_data->type === 'activity') {
            return true;
        }
        
        return false;
    }
}

if (!function_exists('yatra_is_category_page')) {
    function yatra_is_category_page() {
        global $category, $yatra_taxonomy_data;
        
        // Check direct global first
        if (isset($category) && !empty($category)) {
            return true;
        }
        
        // Check taxonomy data
        if (isset($yatra_taxonomy_data) && !empty($yatra_taxonomy_data) && $yatra_taxonomy_data->type === 'category') {
            return true;
        }
        
        return false;
    }
}

if (!function_exists('yatra_is_trip_archive_page')) {
    function yatra_is_trip_archive_page() {
        $current_url = $_SERVER['REQUEST_URI'] ?? '';
        $current_path = parse_url($current_url, PHP_URL_PATH) ?? '';
        $trip_base = \Yatra\Services\SettingsService::getTripBase();
        
        // Check for both /trip/ and /trip patterns
        $pattern1 = '/' . $trip_base . '/';
        $pattern2 = '/' . $trip_base;
        
        return (strpos($current_path, $pattern1) !== false || $current_path === $pattern2) && !yatra_is_trip_page();
    }
}

// Yatra only has trip archive pages - no destination/activity/category archive pages

if (!function_exists('yatra_is_listing_page')) {
    function yatra_is_listing_page() {
        $current_url = $_SERVER['REQUEST_URI'] ?? '';
        $current_path = parse_url($current_url, PHP_URL_PATH) ?? '';
        return strpos($current_path, '/listing-') !== false;
    }
}

if (!function_exists('yatra_is_yatra_page')) {
    function yatra_is_yatra_page() {
        return yatra_is_trip_page() || 
               yatra_is_destination_page() || 
               yatra_is_activity_page() || 
               yatra_is_category_page() ||
               yatra_is_trip_archive_page() || 
               yatra_is_listing_page();
    }
}

if ( ! function_exists( 'yatra_get_header' ) ) {
    
function yatra_get_header( $header_name = null ) {
    global $wp_version;
    if (
        version_compare( $wp_version, '5.9', '>=' ) &&
        function_exists( 'wp_is_block_theme' ) &&
        wp_is_block_theme()
    ) {
        /*
         * Full-site editing themes often omit add_theme_support( 'title-tag' ); the document title is
         * injected via template canvas using _block_template_render_title_tag (unconditional). Yatra
         * renders this minimal head instead of canvas, so _wp_render_title_tag would no-op and the
         * page would have no <title>. Mirror canvas: print title here and drop duplicate core hooks.
         */
        remove_action( 'wp_head', '_wp_render_title_tag', 1 );
        remove_action( 'wp_head', '_block_template_render_title_tag', 1 );
        ?>
        <!doctype html>
            <html <?php language_attributes(); ?>>
            <head>
                <meta charset="<?php bloginfo( 'charset' ); ?>">
                <title><?php echo esc_html( wp_get_document_title() ); ?></title>
                <?php wp_head(); ?>
            </head>

            <body <?php body_class(); ?>>
            <?php wp_body_open(); ?>
                <div class="wp-site-blocks">
                    <header class="wp-block-template-part site-header">
                        <?php block_header_area(); ?>
                    </header>
        <?php
    } else {
        get_header( $header_name );
    }
}
}

if ( ! function_exists( 'yatra_block_support_styles' ) ) {
    function yatra_block_support_styles() {
        // Bail early if function does not exists.
        if ( ! function_exists( 'wp_style_engine_get_stylesheet_from_context' ) ) {
            return;
        }

        $core_styles_keys         = array( 'block-supports' );

        $compiled_core_stylesheet = '';

        foreach ( $core_styles_keys as $style_key ) {
            $compiled_core_stylesheet .= wp_style_engine_get_stylesheet_from_context( $style_key, array() );
        }

        if ( empty( $compiled_core_stylesheet ) ) {
            return;
        }

        wp_register_style( 'yatra-block-supports', false );
        wp_enqueue_style( 'yatra-block-supports' );
        wp_add_inline_style( 'yatra-block-supports', $compiled_core_stylesheet );
    }
}

if ( ! function_exists( 'yatra_get_footer' ) ) {

	function yatra_get_footer( $footer_name = null ) {
		global $wp_version;
		if (
			version_compare( $wp_version, '5.9', '>=' ) &&
			function_exists( 'wp_is_block_theme' ) &&
			wp_is_block_theme()
		) {
			?>
			<footer class="wp-block-template-part site-footer">
			<?php block_footer_area(); ?>
			</footer>
			</div>
            <?php yatra_block_support_styles(); ?>
			<?php wp_footer(); ?>
			</body>
			</html>
			<?php
		} else {
			get_footer( $footer_name );
		}
	}
}

/**
 * Render tab icon (supports both SVG icons and images)
 * 
 * @param mixed $icon_data Icon data (string, array, or object)
 * @param string $default_icon Default icon name
 * @param string $css_class CSS class for the icon
 * @param string $label Label for alt text
 * @return void Echoes the icon HTML
 */
if (!function_exists('yatra_render_tab_icon')) {
    function yatra_render_tab_icon($icon_data, $default_icon = 'book', $css_class = '', $label = '') {
        if (!empty($icon_data)) {
            // Handle JSON string that might not be decoded
            if (is_string($icon_data) && strpos($icon_data, '{') === 0) {
                $icon_data = json_decode($icon_data, true);
            }
            if (is_array($icon_data) && isset($icon_data['type'])) {
                if ($icon_data['type'] === 'image' && !empty($icon_data['value'])) {
                    // Display image icon
                    $image_url = is_numeric($icon_data['value']) 
                        ? wp_get_attachment_url($icon_data['value'])
                        : $icon_data['value'];
                    if ($image_url) {
                        $size_style = strpos($css_class, 'sticky-nav') !== false ? 'width: 18px; height: 18px;' : 'width: 24px; height: 24px;';
                        echo '<img src="' . esc_url($image_url) . '" alt="' . esc_attr($label) . '" class="' . esc_attr($css_class) . '" style="' . $size_style . ' object-fit: cover; border-radius: 4px;">';
                    } else {
                        echo yatra_svg_icon('image', $css_class);
                    }
                } elseif ($icon_data['type'] === 'icon' && !empty($icon_data['value'])) {
                    // Display SVG icon
                    echo yatra_svg_icon($icon_data['value'], $css_class);
                } else {
                    // Fallback to default
                    echo yatra_svg_icon($default_icon, $css_class);
                }
            } elseif (is_object($icon_data) && isset($icon_data->type)) {
                // Handle object format
                $icon_array = (array) $icon_data;
                if ($icon_array['type'] === 'image' && !empty($icon_array['value'])) {
                    $image_url = is_numeric($icon_array['value']) 
                        ? wp_get_attachment_url($icon_array['value'])
                        : $icon_array['value'];
                    if ($image_url) {
                        $size_style = strpos($css_class, 'sticky-nav') !== false ? 'width: 18px; height: 18px;' : 'width: 24px; height: 24px;';
                        echo '<img src="' . esc_url($image_url) . '" alt="' . esc_attr($label) . '" class="' . esc_attr($css_class) . '" style="' . $size_style . ' object-fit: cover; border-radius: 4px;">';
                    } else {
                        echo yatra_svg_icon('image', $css_class);
                    }
                } elseif ($icon_array['type'] === 'icon' && !empty($icon_array['value'])) {
                    echo yatra_svg_icon($icon_array['value'], $css_class);
                } else {
                    echo yatra_svg_icon($default_icon, $css_class);
                }
            } elseif (is_string($icon_data)) {
                // Direct icon name (backward compatibility)
                echo yatra_svg_icon($icon_data, $css_class);
            } else {
                // Fallback
                echo yatra_svg_icon($default_icon, $css_class);
            }
        } else {
            // Default fallback
            echo yatra_svg_icon($default_icon, $css_class);
        }
    }
}

if (!function_exists('yatra_listing_sidebar_filter_visible_cap')) {
    /**
     * How many sidebar checkbox rows to show before "Show more" on the trip listing.
     *
     * Filter: {@see 'yatra_listing_sidebar_filter_visible_count'} — default 8, clamped 3–40.
     *
     * @return int
     */
    function yatra_listing_sidebar_filter_visible_cap(): int
    {
        $n = (int) apply_filters('yatra_listing_sidebar_filter_visible_count', 8);

        return max(3, min(40, $n));
    }
}

if (!function_exists('yatra_wishlist_enabled')) {
    /**
     * Whether wishlist UI and REST should be active (Yatra Pro + setting).
     */
    function yatra_wishlist_enabled(): bool
    {
        return \Yatra\Services\SettingsService::wishlistEnabled();
    }
}
