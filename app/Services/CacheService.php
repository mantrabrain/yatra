<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Utils\Cache;
use Yatra\Utils\Logger;

/**
 * Cache Service
 * 
 * High-level caching operations for business entities
 */
class CacheService
{
    /**
     * Cache trip with relationships
     */
    public static function cacheTrip(int $tripId, \stdClass $tripData): void
    {
        Cache::set(
            Cache::PREFIX_TRIP_DATA . $tripId,
            $tripData,
            Cache::DURATION_TRIP_DATA
        );
        
        Logger::debug("Trip cached", ['trip_id' => $tripId]);
    }

    /**
     * Get cached trip
     */
    public static function getCachedTrip(int $tripId): ?\stdClass
    {
        return Cache::get(Cache::PREFIX_TRIP_DATA . $tripId);
    }

    /**
     * Cache booking data
     */
    public static function cacheBooking(int $bookingId, \stdClass $bookingData): void
    {
        Cache::set(
            Cache::PREFIX_BOOKING_DATA . $bookingId,
            $bookingData,
            Cache::DURATION_BOOKING_DATA
        );
        
        Logger::debug("Booking cached", ['booking_id' => $bookingId]);
    }

    /**
     * Get cached booking
     */
    public static function getCachedBooking(int $bookingId): ?\stdClass
    {
        return Cache::get(Cache::PREFIX_BOOKING_DATA . $bookingId);
    }

    /**
     * Cache customer data
     */
    public static function cacheCustomer(int $customerId, \stdClass $customerData): void
    {
        Cache::set(
            Cache::PREFIX_CUSTOMER_DATA . $customerId,
            $customerData,
            Cache::DURATION_CUSTOMER_DATA
        );
        
        Logger::debug("Customer cached", ['customer_id' => $customerId]);
    }

    /**
     * Get cached customer
     */
    public static function getCachedCustomer(int $customerId): ?\stdClass
    {
        return Cache::get(Cache::PREFIX_CUSTOMER_DATA . $customerId);
    }

    /**
     * Cache activity data
     */
    public static function cacheActivity(int $activityId, \stdClass $activityData): void
    {
        Cache::set(
            Cache::PREFIX_ACTIVITY_DATA . $activityId,
            $activityData,
            Cache::DURATION_ACTIVITY_DATA
        );
        
        Logger::debug("Activity cached", ['activity_id' => $activityId]);
    }

    /**
     * Get cached activity
     */
    public static function getCachedActivity(int $activityId): ?\stdClass
    {
        return Cache::get(Cache::PREFIX_ACTIVITY_DATA . $activityId);
    }

    /**
     * Cache destination data
     */
    public static function cacheDestination(int $destinationId, \stdClass $destinationData): void
    {
        Cache::set(
            Cache::PREFIX_DESTINATION_DATA . $destinationId,
            $destinationData,
            Cache::DURATION_DESTINATION_DATA
        );
        
        Logger::debug("Destination cached", ['destination_id' => $destinationId]);
    }

    /**
     * Get cached destination
     */
    public static function getCachedDestination(int $destinationId): ?\stdClass
    {
        return Cache::get(Cache::PREFIX_DESTINATION_DATA . $destinationId);
    }

    /**
     * Invalidate entity cache when data changes
     */
    public static function invalidateEntity(string $entityType, int $entityId): void
    {
        // Handle both entity types and service class names
        $normalizedType = self::normalizeEntityType($entityType);
        
        $prefix = match ($normalizedType) {
            'trip' => Cache::PREFIX_TRIP_DATA,
            'booking' => Cache::PREFIX_BOOKING_DATA,
            'customer' => Cache::PREFIX_CUSTOMER_DATA,
            'activity' => Cache::PREFIX_ACTIVITY_DATA,
            'destination' => Cache::PREFIX_DESTINATION_DATA,
            'difficulty' => Cache::PREFIX_QUERY_RESULT, // For difficulty levels, use query cache
            default => null,
        };

        if ($prefix) {
            if ($normalizedType === 'difficulty') {
                // For difficulty and other non-entity types, clear by prefix
                Cache::clearByPrefix($prefix);
            } else {
                // For entities, clear specific entity cache
                Cache::delete($prefix . $entityId);
            }
            
            // Also clear related query caches
            Cache::clearByPrefix(Cache::PREFIX_QUERY_RESULT);
            Cache::clearByPrefix(Cache::PREFIX_STATS);
            
            Logger::info("Entity cache invalidated", [
                'entity_type' => $entityType,
                'normalized_type' => $normalizedType,
                'entity_id' => $entityId
            ]);
        } else {
            // If no specific prefix found, just clear query caches
            Cache::clearByPrefix(Cache::PREFIX_QUERY_RESULT);
            Cache::clearByPrefix(Cache::PREFIX_STATS);
            
            Logger::debug("Generic cache invalidation", [
                'entity_type' => $entityType,
                'entity_id' => $entityId
            ]);
        }
    }

    /**
     * Normalize entity type from service class names
     */
    private static function normalizeEntityType(string $entityType): string
    {
        // Convert service class names to entity types
        $entityType = strtolower($entityType);
        
        // Handle service class patterns
        if (str_contains($entityType, 'trip')) {
            return 'trip';
        }
        if (str_contains($entityType, 'booking')) {
            return 'booking';
        }
        if (str_contains($entityType, 'customer')) {
            return 'customer';
        }
        if (str_contains($entityType, 'activity')) {
            return 'activity';
        }
        if (str_contains($entityType, 'destination')) {
            return 'destination';
        }
        if (str_contains($entityType, 'difficulty')) {
            return 'difficulty';
        }
        
        // Return as-is if no pattern matches
        return $entityType;
    }

    /**
     * Warm up cache for frequently accessed entities
     */
    public static function warmUpCache(): void
    {
        Logger::info("Starting cache warm-up");
        
        // Warm up popular trips
        $tripRepository = new \Yatra\Repositories\TripRepository();
        $popularTrips = $tripRepository->getPopularTrips(20);

        foreach ($popularTrips as $trip) {
            // This would trigger cache population when the trip is next accessed
            Logger::debug("Marked trip for cache warm-up", ['trip_id' => $trip->id]);
        }

        // Warm up recent bookings
        $bookingRepository = new \Yatra\Repositories\BookingRepository();
        $recentBookings = $bookingRepository->getRecentBookings(7, 50);

        foreach ($recentBookings as $booking) {
            Logger::debug("Marked booking for cache warm-up", ['booking_id' => $booking->id]);
        }

        Logger::info("Cache warm-up completed", [
            'trips_marked' => count($popularTrips),
            'bookings_marked' => count($recentBookings)
        ]);
    }

    /**
     * Get cache performance metrics
     */
    public static function getPerformanceMetrics(): array
    {
        return [
            'cache_stats' => Cache::getCacheStats(),
            'memory_usage' => [
                'current' => memory_get_usage(true),
                'peak' => memory_get_peak_usage(true),
                'formatted_current' => self::formatBytes(memory_get_usage(true)),
                'formatted_peak' => self::formatBytes(memory_get_peak_usage(true)),
            ],
            'cache_backends' => Cache::getAvailableBackends(),
        ];
    }

    /**
     * Format bytes for human reading
     */
    private static function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= (1 << (10 * $pow));
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }

    /**
     * Remember pattern - get from cache or execute callback and cache result
     */
    public static function remember(string $key, callable $callback, int $duration = null): mixed
    {
        // Try to get from cache first
        $cached = Cache::get($key);
        if ($cached !== null) {
            Logger::debug("Cache hit", ['key' => $key]);
            return $cached;
        }

        // Execute callback to get fresh data
        $startTime = microtime(true);
        $result = $callback();
        $executionTime = microtime(true) - $startTime;

        // Cache the result if it's not null
        if ($result !== null) {
            $cacheDuration = $duration ?? Cache::DURATION_QUERY_RESULT;
            Cache::set($key, $result, $cacheDuration);
            
            Logger::debug("Cache miss - data cached", [
                'key' => $key,
                'execution_time' => round($executionTime * 1000, 2) . 'ms',
                'duration' => $cacheDuration
            ]);
        } else {
            Logger::debug("Cache miss - null result not cached", [
                'key' => $key,
                'execution_time' => round($executionTime * 1000, 2) . 'ms'
            ]);
        }

        return $result;
    }

    /**
     * Clear cache by prefix - delegates to Cache utility
     */
    public static function clearByPrefix(string $prefix): void
    {
        Cache::clearByPrefix($prefix);
        Logger::debug("Cache cleared by prefix", ['prefix' => $prefix]);
    }

    /**
     * Clear all entity caches
     */
    public static function clearAllEntityCaches(): void
    {
        $prefixes = [
            Cache::PREFIX_TRIP_DATA,
            Cache::PREFIX_BOOKING_DATA,
            Cache::PREFIX_CUSTOMER_DATA,
            Cache::PREFIX_ACTIVITY_DATA,
            Cache::PREFIX_DESTINATION_DATA,
        ];

        foreach ($prefixes as $prefix) {
            Cache::clearByPrefix($prefix);
        }

        Logger::info("All entity caches cleared");
    }
}
