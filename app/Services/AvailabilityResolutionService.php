<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\RecurringRuleRepository;
use Yatra\Repositories\DepartureRepository;
use Yatra\Repositories\AvailabilityRepository;
use Yatra\Repositories\TripRepository;

/**
 * Availability Resolution Service
 * 
 * Centralized service to resolve availability data following priority:
 * 1. Recurring Rules (highest priority - pattern-based dates)
 * 2. Availability Dates (medium priority - specific dates)
 * 3. Trip Default (fallback - ONLY if no dates/rules exist)
 * 
 * This ensures:
 * - Recurring rules are checked first for consistent scheduling
 * - Availability dates provide specific date overrides when needed
 * - Trip defaults only used for flexible booking (trip-only pricing)
 * - Consistent availability resolution across all controllers
 */
class AvailabilityResolutionService
{
    private RecurringRuleService $recurringRuleService;
    private AvailabilityRepository $availabilityRepository;
    private TripRepository $tripRepository;
    private CalculationService $calculationService;

    public function __construct()
    {
        $recurringRuleRepository = new RecurringRuleRepository();
        $departureRepository = new DepartureRepository();
        $this->recurringRuleService = new RecurringRuleService($recurringRuleRepository, $departureRepository);
        $this->availabilityRepository = new AvailabilityRepository();
        $this->tripRepository = new TripRepository();
        $this->calculationService = new CalculationService();
    }

    /**
     * Resolve availability for a specific trip and date (and optionally time)
     * 
     * Priority:
     * 1. Check Recurring Rules (highest priority - pattern-based dates)
     * 2. Check Availability Dates (medium priority - specific dates)
     * 3. Fall back to Trip defaults (ONLY if no dates/rules exist)
     * 
     * This ensures recurring rules are checked first for consistent scheduling,
     * with availability dates providing overrides when needed.
     * 
     * @param int $tripId Trip ID
     * @param string $date Date in Y-m-d format
     * @param string|null $departureTime Optional departure time for day tour time slots
     * @return object Resolved availability data
     */
    public function resolveAvailabilityForDate(int $tripId, string $date, ?string $departureTime = null): object
    {
        // Get trip data
        $trip = $this->tripRepository->find($tripId);
        if (!$trip) {
            throw new \Exception('Trip not found');
        }

        // Priority 1: Check Recurring Rules (highest priority)
        // Pattern-based dates (e.g., "every Monday") are checked first
        $recurringData = $this->checkRecurringRules($tripId, $date);
        if ($recurringData) {
            return $this->buildAvailabilityObject($trip, $recurringData, 'recurring_rule');
        }

        // Priority 2: Check Availability Dates (medium priority)
        // Specific dates with custom pricing/capacity (time-aware for day tours)
        $availabilityDate = $this->availabilityRepository->findByTripIdAndDateTime($tripId, $date, $departureTime);
        if ($availabilityDate) {
            return $this->buildAvailabilityObject($trip, $availabilityDate, 'availability_date');
        }

        // Priority 3: Trip Default (ONLY if no recurring rules AND no availability dates exist)
        // This is the fallback for trips with flexible booking (trip-only pricing)
        return $this->buildAvailabilityObject($trip, null, 'trip_default');
    }

    /**
     * Get all availability dates for a trip (merged from all sources)
     * 
     * @param int $tripId Trip ID
     * @param string $fromDate Start date
     * @param string $toDate End date
     * @return array Array of availability objects
     */
    public function getAllAvailabilityDates(int $tripId, string $fromDate, string $toDate): array
    {
        $trip = $this->tripRepository->find($tripId);
        if (!$trip) {
            return [];
        }

        $allDates = [];
        $dateMap = [];

        // Step 1: Get specific availability dates
        $specificDates = $this->availabilityRepository->findByTripIdAndDateRange($tripId, $fromDate, $toDate);
        foreach ($specificDates as $avail) {
            // Use composite key (date + time) to support multiple time slots on the same date (day tours)
            $dateKey = $avail->departure_date;
            if (!empty($avail->departure_time)) {
                $dateKey .= '_' . $avail->departure_time;
            }
            $dateMap[$dateKey] = $this->buildAvailabilityObject($trip, $avail, 'availability_date');
        }

        // Step 2: Generate dates from recurring rules
        $recurringDates = $this->recurringRuleService->generateDatesForTrip($tripId, $fromDate, $toDate);
        foreach ($recurringDates as $recurringDate) {
            $dateKey = $recurringDate['date'];
            
            // Only add if no specific availability date exists (specific dates override rules)
            if (!isset($dateMap[$dateKey])) {
                $dateMap[$dateKey] = $this->buildAvailabilityObject($trip, $recurringDate, 'recurring_rule');
            }
        }

        // Step 3: Fallback to trip_default if no specific availability configured
        // This generates availability for flexible booking trips
        if (empty($dateMap)) {
            $dateMap = $this->generateDefaultAvailability($trip, $fromDate, $toDate);
        }

        // Sort by date
        ksort($dateMap);
        
        return array_values($dateMap);
    }

    /**
     * Get booking mode information for a trip
     * 
     * Determines whether the trip uses date-specific booking (with configured availability)
     * or flexible booking (no specific dates configured).
     * 
     * @param int $tripId Trip ID
     * @return array Booking mode information with keys:
     *               - 'mode': 'date_specific' or 'flexible'
     *               - 'has_availability': boolean
     *               - 'has_dates': boolean (has specific availability dates)
     *               - 'has_rules': boolean (has recurring rules)
     */
    public function getBookingMode(int $tripId): array
    {
        // Check for specific availability dates (any date, not range-limited)
        global $wpdb;
        $availTable = \Yatra\Database\Tables\TripAvailabilityDatesTable::getTableName();
        $hasSpecificDates = (bool) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$availTable} WHERE trip_id = %d LIMIT 1",
                $tripId
            )
        );

        // Check for recurring rules
        $recurringTable = \Yatra\Database\Tables\TripAvailabilityRulesTable::getTableName();
        $hasRecurringRules = (bool) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$recurringTable} WHERE trip_id = %d AND status = 'active' LIMIT 1",
                $tripId
            )
        );

        $hasAvailability = $hasSpecificDates || $hasRecurringRules;

        return [
            'mode' => $hasAvailability ? 'date_specific' : 'flexible',
            'has_availability' => $hasAvailability,
            'has_dates' => $hasSpecificDates,
            'has_rules' => $hasRecurringRules,
        ];
    }

    /**
     * Generate default availability dates for flexible booking trips
     * 
     * When no specific availability dates or recurring rules are configured,
     * this generates availability based on trip defaults for the requested date range.
     * 
     * @param object $trip Trip object
     * @param string $fromDate Start date
     * @param string $toDate End date
     * @return array Array of availability objects keyed by date
     */
    private function generateDefaultAvailability(object $trip, string $fromDate, string $toDate): array
    {
        $dateMap = [];
        
        // Respect trip's available_from and available_to if set
        $tripAvailableFrom = !empty($trip->available_from) ? $trip->available_from : null;
        $tripAvailableTo = !empty($trip->available_to) ? $trip->available_to : null;
        
        // Determine actual date range
        $startDate = $fromDate;
        $endDate = $toDate;
        
        if ($tripAvailableFrom && $tripAvailableFrom > $startDate) {
            $startDate = $tripAvailableFrom;
        }
        
        if ($tripAvailableTo && $tripAvailableTo < $endDate) {
            $endDate = $tripAvailableTo;
        }
        
        // Don't generate dates if the range is invalid
        if ($startDate > $endDate) {
            return [];
        }
        
        // Check if trip has multiple time slots (for day tours)
        $hasTimeSlots = !empty($trip->has_default_time_slots) && $trip->trip_type === 'single_day';
        $timeSlots = [];
        
        if ($hasTimeSlots) {
            // Parse time slots from JSON
            $timeSlotsData = $trip->default_time_slots;
            if (is_string($timeSlotsData)) {
                $timeSlotsData = json_decode($timeSlotsData, true);
            }
            if (is_array($timeSlotsData) && !empty($timeSlotsData)) {
                $timeSlots = $timeSlotsData;
            }
        }
        
        // Generate daily availability for the range
        // For flexible booking, we generate dates to show in the calendar
        $currentDate = new \DateTime($startDate);
        $finalDate = new \DateTime($endDate);
        
        while ($currentDate <= $finalDate) {
            $dateStr = $currentDate->format('Y-m-d');
            
            if ($hasTimeSlots && !empty($timeSlots)) {
                // Generate separate availability for each time slot
                foreach ($timeSlots as $slot) {
                    $timeValue = $slot['time'] ?? null;
                    if (!$timeValue) continue;
                    
                    $defaultData = [
                        'date' => $dateStr,
                        'departure_date' => $dateStr,
                        'departure_time' => $timeValue,
                    ];
                    
                    $dateKey = $dateStr . '_' . $timeValue;
                    $dateMap[$dateKey] = $this->buildAvailabilityObject($trip, (object) $defaultData, 'trip_default');
                }
            } else {
                // Single availability per date
                $defaultData = [
                    'date' => $dateStr,
                    'departure_date' => $dateStr,
                ];
                
                $dateMap[$dateStr] = $this->buildAvailabilityObject($trip, (object) $defaultData, 'trip_default');
            }
            
            // Move to next day
            $currentDate->modify('+1 day');
        }
        
        return $dateMap;
    }

    /**
     * Check if recurring rule exists for date
     * 
     * @param int $tripId Trip ID
     * @param string $date Date
     * @return array|null Recurring rule data or null
     */
    private function checkRecurringRules(int $tripId, string $date): ?array
    {
        $rules = $this->recurringRuleService->generateDatesForTrip($tripId, $date, $date);
        
        foreach ($rules as $rule) {
            if ($rule['date'] === $date) {
                return $rule;
            }
        }
        
        return null;
    }

    /**
     * Build unified availability object from different sources
     * 
     * @param object $trip Trip data
     * @param mixed $source Source data (recurring rule, availability date, or null)
     * @param string $sourceType Source type identifier
     * @return object Unified availability object
     */
    private function buildAvailabilityObject(object $trip, $source, string $sourceType): object
    {
        $avail = new \stdClass();
        
        // Get trip's pricing configuration (used as fallback for all sources)
        $trip_pricing_type = $trip->pricing_type ?? 'regular';
        $trip_price_types = $this->getTripPriceTypes((int) $trip->id);
        $trip_original_price = isset($trip->original_price) ? (float) $trip->original_price : null;
        $trip_discounted_price = isset($trip->discounted_price) && (float) $trip->discounted_price > 0
            ? (float) $trip->discounted_price
            : (isset($trip->sale_price) && (float) $trip->sale_price > 0 ? (float) $trip->sale_price : null);

        switch ($sourceType) {
            case 'recurring_rule':
                // From recurring rule
                $avail->id = 'recurring_' . $source['date'] . '_' . ($source['rule_id'] ?? 0);
                $avail->trip_id = (int) $trip->id;
                $avail->departure_date = $source['date'];
                $avail->seats_total = $source['max_capacity'] ?? 0;
                $avail->seats_available = $source['max_capacity'] ?? 0;
                $avail->seats_reserved = 0;
                $avail->status = 'available';
                $avail->is_recurring = true;
                $avail->rule_id = $source['rule_id'] ?? null;
                $avail->source = 'recurring_rule';
                
                // Pricing: rule base_price → trip original_price fallback
                $rule_price = isset($source['base_price']) && $source['base_price'] !== null
                    ? (float) $source['base_price'] : null;
                $avail->original_price = ($rule_price !== null && $rule_price > 0)
                    ? $rule_price : $trip_original_price;
                // Rules don't have discounted_price — inherit trip's discount
                $avail->discounted_price = $trip_discounted_price;
                
                // Inherit trip's pricing_type
                $avail->pricing_type = $trip_pricing_type;
                
                // Use trip's price_types (rules don't have their own)
                $avail->price_types = $trip_price_types;
                break;

            case 'availability_date':
                // From specific availability date
                $avail->id = $source->id ?? 0;
                $avail->trip_id = (int) $trip->id;
                $avail->departure_date = $source->departure_date ?? '';
                $avail->arrival_date = $source->arrival_date ?? null;
                $avail->return_date = $source->return_date ?? null;
                $avail->departure_time = $source->departure_time ?? null;
                $avail->arrival_time = $source->arrival_time ?? null;
                $avail->seats_total = (int) ($source->seats_total ?? 0);
                $avail->seats_available = (int) ($source->seats_available ?? 0);
                $avail->seats_reserved = (int) ($source->seats_reserved ?? 0);
                $avail->status = $source->status ?? 'available';
                $avail->is_recurring = false;
                $avail->source = 'availability_date';
                
                // Pricing: availability price → trip price fallback
                $avail_orig = isset($source->original_price) && $source->original_price !== null
                    ? (float) $source->original_price : null;
                $avail_disc = isset($source->discounted_price) && $source->discounted_price !== null
                    ? (float) $source->discounted_price : null;
                
                $avail->original_price = ($avail_orig !== null && $avail_orig > 0)
                    ? $avail_orig : $trip_original_price;
                $avail->discounted_price = ($avail_disc !== null && $avail_disc > 0)
                    ? $avail_disc : $trip_discounted_price;
                
                // Inherit trip's pricing_type
                $avail->pricing_type = $trip_pricing_type;
                
                // Use availability's price_types if set, otherwise trip's price_types
                $avail_price_types = null;
                if (!empty($source->price_types)) {
                    $avail_price_types = is_string($source->price_types) 
                        ? json_decode($source->price_types, true) 
                        : $source->price_types;
                }
                $avail->price_types = !empty($avail_price_types) ? $avail_price_types : $trip_price_types;
                break;

            case 'trip_default':
                // From trip defaults (flexible booking)
                // Can be used for single date resolution (departure_date = null) 
                // or for generating availability list (departure_date = specific date)
                $departure_date = null;
                if (is_object($source) && !empty($source->departure_date)) {
                    $departure_date = $source->departure_date;
                } elseif (is_array($source) && !empty($source['departure_date'])) {
                    $departure_date = $source['departure_date'];
                }
                
                // Get departure time from source or trip default
                $departure_time_value = null;
                if (is_object($source) && !empty($source->departure_time)) {
                    $departure_time_value = $source->departure_time;
                } elseif (is_array($source) && !empty($source['departure_time'])) {
                    $departure_time_value = $source['departure_time'];
                } else {
                    // Use trip's default departure time
                    $departure_time_value = $trip->departure_time ?? null;
                }
                
                $avail->id = $departure_date ? 'default_' . $departure_date : 'default';
                if ($departure_time_value) {
                    $avail->id .= '_' . str_replace(':', '', $departure_time_value);
                }
                
                $avail->trip_id = (int) $trip->id;
                $avail->departure_date = $departure_date;
                $avail->arrival_date = null;
                $avail->return_date = null;
                $avail->departure_time = $departure_time_value;
                $avail->arrival_time = null;
                $avail->seats_total = (int) ($trip->max_travelers ?? 20);
                $avail->seats_available = (int) ($trip->max_travelers ?? 20);
                $avail->seats_reserved = 0;
                $avail->original_price = $trip_original_price;
                $avail->discounted_price = $trip_discounted_price;
                $avail->status = 'available';
                $avail->is_recurring = false;
                $avail->source = 'trip_default';
                
                // Use trip's pricing_type and price_types
                $avail->pricing_type = $trip_pricing_type;
                $avail->price_types = $trip_price_types;
                break;
        }

        // Calculate effective price via centralized TripPricingService
        $avail->effective_price = $this->calculateEffectivePrice($avail);

        // Pro filter: allows Dynamic Pricing, Itinerary Pricing, etc. to modify per-date availability
        $avail = (object) apply_filters('yatra_resolve_availability_object', $avail, $trip, $sourceType);

        return $avail;
    }

    /**
     * Calculate effective price based on pricing type
     * 
     * Delegates to centralized TripPricingService for consistent pricing resolution.
     * 
     * @param object $avail Availability object
     * @return float Effective price
     */
    private function calculateEffectivePrice(object $avail): float
    {
        if ($avail->pricing_type === 'traveler_based' && !empty($avail->price_types)) {
            // For traveler-based, return minimum price from categories
            $min_price = PHP_FLOAT_MAX;
            foreach ($avail->price_types as $pt) {
                $price = TripPricingService::resolveCategoryEffectivePrice((array) $pt);
                if ($price > 0 && $price < $min_price) {
                    $min_price = $price;
                }
            }
            return $min_price < PHP_FLOAT_MAX ? $min_price : 0.0;
        } else {
            // For regular pricing: discounted → original
            if (!empty($avail->discounted_price) && (float) $avail->discounted_price > 0) {
                return (float) $avail->discounted_price;
            }
            return (float) ($avail->original_price ?? 0);
        }
    }

    /**
     * Get trip's price types from trips table JSON field
     * 
     * @param int $tripId Trip ID
     * @return array Price types array
     */
    private function getTripPriceTypes(int $tripId): array
    {
        global $wpdb;
        $table = \Yatra\Database\Tables\TripsTable::getTableName();
        
        // Get price_types JSON from trips table
        $json = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT price_types FROM {$table} WHERE id = %d",
                $tripId
            )
        );
        
        if (empty($json)) {
            return [];
        }
        
        $decoded = json_decode($json, true);
        return is_array($decoded) ? $decoded : [];
    }
}
