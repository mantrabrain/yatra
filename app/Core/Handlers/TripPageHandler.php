<?php

declare(strict_types=1);

namespace Yatra\Core\Handlers;

use Yatra\Controllers\SingleTripController;
use Yatra\Core\Assets\TripAssetManager;
use Yatra\Core\Template\TemplateRenderer;
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

        // Set up query vars for backward compatibility
        $this->setQueryVars([
            'yatra_trip_id' => $trip->id,
            'yatra_trip' => $trip,
            'yatra_trip_slug' => $trip_slug,
            'yatra_page' => $route_data['base'] ?? SettingsService::getTripBase(),
        ]);

        // Create asset manager and render template
        $asset_manager = new TripAssetManager();
        $template_path = TemplateRenderer::getTemplatePath('single-trip');

        // Render template with global $trip already set
        if (!TemplateRenderer::render($template_path, [], $asset_manager)) {
            return false;
        }

        return true;
    }
}
