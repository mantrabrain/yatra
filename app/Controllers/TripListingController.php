<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use Yatra\Services\TripListingService;

/**
 * Trip Listing Controller
 * 
 * Handles HTTP requests for trip listing pages and coordinates between
 * the service layer and presentation layer. Follows MVC pattern with
 * proper separation of concerns.
 */
class TripListingController
{
    private TripListingService $tripListingService;

    public function __construct(?TripListingService $tripListingService = null)
    {
        $this->tripListingService = $tripListingService ?? new TripListingService();
    }

    /**
     * Handle main trip listing page requests
     *
     * @param array $requestParams Request parameters from $_GET
     * @return void
     */
    public function handleTripListing(array $requestParams = []): void
    {
        // Get filtered trip data from service
        $tripData = $this->tripListingService->getFilteredTrips($requestParams);
        
        // Share data with template via globals (WordPress pattern)
        $GLOBALS['yatra_trip_list'] = $tripData;
    }

    /**
     * Handle taxonomy-based trip listings (destination/activity pages)
     *
     * @param string $taxonomyType 'destination' or 'activity'
     * @param string $slug Taxonomy slug
     * @param int $limit Number of trips to show
     * @return void
     */
    public function handleTaxonomyListing(string $taxonomyType, string $slug, int $limit = 10): void
    {
        // Get trips for this taxonomy
        $tripData = $this->tripListingService->getTripsByTaxonomy($taxonomyType, $slug, $limit);
        
        // Share data with template via globals
        $GLOBALS['yatra_taxonomy_context'] = [
            'trips' => $tripData['trips'],
            'total' => $tripData['total'],
            'taxonomy_type' => $taxonomyType,
            'taxonomy_slug' => $slug
        ];
    }

    /**
     * Validate request and determine if it should be processed
     *
     * @param array $requestParams Request parameters
     * @return bool
     */
    public function shouldProcessRequest(array $requestParams): bool
    {
        // Always process base listing page
        if (empty($requestParams)) {
            return true;
        }

        // Process if valid search/filter request
        return $this->tripListingService->isValidSearchRequest($requestParams);
    }

    /**
     * Get current page context for debugging/logging
     *
     * @param array $requestParams Request parameters
     * @return array
     */
    public function getPageContext(array $requestParams): array
    {
        return [
            'controller' => 'TripListingController',
            'action' => 'handleTripListing',
            'filters_applied' => !empty($requestParams),
            'request_params' => $requestParams
        ];
    }
}
