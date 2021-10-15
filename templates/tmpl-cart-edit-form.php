<div id="yatra-tour-cart-edit-form-fields">

    <?php
    $currency_symbol = yatra_get_current_currency_symbol();

    foreach ($yatra_booking_pricing_info as $pricing_id => $booking_pricing_args) { ?>

        <div class="yatra-form-fields">
            <div class="yatra-traveler-info-wrap">
                <div class="yatra-traveler-number">
                    <div class="yatra-traveler-number-inner">

                        <div class="yatra-nice-input-number">
                            <button type="button" class="fa fa-plus nice-button plus-button"></button>
                            <?php
                            $field_name = $booking_pricing_args['type'] === "multi" ? "yatra_number_of_person[{$tour_id}][multi_pricing][{$pricing_id}]" : "yatra_number_of_person[{$tour_id}][single_pricing]"; ?>
                            <input readonly
                                   data-step="1"
                                   data-max="<?php echo $booking_pricing_args['maximum_pax'] == '' ? 9999 : absint($booking_pricing_args['maximum_pax']) ?>"
                                   data-min="<?php echo $booking_pricing_args['minimum_pax'] == '' ? 0 : absint($booking_pricing_args['minimum_pax']) ?>"
                                   id="<?php echo esc_attr($field_name) ?>"
                                   type="number"
                                   class="yatra-number-of-person-field"
                                   name="<?php echo esc_attr($field_name) ?>"
                                   value="<?php echo $booking_pricing_args['number_of_person'] == '' ? absint($booking_pricing_args['minimum_pax']) : absint($booking_pricing_args['number_of_person']) ?>"
                            />
                            <button type="button" class="fa fa-minus nice-button minus-button"></button>
                        </div>

                    </div>
                    <span><?php echo esc_html($booking_pricing_args['pricing_label']) ?></span>
                </div>

                <div class="yatra-traveler-price">
                    <?php if ($booking_pricing_args['regular_price'] != '') { ?>
                        <del><?php echo esc_html(yatra_get_price($currency_symbol, $booking_pricing_args['regular_price'])) ?></del>
                    <?php } ?>
                    <ins><?php


                        echo esc_html(yatra_get_price($currency_symbol, $booking_pricing_args['final_price']));


                        ?></ins>
                    <?php
                    if (strtolower($booking_pricing_args['pricing_per']) == 'group') {

                        $pricing_per_string = yatra_get_price($currency_symbol, $booking_pricing_args['sales_price']) . ' Per ' . $booking_pricing_args['group_size'] . ' ' . $booking_pricing_args['pricing_label'];
                    } else {
                        $pricing_per_string = yatra_get_price($currency_symbol, $booking_pricing_args['sales_price']) . ' Per ' . $booking_pricing_args['pricing_label'];
                    }

                    ?>
                    <span class=""><?php echo esc_html($pricing_per_string); ?></span>
                </div>


            </div>
        </div>
    <?php }
    ?>

</div>