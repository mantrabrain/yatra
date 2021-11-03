<?php /*** @var $pricing Yatra_Tour_Pricing ** */ ?>
<div class="yatra-form-fields">
    <div class="yatra-traveller-info-wrap">
        <div class="yatra-traveller-number">
            <div class="yatra-traveller-number-inner">

                <?php
                $pricing_id = $pricing->getID();
                $field_name = $pricing_type === "multi" ? "yatra_number_of_person[{$tour_id}][multi_pricing][{$pricing_id}]" : "yatra_number_of_person[{$tour_id}][single_pricing]";

                yatra_nice_input_number_field($field_name, $pricing->getMaximumPax(), $pricing->getMinimumPax(), $person, 'yatra-number-of-person-field');
                ?>

            </div>
            <span><?php echo esc_html($pricing->getLabel()) ?></span>
        </div>
        <div class="yatra-traveller-price">
            <?php if ($pricing->getRegularPrice() != '') { ?>
                <del><?php echo esc_html(yatra_get_price($currency, $pricing->getRegularPrice(true))) ?></del>
            <?php } ?>
            <ins><?php


                echo esc_html(yatra_get_price($currency, $pricing->getFinalPrice()));


                ?></ins>
            <?php
            if (strtolower($pricing->getPricingPer()) == 'group') {

                $pricing_per_string = yatra_get_price($currency, $pricing->getSalesPrice()) . ' Per ' . $pricing->getGroupSize() . ' ' . $pricing->getLabel();
            } else {
                $pricing_per_string = yatra_get_price($currency, $pricing->getSalesPrice()) . ' Per ' . $pricing->getLabel();
            }

            ?>
            <span class=""><?php echo esc_html($pricing_per_string); ?></span>
        </div>
    </div>
</div>