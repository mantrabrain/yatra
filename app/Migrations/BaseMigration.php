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
     * @param string|array<int, string> $taxonomy One taxonomy slug, or several (e.g. `trip_category` + `tour_category`) merged into one classification type.
     * @param string $classificationType The classification type value for the new table (e.g. 'destination', 'activity', 'attribute')
     * @param string $dataType Progress tracking key (e.g. 'destinations', 'activities', 'attributes')
     */
    protected function migrateTaxonomy($taxonomy, string $classificationType, string $dataType): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        $classificationsTable = \Yatra\Database\Tables\ClassificationsTable::getTableName();

        $taxes = is_array($taxonomy) ? array_values(array_filter($taxonomy, static fn ($t) => is_string($t) && $t !== '')) : [$taxonomy];
        if ($taxes === []) {
            return compact('migrated', 'skipped', 'failed');
        }

        $placeholders = implode(',', array_fill(0, count($taxes), '%s'));
        $sql = "SELECT t.*, tt.description, tt.parent, tt.taxonomy AS source_taxonomy
                 FROM {$this->wpdb->terms} t
                 INNER JOIN {$this->wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
                 WHERE tt.taxonomy IN ({$placeholders})";

        // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- placeholders match $taxes count
        $terms = $this->wpdb->get_results($this->wpdb->prepare($sql, ...$taxes));

        $total = count($terms);

        foreach ($terms as $term) {
            $termTax = isset($term->source_taxonomy) && is_string($term->source_taxonomy) && $term->source_taxonomy !== ''
                ? $term->source_taxonomy
                : (string) $taxes[0];
            $metaKey = sprintf('_yatra_migrated_%s_id', $termTax);

            try {
                // Prepare slug
                $baseSlug = $term->slug;
                if (empty($baseSlug)) {
                    $baseSlug = function_exists('sanitize_title')
                        ? sanitize_title($term->name ?: uniqid($termTax . '-'))
                        : preg_replace('/[^a-z0-9\-]+/i', '-', strtolower($term->name ?: uniqid($termTax . '-')));
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

                // Featured image: old sites used different term meta keys (yatra_term_image, thumbnail_id, …).
                $termImage = $this->resolveLegacyTermFeaturedImageId((int) $term->term_id);
                $metadata = [];

                // When updating an existing row, merge with current JSON so we do not wipe featured_image / other keys if only part of the resolver runs.
                if ($existingId && !$this->isForceMigration()) {
                    $existingJson = $this->wpdb->get_var($this->wpdb->prepare(
                        "SELECT metadata FROM {$classificationsTable} WHERE id = %d",
                        (int) $existingId
                    ));
                    if (is_string($existingJson) && $existingJson !== '') {
                        $decoded = json_decode($existingJson, true);
                        if (is_array($decoded)) {
                            $metadata = $decoded;
                        }
                    }
                }

                if ($termImage !== null && $termImage !== '') {
                    $metadata['featured_image'] = $termImage;
                }

                $data = [
                    'type' => $classificationType,
                    'name' => $term->name,
                    'slug' => $slug,
                    'description' => $term->description ?? '',
                    'parent_id' => !empty($term->parent) ? $this->getParentClassificationId((int) $term->parent, $termTax, $classificationType) : null,
                    'metadata' => $metadata !== [] ? wp_json_encode($metadata) : null,
                    'status' => 'publish',
                    'updated_at' => current_time('mysql'),
                ];

                // 3.x admin + single templates read `icon` (serialized {type: image, value: attachment_id}), not only metadata.featured_image.
                if ($termImage !== null && $termImage !== '' && (int) $termImage > 0) {
                    $data['icon'] = maybe_serialize([
                        'type' => 'image',
                        'value' => (int) $termImage,
                    ]);
                }

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
                        Logger::error("Failed to update {$termTax}: {$this->wpdb->last_error}", [
                            'source' => 'migration',
                            'taxonomy' => $termTax,
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
                        Logger::error("Failed to insert {$termTax}: {$this->wpdb->last_error}", [
                            'source' => 'migration',
                            'taxonomy' => $termTax,
                            'term_slug' => $term->slug
                        ]);
                        $this->updateProgress($dataType, 'running', $migrated, $skipped, $failed, $total, null, null);
                    }
                }
            } catch (\Throwable $e) {
                $failed++;
                Logger::error("Exception migrating {$termTax}: " . $e->getMessage(), [
                    'source' => 'migration',
                    'taxonomy' => $termTax,
                    'term_slug' => $term->slug ?? 'unknown'
                ]);
                $this->updateProgress($dataType, 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        }

        return compact('migrated', 'skipped', 'failed');
    }

    /**
     * Legacy taxonomy terms stored the featured image attachment ID under different meta keys (or as a media URL).
     *
     * Yatra 2.x core uses destination_image_id and activity_image_id on term meta
     * (old class-yatra-taxonomy-destination.php / class-yatra-taxonomy-activity.php).
     */
    protected function resolveLegacyTermFeaturedImageId(int $termId): ?string
    {
        $keys = [
            'destination_image_id',
            'activity_image_id',
            'yatra_term_image',
            'thumbnail_id',
            '_thumbnail_id',
            'yatra_destination_image',
            'yatra_activity_image',
            'yatra_category_image',
            'yatra_trip_category_image',
            'yatra_tour_category_image',
            'trip_category_image',
            'tour_category_image',
            'category_thumbnail_id',
            'term_thumbnail',
            'featured_image',
            'featured_image_id',
            'image',
            'term_image',
            'photo',
            'cover_image',
            'banner_image',
        ];

        foreach ($keys as $key) {
            // Prefer latest meta row if duplicates exist (admin re-saves).
            $fetched = $this->getRawTermMetaLatest($termId, $key);
            if ($fetched === null || $fetched === '' || $fetched === '0') {
                continue;
            }
            $trimmed = trim($fetched);
            if ($trimmed === '') {
                continue;
            }
            $resolved = $this->coerceLegacyTermImageToAttachmentId($trimmed);
            if ($resolved !== null) {
                return $resolved;
            }
        }

        return $this->scanAllTermMetaForFeaturedImage($termId);
    }

    /**
     * Last-write-wins term meta (same key can exist more than once in edge-case DBs).
     */
    private function getRawTermMetaLatest(int $termId, string $metaKey): ?string
    {
        return $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SELECT meta_value FROM {$this->wpdb->termmeta} WHERE term_id = %d AND meta_key = %s ORDER BY meta_id DESC LIMIT 1",
                $termId,
                $metaKey
            )
        );
    }

    /**
     * Fallback: inspect every term meta row for attachment IDs / URLs when known keys miss (imports, Pro, custom).
     */
    private function scanAllTermMetaForFeaturedImage(int $termId): ?string
    {
        $rows = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT meta_key, meta_value FROM {$this->wpdb->termmeta} WHERE term_id = %d ORDER BY meta_id DESC",
                $termId
            )
        );
        if (empty($rows)) {
            return null;
        }

        foreach ($rows as $row) {
            $key = (string) ($row->meta_key ?? '');
            if ($key === '' || str_starts_with($key, '_yatra_migrated_')) {
                continue;
            }
            if (! preg_match('/(image|thumb|photo|cover|banner|featured|attachment|media|picture)/i', $key)) {
                continue;
            }
            $raw = (string) ($row->meta_value ?? '');
            $resolved = $this->coerceLegacyTermImageToAttachmentId(trim($raw));
            if ($resolved !== null) {
                return $resolved;
            }
        }

        return null;
    }

    /**
     * Normalize a single term meta value to an attachment ID string (3.x uses metadata.featured_image as ID).
     */
    private function coerceLegacyTermImageToAttachmentId(string $raw): ?string
    {
        if ($raw === '' || $raw === '0') {
            return null;
        }

        if (is_numeric($raw)) {
            $id = (int) $raw;

            return $id > 0 ? (string) $id : null;
        }

        if (function_exists('is_serialized') && is_serialized($raw)) {
            $un = maybe_unserialize($raw);
            if (is_numeric($un)) {
                $id = (int) $un;

                return $id > 0 ? (string) $id : null;
            }
            if (is_array($un)) {
                foreach (['value', 'id', 'attachment_id', 'image_id', 'thumbnail_id', 'attachment', 'image'] as $k) {
                    if (isset($un[$k]) && is_numeric($un[$k])) {
                        $id = (int) $un[$k];

                        return $id > 0 ? (string) $id : null;
                    }
                }
                foreach ($un as $v) {
                    if (is_numeric($v)) {
                        $id = (int) $v;

                        return $id > 0 ? (string) $id : null;
                    }
                }
            }
        }

        $json = json_decode($raw, true);
        if (is_array($json)) {
            foreach (['id', 'value', 'attachment_id', 'image_id'] as $k) {
                if (isset($json[$k]) && is_numeric($json[$k])) {
                    $id = (int) $json[$k];

                    return $id > 0 ? (string) $id : null;
                }
            }
        }

        if (function_exists('attachment_url_to_postid')) {
            if (filter_var($raw, FILTER_VALIDATE_URL)) {
                $aid = attachment_url_to_postid($raw);
                if ($aid > 0) {
                    return (string) $aid;
                }
            } elseif (strlen($raw) > 0 && $raw[0] === '/' && function_exists('home_url')) {
                $aid = attachment_url_to_postid(home_url($raw));
                if ($aid > 0) {
                    return (string) $aid;
                }
            }
        }

        return null;
    }

    /**
     * Look up the new classifications table ID for a parent term
     */
    private function getParentClassificationId(int $parentTermId, string $taxonomy, string $classificationType): ?int
    {
        $metaKey = sprintf('_yatra_migrated_%s_id', $taxonomy);
        $parentNewId = $this->getRawTermMeta($parentTermId, $metaKey);
        if ($parentNewId) {
            return (int) $parentNewId;
        }
        // Parent may belong to a sibling taxonomy merged into the same classification type (e.g. tour_category vs trip_category).
        $alternates = [];
        if ($taxonomy === 'trip_category') {
            $alternates[] = 'tour_category';
        } elseif ($taxonomy === 'tour_category') {
            $alternates[] = 'trip_category';
        }
        foreach ($alternates as $alt) {
            $altKey = sprintf('_yatra_migrated_%s_id', $alt);
            $pid = $this->getRawTermMeta($parentTermId, $altKey);
            if ($pid) {
                return (int) $pid;
            }
        }

        return null;
    }
}
