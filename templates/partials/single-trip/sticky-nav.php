<?php
if (!defined('ABSPATH')) {
    exit;
}

// Sticky Navigation Bar for Single Trip Page
// Expected variables: $trip, $base_price, $has_availability, $has_traveler_pricing
?>
<div class="yatra-sticky-nav">
    <div class="yatra-sticky-nav-container">
        <?php
        $navigation_items = \Yatra\Controllers\SingleTripController::getStickyNavigationItems($trip);
        foreach ($navigation_items as $item):
        ?>
            <a href="<?php echo esc_url($item['href']); ?>" class="yatra-sticky-nav-item">
                <?php yatra_render_tab_icon($item['icon'], 'book', 'yatra-sticky-nav-icon', $item['label']); ?>
                <span><?php echo esc_html($item['label']); ?></span>
            </a>
        <?php endforeach; ?>
    </div>
</div>