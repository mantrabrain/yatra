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
            'destination' => 'listing-destination.php',
            'activity' => 'listing-activity.php',
            'category' => 'listing-category.php',
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
