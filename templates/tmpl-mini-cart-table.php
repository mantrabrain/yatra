<?php
defined('ABSPATH') || exit;

if (count($cart_items) < 1) {

    return;
}


?>
<table class="yatra_cart_table yatra_cart_table_responsive cart yatra-cart-form__contents" cellspacing="0">
    <thead>
    <tr>

        <th class="tour-name"><?php echo __('Tour', 'yatra'); ?></th>
        <th class="tour-person"><?php echo __('Persons', 'yatra'); ?></th>
        <th class="tour-subtotal"><?php echo __('Total', 'yatra'); ?></th>
        <th class="tour-remove">&nbsp;</th>
    </tr>
    </thead>
    <tbody>
    <?php foreach ($cart_items as $cart_id => $cart_item) { ?>
        <tr class="yatra-cart-item">

            <?php

            $tour_cart = isset($cart_item['tour']) ? $cart_item['tour'] : array();

            $number_of_person = isset($cart_item['number_of_person']) ? $cart_item['number_of_person'] : 1;

            $pricing_type = isset($cart_item['type']) ? $cart_item['type'] : 'single';

            $yatra_cart_remove_nonce = wp_create_nonce('yatra_cart_remove_tour_item');

            $remove_item = md5($tour_cart->ID);

            $remove_url = add_query_arg(array(
                'yatra_cart_remove_item' => $remove_item,
                'yatra_cart_remove_nonce' => $yatra_cart_remove_nonce

            ), yatra_get_cart_page(true));
            ?>


            <td class="tour-name" data-title="<?php echo esc_attr__('Tour', 'yatra') ?>">
                <a href="<?php echo get_permalink($tour_cart->ID); ?>"><?php echo esc_html($tour_cart->post_title) ?></a>
                <br/>
                <span class="selected-date"><?php
                    echo esc_html($cart_item['selected_date']);
                    ?>
                </span>
            </td>

            <td class="tour-person" data-title="<?php echo esc_attr__('Number of person', 'yatra') ?>">
                <div class="person">
                    <?php
                    echo absint($number_of_person)
                    ?>
                </div>
            </td>


            <td class="tour-subtotal" data-title="<?php echo esc_attr__('Total', 'yatra') ?>">
                <span class="yatra-Price-amount amount"><?php echo yatra_get_price(yatra_get_current_currency_symbol(), yatra_get_final_tour_price($tour_cart->ID, $number_of_person, $cart_item['selected_date'])); ?></span>
                <input type="hidden" name="yatra_tour_start_date[<?php echo esc_attr($tour_cart->ID) ?>]"
                       value="<?php echo esc_attr($cart_item['selected_date']) ?>"/>
            </td>
            <td class="tour-remove">
                <a href="<?php echo $remove_url; ?>"
                   class="remove">×</a>
            </td>
        </tr>
    <?php } ?>

    <tr>

        <th colspan="2">
            <strong><?php echo __('Sub Total', 'yatra') ?></strong>
        </th>
        <td colspan="2"  class="cart-subtotal-price"
            data-title="<?php echo esc_attr__('Sub Total', 'yatra') ?>">
            <strong>
                <?php
                echo yatra_get_price(yatra_get_current_currency_symbol(), yatra()->cart->get_cart_total()); ?>
            </strong>
        </td>
        <th>
        </th>

    </tr>


    </tbody>
</table>