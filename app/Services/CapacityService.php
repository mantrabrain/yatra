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
            // Recurring rules use 'seats_total' field for capacity
            if (isset($matchingRule->seats_total) && $matchingRule->seats_total > 0) {
                return (int) $matchingRule->seats_total;
            }
        }

        // 3. Fall back to trip's default capacity
        $trip = $this->tripRepository->find($tripId);
        return $trip ? (int) ($trip->max_travellers ?? 0) : 0;
    }
}
