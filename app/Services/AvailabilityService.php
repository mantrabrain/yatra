<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Models\Availability;
use Yatra\Repositories\AvailabilityRepository;

/**
 * Availability Service
 * Business logic for trip availability dates
 */
class AvailabilityService
{
    private AvailabilityRepository $repository;

    public function __construct(AvailabilityRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Validate availability data
     */
    public function validate(array $data, ?int $id = null): void
    {
        // Required fields
        if (empty($data['trip_id'])) {
            throw new \InvalidArgumentException('Trip ID is required');
        }
        
        if (empty($data['departure_date'])) {
            throw new \InvalidArgumentException('Departure date is required');
        }
        
        if (empty($data['seats_total']) || (int) $data['seats_total'] <= 0) {
            throw new \InvalidArgumentException('Total seats must be greater than 0');
        }
        
        // Validate date format
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['departure_date'])) {
            throw new \InvalidArgumentException('Invalid departure date format. Use YYYY-MM-DD');
        }
        
        // Validate arrival date if provided
        if (!empty($data['arrival_date'])) {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['arrival_date'])) {
                throw new \InvalidArgumentException('Invalid arrival date format. Use YYYY-MM-DD');
            }
            
            // Arrival date should be after departure date
            if (strtotime($data['arrival_date']) < strtotime($data['departure_date'])) {
                throw new \InvalidArgumentException('Arrival date must be after departure date');
            }
        }
        
        // Validate return date if provided
        if (!empty($data['return_date'])) {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['return_date'])) {
                throw new \InvalidArgumentException('Invalid return date format. Use YYYY-MM-DD');
            }
            
            $compareDate = !empty($data['arrival_date']) ? $data['arrival_date'] : $data['departure_date'];
            if (strtotime($data['return_date']) < strtotime($compareDate)) {
                throw new \InvalidArgumentException('Return date must be after arrival/departure date');
            }
        }
        
        // Validate time format if provided
        if (!empty($data['departure_time']) && !preg_match('/^\d{2}:\d{2}$/', $data['departure_time'])) {
            throw new \InvalidArgumentException('Invalid departure time format. Use HH:MM');
        }
        
        if (!empty($data['arrival_time']) && !preg_match('/^\d{2}:\d{2}$/', $data['arrival_time'])) {
            throw new \InvalidArgumentException('Invalid arrival time format. Use HH:MM');
        }
        
        // Validate status
        $validStatuses = ['available', 'limited', 'sold_out', 'closed', 'cancelled', 'blocked'];
        if (!empty($data['status']) && !in_array($data['status'], $validStatuses, true)) {
            throw new \InvalidArgumentException('Invalid status. Must be one of: ' . implode(', ', $validStatuses));
        }
        
        // Validate pricing
        if (isset($data['original_price']) && (float) $data['original_price'] < 0) {
            throw new \InvalidArgumentException('Original price cannot be negative');
        }
        
        if (isset($data['discounted_price']) && (float) $data['discounted_price'] < 0) {
            throw new \InvalidArgumentException('Discounted price cannot be negative');
        }
        
        if (!empty($data['original_price']) && !empty($data['discounted_price'])) {
            if ((float) $data['discounted_price'] > (float) $data['original_price']) {
                throw new \InvalidArgumentException('Discounted price cannot be greater than original price');
            }
        }
        
        // Validate seats
        if (isset($data['seats_available']) && (int) $data['seats_available'] < 0) {
            throw new \InvalidArgumentException('Available seats cannot be negative');
        }
        
        if (isset($data['seats_total']) && isset($data['seats_available'])) {
            if ((int) $data['seats_available'] > (int) $data['seats_total']) {
                throw new \InvalidArgumentException('Available seats cannot exceed total seats');
            }
        }
    }

    /**
     * Create availability date
     */
    public function create(array $data): Availability
    {
        $this->validate($data);
        
        // Set default seats_available if not provided
        if (!isset($data['seats_available'])) {
            $data['seats_available'] = $data['seats_total'] ?? 0;
        }
        
        // Auto-calculate status based on availability
        if (empty($data['status'])) {
            $seatsAvailable = (int) ($data['seats_available'] ?? 0);
            $seatsTotal = (int) ($data['seats_total'] ?? 0);
            
            if ($seatsAvailable === 0) {
                $data['status'] = 'sold_out';
            } elseif ($seatsAvailable <= ($seatsTotal * 0.2)) {
                $data['status'] = 'limited';
            } else {
                $data['status'] = 'available';
            }
        }
        
        $id = $this->repository->create($data);
        return $this->repository->findModel($id);
    }

    /**
     * Update availability date
     */
    public function update(int $id, array $data): Availability
    {
        $existing = $this->repository->findModel($id);
        if (!$existing) {
            throw new \InvalidArgumentException('Availability date not found');
        }
        
        // Merge with existing data for validation
        $mergedData = array_merge($existing->toArray(), $data);
        $this->validate($mergedData, $id);
        
        // Auto-update status based on availability
        if (isset($data['seats_available']) || isset($data['seats_total'])) {
            $seatsAvailable = (int) ($data['seats_available'] ?? $existing->seats_available);
            $seatsTotal = (int) ($data['seats_total'] ?? $existing->seats_total);
            
            if ($seatsAvailable === 0) {
                $data['status'] = 'sold_out';
            } elseif ($seatsAvailable <= ($seatsTotal * 0.2)) {
                $data['status'] = 'limited';
            } elseif (!isset($data['status'])) {
                $data['status'] = 'available';
            }
        }
        
        $this->repository->update($id, $data);
        return $this->repository->findModel($id);
    }

    /**
     * Delete availability date
     */
    public function delete(int $id): bool
    {
        $existing = $this->repository->findModel($id);
        if (!$existing) {
            throw new \InvalidArgumentException('Availability date not found');
        }
        
        return $this->repository->delete($id);
    }

    /**
     * Get availability dates for a trip
     */
    public function getByTripId(int $tripId, array $filters = []): array
    {
        return $this->repository->findByTripId($tripId, $filters);
    }

    /**
     * Count availability dates for a trip
     */
    public function countByTripId(int $tripId, array $filters = []): int
    {
        return $this->repository->countByTripId($tripId, $filters);
    }

    /**
     * Get single availability date
     */
    public function find(int $id): ?Availability
    {
        return $this->repository->findModel($id);
    }
}

