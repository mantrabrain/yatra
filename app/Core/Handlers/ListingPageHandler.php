<?php

declare(strict_types=1);

namespace Yatra\Core\Handlers;

use Yatra\Core\Assets\ListingAssetManager;
use Yatra\Core\Template\TemplateRenderer;

/**
 * Listing Page Handler
 *
 * Handles listing page requests (destinations, activities, categories)
 */
class ListingPageHandler extends BasePageHandler
{
    /**
     * Handle listing page request
     *
     * @param array $route_data Route data from RouteMatcher
     * @return bool True if handled successfully
     */
    public function handle(array $route_data): bool
    {
        $listing_type = $route_data['listing_type'];
        $base = $route_data['base'];

        // Determine template based on listing type
        $template_map = [
            'trip' => 'listing-trip',
            'destination' => 'listing-destination',
            'activity' => 'listing-activity',
            'category' => 'listing-category',
        ];

        if (!isset($template_map[$listing_type])) {
            $this->logError("Unknown listing type: {$listing_type}");
            return false;
        }

        $template = $template_map[$listing_type];
        $template_path = TemplateRenderer::getTemplatePath($template);

        if (!TemplateRenderer::templateExists($template)) {
            $this->logError("Listing template not found: {$template}");
            return false;
        }

        // Prevent 404 handling
        $this->prevent404();

        // Set up query vars for backward compatibility
        $this->setQueryVars([
            'yatra_listing_page' => $listing_type,
        ]);

        // Load trip data for trip listing pages
        if ($listing_type === 'trip') {
            $tripListingService = new \Yatra\Services\TripListingService();
            
            // Get current page and filters from request
            $page = max(1, (int) ($_GET['page'] ?? 1));
            $requestParams = [
                'page' => $page,
                'per_page' => 12,
                'destination' => $_GET['destination'] ?? '',
                'activity' => $_GET['activity'] ?? '',
                'trip_category' => $_GET['trip_category'] ?? '',
                'price_min' => $_GET['price_min'] ?? '',
                'price_max' => $_GET['price_max'] ?? '',
                'duration_min' => $_GET['duration_min'] ?? '',
                'duration_max' => $_GET['duration_max'] ?? '',
                'rating_min' => $_GET['rating_min'] ?? '',
                'difficulty' => $_GET['difficulty'] ?? '',
                'sort' => $_GET['sort'] ?? '',
                'attributes' => $_GET['attributes'] ?? []
            ];
            
            // Get filtered trips
            $tripData = $tripListingService->getFilteredTrips($requestParams);
            
            // Set global variable for template
            $GLOBALS['yatra_trip_list'] = $tripData;
        }

        // Create asset manager and render template
        $asset_manager = new ListingAssetManager($listing_type);

        if (!TemplateRenderer::render($template_path, [], $asset_manager)) {
            $this->logError("Failed to render listing template for type: {$listing_type}");
            return false;
        }

        $this->exit();

        return true;
    }
}
