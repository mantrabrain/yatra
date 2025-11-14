<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\TripRepository;
use Yatra\Repositories\TripRevisionRepository;
use Yatra\Models\Trip;

/**
 * Trip Service
 * Contains business logic for trips with comprehensive validation
 * 
 * Expert-level service design:
 * - Comprehensive validation
 * - Business rule enforcement
 * - Relationship management
 * - Revision handling
 * - Data transformation
 */
class TripService extends BaseService
{
    /**
     * @var TripRepository
     */
    private TripRepository $repository;

    /**
     * @var TripRevisionRepository
     */
    private TripRevisionRepository $revisionRepository;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->repository = new TripRepository();
        $this->revisionRepository = new TripRevisionRepository();
    }

    /**
     * Get repository
     */
    protected function getRepository(): TripRepository
    {
        return $this->repository;
    }

    /**
     * Validate trip data
     */
    protected function validate(array $data, ?int $id = null): void
    {
        // Required fields
        if (empty($data['title'])) {
            throw new \InvalidArgumentException('Trip title is required');
        }

        if (empty($data['slug'])) {
            throw new \InvalidArgumentException('Trip slug is required');
        }

        // Check if slug is unique (exclude current trip when updating)
        $existing = $this->repository->findBySlug($data['slug']);
        if ($existing) {
            $existingId = (int) $existing->id;
            // Only throw error if creating new trip OR if existing trip is different from current trip
            if ($id === null || $existingId !== (int) $id) {
                throw new \InvalidArgumentException('Trip slug must be unique');
            }
        }

        // Validate pricing
        if (isset($data['pricing_type'])) {
            $this->validatePricing($data);
        }

        // Validate duration
        if (isset($data['trip_type']) && isset($data['duration_days'])) {
            $this->validateDuration($data);
        }

        // Validate booking settings
        if (isset($data['min_travelers']) && isset($data['max_travelers'])) {
            if ($data['min_travelers'] > 0 && $data['max_travelers'] > 0) {
                if ($data['min_travelers'] > $data['max_travelers']) {
                    throw new \InvalidArgumentException('Minimum travelers cannot exceed maximum travelers');
                }
            }
        }

        // Validate dates
        if (isset($data['available_from']) && isset($data['available_to'])) {
            if (!empty($data['available_from']) && !empty($data['available_to'])) {
                if (strtotime($data['available_from']) > strtotime($data['available_to'])) {
                    throw new \InvalidArgumentException('Available from date must be before available to date');
                }
            }
        }

        // Validate age restrictions
        if (isset($data['age_min']) && isset($data['age_max'])) {
            if ($data['age_min'] > 0 && $data['age_max'] > 0) {
                if ($data['age_min'] > $data['age_max']) {
                    throw new \InvalidArgumentException('Minimum age cannot exceed maximum age');
                }
            }
        }
    }

    /**
     * Validate pricing data
     */
    private function validatePricing(array $data): void
    {
        $pricingType = $data['pricing_type'] ?? 'regular';

        if ($pricingType === 'regular') {
            if (!isset($data['original_price']) || (float) $data['original_price'] <= 0) {
                throw new \InvalidArgumentException('Original price is required and must be greater than 0 for regular pricing');
            }

            // Validate discounted price
            if (isset($data['discounted_price']) && !empty($data['discounted_price'])) {
                if ((float) $data['discounted_price'] >= (float) $data['original_price']) {
                    throw new \InvalidArgumentException('Discounted price must be less than original price');
                }
            }
        } elseif ($pricingType === 'traveler_based') {
            if (empty($data['price_types']) || !is_array($data['price_types'])) {
                throw new \InvalidArgumentException('Price types are required for traveler-based pricing');
            }

            // Validate each price type
            foreach ($data['price_types'] as $priceType) {
                if (empty($priceType['category_id'])) {
                    throw new \InvalidArgumentException('Category ID is required for each price type');
                }
                if (empty($priceType['original_price']) || (float) $priceType['original_price'] <= 0) {
                    throw new \InvalidArgumentException('Original price is required and must be greater than 0 for each price type');
                }
            }
        }
    }

    /**
     * Validate duration data
     */
    private function validateDuration(array $data): void
    {
        $tripType = $data['trip_type'] ?? 'multi_day';
        $days = isset($data['duration_days']) ? (int) $data['duration_days'] : null;
        $nights = isset($data['duration_nights']) ? (int) $data['duration_nights'] : null;

        if ($tripType === 'single_day') {
            if ($days !== null && $days !== 1) {
                throw new \InvalidArgumentException('Single day trips must have duration_days = 1');
            }
            if ($nights !== null && $nights !== 0) {
                throw new \InvalidArgumentException('Single day trips must have duration_nights = 0');
            }
        } elseif ($tripType === 'multi_day') {
            if ($days !== null && $days < 2) {
                throw new \InvalidArgumentException('Multi-day trips must have duration_days >= 2');
            }
            if ($days !== null && $nights !== null) {
                if ($nights >= $days) {
                    throw new \InvalidArgumentException('Nights should be less than days (typically days - 1)');
                }
            }
        }
    }

    /**
     * Process before create
     */
    protected function processBeforeCreate(array $data): array
    {
        // Generate slug if not provided
        if (empty($data['slug']) && !empty($data['title'])) {
            $data['slug'] = $this->generateSlug($data['title']);
        }

        // Set default status
        if (empty($data['status'])) {
            $data['status'] = 'draft';
        }

        // Set default currency
        if (empty($data['currency'])) {
            $data['currency'] = 'USD';
        }

        // Set created_by
        if (empty($data['created_by'])) {
            $data['created_by'] = get_current_user_id();
        }

        // Set version
        $data['version'] = 1;

        // Process JSON fields
        $data = $this->processJsonFields($data);

        return $data;
    }

    /**
     * Process before update - save revision when publishing
     */
    protected function processBeforeUpdate(int $id, array $data): array
    {
        // Get current trip data before update
        $currentTrip = $this->repository->find($id);
        
        if ($currentTrip) {
            $currentStatus = $currentTrip->status ?? 'draft';
            $newStatus = $data['status'] ?? $currentStatus;
            
            // Create revision every time trip is published (status is 'published')
            // This captures the state before each publish, allowing users to revert to any published version
            if ($newStatus === 'published') {
                // Get latest version number
                $latestVersion = $this->revisionRepository->getLatestVersion($id);
                $newVersion = $latestVersion + 1;
                
                // Get current user ID
                $currentUserId = get_current_user_id();
                
                // Serialize current trip data (state before this publish)
                $tripDataArray = (array) $currentTrip;
                $serializedData = maybe_serialize($tripDataArray);
                
                // Save revision (with 'inherit' status like WordPress)
                try {
                    $this->revisionRepository->createRevision($id, $newVersion, $serializedData, $currentUserId, 'inherit');
                    
                    // Clean up old revisions (similar to WordPress's revision limit)
                    $this->revisionRepository->cleanupRevisions($id);
                } catch (\Exception $e) {
                    // Log error but don't fail the update
                    if (defined('WP_DEBUG') && WP_DEBUG) {
                        error_log('Yatra: Failed to save revision: ' . $e->getMessage());
                    }
                }

                // Increment version
                $data['version'] = $newVersion;
            } else {
                // Keep current version if not publishing
                $data['version'] = $currentTrip->version ?? 1;
            }
        }

        // Set updated_by
        $data['updated_by'] = get_current_user_id();

        // Process JSON fields
        $data = $this->processJsonFields($data);

        return $data;
    }

    /**
     * Process JSON fields - serialize arrays
     */
    private function processJsonFields(array $data): array
    {
        // Note: highlights, gallery_images, faqs, price_types, itinerary_days, availability_dates
        // are stored in separate tables, not as JSON columns
        $jsonFields = [
            'testimonials',
            'countries',
            'regions',
            'landmarks',
            'tags',
            'included_items',
            'excluded_items',
            'frontend_tabs',
            'blackout_dates',
            'custom_fields',
            'pricing_rules',
            'booking_rules',
        ];

        foreach ($jsonFields as $field) {
            if (isset($data[$field]) && is_array($data[$field])) {
                $data[$field] = maybe_serialize($data[$field]);
            }
        }

        return $data;
    }

    /**
     * Generate unique slug from title
     */
    private function generateSlug(string $title): string
    {
        $slug = sanitize_title($title);
        $baseSlug = $slug;
        $counter = 1;

        // Ensure uniqueness
        while ($this->repository->findBySlug($slug)) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Create trip with relationships
     */
    public function createWithRelations(array $data, array $relationships = []): int
    {
        // Extract relationship fields from data if not already in relationships array
        // (these should not be in the main table)
        $relationshipFields = [
            'highlights',
            'gallery_images',
            'faqs',
            'itinerary_days',
            'availability_dates',
        ];
        
        foreach ($relationshipFields as $field) {
            if (!isset($relationships[$field]) && isset($data[$field])) {
                $relationships[$field] = $data[$field];
            }
        }
        
        // Remove relationship fields from data before processing
        foreach ($relationshipFields as $field) {
            unset($data[$field]);
        }
        
        $this->validate($data);
        $data = $this->processBeforeCreate($data);
        
        return $this->repository->createWithRelations($data, $relationships);
    }

    /**
     * Update trip with relationships
     */
    public function updateWithRelations(int $id, array $data, array $relationships = []): bool
    {
        // Extract relationship fields from data if not already in relationships array
        // (these should not be in the main table)
        $relationshipFields = [
            'highlights',
            'gallery_images',
            'faqs',
            'itinerary_days',
            'availability_dates',
        ];
        
        foreach ($relationshipFields as $field) {
            if (!isset($relationships[$field]) && isset($data[$field])) {
                $relationships[$field] = $data[$field];
            }
        }
        
        // Remove relationship fields from data before processing
        foreach ($relationshipFields as $field) {
            unset($data[$field]);
        }
        
        $this->validate($data, $id);
        $data = $this->processBeforeUpdate($id, $data);
        
        return $this->repository->updateWithRelations($id, $data, $relationships);
    }

    /**
     * Get trip with relationships
     */
    public function getWithRelations(int $id): ?\stdClass
    {
        return $this->repository->findWithRelations($id);
    }

    /**
     * Soft delete trip
     */
    public function softDelete(int $id): bool
    {
        $userId = get_current_user_id();
        return $this->repository->softDelete($id, $userId);
    }

    /**
     * Restore trip
     */
    public function restore(int $id): bool
    {
        return $this->repository->restore($id);
    }

    /**
     * Publish trip
     */
    public function publish(int $id): bool
    {
        $data = [
            'status' => 'published',
            'published_at' => current_time('mysql'),
        ];

        return $this->repository->update($id, $data);
    }

    /**
     * Get active trips
     */
    public function getActiveTrips(array $args = []): array
    {
        return $this->repository->getActive($args);
    }

    /**
     * Search trips
     */
    public function search(string $keyword, array $args = []): array
    {
        return $this->repository->search($keyword, $args);
    }

    /**
     * Count items
     */
    public function count(array $args = []): int
    {
        return $this->repository->count($args);
    }

    /**
     * Count by status
     */
    public function countByStatus(string $status): int
    {
        return $this->repository->countByStatus($status);
    }

    /**
     * Restore a revision (WordPress-style)
     * 
     * This method works like WordPress's revision restore:
     * 1. Creates a new revision of the current trip state (before restore)
     * 2. Updates the trip with the revision data
     * 3. The update will automatically create another revision (the restored state)
     * 
     * @param int $tripId Trip ID
     * @param int $revisionId Revision ID to restore
     * @return bool Success
     * @throws \Exception If revision not found or restore fails
     */
    public function restoreRevision(int $tripId, int $revisionId): bool
    {
        // Verify trip exists
        $trip = $this->repository->find($tripId);
        if (!$trip) {
            throw new \Exception(__('Trip not found', 'yatra'));
        }

        // Get the revision to restore
        $revision = $this->revisionRepository->findRevision($revisionId);
        if (!$revision) {
            throw new \Exception(__('Revision not found', 'yatra'));
        }

        // Verify revision belongs to this trip
        if ((int) $revision->trip_id !== $tripId) {
            throw new \Exception(__('Revision does not belong to this trip', 'yatra'));
        }

        // Step 1: Create a revision of the current state (before restore)
        // This preserves the current state, just like WordPress does
        $currentUserId = get_current_user_id();
        $currentTripData = (array) $trip;
        $currentSerializedData = maybe_serialize($currentTripData);
        
        // Get latest version and create new revision
        $latestVersion = $this->revisionRepository->getLatestVersion($tripId);
        $preRestoreVersion = $latestVersion + 1;
        
        try {
            // Create revision of current state with 'inherit' status
            $this->revisionRepository->createRevision(
                $tripId, 
                $preRestoreVersion, 
                $currentSerializedData, 
                $currentUserId, 
                'inherit'
            );
        } catch (\Exception $e) {
            // Log but continue - revision creation failure shouldn't block restore
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Yatra: Failed to create pre-restore revision: ' . $e->getMessage());
            }
        }

        // Step 2: Unserialize the revision data
        $revisionData = maybe_unserialize($revision->data);
        if (!is_array($revisionData)) {
            throw new \Exception(__('Invalid revision data', 'yatra'));
        }

        // Step 3: Prepare data for update (exclude fields that shouldn't be restored)
        $restoreData = $revisionData;
        
        // Don't restore these fields (keep current values)
        unset($restoreData['id']);
        unset($restoreData['created_at']);
        unset($restoreData['created_by']);
        unset($restoreData['updated_at']);
        unset($restoreData['version']); // Will be incremented by processBeforeUpdate
        
        // Set updated_by to current user
        $restoreData['updated_by'] = $currentUserId;

        // Step 4: Update the trip (this will automatically create a new revision)
        // The update will create a revision with 'inherit' status
        $result = $this->updateWithRelations($tripId, $restoreData, []);

        if ($result) {
            // Clean up old revisions after restore
            $this->revisionRepository->cleanupRevisions($tripId);
        }

        return $result;
    }
}
