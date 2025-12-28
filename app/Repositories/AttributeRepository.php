<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Constants\ClassificationTypes;
use Yatra\Database\Tables\ClassificationsTable;

/**
 * Attribute Repository
 * Handles database operations for trip attributes
 */
class AttributeRepository extends BaseRepository
{
    /**
     * Rich text fields
     */
    protected array $richTextFields = ['description', 'field_options', 'validation_rules'];

    /**
     * Integer fields
     */
    protected array $integerFields = ['id', 'sorting', 'created_by', 'updated_by'];

    /**
     * Get paginated results
     */
    public function paginate(int $page = 1, int $perPage = 10, array $args = []): array
    {
        // Convert filter keys to WHERE clause format
        $where = [];
        
        // Always filter by type = 'attribute'
        $where['type'] = ClassificationTypes::ATTRIBUTE;
        
        // Handle status filter
        if (isset($args['status'])) {
            $where['status'] = $args['status'];
            unset($args['status']);
        }
        
        // Handle field_type filter
        if (isset($args['field_type'])) {
            $where['field_type'] = $args['field_type'];
            unset($args['field_type']);
        }
        
        // Handle show_on_frontend filter
        if (isset($args['show_on_frontend'])) {
            $where['show_on_frontend'] = $args['show_on_frontend'];
            unset($args['show_on_frontend']);
        }
        
        // Handle show_in_filters filter
        if (isset($args['show_in_filters'])) {
            $where['show_in_filters'] = $args['show_in_filters'];
            unset($args['show_in_filters']);
        }
        
        // Add WHERE conditions if any
        if (!empty($where)) {
            $args['where'] = $where;
        }
        
        $args['limit'] = $perPage;
        $args['offset'] = ($page - 1) * $perPage;
        
        return $this->all($args);
    }

    /**
     * Count records with filters
     */
    public function count(array $args = []): int
    {
        // Convert filter keys to WHERE clause format (same as paginate)
        $where = [];
        
        // Always filter by type = 'attribute'
        $where['type'] = ClassificationTypes::ATTRIBUTE;
        
        if (isset($args['status'])) {
            $where['status'] = $args['status'];
            unset($args['status']);
        }
        
        if (isset($args['field_type'])) {
            $where['field_type'] = $args['field_type'];
            unset($args['field_type']);
        }
        
        if (isset($args['show_on_frontend'])) {
            $where['show_on_frontend'] = $args['show_on_frontend'];
            unset($args['show_on_frontend']);
        }
        
        if (isset($args['show_in_filters'])) {
            $where['show_in_filters'] = $args['show_in_filters'];
            unset($args['show_in_filters']);
        }
        
        if (!empty($where)) {
            $args['where'] = $where;
        }
        
        return parent::count($args);
    }

    /**
     * Get table name
     */
    protected function getTableName(): string
    {
        return ClassificationsTable::getTableName();
        
    }

    /**
     * Get all published attributes
     */
    public function getAllPublished(): array
    {
        $table = esc_sql($this->table);
        $query = "SELECT * FROM `{$table}` 
                 WHERE type = %s AND status = 'publish' 
                 ORDER BY sorting ASC, name ASC";
        
        return $this->wpdb->get_results($this->wpdb->prepare($query, ClassificationTypes::ATTRIBUTE)) ?: [];
    }

    /**
     * Get attributes for frontend display
     */
    public function getFrontendAttributes(): array
    {
        $table = esc_sql($this->table);
        $query = "SELECT * FROM `{$table}` 
                 WHERE type = %s AND status = 'publish' AND JSON_EXTRACT(metadata, '$.show_on_frontend') = 1 
                 ORDER BY sorting ASC, name ASC";
        
        return $this->wpdb->get_results($this->wpdb->prepare($query, ClassificationTypes::ATTRIBUTE)) ?: [];
    }

    /**
     * Get filterable attributes
     */
    public function getFilterableAttributes(): array
    {
        $table = esc_sql($this->table);
        $query = "SELECT * FROM `{$table}` 
                 WHERE type = %s AND status = 'publish' AND JSON_EXTRACT(metadata, '$.show_in_filters') = 1 
                 ORDER BY sorting ASC, name ASC";
        
        return $this->wpdb->get_results($this->wpdb->prepare($query, ClassificationTypes::ATTRIBUTE)) ?: [];
    }

    /**
     * Get attribute by slug
     */
    public function findBySlug(string $slug): ?\stdClass
    {
        $table = esc_sql($this->table);
        $query = "SELECT * FROM `{$table}` 
                 WHERE type = %s AND slug = %s AND status = 'publish'";
        
        return $this->wpdb->get_row($this->wpdb->prepare($query, ClassificationTypes::ATTRIBUTE ,$slug));
    }

    /**
     * Search attributes by name or description
     */
    public function search(string $term): array
    {
        $table = esc_sql($this->table);
        $query = "SELECT * FROM `{$table}` 
                 WHERE type = %s AND status = 'publish' 
                 AND (name LIKE %s OR description LIKE %s)
                 ORDER BY sorting ASC, name ASC
                 LIMIT 50";
        
        $searchTerm = '%' . $this->wpdb->esc_like($term) . '%';
        
        return $this->wpdb->get_results(
            $this->wpdb->prepare($query, ClassificationTypes::ATTRIBUTE, $searchTerm, $searchTerm)
        ) ?: [];
    }

    /**
     * Create attribute
     */
    public function create(array $data): int
    {
        $table = esc_sql($this->table);
        
        // Extract metadata fields
        $metadata = [];
        $metadataFields = [
            'field_type', 'required', 'show_on_frontend', 'show_in_filters', 
            'filter_type', 'searchable', 'display_order', 'default_value', 
            'placeholder', 'field_options', 'validation_rules'
        ];
        
        foreach ($metadataFields as $field) {
            if (isset($data[$field])) {
                $metadata[$field] = $data[$field];
                unset($data[$field]);
            }
        }
        
        // Prepare core data
        $coreData = [
            'type' => ClassificationTypes::ATTRIBUTE,
            'name' => $data['name'],
            'slug' => !empty($data['slug']) ? $data['slug'] : sanitize_title($data['name']),
            'description' => $data['description'] ?? null,
            'icon' => $data['icon'] ?? null,
            'metadata' => !empty($metadata) ? json_encode($metadata) : null,
            'sorting' => $data['sorting'] ?? 0,
            'status' => $data['status'] ?? 'draft',
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
            'created_by' => $data['created_by'] ?? null,
            'updated_by' => $data['updated_by'] ?? null,
        ];
        
        $result = $this->wpdb->insert($table, $coreData);
        
        if ($result === false) {
            throw new \Exception('Failed to create attribute: ' . $this->wpdb->last_error);
        }
        
        return $this->wpdb->insert_id;
    }

    /**
     * Update attribute
     */
    public function update(int $id, array $data): bool
    {
        $table = esc_sql($this->table);
        
        // Extract metadata fields
        $metadata = [];
        $metadataFields = [
            'field_type', 'required', 'show_on_frontend', 'show_in_filters', 
            'filter_type', 'searchable', 'display_order', 'default_value', 
            'placeholder', 'field_options', 'validation_rules'
        ];
        
        foreach ($metadataFields as $field) {
            if (isset($data[$field])) {
                $metadata[$field] = $data[$field];
                unset($data[$field]);
            }
        }
        
        // Prepare core data
        $coreData = [
            'updated_at' => current_time('mysql'),
        ];
        
        // Update core fields if provided
        if (isset($data['name'])) {
            $coreData['name'] = $data['name'];
            // Update slug if name changed and slug not provided
            if (!isset($data['slug'])) {
                $coreData['slug'] = sanitize_title($data['name']);
            }
        }
        
        if (isset($data['slug'])) {
            $coreData['slug'] = $data['slug'];
        }
        
        if (isset($data['description'])) {
            $coreData['description'] = $data['description'];
        }
        
        if (isset($data['icon'])) {
            $coreData['icon'] = $data['icon'];
        }
        
        if (isset($data['sorting'])) {
            $coreData['sorting'] = $data['sorting'];
        }
        
        if (isset($data['status'])) {
            $coreData['status'] = $data['status'];
        }
        
        if (isset($data['updated_by'])) {
            $coreData['updated_by'] = $data['updated_by'];
        }
        
        // Handle metadata - merge with existing metadata
        if (!empty($metadata)) {
            // Get existing metadata
            $existing = $this->wpdb->get_var(
                $this->wpdb->prepare(
                    "SELECT metadata FROM `{$table}` WHERE id = %d AND type = %s",
                    $id,
                    ClassificationTypes::ATTRIBUTE
                )
            );
            
            $existingMetadata = !empty($existing) ? json_decode($existing, true) : [];
            if (!is_array($existingMetadata)) {
                $existingMetadata = [];
            }
            
            // Merge new metadata with existing
            $mergedMetadata = array_merge($existingMetadata, $metadata);
            $coreData['metadata'] = json_encode($mergedMetadata);
        }
        
        $result = $this->wpdb->update(
            $table,
            $coreData,
            ['id' => $id, 'type' => ClassificationTypes::ATTRIBUTE],
            ['%s', '%s', '%s', '%s', '%d', '%s', '%d'], // formats
            ['%d', '%s'] // where formats
        );
        
        return $result !== false;
    }

    /**
     * Delete attribute (soft delete)
     */
    public function delete(int $id): bool
    {
        return $this->update($id, ['status' => 'trash']);
    }

    /**
     * Permanently delete attribute
     */
    public function forceDelete(int $id): bool
    {
        $table = esc_sql($this->table);
        $tripAttrTable = esc_sql($this->getTripAttributesTableName());
        
        // Start transaction
        $this->wpdb->query('START TRANSACTION');
        
        try {
            // Delete related trip attributes
            $this->wpdb->delete(
                $tripAttrTable,
                ['attribute_id' => $id],
                ['%d']
            );
            
            // Delete attribute
            $result = $this->wpdb->delete(
                $table,
                ['id' => $id, 'type' => ClassificationTypes::ATTRIBUTE],
                ['%d', '%s']
            );
            
            $this->wpdb->query('COMMIT');
            
            return $result !== false;
        } catch (\Exception $e) {
            $this->wpdb->query('ROLLBACK');
            throw $e;
        }
    }

    /**
     * Check if slug exists
     */
    public function slugExists(string $slug, ?int $excludeId = null): bool
    {
        $table = esc_sql($this->table);
        $query = "SELECT COUNT(*) FROM `{$table}` WHERE type = %s AND slug = %s";
        
        if ($excludeId) {
            $query .= " AND id != %d";
            return (int) $this->wpdb->get_var(
                $this->wpdb->prepare($query, ClassificationTypes::ATTRIBUTE, $slug, $excludeId)
            ) > 0;
        }
        
        return (int) $this->wpdb->get_var(
            $this->wpdb->prepare($query, $slug)
        ) > 0;
    }

    /**
     * Get trips table name
     */
    public function getTripsTableName(): string
    {
        return ClassificationsTable::getTableName();
    }

    /**
     * Get max display order
     */
    public function getMaxDisplayOrder(): int
    {
        $table = esc_sql($this->table);
        
        return (int) $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SELECT MAX(sorting) FROM `{$table}` WHERE type = %s",
                ClassificationTypes::ATTRIBUTE
            )
        );
    }

    /**
     * Update display orders
     */
    public function updateDisplayOrders(array $orders): bool
    {
        $table = esc_sql($this->table);
        
        $this->wpdb->query('START TRANSACTION');
        
        try {
            foreach ($orders as $id => $order) {
                $this->wpdb->update(
                    $table,
                    ['sorting' => $order, 'updated_at' => current_time('mysql')],
                    ['id' => $id, 'type' => ClassificationTypes::ATTRIBUTE],
                    ['%d', '%s'],
                    ['%d', '%s']
                );
            }
            
            $this->wpdb->query('COMMIT');
            return true;
        } catch (\Exception $e) {
            $this->wpdb->query('ROLLBACK');
            return false;
        }
    }

    /**
     * Get status counts for attributes
     */
    public function getStatusCounts(array $args = []): array
    {
        $table = esc_sql($this->table);
        
        // Clear any query cache
        wp_cache_flush();
        
        // Get counts for each status
        $query = "SELECT status, COUNT(*) as count FROM `{$table}` WHERE type = %s GROUP BY status";
        $results = $this->wpdb->get_results($this->wpdb->prepare($query, ClassificationTypes::ATTRIBUTE), ARRAY_A);


        $counts = [];
        if (!empty($results) && is_array($results)) {
            foreach ($results as $row) {
                if (isset($row['status']) && isset($row['count'])) {
                    $counts[$row['status']] = (int) $row['count'];
                }
            }
        }

        // Ensure we have entries for all main statuses even if count is 0
        $counts['publish'] = $counts['publish'] ?? 0;
        $counts['draft'] = $counts['draft'] ?? 0;
        $counts['trash'] = $counts['trash'] ?? 0;

        return $counts;
    }

    /**
     * Check if attributes table exists
     * 
     * @return bool True if table exists, false otherwise
     */
    public function tableExists(): bool
    {
        global $wpdb;
        $attributesTable = $this->getTableName();
        
        // Check if attributes table exists
        $tableExists = $wpdb->get_var(
            $wpdb->prepare("SHOW TABLES LIKE %s", $attributesTable)
        ) === $attributesTable;
        
        return $tableExists;
    }

    /**
     * Get available attributes for filtering
     * 
     * @return array Array of available attributes
     */
    public function getAvailableAttributes(): array
    {
        if (!$this->tableExists()) {
            return [];
        }
        
        $table = esc_sql($this->getTableName());
        
        $attributes = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT id, name, JSON_EXTRACT(metadata, '$.field_type') as field_type, JSON_EXTRACT(metadata, '$.field_options') as field_options, icon, description 
                 FROM {$table} 
                 WHERE type = %s AND status = 'publish' 
                 ORDER BY sorting ASC, name ASC",
                ClassificationTypes::ATTRIBUTE
            )
        );
        
        $formattedAttributes = [];
        foreach ($attributes as $attribute) {
            $formattedAttributes[] = [
                'id' => $attribute->id,
                'name' => $attribute->name,
                'field_type' => $attribute->field_type,
                'field_options' => $attribute->field_options,
                'icon' => $attribute->icon,
                'description' => $attribute->description
            ];
        }
        
        return $formattedAttributes;
    }
}
