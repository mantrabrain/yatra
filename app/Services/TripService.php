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

        if (!preg_match('/^[a-z0-9-]+$/', $data['slug'])) {
            throw new \InvalidArgumentException('Trip slug can only contain lowercase letters, numbers, and hyphens');
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
            'trip_category',
            'price_types', // Include price_types in relationship fields
        ];
        
        foreach ($relationshipFields as $field) {
            if (!isset($relationships[$field]) && isset($data[$field])) {
                $relationships[$field] = $data[$field];
            }
        }
        
        // For validation, we need price_types in data temporarily
        $priceTypesForValidation = $relationships['price_types'] ?? $data['price_types'] ?? [];
        $data['price_types'] = $priceTypesForValidation;
        
        $this->validate($data);
        
        // Remove relationship fields from data before processing
        foreach ($relationshipFields as $field) {
            unset($data[$field]);
        }
        
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
            'trip_category',
            'price_types', // Include price_types in relationship fields
        ];
        
        error_log("Yatra TripService: updateWithRelations START - id={$id}");
        error_log("Yatra TripService: price_types in relationships BEFORE: " . json_encode($relationships['price_types'] ?? 'NOT SET'));
        
        foreach ($relationshipFields as $field) {
            if (!isset($relationships[$field]) && isset($data[$field])) {
                $relationships[$field] = $data[$field];
            }
        }
        
        error_log("Yatra TripService: price_types in relationships AFTER: " . json_encode($relationships['price_types'] ?? 'NOT SET'));
        
        // For validation, we need price_types in data temporarily
        $priceTypesForValidation = $relationships['price_types'] ?? $data['price_types'] ?? [];
        $data['price_types'] = $priceTypesForValidation;
        
        $this->validate($data, $id);
        
        // Remove relationship fields from data before processing
        foreach ($relationshipFields as $field) {
            unset($data[$field]);
        }
        
        $data = $this->processBeforeUpdate($id, $data);
        
        $result = $this->repository->updateWithRelations($id, $data, $relationships);
        
        // Always sync pricing_type to availability dates and recurring rules when saving
        if (isset($data['pricing_type'])) {
            $this->syncPricingTypeToAvailability($id, $data['pricing_type']);
        }
        
        return $result;
    }
    
    /**
     * Sync pricing type to all availability dates and recurring rules for a trip
     * This ensures availability/rules always match the trip's pricing type
     * 
     * @param int $tripId Trip ID
     * @param string $pricingType The pricing type to sync ('regular' or 'traveler_based')
     */
    public function syncPricingTypeToAvailability(int $tripId, string $pricingType): void
    {
        global $wpdb;
        
        error_log("Yatra: Syncing pricing_type '{$pricingType}' for trip {$tripId}");
        
        // Update availability dates
        $availability_table = $wpdb->prefix . 'yatra_trip_availability_dates';
        $updated_dates = $wpdb->update(
            $availability_table,
            ['pricing_type' => $pricingType],
            ['trip_id' => $tripId],
            ['%s'],
            ['%d']
        );
        error_log("Yatra: Updated {$updated_dates} availability dates");
        
        // Update recurring rules
        $rules_table = $wpdb->prefix . 'yatra_trip_availability_rules';
        $updated_rules = $wpdb->update(
            $rules_table,
            ['pricing_type' => $pricingType],
            ['trip_id' => $tripId],
            ['%s'],
            ['%d']
        );
        error_log("Yatra: Updated {$updated_rules} recurring rules");
        
        // If changing to regular pricing, clear traveler_pricing and price_types
        if ($pricingType === 'regular') {
            // Clear price_types from availability dates
            $wpdb->query($wpdb->prepare(
                "UPDATE {$availability_table} 
                 SET price_types = NULL 
                 WHERE trip_id = %d",
                $tripId
            ));
            
            // Clear traveler_pricing from recurring rules
            $wpdb->query($wpdb->prepare(
                "UPDATE {$rules_table} 
                 SET traveler_pricing = NULL 
                 WHERE trip_id = %d",
                $tripId
            ));
            
            // Also clear traveler_pricing from time_slots in rules
            $rules = $wpdb->get_results($wpdb->prepare(
                "SELECT id, time_slots FROM {$rules_table} WHERE trip_id = %d",
                $tripId
            ));
            
            foreach ($rules as $rule) {
                if (!empty($rule->time_slots)) {
                    $time_slots = json_decode($rule->time_slots, true);
                    if (is_array($time_slots)) {
                        $updated = false;
                        foreach ($time_slots as &$slot) {
                            if (isset($slot['traveler_pricing'])) {
                                unset($slot['traveler_pricing']);
                                $updated = true;
                            }
                        }
                        if ($updated) {
                            $wpdb->update(
                                $rules_table,
                                ['time_slots' => wp_json_encode($time_slots)],
                                ['id' => $rule->id],
                                ['%s'],
                                ['%d']
                            );
                        }
                    }
                }
            }
        }
        
        error_log("Yatra: Completed pricing sync for trip {$tripId}");
    }

    /**
     * Get trip with relationships
     */
    public function getWithRelations(int $id): ?\stdClass
    {
        return $this->repository->findWithRelations($id);
    }

    /**
     * Duplicate a trip with all relationships
     *
     * Creates a new draft trip based on an existing one, copying
     * core fields and relationships (destinations, activities,
     * categories, pricing, highlights, gallery, FAQs, itinerary,
     * availability dates). Slug will be regenerated to ensure
     * uniqueness and status is always set to draft.
     *
     * @param int $id Existing trip ID
     * @return int New trip ID
     * @throws \Exception If source trip not found
     */
    public function duplicate(int $id): int
    {
        $source = $this->getWithRelations($id);
        if (!$source) {
            throw new \Exception(__('Trip not found', 'yatra'));
        }

        $data = (array) $source;

        // Adjust core fields
        $data['title'] = ($data['title'] ?? '') . ' (Copy)';

        // Generate new unique slug based on existing slug with numeric suffix (-1, -2, ...)
        $baseSlug = !empty($source->slug) ? sanitize_title((string) $source->slug) : $this->generateSlug($data['title'] ?? 'trip-copy');
        $suffix = 1;
        $newSlug = $baseSlug . '-' . $suffix;
        while ($this->repository->findBySlug($newSlug)) {
            $suffix++;
            $newSlug = $baseSlug . '-' . $suffix;
        }
        $data['slug'] = $newSlug;

        // Always create as draft copy
        $data['status'] = 'draft';

        // Ensure created_by is current user; clear technical fields
        $data['created_by'] = get_current_user_id();
        unset(
            $data['id'],
            $data['created_at'],
            $data['updated_at'],
            $data['version'],
            $data['published_at']
        );

        // Extract relationships from the hydrated source object in the shapes
        // expected by TripRepository::createWithRelations (scalar IDs / simple arrays)
        $relationships = [];

        // Destinations: array of destination IDs
        $destinations = [];
        if (!empty($source->destinations) && is_array($source->destinations)) {
            foreach ($source->destinations as $dest) {
                $id = (int) ($dest->destination_id ?? $dest->id ?? 0);
                if ($id > 0 && !in_array($id, $destinations, true)) {
                    $destinations[] = $id;
                }
            }
        }
        $relationships['destinations'] = $destinations;

        // Activities: array of activity IDs
        $activities = [];
        if (!empty($source->activities) && is_array($source->activities)) {
            foreach ($source->activities as $act) {
                $id = (int) ($act->activity_id ?? $act->id ?? 0);
                if ($id > 0 && !in_array($id, $activities, true)) {
                    $activities[] = $id;
                }
            }
        }
        $relationships['activities'] = $activities;

        // Trip categories: array of category IDs
        $categories = [];
        if (!empty($source->trip_category) && is_array($source->trip_category)) {
            foreach ($source->trip_category as $cat) {
                $id = (int) ($cat->category_id ?? $cat->id ?? 0);
                if ($id > 0 && !in_array($id, $categories, true)) {
                    $categories[] = $id;
                }
            }
        }
        $relationships['trip_category'] = $categories;

        // Price types: normalize to simple associative arrays
        $priceTypes = [];
        if (!empty($source->price_types) && is_array($source->price_types)) {
            foreach ($source->price_types as $pt) {
                $categoryId = (int) ($pt->category_id ?? 0);
                if ($categoryId <= 0) {
                    continue;
                }
                $item = [
                    'category_id' => $categoryId,
                    'original_price' => (float) ($pt->original_price ?? 0),
                ];
                if (isset($pt->discounted_price)) {
                    $item['discounted_price'] = (float) $pt->discounted_price;
                }
                $priceTypes[] = $item;
            }
        }
        $relationships['price_types'] = $priceTypes;

        // Highlights: normalize stdClass rows from DB into arrays/strings expected by saveHighlights
        $highlights = [];
        $rawHighlights = $data['highlights'] ?? ($source->highlights ?? []);
        if (!empty($rawHighlights) && is_array($rawHighlights)) {
            foreach ($rawHighlights as $highlight) {
                // Already a simple string
                if (is_string($highlight)) {
                    $highlights[] = $highlight;
                    continue;
                }

                // Already an array in the expected shape
                if (is_array($highlight)) {
                    $highlights[] = $highlight;
                    continue;
                }

                // Convert stdClass from yatra_trip_highlights table into array
                if (is_object($highlight)) {
                    $text = $highlight->text ?? $highlight->highlight_text ?? '';
                    if ($text === '') {
                        continue;
                    }

                    $highlights[] = [
                        'text'        => $text,
                        'icon'        => $highlight->icon ?? $highlight->highlight_icon ?? null,
                        'image_id'    => isset($highlight->image_id)
                            ? (int) $highlight->image_id
                            : (isset($highlight->highlight_image_id) ? (int) $highlight->highlight_image_id : 0),
                        'is_featured' => isset($highlight->is_featured) ? (int) $highlight->is_featured : 0,
                    ];
                }
            }
        }
        $relationships['highlights'] = $highlights;

        // Gallery images: normalize stdClass rows from DB into arrays/strings expected by saveGalleryImages
        $galleryImages = [];
        $rawGalleryImages = $data['gallery_images'] ?? ($source->gallery_images ?? []);
        if (!empty($rawGalleryImages) && is_array($rawGalleryImages)) {
            foreach ($rawGalleryImages as $image) {
                // Already a simple URL string
                if (is_string($image)) {
                    $galleryImages[] = $image;
                    continue;
                }

                // Already an array in the expected shape
                if (is_array($image)) {
                    $galleryImages[] = $image;
                    continue;
                }

                // Convert stdClass from yatra_trip_gallery_images into array
                if (is_object($image)) {
                    $url = $image->url ?? $image->image_url ?? '';
                    if ($url === '') {
                        continue;
                    }

                    $galleryImages[] = [
                        'url'           => $url,
                        'id'            => isset($image->image_id) ? (int) $image->image_id : 0,
                        'thumbnail_url' => $image->thumbnail_url ?? null,
                        'alt_text'      => $image->alt_text ?? null,
                        'caption'       => $image->caption ?? null,
                        'is_featured'   => isset($image->is_featured) ? (int) $image->is_featured : 0,
                    ];
                }
            }
        }
        $relationships['gallery_images'] = $galleryImages;

        // Other relationships can be copied as-is; repository helpers can handle them
        $relationships['faqs']               = $data['faqs'] ?? ($source->faqs ?? []);
        $relationships['itinerary_days']     = $data['itinerary_days'] ?? ($source->itinerary_days ?? []);
        $relationships['availability_dates'] = $data['availability_dates'] ?? ($source->availability_dates ?? []);

        // Remove relationship keys from main data to avoid column issues
        unset(
            $data['destinations'],
            $data['activities'],
            $data['trip_category'],
            $data['price_types'],
            $data['highlights'],
            $data['gallery_images'],
            $data['faqs'],
            $data['itinerary_days'],
            $data['availability_dates']
        );

        return $this->createWithRelations($data, $relationships);
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
     * Get status counts for admin list views
     *
     * Returns a stable set of counts that do not change with filters
     * so that the UI can show consistent "All / Published / Draft / ..." tabs.
     */
    public function getStatusCounts(): array
    {
        $statuses = [
            'published',
            'draft',
            'review',
            'approved',
            'archived',
            'trash',
        ];

        $counts = [];
        foreach ($statuses as $status) {
            $counts[$status] = $this->countByStatus($status);
        }

        $all = array_sum(array_values($counts));

        return [
            'all' => (int) $all,
            'published' => (int) ($counts['published'] ?? 0),
            'draft' => (int) ($counts['draft'] ?? 0),
            'review' => (int) ($counts['review'] ?? 0),
            'approved' => (int) ($counts['approved'] ?? 0),
            'archived' => (int) ($counts['archived'] ?? 0),
            'trash' => (int) ($counts['trash'] ?? 0),
        ];
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
