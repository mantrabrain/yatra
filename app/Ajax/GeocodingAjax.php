<?php

declare(strict_types=1);

namespace Yatra\Ajax;

/**
 * AJAX handlers for Geocoding functionality
 */
class GeocodingAjax
{
    public function __construct()
    {
        add_action('wp_ajax_yatra_search_locations', [$this, 'searchLocations']);
        add_action('wp_ajax_nopriv_yatra_search_locations', [$this, 'searchLocations']);
        add_action('wp_ajax_yatra_reverse_geocode', [$this, 'reverseGeocode']);
        add_action('wp_ajax_nopriv_yatra_reverse_geocode', [$this, 'reverseGeocode']);
    }

    /**
     * Search for locations using Nominatim API
     */
    public function searchLocations(): void
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'yatra_geocoding_nonce')) {
            wp_send_json_error(['message' => 'Security check failed']);
            return;
        }

        $query = sanitize_text_field($_POST['query'] ?? '');
        $limit = intval($_POST['limit'] ?? 5);

        if (empty($query) || strlen($query) < 2) {
            wp_send_json_error(['message' => 'Query too short']);
            return;
        }

        // Rate limiting - check if user has made too many requests
        $user_ip = $_SERVER['REMOTE_ADDR'];
        $cache_key = 'yatra_geocoding_' . md5($user_ip);
        $request_count = get_transient($cache_key);

        if ($request_count === false) {
            // First request, set counter
            set_transient($cache_key, 1, 60); // 1 minute window
        } elseif ($request_count >= 10) {
            // Too many requests
            wp_send_json_error(['message' => 'Too many requests. Please wait a moment.']);
            return;
        } else {
            // Increment counter
            set_transient($cache_key, $request_count + 1, 60);
        }

        // Check cache first
        $cache_key = 'yatra_location_search_' . md5($query . $limit);
        $cached_results = get_transient($cache_key);

        if ($cached_results !== false) {
            wp_send_json_success(['results' => $cached_results]);
            return;
        }

        // Make API request
        $url = add_query_arg([
            'format' => 'json',
            'q' => $query,
            'limit' => $limit,
            'addressdetails' => 1,
            'accept-language' => 'en-US,en;q=0.9',
            'countrycodes' => 'id,np,us,gb,fr,de,it,es,au,nz'
        ], 'https://nominatim.openstreetmap.org/search');

        $response = wp_remote_get($url, [
            'timeout' => 10,
            'user-agent' => 'Yatra Travel Plugin (https://wpyatra.com/)',
            'headers' => [
                'Accept' => 'application/json'
            ]
        ]);

        if (is_wp_error($response)) {
            wp_send_json_error(['message' => 'Search failed. Please try again.']);
            return;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (empty($data)) {
            wp_send_json_success(['results' => []]);
            return;
        }

        // Cache results for 5 minutes
        set_transient($cache_key, $data, 300);

        wp_send_json_success(['results' => $data]);
    }

    /**
     * Reverse geocode coordinates to get location name
     */
    public function reverseGeocode(): void
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'yatra_geocoding_nonce')) {
            wp_send_json_error(['message' => 'Security check failed']);
            return;
        }

        $lat = floatval($_POST['lat'] ?? 0);
        $lng = floatval($_POST['lng'] ?? 0);

        if ($lat === 0 || $lng === 0) {
            wp_send_json_error(['message' => 'Invalid coordinates']);
            return;
        }

        // Check cache first
        $cache_key = 'yatra_reverse_geocode_' . md5($lat . '_' . $lng);
        $cached_result = get_transient($cache_key);

        if ($cached_result !== false) {
            wp_send_json_success(['result' => $cached_result]);
            return;
        }

        // Make API request
        $url = add_query_arg([
            'format' => 'json',
            'lat' => $lat,
            'lon' => $lng,
            'zoom' => 18,
            'addressdetails' => 1,
            'accept-language' => 'en-US,en;q=0.9'
        ], 'https://nominatim.openstreetmap.org/reverse');

        $response = wp_remote_get($url, [
            'timeout' => 10,
            'user-agent' => 'Yatra Travel Plugin (https://wpyatra.com/)',
            'headers' => [
                'Accept' => 'application/json'
            ]
        ]);

        if (is_wp_error($response)) {
            wp_send_json_error(['message' => 'Reverse geocoding failed']);
            return;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        // Cache result for 10 minutes
        set_transient($cache_key, $data, 600);

        wp_send_json_success(['result' => $data]);
    }
}
