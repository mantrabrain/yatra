<?php

namespace Yatra\Migration;

use Yatra\Migration\MigrationProgress;
use Yatra\Utils\Logger;

class TourDateMigration extends BaseMigration
{
    public function __construct(MigrationProgress $service)
    {
        parent::__construct($service);
    }

    public function run(): array
    {
        global $wpdb;

        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        $oldTable = $wpdb->prefix . 'yatra_tour_dates';

        if ($wpdb->get_var("SHOW TABLES LIKE '{$oldTable}'") !== $oldTable) {
            Logger::info("No old yatra_tour_dates table found", ['source' => 'migration']);
            return [
                'migrated' => 0,
                'skipped' => 0,
                'failed' => 0,
            ];
        }

        $oldTourDates = $wpdb->get_results("SELECT * FROM {$oldTable}");
        $total = count($oldTourDates);
        
        Logger::info("Found {$total} tour dates to migrate", [
            'source' => 'migration',
            'count' => $total
        ]);

        error_log("[Yatra Migration] ========================================");
        error_log("[Yatra Migration] Starting Tour Dates Migration");
        error_log("[Yatra Migration] Found {$total} tour dates in old system");
        error_log("[Yatra Migration] Force migration: " . ($this->isForceMigration() ? 'YES' : 'NO'));
        error_log("[Yatra Migration] ========================================");

        foreach ($oldTourDates as $oldDate) {
            try {
                error_log("[Yatra Migration] Processing tour date ID {$oldDate->id} for tour {$oldDate->tour_id}");
                
                // Check if already migrated (only for regular migration)
                $existsInAvailability = null;
                
                if (!$this->isForceMigration()) {
                    $existsInAvailability = $wpdb->get_var($wpdb->prepare(
                        "SELECT id FROM {$wpdb->prefix}yatra_trip_availability_dates 
                         WHERE trip_id IN (
                             SELECT meta_value FROM {$wpdb->prefix}postmeta 
                             WHERE post_id = %d AND meta_key = '_migrated_to_trip_id'
                         )
                         AND departure_date = %s",
                        $oldDate->tour_id,
                        $oldDate->start_date
                    ));

                    if ($existsInAvailability) {
                        error_log("[Yatra Migration] Tour date {$oldDate->id} already migrated, skipping...");
                        $skipped++;
                        $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
                        continue;
                    }
                } else {
                    error_log("[Yatra Migration] Force mode: Will insert new tour date records");
                }

                $newTripId = $this->getMigratedTripId($oldDate->tour_id);

                if (!$newTripId) {
                    $failed++;
                    Logger::debug("Skipping tour date - trip not migrated yet", [
                        'source' => 'migration',
                        'old_tour_id' => $oldDate->tour_id,
                        'tour_date_id' => $oldDate->id
                    ]);
                    $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                // Parse pricing if available
                $pricing = !empty($oldDate->pricing) ? maybe_unserialize($oldDate->pricing) : null;
                $originalPrice = null;
                $discountedPrice = null;
                $pricingType = 'regular';
                $priceTypes = null;
                
                error_log("[Yatra Migration] Raw pricing data for tour date {$oldDate->id}: " . print_r($pricing, true));
                
                if (is_array($pricing)) {
                    // Check various formats for traveler-based pricing
                    $hasTravelerPricing = false;
                    
                    // Format 1: pricing_per = 'person' with price_per_person array
                    if (isset($pricing['pricing_per']) && $pricing['pricing_per'] === 'person' && isset($pricing['price_per_person'])) {
                        $pricingType = 'traveler_based';
                        $priceTypesArray = [];
                        $pricePerPerson = is_array($pricing['price_per_person']) ? $pricing['price_per_person'] : [];
                        
                        foreach ($pricePerPerson as $categoryId => $categoryPricing) {
                            if (is_array($categoryPricing)) {
                                $origPrice = floatval($categoryPricing['regular_price'] ?? $categoryPricing['price'] ?? 0);
                                $discPrice = floatval($categoryPricing['sale_price'] ?? $categoryPricing['discounted_price'] ?? 0);
                                
                                // Only add if has valid price
                                if ($origPrice > 0) {
                                    $priceTypesArray[] = [
                                        'category_id' => $categoryId,
                                        'original_price' => $origPrice,
                                        'discounted_price' => ($discPrice > 0 && $discPrice < $origPrice) ? $discPrice : null,
                                    ];
                                }
                            }
                        }
                        
                        if (!empty($priceTypesArray)) {
                            $priceTypes = json_encode($priceTypesArray);
                            $originalPrice = $priceTypesArray[0]['original_price'] ?? null;
                            $discountedPrice = $priceTypesArray[0]['discounted_price'] ?? null;
                            $hasTravelerPricing = true;
                            error_log("[Yatra Migration] Traveler-based pricing (format 1) with " . count($priceTypesArray) . " categories");
                        }
                    }
                    
                    // Format 2: Direct traveler_categories array
                    if (!$hasTravelerPricing && isset($pricing['traveler_categories']) && is_array($pricing['traveler_categories'])) {
                        $pricingType = 'traveler_based';
                        $priceTypesArray = [];
                        
                        foreach ($pricing['traveler_categories'] as $category) {
                            if (is_array($category)) {
                                $origPrice = floatval($category['regular_price'] ?? $category['price'] ?? 0);
                                $discPrice = floatval($category['sale_price'] ?? $category['discounted_price'] ?? 0);
                                
                                if ($origPrice > 0) {
                                    $priceTypesArray[] = [
                                        'category_id' => $category['category_id'] ?? $category['id'] ?? 0,
                                        'original_price' => $origPrice,
                                        'discounted_price' => ($discPrice > 0 && $discPrice < $origPrice) ? $discPrice : null,
                                    ];
                                }
                            }
                        }
                        
                        if (!empty($priceTypesArray)) {
                            $priceTypes = json_encode($priceTypesArray);
                            $originalPrice = $priceTypesArray[0]['original_price'] ?? null;
                            $discountedPrice = $priceTypesArray[0]['discounted_price'] ?? null;
                            $hasTravelerPricing = true;
                            error_log("[Yatra Migration] Traveler-based pricing (format 2) with " . count($priceTypesArray) . " categories");
                        }
                    }
                    
                    // Format 3: Regular pricing (single price for all)
                    if (!$hasTravelerPricing) {
                        $pricingType = 'regular';
                        $originalPrice = floatval($pricing['regular_price'] ?? $pricing['price'] ?? 0);
                        $discountedPrice = floatval($pricing['sale_price'] ?? $pricing['discounted_price'] ?? 0);
                        
                        // If discounted price is 0 or >= original, set to null
                        if ($discountedPrice <= 0 || ($originalPrice > 0 && $discountedPrice >= $originalPrice)) {
                            $discountedPrice = null;
                        }
                        
                        error_log("[Yatra Migration] Regular pricing - original: {$originalPrice}, discounted: {$discountedPrice}");
                    }
                }
                
                error_log("[Yatra Migration] Parsed pricing - Type: {$pricingType}, Original: {$originalPrice}, Discounted: {$discountedPrice}");
                if ($priceTypes) {
                    error_log("[Yatra Migration] Price types JSON: {$priceTypes}");
                }

                // Migrate to yatra_trip_availability_dates
                if (!$existsInAvailability || $this->isForceMigration()) {
                    $maxTravelers = intval($oldDate->max_travellers ?? 0);
                    if ($maxTravelers <= 0) {
                        $maxTravelers = 10; // Default
                    }
                    
                    // Determine status based on active flag
                    $availabilityStatus = 'available';
                    if (!$oldDate->active) {
                        $availabilityStatus = 'cancelled';
                    }

                    $availabilityData = [
                        'trip_id' => $newTripId,
                        'departure_date' => $oldDate->start_date,
                        'return_date' => $oldDate->end_date,
                        'seats_total' => $maxTravelers,
                        'seats_available' => $maxTravelers,
                        'seats_reserved' => 0,
                        'seats_waitlist' => 0,
                        'pricing_type' => $pricingType,
                        'original_price' => $originalPrice,
                        'discounted_price' => $discountedPrice,
                        'price_types' => $priceTypes,
                        'status' => $availabilityStatus,
                        'special_notes' => $oldDate->note_to_customer ?? null,
                        'created_at' => $oldDate->created_at ?? current_time('mysql'),
                        'updated_at' => $oldDate->updated_at ?? current_time('mysql'),
                    ];
                    
                    error_log("[Yatra Migration] Inserting availability with pricing_type={$pricingType}, price_types=" . ($priceTypes ? 'YES' : 'NO'));

                    $wpdb->insert(
                        $wpdb->prefix . 'yatra_trip_availability_dates',
                        $availabilityData
                    );
                    
                    $insertedId = $wpdb->insert_id;
                    
                    if (!$insertedId) {
                        $failed++;
                        error_log("[Yatra Migration] Failed to insert availability for tour date {$oldDate->id}: " . $wpdb->last_error);
                        Logger::error("Failed to insert availability date", [
                            'source' => 'migration',
                            'tour_date_id' => $oldDate->id,
                            'error' => $wpdb->last_error
                        ]);
                        $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
                        continue;
                    }
                    error_log("[Yatra Migration] Inserted availability ID {$insertedId} for tour date {$oldDate->id} (departure: {$oldDate->start_date}, return: {$oldDate->end_date}, pricing: {$pricingType})");
                }

                $migrated++;
                error_log("[Yatra Migration] Successfully migrated tour date {$oldDate->id} to trip {$newTripId}");
                Logger::info("Migrated tour date to availability", [
                    'source' => 'migration',
                    'old_tour_date_id' => $oldDate->id,
                    'new_trip_id' => $newTripId,
                    'departure_date' => $oldDate->start_date,
                    'return_date' => $oldDate->end_date
                ]);
                
                $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
            } catch (\Exception $e) {
                $failed++;
                error_log("[Yatra Migration] Exception migrating tour date {$oldDate->id}: " . $e->getMessage());
                Logger::error("Tour date migration exception", [
                    'source' => 'migration',
                    'tour_date_id' => $oldDate->id,
                    'error' => $e->getMessage()
                ]);
                $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        }

        error_log("[Yatra Migration] ========================================");
        error_log("[Yatra Migration] Tour Dates Migration Complete");
        error_log("[Yatra Migration] Migrated: {$migrated}, Skipped: {$skipped}, Failed: {$failed}");
        error_log("[Yatra Migration] ========================================");

        return [
            'migrated' => $migrated,
            'skipped' => $skipped,
            'failed' => $failed,
        ];
    }
}
