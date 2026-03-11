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
        error_log("Yatra TaxonomyPageHandler: Taxonomy type: '{$taxonomy_type}'");
        
        // Temporarily add debugging to TripRepository by modifying the query
        add_filter('query', function($query) use ($taxonomy_type, $filter_key, $slug) {
            if (strpos($query, 'yatra_trips') !== false && strpos($query, 'yatra_classifications') !== false) {
                error_log("Yatra TaxonomyPageHandler Trip Query ({$taxonomy_type}): {$query}");
                error_log("Yatra TaxonomyPageHandler: Looking for {$filter_key} = '{$slug}'");
            }
            return $query;
        });
        
        // Also debug the final SQL that gets executed
        add_filter('query', function($query) {
            if (strpos($query, 'SELECT') !== false && strpos($query, 'FROM') !== false && strpos($query, 'yatra_trips') !== false) {
                error_log("Yatra TaxonomyPageHandler FINAL SQL: {$query}");
            }
            return $query;
        });
        
        $trips_data = $tripRepository->findWithFilters([$filter_key => $slug], 1, 50);
        
        error_log("Yatra TaxonomyPageHandler: TripRepository returned " . count($trips_data['trips'] ?? []) . " trips");
        
        // Remove the filter
        remove_all_filters('query');
        
        // Add trips to taxonomy data
        $taxonomy_data->trips = $trips_data['trips'] ?? [];
        
        // Load reviews for each trip (same approach as SingleTripController)
        $tripsWithReviews = [];
        foreach ($taxonomy_data->trips as $trip) {
            // Load reviews for this trip
            $trip->reviews = $this->getReviewsForTrip((int) $trip->id);
            
            // Calculate rating stats (same as SingleTripController)
            $trip->average_rating = $this->calculateAverageRating($trip->reviews);
            $trip->review_count = count($trip->reviews);
            
            $tripsWithReviews[] = $trip;
        }
        
        $taxonomy_data->trips = $tripsWithReviews;
        
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
            $taxonomy_type,
            $slug
        );
        
        error_log("Yatra TaxonomyPageHandler Relationship SQL: {$relationship_sql}");
        $relationships = $wpdb->get_results($relationship_sql);
        error_log("Yatra TaxonomyPageHandler: Found " . count($relationships) . " trip-{$taxonomy_type} relationships");
        
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
            $taxonomy_type,
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

        if ($data) {
            // Handle metadata unserialization
            if (isset($data->metadata) && is_string($data->metadata)) {
                $data->metadata = maybe_unserialize($data->metadata);
            }
            
            // Handle icon unserialization
            if (isset($data->icon) && is_string($data->icon)) {
                $data->icon = maybe_unserialize($data->icon);
            }
            
            // Convert icon attachment ID to URL if needed
            if (isset($data->icon) && is_numeric($data->icon)) {
                $data->icon = wp_get_attachment_url($data->icon);
            }
        }

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

    /**
     * Get reviews for a specific trip (same as SingleTripController)
     *
     * @param int $trip_id Trip ID
     * @return array Reviews
     */
    private function getReviewsForTrip(int $trip_id): array
    {
        global $wpdb;
        
        $reviewsTable = \Yatra\Database\Tables\ReviewsTable::getTableName();
        
        // Check if reviews table exists
        $table_exists = $wpdb->get_var(
            $wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $reviewsTable
            )
        );
        
        if (!$table_exists) {
            return [];
        }

        $sql = $wpdb->prepare(
            "SELECT * FROM {$reviewsTable} 
             WHERE trip_id = %d 
             AND status = 'approved' 
             ORDER BY created_at DESC 
             LIMIT 10",
            $trip_id
        );
        
        $reviews = $wpdb->get_results($sql);
        
        return $reviews ?: [];
    }

    /**
     * Calculate average rating from reviews (same as SingleTripController)
     *
     * @param array $reviews Reviews array
     * @return float Average rating
     */
    private function calculateAverageRating(array $reviews): float
    {
        if (empty($reviews)) {
            return 0.0;
        }

        $total = 0;
        foreach ($reviews as $review) {
            $total += (float) ($review->rating ?? 0);
        }

        return round($total / count($reviews), 1);
    }
}
