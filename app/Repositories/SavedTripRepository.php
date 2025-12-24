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
        $savedTripIds = get_user_meta($userId, self::META_KEY, true);
        
        if (!is_array($savedTripIds)) {
            return false;
        }
        
        return in_array($tripId, $savedTripIds);
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
        // Get saved data from user meta
        $savedData = get_user_meta($userId, self::META_KEY, true);
        if (!is_array($savedData)) {
            $savedData = [];
        }
        
        // Convert to array of IDs (handle both old and new formats)
        $savedTripIds = [];
        foreach ($savedData as $item) {
            if (is_array($item) && isset($item['trip_id'])) {
                // Old format: array with trip_id key
                $savedTripIds[] = (int) $item['trip_id'];
            } elseif (is_numeric($item) || is_int($item)) {
                // New format: just trip ID
                $savedTripIds[] = (int) $item;
            }
        }
        
        // Check if already saved
        if (in_array($tripId, $savedTripIds)) {
            return true; // Already saved
        }
        
        // Verify trip exists
        $tripRepository = new TripRepository();
        $trip = $tripRepository->find($tripId);
        
        if (!$trip) {
            return false;
        }
        
        // Add trip ID to saved trips (NOT user ID - ensure we're using $tripId, not $userId)
        $savedTripIds[] = (int) $tripId;
        
        // Remove duplicates and re-index
        $savedTripIds = array_values(array_unique($savedTripIds));
        
        // Save only trip IDs to user meta (always use new format)
        return update_user_meta($userId, self::META_KEY, $savedTripIds) !== false;
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
        // Get saved data from user meta
        $savedData = get_user_meta($userId, self::META_KEY, true);
        if (!is_array($savedData) || empty($savedData)) {
            return false;
        }
        
        // Handle both old format (array of trip objects) and new format (array of IDs)
        $savedTripIds = [];
        foreach ($savedData as $item) {
            if (is_array($item) && isset($item['trip_id'])) {
                // Old format: array with trip_id key
                $itemId = (int) $item['trip_id'];
                if ($itemId !== $tripId) {
                    $savedTripIds[] = $itemId;
                }
            } elseif (is_numeric($item)) {
                // New format: just trip ID
                $itemId = (int) $item;
                if ($itemId !== $tripId) {
                    $savedTripIds[] = $itemId;
                }
            }
        }
        
        // Save updated trip IDs to user meta (always save as new format - just IDs)
        return update_user_meta($userId, self::META_KEY, $savedTripIds) !== false;
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
        error_log("Yatra SavedTripRepository::getUserSavedTrips - userId=$userId, savedData type: " . gettype($savedData));
        error_log("Yatra SavedTripRepository::getUserSavedTrips - savedData content: " . json_encode($savedData));
        
        // Handle empty or invalid data
        if (empty($savedData)) {
            error_log("Yatra SavedTripRepository::getUserSavedTrips - savedData is empty");
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
                    error_log("Yatra SavedTripRepository::getUserSavedTrips - savedData is string but not serialized: " . $savedData);
                    return [];
                }
            } else {
                error_log("Yatra SavedTripRepository::getUserSavedTrips - savedData is not array or string: " . gettype($savedData));
                return [];
            }
        }
        
        // Handle both old format (array of trip objects) and new format (array of IDs)
        $savedTripIds = [];
        foreach ($savedData as $key => $item) {
            error_log("Yatra SavedTripRepository::getUserSavedTrips - Processing item at key $key: " . gettype($item) . " = " . json_encode($item));
            
            if (is_array($item) && isset($item['trip_id'])) {
                // Old format: array with trip_id key
                $savedTripIds[] = (int) $item['trip_id'];
                error_log("Yatra SavedTripRepository::getUserSavedTrips - Extracted trip_id from array: " . (int) $item['trip_id']);
            } elseif (is_int($item)) {
                // Direct integer
                $savedTripIds[] = $item;
                error_log("Yatra SavedTripRepository::getUserSavedTrips - Direct integer: $item");
            } elseif (is_numeric($item)) {
                // Numeric string
                $savedTripIds[] = (int) $item;
                error_log("Yatra SavedTripRepository::getUserSavedTrips - Numeric string converted: " . (int) $item);
            } else {
                error_log("Yatra SavedTripRepository::getUserSavedTrips - Skipping item (not array with trip_id, not int, not numeric): " . gettype($item));
            }
        }
        
        // Remove duplicates and re-index
        $savedTripIds = array_values(array_unique($savedTripIds));
        
        error_log("Yatra SavedTripRepository::getUserSavedTrips - extracted trip IDs: " . json_encode($savedTripIds));
        
        if (empty($savedTripIds)) {
            error_log("Yatra SavedTripRepository::getUserSavedTrips - no valid trip IDs found");
            return [];
        }
         

       
        // Fetch fresh trip data from database for each saved trip ID
        $tripRepository = new TripRepository();
        $validTrips = [];
        
        error_log("Yatra SavedTripRepository::getUserSavedTrips - Processing " . count($savedTripIds) . " saved trip IDs");
        
        foreach ($savedTripIds as $tripId) {
            if ($tripId <= 0) {
                error_log("Yatra SavedTripRepository::getUserSavedTrips - Skipping invalid trip ID: $tripId");
                continue;
            }
            
            error_log("Yatra SavedTripRepository::getUserSavedTrips - Fetching trip ID: $tripId");
            $tripObj = $tripRepository->findWithRelations($tripId);
            
            // Include trip if it exists
            if (!$tripObj) {
                error_log("Yatra SavedTripRepository::getUserSavedTrips - Trip ID $tripId not found in database");
                continue; // Trip not found, skip it
            }
            
            $tripStatus = $tripObj->status ?? '';
            error_log("Yatra SavedTripRepository::getUserSavedTrips - Trip ID $tripId status: $tripStatus");
            
            // Only include published trips (accept both 'publish' and 'published')
            if ($tripStatus !== 'publish') {
                error_log("Yatra SavedTripRepository::getUserSavedTrips - Trip ID $tripId is not published, skipping");
                continue; // Trip not published, skip it
            }
            
            // Calculate price using the SAME logic as single-trip.php
            $hasAvailability = !empty($tripObj->availability_dates) && is_array($tripObj->availability_dates) && count($tripObj->availability_dates) > 0;
            $pricingType = $tripObj->pricing_type ?? 'regular';
            $hasTravelerPricing = ($pricingType === 'traveler_based' && !empty($tripObj->price_types));
            
            // Get prices from trip object - check multiple possible fields
            $originalPrice = (float) ($tripObj->original_price ?? $tripObj->regular_price ?? $tripObj->price ?? 0);
            $salePrice = (float) ($tripObj->sale_price ?? $tripObj->discounted_price ?? 0);
            $discountedPrice = (float) ($tripObj->discounted_price ?? 0);
            $displayPrice = 0;
            $hasDiscount = false;
            $discountPercent = 0;
            
            error_log("Yatra SavedTripRepository::getUserSavedTrips - Trip ID $tripId pricing: originalPrice=$originalPrice, salePrice=$salePrice, hasAvailability=" . ($hasAvailability ? 'yes' : 'no') . ", hasTravelerPricing=" . ($hasTravelerPricing ? 'yes' : 'no'));
            
            // Calculate base price (matching single-trip.php logic)
            if ($hasAvailability) {
                // Get the lowest price from availability dates
                $minPrice = PHP_FLOAT_MAX;
                foreach ($tripObj->availability_dates as $avail) {
                    $avail = (object) $avail;
                    $availPrice = (float) ($avail->effective_price ?? $avail->sale_price ?? $avail->discounted_price ?? $avail->original_price ?? 0);
                    if ($availPrice > 0 && $availPrice < $minPrice) {
                        $minPrice = $availPrice;
                    }
                }
                $displayPrice = ($minPrice < PHP_FLOAT_MAX) ? $minPrice : ($salePrice > 0 ? $salePrice : $originalPrice);
                error_log("Yatra SavedTripRepository::getUserSavedTrips - Trip ID $tripId availability pricing: minPrice=$minPrice, displayPrice=$displayPrice");
            } elseif ($hasTravelerPricing) {
                // Get default or first traveler category price
                $defaultPriceType = null;
                foreach ($tripObj->price_types as $pt) {
                    $pt = (object) $pt;
                    if (!empty($pt->is_default)) {
                        $defaultPriceType = $pt;
                        break;
                    }
                }
                if (!$defaultPriceType && !empty($tripObj->price_types)) {
                    $defaultPriceType = (object) $tripObj->price_types[0];
                }
                if ($defaultPriceType) {
                    $displayPrice = (float) ($defaultPriceType->effective_price ?? $defaultPriceType->sale_price ?? $defaultPriceType->discounted_price ?? $defaultPriceType->original_price ?? 0);
                } else {
                    $displayPrice = $salePrice > 0 ? $salePrice : $originalPrice;
                }
                error_log("Yatra SavedTripRepository::getUserSavedTrips - Trip ID $tripId traveler pricing: displayPrice=$displayPrice");
            } else {
                // Regular pricing - use sale_price if available and less than original, otherwise original_price
                if ($salePrice > 0 && $salePrice < $originalPrice && $originalPrice > 0) {
                    $displayPrice = $salePrice;
                    $hasDiscount = true;
                    $discountPercent = ($originalPrice > 0) ? round((($originalPrice - $salePrice) / $originalPrice) * 100) : 0;
                } else {
                    $displayPrice = $originalPrice > 0 ? $originalPrice : 0;
                }
                error_log("Yatra SavedTripRepository::getUserSavedTrips - Trip ID $tripId regular pricing: displayPrice=$displayPrice, hasDiscount=" . ($hasDiscount ? 'yes' : 'no'));
            }
            
            error_log("Yatra SavedTripRepository::getUserSavedTrips - Trip ID $tripId final displayPrice=$displayPrice");
            
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
                    $duration = sprintf(__('%d Days', 'yatra'), $durationDays);
                    if (!empty($durationNights)) {
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
        
        error_log("Yatra SavedTripRepository::getUserSavedTrips - Returning " . count($validTrips) . " valid trips");
        
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

