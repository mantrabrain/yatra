<?php
if (!defined('ABSPATH')) {
    exit;
}

// Important Information Section - Professional UX Design
// Expected variables: $trip
?>
<section class="yatra-trip-section" id="important-info">
    <h2 class="yatra-trip-section-title">
        <?php yatra_render_tab_icon($tab->icon ?? null, 'info', 'yatra-trip-section-title-icon', $tab->label ?? __('Important Information', 'yatra')); ?>
        <?php echo esc_html(isset($tab->label) ? $tab->label : __('Important Information', 'yatra')); ?>
    </h2>
    <p class="yatra-section-description">
        <?php esc_html_e('Essential information you need to know before booking this trip', 'yatra'); ?>
    </p>
    <div class="yatra-important-info-grid">
        <?php if (!empty($trip->getPhysicalRequirements())): ?>
            <div class="yatra-important-info-card">
                <div class="yatra-important-info-icon yatra-icon-physical">
                    <?php echo yatra_svg_icon('activity', 'yatra-icon-lg'); ?>
                </div>
                <div class="yatra-important-info-content-wrapper">
                    <h3 class="yatra-important-info-title">
                        <?php echo yatra_svg_icon('activity', 'yatra-icon-inline'); ?>
                        <?php esc_html_e('Physical Requirements', 'yatra'); ?>
                    </h3>
                    <div class="yatra-important-info-content"><?php echo wp_kses_post(wpautop($trip->getPhysicalRequirements())); ?></div>
                </div>
            </div>
        <?php endif; ?>

        <?php if (!empty($trip->getVisaRequirements())): ?>
            <div class="yatra-important-info-card">
                <div class="yatra-important-info-icon yatra-icon-visa">
                    <?php echo yatra_svg_icon('globe', 'yatra-icon-lg'); ?>
                </div>
                <div class="yatra-important-info-content-wrapper">
                    <h3 class="yatra-important-info-title">
                        <?php echo yatra_svg_icon('globe', 'yatra-icon-inline'); ?>
                        <?php esc_html_e('Visa Requirements', 'yatra'); ?>
                    </h3>
                    <div class="yatra-important-info-content"><?php echo wp_kses_post(wpautop($trip->getVisaRequirements())); ?></div>
                </div>
            </div>
        <?php endif; ?>

        <?php if (!empty($trip->getVaccinationRequirements())): ?>
            <div class="yatra-important-info-card">
                <div class="yatra-important-info-icon yatra-icon-health">
                    <?php echo yatra_svg_icon('heart', 'yatra-icon-lg'); ?>
                </div>
                <div class="yatra-important-info-content-wrapper">
                    <h3 class="yatra-important-info-title">
                        <?php echo yatra_svg_icon('heart', 'yatra-icon-inline'); ?>
                        <?php esc_html_e('Health & Vaccination', 'yatra'); ?>
                    </h3>
                    <div class="yatra-important-info-content"><?php echo wp_kses_post(wpautop($trip->getVaccinationRequirements())); ?></div>
                </div>
            </div>
        <?php endif; ?>

        <?php if (!empty($trip->getCancellationPolicy())): ?>
            <div class="yatra-important-info-card">
                <div class="yatra-important-info-icon yatra-icon-policy">
                    <?php echo yatra_svg_icon('x', 'yatra-icon-lg'); ?>
                </div>
                <div class="yatra-important-info-content-wrapper">
                    <h3 class="yatra-important-info-title">
                        <?php echo yatra_svg_icon('x', 'yatra-icon-inline'); ?>
                        <?php esc_html_e('Cancellation Policy', 'yatra'); ?>
                    </h3>
                    <div class="yatra-important-info-content"><?php echo wp_kses_post(wpautop($trip->getCancellationPolicy())); ?></div>
                </div>
            </div>
        <?php endif; ?>

        <?php if (!empty($trip->age_min) || !empty($trip->age_max)): ?>
            <div class="yatra-important-info-card">
                <div class="yatra-important-info-icon yatra-icon-age">
                    <?php echo yatra_svg_icon('users', 'yatra-icon-lg'); ?>
                </div>
                <div class="yatra-important-info-content-wrapper">
                    <h3 class="yatra-important-info-title">
                        <?php echo yatra_svg_icon('users', 'yatra-icon-inline'); ?>
                        <?php esc_html_e('Age Requirements', 'yatra'); ?>
                    </h3>
                    <div class="yatra-important-info-content">
                        <div class="yatra-info-detail-row">
                            <span class="yatra-info-label"><?php esc_html_e('Minimum Age:', 'yatra'); ?></span>
                            <span class="yatra-info-value"><?php echo esc_html($trip->age_min ?? __('No minimum', 'yatra')); ?> <?php echo !empty($trip->age_min) ? esc_html__('years', 'yatra') : ''; ?></span>
                        </div>
                        <?php if (!empty($trip->age_max)): ?>
                        <div class="yatra-info-detail-row">
                            <span class="yatra-info-label"><?php esc_html_e('Maximum Age:', 'yatra'); ?></span>
                            <span class="yatra-info-value"><?php echo esc_html($trip->age_max); ?> <?php esc_html_e('years', 'yatra'); ?></span>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        <?php endif; ?>

        <?php if (!empty($trip->accommodation_type) || !empty($trip->meal_plan) || !empty($trip->accommodation_details)): ?>
            <div class="yatra-important-info-card">
                <div class="yatra-important-info-icon yatra-icon-accommodation">
                    <?php echo yatra_svg_icon('hotel', 'yatra-icon-lg'); ?>
                </div>
                <div class="yatra-important-info-content-wrapper">
                    <h3 class="yatra-important-info-title">
                        <?php echo yatra_svg_icon('hotel', 'yatra-icon-inline'); ?>
                        <?php esc_html_e('Accommodation', 'yatra'); ?>
                    </h3>
                    <div class="yatra-important-info-content">
                        <?php if (!empty($trip->accommodation_type)): ?>
                        <div class="yatra-info-detail-row">
                            <span class="yatra-info-label"><?php esc_html_e('Type:', 'yatra'); ?></span>
                            <span class="yatra-info-value"><?php echo esc_html($trip->accommodation_type); ?></span>
                        </div>
                        <?php endif; ?>
                        <?php if (!empty($trip->meal_plan)): ?>
                        <div class="yatra-info-detail-row">
                            <span class="yatra-info-label">
                                <?php echo yatra_svg_icon('utensils', 'yatra-icon-tiny'); ?>
                                <?php esc_html_e('Meal Plan:', 'yatra'); ?>
                            </span>
                            <span class="yatra-info-value"><?php echo esc_html(yatra_meal_plan_label((string) $trip->meal_plan)); ?></span>
                        </div>
                        <?php endif; ?>
                        <?php if (!empty($trip->accommodation_details)): ?>
                        <div class="yatra-info-description">
                            <?php echo wp_kses_post(wpautop($trip->accommodation_details)); ?>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        <?php endif; ?>

        <?php if ($trip->transportation_included || !empty($trip->pickup_location) || !empty($trip->dropoff_location) || !empty($trip->transportation_details)): ?>
            <div class="yatra-important-info-card">
                <div class="yatra-important-info-icon yatra-icon-transport">
                    <?php echo yatra_svg_icon('car', 'yatra-icon-lg'); ?>
                </div>
                <div class="yatra-important-info-content-wrapper">
                    <h3 class="yatra-important-info-title">
                        <?php echo yatra_svg_icon('car', 'yatra-icon-inline'); ?>
                        <?php esc_html_e('Transportation', 'yatra'); ?>
                    </h3>
                    <div class="yatra-important-info-content">
                        <?php if ($trip->transportation_included): ?>
                        <div class="yatra-info-badge yatra-badge-included">
                            <?php echo yatra_svg_icon('check', 'yatra-icon-tiny'); ?>
                            <?php esc_html_e('Transportation Included', 'yatra'); ?>
                        </div>
                        <?php endif; ?>
                        <?php if (!empty($trip->pickup_location)): ?>
                        <div class="yatra-info-detail-row">
                            <span class="yatra-info-label">
                                <?php echo yatra_svg_icon('map-pin', 'yatra-icon-tiny'); ?>
                                <?php esc_html_e('Pickup:', 'yatra'); ?>
                            </span>
                            <span class="yatra-info-value"><?php echo esc_html($trip->pickup_location); ?></span>
                        </div>
                        <?php endif; ?>
                        <?php if (!empty($trip->dropoff_location)): ?>
                        <div class="yatra-info-detail-row">
                            <span class="yatra-info-label">
                                <?php echo yatra_svg_icon('map-pin', 'yatra-icon-tiny'); ?>
                                <?php esc_html_e('Dropoff:', 'yatra'); ?>
                            </span>
                            <span class="yatra-info-value"><?php echo esc_html($trip->dropoff_location); ?></span>
                        </div>
                        <?php endif; ?>
                        <?php if (!empty($trip->transportation_details)): ?>
                        <div class="yatra-info-description">
                            <?php echo wp_kses_post(wpautop($trip->transportation_details)); ?>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        <?php endif; ?>
    </div>
</section>
