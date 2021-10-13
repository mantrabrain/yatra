<form method="post" id="yatra-tour-booking-form-fields" action="<?php echo admin_url('admin-ajax.php') ?>">

    <input type="hidden" name="action" value="yatra_tour_add_to_cart"/>
    <input type="hidden" name="yatra_nonce" value="<?php echo wp_create_nonce('wp_yatra_tour_add_to_cart_nonce'); ?>"/>
    <input type="hidden" name="tour_id" value="<?php echo get_the_ID(); ?>"/>
    <?php
    $currency_symbol = yatra_get_current_currency_symbol();
    foreach ($yatra_booking_pricing_info as $booking_pricing_args) { ?>

        <div class="yatra-form-fields">
            <div class="yatra-traveler-info-wrap">
                <div class="yatra-traveler-number">
                    <div class="yatra-traveler-number-inner">

                        <div class="yatra-nice-input-number">
                            <button type="button" class="fa fa-plus nice-button plus-button"></button>

                            <input readonly
                                   data-step="1"
                                   data-max="<?php echo $booking_pricing_args['maximum_pax'] == '' ? 9999 : absint($booking_pricing_args['maximum_pax']) ?>"
                                   data-min="<?php echo $booking_pricing_args['minimum_pax'] == '' ? 0 : absint($booking_pricing_args['minimum_pax']) ?>"
                                   id="<?php echo esc_attr($booking_pricing_args['name']) ?>"
                                   type="number"
                                   name="<?php echo esc_attr($booking_pricing_args['name']) ?>"
                                   value="<?php echo $booking_pricing_args['minimum_pax'] == '' ? 1 : absint($booking_pricing_args['minimum_pax']) ?>"
                            />
                            <button type="button" class="fa fa-minus nice-button minus-button"></button>
                        </div>

                    </div>
                    <span><?php echo esc_html($booking_pricing_args['pricing_label']) ?></span>
                </div>
                <div class="yatra-traveler-price">
                    <?php
                    if ($booking_pricing_args['regular_price'] != '' && $booking_pricing_args['sales_price'] != '' && $booking_pricing_args['sales_price'] != "0") { ?>
                        <del><?php echo esc_html($currency_symbol . ' ' . $booking_pricing_args['regular_price']) ?></del>
                    <?php } ?>
                    <ins><?php

                        if ($booking_pricing_args['sales_price'] != '' && $booking_pricing_args['sales_price'] != "0") {

                            echo esc_html($currency_symbol . ' ' . $booking_pricing_args['sales_price']);
                        } else {
                            if ($booking_pricing_args['regular_price'] != '') {
                                echo $currency_symbol . ' ';
                            }
                            echo esc_html($booking_pricing_args['regular_price']);
                        }

                        ?></ins>
                    <?php
                    if (strtolower($booking_pricing_args['pricing_per']) == 'group') {
                        $pricing_per_string = $currency_symbol . $booking_pricing_args['final_price'] . ' Per ' . $booking_pricing_args['group_size'] . ' ' . $booking_pricing_args['pricing_label'];
                    } else {

                        $pricing_per_string = $currency_symbol . $booking_pricing_args['final_price'] . ' Per ' . $booking_pricing_args['pricing_label'];
                    }

                    if ($booking_pricing_args['pricing_description'] != '') {
                        ?>
                        <span class="yatra-booking-pricing-desc"><?php echo esc_html($booking_pricing_args['pricing_description']); ?></span>
                    <?php } ?>
                    <span class="yatra-booking-pricing-info"><?php echo esc_html($pricing_per_string); ?></span>
                </div>
            </div>
        </div>
    <?php }
    yatra_book_now_button()
    ?>

</form>