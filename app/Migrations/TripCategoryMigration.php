<?php

declare(strict_types=1);

namespace Yatra\Migration;

use Yatra\Constants\ClassificationTypes;

/**
 * Migrates trip type / tour category taxonomy terms into ClassificationsTable (type=category).
 *
 * Old sites may register either `trip_category` (Yatra 3.x) or `tour_category` (some 2.x builds).
 */
class TripCategoryMigration extends BaseMigration
{
    public function run(): array
    {
        // Include both slugs: legacy DB rows may exist even if `tour_category` is no longer registered.
        return $this->migrateTaxonomy(
            ['trip_category', 'tour_category'],
            ClassificationTypes::CATEGORY,
            'trip_categories'
        );
    }
}
