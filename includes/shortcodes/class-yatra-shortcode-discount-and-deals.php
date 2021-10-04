<?php
/**
 * Discount_And_Deals Shortcode
 *
 * Used on this shortcode to list activity on page
 *
 * @package Yatra/Shortcodes/Discount_And_Deals
 * @version 2.0.6
 */

defined('ABSPATH') || exit;

/**
 * Shortcode checkout class.
 */
class Yatra_Shortcode_Discount_And_Deals
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
        yatra_get_discount_deals_lists($atts);
    }

}
