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

        // Debug: Log what we're looking for
        error_log("Yatra TaxonomyPageHandler: Looking for {$taxonomy_type} with slug '{$slug}'");
        error_log("Yatra TaxonomyPageHandler: Found taxonomy data: " . ($taxonomy_data ? 'YES' : 'NO'));

        if (!$taxonomy_data) {
            $this->set404();
            return false;
        }

        // Get trips for this taxonomy
        $tripRepository = new TripRepository();
        $filter_key = $this->getFilterKey($taxonomy_type);
        
        error_log("Yatra TaxonomyPageHandler: Using filter key '{$filter_key}' with value '{$slug}'");
        
        // Temporarily add debugging to TripRepository by modifying the query
        add_filter('query', function($query) {
            if (strpos($query, 'tca') !== false && strpos($query, 'act') !== false) {
                error_log("Yatra TaxonomyPageHandler Trip Query: {$query}");
            }
            return $query;
        });
        
        // Temporarily use working query directly instead of TripRepository
        global $wpdb;
        $tripsTable = \Yatra\Database\Tables\TripsTable::getTableName();
        $tripClassificationsTable = \Yatra\Database\Tables\TripClassificationsTable::getTableName();
        $classificationsTable = \Yatra\Database\Tables\ClassificationsTable::getTableName();
        
        $working_sql = $wpdb->prepare(
            "SELECT t.* 
             FROM {$tripsTable} t 
             LEFT JOIN {$tripClassificationsTable} tca ON tca.trip_id = t.id 
             LEFT JOIN {$classificationsTable} act ON act.id = tca.classification_id 
             WHERE t.status IN ('publish', 'published') 
             AND (t.deleted_at IS NULL OR t.deleted_at = '0000-00-00 00:00:00') 
             AND act.type = %s 
             AND act.slug = %s",
            'activity',
            $slug
        );
        
        error_log("Yatra TaxonomyPageHandler: Using working query: {$working_sql}");
        $trips = $wpdb->get_results($working_sql);
        
        $trips_data = [
            'data' => $trips,
            'total' => count($trips),
            'pages' => 1
        ];
        
        // Keep the original for debugging
        //$trips_data = $tripRepository->findWithFilters([$filter_key => $slug], 1, 50);
        
        // Remove the filter
        remove_all_filters('query');
        
        // Add trips to taxonomy data
        $taxonomy_data->trips = $trips_data['data'] ?? [];
        
        // Debug: Log trips count
        $trips_count = count($taxonomy_data->trips);
        error_log("Yatra TaxonomyPageHandler: Found {$trips_count} trips for {$taxonomy_type} '{$slug}'");
        
        // Debug: Check trip-activity relationships directly
        global $wpdb;
        $tripClassificationsTable = \Yatra\Database\Tables\TripClassificationsTable::getTableName();
        $classificationsTable = \Yatra\Database\Tables\ClassificationsTable::getTableName();
        
        $relationship_sql = $wpdb->prepare(
            "SELECT tc.trip_id, c.name, c.slug 
             FROM {$tripClassificationsTable} tc 
             LEFT JOIN {$classificationsTable} c ON c.id = tc.classification_id 
             WHERE c.type = %s AND c.slug = %s",
            'activity',
            $slug
        );
        
        error_log("Yatra TaxonomyPageHandler Relationship SQL: {$relationship_sql}");
        $relationships = $wpdb->get_results($relationship_sql);
        error_log("Yatra TaxonomyPageHandler: Found " . count($relationships) . " trip-activity relationships");
        
        // Debug: Check each trip's status
        foreach ($relationships as $rel) {
            $trip_id = $rel->trip_id;
            $tripsTable = \Yatra\Database\Tables\TripsTable::getTableName();
            $trip_sql = $wpdb->prepare("SELECT id, status, deleted_at FROM {$tripsTable} WHERE id = %d", $trip_id);
            $trip_info = $wpdb->get_row($trip_sql);
            error_log("Yatra TaxonomyPageHandler: Trip ID {$trip_id} - Status: " . ($trip_info->status ?? 'NULL') . ", Deleted: " . ($trip_info->deleted_at ?? 'NULL'));
        }
        
        // Debug: Test the exact same query structure as TripRepository but simplified
        $tripsTable = \Yatra\Database\Tables\TripsTable::getTableName();
        $test_sql = $wpdb->prepare(
            "SELECT t.id 
             FROM {$tripsTable} t 
             LEFT JOIN {$tripClassificationsTable} tca ON tca.trip_id = t.id 
             LEFT JOIN {$classificationsTable} act ON act.id = tca.classification_id 
             WHERE t.status IN ('publish', 'published') 
             AND (t.deleted_at IS NULL OR t.deleted_at = '0000-00-00 00:00:00') 
             AND act.type = %s 
             AND act.slug = %s 
             LIMIT 1",
            'activity',
            $slug
        );
        
        error_log("Yatra TaxonomyPageHandler Test SQL: {$test_sql}");
        $test_result = $wpdb->get_var($test_sql);
        error_log("Yatra TaxonomyPageHandler: Test query result: " . ($test_result ?? 'NULL'));

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

        $sql = $wpdb->prepare(
            "SELECT * FROM {$table} WHERE type = %s AND slug = %s AND status = 'publish' LIMIT 1",
            $type,
            $slug
        );
        
        error_log("Yatra TaxonomyPageHandler SQL: {$sql}");
        $data = $wpdb->get_row($sql);

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
