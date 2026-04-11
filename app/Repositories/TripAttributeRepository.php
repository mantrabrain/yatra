<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Database\Tables\TripsTable;
use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Database\Tables\TripClassificationsTable;
use Yatra\Utils\QueryCache;
use Yatra\Utils\Cache;

/**
 * Trip Attribute Repository
 * Handles database operations for trip-attribute relationships
 */
class TripAttributeRepository extends BaseRepository
{
    /**
     * Get table name
     */
    public function getTableName(): string
    {
        return TripClassificationsTable::getTableName();
    }

    /**
     * Get table name (protected for internal use)
     */
    protected function getTableNameInternal(): string
    {
        return TripClassificationsTable::getTableName();
    }

    /**
     * Resolve field_type from the attribute definition (classifications.metadata).
     */
    private function resolveFieldTypeFromAttributeDefinition(int $attributeId): string
    {
        $attrRepo = new AttributeRepository();
        $def = $attrRepo->find($attributeId);
        if (!$def || empty($def->metadata)) {
            return 'text';
        }
        $meta = json_decode((string) $def->metadata, true);
        if (is_array($meta) && !empty($meta['field_type']) && is_string($meta['field_type'])) {
            return $meta['field_type'];
        }

        return 'text';
    }

    /**
     * @param array<mixed> $arr
     */
    private function isListArray(array $arr): bool
    {
        if (function_exists('array_is_list')) {
            return array_is_list($arr);
        }

        $i = 0;
        foreach ($arr as $k => $_) {
            if ($k !== $i++) {
                return false;
            }
        }

        return true;
    }

    private function bustTripAttributeQueryCache(int $tripId): void
    {
        Cache::delete(Cache::KEY_TRIP_ATTRIBUTES . '_' . $tripId);
    }

    /**
     * Save trip attributes
     */
    public function saveTripAttributes(int $tripId, array $attributes): bool
    {
        // Writes must not go through read-cache (Cache::remember).
        global $wpdb;
        $table_trip_classifications = $this->getTableNameInternal();

        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '{$table_trip_classifications}'");
        if (!$table_exists) {
            return false;
        }

        $wpdb->query('START TRANSACTION');

        try {
            $wpdb->query($wpdb->prepare(
                "DELETE FROM {$table_trip_classifications} 
                 WHERE trip_id = %d 
                 AND classification_type = 'attribute'",
                $tripId
            ));

            if ($attributes === []) {
                $wpdb->query('COMMIT');
                $this->bustTripAttributeQueryCache($tripId);
                do_action('yatra_trip_attributes_bulk_updated', $tripId, []);

                return true;
            }

            foreach ($attributes as $attributeId => $value) {
                $actualAttributeId = null;
                $fieldType = null;
                $actualValue = null;

                if (is_numeric($attributeId) && is_array($value)) {
                    $actualAttributeId = (int) $attributeId;
                    $resolvedType = $this->resolveFieldTypeFromAttributeDefinition($actualAttributeId);

                    if (array_key_exists('value', $value)) {
                        $fieldType = isset($value['field_type']) && is_string($value['field_type']) && $value['field_type'] !== ''
                            ? $value['field_type']
                            : $resolvedType;
                        $actualValue = $value['value'];
                    } elseif ($this->isListArray($value)) {
                        $fieldType = $resolvedType;
                        $actualValue = $value;
                    } else {
                        $fieldType = isset($value['field_type']) && is_string($value['field_type']) && $value['field_type'] !== ''
                            ? $value['field_type']
                            : $resolvedType;
                        $actualValue = $value['value'] ?? $value;
                    }
                } elseif (is_numeric($attributeId) && !is_array($value)) {
                    $actualAttributeId = (int) $attributeId;
                    $fieldType = $this->resolveFieldTypeFromAttributeDefinition($actualAttributeId);
                    $actualValue = $value;
                } elseif (is_array($value)) {
                    $actualAttributeId = isset($value['id']) ? (int) $value['id'] :
                        (isset($value['attribute_id']) ? (int) $value['attribute_id'] : null);
                    if ($actualAttributeId === null || $actualAttributeId <= 0) {
                        continue;
                    }
                    $resolvedType = $this->resolveFieldTypeFromAttributeDefinition($actualAttributeId);

                    if (array_key_exists('value', $value)) {
                        $fieldType = isset($value['field_type']) && is_string($value['field_type']) && $value['field_type'] !== ''
                            ? $value['field_type']
                            : $resolvedType;
                        $actualValue = $value['value'];
                    } elseif ($this->isListArray($value)) {
                        $fieldType = $resolvedType;
                        $actualValue = $value;
                    } else {
                        $fieldType = isset($value['field_type']) && is_string($value['field_type']) && $value['field_type'] !== ''
                            ? $value['field_type']
                            : $resolvedType;
                        $actualValue = $value['value'] ?? $value;
                    }
                } else {
                    continue;
                }

                if ($actualAttributeId === null || $actualAttributeId <= 0) {
                    continue;
                }

                if ($fieldType === 'text' || $fieldType === '') {
                    $fieldType = $this->resolveFieldTypeFromAttributeDefinition($actualAttributeId);
                }

                $metadata = [
                    'field_type' => $fieldType,
                    'value' => $actualValue,
                ];

                $result = $wpdb->insert(
                    $table_trip_classifications,
                    [
                        'trip_id' => $tripId,
                        'classification_id' => $actualAttributeId,
                        'classification_type' => 'attribute',
                        'relationship_type' => 'primary',
                        'metadata' => wp_json_encode($metadata),
                        'sort_order' => 0,
                        'is_featured' => 0,
                        'is_active' => 1,
                        'created_at' => current_time('mysql'),
                        'updated_at' => current_time('mysql'),
                    ],
                    ['%d', '%d', '%s', '%s', '%s', '%d', '%d', '%d', '%s', '%s']
                );

                if ($result === false) {
                    throw new \Exception('Failed to insert trip attribute relationship');
                }
            }

            $wpdb->query('COMMIT');
            $this->bustTripAttributeQueryCache($tripId);
            do_action('yatra_trip_attributes_bulk_updated', $tripId, $attributes);

            return true;
        } catch (\Exception $e) {
            $wpdb->query('ROLLBACK');

            return false;
        }
    }

    /**
     * Get trip attributes with attribute details
     */
    public function getTripAttributes(int $tripId): array
    {
        global $wpdb;
        $table_trip_classifications = $this->getTableNameInternal();
        $table_classifications = ClassificationsTable::getTableName();
        
        // Check if tables exist first
        $trip_table_exists = $wpdb->get_var("SHOW TABLES LIKE '{$table_trip_classifications}'");
        $class_table_exists = $wpdb->get_var("SHOW TABLES LIKE '{$table_classifications}'");
        
        if (!$trip_table_exists || !$class_table_exists) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                }
            return [];
        }
        
        // Get attributes from the trip_classifications table joined with classifications
        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT tc.id as relationship_id, tc.metadata as relationship_metadata,
                    tc.created_at, tc.updated_at,
                    c.id as attribute_id, c.name, c.slug, c.description, c.icon, c.metadata,
                    JSON_UNQUOTE(JSON_EXTRACT(tc.metadata, '$.field_type')) as field_type,
                    JSON_UNQUOTE(JSON_EXTRACT(tc.metadata, '$.value')) as value,
                    JSON_EXTRACT(c.metadata, '$.field_options') as field_options,
                    JSON_EXTRACT(c.metadata, '$.required') as required,
                    JSON_EXTRACT(c.metadata, '$.show_on_frontend') as show_on_frontend,
                    JSON_EXTRACT(c.metadata, '$.show_in_filters') as show_in_filters
             FROM {$table_trip_classifications} tc
             INNER JOIN {$table_classifications} c ON tc.classification_id = c.id
             WHERE tc.trip_id = %d 
             AND tc.classification_type = 'attribute'
             AND tc.is_active = 1
             AND c.status = 'publish'
             ORDER BY tc.sort_order ASC, c.name ASC",
            $tripId
        )) ?: [];

        foreach ($rows as $row) {
            if (!empty($row->relationship_metadata)) {
                $rel = json_decode($row->relationship_metadata, true);
                if (is_array($rel) && array_key_exists('value', $rel)) {
                    $row->value = $rel['value'];
                }
            }
            if (!empty($row->metadata)) {
                $def = json_decode($row->metadata, true);
                if (is_array($def) && isset($def['field_options']) && is_array($def['field_options'])) {
                    $row->field_options = wp_json_encode($def['field_options']);
                }
                if (is_array($def) && !empty($def['field_type']) && is_string($def['field_type'])) {
                    $row->field_type = $def['field_type'];
                }
            }
        }

        return $rows;
    }

    /**
     * Update trip attribute value
     */
    public function updateTripAttribute(int $tripId, int $attributeId, string $value): bool
    {
        global $wpdb;
        $table_trip_classifications = $this->getTableNameInternal();
        
        // Update the value in metadata JSON
        return $wpdb->query($wpdb->prepare(
            "UPDATE {$table_trip_classifications} 
             SET metadata = JSON_SET(
                 metadata, '$.value', %s,
                 metadata, '$.updated_at', %s
             ),
             updated_at = %s
             WHERE trip_id = %d 
             AND classification_id = %d
             AND classification_type = 'attribute'",
            $value,
            current_time('mysql'),
            current_time('mysql'),
            $tripId,
            $attributeId
        )) !== false;
    }

    /**
     * Set trip attribute value
     */
    public function setTripAttribute(int $tripId, int $attributeId, $value): bool
    {
        global $wpdb;
        $table_trip_classifications = $this->getTableNameInternal();
        
        // Check if relationship already exists
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT id FROM {$table_trip_classifications} 
             WHERE trip_id = %d AND classification_id = %d AND classification_type = 'attribute'",
            $tripId, $attributeId
        ));
        
        // Store only essential data: field_type and value
        $metadata = [
            'field_type' => 'text', // Default field type
            'value' => $value
        ];
        
        // Debug logging
        if (defined('WP_DEBUG') && WP_DEBUG) {
            }
        
        if ($existing) {
            // Update existing relationship
            $result = $wpdb->update(
                $table_trip_classifications,
                ['metadata' => json_encode($metadata), 'updated_at' => current_time('mysql')],
                ['trip_id' => $tripId, 'classification_id' => $attributeId, 'classification_type' => 'attribute']
            );
            
            if (defined('WP_DEBUG') && WP_DEBUG) {
                }
            
            return $result !== false;
        } else {
            // Insert new relationship
            $result = $wpdb->insert(
                $table_trip_classifications,
                [
                    'trip_id' => $tripId,
                    'classification_id' => $attributeId,
                    'classification_type' => 'attribute',
                    'metadata' => json_encode($metadata),
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql')
                ]
            );
            
            if (defined('WP_DEBUG') && WP_DEBUG) {
                }
            
            return $result !== false;
        }
    }

    /**
     * Delete trip attribute relationship
     */
    public function deleteTripAttribute(int $tripId, int $attributeId): bool
    {
        global $wpdb;
        $table_trip_classifications = $this->getTableNameInternal();
        
        return $wpdb->delete($table_trip_classifications, [
            'trip_id' => $tripId,
            'classification_id' => $attributeId,
            'classification_type' => 'attribute'
        ]) !== false;
    }

    /**
     * Delete all trip attributes
     */
    public function deleteAllTripAttributes(int $tripId): bool
    {
        global $wpdb;
        $table_trip_classifications = $this->getTableNameInternal();
        
        return $wpdb->query($wpdb->prepare(
            "DELETE FROM {$table_trip_classifications} 
             WHERE trip_id = %d 
             AND classification_type = 'attribute'",
            $tripId
        )) !== false;
    }
}
