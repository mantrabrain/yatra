<?php
defined('ABSPATH') || exit;

if (count($checkout) < 1) {

    echo '<p>Your tour cart is empty. Please select any of the booking first.</p>';
    return;
}

?>

<form method="post" action="<?php echo admin_url('admin-ajax.php'); ?>" class="yatra-checkout-form"><?php

    do_action('yatra_checkout_form_fields');
    echo '<div class="mb-clear"></div>';
    yatra_instance()->cart->get_cart_order_table();
    ?>
    <input type="hidden" name="yatra_nonce" value="<?php echo wp_create_nonce('wp_yatra_book_selected_tour_nonce') ?>"/>
    <input type="hidden" name="action" value="yatra_book_selected_tour"/>
    <input type="submit" name="yatra_checkout_submit"
           value="<?php echo esc_attr(get_option('yatra_order_booking_text', 'Order Booking')); ?>"/>
</form>
