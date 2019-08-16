<?php
/**
 * Shortcodes
 *
 * @package Yatra/Classes
 * @version 1.0.0
 */

defined('ABSPATH') || exit;

/**
 * Yatra Shortcodes class.
 */
class Yatra_Shortcodes
{

    /**
     * Init shortcodes.
     */
    public static function init()
    {
        $shortcodes = array(

            'yatra_checkout' => __CLASS__ . '::checkout',
            'yatra_cart' => __CLASS__ . '::cart',
            'yatra_my_account' => __CLASS__ . '::my_account',
        );

        foreach ($shortcodes as $shortcode => $function) {
            add_shortcode(apply_filters("{$shortcode}_shortcode_tag", $shortcode), $function);
        }


    }

    /**
     * Shortcode Wrapper.
     *
     * @param string[] $function Callback function.
     * @param array $atts Attributes. Default to empty array.
     * @param array $wrapper Customer wrapper data.
     *
     * @return string
     */
    public static function shortcode_wrapper(
        $function,
        $atts = array(),
        $wrapper = array(
            'class' => 'yatra-shortcode-wrapper',
            'before' => null,
            'after' => null,
        )
    )
    {
        ob_start();

        // @codingStandardsIgnoreStart
        echo empty($wrapper['before']) ? '<div class="' . esc_attr($wrapper['class']) . '">' : $wrapper['before'];
        call_user_func($function, $atts);
        echo empty($wrapper['after']) ? '</div>' : $wrapper['after'];
        // @codingStandardsIgnoreEnd

        return ob_get_clean();
    }

    /**
     * Checkout page shortcode.
     *
     * @param array $atts Attributes.
     * @return string
     */
    public static function checkout($atts)
    {
        return self::shortcode_wrapper(array('Yatra_Shortcode_Checkout', 'output'), $atts);
    }


    /**
     * Cart page shortcode.
     *
     * @param array $atts Attributes.
     * @return string
     */
    public static function cart($atts)
    {
        return self::shortcode_wrapper(array('Yatra_Shortcode_Cart', 'output'), $atts);
    }


    /**
     * my account page shortcode.
     *
     * @param array $atts Attributes.
     * @return string
     */
    public static function my_account($atts)
    {
        return self::shortcode_wrapper(array('Yatra_Shortcode_My_Account', 'output'), $atts);
    }

}
