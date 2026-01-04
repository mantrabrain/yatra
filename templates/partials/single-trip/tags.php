<?php
if (!defined('ABSPATH')) {
    exit;
}

// Tags Section for Single Trip Page
// Expected variables: $trip, $trip_categories, $activities, $destinations
?>
<div class="yatra-trip-tags">
    <div class="yatra-trip-tags-container">
        <?php if (!empty($trip_categories)): ?>
            <div class="yatra-trip-tag">
                <span class="yatra-trip-tag-label"><?php echo esc_html__('Category:', 'yatra'); ?></span>
                <span class="yatra-trip-tag-value">
                    <?php
                    $category_links = [];
                    foreach ($trip_categories as $category) {
                        $name = esc_html($category->name ?? '');
                        $permalink = yatra_get_category_permalink($category);
                        $category_links[] = $permalink ? '<a href="' . esc_url($permalink) . '">' . $name . '</a>' : $name;
                    }
                    echo implode(', ', $category_links);
                    ?>
                </span>
            </div>
        <?php endif; ?>
        <?php if (!empty($activities)): ?>
            <div class="yatra-trip-tag">
                <span class="yatra-trip-tag-label"><?php echo esc_html__('Activity:', 'yatra'); ?></span>
                <span class="yatra-trip-tag-value">
                    <?php
                    $activity_links = [];
                    foreach ($activities as $activity) {
                        $name = esc_html($activity->name ?? '');
                        $permalink = yatra_get_activity_permalink($activity);
                        $activity_links[] = $permalink ? '<a href="' . esc_url($permalink) . '">' . $name . '</a>' : $name;
                    }
                    echo implode(', ', $activity_links);
                    ?>
                </span>
            </div>
        <?php endif; ?>
        <?php if (!empty($destinations)): ?>
            <div class="yatra-trip-tag">
                <span class="yatra-trip-tag-label"><?php echo esc_html__('Destination:', 'yatra'); ?></span>
                <span class="yatra-trip-tag-value">
                    <?php
                    $destination_links = [];
                    foreach ($destinations as $destination) {
                        $name = esc_html($destination->name ?? '');
                        $permalink = yatra_get_destination_permalink($destination);
                        $destination_links[] = $permalink ? '<a href="' . esc_url($permalink) . '">' . $name . '</a>' : $name;
                    }
                    echo implode(', ', $destination_links);
                    ?>
                </span>
            </div>
        <?php endif; ?>
    </div>
</div>
