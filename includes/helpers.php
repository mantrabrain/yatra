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

use Yatra\Services\SettingsService;

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
        $table = $wpdb->prefix . 'yatra_bookings';
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
    $table = $wpdb->prefix . 'yatra_reviews';
    $table_exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table));
    
    if (!$table_exists) {
        return null;
    }
    
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
    
    $_SESSION['yatra_booking'] = array_merge(
        $_SESSION['yatra_booking'] ?? [],
        $data,
        ['timestamp' => time()]
    );
    
    // Ensure session data is written to storage immediately
    // This is crucial for REST API requests where the session might not auto-save
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_write_close();
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
 * Clear booking session data
 */
function yatra_clear_booking_session(): void
{
    yatra_start_session();
    unset($_SESSION['yatra_booking']);
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
    
    // Clear any existing booking session to avoid conflicts
    unset($_SESSION['yatra_booking']);
    
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
    // Check if custom booking page is set via SettingsService
    if (SettingsService::useCustomBookingPage()) {
        $page_id = SettingsService::getBookingPageId();
        if ($page_id > 0) {
            return get_permalink($page_id);
        }
    }
    
    // Default dynamic URL using booking base from settings
    $base = SettingsService::getBookingBase();
    
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
        $table = $wpdb->prefix . 'yatra_destinations';
        $destination = $wpdb->get_row($wpdb->prepare(
            "SELECT slug FROM {$table} WHERE id = %d",
            (int) $destination
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
        $table = $wpdb->prefix . 'yatra_activities';
        $activity = $wpdb->get_row($wpdb->prepare(
            "SELECT slug FROM {$table} WHERE id = %d",
            (int) $activity
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
        $table = $wpdb->prefix . 'yatra_trip_categories';
        $category = $wpdb->get_row($wpdb->prepare(
            "SELECT slug FROM {$table} WHERE id = %d",
            (int) $category
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
        $table = $wpdb->prefix . 'yatra_trips';
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
    
    return home_url('/' . $base . '/' . $slug . '/');
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
        $table = $wpdb->prefix . 'yatra_difficulty_levels';
        $difficulty = $wpdb->get_row($wpdb->prepare(
            "SELECT slug FROM {$table} WHERE id = %d",
            (int) $difficulty
        ));
    }
    
    $slug = is_object($difficulty) ? ($difficulty->slug ?? '') : '';
    
    if (empty($slug)) {
        return '';
    }
    
    $base = SettingsService::getString('difficulty_base', 'difficulty');
    
    return home_url('/' . $base . '/' . $slug . '/');
}
