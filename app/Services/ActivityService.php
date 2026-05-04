<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\ActivityRepository;
use Yatra\Helpers\SlugHelper;
use Yatra\Helpers\FormatHelper;
use Yatra\Database\Tables\ClassificationsTable;

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
        // Set the type to 'activity' for the ClassificationsTable
        $data['type'] = 'activity';

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

        // Handle SEO metadata
        if (isset($data['seo_title']) || isset($data['seo_description']) || isset($data['seo_keywords'])) {
            
            $existing_metadata = [];
            if (isset($data['metadata']) && is_array($data['metadata'])) {
                $existing_metadata = $data['metadata'];
            } elseif (isset($data['metadata'])) {
                $existing_metadata = maybe_unserialize($data['metadata']);
            }
            
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

        // Handle SEO metadata
        if (isset($data['seo_title']) || isset($data['seo_description']) || isset($data['seo_keywords'])) {
            // Get existing metadata
            $existing_metadata = [];
            if (isset($data['metadata']) && is_array($data['metadata'])) {
                $existing_metadata = $data['metadata'];
            } elseif (isset($data['metadata'])) {
                $existing_metadata = maybe_unserialize($data['metadata']);
            } else {
                // Get existing metadata from database
                $existing = $this->repository->find($id);
                if ($existing && isset($existing->metadata)) {
                    $existing_metadata = maybe_unserialize($existing->metadata);
                }
            }
            
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

        return $data;
    }

    /**
     * Get all items with search and filters
     */
    public function getAll(array $args = []): array
    {
        // IMPORTANT: Always filter by type = 'activity' for activities
        $args['where']['type'] = 'activity';

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
        // IMPORTANT: Always filter by type = 'activity' for activities
        $args['where']['type'] = 'activity';

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

        $updated = 0;
        foreach ($ids as $id) {
            if ($this->repository->update($id, ['status' => $status])) {
                $updated++;
            }
        }

        return [
            'updated' => $updated,
            'total' => count($ids),
            'message' => sprintf(
                /* translators: %d number of activities */
                _n('%d activity updated.', '%d activities updated.', $updated, 'yatra'),
                $updated
            )
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
               
        // Debug: Log the repository counts
        $publish = $counts['publish'] ?? 0;
        $draft = $counts['draft'] ?? 0;
        $trash = $counts['trash'] ?? 0;
        
        // Calculate total from all statuses, not just the main three
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
     * Get trip count for an activity
     */
    public function getTripCount(int $activityId): int
    {
        $activityRepository = new \Yatra\Repositories\ActivityRepository();
        return $activityRepository->getTripCount($activityId);
    }

    /**
     * Get trip count for activity (direct field method)
     */
    public function getTripCountDirect(int $activityId): int
    {
        $activityRepository = new \Yatra\Repositories\ActivityRepository();
        return $activityRepository->getTripCountDirect($activityId);
    }
}

