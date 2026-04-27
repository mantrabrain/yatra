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
     * Generate dynamic future dates for sample data.
     *
     * Availability rows are grouped per trip, sorted by original departure, then assigned
     * spaced future departures while preserving each row's original trip length (arrival − departure).
     * Rules are shifted so start is at least 7 days from "today" in the site timezone, keeping
     * the original rule window length (capped at 2 years).
     *
     * @param array $base_data Original sample data
     * @return array Modified data with future dates
     */
    private function generate_dynamic_dates(array $base_data): array
    {
        $tz = function_exists('wp_timezone') ? wp_timezone() : new \DateTimeZone('UTC');
        $today = new \DateTimeImmutable('today', $tz);
        $min_departure = $today->modify('+14 days');
        $rule_min_start = $today->modify('+7 days');
        $first_slot_anchor = $today->modify('+21 days');
        $slot_gap_days = 14;

        if (!empty($base_data['availability_dates'])) {
            $dates = $base_data['availability_dates'];
            $by_trip = [];
            foreach ($dates as $i => $row) {
                $slug = $row['trip_slug'] ?? '';
                if ($slug === '') {
                    continue;
                }
                $by_trip[$slug][] = $i;
            }

            foreach ($by_trip as $indices) {
                usort($indices, function ($a, $b) use ($dates) {
                    $da = $dates[$a]['departure_date'] ?? '';
                    $db = $dates[$b]['departure_date'] ?? '';

                    return strcmp((string) $da, (string) $db);
                });

                $cursor = $first_slot_anchor;
                foreach ($indices as $idx) {
                    $dep_s = $dates[$idx]['departure_date'] ?? '';
                    $arr_s = $dates[$idx]['arrival_date'] ?? $dep_s;
                    $orig_dep = \DateTimeImmutable::createFromFormat('Y-m-d', (string) $dep_s, $tz);
                    $orig_arr = \DateTimeImmutable::createFromFormat('Y-m-d', (string) $arr_s, $tz);
                    if (!$orig_dep) {
                        continue;
                    }
                    if (!$orig_arr) {
                        $orig_arr = $orig_dep;
                    }
                    $duration_days = max(0, (int) $orig_dep->diff($orig_arr)->format('%a'));

                    if ($cursor < $min_departure) {
                        $cursor = $min_departure;
                    }

                    $new_dep = $cursor;
                    $new_arr = $new_dep->modify('+' . $duration_days . ' days');
                    $dates[$idx]['departure_date'] = $new_dep->format('Y-m-d');
                    $dates[$idx]['arrival_date'] = $new_arr->format('Y-m-d');
                    // DB + frontend expect return_date; sample JSON only had arrival_date
                    $dates[$idx]['return_date'] = $new_arr->format('Y-m-d');

                    $cursor = $new_dep->modify('+' . $slot_gap_days . ' days');
                }
            }

            $base_data['availability_dates'] = $dates;
        }

        if (!empty($base_data['availability_dates'])) {
            $base_data['availability_dates'] = $this->alignSampleAvailabilitySeatConsistency(
                $base_data['availability_dates'],
                $base_data['trips'] ?? []
            );
        }

        if (!empty($base_data['availability_rules'])) {
            foreach ($base_data['availability_rules'] as $i => $rule) {
                $orig_start = \DateTimeImmutable::createFromFormat(
                    'Y-m-d',
                    (string) ($rule['start_date'] ?? ''),
                    $tz
                );
                $orig_end = \DateTimeImmutable::createFromFormat(
                    'Y-m-d',
                    (string) ($rule['end_date'] ?? ''),
                    $tz
                );
                if (!$orig_start || !$orig_end) {
                    continue;
                }

                $span_days = max(1, (int) $orig_start->diff($orig_end)->format('%a'));

                $new_start = $rule_min_start;
                $new_end = $new_start->modify('+' . $span_days . ' days');

                $cap = $new_start->modify('+2 years');
                if ($new_end > $cap) {
                    $new_end = $cap;
                }

                $base_data['availability_rules'][$i]['start_date'] = $new_start->format('Y-m-d');
                $base_data['availability_rules'][$i]['end_date'] = $new_end->format('Y-m-d');
            }
        }

        return $base_data;
    }

    /**
     * Keep seats_total / seats_available / seats_reserved consistent and align status
     * (available | limited | sold_out) with seat counts so demo data matches the UI.
     */
    private function alignSampleAvailabilitySeatConsistency(array $dates, array $trips): array
    {
        $tripCap = [];
        foreach ($trips as $t) {
            if (!empty($t['slug'])) {
                $tripCap[(string) $t['slug']] = max(1, (int) ($t['max_travelers'] ?? 20));
            }
        }

        foreach ($dates as $i => $row) {
            $slug = (string) ($row['trip_slug'] ?? '');
            $defaultCap = $tripCap[$slug] ?? 20;

            $total = (int) ($row['seats_total'] ?? 0);
            if ($total <= 0) {
                $total = $defaultCap;
            }

            $avail = (int) ($row['seats_available'] ?? 0);
            $reserved = (int) ($row['seats_reserved'] ?? 0);

            if ($avail < 0) {
                $avail = 0;
            }
            if ($reserved < 0) {
                $reserved = 0;
            }
            if ($avail > $total) {
                $avail = $total;
            }
            if ($avail + $reserved !== $total) {
                $reserved = max(0, min($total, $total - $avail));
                $avail = max(0, $total - $reserved);
            }

            $status = 'available';
            if ($avail <= 0) {
                $status = 'sold_out';
            } elseif ($total > 0 && $avail <= max(1, (int) ceil($total * 0.2))) {
                $status = 'limited';
            }

            if (in_array($row['status'] ?? '', ['blocked', 'closed', 'cancelled', 'unavailable'], true)) {
                $status = $row['status'];
            }

            $dates[$i]['seats_total'] = $total;
            $dates[$i]['seats_available'] = $avail;
            $dates[$i]['seats_reserved'] = $reserved;
            $dates[$i]['status'] = $status;
        }

        return $dates;
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
