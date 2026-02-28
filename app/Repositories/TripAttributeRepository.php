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
     * Save trip attributes
     */
    public function saveTripAttributes(int $tripId, array $attributes): bool
    {
        // Use Cache for caching trip attributes
        $cacheKey = Cache::PREFIX_ATTRIBUTES . $tripId . '_' . md5(serialize($attributes));
        
        return Cache::remember($cacheKey, function() use ($tripId, $attributes) {
            global $wpdb;
            $table_trip_classifications = $this->getTableNameInternal();
            
            // Check if table exists first
            $table_exists = $wpdb->get_var("SHOW TABLES LIKE '{$table_trip_classifications}'");
            if (!$table_exists) {
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    }
                return false;
            }
            
            $wpdb->query('START TRANSACTION');
            
            try {
                // Delete existing attribute relationships for this trip
                $wpdb->query($wpdb->prepare(
                    "DELETE FROM {$table_trip_classifications} 
                     WHERE trip_id = %d 
                     AND classification_type = 'attribute'",
                    $tripId
                ));
                
                // Insert new attribute relationships
                $attributeCount = 0;
                foreach ($attributes as $attributeId => $value) {
                    // Handle both Record<number, any> format and array format
                    $actualAttributeId = null;
                    $fieldType = null;
                    $actualValue = null;
                    
                    if (is_numeric($attributeId) && is_array($value)) {
                        // Record<number, any> format: {attribute_id: {field_type, value, ...}}
                        $actualAttributeId = (int) $attributeId;
                        $fieldType = $value['field_type'] ?? 'text';
                        $actualValue = $value['value'] ?? '';
                        } elseif (is_numeric($attributeId) && !is_array($value)) {
                        // Simple format: {attribute_id: value}
                        $actualAttributeId = (int) $attributeId;
                        $fieldType = 'text'; // Default field type
                        $actualValue = $value;
                        } elseif (is_array($value)) {
                        // Array format: [attribute_data] or {id: 123, value: 'xxx'}
                        $actualAttributeId = isset($value['id']) ? (int) $value['id'] : 
                                       (isset($value['attribute_id']) ? (int) $value['attribute_id'] : null);
                        $fieldType = $value['field_type'] ?? 'text';
                        $actualValue = $value['value'] ?? '';
                        } else {
                        // Skip invalid format
                        continue;
                    }
                    
                    if ($actualAttributeId === null) {
                        continue;
                    }
                    
                    // Only save essential data: field_type and value
                    $metadata = [
                        'field_type' => $fieldType,
                        'value' => $actualValue
                    ];
                    
                    // Insert the relationship record
                    $result = $wpdb->insert(
                        $table_trip_classifications,
                        [
                            'trip_id' => $tripId,
                            'classification_id' => $actualAttributeId,
                            'classification_type' => 'attribute',
                            'relationship_type' => 'primary',
                            'metadata' => json_encode($metadata),
                            'sort_order' => 0,
                            'is_featured' => 0,
                            'is_active' => 1,
                            'created_at' => current_time('mysql'),
                            'updated_at' => current_time('mysql')
                        ],
                        ['%d', '%d', '%s', '%s', '%s', '%d', '%d', '%d', '%s', '%s']
                    );
                    
                    if ($result === false) {
                        throw new \Exception('Failed to insert trip attribute relationship');
                    }
                    
                    $attributeCount++;
                }
                
                if ($attributeCount > 0) {
                    $wpdb->query('COMMIT');
                    // Fire bulk update hook
                    do_action('yatra_trip_attributes_bulk_updated', $tripId, $attributes);
                    
                    return true;
                } else {
                    $wpdb->query('ROLLBACK');
                    return false;
                }
                
            } catch (\Exception $e) {
                $wpdb->query('ROLLBACK');
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    }
                return false;
            }
            
        }, 3600); // Cache for 1 hour
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
        return $wpdb->get_results($wpdb->prepare(
            "SELECT tc.id as relationship_id, tc.metadata as relationship_metadata,
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
        ));
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
