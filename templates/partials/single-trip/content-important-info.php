<?php
if (!defined('ABSPATH')) {
    exit;
}

// Important Information Section
// Expected variables: $trip
?>
<section class="yatra-trip-section" id="important-info">
    <h2 class="yatra-trip-section-title">
        <?php echo yatra_svg_icon('info', 'yatra-trip-section-title-icon'); ?>
        Important Information
    </h2>
    <div class="yatra-important-info-grid">
        <?php if (!empty($trip->physical_requirements ?? '')): ?>
            <div class="yatra-important-info-card">
                <div class="yatra-important-info-icon">
                    <?php echo yatra_svg_icon('shield', 'yatra-icon-lg'); ?>
                </div>
                <h3 class="yatra-important-info-title">Physical Requirements</h3>
                <p class="yatra-important-info-content"><?php echo esc_html($trip->physical_requirements ?? ''); ?></p>
            </div>
        <?php endif; ?>

        <?php if (!empty($trip->visa_requirements ?? '')): ?>
            <div class="yatra-important-info-card">
                <div class="yatra-important-info-icon">
                    <?php echo yatra_svg_icon('file', 'yatra-icon-lg'); ?>
                </div>
                <h3 class="yatra-important-info-title">Visa Requirements</h3>
                <p class="yatra-important-info-content"><?php echo esc_html($trip->visa_requirements ?? ''); ?></p>
            </div>
        <?php endif; ?>

        <?php if (!empty($trip->vaccination_requirements ?? '')): ?>
            <div class="yatra-important-info-card">
                <div class="yatra-important-info-icon">
                    <?php echo yatra_svg_icon('shield', 'yatra-icon-lg'); ?>
                </div>
                <h3 class="yatra-important-info-title">Vaccination Requirements</h3>
                <p class="yatra-important-info-content"><?php echo esc_html($trip->vaccination_requirements ?? ''); ?></p>
            </div>
        <?php endif; ?>

        <?php if (!empty($trip->cancellation_policy ?? '')): ?>
            <div class="yatra-important-info-card">
                <div class="yatra-important-info-icon">
                    <?php echo yatra_svg_icon('info', 'yatra-icon-lg'); ?>
                </div>
                <h3 class="yatra-important-info-title">Cancellation Policy</h3>
                <p class="yatra-important-info-content"><?php echo esc_html($trip->cancellation_policy ?? ''); ?></p>
            </div>
        <?php endif; ?>

        <?php if (!empty($trip->age_min) || !empty($trip->age_max)): ?>
            <div class="yatra-important-info-card">
                <div class="yatra-important-info-icon">
                    <?php echo yatra_svg_icon('users', 'yatra-icon-lg'); ?>
                </div>
                <h3 class="yatra-important-info-title">Age Requirements</h3>
                <p class="yatra-important-info-content">
                    Minimum age: <?php echo esc_html($trip->age_min ?? 'N/A'); ?> years.
                    <?php if (!empty($trip->age_max)): ?>
                        Maximum age: <?php echo esc_html($trip->age_max); ?> years.
                    <?php endif; ?>
                    Participants should be in good physical condition.
                </p>
            </div>
        <?php endif; ?>

        <?php if (!empty($trip->best_season ?? '')): ?>
            <div class="yatra-important-info-card">
                <div class="yatra-important-info-icon">
                    <?php echo yatra_svg_icon('sun', 'yatra-icon-lg'); ?>
                </div>
                <h3 class="yatra-important-info-title">Best Time to Visit</h3>
                <p class="yatra-important-info-content"><?php echo esc_html($trip->best_season ?? ''); ?></p>
            </div>
        <?php endif; ?>
    </div>
</section>
