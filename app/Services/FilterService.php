<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Services\DifficultyLevelService;
use Yatra\Services\TripCategoryService;
use Yatra\Services\DestinationService;
use Yatra\Services\ActivityService;

/**
 * Filter Service
 * Contains business logic for rendering individual filter components
 */
class FilterService extends BaseService
{
    /**
     * Render price range filter component
     * 
     * @param array $active_filters Current active filters
     * @param array $options Filter options (min_price, max_price, step)
     * @return string HTML output
     */
    public function renderPriceRangeFilter(array $active_filters = [], array $options = []): string
    {
        global $wpdb;
        
        // Get price range from database
        $price_stats = $wpdb->get_row(
            "SELECT 
                MIN(CAST(original_price AS DECIMAL(10,2))) as min_price,
                MAX(CAST(original_price AS DECIMAL(10,2))) as max_price
             FROM {$wpdb->prefix}yatra_trips 
             WHERE status = 'published' AND original_price > 0"
        );

        $min_price = $options['min_price'] ?? ($price_stats->min_price ?? 100);
        $max_price = $options['max_price'] ?? ($price_stats->max_price ?? 5000);
        $step = $options['step'] ?? max(1, ($max_price - $min_price) / 100);

        ob_start();
        ?>
        <div class="yatra-filter-section">
            <div class="yatra-filter-title" data-toggle="price">
                <div class="yatra-filter-title-content">
                    <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                    </svg>
                    <span>Price Range</span>
                </div>
                <div class="yatra-filter-actions">
                    <span class="yatra-clear-section" data-section="price">Clear</span>
                    <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </div>
            </div>
            <div class="yatra-filter-content">
                <div class="yatra-price-range">
                    <div class="yatra-price-inputs">
                        <div class="yatra-price-input-group">
                            <label class="yatra-price-input-label">Min Price</label>
                            <input type="number" name="price_min" placeholder="<?php echo $min_price; ?>" min="<?php echo $min_price; ?>" max="<?php echo $max_price; ?>" value="<?php echo !empty($active_filters['price_min']) ? esc_attr($active_filters['price_min']) : ''; ?>" id="priceMin">
                        </div>
                        <div class="yatra-price-separator">—</div>
                        <div class="yatra-price-input-group">
                            <label class="yatra-price-input-label">Max Price</label>
                            <input type="number" name="price_max" placeholder="<?php echo $max_price; ?>" min="<?php echo $min_price; ?>" max="<?php echo $max_price; ?>" value="<?php echo !empty($active_filters['price_max']) ? esc_attr($active_filters['price_max']) : ''; ?>" id="priceMax">
                        </div>
                    </div>
                    <div class="yatra-price-slider">
                        <input type="range" min="<?php echo $min_price; ?>" max="<?php echo $max_price; ?>" step="<?php echo $step; ?>" value="<?php echo !empty($active_filters['price_min']) ? esc_attr($active_filters['price_min']) : $min_price; ?>" class="yatra-range-min" id="priceRangeMin">
                        <input type="range" min="<?php echo $min_price; ?>" max="<?php echo $max_price; ?>" step="<?php echo $step; ?>" value="<?php echo !empty($active_filters['price_max']) ? esc_attr($active_filters['price_max']) : $max_price; ?>" class="yatra-range-max" id="priceRangeMax">
                    </div>
                    <div class="yatra-price-display"><?php echo yatra_format_price($min_price); ?> - <?php echo yatra_format_price($max_price); ?></div>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Render difficulty level filter component
     * 
     * @param array $active_filters Current active filters
     * @param array $options Filter options
     * @return string HTML output
     */
    public function renderDifficultyFilter(array $active_filters = [], array $options = []): string
    {
        $difficulty_service = new DifficultyLevelService();
        $difficulty_levels = $difficulty_service->getPublished(['order_by' => 'level_order', 'order' => 'ASC']);
        
        if (empty($difficulty_levels)) {
            return '';
        }

        ob_start();
        ?>
        <div class="yatra-filter-section">
            <div class="yatra-filter-title" data-toggle="difficulty">
                <div class="yatra-filter-title-content">
                    <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    <span>Difficulty Level</span>
                </div>
                <div class="yatra-filter-actions">
                    <span class="yatra-clear-section" data-section="difficulty">Clear</span>
                    <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </div>
            </div>
            <div class="yatra-filter-content">
                <div class="yatra-checkbox-group">
                    <?php foreach ($difficulty_levels as $level) : 
                        // Get trip count for this difficulty level
                        global $wpdb;
                        $trip_count = $wpdb->get_var($wpdb->prepare(
                            "SELECT COUNT(*) FROM {$wpdb->prefix}yatra_trips t 
                             LEFT JOIN {$wpdb->prefix}yatra_difficulty_levels dl ON (t.difficulty_level = dl.id OR t.difficulty_level = dl.slug OR t.difficulty_level = dl.name)
                             WHERE dl.id = %d AND t.status IN ('publish','published')",
                            $level->id
                        ));
                    ?>
                    <label class="yatra-checkbox-label">
                        <input type="checkbox" name="difficulty[]" value="<?php echo esc_attr($level->id); ?>" <?php echo in_array($level->id, $active_filters['difficulty'] ?? []) ? 'checked' : ''; ?>>
                        <span><?php echo esc_html($level->name); ?></span>
                        <span class="yatra-filter-count">(<?php echo (int)$trip_count; ?>)</span>
                    </label>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Render rating filter component
     * 
     * @param array $active_filters Current active filters
     * @param array $options Filter options
     * @return string HTML output
     */
    public function renderRatingFilter(array $active_filters = [], array $options = []): string
    {
        ob_start();
        ?>
        <div class="yatra-filter-section">
            <div class="yatra-filter-title" data-toggle="rating">
                <div class="yatra-filter-title-content">
                    <svg class="yatra-filter-icon" width="18" height="18" fill="#fbbf24" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span>Rating</span>
                </div>
                <div class="yatra-filter-actions">
                    <span class="yatra-clear-section" data-section="rating">Clear</span>
                    <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </div>
            </div>
            <div class="yatra-filter-content">
                <div class="yatra-rating-filter">
                    <?php
                    global $wpdb;
                    $rating_options = [
                        ['stars' => 5, 'label' => 'And Up'],
                        ['stars' => 4, 'label' => 'And Up'],
                        ['stars' => 3, 'label' => 'And Up'],
                        ['stars' => 2, 'label' => 'And Up'],
                        ['stars' => 1, 'label' => 'And Up']
                    ];

                    // Check if reviews table exists
                    $reviews_table_exists = $wpdb->get_var(
                        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
                         WHERE TABLE_SCHEMA = DATABASE()
                           AND TABLE_NAME = '{$wpdb->prefix}yatra_reviews'"
                    );

                    foreach ($rating_options as $option) :
                        // Get trip count for this rating and above
                        $trip_count = 0;
                        if ($reviews_table_exists) {
                            $trip_count = $wpdb->get_var($wpdb->prepare(
                                "SELECT COUNT(DISTINCT trip_id)
                                 FROM (
                                     SELECT r.trip_id, AVG(r.rating) as avg_rating
                                     FROM {$wpdb->prefix}yatra_reviews r
                                     INNER JOIN {$wpdb->prefix}yatra_trips t ON r.trip_id = t.id
                                     WHERE t.status = 'published' AND r.status = 'approved' AND r.rating > 0
                                     GROUP BY r.trip_id
                                     HAVING avg_rating >= %d
                                 ) as trip_ratings",
                                $option['stars']
                            ));
                        }
                    ?>
                    <label class="yatra-rating-option">
                        <input type="checkbox" name="rating[]" value="<?php echo esc_attr($option['stars']); ?>" <?php echo in_array($option['stars'], $active_filters['rating'] ?? []) ? 'checked' : ''; ?>>
                        <div class="yatra-stars-display">
                            <?php for ($i = 1; $i <= 5; $i++) : ?>
                                <svg class="yatra-star <?php echo $i <= $option['stars'] ? 'filled' : 'empty'; ?>" width="16" height="16" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="<?php echo $i <= $option['stars'] ? '#fbbf24' : '#e5e7eb'; ?>"/>
                                </svg>
                            <?php endfor; ?>
                            <span class="yatra-rating-label"><?php echo esc_html($option['label']); ?></span>
                        </div>
                    </label>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Render categories filter component
     * 
     * @param array $active_filters Current active filters
     * @param array $options Filter options
     * @return string HTML output
     */
    public function renderCategoriesFilter(array $active_filters = [], array $options = []): string
    {
        $category_service = new TripCategoryService();
        $categories = $category_service->getPublished(['order_by' => 'name', 'order' => 'ASC']);
        
        if (empty($categories)) {
            return '';
        }

        ob_start();
        ?>
        <div class="yatra-filter-section">
            <div class="yatra-filter-title" data-toggle="categories">
                <div class="yatra-filter-title-content">
                    <svg class="yatra-filter-icon" width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clip-rule="evenodd" />
                    </svg>
                    <span>Categories</span>
                </div>
                <div class="yatra-filter-actions">
                    <span class="yatra-clear-section" data-section="categories">Clear</span>
                    <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </div>
            </div>
            <div class="yatra-filter-content">
                <div class="yatra-checkbox-group">
                    <?php foreach ($categories as $category) : 
                        // Get trip count for this category
                        global $wpdb;
                        $trip_count = $wpdb->get_var($wpdb->prepare(
                            "SELECT COUNT(DISTINCT t.id) FROM {$wpdb->prefix}yatra_trips t 
                             INNER JOIN {$wpdb->prefix}yatra_trip_trip_categories ttc ON t.id = ttc.trip_id 
                             WHERE ttc.category_id = %d AND t.status = 'published'",
                            $category->id
                        ));

                        if ($trip_count > 0) :
                    ?>
                    <label class="yatra-checkbox-label">
                        <input type="checkbox" name="categories[]" value="<?php echo esc_attr($category->id); ?>" <?php echo in_array($category->id, $active_filters['categories'] ?? []) ? 'checked' : ''; ?>>
                        <span><?php echo esc_html($category->name); ?></span>
                        <span class="yatra-filter-count">(<?php echo (int)$trip_count; ?>)</span>
                    </label>
                    <?php endif; endforeach; ?>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Render destinations filter component
     * 
     * @param array $active_filters Current active filters
     * @param array $options Filter options
     * @return string HTML output
     */
    public function renderDestinationsFilter(array $active_filters = [], array $options = []): string
    {
        $destination_service = new DestinationService();
        $destinations = $destination_service->getPublished(['order_by' => 'name', 'order' => 'ASC', 'limit' => 15]);
        
        if (empty($destinations)) {
            return '';
        }

        ob_start();
        ?>
        <div class="yatra-filter-section">
            <div class="yatra-filter-title" data-toggle="destinations">
                <div class="yatra-filter-title-content">
                    <svg class="yatra-filter-icon" width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                    </svg>
                    <span>Destinations</span>
                </div>
                <div class="yatra-filter-actions">
                    <span class="yatra-clear-section" data-section="destinations">Clear</span>
                    <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </div>
            </div>
            <div class="yatra-filter-content">
                <div class="yatra-checkbox-group">
                    <?php foreach ($destinations as $destination) : 
                        // Get trip count for this destination
                        global $wpdb;
                        $trip_count = $wpdb->get_var($wpdb->prepare(
                            "SELECT COUNT(DISTINCT t.id) FROM {$wpdb->prefix}yatra_trips t 
                             INNER JOIN {$wpdb->prefix}yatra_trip_destinations td ON t.id = td.trip_id 
                             WHERE td.destination_id = %d AND t.status = 'published'",
                            $destination->id
                        ));

                        if ($trip_count > 0) :
                    ?>
                    <label class="yatra-checkbox-label">
                        <input type="checkbox" name="destinations[]" value="<?php echo esc_attr($destination->id); ?>" <?php echo in_array($destination->id, $active_filters['destinations'] ?? []) ? 'checked' : ''; ?>>
                        <span><?php echo esc_html($destination->name); ?></span>
                        <span class="yatra-filter-count">(<?php echo (int)$trip_count; ?>)</span>
                    </label>
                    <?php endif; endforeach; ?>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Render activities filter component
     * 
     * @param array $active_filters Current active filters
     * @param array $options Filter options
     * @return string HTML output
     */
    public function renderActivitiesFilter(array $active_filters = [], array $options = []): string
    {
        $activity_service = new ActivityService();
        $activities = $activity_service->getPublished(['order_by' => 'name', 'order' => 'ASC', 'limit' => 15]);
        
        if (empty($activities)) {
            return '';
        }

        ob_start();
        ?>
        <div class="yatra-filter-section">
            <div class="yatra-filter-title" data-toggle="activities">
                <div class="yatra-filter-title-content">
                    <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    <span>Activities</span>
                </div>
                <div class="yatra-filter-actions">
                    <span class="yatra-clear-section" data-section="activities">Clear</span>
                    <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </div>
            </div>
            <div class="yatra-filter-content">
                <div class="yatra-checkbox-group">
                    <?php foreach ($activities as $activity) : 
                        // Get trip count for this activity
                        global $wpdb;
                        $trip_count = $wpdb->get_var($wpdb->prepare(
                            "SELECT COUNT(DISTINCT t.id) FROM {$wpdb->prefix}yatra_trips t 
                             INNER JOIN {$wpdb->prefix}yatra_trip_activities ta ON t.id = ta.trip_id 
                             WHERE ta.activity_id = %d AND t.status = 'published'",
                            $activity->id
                        ));

                        if ($trip_count > 0) :
                    ?>
                    <label class="yatra-checkbox-label">
                        <input type="checkbox" name="activities[]" value="<?php echo esc_attr($activity->id); ?>" <?php echo in_array($activity->id, $active_filters['activities'] ?? []) ? 'checked' : ''; ?>>
                        <span><?php echo esc_html($activity->name); ?></span>
                        <span class="yatra-filter-count">(<?php echo (int)$trip_count; ?>)</span>
                    </label>
                    <?php endif; endforeach; ?>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Render complete filter sidebar
     * 
     * @param array $active_filters Current active filters
     * @param array $options Filter options and configuration
     * @return string HTML output
     */
    public function renderFilterSidebar(array $active_filters = [], array $options = []): string
    {
        $enabled_filters = $options['enabled_filters'] ?? [
            'price_range', 'difficulty', 'rating', 'categories', 'destinations', 'activities'
        ];

        ob_start();
        ?>
        <aside class="yatra-filter-sidebar">
            <div class="yatra-filter-header">
                <h2>Filters</h2>
                <span class="yatra-clear-filters">Clear all</span>
            </div>

            <?php
            foreach ($enabled_filters as $filter_type) {
                switch ($filter_type) {
                    case 'price_range':
                        echo $this->renderPriceRangeFilter($active_filters, $options);
                        break;
                    case 'difficulty':
                        echo $this->renderDifficultyFilter($active_filters, $options);
                        break;
                    case 'rating':
                        echo $this->renderRatingFilter($active_filters, $options);
                        break;
                    case 'categories':
                        echo $this->renderCategoriesFilter($active_filters, $options);
                        break;
                    case 'destinations':
                        echo $this->renderDestinationsFilter($active_filters, $options);
                        break;
                    case 'activities':
                        echo $this->renderActivitiesFilter($active_filters, $options);
                        break;
                }
            }
            ?>
        </aside>
        <?php
        return ob_get_clean();
    }

    /**
     * Get repository (required by BaseService)
     */
    protected function getRepository()
    {
        // FilterService doesn't need a repository
        return null;
    }
}
