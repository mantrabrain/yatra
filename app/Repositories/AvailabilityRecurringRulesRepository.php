<?php

namespace Yatra\Repositories;

use Yatra\Database\Tables\TripAvailabilityRulesTable;
use Yatra\Repositories\BaseRepository;

/**
 * Availability Recurring Rules Repository Class
 * 
 * Handles data operations for recurring availability rules.
 * Provides methods for CRUD operations and complex queries.
 * 
 * @package Yatra\Repositories
 * @since 2.0.0
 */
class AvailabilityRecurringRulesRepository extends BaseRepository
{
    /**
     * Constructor
     */
    public function __construct()
    {
        parent::__construct(TripAvailabilityRulesTable::getTableName());
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
        $table = esc_sql($this->table);
        
        $sql = "SELECT * FROM `{$table}` 
                WHERE `trip_id` = %d 
                AND `status` = 'active'
                AND (
                    (`start_date` <= %s AND (`end_date` IS NULL OR `end_date` >= %s))
                )
                ORDER BY `created_at` DESC";
        
        $query = $this->wpdb->prepare($sql, $tripId, $endDate, $startDate);
        return $this->wpdb->get_results($query) ?: [];
    }

    /**
     * Get all rules for a trip
     * 
     * @param int $tripId Trip ID
     * @return array Array of all rules for the trip
     */
    public function getRulesForTrip(int $tripId): array
    {
        $table = esc_sql($this->table);
        
        $sql = "SELECT * FROM `{$table}` 
                WHERE `trip_id` = %d 
                ORDER BY `created_at` DESC";
        
        $query = $this->wpdb->prepare($sql, $tripId);
        return $this->wpdb->get_results($query) ?: [];
    }

    /**
     * Get active rules by recurrence type
     * 
     * @param int $tripId Trip ID
     * @param string $recurrenceType Recurrence type (daily, weekly, monthly, yearly)
     * @return array Array of rules with specified recurrence type
     */
    public function getRulesByRecurrenceType(int $tripId, string $recurrenceType): array
    {
        $table = esc_sql($this->table);
        
        $sql = "SELECT * FROM `{$table}` 
                WHERE `trip_id` = %d 
                AND `recurrence_type` = %s 
                AND `status` = 'active'
                ORDER BY `created_at` DESC";
        
        $query = $this->wpdb->prepare($sql, $tripId, $recurrenceType);
        return $this->wpdb->get_results($query) ?: [];
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
        $table = esc_sql($this->table);
        
        $sql = "SELECT * FROM `{$table}` 
                WHERE `trip_id` = %d 
                AND `status` = 'active'
                AND `start_date` <= %s
                AND (`end_date` IS NULL OR `end_date` >= %s)
                ORDER BY `created_at` DESC";
        
        $query = $this->wpdb->prepare($sql, $tripId, $date, $date);
        $rules = $this->wpdb->get_results($query) ?: [];
        
        // Filter rules that actually apply to this date
        return array_filter($rules, function($rule) use ($date) {
            return $this->ruleAppliesToDate($rule, $date);
        });
    }

    /**
     * Check if a rule applies to a specific date
     * 
     * @param object $rule Rule object
     * @param string $date Date (Y-m-d)
     * @return bool True if rule applies to date
     */
    private function ruleAppliesToDate(object $rule, string $date): bool
    {
        $ruleDate = new \DateTime($date);
        $startDate = new \DateTime($rule->start_date);
        
        // Check if date is within rule's date range
        if ($ruleDate < $startDate) {
            return false;
        }
        
        if ($rule->end_date) {
            $endDate = new \DateTime($rule->end_date);
            if ($ruleDate > $endDate) {
                return false;
            }
        }
        
        // Check exceptions
        if ($rule->exceptions) {
            $exceptions = json_decode($rule->exceptions, true);
            if (is_array($exceptions) && in_array($date, $exceptions)) {
                return false;
            }
        }
        
        // Check recurrence pattern
        switch ($rule->recurrence_type) {
            case 'daily':
                return true;
                
            case 'weekly':
                if ($rule->days_of_week) {
                    $daysOfWeek = json_decode($rule->days_of_week, true);
                    $dayOfWeek = (int) $ruleDate->format('w'); // 0 = Sunday, 6 = Saturday
                    return in_array($dayOfWeek, $daysOfWeek);
                }
                return true;
                
            case 'monthly':
                if ($rule->day_of_month) {
                    $dayOfMonth = (int) $ruleDate->format('j'); // 1-31
                    return $dayOfMonth === (int) $rule->day_of_month;
                }
                return true;
                
            case 'yearly':
                if ($rule->month_of_year && $rule->day_of_month) {
                    $monthOfYear = (int) $ruleDate->format('n'); // 1-12
                    $dayOfMonth = (int) $ruleDate->format('j'); // 1-31
                    return $monthOfYear === (int) $rule->month_of_year 
                           && $dayOfMonth === (int) $rule->day_of_month;
                }
                return true;
                
            case 'custom':
                // Custom patterns would be handled by the recurrence_pattern JSON
                if ($rule->recurrence_pattern) {
                    $pattern = json_decode($rule->recurrence_pattern, true);
                    return $this->checkCustomPattern($pattern, $date);
                }
                return true;
                
            default:
                return true;
        }
    }

    /**
     * Check custom recurrence pattern
     * 
     * @param array $pattern Pattern configuration
     * @param string $date Date to check
     * @return bool True if pattern matches date
     */
    private function checkCustomPattern(array $pattern, string $date): bool
    {
        // This would implement custom pattern logic
        // For now, return true as a fallback
        return true;
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
        $table = esc_sql($this->table);
        
        $sql = "UPDATE `{$table}` 
                SET `status` = %s, `updated_at` = NOW()
                WHERE `id` = %d";
        
        $query = $this->wpdb->prepare($sql, $status, $id);
        return (bool) $this->wpdb->query($query);
    }

    /**
     * Delete all rules for a trip
     * 
     * @param int $tripId Trip ID
     * @return int Number of deleted records
     */
    public function deleteRulesForTrip(int $tripId): int
    {
        $table = esc_sql($this->table);
        
        $sql = "DELETE FROM `{$table}` 
                WHERE `trip_id` = %d";
        
        $query = $this->wpdb->prepare($sql, $tripId);
        return (int) $this->wpdb->query($query);
    }

    /**
     * Get rules with exceptions for a trip
     * 
     * @param int $tripId Trip ID
     * @return array Array of rules that have exceptions
     */
    public function getRulesWithExceptions(int $tripId): array
    {
        $table = esc_sql($this->table);
        
        $sql = "SELECT * FROM `{$table}` 
                WHERE `trip_id` = %d 
                AND `exceptions` IS NOT NULL
                AND `exceptions` != 'null'
                ORDER BY `created_at` DESC";
        
        $query = $this->wpdb->prepare($sql, $tripId);
        return $this->wpdb->get_results($query) ?: [];
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
        $table = esc_sql($this->table);
        
        // Get current exceptions
        $sql = "SELECT `exceptions` FROM `{$table}` WHERE `id` = %d";
        $query = $this->wpdb->prepare($sql, $id);
        $currentExceptions = $this->wpdb->get_var($query);
        
        $exceptions = [];
        if ($currentExceptions) {
            $decoded = json_decode($currentExceptions, true);
            if (is_array($decoded)) {
                $exceptions = $decoded;
            }
        }
        
        // Add new exception if not already present
        if (!in_array($date, $exceptions)) {
            $exceptions[] = $date;
            $exceptionsJson = json_encode($exceptions);
            
            $updateSql = "UPDATE `{$table}` 
                          SET `exceptions` = %s, `updated_at` = NOW()
                          WHERE `id` = %d";
            
            $updateQuery = $this->wpdb->prepare($updateSql, $exceptionsJson, $id);
            return (bool) $this->wpdb->query($updateQuery);
        }
        
        return true; // Already exists
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
        $table = esc_sql($this->table);
        
        // Get current exceptions
        $sql = "SELECT `exceptions` FROM `{$table}` WHERE `id` = %d";
        $query = $this->wpdb->prepare($sql, $id);
        $currentExceptions = $this->wpdb->get_var($query);
        
        if ($currentExceptions) {
            $decoded = json_decode($currentExceptions, true);
            if (is_array($decoded)) {
                $exceptions = array_filter($decoded, function($exception) use ($date) {
                    return $exception !== $date;
                });
                $exceptionsJson = json_encode(array_values($exceptions));
                
                $updateSql = "UPDATE `{$table}` 
                              SET `exceptions` = %s, `updated_at` = NOW()
                              WHERE `id` = %d";
                
                $updateQuery = $this->wpdb->prepare($updateSql, $exceptionsJson, $id);
                return (bool) $this->wpdb->query($updateQuery);
            }
        }
        
        return true; // Exception didn't exist
    }

    /**
     * Update pricing type for all recurring rules of a trip
     * 
     * @param int $tripId Trip ID
     * @param string $pricingType Pricing type
     * @return int Number of rows updated
     */
    public function updatePricingTypeByTripId(int $tripId, string $pricingType): int
    {
        $table = esc_sql($this->table);
        return (int) $this->wpdb->update(
            $table,
            ['pricing_type' => $pricingType],
            ['trip_id' => $tripId],
            ['%s'],
            ['%d']
        );
    }

    /**
     * Get rules by trip ID
     * 
     * @param int $tripId Trip ID
     * @return array Array of rule objects
     */
    public function getByTripId(int $tripId): array
    {
        $table = esc_sql($this->table);
        return $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT id, time_slots FROM {$table} WHERE trip_id = %d",
            $tripId
        ));
    }

    /**
     * Update rule time slots
     * 
     * @param int $ruleId Rule ID
     * @param string $timeSlots JSON encoded time slots
     * @return bool Success status
     */
    public function updateTimeSlots(int $ruleId, string $timeSlots): bool
    {
        $table = esc_sql($this->table);
        return (bool) $this->wpdb->update(
            $table,
            ['time_slots' => $timeSlots],
            ['id' => $ruleId],
            ['%s'],
            ['%d']
        );
    }
}
