<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\TravelerCategoryRepository;
use Yatra\Helpers\SlugHelper;

/**
 * Traveler Category Service
 * Contains business logic for traveler categories
 */
class TravelerCategoryService extends BaseService
{
    /**
     * @var TravelerCategoryRepository
     */
    private TravelerCategoryRepository $repository;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->repository = new TravelerCategoryRepository();
    }

    /**
     * Get repository
     */
    protected function getRepository(): TravelerCategoryRepository
    {
        return $this->repository;
    }

    /**
     * Validate data for creation with field mapping
     */
    public function validateCreate(array $data): void
    {
        // Handle field mapping for backward compatibility BEFORE validation
        if (isset($data['label']) && !isset($data['name'])) {
            $data['name'] = $data['label'];
            // Remove the old label field to prevent database errors
            unset($data['label']);
        }
        
        // Call parent validation with mapped data
        parent::validateCreate($data);
    }

    /**
     * Validate data for update with field mapping
     */
    public function validateUpdate(int $id, array $data): void
    {
        // Handle field mapping for backward compatibility BEFORE validation
        if (isset($data['label']) && !isset($data['name'])) {
            $data['name'] = $data['label'];
            // Remove the old label field to prevent database errors
            unset($data['label']);
        }
        
        // Call parent validation with mapped data
        parent::validateUpdate($id, $data);
    }

    /**
     * Validate traveler category data
     */
    protected function validate(array $data, ?int $id = null): void
    {
        if (empty($data['name'])) {
            throw new \InvalidArgumentException('Category name is required');
        }

        // Slug will be auto-generated from name, so we don't need to validate it here
        // The SlugHelper will ensure uniqueness

        // Validate status
        $allowed_statuses = ['draft', 'publish', 'trash'];
        if (isset($data['status']) && !in_array($data['status'], $allowed_statuses, true)) {
            throw new \InvalidArgumentException('Invalid status. Must be one of: ' . implode(', ', $allowed_statuses));
        }

        // Validate age range
        if (isset($data['age_min']) && $data['age_min'] !== '' && $data['age_min'] !== null) {
            $age_min = (int) $data['age_min'];
            if ($age_min < 0) {
                throw new \InvalidArgumentException('Minimum age cannot be negative');
            }
        }

        if (isset($data['age_max']) && $data['age_max'] !== '' && $data['age_max'] !== null) {
            $age_max = (int) $data['age_max'];
            if ($age_max < 0) {
                throw new \InvalidArgumentException('Maximum age cannot be negative');
            }
        }

        // Validate age range logic
        if (isset($data['age_min']) && isset($data['age_max']) 
            && $data['age_min'] !== '' && $data['age_max'] !== '' 
            && $data['age_min'] !== null && $data['age_max'] !== null) {
            $age_min = (int) $data['age_min'];
            $age_max = (int) $data['age_max'];
            if ($age_min >= $age_max) {
                throw new \InvalidArgumentException('Maximum age must be greater than minimum age');
            }
        }

        // Validate pricing mode
        if (isset($data['pricing_mode']) && $data['pricing_mode'] !== '') {
            $allowed_pricing_modes = ['per_person', 'per_group'];
            if (!in_array($data['pricing_mode'], $allowed_pricing_modes, true)) {
                throw new \InvalidArgumentException('Invalid pricing mode. Must be per_person or per_group');
            }
        }

        // Validate group size when pricing per group
        if (($data['pricing_mode'] ?? 'per_person') === 'per_group') {
            if (isset($data['min_pax']) && $data['min_pax'] !== '' && $data['min_pax'] !== null) {
                $min_pax = (int) $data['min_pax'];
                if ($min_pax <= 0) {
                    throw new \InvalidArgumentException('Minimum group size must be greater than zero');
                }
            }

            if (isset($data['max_pax']) && $data['max_pax'] !== '' && $data['max_pax'] !== null) {
                $max_pax = (int) $data['max_pax'];
                if ($max_pax <= 0) {
                    throw new \InvalidArgumentException('Maximum group size must be greater than zero');
                }
            }

            if (
                isset($data['min_pax'], $data['max_pax']) &&
                $data['min_pax'] !== '' && $data['max_pax'] !== '' &&
                $data['min_pax'] !== null && $data['max_pax'] !== null
            ) {
                $min_pax = (int) $data['min_pax'];
                $max_pax = (int) $data['max_pax'];
                if ($min_pax > $max_pax) {
                    throw new \InvalidArgumentException('Maximum group size must be greater than or equal to minimum group size');
                }
            }
        }
    }

    /**
     * Process before create
     */
    protected function processBeforeCreate(array $data): array
    {
        // Handle field mapping for backward compatibility
        if (isset($data['label']) && !isset($data['name'])) {
            $data['name'] = $data['label'];
            // Remove the old label field to prevent database errors
            unset($data['label']);
        }
        
        // Sanitize name
        if (isset($data['name'])) {
            $data['name'] = sanitize_text_field($data['name']);
        }

        // Always auto-generate slug from name (backend ensures uniqueness)
        if (!empty($data['name'])) {
            $data['slug'] = SlugHelper::generateUniqueFromDatabase(
                $data['name'],
                'yatra_new_classifications',
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
        }

        // Prepare metadata for traveler type
        $metadata = [];
        
        if (isset($data['age_min']) && $data['age_min'] !== '' && $data['age_min'] !== null) {
            $metadata['age_min'] = (int) $data['age_min'];
        }
        
        if (isset($data['age_max']) && $data['age_max'] !== '' && $data['age_max'] !== null) {
            $metadata['age_max'] = (int) $data['age_max'];
        }
        
        if (isset($data['pricing_mode'])) {
            $metadata['pricing_mode'] = sanitize_text_field($data['pricing_mode']);
        }
        
        if (isset($data['min_pax']) && $data['min_pax'] !== '' && $data['min_pax'] !== null) {
            $metadata['min_pax'] = (int) $data['min_pax'];
        }
        
        if (isset($data['max_pax']) && $data['max_pax'] !== '' && $data['max_pax'] !== null) {
            $metadata['max_pax'] = (int) $data['max_pax'];
        }

        // Set the type for traveler categories
        $data['type'] = 'traveler_type';
        
        // Store metadata as JSON
        $data['metadata'] = wp_json_encode($metadata);

        // Remove old field names that don't exist in ClassificationsTable
        unset($data['age_min'], $data['age_max'], $data['pricing_mode'], $data['min_pax'], $data['max_pax']);

        // Set created_by and updated_by to current user
        $current_user_id = get_current_user_id();
        $data['created_by'] = absint($current_user_id);
        $data['updated_by'] = absint($current_user_id);

        // Sanitize and serialize icon if it's an array
        if (isset($data['icon'])) {
            if (is_array($data['icon'])) {
                $data['icon'] = yatra_normalize_icon_picker_for_storage($data['icon']);
                $data['icon'] = maybe_serialize($data['icon']);
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
        // Handle field mapping for backward compatibility
        if (isset($data['label']) && !isset($data['name'])) {
            $data['name'] = $data['label'];
            // Remove the old label field to prevent database errors
            unset($data['label']);
        }
        
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
                'yatra_new_classifications',
                'slug',
                $id // Exclude current record when checking uniqueness
            );
        } elseif (!empty($data['name'])) {
            // Auto-generate slug from name if name is provided and slug not manually edited
            $data['slug'] = SlugHelper::generateUniqueFromDatabase(
                $data['name'],
                'yatra_new_classifications',
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

        // Get existing metadata to merge with new data
        $existing = $this->repository->find($id);
        $metadata = [];
        if ($existing && !empty($existing->metadata)) {
            $metadata = json_decode($existing->metadata, true) ?: [];
        }

        // Update metadata fields
        if (isset($data['age_min'])) {
            if ($data['age_min'] === '' || $data['age_min'] === null) {
                unset($metadata['age_min']);
            } else {
                $metadata['age_min'] = absint($data['age_min']);
            }
        }

        if (isset($data['age_max'])) {
            if ($data['age_max'] === '' || $data['age_max'] === null) {
                unset($metadata['age_max']);
            } else {
                $metadata['age_max'] = absint($data['age_max']);
            }
        }

        if (isset($data['pricing_mode'])) {
            $allowed_pricing_modes = ['per_person', 'per_group'];
            if (in_array($data['pricing_mode'], $allowed_pricing_modes, true)) {
                $metadata['pricing_mode'] = $data['pricing_mode'];
            } else {
                $metadata['pricing_mode'] = 'per_person';
            }
        }

        if (isset($data['min_pax'])) {
            if ($data['min_pax'] === '' || $data['min_pax'] === null) {
                unset($metadata['min_pax']);
            } else {
                $metadata['min_pax'] = absint($data['min_pax']);
            }
        }

        if (isset($data['max_pax'])) {
            if ($data['max_pax'] === '' || $data['max_pax'] === null) {
                unset($metadata['max_pax']);
            } else {
                $metadata['max_pax'] = absint($data['max_pax']);
            }
        }

        // Store updated metadata as JSON
        $data['metadata'] = wp_json_encode($metadata);

        // Remove old field names that don't exist in ClassificationsTable
        unset($data['age_min'], $data['age_max'], $data['pricing_mode'], $data['min_pax'], $data['max_pax']);

        // Sanitize and serialize icon if it's an array
        if (isset($data['icon'])) {
            if (is_array($data['icon'])) {
                if ($data['icon']['type'] === 'image' && !empty($data['icon']['value'])) {
                    $value = $data['icon']['value'];
                    if (filter_var($value, FILTER_VALIDATE_URL)) {
                        $attachment_id = attachment_url_to_postid($value);
                        if ($attachment_id) {
                            $data['icon']['value'] = $attachment_id;
                        }
                    } elseif (is_numeric($value)) {
                        $data['icon']['value'] = (int) $value;
                    }
                }
                $data['icon'] = yatra_normalize_icon_picker_for_storage($data['icon']);
                $data['icon'] = maybe_serialize($data['icon']);
            } elseif (is_string($data['icon'])) {
                $data['icon'] = sanitize_text_field($data['icon']);
            }
        }

        // Set updated_by to current user
        $data['updated_by'] = absint(get_current_user_id());

        return $data;
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
     * Get published categories
     */
    public function getPublished(array $args = []): array
    {
        $args['where']['status'] = 'publish';
        return $this->repository->all($args);
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
}

