<?php
/**
 * The Template for displaying cart
 * @package     Yatra\Templates
 * @version     2.1.12
 */
defined('ABSPATH') || exit;

$items = $cart_items['items'] ?? array();

$cart_page_url = yatra_get_cart_page(true);

?>
<div class="yatra-mini-cart">
    <a class="yatra-mini-cart-icon" href="<?php echo esc_attr($cart_page_url) ?>">
        <span class="yatra-icon fa fa-shopping-cart"></span>
        <span class="cart-icon-badge"><?php echo esc_html(count($items)) ?></span>
    </a>
    <?php if (count($items) > 0) {
        ?>
        <div class="yatra-mini-cart-inner">
            <?php
            echo '<h2>' . sprintf(esc_html__('You have %d items on the cart', 'yatra'), count($items)) . '</h2>';

            echo '<div class="yatra-mini-cart-table-wrapper">';

            yatra()->cart->get_mini_cart_table();

            echo '</div>';

            $checkout_page_url = yatra_get_checkout_page(true);

            $proceed_to_checkout_button_text = get_option('yatra_proceed_to_checkout_text', 'Proceed to checkout');

            $view_cart_text = __('View Cart', 'yatra');
            ?>
            <div class="yatra-button-group">
                <a href="<?php echo esc_url_raw($cart_page_url) ?>" class="yatra-button button yatra-view-cart-button">
                    <?php echo esc_html($view_cart_text); ?></a>
                <a href="<?php echo esc_url_raw($checkout_page_url) ?>"
                   class="yatra-button button yatra-proceed-to-checkout">
                    <?php echo esc_html($proceed_to_checkout_button_text); ?></a>

            </div>
        </div>
    <?php } ?>
</div>
