<?php
/**
 * The Template for displaying cart
 * @package     Yatra\Templates
 * @version     2.1.2
 */
defined('ABSPATH') || exit;
if (count($cart_items) < 1) {

    echo '<p>Your tour cart is empty. Please select any of the booking first.</p>';
    return;
}

?>

<form method="post" action="<?php echo admin_url('admin-ajax.php'); ?>" class="yatra-cart-form"><?php

    do_action('before_yatra_cart');

    echo '<div class="yatra-cart-table-wrapper">';

    yatra()->cart->get_cart_table();

    echo '</div>';

    $checkout_page_url = yatra_get_checkout_page(true);

    $proceed_to_checkout_button_text = get_option('yatra_proceed_to_checkout_text', 'Proceed to checkout');
    ?>
    <div class="yatra-proceed-to-checkout-wrap">
        <a href="<?php echo esc_url_raw($checkout_page_url) ?>" class="yatra-button button yatra-proceed-to-checkout">
            <?php echo esc_attr($proceed_to_checkout_button_text); ?></a>
    </div>
</form>
