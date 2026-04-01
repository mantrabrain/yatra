<?php

namespace Yatra\Services;

use Yatra\Repositories\SampleDataRepository;
use Yatra\Database\Tables\TripsTable;
use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Database\Tables\DiscountsTable;

/**
 * Sample Data Service
 * 
 * Handles the business logic for importing and managing sample data
 */
class SampleDataService
{
    /**
     * @var SampleDataRepository
     */
    private $repository;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->repository = new SampleDataRepository();
    }

    /**
     * Generate dynamic future dates for sample data
     * 
     * @param array $base_data Original sample data
     * @return array Modified data with future dates
     */
    private function generate_dynamic_dates(array $base_data): array
    {
        $current_date = new \DateTime();
        $current_year = (int)$current_date->format('Y');
        $current_month = (int)$current_date->format('m');
        
        // Generate dates starting from next month
        $start_date = new \DateTime();
        $start_date->modify('+1 month');
        $start_year = (int)$start_date->format('Y');
        $start_month = (int)$start_date->format('m');
        
        // Process availability dates
        if (!empty($base_data['availability_dates'])) {
            $base_data['availability_dates'] = array_map(function($date_entry) use ($current_year, $current_month, $start_year, $start_month) {
                $original_date = new \DateTime($date_entry['departure_date']);
                $original_year = (int)$original_date->format('Y');
                $original_month = (int)$original_date->format('m');
                $original_day = (int)$original_date->format('d');
                
                // Calculate year offset
                $year_offset = $start_year - $original_year;
                if ($original_month < $start_month) {
                    $year_offset = max(0, $year_offset);
                }
                
                // Create new future date
                $new_departure = new \DateTime();
                $new_departure->setDate($start_year + $year_offset, $original_month, $original_day);
                
                // Ensure date is at least 30 days in the future
                $min_date = new \DateTime();
                $min_date->modify('+30 days');
                if ($new_departure < $min_date) {
                    $new_departure = $min_date;
                }
                
                $date_entry['departure_date'] = $new_departure->format('Y-m-d');
                
                // For single day trips, arrival = departure
                if (isset($date_entry['arrival_date']) && $date_entry['arrival_date'] === $date_entry['departure_date']) {
                    $date_entry['arrival_date'] = $new_departure->format('Y-m-d');
                } else {
                    // For multi-day trips, calculate arrival date
                    $original_arrival = new \DateTime($date_entry['arrival_date']);
                    $interval = $original_arrival->diff($original_date);
                    $new_arrival = clone $new_departure;
                    $new_arrival->add($interval);
                    $date_entry['arrival_date'] = $new_arrival->format('Y-m-d');
                }
                
                return $date_entry;
            }, $base_data['availability_dates']);
        }
        
        // Process availability rules
        if (!empty($base_data['availability_rules'])) {
            $base_data['availability_rules'] = array_map(function($rule) use ($start_year, $start_month) {
                $original_start = new \DateTime($rule['start_date']);
                $original_year = (int)$original_start->format('Y');
                $original_month = (int)$original_start->format('m');
                
                // Calculate new start date
                $year_offset = $start_year - $original_year;
                if ($original_month < $start_month) {
                    $year_offset = max(0, $year_offset);
                }
                
                $new_start = new \DateTime();
                $new_start->setDate($start_year + $year_offset, $original_month, (int)$original_start->format('d'));
                
                // Ensure start date is at least 30 days in the future
                $min_date = new \DateTime();
                $min_date->modify('+30 days');
                if ($new_start < $min_date) {
                    $new_start = $min_date;
                }
                
                $rule['start_date'] = $new_start->format('Y-m-d');
                
                // Update end date to maintain same duration
                $original_end = new \DateTime($rule['end_date']);
                $duration = $original_end->diff($original_start);
                $new_end = clone $new_start;
                $new_end->add($duration);
                
                // For multi-year rules, ensure end date is reasonable
                $max_end = clone $new_start;
                $max_end->modify('+2 years');
                if ($new_end > $max_end) {
                    $new_end = $max_end;
                }
                
                $rule['end_date'] = $new_end->format('Y-m-d');
                
                return $rule;
            }, $base_data['availability_rules']);
        }
        
        return $base_data;
    }

    /**
     * Import all sample data from JSON files
     * 
     * Order matters:
     * 1. Classifications (categories, activities, destinations, etc.) - tracked by slug=>id
     * 2. Items (type='item') - needs item_type IDs from step 1
     * 3. Discounts
     * 4. Trips - tracked by slug=>id
     * 5. Trip-Classification pivot - needs both classification IDs and trip IDs
     * 6. Availability dates/rules - needs trip IDs (with dynamic dates)
     * 7. Itinerary days - needs trip IDs, tracked by composite key=>id
     * 8. Itinerary entries - needs day IDs, item_type IDs, and item IDs
     */
    public function import_sample_data()
    {
        $results = [];

        try {
            $sample_data = $this->repository->get_all_sample_data();
            
            // Generate dynamic future dates
            $sample_data = $this->generate_dynamic_dates($sample_data);
            
            // 1. Import Classifications (all types except items)
            $classifications = array_merge(
                $sample_data['categories'] ?? [],
                $sample_data['activities'] ?? [],
                $sample_data['destinations'] ?? [],
                $sample_data['difficulty_levels'] ?? [],
                $sample_data['attributes'] ?? [],
                $sample_data['item_types'] ?? [],
                $sample_data['traveler_categories'] ?? []
            );
            $classifications_count = $this->repository->insert_classifications($classifications);
            $results['classifications'] = $classifications_count;
            
            // 2. Import Items (type='item', needs item_type parent IDs from step 1)
            $items_count = 0;
            if (!empty($sample_data['items'])) {
                $items_count = $this->repository->insert_items($sample_data['items']);
            }
            $results['items'] = $items_count;
            
            // 3. Import Discounts
            $discounts_count = $this->repository->insert_discounts($sample_data['discounts'] ?? []);
            $results['discounts'] = $discounts_count;
            
            // 4. Import Trips (returns slug => id mapping)
            $trip_ids = $this->repository->insert_trips($sample_data['trips'] ?? []);
            $results['trips'] = count($trip_ids);
            
            // 5. Import Trip-Classification pivot records (links trips to categories/activities/etc.)
            $trip_cls_count = 0;
            if (!empty($sample_data['trip_classifications'])) {
                $trip_cls_count = $this->repository->insert_trip_classifications(
                    $sample_data['trip_classifications'],
                    $trip_ids
                );
            }
            $results['trip_classifications'] = $trip_cls_count;
            
            // 6. Import Availability Dates
            $results['availability_dates'] = $this->repository->insert_availability_dates(
                $sample_data['availability_dates'] ?? [],
                $trip_ids
            );
            
            // 7. Import Availability Rules
            $results['availability_rules'] = $this->repository->insert_availability_rules(
                $sample_data['availability_rules'] ?? [],
                $trip_ids
            );
            
            // 8. Import Itinerary Days
            $day_ids = $this->repository->insert_itinerary_days(
                $sample_data['itinerary_days'] ?? [],
                $trip_ids
            );
            $results['itinerary_days'] = count($day_ids);
            
            // 9. Import Itinerary Entries (resolves item_type_id and item_id from classifications)
            $results['itinerary_entries'] = $this->repository->insert_itinerary_entries(
                $sample_data['itinerary_entries'] ?? [],
                $trip_ids,
                $day_ids
            );
            
            return [
                'success' => true,
                'message' => __('Sample data imported successfully!', 'yatra'),
                'data' => $results
            ];
            
        } catch (\Exception $e) {
            error_log('Yatra Sample Data Import Error: ' . $e->getMessage() . ' | Trace: ' . $e->getTraceAsString());
            return [
                'success' => false,
                'message' => sprintf(__('Error importing sample data: %s', 'yatra'), $e->getMessage()),
                'data' => $results
            ];
        }
    }

    /**
     * Cleanup sample data
     */
    public function cleanup_sample_data()
    {
        $results = $this->repository->cleanup_sample_data();
        
        return [
            'success' => true,
            'message' => __('Sample data cleaned up successfully!', 'yatra'),
            'data' => $results
        ];
    }
    
    /**
     * Get import status
     */
    public function get_import_status()
    {
        global $wpdb;
        
        $trips_table = TripsTable::getTableName();
        $classifications_table = ClassificationsTable::getTableName();
        $discounts_table = DiscountsTable::getTableName();
        
        // Sample trip slugs from trips.json
        $trip_slugs = [
            'swiss-alps-mountain-trek', 'maldives-beach-escape', 'kyoto-cultural-journey',
            'serengeti-wildlife-safari', 'paris-city-explorer', 'bali-island-adventure',
            'iceland-northern-lights', 'new-zealand-adventure', 'peru-machu-picchu-trek',
            'norway-fjords-cruise', 'grand-canyon-day-tour', 'paris-city-highlights-tour',
            'nyc-helicopter-liberty-tour', 'tokyo-cultural-food-tour'
        ];
        $trip_slugs_sql = "'" . implode("','", $trip_slugs) . "'";
        
        $trips_count = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM `{$trips_table}` WHERE slug IN ({$trip_slugs_sql})"
        );
        
        // Sample classification slugs from all classification JSON files
        $cls_slugs = [
            'adventure-tours', 'beach-island', 'cultural-tours', 'wildlife-safari',
            'city-tours', 'trekking-hiking', 'cruise-tours', 'food-wine',
            'hiking', 'snorkeling', 'city-walking-tour', 'wildlife-viewing',
            'kayaking', 'photography', 'camping', 'rock-climbing', 'cycling', 'cooking-class',
            'swiss-alps', 'maldives', 'kyoto-japan', 'serengeti-tanzania', 'paris-france',
            'bali-indonesia', 'iceland', 'new-zealand', 'peru', 'norway',
            'easy', 'moderate', 'challenging', 'difficult', 'extreme', 'expert',
            'group-size', 'age-restriction', 'fitness-level', 'accommodation-type',
            'meal-plan', 'transportation', 'guide-language', 'season',
            'accommodation', 'activity', 'meal', 'sightseeing', 'free-time',
            'adult', 'child', 'infant', 'student', 'senior', 'group-leader', 'family', 'solo-traveler'
        ];
        $cls_slugs_sql = "'" . implode("','", $cls_slugs) . "'";
        
        $classifications_count = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM `{$classifications_table}` WHERE slug IN ({$cls_slugs_sql})"
        );
        
        // Sample discount codes from discounts.json
        $discount_codes = ['SUMMER2024', 'EARLYBIRD', 'GROUP10', 'WELCOME50', 'FAMILY20', 'LASTMINUTE', 'LOYAL100', 'WINTER2024'];
        $codes_sql = "'" . implode("','", $discount_codes) . "'";
        
        $discounts_count = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM `{$discounts_table}` WHERE code IN ({$codes_sql})"
        );
        
        $is_imported = get_option('yatra_sample_data_imported', false);
        $import_date = get_option('yatra_sample_data_import_date', '');
        
        return [
            'is_imported' => $is_imported,
            'import_date' => $import_date,
            'counts' => [
                'trips' => $trips_count,
                'classifications' => $classifications_count,
                'discounts' => $discounts_count,
            ],
            'has_data' => ($trips_count > 0 || $classifications_count > 0 || $discounts_count > 0)
        ];
    }
}
