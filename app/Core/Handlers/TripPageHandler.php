<?php

declare(strict_types=1);

namespace Yatra\Core\Handlers;

use Yatra\Controllers\SingleTripController;
use Yatra\Core\Assets\TripAssetManager;
use Yatra\Services\SettingsService;

/**
 * Trip Page Handler
 *
 * Handles single trip page requests
 */
class TripPageHandler extends BasePageHandler
{
    /**
     * Handle trip page request
     *
     * @param array $route_data Route data from RouteMatcher
     * @return bool True if handled successfully
     */
    public function handle(array $route_data): bool
    {
        $trip_slug = $route_data['slug'];
                // Use SingleTripController to get prepared trip data
        $controller = new SingleTripController();
        $trip_data = $controller->getBySlug($trip_slug);

        if (!$trip_data) {
            $this->set404();
            return false;
        }

        // Set up global trip object for template compatibility
        global $trip;
        $trip = $trip_data;

        // Configure $wp_query + virtual WP_Post so FSE block themes resolve the
        // singular template (not 404.html) and render the site header normally.
        $this->setupPageEnvironment('singular', [
            'title' => (string) ($trip->title ?? $trip->name ?? ''),
            'object_id' => (int) ($trip->id ?? 0),
            'post_type' => 'page',
            'post_name' => $trip_slug,
        ]);

        // Set up query vars for backward compatibility
        $this->setQueryVars([
            'yatra_trip_id' => $trip->id,
            'yatra_trip' => $trip,
            'yatra_trip_slug' => $trip_slug,
            'yatra_page' => $route_data['base'] ?? SettingsService::getTripBase(),
        ]);

        return $this->selectTemplate('single-trip', new TripAssetManager(), 'trip');
    }
}
