<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\ItemRepository;
use Yatra\Repositories\ItemTypeRepository;
use Yatra\Helpers\SlugHelper;

/**
 * Item Service
 * Contains business logic for items (item subtypes)
 */
class ItemService extends BaseService
{
    /**
     * @var ItemRepository
     */
    private ItemRepository $repository;

    /**
     * @var ItemTypeRepository
     */
    private ItemTypeRepository $itemTypeRepository;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->repository = new ItemRepository();
        $this->itemTypeRepository = new ItemTypeRepository();
    }

    /**
     * Get repository
     */
    protected function getRepository(): ItemRepository
    {
        return $this->repository;
    }

    /**
     * Validate item data
     */
    protected function validate(array $data, ?int $id = null): void
    {
        if (empty($data['name'])) {
            throw new \InvalidArgumentException('Item name is required');
        }

        if (empty($data['type_id'])) {
            throw new \InvalidArgumentException('Item type is required');
        }

        // Validate type_id exists
        $itemType = $this->itemTypeRepository->find((int) $data['type_id']);
        if (!$itemType) {
            throw new \InvalidArgumentException('Invalid item type selected');
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
        // DEBUG: Log incoming data
        if (defined('WP_DEBUG') && WP_DEBUG) {
            }
        
        // Set type to item for ClassificationsTable
        $data['type'] = 'item';
        
        // Sanitize name
        if (isset($data['name'])) {
            $data['name'] = sanitize_text_field($data['name']);
        }

        // Always auto-generate slug from name (backend ensures uniqueness)
        if (!empty($data['name'])) {
            // Use ClassificationsTable directly to avoid protected method issue
            $tableName = \Yatra\Database\Tables\ClassificationsTable::getTableName();
            // Remove WordPress prefix since SlugHelper adds it automatically
            global $wpdb;
            $tableNameWithoutPrefix = str_replace($wpdb->prefix, '', $tableName);
            
            $data['slug'] = SlugHelper::generateUniqueFromDatabase(
                $data['name'],
                $tableNameWithoutPrefix,
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

        // Store type_id in parent_id column (ClassificationsTable uses parent_id for item type relationship)
        if (isset($data['type_id'])) {
            $data['parent_id'] = absint($data['type_id']);
            unset($data['type_id']); // Remove from main data
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

        return $data;
    }

    /**
     * Process before update
     */
    protected function processBeforeUpdate(int $id, array $data): array
    {
        // Ensure type is not changed from item
        $data['type'] = 'item';
        
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
                'yatra_classifications',
                'slug',
                $id // Exclude current record when checking uniqueness
            );
        } elseif (!empty($data['name'])) {
            // Auto-generate slug from name if name is provided and slug not manually edited
            $data['slug'] = SlugHelper::generateUniqueFromDatabase(
                $data['name'],
                'yatra_classifications',
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

        // Store type_id in parent_id column (ClassificationsTable uses parent_id for item type relationship)
        if (isset($data['type_id'])) {
            $data['parent_id'] = absint($data['type_id']);
            unset($data['type_id']); // Remove from main data
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

        // Always filter by type = 'item' for items
        $args['where']['type'] = 'item';

        // Sanitize and handle type filter
        if (!empty($args['type_id']) && $args['type_id'] !== 'all') {
            $type_id = absint($args['type_id']);
            if ($type_id > 0) {
                $args['where']['parent_id'] = $type_id;
            }
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
     * Get published items
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

        // Sanitize and handle type filter
        if (!empty($args['type_id']) && $args['type_id'] !== 'all') {
            $type_id = absint($args['type_id']);
            if ($type_id > 0) {
                $args['where']['parent_id'] = $type_id;
            }
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
     * do not change when filters (status/search/type) are applied in the UI.
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

