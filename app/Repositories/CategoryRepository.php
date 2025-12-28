<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Constants\ClassificationTypes;
use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Database\Tables\TripClassificationsTable;
use Yatra\Database\Tables\TripsTable;
use Yatra\Database\Tables\ReviewsTable;

/**
 * Category Repository
 * Handles database operations for categories using ClassificationsTable
 */
class CategoryRepository extends BaseRepository
{
    /**
     * Rich text fields specific to categories
     */
    protected array $richTextFields = ['description'];

    /**
     * Integer fields specific to categories
     */
    protected array $integerFields = ['parent_id', 'level', 'sorting', 'is_featured'];

    /**
     * Constructor
     */
    public function __construct()
    {
        parent::__construct(ClassificationsTable::getTableName());
    }

    /**
     * Get table name
     */
    protected function getTableName(): string
    {
        return ClassificationsTable::getTableName();
    }

    /**
     * Find by slug
     */
    public function findBySlug(string $slug): ?\stdClass
    {
        $table = esc_sql($this->table);
        $result = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM `{$table}` WHERE type = %s AND slug = %s",
                ClassificationTypes::CATEGORY,
                $slug
            )
        );
        return $result ?: null;
    }

    /**
     * Override base all() method to filter by type = 'category'
     */
    public function all(array $args = []): array
    {
        // IMPORTANT: Always filter by type = 'category' for categories
        $args['where']['type'] = ClassificationTypes::CATEGORY;
        return parent::all($args);
    }

    /**
     * Override base count() method to filter by type = 'category'
     */
    public function count(array $args = []): int
    {
        // IMPORTANT: Always filter by type = 'category' for categories
        $args['where']['type'] = ClassificationTypes::CATEGORY;
        return parent::count($args);
    }

    /**
     * Override base find() method to filter by type = 'category'
     */
    public function find(int $id, bool $includeDeleted = false): ?\stdClass
    {
        $table = esc_sql($this->table);
        $query = "SELECT * FROM `{$table}` WHERE type = '" . ClassificationTypes::CATEGORY . "' AND id = %d";
        
        if (!$includeDeleted && $this->hasSoftDelete()) {
            $query .= " AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00')";
        }

        $result = $this->wpdb->get_row($this->wpdb->prepare($query, $id));
        return $result ?: null;
    }

    /**
     * Search categories
     */
    public function search(string $search, array $args = []): array
    {
        $table = esc_sql($this->table);
        $search = sanitize_text_field($search);
        
        $where = ["type = '" . ClassificationTypes::CATEGORY . "'"];
        $where[] = "(name LIKE %s OR slug LIKE %s OR description LIKE %s)";
        $searchTerm = '%' . $wpdb->esc_like($search) . '%';

        // Add additional where conditions
        if (isset($args['where']) && is_array($args['where'])) {
            foreach ($args['where'] as $field => $value) {
                if (is_array($value)) {
                    $placeholders = implode(',', array_fill(0, count($value), '%s'));
                    $where[] = "{$field} IN ({$placeholders})";
                    $params = array_merge($params, $value);
                } else {
                    $where[] = "{$field} = %s";
                    $params[] = $value;
                }
            }
        }

        $whereClause = implode(' AND ', $where);
        $order = isset($args['order']) ? $args['order'] : 'name ASC';
        $limit = isset($args['limit']) ? "LIMIT {$args['limit']}" : '';

        $query = "SELECT * FROM `{$table}` WHERE {$whereClause} ORDER BY {$order} {$limit}";
        
        $params = [$searchTerm, $searchTerm, $searchTerm];
        if (isset($args['where']) && is_array($args['where'])) {
            foreach ($args['where'] as $field => $value) {
                if (is_array($value)) {
                    $params = array_merge($params, $value);
                } else {
                    $params[] = $value;
                }
            }
        }

        $results = $this->wpdb->get_results($this->wpdb->prepare($query, $params));
        return $results ?: [];
    }

    /**
     * Get published categories with trip counts
     */
    public function getPublishedWithTripCounts(): array
    {
        global $wpdb;

        $catTable     = esc_sql($this->table);
        $relTable     = TripClassificationsTable::getTableName();
        $tripsTable   = TripsTable::getTableName();
        $reviewsTable = ReviewsTable::getTableName();

        // COUNT(DISTINCT tc.trip_id) gives real number of trips per category.
        // avg_rating is computed from approved reviews across all those trips.
        // starting_price is computed in PHP using both regular trip prices and
        // traveler-based pricing from recurring availability rules.
        $sql = "SELECT c.*, 
                       COUNT(DISTINCT tc.trip_id) AS trips_count,
                       COALESCE(AVG(r.rating), 0) AS avg_rating,
                       GROUP_CONCAT(DISTINCT tc.trip_id) AS trip_ids
                FROM `{$catTable}` c
                LEFT JOIN `{$relTable}` tc
                  ON tc.classification_id = c.id 
                  AND tc.classification_type = '" . ClassificationTypes::CATEGORY . "'
                LEFT JOIN `{$tripsTable}` t
                  ON t.id = tc.trip_id
                LEFT JOIN `{$reviewsTable}` r
                  ON r.trip_id = t.id AND r.status = 'approved'
                WHERE c.type = '" . ClassificationTypes::CATEGORY . "' AND c.status = 'publish'
                GROUP BY c.id";

        $rows = $this->wpdb->get_results($sql) ?: [];

        // Compute starting prices for the trip IDs found.
        $tripIds = [];
        foreach ($rows as $row) {
            if (!empty($row->trip_ids)) {
                $tripIds = array_merge($tripIds, explode(',', $row->trip_ids));
            }
        }

        $pricesByTrip = [];
        if (!empty($tripIds)) {
            $pricesByTrip = $this->computeStartingPriceForTripIds(array_unique($tripIds));
        }

        // Attach starting_price to each category row.
        foreach ($rows as $row) {
            $row->starting_price = 0;
            if (!empty($row->trip_ids)) {
                $tripIdsForCategory = explode(',', $row->trip_ids);
                $pricesForCategory = array_intersect_key($pricesByTrip, array_flip($tripIdsForCategory));
                $row->starting_price = !empty($pricesForCategory) ? min($pricesForCategory) : 0;
            }
        }

        return $rows;
    }

    /**
     * Compute starting prices for given trip IDs.
     */
    private function computeStartingPriceForTripIds(array $tripIds): array
    {
        global $wpdb;
        if (empty($tripIds)) {
            return [];
        }

        $tripsTable = TripsTable::getTableName();
        $placeholders = implode(',', array_fill(0, count($tripIds), '%d'));

        $prices = $wpdb->get_results($wpdb->prepare(
            "SELECT id, original_price FROM `{$tripsTable}` 
             WHERE id IN ({$placeholders}) AND original_price > 0",
            ...$tripIds
        ));

        $pricesByTrip = [];
        foreach ($prices as $price) {
            $pricesByTrip[$price->id] = (float) $price->original_price;
        }

        return $pricesByTrip;
    }

    /**
     * Get status counts for categories
     */
    public function getStatusCounts(array $args = []): array
    {
        $table = esc_sql($this->table);
        
        $sql = "SELECT status, COUNT(*) as count 
                FROM `{$table}` 
                WHERE type = '" . ClassificationTypes::CATEGORY . "'
                GROUP BY status";
        
        $results = $this->wpdb->get_results($sql) ?: [];

        $counts = [
            'publish' => 0,
            'draft' => 0,
            'trash' => 0,
            'total' => 0
        ];
        
        foreach ($results as $row) {
            $status = $row->status;
            $count = (int) $row->count;
            
            // Map old status values to new ones if needed
            if ($status === 'active') {
                $status = 'publish';
            } elseif ($status === 'inactive') {
                $status = 'trash';
            }
             
            if (isset($counts[$status])) {
                $counts[$status] += $count;
                $counts['total'] += $count;
            } else {
                // Handle any unexpected statuses
                $counts['total'] += $count;
            }
        }
        
        // Ensure all status keys are present
        $counts['publish'] = $counts['publish'] ?? 0;
        $counts['draft'] = $counts['draft'] ?? 0;
        $counts['trash'] = $counts['trash'] ?? 0;
        
        return $counts;
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
     * Get trip count for a category
     * 
     * @param int $categoryId Category ID
     * @return int Number of trips with this category
     */
    public function getTripCount(int $categoryId): int
    {
        global $wpdb;
        $tripRepository = new \Yatra\Repositories\TripRepository();
        $tripsTable = $tripRepository->getTableName();
        
        // Use TripClassificationsTable for trip-category relationships
        $tripClassificationsTable = TripClassificationsTable::getTableName();
        
        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(DISTINCT t.id)
             FROM `{$tripsTable}` t
             INNER JOIN `{$tripClassificationsTable}` tc ON tc.trip_id = t.id
             WHERE tc.classification_id = %d
               AND tc.classification_type = %s
               AND t.status != 'trash'",
            $categoryId,
            ClassificationTypes::CATEGORY
        ));
    }

    /**
     * Get trip count for category (direct field method)
     * 
     * @param int $categoryId Category ID
     * @return int Number of trips with this category
     */
    public function getTripCountDirect(int $categoryId): int
    {
        global $wpdb;
        $tripRepository = new \Yatra\Repositories\TripRepository();
        $tripTable = $tripRepository->getTableName();
        
        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*)
             FROM `{$tripTable}` t
             WHERE t.category_id = %d
               AND t.status != 'trash'",
            $categoryId
        ));
    }
}

