<?php

declare(strict_types=1);

namespace Yatra\Core\Handlers;

use Yatra\Core\Assets\ListingAssetManager;

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
            'category' => 'listing-trip-category',
        ];

        if (!isset($template_map[$listing_type])) {
            $this->logError("Unknown listing type: {$listing_type}");
            return false;
        }

        $template = $template_map[$listing_type];

        // Configure $wp_query + virtual WP_Post so FSE block themes resolve an archive
        // template (not 404.html) and render the site header normally.
        $this->setupPageEnvironment('archive', [
            'title' => ucfirst($listing_type) . ' ' . __('Listing', 'yatra'),
            'post_type' => 'page',
            'post_name' => $base,
        ]);

        // Set up query vars for backward compatibility
        $this->setQueryVars([
            'yatra_page' => $base,
        ]);

        // Load trip data for trip listing pages
        if ($listing_type === 'trip') {
            $tripListingService = new \Yatra\Services\TripListingService();
            
            // Pagination: route (pretty /trip/page/N/), query var, then ?paged= / ?page=
            $page = max(1, (int) ($route_data['paged'] ?? (get_query_var('paged') ?: ($_GET['paged'] ?? $_GET['page'] ?? 1))));

            $requestParams = [
                'page' => $page,
                'per_page' => \yatra_get_posts_per_page(),
                's' => isset($_GET['s']) ? (string) wp_unslash($_GET['s']) : '',
                'destination' => $_GET['destination'] ?? '',
                'activity' => $_GET['activity'] ?? '',
                'trip_category' => $_GET['trip_category'] ?? ($_GET['category'] ?? ''),
                'price_min' => $_GET['price_min'] ?? '',
                'price_max' => $_GET['price_max'] ?? '',
                'budget' => $_GET['budget'] ?? '',
                'duration_min' => $_GET['duration_min'] ?? '',
                'duration_max' => $_GET['duration_max'] ?? '',
                'duration' => $_GET['duration'] ?? '',
                'rating_min' => $_GET['rating_min'] ?? '',
                'rating' => $_GET['rating'] ?? [],
                'difficulty' => $_GET['difficulty'] ?? [],
                'categories' => $_GET['categories'] ?? [],
                'destinations' => $_GET['destinations'] ?? [],
                'activities' => $_GET['activities'] ?? [],
                'trip_type' => $_GET['trip_type'] ?? '',
                'special_offers' => $_GET['offers'] ?? ($_GET['special_offers'] ?? []),
                'booking_options' => $_GET['booking'] ?? ($_GET['booking_options'] ?? []),
                'age_suitability' => $_GET['age'] ?? ($_GET['age_suitability'] ?? []),
                'accommodation' => $_GET['accommodation'] ?? [],
                'included_services' => $_GET['services'] ?? ($_GET['included_services'] ?? []),
                'sort' => $_GET['sort'] ?? '',
                'attributes' => (isset($_GET['attributes']) && is_array($_GET['attributes'])) ? wp_unslash($_GET['attributes']) : [],
            ];
            
            // Get filtered trips
            $tripData = $tripListingService->getFilteredTrips($requestParams);

            $GLOBALS['yatra_trip_list'] = $tripData;
            $GLOBALS['yatra_trip_listing_context'] = (new \Yatra\Services\TripListingPageContextFactory())->buildForTripArchive(
                $tripData,
                (string) ($_SERVER['REQUEST_URI'] ?? ''),
                $GLOBALS['yatra_taxonomy_context'] ?? null,
                $tripListingService->getFilterData()
            );
        }

        // SEO meta, canonical, and JSON-LD are handled by {@see \Yatra\Managers\SEOManager} + {@see \Yatra\Services\SEOService}.

        return $this->selectTemplate($template, new ListingAssetManager($listing_type), 'listing-' . $listing_type);
    }

}
