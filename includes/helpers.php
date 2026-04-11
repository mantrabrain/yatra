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
        // Pro module is active — merged config from options (filtered in SettingsService::getBookingFormConfig)
        return SettingsService::getBookingFormConfig();
    }

    // Module off: still allow filters to adjust defaults (tests / edge integrations)
    return apply_filters(
        'yatra_booking_form_config',
        SettingsService::getDefaultBookingFormConfig()
    );
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
        $params['trip'] = $trip_slug;

        return add_query_arg(
            array_merge(['yatra_page' => $booking_base], $params),
            home_url('/')
        );
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
 * @param bool        $zero_is_unknown When true (default), 0 is shown as "Contact for pricing" (trip/listing).
 *                                     Set false for checkout, payments, and invoices where 0 is a real amount.
 * @return string Formatted price
 */
if (!function_exists('yatra_format_price')) {
    function yatra_format_price(float $amount, ?string $currency = null, bool $zero_is_unknown = true): string
    {
        if ($zero_is_unknown && (empty($amount) || $amount == 0)) {
            return __('Contact for pricing', 'yatra');
        }
        
        // Get currency from global settings if not provided
        if (empty($currency)) {
            $currency = SettingsService::getCurrency();
        }
        
        // Get formatting settings from global settings
        $currency_position = SettingsService::getCurrencyPosition();
        $decimal_places = SettingsService::getInt('decimal_places', 2);
        // Avoid absurd migrated values (e.g. 7+) breaking storefront display; cap at 4.
        $decimal_places = max(0, min(4, $decimal_places));
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
 * Extract SVG icon slug from a stored icon field (same shape as admin / archive cards).
 *
 * @param mixed $icon Raw value from DB (serialized array with type/value, URL, attachment id, or legacy slug string).
 */
function yatra_icon_slug_from_stored_field($icon): string
{
    if ($icon === null || $icon === '') {
        return '';
    }

    $icon = maybe_unserialize($icon);

    if (is_array($icon)) {
        $type  = $icon['type'] ?? $icon[0] ?? '';
        $value = $icon['value'] ?? $icon[1] ?? '';
        if ($type === 'icon' && !empty($value) && is_string($value)) {
            return $value;
        }

        return '';
    }

    if (is_string($icon)) {
        if (filter_var($icon, FILTER_VALIDATE_URL)) {
            return '';
        }
        $slug = trim($icon);

        return $slug !== '' ? $slug : '';
    }

    return '';
}

/**
 * SVG markup for archive listing CTAs: use admin icon when present and valid in icons.json; else default slug.
 *
 * @param string $resolved_icon_slug From the listing loop (same source as card hero icon when type is "icon").
 * @param string $default_slug       icons.json key when no admin icon.
 */
function yatra_archive_listing_cta_icon_markup(string $resolved_icon_slug, string $default_slug, string $class = 'yatra-btn-icon'): string
{
    $slug = trim($resolved_icon_slug);
    if ($slug !== '' && function_exists('yatra_svg_icon')) {
        $out = yatra_svg_icon($slug, $class);
        if ($out !== '') {
            return $out;
        }
    }

    $fallback = trim($default_slug);
    if ($fallback !== '' && function_exists('yatra_svg_icon')) {
        return yatra_svg_icon($fallback, $class);
    }

    return '';
}

/**
 * Icon slug for trip listing card "View Details" — category, then destination, then difficulty (backend order).
 *
 * @param array<int, object|array<string, mixed>> $categories  Trip categories from getCategories()
 * @param array<int, object|array<string, mixed>> $destinations Trip destinations from getDestinations()
 * @param array<string, mixed>                    $difficulty   From Trip::getDifficulty()
 */
function yatra_trip_listing_card_cta_icon_slug(array $categories, array $destinations, array $difficulty): string
{
    foreach ($categories as $row) {
        if (empty($row)) {
            continue;
        }
        $raw = is_object($row) ? ($row->icon ?? null) : ($row['icon'] ?? null);
        $slug = yatra_icon_slug_from_stored_field($raw);
        if ($slug !== '') {
            return $slug;
        }
    }

    foreach ($destinations as $row) {
        if (empty($row)) {
            continue;
        }
        $raw = is_object($row) ? ($row->icon ?? null) : ($row['icon'] ?? null);
        $slug = yatra_icon_slug_from_stored_field($raw);
        if ($slug !== '') {
            return $slug;
        }
    }

    if (!empty($difficulty['icon']) && is_string($difficulty['icon'])) {
        $try = trim($difficulty['icon']);
        if ($try !== '') {
            return $try;
        }
    }

    return '';
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
    
    $booking_base = SettingsService::getBookingBase();
    if (!empty($wp_query->get('yatra_page')) && (string) $wp_query->get('yatra_page') === $booking_base) {
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
 * Public URL for the Yatra brand icon (admin menu + React sidebar). Empty if file is missing.
 */
function yatra_get_brand_icon_url(): string
{
    if (!defined('YATRA_PLUGIN_PATH') || !defined('YATRA_PLUGIN_URL')) {
        return '';
    }

    $candidates = [
        'assets/images/yatra-icon.png',
        'assets/images/yara-icon.png',
    ];

    foreach ($candidates as $relative) {
        $file = YATRA_PLUGIN_PATH . $relative;
        if (!is_readable($file)) {
            continue;
        }

        $url = YATRA_PLUGIN_URL . $relative;

        return add_query_arg('ver', (string) filemtime($file), $url);
    }

    return '';
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
        return add_query_arg(['yatra_page' => $base], home_url('/'));
    }

    return home_url('/' . $base . '/');
}

/**
 * Front-end URL for booking confirmation for a given reference.
 *
 * Uses the configured confirmation page (if set), plain-permalink query routing
 * (?yatra_booking_confirmation=ref), or the default /booking-confirmation/ base.
 *
 * @param string $reference Booking reference segment (may be empty for base URL only).
 * @return string Full URL.
 */
function yatra_get_booking_confirmation_url(string $reference = ''): string
{
    $reference = (string) $reference;
    $permalink_structure = get_option('permalink_structure');
    $is_plain = empty($permalink_structure);

    if ($is_plain) {
        if ($reference === '') {
            $url = home_url('/');
        } else {
            $url = add_query_arg('yatra_booking_confirmation', $reference, home_url('/'));
        }
    } else {
        $confirmation_page_id = SettingsService::get('booking_confirmation_page');
        $base_url = $confirmation_page_id ? get_permalink((int) $confirmation_page_id) : home_url('/booking-confirmation/');
        if ($reference === '') {
            $url = trailingslashit($base_url);
        } else {
            $url = trailingslashit($base_url) . $reference . '/';
        }
    }

    /**
     * Filter the booking confirmation URL.
     *
     * @param string $url       Built URL.
     * @param string $reference Booking reference (may be empty).
     */
    return (string) apply_filters('yatra_booking_confirmation_url', $url, $reference);
}

/**
 * ============================================
 * ARCHIVE LISTING (plain permalinks pagination)
 * ============================================
 */

/**
 * Items per page from WordPress Reading settings ("Blog pages show at most").
 * Used for Yatra front-end listings (trips, taxonomies, activity/destination/category archives).
 *
 * @return int At least 1.
 */
function yatra_get_posts_per_page(): int
{
    $n = absint((int) get_option('posts_per_page', 10));

    return (int) apply_filters('yatra_posts_per_page', max(1, $n));
}

/**
 * Current page number for Yatra archive templates (activity, destination, trip category).
 * Handles plain URLs where WordPress may use {@see 'paged'} or {@see 'page'} on the front page.
 */
function yatra_get_archive_listing_paged(): int
{
    if (isset($_GET['paged']) && $_GET['paged'] !== '') {
        return max(1, absint(wp_unslash($_GET['paged'])));
    }

    if (!empty($_GET['yatra_page']) && isset($_GET['page']) && $_GET['page'] !== '') {
        return max(1, absint(wp_unslash($_GET['page'])));
    }

    $p = (int) get_query_var('paged');
    if ($p > 0) {
        return max(1, $p);
    }

    $p = (int) get_query_var('page');

    return max(1, $p);
}

/**
 * Result summary for destination / activity / trip-category browse pages (parity with trip grid header).
 *
 * @param string $items_label Plural noun, e.g. translated "destinations".
 */
function yatra_archive_browse_results_line(int $start, int $end, int $total, int $page, int $pages, string $items_label): string
{
    if ($total <= 0) {
        return '';
    }

    return sprintf(
        /* translators: 1–2: range, 3: total, 4: item type, 5–6: pagination */
        __('Showing %1$d–%2$d of %3$d %4$s (page %5$d of %6$d)', 'yatra'),
        $start,
        $end,
        $total,
        $items_label,
        $page,
        $pages
    );
}

/**
 * Full URL for the same archive request with a different page (preserves yatra_page and other args).
 * Uses home_url + add_query_arg so links are never query-only (esc_url rejects "?foo=bar" in some cases).
 */
function yatra_build_archive_listing_url(int $page_num): string
{
    $params = !empty($_GET) && is_array($_GET) ? wp_unslash($_GET) : [];

    $qvYatra = (string) get_query_var('yatra_page');
    if ($qvYatra !== '' && (!isset($params['yatra_page']) || $params['yatra_page'] === '')) {
        $params['yatra_page'] = $qvYatra;
    }

    if (!empty($params['yatra_page']) || isset($params['yatra_trip'])) {
        unset($params['page']);
    }

    if ($page_num > 1) {
        $params['paged'] = (string) $page_num;
    } else {
        unset($params['paged']);
    }

    return esc_url(add_query_arg($params, home_url('/')));
}

/**
 * Same request path with a different paged query arg (strips an existing /page/N/ segment first).
 * For taxonomy trip lists and other templates not rooted at home_url('/').
 */
function yatra_build_current_request_paged_url(int $page_num): string
{
    $page_num = max(1, $page_num);
    $request_uri = isset($_SERVER['REQUEST_URI']) ? (string) wp_unslash($_SERVER['REQUEST_URI']) : '/';
    $base_path = strtok($request_uri, '?') ?: '/';
    $base_path = rtrim($base_path, '/');
    $base_path = preg_replace('#/page/[0-9]+#', '', $base_path);
    $base_path = rtrim($base_path, '/');

    $query_string = isset($_SERVER['QUERY_STRING']) ? (string) $_SERVER['QUERY_STRING'] : '';
    parse_str($query_string, $params);
    if (!is_array($params)) {
        $params = [];
    }

    if ($page_num > 1) {
        $params['paged'] = (string) $page_num;
    } else {
        unset($params['paged'], $params['page']);
    }

    $query = http_build_query($params);

    return esc_url($base_path . ($query !== '' ? '?' . $query : ''));
}

/**
 * Compare two archive listing rows (activity, destination, or category) by sort key.
 */
function yatra_compare_archive_listing_row_pair(object $a, object $b, string $sort): int
{
    $nameA   = isset($a->name) ? strtolower((string) $a->name) : '';
    $nameB   = isset($b->name) ? strtolower((string) $b->name) : '';
    $tripsA  = isset($a->trips_count) ? (int) $a->trips_count : 0;
    $tripsB  = isset($b->trips_count) ? (int) $b->trips_count : 0;
    $ratingA = isset($a->avg_rating) ? (float) $a->avg_rating : 0.0;
    $ratingB = isset($b->avg_rating) ? (float) $b->avg_rating : 0.0;

    switch ($sort) {
        case 'trips_desc':
            return $tripsB <=> $tripsA;
        case 'trips_asc':
            return $tripsA <=> $tripsB;
        case 'name_asc':
            return $nameA <=> $nameB;
        case 'name_desc':
            return $nameB <=> $nameA;
        case 'rating_desc':
        default:
            $cmp = $ratingB <=> $ratingA;
            if (0 === $cmp) {
                return $tripsB <=> $tripsA;
            }

            return $cmp;
    }
}

/**
 * Invokable comparator for {@see yatra_sort_archive_listing_stats_rows()}.
 *
 * @internal
 */
final class Yatra_Archive_Listing_Stats_Comparator
{
    /** @var string */
    private $sort;

    public function __construct(string $sort)
    {
        $this->sort = $sort;
    }

    /**
     * @param object $a
     * @param object $b
     */
    public function __invoke($a, $b): int
    {
        return yatra_compare_archive_listing_row_pair($a, $b, $this->sort);
    }
}

/**
 * Sort archive listing rows in place (stats objects from repository).
 */
function yatra_sort_archive_listing_stats_rows(array &$items, string $sort): void
{
    if (empty($items)) {
        return;
    }

    usort($items, new Yatra_Archive_Listing_Stats_Comparator($sort));
}

/**
 * Sort dropdown URL: same archive, page reset to 1, yatra_sort applied (preserves yatra_page etc.).
 */
function yatra_build_archive_listing_sort_url(string $yatra_sort): string
{
    $params = !empty($_GET) && is_array($_GET) ? wp_unslash($_GET) : [];
    unset($params['paged'], $params['page']);
    if (!empty($params['yatra_page']) || isset($params['yatra_trip'])) {
        unset($params['page']);
    }
    $params['yatra_sort'] = $yatra_sort;

    return esc_url(add_query_arg($params, home_url('/')));
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
    $permalink_structure = get_option('permalink_structure');
    $is_plain = empty($permalink_structure);

    if ($is_plain) {
        $key = preg_replace('/[^a-z0-9_-]/i', '', $base) ?: 'destination';

        return add_query_arg([$key => $slug], home_url('/'));
    }

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
    $permalink_structure = get_option('permalink_structure');
    $is_plain = empty($permalink_structure);

    if ($is_plain) {
        $key = preg_replace('/[^a-z0-9_-]/i', '', $base) ?: 'activity';

        return add_query_arg([$key => $slug], home_url('/'));
    }

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
    $permalink_structure = get_option('permalink_structure');
    $is_plain = empty($permalink_structure);

    if ($is_plain) {
        $key = preg_replace('/[^a-z0-9_-]/i', '', $base) ?: 'trip-category';

        return add_query_arg([$key => $slug], home_url('/'));
    }

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
        $key = preg_replace('/[^a-z0-9_-]/i', '', $base) ?: 'trip';

        return add_query_arg([$key => $slug], home_url('/'));
    }
    
    return home_url('/' . $base . '/' . $slug . '/');
}

/**
 * Canonical URL for the trip archive / filter listing (respects Settings trip base).
 * Plain permalinks use ?yatra_page={base}; pretty permalinks use /{base}/.
 */
function yatra_get_trip_listing_url(): string
{
    $base = SettingsService::getTripBase();
    $base = preg_replace('/[^a-zA-Z0-9_-]/', '', (string) $base) ?: 'trip';
    $permalink_structure = (string) get_option('permalink_structure', '');

    if ($permalink_structure === '') {
        $url = esc_url(add_query_arg('yatra_page', $base, home_url('/')));
    } else {
        $url = trailingslashit(home_url('/' . $base . '/'));
    }

    return (string) apply_filters('yatra_trip_listing_url', $url, $base);
}

/**
 * Canonical URL for browse-all taxonomy listings (destinations, activities, trip categories).
 * Plain permalinks use ?yatra_page={base}; pretty permalinks use /{base}/.
 *
 * @param string $listing_type One of: destination, activity, category
 */
function yatra_get_taxonomy_listing_url(string $listing_type): string
{
    $map = [
        'destination' => SettingsService::getString('destination_base', 'destination'),
        'activity' => SettingsService::getString('activity_base', 'activity'),
        'category' => SettingsService::getString('trip_category_base', 'trip-category'),
    ];
    $base = $map[$listing_type] ?? '';
    $base = preg_replace('/[^a-zA-Z0-9_-]/', '', (string) $base) ?: 'destination';
    $permalink_structure = (string) get_option('permalink_structure', '');

    if ($permalink_structure === '') {
        $url = esc_url(add_query_arg('yatra_page', $base, home_url('/')));
    } else {
        $url = trailingslashit(home_url('/' . $base . '/'));
    }

    return (string) apply_filters('yatra_taxonomy_listing_url', $url, $listing_type, $base);
}

/**
 * Decode trips.price_types for listing-card logic (DB may store JSON string or array).
 *
 * @return array<int, array<string, mixed>>
 */
function yatra_trip_listing_decode_price_types(object $trip): array
{
    $pts = $trip->price_types ?? null;
    if (is_string($pts) && $pts !== '') {
        $decoded = json_decode($pts, true);
        $pts = is_array($decoded) ? $decoded : [];
    } elseif (!is_array($pts)) {
        $pts = [];
    }
    if ($pts === [] && method_exists($trip, 'getPriceTypes')) {
        $got = $trip->getPriceTypes();
        $pts = is_array($got) ? $got : [];
    }

    return $pts;
}

/**
 * Lowercase keys for traveler tier labels (used to strip mis-tagged classifications).
 *
 * @return array<string, true>
 */
function yatra_trip_listing_traveler_tier_label_keys(object $trip): array
{
    if (($trip->pricing_type ?? '') !== 'traveler_based') {
        return [];
    }
    $keys = [];
    foreach (yatra_trip_listing_decode_price_types($trip) as $pt) {
        if (!is_array($pt)) {
            continue;
        }
        foreach (['label', 'category_label', 'title'] as $k) {
            if (!empty($pt[$k]) && is_string($pt[$k])) {
                $t = strtolower(trim($pt[$k]));
                if ($t !== '') {
                    $keys[$t] = true;
                }
                break;
            }
        }
    }

    return $keys;
}

/**
 * Ordered unique labels for the listing card “Traveler types” row.
 *
 * @return list<string>
 */
function yatra_trip_listing_traveler_type_labels_for_card(object $trip): array
{
    if (($trip->pricing_type ?? '') !== 'traveler_based') {
        return [];
    }
    $labels = [];
    $seen = [];
    foreach (yatra_trip_listing_decode_price_types($trip) as $pt) {
        if (!is_array($pt)) {
            continue;
        }
        foreach (['label', 'category_label', 'title'] as $k) {
            if (!empty($pt[$k]) && is_string($pt[$k])) {
                $lab = trim($pt[$k]);
                if ($lab === '') {
                    break;
                }
                $lk = strtolower($lab);
                if (!isset($seen[$lk])) {
                    $seen[$lk] = true;
                    $labels[] = $lab;
                }
                break;
            }
        }
    }

    return $labels;
}

/**
 * Format start → end for listing cards; avoids repeating the same country when both
 * strings are "City, Country".
 */
function yatra_format_trip_listing_route_line(string $start, string $end): string
{
    $start = trim($start);
    $end = trim($end);
    if ($start === '') {
        return $end;
    }
    if ($end === '') {
        return $start;
    }
    if (strcasecmp($start, $end) === 0) {
        return $start;
    }
    if (strpos($start, ',') !== false && strpos($end, ',') !== false) {
        $s_parts = array_map('trim', explode(',', $start, 2));
        $e_parts = array_map('trim', explode(',', $end, 2));
        if (count($s_parts) === 2 && count($e_parts) === 2
            && strcasecmp($s_parts[1], $e_parts[1]) === 0) {
            return $s_parts[0] . ' → ' . $e_parts[0] . ', ' . $s_parts[1];
        }
    }

    return $start . ' → ' . $end;
}

/**
 * Human label for trip_type column (listing card meta).
 */
function yatra_trip_listing_trip_type_label(?string $trip_type): string
{
    $t = (string) $trip_type;
    $map = [
        'single_day' => __('Single day', 'yatra'),
        'multi_day' => __('Multi-day', 'yatra'),
        'flexible' => __('Flexible', 'yatra'),
    ];

    return $map[$t] ?? '';
}

/**
 * Rating block for listing cards: prefers SQL aggregates (average_rating, review_count)
 * when the hydrated reviews array is empty.
 *
 * @param array{has_rating: bool, average_rating: float, review_count: int, formatted_rating: string} $from_reviews
 * @return array{has_rating: bool, average_rating: float, review_count: int, formatted_rating: string}
 */
function yatra_trip_listing_card_rating_data(object $trip, array $from_reviews): array
{
    $has = !empty($from_reviews['has_rating']);
    $avg = (float) ($from_reviews['average_rating'] ?? 0);
    $cnt = (int) ($from_reviews['review_count'] ?? 0);
    $fmt = (string) ($from_reviews['formatted_rating'] ?? '0.0');

    if ($cnt === 0 || !$has || $avg <= 0) {
        $q_avg = isset($trip->average_rating) ? (float) $trip->average_rating : null;
        $q_cnt = isset($trip->review_count) ? (int) $trip->review_count : null;
        if (($q_cnt === null || $q_cnt === 0) && isset($trip->reviews_count)) {
            $q_cnt = (int) $trip->reviews_count;
        }
        if ($q_cnt !== null && $q_cnt > 0 && $q_avg !== null && $q_avg > 0) {
            $avg = round($q_avg, 1);
            $cnt = $q_cnt;
            $fmt = number_format($avg, 1);
            $has = true;
        }
    }

    return [
        'has_rating' => $has && $avg > 0 && $cnt > 0,
        'average_rating' => $avg,
        'review_count' => $cnt,
        'formatted_rating' => $fmt,
    ];
}

/**
 * Avoid repeating the same classification label in the destination, activity, and category
 * rows on listing cards (traveler tier labels wrongly linked as classifications, or same
 * term attached in multiple roles).
 *
 * @param array<int, object> $destinations
 * @param array<int, object> $activities
 * @param array<int, object> $categories
 * @return array{0: array<int, object>, 1: array<int, object>, 2: array<int, object>}
 */
function yatra_trip_listing_filter_classification_duplicates(array $destinations, array $activities, array $categories, object $trip): array
{
    $tier_keys = yatra_trip_listing_traveler_tier_label_keys($trip);

    $strip_tiers = static function (array $items) use ($tier_keys): array {
        if ($tier_keys === []) {
            return $items;
        }

        return array_values(array_filter($items, static function ($item) use ($tier_keys) {
            $n = strtolower(trim((string) ($item->name ?? '')));

            return $n === '' || !isset($tier_keys[$n]);
        }));
    };

    $destinations = $strip_tiers($destinations);
    $activities = $strip_tiers($activities);
    $categories = $strip_tiers($categories);

    $seen = [];
    $dedupe = static function (array $items) use (&$seen): array {
        $out = [];
        foreach ($items as $item) {
            $n = strtolower(trim((string) ($item->name ?? '')));
            if ($n === '') {
                $out[] = $item;
                continue;
            }
            if (isset($seen[$n])) {
                continue;
            }
            $seen[$n] = true;
            $out[] = $item;
        }

        return $out;
    };

    $destinations = $dedupe($destinations);
    $activities = $dedupe($activities);
    $categories = $dedupe($categories);

    return [$destinations, $activities, $categories];
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

if (!function_exists('yatra_usage_track_event')) {
    /**
     * Record an anonymous product telemetry event (requires opt-in).
     *
     * @param string $event Event key (sanitized).
     * @param int    $delta Counter increment.
     */
    function yatra_usage_track_event(string $event, int $delta = 1): void
    {
        if (!class_exists(\Yatra\Admin\StatsUsage::class)) {
            return;
        }
        \Yatra\Admin\StatsUsage::instance()->record_event($event, $delta);
    }
}
