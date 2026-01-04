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
            <?php echo yatra_svg_icon('book-open', 'yatra-icon-sm'); ?>
            <span>Overview</span>
        </a>
        <a href="#trip-details" class="yatra-sticky-nav-item">
            <?php echo yatra_svg_icon('info', 'yatra-icon-sm'); ?>
            <span>Trip Details</span>
        </a>
        <a href="#itinerary" class="yatra-sticky-nav-item">
            <?php echo yatra_svg_icon('calendar', 'yatra-icon-sm'); ?>
            <span>Itinerary</span>
        </a>
        <a href="#included" class="yatra-sticky-nav-item">
            <?php echo yatra_svg_icon('check', 'yatra-icon-sm'); ?>
            <span>What's Included</span>
        </a>
        <a href="#gallery" class="yatra-sticky-nav-item">
            <?php echo yatra_svg_icon('camera', 'yatra-icon-sm'); ?>
            <span>Gallery</span>
        </a>
        <a href="#location" class="yatra-sticky-nav-item">
            <?php echo yatra_svg_icon('map-pin', 'yatra-icon-sm'); ?>
            <span>Location</span>
        </a>
        <a href="#faq" class="yatra-sticky-nav-item">
            <?php echo yatra_svg_icon('info', 'yatra-icon-sm'); ?>
            <span>FAQ</span>
        </a>
        <a href="#reviews" class="yatra-sticky-nav-item">
            <?php echo yatra_svg_icon('star', 'yatra-icon-sm'); ?>
            <span>Reviews</span>
        </a>
        <div class="yatra-sticky-nav-price">
            <?php if ($has_availability || $has_traveler_pricing): ?>
                <div class="yatra-sticky-nav-price-label"><?php echo esc_html__('Starting From', 'yatra'); ?></div>
            <?php endif; ?>
            <div class="yatra-sticky-nav-price-amount">
                <?php echo yatra_svg_icon('dollar', 'yatra-icon-sm'); ?>
                <span><?php echo yatra_format_price($base_price); ?></span>
            </div>
            <div class="yatra-sticky-nav-price-note"><?php echo esc_html__('per person', 'yatra'); ?></div>
        </div>
    </div>
</div>