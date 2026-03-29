<?php

namespace Yatra\Migration;

use Yatra\Utils\Logger;
use Yatra\Migration\MigrationProgress;

/**
 * BaseMigration provides shared helpers and access to the MigrationService state.
 */
abstract class BaseMigration
{
    protected MigrationProgress $service;
    protected \wpdb $wpdb;

    public function __construct(MigrationProgress $service)
    {
        $this->service = $service;
        $this->wpdb = $service->getWpdb();
    }

    protected function isForceMigration(): bool
    {
        return $this->service->isForceMigration();
    }

    protected function updateProgress(
        string $dataType,
        string $status,
        int $migrated,
        int $skipped,
        int $failed,
        int $total,
        ?string $startedAt,
        ?string $completedAt
    ): void {
        $this->service->updateProgress($dataType, $status, $migrated, $skipped, $failed, $total, $startedAt, $completedAt);
    }

    protected function generateUniqueSlug(string $baseSlug, string $table): string
    {
        return $this->service->generateUniqueSlug($baseSlug, $table);
    }

    protected function getPostMeta(int $postId): array
    {
        return $this->service->getPostMeta($postId);
    }

    protected function getRawPostMeta(int $postId, string $metaKey): ?string
    {
        return $this->service->getRawPostMeta($postId, $metaKey);
    }

    protected function setRawPostMeta(int $postId, string $metaKey, string $metaValue): void
    {
        $this->service->setRawPostMeta($postId, $metaKey, $metaValue);
    }

    protected function getRawTermMeta(int $termId, string $metaKey): ?string
    {
        return $this->service->getRawTermMeta($termId, $metaKey);
    }

    protected function setRawTermMeta(int $termId, string $metaKey, string $metaValue): void
    {
        $this->service->setRawTermMeta($termId, $metaKey, $metaValue);
    }

    protected function getLegacyMetaValue(array $meta, array $keys, $default = null)
    {
        return $this->service->getLegacyMetaValue($meta, $keys, $default);
    }

    protected function tableExists(string $table): bool
    {
        return $this->service->tableExists($table);
    }

    protected function isTripMigrated(int $oldTripId): bool
    {
        return $this->service->isTripMigrated($oldTripId);
    }

    protected function getMigratedTripId(int $oldTripId): ?int
    {
        return $this->service->getMigratedTripId($oldTripId);
    }

    protected function migrateTripDestinations(int $oldTripId, int $newTripId): void
    {
        $this->service->migrateTripDestinations($oldTripId, $newTripId);
    }

    protected function migrateTripActivities(int $oldTripId, int $newTripId): void
    {
        $this->service->migrateTripActivities($oldTripId, $newTripId);
    }

    protected function deleteTripRelationships(int $tripId): void
    {
        $this->service->deleteTripRelationships($tripId);
    }

    protected function truncateTableIfExists(string $table): void
    {
        $this->service->truncateTableIfExists($table);
    }

    /**
     * Fix existing draft records to publish status
     * This ensures all destinations/activities are published
     */
    protected function fixDraftRecordsToPublish(string $table): void
    {
        $fullTable = $this->wpdb->prefix . $table;
        
        // Update all draft records to publish
        $updated = $this->wpdb->query(
            "UPDATE {$fullTable} SET status = 'publish' WHERE status = 'draft'"
        );
        
        if ($updated > 0) {
            Logger::info("Fixed {$updated} draft records to publish status in {$table}", [
                'source' => 'migration',
                'table' => $table,
                'updated_count' => $updated
            ]);
        }
    }

    /**
     * Shared taxonomy migration handler.
     *
     * Migrates old WordPress taxonomy terms into the unified ClassificationsTable
     * (wp_yatra_new_classifications) using the `type` column to differentiate.
     *
     * @param string $taxonomy Old WordPress taxonomy slug (e.g. 'destination', 'activity', 'attributes')
     * @param string $classificationType The classification type value for the new table (e.g. 'destination', 'activity', 'attribute')
     * @param string $dataType Progress tracking key (e.g. 'destinations', 'activities', 'attributes')
     */
    protected function migrateTaxonomy(string $taxonomy, string $classificationType, string $dataType): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        $classificationsTable = \Yatra\Database\Tables\ClassificationsTable::getTableName();

        $terms = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT t.*, tt.description, tt.parent
                 FROM {$this->wpdb->terms} t
                 INNER JOIN {$this->wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
                 WHERE tt.taxonomy = %s",
                $taxonomy
            )
        );

        $total = count($terms);
        $metaKey = sprintf('_yatra_migrated_%s_id', $taxonomy);

        foreach ($terms as $term) {
            try {
                // Prepare slug
                $baseSlug = $term->slug;
                if (empty($baseSlug)) {
                    $baseSlug = function_exists('sanitize_title')
                        ? sanitize_title($term->name ?: uniqid($taxonomy . '-'))
                        : preg_replace('/[^a-z0-9\-]+/i', '-', strtolower($term->name ?: uniqid($taxonomy . '-')));
                }

                $slug = $baseSlug;
                $existingId = null;

                if ($this->isForceMigration()) {
                    // Force migration: generate unique slug
                    $counter = 1;
                    $uniqueSlug = $slug;
                    while ($this->wpdb->get_var($this->wpdb->prepare(
                        "SELECT id FROM {$classificationsTable} WHERE type = %s AND slug = %s",
                        $classificationType,
                        $uniqueSlug
                    ))) {
                        $uniqueSlug = $slug . '-' . $counter++;
                    }
                    $slug = $uniqueSlug;
                } else {
                    // Regular migration: Check if already exists by type+slug
                    $existingId = $this->wpdb->get_var($this->wpdb->prepare(
                        "SELECT id FROM {$classificationsTable} WHERE type = %s AND slug = %s",
                        $classificationType,
                        $baseSlug
                    ));

                    if (!$existingId) {
                        // Generate unique slug for new insert
                        $counter = 1;
                        $uniqueSlug = $slug;
                        while ($this->wpdb->get_var($this->wpdb->prepare(
                            "SELECT id FROM {$classificationsTable} WHERE type = %s AND slug = %s",
                            $classificationType,
                            $uniqueSlug
                        ))) {
                            $uniqueSlug = $slug . '-' . $counter++;
                        }
                        $slug = $uniqueSlug;
                    }
                }

                // Get term meta for featured image / icon using raw SQL
                $termImage = $this->getRawTermMeta((int) $term->term_id, 'yatra_term_image');
                $metadata = [];
                if (!empty($termImage)) {
                    $metadata['featured_image'] = $termImage;
                }

                $data = [
                    'type' => $classificationType,
                    'name' => $term->name,
                    'slug' => $slug,
                    'description' => $term->description ?? '',
                    'parent_id' => !empty($term->parent) ? $this->getParentClassificationId($term->parent, $taxonomy, $classificationType) : null,
                    'metadata' => !empty($metadata) ? json_encode($metadata) : null,
                    'status' => 'publish',
                    'updated_at' => current_time('mysql'),
                ];

                if ($existingId && !$this->isForceMigration()) {
                    // Regular migration: Update existing record
                    $updated = $this->wpdb->update(
                        $classificationsTable,
                        $data,
                        ['id' => $existingId]
                    );

                    if ($updated !== false) {
                        $newId = $existingId;
                        $this->setRawTermMeta((int) $term->term_id, $metaKey, (string) $newId);
                        $migrated++;
                        $this->updateProgress($dataType, 'running', $migrated, $skipped, $failed, $total, null, null);
                        usleep(50000);
                    } else {
                        $failed++;
                        Logger::error("Failed to update {$taxonomy}: {$this->wpdb->last_error}", [
                            'source' => 'migration',
                            'taxonomy' => $taxonomy,
                            'term_slug' => $term->slug
                        ]);
                        $this->updateProgress($dataType, 'running', $migrated, $skipped, $failed, $total, null, null);
                    }
                } else {
                    // Force migration OR new record: Insert new
                    $data['created_at'] = current_time('mysql');
                    $inserted = $this->wpdb->insert(
                        $classificationsTable,
                        $data
                    );

                    if ($inserted) {
                        $newId = (int) $this->wpdb->insert_id;
                        $this->setRawTermMeta((int) $term->term_id, $metaKey, (string) $newId);
                        $migrated++;
                        $this->updateProgress($dataType, 'running', $migrated, $skipped, $failed, $total, null, null);
                        usleep(50000);
                    } else {
                        $failed++;
                        Logger::error("Failed to insert {$taxonomy}: {$this->wpdb->last_error}", [
                            'source' => 'migration',
                            'taxonomy' => $taxonomy,
                            'term_slug' => $term->slug
                        ]);
                        $this->updateProgress($dataType, 'running', $migrated, $skipped, $failed, $total, null, null);
                    }
                }
            } catch (\Exception $e) {
                $failed++;
                Logger::error("Exception migrating {$taxonomy}: " . $e->getMessage(), [
                    'source' => 'migration',
                    'taxonomy' => $taxonomy,
                    'term_slug' => $term->slug ?? 'unknown'
                ]);
                $this->updateProgress($dataType, 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        }

        return compact('migrated', 'skipped', 'failed');
    }

    /**
     * Look up the new classifications table ID for a parent term
     */
    private function getParentClassificationId(int $parentTermId, string $taxonomy, string $classificationType): ?int
    {
        $metaKey = sprintf('_yatra_migrated_%s_id', $taxonomy);
        $parentNewId = $this->getRawTermMeta($parentTermId, $metaKey);
        return $parentNewId ? (int) $parentNewId : null;
    }
}
