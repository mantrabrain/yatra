<?php

namespace Yatra\Services;

use Yatra\Repositories\AvailabilityRepository;
use Yatra\Helpers\FormatHelper;
use Yatra\Helpers\ValidationHelper;

/**
 * Availability Specific Dates Service Class
 * 
 * Handles business logic for specific date availability management.
 * Provides high-level operations for managing trip availability on specific dates.
 * 
 * @package Yatra\Services
 * @since 2.0.0
 */
class AvailabilitySpecificDatesService
{
    /**
     * @var AvailabilityRepository Repository instance
     */
    private $repository;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->repository = new AvailabilityRepository();
    }

    /**
     * Create a new specific date availability record
     * 
     * @param array $data Date availability data
     * @return int|false Created record ID or false on failure
     */
    public function create(array $data)
    {
        // Validate required fields
        $required = ['trip_id', 'date', 'status'];
        if (!ValidationHelper::validateRequired($data, $required)) {
            throw new \InvalidArgumentException('Missing required fields: ' . implode(', ', $required));
        }

        // Validate date format
        if (!ValidationHelper::validateDate($data['date'])) {
            throw new \InvalidArgumentException('Invalid date format. Use Y-m-d format.');
        }

        // Validate status
        $validStatuses = ['available', 'unavailable', 'limited'];
        if (!in_array($data['status'], $validStatuses)) {
            throw new \InvalidArgumentException('Invalid status. Must be one of: ' . implode(', ', $validStatuses));
        }

        // Process data before create
        $processedData = $this->processBeforeCreate($data);

        // Create record
        $id = $this->repository->create($processedData);

        if ($id) {
            // Post-process after successful create
            $this->processAfterCreate($id, $processedData);
        }

        return $id;
    }

    /**
     * Update an existing specific date availability record
     * 
     * @param int $id Record ID
     * @param array $data Update data
     * @return bool Success status
     */
    public function update(int $id, array $data): bool
    {
        // Get existing record
        $existing = $this->repository->getById($id);
        if (!$existing) {
            throw new \InvalidArgumentException('Specific date record not found.');
        }

        // Validate date format if provided
        if (isset($data['date']) && !ValidationHelper::validateDate($data['date'])) {
            throw new \InvalidArgumentException('Invalid date format. Use Y-m-d format.');
        }

        // Validate status if provided
        if (isset($data['status'])) {
            $validStatuses = ['available', 'unavailable', 'limited'];
            if (!in_array($data['status'], $validStatuses)) {
                throw new \InvalidArgumentException('Invalid status. Must be one of: ' . implode(', ', $validStatuses));
            }
        }

        // Process data before update
        $processedData = $this->processBeforeUpdate($data, $existing);

        // Update record
        $success = $this->repository->update($id, $processedData);

        if ($success) {
            // Post-process after successful update
            $this->processAfterUpdate($id, $processedData, $existing);
        }

        return $success;
    }

    /**
     * Delete a specific date availability record
     * 
     * @param int $id Record ID
     * @return bool Success status
     */
    public function delete(int $id): bool
    {
        $existing = $this->repository->getById($id);
        if (!$existing) {
            throw new \InvalidArgumentException('Specific date record not found.');
        }

        // Pre-delete processing
        $this->processBeforeDelete($existing);

        // Delete record
        $success = $this->repository->delete($id);

        if ($success) {
            // Post-delete processing
            $this->processAfterDelete($existing);
        }

        return $success;
    }

    /**
     * Get specific dates for a trip within a date range
     * 
     * @param int $tripId Trip ID
     * @param string $startDate Start date (Y-m-d)
     * @param string $endDate End date (Y-m-d)
     * @return array Array of specific date records
     */
    public function getDatesForTrip(int $tripId, string $startDate, string $endDate): array
    {
        return $this->repository->getDatesForTrip($tripId, $startDate, $endDate);
    }

    /**
     * Get available dates for a trip within a date range
     * 
     * @param int $tripId Trip ID
     * @param string $startDate Start date (Y-m-d)
     * @param string $endDate End date (Y-m-d)
     * @return array Array of available dates
     */
    public function getAvailableDates(int $tripId, string $startDate, string $endDate): array
    {
        return $this->repository->getAvailableDates($tripId, $startDate, $endDate);
    }

    /**
     * Check if a date is available for booking
     * 
     * @param int $tripId Trip ID
     * @param string $date Date (Y-m-d)
     * @return bool True if available, false otherwise
     */
    public function isDateAvailable(int $tripId, string $date): bool
    {
        return $this->repository->isDateAvailable($tripId, $date);
    }

    /**
     * Get available slots for a specific date
     * 
     * @param int $tripId Trip ID
     * @param string $date Date (Y-m-d)
     * @return int Available slots (0 if unlimited or unavailable)
     */
    public function getAvailableSlots(int $tripId, string $date): int
    {
        return $this->repository->getAvailableSlots($tripId, $date);
    }

    /**
     * Update booking count for a specific date
     * 
     * @param int $tripId Trip ID
     * @param string $date Date (Y-m-d)
     * @param int $bookingCount New booking count
     * @return bool Success status
     */
    public function updateBookingCount(int $tripId, string $date, int $bookingCount): bool
    {
        $record = $this->repository->getDateForTrip($tripId, $date);
        if (!$record) {
            throw new \InvalidArgumentException('Specific date record not found for the given trip and date.');
        }

        return $this->repository->updateBookingCount($record->id, $bookingCount);
    }

    /**
     * Increment booking count for a specific date
     * 
     * @param int $tripId Trip ID
     * @param string $date Date (Y-m-d)
     * @param int $increment Number to increment by (default: 1)
     * @return bool Success status
     */
    public function incrementBookingCount(int $tripId, string $date, int $increment = 1): bool
    {
        $record = $this->repository->getDateForTrip($tripId, $date);
        if (!$record) {
            throw new \InvalidArgumentException('Specific date record not found for the given trip and date.');
        }

        return $this->repository->incrementBookingCount($record->id, $increment);
    }

    /**
     * Decrement booking count for a specific date
     * 
     * @param int $tripId Trip ID
     * @param string $date Date (Y-m-d)
     * @param int $decrement Number to decrement by (default: 1)
     * @return bool Success status
     */
    public function decrementBookingCount(int $tripId, string $date, int $decrement = 1): bool
    {
        $record = $this->repository->getDateForTrip($tripId, $date);
        if (!$record) {
            throw new \InvalidArgumentException('Specific date record not found for the given trip and date.');
        }

        return $this->repository->decrementBookingCount($record->id, $decrement);
    }

    /**
     * Get dates with price overrides for a trip
     * 
     * @param int $tripId Trip ID
     * @param string $startDate Start date (Y-m-d)
     * @param string $endDate End date (Y-m-d)
     * @return array Array of dates with price overrides
     */
    public function getDatesWithPriceOverrides(int $tripId, string $startDate, string $endDate): array
    {
        return $this->repository->getDatesWithPriceOverrides($tripId, $startDate, $endDate);
    }

    /**
     * Delete specific dates for a trip within a date range
     * 
     * @param int $tripId Trip ID
     * @param string $startDate Start date (Y-m-d)
     * @param string $endDate End date (Y-m-d)
     * @return int Number of deleted records
     */
    public function deleteDatesInRange(int $tripId, string $startDate, string $endDate): int
    {
        return $this->repository->deleteDatesInRange($tripId, $startDate, $endDate);
    }

    /**
     * Process data before create
     * 
     * @param array $data Input data
     * @return array Processed data
     */
    private function processBeforeCreate(array $data): array
    {
        $processed = $data;

        // Set created by user if not provided
        if (!isset($processed['created_by'])) {
            $processed['created_by'] = get_current_user_id();
        }

        // Sanitize text fields
        if (isset($processed['notes'])) {
            $processed['notes'] = sanitize_textarea_field($processed['notes']);
        }

        // Validate and sanitize numeric fields
        if (isset($processed['max_bookings'])) {
            $processed['max_bookings'] = max(0, (int) $processed['max_bookings']);
        }

        if (isset($processed['current_bookings'])) {
            $processed['current_bookings'] = max(0, (int) $processed['current_bookings']);
        }

        if (isset($processed['price_override'])) {
            $processed['price_override'] = max(0, (float) $processed['price_override']);
        }

        // Validate price type
        if (isset($processed['price_type'])) {
            $validTypes = ['fixed', 'percentage'];
            if (!in_array($processed['price_type'], $validTypes)) {
                $processed['price_type'] = 'fixed';
            }
        }

        return $processed;
    }

    /**
     * Process data before update
     * 
     * @param array $data Input data
     * @param object $existing Existing record
     * @return array Processed data
     */
    private function processBeforeUpdate(array $data, object $existing): array
    {
        $processed = $data;

        // Set updated by user if not provided
        if (!isset($processed['updated_by'])) {
            $processed['updated_by'] = get_current_user_id();
        }

        // Sanitize text fields
        if (isset($processed['notes'])) {
            $processed['notes'] = sanitize_textarea_field($processed['notes']);
        }

        // Validate and sanitize numeric fields
        if (isset($processed['max_bookings'])) {
            $processed['max_bookings'] = max(0, (int) $processed['max_bookings']);
        }

        if (isset($processed['current_bookings'])) {
            $processed['current_bookings'] = max(0, (int) $processed['current_bookings']);
        }

        if (isset($processed['price_override'])) {
            $processed['price_override'] = max(0, (float) $processed['price_override']);
        }

        // Validate price type
        if (isset($processed['price_type'])) {
            $validTypes = ['fixed', 'percentage'];
            if (!in_array($processed['price_type'], $validTypes)) {
                $processed['price_type'] = 'fixed';
            }
        }

        return $processed;
    }

    /**
     * Process after create
     * 
     * @param int $id Created record ID
     * @param array $data Processed data
     */
    private function processAfterCreate(int $id, array $data): void
    {
        // Log activity, trigger hooks, etc.
        do_action('yatra_availability_specific_date_created', $id, $data);
    }

    /**
     * Process after update
     * 
     * @param int $id Updated record ID
     * @param array $data Processed data
     * @param object $existing Original record
     */
    private function processAfterUpdate(int $id, array $data, object $existing): void
    {
        // Log activity, trigger hooks, etc.
        do_action('yatra_availability_specific_date_updated', $id, $data, $existing);
    }

    /**
     * Process before delete
     * 
     * @param object $existing Record to be deleted
     */
    private function processBeforeDelete(object $existing): void
    {
        // Check dependencies, trigger hooks, etc.
        do_action('yatra_availability_specific_date_before_delete', $existing);
    }

    /**
     * Process after delete
     * 
     * @param object $deleted Deleted record
     */
    private function processAfterDelete(object $deleted): void
    {
        // Log activity, trigger hooks, etc.
        do_action('yatra_availability_specific_date_deleted', $deleted);
    }
}
