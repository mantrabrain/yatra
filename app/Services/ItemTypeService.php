<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\ItemTypeRepository;
use Yatra\Helpers\SlugHelper;

/**
 * Item Type Service
 * Contains business logic for item types
 */
class ItemTypeService extends BaseService
{
    /**
     * @var ItemTypeRepository
     */
    private ItemTypeRepository $repository;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->repository = new ItemTypeRepository();
    }

    /**
     * Get repository
     */
    protected function getRepository(): ItemTypeRepository
    {
        return $this->repository;
    }

    /**
     * Get repository (public access for controllers)
     */
    public function getRepositoryInstance(): ItemTypeRepository
    {
        return $this->repository;
    }

    /**
     * Validate item type data
     */
    protected function validate(array $data, ?int $id = null): void
    {
        if (empty($data['name'])) {
            throw new \InvalidArgumentException('Item type name is required');
        }

        // Slug will be auto-generated from name, so we don't need to validate it here
        // The SlugHelper will ensure uniqueness

        // Validate status
        $allowed_statuses = ['draft', 'publish', 'trash'];
        if (isset($data['status']) && !in_array($data['status'], $allowed_statuses, true)) {
            throw new \InvalidArgumentException('Invalid status. Must be one of: ' . implode(', ', $allowed_statuses));
        }

        // Validate color
        $allowed_colors = ['blue', 'green', 'purple', 'orange', 'red', 'yellow', 'gray'];
        if (isset($data['color']) && !in_array($data['color'], $allowed_colors, true)) {
            throw new \InvalidArgumentException('Invalid color. Must be one of: ' . implode(', ', $allowed_colors));
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
                'yatra_item_types',
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

        // Sanitize color
        if (isset($data['color'])) {
            $allowed_colors = ['blue', 'green', 'purple', 'orange', 'red', 'yellow', 'gray'];
            $data['color'] = in_array($data['color'], $allowed_colors, true) 
                ? $data['color'] 
                : 'blue';
        } else {
            $data['color'] = 'blue';
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
                'yatra_item_types',
                'slug',
                $id // Exclude current record when checking uniqueness
            );
        } elseif (!empty($data['name'])) {
            // Auto-generate slug from name if name is provided and slug not manually edited
            $data['slug'] = SlugHelper::generateUniqueFromDatabase(
                $data['name'],
                'yatra_item_types',
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

        // Sanitize status
        if (isset($data['status'])) {
            $allowed_statuses = ['draft', 'publish', 'trash'];
            $data['status'] = in_array($data['status'], $allowed_statuses, true) 
                ? $data['status'] 
                : 'draft';
        }

        // Sanitize color
        if (isset($data['color'])) {
            $allowed_colors = ['blue', 'green', 'purple', 'orange', 'red', 'yellow', 'gray'];
            $data['color'] = in_array($data['color'], $allowed_colors, true) 
                ? $data['color'] 
                : 'blue';
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
     * Get published item types
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
        $args['where']['type']='item_type';
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

