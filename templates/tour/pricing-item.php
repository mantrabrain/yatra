<?php
/* @var Yatra_Tour_Pricing $yatra_booking_pricing */
$currency_symbol = yatra_get_current_currency_symbol();
$number_of_people = absint($yatra_booking_pricing->getMinimumPax()) === 0 ? 1 : absint($yatra_booking_pricing->getMinimumPax());
?>
<div class="yatra-form-fields yatra-price-item-field"
     data-regular-price="<?php echo esc_attr($yatra_booking_pricing->getRegularPrice()) ?>"
     data-sales-price="<?php echo esc_attr($yatra_booking_pricing->getSalesPrice()) ?>"
     data-final-price="<?php echo esc_attr($yatra_booking_pricing->getFinalPrice()) ?>"
     data-people-count="<?php echo esc_attr($number_of_people) ?>"
     data-pricing-per="<?php echo esc_attr($yatra_booking_pricing->getPricingPer()) ?>"
     data-group-size="<?php echo esc_attr($yatra_booking_pricing->getGroupSize()) ?>"
     data-currency-symbol="<?php echo esc_attr($currency_symbol) ?>"

>
    <div class="yatra-traveller-info-wrap">
        <div class="yatra-traveller-number">
            <div class="yatra-traveller-number-inner">
                <?php
                $field_name = $pricing_type === "multi" ? "yatra_number_of_person[multi_pricing][{$yatra_booking_pricing->getID()}]" : "yatra_number_of_person[single_pricing]";

                yatra_nice_input_number_field($field_name, $yatra_booking_pricing->getMaximumPax(), $yatra_booking_pricing->getMinimumPax(), '', 'yatra-single-tour-number-of-person');

                ?>
            </div>
            <span><?php echo esc_html($yatra_booking_pricing->getLabel()) ?></span>
        </div>
        <div class="yatra-traveller-price">
            <?php

            $regular_price = $yatra_booking_pricing->getRegularPrice();
            $sales_price = $yatra_booking_pricing->getSalesPrice();
            $sales_price = $sales_price === '' ? $regular_price : $sales_price;
            $final_price = $yatra_booking_pricing->getFinalPrice();
            if ($regular_price != '' && ($regular_price != $sales_price)) { ?>
                <del class="regular"><?php echo esc_html(yatra_get_price($currency_symbol, $yatra_booking_pricing->getFinalRegularPrice())) ?></del>
            <?php } ?>
            <ins class="final"><?php

                echo esc_html(yatra_get_price($currency_symbol, $final_price));

                ?></ins>
            <?php
            if (strtolower($yatra_booking_pricing->getPricingPer()) == 'group') {

                $pricing_per_string = yatra_get_price($currency_symbol, $sales_price) . ' Per ' . $yatra_booking_pricing->getGroupSize() . ' ' . $yatra_booking_pricing->getLabel();
            } else {

                $pricing_per_string = yatra_get_price($currency_symbol, $sales_price) . ' Per ' . $yatra_booking_pricing->getLabel();
            }

            if ($yatra_booking_pricing->getDescription() != '') {
                ?>
                <span class="yatra-booking-pricing-desc"><?php echo esc_html($yatra_booking_pricing->getDescription()); ?></span>
            <?php } ?>
            <span class="yatra-booking-pricing-info"><?php echo esc_html($pricing_per_string); ?></span>
        </div>
    </div>
</div>