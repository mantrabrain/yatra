<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Database\Tables\TripRevisionsTable;

/**
 * Trip Revision Repository
 * Handles database operations for trip revisions
 */
class TripRevisionRepository extends BaseRepository
{
    /**
     * Get table name
     */
    protected function getTableName(): string
    {
       return TripRevisionsTable::getTableName();
    }

    /**
     * Find all revisions for a trip
     */
    public function findByTripId(int $tripId, array $args = []): array
    {
        $table = esc_sql($this->table);
        $order = $this->buildOrderClause($args);
        $limit = $this->buildLimitClause($args);

        $query = $this->wpdb->prepare(
            "SELECT * FROM `{$table}` WHERE trip_id = %d {$order} {$limit}",
            $tripId
        );

        return $this->wpdb->get_results($query) ?: [];
    }

    /**
     * Find revision by ID
     */
    public function findRevision(int $id): ?\stdClass
    {
        $table = esc_sql($this->table);
        $result = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM `{$table}` WHERE id = %d",
                $id
            )
        );

        return $result ?: null;
    }

    /**
     * Get latest version number for a trip
     */
    public function getLatestVersion(int $tripId): int
    {
        $table = esc_sql($this->table);
        $result = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SELECT MAX(version) FROM `{$table}` WHERE trip_id = %d",
                $tripId
            )
        );

        return (int) ($result ?: 0);
    }

    /**
     * Create a new revision
     * 
     * @param int $tripId Trip ID
     * @param int $version Version number
     * @param string $data Serialized trip data
     * @param int $createdBy User ID who created the revision
     * @param string $status Revision status ('inherit' for normal, 'restored' for restore operations)
     * @return int Revision ID
     */
    public function createRevision(int $tripId, int $version, string $data, int $createdBy = 0, string $status = 'inherit'): int
    {
        $data_array = [
            'trip_id' => $tripId,
            'version' => $version,
            'status' => $status,
            'data' => $data,
            'created_by' => $createdBy,
            'created_at' => current_time('mysql'),
        ];

        $result = $this->wpdb->insert($this->table, $data_array);

        if ($result === false) {
            throw new \Exception('Failed to create revision: ' . $this->wpdb->last_error);
        }

        return $this->wpdb->insert_id;
    }

    /**
     * Get revision limit (similar to WP_POST_REVISIONS)
     * Default is unlimited, but can be set via filter
     */
    public function getRevisionLimit(): int
    {
        /**
         * Filter the number of revisions to keep for each trip
         * 
         * @param int $limit Number of revisions to keep. 0 = unlimited, -1 = no revisions
         */
        $limit = apply_filters('yatra_trip_revision_limit', 0);
        
        return (int) $limit;
    }

    /**
     * Clean up old revisions for a trip (keep only the most recent N revisions)
     * Similar to WordPress's revision cleanup
     */
    public function cleanupRevisions(int $tripId): int
    {
        $limit = $this->getRevisionLimit();
        
        // 0 or negative means unlimited, no cleanup needed
        if ($limit <= 0) {
            return 0;
        }

        // Get all revisions for this trip, ordered by version DESC
        $revisions = $this->findByTripId($tripId, [
            'order_by' => 'version',
            'order' => 'DESC',
        ]);

        // If we have more revisions than the limit, delete the oldest ones
        if (count($revisions) > $limit) {
            $revisionsToDelete = array_slice($revisions, $limit);
            $deleted = 0;

            foreach ($revisionsToDelete as $revision) {
                $result = $this->wpdb->delete(
                    $this->table,
                    ['id' => $revision->id],
                    ['%d']
                );
                if ($result !== false) {
                    $deleted++;
                }
            }

            return $deleted;
        }

        return 0;
    }

    /**
     * Get revision count for a trip
     */
    public function getRevisionCount(int $tripId): int
    {
        $table = esc_sql($this->table);
        $count = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SELECT COUNT(*) FROM `{$table}` WHERE trip_id = %d",
                $tripId
            )
        );

        return (int) ($count ?: 0);
    }

    /**
     * Delete revisions for a trip
     */
    public function deleteByTripId(int $tripId): bool
    {
        $table = esc_sql($this->table);
        $result = $this->wpdb->delete(
            $this->table,
            ['trip_id' => $tripId],
            ['%d']
        );

        return $result !== false;
    }
}

