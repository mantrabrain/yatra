<?php

namespace Yatra\Core\Shortcodes;


defined('ABSPATH') || exit;

/**
 * Shortcode Login class.
 */
class Login
{

    /**
     * Get the shortcode content.
     *
     * @param array $atts Shortcode attributes.
     * @return string
     */
    public static function get($atts)
    {
        return \Yatra_Shortcodes::shortcode_wrapper(array(__CLASS__, 'output'), $atts);
    }

    /**
     * Output the shortcode.
     *
     * @param array $atts Shortcode attributes.
     */
    public static function output($atts)
    {
        $redirect = isset($atts['redirect']) ? sanitize_text_field($atts['redirect']) : '';

        echo '<div class="yatra-row">';

        echo '<div class="yatra-col-md-12 yatra-col-xs-12 yatra-login-wrap">';

        if (is_user_logged_in()) {

            $account_page_url = yatra_get_my_account_page(true);

            printf(esc_html("%sYou're currently logged in. You can access the My Account page from %shere%s.%s"), '<h2>', '<a href="' . esc_url($account_page_url) . '">', '</a>', '</h2>');

        } else {

            yatra_get_template('myaccount/tmpl-form-login.php', array(
                'redirect' => $redirect,
                'title' => __('Login', 'yatra')
            ));

        }
        echo '</div>';

        echo '</div>';


    }

}
