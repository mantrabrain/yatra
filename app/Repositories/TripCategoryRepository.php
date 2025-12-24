<?php

declare(strict_types=1);

namespace Yatra\Repositories;

/**
 * Trip Category Repository
 * Handles database operations for trip categories
 */
class TripCategoryRepository extends BaseRepository
{
    /**
     * Rich text fields
     */
    protected array $richTextFields = ['description'];

    /**
     * Integer fields
     */
    protected array $integerFields = ['id', 'parent_id', 'created_by', 'updated_by'];

    /**
     * Get table name
     */
    protected function getTableName(): string
    {
        global $wpdb;
        return $wpdb->prefix . 'yatra_trip_categories';
    }

    /**
     * Find by slug
     */
    public function findBySlug(string $slug): ?\stdClass
    {
        $table = esc_sql($this->table);
        $result = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM `{$table}` WHERE slug = %s",
                $slug
            )
        );

        return $result ?: null;
    }

    /**
     * Get published categories
     */
    public function getPublished(array $args = []): array
    {
        $args['where']['status'] = 'publish';
        return $this->all($args);
    }

    /**
     * Get categories by status
     */
    public function getByStatus(string $status, array $args = []): array
    {
        $args['where']['status'] = $status;
        return $this->all($args);
    }

    /**
     * Get top-level categories (no parent)
     */
    public function getTopLevel(array $args = []): array
    {
        $args['where']['parent_id'] = null;
        return $this->all($args);
    }

    /**
     * Get subcategories by parent ID
     */
    public function getSubcategories(int $parentId, array $args = []): array
    {
        $args['where']['parent_id'] = $parentId;
        return $this->all($args);
    }

    /**
     * Get category with subcategories
     */
    public function getWithSubcategories(int $id): ?\stdClass
    {
        $category = $this->find($id);
        if (!$category) {
            return null;
        }

        $subcategories = $this->getSubcategories($id);
        $category->subcategories = $subcategories;

        return $category;
    }

    /**
     * Get all categories with subcategories (hierarchical)
     */
    public function getHierarchical(array $args = []): array
    {
        // Get all top-level categories
        $topLevelArgs = $args;
        $topLevelArgs['where']['parent_id'] = null;
        $categories = $this->all($topLevelArgs);

        // For each category, get its subcategories
        foreach ($categories as $category) {
            $subArgs = $args;
            unset($subArgs['where']['parent_id']); // Remove parent_id filter for subcategories
            $category->subcategories = $this->getSubcategories((int) $category->id, $subArgs);
        }

        return $categories;
    }

    /**
     * Check if category has subcategories
     */
    public function hasSubcategories(int $id): bool
    {
        $table = esc_sql($this->table);
        $count = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SELECT COUNT(*) FROM `{$table}` WHERE parent_id = %d",
                $id
            )
        );

        return (int) $count > 0;
    }

    /**
     * Check if category can be deleted (no subcategories and not used by trips)
     */
    public function canDelete(int $id): bool
    {
        // Check if has subcategories
        if ($this->hasSubcategories($id)) {
            return false;
        }

        // Check if used by trips (you may want to add this check later)
        // For now, we'll allow deletion if no subcategories

        return true;
    }

    /**
     * Get published categories with trip counts, ratings, and pricing stats
     */
    public function getPublishedWithTripCounts(): array
    {
        $table = esc_sql($this->table);
        $trip_table = esc_sql($this->wpdb->prefix . 'yatra_trips');
        $trip_cat_table = esc_sql($this->wpdb->prefix . 'yatra_trip_trip_categories');
        $reviews_table = esc_sql($this->wpdb->prefix . 'yatra_reviews');

        $query = "
            SELECT c.*, 
                   COUNT(DISTINCT tc.trip_id) AS trips_count,
                   COALESCE(AVG(r.rating), 0) AS avg_rating,
                   GROUP_CONCAT(DISTINCT tc.trip_id) AS trip_ids
            FROM `{$table}` c
            LEFT JOIN `{$trip_cat_table}` tc ON tc.category_id = c.id
            LEFT JOIN `{$trip_table}` t ON t.id = tc.trip_id AND t.status = 'publish'
            LEFT JOIN `{$reviews_table}` r ON r.trip_id = t.id AND r.status = 'approved'
            WHERE c.status = 'publish'
            GROUP BY c.id
            ORDER BY c.name ASC
        ";

        $categories = $this->wpdb->get_results($query) ?: [];

        // Calculate starting prices for each category
        foreach ($categories as $category) {
            $category->starting_price = 0;
            if (!empty($category->trip_ids)) {
                $trip_ids = explode(',', $category->trip_ids);
                $category->starting_price = $this->computeStartingPriceForTripIds($trip_ids);
            }
        }

        return $categories;
    }

    /**
     * Compute starting price for given trip IDs
     */
    private function computeStartingPriceForTripIds(array $trip_ids): float
    {
        if (empty($trip_ids)) {
            return 0;
        }

        $trip_table = esc_sql($this->wpdb->prefix . 'yatra_trips');
        $placeholders = implode(',', array_fill(0, count($trip_ids), '%d'));
        
        $query = "SELECT MIN(CAST(original_price AS DECIMAL(10,2))) as min_price 
                  FROM `{$trip_table}` 
                  WHERE id IN ({$placeholders}) AND original_price > 0";
        
        $min_price = $this->wpdb->get_var(
            $this->wpdb->prepare($query, ...$trip_ids)
        );

        return $min_price ? (float) $min_price : 0;
    }

    /**
     * Search categories
     */
    public function search(string $search, array $args = []): array
    {
        $table = esc_sql($this->table);
        $where = $this->buildWhereClause($args);
        $order = $this->buildOrderClause($args);
        $limit = $this->buildLimitClause($args);

        $search_where = $this->wpdb->prepare(
            "WHERE (name LIKE %s OR slug LIKE %s OR description LIKE %s)",
            '%' . $this->wpdb->esc_like($search) . '%',
            '%' . $this->wpdb->esc_like($search) . '%',
            '%' . $this->wpdb->esc_like($search) . '%'
        );

        if ($where) {
            $search_where .= ' AND ' . str_replace('WHERE ', '', $where);
        }

        $query = "SELECT * FROM `{$table}` {$search_where} {$order} {$limit}";

        return $this->wpdb->get_results($query) ?: [];
    }
}

