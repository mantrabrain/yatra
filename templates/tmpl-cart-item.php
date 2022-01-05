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
            <span class="pricing-label"><?php echo esc_html($pricing->getLabel()) ?></span>
        </div>
        <?php
        $regular_price = $pricing->getRegularPrice();
        $sales_price = $pricing->getSalesPrice();
        $sales_price = $sales_price === '' ? $regular_price : $sales_price;
        $final_price = $pricing->getFinalPrice();
        ?>
        <div class="yatra-traveller-price">
            <?php if ($regular_price != '' && ($regular_price != $sales_price)) { ?>
                <del><?php echo esc_html(yatra_get_price($currency, $pricing->getFinalRegularPrice())) ?></del>
            <?php } ?>
            <ins><?php


                echo esc_html(yatra_get_price($currency, $final_price));


                ?></ins>
            <?php
            if (strtolower($pricing->getPricingPer()) == 'group') {

                $pricing_per_string = yatra_get_price($currency, $sales_price) . ' Per ' . $pricing->getGroupSize() . ' ' . $pricing->getLabel();
            } else {
                $pricing_per_string = yatra_get_price($currency, $sales_price) . ' Per ' . $pricing->getLabel();
            }

            ?>
            <span class="pricing-per"><?php echo esc_html($pricing_per_string); ?></span>
        </div>
    </div>
</div>