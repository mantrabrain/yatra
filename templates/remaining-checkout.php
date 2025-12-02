<?php
/**
 * Remaining Checkout Template
 */

if (!defined('ABSPATH')) {
    exit;
}

yatra_start_session();

$booking = $booking ?? ($GLOBALS['yatra_booking'] ?? null);

get_header();
?>

<div class="yatra-booking-page yatra-remaining-page">
    <div class="yatra-booking-container">
        <?php
        $partial = YATRA_PLUGIN_PATH . 'templates/partials/remaining-checkout-content.php';
        if (file_exists($partial)) {
            include $partial;
        } else {
            echo '<p>' . esc_html__('Remaining checkout content missing.', 'yatra') . '</p>';
        }
        ?>
    </div>
</div>


<?php get_footer(); ?>
