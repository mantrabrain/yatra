<?php
defined('ABSPATH') || exit;

if (count($cart_items) < 1) {

    return;
}

?>
<table class="yatra_cart_table yatra_cart_table_responsive cart yatra-cart-form__contents" cellspacing="0">
    <thead>
    <tr>
        <th class="tour-remove">&nbsp;</th>
        <th class="tour-thumbnail">&nbsp;</th>
        <th class="tour-name"><?php echo __('Tour', 'yatra'); ?></th>
        <th class="tour-person"><?php echo __('Per', 'yatra'); ?></th>
        <th class="tour-person"><?php echo __('Person - Pricing', 'yatra'); ?></th>
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

            $remove_url = yatra_get_cart_page(true) . '?yatra_cart_remove_item=' . $remove_item . '&yatra_cart_remove_nonce=' . $yatra_cart_remove_nonce;
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

            <td class="tour-name" data-title="Product">
                <a href="<?php echo get_permalink($tour_cart->ID); ?>"><?php echo esc_html($tour_cart->post_title) ?></a>
            </td>

            <td class="tour-price" data-title="Per">
                <span class="yatra-per"><?php echo ucwords(get_post_meta($tour_cart->ID, 'yatra_tour_meta_price_per', true)); ?>
                </span>
            </td>

            <td class="tour-person" data-title="Quantity">
                <div class="person">
                    <?php
                    yatra_cart_edit_person_pricing_details($cart_id, $cart_item, $tour_cart->ID);
                    ?>
                </div>
            </td>

            <td class="tour-subtotal" data-title="Total">
                <span class="yatra-Price-amount amount"><span
                            class="yatra-price-currencySymbol"><?php echo yatra_get_current_currency_symbol(); ?></span><?php echo yatra_get_final_tour_price($tour_cart->ID, $number_of_person, $pricing_type); ?></span>
            </td>
        </tr>
    <?php } ?>

    <tr>
        <td colspan="7" class="actions">

            <?php $update_cart_value = get_option('yatra_update_cart_text', 'Update Cart'); ?>
            <button type="submit" class="button yatra_update_cart" name="yatra_update_cart"
                    value="<?php echo esc_attr($update_cart_value) ?>"
                    disabled="disabled"><?php echo esc_html($update_cart_value); ?>
            </button>
            <input type="hidden" name="yatra_nonce"
                   value="<?php echo wp_create_nonce('wp_yatra_update_cart_nonce') ?>"/>
            <input type="hidden" name="action" value="yatra_update_cart"/>


        </td>
    </tr>


    </tbody>
</table>