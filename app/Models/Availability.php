<?php

declare(strict_types=1);

namespace Yatra\Models;

/**
 * Availability Model
 * Represents a trip availability date with pricing and capacity
 */
class Availability
{
    public int $id = 0;
    public int $trip_id = 0;
    public string $departure_date = '';
    public ?string $arrival_date = null;
    public ?string $return_date = null;
    public ?string $departure_time = null;
    public ?string $arrival_time = null;
    public int $seats_total = 0;
    public int $seats_available = 0;
    public int $seats_reserved = 0;
    public int $seats_waitlist = 0;
    public string $pricing_type = 'regular';
    public ?float $original_price = null;
    public ?float $discounted_price = null;
    public ?float $discount_percentage = null;
    public array $price_types = [];
    public string $status = 'available';
    public ?string $from_location = null;
    public ?string $to_location = null;
    public ?string $special_notes = null;
    public ?string $cutoff_date = null;
    public int $cutoff_hours = 24;
    public bool $is_blocked = false;
    public ?string $block_reason = null;
    public ?int $alert_threshold = null;
    public ?string $last_synced_at = null;
    public string $created_at = '';
    public string $updated_at = '';

    /**
     * Create from array
     */
    public static function fromArray(array $data): self
    {
        $availability = new self();
        
        foreach ($data as $key => $value) {
            if (property_exists($availability, $key)) {
                // Handle boolean conversion
                if ($key === 'is_blocked' && is_string($value)) {
                    $availability->$key = in_array(strtolower($value), ['1', 'true', 'yes'], true);
                } elseif ($key === 'id') {
                    $availability->$key = (int) $value;
                } elseif ($key === 'trip_id') {
                    $availability->$key = (int) $value;
                } elseif (in_array($key, ['seats_total', 'seats_available', 'seats_reserved', 'seats_waitlist', 'cutoff_hours', 'alert_threshold'], true)) {
                    $availability->$key = (int) $value;
                } elseif (in_array($key, ['original_price', 'discounted_price', 'discount_percentage'], true)) {
                    $availability->$key = $value !== null ? (float) $value : null;
                } elseif ($key === 'price_types') {
                    // Handle price_types as JSON
                    if (is_string($value)) {
                        $availability->$key = json_decode($value, true) ?: [];
                    } elseif (is_array($value)) {
                        $availability->$key = $value;
                    } else {
                        $availability->$key = [];
                    }
                } else {
                    $availability->$key = $value;
                }
            }
        }
        
        return $availability;
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'trip_id' => $this->trip_id,
            'departure_date' => $this->departure_date,
            'arrival_date' => $this->arrival_date,
            'return_date' => $this->return_date,
            'departure_time' => $this->departure_time,
            'arrival_time' => $this->arrival_time,
            'seats_total' => $this->seats_total,
            'seats_available' => $this->seats_available,
            'seats_reserved' => $this->seats_reserved,
            'seats_waitlist' => $this->seats_waitlist,
            'booked_seats' => $this->seats_total - $this->seats_available - $this->seats_reserved,
            'total_seats' => $this->seats_total,
            'available_seats' => $this->seats_available,
            'waitlist_count' => $this->seats_waitlist,
            'pricing_type' => $this->pricing_type,
            'original_price' => $this->original_price,
            'discounted_price' => $this->discounted_price,
            'discount_percentage' => $this->discount_percentage,
            'price_types' => $this->price_types,
            'status' => $this->status,
            'from_location' => $this->from_location,
            'to_location' => $this->to_location,
            'special_notes' => $this->special_notes,
            'cutoff_date' => $this->cutoff_date,
            'cutoff_hours' => $this->cutoff_hours,
            'is_blocked' => $this->is_blocked,
            'block_reason' => $this->block_reason,
            'alert_threshold' => $this->alert_threshold,
            'last_synced_at' => $this->last_synced_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

