<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Database\Tables\BaseRepository;

/**
 * Trip Attribute Repository
 * Handles database operations for trip-attribute relationships
 */
class TripAttributeRepository extends BaseRepository
{
    /**
     * Get table name
     */
    protected function getTableName(): string
    {
        global $wpdb;
        return $wpdb->prefix . 'yatra_trip_attributes';
    }

    /**
     * Save trip attributes
     */
    public function saveTripAttributes(int $tripId, array $attributes): bool
    {
        global $wpdb;
        $table_trip_attributes = $this->getTableName();
        
        $wpdb->query('START TRANSACTION');
        
        try {
            // Delete existing attributes
            $wpdb->delete($table_trip_attributes, ['trip_id' => $tripId]);
            
            // Insert new attributes
            foreach ($attributes as $attrId => $value) {
                $wpdb->insert($table_trip_attributes, [
                    'trip_id' => $tripId,
                    'attribute_id' => $attrId,
                    'value' => $value,
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql')
                ]);
            }
            
            $wpdb->query('COMMIT');
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
        $table_trip_attributes = $this->getTableName();
        $table_attributes = $wpdb->prefix . 'yatra_attributes';
        
        return $wpdb->get_results($wpdb->prepare(
            "SELECT ta.*, a.name, a.slug, a.type, a.options
             FROM {$table_trip_attributes} ta
             LEFT JOIN {$table_attributes} a ON a.id = ta.attribute_id
             WHERE ta.trip_id = %d
             ORDER BY a.name ASC",
            $tripId
        ));
    }

    /**
     * Update trip attribute
     */
    public function updateTripAttribute(int $tripId, int $attributeId, string $value): bool
    {
        global $wpdb;
        $table_trip_attributes = $this->getTableName();
        
        return $wpdb->update(
            $table_trip_attributes,
            ['value' => $value, 'updated_at' => current_time('mysql')],
            ['trip_id' => $tripId, 'attribute_id' => $attributeId],
            ['%s', '%s'],
            ['%d', '%d']
        ) !== false;
    }

    /**
     * Delete trip attribute
     */
    public function deleteTripAttribute(int $tripId, int $attributeId): bool
    {
        global $wpdb;
        $table_trip_attributes = $this->getTableName();
        
        return $wpdb->delete($table_trip_attributes, [
            'trip_id' => $tripId,
            'attribute_id' => $attributeId
        ], ['%d', '%d']) !== false;
    }

    /**
     * Delete all trip attributes
     */
    public function deleteAllTripAttributes(int $tripId): bool
    {
        global $wpdb;
        $table_trip_attributes = $this->getTableName();
        
        return $wpdb->delete($table_trip_attributes, [
            'trip_id' => $tripId
        ], ['%d']) !== false;
    }
}
