<?php

declare(strict_types=1);

namespace Yatra\Hooks;

use Yatra\Services\CacheService;
use Yatra\Utils\Cache;
use Yatra\Utils\Logger;

/**
 * Cache Invalidation Hooks
 * 
 * Automatically invalidate caches when data changes
 */
class CacheHooks
{
    /**
     * Initialize cache hooks
     */
    public static function init(): void
    {
        // Trip-related hooks
        add_action('yatra_trip_created', [self::class, 'onTripCreated'], 10, 1);
        add_action('yatra_trip_updated', [self::class, 'onTripUpdated'], 10, 1);
        add_action('yatra_trip_deleted', [self::class, 'onTripDeleted'], 10, 1);

        // Booking-related hooks
        add_action('yatra_booking_created', [self::class, 'onBookingCreated'], 10, 1);
        add_action('yatra_booking_updated', [self::class, 'onBookingUpdated'], 10, 1);
        add_action('yatra_booking_deleted', [self::class, 'onBookingDeleted'], 10, 1);
        add_action('yatra_booking_status_changed', [self::class, 'onBookingStatusChanged'], 10, 2);

        // Customer-related hooks
        add_action('yatra_customer_created', [self::class, 'onCustomerCreated'], 10, 1);
        add_action('yatra_customer_updated', [self::class, 'onCustomerUpdated'], 10, 1);
        add_action('yatra_customer_deleted', [self::class, 'onCustomerDeleted'], 10, 1);

        // Activity-related hooks
        add_action('yatra_activity_created', [self::class, 'onActivityCreated'], 10, 1);
        add_action('yatra_activity_updated', [self::class, 'onActivityUpdated'], 10, 1);
        add_action('yatra_activity_deleted', [self::class, 'onActivityDeleted'], 10, 1);

        // Destination-related hooks
        add_action('yatra_destination_created', [self::class, 'onDestinationCreated'], 10, 1);
        add_action('yatra_destination_updated', [self::class, 'onDestinationUpdated'], 10, 1);
        add_action('yatra_destination_deleted', [self::class, 'onDestinationDeleted'], 10, 1);

        // Payment-related hooks
        add_action('yatra_payment_created', [self::class, 'onPaymentCreated'], 10, 1);
        add_action('yatra_payment_updated', [self::class, 'onPaymentUpdated'], 10, 1);

        // General cache management hooks
        add_action('yatra_cache_warm_up', [self::class, 'warmUpCache']);
        add_action('yatra_cache_clear_all', [self::class, 'clearAllCaches']);

        // WordPress hooks for related data changes
        add_action('wp_insert_post', [self::class, 'onPostChange'], 10, 2);
        add_action('wp_update_post', [self::class, 'onPostChange'], 10, 2);
        add_action('wp_delete_post', [self::class, 'onPostDeleted'], 10, 1);

        // Schedule cache cleanup
        if (!wp_next_scheduled('yatra_cache_cleanup')) {
            wp_schedule_event(time(), 'daily', 'yatra_cache_cleanup');
        }
        add_action('yatra_cache_cleanup', [self::class, 'cleanupExpiredCache']);
    }

    /**
     * Trip event handlers
     */
    public static function onTripCreated(int $tripId): void
    {
        self::invalidateListingCaches();
        Logger::info("Cache invalidated for trip creation", ['trip_id' => $tripId]);
    }

    public static function onTripUpdated(int $tripId): void
    {
        CacheService::invalidateEntity('trip', $tripId);
        self::invalidateListingCaches();
        Logger::info("Cache invalidated for trip update", ['trip_id' => $tripId]);
    }

    public static function onTripDeleted(int $tripId): void
    {
        CacheService::invalidateEntity('trip', $tripId);
        self::invalidateListingCaches();
        Logger::info("Cache invalidated for trip deletion", ['trip_id' => $tripId]);
    }

    /**
     * Booking event handlers
     */
    public static function onBookingCreated(int $bookingId): void
    {
        Cache::invalidateBooking($bookingId);
        self::invalidateStatsCaches();
        Logger::info("Cache invalidated for booking creation", ['booking_id' => $bookingId]);
    }

    public static function onBookingUpdated(int $bookingId): void
    {
        Cache::invalidateBooking($bookingId);
        self::invalidateStatsCaches();
        Logger::info("Cache invalidated for booking update", ['booking_id' => $bookingId]);
    }

    public static function onBookingDeleted(int $bookingId): void
    {
        Cache::invalidateBooking($bookingId);
        self::invalidateStatsCaches();
        Logger::info("Cache invalidated for booking deletion", ['booking_id' => $bookingId]);
    }

    public static function onBookingStatusChanged(int $bookingId, string $newStatus): void
    {
        Cache::invalidateBooking($bookingId);
        self::invalidateStatsCaches();
        Logger::info("Cache invalidated for booking status change", [
            'booking_id' => $bookingId,
            'new_status' => $newStatus
        ]);
    }

    /**
     * Customer event handlers
     */
    public static function onCustomerCreated(int $customerId): void
    {
        self::invalidateStatsCaches();
        Logger::info("Cache invalidated for customer creation", ['customer_id' => $customerId]);
    }

    public static function onCustomerUpdated(int $customerId): void
    {
        CacheService::invalidateEntity('customer', $customerId);
        Logger::info("Cache invalidated for customer update", ['customer_id' => $customerId]);
    }

    public static function onCustomerDeleted(int $customerId): void
    {
        CacheService::invalidateEntity('customer', $customerId);
        self::invalidateStatsCaches();
        Logger::info("Cache invalidated for customer deletion", ['customer_id' => $customerId]);
    }

    /**
     * Activity event handlers
     */
    public static function onActivityCreated(int $activityId): void
    {
        self::invalidateListingCaches();
        Logger::info("Cache invalidated for activity creation", ['activity_id' => $activityId]);
    }

    public static function onActivityUpdated(int $activityId): void
    {
        CacheService::invalidateEntity('activity', $activityId);
        self::invalidateListingCaches();
        Logger::info("Cache invalidated for activity update", ['activity_id' => $activityId]);
    }

    public static function onActivityDeleted(int $activityId): void
    {
        CacheService::invalidateEntity('activity', $activityId);
        self::invalidateListingCaches();
        Logger::info("Cache invalidated for activity deletion", ['activity_id' => $activityId]);
    }

    /**
     * Destination event handlers
     */
    public static function onDestinationCreated(int $destinationId): void
    {
        self::invalidateListingCaches();
        Logger::info("Cache invalidated for destination creation", ['destination_id' => $destinationId]);
    }

    public static function onDestinationUpdated(int $destinationId): void
    {
        CacheService::invalidateEntity('destination', $destinationId);
        self::invalidateListingCaches();
        Logger::info("Cache invalidated for destination update", ['destination_id' => $destinationId]);
    }

    public static function onDestinationDeleted(int $destinationId): void
    {
        CacheService::invalidateEntity('destination', $destinationId);
        self::invalidateListingCaches();
        Logger::info("Cache invalidated for destination deletion", ['destination_id' => $destinationId]);
    }

    /**
     * Payment event handlers
     */
    public static function onPaymentCreated(int $paymentId): void
    {
        self::invalidateStatsCaches();
        Logger::info("Cache invalidated for payment creation", ['payment_id' => $paymentId]);
    }

    public static function onPaymentUpdated(int $paymentId): void
    {
        self::invalidateStatsCaches();
        Logger::info("Cache invalidated for payment update", ['payment_id' => $paymentId]);
    }

    /**
     * WordPress post change handler
     */
    public static function onPostChange(int $postId, \WP_Post $post): void
    {
        // Only handle Yatra-related post types
        if (in_array($post->post_type, ['yatra_trip', 'yatra_booking', 'yatra_customer'])) {
            self::invalidateListingCaches();
            self::invalidateStatsCaches();
            Logger::debug("Cache invalidated for WordPress post change", [
                'post_id' => $postId,
                'post_type' => $post->post_type
            ]);
        }
    }

    /**
     * WordPress post deletion handler
     */
    public static function onPostDeleted(int $postId): void
    {
        // Clear all caches as we don't know the post type
        self::invalidateListingCaches();
        self::invalidateStatsCaches();
        Logger::debug("Cache invalidated for WordPress post deletion", ['post_id' => $postId]);
    }

    /**
     * Cache management handlers
     */
    public static function warmUpCache(): void
    {
        CacheService::warmUpCache();
        Logger::info("Cache warm-up completed");
    }

    public static function clearAllCaches(): void
    {
        Cache::flush();
        Logger::info("All caches cleared via hook");
    }

    /**
     * Clean up expired cache entries
     */
    public static function cleanupExpiredCache(): void
    {
        // This would be implemented based on the cache backend
        // For now, we'll just log the cleanup attempt
        Logger::info("Cache cleanup scheduled task executed");
        
        // Clear old log files
        Logger::cleanup();
    }

    /**
     * Helper methods for cache invalidation
     */
    private static function invalidateListingCaches(): void
    {
        Cache::clearByPrefix(Cache::PREFIX_QUERY_RESULT);
        Cache::clearByPrefix('trip_listing_');
        Cache::clearByPrefix('activity_listing_');
        Cache::clearByPrefix('destination_listing_');
    }

    private static function invalidateStatsCaches(): void
    {
        Cache::clearByPrefix(Cache::PREFIX_STATS);
        Cache::clearByPrefix('dashboard_stats_');
        Cache::clearByPrefix('report_stats_');
    }

    /**
     * Manual cache invalidation for admin use
     */
    public static function invalidateAll(): void
    {
        Cache::flush();
        Logger::info("Manual cache invalidation triggered");
    }

    /**
     * Get cache status for admin dashboard
     */
    public static function getCacheStatus(): array
    {
        return [
            'enabled' => true,
            'backends' => Cache::getAvailableBackends(),
            'stats' => Cache::getCacheStats(),
            'performance' => CacheService::getPerformanceMetrics(),
        ];
    }
}
