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

/**
 * Get the booking URL for a trip
 * 
 * @param string $trip_slug The trip slug
 * @param array  $params    Optional URL parameters (date, adults, children, price)
 * @return string The booking URL
 */
function yatra_get_booking_url(string $trip_slug, array $params = []): string
{
    // Check if using custom booking page
    $use_booking_page = get_option('yatra_use_booking_page', false);
    $booking_page_id = (int) get_option('yatra_booking_page_id', 0);
    
    if ($use_booking_page && $booking_page_id > 0) {
        // Using custom WordPress page
        $page_url = get_permalink($booking_page_id);
        if ($page_url) {
            $params['trip'] = $trip_slug;
            return add_query_arg($params, $page_url);
        }
    }
    
    // Using default dynamic URL
    $booking_base = get_option('yatra_booking_base', 'book');
    $booking_base = preg_replace('/[^a-z0-9_-]/i', '', $booking_base);
    if (empty($booking_base)) {
        $booking_base = 'book';
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
 * @param float  $amount   The amount to format
 * @param string $currency The currency code
 * @return string Formatted price
 */
if (!function_exists('yatra_format_price')) {
    function yatra_format_price(float $amount, string $currency = 'USD'): string
    {
        if (empty($amount) || $amount == 0) {
            return 'Contact for pricing';
        }
        
        $currency_position = get_option('yatra_currency_position', 'left');
        $currency_decimals = (int) get_option('yatra_currency_decimals', 2);
        
        $formatted_amount = number_format($amount, $currency_decimals);
        
        if ($currency_position === 'right') {
            return $formatted_amount . ' ' . $currency;
        }
        
        return $currency . ' ' . $formatted_amount;
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
        $icons = [
            'calendar' => '<svg class="' . esc_attr($class) . '" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
            'clock' => '<svg class="' . esc_attr($class) . '" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            'users' => '<svg class="' . esc_attr($class) . '" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
            'map-pin' => '<svg class="' . esc_attr($class) . '" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
            'check' => '<svg class="' . esc_attr($class) . '" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
            'x' => '<svg class="' . esc_attr($class) . '" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
            'heart' => '<svg class="' . esc_attr($class) . '" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>',
            'share' => '<svg class="' . esc_attr($class) . '" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>',
            'star' => '<svg class="' . esc_attr($class) . '" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
            'mountain' => '<svg class="' . esc_attr($class) . '" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 20l4.5-9 3.5 7 4-8 4 10H4z"/></svg>',
            'camera' => '<svg class="' . esc_attr($class) . '" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
            'info' => '<svg class="' . esc_attr($class) . '" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            'question' => '<svg class="' . esc_attr($class) . '" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            'utensils' => '<svg class="' . esc_attr($class) . '" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            'hotel' => '<svg class="' . esc_attr($class) . '" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>',
            'bus' => '<svg class="' . esc_attr($class) . '" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h.01M12 7h.01M16 7h.01M4 11h16M4 11v4a2 2 0 002 2h12a2 2 0 002-2v-4M4 11V7a2 2 0 012-2h12a2 2 0 012 2v4M8 21v-4m8 4v-4"/></svg>',
            'plane' => '<svg class="' . esc_attr($class) . '" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            'hiking' => '<svg class="' . esc_attr($class) . '" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
            'binoculars' => '<svg class="' . esc_attr($class) . '" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>',
        ];
        
        return $icons[$icon_name] ?? '';
    }
}

/**
 * Get booking base URL slug
 * 
 * @return string The booking base slug
 */
function yatra_get_booking_base(): string
{
    $use_booking_page = get_option('yatra_use_booking_page', false);
    
    if ($use_booking_page) {
        $booking_page_id = (int) get_option('yatra_booking_page_id', 0);
        if ($booking_page_id > 0) {
            $page = get_post($booking_page_id);
            if ($page) {
                return $page->post_name;
            }
        }
    }
    
    $booking_base = get_option('yatra_booking_base', 'book');
    $booking_base = preg_replace('/[^a-z0-9_-]/i', '', $booking_base);
    
    return !empty($booking_base) ? $booking_base : 'book';
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
    $use_booking_page = get_option('yatra_use_booking_page', false);
    if ($use_booking_page) {
        $booking_page_id = (int) get_option('yatra_booking_page_id', 0);
        if ($booking_page_id > 0 && is_page($booking_page_id)) {
            return true;
        }
    }
    
    // Check for dynamic booking URL
    return !empty($wp_query->get('yatra_booking_trip_slug'));
}

