<?php
defined('ABSPATH') || exit;

if (count($cart_items) < 1) {

    return;
}


?>
<table class="yatra_cart_table yatra_cart_table_responsive cart yatra-cart-form__contents" cellspacing="0">
    <thead>
    <tr style="text-align:left;">
        <th class="tour-remove">&nbsp;</th>
        <th class="tour-thumbnail">&nbsp;</th>
        <th class="tour-name"><?php echo __('Tour', 'yatra'); ?></th>
        <th class="tour-selected-date"><?php echo __('Date', 'yatra'); ?></th>
        <th class="tour-person"><?php echo __('Person - Per - Pricing', 'yatra'); ?></th>
        <th class="tour-subtotal"><?php echo __('Total', 'yatra'); ?></th>
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
            <td class="tour-remove">
                <a href="<?php echo $remove_url; ?>"
                   class="remove">×</a>
            </td>

            <td class="tour-thumbnail">

                <a href="<?php echo get_permalink($tour_cart->ID); ?>" target="_blank">
                    <?php echo get_the_post_thumbnail($tour_cart->ID, 'thumbnail') ?>
                </a>
            </td>

            <td class="tour-name" data-title="<?php echo esc_attr__('Tour', 'yatra') ?>">
                <a href="<?php echo get_permalink($tour_cart->ID); ?>"><?php echo esc_html($tour_cart->post_title) ?></a>
            </td>

            <td class="tour-selected-date" data-title="<?php echo esc_attr__('Date', 'yatra') ?>">
                <span class="selected-date"><?php
                    echo esc_html($cart_item['selected_date']);
                    ?>
                </span>
            </td>


            <td class="tour-person" data-title="<?php echo esc_attr__('Person - Per - Pricing', 'yatra') ?>">
                <div class="person">
                    <?php
                    yatra_cart_edit_person_pricing_details($cart_id, $cart_item, $tour_cart->ID);
                    ?>
                </div>
            </td>

            <td class="tour-subtotal" data-title="<?php echo esc_attr__('Total', 'yatra') ?>">
                <span class="yatra-Price-amount amount"><?php echo yatra_get_price(yatra_get_current_currency_symbol(), yatra_get_final_tour_price($tour_cart->ID, $number_of_person, $cart_item['selected_date'])); ?></span>
                <input type="hidden" name="yatra_tour_start_date[<?php echo esc_attr($tour_cart->ID) ?>]"
                       value="<?php echo esc_attr($cart_item['selected_date']) ?>"/>
            </td>
        </tr>
    <?php } ?>

    <tr>
        <td colspan="6" class="actions">
            <div class="coupon">
                <input type="text" name="yatra_coupon_code" class="yatra-coupon-code"
                       id="yatra_coupon_code" value="" placeholder="<?php echo esc_attr('Coupon Code', 'yatra') ?>"/>
                <button type="submit" class="yatra-button button yatra_apply_coupon" name="yatra_apply_coupon"
                        value="<?php echo esc_attr('Apply coupon', 'yatra') ?>"><?php echo __('Apply coupon', 'yatra') ?>
                </button>
            </div>
            <?php $update_cart_value = get_option('yatra_update_cart_text', 'Update Cart'); ?>
            <button type="submit" class="yatra-button button yatra_update_cart" name="yatra_update_cart"
                    value="<?php echo esc_attr($update_cart_value) ?>"
                    disabled="disabled"><?php echo esc_html($update_cart_value); ?>
            </button>
            <input type="hidden" name="yatra_nonce"
                   value="<?php echo wp_create_nonce('wp_yatra_update_cart_nonce') ?>"/>
            <input type="hidden" name="action" value="yatra_update_cart"/>


        </td>
    </tr>
    <tr>
        <th colspan="2">
        </th>
        <th colspan="2">
            <strong><?php echo __('Sub Total', 'yatra') ?></strong>
        </th>
        <td colspan="2" style="text-align:right;" class="cart-subtotal-price"
            data-title="<?php echo esc_attr__('Sub Total', 'yatra') ?>">
            <strong>
                <?php
                echo yatra_get_price(yatra_get_current_currency_symbol(), yatra()->cart->get_cart_total()); ?>
            </strong>
        </td>
    </tr>

    <?php if (isset($coupon['id'])) { ?>
        <tr>
            <th colspan="2">
            </th>
            <td colspan="2" class="coupon"
                data-title="- <?php echo esc_attr(yatra_get_price(yatra_get_current_currency_symbol(), $coupon['calculated_value'])) ?>">
                <strong><?php echo __('Coupon:', 'yatra') ?></strong>
                <strong><?php echo esc_html($coupon['code']); ?></strong>
                <?php
                $yatra_coupon_remove_nonce = wp_create_nonce('yatra_coupon_remove');

                $remove_url = add_query_arg(array(
                    'yatra_coupon_remove_nonce' => $yatra_coupon_remove_nonce

                ), yatra_get_cart_page(true));
                ?>
                <a href="<?php echo esc_url($remove_url) ?>"><?php echo __('[Remove]', 'yatra') ?></a>
            </td>
            <td class="coupon-content" colspan="2" style="text-align:right;">
                <strong>- <?php
                    echo yatra_get_price(yatra_get_current_currency_symbol(), $coupon['calculated_value']); ?>
                </strong>
            </td>
        </tr>
    <?php } ?>
    <tr>
        <th colspan="2">
        </th>
        <th colspan="2">
            <strong><?php echo __('Total', 'yatra') ?></strong>
        </th>
        <td colspan="2" class="cart-total-price" data-title="<?php echo esc_attr__('Total', 'yatra') ?>"
            style="text-align: right">
            <strong>
                <?php
                echo yatra_get_price(yatra_get_current_currency_symbol(), yatra()->cart->get_cart_total(true)); ?>
            </strong>
        </td>
    </tr>

    </tbody>
</table>