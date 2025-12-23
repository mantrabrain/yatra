<?php

declare(strict_types=1);

namespace Yatra\Migrations;

use Yatra\Services\AttributeService;
use Yatra\Utils\Logger;

/**
 * Attribute Migration Script
 * 
 * Migrates attributes from old WordPress taxonomy system to new Yatra attribute tables
 * 
 * Old System:
 * - wp_terms (term_id, name, slug)
 * - wp_term_taxonomy (term_id, taxonomy = 'attributes')
 * - wp_termmeta (term_id, meta_key = 'attribute_field_type', meta_value)
 * - wp_postmeta (post_id, meta_key = 'tour_meta_custom_attributes', meta_value = serialized)
 * 
 * New System:
 * - yatra_attributes (id, name, slug, field_type, etc.)
 * - yatra_trip_attributes (trip_id, attribute_id, value)
 */
class AttributeMigration
{
    /**
     * @var AttributeService
     */
    private $attributeService;

    /**
     * @var \wpdb
     */
    private $wpdb;

    /**
     * Constructor
     */
    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->attributeService = new AttributeService();
    }

    /**
     * Run the migration
     */
    public function migrate(): array
    {
        $results = [
            'attributes_created' => 0,
            'trip_attributes_migrated' => 0,
            'errors' => [],
            'warnings' => []
        ];

        try {
            Logger::info('Starting attribute migration from WordPress taxonomy to Yatra tables');

            // Step 1: Migrate attribute definitions
            $attributeMap = $this->migrateAttributeDefinitions($results);

            // Step 2: Migrate trip attribute values
            $this->migrateTripAttributeValues($attributeMap, $results);

            Logger::info('Attribute migration completed successfully', $results);

        } catch (\Exception $e) {
            $results['errors'][] = 'Migration failed: ' . $e->getMessage();
            Logger::error('Attribute migration failed', ['error' => $e->getMessage()]);
        }

        return $results;
    }

    /**
     * Migrate attribute definitions from wp_terms to yatra_attributes
     */
    private function migrateAttributeDefinitions(array &$results): array
    {
        $attributeMap = [];

        // Get old attributes from WordPress taxonomy
        $oldAttributes = $this->wpdb->get_results("
            SELECT t.term_id, t.name, t.slug, tm.meta_value as field_type
            FROM {$this->wpdb->terms} t
            JOIN {$this->wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
            LEFT JOIN {$this->wpdb->termmeta} tm ON t.term_id = tm.term_id AND tm.meta_key = 'attribute_field_type'
            WHERE tt.taxonomy = 'attributes'
            ORDER BY t.term_id
        ");

        if (empty($oldAttributes)) {
            $results['warnings'][] = 'No old attributes found in WordPress taxonomy system';
            return $attributeMap;
        }

        foreach ($oldAttributes as $oldAttr) {
            try {
                // Prepare attribute data
                $attributeData = [
                    'name' => $oldAttr->name,
                    'slug' => $oldAttr->slug,
                    'field_type' => $oldAttr->field_type ?: 'text_field',
                    'description' => '',
                    'required' => 0,
                    'show_on_frontend' => 1,
                    'show_in_filters' => 0,
                    'filter_type' => 'exact',
                    'searchable' => 0,
                    'status' => 'publish'
                ];

                // Create new attribute
                $newAttributeId = $this->attributeService->createAttribute($attributeData);

                if ($newAttributeId) {
                    $attributeMap[$oldAttr->term_id] = $newAttributeId;
                    $results['attributes_created']++;
                    
                    Logger::info("Migrated attribute: {$oldAttr->name} (old ID: {$oldAttr->term_id} -> new ID: {$newAttributeId})");
                } else {
                    $results['errors'][] = "Failed to create attribute: {$oldAttr->name}";
                }

            } catch (\Exception $e) {
                $results['errors'][] = "Error migrating attribute {$oldAttr->name}: " . $e->getMessage();
            }
        }

        return $attributeMap;
    }

    /**
     * Migrate trip attribute values from wp_postmeta to yatra_trip_attributes
     */
    private function migrateTripAttributeValues(array $attributeMap, array &$results): void
    {
        if (empty($attributeMap)) {
            $results['warnings'][] = 'No attribute mappings available, skipping trip attribute migration';
            return;
        }

        // Get all trips with custom attributes
        $tripsWithAttributes = $this->wpdb->get_results("
            SELECT post_id, meta_value
            FROM {$this->wpdb->postmeta}
            WHERE meta_key = 'tour_meta_custom_attributes'
            AND meta_value IS NOT NULL
            AND meta_value != ''
        ");

        if (empty($tripsWithAttributes)) {
            $results['warnings'][] = 'No trips with custom attributes found';
            return;
        }

        foreach ($tripsWithAttributes as $tripMeta) {
            try {
                $tripId = (int) $tripMeta->post_id;
                $attributes = maybe_unserialize($tripMeta->meta_value);

                if (!is_array($attributes)) {
                    continue;
                }

                foreach ($attributes as $oldAttributeId => $attributeData) {
                    // Check if this old attribute ID exists in our migration map
                    if (!isset($attributeMap[$oldAttributeId])) {
                        $results['warnings'][] = "Unknown attribute ID {$oldAttributeId} for trip {$tripId}";
                        continue;
                    }

                    $newAttributeId = $attributeMap[$oldAttributeId];
                    $value = $attributeData['content'] ?? '';

                    if (empty($value)) {
                        continue; // Skip empty values
                    }

                    // Set the attribute value for the trip
                    $success = $this->attributeService->setTripAttribute($tripId, $newAttributeId, $value);

                    if ($success) {
                        $results['trip_attributes_migrated']++;
                    } else {
                        $results['errors'][] = "Failed to set attribute {$newAttributeId} for trip {$tripId}";
                    }
                }

            } catch (\Exception $e) {
                $results['errors'][] = "Error migrating attributes for trip {$tripMeta->post_id}: " . $e->getMessage();
            }
        }
    }

    /**
     * Check if migration is needed
     */
    public function isMigrationNeeded(): bool
    {
        // Check if old attributes exist
        $oldAttributes = $this->wpdb->get_var("
            SELECT COUNT(*)
            FROM {$this->wpdb->term_taxonomy}
            WHERE taxonomy = 'attributes'
        ");

        // Check if new attributes already exist
        $newAttributes = $this->wpdb->get_var("
            SELECT COUNT(*)
            FROM {$this->wpdb->prefix}yatra_attributes
        ");

        return $oldAttributes > 0 && $newAttributes == 0;
    }

    /**
     * Get migration preview
     */
    public function getMigrationPreview(): array
    {
        $preview = [
            'old_attributes_count' => 0,
            'old_trip_attributes_count' => 0,
            'sample_attributes' => []
        ];

        // Count old attributes
        $preview['old_attributes_count'] = (int) $this->wpdb->get_var("
            SELECT COUNT(*)
            FROM {$this->wpdb->term_taxonomy}
            WHERE taxonomy = 'attributes'
        ");

        // Count trips with attributes
        $preview['old_trip_attributes_count'] = (int) $this->wpdb->get_var("
            SELECT COUNT(*)
            FROM {$this->wpdb->postmeta}
            WHERE meta_key = 'tour_meta_custom_attributes'
            AND meta_value IS NOT NULL
            AND meta_value != ''
        ");

        // Get sample attributes
        $sampleAttributes = $this->wpdb->get_results("
            SELECT t.term_id, t.name, t.slug, tm.meta_value as field_type
            FROM {$this->wpdb->terms} t
            JOIN {$this->wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
            LEFT JOIN {$this->wpdb->termmeta} tm ON t.term_id = tm.term_id AND tm.meta_key = 'attribute_field_type'
            WHERE tt.taxonomy = 'attributes'
            LIMIT 5
        ");

        foreach ($sampleAttributes as $attr) {
            $preview['sample_attributes'][] = [
                'id' => $attr->term_id,
                'name' => $attr->name,
                'slug' => $attr->slug,
                'field_type' => $attr->field_type ?: 'text_field'
            ];
        }

        return $preview;
    }

    /**
     * Rollback migration (for testing purposes)
     */
    public function rollback(): array
    {
        $results = [
            'attributes_deleted' => 0,
            'trip_attributes_deleted' => 0,
            'errors' => []
        ];

        try {
            // Delete all trip attributes
            $deletedTripAttrs = $this->wpdb->query("
                DELETE FROM {$this->wpdb->prefix}yatra_trip_attributes
            ");

            $results['trip_attributes_deleted'] = $deletedTripAttrs ?: 0;

            // Delete all attributes
            $deletedAttrs = $this->wpdb->query("
                DELETE FROM {$this->wpdb->prefix}yatra_attributes
            ");

            $results['attributes_deleted'] = $deletedAttrs ?: 0;

            Logger::info('Attribute migration rollback completed', $results);

        } catch (\Exception $e) {
            $results['errors'][] = 'Rollback failed: ' . $e->getMessage();
            Logger::error('Attribute migration rollback failed', ['error' => $e->getMessage()]);
        }

        return $results;
    }
}
