<?php

declare(strict_types=1);

namespace Yatra\Models;

/**
 * Recurring Rule Model
 * Represents a recurring rule that generates departure dates dynamically
 * 
 * Rules do NOT generate dates automatically in the database.
 * They only act as rules for dynamic date generation on the frontend.
 */
class RecurringRule
{
    public int $id = 0;
    public int $trip_id = 0;
    public string $recurrence_type = 'daily'; // daily | weekly | monthly | custom_days
    public array $weekdays = []; // For weekly/custom_days: [0,1,2,3,4,5,6] (Sun-Sat)
    public ?string $end_date = null; // Optional end date for the rule
    public ?string $start_date = null; // Start date for the rule
    public int $max_capacity = 0; // Capacity override for generated dates
    public array $pricing_by_traveler_type = []; // Pricing per traveler type
    public ?float $base_price = null; // Base price per person
    public bool $is_active = true;
    public string $created_at = '';
    public string $updated_at = '';

    /**
     * Create from array (database row)
     */
    public static function fromArray(array $data): self
    {
        $rule = new self();
        
        $rule->id = (int) ($data['id'] ?? 0);
        $rule->trip_id = (int) ($data['trip_id'] ?? 0);
        $rule->recurrence_type = sanitize_text_field($data['recurrence_type'] ?? 'daily');
        $rule->start_date = !empty($data['start_date']) ? sanitize_text_field($data['start_date']) : null;
        $rule->end_date = !empty($data['end_date']) ? sanitize_text_field($data['end_date']) : null;
        $rule->max_capacity = (int) ($data['max_capacity'] ?? 0);
        $rule->base_price = !empty($data['base_price']) ? (float) $data['base_price'] : null;
        $rule->is_active = isset($data['is_active']) ? (bool) $data['is_active'] : true;
        $rule->created_at = $data['created_at'] ?? '';
        $rule->updated_at = $data['updated_at'] ?? '';
        
        // Handle weekdays as JSON or comma-separated string
        if (isset($data['weekdays'])) {
            if (is_string($data['weekdays'])) {
                // Try JSON first, then comma-separated
                $decoded = json_decode($data['weekdays'], true);
                if (is_array($decoded)) {
                    $rule->weekdays = array_map('intval', $decoded);
                } else {
                    $rule->weekdays = array_map('intval', explode(',', $data['weekdays']));
                }
            } elseif (is_array($data['weekdays'])) {
                $rule->weekdays = array_map('intval', $data['weekdays']);
            } else {
                $rule->weekdays = [];
            }
        }
        
        // Handle pricing_by_traveler_type as JSON
        if (isset($data['pricing_by_traveler_type'])) {
            if (is_string($data['pricing_by_traveler_type'])) {
                $rule->pricing_by_traveler_type = json_decode($data['pricing_by_traveler_type'], true) ?: [];
            } elseif (is_array($data['pricing_by_traveler_type'])) {
                $rule->pricing_by_traveler_type = $data['pricing_by_traveler_type'];
            } else {
                $rule->pricing_by_traveler_type = [];
            }
        }
        
        return $rule;
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'trip_id' => $this->trip_id,
            'recurrence_type' => $this->recurrence_type,
            'weekdays' => $this->weekdays,
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'max_capacity' => $this->max_capacity,
            'pricing_by_traveler_type' => $this->pricing_by_traveler_type,
            'base_price' => $this->base_price,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /**
     * Check if rule is active for a given date
     */
    public function isActiveForDate(string $date): bool
    {
        if (!$this->is_active) {
            return false;
        }
        
        // Check start date
        if ($this->start_date && $date < $this->start_date) {
            return false;
        }
        
        // Check end date
        if ($this->end_date && $date > $this->end_date) {
            return false;
        }
        
        return true;
    }
}

