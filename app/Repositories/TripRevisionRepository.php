<?php

declare(strict_types=1);

namespace Yatra\Repositories;

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
        global $wpdb;
        return $wpdb->prefix . 'yatra_trip_revisions';
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
     */
    public function createRevision(int $tripId, int $version, string $data, int $createdBy = 0): int
    {
        $data_array = [
            'trip_id' => $tripId,
            'version' => $version,
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

