<?php
defined('ABSPATH') || exit;

if (count($checkout) < 1) {

    echo '<p>Your tour cart is empty. Please select any of the booking first.</p>';
    return;
}

do_action('yatra_checkout_before_form_fields');

?>

    <form method="post" class="yatra-checkout-form"><?php

        do_action('yatra_checkout_form_fields');

        echo '<div class="mb-clear"></div>';


        yatra_instance()->cart->get_cart_order_table();
        ?>
        <p>
            <?php wp_nonce_field('yatra_book_selected_tour_nonce', 'yatra-book-selected-tour-nonce'); ?>
            <input type="submit" class="yatra-button button" name="book_selected_tour_nonce"
                   value="<?php echo esc_attr(get_option('yatra_order_booking_text', 'Order Booking')); ?>"/>
            <input type="hidden" name="action" value="yatra_book_selected_tour_nonce"/>
        </p>


    </form>
<?php
do_action('yatra_checkout_after_form_fields');
