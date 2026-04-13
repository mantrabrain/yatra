<?php

declare(strict_types=1);

namespace Yatra\Utils;

/**
 * Yatra Cache Manager
 *
 * Performance and entity/query caching. Use {@see self::isEnabled()} before relying on stored data.
 * Controlled by option `yatra_cache_enabled`, {@see WP_DEBUG}, and option `yatra_debug_mode`
 * (Settings → Advanced).
 *
 * **Not routed through this class (by design):** WordPress transients used for rate limiting, OAuth
 * state, booking session tokens, telemetry throttles, and Pro Trip Consent draft storage — these are
 * security/session flows, not optional performance caches.
 */
class Cache
{
    /**
     * Cache prefixes for different data types
     */
    public const PREFIX_TABLE_EXISTS = 'yatra_table_exists_';
    public const PREFIX_TRIP_DATA = 'yatra_trip_';
    public const PREFIX_BOOKING_DATA = 'yatra_booking_';
    public const PREFIX_CUSTOMER_DATA = 'yatra_customer_';
    public const PREFIX_ACTIVITY_DATA = 'yatra_activity_';
    public const PREFIX_DESTINATION_DATA = 'yatra_destination_';
    public const PREFIX_QUERY_RESULT = 'yatra_query_';
    public const PREFIX_STATS = 'yatra_stats_';
    public const PREFIX_ITINERARY = 'yatra_itinerary_';
    public const PREFIX_ATTRIBUTES = 'yatra_attributes_';
    public const PREFIX_ITEM_TYPES = 'yatra_item_types_';
    public const PREFIX_FRONTEND_ATTRIBUTES = 'yatra_frontend_attributes_';

    /**
     * Pro plugin cache prefixes
     */
    public const PREFIX_PRO_DYNAMIC_PRICING = 'yatra_pro_dynamic_pricing_';
    public const PREFIX_PRO_ADDITIONAL_SERVICES = 'yatra_pro_additional_services_';
    public const PREFIX_PRO_EMAIL_AUTOMATION = 'yatra_pro_email_automation_';
    public const PREFIX_PRO_ABANDONED_BOOKING = 'yatra_pro_abandoned_booking_';
    public const PREFIX_PRO_TRIP_CONSENT = 'yatra_pro_trip_consent_';
    public const PREFIX_PRO_GOOGLE_CALENDAR = 'yatra_pro_google_calendar_';
    public const PREFIX_PRO_MAILCHIMP = 'yatra_pro_mailchimp_';
    public const PREFIX_PRO_FACEBOOK_PIXEL = 'yatra_pro_facebook_pixel_';
    public const PREFIX_PRO_GOOGLE_ANALYTICS = 'yatra_pro_google_analytics_';

    /**
     * Specific cache keys
     */
    public const KEY_ITINERARY_ENTRY_WITH_RELATIONS = 'yatra_itinerary_entry_with_relations';
    public const KEY_ITINERARY_BY_TRIP_ID = 'yatra_itinerary_by_trip_id';
    public const KEY_DAY_EXISTS = 'yatra_day_exists_trip';
    public const KEY_ACTIVITY_TYPE_LOOKUP = 'yatra_activity_type_lookup';
    public const KEY_ACTIVITY_TYPE_FROM_ITEMS = 'yatra_activity_type_from_items';
    public const KEY_ACTIVITY_ENTRY = 'yatra_activity_entry';
    public const KEY_TRIPS_WITH_FILTERS = 'yatra_trips_with_filters';
    public const KEY_AVAILABLE_ATTRIBUTES = 'yatra_available_attributes';
    public const KEY_ITEMS_COUNT_BY_TYPE = 'yatra_items_count_by_type';
    public const KEY_ACTIVITY_TRIP_COUNT = 'yatra_activity_trip_count';
    public const KEY_ACTIVITY_TRIP_COUNT_DIRECT = 'yatra_activity_trip_count_direct';
    public const KEY_TRIP_ATTRIBUTES = 'yatra_trip_attributes';

    /**
     * Pro plugin specific cache keys
     */
    public const KEY_PRO_PRICING_RULES = 'yatra_pro_pricing_rules';
    public const KEY_PRO_PRICING_RULE = 'yatra_pro_pricing_rule';
    public const KEY_PRO_ACTIVE_RULES = 'yatra_pro_active_pricing_rules';
    public const KEY_PRO_ADDITIONAL_SERVICES = 'yatra_pro_additional_services';
    public const KEY_PRO_EMAIL_TEMPLATES = 'yatra_pro_email_templates';
    public const KEY_PRO_ABANDONED_BOOKINGS = 'yatra_pro_abandoned_bookings';
    public const KEY_PRO_TRIP_CONSENTS = 'yatra_pro_trip_consents';
    public const KEY_PRO_CALENDAR_EVENTS = 'yatra_pro_calendar_events';
    public const KEY_PRO_MAILCHIMP_LISTS = 'yatra_pro_mailchimp_lists';

    /**
     * Cache durations (in seconds)
     */
    public const DURATION_TABLE_EXISTS = 3600; // 1 hour
    public const DURATION_TRIP_DATA = 1800; // 30 minutes
    public const DURATION_BOOKING_DATA = 900; // 15 minutes
    public const DURATION_CUSTOMER_DATA = 1800; // 30 minutes
    public const DURATION_ACTIVITY_DATA = 3600; // 1 hour
    public const DURATION_DESTINATION_DATA = 3600; // 1 hour
    public const DURATION_QUERY_RESULT = 600; // 10 minutes
    public const DURATION_STATS = 300; // 5 minutes
    public const DURATION_ITINERARY = 1800; // 30 minutes
    public const DURATION_ATTRIBUTES = 3600; // 1 hour
    public const DURATION_ITEM_TYPES = 1800; // 30 minutes
    public const DURATION_LISTINGS = 1800; // 30 minutes
    public const DURATION_COUNTS = 1800; // 30 minutes
    public const DURATION_LOOKUPS = 1800; // 30 minutes
    public const DURATION_SHORT = 600; // 10 minutes
    public const DURATION_LONG = 3600; // 1 hour

    /**
     * Cache backend preference order
     */
    private static array $backends = ['transient', 'memory'];

    /**
     * In-memory cache for current request
     */
    private static array $memoryCache = [];

    /**
     * Available cache backends
     */
    private static ?array $availableBackends = null;

    /**
     * Check if caching is enabled (single source of truth for runtime).
     *
     * Requires: Advanced → Enable Cache on, WP_DEBUG off, and Yatra Advanced → Debug mode off.
     */
    public static function isEnabled(): bool
    {
        if (!(bool) get_option('yatra_cache_enabled', true)) {
            return false;
        }
        if (defined('WP_DEBUG') && WP_DEBUG) {
            return false;
        }
        // Align with Settings → Advanced → Debug mode (yatra_debug_mode).
        if ((bool) get_option('yatra_debug_mode', false)) {
            return false;
        }

        return true;
    }

    /**
     * Get cache status information
     */
    public static function getStatus(): array
    {
        $optOn = (bool) get_option('yatra_cache_enabled', true);
        $wpDebug = defined('WP_DEBUG') && WP_DEBUG;
        $pluginDebug = (bool) get_option('yatra_debug_mode', false);
        $effective = $optOn && !$wpDebug && !$pluginDebug;

        $reason = null;
        if (!$optOn) {
            $reason = 'yatra_cache_enabled is false';
        } elseif ($wpDebug) {
            $reason = 'WP_DEBUG is enabled (wp-config.php)';
        } elseif ($pluginDebug) {
            $reason = 'Yatra Advanced Debug mode is enabled';
        }

        return [
            'cache_enabled' => $optOn,
            'debug_mode' => $wpDebug,
            'yatra_debug_mode' => $pluginDebug,
            'effective_status' => $effective,
            'wp_debug' => defined('WP_DEBUG') ? WP_DEBUG : false,
            'option_value' => $optOn,
            'reason_disabled' => $reason,
        ];
    }

    /**
     * Enable cache for testing (temporary)
     */
    public static function enableForTesting(): bool
    {
        update_option('yatra_cache_enabled', true);
        Logger::info('Cache enabled for testing', ['status' => true]);
        return true;
    }

    /**
     * Disable cache for testing (temporary)
     */
    public static function disableForTesting(): bool
    {
        update_option('yatra_cache_enabled', false);
        Logger::info('Cache disabled for testing', ['status' => false]);
        return true;
    }

    /**
     * Get cached value
     *
     * @return mixed
     */
    public static function get(string $key)
    {
        // Check if caching is enabled
        if (!self::isEnabled()) {
            Logger::debug("Cache disabled, skipping cache lookup", ['key' => $key]);
            return null;
        }
        
        // Try memory cache first (fastest)
        if (isset(self::$memoryCache[$key])) {
            Logger::debug("Cache hit (memory)", ['key' => $key]);
            return self::$memoryCache[$key];
        }

        // Try external cache backends
        foreach (self::getAvailableBackends() as $backend) {
            $value = self::getFromBackend($backend, $key);
            if ($value !== null) {
                // Store in memory cache for subsequent requests
                self::$memoryCache[$key] = $value;
                Logger::debug("Cache hit ({$backend})", ['key' => $key]);
                return $value;
            }
        }

        Logger::debug("Cache miss", ['key' => $key]);
        return null;
    }

    /**
     * Set cached value
     *
     * @param mixed $value
     */
    public static function set(string $key, $value, int $duration = 3600): bool
    {
        // Check if caching is enabled
        if (!self::isEnabled()) {
            Logger::debug("Cache disabled, skipping cache set", ['key' => $key]);
            return false;
        }
        
        // Always store in memory cache
        self::$memoryCache[$key] = $value;

        // Store in external cache backends
        $success = false;
        foreach (self::getAvailableBackends() as $backend) {
            if (self::setToBackend($backend, $key, $value, $duration)) {
                $success = true;
                Logger::debug("Cache set ({$backend})", ['key' => $key, 'duration' => $duration]);
            }
        }

        return $success;
    }

    /**
     * Delete cached value
     */
    public static function delete(string $key): bool
    {
        // Check if caching is enabled
        if (!self::isEnabled()) {
            Logger::debug("Cache disabled, skipping cache delete", ['key' => $key]);
            return false;
        }
        
        // Remove from memory cache
        unset(self::$memoryCache[$key]);

        // Remove from external cache backends
        $success = false;
        foreach (self::getAvailableBackends() as $backend) {
            if (self::deleteFromBackend($backend, $key)) {
                $success = true;
                Logger::debug("Cache delete ({$backend})", ['key' => $key]);
            }
        }

        return $success;
    }

    /**
     * Clear cache by prefix
     */
    public static function clearByPrefix(string $prefix): bool
    {
        // Check if caching is enabled (but allow clearing even when disabled)
        if (!self::isEnabled()) {
            Logger::debug("Cache disabled, but clearing cache entries", ['prefix' => $prefix]);
        }
        
        // Clear memory cache
        foreach (self::$memoryCache as $key => $value) {
            if (strpos($key, $prefix) === 0) {
                unset(self::$memoryCache[$key]);
            }
        }

        // Clear external cache backends
        $success = false;
        foreach (self::getAvailableBackends() as $backend) {
            if (self::clearPrefixFromBackend($backend, $prefix)) {
                $success = true;
                Logger::debug("Cache clear prefix ({$backend})", ['prefix' => $prefix]);
            }
        }

        return $success;
    }

    /**
     * Get or set cached value (cache-aside pattern)
     *
     * @return mixed
     */
    public static function remember(string $key, callable $callback, int $duration = 3600)
    {
        // Check if caching is enabled
        if (!self::isEnabled()) {
            Logger::debug("Cache disabled, executing callback directly", ['key' => $key]);
            return $callback();
        }
        
        $value = self::get($key);
        
        if ($value !== null) {
            return $value;
        }

        // Generate value and cache it
        $value = $callback();
        self::set($key, $value, $duration);
        
        Logger::debug("Cache remember", ['key' => $key, 'duration' => $duration]);
        return $value;
    }

    /**
     * Cache table existence check
     */
    public static function tableExists(string $tableName, callable $checkCallback): bool
    {
        $key = self::PREFIX_TABLE_EXISTS . $tableName;
        
        return (bool) self::remember($key, $checkCallback, self::DURATION_TABLE_EXISTS);
    }

    /**
     * Cache trip data
     *
     * @return mixed
     */
    public static function getTripData(int $tripId, callable $fetchCallback)
    {
        $key = self::PREFIX_TRIP_DATA . $tripId;
        
        return self::remember($key, $fetchCallback, self::DURATION_TRIP_DATA);
    }

    /**
     * Cache booking data
     *
     * @return mixed
     */
    public static function getBookingData(int $bookingId, callable $fetchCallback)
    {
        $key = self::PREFIX_BOOKING_DATA . $bookingId;
        
        return self::remember($key, $fetchCallback, self::DURATION_BOOKING_DATA);
    }

    /**
     * Cache query results
     *
     * @return mixed
     */
    public static function getQueryResult(string $queryHash, callable $queryCallback)
    {
        $key = self::PREFIX_QUERY_RESULT . $queryHash;
        
        return self::remember($key, $queryCallback, self::DURATION_QUERY_RESULT);
    }

    /**
     * Cache statistics
     *
     * @return mixed
     */
    public static function getStats(string $statsKey, callable $calculateCallback)
    {
        $key = self::PREFIX_STATS . $statsKey;
        
        return self::remember($key, $calculateCallback, self::DURATION_STATS);
    }

    /**
     * Invalidate related caches when data changes
     */
    public static function invalidateTrip(int $tripId): void
    {
        self::delete(self::PREFIX_TRIP_DATA . $tripId);
        self::clearByPrefix(self::PREFIX_QUERY_RESULT);
        self::clearByPrefix(self::PREFIX_STATS);
        
        Logger::info("Cache invalidated for trip", ['trip_id' => $tripId]);
    }

    /**
     * Invalidate booking-related caches
     */
    public static function invalidateBooking(int $bookingId): void
    {
        self::delete(self::PREFIX_BOOKING_DATA . $bookingId);
        self::clearByPrefix(self::PREFIX_STATS);
        
        Logger::info("Cache invalidated for booking", ['booking_id' => $bookingId]);
    }

    /**
     * Trip / activity / destination listing caches (admin + frontend grids).
     * Kept in sync with {@see \Yatra\Hooks\CacheHooks} expectations.
     */
    public static function invalidateListingCaches(): void
    {
        self::clearByPrefix(self::PREFIX_QUERY_RESULT);
        self::clearByPrefix('trip_listing_');
        self::clearByPrefix('activity_listing_');
        self::clearByPrefix('destination_listing_');
    }

    /**
     * Dashboard and report aggregate keys (beyond {@see PREFIX_STATS}).
     */
    public static function invalidateDashboardReportCaches(): void
    {
        self::clearByPrefix('dashboard_stats_');
        self::clearByPrefix('report_stats_');
    }

    /**
     * After a trip row write from {@see \Yatra\Repositories\TripRepository} (create / update / delete).
     * Matches {@see CacheHooks} trip handlers so hooks and repository stay aligned.
     */
    public static function invalidateAfterTripWrite(string $operation, int $tripId): void
    {
        $operation = strtolower($operation);
        if ($operation === 'create') {
            // Listings + stats (matches legacy TripService::create follow-up clears).
            self::invalidateListingCaches();
            self::clearByPrefix(self::PREFIX_STATS);

            return;
        }
        if ($tripId <= 0) {
            return;
        }
        self::invalidateTrip($tripId);
        self::invalidateListingCaches();
    }

    /**
     * After bulk UPDATEs on the trips table (cron: scheduled publish/archive, seasonal) that bypass
     * per-row {@see \Yatra\Repositories\TripRepository::afterWrite}.
     */
    public static function invalidateAfterBulkTripTableWrites(): void
    {
        self::invalidateListingCaches();
        self::clearByPrefix(self::PREFIX_STATS);
        self::invalidateDashboardReportCaches();
        self::clearByPrefix(self::PREFIX_TRIP_DATA);
    }

    /**
     * After booking mutations from {@see \Yatra\Repositories\BookingRepository}.
     * Aligns with {@see CacheHooks::onBookingUpdated} and related handlers.
     */
    public static function invalidateAfterBookingWrite(int $bookingId): void
    {
        self::invalidateBooking($bookingId);
        self::invalidateDashboardReportCaches();
    }

    /**
     * Pro Dynamic Pricing rule list/detail caches (see {@see KEY_PRO_PRICING_RULES} / {@see KEY_PRO_PRICING_RULE}).
     */
    public static function invalidateProDynamicPricingCaches(?int $ruleId = null): void
    {
        self::clearByPrefix(self::KEY_PRO_PRICING_RULES);
        self::clearByPrefix(self::KEY_PRO_ACTIVE_RULES);
        if ($ruleId !== null && $ruleId > 0) {
            self::delete(self::KEY_PRO_PRICING_RULE . '_' . $ruleId);
        } else {
            self::clearByPrefix(self::KEY_PRO_PRICING_RULE);
        }
    }

    /**
     * Get available cache backends
     */
    public static function getAvailableBackends(): array
    {
        if (self::$availableBackends === null) {
            self::$availableBackends = [];
            
            foreach (self::$backends as $backend) {
                if (self::isBackendAvailable($backend)) {
                    self::$availableBackends[] = $backend;
                }
            }
            
            // Always have memory as fallback
            if (!in_array('memory', self::$availableBackends)) {
                self::$availableBackends[] = 'memory';
            }
        }
        
        return self::$availableBackends;
    }

    /**
     * Check if cache backend is available
     */
    private static function isBackendAvailable(string $backend): bool
    {
        switch ($backend) {
            case 'transient':
                return function_exists('get_transient');
            case 'memory':
                return true;
            default:
                return false;
        }
    }

    /**
     * Get value from specific backend
     *
     * @return mixed
     */
    private static function getFromBackend(string $backend, string $key)
    {
        switch ($backend) {
            case 'transient':
                return self::getFromTransient($key);
            case 'memory':
                return self::$memoryCache[$key] ?? null;
            default:
                return null;
        }
    }

    /**
     * Set value to specific backend
     *
     * @param mixed $value
     */
    private static function setToBackend(string $backend, string $key, $value, int $duration): bool
    {
        switch ($backend) {
            case 'transient':
                return self::setToTransient($key, $value, $duration);
            case 'memory':
                return true; // Already handled above
            default:
                return false;
        }
    }

    /**
     * Delete from specific backend
     */
    private static function deleteFromBackend(string $backend, string $key): bool
    {
        switch ($backend) {
            case 'transient':
                return self::deleteFromTransient($key);
            case 'memory':
                return true; // Already handled above
            default:
                return false;
        }
    }

    /**
     * Clear prefix from specific backend
     */
    private static function clearPrefixFromBackend(string $backend, string $prefix): bool
    {
        switch ($backend) {
            case 'transient':
                return self::clearPrefixFromTransient($prefix);
            case 'memory':
                return true; // Already handled above
            default:
                return false;
        }
    }

    /**
     * WordPress Transient backend methods
     *
     * @return mixed
     */
    private static function getFromTransient(string $key)
    {
        if (!function_exists('get_transient')) return null;
        
        $value = get_transient($key);
        return $value !== false ? $value : null;
    }

    /**
     * @param mixed $value
     */
    private static function setToTransient(string $key, $value, int $duration): bool
    {
        if (!function_exists('set_transient')) return false;
        
        return set_transient($key, $value, $duration);
    }

    private static function deleteFromTransient(string $key): bool
    {
        if (!function_exists('delete_transient')) return false;
        
        return delete_transient($key);
    }

    private static function clearPrefixFromTransient(string $prefix): bool
    {
        global $wpdb;
        
        if (!$wpdb) return false;
        
        // Delete transient entries
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
            '_transient_' . $prefix . '%'
        ));
        
        // Delete timeout entries
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
            '_transient_timeout_' . $prefix . '%'
        ));
        
        return true;
    }

    
    
    /**
     * Get cache statistics
     */
    public static function getCacheStats(): array
    {
        $stats = [
            'memory_cache_size' => count(self::$memoryCache),
            'memory_usage' => 0,
            'available_backends' => self::getAvailableBackends()
        ];
        
        // Calculate memory usage safely
        if (function_exists('memory_get_usage')) {
            $stats['memory_usage'] = memory_get_usage(true);
        }
        
        return $stats;
    }

    /**
     * Clear all caches
     */
    public static function flush(): void
    {
        self::$memoryCache = [];
        
        foreach (self::getAvailableBackends() as $backend) {
            self::clearPrefixFromBackend($backend, 'yatra_');
        }
        
        Logger::info("All caches flushed");
    }
}
