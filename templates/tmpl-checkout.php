<?php
defined('ABSPATH') || exit;

if (count($checkout) < 1) {

    echo '<p>' . esc_html__('Your cart is empty. Please add any of the tour on the cart first.', 'yatra') . '</p>';

    return;
}

do_action('yatra_checkout_before_form');

?>
    <form method="post" class="yatra-form yatra-checkout-form" id="yatra-checkout-form">

        <div class="yatra-checkout-form-inner yatra-row">

            <?php do_action('yatra_checkout_before_form_fields'); ?>

            <div class="yatra-col-md-6 yatra-col-xs-12 yatra-checkout-form-fields"><?php

                do_action('yatra_checkout_form_fields');

                yatra_privacy_agreement('yatra_checkout_show_agree_to_privacy_policy');

                yatra_terms_agreement('yatra_checkout_show_agree_to_terms_policy');
                ?>
            </div>

            <?php do_action('yatra_checkout_after_form_fields'); ?>

            <div class="yatra-col-md-6 yatra-col-xs-12 yatra-checkout-order-table">
                <?php

                yatra()->cart->get_cart_order_table();

                ?>
            </div>
        </div>
        <p class="yatra-checkout-button-wrap">
            <?php

            $currency_symbol = yatra_get_current_currency_symbol();

            $order_booking_text = get_option('yatra_order_booking_text', 'Order Booking');

            wp_nonce_field('yatra_book_selected_tour_nonce', 'yatra-book-selected-tour-nonce'); ?>
            <input type="submit" class="yatra-button button yatra_order_submit_button"
                   name="yatra_order_submit_button"
                   id="yatra_order_submit_button"
                   data-value="<?php echo esc_attr($order_booking_text); ?>"
                   data-order-amount="<?php echo floatval(yatra()->cart->get_cart_total(true)) ?>"
                   value="<?php echo esc_attr($order_booking_text); ?>"/>
            <input type="hidden" name="action" value="yatra_book_selected_tour_nonce"/>
        </p>
    </form>
<?php
do_action('yatra_checkout_after_form');
