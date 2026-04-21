<?php

declare(strict_types=1);

namespace Yatra\Scripts;

use Yatra\Repositories\DepartureRepository;
use Yatra\Services\CapacityService;
use Yatra\Models\Departure;

/**
 * Comprehensive script to sync all departure capacities from availability
 * This will update all existing departures and ensure they match availability capacity
 */
class DepartureCapacitySyncFromAvailabilityScript
{
    private DepartureRepository $departureRepository;
    private CapacityService $capacityService;

    public function __construct()
    {
        $this->departureRepository = new DepartureRepository();
        $this->capacityService = new CapacityService();
    }

    /**
     * Run the comprehensive capacity sync process
     */
    public function run(): array
    {
        $results = [
            'total_departures' => 0,
            'updated_departures' => 0,
            'no_availability_found' => 0,
            'errors' => []
        ];

        try {
            // Get all departures
            $allDepartures = $this->departureRepository->findAll();
            $results['total_departures'] = count($allDepartures);

            foreach ($allDepartures as $departure) {
                $date = $departure->start_date ?: $departure->date;
                
                // Get correct capacity from availability
                $correctCapacity = $this->capacityService->getCapacityForDate($departure->trip_id, $date);
                
                if ($correctCapacity > 0) {
                    // Update if capacity is different
                    if ($departure->max_capacity !== $correctCapacity) {
                        $updated = $this->departureRepository->update($departure->id, [
                            'max_capacity' => $correctCapacity
                        ]);
                        
                        if ($updated) {
                            $results['updated_departures']++;
                        }
                    }
                } else {
                    $results['no_availability_found']++;
                }
            }

        } catch (\Throwable $e) {
            $results['errors'][] = $e->getMessage();
        }

        return $results;
    }

    /**
     * Get a summary of what needs to be updated
     */
    public function getSyncSummary(): array
    {
        $summary = [
            'total_departures' => 0,
            'need_update' => 0,
            'no_availability' => 0,
            'already_correct' => 0
        ];

        try {
            $allDepartures = $this->departureRepository->findAll();
            $summary['total_departures'] = count($allDepartures);

            foreach ($allDepartures as $departure) {
                $date = $departure->start_date ?: $departure->date;
                $correctCapacity = $this->capacityService->getCapacityForDate($departure->trip_id, $date);
                
                if ($correctCapacity > 0) {
                    if ($departure->max_capacity !== $correctCapacity) {
                        $summary['need_update']++;
                    } else {
                        $summary['already_correct']++;
                    }
                } else {
                    $summary['no_availability']++;
                }
            }
        } catch (\Throwable $e) {
            $summary['errors'][] = $e->getMessage();
        }

        return $summary;
    }
}
