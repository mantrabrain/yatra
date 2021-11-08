<?php
/* @var $pricing Yatra_Tour_Pricing */
?>
<tr class="new-item">
    <td><span><?php echo esc_html($number_of_person) ?></span></td>
    <td><span><?php echo esc_html($pricing->getLabel()) ?></span></td>
    <td><span><?php echo esc_html(yatra_get_price($currency, $pricing->getRegularPrice())) ?></span></td>
    <td><span><?php echo esc_html(yatra_get_price($currency, $pricing->getSalesPrice())) ?></span></td>
    <td><span><?php echo esc_html($pricing->getPricingPer()) ?></span></td>
    <td><span><?php echo $pricing->getPricingPer() === "group" ? esc_html($pricing->getGroupSize()) : ''; ?></span></td>
    <?php if ($count === 1 || $merge) { ?>
        <td <?php echo $merge ? 'rowspan="'.absint($count).'"' : ''; ?>>
            <span><?php echo esc_html(yatra_get_price($currency, $total_price)) ?></span></td>
    <?php } ?>
</tr>