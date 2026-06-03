<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Constants\ClassificationTypes;
use Yatra\Database\Tables\ClassificationsTable;

/**
 * Traveler Category Repository
 * Handles database operations for traveler categories using unified ClassificationsTable
 */
class TravelerCategoryRepository extends BaseRepository
{
    /**
     * Get table name
     */
    protected function getTableName(): string
    {
        return ClassificationsTable::getTableName();
    }

    /**
     * Get all traveler categories with automatic type filtering
     */
    public function all(array $args = []): array
    {
        // Always filter by type = 'traveler_type' for traveler categories
        if (!isset($args['where']['type'])) {
            $args['where']['type'] = ClassificationTypes::TRAVELER_TYPE;
        }
        
        return parent::all($args);
    }

    /**
     * Count traveler categories with automatic type filtering
     */
    public function count(array $args = []): int
    {
        // Always filter by type = 'traveler_type' for traveler categories
        if (!isset($args['where']['type'])) {
            $args['where']['type'] = ClassificationTypes::TRAVELER_TYPE;
        }
        
        return parent::count($args);
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
                ClassificationTypes::TRAVELER_TYPE,
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
        $args['where']['type'] = ClassificationTypes::TRAVELER_TYPE;
        $args['where']['status'] = 'publish';
        return $this->all($args);
    }

    /**
     * Get categories by status
     */
    public function getByStatus(string $status, array $args = []): array
    {
        $args['where']['type'] = ClassificationTypes::TRAVELER_TYPE;
        $args['where']['status'] = $status;
        return $this->all($args);
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
            "WHERE (name LIKE %s OR slug LIKE %s OR description LIKE %s) AND type = %s",
            '%' . $this->wpdb->esc_like($search) . '%',
            '%' . $this->wpdb->esc_like($search) . '%',
            '%' . $this->wpdb->esc_like($search) . '%',
            ClassificationTypes::TRAVELER_TYPE
        );

        if ($where) {
            $search_where .= ' AND ' . str_replace('WHERE ', '', $where);
        }

        $query = "SELECT * FROM `{$table}` {$search_where} {$order} {$limit}";

        return $this->wpdb->get_results($query) ?: [];
    }

    /**
     * Get traveler categories by IDs
     * 
     * @param array $categoryIds Array of category IDs
     * @return array Array of category objects
     */
    public function getByIds(array $categoryIds): array
    {
        $table = $this->getTableName();
        
        if (empty($categoryIds)) {
            return [];
        }
        
        $placeholders = implode(',', array_fill(0, count($categoryIds), '%d'));
        
        return $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT id, name, slug, JSON_EXTRACT(metadata, '$.age_min') as age_min, JSON_EXTRACT(metadata, '$.age_max') as age_max 
             FROM {$table} 
             WHERE id IN ({$placeholders}) AND type = %s",
            ClassificationTypes::TRAVELER_TYPE, ...$categoryIds
        ));
    }

    /**
     * Get metadata by category IDs
     * 
     * @param array $categoryIds Array of category IDs
     * @return array Array of metadata indexed by category ID
     */
    public function getMetadataByIds(array $categoryIds): array
    {
        $table = $this->getTableName();
        
        $categoryIds = array_unique(array_filter($categoryIds));
        if (empty($categoryIds)) {
            return [];
        }
        
        $placeholders = implode(',', array_fill(0, count($categoryIds), '%d'));
        $rows = $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT id, metadata FROM `{$table}` WHERE type = %s AND id IN ({$placeholders})",
            ClassificationTypes::TRAVELER_TYPE,
            ...$categoryIds
        ));
        
        $result = [];
        foreach ($rows as $row) {
            $meta = !empty($row->metadata) ? json_decode($row->metadata, true) : [];
            $result[(int) $row->id] = [
                'pricing_mode'   => $meta['pricing_mode'] ?? 'per_person',
                'min_pax'        => $meta['min_pax'] ?? null,
                'max_pax'        => $meta['max_pax'] ?? null,
                'group_overflow' => $meta['group_overflow'] ?? 'block',
            ];
        }
        
        return $result;
    }
}

