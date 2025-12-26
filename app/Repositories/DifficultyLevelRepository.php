<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Database\Tables\ClassificationsTable;

/**
 * Difficulty Level Repository
 * Handles database operations for difficulty levels using ClassificationsTable
 */
class DifficultyLevelRepository extends BaseRepository
{
    /**
     * Rich text fields specific to difficulty levels
     */
    protected array $richTextFields = ['description'];

    /**
     * Integer fields specific to difficulty levels
     */
    protected array $integerFields = ['parent_id', 'level', 'sorting', 'is_featured', 'created_by', 'updated_by'];

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
                "SELECT * FROM `{$table}` WHERE type = 'difficulty' AND slug = %s",
                $slug
            )
        );
        return $result ?: null;
    }

    /**
     * Get published difficulty levels
     */
    public function getPublished(): array
    {
        $table = esc_sql($this->table);
        return $this->wpdb->get_results(
            "SELECT * FROM `{$table}` WHERE type = 'difficulty' AND status = 'publish' ORDER BY sorting ASC, id ASC"
        );
    }

    /**
     * Get all difficulty levels with type filtering
     */
    public function all(array $args = []): array
    {
        // Always filter by type = 'difficulty' for difficulty levels
        $args['where']['type'] = 'difficulty';
        
        return parent::all($args);
    }

    /**
     * Count difficulty levels with type filtering
     */
    public function count(array $args = []): int
    {
        // Always filter by type = 'difficulty' for difficulty levels
        $args['where']['type'] = 'difficulty';
        
        return parent::count($args);
    }

    /**
     * Get status counts for difficulty levels
     */
    public function getStatusCounts(array $args = []): array
    {
        $table = esc_sql($this->table);
        $where = $this->buildWhereClause($args);
        
        // Ensure we only count difficulty type records
        $typeCondition = "type = 'difficulty'";
        if (!empty($where)) {
            $where .= " AND {$typeCondition}";
        } else {
            $where = "WHERE {$typeCondition}";
        }
        
        $sql = "SELECT status, COUNT(*) as count 
                FROM `{$table}` 
                {$where}
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
            
            // Only count new status values, no legacy mapping
            if (isset($counts[$status])) {
                $counts[$status] = $count;
            }
            $counts['total'] += $count;
        }
        
        return $counts;
    }

    /**
     * Get trip count for a difficulty level
     * 
     * @param int $levelId Difficulty level ID
     * @return int Number of trips with this difficulty level
     */
    public function getTripCount(int $levelId): int
    {
        global $wpdb;
        $tripRepository = new \Yatra\Repositories\TripRepository();
        $tripsTable = $tripRepository->getTableName();
        
        // Using hardcoded table name since there's no dedicated repository for classifications
        $tripClassificationsTable = $wpdb->prefix . 'yatra_trip_classifications';
        
        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(DISTINCT t.id)
             FROM `{$tripsTable}` t
             INNER JOIN `{$tripClassificationsTable}` tc ON tc.trip_id = t.id
             WHERE tc.classification_id = %d
               AND tc.classification_type = 'difficulty'
               AND t.status IN ('publish', 'published')",
            $levelId
        ));
    }

    /**
     * Get trip count for difficulty level (direct field method)
     * 
     * @param int $levelId Difficulty level ID
     * @return int Number of trips with this difficulty level
     */
    public function getTripCountDirect(int $levelId): int
    {
        global $wpdb;
        $tripRepository = new \Yatra\Repositories\TripRepository();
        $tripTable = $tripRepository->getTableName();
        
        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*)
             FROM `{$tripTable}` t
             WHERE t.difficulty_level = %d
               AND t.status != 'trash'",
            $levelId
        ));
    }
}
