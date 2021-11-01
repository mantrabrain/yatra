<?php
/* @var $pricing Yatra_Tour_Pricing */
?>
<tr>
    <td><span><?php echo esc_html($pricing->getLabel()) ?></span></td>
    <td><span><?php echo esc_html(yatra_get_price($currency, $pricing->getRegularPrice())) ?></span></td>
    <td><span><?php echo esc_html(yatra_get_price($currency, $pricing->getSalesPrice())) ?></span></td>
    <td><span><?php echo esc_html($person) ?></span></td>
    <td><span><?php echo esc_html($pricing->getPricingPer()) ?></span></td>
    <td><span><?php echo esc_html($pricing->getGroupSize()) ?></span></td>

</tr>
