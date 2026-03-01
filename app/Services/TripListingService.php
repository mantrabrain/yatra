<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\TripRepository;
use Yatra\Repositories\DestinationRepository;
use Yatra\Repositories\ActivityRepository;
use Yatra\Repositories\TripCategoryRepository;
use Yatra\Repositories\ReviewRepository;
use Yatra\Utils\Cache;
use Yatra\Utils\Logger;

/**
 * Trip Listing Service
 * 
 * Handles business logic for trip listing pages with filtering, pagination,
 * and data enrichment. Follows single responsibility principle by separating
 * business logic from data access and presentation layers.
 */
class TripListingService extends BaseService
{
    private TripRepository $tripRepository;
    private DestinationRepository $destinationRepository;
    private ActivityRepository $activityRepository;
    private TripCategoryRepository $categoryRepository;
    private ReviewRepository $reviewRepository;

    protected function getRepository(): TripRepository
    {
        return $this->tripRepository;
    }

    public function __construct(
        ?TripRepository $tripRepository = null,
        ?DestinationRepository $destinationRepository = null,
        ?ActivityRepository $activityRepository = null,
        ?TripCategoryRepository $categoryRepository = null,
        ?ReviewRepository $reviewRepository = null
    ) {
        $this->tripRepository = $tripRepository ?? new TripRepository();
        $this->destinationRepository = $destinationRepository ?? new DestinationRepository();
        $this->activityRepository = $activityRepository ?? new ActivityRepository();
        $this->categoryRepository = $categoryRepository ?? new TripCategoryRepository();
        $this->reviewRepository = $reviewRepository ?? new ReviewRepository();
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

        // Attribute filters
        if (isset($params['attributes']) && is_array($params['attributes'])) {
            $filters['attributes'] = [];
            foreach ($params['attributes'] as $attributeId => $attributeValue) {
                if (is_numeric($attributeId) && $attributeId > 0) {
                    // Sanitize attribute values based on type
                    if (is_array($attributeValue)) {
                        // For multi-select attributes
                        $filters['attributes'][$attributeId] = array_map('sanitize_text_field', 
                            array_filter($attributeValue, function($value) {
                                return !empty($value);
                            })
                        );
                    } else {
                        // For single value attributes
                        $sanitizedValue = sanitize_text_field($attributeValue);
                        if (!empty($sanitizedValue)) {
                            $filters['attributes'][$attributeId] = $sanitizedValue;
                        }
                    }
                }
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
        // Apply attribute filtering if present
        if (!empty($filters['attributes'])) {
            $attributeFilters = $filters['attributes'];
            unset($filters['attributes']); // Remove from regular filters
            
            // Apply attribute filtering to repository
            $filters = $this->tripRepository->filterByAttributes($filters, $attributeFilters);
        }
        
        // Get filtered trips from repository
        $tripResult = $this->tripRepository->findWithFilters($filters, $page, $perPage);
        
        // Load reviews for each trip (same approach as SingleTripController)
        $tripsWithReviews = [];
        foreach ($tripResult['trips'] as $trip) {
            // Load reviews for this trip
            $trip->reviews = $this->getReviewsForTrip((int) $trip->id);
            
            // Calculate rating stats (same as SingleTripController)
            $trip->average_rating = $this->calculateAverageRating($trip->reviews);
            $trip->review_count = count($trip->reviews);
            
            $tripsWithReviews[] = $trip;
        }
        
        // Get filter options for UI (cached separately)
        $filterOptions = $this->getFilterOptions();
        
        return [
            'trips' => $tripsWithReviews,
            'total' => $tripResult['total'],
            'pages' => $tripResult['pages'],
            'page' => $tripResult['page'],
            'per_page' => $tripResult['per_page'],
            'filters' => $filters,
            'destinations' => $filterOptions['destinations'],
            'activities' => $filterOptions['activities'],
            'attributes' => $filterOptions['attributes']
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
                    'activities' => $this->activityRepository->getPublished(),
                    'attributes' => $this->getAvailableAttributes()
                ];
            }, Cache::DURATION_DESTINATION_DATA); // Cache for 1 hour since destinations/activities don't change often
        } else {
            // Bypass cache and get fresh data
            Logger::debug("Cache disabled, getting fresh filter options");
            return [
                'destinations' => $this->destinationRepository->getPublished(),
                'activities' => $this->activityRepository->getPublished(),
                'attributes' => $this->getAvailableAttributes()
            ];
        }
    }

    /**
     * Get reviews for a specific trip (same as SingleTripController)
     *
     * @param int $trip_id Trip ID
     * @return array Reviews
     */
    private function getReviewsForTrip(int $trip_id): array
    {
        // Check if reviews table exists
        if (!$this->reviewRepository->tableExists()) {
            return [];
        }

        return $this->reviewRepository->findApprovedByTripId($trip_id);
    }

    /**
     * Calculate average rating from reviews (same as SingleTripController)
     *
     * @param array $reviews Reviews array
     * @return float Average rating
     */
    private function calculateAverageRating(array $reviews): float
    {
        if (empty($reviews)) {
            return 0.0;
        }

        $total = 0;
        foreach ($reviews as $review) {
            $total += (float) ($review->rating ?? 0);
        }

        return round($total / count($reviews), 1);
    }

    /**
     * Get available attributes for filtering
     */
    private function getAvailableAttributes(): array
    {
        $attributeRepository = new \Yatra\Repositories\AttributeRepository();
        return $attributeRepository->getAvailableAttributes();
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
        
        // Load reviews for each trip (same approach as getFilteredTrips)
        $tripsWithReviews = [];
        foreach ($result['trips'] as $trip) {
            // Load reviews for this trip
            $trip->reviews = $this->getReviewsForTrip((int) $trip->id);
            
            // Calculate rating stats (same as SingleTripController)
            $trip->average_rating = $this->calculateAverageRating($trip->reviews);
            $trip->review_count = count($trip->reviews);
            
            $tripsWithReviews[] = $trip;
        }
        
        return [
            'trips' => $tripsWithReviews,
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

    /**
     * Get filter data for trip listing templates
     * 
     * @return array All filter options with counts
     */
    public function getFilterData(): array
    {
        if ($this->isCacheEnabled()) {
            return Cache::remember('trip_listing_filter_data', function() {
                return $this->buildFilterData();
            }, 3600); // Cache for 1 hour
        }

        return $this->buildFilterData();
    }

    /**
     * Build filter data from repositories
     */
    private function buildFilterData(): array
    {
        return [
            'price_stats' => $this->tripRepository->getPriceStats(),
            'trip_types' => $this->getTripTypeOptions(),
            'difficulty_levels' => $this->getDifficultyLevelOptions(),
            'ratings' => $this->getRatingOptions(),
            'categories' => $this->getCategoryOptions(),
            'destinations' => $this->getDestinationOptions(),
            'activities' => $this->getActivityOptions(),
            'accommodations' => $this->tripRepository->getAccommodationTypes(),
            'included_services' => $this->tripRepository->getIncludedServices(),
            'durations' => $this->tripRepository->getDurationOptions(),
            'group_sizes' => $this->tripRepository->getGroupSizeOptions(),
            'physical_grades' => $this->tripRepository->getPhysicalGrades(),
            'special_offers' => $this->getSpecialOffers(),
            'age_restrictions' => $this->getAgeRestrictions(),
            'booking_options' => $this->getBookingOptions()
        ];
    }

    /**
     * Get trip type options with counts
     */
    private function getTripTypeOptions(): array
    {
        $tripTypes = $this->tripRepository->getTripTypes();
        $result = [];

        foreach ($tripTypes as $type) {
            $count = $this->tripRepository->countByTripType($type->value);
            $result[] = (object) [
                'value' => $type->value,
                'label' => $type->label,
                'count' => $count
            ];
        }

        return $result;
    }

    /**
     * Get difficulty level options with counts
     */
    private function getDifficultyLevelOptions(): array
    {
        $levels = $this->categoryRepository->getDifficultyLevels();
        $result = [];

        foreach ($levels as $level) {
            $count = $this->tripRepository->countByDifficultyLevel((int) $level->id);
            $result[] = (object) [
                'slug' => $level->slug,
                'name' => $level->name,
                'id' => (int) $level->id,
                'count' => $count
            ];
        }

        return $result;
    }

    /**
     * Get rating options with counts
     */
    private function getRatingOptions(): array
    {
        $result = [];
        
        // Check if reviews table exists
        if (!$this->reviewRepository->tableExists()) {
            return $result;
        }

        for ($rating = 5; $rating >= 1; $rating--) {
            $count = $this->tripRepository->countByMinRating($rating);
            $result[] = (object) [
                'rating' => $rating,
                'count' => $count,
                'label' => sprintf('%d %s', $rating, _n('Star', 'Stars', $rating, 'yatra'))
            ];
        }

        return $result;
    }

    /**
     * Get category options with counts
     */
    private function getCategoryOptions(): array
    {
        $categories = $this->categoryRepository->getPublishedCategories();
        $result = [];

        foreach ($categories as $category) {
            $count = $this->tripRepository->countByCategory($category->id);
            $result[] = (object) [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'count' => $count
            ];
        }

        return $result;
    }

    /**
     * Get destination options with counts
     */
    private function getDestinationOptions(): array
    {
        $destinations = $this->destinationRepository->getPublishedDestinations();
        $result = [];

        foreach ($destinations as $destination) {
            $count = $this->tripRepository->countByCategory($destination->id);
            $result[] = (object) [
                'id' => $destination->id,
                'name' => $destination->name,
                'slug' => $destination->slug,
                'count' => $count
            ];
        }

        return $result;
    }

    /**
     * Get activity options with counts
     */
    private function getActivityOptions(): array
    {
        $activities = $this->activityRepository->getPublishedActivities();
        $result = [];

        foreach ($activities as $activity) {
            $count = $this->tripRepository->countByCategory($activity->id);
            $result[] = (object) [
                'id' => $activity->id,
                'name' => $activity->name,
                'slug' => $activity->slug,
                'count' => $count
            ];
        }

        return $result;
    }

    /**
     * Get special offers with counts
     */
    private function getSpecialOffers(): array
    {
        $special_offers = [];
        
        // Check for discounted trips
        $discount_count = $this->tripRepository->countByDiscount();
        if ($discount_count > 0) {
            $special_offers[] = (object) ['value' => 'discount', 'label' => __('Discount Available', 'yatra'), 'count' => $discount_count];
        }
        
        // Check for early bird offers
        $early_bird_count = $this->tripRepository->countByEarlyBird();
        if ($early_bird_count > 0) {
            $special_offers[] = (object) ['value' => 'early-bird', 'label' => __('Early Bird Offer', 'yatra'), 'count' => $early_bird_count];
        }
        
        // Check for last minute deals
        $last_minute_count = $this->tripRepository->countByLastMinute();
        if ($last_minute_count > 0) {
            $special_offers[] = (object) ['value' => 'last-minute', 'label' => __('Last Minute Deal', 'yatra'), 'count' => $last_minute_count];
        }
        
        // Check for instant booking
        $instant_count = $this->tripRepository->countByInstantBooking();
        if ($instant_count > 0) {
            $special_offers[] = (object) ['value' => 'instant-booking', 'label' => __('Instant Booking', 'yatra'), 'count' => $instant_count];
        }
        
        // Check for flexible dates
        $flexible_count = $this->tripRepository->countByFlexibleDates();
        if ($flexible_count > 0) {
            $special_offers[] = (object) ['value' => 'flexible-dates', 'label' => __('Flexible Dates', 'yatra'), 'count' => $flexible_count];
        }
        
        // Check for deposit options
        $deposit_count = $this->tripRepository->countByDepositRequired();
        if ($deposit_count > 0) {
            $special_offers[] = (object) ['value' => 'deposit-available', 'label' => __('Pay Later Available', 'yatra'), 'count' => $deposit_count];
        }
        
        return $special_offers;
    }

    /**
     * Get age restrictions with counts
     */
    private function getAgeRestrictions(): array
    {
        $age_options = [];
        
        // Check for family friendly (no age restrictions or low minimum age)
        $family_count = $this->tripRepository->countByFamilyFriendly();
        if ($family_count > 0) {
            $age_options[] = (object) ['value' => 'family-friendly', 'label' => __('Family Friendly', 'yatra'), 'count' => $family_count];
        }
        
        // Check for kids suitable (age_min <= 12)
        $kids_count = $this->tripRepository->countByKidsFriendly();
        if ($kids_count > 0) {
            $age_options[] = (object) ['value' => 'kids-friendly', 'label' => __('Kids Friendly', 'yatra'), 'count' => $kids_count];
        }
        
        // Check for senior friendly (no upper age limit or high limit)
        $senior_count = $this->tripRepository->countBySeniorFriendly();
        if ($senior_count > 0) {
            $age_options[] = (object) ['value' => 'senior-friendly', 'label' => __('Senior Friendly', 'yatra'), 'count' => $senior_count];
        }
        
        // Check for adults only (age_min >= 18)
        $adults_count = $this->tripRepository->countByAdultsOnly();
        if ($adults_count > 0) {
            $age_options[] = (object) ['value' => 'adults-only', 'label' => __('Adults Only', 'yatra'), 'count' => $adults_count];
        }
        
        return $age_options;
    }

    /**
     * Get booking options with counts
     */
    private function getBookingOptions(): array
    {
        $booking_options = [];
        
        // Check for instant booking
        $instant_count = $this->tripRepository->countByInstantBooking();
        if ($instant_count > 0) {
            $booking_options[] = (object) ['value' => 'instant', 'label' => __('Instant Confirmation', 'yatra'), 'count' => $instant_count];
        }
        
        // Check for flexible dates
        $flexible_count = $this->tripRepository->countByFlexibleDates();
        if ($flexible_count > 0) {
            $booking_options[] = (object) ['value' => 'flexible', 'label' => __('Flexible Dates', 'yatra'), 'count' => $flexible_count];
        }
        
        // Check for deposit options
        $deposit_count = $this->tripRepository->countByDepositRequired();
        if ($deposit_count > 0) {
            $booking_options[] = (object) ['value' => 'pay-later', 'label' => __('Reserve Now, Pay Later', 'yatra'), 'count' => $deposit_count];
        }
        
        return $booking_options;
    }
}
