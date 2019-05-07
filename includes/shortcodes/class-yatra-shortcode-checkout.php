<?php
/**
 * Checkout Shortcode
 *
 * Used on the checkout page, the checkout shortcode displays the checkout process.
 *
 * @package WooCommerce/Shortcodes/Checkout
 * @version 2.0.0
 */

defined('ABSPATH') || exit;

/**
 * Shortcode checkout class.
 */
class Yatra_Shortcode_Checkout
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

        self::checkout();

    }


    /**
     * Show the checkout.
     */
    private static function checkout()
    {
        // Show non-cart errors.
        do_action('yatra_before_checkout_form_cart_notices');

        $checkout = array();

        $checkout = yatra_get_session('tour_cart');

        yatra_get_template('tmpl-checkout.php', array('checkout' => $checkout));


    }
}
