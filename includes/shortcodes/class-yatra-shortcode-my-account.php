<?php
/**
 * My account Shortcode
 *
 * Used on the my account page, the my account shortcode displays the cart.
 *
 * @package Yatra/Shortcodes/My_Account
 * @version 2.0.0
 */

defined('ABSPATH') || exit;

/**
 * Shortcode cart class.
 */
class Yatra_Shortcode_My_Account
{

    /**
     * Get the shortcode content.
     *
     * @param array $atts Shortcode attributes.
     *
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
        global $wp;


        if (!is_user_logged_in()) {


            yatra_get_template('myaccount/tmpl-form-login.php', array());

        } else {

            self::my_account($atts);


        }
    }

    /**
     * My account page.
     *
     * @param array $atts Shortcode attributes.
     */
    private static function my_account($atts)
    {

        do_action('yatra_before_my_account');

        yatra_get_template('myaccount/tmpl-my-account.php',

            array(
                'current_user' => get_user_by('id', get_current_user_id()),

            ));


    }

}
