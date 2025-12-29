<?php

namespace Yatra\Migration;

use Yatra\Utils\Logger;
use Yatra\Migration\MigrationProgress;

/**
 * Attribute Migration - Migrates trip attributes from old Yatra system
 * 
 * Old System: Attributes stored as post meta on tour posts
 * New System: Dedicated yatra_attributes and yatra_trip_attributes tables
 */
class AttributeMigration extends BaseMigration
{
    public function __construct(MigrationProgress $service)
    {
        parent::__construct($service);
    }

    public function run(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        Logger::info("Starting attribute migration", ['source' => 'migration']);

        // Step 1: Migrate attribute definitions
        $attributeResult = $this->migrateAttributeDefinitions();
        $migrated += $attributeResult['migrated'];
        $skipped += $attributeResult['skipped'];
        $failed += $attributeResult['failed'];

        // Step 2: Migrate trip-attribute relationships
        $relationshipResult = $this->migrateTripAttributeRelationships();
        $migrated += $relationshipResult['migrated'];
        $skipped += $relationshipResult['skipped'];
        $failed += $relationshipResult['failed'];

        Logger::info("Attribute migration completed", [
            'source' => 'migration',
            'migrated' => $migrated,
            'skipped' => $skipped,
            'failed' => $failed
        ]);

        return compact('migrated', 'skipped', 'failed');
    }

    /**
     * Migrate attribute definitions from old system
     * 
     * Old system stores attributes in various ways:
     * - Custom taxonomies (tour_attribute)
     * - Post meta fields
     * - Plugin-specific tables (if they exist)
     */
    private function migrateAttributeDefinitions(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        // Check if old attributes table exists (some versions had this)
        $oldAttributesTable = $this->wpdb->prefix . 'yatra_tour_attributes';
        $tableExists = $this->tableExists($oldAttributesTable);

        if ($tableExists) {
            Logger::info("Found old yatra_tour_attributes table", ['source' => 'migration']);
            
            $oldAttributes = $this->wpdb->get_results("SELECT * FROM {$oldAttributesTable}");
            $total = count($oldAttributes);

            Logger::info("Found {$total} attributes in old table", [
                'source' => 'migration',
                'count' => $total
            ]);
            
            $this->updateProgress('attributes', 'running', 0, 0, 0, $total, null, null);

            foreach ($oldAttributes as $oldAttr) {
                try {
                    // Check if already migrated
                    $exists = $this->wpdb->get_var($this->wpdb->prepare(
                        "SELECT id FROM {$this->wpdb->prefix}yatra_attributes WHERE slug = %s",
                        $oldAttr->slug ?? sanitize_title($oldAttr->name)
                    ));

                    if (!$this->isForceMigration() && $exists) {
                        $skipped++;
                        Logger::info("Skipping attribute: {$oldAttr->name} (already exists with ID {$exists})", [
                            'source' => 'migration',
                            'attribute_name' => $oldAttr->name,
                            'existing_id' => $exists
                        ]);
                        $this->updateProgress('attributes', 'running', $migrated, $skipped, $failed, $total, null, null);
                        continue;
                    }

                    $slug = $this->generateUniqueSlug(
                        $oldAttr->slug ?? sanitize_title($oldAttr->name),
                        'yatra_attributes'
                    );

                    // Parse field options if they exist
                    $fieldOptions = null;
                    if (!empty($oldAttr->options)) {
                        $fieldOptions = is_string($oldAttr->options) 
                            ? $oldAttr->options 
                            : json_encode($oldAttr->options);
                    }

                    // Parse icon data
                    $icon = null;
                    if (!empty($oldAttr->icon)) {
                        $icon = is_string($oldAttr->icon) 
                            ? $oldAttr->icon 
                            : maybe_serialize($oldAttr->icon);
                    }

                    $attributeData = [
                        'name' => $oldAttr->name,
                        'slug' => $slug,
                        'description' => $oldAttr->description ?? '',
                        'field_type' => $oldAttr->field_type ?? 'text',
                        'field_options' => $fieldOptions,
                        'icon' => $icon,
                        'display_order' => $oldAttr->display_order ?? 0,
                        'status' => $oldAttr->status ?? 'publish',
                        'created_at' => $oldAttr->created_at ?? current_time('mysql'),
                        'updated_at' => $oldAttr->updated_at ?? current_time('mysql'),
                    ];

                    if ($exists && $this->isForceMigration()) {
                        $this->wpdb->update(
                            $this->wpdb->prefix . 'yatra_attributes',
                            $attributeData,
                            ['id' => $exists]
                        );
                        Logger::info("Updated attribute: {$oldAttr->name}", [
                            'source' => 'migration',
                            'attribute_id' => $exists
                        ]);
                        $migrated++;
                    } else {
                        $inserted = $this->wpdb->insert(
                            $this->wpdb->prefix . 'yatra_attributes',
                            $attributeData
                        );

                        if ($inserted) {
                            $newId = $this->wpdb->insert_id;
                            Logger::info("Migrated attribute: {$oldAttr->name}", [
                                'source' => 'migration',
                                'old_id' => $oldAttr->id,
                                'new_id' => $newId,
                                'field_type' => $attributeData['field_type']
                            ]);
                            $migrated++;
                        } else {
                            $failed++;
                            Logger::error("Failed to insert attribute: {$oldAttr->name}", [
                                'source' => 'migration',
                                'error' => $this->wpdb->last_error
                            ]);
                            $this->updateProgress('attributes', 'running', $migrated, $skipped, $failed, $total, null, null);
                            continue;
                        }
                    }
                    
                    $this->updateProgress('attributes', 'running', $migrated, $skipped, $failed, $total, null, null);

                } catch (\Exception $e) {
                    $failed++;
                    Logger::error("Exception migrating attribute: {$oldAttr->name}", [
                        'source' => 'migration',
                        'error' => $e->getMessage()
                    ]);
                    $this->updateProgress('attributes', 'running', $migrated, $skipped, $failed, $total, null, null);
                }
            }
        } else {
            Logger::info("No old yatra_tour_attributes table found, checking for taxonomy-based attributes", [
                'source' => 'migration'
            ]);

            // Check for taxonomy-based attributes
            $taxonomyResult = $this->migrateAttributesFromTaxonomy();
            $migrated += $taxonomyResult['migrated'];
            $skipped += $taxonomyResult['skipped'];
            $failed += $taxonomyResult['failed'];
        }

        return compact('migrated', 'skipped', 'failed');
    }

    /**
     * Migrate attributes from old taxonomy system
     */
    private function migrateAttributesFromTaxonomy(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        // Check for 'attributes' taxonomy (old Yatra system)
        $terms = $this->wpdb->get_results(
            "SELECT t.*, tt.description 
             FROM {$this->wpdb->terms} t
             INNER JOIN {$this->wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
             WHERE tt.taxonomy = 'attributes'"
        );

        if (empty($terms)) {
            Logger::info("No 'attributes' taxonomy terms found", ['source' => 'migration']);
            return compact('migrated', 'skipped', 'failed');
        }

        $total = count($terms);
        Logger::info("Found {$total} attribute terms in taxonomy", [
            'source' => 'migration',
            'count' => $total
        ]);
        
        $this->updateProgress('attributes', 'running', 0, 0, 0, $total, null, null);

        foreach ($terms as $term) {
            try {
                // Check if already migrated
                $existingId = get_term_meta($term->term_id, '_migrated_to_attribute_id', true);
                if (!$this->isForceMigration() && $existingId) {
                    $skipped++;
                    Logger::info("Skipping taxonomy attribute: {$term->name} (already migrated to ID {$existingId})", [
                        'source' => 'migration',
                        'term_id' => $term->term_id,
                        'existing_id' => $existingId
                    ]);
                    $this->updateProgress('attributes', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }
                
                $slug = $this->generateUniqueSlug($term->slug, 'yatra_attributes');

                // Get term meta from old system
                // Old system uses 'attribute_field_type' as meta key
                $fieldType = get_term_meta($term->term_id, 'attribute_field_type', true);
                if (empty($fieldType)) {
                    $fieldType = 'text'; // Default to text if not set
                }
                
                // Get icon from term meta
                $icon = get_term_meta($term->term_id, 'icon', true);
                
                // Get field options if available
                $fieldOptions = get_term_meta($term->term_id, 'field_options', true);
                
                Logger::debug("Processing taxonomy attribute: {$term->name}", [
                    'source' => 'migration',
                    'term_id' => $term->term_id,
                    'field_type' => $fieldType,
                    'has_icon' => !empty($icon)
                ]);

                $attributeData = [
                    'name' => $term->name,
                    'slug' => $slug,
                    'description' => $term->description ?? '',
                    'field_type' => $fieldType,
                    'field_options' => $fieldOptions ? json_encode($fieldOptions) : null,
                    'icon' => $icon ? maybe_serialize($icon) : null,
                    'display_order' => 0,
                    'status' => 'publish',
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql'),
                ];

                $inserted = $this->wpdb->insert(
                    $this->wpdb->prefix . 'yatra_attributes',
                    $attributeData
                );

                if ($inserted) {
                    $newId = $this->wpdb->insert_id;
                    
                    // Store mapping for relationship migration
                    update_term_meta($term->term_id, '_migrated_to_attribute_id', $newId);
                    
                    Logger::info("Migrated taxonomy attribute: {$term->name}", [
                        'source' => 'migration',
                        'term_id' => $term->term_id,
                        'new_id' => $newId
                    ]);
                    $migrated++;
                } else {
                    $failed++;
                    Logger::error("Failed to insert taxonomy attribute: {$term->name}", [
                        'source' => 'migration',
                        'error' => $this->wpdb->last_error
                    ]);
                }
                
                $this->updateProgress('attributes', 'running', $migrated, $skipped, $failed, $total, null, null);

            } catch (\Exception $e) {
                $failed++;
                Logger::error("Exception migrating taxonomy attribute: {$term->name}", [
                    'source' => 'migration',
                    'error' => $e->getMessage()
                ]);
                $this->updateProgress('attributes', 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        }

        return compact('migrated', 'skipped', 'failed');
    }

    /**
     * Migrate trip-attribute relationships
     * Old system stores attributes in post meta: 'tour_meta_custom_attributes' (serialized array)
     */
    private function migrateTripAttributeRelationships(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        // Get all trips with custom attributes from old system
        $tripsWithAttributes = $this->wpdb->get_results(
            "SELECT post_id, meta_value 
             FROM {$this->wpdb->postmeta}
             WHERE meta_key = 'tour_meta_custom_attributes'
             AND meta_value IS NOT NULL
             AND meta_value != ''"
        );

        if (empty($tripsWithAttributes)) {
            Logger::info("No trips with custom attributes found in old system", ['source' => 'migration']);
            return compact('migrated', 'skipped', 'failed');
        }

        $total = count($tripsWithAttributes);
        Logger::info("Found {$total} trips with custom attributes", [
            'source' => 'migration',
            'count' => $total
        ]);

        foreach ($tripsWithAttributes as $tripMeta) {
            try {
                $oldTripId = (int) $tripMeta->post_id;
                
                // Get the new trip ID
                $newTripId = $this->getMigratedTripId($oldTripId);
                
                if (!$newTripId) {
                    $skipped++;
                    Logger::debug("Skipping trip {$oldTripId} - not migrated yet", ['source' => 'migration']);
                    continue;
                }

                // Unserialize the attributes array
                $attributes = maybe_unserialize($tripMeta->meta_value);
                
                if (!is_array($attributes)) {
                    $skipped++;
                    Logger::debug("Skipping trip {$oldTripId} - invalid attributes data", ['source' => 'migration']);
                    continue;
                }

                // Process each attribute
                foreach ($attributes as $oldAttributeId => $attributeData) {
                    // Get the new attribute ID from term meta
                    $newAttributeId = get_term_meta($oldAttributeId, '_migrated_to_attribute_id', true);
                    
                    if (!$newAttributeId) {
                        Logger::debug("Attribute term {$oldAttributeId} not migrated yet", ['source' => 'migration']);
                        continue;
                    }

                    // Get the value from the attribute data
                    $value = $attributeData['content'] ?? $attributeData['value'] ?? '';
                    
                    if (empty($value)) {
                        continue; // Skip empty values
                    }

                    // Insert trip-attribute relationship
                    if ($this->insertTripAttribute($newTripId, $newAttributeId, $value)) {
                        $migrated++;
                        
                        Logger::debug("Migrated attribute relationship", [
                            'source' => 'migration',
                            'old_trip_id' => $oldTripId,
                            'new_trip_id' => $newTripId,
                            'old_attribute_id' => $oldAttributeId,
                            'new_attribute_id' => $newAttributeId,
                            'value' => substr($value, 0, 50)
                        ]);
                    }
                }

            } catch (\Exception $e) {
                $failed++;
                Logger::error("Exception migrating attributes for trip {$tripMeta->post_id}", [
                    'source' => 'migration',
                    'error' => $e->getMessage()
                ]);
            }
        }

        Logger::info("Completed trip-attribute relationship migration", [
            'source' => 'migration',
            'migrated' => $migrated,
            'skipped' => $skipped,
            'failed' => $failed
        ]);

        return compact('migrated', 'skipped', 'failed');
    }


    /**
     * Insert trip-attribute relationship
     */
    private function insertTripAttribute(int $tripId, int $attributeId, $value): bool
    {
        // Check if relationship already exists
        $exists = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT id FROM {$this->wpdb->prefix}yatra_trip_attributes 
             WHERE trip_id = %d AND attribute_id = %d",
            $tripId,
            $attributeId
        ));

        $valueSerialized = 0;
        if (is_array($value) || is_object($value)) {
            $value = maybe_serialize($value);
            $valueSerialized = 1;
        }

        if ($exists) {
            if ($this->isForceMigration()) {
                return (bool) $this->wpdb->update(
                    $this->wpdb->prefix . 'yatra_trip_attributes',
                    [
                        'value' => $value,
                        'value_serialized' => $valueSerialized,
                        'updated_at' => current_time('mysql')
                    ],
                    ['id' => $exists]
                );
            }
            return false;
        }

        return (bool) $this->wpdb->insert(
            $this->wpdb->prefix . 'yatra_trip_attributes',
            [
                'trip_id' => $tripId,
                'attribute_id' => $attributeId,
                'value' => $value,
                'value_serialized' => $valueSerialized,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ]
        );
    }
}
