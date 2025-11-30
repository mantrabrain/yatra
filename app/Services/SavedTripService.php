<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\SavedTripRepository;

/**
 * Saved Trip Service
 * 
 * Contains business logic for saved trips/wishlist.
 * 
 * @package Yatra\Services
 */
class SavedTripService
{
    private SavedTripRepository $repository;

    public function __construct()
    {
        $this->repository = new SavedTripRepository();
    }


    /**
     * Check if trip is saved by user
     * 
     * @param int $userId User ID
     * @param int $tripId Trip ID
     * @return bool
     */
    public function isSaved(int $userId, int $tripId): bool
    {
        return $this->repository->isSaved($userId, $tripId);
    }

    /**
     * Save trip for user
     * 
     * @param int $userId User ID
     * @param int $tripId Trip ID
     * @return array {success: bool, message: string}
     */
    public function saveTrip(int $userId, int $tripId): array
    {
        // Validate trip exists
        $tripRepository = new \Yatra\Repositories\TripRepository();
        $trip = $tripRepository->find($tripId);
        
        if (!$trip) {
            return [
                'success' => false,
                'message' => __('Trip not found.', 'yatra'),
            ];
        }
        
        $result = $this->repository->saveTrip($userId, $tripId);
        
        if ($result) {
            return [
                'success' => true,
                'message' => __('Trip saved to wishlist.', 'yatra'),
            ];
        }
        
        return [
            'success' => false,
            'message' => __('Failed to save trip.', 'yatra'),
        ];
    }

    /**
     * Remove saved trip
     * 
     * @param int $userId User ID
     * @param int $tripId Trip ID
     * @return array {success: bool, message: string}
     */
    public function removeTrip(int $userId, int $tripId): array
    {
        $result = $this->repository->removeTrip($userId, $tripId);
        
        if ($result) {
            return [
                'success' => true,
                'message' => __('Trip removed from wishlist.', 'yatra'),
            ];
        }
        
        return [
            'success' => false,
            'message' => __('Failed to remove trip.', 'yatra'),
        ];
    }

    /**
     * Get user's saved trips
     * 
     * @param int $userId User ID
     * @return array
     */
    public function getUserSavedTrips(int $userId): array
    {
        return $this->repository->getUserSavedTrips($userId);
    }

    /**
     * Get count of saved trips
     * 
     * @param int $userId User ID
     * @return int
     */
    public function getCount(int $userId): int
    {
        return $this->repository->getCount($userId);
    }
}

