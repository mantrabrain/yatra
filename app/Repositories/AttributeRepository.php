<?php

declare(strict_types=1);

namespace Yatra\Repositories;

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
    protected array $integerFields = ['id', 'display_order', 'created_by', 'updated_by'];

    /**
     * Get paginated results
     */
    public function paginate(int $page = 1, int $perPage = 10, array $args = []): array
    {
        // Convert filter keys to WHERE clause format
        $where = [];
        
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
        return $this->wpdb->prefix . 'yatra_attributes';
    }

    /**
     * Get trip attributes table name
     */
    private function getTripAttributesTableName(): string
    {
        return $this->wpdb->prefix . 'yatra_trip_attributes';
    }

    /**
     * Get all published attributes
     */
    public function getAllPublished(): array
    {
        $table = esc_sql($this->table);
        $query = "SELECT * FROM `{$table}` 
                 WHERE status = 'publish' 
                 ORDER BY display_order ASC, name ASC";
        
        return $this->wpdb->get_results($query) ?: [];
    }

    /**
     * Get attributes for frontend display
     */
    public function getFrontendAttributes(): array
    {
        $table = esc_sql($this->table);
        $query = "SELECT * FROM `{$table}` 
                 WHERE status = 'publish' AND show_on_frontend = 1 
                 ORDER BY display_order ASC, name ASC";
        
        return $this->wpdb->get_results($query) ?: [];
    }

    /**
     * Get filterable attributes
     */
    public function getFilterableAttributes(): array
    {
        $table = esc_sql($this->table);
        $query = "SELECT * FROM `{$table}` 
                 WHERE status = 'publish' AND show_in_filters = 1 
                 ORDER BY display_order ASC, name ASC";
        
        return $this->wpdb->get_results($query) ?: [];
    }

    /**
     * Get attribute by slug
     */
    public function findBySlug(string $slug): ?\stdClass
    {
        $table = esc_sql($this->table);
        $query = "SELECT * FROM `{$table}` 
                 WHERE slug = %s AND status = 'publish'";
        
        return $this->wpdb->get_row($this->wpdb->prepare($query, $slug));
    }

    /**
     * Get attribute values for a trip
     */
    public function getTripAttributes(int $tripId): array
    {
        $attrTable = esc_sql($this->table);
        $tripAttrTable = esc_sql($this->getTripAttributesTableName());
        
        $query = "SELECT a.*, ta.value, ta.value_serialized
                 FROM `{$attrTable}` a
                 INNER JOIN `{$tripAttrTable}` ta ON a.id = ta.attribute_id
                 WHERE ta.trip_id = %d AND a.status = 'publish'
                 ORDER BY a.display_order ASC, a.name ASC";
        
        $results = $this->wpdb->get_results(
            $this->wpdb->prepare($query, $tripId)
        );
        
        // Unserialize values if needed
        foreach ($results as $result) {
            if ($result->value_serialized && $result->value) {
                $result->value = maybe_unserialize($result->value);
            }
        }
        
        return $results ?: [];
    }

    /**
     * Get trips by attribute value
     */
    public function getTripsByAttributeValue(int $attributeId, string $value): array
    {
        $tripTable = esc_sql($this->wpdb->prefix . 'yatra_trips');
        $tripAttrTable = esc_sql($this->getTripAttributesTableName());
        
        $query = "SELECT DISTINCT t.*
                 FROM `{$tripTable}` t
                 INNER JOIN `{$tripAttrTable}` ta ON t.id = ta.trip_id
                 WHERE ta.attribute_id = %d 
                 AND ta.value = %s
                 AND t.status IN ('publish', 'published')
                 AND (t.deleted_at IS NULL OR t.deleted_at = '0000-00-00 00:00:00')";
        
        return $this->wpdb->get_results(
            $this->wpdb->prepare($query, $attributeId, $value)
        ) ?: [];
    }

    /**
     * Create or update trip attribute value
     */
    public function setTripAttribute(int $tripId, int $attributeId, $value): bool
    {
        $tripAttrTable = esc_sql($this->getTripAttributesTableName());
        
        // Check if attribute value already exists
        $existing = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT id FROM `{$tripAttrTable}` 
                 WHERE trip_id = %d AND attribute_id = %d",
                $tripId,
                $attributeId
            )
        );
        
        $valueSerialized = 0;
        if (is_array($value) || is_object($value)) {
            $value = maybe_serialize($value);
            $valueSerialized = 1;
        }
        
        if ($existing) {
            // Update existing
            return (bool) $this->wpdb->update(
                $tripAttrTable,
                [
                    'value' => $value,
                    'value_serialized' => $valueSerialized,
                    'updated_at' => current_time('mysql')
                ],
                ['id' => $existing->id],
                ['%s', '%d', '%s'],
                ['%d']
            );
        } else {
            // Insert new
            return (bool) $this->wpdb->insert(
                $tripAttrTable,
                [
                    'trip_id' => $tripId,
                    'attribute_id' => $attributeId,
                    'value' => $value,
                    'value_serialized' => $valueSerialized,
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql')
                ],
                ['%d', '%d', '%s', '%d', '%s', '%s']
            );
        }
    }

    /**
     * Delete trip attribute value
     */
    public function deleteTripAttribute(int $tripId, int $attributeId): bool
    {
        $tripAttrTable = esc_sql($this->getTripAttributesTableName());
        
        return (bool) $this->wpdb->delete(
            $tripAttrTable,
            ['trip_id' => $tripId, 'attribute_id' => $attributeId],
            ['%d', '%d']
        );
    }

    /**
     * Get all attribute values for a specific attribute (for filters)
     */
    public function getAttributeValues(int $attributeId): array
    {
        $tripAttrTable = esc_sql($this->getTripAttributesTableName());
        
        $query = "SELECT DISTINCT value, COUNT(*) as count
                 FROM `{$tripAttrTable}` 
                 WHERE attribute_id = %d AND value IS NOT NULL AND value != ''
                 GROUP BY value
                 ORDER BY count DESC, value ASC";
        
        return $this->wpdb->get_results(
            $this->wpdb->prepare($query, $attributeId)
        ) ?: [];
    }

    /**
     * Search attributes by name or description
     */
    public function search(string $term): array
    {
        $table = esc_sql($this->table);
        $query = "SELECT * FROM `{$table}` 
                 WHERE status = 'publish' 
                 AND (name LIKE %s OR description LIKE %s)
                 ORDER BY display_order ASC, name ASC
                 LIMIT 50";
        
        $searchTerm = '%' . $this->wpdb->esc_like($term) . '%';
        
        return $this->wpdb->get_results(
            $this->wpdb->prepare($query, $searchTerm, $searchTerm)
        ) ?: [];
    }

    /**
     * Create attribute
     */
    public function create(array $data): int
    {
        $table = esc_sql($this->table);
        
        $data['created_at'] = current_time('mysql');
        $data['updated_at'] = current_time('mysql');
        
        // Generate slug if not provided
        if (empty($data['slug'])) {
            $data['slug'] = sanitize_title($data['name']);
        }
        
        $result = $this->wpdb->insert($table, $data);
        
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
        
        $data['updated_at'] = current_time('mysql');
        
        // Update slug if name changed and slug not provided
        if (isset($data['name']) && !isset($data['slug'])) {
            $data['slug'] = sanitize_title($data['name']);
        }
        
        // Prepare format array for different data types
        $formats = [];
        foreach ($data as $key => $value) {
            if (in_array($key, ['required', 'show_on_frontend', 'show_in_filters', 'searchable'])) {
                $formats[] = '%d'; // Boolean fields as integers
            } elseif (in_array($key, ['display_order'])) {
                $formats[] = '%d'; // Integer fields
            } else {
                $formats[] = '%s'; // String fields
            }
        }
        
        $result = $this->wpdb->update(
            $table,
            $data,
            ['id' => $id],
            $formats,
            ['%d']
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
                ['id' => $id],
                ['%d']
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
        $query = "SELECT COUNT(*) FROM `{$table}` WHERE slug = %s";
        
        if ($excludeId) {
            $query .= " AND id != %d";
            return (int) $this->wpdb->get_var(
                $this->wpdb->prepare($query, $slug, $excludeId)
            ) > 0;
        }
        
        return (int) $this->wpdb->get_var(
            $this->wpdb->prepare($query, $slug)
        ) > 0;
    }

    /**
     * Get maximum display order
     */
    public function getMaxDisplayOrder(): int
    {
        $table = esc_sql($this->table);
        
        return (int) $this->wpdb->get_var(
            "SELECT MAX(display_order) FROM `{$table}`"
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
                    ['display_order' => $order, 'updated_at' => current_time('mysql')],
                    ['id' => $id],
                    ['%d', '%s'],
                    ['%d']
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
    public function getStatusCounts(): array
    {
        $table = esc_sql($this->table);
        
        // Clear any query cache
        wp_cache_flush();
        
        // Get counts for each status
        $query = "SELECT status, COUNT(*) as count FROM `{$table}` GROUP BY status";
        $results = $this->wpdb->get_results($query, ARRAY_A);
        
        // Debug logging
        error_log('Yatra Attributes Status Count Query: ' . $query);
        error_log('Yatra Attributes Status Count Results: ' . print_r($results, true));

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
        
        error_log('Yatra Attributes Final Counts: ' . print_r($counts, true));

        return $counts;
    }
}
