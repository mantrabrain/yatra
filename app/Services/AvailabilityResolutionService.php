<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\AvailabilityRepository;
use Yatra\Repositories\TripRepository;
use Yatra\Repositories\RecurringAvailabilityRepository;
use Yatra\Repositories\BookingRepository;

/**
 * Availability Resolution Service
 * 
 * Centralized service to resolve availability data following priority:
 * 1. Availability Dates (specific rows — capacity, sold_out, blocked, pricing overrides)
 * 2. Recurring Rules (pattern-based dates when no specific row exists for that date)
 * 3. Trip Default (fallback — flexible booking when no dates/rules exist)
 *
 * Specific dates must win over recurring rules so admin “sold out” / seat counts are respected.
 */
class AvailabilityResolutionService
{
    private RecurringAvailabilityService $recurringAvailabilityService;
    private AvailabilityRepository $availabilityRepository;
    private TripRepository $tripRepository;
    private BookingRepository $bookingRepository;
    private CalculationService $calculationService;

    public function __construct()
    {
        // Use the new recurring availability rules engine (wp_yatra_new_trip_availability_rules).
        // The admin Availability Rules UI writes to this schema; the single-trip page must use
        // the same engine to keep Preview and frontend availability consistent.
        $this->recurringAvailabilityService = new RecurringAvailabilityService(
            new RecurringAvailabilityRepository()
        );
        $this->availabilityRepository = new AvailabilityRepository();
        $this->tripRepository = new TripRepository();
        $this->bookingRepository = new BookingRepository();
        $this->calculationService = new CalculationService();
    }

    /**
     * Resolve availability for a specific trip and date (and optionally time)
     * 
     * Priority:
     * 1. Availability Dates (exact date/time row from DB)
     * 2. Recurring Rules (generated slot when no DB row)
     * 3. Trip defaults (flexible booking)
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

        // Priority 1: Specific availability rows (sold_out, seats, blocks, price overrides)
        $availabilityDate = $this->availabilityRepository->findByTripIdAndDateTime($tripId, $date, $departureTime);
        if ($availabilityDate) {
            return $this->buildAvailabilityObject($trip, $availabilityDate, 'availability_date');
        }

        // Priority 2: Recurring rules when no explicit row exists for this date/time
        $recurring = $this->resolveRecurringAvailabilityForDate($tripId, $date, $departureTime);
        if ($recurring !== null) {
            return $this->buildAvailabilityObject($trip, $recurring, 'recurring_rule');
        }

        // Priority 3: Trip default (flexible booking / no configured calendar)
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
        $recurringDates = $this->recurringAvailabilityService->generateDatesForTrip($tripId, $fromDate, $toDate);
        foreach ($recurringDates as $recurringDate) {
            $depDate = $recurringDate['departure_date'] ?? $recurringDate['date'] ?? null;
            if (!$depDate) {
                continue;
            }
            // Mirror the specific-dates composite key so manual rows can override
            // individual rule time-slots (day tours) deterministically.
            $dateKey = $depDate;
            $depTime = $recurringDate['departure_time'] ?? null;
            if (!empty($depTime)) {
                $dateKey .= '_' . $depTime;
            }
            
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
        
        // Get trip's pricing configuration (used as fallback for all sources).
        // Use {@see TripPricingService::resolvePricingType} so "regular" trips do not inherit stale
        // JSON category rows into availability objects (keeps effective_price aligned with trip row).
        $trip_pricing_type = TripPricingService::resolvePricingType($trip);
        $trip_price_types = $trip_pricing_type === 'traveler_based'
            ? $this->getTripPriceTypes((int) $trip->id)
            : [];
        $trip_original_price = isset($trip->original_price) ? (float) $trip->original_price : null;
        $trip_discounted_price = isset($trip->discounted_price) && (float) $trip->discounted_price > 0
            ? (float) $trip->discounted_price
            : (isset($trip->sale_price) && (float) $trip->sale_price > 0 ? (float) $trip->sale_price : null);

        switch ($sourceType) {
            case 'recurring_rule':
                // From recurring rule (new engine uses departure_date/departure_time).
                $depDate = is_array($source)
                    ? ($source['departure_date'] ?? $source['date'] ?? null)
                    : (is_object($source) ? ($source->departure_date ?? $source->date ?? null) : null);
                $depTime = is_array($source)
                    ? ($source['departure_time'] ?? null)
                    : (is_object($source) ? ($source->departure_time ?? null) : null);
                $ruleId = is_array($source)
                    ? ($source['rule_id'] ?? null)
                    : (is_object($source) ? ($source->rule_id ?? null) : null);

                $avail->id = 'recurring_' . ($depDate ?: '') . '_' . ($ruleId ?? 0) . ($depTime ? '_' . $depTime : '');
                $avail->trip_id = (int) $trip->id;
                $avail->departure_date = (string) ($depDate ?? '');
                $avail->departure_time = $depTime ?: null;
                $avail->arrival_time = is_array($source)
                    ? ($source['arrival_time'] ?? null)
                    : (is_object($source) ? ($source->arrival_time ?? null) : null);

                $seatsTotal = null;
                if (is_array($source)) {
                    $seatsTotal = isset($source['seats_total']) ? (int) $source['seats_total'] : null;
                } elseif (is_object($source)) {
                    $seatsTotal = isset($source->seats_total) ? (int) $source->seats_total : null;
                }
                if (!$seatsTotal || $seatsTotal <= 0) {
                    $seatsTotal = (int) ($trip->max_travelers ?? $trip->max_travellers ?? 0);
                }
                if ($seatsTotal <= 0) {
                    $seatsTotal = 20;
                }

                $avail->seats_total = $seatsTotal;
                // Live reserved seats from bookings (virtual slots have no numeric availability_id).
                $reserved = 0;
                if ($avail->departure_date !== '') {
                    /** @var array{trip_id:int, departure_date:string, departure_time:?string} $args */
                    $args = apply_filters('yatra_virtual_availability_reserved_seats_args', [
                        'trip_id' => (int) $trip->id,
                        'departure_date' => (string) $avail->departure_date,
                        'departure_time' => $avail->departure_time ?: null,
                    ], $trip, $source);

                    $tripId = (int) ($args['trip_id'] ?? (int) $trip->id);
                    $depDate = (string) ($args['departure_date'] ?? (string) $avail->departure_date);
                    $depTime = $args['departure_time'] ?? ($avail->departure_time ?: null);

                    $reserved = $this->bookingRepository->countActiveSeatsForSlot(
                        $tripId,
                        $depDate,
                        is_string($depTime) ? $depTime : null
                    );
                }
                $reserved = (int) apply_filters('yatra_virtual_availability_reserved_seats_count', (int) $reserved, $avail, $trip, $source);

                // Allow modules to override seats_total for rule dates (e.g. seasonal capacity).
                $seatsTotal = (int) apply_filters('yatra_virtual_availability_seats_total', (int) $seatsTotal, $avail, $trip, $source);
                $avail->seats_total = max(0, $seatsTotal);

                // Derive seats from reserved + total.
                $avail->seats_reserved = max(0, (int) $reserved);
                $avail->seats_available = max(0, (int) $avail->seats_total - (int) $avail->seats_reserved);

                // Let modules override final computed seats_available (e.g. channel allocations).
                $avail->seats_available = max(0, (int) apply_filters('yatra_virtual_availability_seats_available', (int) $avail->seats_available, $avail, $trip, $source));
                $avail->status = is_array($source)
                    ? (($source['status'] ?? '') ?: 'available')
                    : (is_object($source) ? (($source->status ?? '') ?: 'available') : 'available');
                if ($avail->seats_available <= 0) {
                    $avail->status = 'sold_out';
                }
                $avail->is_recurring = true;
                $avail->rule_id = $ruleId;
                $avail->source = 'recurring_rule';
                $avail->from_location = is_array($source)
                    ? ($source['from_location'] ?? null)
                    : (is_object($source) ? ($source->from_location ?? null) : null);
                $avail->to_location = is_array($source)
                    ? ($source['to_location'] ?? null)
                    : (is_object($source) ? ($source->to_location ?? null) : null);
                $avail->from_latitude = is_array($source)
                    ? ($source['from_latitude'] ?? null)
                    : (is_object($source) ? ($source->from_latitude ?? null) : null);
                $avail->from_longitude = is_array($source)
                    ? ($source['from_longitude'] ?? null)
                    : (is_object($source) ? ($source->from_longitude ?? null) : null);
                $avail->to_latitude = is_array($source)
                    ? ($source['to_latitude'] ?? null)
                    : (is_object($source) ? ($source->to_latitude ?? null) : null);
                $avail->to_longitude = is_array($source)
                    ? ($source['to_longitude'] ?? null)
                    : (is_object($source) ? ($source->to_longitude ?? null) : null);
                $avail->cutoff_hours = is_array($source)
                    ? ($source['cutoff_hours'] ?? null)
                    : (is_object($source) ? ($source->cutoff_hours ?? null) : null);
                $alertThreshold = is_array($source)
                    ? (int) ($source['alert_threshold'] ?? 5)
                    : (int) (is_object($source) ? ($source->alert_threshold ?? 5) : 5);
                $avail->is_sold_out = ($avail->seats_available ?? 0) <= 0;
                $avail->is_limited = ($avail->seats_available ?? 0) > 0 && ($avail->seats_available ?? 0) <= max(1, $alertThreshold);
                $avail->is_sold_out = (bool) apply_filters('yatra_virtual_availability_is_sold_out', (bool) $avail->is_sold_out, $avail, $trip, $source);
                $avail->is_limited = (bool) apply_filters('yatra_virtual_availability_is_limited', (bool) $avail->is_limited, $avail, $trip, $source);
                
                // Pricing: rule base_price → trip original_price fallback
                $rule_price = null;
                if (is_array($source)) {
                    $rule_price = isset($source['original_price']) && $source['original_price'] !== null
                        ? (float) $source['original_price']
                        : (isset($source['base_price']) && $source['base_price'] !== null ? (float) $source['base_price'] : null);
                } elseif (is_object($source)) {
                    $rule_price = isset($source->original_price) && $source->original_price !== null
                        ? (float) $source->original_price
                        : (isset($source->base_price) && $source->base_price !== null ? (float) $source->base_price : null);
                }
                $avail->original_price = ($rule_price !== null && $rule_price > 0)
                    ? $rule_price : $trip_original_price;
                $rule_discount = null;
                if (is_array($source)) {
                    $rule_discount = isset($source['discounted_price']) && $source['discounted_price'] !== null
                        ? (float) $source['discounted_price']
                        : null;
                } elseif (is_object($source)) {
                    $rule_discount = isset($source->discounted_price) && $source->discounted_price !== null
                        ? (float) $source->discounted_price
                        : null;
                }
                // Use rule slot discounted_price when present, otherwise inherit trip discount.
                $avail->discounted_price = ($rule_discount !== null && $rule_discount > 0)
                    ? $rule_discount
                    : $trip_discounted_price;
                // Convenience for frontend payloads that look for a single price number.
                $avail->effective_price = ($avail->discounted_price !== null && (float) $avail->discounted_price > 0)
                    ? (float) $avail->discounted_price
                    : (float) ($avail->original_price ?? 0);
                
                // Inherit trip's pricing_type
                $avail->pricing_type = $trip_pricing_type;
                
                // If a rule defines traveler_pricing, expose it as price_types so booking UI
                // can render category-based pricing for rule-generated availability.
                $travelerPricing = null;
                if (is_array($source)) {
                    $travelerPricing = $source['traveler_pricing'] ?? null;
                } elseif (is_object($source)) {
                    $travelerPricing = $source->traveler_pricing ?? null;
                }
                if (is_array($travelerPricing) && !empty($travelerPricing)) {
                    $avail->price_types = TripPricingService::resolvePriceTypes(
                        (object) ['price_types' => $travelerPricing]
                    );
                    $avail->pricing_type = 'traveler_based';
                } else {
                    $avail->price_types = $trip_price_types;
                }

                // End dates for sidebar / JSON (rules only provide departure day)
                $durationDays = max(1, (int) ($trip->duration_days ?? 1));
                $offset = max(0, $durationDays - 1);
                $dep = $avail->departure_date;
                if ($dep !== '' && $dep !== null) {
                    $end = date('Y-m-d', strtotime((string) $dep . ' +' . $offset . ' days'));
                    $avail->arrival_date = $end;
                    $avail->return_date = $end;
                } else {
                    $avail->arrival_date = null;
                    $avail->return_date = null;
                }
                break;

            case 'availability_date':
                // From specific availability date
                $avail->id = $source->id ?? 0;
                $avail->trip_id = (int) $trip->id;
                $avail->departure_date = $source->departure_date ?? '';
                $arrival = isset($source->arrival_date) ? $source->arrival_date : null;
                $return = isset($source->return_date) ? $source->return_date : null;
                $avail->arrival_date = $arrival;
                $avail->return_date = ($return !== null && $return !== '') ? $return : $arrival;
                $avail->departure_time = isset($source->departure_time) ? $source->departure_time : null;
                $avail->arrival_time = isset($source->arrival_time) ? $source->arrival_time : null;
                $avail->seats_total = (int) ($source->seats_total ?? 0);
                $avail->seats_available = (int) ($source->seats_available ?? 0);
                $avail->seats_reserved = (int) ($source->seats_reserved ?? 0);
                $avail->status = $source->status ?? 'available';
                $avail->is_recurring = false;
                $avail->source = 'availability_date';
                $avail->from_location = isset($source->from_location) ? $source->from_location : null;
                $avail->to_location = isset($source->to_location) ? $source->to_location : null;
                $avail->from_latitude = isset($source->from_latitude) ? $source->from_latitude : null;
                $avail->from_longitude = isset($source->from_longitude) ? $source->from_longitude : null;
                $avail->to_latitude = isset($source->to_latitude) ? $source->to_latitude : null;
                $avail->to_longitude = isset($source->to_longitude) ? $source->to_longitude : null;
                $avail->cutoff_hours = isset($source->cutoff_hours) ? $source->cutoff_hours : null;
                
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
                
                // Use availability's price_types if set, otherwise trip's price_types (normalize legacy `price` keys)
                $avail_price_types = null;
                if (!empty($source->price_types)) {
                    $avail_price_types = is_string($source->price_types)
                        ? json_decode($source->price_types, true)
                        : $source->price_types;
                }
                if (!empty($avail_price_types) && is_array($avail_price_types)) {
                    $avail->price_types = TripPricingService::resolvePriceTypes(
                        (object) ['price_types' => $avail_price_types]
                    );
                    $avail->pricing_type = 'traveler_based';
                } else {
                    $avail->price_types = $trip_price_types;
                }

                // Standard flags expected by booking UI / cards.
                $avail->is_sold_out = ($avail->seats_available ?? 0) <= 0 || ($avail->status ?? '') === 'sold_out';
                $avail->is_limited = ($avail->seats_available ?? 0) > 0 && ($avail->seats_available ?? 0) <= 5;
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

        return $this->normalizeResolvedAvailabilityObject($avail);
    }

    /**
     * Ensure optional date fields exist and return_date falls back to arrival (DB / filters may omit keys).
     */
    private function normalizeResolvedAvailabilityObject(object $avail): object
    {
        foreach (['arrival_date', 'return_date', 'departure_time', 'arrival_time'] as $key) {
            if (!property_exists($avail, $key)) {
                $avail->{$key} = null;
            }
        }

        $ret = $avail->return_date ?? null;
        $arr = $avail->arrival_date ?? null;
        if (($ret === null || $ret === '') && $arr !== null && $arr !== '') {
            $avail->return_date = $arr;
        }

        return $avail;
    }

    /**
     * Resolve a single day's availability from recurring rules (new rules engine).
     *
     * @return array|null A generated availability row (array shape) or null if no rule applies
     */
    private function resolveRecurringAvailabilityForDate(int $tripId, string $date, ?string $departureTime = null): ?array
    {
        $generated = $this->recurringAvailabilityService->generateDatesForTrip($tripId, $date, $date);
        if (empty($generated)) {
            return null;
        }

        foreach ($generated as $row) {
            if (!is_array($row)) {
                continue;
            }
            $depDate = $row['departure_date'] ?? null;
            if ($depDate !== $date) {
                continue;
            }
            $depTime = $row['departure_time'] ?? null;
            if ($departureTime !== null) {
                if ($depTime === $departureTime) {
                    return $row;
                }
                continue;
            }
            // No requested time; return first matching occurrence for that date.
            return $row;
        }

        return null;
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
        if (!is_array($decoded)) {
            return [];
        }

        // Map legacy `price` keys to original_price so card pricing never resolves to 0
        $tripStub = (object) ['price_types' => $decoded];

        return TripPricingService::resolvePriceTypes($tripStub);
    }
}
