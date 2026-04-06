<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Constants\ClassificationTypes;
use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Utils\QueryCache;
use Yatra\Utils\Cache;

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
     * SQL fragment: metadata JSON flag is enabled (handles true, 1, "1", "true" from PHP json_encode).
     *
     * @param non-empty-string $key Metadata key (alphanumeric + underscore only)
     */
    public static function metadataEnabledSql(string $key): string
    {
        $key = preg_replace('/[^a-z0-9_]/i', '', $key) ?: 'invalid';
        $path = '$.' . $key;

        return "(JSON_EXTRACT(metadata, '{$path}') = true "
            . "OR JSON_EXTRACT(metadata, '{$path}') = 1 "
            . "OR JSON_UNQUOTE(JSON_EXTRACT(metadata, '{$path}')) IN ('1','true','TRUE','yes','YES','on','ON'))";
    }

    /**
     * Same as {@see metadataEnabledSql()} but for a qualified table alias (e.g. subqueries).
     *
     * @param non-empty-string $tableAlias
     * @param non-empty-string $key
     */
    public static function metadataEnabledSqlOnAlias(string $tableAlias, string $key): string
    {
        $key = preg_replace('/[^a-z0-9_]/i', '', $key) ?: 'invalid';
        $path = '$.' . $key;
        $alias = preg_replace('/[^a-z0-9_]/i', '', $tableAlias) ?: 'm';
        $col = $alias . '.metadata';

        return "(JSON_EXTRACT({$col}, '{$path}') = true "
            . "OR JSON_EXTRACT({$col}, '{$path}') = 1 "
            . "OR JSON_UNQUOTE(JSON_EXTRACT({$col}, '{$path}')) IN ('1','true','TRUE','yes','YES','on','ON'))";
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
        $flag = self::metadataEnabledSql('show_on_frontend');
        $query = "SELECT * FROM `{$table}` 
                 WHERE type = %s AND status = 'publish' AND {$flag}
                 ORDER BY sorting ASC, name ASC";
        
        return $this->wpdb->get_results($this->wpdb->prepare($query, ClassificationTypes::ATTRIBUTE)) ?: [];
    }

    /**
     * Get filterable attributes
     */
    public function getFilterableAttributes(): array
    {
        $table = esc_sql($this->table);
        $flag = self::metadataEnabledSql('show_in_filters');
        $query = "SELECT * FROM `{$table}` 
                 WHERE type = %s AND status = 'publish' AND {$flag}
                 ORDER BY sorting ASC, name ASC";
        
        return $this->wpdb->get_results($this->wpdb->prepare($query, ClassificationTypes::ATTRIBUTE)) ?: [];
    }

    /**
     * Published attribute IDs that may be used in public listing filters (URL / sidebar).
     *
     * @return list<int>
     */
    public function getFilterableAttributeIds(): array
    {
        $ids = [];
        foreach ($this->getFilterableAttributes() as $row) {
            $ids[] = (int) $row->id;
        }

        return $ids;
    }

    /**
     * Published attributes marked required (trip form / API must supply a value when saving attributes).
     *
     * @return list<array{id:int,name:string,field_type:string}>
     */
    public function getRequiredPublishedAttributeDefinitions(): array
    {
        $table = esc_sql($this->table);
        $flag = self::metadataEnabledSql('required');
        $rows = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT id, name, metadata FROM `{$table}` WHERE type = %s AND status = 'publish' AND {$flag}",
                ClassificationTypes::ATTRIBUTE
            )
        ) ?: [];

        $out = [];
        foreach ($rows as $row) {
            $meta = !empty($row->metadata) ? json_decode((string) $row->metadata, true) : [];
            $ft = is_array($meta) && isset($meta['field_type']) ? (string) $meta['field_type'] : 'text';
            $out[] = [
                'id' => (int) $row->id,
                'name' => (string) ($row->name ?? ''),
                'field_type' => $ft,
            ];
        }

        return $out;
    }

    /**
     * Normalize REST / form payloads to id-keyed map for validation.
     *
     * @param array<int|string, mixed> $attributes
     * @return array<int, mixed>
     */
    public function normalizeTripAttributesPayloadForValidation(array $attributes): array
    {
        $out = [];
        foreach ($attributes as $k => $v) {
            if (is_array($v) && isset($v['attribute_id'])) {
                $out[(int) $v['attribute_id']] = $v;
                continue;
            }
            if (is_array($v) && isset($v['id'])) {
                $out[(int) $v['id']] = $v;
                continue;
            }
            if (is_numeric($k)) {
                $kid = (int) $k;
                $out[$kid] = is_array($v) ? $v : ['value' => $v, 'field_type' => 'text'];
            }
        }

        return $out;
    }

    /**
     * @param array<int|string, mixed> $attributes Payload keyed by attribute id (TripAttributeRepository::saveTripAttributes format)
     *
     * @throws \InvalidArgumentException
     */
    public function validatePayloadCoversRequiredAttributes(array $attributes): void
    {
        $attributes = $this->normalizeTripAttributesPayloadForValidation($attributes);

        foreach ($this->getRequiredPublishedAttributeDefinitions() as $def) {
            $id = $def['id'];
            $fieldType = $def['field_type'] ?: 'text';
            if (!$this->payloadHasNonEmptyAttributeValue($attributes, $id, $fieldType)) {
                $label = $def['name'] !== '' ? $def['name'] : (string) $id;
                throw new \InvalidArgumentException(
                    sprintf(
                        /* translators: %s: attribute name */
                        __('Required trip attribute "%s" is missing or empty.', 'yatra'),
                        $label
                    ),
                    400
                );
            }
        }
    }

    /**
     * @param array<int|string, mixed> $attributes
     */
    private function payloadHasNonEmptyAttributeValue(array $attributes, int $attributeId, string $fieldType): bool
    {
        $keys = [(string) $attributeId, $attributeId];
        $entry = null;
        foreach ($keys as $k) {
            if (array_key_exists($k, $attributes)) {
                $entry = $attributes[$k];
                break;
            }
        }

        if ($entry === null) {
            return false;
        }

        if (is_array($entry) && array_key_exists('value', $entry)) {
            $fieldType = (string) ($entry['field_type'] ?? $fieldType);
            $val = $entry['value'];
        } else {
            $val = $entry;
        }

        if ($fieldType === 'checkbox') {
            return $val === true || $val === 1 || $val === '1' || $val === 'true' || $val === 'on';
        }

        if (is_array($val)) {
            if (isset($val['min'], $val['max'])) {
                return ($val['min'] !== '' && $val['min'] !== null) || ($val['max'] !== '' && $val['max'] !== null);
            }
            if (isset($val['from'], $val['to'])) {
                return ($val['from'] !== '' && $val['from'] !== null) || ($val['to'] !== '' && $val['to'] !== null);
            }

            return $val !== [];
        }

        if (is_string($val)) {
            return trim($val) !== '';
        }

        return $val !== null && $val !== '';
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
     * Normalize attribute status for DB (column on classifications row).
     */
    private function normalizeAttributeStatus($status, string $default = 'publish'): string
    {
        $s = is_string($status) ? strtolower(trim($status)) : '';
        if ($s === '') {
            return $default;
        }
        if (in_array($s, ['publish', 'draft', 'trash'], true)) {
            return $s;
        }

        return $default;
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

        $sorting = $data['sorting'] ?? null;
        if ($sorting === null && isset($metadata['display_order'])) {
            $sorting = (int) $metadata['display_order'];
        }
        
        // Prepare core data
        $coreData = [
            'type' => ClassificationTypes::ATTRIBUTE,
            'name' => $data['name'],
            'slug' => !empty($data['slug']) ? $data['slug'] : sanitize_title($data['name']),
            'description' => $data['description'] ?? null,
            'icon' => $data['icon'] ?? null,
            'metadata' => !empty($metadata) ? json_encode($metadata) : null,
            'sorting' => (int) ($sorting ?? 0),
            'status' => $this->normalizeAttributeStatus($data['status'] ?? null, 'publish'),
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
            $coreData['status'] = $this->normalizeAttributeStatus($data['status'], 'draft');
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
            if (isset($metadata['display_order'])) {
                $coreData['sorting'] = (int) $metadata['display_order'];
            }
        }
        
        // Let WordPress infer formats — fixed-length format arrays misaligned with dynamic $coreData
        // and corrupted string columns (e.g. status, icon, metadata).
        $result = $this->wpdb->update(
            $table,
            $coreData,
            ['id' => $id, 'type' => ClassificationTypes::ATTRIBUTE],
            null,
            ['%d', '%s']
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
        
        // Use QueryCache for caching attributes
        return Cache::remember(Cache::KEY_AVAILABLE_ATTRIBUTES, function() {
            $formattedAttributes = [];
            foreach ($this->getFilterableAttributes() as $row) {
                $meta = !empty($row->metadata) ? json_decode((string) $row->metadata, true) : [];
                if (!is_array($meta)) {
                    $meta = [];
                }
                $fo = $meta['field_options'] ?? null;
                $fieldOptions = $fo === null ? null : (is_string($fo) ? $fo : wp_json_encode($fo));
                $formattedAttributes[] = [
                    'id' => (int) $row->id,
                    'name' => (string) ($row->name ?? ''),
                    'field_type' => isset($meta['field_type']) ? (string) $meta['field_type'] : 'text',
                    'field_options' => $fieldOptions,
                    'icon' => $row->icon ?? null,
                    'description' => (string) ($row->description ?? ''),
                ];
            }

            return $formattedAttributes;
        }, Cache::DURATION_ATTRIBUTES); // Cache for 1 hour
    }
}
