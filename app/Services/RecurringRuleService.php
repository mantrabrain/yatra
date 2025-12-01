<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\RecurringRuleRepository;
use Yatra\Repositories\DepartureRepository;
use Yatra\Models\RecurringRule;

/**
 * Recurring Rule Service
 * Handles business logic for recurring rules and dynamic date generation
 * 
 * Rules do NOT generate dates automatically in the database.
 * They only act as rules for dynamic date generation on the frontend.
 */
class RecurringRuleService
{
    private RecurringRuleRepository $ruleRepository;
    private DepartureRepository $departureRepository;

    public function __construct(
        RecurringRuleRepository $ruleRepository,
        DepartureRepository $departureRepository
    ) {
        $this->ruleRepository = $ruleRepository;
        $this->departureRepository = $departureRepository;
    }

    /**
     * Generate dates based on recurring rules for a trip
     * 
     * This method dynamically generates dates without storing them in the database.
     * It checks for manually created departures and excludes those dates.
     * 
     * @param int $tripId Trip ID
     * @param string $fromDate Start date (YYYY-MM-DD)
     * @param string $toDate End date (YYYY-MM-DD)
     * @return array Array of generated date information
     */
    public function generateDatesForTrip(int $tripId, string $fromDate, string $toDate): array
    {
        // Get active recurring rules for this trip
        $rules = $this->ruleRepository->findActiveForDateRange($tripId, $fromDate, $toDate);
        
        if (empty($rules)) {
            return [];
        }
        
        // Get all manually created departures for this date range
        $manualDepartures = $this->departureRepository->findByTripId($tripId, [
            'date_from' => $fromDate,
            'date_to' => $toDate,
            'source' => 'manual',
        ]);
        
        // Create a map of dates that have manual departures (these override rules)
        $manualDates = [];
        foreach ($manualDepartures as $departure) {
            $manualDates[$departure->date] = true;
        }
        
        $generatedDates = [];
        
        // Generate dates for each rule
        foreach ($rules as $rule) {
            $ruleDates = $this->generateDatesForRule($rule, $fromDate, $toDate);
            
            // Filter out dates that have manual departures
            foreach ($ruleDates as $date) {
                if (!isset($manualDates[$date['date']])) {
                    $generatedDates[$date['date']] = $date;
                }
            }
        }
        
        // Sort by date
        ksort($generatedDates);
        
        return array_values($generatedDates);
    }

    /**
     * Generate dates for a specific rule
     * 
     * @param RecurringRule $rule The recurring rule
     * @param string $fromDate Start date
     * @param string $toDate End date
     * @return array Array of date information
     */
    private function generateDatesForRule(RecurringRule $rule, string $fromDate, string $toDate): array
    {
        $dates = [];
        $start = max($fromDate, $rule->start_date ?? $fromDate);
        $end = min($toDate, $rule->end_date ?? $toDate);
        
        if ($start > $end) {
            return [];
        }
        
        $current = strtotime($start);
        $endTimestamp = strtotime($end);
        
        switch ($rule->recurrence_type) {
            case 'daily':
                // Generate every day
                while ($current <= $endTimestamp) {
                    $dateStr = date('Y-m-d', $current);
                    if ($rule->isActiveForDate($dateStr)) {
                        $dates[] = $this->buildDateInfo($dateStr, $rule);
                    }
                    $current = strtotime('+1 day', $current);
                }
                break;
                
            case 'weekly':
                // Generate for specified weekdays
                if (empty($rule->weekdays)) {
                    break;
                }
                
                while ($current <= $endTimestamp) {
                    $dayOfWeek = (int) date('w', $current); // 0 = Sunday, 6 = Saturday
                    $dateStr = date('Y-m-d', $current);
                    
                    if (in_array($dayOfWeek, $rule->weekdays, true) && $rule->isActiveForDate($dateStr)) {
                        $dates[] = $this->buildDateInfo($dateStr, $rule);
                    }
                    
                    $current = strtotime('+1 day', $current);
                }
                break;
                
            case 'monthly':
                // Generate for specific day of month (e.g., first Monday)
                // This is simplified - you may want to enhance this
                while ($current <= $endTimestamp) {
                    $dateStr = date('Y-m-d', $current);
                    if ($rule->isActiveForDate($dateStr)) {
                        $dates[] = $this->buildDateInfo($dateStr, $rule);
                    }
                    $current = strtotime('+1 month', $current);
                }
                break;
                
            case 'custom_days':
                // Generate for custom weekdays
                if (empty($rule->weekdays)) {
                    break;
                }
                
                while ($current <= $endTimestamp) {
                    $dayOfWeek = (int) date('w', $current);
                    $dateStr = date('Y-m-d', $current);
                    
                    if (in_array($dayOfWeek, $rule->weekdays, true) && $rule->isActiveForDate($dateStr)) {
                        $dates[] = $this->buildDateInfo($dateStr, $rule);
                    }
                    
                    $current = strtotime('+1 day', $current);
                }
                break;
        }
        
        return $dates;
    }

    /**
     * Build date information array from rule
     */
    private function buildDateInfo(string $date, RecurringRule $rule): array
    {
        return [
            'date' => $date,
            'max_capacity' => $rule->max_capacity,
            'base_price' => $rule->base_price,
            'pricing_by_traveler_type' => $rule->pricing_by_traveler_type,
            'source' => 'recurring_rule',
            'rule_id' => $rule->id,
        ];
    }

    /**
     * Get preview of next N generated dates for a rule
     * 
     * @param int $ruleId Rule ID
     * @param int $count Number of dates to preview
     * @return array Preview dates
     */
    public function getPreviewDates(int $ruleId, int $count = 10): array
    {
        $rule = $this->ruleRepository->findModel($ruleId);
        
        if (!$rule) {
            return [];
        }
        
        $fromDate = date('Y-m-d');
        $toDate = date('Y-m-d', strtotime('+12 months'));
        
        $dates = $this->generateDatesForRule($rule, $fromDate, $toDate);
        
        return array_slice($dates, 0, $count);
    }

    /**
     * Validate rule data
     */
    public function validate(array $data, ?int $id = null): void
    {
        if (empty($data['trip_id'])) {
            throw new \InvalidArgumentException('Trip ID is required');
        }
        
        if (empty($data['recurrence_type'])) {
            throw new \InvalidArgumentException('Recurrence type is required');
        }
        
        $validTypes = ['daily', 'weekly', 'monthly', 'custom_days'];
        if (!in_array($data['recurrence_type'], $validTypes, true)) {
            throw new \InvalidArgumentException('Invalid recurrence type. Must be: ' . implode(', ', $validTypes));
        }
        
        // Validate weekdays for weekly/custom_days
        if (in_array($data['recurrence_type'], ['weekly', 'custom_days'], true)) {
            if (empty($data['weekdays']) || !is_array($data['weekdays'])) {
                throw new \InvalidArgumentException('Weekdays are required for weekly/custom_days rules');
            }
            
            foreach ($data['weekdays'] as $day) {
                $dayInt = (int) $day;
                if ($dayInt < 0 || $dayInt > 6) {
                    throw new \InvalidArgumentException('Weekdays must be 0-6 (Sunday-Saturday)');
                }
            }
        }
        
        // Validate dates
        if (!empty($data['start_date']) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['start_date'])) {
            throw new \InvalidArgumentException('Invalid start date format. Use YYYY-MM-DD');
        }
        
        if (!empty($data['end_date'])) {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['end_date'])) {
                throw new \InvalidArgumentException('Invalid end date format. Use YYYY-MM-DD');
            }
            
            if (!empty($data['start_date']) && strtotime($data['end_date']) < strtotime($data['start_date'])) {
                throw new \InvalidArgumentException('End date must be after start date');
            }
        }
        
        // Validate capacity
        if (isset($data['max_capacity']) && (int) $data['max_capacity'] < 1) {
            throw new \InvalidArgumentException('Max capacity must be at least 1');
        }
    }

    /**
     * Create a recurring rule
     */
    public function create(array $data): int
    {
        $this->validate($data);
        return $this->ruleRepository->create($data);
    }

    /**
     * Update a recurring rule
     */
    public function update(int $id, array $data): bool
    {
        $this->validate($data, $id);
        return $this->ruleRepository->update($id, $data);
    }

    /**
     * Delete a recurring rule
     */
    public function delete(int $id): bool
    {
        return $this->ruleRepository->delete($id);
    }

    /**
     * Get rules by trip ID
     */
    public function getByTripId(int $tripId, bool $activeOnly = false): array
    {
        return $this->ruleRepository->findByTripId($tripId, $activeOnly);
    }
}

