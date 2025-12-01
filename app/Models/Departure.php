<?php

declare(strict_types=1);

namespace Yatra\Models;

/**
 * Departure Model
 * Represents a single trip departure date/time with capacity and booking tracking
 * 
 * Status rules:
 * - past: if date < today
 * - full: if booked_count >= max_capacity
 * - upcoming: otherwise
 * - cancelled: explicitly cancelled
 */
class Departure
{
    public int $id = 0;
    public int $trip_id = 0;
    public string $date = ''; // YYYY-MM-DD format (kept for backward compatibility)
    public string $start_date = ''; // YYYY-MM-DD format - When trip starts
    public string $end_date = ''; // YYYY-MM-DD format - When trip ends
    public ?string $time = null; // HH:MM:SS format (optional)
    public int $max_capacity = 0;
    public int $booked_count = 0;
    public string $status = 'upcoming'; // upcoming | full | past | cancelled
    public string $source = 'booking_created'; // booking_created | manual (for admin edits)
    public ?float $price_override = null; // Optional price override per person
    public array $price_by_traveler_type = []; // Optional pricing per traveler category
    public float $total_revenue = 0.00; // Total revenue from all bookings (static snapshot)
    public ?string $notes = null;
    public string $created_at = '';
    public string $updated_at = '';

    /**
     * Create from array (database row)
     */
    public static function fromArray(array $data): self
    {
        $departure = new self();
        
        $departure->id = (int) ($data['id'] ?? 0);
        $departure->trip_id = (int) ($data['trip_id'] ?? 0);
        // Handle date fields - support both old 'date' and new 'start_date'/'end_date'
        $departure->date = sanitize_text_field($data['date'] ?? $data['start_date'] ?? '');
        $departure->start_date = sanitize_text_field($data['start_date'] ?? $data['date'] ?? '');
        $departure->end_date = sanitize_text_field($data['end_date'] ?? '');
        $departure->time = !empty($data['time']) ? sanitize_text_field($data['time']) : null;
        $departure->max_capacity = (int) ($data['max_capacity'] ?? 0);
        $departure->booked_count = (int) ($data['booked_count'] ?? 0);
        $departure->status = sanitize_text_field($data['status'] ?? 'upcoming');
        $departure->source = sanitize_text_field($data['source'] ?? 'booking_created');
        $departure->price_override = !empty($data['price_override']) ? (float) $data['price_override'] : null;
        $departure->total_revenue = !empty($data['total_revenue']) ? (float) $data['total_revenue'] : 0.00;
        $departure->notes = !empty($data['notes']) ? sanitize_textarea_field($data['notes']) : null;
        $departure->created_at = $data['created_at'] ?? '';
        $departure->updated_at = $data['updated_at'] ?? '';
        
        // Handle price_by_traveler_type as JSON
        if (isset($data['price_by_traveler_type'])) {
            if (is_string($data['price_by_traveler_type'])) {
                $departure->price_by_traveler_type = json_decode($data['price_by_traveler_type'], true) ?: [];
            } elseif (is_array($data['price_by_traveler_type'])) {
                $departure->price_by_traveler_type = $data['price_by_traveler_type'];
            } else {
                $departure->price_by_traveler_type = [];
            }
        }
        
        return $departure;
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'trip_id' => $this->trip_id,
            'date' => $this->date ?: $this->start_date, // Backward compatibility
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'time' => $this->time,
            'max_capacity' => $this->max_capacity,
            'booked_count' => $this->booked_count,
            'available_capacity' => max(0, $this->max_capacity - $this->booked_count),
            'status' => $this->status,
            'source' => $this->source,
            'price_override' => $this->price_override,
            'price_by_traveler_type' => $this->price_by_traveler_type,
            'total_revenue' => $this->total_revenue,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /**
     * Calculate status based on date and capacity
     * 
     * @return string Status: past | full | upcoming | cancelled
     */
    public function calculateStatus(): string
    {
        // If explicitly cancelled, return cancelled
        if ($this->status === 'cancelled') {
            return 'cancelled';
        }
        
        // Check if end_date is in the past (use end_date to determine if trip is complete)
        $today = date('Y-m-d');
        $checkDate = !empty($this->end_date) ? $this->end_date : $this->start_date;
        if (empty($checkDate)) {
            $checkDate = $this->date; // Fallback to old date field
        }
        
        if ($checkDate < $today) {
            return 'past';
        }
        
        // Check if full
        if ($this->booked_count >= $this->max_capacity && $this->max_capacity > 0) {
            return 'full';
        }
        
        // Otherwise upcoming
        return 'upcoming';
    }

    /**
     * Check if departure is available for booking
     */
    public function isAvailable(): bool
    {
        $checkDate = !empty($this->start_date) ? $this->start_date : $this->date;
        return $this->status === 'upcoming' && 
               $this->booked_count < $this->max_capacity &&
               $checkDate >= date('Y-m-d');
    }
}

