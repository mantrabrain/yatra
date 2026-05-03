<?php

declare(strict_types=1);

namespace Yatra\Ajax;

use Yatra\Repositories\GeocodingRepository;

/**
 * AJAX handlers for Geocoding functionality
 *
 * Rate limiting uses WordPress transients (always on). Response caching goes through
 * {@see GeocodingRepository} → {@see \Yatra\Utils\Cache} (not options).
 */
class GeocodingAjax
{
    private GeocodingRepository $geocodingRepository;

    public function __construct()
    {
        $this->geocodingRepository = new GeocodingRepository();
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

        $resultCacheKey = $this->geocodingRepository->cacheKeySearch($query, $limit);
        $cached = $this->geocodingRepository->getPayload($resultCacheKey);
        if (is_array($cached)) {
            wp_send_json_success(['results' => $cached]);
            return;
        }

        $limit = min(max($limit, 1), 50);

        // Forward geocode: global results by default. Optional filter
        // `yatra_nominatim_search_query_args` may add `countrycodes` etc. if a site must
        // restrict to specific ISO regions.
        $baseArgs = [
            'format' => 'json',
            'q' => $query,
            'limit' => $limit,
            'addressdetails' => 1,
            'dedupe' => 1,
            'accept-language' => $this->nominatimAcceptLanguage(),
        ];

        $args = apply_filters('yatra_nominatim_search_query_args', $baseArgs, $query, $limit);

        $url = add_query_arg($args, 'https://nominatim.openstreetmap.org/search');

        $response = wp_remote_get($url, [
            'timeout' => 10,
            'user-agent' => 'Yatra Travel Plugin (https://wpyatra.com/)',
            'headers' => [
                'Accept' => 'application/json',
            ],
        ]);

        if (is_wp_error($response)) {
            wp_send_json_error(['message' => 'Search failed. Please try again.']);
            return;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        if (!is_array($data) || empty($data)) {
            wp_send_json_success(['results' => []]);
            return;
        }

        $data = self::sortNominatimSearchResults($data);

        $this->geocodingRepository->setPayload($resultCacheKey, $data, 300);

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

        $resultCacheKey = $this->geocodingRepository->cacheKeyReverse($lat, $lng);
        $cached = $this->geocodingRepository->getPayload($resultCacheKey);
        if (is_array($cached)) {
            wp_send_json_success(['result' => $cached]);
            return;
        }

        $url = add_query_arg([
            'format' => 'json',
            'lat' => $lat,
            'lon' => $lng,
            'zoom' => 18,
            'addressdetails' => 1,
            'accept-language' => $this->nominatimAcceptLanguage(),
        ], 'https://nominatim.openstreetmap.org/reverse');

        $response = wp_remote_get($url, [
            'timeout' => 10,
            'user-agent' => 'Yatra Travel Plugin (https://wpyatra.com/)',
            'headers' => [
                'Accept' => 'application/json',
            ],
        ]);

        if (is_wp_error($response)) {
            wp_send_json_error(['message' => 'Reverse geocoding failed']);
            return;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        if (!is_array($data)) {
            wp_send_json_error(['message' => 'Reverse geocoding failed']);
            return;
        }

        $this->geocodingRepository->setPayload($resultCacheKey, $data, 600);

        wp_send_json_success(['result' => $data]);
    }

    /**
     * Prefer the site / user locale for Nominatim labels.
     * English regions like en-US can skew free-text search ordering toward US places;
     * use a neutral "en" first, then the full tag, so global queries (e.g. "Japan") stay global.
     */
    private function nominatimAcceptLanguage(): string
    {
        $locale = function_exists('get_user_locale') ? (string) get_user_locale() : '';
        if ($locale === '') {
            $locale = (string) get_locale();
        }
        $primary = str_replace('_', '-', $locale);
        if ($primary === '' || $primary === 'C') {
            return 'en';
        }

        if (preg_match('/^en-/i', $primary)) {
            return 'en,' . $primary . ';q=0.88,*;q=0.5';
        }

        return $primary . ',en;q=0.8';
    }

    /**
     * Nominatim relevance order is not always ideal for short queries; re-rank by importance
     * (countries/cities rank higher than homonymous hamlets). No country filter — full planet.
     *
     * @param list<array<string, mixed>> $rows
     * @return list<array<string, mixed>>
     */
    private static function sortNominatimSearchResults(array $rows): array
    {
        usort($rows, static function (array $a, array $b): int {
            $ia = isset($a['importance']) ? (float) $a['importance'] : 0.0;
            $ib = isset($b['importance']) ? (float) $b['importance'] : 0.0;
            if ($ia !== $ib) {
                return $ib <=> $ia;
            }
            $rankA = isset($a['place_rank']) ? (int) $a['place_rank'] : 0;
            $rankB = isset($b['place_rank']) ? (int) $b['place_rank'] : 0;

            return $rankB <=> $rankA;
        });

        return $rows;
    }
}
