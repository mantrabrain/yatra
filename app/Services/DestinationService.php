<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\DestinationRepository;
use Yatra\Helpers\ClassificationLandingPageMetadata;
use Yatra\Helpers\SlugHelper;
use Yatra\Helpers\FormatHelper;
use Yatra\Database\Tables\ClassificationsTable;

/**
 * Destination Service
 * Contains business logic for destinations
 */
class DestinationService extends BaseService
{
    /**
     * @var DestinationRepository
     */
    private DestinationRepository $repository;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->repository = new DestinationRepository();
    }

    /**
     * Get repository
     */
    protected function getRepository(): DestinationRepository
    {
        return $this->repository;
    }

    /**
     * Validate destination data
     */
    protected function validate(array $data, ?int $id = null): void
    {
        if (empty($data['name'])) {
            throw new \InvalidArgumentException('Destination name is required');
        }

        // Slug will be auto-generated from name, so we don't need to validate it here
        // The SlugHelper will ensure uniqueness

        // Validate status - accept both old and new values for backward compatibility
        $allowed_statuses = ['draft', 'active', 'inactive', 'publish', 'trash'];
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
                
                $data['icon'] = yatra_normalize_icon_picker_for_storage($data['icon']);
                $data['icon'] = maybe_serialize($data['icon']);
            } elseif (is_string($data['icon'])) {
                // If it's already a string, sanitize it
                $data['icon'] = sanitize_text_field($data['icon']);
            }
        }

        // IMPORTANT: Force type to 'destination' - this overrides any frontend type
        $data['type'] = 'destination';

        // Handle SEO metadata
        if (isset($data['seo_title']) || isset($data['seo_description']) || isset($data['seo_keywords'])) {
            $existing_metadata = ClassificationLandingPageMetadata::baseMetadataMergedWithRequest(
                null,
                $this->repository,
                $data
            );

            // Add SEO fields to metadata
            if (isset($data['seo_title'])) {
                $existing_metadata['seo_title'] = sanitize_text_field($data['seo_title']);
                unset($data['seo_title']); // Remove from main data
            }
            if (isset($data['seo_description'])) {
                $existing_metadata['seo_description'] = sanitize_textarea_field($data['seo_description']);
                unset($data['seo_description']); // Remove from main data
            }
            if (isset($data['seo_keywords'])) {
                $existing_metadata['seo_keywords'] = sanitize_text_field($data['seo_keywords']);
                unset($data['seo_keywords']); // Remove from main data
            }
            
            $data['metadata'] = $existing_metadata;
        }

        ClassificationLandingPageMetadata::mergeLandingPageIntoData($data, null, $this->repository);

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
                
                $data['icon'] = yatra_normalize_icon_picker_for_storage($data['icon']);
                $data['icon'] = maybe_serialize($data['icon']);
            } elseif (is_string($data['icon'])) {
                // If it's already a string, sanitize it
                $data['icon'] = sanitize_text_field($data['icon']);
            }
        }

        // IMPORTANT: Ensure type remains 'destination' - prevent frontend from changing type
        $data['type'] = 'destination';

        // Handle SEO metadata
        if (isset($data['seo_title']) || isset($data['seo_description']) || isset($data['seo_keywords'])) {
            $existing_metadata = ClassificationLandingPageMetadata::baseMetadataMergedWithRequest(
                $id,
                $this->repository,
                $data
            );

            // Add/update SEO fields in metadata
            if (isset($data['seo_title'])) {
                $existing_metadata['seo_title'] = sanitize_text_field($data['seo_title']);
                unset($data['seo_title']); // Remove from main data
            }
            if (isset($data['seo_description'])) {
                $existing_metadata['seo_description'] = sanitize_textarea_field($data['seo_description']);
                unset($data['seo_description']); // Remove from main data
            }
            if (isset($data['seo_keywords'])) {
                $existing_metadata['seo_keywords'] = sanitize_text_field($data['seo_keywords']);
                unset($data['seo_keywords']); // Remove from main data
            }
            
            $data['metadata'] = $existing_metadata;
        }

        ClassificationLandingPageMetadata::mergeLandingPageIntoData($data, $id, $this->repository);

        return $data;
    }

    /**
     * Get status counts for destinations
     */
    public function getAll(array $args = []): array
    {
        // IMPORTANT: Always filter by type = 'destination' for destinations
        $args['where']['type'] = 'destination';

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
     * Get published destinations
     */
    public function getPublished(array $args = []): array
    {
        return $this->repository->getPublished($args);
    }

    /**
     * Get published destinations along with aggregated stats such as
     * trips_count derived from related trip records.
     */
    public function getPublishedWithStats(): array
    {
        // For now this simply delegates to a repository method that attaches
        // trips_count using the yatra_trip_destinations relation table.
        return $this->repository->getPublishedWithTripCounts();
    }

    /**
     * Count items
     */
    public function count(array $args = []): int
    {
        // IMPORTANT: Always filter by type = 'destination' for destinations
        $args['where']['type'] = 'destination';

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
     * Bulk update status for multiple destinations
     */
    public function bulkUpdateStatus(array $ids, string $status): int
    {
        $allowed_statuses = ['draft', 'publish', 'trash'];
        if (!in_array($status, $allowed_statuses, true)) {
            throw new \InvalidArgumentException('Invalid status. Must be one of: ' . implode(', ', $allowed_statuses));
        }

        $updated = 0;
        foreach ($ids as $id) {
            $id = absint($id);
            if ($this->repository->update($id, ['status' => $status])) {
                $updated++;
            }
        }

        return $updated;
    }

    /**
     * Get trip count for a destination
     */
    public function getTripCount(int $destinationId): int
    {
        $destinationRepository = new \Yatra\Repositories\DestinationRepository();
        return $destinationRepository->getTripCount($destinationId);
    }

    /**
     * Get trip count for destination (direct field method)
     */
    public function getTripCountDirect(int $destinationId): int
    {
        $destinationRepository = new \Yatra\Repositories\DestinationRepository();
        return $destinationRepository->getTripCountDirect($destinationId);
    }

    /**
     * Bulk delete destinations
     */
    public function bulkDelete(array $ids): int
    {
        $deleted = 0;
        foreach ($ids as $id) {
            $id = absint($id);
            if ($this->repository->delete($id)) {
                $deleted++;
            }
        }

        return $deleted;
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
        $all = $counts['total']??0;

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
}
