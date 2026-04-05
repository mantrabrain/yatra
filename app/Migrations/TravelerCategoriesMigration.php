<?php

namespace Yatra\Migration;

use Yatra\Constants\ClassificationTypes;
use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Database\Tables\TripsTable;
use Yatra\Utils\Logger;

/**
 * Migration for traveler categories (multiple pricing options)
 * 
 * Migrates multiple pricing options from old Yatra to traveler categories system
 * (ClassificationsTable with type='traveler_type') and assigns pricing to trips
 * via the price_types JSON column on TripsTable.
 */
class TravelerCategoriesMigration extends BaseMigration
{
    /**
     * Run the traveler categories migration
     */
    public function run(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        // First, create traveler categories from multiple pricing options
        $categoryResult = $this->createTravelerCategories();
        $migrated += $categoryResult['migrated'];
        $skipped += $categoryResult['skipped'];
        $failed += $categoryResult['failed'];

        // Then, assign categories to trips
        $assignmentResult = $this->assignCategoriesToTrips();
        $migrated += $assignmentResult['migrated'];
        $skipped += $assignmentResult['skipped'];
        $failed += $assignmentResult['failed'];

        return [
            'success' => true,
            'data_type' => 'traveler_categories',
            'migrated' => $migrated,
            'skipped' => $skipped,
            'failed' => $failed,
            'details' => [
                'categories_created' => $categoryResult['migrated'],
                'assignments_created' => $assignmentResult['migrated']
            ]
        ];
    }

    /**
     * Create traveler categories from multiple pricing options
     */
    private function createTravelerCategories(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        // Get all unique pricing options from old tours
        $uniquePricingOptions = $this->getUniquePricingOptions();
        $total = count($uniquePricingOptions);

        Logger::info("Traveler Categories Migration: Starting category creation", [
            'total_options_found' => $total,
            'force_migration' => $this->service->isForceMigration()
        ]);

        // During force migration, we preserve ALL existing data and only add new categories
        // If a category with the same label exists, we create a new one with a unique slug
        // This ensures NO data is lost during re-migration

        foreach ($uniquePricingOptions as $pricingOption) {
            try {
                Logger::info("Processing pricing option for category creation", [
                    'label' => $pricingOption['label'],
                    'description' => $pricingOption['description'] ?? ''
                ]);

                // Check if category already exists
                $exists = $this->categoryExists($pricingOption['label']);
                Logger::info("Category existence check", [
                    'label' => $pricingOption['label'],
                    'exists' => $exists,
                    'force_migration' => $this->service->isForceMigration()
                ]);

                // During normal migration: skip existing categories
                if ($exists && !$this->service->isForceMigration()) {
                    $skipped++;
                    Logger::info("Category already exists, skipping (normal migration)", [
                        'label' => $pricingOption['label']
                    ]);
                    continue;
                }

                // During force migration: ALWAYS create new category to preserve existing data
                // The generateUniqueSlug() method will handle slug conflicts automatically
                if ($exists && $this->service->isForceMigration()) {
                    Logger::info("Category already exists but force migration enabled - creating new category with unique slug", [
                        'label' => $pricingOption['label'],
                        'note' => 'Existing category will be preserved, new category will have unique slug'
                    ]);
                }

                // Create traveler category (will handle slug conflicts automatically)
                $categoryId = $this->createCategory([
                    'label' => $pricingOption['label'],
                    'slug' => sanitize_title($pricingOption['label']),
                    'description' => $pricingOption['description'] ?? '',
                    'is_active' => 1
                ]);

                if ($categoryId) {
                    $migrated++;
                    Logger::info("Traveler category created successfully", [
                        'category_id' => $categoryId,
                        'label' => $pricingOption['label'],
                        'migration_type' => $this->service->isForceMigration() ? 'force' : 'normal'
                    ]);
                } else {
                    $failed++;
                    Logger::error("Failed to create traveler category - no ID returned", [
                        'label' => $pricingOption['label']
                    ]);
                }
            } catch (\Exception $e) {
                $failed++;
                Logger::error("Failed to create traveler category - exception", [
                    'label' => $pricingOption['label'],
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }

        Logger::info("Traveler Categories Migration: Category creation completed", [
            'migrated' => $migrated,
            'skipped' => $skipped,
            'failed' => $failed,
            'total' => $total,
            'force_migration' => $this->service->isForceMigration(),
            'note' => 'NO existing data was deleted during this migration'
        ]);

        return compact('migrated', 'skipped', 'failed', 'total');
    }

    /**
     * Assign categories to trips based on multiple pricing
     */
    private function assignCategoriesToTrips(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        // Get all tours with multiple pricing
        $toursWithMultiplePricing = $this->getToursWithMultiplePricing();
        $total = count($toursWithMultiplePricing);

        Logger::info("Traveler Categories Migration: Starting trip assignments", [
            'total_tours_to_process' => $total
        ]);

        foreach ($toursWithMultiplePricing as $tour) {
            try {
                $oldTourId = $tour->ID;
                
                Logger::info("Processing tour for assignment", [
                    'old_tour_id' => $oldTourId,
                    'tour_title' => $tour->post_title
                ]);
                
                // Check if trip was migrated
                $newTripId = $this->getMigratedTripId($oldTourId);
                Logger::info("Trip migration check", [
                    'old_tour_id' => $oldTourId,
                    'new_trip_id' => $newTripId,
                    'is_migrated' => !empty($newTripId)
                ]);

                if (!$newTripId) {
                    $skipped++;
                    Logger::info("Trip not migrated, skipping", [
                        'old_tour_id' => $oldTourId
                    ]);
                    continue;
                }

                // Get multiple pricing for this tour
                $multiplePricing = $this->getRawPostMeta($oldTourId, 'yatra_multiple_pricing');
                $multiplePricing = maybe_unserialize($multiplePricing);
                Logger::info("Multiple pricing data", [
                    'old_tour_id' => $oldTourId,
                    'pricing_data' => $multiplePricing,
                    'is_array' => is_array($multiplePricing)
                ]);

                if (!is_array($multiplePricing)) {
                    $skipped++;
                    Logger::info("No valid multiple pricing data, skipping", [
                        'old_tour_id' => $oldTourId
                    ]);
                    continue;
                }

                // Assign each pricing option as a category
                $assignmentsCreated = 0;
                foreach ($multiplePricing as $pricingId => $pricing) {
                    Logger::info("Processing pricing assignment", [
                        'old_tour_id' => $oldTourId,
                        'new_trip_id' => $newTripId,
                        'pricing_id' => $pricingId,
                        'pricing_data' => $pricing
                    ]);

                    if (empty($pricing['pricing_label'])) {
                        Logger::info("Empty pricing label, skipping", [
                            'pricing_id' => $pricingId
                        ]);
                        continue;
                    }

                    $categoryId = $this->getCategoryIdByLabel($pricing['pricing_label']);
                    Logger::info("Category ID lookup", [
                        'label' => $pricing['pricing_label'],
                        'category_id' => $categoryId
                    ]);

                    if (!$categoryId) {
                        Logger::warning("Category not found for label", [
                            'label' => $pricing['pricing_label']
                        ]);
                        continue;
                    }

                    // Create price type assignment
                    $priceTypeId = $this->createPriceType([
                        'trip_id' => $newTripId,
                        'category_id' => $categoryId,
                        'label' => $pricing['pricing_label'],
                        'description' => $pricing['pricing_description'] ?? '',
                        'regular_price' => (float) ($pricing['regular_price'] ?? 0),
                        'sales_price' => (float) ($pricing['sales_price'] ?? 0),
                        'minimum_pax' => (int) ($pricing['minimum_pax'] ?? 1),
                        'maximum_pax' => (int) ($pricing['maximum_pax'] ?? 0),
                        'group_size' => (int) ($pricing['group_size'] ?? 1),
                        'pricing_per' => $pricing['pricing_per'] ?? 'person',
                        'is_active' => 1
                    ]);

                    Logger::info("Price type creation result", [
                        'trip_id' => $newTripId,
                        'category_id' => $categoryId,
                        'price_type_id' => $priceTypeId,
                        'success' => !empty($priceTypeId)
                    ]);

                    if ($priceTypeId) {
                        $assignmentsCreated++;
                    }
                }

                if ($assignmentsCreated > 0) {
                    $migrated += $assignmentsCreated;
                    Logger::info("Price types assigned to trip successfully", [
                        'trip_id' => $newTripId,
                        'old_tour_id' => $oldTourId,
                        'assignments' => $assignmentsCreated
                    ]);
                } else {
                    $skipped++;
                    Logger::info("No price types created for tour", [
                        'old_tour_id' => $oldTourId,
                        'new_trip_id' => $newTripId
                    ]);
                }
            } catch (\Exception $e) {
                $failed++;
                Logger::error("Failed to assign categories to trip", [
                    'tour_id' => $tour->ID,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }

        Logger::info("Traveler Categories Migration: Trip assignments completed", [
            'migrated' => $migrated,
            'skipped' => $skipped,
            'failed' => $failed,
            'total' => $total
        ]);

        return compact('migrated', 'skipped', 'failed', 'total');
    }

    /**
     * Get unique pricing options from all tours
     */
    private function getUniquePricingOptions(): array
    {
        $sql = "
            SELECT DISTINCT
                pm.meta_value as pricing_data,
                pm.post_id
            FROM {$this->wpdb->postmeta} pm
            INNER JOIN {$this->wpdb->posts} p ON pm.post_id = p.ID
            WHERE pm.meta_key = 'yatra_multiple_pricing'
            AND p.post_type = 'tour'
            AND pm.meta_value != ''
            AND pm.meta_value != 'a:0:{}'
        ";

        $results = $this->wpdb->get_results($sql);
        $uniqueOptions = [];

        Logger::info("Traveler Categories Migration: Found tours with multiple pricing", [
            'total_tours_found' => count($results)
        ]);

        foreach ($results as $result) {
            $pricingData = maybe_unserialize($result->pricing_data);
            Logger::info("Processing tour for pricing options", [
                'post_id' => $result->post_id,
                'pricing_data_serialized' => $result->pricing_data,
                'pricing_data_unserialized' => $pricingData,
                'is_array' => is_array($pricingData)
            ]);

            if (is_array($pricingData)) {
                foreach ($pricingData as $pricingId => $pricing) {
                    Logger::info("Processing pricing option", [
                        'post_id' => $result->post_id,
                        'pricing_id' => $pricingId,
                        'pricing_data' => $pricing,
                        'has_label' => !empty($pricing['pricing_label'])
                    ]);

                    if (!empty($pricing['pricing_label'])) {
                        $label = $pricing['pricing_label'];
                        if (!isset($uniqueOptions[$label])) {
                            $uniqueOptions[$label] = [
                                'label' => $label,
                                'description' => $pricing['pricing_description'] ?? ''
                            ];
                            Logger::info("Added unique pricing option", [
                                'label' => $label,
                                'description' => $pricing['pricing_description'] ?? ''
                            ]);
                        }
                    }
                }
            }
        }

        Logger::info("Traveler Categories Migration: Final unique pricing options", [
            'total_unique_options' => count($uniqueOptions),
            'options' => array_values($uniqueOptions)
        ]);

        return array_values($uniqueOptions);
    }

    /**
     * Get tours that have multiple pricing
     */
    private function getToursWithMultiplePricing(): array
    {
        $sql = "
            SELECT p.ID, p.post_title, pm.meta_value as pricing_data
            FROM {$this->wpdb->posts} p
            INNER JOIN {$this->wpdb->postmeta} pm ON p.ID = pm.post_id
            WHERE p.post_type = 'tour'
            AND pm.meta_key = 'yatra_multiple_pricing'
            AND pm.meta_value != ''
            AND pm.meta_value != 'a:0:{}'
            AND p.post_status != 'trash'
        ";

        $tours = $this->wpdb->get_results($sql);

        Logger::info("Traveler Categories Migration: Found tours for assignment", [
            'total_tours' => count($tours)
        ]);

        foreach ($tours as $tour) {
            $pricingData = maybe_unserialize($tour->pricing_data);
            Logger::info("Tour assignment data", [
                'tour_id' => $tour->ID,
                'tour_title' => $tour->post_title,
                'pricing_data' => $pricingData,
                'is_array' => is_array($pricingData),
                'pricing_count' => is_array($pricingData) ? count($pricingData) : 0
            ]);
        }

        return $tours;
    }

    /**
     * Check if traveler category exists by label in ClassificationsTable
     */
    private function categoryExists(string $label): bool
    {
        $table = ClassificationsTable::getTableName();
        $type = ClassificationTypes::TRAVELER_TYPE;

        return (int) $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE type = %s AND name = %s",
            $type,
            $label
        )) > 0;
    }

    /**
     * Get traveler category ID by label from ClassificationsTable
     */
    private function getCategoryIdByLabel(string $label): ?int
    {
        $table = ClassificationsTable::getTableName();
        $type = ClassificationTypes::TRAVELER_TYPE;

        $id = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT id FROM {$table} WHERE type = %s AND name = %s LIMIT 1",
            $type,
            $label
        ));

        return $id ? (int) $id : null;
    }

    /**
     * Create traveler category in ClassificationsTable with type='traveler_type'
     */
    private function createCategory(array $data): ?int
    {
        $table = ClassificationsTable::getTableName();
        $type = ClassificationTypes::TRAVELER_TYPE;

        // Generate unique slug scoped to traveler_type
        $baseSlug = sanitize_title($data['label']);
        $slug = $baseSlug;
        $counter = 1;
        while ($this->slugExists($slug)) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        $currentUserId = get_current_user_id() ?: 1;

        $result = $this->wpdb->insert(
            $table,
            [
                'type' => $type,
                'name' => $data['label'],
                'slug' => $slug,
                'description' => $data['description'] ?? '',
                'status' => !empty($data['is_active']) ? 'publish' : 'draft',
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
                'created_by' => $currentUserId,
                'updated_by' => $currentUserId,
            ],
            ['%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d']
        );

        return $result ? (int) $this->wpdb->insert_id : null;
    }

    /**
     * Check if slug exists for traveler_type in ClassificationsTable
     */
    private function slugExists(string $slug): bool
    {
        $table = ClassificationsTable::getTableName();
        $type = ClassificationTypes::TRAVELER_TYPE;

        return (int) $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE type = %s AND slug = %s",
            $type,
            $slug
        )) > 0;
    }

    /**
     * Create/update price type assignment for a trip.
     *
     * Appends a pricing entry to the trip's price_types JSON column in TripsTable.
     * Each entry links a traveler category (from ClassificationsTable) with pricing.
     */
    private function createPriceType(array $data): ?int
    {
        $tripsTable = TripsTable::getTableName();
        $tripId = (int) $data['trip_id'];

        // Read existing price_types JSON
        $existingJson = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT price_types FROM {$tripsTable} WHERE id = %d",
            $tripId
        ));

        $priceTypes = [];
        if (!empty($existingJson)) {
            $decoded = json_decode($existingJson, true);
            if (is_array($decoded)) {
                $priceTypes = $decoded;
            }
        }

        // Check for duplicate (same category_id)
        foreach ($priceTypes as $existing) {
            if (($existing['category_id'] ?? null) == $data['category_id']) {
                return (int) $data['category_id']; // Already exists
            }
        }

        // Canonical keys must match TripMigration::migrateTripPricing() and TripController
        // (original_price / discounted_price / pricing_mode / min_travelers / max_travelers).
        $regular = (float) ($data['regular_price'] ?? 0);
        $sales = (float) ($data['sales_price'] ?? 0);
        $discounted = ($sales > 0 && $sales < $regular) ? $sales : null;
        $pricingPer = $data['pricing_per'] ?? 'person';
        $pricingMode = ($pricingPer === 'group') ? 'per_group' : 'per_person';
        $minPax = max(1, (int) ($data['minimum_pax'] ?? 1));
        $maxPax = (int) ($data['maximum_pax'] ?? 0);
        if ($maxPax < $minPax) {
            $maxPax = $minPax;
        }

        $entry = [
            'category_id' => (int) $data['category_id'],
            'label' => $data['label'] ?? '',
            'original_price' => $regular,
            'discounted_price' => $discounted,
            'pricing_mode' => $pricingMode,
            'min_travelers' => $minPax,
            'max_travelers' => $maxPax,
        ];
        if (!empty($data['description'])) {
            $entry['description'] = $data['description'];
        }
        if ($pricingMode === 'per_group') {
            $entry['group_size'] = max(1, (int) ($data['group_size'] ?? 1));
        }

        $priceTypes[] = $entry;

        $updated = $this->wpdb->update(
            $tripsTable,
            ['price_types' => json_encode($priceTypes)],
            ['id' => $tripId],
            ['%s'],
            ['%d']
        );

        if ($updated !== false) {
            // Also update pricing_type to 'traveler_based' on the trip
            $this->wpdb->update(
                $tripsTable,
                ['pricing_type' => 'traveler_based'],
                ['id' => $tripId],
                ['%s'],
                ['%d']
            );
            return (int) $data['category_id'];
        }

        Logger::error("Failed to update price_types for trip", [
            'trip_id' => $tripId,
            'error' => $this->wpdb->last_error
        ]);
        return null;
    }
}
