<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Database\Tables\TripContentTable;

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
    private function table(): string
    {
        return TripContentTable::getTableName();
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

        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$table} WHERE trip_id = %d AND content_type = 'download' ORDER BY sort_order ASC, id ASC",
                $tripId
            )
        ) ?: [];

        // Normalize metadata back into expected fields
        foreach ($rows as $row) {
            $metadata = [];
            if (!empty($row->metadata)) {
                $decoded = json_decode($row->metadata, true);
                if (is_array($decoded)) {
                    $metadata = $decoded;
                }
            }
            $row->attachment_id = $metadata['attachment_id'] ?? null;
            $row->protected_path = $metadata['protected_path'] ?? null;
            // Map access_level back to visibility for UI
            $row->visibility = 'booked_only';
            if ($row->access_level === 'public') {
                $row->visibility = 'public';
            } elseif ($row->access_level === 'registered') {
                $row->visibility = 'logged_in';
            }
        }

        return $rows;
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
                "SELECT * FROM {$table} WHERE id = %d AND content_type = 'download' LIMIT 1",
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
            ['id' => $id, 'content_type' => 'download'],
            ['%s'],
            ['%d', '%s']
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
        $wpdb->delete($table, ['trip_id' => $tripId, 'content_type' => 'download'], ['%d', '%s']);

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
            $accessLevel = 'customer';
            $isPublic = 0;
            $requiresLogin = 1;
            if ($visibility === 'public') {
                $accessLevel = 'public';
                $isPublic = 1;
                $requiresLogin = 0;
            } elseif ($visibility === 'logged_in') {
                $accessLevel = 'registered';
                $isPublic = 0;
                $requiresLogin = 1;
            }

            $attachmentId = isset($item['attachment_id']) ? (int) $item['attachment_id'] : null;
            $contentUrl = null;
            $filePath = isset($item['file_path']) ? sanitize_text_field($item['file_path']) : null;
            $fileType = isset($item['file_type']) ? sanitize_text_field($item['file_type']) : null;
            $fileSize = isset($item['file_size']) ? (int) $item['file_size'] : null;
            $thumbnailUrl = isset($item['thumbnail_url']) ? esc_url_raw($item['thumbnail_url']) : null;

            if ($attachmentId) {
                $contentUrl = wp_get_attachment_url($attachmentId) ?: null;
                if (empty($filePath)) {
                    $filePath = get_attached_file($attachmentId) ?: null;
                }
                if (empty($fileType)) {
                    $fileType = wp_check_filetype(get_attached_file($attachmentId) ?: '')['type'] ?? null;
                }
                if (empty($fileSize)) {
                    $fileSize = (int) filesize(get_attached_file($attachmentId) ?: '') ?: null;
                }
                if (empty($thumbnailUrl)) {
                    $thumb = wp_get_attachment_image_src($attachmentId, 'thumbnail');
                    $thumbnailUrl = $thumb && isset($thumb[0]) ? $thumb[0] : null;
                }
            } elseif (!empty($item['content_url'])) {
                $contentUrl = esc_url_raw($item['content_url']);
                if (empty($fileType)) {
                    $fileType = wp_check_filetype($contentUrl)['type'] ?? null;
                }
            }

            $metadata = [
                'attachment_id' => $attachmentId,
                'protected_path' => isset($item['protected_path']) ? sanitize_text_field($item['protected_path']) : null,
                'visibility' => $visibility,
            ];

            $wpdb->insert(
                $table,
                [
                    'trip_id' => $tripId,
                    'content_type' => 'download',
                    'title' => $title,
                    'description' => isset($item['description']) ? wp_kses_post($item['description']) : null,
                    'content_url' => $contentUrl,
                    'metadata' => wp_json_encode($metadata),
                    'file_path' => $filePath,
                    'file_size' => $fileSize,
                    'file_type' => $fileType,
                    'thumbnail_url' => $thumbnailUrl,
                    'display_options' => isset($item['display_options']) ? wp_json_encode($item['display_options']) : null,
                    'access_level' => $accessLevel,
                    'is_downloadable' => 1,
                    'is_public' => $isPublic,
                    'requires_login' => $requiresLogin,
                    'sort_order' => isset($item['sort_order']) ? (int) $item['sort_order'] : $order,
                    'created_by' => get_current_user_id() ?: null,
                    'updated_by' => get_current_user_id() ?: null,
                ],
                [
                    '%d', // trip_id
                    '%s', // content_type
                    '%s', // title
                    '%s', // description
                    '%s', // content_url
                    '%s', // metadata
                    '%s', // file_path
                    '%d', // file_size
                    '%s', // file_type
                    '%s', // thumbnail_url
                    '%s', // display_options
                    '%s', // access_level
                    '%d', // is_downloadable
                    '%d', // is_public
                    '%d', // requires_login
                    '%d', // sort_order
                    '%d', // created_by
                    '%d', // updated_by
                ]
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
        if ($visibility === 'paid_only') {
            $visibility = 'booked_only';
        }
        if (!in_array($visibility, ['public', 'logged_in', 'booked_only'], true)) {
            $visibility = 'booked_only';
        }

        $accessLevel = 'customer';
        $isPublic = 0;
        $requiresLogin = 1;
        if ($visibility === 'public') {
            $accessLevel = 'public';
            $isPublic = 1;
            $requiresLogin = 0;
        } elseif ($visibility === 'logged_in') {
            $accessLevel = 'registered';
            $isPublic = 0;
            $requiresLogin = 1;
        }

        $attachmentId = isset($data['attachment_id']) ? (int) $data['attachment_id'] : null;
        $contentUrl = $attachmentId ? (wp_get_attachment_url($attachmentId) ?: null) : (isset($data['content_url']) ? esc_url_raw($data['content_url']) : null);
        $filePath = isset($data['file_path']) ? sanitize_text_field($data['file_path']) : null;
        $fileType = isset($data['file_type']) ? sanitize_text_field($data['file_type']) : null;
        $fileSize = isset($data['file_size']) ? (int) $data['file_size'] : null;
        $thumbnailUrl = isset($data['thumbnail_url']) ? esc_url_raw($data['thumbnail_url']) : null;

        if ($attachmentId) {
            if (empty($filePath)) {
                $filePath = get_attached_file($attachmentId) ?: null;
            }
            if (empty($fileType)) {
                $fileType = wp_check_filetype(get_attached_file($attachmentId) ?: '')['type'] ?? null;
            }
            if (empty($fileSize)) {
                $fileSize = (int) filesize(get_attached_file($attachmentId) ?: '') ?: null;
            }
            if (empty($thumbnailUrl)) {
                $thumb = wp_get_attachment_image_src($attachmentId, 'thumbnail');
                $thumbnailUrl = $thumb && isset($thumb[0]) ? $thumb[0] : null;
            }
        } elseif (!empty($data['content_url']) && empty($fileType)) {
            $fileType = wp_check_filetype($data['content_url'])['type'] ?? null;
        }

        $metadata = [
            'attachment_id' => $attachmentId,
            'protected_path' => isset($data['protected_path']) ? sanitize_text_field($data['protected_path']) : null,
            'visibility' => $visibility,
        ];

        $result = $wpdb->insert(
            $table,
            [
                'trip_id' => (int) ($data['trip_id'] ?? 0),
                'content_type' => 'download',
                'title' => $title,
                'description' => isset($data['description']) ? wp_kses_post($data['description']) : null,
                'content_url' => $contentUrl,
                'metadata' => wp_json_encode($metadata),
                'file_path' => $filePath,
                'file_size' => $fileSize,
                'file_type' => $fileType,
                'thumbnail_url' => $thumbnailUrl,
                'display_options' => isset($data['display_options']) ? wp_json_encode($data['display_options']) : null,
                'access_level' => $accessLevel,
                'is_downloadable' => 1,
                'is_public' => $isPublic,
                'requires_login' => $requiresLogin,
                'sort_order' => isset($data['sort_order']) ? (int) $data['sort_order'] : 0,
                'created_by' => get_current_user_id() ?: null,
                'updated_by' => get_current_user_id() ?: null,
            ],
            ['%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%d', '%d', '%d', '%d']
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

        $metadata = [];
        if (!empty($existing = $this->getById($id))) {
            if (!empty($existing->metadata)) {
                $decoded = json_decode($existing->metadata, true);
                if (is_array($decoded)) {
                    $metadata = $decoded;
                }
            }
        }

        if (isset($data['attachment_id'])) {
            $attachmentId = (int) $data['attachment_id'];
            $updateData['content_url'] = $attachmentId ? (wp_get_attachment_url($attachmentId) ?: null) : null;
            $formats[] = '%s';
            $metadata['attachment_id'] = $attachmentId;
        }
        if (isset($data['content_url'])) {
            $updateData['content_url'] = esc_url_raw($data['content_url']);
            $formats[] = '%s';
        }

        if (isset($data['protected_path'])) {
            $metadata['protected_path'] = sanitize_text_field($data['protected_path']);
        }

        if (isset($data['visibility'])) {
            $visibility = sanitize_key($data['visibility']);
            if ($visibility === 'paid_only') {
                $visibility = 'booked_only';
            }
            if (!in_array($visibility, ['public', 'logged_in', 'booked_only'], true)) {
                $visibility = 'booked_only';
            }
            $accessLevel = 'customer';
            $isPublic = 0;
            $requiresLogin = 1;
            if ($visibility === 'public') {
                $accessLevel = 'public';
                $isPublic = 1;
                $requiresLogin = 0;
            } elseif ($visibility === 'logged_in') {
                $accessLevel = 'registered';
                $isPublic = 0;
                $requiresLogin = 1;
            }
            $updateData['access_level'] = $accessLevel;
            $formats[] = '%s';
            $updateData['is_public'] = $isPublic;
            $formats[] = '%d';
            $updateData['requires_login'] = $requiresLogin;
            $formats[] = '%d';
            $metadata['visibility'] = $visibility;
        }

        if (!empty($metadata)) {
            $updateData['metadata'] = wp_json_encode($metadata);
            $formats[] = '%s';
        }

        if (isset($data['file_path'])) {
            $updateData['file_path'] = sanitize_text_field($data['file_path']);
            $formats[] = '%s';
        }
        if (isset($data['file_size'])) {
            $updateData['file_size'] = (int) $data['file_size'];
            $formats[] = '%d';
        }
        if (isset($data['file_type'])) {
            $updateData['file_type'] = sanitize_text_field($data['file_type']);
            $formats[] = '%s';
        }
        if (isset($data['thumbnail_url'])) {
            $updateData['thumbnail_url'] = esc_url_raw($data['thumbnail_url']);
            $formats[] = '%s';
        }
        if (isset($data['display_options'])) {
            $updateData['display_options'] = wp_json_encode($data['display_options']);
            $formats[] = '%s';
        }

        if (isset($data['enabled'])) {
            $updateData['is_downloadable'] = (int) (bool) $data['enabled']; // Map enabled to is_downloadable
            $formats[] = '%d';
        }

        if (isset($data['sort_order'])) {
            $updateData['sort_order'] = (int) $data['sort_order'];
            $formats[] = '%d';
        }

        if (!empty($updateData)) {
            $result = $wpdb->update(
                $table,
                $updateData,
                ['id' => $id, 'content_type' => 'download'],
                $formats,
                ['%d', '%s']
            );
        }

        return !empty($updateData) ? $result !== false : true;
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

        $result = $wpdb->delete($table, ['id' => $id, 'content_type' => 'download'], ['%d', '%s']);
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

        $result = $wpdb->delete($table, ['trip_id' => $tripId, 'content_type' => 'download'], ['%d', '%s']);
        return $result !== false;
    }
}
