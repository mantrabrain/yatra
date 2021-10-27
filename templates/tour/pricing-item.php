<?php
/* @var Yatra_Tour_Pricing $yatra_booking_pricing */
$currency_symbol = yatra_get_current_currency_symbol();

?>
<div class="yatra-form-fields">
    <div class="yatra-traveler-info-wrap">
        <div class="yatra-traveler-number">
            <div class="yatra-traveler-number-inner">
                <?php
                $field_name = $pricing_type === "multi" ? "yatra_number_of_person[multi_pricing][{$yatra_booking_pricing->getID()}]" : "yatra_number_of_person[single_pricing]";

                yatra_nice_input_number_field($field_name, $yatra_booking_pricing->getMaximumPax(), $yatra_booking_pricing->getMinimumPax());

                ?>
            </div>
            <span><?php echo esc_html($yatra_booking_pricing->getLabel()) ?></span>
        </div>
        <div class="yatra-traveler-price">
            <?php
            if ($yatra_booking_pricing->getRegularPrice() != '') { ?>
                <del><?php echo esc_html(yatra_get_price($currency_symbol, $yatra_booking_pricing->getRegularPrice())) ?></del>
            <?php } ?>
            <ins><?php


                echo esc_html(yatra_get_price($currency_symbol, $yatra_booking_pricing->getFinalPrice()));


                ?></ins>
            <?php
            if (strtolower($yatra_booking_pricing->getPricingPer()) == 'group') {

                $pricing_per_string = yatra_get_price($currency_symbol, $yatra_booking_pricing->getSalesPrice()) . ' Per ' . $yatra_booking_pricing->getGroupSize() . ' ' . $yatra_booking_pricing->getLabel();
            } else {

                $pricing_per_string = yatra_get_price($currency_symbol, $yatra_booking_pricing->getSalesPrice()) . ' Per ' . $yatra_booking_pricing->getLabel();
            }

            if ($yatra_booking_pricing->getDescription() != '') {
                ?>
                <span class="yatra-booking-pricing-desc"><?php echo esc_html($yatra_booking_pricing->getDescription()); ?></span>
            <?php } ?>
            <span class="yatra-booking-pricing-info"><?php echo esc_html($pricing_per_string); ?></span>
        </div>
    </div>
</div>