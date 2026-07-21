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
     * @param string|null $time Departure time (HH:MM or HH:MM:SS). When the matching
     *                          rule defines time slots, this selects the slot whose
     *                          seat count applies. Optional for backward compatibility.
     * @return int Maximum capacity
     */
    public function getCapacityForDate(int $tripId, string $date, ?string $time = null): int
    {
        // Normalize to Y-m-d. The availability-date and recurring-rule columns are
        // DATE type, so a datetime input (e.g. "2026-07-18 12:30:00") breaks the
        // rule's `end_date >= %s` boundary match (the DATE end_date is treated as
        // midnight) and silently falls through to the trip default. Strip any time
        // component so matching is date-only.
        if (preg_match('/^(\d{4}-\d{2}-\d{2})/', $date, $m)) {
            $date = $m[1];
        }

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

            // A rule may define its capacity per time slot rather than on the rule
            // itself (e.g. a private tour whose vehicle seats 9 but sells one group
            // booking per departure). The public availability path already honours
            // the slot seats, so resolve them here too or departures/capacity would
            // fall through to the trip default and report the wrong number.
            $slotSeats = $this->resolveSlotSeats($matchingRule, $time);
            if ($slotSeats > 0) {
                return $slotSeats;
            }

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

    /**
     * Resolve the seat count a rule defines on its time slots.
     *
     * Returns 0 when the rule has no slots, or when no slot carries a positive
     * seat count, so the caller falls back to the existing rule/trip resolution
     * exactly as before.
     *
     * @param object $rule Recurring availability rule
     * @param string|null $time Departure time to match against (HH:MM or HH:MM:SS)
     * @return int
     */
    private function resolveSlotSeats(object $rule, ?string $time): int
    {
        $slots = $rule->time_slots ?? null;

        // Most finders hydrate this to an array, but some return the raw column.
        if (is_string($slots)) {
            $slots = json_decode($slots, true);
        }

        if (empty($slots) || !is_array($slots)) {
            return 0;
        }

        // With a known departure time, only the matching slot's seats apply.
        if ($time !== null && $time !== '') {
            $wanted = $this->normalizeTime($time);
            foreach ($slots as $slot) {
                if (!is_array($slot) || !isset($slot['departure_time'])) {
                    continue;
                }
                if ($this->normalizeTime((string) $slot['departure_time']) === $wanted) {
                    return max(0, (int) ($slot['seats'] ?? 0));
                }
            }

            return 0;
        }

        // Without a time, a single slot is unambiguous; multiple slots make up the
        // day's total capacity.
        $total = 0;
        foreach ($slots as $slot) {
            if (is_array($slot)) {
                $total += max(0, (int) ($slot['seats'] ?? 0));
            }
        }

        return $total;
    }

    /**
     * Normalize a time value to HH:MM for comparison, so "8:00", "08:00" and
     * "08:00:00" all match.
     *
     * @param string $time
     * @return string
     */
    private function normalizeTime(string $time): string
    {
        $parts = explode(':', trim($time));
        $hour = isset($parts[0]) ? (int) $parts[0] : 0;
        $minute = isset($parts[1]) ? (int) $parts[1] : 0;

        return sprintf('%02d:%02d', $hour, $minute);
    }
}
