<?php

namespace Yatra\Migration;

use Yatra\Constants\ClassificationTypes;
use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Database\Tables\TripClassificationsTable;
use Yatra\Utils\Logger;
use Yatra\Migration\MigrationProgress;

/**
 * Attribute Migration - Migrates trip attributes from old Yatra system
 *
 * Old System: Attributes stored as WordPress taxonomy 'attributes' terms,
 *   and per-trip values in post meta 'tour_meta_custom_attributes' (serialized array).
 * New System: Unified ClassificationsTable (type='attribute') + TripClassificationsTable
 *
 * All queries use raw SQL because old taxonomies/CPTs are NOT registered in the new plugin.
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

        Logger::info("Starting attribute migration.", ['source' => 'migration']);

        // Step 1: Migrate attribute definitions (taxonomy terms → ClassificationsTable)
        $defResult = $this->migrateAttributeDefinitions();
        $migrated += $defResult['migrated'];
        $skipped += $defResult['skipped'];
        $failed += $defResult['failed'];

        // Step 2: Migrate trip-attribute relationships (post meta → TripClassificationsTable)
        $relResult = $this->migrateTripAttributeRelationships();
        $migrated += $relResult['migrated'];
        $skipped += $relResult['skipped'];
        $failed += $relResult['failed'];

        Logger::info("Attribute migration completed", [
            'source' => 'migration',
            'migrated' => $migrated,
            'skipped' => $skipped,
            'failed' => $failed
        ]);

        return compact('migrated', 'skipped', 'failed');
    }

    /**
     * Migrate attribute definitions from old taxonomy 'attributes' into ClassificationsTable (type=attribute).
     */
    private function migrateAttributeDefinitions(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        $classificationsTable = ClassificationsTable::getTableName();
        $metaKey = '_yatra_migrated_attributes_id';

        // Raw SQL: old 'attributes' taxonomy terms
        $terms = $this->wpdb->get_results(
            "SELECT t.term_id, t.name, t.slug, tt.description
             FROM {$this->wpdb->terms} t
             INNER JOIN {$this->wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
             WHERE tt.taxonomy = 'attributes'"
        );

        if (empty($terms)) {
            Logger::info("No 'attributes' taxonomy terms found", ['source' => 'migration']);
            return compact('migrated', 'skipped', 'failed');
        }

        $total = count($terms);
        Logger::info("Found {$total} attribute terms", ['source' => 'migration', 'count' => $total]);
        $this->updateProgress('attributes', 'running', 0, 0, 0, $total, null, null);

        foreach ($terms as $term) {
            try {
                $termId = (int) $term->term_id;

                // Check if already migrated via raw term meta
                $existingMappedId = $this->getRawTermMeta($termId, $metaKey);
                if (!$this->isForceMigration() && $existingMappedId) {
                    $skipped++;
                    $this->updateProgress('attributes', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                $baseSlug = !empty($term->slug) ? $term->slug : sanitize_title($term->name ?: uniqid('attr-'));

                // Check if already exists in ClassificationsTable by type+slug
                $existingId = $this->wpdb->get_var($this->wpdb->prepare(
                    "SELECT id FROM {$classificationsTable} WHERE type = %s AND slug = %s",
                    ClassificationTypes::ATTRIBUTE,
                    $baseSlug
                ));

                $slug = $baseSlug;

                if ($existingId && !$this->isForceMigration()) {
                    // Skip if already exists and not force migration
                    $skipped++;
                    $this->updateProgress('attributes', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                if (!$existingId) {
                    // Generate unique slug for new insert
                    $counter = 1;
                    $uniqueSlug = $slug;
                    while ($this->wpdb->get_var($this->wpdb->prepare(
                        "SELECT id FROM {$classificationsTable} WHERE type = %s AND slug = %s",
                        ClassificationTypes::ATTRIBUTE,
                        $uniqueSlug
                    ))) {
                        $uniqueSlug = $slug . '-' . $counter++;
                    }
                    $slug = $uniqueSlug;
                }

                // Get icon from raw term meta
                $icon = $this->getRawTermMeta($termId, 'icon');

                // Build metadata JSON
                $metadata = [];
                $fieldType = $this->getRawTermMeta($termId, 'attribute_field_type');
                if ($fieldType) {
                    $metadata['field_type'] = $fieldType;
                }
                $fieldOptions = $this->getRawTermMeta($termId, 'field_options');
                if ($fieldOptions) {
                    $metadata['field_options'] = maybe_unserialize($fieldOptions);
                }

                $data = [
                    'type' => ClassificationTypes::ATTRIBUTE,
                    'name' => $term->name,
                    'slug' => $slug,
                    'description' => $term->description ?? '',
                    'icon' => $icon ?: null,
                    'metadata' => !empty($metadata) ? json_encode($metadata) : null,
                    'status' => 'publish',
                    'updated_at' => current_time('mysql'),
                ];

                if ($existingId && $this->isForceMigration()) {
                    // Update existing during force migration
                    $this->wpdb->update($classificationsTable, $data, ['id' => $existingId]);
                    $newId = (int) $existingId;
                } else {
                    // Insert new
                    $data['created_at'] = current_time('mysql');
                    $inserted = $this->wpdb->insert($classificationsTable, $data);
                    if (!$inserted) {
                        $errorMsg = $this->wpdb->last_error;
                        // Check if it's a duplicate key error and handle gracefully
                        if (strpos($errorMsg, 'Duplicate entry') !== false) {
                            $skipped++;
                            $this->updateProgress('attributes', 'running', $migrated, $skipped, $failed, $total, null, null);
                            continue;
                        }
                        $failed++;
                        Logger::error("Failed to insert attribute '{$term->name}': {$errorMsg}", ['source' => 'migration']);
                        $this->updateProgress('attributes', 'running', $migrated, $skipped, $failed, $total, null, null);
                        continue;
                    }
                    $newId = (int) $this->wpdb->insert_id;
                }

                // Store mapping in raw term meta
                $this->setRawTermMeta($termId, $metaKey, (string) $newId);
                $migrated++;
                $this->updateProgress('attributes', 'running', $migrated, $skipped, $failed, $total, null, null);

            } catch (\Exception $e) {
                $failed++;
                Logger::error("Exception migrating attribute: {$term->name} — {$e->getMessage()}", ['source' => 'migration']);
                $this->updateProgress('attributes', 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        }

        return compact('migrated', 'skipped', 'failed');
    }

    /**
     * Migrate trip-attribute relationships.
     *
     * Old system: post meta 'tour_meta_custom_attributes' = serialized array keyed by term_id.
     * New system: TripClassificationsTable rows with classification_type='attribute' and metadata containing value.
     */
    private function migrateTripAttributeRelationships(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        $tripClassificationsTable = TripClassificationsTable::getTableName();
        $metaKey = '_yatra_migrated_attributes_id';

        // Raw SQL: get all tour posts with custom attributes meta
        $tripsWithAttributes = $this->wpdb->get_results(
            "SELECT post_id, meta_value
             FROM {$this->wpdb->postmeta}
             WHERE meta_key = 'tour_meta_custom_attributes'
             AND meta_value IS NOT NULL
             AND meta_value != ''"
        );

        if (empty($tripsWithAttributes)) {
            Logger::info("No trips with custom attributes found", ['source' => 'migration']);
            return compact('migrated', 'skipped', 'failed');
        }

        $total = count($tripsWithAttributes);
        Logger::info("Found {$total} trips with custom attributes", ['source' => 'migration']);

        foreach ($tripsWithAttributes as $tripMeta) {
            try {
                $oldTripId = (int) $tripMeta->post_id;
                $newTripId = $this->getMigratedTripId($oldTripId);

                if (!$newTripId) {
                    $skipped++;
                    continue;
                }

                $attributes = maybe_unserialize($tripMeta->meta_value);
                if (!is_array($attributes)) {
                    $skipped++;
                    continue;
                }

                foreach ($attributes as $oldTermId => $attributeData) {
                    // Look up the new classification ID via raw term meta
                    $newAttrId = $this->getRawTermMeta((int) $oldTermId, $metaKey);
                    if (!$newAttrId) {
                        continue;
                    }

                    $value = $attributeData['content'] ?? $attributeData['value'] ?? '';
                    if (empty($value)) {
                        continue;
                    }

                    // Check if relationship already exists
                    $exists = $this->wpdb->get_var($this->wpdb->prepare(
                        "SELECT id FROM {$tripClassificationsTable}
                         WHERE trip_id = %d AND classification_id = %d AND classification_type = %s",
                        $newTripId,
                        (int) $newAttrId,
                        ClassificationTypes::ATTRIBUTE
                    ));

                    $relMetadata = json_encode(['value' => $value]);

                    if ($exists) {
                        if ($this->isForceMigration()) {
                            $this->wpdb->update(
                                $tripClassificationsTable,
                                ['metadata' => $relMetadata, 'updated_at' => current_time('mysql')],
                                ['id' => $exists]
                            );
                            $migrated++;
                        }
                    } else {
                        $this->wpdb->insert($tripClassificationsTable, [
                            'trip_id' => $newTripId,
                            'classification_id' => (int) $newAttrId,
                            'classification_type' => ClassificationTypes::ATTRIBUTE,
                            'relationship_type' => 'primary',
                            'metadata' => $relMetadata,
                            'sort_order' => 0,
                            'is_active' => 1,
                            'created_at' => current_time('mysql'),
                            'updated_at' => current_time('mysql'),
                        ]);
                        $migrated++;
                    }
                }

            } catch (\Exception $e) {
                $failed++;
                Logger::error("Exception migrating attributes for trip {$tripMeta->post_id}: {$e->getMessage()}", ['source' => 'migration']);
            }
        }

        return compact('migrated', 'skipped', 'failed');
    }
}
