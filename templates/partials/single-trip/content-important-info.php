<?php
if (!defined('ABSPATH')) {
    exit;
}

// Important Information Section - Simple Clean Layout
// Expected variables: $trip
?>
<section class="yatra-trip-section" id="important-info">
    <h2 class="yatra-trip-section-title">
        <?php yatra_render_tab_icon($tab->icon ?? null, 'info', 'yatra-trip-section-title-icon', $tab->label ?? 'Important Information'); ?>
        <?php echo esc_html(isset($tab->label) ? $tab->label : __('Important Information', 'yatra')); ?>
    </h2>
    <div class="yatra-important-info-grid">
        <?php if (!empty($trip->getPhysicalRequirements())): ?>
            <div class="yatra-important-info-card">
                <div class="yatra-important-info-icon">
                    <?php echo yatra_svg_icon('activity', 'yatra-icon-lg'); ?>
                </div>
                <div class="yatra-important-info-content-wrapper">
                    <h3 class="yatra-important-info-title"><?php esc_html_e('Physical Requirements', 'yatra'); ?></h3>
                    <p class="yatra-important-info-content"><?php echo esc_html($trip->getPhysicalRequirements()); ?></p>
                </div>
            </div>
        <?php endif; ?>

        <?php if (!empty($trip->getVisaRequirements())): ?>
            <div class="yatra-important-info-card">
                <div class="yatra-important-info-icon">
                    <?php echo yatra_svg_icon('file-text', 'yatra-icon-lg'); ?>
                </div>
                <div class="yatra-important-info-content-wrapper">
                    <h3 class="yatra-important-info-title"><?php esc_html_e('Visa Requirements', 'yatra'); ?></h3>
                    <p class="yatra-important-info-content"><?php echo esc_html($trip->getVisaRequirements()); ?></p>
                </div>
            </div>
        <?php endif; ?>

        <?php if (!empty($trip->getVaccinationRequirements())): ?>
            <div class="yatra-important-info-card">
                <div class="yatra-important-info-icon">
                    <?php echo yatra_svg_icon('heart', 'yatra-icon-lg'); ?>
                </div>
                <div class="yatra-important-info-content-wrapper">
                    <h3 class="yatra-important-info-title"><?php esc_html_e('Vaccination Requirements', 'yatra'); ?></h3>
                    <p class="yatra-important-info-content"><?php echo esc_html($trip->getVaccinationRequirements()); ?></p>
                </div>
            </div>
        <?php endif; ?>

        <?php if (!empty($trip->getCancellationPolicy())): ?>
            <div class="yatra-important-info-card">
                <div class="yatra-important-info-icon">
                    <?php echo yatra_svg_icon('file-text', 'yatra-icon-lg'); ?>
                </div>
                <div class="yatra-important-info-content-wrapper">
                    <h3 class="yatra-important-info-title"><?php esc_html_e('Cancellation Policy', 'yatra'); ?></h3>
                    <p class="yatra-important-info-content"><?php echo esc_html($trip->getCancellationPolicy()); ?></p>
                </div>
            </div>
        <?php endif; ?>

        <?php if (!empty($trip->age_min) || !empty($trip->age_max)): ?>
            <div class="yatra-important-info-card">
                <div class="yatra-important-info-icon">
                    <?php echo yatra_svg_icon('users', 'yatra-icon-lg'); ?>
                </div>
                <div class="yatra-important-info-content-wrapper">
                    <h3 class="yatra-important-info-title"><?php esc_html_e('Age Requirements', 'yatra'); ?></h3>
                    <p class="yatra-important-info-content">
                        Minimum age: <?php echo esc_html($trip->age_min ?? 'N/A'); ?> years.
                        <?php if (!empty($trip->age_max)): ?>
                            Maximum age: <?php echo esc_html($trip->age_max); ?> years.
                        <?php endif; ?>
                        Participants should be in good physical condition.
                    </p>
                </div>
            </div>
        <?php endif; ?>
    </div>
</section>
