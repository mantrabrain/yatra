<?php
if (!defined('ABSPATH')) {
    exit;
} ?>
<section class="yatra-trip-section" id="location">
    <h2 class="yatra-trip-section-title">
        <?php echo yatra_svg_icon('map-pin', 'yatra-trip-section-title-icon'); ?>
        <?php echo esc_html__('Location', 'yatra'); ?>
    </h2>

    <?php if (!empty($trip->latitude) && !empty($trip->longitude)): ?>
        <div class="yatra-trip-map" id="yatra-trip-map" data-lat="<?php echo esc_attr($trip->latitude); ?>"
             data-lng="<?php echo esc_attr($trip->longitude); ?>">
            <iframe
                    width="100%"
                    height="400"
                    style="border:0; border-radius: 12px;"
                    loading="lazy"
                    allowfullscreen
                    referrerpolicy="no-referrer-when-downgrade"
                    src="https://www.google.com/maps?q=<?php echo esc_attr($trip->latitude); ?>,<?php echo esc_attr($trip->longitude); ?>&output=embed">
            </iframe>
        </div>
    <?php else: ?>
        <div class="yatra-trip-map yatra-map-placeholder">
            <p><?php echo esc_html__('Map location not available', 'yatra'); ?></p>
        </div>
    <?php endif; ?>

    <?php if (!empty($trip->starting_location) || !empty($trip->ending_location) || !empty($trip->landmarks)): ?>
        <div class="yatra-location-details" style="margin-top: 24px;">
            <?php if (!empty($trip->starting_location)): ?>
                <p>
                    <strong><?php echo esc_html__('Starting Point:', 'yatra'); ?></strong> <?php echo esc_html($trip->starting_location); ?>
                </p>
            <?php endif; ?>
            <?php if (!empty($trip->ending_location)): ?>
                <p>
                    <strong><?php echo esc_html__('Ending Point:', 'yatra'); ?></strong> <?php echo esc_html($trip->ending_location); ?>
                </p>
            <?php endif; ?>
            <?php if (!empty($trip->landmarks) && is_array($trip->landmarks)): ?>
                <p>
                    <strong><?php echo esc_html__('Key Landmarks:', 'yatra'); ?></strong> <?php echo esc_html(implode(', ', $trip->landmarks)); ?>
                </p>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</section>