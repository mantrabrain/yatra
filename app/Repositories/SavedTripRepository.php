<?php

declare(strict_types=1);

namespace Yatra\Repositories;

/**
 * Saved Trip Repository (Wishlist)
 * 
 * Handles all database operations for saved trips/wishlist using WordPress user meta.
 * 
 * @package Yatra\Repositories
 */
class SavedTripRepository extends BaseRepository
{
    /**
     * User meta key for saved trips
     */
    private const META_KEY = 'yatra_saved_trips';

    /**
     * Normalize stored meta to a list of trip IDs (handles legacy rows with trip_id keys).
     *
     * @param mixed $savedData
     * @return list<int>
     */
    private function normalizeSavedTripIdsFromMeta($savedData): array
    {
        if (!is_array($savedData)) {
            return [];
        }

        $ids = [];
        foreach ($savedData as $item) {
            if (is_array($item) && isset($item['trip_id'])) {
                $ids[] = (int) $item['trip_id'];
            } elseif (is_numeric($item)) {
                $ids[] = (int) $item;
            }
        }

        return array_values(array_unique($ids));
    }

    /**
     * Get full table name with prefix (not used, but required by BaseRepository)
     */
    protected function getTableName(): string
    {
        // Not used since we're using user meta, but required by BaseRepository
        return $this->wpdb->prefix . 'yatra_saved_trips';
    }

    /**
     * Check if trip is saved by user
     * 
     * @param int $userId User ID
     * @param int $tripId Trip ID
     * @return bool
     */
    public function isSaved(int $userId, int $tripId): bool
    {
        $raw = get_user_meta($userId, self::META_KEY, true);

        return in_array($tripId, $this->normalizeSavedTripIdsFromMeta($raw), true);
    }

    /**
     * Save trip for user
     * 
     * @param int $userId User ID
     * @param int $tripId Trip ID
     * @return bool
     */
    public function saveTrip(int $userId, int $tripId): bool
    {
        $tripId = (int) $tripId;
        if ($tripId <= 0) {
            return false;
        }

        $savedData = get_user_meta($userId, self::META_KEY, true);
        $savedTripIds = $this->normalizeSavedTripIdsFromMeta(is_array($savedData) ? $savedData : []);

        if (in_array($tripId, $savedTripIds, true)) {
            return true;
        }

        $tripRepository = new TripRepository();
        $trip = $tripRepository->find($tripId);

        if (!$trip) {
            return false;
        }

        $savedTripIds[] = $tripId;
        $savedTripIds = array_values(array_unique($savedTripIds));

        $updated = update_user_meta($userId, self::META_KEY, $savedTripIds);
        if ($updated !== false) {
            return true;
        }

        // update_user_meta() returns false when the value is unchanged; treat as success if the trip is stored.
        return $this->isSaved($userId, $tripId);
    }

    /**
     * Remove saved trip
     * 
     * @param int $userId User ID
     * @param int $tripId Trip ID
     * @return bool
     */
    public function removeTrip(int $userId, int $tripId): bool
    {
        $tripId = (int) $tripId;
        if ($tripId <= 0 || !$this->isSaved($userId, $tripId)) {
            return false;
        }

        $savedData = get_user_meta($userId, self::META_KEY, true);
        if (!is_array($savedData) || $savedData === []) {
            return false;
        }

        $before = $this->normalizeSavedTripIdsFromMeta($savedData);
        $savedTripIds = array_values(array_filter(
            $before,
            static fn (int $id): bool => $id !== $tripId
        ));

        if (count($savedTripIds) === count($before)) {
            return false;
        }

        $updated = update_user_meta($userId, self::META_KEY, $savedTripIds);
        if ($updated !== false) {
            return true;
        }

        return !$this->isSaved($userId, $tripId);
    }

    /**
     * Get user's saved trips (fetches fresh data from database)
     * 
     * @param int $userId User ID
     * @param int $limit Limit results (not used with meta, but kept for compatibility)
     * @return array
     */
    public function getUserSavedTrips(int $userId, int $limit = 100): array
    {
         // Get saved trip IDs from user meta
        $savedData = get_user_meta($userId, self::META_KEY, true);
        
        // Debug: log what we retrieved
        // Handle empty or invalid data
        if (empty($savedData)) {
            return [];
        }
        
        // WordPress unserializes automatically, but ensure we have an array
        if (!is_array($savedData)) {
            // If it's a string, it might be serialized (shouldn't happen, but handle it)
            if (is_string($savedData)) {
                $unserialized = @unserialize($savedData);
                if ($unserialized !== false && is_array($unserialized)) {
                    $savedData = $unserialized;
                } else {
                    return [];
                }
            } else {
                return [];
            }
        }
        
        // Handle both old format (array of trip objects) and new format (array of IDs)
        $savedTripIds = [];
        foreach ($savedData as $key => $item) {
            if (is_array($item) && isset($item['trip_id'])) {
                // Old format: array with trip_id key
                $savedTripIds[] = (int) $item['trip_id'];
                } elseif (is_int($item)) {
                // Direct integer
                $savedTripIds[] = $item;
                } elseif (is_numeric($item)) {
                // Numeric string
                $savedTripIds[] = (int) $item;
                } else {
                }
        }
        
        // Remove duplicates and re-index
        $savedTripIds = array_values(array_unique($savedTripIds));
        
        if (empty($savedTripIds)) {
            return [];
        }
         

       
        // Fetch fresh trip data from database for each saved trip ID
        $tripRepository = new TripRepository();
        $validTrips = [];
        
        foreach ($savedTripIds as $tripId) {
            if ($tripId <= 0) {
                continue;
            }
            
            $tripObj = $tripRepository->findWithRelations($tripId);
            
            // Include trip if it exists
            if (!$tripObj) {
                continue; // Trip not found, skip it
            }
            
            $tripStatus = $tripObj->status ?? '';
            // Only include published trips (accept both 'publish' and 'published')
            if (!in_array($tripStatus, ['publish', 'published'], true)) {
                continue; // Trip not published, skip it
            }
            
            // Calculate price using the SAME logic as single-trip.php
            $hasAvailability = !empty($tripObj->availability_dates) && is_array($tripObj->availability_dates) && count($tripObj->availability_dates) > 0;
            $pricingType = $tripObj->pricing_type ?? 'regular';
            $hasTravelerPricing = ($pricingType === 'traveler_based' && !empty($tripObj->price_types));
            
            // Centralized pricing via TripPricingService (single source of truth)
            $availDates = $hasAvailability && !empty($tripObj->availability_dates) 
                ? array_map(function($a) { return (object) $a; }, $tripObj->availability_dates) 
                : null;
            $resolvedPricing = \Yatra\Services\TripPricingService::resolveDisplayPricing($tripObj, $availDates);
            $originalPrice = $resolvedPricing['original_price'];
            $displayPrice = $resolvedPricing['current_price'];
            $hasDiscount = $resolvedPricing['has_discount'];
            $discountPercent = $resolvedPricing['discount_percentage'];
            $salePrice = (float) ($tripObj->sale_price ?? 0);
            $discountedPrice = (float) ($tripObj->discounted_price ?? 0);
            
            // Get destinations for location
            $destinations = $tripRepository->getDestinations($tripId);
            $location = !empty($destinations) ? $destinations[0]->destination_name ?? '' : '';
            
            // Get difficulty level
            $difficulty = $tripObj->difficulty_level ?? '';
            
            // Format duration using helper function
            $durationDays = !empty($tripObj->duration_days) ? (int) $tripObj->duration_days : null;
            $durationNights = !empty($tripObj->duration_nights) ? (int) $tripObj->duration_nights : null;
            $duration = '';
            if (!empty($durationDays)) {
                if (function_exists('yatra_format_duration')) {
                    $duration = yatra_format_duration($durationDays, $durationNights);
                } else {
                    /* translators: %d: number of days. */
                    $duration = sprintf(__('%d Days', 'yatra'), $durationDays);
                    if (!empty($durationNights)) {
                        /* translators: %d: number of nights. */
                        $duration .= ' / ' . sprintf(__('%d Nights', 'yatra'), $durationNights);
                    }
                }
            } else {
                $duration = __('Flexible', 'yatra');
            }
            
            // Get highlights (matching listing page logic)
            $highlights = [];
            
            // Group size highlights
            if (!empty($tripObj->max_travelers)) {
                if ($tripObj->max_travelers <= 2) {
                    $highlights[] = ['text' => __('Private Tour', 'yatra'), 'link' => null];
                } elseif ($tripObj->max_travelers <= 8) {
                    $highlights[] = ['text' => __('Small Group', 'yatra'), 'link' => null];
                }
            }
            
            // Category highlights (with link)
            $tripCategories = $tripRepository->getTripCategories($tripId);
            if (!empty($tripCategories) && is_array($tripCategories)) {
                $firstCategory = $tripCategories[0];
                if (!empty($firstCategory->name)) {
                    $catLink = !empty($firstCategory->slug) ? (function_exists('yatra_get_category_permalink') ? yatra_get_category_permalink($firstCategory) : null) : null;
                    $highlights[] = ['text' => $firstCategory->name, 'link' => $catLink];
                }
            }
            
            // Activity highlights (with link)
            $activities = $tripRepository->getActivities($tripId);
            if (!empty($activities) && is_array($activities)) {
                $firstActivity = $activities[0];
                if (!empty($firstActivity->name)) {
                    $actLink = !empty($firstActivity->slug) ? (function_exists('yatra_get_activity_permalink') ? yatra_get_activity_permalink($firstActivity) : null) : null;
                    $highlights[] = ['text' => $firstActivity->name, 'link' => $actLink];
                }
            }
            
            // Feature highlights
            if (!empty($tripObj->meals_included) && $tripObj->meals_included === 'all') {
                $highlights[] = ['text' => __('All Meals Included', 'yatra'), 'link' => null];
            }
            if (!empty($tripObj->guide_included) && $tripObj->guide_included) {
                $highlights[] = ['text' => __('Expert Guide', 'yatra'), 'link' => null];
            }
            
            // Limit to 3 highlights
            $highlights = array_slice($highlights, 0, 3);
            
            // Get rating and reviews
            $avgRating = (float) ($tripObj->avg_rating ?? $tripObj->average_rating ?? 0);
            $reviewsCount = (int) ($tripObj->reviews_count ?? $tripObj->review_count ?? 0);
            
            // If rating is 0, try to fetch from ReviewRepository
            if ($avgRating == 0) {
                if (class_exists('\Yatra\Repositories\ReviewRepository')) {
                    $reviewRepository = new \Yatra\Repositories\ReviewRepository();
                    $avgRating = $reviewRepository->getAverageRating($tripId);
                    $reviewsCount = $reviewRepository->getReviewCount($tripId);
                }
            }
            
            // Get featured image URL
            $imageUrl = '';
            if (!empty($tripObj->featured_image)) {
                $imageUrl = wp_get_attachment_url($tripObj->featured_image);
            }
            
            // Get permalink
            $permalink = '';
            if (function_exists('yatra_get_trip_permalink')) {
                $permalink = yatra_get_trip_permalink($tripObj);
            } else {
                $tripBase = \Yatra\Services\SettingsService::getTripBase();
                $permalink = home_url('/' . $tripBase . '/' . ($tripObj->slug ?? ''));
            }
            
            // Build trip data array
            $validTrips[] = [
                'id' => $tripId,
                'trip_id' => $tripId,
                'trip_title' => $tripObj->title ?? '',
                'trip_slug' => $tripObj->slug ?? '',
                'trip_image' => $imageUrl,
                'price' => $displayPrice,
                'original_price' => $originalPrice > 0 ? $originalPrice : null,
                'sale_price' => $salePrice > 0 ? $salePrice : null,
                'discounted_price' => $discountedPrice > 0 ? $discountedPrice : null,
                'discount_percent' => ($discountPercent > 0 && !$hasTravelerPricing) ? $discountPercent : null,
                'pricing_type' => $pricingType,
                'is_traveler_based' => $hasTravelerPricing,
                'currency' => $tripObj->currency ?? 'USD',
                'location' => $location,
                'duration' => $duration,
                'duration_days' => $durationDays,
                'difficulty' => $difficulty,
                'highlights' => $highlights,
                'rating' => $avgRating,
                'average_rating' => $avgRating,
                'reviews' => $reviewsCount, // Frontend expects 'reviews' field
                'reviews_count' => $reviewsCount,
                'review_count' => $reviewsCount,
                'permalink' => $permalink,
            ];
            // If trip not found or not published, skip it (don't show in saved trips)
        }
        
        // Don't update user meta here - only remove trips when user explicitly removes them
        // This prevents clearing saved trips if they're temporarily unpublished
        
        // Apply limit
        if ($limit > 0 && count($validTrips) > $limit) {
            $validTrips = array_slice($validTrips, 0, $limit);
        }
        
        return $validTrips;
    }

    /**
     * Get count of saved trips for user
     * 
     * @param int $userId User ID
     * @return int
     */
    public function getCount(int $userId): int
    {
        return count($this->getUserSavedTrips($userId));
    }
}

