<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\TripCategoryRepository;
use Yatra\Helpers\SlugHelper;

/**
 * Trip Category Service
 * Contains business logic for trip categories
 */
class TripCategoryService extends BaseService
{
    /**
     * @var TripCategoryRepository
     */
    private TripCategoryRepository $repository;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->repository = new TripCategoryRepository();
    }

    /**
     * Get repository
     */
    protected function getRepository(): TripCategoryRepository
    {
        return $this->repository;
    }

    /**
     * Validate category data
     */
    protected function validate(array $data, ?int $id = null): void
    {
        if (empty($data['name'])) {
            throw new \InvalidArgumentException('Category name is required');
        }

        // Validate parent_id if provided
        if (isset($data['parent_id']) && !empty($data['parent_id'])) {
            $parentId = (int) $data['parent_id'];
            
            // Check if parent exists
            $parent = $this->repository->find($parentId);
            if (!$parent) {
                throw new \InvalidArgumentException('Parent category not found');
            }

            // Prevent circular reference - check if trying to set parent to itself
            if ($id && $parentId === $id) {
                throw new \InvalidArgumentException('Category cannot be its own parent');
            }

            // Prevent setting parent to a subcategory (only top-level categories can be parents)
            if ($parent->parent_id !== null) {
                throw new \InvalidArgumentException('Parent category must be a top-level category');
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
                'yatra_trip_categories',
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

        // Sanitize parent_id
        if (isset($data['parent_id'])) {
            $data['parent_id'] = !empty($data['parent_id']) ? absint($data['parent_id']) : null;
        } else {
            $data['parent_id'] = null;
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
                'yatra_trip_categories',
                'slug',
                $id // Exclude current record when checking uniqueness
            );
        } elseif (!empty($data['name'])) {
            // Auto-generate slug from name if name is provided and slug not manually edited
            $data['slug'] = SlugHelper::generateUniqueFromDatabase(
                $data['name'],
                'yatra_trip_categories',
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

        // Sanitize parent_id
        if (isset($data['parent_id'])) {
            $data['parent_id'] = !empty($data['parent_id']) ? absint($data['parent_id']) : null;
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
     * Get hierarchical categories (with subcategories)
     */
    public function getHierarchical(array $args = []): array
    {
        return $this->repository->getHierarchical($args);
    }

    /**
     * Get top-level categories only
     */
    public function getTopLevel(array $args = []): array
    {
        return $this->repository->getTopLevel($args);
    }

    /**
     * Get subcategories by parent ID
     */
    public function getSubcategories(int $parentId, array $args = []): array
    {
        return $this->repository->getSubcategories($parentId, $args);
    }

    /**
     * Get category with subcategories
     */
    public function getWithSubcategories(int $id): ?\stdClass
    {
        return $this->repository->getWithSubcategories($id);
    }

    /**
     * Get published categories
     */
    public function getPublished(array $args = []): array
    {
        return $this->repository->getPublished($args);
    }

    /**
     * Get published categories with trip counts, ratings, and pricing stats
     */
    public function getPublishedWithStats(): array
    {
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
     * Delete category (with validation)
     */
    public function delete(int $id): bool
    {
        // Check if category can be deleted
        if (!$this->repository->canDelete($id)) {
            throw new \InvalidArgumentException('Cannot delete category: it has subcategories or is in use');
        }

        return parent::delete($id);
    }
}

