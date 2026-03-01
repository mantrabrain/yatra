<?php
if (!defined('ABSPATH')) {
    exit;
}

// Sticky Navigation Bar for Single Trip Page
// Expected variables: $trip, $base_price, $has_availability, $has_traveler_pricing
?>
<div class="yatra-sticky-nav">
    <div class="yatra-sticky-nav-container">
        <a href="#overview" class="yatra-sticky-nav-item">
            <?php echo yatra_svg_icon('book', 'yatra-sticky-nav-icon'); ?>
            <span><?php esc_html_e('Overview', 'yatra'); ?></span>
        </a>
        <a href="#itinerary" class="yatra-sticky-nav-item">
            <?php echo yatra_svg_icon('calendar', 'yatra-sticky-nav-icon'); ?>
            <span><?php esc_html_e('Itinerary', 'yatra'); ?></span>
        </a>
        <a href="#included" class="yatra-sticky-nav-item">
            <?php echo yatra_svg_icon('check', 'yatra-sticky-nav-icon'); ?>
            <span><?php esc_html_e('Included', 'yatra'); ?></span>
        </a>
        <a href="#location" class="yatra-sticky-nav-item">
            <?php echo yatra_svg_icon('map-pin', 'yatra-sticky-nav-icon'); ?>
            <span><?php esc_html_e('Location', 'yatra'); ?></span>
        </a>
        <a href="#important-info" class="yatra-sticky-nav-item">
            <?php echo yatra_svg_icon('file-text', 'yatra-sticky-nav-icon'); ?>
            <span><?php esc_html_e('Important Info', 'yatra'); ?></span>
        </a>
        <a href="#faq" class="yatra-sticky-nav-item">
            <?php echo yatra_svg_icon('users', 'yatra-sticky-nav-icon'); ?>
            <span><?php esc_html_e('FAQ', 'yatra'); ?></span>
        </a>
        <?php 
        $special_content = $trip->what_makes_special ?? '';
        if (!empty($special_content)): 
        ?>
            <a href="#what-makes-special" class="yatra-sticky-nav-item">
                <?php echo yatra_svg_icon('globe', 'yatra-sticky-nav-icon'); ?>
                <span><?php esc_html_e('Special', 'yatra'); ?></span>
            </a>
        <?php endif; ?>
        <?php if (!empty($trip->trip_story ?? '')): ?>
            <a href="#trip-story" class="yatra-sticky-nav-item">
                <?php echo yatra_svg_icon('book', 'yatra-sticky-nav-icon'); ?>
                <span><?php esc_html_e('Story', 'yatra'); ?></span>
            </a>
        <?php endif; ?>
        <?php 
        $display_testimonials = !empty($trip->testimonials) && is_array($trip->testimonials) ? $trip->testimonials : [];
        if (!empty($display_testimonials)): 
        ?>
            <a href="#testimonials" class="yatra-sticky-nav-item">
                <?php echo yatra_svg_icon('heart', 'yatra-sticky-nav-icon'); ?>
                <span><?php esc_html_e('Testimonials', 'yatra'); ?></span>
            </a>
        <?php endif; ?>
                <div class="yatra-sticky-nav-price">
            <?php if ($has_availability || $has_traveler_pricing): ?>
                <div class="yatra-sticky-nav-price-label"><?php echo esc_html__('Starting From', 'yatra'); ?></div>
            <?php endif; ?>
            <div class="yatra-sticky-nav-price-amount">
                <?php echo yatra_svg_icon('shopping', 'yatra-icon-sm'); ?>
                <span><?php echo yatra_format_price($base_price); ?></span>
            </div>
            <div class="yatra-sticky-nav-price-note"><?php echo esc_html__('per person', 'yatra'); ?></div>
        </div>
    </div>
</div>