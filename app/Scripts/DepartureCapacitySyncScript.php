<?php

declare(strict_types=1);

namespace Yatra\Scripts;

use Yatra\Repositories\DepartureRepository;
use Yatra\Services\CapacityService;
use Yatra\Models\Departure;

/**
 * Script to update departure capacities from availability dates
 */
class DepartureCapacitySyncScript
{
    private DepartureRepository $departureRepository;
    private CapacityService $capacityService;

    public function __construct()
    {
        $this->departureRepository = new DepartureRepository();
        $this->capacityService = new CapacityService();
    }

    /**
     * Run the capacity sync process
     */
    public function run(): array
    {
        $results = [
            'total_departures' => 0,
            'updated_departures' => 0,
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
                
                // Only update if capacity is different and correct capacity > 0
                if ($correctCapacity > 0 && $departure->max_capacity !== $correctCapacity) {
                    $updated = $this->departureRepository->update($departure->id, [
                        'max_capacity' => $correctCapacity
                    ]);
                    
                    if ($updated) {
                        $results['updated_departures']++;
                    }
                }
            }

        } catch (\Throwable $e) {
            $results['errors'][] = $e->getMessage();
        }

        return $results;
    }
}
