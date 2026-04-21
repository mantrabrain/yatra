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
        
        // Extract pagination parameters (default per page = WordPress Reading > "Blog pages show at most")
        $page = max(1, (int) ($requestParams['page'] ?? 1));
        $defaultPerPage = \yatra_get_posts_per_page();
        $maxCap = max((int) apply_filters('yatra_trip_listing_max_per_page', 100), $defaultPerPage);
        $perPage = (int) ($requestParams['per_page'] ?? $defaultPerPage);
        $perPage = max(1, min($maxCap, $perPage));
        
        // Create cache key for this specific request
        $cacheKey = $this->generateCacheKey($filters, $page, $perPage);
        
        Logger::debug("Trip listing request started", [
            'filters' => $filters,
            'page' => $page,
            'per_page' => $perPage,
            'cache_key' => substr($cacheKey, 0, 50) . '...'
        ]);
        
        $result = $this->tripRepository->withQueryCache(
            $cacheKey,
            function () use ($filters, $page, $perPage) {
                return $this->buildTripListingResult($filters, $page, $perPage);
            },
            Cache::DURATION_QUERY_RESULT
        );
        
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

        // Keyword search (trip archive GET param `s`, same as shortcode input name)
        if (!empty($params['s']) && is_string($params['s'])) {
            $q = sanitize_text_field($params['s']);
            if (strlen($q) > 0) {
                $filters['search'] = $q;
                $filters['s'] = $q;
            }
        }

        // Sidebar / URL: classification IDs (OR within each group)
        foreach (['categories' => 'category_ids', 'destinations' => 'destination_ids', 'activities' => 'activity_ids'] as $paramKey => $filterKey) {
            if (empty($params[$paramKey])) {
                continue;
            }
            $raw = $params[$paramKey];
            $ids = is_array($raw) ? $raw : [$raw];
            $ids = array_values(array_filter(array_map('intval', $ids), static fn (int $id): bool => $id > 0));
            if ($ids !== []) {
                $filters[$filterKey] = $ids;
            }
        }

        // Destination filter (slug) — used when no destination_ids from checkboxes
        if (empty($filters['destination_ids']) && !empty($params['destination'])) {
            $filters['destination'] = sanitize_text_field((string) $params['destination']);
        }

        // Activity filter (slug)
        if (empty($filters['activity_ids']) && !empty($params['activity'])) {
            $filters['activity'] = sanitize_text_field((string) $params['activity']);
        }

        // Category / trip type (slug from search bar or legacy trip_category param)
        if (empty($filters['category_ids'])) {
            $cat = $params['trip_category'] ?? $params['category'] ?? '';
            if (!empty($cat) && is_string($cat)) {
                $filters['trip_category'] = sanitize_text_field($cat);
            }
        }

        // Price range filters
        if (isset($params['price_min']) && is_numeric($params['price_min']) && (float) $params['price_min'] > 0) {
            $filters['price_min'] = (float) $params['price_min'];
        }

        if (isset($params['price_max']) && is_numeric($params['price_max']) && (float) $params['price_max'] > 0) {
            $filters['price_max'] = (float) $params['price_max'];
        }

        // Duration filters (explicit min/max take precedence over preset `duration`)
        $hasDurMin = isset($params['duration_min']) && is_numeric($params['duration_min']) && (int) $params['duration_min'] > 0;
        $hasDurMax = isset($params['duration_max']) && is_numeric($params['duration_max']) && (int) $params['duration_max'] > 0;
        if ($hasDurMin) {
            $filters['duration_min'] = (int) $params['duration_min'];
        }
        if ($hasDurMax) {
            $filters['duration_max'] = (int) $params['duration_max'];
        }
        if (!$hasDurMin && !$hasDurMax && !empty($params['duration']) && is_string($params['duration'])) {
            $preset = sanitize_text_field($params['duration']);
            // Horizontal search bar: numeric range e.g. 2-14
            if (preg_match('/^(\d+)-(\d+)$/', $preset, $m)) {
                $filters['duration_min'] = max(1, (int) $m[1]);
                $filters['duration_max'] = max((int) $m[1], (int) $m[2]);
                $filters['duration'] = $preset;
            } elseif ($preset === '1-3') {
                $filters['duration_min'] = 1;
                $filters['duration_max'] = 3;
                $filters['duration'] = $preset;
            } elseif ($preset === '4-7') {
                $filters['duration_min'] = 4;
                $filters['duration_max'] = 7;
                $filters['duration'] = $preset;
            } elseif ($preset === '8-14') {
                $filters['duration_min'] = 8;
                $filters['duration_max'] = 14;
                $filters['duration'] = $preset;
            } elseif ($preset === '15+') {
                $filters['duration_min'] = 15;
                $filters['duration_max'] = 3650;
                $filters['duration'] = $preset;
            } elseif ($preset !== '') {
                $filters['duration'] = $preset;
            }
        }

        // Horizontal search "budget" presets (min-max or min+) → price range when explicit prices not set
        if (
            empty($filters['price_min']) && empty($filters['price_max'])
            && !empty($params['budget']) && is_string($params['budget'])
        ) {
            $b = sanitize_text_field($params['budget']);
            if (preg_match('/^(\d+)-(\d+)$/', $b, $m)) {
                $filters['price_min'] = (float) $m[1];
                $filters['price_max'] = (float) $m[2];
            } elseif (preg_match('/^(\d+)\+$/', $b, $m)) {
                $filters['price_min'] = (float) $m[1];
            }
        }

        // Rating: star checkboxes use minimum selected threshold
        $ratingCandidates = [];
        if (!empty($params['rating']) && is_array($params['rating'])) {
            foreach ($params['rating'] as $r) {
                if (is_numeric($r) && (int) $r > 0) {
                    $ratingCandidates[] = (int) $r;
                }
            }
        }
        if ($ratingCandidates !== []) {
            $filters['rating_min'] = (float) min($ratingCandidates);
            $filters['rating'] = $ratingCandidates;
        } elseif (isset($params['rating_min']) && is_numeric($params['rating_min']) && (float) $params['rating_min'] > 0) {
            $filters['rating_min'] = (float) $params['rating_min'];
        }

        // Difficulty filter - sidebar uses IDs; search shortcode uses slug
        if (isset($params['difficulty'])) {
            if (is_array($params['difficulty'])) {
                $diff = array_values(array_filter(array_map('intval', $params['difficulty']), static fn (int $id): bool => $id > 0));
                if ($diff !== []) {
                    $filters['difficulty'] = $diff;
                }
            } elseif (is_numeric($params['difficulty']) && (int) $params['difficulty'] > 0) {
                $filters['difficulty'] = [(int) $params['difficulty']];
            } elseif (is_string($params['difficulty']) && trim($params['difficulty']) !== '') {
                $slug = sanitize_text_field($params['difficulty']);
                $diffRow = (new \Yatra\Repositories\DifficultyLevelRepository())->findBySlug($slug);
                if ($diffRow && isset($diffRow->id)) {
                    $filters['difficulty'] = [(int) $diffRow->id];
                }
            }
        }

        // Trip duration type (DB column trip_type: single_day | multi_day | flexible)
        if (!empty($params['trip_type']) && is_string($params['trip_type'])) {
            $tt = sanitize_text_field($params['trip_type']);
            if (in_array($tt, ['single_day', 'multi_day', 'flexible'], true)) {
                $filters['trip_type'] = $tt;
            }
        }

        $filters['special_offers'] = $this->sanitizeStringList($params['special_offers'] ?? []);
        $filters['booking_options'] = $this->sanitizeStringList($params['booking_options'] ?? []);
        $filters['age_suitability'] = $this->sanitizeStringList($params['age_suitability'] ?? []);

        if (!empty($params['accommodation']) && is_array($params['accommodation'])) {
            $filters['accommodation'] = array_values(array_filter(array_map('sanitize_text_field', $params['accommodation'])));
        }

        if (!empty($params['included_services']) && is_array($params['included_services'])) {
            $filters['included_services'] = array_values(array_filter(array_map('sanitize_text_field', $params['included_services'])));
        }

        // Attribute filters
        if (isset($params['attributes']) && is_array($params['attributes'])) {
            $filters['attributes'] = [];
            foreach ($params['attributes'] as $attributeId => $attributeValue) {
                if (!is_numeric($attributeId) || (int) $attributeId <= 0) {
                    continue;
                }
                $aid = (int) $attributeId;
                if (is_array($attributeValue)) {
                    if (isset($attributeValue['min']) || isset($attributeValue['max'])) {
                        $range = [];
                        if (isset($attributeValue['min']) && is_numeric($attributeValue['min'])) {
                            $range['min'] = (float) $attributeValue['min'];
                        }
                        if (isset($attributeValue['max']) && is_numeric($attributeValue['max'])) {
                            $range['max'] = (float) $attributeValue['max'];
                        }
                        if ($range !== []) {
                            $filters['attributes'][$aid] = $range;
                        }
                    } else {
                        $vals = array_map('sanitize_text_field', array_filter($attributeValue, static fn ($v) => $v !== null && $v !== ''));
                        if ($vals !== []) {
                            $filters['attributes'][$aid] = $vals;
                        }
                    }
                } else {
                    $sanitizedValue = sanitize_text_field((string) $attributeValue);
                    if ($sanitizedValue !== '') {
                        $filters['attributes'][$aid] = $sanitizedValue;
                    }
                }
            }
        }

        // Sort parameter
        if (!empty($params['sort'])) {
            $allowedSorts = ['most_popular', 'price_low', 'price_high', 'rating_high', 'duration_short', 'duration_long'];
            $sort = sanitize_text_field((string) $params['sort']);
            if (in_array($sort, $allowedSorts, true)) {
                $filters['sort'] = $sort;
            }
        }

        // Template / URL aliases (sidebar uses offers[], booking[], age[], services[])
        if (!empty($filters['special_offers'])) {
            $filters['offers'] = $filters['special_offers'];
        }
        if (!empty($filters['booking_options'])) {
            $filters['booking'] = $filters['booking_options'];
        }
        if (!empty($filters['age_suitability'])) {
            $filters['age'] = $filters['age_suitability'];
        }
        if (!empty($filters['included_services'])) {
            $filters['services'] = $filters['included_services'];
        }
        if (!empty($filters['trip_category'])) {
            $filters['category'] = $filters['trip_category'];
        }

        return $filters;
    }

    /**
     * @param mixed $raw
     * @return list<string>
     */
    private function sanitizeStringList($raw): array
    {
        if ($raw === null || $raw === '') {
            return [];
        }
        $items = is_array($raw) ? $raw : [$raw];
        $out = [];
        foreach ($items as $item) {
            $s = sanitize_text_field((string) $item);
            if ($s !== '') {
                $out[] = $s;
            }
        }
        return array_values(array_unique($out));
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
            'filters' => $this->stripInternalFilterKeys($filters),
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
        return $this->tripRepository->withQueryCache(
            'trip_listing_filter_options',
            function () {
                return [
                    'destinations' => $this->destinationRepository->getPublished(),
                    'activities' => $this->activityRepository->getPublished(),
                    'attributes' => $this->getAvailableAttributes(),
                ];
            },
            Cache::DURATION_DESTINATION_DATA
        );
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
    private function stripInternalFilterKeys(array $filters): array
    {
        unset(
            $filters['attribute_filters'],
            $filters['search'],
            $filters['category_ids'],
            $filters['destination_ids'],
            $filters['activity_ids']
        );

        return $filters;
    }

    public function getTripStatistics(): array
    {
        return $this->tripRepository->withQueryCache(
            'trip_listing_statistics',
            function () {
                return $this->calculateTripStatistics();
            },
            Cache::DURATION_STATS
        );
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
     * @param int|null $limit Number of trips to return; null uses WordPress posts per page.
     * @return array
     */
    public function getTripsByTaxonomy(string $taxonomyType, string $slug, ?int $limit = null): array
    {
        $limit = $limit ?? \yatra_get_posts_per_page();
        $limit = max(1, $limit);

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
        if (!empty($params['s'])) {
            return true;
        }
        $meaningfulParams = [
            'destination', 'activity', 'trip_category', 'category', 'price_min', 'price_max',
            'duration_min', 'duration_max', 'duration', 'rating_min', 'difficulty', 'sort',
            'categories', 'destinations', 'activities', 'trip_type', 'rating',
            'special_offers', 'booking_options', 'age_suitability', 'offers', 'booking', 'age',
        ];

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
        return $this->tripRepository->withQueryCache(
            'trip_listing_filter_data_v2',
            function () {
                return $this->buildFilterData();
            },
            3600
        );
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
            $count = $this->tripRepository->countByCategory((int) $category->id);
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
        $destinations = $this->destinationRepository->getPublished();
        $result = [];

        foreach ($destinations as $destination) {
            $count = $this->tripRepository->countByDestination((int) $destination->id);
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
        $activities = $this->activityRepository->getPublished();
        $result = [];

        foreach ($activities as $activity) {
            $count = $this->tripRepository->countByActivity((int) $activity->id);
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

    /**
     * Get price statistics for trips
     * 
     * @return object|null Price stats with min and max prices
     */
    public function getPriceStats(): ?object
    {
        return $this->tripRepository->getPriceStats();
    }

    /**
     * Dynamic budget tier values for the horizontal search bar (maps to ?budget= via sanitizeFilters).
     *
     * @return list<object{value: string, label: string}>
     */
    public function getSearchBudgetPresets(): array
    {
        $stats = $this->tripRepository->getPriceStats();
        $min = $stats ? (int) floor((float) $stats->min_price) : 0;
        $max = $stats ? (int) ceil((float) $stats->max_price) : 0;
        if ($max <= $min) {
            $max = $min + 1000;
        }
        $bands = 5;
        $step = (int) max(1, ceil(($max - $min) / $bands));
        $out = [];
        for ($i = 0; $i < $bands; $i++) {
            $lo = $min + $i * $step;
            if ($lo > $max) {
                break;
            }
            $hi = ($i === $bands - 1) ? $max : min($max, $lo + $step - 1);
            if ($hi < $lo) {
                $hi = $lo;
            }
            $sym = yatra_get_currency_symbol(get_option('yatra_currency', 'USD'));
            $out[] = (object) [
                'value' => $lo . '-' . $hi,
                'label' => trim($sym . number_format_i18n($lo) . ' – ' . $sym . number_format_i18n($hi)),
            ];
        }

        return $out;
    }
}
