<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\DifficultyLevelRepository;
use Yatra\Helpers\SlugHelper;

/**
 * Difficulty Level Service
 * Contains business logic for difficulty levels
 */
class DifficultyLevelService extends BaseService
{
    /**
     * @var DifficultyLevelRepository
     */
    private DifficultyLevelRepository $repository;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->repository = new DifficultyLevelRepository();
    }

    /**
     * Get repository
     */
    protected function getRepository(): DifficultyLevelRepository
    {
        return $this->repository;
    }

    /**
     * Validate difficulty level data
     */
    protected function validate(array $data, ?int $id = null): void
    {
        if (empty($data['name'])) {
            throw new \InvalidArgumentException('Difficulty level name is required');
        }

        // Validate level_order if provided
        if (isset($data['level_order'])) {
            $levelOrder = (int) $data['level_order'];
            if ($levelOrder < 0) {
                throw new \InvalidArgumentException('Level order must be a positive number');
            }
        }

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
                'yatra_difficulty_levels',
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

        // Sanitize level_order
        if (isset($data['level_order'])) {
            $data['level_order'] = absint($data['level_order']);
        } else {
            // Auto-assign next available order if not provided
            $allLevels = $this->repository->all(['order_by' => 'level_order', 'order' => 'DESC', 'limit' => 1]);
            $maxOrder = !empty($allLevels) && isset($allLevels[0]->level_order) ? (int) $allLevels[0]->level_order : 0;
            $data['level_order'] = $maxOrder + 1;
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
        // Sanitize name
        if (isset($data['name'])) {
            $data['name'] = sanitize_text_field($data['name']);
        }

        // Handle slug: preserve manually edited slug, otherwise auto-generate from name
        $preserveSlug = isset($data['preserve_slug']) && $data['preserve_slug'] === true;
        unset($data['preserve_slug']); // Remove flag from data array

        if ($preserveSlug && isset($data['slug']) && !empty($data['slug'])) {
            // Slug was manually edited - preserve it but ensure uniqueness
            $data['slug'] = SlugHelper::generateUniqueFromDatabase(
                $data['slug'],
                'yatra_difficulty_levels',
                'slug',
                $id // Exclude current record when checking uniqueness
            );
        } elseif (!empty($data['name'])) {
            // Auto-generate slug from name if name is provided and slug not manually edited
            $data['slug'] = SlugHelper::generateUniqueFromDatabase(
                $data['name'],
                'yatra_difficulty_levels',
                'slug',
                $id // Exclude current record when checking uniqueness
            );
        } elseif (isset($data['slug'])) {
            // If name is not provided but slug is, sanitize the slug
            $data['slug'] = SlugHelper::generate($data['slug']);
        }

        // Sanitize description
        if (isset($data['description'])) {
            $data['description'] = sanitize_textarea_field($data['description']);
        }

        // Sanitize level_order
        if (isset($data['level_order'])) {
            $data['level_order'] = absint($data['level_order']);
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
     * Get ordered difficulty levels (by level_order)
     */
    public function getOrdered(array $args = []): array
    {
        return $this->repository->getOrdered($args);
    }

    /**
     * Get published difficulty levels
     */
    public function getPublished(array $args = []): array
    {
        return $this->repository->getPublished($args);
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
     * Get status counts for admin list views
     *
     * Provides stable counts for All / Published / Draft / Trash that
     * do not change when filters (status/search) are applied in the UI.
     */
    public function getStatusCounts(): array
    {
        // All statuses combined (no status filter)
        $all = $this->count([]);

        // Individual statuses
        $publish = $this->count(['status' => 'publish']);
        $draft   = $this->count(['status' => 'draft']);
        $trash   = $this->count(['status' => 'trash']);

        return [
            'all'     => (int) $all,
            'publish' => (int) $publish,
            'draft'   => (int) $draft,
            'trash'   => (int) $trash,
        ];
    }
}

