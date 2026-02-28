<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\CategoryRepository;
use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Helpers\SlugHelper;
use Yatra\Helpers\FormatHelper;

/**
 * Category Service
 * Contains business logic for categories
 */
class CategoryService extends BaseService
{
    /**
     * @var CategoryRepository
     */
    private CategoryRepository $repository;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->repository = new CategoryRepository();
    }

    /**
     * Get repository
     */
    protected function getRepository(): CategoryRepository
    {
        return $this->repository;
    }

    /**
     * Process before create
     */
    protected function processBeforeCreate(array $data): array
    {
        // Set the type to 'category' for the ClassificationsTable
        $data['type'] = 'category';

        // Sanitize name
        if (isset($data['name'])) {
            $data['name'] = sanitize_text_field($data['name']);
        }

        // Always auto-generate slug from name (backend ensures uniqueness)
        if (!empty($data['name'])) {
            $data['slug'] = SlugHelper::generateUniqueFromDatabase(
                $data['name'],
                ClassificationsTable::getTableName(),
                'slug'
            );
        } elseif (isset($data['slug'])) {
            // If name is empty but slug is provided, sanitize it
            $data['slug'] = SlugHelper::generate($data['slug']);
        }

        // Sanitize Quill HTML description
        if (isset($data['description'])) {
            $data['description'] = FormatHelper::sanitizeQuillHtml($data['description']);
        }
        
        // Sanitize status
        if (isset($data['status'])) {
            // Validate status
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
                // Convert URL back to attachment ID if possible
                if ($data['icon']['type'] === 'image' && !empty($data['icon']['value'])) {
                    $value = $data['icon']['value'];
                    
                    // If it's a URL, try to find the attachment ID
                    if (filter_var($value, FILTER_VALIDATE_URL)) {
                        $attachment_id = attachment_url_to_postid($value);
                        if ($attachment_id) {
                            $data['icon']['value'] = $attachment_id;
                        }
                    }
                    // If it's already numeric, keep it as is
                    elseif (is_numeric($value)) {
                        $data['icon']['value'] = (int) $value;
                    }
                }
                
                $data['icon'] = maybe_serialize($data['icon']);
            }
        }

        // Sanitize metadata if it's an array
        if (isset($data['metadata'])) {
            if (is_array($data['metadata'])) {
                $data['metadata'] = maybe_serialize($data['metadata']);
            }
        }

        return $data;
    }

    /**
     * Process before update
     */
    protected function processBeforeUpdate(int $id, array $data): array
    {
        // Ensure the type remains 'category' for the ClassificationsTable
        $data['type'] = 'category';

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
                ClassificationsTable::getTableName(),
                'slug',
                $id // Exclude current record when checking uniqueness
            );
        }
        // If slug is not provided, don't modify it (keep existing slug)

        // Sanitize Quill HTML description
        if (isset($data['description'])) {
            $data['description'] = FormatHelper::sanitizeQuillHtml($data['description']);
        }

        // Sanitize status
        if (isset($data['status'])) {
            // Validate status
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
                // Convert URL back to attachment ID if possible
                if ($data['icon']['type'] === 'image' && !empty($data['icon']['value'])) {
                    $value = $data['icon']['value'];
                    
                    // If it's a URL, try to find the attachment ID
                    if (filter_var($value, FILTER_VALIDATE_URL)) {
                        $attachment_id = attachment_url_to_postid($value);
                        if ($attachment_id) {
                            $data['icon']['value'] = $attachment_id;
                        }
                    }
                    // If it's already numeric, keep it as is
                    elseif (is_numeric($value)) {
                        $data['icon']['value'] = (int) $value;
                    }
                }
                
                $data['icon'] = maybe_serialize($data['icon']);
            }
        }

        // Sanitize metadata if it's an array
        if (isset($data['metadata'])) {
            if (is_array($data['metadata'])) {
                $data['metadata'] = maybe_serialize($data['metadata']);
            }
        }

        return $data;
    }

    /**
     * Get all categories
     */
    public function getAll(array $args = []): array
    {
        // IMPORTANT: Always filter by type = 'category' for categories
        $args['where']['type'] = 'category';

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
     * Count items
     */
    public function count(array $args = []): int
    {
        // IMPORTANT: Always filter by type = 'category' for categories
        $args['where']['type'] = 'category';

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
     * Get published categories with stats
     */
    public function getPublishedWithStats(): array
    {
        // For now this simply delegates to a repository method that attaches
        // trips_count using the yatra_trip_classifications relation table.
        return $this->repository->getPublishedWithTripCounts();
    }

    /**
     * Get status counts
     */
    public function getStatusCounts(): array
    {
        $counts = $this->repository->getStatusCounts();

        $publish = $counts['publish'] ?? 0;
        $draft = $counts['draft'] ?? 0;
        $trash = $counts['trash'] ?? 0;

        // Calculate total from all repository total count, not sum of all values
        $all = $counts['total'] ?? 0;

        $result = [
            'all' => (int) $all,
            'publish' => (int) $publish,
            'draft' => (int) $draft,
            'trash' => (int) $trash,
        ];

        // Add legacy status keys for backward compatibility
        $result['active'] = $result['publish'];
        $result['inactive'] = $result['trash'];

        return $result;
    }

    /**
     * Override update method to add debugging
     */
    public function update(int $id, array $data): bool
    {
        try {
            return parent::update($id, $data);
        } catch (\Exception $e) {
            // DEBUG: Log the error
            if (defined('WP_DEBUG') && WP_DEBUG) {
                }
            throw $e;
        }
    }

    /**
     * Get trip count for a category
     */
    public function getTripCount(int $categoryId): int
    {
        $categoryRepository = new \Yatra\Repositories\CategoryRepository();
        return $categoryRepository->getTripCount($categoryId);
    }

    /**
     * Get trip count for category (direct field method)
     */
    public function getTripCountDirect(int $categoryId): int
    {
        $categoryRepository = new \Yatra\Repositories\CategoryRepository();
        return $categoryRepository->getTripCountDirect($categoryId);
    }

    /**
     * Get subcategories by parent ID
     */
    public function getSubcategories(int $parentId, array $args = []): array
    {
        return $this->repository->getSubcategories($parentId, $args);
    }

    /**
     * Get all categories with subcategories (hierarchical)
     */
    public function getHierarchical(array $args = []): array
    {
        return $this->repository->getHierarchical($args);
    }
}
