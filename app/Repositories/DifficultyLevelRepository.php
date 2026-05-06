<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Constants\ClassificationTypes;
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
        parent::__construct();
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
                ClassificationTypes::DIFFICULTY,
                $slug
            )
        );
        return $result ?: null;
    }

    /**
     * Find by name (case-insensitive match)
     */
    public function findByName(string $name): ?\stdClass
    {
        $name = trim($name);
        if ($name === '') {
            return null;
        }

        $table = esc_sql($this->table);
        $result = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM `{$table}` 
                 WHERE type = %s AND LOWER(name) = LOWER(%s)
                 LIMIT 1",
                ClassificationTypes::DIFFICULTY,
                $name
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
            $this->wpdb->prepare(
                "SELECT * FROM `{$table}` WHERE type = %s AND status = 'publish' ORDER BY sorting ASC, id ASC",
                ClassificationTypes::DIFFICULTY
            )
        );
    }

    /**
     * Get all difficulty levels with type filtering
     */
    public function all(array $args = []): array
    {
        // Always filter by type = 'difficulty' for difficulty levels
        $args['where']['type'] = ClassificationTypes::DIFFICULTY;
        
        return parent::all($args);
    }

    /**
     * Count difficulty levels with type filtering
     */
    public function count(array $args = []): int
    {
        // Always filter by type = 'difficulty' for difficulty levels
        $args['where']['type'] = ClassificationTypes::DIFFICULTY;
        
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
        $typeCondition = "type = %s";
        
        $whereClause = "WHERE {$typeCondition}";
        if (!empty($args['where'])) {
            $additionalWhere = $this->buildWhereClause($args);
            if ($additionalWhere && $additionalWhere !== ' WHERE') {
                $additionalWhere = str_replace('WHERE ', 'AND ', $additionalWhere);
                $whereClause .= ' ' . $additionalWhere;
            }
        }
        
        $sql = "SELECT status, COUNT(*) as count 
                FROM `{$table}` 
                {$whereClause}
                GROUP BY status";
        
        $results = $this->wpdb->get_results($this->wpdb->prepare($sql, ClassificationTypes::DIFFICULTY)) ?: [];

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
        
        // Use TripClassificationsTable for trip-difficulty relationships
        $tripClassificationsTable = \Yatra\Database\Tables\TripClassificationsTable::getTableName();
        
        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(DISTINCT t.id)
             FROM `{$tripsTable}` t
             INNER JOIN `{$tripClassificationsTable}` tc ON tc.trip_id = t.id
             WHERE tc.classification_id = %d
               AND tc.classification_type = %s
               AND t.status IN ('publish', 'published')",
            $levelId,
            ClassificationTypes::DIFFICULTY
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
