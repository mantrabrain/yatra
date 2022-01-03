<?php
defined('ABSPATH') || exit;

if (count($checkout) < 1) {

    echo '<p>Your tour cart is empty. Please select any of the booking first.</p>';
    return;
}

do_action('yatra_checkout_before_form');

?>

    <form method="post" class="yatra-checkout-form" id="yatra-checkout-form">

        <?php do_action('yatra_checkout_before_form_fields'); ?>

        <div class="yatra-checkout-form-fields"><?php

            do_action('yatra_checkout_form_fields');

            ?>
        </div>

        <?php do_action('yatra_checkout_after_form_fields'); ?>

        <div class="yatra-checkout-order-table">
            <?php

            yatra()->cart->get_cart_order_table();

            yatra_privacy_agreement('yatra_checkout_show_agree_to_privacy_policy');
            yatra_terms_agreement('yatra_checkout_show_agree_to_terms_policy');
            ?>
            <p class="yatra-checkout-button-wrap">
                <?php wp_nonce_field('yatra_book_selected_tour_nonce', 'yatra-book-selected-tour-nonce'); ?>
                <input type="submit" class="yatra-button button yatra_order_submit_button" name="yatra_order_submit_button"
                       id="yatra_order_submit_button"
                       value="<?php echo esc_attr(get_option('yatra_order_booking_text', 'Order Booking')); ?>"/>
                <input type="hidden" name="action" value="yatra_book_selected_tour_nonce"/>
            </p>

        </div>
    </form>
<?php
do_action('yatra_checkout_after_form');
