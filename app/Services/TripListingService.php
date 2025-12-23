<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\TripRepository;
use Yatra\Repositories\DestinationRepository;
use Yatra\Repositories\ActivityRepository;
use Yatra\Utils\Cache;
use Yatra\Utils\Logger;

/**
 * Trip Listing Service
 * 
 * Handles business logic for trip listing pages with filtering, pagination,
 * and data enrichment. Follows single responsibility principle by separating
 * business logic from data access and presentation layers.
 */
class TripListingService
{
    private TripRepository $tripRepository;
    private DestinationRepository $destinationRepository;
    private ActivityRepository $activityRepository;

    public function __construct(
        ?TripRepository $tripRepository = null,
        ?DestinationRepository $destinationRepository = null,
        ?ActivityRepository $activityRepository = null
    ) {
        $this->tripRepository = $tripRepository ?? new TripRepository();
        $this->destinationRepository = $destinationRepository ?? new DestinationRepository();
        $this->activityRepository = $activityRepository ?? new ActivityRepository();
    }

    /**
     * Get filtered and paginated trip listings with metadata and caching
     *
     * @param array $requestParams Raw request parameters
     * @return array Formatted trip listing data
     */
    public function getFilteredTrips(array $requestParams = []): array
    {
        $startTime = microtime(true);
        
        // Sanitize and validate input parameters
        $filters = $this->sanitizeFilters($requestParams);
        
        // Extract pagination parameters
        $page = max(1, (int) ($requestParams['page'] ?? 1));
        $perPage = max(1, min(50, (int) ($requestParams['per_page'] ?? 9))); // Cap at 50 for performance
        
        // Create cache key for this specific request
        $cacheKey = $this->generateCacheKey($filters, $page, $perPage);
        
        Logger::debug("Trip listing request started", [
            'filters' => $filters,
            'page' => $page,
            'per_page' => $perPage,
            'cache_key' => substr($cacheKey, 0, 50) . '...'
        ]);
        
        // Check if cache is enabled before using it
        if ($this->isCacheEnabled()) {
            // Try to get cached result
            $result = Cache::remember($cacheKey, function() use ($filters, $page, $perPage) {
                return $this->buildTripListingResult($filters, $page, $perPage);
            }, Cache::DURATION_QUERY_RESULT);
        } else {
            // Bypass cache and get fresh data
            Logger::debug("Cache disabled, getting fresh trip listing", ['filters' => $filters, 'page' => $page]);
            $result = $this->buildTripListingResult($filters, $page, $perPage);
        }
        
        $executionTime = microtime(true) - $startTime;
        Logger::debug("Trip listing request completed", [
            'execution_time' => $executionTime,
            'total_trips' => $result['total'],
            'returned_trips' => count($result['trips'])
        ]);
        
        return $result;
    }

    /**
     * Sanitize and validate filter parameters
     *
     * @param array $params Raw parameters
     * @return array Sanitized filters
     */
    private function sanitizeFilters(array $params): array
    {
        $filters = [];

        // Destination filter
        if (!empty($params['destination'])) {
            $filters['destination'] = sanitize_text_field($params['destination']);
        }

        // Activity filter
        if (!empty($params['activity'])) {
            $filters['activity'] = sanitize_text_field($params['activity']);
        }

        // Price range filters
        if (isset($params['price_min']) && is_numeric($params['price_min']) && $params['price_min'] > 0) {
            $filters['price_min'] = (float) $params['price_min'];
        }

        if (isset($params['price_max']) && is_numeric($params['price_max']) && $params['price_max'] > 0) {
            $filters['price_max'] = (float) $params['price_max'];
        }

        // Duration filters
        if (isset($params['duration_min']) && is_numeric($params['duration_min']) && $params['duration_min'] > 0) {
            $filters['duration_min'] = (int) $params['duration_min'];
        }

        if (isset($params['duration_max']) && is_numeric($params['duration_max']) && $params['duration_max'] > 0) {
            $filters['duration_max'] = (int) $params['duration_max'];
        }

        // Rating filter
        if (isset($params['rating_min']) && is_numeric($params['rating_min']) && $params['rating_min'] > 0) {
            $filters['rating_min'] = (float) $params['rating_min'];
        }

        // Difficulty filter - handle array of IDs
        if (isset($params['difficulty'])) {
            if (is_array($params['difficulty'])) {
                $filters['difficulty'] = array_map('intval', array_filter($params['difficulty'], function($id) {
                    return is_numeric($id) && $id > 0;
                }));
            } elseif (is_numeric($params['difficulty']) && $params['difficulty'] > 0) {
                $filters['difficulty'] = [(int) $params['difficulty']];
            }
        }

        // Sort parameter
        if (!empty($params['sort'])) {
            $allowedSorts = ['most_popular', 'price_low', 'price_high', 'rating_high', 'duration_short', 'duration_long'];
            $sort = sanitize_text_field($params['sort']);
            if (in_array($sort, $allowedSorts)) {
                $filters['sort'] = $sort;
            }
        }

        return $filters;
    }

    /**
     * Generate cache key for trip listing request
     */
    private function generateCacheKey(array $filters, int $page, int $perPage): string
    {
        $keyData = [
            'filters' => $filters,
            'page' => $page,
            'per_page' => $perPage
        ];
        
        return 'trip_listing_' . md5(serialize($keyData));
    }

    /**
     * Build trip listing result
     */
    private function buildTripListingResult(array $filters, int $page, int $perPage): array
    {
        // Get filtered trips from repository
        $tripResult = $this->tripRepository->findWithFilters($filters, $page, $perPage);
        
        // Get filter options for UI (cached separately)
        $filterOptions = $this->getFilterOptions();
        
        return [
            'trips' => $tripResult['trips'],
            'total' => $tripResult['total'],
            'pages' => $tripResult['pages'],
            'page' => $tripResult['page'],
            'per_page' => $tripResult['per_page'],
            'filters' => $filters,
            'destinations' => $filterOptions['destinations'],
            'activities' => $filterOptions['activities']
        ];
    }

    /**
     * Get filter options for UI
     */
    private function getFilterOptions(): array
    {
        if ($this->isCacheEnabled()) {
            return Cache::remember('trip_listing_filter_options', function() {
                return [
                    'destinations' => $this->destinationRepository->getPublished(),
                    'activities' => $this->activityRepository->getPublished()
                ];
            }, Cache::DURATION_DESTINATION_DATA); // Cache for 1 hour since destinations/activities don't change often
        } else {
            // Bypass cache and get fresh data
            Logger::debug("Cache disabled, getting fresh filter options");
            return [
                'destinations' => $this->destinationRepository->getPublished(),
                'activities' => $this->activityRepository->getPublished()
            ];
        }
    }

    /**
     * Get trip statistics for analytics
     */
    public function getTripStatistics(): array
    {
        if ($this->isCacheEnabled()) {
            return Cache::remember('trip_listing_statistics', function() {
                return $this->calculateTripStatistics();
            }, Cache::DURATION_STATS);
        } else {
            // Bypass cache and get fresh data
            Logger::debug("Cache disabled, calculating fresh trip statistics");
            return $this->calculateTripStatistics();
        }
    }

    /**
     * Calculate trip statistics
     */
    private function calculateTripStatistics(): array
    {
        $startTime = microtime(true);
        
        $stats = [
            'total_published_trips' => $this->tripRepository->count(['status' => 'publish']),
            'total_destinations' => $this->destinationRepository->count(['status' => 'publish']),
            'total_activities' => $this->activityRepository->count(['status' => 'publish']),
            'price_range' => $this->tripRepository->getPriceRange(),
            'duration_range' => $this->tripRepository->getDurationRange()
        ];
        
        $executionTime = microtime(true) - $startTime;
        Logger::debug("Trip statistics calculated", [
            'execution_time' => $executionTime,
            'stats' => $stats
        ]);
        
        return $stats;
    }

    /**
     * Clear trip listing caches
     */
    public function clearCache(): void
    {
        Cache::clearByPrefix('trip_listing_');
        Logger::info("Trip listing caches cleared");
    }

    /**
     * Get trips for taxonomy context (destination/activity pages)
     *
     * @param string $taxonomyType 'destination' or 'activity'
     * @param string $slug Taxonomy slug
     * @param int $limit Number of trips to return
     * @return array
     */
    public function getTripsByTaxonomy(string $taxonomyType, string $slug, int $limit = 10): array
    {
        $filters = [$taxonomyType => $slug];
        
        $result = $this->tripRepository->findWithFilters($filters, 1, $limit);
        
        return [
            'trips' => $result['trips'],
            'total' => $result['total']
        ];
    }

    /**
     * Validate and process search parameters
     *
     * @param array $params Search parameters
     * @return bool True if valid search request
     */
    public function isValidSearchRequest(array $params): bool
    {
        // Check if any meaningful filters are applied
        $meaningfulParams = ['destination', 'activity', 'price_min', 'price_max', 'duration_min', 'duration_max', 'rating_min', 'difficulty', 'sort'];
        
        foreach ($meaningfulParams as $param) {
            if (!empty($params[$param])) {
                return true;
            }
        }

        return false;
    }
}
