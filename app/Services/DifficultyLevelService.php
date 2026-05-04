<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\DifficultyLevelRepository;
use Yatra\Helpers\SlugHelper;
use Yatra\Helpers\FormatHelper;
use Yatra\Database\Tables\ClassificationsTable;

/**
 * Difficulty Level Service
 * Contains business logic for difficulty levels using ClassificationsTable
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

        // Validate sorting if provided
        if (isset($data['sorting'])) {
            $sorting = (int) $data['sorting'];
            if ($sorting < 0) {
                throw new \InvalidArgumentException('Sorting must be a non-negative integer');
            }
        }
    }

    /**
     * Process before create
     */
    protected function processBeforeCreate(array $data): array
    {
        // Set the type to 'difficulty' for the ClassificationsTable
        $data['type'] = 'difficulty';

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

        // Sanitize description (rich text)
        if (isset($data['description'])) {
            $data['description'] = FormatHelper::sanitizeQuillHtml($data['description']);
        }

        // Sanitize sorting
        if (isset($data['sorting'])) {
            $data['sorting'] = absint($data['sorting']);
        } else {
            $data['sorting'] = 0; // Default sorting
        }

        // Sanitize is_featured
        if (isset($data['is_featured'])) {
            $data['is_featured'] = $data['is_featured'] ? 1 : 0;
        } else {
            $data['is_featured'] = 0; // Default not featured
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
                
                $data['icon'] = yatra_normalize_icon_picker_for_storage($data['icon']);
                $data['icon'] = maybe_serialize($data['icon']);
            } elseif (is_string($data['icon'])) {
                // If it's already a string, sanitize it
                $data['icon'] = sanitize_text_field($data['icon']);
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
        // Ensure the type remains 'difficulty' for the ClassificationsTable
        $data['type'] = 'difficulty';

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

        // Sanitize sorting
        if (isset($data['sorting'])) {
            $data['sorting'] = absint($data['sorting']);
        }

        // Sanitize is_featured
        if (isset($data['is_featured'])) {
            $data['is_featured'] = $data['is_featured'] ? 1 : 0;
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
                
                $data['icon'] = yatra_normalize_icon_picker_for_storage($data['icon']);
                $data['icon'] = maybe_serialize($data['icon']);
            } elseif (is_string($data['icon'])) {
                // If it's already a string, sanitize it
                $data['icon'] = sanitize_text_field($data['icon']);
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
     * Get published difficulty levels
     */
    public function getPublished(): array
    {
        return $this->repository->getPublished();
    }

    /**
     * Get status counts for difficulty levels
     */
    public function getStatusCounts(array $args = []): array
    {
        return $this->repository->getStatusCounts($args);
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
     * Get ordered difficulty levels (by sorting)
     */
    public function getOrdered(array $args = []): array
    {
        $args['order_by'] = 'sorting';
        $args['order'] = 'ASC';
        return $this->getAll($args);
    }

    /**
     * Count items
     */
    public function count(array $args = []): int
    {
        // Sanitize and handle search
        if (!empty($args['search'])) {
            $search = sanitize_text_field($args['search']);
            return $this->repository->search($search, $args);
        }

        return $this->repository->count($args);
    }

    /**
     * Get trip count for a difficulty level
     */
    public function getTripCount(int $levelId): int
    {
        $difficultyLevelRepository = new \Yatra\Repositories\DifficultyLevelRepository();
        return $difficultyLevelRepository->getTripCount($levelId);
    }

    /**
     * Get trip count for difficulty level (direct field method)
     */
    public function getTripCountDirect(int $levelId): int
    {
        $difficultyLevelRepository = new \Yatra\Repositories\DifficultyLevelRepository();
        return $difficultyLevelRepository->getTripCountDirect($levelId);
    }
}

