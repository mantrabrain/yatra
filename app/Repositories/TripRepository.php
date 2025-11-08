<?php

declare(strict_types=1);

namespace Yatra\Repositories;

/**
 * Trip Repository
 * Handles database operations for trips
 */
class TripRepository extends BaseRepository
{
    /**
     * Get table name
     */
    protected function getTableName(): string
    {
        global $wpdb;
        return $wpdb->prefix . 'yatra_trips';
    }

    /**
     * Find by slug
     */
    public function findBySlug(string $slug): ?\stdClass
    {
        $table = esc_sql($this->table);
        $result = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM `{$table}` WHERE slug = %s",
                $slug
            )
        );

        return $result ?: null;
    }

    /**
     * Get active trips
     */
    public function getActive(array $args = []): array
    {
        $args['where']['status'] = 'active';
        return $this->all($args);
    }
}

