<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<section class="yatra-trip-section" id="what-makes-special">
    <h2 class="yatra-trip-section-title">
        <?php yatra_render_tab_icon($tab->icon ?? null, 'star', 'yatra-trip-section-title-icon', $tab->label ?? 'What Makes This Trip Special'); ?>
        <?php echo esc_html(isset($tab->label) ? $tab->label : __('What Makes This Trip Special', 'yatra')); ?>
    </h2>
    <div class="yatra-trip-special-container">
        <div class="yatra-trip-special-content">
            <div class="yatra-special-features">
                <?php 
                $special_content = $trip->getWhatMakesSpecial() ?? '';
                if (!empty($special_content)) {
                    // Split content by lines and create feature items
                    $features = preg_split('/\r\n|\r|\n/', $special_content);
                    $features = array_filter($features, function($line) {
                        return !empty(trim($line));
                    });
                    
                    if (!empty($features)) {
                        foreach ($features as $index => $feature) {
                            $feature = trim($feature);
                            if (!empty($feature)) {
                                ?>
                                <div class="yatra-special-feature-item">
                                    <div class="yatra-special-feature-icon">
                                        <?php echo yatra_svg_icon('check-circle', 'yatra-feature-check'); ?>
                                    </div>
                                    <div class="yatra-special-feature-text">
                                        <?php echo wp_kses_post($feature); ?>
                                    </div>
                                </div>
                                <?php
                            }
                        }
                    } else {
                        // Fallback to simple paragraph if no line breaks
                        ?>
                        <div class="yatra-special-feature-item">
                            <div class="yatra-special-feature-icon">
                                <?php echo yatra_svg_icon('star', 'yatra-feature-check'); ?>
                            </div>
                            <div class="yatra-special-feature-text">
                                <?php echo wp_kses_post($special_content); ?>
                            </div>
                        </div>
                        <?php
                    }
                } else {
                    echo '<p class="yatra-no-content">' . esc_html__('No special features listed for this trip yet.', 'yatra') . '</p>';
                }
                ?>
            </div>
        </div>
        
        <?php if (!empty($special_content)): ?>
            <div class="yatra-special-badge">
                <?php echo yatra_svg_icon('award', 'yatra-badge-icon'); ?>
                <span><?php echo esc_html__('Premium Experience', 'yatra'); ?></span>
            </div>
        <?php endif; ?>
    </div>
</section>