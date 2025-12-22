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
     * Shared taxonomy migration handler.
     */
    protected function migrateTaxonomy(string $taxonomy, string $newTable, string $dataType): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        $terms = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT t.*, tt.description 
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
                // Skip if this specific term already migrated (tracked via term meta)
                if (!$this->isForceMigration() && function_exists('get_term_meta')) {
                    $existingMappedId = get_term_meta($term->term_id, $metaKey, true);
                    if (!empty($existingMappedId)) {
                        $skipped++;
                        $this->updateProgress($dataType, 'running', $migrated, $skipped, $failed, $total, null, null);
                        continue;
                    }
                }

                $baseSlug = $term->slug;
                if (empty($baseSlug)) {
                    $baseSlug = function_exists('sanitize_title')
                        ? sanitize_title($term->name ?: uniqid($taxonomy . '-'))
                        : preg_replace('/[^a-z0-9\-]+/i', '-', strtolower($term->name ?: uniqid($taxonomy . '-')));
                }

                // Ensure unique slug by appending suffix when conflicts occur
                $slug = $this->generateUniqueSlug($baseSlug, $newTable);

                $inserted = $this->wpdb->insert(
                    $this->wpdb->prefix . $newTable,
                    [
                        'name' => $term->name,
                        'slug' => $slug,
                        'description' => $term->description ?? '',
                        'created_at' => current_time('mysql'),
                        'updated_at' => current_time('mysql'),
                    ]
                );

                if ($inserted) {
                    $newId = (int) $this->wpdb->insert_id;
                    if (function_exists('update_term_meta')) {
                        update_term_meta($term->term_id, $metaKey, $newId);
                    }
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
            } catch (\Exception $e) {
                $failed++;
                Logger::error("Exception migrating {$taxonomy}: " . $e->getMessage(), [
                    'source' => 'migration',
                    'taxonomy' => $taxonomy,
                    'term_slug' => $term->slug
                ]);
                $this->updateProgress($dataType, 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        }

        return compact('migrated', 'skipped', 'failed');
    }
}
