<?php
defined('ABSPATH') || exit;


do_action('yatra_checkout_before_form');
$currency_symbol = yatra_get_current_currency_symbol($currency);
?>
    <form method="post" class="yatra-form yatra-checkout-form yatra-user-remaining-chekcout-form"
          id="yatra-checkout-form">

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
                <h2>Booking Summary</h2>

                <div id="tour-book_review" class="yatra-checkout-review-tour-book">
                    <table class="yatra-checkout-review-tour-book-table">
                        <thead>
                        <tr>
                            <th class="tour-name">Tour</th>
                            <th class="tour-name">Date</th>
                            <th class="tour-name">Number of people</th>
                            <th class="tour-total">Total</th>
                        </tr>
                        </thead>
                        <tbody>
                        <?php foreach ($booking_details as $booking) { ?>
                            <tr class="cart_item">
                                <td class="tour-name">
                                    <a target="_blank" href="<?php echo get_permalink($booking['yatra_tour_id']) ?>"
                                       class="tour-title"><?php echo esc_html($booking['yatra_tour_name']) ?></a>
                                </td>
                                <td><span><?php echo esc_html($booking['yatra_selected_date']); ?></span></td>

                                <td><span><?php echo count($booking['number_of_person']) ?></span>
                                </td>
                                <td class="tour-total">
                                    <span class="yatra-Price-amount amount"><?php echo yatra_get_price($currency_symbol, $booking['total_tour_final_price']) ?></span>
                                </td>
                            </tr>
                        <?php } ?>
                        </tbody>
                        <tfoot>

                        <tr class="cart-subtotal">
                            <th colspan="3">Subtotal</th>

                            <td>
                                <span class="yatra-Price-amount amount"><?php echo yatra_get_price($currency_symbol, $booking_params['total_booking_gross_price']) ?></span>
                            </td>


                        </tr>

                        <tr class="tour-book-total">
                            <th colspan="3">Total</th>

                            <td><strong><span
                                            class="yatra-Price-amount amount"><?php echo yatra_get_price($currency_symbol, $booking_params['total_booking_net_price']) ?></span>
                                </strong>
                            </td>

                        </tr>
                        <?php
                        foreach ($payment as $payment_id => $payment_item) {
                            ?>
                            <tr class="tour-book-total">
                                <th colspan="3">- Payment #<?php echo esc_html($payment_id) ?> </th>

                                <td><strong><span
                                                class="yatra-Price-amount amount"><?php echo yatra_get_price($currency_symbol, $payment_item['paid_amount']) ?></span>
                                    </strong>
                                </td>

                            </tr>
                        <?php } ?>

                        <tr class="tour-book-total">
                            <th colspan="3">Remaining Amount[Net Payable]</th>

                            <td><strong><span
                                            class="yatra-Price-amount amount"><?php echo yatra_get_price($currency_symbol, $remaining_amount) ?></span>
                                </strong>
                            </td>

                        </tr>

                        </tfoot>
                    </table>

                </div>
            </div>
        </div>
        <p class="yatra-checkout-button-wrap">
            <?php


            $order_booking_text = __('Make Payment ') . yatra_get_price($currency_symbol, $remaining_amount);

            wp_nonce_field('yatra_book_selected_tour_nonce', 'yatra-book-selected-tour-nonce'); ?>
            <input type="submit" class="yatra-button button yatra_order_submit_button"
                   name="yatra_order_submit_button"
                   id="yatra_order_submit_button"
                   data-value="<?php echo esc_attr($order_booking_text); ?>"
                   value="<?php echo esc_attr($order_booking_text); ?>"/>
            <input type="hidden" name="action" value="yatra_book_selected_tour_nonce"/>
            <input type="hidden" name="booking_id" value="<?php echo absint($booking_id) ?>"/>
        </p>
    </form>
<?php
do_action('yatra_checkout_after_form');
