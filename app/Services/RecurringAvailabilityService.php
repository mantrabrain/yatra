<?php
/**
 * Recurring Availability Service
 * Handles business logic for recurring availability rules and date generation
 * 
 * This is a FREE feature - no Pro plugin required
 * 
 * @package Yatra\Services
 * @since 3.0.0
 */

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\RecurringAvailabilityRepository;

class RecurringAvailabilityService
{
    private RecurringAvailabilityRepository $repository;

    public function __construct(RecurringAvailabilityRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Validate rule data
     */
    public function validate(array $data, ?int $id = null): void
    {
        // For updates (when $id is provided), allow partial updates
        $isUpdate = $id !== null;
        
        // If this is just a status update or other partial update, skip full validation
        $isPartialUpdate = $isUpdate && count($data) <= 2; // status, or status + one other field
        
        if ($isPartialUpdate) {
            // For partial updates, only validate what's provided
            if (isset($data['status']) && !in_array($data['status'], ['active', 'inactive'], true)) {
                throw new \InvalidArgumentException('Invalid status. Must be active or inactive');
            }
            return; // Skip full validation for partial updates
        }
        
        // Full validation for create or complete updates
        // Required fields
        if (empty($data['trip_id'])) {
            throw new \InvalidArgumentException('Trip ID is required');
        }
        
        if (empty($data['rule_type'])) {
            throw new \InvalidArgumentException('Rule type is required');
        }
        
        if (empty($data['start_date'])) {
            throw new \InvalidArgumentException('Start date is required');
        }
        
        // Validate rule type
        $validTypes = ['weekly', 'monthly', 'interval'];
        if (!in_array($data['rule_type'], $validTypes, true)) {
            throw new \InvalidArgumentException('Invalid rule type. Must be: ' . implode(', ', $validTypes));
        }
        
        // Validate based on rule type
        switch ($data['rule_type']) {
            case 'weekly':
                if (empty($data['days_of_week'])) {
                    throw new \InvalidArgumentException('Days of week is required for weekly rules');
                }
                // Validate days are 0-6
                $days = is_array($data['days_of_week']) 
                    ? $data['days_of_week'] 
                    : explode(',', $data['days_of_week']);
                foreach ($days as $day) {
                    if ((int) $day < 0 || (int) $day > 6) {
                        throw new \InvalidArgumentException('Days of week must be 0-6 (Sun-Sat)');
                    }
                }
                break;
                
            case 'monthly':
                if (empty($data['week_of_month'])) {
                    throw new \InvalidArgumentException('Week of month is required for monthly rules');
                }
                if (!isset($data['day_of_week']) || $data['day_of_week'] === '') {
                    throw new \InvalidArgumentException('Day of week is required for monthly rules');
                }
                $validWeeks = ['first', 'second', 'third', 'fourth', 'last'];
                if (!in_array($data['week_of_month'], $validWeeks, true)) {
                    throw new \InvalidArgumentException('Invalid week of month');
                }
                break;
                
            case 'interval':
                if (empty($data['interval_days']) || (int) $data['interval_days'] < 1) {
                    throw new \InvalidArgumentException('Interval days is required and must be at least 1');
                }
                break;
        }
        
        // Validate date format
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['start_date'])) {
            throw new \InvalidArgumentException('Invalid start date format. Use YYYY-MM-DD');
        }
        
        if (!empty($data['end_date'])) {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['end_date'])) {
                throw new \InvalidArgumentException('Invalid end date format. Use YYYY-MM-DD');
            }
            if (strtotime($data['end_date']) < strtotime($data['start_date'])) {
                throw new \InvalidArgumentException('End date must be after start date');
            }
        }
        
        // Validate pricing
        if (isset($data['original_price']) && (float) $data['original_price'] < 0) {
            throw new \InvalidArgumentException('Price cannot be negative');
        }
        
        if (isset($data['seats_total']) && (int) $data['seats_total'] < 1) {
            throw new \InvalidArgumentException('Seats must be at least 1');
        }
    }

    /**
     * Create a new rule
     */
    public function create(array $data): int
    {
        $this->validate($data);
        
        // Convert days array to string if needed
        if (isset($data['days_of_week']) && is_array($data['days_of_week'])) {
            $data['days_of_week'] = implode(',', $data['days_of_week']);
        }
        
        return $this->repository->create($data);
    }

    /**
     * Update a rule
     */
    public function update(int $id, array $data): bool
    {
        $this->validate($data, $id);
        
        // Convert days array to string if needed
        if (isset($data['days_of_week']) && is_array($data['days_of_week'])) {
            $data['days_of_week'] = implode(',', $data['days_of_week']);
        }
        
        return $this->repository->update($id, $data);
    }

    /**
     * Delete a rule
     */
    public function delete(int $id): bool
    {
        return $this->repository->delete($id);
    }

    /**
     * Get rules by trip ID
     */
    public function getByTripId(int $tripId, array $filters = []): array
    {
        return $this->repository->findByTripId($tripId, $filters);
    }

    /**
     * Count rules by trip ID
     */
    public function countByTripId(int $tripId, array $filters = []): int
    {
        return $this->repository->countByTripId($tripId, $filters);
    }

    /**
     * Get status counts for recurring rules by trip ID
     */
    public function getStatusCounts(int $tripId): array
    {
        return $this->repository->getStatusCounts(['trip_id' => $tripId]);
    }

    /**
     * Find rule by ID
     */
    public function find(int $id): ?object
    {
        return $this->repository->find($id);
    }

    /**
     * Generate availability dates from rules for a trip within a date range
     */
    public function generateDatesForTrip(int $tripId, string $fromDate, string $toDate): array
    {
        $rules = $this->repository->getActiveRulesForDateRange($tripId, $fromDate, $toDate);
        
        $allDates = [];
        
        foreach ($rules as $rule) {
            $dates = $this->generateDatesFromRule($rule, $fromDate, $toDate);
            $allDates = array_merge($allDates, $dates);
        }
        
        // Sort by date
        usort($allDates, function ($a, $b) {
            return strcmp($a['departure_date'], $b['departure_date']);
        });
        
        // Remove duplicates (keep first occurrence - higher priority rule)
        $uniqueDates = [];
        $seenDates = [];
        
        foreach ($allDates as $date) {
            $key = $date['departure_date'] . '_' . ($date['departure_time'] ?? '');
            if (!isset($seenDates[$key])) {
                $seenDates[$key] = true;
                $uniqueDates[] = $date;
            }
        }
        
        return $uniqueDates;
    }

    /**
     * Generate dates from a single rule
     */
    public function generateDatesFromRule(object $rule, string $fromDate, string $toDate): array
    {
        // Clamp dates to rule's active period
        $ruleStart = $rule->start_date;
        $ruleEnd = $rule->end_date ?: $toDate;
        
        $effectiveFrom = max($fromDate, $ruleStart);
        $effectiveTo = min($toDate, $ruleEnd);
        
        if ($effectiveFrom > $effectiveTo) {
            return [];
        }
        
        $dates = [];
        
        switch ($rule->rule_type) {
            case 'weekly':
                $dates = $this->generateWeeklyDates($rule, $effectiveFrom, $effectiveTo);
                break;
            case 'monthly':
                $dates = $this->generateMonthlyDates($rule, $effectiveFrom, $effectiveTo);
                break;
            case 'interval':
                $dates = $this->generateIntervalDates($rule, $effectiveFrom, $effectiveTo);
                break;
        }
        
        return $dates;
    }

    /**
     * Generate weekly recurring dates
     */
    private function generateWeeklyDates(object $rule, string $fromDate, string $toDate): array
    {
        $dates = [];
        $targetDays = $rule->days_of_week_array;
        $excludedDates = $rule->excluded_dates;
        $selectedMonths = !empty($rule->months) ? $rule->months : [];
        
        $current = strtotime($fromDate);
        $end = strtotime($toDate);
        $today = strtotime('today');
        
        while ($current <= $end) {
            $dayOfWeek = (int) date('w', $current);
            $dateStr = date('Y-m-d', $current);
            $month = (int) date('n', $current); // 1-12
            
            // Check if month is allowed (if months filter is set)
            if (!empty($selectedMonths) && !in_array($month, $selectedMonths, true)) {
                $current = strtotime('+1 day', $current);
                continue;
            }
            
            if (in_array($dayOfWeek, $targetDays, true)) {
                // Check if not excluded
                if (!in_array($dateStr, $excludedDates, true)) {
                    // Check cutoff
                    if ($this->isBookable($current, $rule)) {
                        $generatedDates = $this->createAvailabilityFromRule($rule, $dateStr, $dayOfWeek);
                        $dates = array_merge($dates, $generatedDates);
                    }
                }
            }
            
            $current = strtotime('+1 day', $current);
        }
        
        return $dates;
    }

    /**
     * Generate monthly recurring dates (e.g., "last Sunday of each month")
     */
    private function generateMonthlyDates(object $rule, string $fromDate, string $toDate): array
    {
        $dates = [];
        $weekOfMonth = $rule->week_of_month;
        $dayOfWeek = (int) $rule->day_of_week;
        $excludedDates = $rule->excluded_dates;
        $selectedMonths = !empty($rule->months) ? $rule->months : [];
        
        // Start from the first day of the starting month
        $current = strtotime(date('Y-m-01', strtotime($fromDate)));
        $end = strtotime($toDate);
        
        while ($current <= $end) {
            $year = (int) date('Y', $current);
            $month = (int) date('n', $current);
            
            // Check if month is allowed (if months filter is set)
            if (!empty($selectedMonths) && !in_array($month, $selectedMonths, true)) {
                $current = strtotime('first day of next month', $current);
                continue;
            }
            
            $targetDate = $this->getNthWeekdayOfMonth($year, $month, $weekOfMonth, $dayOfWeek);
            
            if ($targetDate) {
                $targetTimestamp = strtotime($targetDate);
                
                // Check if within range
                if ($targetTimestamp >= strtotime($fromDate) && $targetTimestamp <= $end) {
                    // Check if not excluded
                    if (!in_array($targetDate, $excludedDates, true)) {
                        // Check cutoff
                        if ($this->isBookable($targetTimestamp, $rule)) {
                            $generatedDates = $this->createAvailabilityFromRule($rule, $targetDate, $dayOfWeek);
                            $dates = array_merge($dates, $generatedDates);
                        }
                    }
                }
            }
            
            // Move to next month
            $current = strtotime('first day of next month', $current);
        }
        
        return $dates;
    }

    /**
     * Generate interval recurring dates (every X days)
     */
    private function generateIntervalDates(object $rule, string $fromDate, string $toDate): array
    {
        $dates = [];
        $intervalDays = (int) $rule->interval_days;
        $excludedDates = $rule->excluded_dates;
        $selectedMonths = !empty($rule->months) ? $rule->months : [];
        
        // Start from interval_start_date or rule start_date
        $referenceDate = $rule->interval_start_date ?? $rule->start_date;
        $reference = strtotime($referenceDate);
        $from = strtotime($fromDate);
        $end = strtotime($toDate);
        
        // Find first occurrence on or after fromDate
        if ($reference < $from) {
            $daysDiff = floor(($from - $reference) / 86400);
            $intervalsToSkip = ceil($daysDiff / $intervalDays);
            $reference = strtotime("+{$intervalsToSkip} * {$intervalDays} days", $reference);
        }
        
        $current = $reference;
        
        while ($current <= $end) {
            if ($current >= $from) {
                $dateStr = date('Y-m-d', $current);
                $dayOfWeek = (int) date('w', $current);
                $month = (int) date('n', $current); // 1-12
                
                // Check if month is allowed (if months filter is set)
                if (empty($selectedMonths) || in_array($month, $selectedMonths, true)) {
                    // Check if not excluded
                    if (!in_array($dateStr, $excludedDates, true)) {
                        // Check cutoff
                        if ($this->isBookable($current, $rule)) {
                            $generatedDates = $this->createAvailabilityFromRule($rule, $dateStr, $dayOfWeek);
                            $dates = array_merge($dates, $generatedDates);
                        }
                    }
                }
            }
            
            $current = strtotime("+{$intervalDays} days", $current);
        }
        
        return $dates;
    }

    /**
     * Get the Nth weekday of a month (e.g., "last Sunday of January 2025")
     */
    private function getNthWeekdayOfMonth(int $year, int $month, string $position, int $dayOfWeek): ?string
    {
        $dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        $dayName = $dayNames[$dayOfWeek];
        
        switch ($position) {
            case 'first':
                $descriptor = "first {$dayName}";
                break;
            case 'second':
                $descriptor = "second {$dayName}";
                break;
            case 'third':
                $descriptor = "third {$dayName}";
                break;
            case 'fourth':
                $descriptor = "fourth {$dayName}";
                break;
            case 'last':
                $descriptor = "last {$dayName}";
                break;
            default:
                return null;
        }
        
        $monthName = date('F', mktime(0, 0, 0, $month, 1, $year));
        $dateStr = "{$descriptor} of {$monthName} {$year}";
        
        $timestamp = strtotime($dateStr);
        
        if ($timestamp === false) {
            return null;
        }
        
        // Verify it's in the correct month (edge case for "last" crossing months)
        if ((int) date('n', $timestamp) !== $month) {
            return null;
        }
        
        return date('Y-m-d', $timestamp);
    }

    /**
     * Check if a date is bookable based on cutoff rules
     */
    private function isBookable(int $timestamp, object $rule): bool
    {
        $cutoffHours = (int) ($rule->cutoff_hours ?? 24);
        $departureTime = $rule->departure_time ?? '00:00:00';
        
        $departureTimestamp = strtotime(date('Y-m-d', $timestamp) . ' ' . $departureTime);
        $cutoffTimestamp = $departureTimestamp - ($cutoffHours * 3600);
        
        // Check advance booking limit
        if (!empty($rule->advance_booking_days)) {
            $maxBookingDate = strtotime('+' . (int) $rule->advance_booking_days . ' days');
            if ($timestamp > $maxBookingDate) {
                return false;
            }
        }
        
        return time() < $cutoffTimestamp;
    }

    /**
     * Create availability array from rule
     * For single-day trips with multiple time slots, returns an array of availabilities
     */
    private function createAvailabilityFromRule(object $rule, string $date, int $dayOfWeek): array
    {
        // Check for day-specific overrides
        $dayOverrides = $rule->day_overrides[$dayOfWeek] ?? [];
        
        // If rule has time_slots, create separate availability for each slot
        if (!empty($rule->time_slots) && is_array($rule->time_slots)) {
            $availabilities = [];
            foreach ($rule->time_slots as $index => $slot) {
                $slotPrice = $slot['price'] ?? $dayOverrides['original_price'] ?? $rule->original_price;
                $slotSeats = $slot['seats'] ?? $dayOverrides['seats_total'] ?? $rule->seats_total;
                $slotTravelerPricing = $slot['traveler_pricing'] ?? $rule->traveler_pricing ?? [];
                
                $availabilities[] = [
                    'id' => 'rule_' . $rule->id . '_' . $date . '_slot_' . $index,
                    'rule_id' => $rule->id,
                    'trip_id' => $rule->trip_id,
                    'departure_date' => $date,
                    'departure_time' => $slot['departure_time'] ?? null,
                    'arrival_time' => $slot['arrival_time'] ?? null,
                    'return_date' => $date, // Same day for day trips
                    'seats_total' => (int) $slotSeats,
                    'seats_available' => (int) $slotSeats,
                    'original_price' => $slotPrice ? (float) $slotPrice : null,
                    'discounted_price' => $slotPrice ? (float) $slotPrice : null,
                    'from_location' => $rule->from_location,
                    'to_location' => $rule->to_location,
                    'from_latitude' => $rule->from_latitude ?? null,
                    'from_longitude' => $rule->from_longitude ?? null,
                    'to_latitude' => $rule->to_latitude ?? null,
                    'to_longitude' => $rule->to_longitude ?? null,
                    'cutoff_hours' => $rule->cutoff_hours,
                    'status' => 'available',
                    'is_recurring' => true,
                    'rule_name' => $rule->name,
                    'slot_index' => $index,
                    'pricing_type' => $rule->pricing_type ?? 'regular',
                    'traveler_pricing' => $slotTravelerPricing,
                ];
            }
            return $availabilities;
        }
        
        // Default: single availability per date
        $originalPrice = $dayOverrides['original_price'] ?? $rule->original_price;
        $salePrice = $dayOverrides['sale_price'] ?? $rule->sale_price ?? $originalPrice;
        $seats = $dayOverrides['seats_total'] ?? $rule->seats_total;
        $travelerPricing = $rule->traveler_pricing ?? [];
        
        return [[
            'id' => 'rule_' . $rule->id . '_' . $date,
            'rule_id' => $rule->id,
            'trip_id' => $rule->trip_id,
            'departure_date' => $date,
            'departure_time' => $rule->departure_time,
            'arrival_time' => $rule->arrival_time,
            'return_date' => $date, // Same day for day trips
            'seats_total' => (int) $seats,
            'seats_available' => (int) $seats, // Will be adjusted by actual bookings
            'original_price' => $originalPrice ? (float) $originalPrice : null,
            'discounted_price' => $salePrice ? (float) $salePrice : null,
            'from_location' => $rule->from_location,
            'to_location' => $rule->to_location,
            'from_latitude' => $rule->from_latitude ?? null,
            'from_longitude' => $rule->from_longitude ?? null,
            'to_latitude' => $rule->to_latitude ?? null,
            'to_longitude' => $rule->to_longitude ?? null,
            'cutoff_hours' => $rule->cutoff_hours,
            'status' => 'available',
            'is_recurring' => true,
            'rule_name' => $rule->name,
            'pricing_type' => $rule->pricing_type ?? 'regular',
            'traveler_pricing' => $travelerPricing,
        ]];
    }

    /**
     * Preview generated dates (for admin UI)
     */
    public function previewDates(array $ruleData, int $limit = 20): array
    {
        // Create a temporary rule object
        $rule = (object) $ruleData;
        $rule->excluded_dates = $rule->excluded_dates ?? [];
        $rule->day_overrides = $rule->day_overrides ?? [];
        $rule->days_of_week_array = isset($rule->days_of_week) 
            ? (is_array($rule->days_of_week) ? $rule->days_of_week : array_map('intval', explode(',', (string) $rule->days_of_week)))
            : [];
        
        // Parse time_slots if it's a JSON string
        if (isset($rule->time_slots) && is_string($rule->time_slots)) {
            $rule->time_slots = json_decode($rule->time_slots, true) ?: [];
        }
        
        // Generate for next 365 days or until end_date
        $startDate = $rule->start_date ?? date('Y-m-d');
        $fromDate = $startDate >= date('Y-m-d') ? $startDate : date('Y-m-d');
        $toDate = !empty($rule->end_date) ? $rule->end_date : date('Y-m-d', strtotime('+365 days'));
        
        $dates = $this->generateDatesFromRule($rule, $fromDate, $toDate);
        
        return [
            'total' => count($dates),
            'dates' => $limit > 0 ? array_slice($dates, 0, $limit) : $dates,
            'excluded_count' => count($rule->excluded_dates),
        ];
    }
}

