<?php
if (!defined('ABSPATH')) {
    exit;
}

// Quick Facts Section for Single Trip Page
// Expected variables: $trip
?>
<div class="yatra-trip-quick-facts">
    <div class="yatra-quick-fact">
        <div class="yatra-quick-fact-icon">
            <?php echo yatra_svg_icon('calendar', 'yatra-icon-lg'); ?>
        </div>
        <div class="yatra-quick-fact-content">
            <div class="yatra-quick-fact-label"><?php echo esc_html__('Duration', 'yatra'); ?></div>
            <div class="yatra-quick-fact-value">
                <?php
                if ($trip->trip_type === 'single_day') {
                    echo esc_html__('Day Trip', 'yatra');
                } else {
                    echo esc_html(yatra_format_duration($trip->duration_days, $trip->duration_nights));
                }
                ?>
            </div>
        </div>
    </div>

    <?php if (!empty($trip->difficulty_level)): ?>
        <div class="yatra-quick-fact">
            <div class="yatra-quick-fact-icon">
                <?php echo yatra_svg_icon('mountain', 'yatra-icon-lg'); ?>
            </div>
            <div class="yatra-quick-fact-content">
                <div class="yatra-quick-fact-label"><?php echo esc_html__('Difficulty', 'yatra'); ?></div>
                <div class="yatra-quick-fact-value"><?php echo esc_html(ucfirst($trip->difficulty_level)); ?></div>
            </div>
        </div>
    <?php endif; ?>

    <div class="yatra-quick-fact">
        <div class="yatra-quick-fact-icon">
            <?php echo yatra_svg_icon('users', 'yatra-icon-lg'); ?>
        </div>
        <div class="yatra-quick-fact-content">
            <div class="yatra-quick-fact-label"><?php echo esc_html__('Group Size', 'yatra'); ?></div>
            <div class="yatra-quick-fact-value">
                <?php echo esc_html(sprintf(__('%d-%d travelers', 'yatra'), $trip->min_travelers, $trip->max_travelers)); ?>
            </div>
        </div>
    </div>

    <div class="yatra-quick-fact">
        <div class="yatra-quick-fact-icon">
            <?php echo yatra_svg_icon('star', 'yatra-icon-lg'); ?>
        </div>
        <div class="yatra-quick-fact-content">
            <div class="yatra-quick-fact-label"><?php echo esc_html__('Rating', 'yatra'); ?></div>
            <div class="yatra-quick-fact-value">
                <?php if ($trip->average_rating > 0): ?>
                    <?php echo esc_html(number_format($trip->average_rating, 1)); ?> (<?php echo esc_html($trip->review_count); ?> <?php echo esc_html(_n('review', 'reviews', $trip->review_count, 'yatra')); ?>)
                <?php else: ?>
                    <?php echo esc_html__('No reviews yet', 'yatra'); ?>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <?php if (!empty($trip->starting_location) || !empty($trip->ending_location)): ?>
        <div class="yatra-quick-fact">
            <div class="yatra-quick-fact-icon">
                <?php echo yatra_svg_icon('map-pin', 'yatra-icon-lg'); ?>
            </div>
            <div class="yatra-quick-fact-content">
                <div class="yatra-quick-fact-label"><?php echo esc_html__('Route', 'yatra'); ?></div>
                <div class="yatra-quick-fact-value">
                    <?php
                    if (!empty($trip->starting_location) && !empty($trip->ending_location)) {
                        echo esc_html($trip->starting_location . ' → ' . $trip->ending_location);
                    } elseif (!empty($trip->starting_location)) {
                        echo esc_html__('From:', 'yatra') . ' ' . esc_html($trip->starting_location);
                    } else {
                        echo esc_html__('To:', 'yatra') . ' ' . esc_html($trip->ending_location);
                    }
                    ?>
                </div>
            </div>
        </div>
    <?php endif; ?>
</div>