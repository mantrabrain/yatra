<?php

namespace Yatra\Services;

use Yatra\Repositories\RecurringAvailabilityRepository;
use Yatra\Helpers\FormatHelper;
use Yatra\Helpers\ValidationHelper;

/**
 * Availability Recurring Rules Service Class
 * 
 * Handles business logic for recurring availability rules management.
 * Provides high-level operations for managing recurring trip availability patterns.
 * 
 * @package Yatra\Services
 * @since 2.0.0
 */
class AvailabilityRecurringRulesService
{
    /**
     * @var RecurringAvailabilityRepository Repository instance
     */
    private $repository;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->repository = new RecurringAvailabilityRepository();
    }

    /**
     * Create a new recurring rule
     * 
     * @param array $data Rule data
     * @return int|false Created record ID or false on failure
     */
    public function create(array $data)
    {
        // Validate required fields
        $required = ['trip_id', 'name', 'recurrence_type', 'start_date'];
        if (!ValidationHelper::validateRequired($data, $required)) {
            throw new \InvalidArgumentException('Missing required fields: ' . implode(', ', $required));
        }

        // Validate date formats
        if (!ValidationHelper::validateDate($data['start_date'])) {
            throw new \InvalidArgumentException('Invalid start_date format. Use Y-m-d format.');
        }

        if (isset($data['end_date']) && $data['end_date'] && !ValidationHelper::validateDate($data['end_date'])) {
            throw new \InvalidArgumentException('Invalid end_date format. Use Y-m-d format.');
        }

        // Validate date range
        if (isset($data['end_date']) && $data['end_date'] && $data['start_date'] > $data['end_date']) {
            throw new \InvalidArgumentException('Start date cannot be after end date.');
        }

        // Validate recurrence type
        $validTypes = ['daily', 'weekly', 'monthly', 'yearly', 'custom'];
        if (!in_array($data['recurrence_type'], $validTypes)) {
            throw new \InvalidArgumentException('Invalid recurrence_type. Must be one of: ' . implode(', ', $validTypes));
        }

        // Validate status
        $validStatuses = ['active', 'inactive', 'paused'];
        if (isset($data['status']) && !in_array($data['status'], $validStatuses)) {
            throw new \InvalidArgumentException('Invalid status. Must be one of: ' . implode(', ', $validStatuses));
        }

        // Validate availability status
        $validAvailabilityStatuses = ['available', 'unavailable', 'limited'];
        if (isset($data['availability_status']) && !in_array($data['availability_status'], $validAvailabilityStatuses)) {
            throw new \InvalidArgumentException('Invalid availability_status. Must be one of: ' . implode(', ', $validAvailabilityStatuses));
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
     * Update an existing recurring rule
     * 
     * @param int $id Rule ID
     * @param array $data Update data
     * @return bool Success status
     */
    public function update(int $id, array $data): bool
    {
        // Get existing record
        $existing = $this->repository->getById($id);
        if (!$existing) {
            throw new \InvalidArgumentException('Recurring rule not found.');
        }

        // Validate date formats if provided
        if (isset($data['start_date']) && !ValidationHelper::validateDate($data['start_date'])) {
            throw new \InvalidArgumentException('Invalid start_date format. Use Y-m-d format.');
        }

        if (isset($data['end_date']) && $data['end_date'] && !ValidationHelper::validateDate($data['end_date'])) {
            throw new \InvalidArgumentException('Invalid end_date format. Use Y-m-d format.');
        }

        // Validate date range if both dates are provided
        $startDate = $data['start_date'] ?? $existing->start_date;
        $endDate = $data['end_date'] ?? $existing->end_date;
        
        if ($endDate && $startDate > $endDate) {
            throw new \InvalidArgumentException('Start date cannot be after end date.');
        }

        // Validate recurrence type if provided
        if (isset($data['recurrence_type'])) {
            $validTypes = ['daily', 'weekly', 'monthly', 'yearly', 'custom'];
            if (!in_array($data['recurrence_type'], $validTypes)) {
                throw new \InvalidArgumentException('Invalid recurrence_type. Must be one of: ' . implode(', ', $validTypes));
            }
        }

        // Validate status if provided
        if (isset($data['status'])) {
            $validStatuses = ['active', 'inactive', 'paused'];
            if (!in_array($data['status'], $validStatuses)) {
                throw new \InvalidArgumentException('Invalid status. Must be one of: ' . implode(', ', $validStatuses));
            }
        }

        // Validate availability status if provided
        if (isset($data['availability_status'])) {
            $validAvailabilityStatuses = ['available', 'unavailable', 'limited'];
            if (!in_array($data['availability_status'], $validAvailabilityStatuses)) {
                throw new \InvalidArgumentException('Invalid availability_status. Must be one of: ' . implode(', ', $validAvailabilityStatuses));
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
     * Delete a recurring rule
     * 
     * @param int $id Rule ID
     * @return bool Success status
     */
    public function delete(int $id): bool
    {
        $existing = $this->repository->getById($id);
        if (!$existing) {
            throw new \InvalidArgumentException('Recurring rule not found.');
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
     * Get active rules for a trip within a date range
     * 
     * @param int $tripId Trip ID
     * @param string $startDate Start date (Y-m-d)
     * @param string $endDate End date (Y-m-d)
     * @return array Array of active rules
     */
    public function getActiveRulesForTrip(int $tripId, string $startDate, string $endDate): array
    {
        return $this->repository->getActiveRulesForTrip($tripId, $startDate, $endDate);
    }

    /**
     * Get all rules for a trip
     * 
     * @param int $tripId Trip ID
     * @return array Array of all rules for the trip
     */
    public function getRulesForTrip(int $tripId): array
    {
        return $this->repository->getRulesForTrip($tripId);
    }

    /**
     * Get rules that apply to a specific date
     * 
     * @param int $tripId Trip ID
     * @param string $date Date (Y-m-d)
     * @return array Array of rules that apply to the date
     */
    public function getRulesForDate(int $tripId, string $date): array
    {
        return $this->repository->getRulesForDate($tripId, $date);
    }

    /**
     * Update rule status
     * 
     * @param int $id Rule ID
     * @param string $status New status
     * @return bool Success status
     */
    public function updateStatus(int $id, string $status): bool
    {
        $validStatuses = ['active', 'inactive', 'paused'];
        if (!in_array($status, $validStatuses)) {
            throw new \InvalidArgumentException('Invalid status. Must be one of: ' . implode(', ', $validStatuses));
        }

        return $this->repository->updateStatus($id, $status);
    }

    /**
     * Delete all rules for a trip
     * 
     * @param int $tripId Trip ID
     * @return int Number of deleted records
     */
    public function deleteRulesForTrip(int $tripId): int
    {
        return $this->repository->deleteRulesForTrip($tripId);
    }

    /**
     * Add exception date to a rule
     * 
     * @param int $id Rule ID
     * @param string $date Date to add as exception (Y-m-d)
     * @return bool Success status
     */
    public function addException(int $id, string $date): bool
    {
        if (!ValidationHelper::validateDate($date)) {
            throw new \InvalidArgumentException('Invalid date format. Use Y-m-d format.');
        }

        return $this->repository->addException($id, $date);
    }

    /**
     * Remove exception date from a rule
     * 
     * @param int $id Rule ID
     * @param string $date Date to remove from exceptions (Y-m-d)
     * @return bool Success status
     */
    public function removeException(int $id, string $date): bool
    {
        if (!ValidationHelper::validateDate($date)) {
            throw new \InvalidArgumentException('Invalid date format. Use Y-m-d format.');
        }

        return $this->repository->removeException($id, $date);
    }

    /**
     * Get rules with exceptions for a trip
     * 
     * @param int $tripId Trip ID
     * @return array Array of rules that have exceptions
     */
    public function getRulesWithExceptions(int $tripId): array
    {
        return $this->repository->getRulesWithExceptions($tripId);
    }

    /**
     * Generate recurring dates for a rule within a date range
     * 
     * @param int $ruleId Rule ID
     * @param string $startDate Start date (Y-m-d)
     * @param string $endDate End date (Y-m-d)
     * @return array Array of generated dates
     */
    public function generateRecurringDates(int $ruleId, string $startDate, string $endDate): array
    {
        $rule = $this->repository->getById($ruleId);
        if (!$rule) {
            throw new \InvalidArgumentException('Recurring rule not found.');
        }

        if ($rule->status !== 'active') {
            return [];
        }

        $dates = [];
        $current = new \DateTime($startDate);
        $end = new \DateTime($endDate);

        // Ensure we don't go beyond the rule's end date
        if ($rule->end_date) {
            $ruleEnd = new \DateTime($rule->end_date);
            if ($ruleEnd < $end) {
                $end = $ruleEnd;
            }
        }

        while ($current <= $end) {
            if ($this->repository->ruleAppliesToDate($rule, $current->format('Y-m-d'))) {
                $dates[] = $current->format('Y-m-d');
            }
            $current->modify('+1 day');
        }

        return $dates;
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

        // Set default status if not provided
        if (!isset($processed['status'])) {
            $processed['status'] = 'active';
        }

        // Set default availability status if not provided
        if (!isset($processed['availability_status'])) {
            $processed['availability_status'] = 'available';
        }

        // Set created by user if not provided
        if (!isset($processed['created_by'])) {
            $processed['created_by'] = get_current_user_id();
        }

        // Sanitize text fields
        if (isset($processed['name'])) {
            $processed['name'] = sanitize_text_field($processed['name']);
        }

        if (isset($processed['notes'])) {
            $processed['notes'] = sanitize_textarea_field($processed['notes']);
        }

        // Process JSON fields
        $jsonFields = ['recurrence_pattern', 'days_of_week', 'exceptions'];
        foreach ($jsonFields as $field) {
            if (isset($processed[$field])) {
                if (is_array($processed[$field])) {
                    $processed[$field] = json_encode($processed[$field]);
                } elseif (is_string($processed[$field])) {
                    // Validate JSON format
                    json_decode($processed[$field]);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        throw new \InvalidArgumentException("Invalid JSON format for {$field}.");
                    }
                }
            }
        }

        // Validate and sanitize numeric fields
        if (isset($processed['max_bookings'])) {
            $processed['max_bookings'] = max(0, (int) $processed['max_bookings']);
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

        // Validate day values
        if (isset($processed['day_of_month'])) {
            $processed['day_of_month'] = max(1, min(31, (int) $processed['day_of_month']));
        }

        if (isset($processed['month_of_year'])) {
            $processed['month_of_year'] = max(1, min(12, (int) $processed['month_of_year']));
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
        if (isset($processed['name'])) {
            $processed['name'] = sanitize_text_field($processed['name']);
        }

        if (isset($processed['notes'])) {
            $processed['notes'] = sanitize_textarea_field($processed['notes']);
        }

        // Process JSON fields
        $jsonFields = ['recurrence_pattern', 'days_of_week', 'exceptions'];
        foreach ($jsonFields as $field) {
            if (isset($processed[$field])) {
                if (is_array($processed[$field])) {
                    $processed[$field] = json_encode($processed[$field]);
                } elseif (is_string($processed[$field])) {
                    // Validate JSON format
                    json_decode($processed[$field]);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        throw new \InvalidArgumentException("Invalid JSON format for {$field}.");
                    }
                }
            }
        }

        // Validate and sanitize numeric fields
        if (isset($processed['max_bookings'])) {
            $processed['max_bookings'] = max(0, (int) $processed['max_bookings']);
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

        // Validate day values
        if (isset($processed['day_of_month'])) {
            $processed['day_of_month'] = max(1, min(31, (int) $processed['day_of_month']));
        }

        if (isset($processed['month_of_year'])) {
            $processed['month_of_year'] = max(1, min(12, (int) $processed['month_of_year']));
        }

        return $processed;
    }

    /**
     * Process after create
     * 
     * @param int $id Created rule ID
     * @param array $data Processed data
     */
    private function processAfterCreate(int $id, array $data): void
    {
        // Log activity, trigger hooks, etc.
        do_action('yatra_availability_recurring_rule_created', $id, $data);
    }

    /**
     * Process after update
     * 
     * @param int $id Updated rule ID
     * @param array $data Processed data
     * @param object $existing Original rule
     */
    private function processAfterUpdate(int $id, array $data, object $existing): void
    {
        // Log activity, trigger hooks, etc.
        do_action('yatra_availability_recurring_rule_updated', $id, $data, $existing);
    }

    /**
     * Process before delete
     * 
     * @param object $existing Rule to be deleted
     */
    private function processBeforeDelete(object $existing): void
    {
        // Check dependencies, trigger hooks, etc.
        do_action('yatra_availability_recurring_rule_before_delete', $existing);
    }

    /**
     * Process after delete
     * 
     * @param object $deleted Deleted rule
     */
    private function processAfterDelete(object $deleted): void
    {
        // Log activity, trigger hooks, etc.
        do_action('yatra_availability_recurring_rule_deleted', $deleted);
    }
}
