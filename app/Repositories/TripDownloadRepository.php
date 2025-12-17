<?php

declare(strict_types=1);

namespace Yatra\Repositories;

/**
 * Trip Download Repository
 * 
 * Handles CRUD operations for trip downloadable files.
 * Downloads is a FREE feature in Yatra.
 * 
 * @package Yatra\Repositories
 * @since 3.0.0
 */
class TripDownloadRepository
{
    /**
     * Get the table name
     */
    private function table(): string
    {
        global $wpdb;
        return $wpdb->prefix . 'yatra_trip_downloads';
    }

    /**
     * Ensure the table exists, create if not
     */
    private function ensureTableExists(): bool
    {
        global $wpdb;
        $table = $this->table();

        if ($wpdb->get_var("SHOW TABLES LIKE '{$table}'")) {
            return true;
        }

        // Create the table if it doesn't exist
        if (class_exists('\\Yatra\\Core\\Database')) {
            \Yatra\Core\Database::createTables();
        }

        return (bool) $wpdb->get_var("SHOW TABLES LIKE '{$table}'");
    }

    /**
     * Get all downloads for a trip
     */
    public function getByTripId(int $tripId): array
    {
        global $wpdb;
        $table = $this->table();

        if (!$this->ensureTableExists()) {
            return [];
        }

        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$table} WHERE trip_id = %d ORDER BY sort_order ASC, id ASC",
                $tripId
            )
        ) ?: [];
    }

    /**
     * Get a download by ID
     */
    public function getById(int $id): ?object
    {
        global $wpdb;
        $table = $this->table();

        if (!$this->ensureTableExists()) {
            return null;
        }

        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$table} WHERE id = %d LIMIT 1",
                $id
            )
        ) ?: null;
    }

    /**
     * Update the protected path for a download
     */
    public function updateProtectedPath(int $id, string $protectedPath): void
    {
        global $wpdb;
        $table = $this->table();

        if (!$this->ensureTableExists()) {
            return;
        }

        $wpdb->update(
            $table,
            ['protected_path' => sanitize_text_field($protectedPath)],
            ['id' => $id],
            ['%s'],
            ['%d']
        );
    }

    /**
     * Replace all downloads for a trip
     */
    public function replaceForTrip(int $tripId, array $items): void
    {
        global $wpdb;
        $table = $this->table();

        if (!$this->ensureTableExists()) {
            return;
        }

        // Delete existing downloads for this trip
        $wpdb->delete($table, ['trip_id' => $tripId], ['%d']);

        $order = 0;
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $title = sanitize_text_field($item['title'] ?? '');
            if ($title === '') {
                continue;
            }

            // Normalize visibility
            $visibility = sanitize_key($item['visibility'] ?? 'booked_only');
            if ($visibility === 'paid_only') {
                $visibility = 'booked_only';
            }
            if (!in_array($visibility, ['public', 'logged_in', 'booked_only'], true)) {
                $visibility = 'booked_only';
            }

            $wpdb->insert(
                $table,
                [
                    'trip_id' => $tripId,
                    'title' => $title,
                    'description' => isset($item['description']) ? wp_kses_post($item['description']) : null,
                    'attachment_id' => isset($item['attachment_id']) ? (int) $item['attachment_id'] : null,
                    'protected_path' => isset($item['protected_path']) ? sanitize_text_field($item['protected_path']) : null,
                    'visibility' => $visibility,
                    'enabled' => isset($item['enabled']) ? (int) (bool) $item['enabled'] : 1,
                    'sort_order' => isset($item['sort_order']) ? (int) $item['sort_order'] : $order,
                ],
                ['%d', '%s', '%s', '%d', '%s', '%s', '%d', '%d']
            );

            $order++;
        }
    }

    /**
     * Create a single download
     */
    public function create(array $data): ?int
    {
        global $wpdb;
        $table = $this->table();

        if (!$this->ensureTableExists()) {
            return null;
        }

        $title = sanitize_text_field($data['title'] ?? '');
        if ($title === '') {
            return null;
        }

        $visibility = sanitize_key($data['visibility'] ?? 'booked_only');
        if (!in_array($visibility, ['public', 'logged_in', 'booked_only'], true)) {
            $visibility = 'booked_only';
        }

        $result = $wpdb->insert(
            $table,
            [
                'trip_id' => (int) ($data['trip_id'] ?? 0),
                'title' => $title,
                'description' => isset($data['description']) ? wp_kses_post($data['description']) : null,
                'attachment_id' => isset($data['attachment_id']) ? (int) $data['attachment_id'] : null,
                'protected_path' => isset($data['protected_path']) ? sanitize_text_field($data['protected_path']) : null,
                'visibility' => $visibility,
                'enabled' => isset($data['enabled']) ? (int) (bool) $data['enabled'] : 1,
                'sort_order' => isset($data['sort_order']) ? (int) $data['sort_order'] : 0,
            ],
            ['%d', '%s', '%s', '%d', '%s', '%s', '%d', '%d']
        );

        return $result ? (int) $wpdb->insert_id : null;
    }

    /**
     * Update a download
     */
    public function update(int $id, array $data): bool
    {
        global $wpdb;
        $table = $this->table();

        if (!$this->ensureTableExists()) {
            return false;
        }

        $updateData = [];
        $formats = [];

        if (isset($data['title'])) {
            $updateData['title'] = sanitize_text_field($data['title']);
            $formats[] = '%s';
        }

        if (isset($data['description'])) {
            $updateData['description'] = wp_kses_post($data['description']);
            $formats[] = '%s';
        }

        if (isset($data['attachment_id'])) {
            $updateData['attachment_id'] = (int) $data['attachment_id'];
            $formats[] = '%d';
        }

        if (isset($data['protected_path'])) {
            $updateData['protected_path'] = sanitize_text_field($data['protected_path']);
            $formats[] = '%s';
        }

        if (isset($data['visibility'])) {
            $visibility = sanitize_key($data['visibility']);
            if (!in_array($visibility, ['public', 'logged_in', 'booked_only'], true)) {
                $visibility = 'booked_only';
            }
            $updateData['visibility'] = $visibility;
            $formats[] = '%s';
        }

        if (isset($data['enabled'])) {
            $updateData['enabled'] = (int) (bool) $data['enabled'];
            $formats[] = '%d';
        }

        if (isset($data['sort_order'])) {
            $updateData['sort_order'] = (int) $data['sort_order'];
            $formats[] = '%d';
        }

        if (empty($updateData)) {
            return false;
        }

        $result = $wpdb->update(
            $table,
            $updateData,
            ['id' => $id],
            $formats,
            ['%d']
        );

        return $result !== false;
    }

    /**
     * Delete a download
     */
    public function delete(int $id): bool
    {
        global $wpdb;
        $table = $this->table();

        if (!$this->ensureTableExists()) {
            return false;
        }

        $result = $wpdb->delete($table, ['id' => $id], ['%d']);
        return $result !== false;
    }

    /**
     * Delete all downloads for a trip
     */
    public function deleteByTripId(int $tripId): bool
    {
        global $wpdb;
        $table = $this->table();

        if (!$this->ensureTableExists()) {
            return false;
        }

        $result = $wpdb->delete($table, ['trip_id' => $tripId], ['%d']);
        return $result !== false;
    }
}
