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

        $taxonomy_data = $this->getTaxonomyData($taxonomy_type, $slug);

        if (!$taxonomy_data) {
            $this->set404();
            return false;
        }

        $tripRepository = new TripRepository();
        $filter_key = $this->getFilterKey($taxonomy_type);

        $pageNum = !empty($route_data['paged']) ? max(1, (int) $route_data['paged']) : \yatra_get_archive_listing_paged();
        $perPage = \yatra_get_posts_per_page();
        $trips_data = $tripRepository->findWithFilters([$filter_key => $slug], $pageNum, $perPage);

        $taxonomy_data->trips_total = (int) ($trips_data['total'] ?? 0);
        $taxonomy_data->trips_pages = (int) ($trips_data['pages'] ?? 1);
        $taxonomy_data->trips_per_page = (int) ($trips_data['per_page'] ?? $perPage);
        $taxonomy_data->trips_current_page = (int) ($trips_data['page'] ?? $pageNum);
        $taxonomy_data->trips = $trips_data['trips'] ?? [];

        $tripsWithReviews = [];
        foreach ($taxonomy_data->trips as $trip) {
            $trip->reviews = $this->getReviewsForTrip((int) $trip->id);
            $trip->average_rating = $this->calculateAverageRating($trip->reviews);
            $trip->review_count = count($trip->reviews);

            $tripsWithReviews[] = $trip;
        }

        $taxonomy_data->trips = $tripsWithReviews;

        $this->prevent404();

        $this->setGlobal('yatra_taxonomy_data', $taxonomy_data);

        $this->setQueryVars([
            'yatra_taxonomy_type' => $taxonomy_data->type,
            'yatra_taxonomy_slug' => $taxonomy_data->slug,
            'yatra_taxonomy' => $taxonomy_data,
            'yatra_page' => $base,
        ]);

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

        $data = $wpdb->get_row($sql);

        if ($data) {
            if (isset($data->metadata) && is_string($data->metadata)) {
                $data->metadata = maybe_unserialize($data->metadata);
            }

            if (isset($data->icon) && is_string($data->icon)) {
                $data->icon = maybe_unserialize($data->icon);
            }

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

        $table_exists = $wpdb->get_var(
            $wpdb->prepare(
                'SHOW TABLES LIKE %s',
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
