<?php
/**
 * Cart Shortcode
 *
 * Used on the cart page, the cart shortcode displays the cart.
 *
 * @package Yatra/Shortcodes/Cart
 * @version 2.0.0
 */

defined('ABSPATH') || exit;

/**
 * Shortcode cart class.
 */
class Yatra_Shortcode_Cart
{

    /**
     * Get the shortcode content.
     *
     * @param array $atts Shortcode attributes.
     * @return string
     */
    public static function get($atts)
    {
        return Yatra_Shortcodes::shortcode_wrapper(array(__CLASS__, 'output'), $atts);
    }

    /**
     * Output the shortcode.
     *
     * @param array $atts Shortcode attributes.
     */
    public static function output($atts)
    {

        self::cart();

    }


    /**
     * Show the cart.
     */
    private static function cart()
    {
        // Show non-cart errors.
        do_action('yatra_before_cart_template');

        $cart = yatra()->cart->get_cart();

        if (!is_array($cart)) {
            $cart = array();
        }

        yatra_get_template('tmpl-cart.php', array('cart_items' => $cart));


    }
}
