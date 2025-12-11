<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\ActivityRepository;
use Yatra\Helpers\SlugHelper;

/**
 * Activity Service
 * Contains business logic for activities
 */
class ActivityService extends BaseService
{
    /**
     * @var ActivityRepository
     */
    private ActivityRepository $repository;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->repository = new ActivityRepository();
    }

    /**
     * Get repository
     */
    protected function getRepository(): ActivityRepository
    {
        return $this->repository;
    }

    /**
     * Validate activity data
     */
    protected function validate(array $data, ?int $id = null): void
    {
        if (empty($data['name'])) {
            throw new \InvalidArgumentException('Activity name is required');
        }

        // Slug will be auto-generated from name, so we don't need to validate it here
        // The SlugHelper will ensure uniqueness

        // Validate status
        $allowed_statuses = ['draft', 'publish', 'trash'];
        if (isset($data['status']) && !in_array($data['status'], $allowed_statuses, true)) {
            throw new \InvalidArgumentException('Invalid status. Must be one of: ' . implode(', ', $allowed_statuses));
        }
    }

    /**
     * Process before create
     */
    protected function processBeforeCreate(array $data): array
    {
        // Sanitize name
        if (isset($data['name'])) {
            $data['name'] = sanitize_text_field($data['name']);
        }

        // Always auto-generate slug from name (backend ensures uniqueness)
        if (!empty($data['name'])) {
            $data['slug'] = SlugHelper::generateUniqueFromDatabase(
                $data['name'],
                'yatra_activities',
                'slug'
            );
        } elseif (isset($data['slug'])) {
            // If name is empty but slug is provided, sanitize it
            $data['slug'] = SlugHelper::generate($data['slug']);
        }

        // Sanitize description
        if (isset($data['description'])) {
            $data['description'] = sanitize_textarea_field($data['description']);
        }

        // Sanitize status
        if (isset($data['status'])) {
            $allowed_statuses = ['draft', 'publish', 'trash'];
            $data['status'] = in_array($data['status'], $allowed_statuses, true) 
                ? $data['status'] 
                : 'draft';
        } else {
            $data['status'] = 'draft';
        }

        // Set created_by and updated_by to current user
        $current_user_id = get_current_user_id();
        $data['created_by'] = absint($current_user_id);
        $data['updated_by'] = absint($current_user_id);

        // Sanitize and serialize icon if it's an array
        if (isset($data['icon'])) {
            if (is_array($data['icon'])) {
                // Sanitize icon array
                $icon = [
                    'type' => isset($data['icon']['type']) && in_array($data['icon']['type'], ['icon', 'image'], true)
                        ? $data['icon']['type']
                        : 'icon',
                    'value' => isset($data['icon']['value']) 
                        ? sanitize_text_field($data['icon']['value'])
                        : '',
                ];
                $data['icon'] = maybe_serialize($icon);
            } elseif (is_string($data['icon'])) {
                // If it's already a string, sanitize it
                $data['icon'] = sanitize_text_field($data['icon']);
            }
        }

        return $data;
    }

    /**
     * Process before update
     */
    protected function processBeforeUpdate(int $id, array $data): array
    {
        // Remove preserve_slug flag if sent from frontend (not a database column)
        unset($data['preserve_slug']);

        // Sanitize name
        if (isset($data['name'])) {
            $data['name'] = sanitize_text_field($data['name']);
        }

        // Handle slug in EDIT mode: Only update if explicitly provided
        // Do NOT auto-generate from name in edit mode
        if (isset($data['slug']) && !empty($data['slug'])) {
            // Slug was explicitly provided - ensure uniqueness
            $data['slug'] = SlugHelper::generateUniqueFromDatabase(
                $data['slug'],
                'yatra_activities',
                'slug',
                $id // Exclude current record when checking uniqueness
            );
        }
        // If slug is not provided, don't modify it (keep existing slug)

        // Sanitize description
        if (isset($data['description'])) {
            $data['description'] = sanitize_textarea_field($data['description']);
        }

        // Sanitize status
        if (isset($data['status'])) {
            $allowed_statuses = ['draft', 'publish', 'trash'];
            $data['status'] = in_array($data['status'], $allowed_statuses, true) 
                ? $data['status'] 
                : 'draft';
        }

        // Set updated_by to current user
        $data['updated_by'] = absint(get_current_user_id());

        // Sanitize and serialize icon if it's an array
        if (isset($data['icon'])) {
            if (is_array($data['icon'])) {
                // Sanitize icon array
                $icon = [
                    'type' => isset($data['icon']['type']) && in_array($data['icon']['type'], ['icon', 'image'], true)
                        ? $data['icon']['type']
                        : 'icon',
                    'value' => isset($data['icon']['value']) 
                        ? sanitize_text_field($data['icon']['value'])
                        : '',
                ];
                $data['icon'] = maybe_serialize($icon);
            } elseif (is_string($data['icon'])) {
                // If it's already a string, sanitize it
                $data['icon'] = sanitize_text_field($data['icon']);
            }
        }

        return $data;
    }

    /**
     * Get all items with search and filters
     */
    public function getAll(array $args = []): array
    {
        // Sanitize and handle search
        if (!empty($args['search'])) {
            $search = sanitize_text_field($args['search']);
            return $this->repository->search($search, $args);
        }

        // Sanitize and handle status filter
        if (!empty($args['status']) && $args['status'] !== 'all') {
            $allowed_statuses = ['draft', 'publish', 'trash'];
            $status = in_array($args['status'], $allowed_statuses, true) 
                ? $args['status'] 
                : null;
            if ($status) {
                $args['where']['status'] = $status;
            }
        }

        return $this->repository->all($args);
    }

    /**
     * Get published activities
     */
    public function getPublished(array $args = []): array
    {
        return $this->repository->getPublished($args);
    }

    /**
     * Get published activities along with aggregated stats such as
     * trips_count derived from related trip records.
     */
    public function getPublishedWithStats(): array
    {
        // For now this simply delegates to a repository method that attaches
        // trips_count using the yatra_trip_activities relation table.
        return $this->repository->getPublishedWithTripCounts();
    }

    /**
     * Count items
     */
    public function count(array $args = []): int
    {
        // Sanitize and handle search
        if (!empty($args['search'])) {
            $search = sanitize_text_field($args['search']);
            $items = $this->repository->search($search, $args);
            return count($items);
        }

        // Sanitize and handle status filter
        if (!empty($args['status']) && $args['status'] !== 'all') {
            $allowed_statuses = ['draft', 'publish', 'trash'];
            $status = in_array($args['status'], $allowed_statuses, true) 
                ? $args['status'] 
                : null;
            if ($status) {
                $args['where']['status'] = $status;
            }
        }

        return $this->repository->count($args);
    }

    /**
     * Bulk update status
     */
    public function bulkUpdateStatus(array $ids, string $status): array
    {
        $ids = array_filter(array_map('absint', $ids));
        if (empty($ids)) {
            throw new \InvalidArgumentException(__('No activities selected.', 'yatra'));
        }

        $allowed = ['draft', 'publish', 'trash'];
        if (!in_array($status, $allowed, true)) {
            throw new \InvalidArgumentException(__('Invalid status selected.', 'yatra'));
        }

        $result = $this->repository->bulkUpdateStatus($ids, $status);
        if (!$result) {
            throw new \Exception(__('Failed to update activities.', 'yatra'));
        }

        return [
            'message' => sprintf(
                /* translators: %d number of activities */
                _n('%d activity updated.', '%d activities updated.', count($ids), 'yatra'),
                count($ids)
            ),
        ];
    }

    /**
     * Bulk delete permanently
     */
    public function bulkDelete(array $ids): array
    {
        $ids = array_filter(array_map('absint', $ids));
        if (empty($ids)) {
            throw new \InvalidArgumentException(__('No activities selected.', 'yatra'));
        }

        $result = $this->repository->bulkDelete($ids);
        if (!$result) {
            throw new \Exception(__('Failed to delete activities.', 'yatra'));
        }

        return [
            'message' => sprintf(
                /* translators: %d number of activities */
                _n('%d activity deleted.', '%d activities deleted.', count($ids), 'yatra'),
                count($ids)
            ),
        ];
    }

    /**
     * Get status counts for list views
     */
    public function getStatusCounts(): array
    {
        $counts = $this->repository->getStatusCounts();

        $publish = $counts['publish'] ?? 0;
        $draft = $counts['draft'] ?? 0;
        $trash = $counts['trash'] ?? 0;
        
        // Calculate total from all statuses, not just the main three
        $all = array_sum(array_values($counts));

        $result = [
            'all' => (int) $all,
            'publish' => (int) $publish,
            'draft' => (int) $draft,
            'trash' => (int) $trash,
        ];

        // Debug logging
        error_log('Activity Status Counts - Raw: ' . print_r($counts, true));
        error_log('Activity Status Counts - Result: ' . print_r($result, true));

        return $result;
    }
}

