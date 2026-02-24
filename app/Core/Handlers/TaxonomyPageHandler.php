<?php

declare(strict_types=1);

namespace Yatra\Core\Handlers;

use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Repositories\TripRepository;

/**
 * Taxonomy Page Handler
 *
 * Handles single taxonomy page requests (destination, activity, category)
 */
class TaxonomyPageHandler extends BasePageHandler
{
    /**
     * Handle taxonomy page request
     *
     * @param array $route_data Route data from RouteMatcher
     * @return bool True if handled successfully
     */
    public function handle(array $route_data): bool
    {
        $taxonomy_type = $route_data['taxonomy_type'];
        $slug = $route_data['slug'];
        $base = $route_data['base'];

        // Get taxonomy data
        $taxonomy_data = $this->getTaxonomyData($taxonomy_type, $slug);

        if (!$taxonomy_data) {
            $this->set404();
            return false;
        }

        // Get trips for this taxonomy
        $tripRepository = new TripRepository();
        $filter_key = $this->getFilterKey($taxonomy_type);
        $trips_data = $tripRepository->findWithFilters([$filter_key => $slug], 1, 50);
        
        // Add trips to taxonomy data
        $taxonomy_data->trips = $trips_data['data'] ?? [];

        // Prevent 404 handling
        $this->prevent404();

        // Set up global taxonomy object
        $this->setGlobal('yatra_taxonomy_data', $taxonomy_data);

        // Set up query vars for backward compatibility
        $this->setQueryVars([
            'yatra_taxonomy_type' => $taxonomy_data->type,
            'yatra_taxonomy_slug' => $taxonomy_data->slug,
            'yatra_taxonomy' => $taxonomy_data,
        ]);

        // Load the taxonomy template
        $template_path = YATRA_PLUGIN_PATH . 'templates/single-taxonomy.php';

        if (!file_exists($template_path)) {
            $this->logError("Taxonomy template not found: {$template_path}");
            return false;
        }

        include $template_path;
        $this->exit();

        return true;
    }

    /**
     * Get taxonomy data by type and slug
     *
     * @param string $type Taxonomy type
     * @param string $slug Taxonomy slug
     * @return object|null Taxonomy data or null if not found
     */
    private function getTaxonomyData(string $type, string $slug): ?object
    {
        global $wpdb;

        $table = ClassificationsTable::getTableName();

        $data = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$table} WHERE type = %s AND slug = %s AND status = 'publish' LIMIT 1",
            $type,
            $slug
        ));

        return $data ?: null;
    }

    /**
     * Get filter key for taxonomy type
     *
     * @param string $taxonomy_type Taxonomy type
     * @return string Filter key for TripRepository
     */
    private function getFilterKey(string $taxonomy_type): string
    {
        switch ($taxonomy_type) {
            case 'category':
                return 'trip_category';
            case 'activity':
                return 'activity';
            case 'destination':
                return 'destination';
            case 'difficulty':
                return 'difficulty';
            default:
                return $taxonomy_type;
        }
    }
}
