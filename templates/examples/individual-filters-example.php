<?php
/**
 * Example: Using Individual Filter Components
 * 
 * This file demonstrates how to use the new FilterService and helper functions
 * to create custom filter layouts and individual filter sections.
 */

// Include the filter helpers
require_once plugin_dir_path(__FILE__) . '../../includes/filter-helpers.php';

// Example active filters (normally from URL parameters)
$active_filters = [
    'price_min' => 200,
    'price_max' => 1000,
    'categories' => [1, 3],
    'difficulty' => [2],
    'rating' => [4, 5]
];

?>

<!DOCTYPE html>
<html>
<head>
    <title><?php esc_html_e('Individual Filter Components Example', 'yatra'); ?></title>
    <link rel="stylesheet" href="../public/css/listing.css">
</head>
<body>

<h1><?php esc_html_e('Individual Filter Components Examples', 'yatra'); ?></h1>

<!-- Example 1: Single Price Filter -->
<section>
    <h2><?php esc_html_e('Example 1: Price Filter Only', 'yatra'); ?></h2>
    <div class="filter-container">
        <?php echo yatra_render_price_filter($active_filters); ?>
    </div>
</section>

<!-- Example 2: Categories and Destinations Only -->
<section>
    <h2><?php esc_html_e('Example 2: Categories + Destinations', 'yatra'); ?></h2>
    <div class="filter-container">
        <?php 
        echo yatra_render_categories_filter($active_filters);
        echo yatra_render_destinations_filter($active_filters);
        ?>
    </div>
</section>

<!-- Example 3: Custom Filter Combination -->
<section>
    <h2><?php esc_html_e('Example 3: Custom Filter Set', 'yatra'); ?></h2>
    <div class="filter-container">
        <?php 
        echo yatra_render_custom_filters([
            'price_range',
            'rating',
            'difficulty'
        ], $active_filters);
        ?>
    </div>
</section>

<!-- Example 4: Complete Sidebar with Custom Options -->
<section>
    <h2><?php esc_html_e('Example 4: Complete Sidebar (Custom Configuration)', 'yatra'); ?></h2>
    <div class="filter-container">
        <?php 
        echo yatra_render_filter_sidebar($active_filters, [
            'enabled_filters' => ['price_range', 'categories', 'rating'],
            'min_price' => 50,
            'max_price' => 2000
        ]);
        ?>
    </div>
</section>

<!-- Example 5: Horizontal Filter Layout -->
<section>
    <h2><?php esc_html_e('Example 5: Horizontal Filter Layout', 'yatra'); ?></h2>
    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 250px;">
            <?php echo yatra_render_price_filter($active_filters); ?>
        </div>
        <div style="flex: 1; min-width: 250px;">
            <?php echo yatra_render_categories_filter($active_filters); ?>
        </div>
        <div style="flex: 1; min-width: 250px;">
            <?php echo yatra_render_rating_filter($active_filters); ?>
        </div>
    </div>
</section>

<!-- Example 6: Using FilterService Directly -->
<section>
    <h2><?php esc_html_e('Example 6: Using FilterService Directly', 'yatra'); ?></h2>
    <div class="filter-container">
        <?php
        use Yatra\Services\FilterService;
        
        $filterService = new FilterService();
        
        // Render individual components
        echo $filterService->renderDifficultyFilter($active_filters);
        echo $filterService->renderActivitiesFilter($active_filters);
        ?>
    </div>
</section>

<script src="../public/js/listing-filters.js"></script>
</body>
</html>
