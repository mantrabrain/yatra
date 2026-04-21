<?php

namespace Yatra\Migration;

use Yatra\Migration\MigrationProgress;
use Yatra\Utils\Logger;
use Yatra\Database\Tables\TripAvailabilityDatesTable;

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

        foreach ($oldTourDates as $oldDate) {
            try {
                // Check if already migrated (only for regular migration)
                $existsInAvailability = null;
                
                $newTripId = $this->getMigratedTripId($oldDate->tour_id);

                if (!$this->isForceMigration()) {
                    // Duplicate check: use the resolved newTripId directly so we
                    // do not need a subquery that carried the wrong outer tour_id.
                    if ($newTripId) {
                        $existsInAvailability = $wpdb->get_var($wpdb->prepare(
                            "SELECT id FROM " . TripAvailabilityDatesTable::getTableName() . "
                             WHERE trip_id = %d AND departure_date = %s",
                            $newTripId,
                            $oldDate->start_date
                        ));

                        if ($existsInAvailability) {
                            $skipped++;
                            $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
                            continue;
                        }
                    }
                }

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
                
                if (is_array($pricing)) {
                    // Check various formats for traveler-based pricing
                    $hasTravelerPricing = false;
                    
                    // Format 1: pricing_per = 'person' with price_per_person array
                    if (isset($pricing['pricing_per']) && $pricing['pricing_per'] === 'person' && isset($pricing['price_per_person'])) {
                        $pricingType = 'regular';
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
                        }
                    }

                    // Format 2: Direct traveler_categories array
                    if (!$hasTravelerPricing && isset($pricing['traveler_categories']) && is_array($pricing['traveler_categories'])) {
                        $pricingType = 'regular';
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
                    }
                }
                
                // Migrate to yatra_trip_availability_dates.
                // Reaching here means: no duplicate found (or force migration).
                $maxTravelers = intval($oldDate->max_travellers ?? 0);
                if ($maxTravelers <= 0) {
                    $maxTravelers = 10; // Default
                }

                // Determine status based on active flag
                $availabilityStatus = $oldDate->active ? 'available' : 'cancelled';

                $availabilityData = [
                    'trip_id'          => $newTripId,
                    'departure_date'   => $oldDate->start_date,
                    'return_date'      => $oldDate->end_date,
                    'seats_total'      => $maxTravelers,
                    'seats_available'  => $maxTravelers,
                    'seats_reserved'   => 0,
                    'seats_waitlist'   => 0,
                    'pricing_type'     => $pricingType,
                    'original_price'   => $originalPrice,
                    'discounted_price' => $discountedPrice,
                    'price_types'      => $priceTypes,
                    'status'           => $availabilityStatus,
                    'special_notes'    => $oldDate->note_to_customer ?? null,
                    'created_at'       => $oldDate->created_at ?? current_time('mysql'),
                    'updated_at'       => $oldDate->updated_at ?? current_time('mysql'),
                ];

                $wpdb->insert(TripAvailabilityDatesTable::getTableName(), $availabilityData);
                $insertedId = $wpdb->insert_id;

                if (!$insertedId) {
                    $failed++;
                    Logger::error("Failed to insert availability date", [
                        'source'        => 'migration',
                        'tour_date_id'  => $oldDate->id,
                        'error'         => $wpdb->last_error,
                    ]);
                    $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                $migrated++;
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
                Logger::error("Tour date migration exception", [
                    'source' => 'migration',
                    'tour_date_id' => $oldDate->id,
                    'error' => $e->getMessage()
                ]);
                $this->updateProgress('tour_dates', 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        }

        return [
            'migrated' => $migrated,
            'skipped' => $skipped,
            'failed' => $failed,
        ];
    }
}
