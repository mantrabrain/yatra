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
    public string $name = '';
    public string $status = 'active'; // active | inactive | paused
    public string $recurrence_type = 'weekly'; // daily | weekly | monthly | yearly | custom
    public ?string $recurrence_pattern = null;
    public ?string $start_date = null; // Start date for the rule
    public ?string $end_date = null; // Optional end date for the rule
    public ?array $days_of_week = null; // JSON array: [0,1,2,3,4,5,6] (Sun-Sat)
    public ?int $day_of_month = null;
    public ?int $month_of_year = null;
    public int $interval = 1;
    public string $availability_status = 'available';
    /** @var int[]|null Months 1–12 when rule is limited to specific months; null = all months */
    public ?array $allowed_months = null;
    public ?int $max_bookings = null;
    public ?float $price_override = null;
    public string $price_type = 'fixed';
    public ?string $departure_time = null;
    public ?string $arrival_time = null;
    public ?float $duration_hours = null;
    public ?string $from_location = null;
    public ?string $to_location = null;
    public ?string $from_latitude = null;
    public ?string $from_longitude = null;
    public ?string $to_latitude = null;
    public ?string $to_longitude = null;
    public ?array $exceptions = null;
    public string $exception_type = 'exclude';
    public string $capacity_type = 'fixed';
    public ?int $capacity_value = null;
    public float $pricing_adjustment = 0.00;
    public string $pricing_adjustment_type = 'amount';
    public ?int $cutoff_hours = null;
    public ?int $cutoff_days = null;
    public ?int $advance_booking_days = null;
    public ?int $minimum_participants = null;
    public ?int $maximum_participants = null;
    public ?array $age_restrictions = null;
    public ?string $skill_level = null;
    public string $season_type = 'all';
    public bool $holiday_only = false;
    public bool $weekend_only = false;
    public bool $weekday_only = false;
    public ?string $notes = null;
    public int $priority = 10;
    public bool $auto_generate = true;
    public ?string $last_generated = null;
    public string $created_at = '';
    public string $updated_at = '';
    public ?int $created_by = null;
    public ?int $updated_by = null;

    /**
     * Create from array (database row)
     */
    public static function fromArray(array $data): self
    {
        $rule = new self();
        
        $rule->id = (int) ($data['id'] ?? 0);
        $rule->trip_id = (int) ($data['trip_id'] ?? 0);
        $rule->name = sanitize_text_field($data['name'] ?? '');
        $rule->status = sanitize_text_field($data['status'] ?? 'active');
        $rule->recurrence_type = sanitize_text_field($data['recurrence_type'] ?? 'weekly');
        $rule->start_date = !empty($data['start_date']) ? sanitize_text_field($data['start_date']) : null;
        $rule->end_date = !empty($data['end_date']) ? sanitize_text_field($data['end_date']) : null;
        $rule->capacity_value = (int) ($data['capacity_value'] ?? 0);
        $rule->price_override = !empty($data['price_override']) ? (float) $data['price_override'] : null;
        $rule->created_at = $data['created_at'] ?? '';
        $rule->updated_at = $data['updated_at'] ?? '';
        $rule->availability_status = sanitize_text_field($data['availability_status'] ?? 'available');

        $allowedMonths = null;
        if (isset($data['months']) && $data['months'] !== '' && $data['months'] !== null) {
            $mRaw = $data['months'];
            if (is_string($mRaw)) {
                $decodedM = json_decode($mRaw, true);
                $allowedMonths = is_array($decodedM) ? array_values(array_unique(array_map('intval', $decodedM))) : null;
            } elseif (is_array($mRaw)) {
                $allowedMonths = array_values(array_unique(array_map('intval', $mRaw)));
            }
        }
        if (($allowedMonths === null || $allowedMonths === []) && !empty($data['recurrence_pattern'])) {
            $rp = $data['recurrence_pattern'];
            if (is_string($rp)) {
                $rp = json_decode($rp, true);
            }
            if (is_array($rp) && !empty($rp['months']) && is_array($rp['months'])) {
                $allowedMonths = array_values(array_unique(array_map('intval', $rp['months'])));
            }
        }
        $rule->allowed_months = ($allowedMonths !== null && $allowedMonths !== []) ? $allowedMonths : null;
        
        // Handle days_of_week as JSON or comma-separated string
        if (isset($data['days_of_week'])) {
            if (is_string($data['days_of_week'])) {
                // Try JSON first, then comma-separated
                $decoded = json_decode($data['days_of_week'], true);
                if (is_array($decoded)) {
                    $rule->days_of_week = array_map('intval', $decoded);
                } else {
                    $rule->days_of_week = array_map('intval', explode(',', $data['days_of_week']));
                }
            } elseif (is_array($data['days_of_week'])) {
                $rule->days_of_week = array_map('intval', $data['days_of_week']);
            } else {
                $rule->days_of_week = [];
            }
        }
        
        // Handle exceptions as JSON
        if (isset($data['exceptions'])) {
            if (is_string($data['exceptions'])) {
                $rule->exceptions = json_decode($data['exceptions'], true) ?: [];
            } elseif (is_array($data['exceptions'])) {
                $rule->exceptions = $data['exceptions'];
            } else {
                $rule->exceptions = [];
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
        if ($this->status !== 'active') {
            return false;
        }

        if ($this->availability_status === 'unavailable') {
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

        if ($this->allowed_months !== null && $this->allowed_months !== []) {
            $month = (int) date('n', strtotime($date . ' 00:00:00'));
            if (!in_array($month, $this->allowed_months, true)) {
                return false;
            }
        }
        
        return true;
    }
}

