<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\AvailabilityRepository;
use Yatra\Repositories\RecurringAvailabilityRepository;
use Yatra\Repositories\TripRepository;

class CapacityService
{
    private AvailabilityRepository $availabilityRepository;
    private RecurringAvailabilityRepository $recurringAvailabilityRepository;
    private TripRepository $tripRepository;

    public function __construct(
        ?AvailabilityRepository $availabilityRepository = null,
        ?RecurringAvailabilityRepository $recurringAvailabilityRepository = null,
        ?TripRepository $tripRepository = null
    ) {
        $this->availabilityRepository = $availabilityRepository ?? new AvailabilityRepository();
        $this->recurringAvailabilityRepository = $recurringAvailabilityRepository ?? new RecurringAvailabilityRepository();
        $this->tripRepository = $tripRepository ?? new TripRepository();
    }

    /**
     * Get capacity for a specific trip and date based on priority
     * 
     * @param int $tripId Trip ID
     * @param string $date Date in YYYY-MM-DD format
     * @return int Maximum capacity
     */
    public function getCapacityForDate(int $tripId, string $date): int
    {
        // 1. Check Availability Date first (specific date overrides)
        $availability = $this->availabilityRepository->findByTripIdAndDate($tripId, $date);
        if ($availability && isset($availability->seats_total) && $availability->seats_total > 0) {
            return (int) $availability->seats_total;
        }

        // 2. Check Recurring Availability Rules
        $recurringRules = $this->recurringAvailabilityRepository->findActiveRulesForDate($tripId, $date);
        if (!empty($recurringRules)) {
            // Sort by priority (if applicable) and get the first matching rule
            $matchingRule = reset($recurringRules);
            $seats = (int) ($matchingRule->seats_total ?? 0);
            if ($seats <= 0 && !empty($matchingRule->capacity_value)) {
                $capType = $matchingRule->capacity_type ?? 'fixed';
                if ($capType === 'fixed') {
                    $seats = (int) $matchingRule->capacity_value;
                }
            }
            if ($seats > 0) {
                return $seats;
            }
        }

        // 3. Fall back to trip's default capacity (column is max_travelers; max_travellers kept for legacy rows)
        $trip = $this->tripRepository->find($tripId);
        if (!$trip) {
            return 0;
        }

        $cap = (int) ($trip->max_travelers ?? $trip->max_travellers ?? 0);

        return $cap > 0 ? $cap : 0;
    }
}
