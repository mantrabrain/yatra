<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\DepartureRepository;
use Yatra\Repositories\BookingDepartureRepository;
use Yatra\Repositories\BookingRepository;
use Yatra\Repositories\TripRepository;
use Yatra\Models\Departure;
use Yatra\Services\CapacityService;

/**
 * Departure Service
 * Handles business logic for trip departures
 */
class DepartureService
{
    private DepartureRepository $repository;
    private BookingDepartureRepository $bookingDepartureRepository;
    private BookingRepository $bookingRepository;
    private TripRepository $tripRepository;
    private CapacityService $capacityService;

    public function __construct(
        DepartureRepository $repository,
        ?BookingDepartureRepository $bookingDepartureRepository = null,
        ?BookingRepository $bookingRepository = null,
        ?TripRepository $tripRepository = null,
        ?CapacityService $capacityService = null
    ) {
        $this->repository = $repository;
        $this->bookingDepartureRepository = $bookingDepartureRepository ?? new BookingDepartureRepository();
        $this->bookingRepository = $bookingRepository ?? new BookingRepository();
        $this->tripRepository = $tripRepository ?? new TripRepository();
        $this->capacityService = $capacityService ?? new CapacityService();
    }

    /**
     * Create a departure (for admin editing - departures are normally auto-created)
     */
    public function create(array $data): int
    {
        // Validate required fields
        if (empty($data['trip_id'])) {
            throw new \InvalidArgumentException('Trip ID is required');
        }
        
        // Support both old 'date' and new 'start_date' format
        $startDate = $data['start_date'] ?? $data['date'] ?? '';
        if (empty($startDate)) {
            throw new \InvalidArgumentException('Start date is required');
        }
        
        // Calculate capacity based on the date if not provided
        if (empty($data['max_capacity'])) {
            $data['max_capacity'] = $this->capacityService->getCapacityForDate(
                (int) $data['trip_id'],
                $startDate
            );
            
            // If still no capacity, throw an error
            if ($data['max_capacity'] <= 0) {
                throw new \InvalidArgumentException('No valid capacity found for the selected date. Please check availability settings.');
            }
        } elseif ((int) $data['max_capacity'] < 1) {
            throw new \InvalidArgumentException('Max capacity must be at least 1');
        }
        
        // Validate date format
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate)) {
            throw new \InvalidArgumentException('Invalid date format. Use YYYY-MM-DD');
        }
        
        // Calculate end_date if not provided
        if (empty($data['end_date'])) {
            $trip = $this->tripRepository->find((int) $data['trip_id']);
            $durationDays = $trip ? ($trip->duration_days ?? 1) : 1;
            $data['end_date'] = date('Y-m-d', strtotime($startDate . ' + ' . ($durationDays - 1) . ' days'));
        }
        
        $data['start_date'] = $startDate;
        $data['date'] = $startDate; // Keep for backward compatibility
        
        // Check if departure already exists for this trip and start_date
        $existing = $this->repository->findByTripIdAndStartDate(
            (int) $data['trip_id'],
            $startDate,
            $data['time'] ?? null
        );
        
        if ($existing) {
            throw new \InvalidArgumentException('A departure already exists for this trip and date');
        }
        
        // Set defaults
        $data['source'] = $data['source'] ?? 'manual'; // Admin-created departures are 'manual'
        $data['booked_count'] = $data['booked_count'] ?? 0;
        
        // Create departure
        $id = $this->repository->create($data);
        
        // Trigger hook to sync capacity from availability
        do_action('yatra_departure_saved', $id);
        
        // Recalculate status
        $departure = $this->repository->findModel($id);
        if ($departure) {
            $this->repository->update($id, ['status' => $departure->calculateStatus()]);
        }
        
        return $id;
    }

    /**
     * Update a departure (for admin editing)
     */
    public function update(int $id, array $data): bool
    {
        $departure = $this->repository->findModel($id);
        
        if (!$departure) {
            throw new \InvalidArgumentException('Departure not found');
        }
        
        // Handle start_date and end_date
        $startDate = $data['start_date'] ?? $data['date'] ?? null;
        
        // Validate date format if provided
        if ($startDate && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate)) {
            throw new \InvalidArgumentException('Invalid date format. Use YYYY-MM-DD');
        }
        
        // Calculate end_date if start_date changed but end_date not provided
        if ($startDate && $startDate !== ($departure->start_date ?: $departure->date)) {
            if (empty($data['end_date'])) {
                $trip = $this->tripRepository->find($departure->trip_id);
                $durationDays = $trip ? ($trip->duration_days ?? 1) : 1;
                $data['end_date'] = date('Y-m-d', strtotime($startDate . ' + ' . ($durationDays - 1) . ' days'));
            }
            $data['start_date'] = $startDate;
            $data['date'] = $startDate; // Keep in sync
        }
        
        // Check for duplicate if start_date is being changed
        if ($startDate && $startDate !== ($departure->start_date ?: $departure->date)) {
            $existing = $this->repository->findByTripIdAndStartDate(
                $departure->trip_id,
                $startDate,
                $data['time'] ?? $departure->time
            );
            
            if ($existing && $existing->id !== $id) {
                throw new \InvalidArgumentException('A departure already exists for this trip and date');
            }
        }
        
        // Mark as manually edited by admin
        if (!isset($data['source'])) {
            $data['source'] = 'manual'; // Admin edits mark as manual
        }
        
        // Update departure
        $result = $this->repository->update($id, $data);
        
        // Trigger hook to sync capacity from availability
        if ($result) {
            do_action('yatra_departure_saved', $id);
        }

        // If status is being explicitly set to 'trash' (admin trash feature),
        // skip automatic status recalculation so the trashed state is preserved.
        if (isset($data['status']) && $data['status'] === 'trash') {
            return $result;
        }
        
        // Recalculate status for all other updates
        $departure = $this->repository->findModel($id);
        if ($departure) {
            $this->repository->update($id, ['status' => $departure->calculateStatus()]);
        }
        
        return $result;
    }

    /**
     * Delete a departure
     * Only allowed if source is recurring_generated and booked_count is 0
     */
    public function delete(int $id): bool
    {
        $departure = $this->repository->findModel($id);
        
        if (!$departure) {
            throw new \InvalidArgumentException('Departure not found');
        }
        
        // Only allow deletion of recurring_generated departures with no bookings
        if ($departure->source === 'recurring_generated' && $departure->booked_count === 0) {
            return $this->repository->delete($id);
        }
        
        // Manual departures or departures with bookings cannot be deleted
        throw new \InvalidArgumentException('Cannot delete departure: Manual departures or departures with bookings cannot be deleted');
    }

    /**
     * Increment booked count (when booking is created)
     */
    public function incrementBookedCount(int $id, int $amount = 1): bool
    {
        $departure = $this->repository->findModel($id);
        
        if (!$departure) {
            throw new \InvalidArgumentException('Departure not found');
        }
        
        // Check if capacity allows (only when max_capacity is set)
        $currentBooked = (int) ($departure->booked_count ?? 0);
        $maxCapacity = $departure->max_capacity !== null ? (int) $departure->max_capacity : 0;
        if ($maxCapacity > 0 && ($currentBooked + $amount > $maxCapacity)) {
            // Do not throw; just prevent exceeding capacity
            return false;
        }
        
        return $this->repository->incrementBookedCount($id, $amount);
    }

    /**
     * Decrement booked count (when booking is cancelled)
     */
    public function decrementBookedCount(int $id, int $amount = 1): bool
    {
        $departure = $this->repository->findModel($id);
        
        if (!$departure) {
            throw new \InvalidArgumentException('Departure not found');
        }
        
        return $this->repository->decrementBookedCount($id, $amount);
    }

    /**
     * Get all departures across all trips
     */
    public function getAllDepartures(array $filters = []): array
    {
        return $this->repository->findAll($filters);
    }

    /**
     * Get departures by trip ID
     */
    public function getByTripId(int $tripId, array $filters = []): array
    {
        return $this->repository->findByTripId($tripId, $filters);
    }

    /**
     * Get past departures by trip ID
     */
    public function getPastByTripId(int $tripId, array $filters = []): array
    {
        return $this->repository->findPastByTripId($tripId, $filters);
    }

    /**
     * Get upcoming departures by trip ID
     */
    public function getUpcomingByTripId(int $tripId, array $filters = []): array
    {
        return $this->repository->findUpcomingByTripId($tripId, $filters);
    }

    /**
     * Get available dates for frontend
     * Combines manual departures and dynamically generated recurring rule dates
     * 
     * @param int $tripId Trip ID
     * @param string $fromDate Start date (default: today)
     * @param string $toDate End date (default: +12 months)
     * @return array Available dates with pricing and capacity info
     */
    public function getAvailableDates(int $tripId, ?string $fromDate = null, ?string $toDate = null): array
    {
        $fromDate = $fromDate ?? date('Y-m-d');
        $toDate = $toDate ?? date('Y-m-d', strtotime('+12 months'));
        
        // Get all manual departures
        $manualDepartures = $this->repository->findByTripId($tripId, [
            'date_from' => $fromDate,
            'date_to' => $toDate,
            'include_past' => false,
        ]);
        
        // Get recurring rule service
        $ruleRepository = new \Yatra\Repositories\RecurringRuleRepository();
        $ruleService = new RecurringRuleService($ruleRepository, $this->repository);
        
        // Generate dates from recurring rules
        $recurringDates = $ruleService->generateDatesForTrip($tripId, $fromDate, $toDate);
        
        // Combine and format
        $availableDates = [];
        
        // Add manual departures
        foreach ($manualDepartures as $departure) {
            if ($departure->isAvailable()) {
                $availableDates[$departure->date] = [
                    'id' => $departure->id,
                    'date' => $departure->date,
                    'time' => $departure->time,
                    'max_capacity' => $departure->max_capacity,
                    'available_capacity' => $departure->max_capacity - $departure->booked_count,
                    'booked_count' => $departure->booked_count,
                    'status' => $departure->status,
                    'source' => $departure->source,
                    'price_override' => $departure->price_override,
                    'price_by_traveler_type' => $departure->price_by_traveler_type,
                    'is_full' => $departure->booked_count >= $departure->max_capacity,
                ];
            }
        }
        
        // Add recurring rule dates (only if no manual departure exists)
        foreach ($recurringDates as $dateInfo) {
            if (!isset($availableDates[$dateInfo['date']])) {
                $availableDates[$dateInfo['date']] = [
                    'id' => null,
                    'date' => $dateInfo['date'],
                    'time' => null,
                    'max_capacity' => $dateInfo['max_capacity'],
                    'available_capacity' => $dateInfo['max_capacity'],
                    'booked_count' => 0,
                    'status' => 'upcoming',
                    'source' => 'recurring_rule',
                    'price_override' => $dateInfo['base_price'],
                    'price_by_traveler_type' => $dateInfo['pricing_by_traveler_type'],
                    'is_full' => false,
                    'rule_id' => $dateInfo['rule_id'],
                ];
            }
        }
        
        // Sort by date
        ksort($availableDates);
        
        return array_values($availableDates);
    }

    /**
     * Recalculate all departure statuses (for cron job)
     */
    public function recalculateAllStatuses(): int
    {
        return $this->repository->recalculateAllStatuses();
    }

    /**
     * Find or create a departure for a booking
     * If departure doesn't exist, creates it automatically
     * 
     * @param int $tripId Trip ID
     * @param string $startDate Start date (YYYY-MM-DD)
     * @param string $endDate End date (YYYY-MM-DD)
     * @param int $travelersCount Number of travelers in the booking
     * @param int|null $defaultMaxCapacity Default max capacity if creating new departure (null = unlimited)
     * @param string|null $time Time in HH:MM:SS format (optional)
     * @return Departure The departure (existing or newly created)
     * @throws \Exception
     */
    public function findOrCreateForBooking(int $tripId, string $startDate, string $endDate, int $travelersCount = 0, ?int $defaultMaxCapacity = null, ?string $time = null): Departure
    {
        // Get capacity based on priority
        $maxCapacity = $this->capacityService->getCapacityForDate($tripId, $startDate);
        
        // If no capacity found from availability or rules, use the provided default
        if ($maxCapacity <= 0 && $defaultMaxCapacity !== null) {
            $maxCapacity = $defaultMaxCapacity;
        }
        // Validate date format
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate)) {
            throw new \InvalidArgumentException('Invalid start date format. Use YYYY-MM-DD');
        }
        if (!empty($endDate) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) {
            throw new \InvalidArgumentException('Invalid end date format. Use YYYY-MM-DD');
        }

        // Try to find existing departure by start_date and time
        $departure = $this->repository->findByTripIdAndStartDate($tripId, $startDate, $time);

        if ($departure) {
            // Departure exists, sync capacity from availability before returning
            if ($maxCapacity > 0 && $departure->max_capacity !== $maxCapacity) {
                $this->repository->update($departure->id, ['max_capacity' => $maxCapacity]);
                $departure->max_capacity = $maxCapacity;
            }
            return $departure;
        }

        // Departure doesn't exist, create it
        // Get trip to retrieve max_travelers and calculate end_date
        $trip = $this->tripRepository->find($tripId);
        
        // Calculate end_date if not provided
        if (empty($endDate)) {
            $durationDays = $trip ? ($trip->duration_days ?? 1) : 1;
            $endDate = date('Y-m-d', strtotime($startDate . ' + ' . ($durationDays - 1) . ' days'));
        }
        
        // Determine max capacity in priority order:
        // 1. Provided defaultMaxCapacity (if explicitly set)
        // 2. Availability date (seats_total)
        // 3. Recurring rule (max_capacity)
        // 4. Trip's max_travelers
        // 5. Default to 50
        $maxCapacity = null;
        
        if ($defaultMaxCapacity !== null) {
            $maxCapacity = $defaultMaxCapacity;
        } else {
            // Use CapacityService to get the correct capacity based on priority
            // Priority: Availability Date > Recurring Availability Rule > Trip Default
            $maxCapacity = $this->capacityService->getCapacityForDate($tripId, $startDate);
            
            // If no capacity found, use trip default or 1 as minimum
            if ($maxCapacity === null || $maxCapacity <= 0) {
                $trip = $this->tripRepository->find($tripId);
                $maxCapacity = $trip ? (int) ($trip->max_travelers ?? 1) : 1;
            }
        }

        // Get trip details to set default time if not provided
        $trip = $this->tripRepository->find($tripId);
        $defaultTime = $time;
        
        // If no time provided, try to get from trip settings or use default
        if (!$defaultTime && $trip) {
            // Check if trip has a default departure time
            $defaultTime = $trip->departure_time ?? '09:00'; // Default to 9:00 AM
        }
        
        $departureData = [
            'trip_id' => $tripId,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'date' => $startDate, // Keep for backward compatibility
            'time' => $defaultTime, // Add time (default or provided)
            'max_capacity' => $maxCapacity,
            'booked_count' => 0, // Will be incremented after creation
            'total_revenue' => 0.00, // Initialize revenue
            'source' => 'booking_created', // Created from booking
            'status' => 'upcoming', // Will be recalculated
        ];

        $departureId = $this->repository->create($departureData);
        $departure = $this->repository->findModel($departureId);

        if (!$departure) {
            throw new \RuntimeException('Failed to create departure');
        }

        return $departure;
    }

    /**
     * Link a booking to a departure
     * 
     * @param int $bookingId Booking ID
     * @param int $departureId Departure ID
     * @return bool Success
     */
    public function linkBookingToDeparture(int $bookingId, int $departureId): bool
    {
        $result = $this->bookingDepartureRepository->link($bookingId, $departureId);
        
        if ($result) {
            // Recalculate total revenue for the departure
            $this->recalculateDepartureRevenue($departureId);
        }
        
        return $result;
    }

    /**
     * Unlink a booking from a departure
     * If departure has no more bookings, mark it as cancelled
     * 
     * @param int $bookingId Booking ID
     * @param int|null $departureId Optional departure ID
     * @return bool Success
     */
    public function unlinkBookingFromDeparture(int $bookingId, ?int $departureId = null): bool
    {
        // Get departure ID if not provided
        if ($departureId === null) {
            $departureId = $this->bookingDepartureRepository->getDepartureIdForBooking($bookingId);
            if ($departureId === null) {
                return true; // No link exists
            }
        }

        // Unlink booking
        $result = $this->bookingDepartureRepository->unlink($bookingId, $departureId);
        
        if (!$result) {
            return false;
        }

        // Recalculate total revenue for the departure
        $this->recalculateDepartureRevenue($departureId);

        // Check if departure has any more bookings
        $bookingCount = $this->bookingDepartureRepository->countBookingsForDeparture($departureId);
        
        if ($bookingCount === 0) {
            // Mark departure as cancelled with note
            $this->cancelDeparture($departureId, 'Cancelled - All bookings removed');
        } else {
            // Recalculate status
            $departure = $this->repository->findModel($departureId);
            if ($departure) {
                $this->repository->update($departureId, ['status' => $departure->calculateStatus()]);
            }
        }

        return true;
    }

    /**
     * Cancel a departure (mark as cancelled with note, never delete)
     * 
     * @param int $departureId Departure ID
     * @param string $note Cancellation note
     * @return bool Success
     */
    public function cancelDeparture(int $departureId, string $note): bool
    {
        $departure = $this->repository->findModel($departureId);
        
        if (!$departure) {
            return false;
        }

        // Update status and notes
        return $this->repository->update($departureId, [
            'status' => 'cancelled',
            'notes' => $note,
        ]);
    }

    /**
     * Handle booking date change
     * Creates new departure and cancels old one
     * 
     * @param int $bookingId Booking ID
     * @param string $newStartDate New start date
     * @param string $newEndDate New end date
     * @return array {success: bool, new_departure_id: int, old_departure_id: int|null}
     */
    public function handleBookingDateChange(int $bookingId, string $newStartDate, string $newEndDate): array
    {
        // Get booking to find trip_id
        $booking = $this->bookingRepository->find($bookingId);
        if (!$booking) {
            throw new \InvalidArgumentException('Booking not found');
        }

        $tripId = (int) $booking->trip_id;
        $oldDepartureId = $this->bookingDepartureRepository->getDepartureForBooking($bookingId);

        // Get trip for max capacity
        $trip = $this->tripRepository->find($tripId);
        // Get max capacity from trip's max_travelers, or use default
        $maxCapacity = null;
        if ($trip && !empty($trip->max_travelers)) {
            $maxCapacity = (int) $trip->max_travelers;
        }

        // Find or create new departure
        $newDeparture = $this->findOrCreateForBooking($tripId, $newStartDate, $newEndDate, 0, $maxCapacity);

        // Link booking to new departure
        $this->bookingDepartureRepository->updateDepartureForBooking($bookingId, $newDeparture->id);

        // Increment booked count for new departure
        $travelersCount = (int) ($booking->travelers_count ?? 0);
        $this->incrementBookedCount($newDeparture->id, $travelersCount);

        // Handle old departure
        if ($oldDepartureId) {
            $oldBookingCount = $this->bookingDepartureRepository->countBookingsForDeparture($oldDepartureId);
            
            if ($oldBookingCount === 0) {
                // No more bookings, cancel old departure
                $this->cancelDeparture($oldDepartureId, "Cancelled - Booking date changed (Booking ID: {$bookingId})");
            } else {
                // Still has other bookings, just decrement count
                $this->decrementBookedCount($oldDepartureId, $travelersCount);
            }
        }

        return [
            'success' => true,
            'new_departure_id' => $newDeparture->id,
            'old_departure_id' => $oldDepartureId,
        ];
    }

    /**
     * Get all bookings for a departure
     * 
     * @param int $departureId Departure ID
     * @return array Array of booking objects
     */
    public function getBookingsForDeparture(int $departureId): array
    {
        // Use repository helper to get booking IDs for this departure
        $bookingIds = $this->bookingDepartureRepository->getBookingIdsForDeparture($departureId);
        
        if (empty($bookingIds)) {
            return [];
        }

        $bookings = [];
        foreach ($bookingIds as $bookingId) {
            $bookingId = (int) $bookingId;
            if ($bookingId <= 0) {
                continue;
            }
            $booking = $this->bookingRepository->find($bookingId);
            if ($booking) {
                $bookings[] = $booking;
            }
        }

        return $bookings;
    }

    /**
     * Get departure for a booking
     * 
     * @param int $bookingId Booking ID
     * @return Departure|null Departure or null
     */
    public function getDepartureForBooking(int $bookingId): ?Departure
    {
        $departureId = $this->bookingDepartureRepository->getDepartureIdForBooking($bookingId);
        
        if ($departureId === null) {
            return null;
        }

        return $this->repository->findModel($departureId);
    }

    /**
     * Check if a date matches a recurring rule
     * 
     * @param string $date Date to check (YYYY-MM-DD)
     * @param object $rule Recurring rule object
     * @return bool True if date matches the rule
     */
    private function dateMatchesRecurringRule(string $date, object $rule): bool
    {
        // Check date range
        if (!empty($rule->start_date) && $date < $rule->start_date) {
            return false;
        }
        if (!empty($rule->end_date) && $date > $rule->end_date) {
            return false;
        }

        $dayOfWeek = (int) date('w', strtotime($date)); // 0 = Sunday, 6 = Saturday
        $recurrenceType = $rule->recurrence_type ?? 'daily';
        $weekdays = is_string($rule->weekdays) ? json_decode($rule->weekdays, true) : ($rule->weekdays ?? []);

        switch ($recurrenceType) {
            case 'daily':
                return true;
            
            case 'weekly':
                return in_array($dayOfWeek, $weekdays, true);
            
            case 'monthly':
                // Check if it's the same day of month
                $ruleDay = !empty($rule->start_date) ? (int) date('d', strtotime($rule->start_date)) : null;
                $checkDay = (int) date('d', strtotime($date));
                return $ruleDay === null || $ruleDay === $checkDay;
            
            case 'custom_days':
                return in_array($dayOfWeek, $weekdays, true);
            
            default:
                return false;
        }
    }

    /**
     * Get the departure repository
     * 
     * @return \Yatra\Repositories\DepartureRepository
     */
    public function getRepository(): \Yatra\Repositories\DepartureRepository
    {
        return $this->repository;
    }
    
    /**
     * Recalculate total revenue for a departure from all linked bookings
     * 
     * @param int $departureId Departure ID
     * @return float Total revenue
     */
    public function recalculateDepartureRevenue(int $departureId): float
    {
        // Use repository helper to fetch booking IDs
        $bookingIds = $this->bookingDepartureRepository->getBookingIdsForDeparture($departureId);
        
        if (empty($bookingIds)) {
            $this->repository->update($departureId, ['total_revenue' => 0.00]);
            return 0.00;
        }

        $totalRevenue = 0.00;
        
        foreach ($bookingIds as $bookingId) {
            $bookingId = (int) $bookingId;
            if ($bookingId <= 0) {
                continue;
            }
            $booking = $this->bookingRepository->find($bookingId);
            if ($booking) {
                // Only count confirmed/pending bookings, exclude cancelled/refunded
                if (!in_array($booking->status ?? '', ['cancelled', 'refunded', 'failed'], true)) {
                    // If total_amount is not set, try to calculate from price * travelers
                    if (!empty($booking->total_amount)) {
                        $totalRevenue += (float) $booking->total_amount;
                    } else if (!empty($booking->price) && !empty($booking->traveler_count)) {
                        $totalRevenue += ((float) $booking->price * (int) $booking->traveler_count);
                    } else if (!empty($booking->price)) {
                        // Fallback to just price if traveler count not available
                        $totalRevenue += (float) $booking->price;
                    }
                }
            }
        }

        // Update departure with calculated revenue
        $this->repository->update($departureId, ['total_revenue' => $totalRevenue]);
        
        return $totalRevenue;
    }
}

