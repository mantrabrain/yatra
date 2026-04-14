<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<section class="yatra-trip-section" id="trip-story">
    <h2 class="yatra-trip-section-title">
        <?php yatra_render_tab_icon($tab->icon ?? null, 'book', 'yatra-trip-section-title-icon', $tab->label ?? 'Trip Story'); ?>
        <?php echo esc_html(isset($tab->label) ? $tab->label : __('Trip Story', 'yatra')); ?>
    </h2>
    <div class="yatra-trip-story-container">
        <div class="yatra-trip-story-content">
            <div class="yatra-trip-story-text">
                <?php 
                $story_content = $trip->getTripStory() ?? '';
                if (!empty($story_content)) {
                    // Use wp_kses_post to allow basic HTML formatting but strip dangerous content
                    echo wp_kses_post($story_content);
                } else {
                    echo '<p class="yatra-no-content">' . esc_html__('No story available for this trip yet.', 'yatra') . '</p>';
                }
                ?>
            </div>
        </div>
        
        <?php if (!empty($story_content)): ?>
            <div class="yatra-trip-story-meta">
                <div class="yatra-story-highlight">
                    <?php echo yatra_svg_icon('heart', 'yatra-story-icon'); ?>
                    <span><?php echo esc_html__('Crafted with passion for travelers like you', 'yatra'); ?></span>
                </div>
            </div>
        <?php endif; ?>
    </div>
</section>
