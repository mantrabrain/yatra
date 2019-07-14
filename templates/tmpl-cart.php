<?php
defined('ABSPATH') || exit;

if (count($cart_items) < 1) {

    echo '<p>Your tour cart is empty. Please select any of the booking first.</p>';
    return;
}

?>

<form method="post" action="<?php echo admin_url('admin-ajax.php'); ?>" class="yatra-cart-form"><?php
    do_action('before_yatra_cart');
    ?>
    <table class="yatra_cart_table yatra_cart_table_responsive cart yatra-cart-form__contents" cellspacing="0">
        <thead>
        <tr>
            <th class="tour-remove">&nbsp;</th>
            <th class="tour-thumbnail">&nbsp;</th>
            <th class="tour-name"><?php echo __('Tour', 'yatra'); ?></th>
            <th class="tour-price"><?php echo __('Price', 'yatra'); ?></th>
            <th class="tour-person"><?php echo __('Per', 'yatra'); ?></th>
            <th class="tour-person"><?php echo __('Person', 'yatra'); ?></th>
            <th class="tour-subtotal"><?php echo __('Total', 'yatra'); ?></th>
        </tr>
        </thead>
        <tbody>
        <?php foreach ($cart_items as $cart_id => $cart_item) { ?>
            <tr class="yatra-cart-item">

                <?php
                $tour_cart = isset($cart_item['tour']) ? $cart_item['tour'] : array();
                $number_of_person = isset($cart_item['number_of_person']) ? absint($cart_item['number_of_person']) : 1;
                $yatra_cart_remove_nonce = wp_create_nonce('yatra_cart_remove_tour_item');
                global $wp;

                $current_url = home_url(add_query_arg(array(), $wp->request));

                $remove_item = md5($tour_cart->ID);

                $remove_url = $current_url . '?remove_item=' . $remove_item . '&yatra_cart_remove_nonce=' . $yatra_cart_remove_nonce;
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

                <td class="tour-price" data-title="Price">
                <span class="yatra-Price-amount amount"><?php echo yatra_tour_price($tour_cart->ID, true) ?>
                </span>
                </td>
                <td class="tour-price" data-title="Per">
                <span class="yatra-per"><?php echo ucwords(get_post_meta($tour_cart->ID, 'yatra_tour_meta_price_per', true)); ?>
                </span>
                </td>

                <td class="tour-person" data-title="Quantity">
                    <div class="person">
                        <label class="screen-reader-text" for="person_5d2b22f3c7240">Beanie with Logo person</label>
                        <input type="number" id="person_5d2b22f3c7240" class="input-text qty text" step="1" min="0"
                               max=""
                               name="cart[1c383cd30b7c298ab50293adfecb7b18][qty]"
                               value="<?php echo($number_of_person) ?>" title="Qty" size="4"
                               inputmode="numeric">
                    </div>
                </td>

                <td class="tour-subtotal" data-title="Total">
                <span class="yatra-Price-amount amount"><span
                            class="yatra-Price-currencySymbol"><?php echo yatra_get_current_currency_symbol(); ?></span><?php echo yatra_get_final_tour_price($tour_cart->ID, $number_of_person); ?></span>
                </td>
            </tr>
        <?php } ?>

        <tr>
            <td colspan="7" class="actions">

                <button type="submit" class="button" name="update_cart" value="Update cart" disabled="">Update cart
                </button>


            </td>
        </tr>


        </tbody>
    </table>

    <input type="hidden" name="yatra_nonce" value="<?php echo wp_create_nonce('wp_yatra_book_selected_tour_nonce') ?>"/>
    <input type="hidden" name="action" value="yatra_book_selected_tour"/>
    <input type="hidden" name="yatra_tour_id" value="<?php //echo absint($cart->ID); ?>"/>
    <input type="submit" name="yatra_checkout_submit"
           value="<?php echo esc_attr(get_option('yatra_order_booking_text', 'Order Booking')); ?>"/>
</form>
