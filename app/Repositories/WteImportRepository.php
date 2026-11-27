<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Database\Tables\ClassificationsTable;

/**
 * WP Travel Engine Import Repository
 *
 * Read-only access to WP Travel Engine (WTE) data stored in the same
 * WordPress install (posts, post meta, terms), plus the small Yatra
 * classification lookups the importer needs.
 *
 * The WTE plugin does not have to be active: its post type and taxonomies
 * may not be registered, so terms are read with SQL instead of get_terms().
 * Nothing in this class writes to WTE data.
 *
 * @package Yatra\Repositories
 */
class WteImportRepository extends BaseRepository
{
    /**
     * WTE trip post type.
     */
    public const TRIP_POST_TYPE = 'trip';

    /**
     * WTE trip package post type (WTE 6.x pricing).
     */
    public const PACKAGE_POST_TYPE = 'trip-packages';

    /**
     * Main WTE trip settings meta key (serialized array).
     */
    public const SETTINGS_META_KEY = 'wp_travel_engine_setting';

    /**
     * WTE post statuses worth importing (auto-drafts, trash and revisions are skipped).
     */
    public const IMPORTABLE_STATUSES = ['publish', 'draft', 'pending', 'private', 'future'];

    /**
     * Table name (classifications - the only Yatra table this repository reads).
     */
    protected function getTableName(): string
    {
        return ClassificationsTable::getTableName();
    }

    /**
     * SQL fragment + args selecting importable WTE trips.
     *
     * A post only counts as a WTE trip when it carries the WTE settings meta,
     * so another plugin's "trip" post type is never picked up.
     *
     * @return array{0:string,1:array}
     */
    private function tripWhere(): array
    {
        $statuses = self::IMPORTABLE_STATUSES;
        $placeholders = implode(',', array_fill(0, count($statuses), '%s'));
        $sql = "p.post_type = %s AND p.post_status IN ({$placeholders})
            AND EXISTS (
                SELECT 1 FROM {$this->wpdb->postmeta} pm
                WHERE pm.post_id = p.ID AND pm.meta_key = %s
            )";

        return [$sql, array_merge([self::TRIP_POST_TYPE], $statuses, [self::SETTINGS_META_KEY])];
    }

    /**
     * Count importable WTE trips.
     */
    public function countTrips(): int
    {
        [$where, $args] = $this->tripWhere();

        return (int) $this->wpdb->get_var(
            $this->wpdb->prepare("SELECT COUNT(*) FROM {$this->wpdb->posts} p WHERE {$where}", $args)
        );
    }

    /**
     * Importable WTE trip ids in a stable order (ID ascending) for batching.
     *
     * @return int[]
     */
    public function getTripIds(int $offset = 0, int $limit = 0): array
    {
        [$where, $args] = $this->tripWhere();
        $sql = "SELECT p.ID FROM {$this->wpdb->posts} p WHERE {$where} ORDER BY p.ID ASC";
        if ($limit > 0) {
            $sql .= ' LIMIT %d OFFSET %d';
            $args[] = $limit;
            $args[] = max(0, $offset);
        }

        return array_map('intval', (array) $this->wpdb->get_col($this->wpdb->prepare($sql, $args)));
    }

    /**
     * Count WTE posts of a given type (bookings, customers, enquiries) for the detection summary.
     */
    public function countPostsOfType(string $postType): int
    {
        return (int) $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->wpdb->posts} WHERE post_type = %s AND post_status NOT IN ('auto-draft', 'trash', 'inherit')",
                $postType
            )
        );
    }

    /**
     * Get a WTE post (trip or package).
     */
    public function getPost(int $postId): ?\WP_Post
    {
        $post = get_post($postId);

        return $post instanceof \WP_Post ? $post : null;
    }

    /**
     * All meta of a post, single values, unserialized.
     *
     * @return array<string, mixed>
     */
    public function getPostMeta(int $postId): array
    {
        $raw = get_post_meta($postId);
        $meta = [];
        if (!is_array($raw)) {
            return $meta;
        }
        foreach ($raw as $key => $values) {
            // Never build objects from stored data (object injection).
            $v = $values[0] ?? null;
            $meta[(string) $key] = is_string($v) && is_serialized($v)
                ? @unserialize($v, ['allowed_classes' => false])
                : $v;
        }

        return $meta;
    }

    /**
     * All terms of the given taxonomies.
     *
     * @param string[] $taxonomies
     * @return array<int, object{term_id:int, term_taxonomy_id:int, name:string, slug:string, taxonomy:string, parent:int, description:string}>
     */
    public function getTerms(array $taxonomies): array
    {
        if (empty($taxonomies)) {
            return [];
        }
        $placeholders = implode(',', array_fill(0, count($taxonomies), '%s'));
        $rows = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT t.term_id, tt.term_taxonomy_id, t.name, t.slug, tt.taxonomy, tt.parent, tt.description
                 FROM {$this->wpdb->terms} t
                 INNER JOIN {$this->wpdb->term_taxonomy} tt ON tt.term_id = t.term_id
                 WHERE tt.taxonomy IN ({$placeholders})
                 ORDER BY tt.taxonomy ASC, tt.parent ASC, t.term_id ASC",
                $taxonomies
            )
        );

        $terms = [];
        foreach ((array) $rows as $row) {
            $row->term_id = (int) $row->term_id;
            $row->term_taxonomy_id = (int) $row->term_taxonomy_id;
            $row->parent = (int) $row->parent;
            $terms[] = $row;
        }

        return $terms;
    }

    /**
     * Term ids of one taxonomy attached to a post.
     *
     * @return int[]
     */
    public function getPostTermIds(int $postId, string $taxonomy): array
    {
        $ids = $this->wpdb->get_col(
            $this->wpdb->prepare(
                "SELECT tt.term_id
                 FROM {$this->wpdb->term_relationships} tr
                 INNER JOIN {$this->wpdb->term_taxonomy} tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
                 WHERE tr.object_id = %d AND tt.taxonomy = %s
                 ORDER BY tr.term_order ASC, tt.term_id ASC",
                $postId,
                $taxonomy
            )
        );

        return array_map('intval', (array) $ids);
    }

    /**
     * Whether an attachment post exists (media ids are shared with WTE).
     */
    public function attachmentExists(int $attachmentId): bool
    {
        return $attachmentId > 0 && get_post_type($attachmentId) === 'attachment';
    }

    /**
     * Find an existing Yatra classification of a type by name or slug, so the
     * importer reuses terms the operator already created instead of
     * duplicating them.
     */
    public function findClassificationByNameOrSlug(string $type, string $name, string $slug): ?int
    {
        $table = $this->getTableName();
        $id = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SELECT id FROM {$table}
                 WHERE type = %s AND status <> 'trash' AND (LOWER(name) = LOWER(%s) OR slug = %s)
                 ORDER BY id ASC LIMIT 1",
                $type,
                $name,
                $slug
            )
        );

        return $id ? (int) $id : null;
    }

    /**
     * Whether a classification id of the given type exists (and is not trashed).
     */
    public function classificationExists(int $id, string $type): bool
    {
        if ($id <= 0) {
            return false;
        }
        $table = $this->getTableName();

        return (bool) $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SELECT id FROM {$table} WHERE id = %d AND type = %s AND status <> 'trash'",
                $id,
                $type
            )
        );
    }

    /**
     * Whether a Yatra trip already uses a slug. Trashed (soft-deleted) trips
     * count too, because the slug column is unique.
     */
    public function tripSlugTaken(string $slug): bool
    {
        $table = \Yatra\Database\Tables\TripsTable::getTableName();

        return (bool) $this->wpdb->get_var(
            $this->wpdb->prepare("SELECT id FROM {$table} WHERE slug = %s LIMIT 1", $slug)
        );
    }

    /**
     * Parent id of a classification (0 when top level).
     */
    public function getClassificationParentId(int $id): int
    {
        $table = $this->getTableName();

        return (int) $this->wpdb->get_var(
            $this->wpdb->prepare("SELECT parent_id FROM {$table} WHERE id = %d", $id)
        );
    }
}
