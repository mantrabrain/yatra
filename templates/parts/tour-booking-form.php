<form method="post" id="yatra-tour-booking-form-fields" action="<?php echo admin_url('admin-ajax.php') ?>">

    <input type="hidden" name="action" value="yatra_tour_add_to_cart"/>
    <input type="hidden" name="yatra_nonce" value="<?php echo wp_create_nonce('wp_yatra_tour_add_to_cart_nonce'); ?>"/>
    <input type="hidden" name="tour_id" value="<?php  echo get_the_ID(); ?>"/>
    <?php foreach ($yatra_booking_pricing_info as $booking_pricing_args) { ?>

        <div class="yatra-form-fields">
            <div class="yatra-traveler-info-wrap">
                <div class="yatra-traveler-number">
                    <div class="yatra-traveler-number-inner">

                        <input id="<?php echo esc_attr($booking_pricing_args['name']) ?>"
                               type="number"
                               name="<?php echo esc_attr($booking_pricing_args['name']) ?>"
                               value="1"
                        />

                    </div>
                    <span><?php echo esc_html($booking_pricing_args['pricing_label']) ?></span>
                </div>
                <div class="yatra-traveler-price">
                    <?php if ($booking_pricing_args['regular_price'] != '' && $booking_pricing_args['sales_price'] != '') { ?>
                        <del><?php echo esc_html($booking_pricing_args['regular_price']) ?></del>
                    <?php } ?>
                    <ins><?php

                        echo $booking_pricing_args['sales_price'] != '' ? esc_html($booking_pricing_args['sales_price']) : esc_html($booking_pricing_args['regular_price']);

                        ?></ins>
                    <?php
                    if (strtolower($booking_pricing_args['pricing_per']) == 'group') {
                        $pricing_per_string = 'Per ' . $booking_pricing_args['group_size'] . ' ' . $booking_pricing_args['pricing_label'];
                    } else {

                        $pricing_per_string = 'Per ' . $booking_pricing_args['pricing_label'];
                    }

                    ?>
                    <span class=""><?php echo esc_html($pricing_per_string); ?></span>
                </div>
            </div>
        </div>
    <?php }
    yatra_book_now_button()
    ?>

</form>