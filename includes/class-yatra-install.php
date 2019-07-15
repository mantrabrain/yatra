<?php
/**
 * Yatra install setup
 *
 * @package Yatra
 * @since   1.0.0
 */

defined('ABSPATH') || exit;

/**
 * Main Yatra_Install Class.
 *
 * @class Yatra
 */
final class Yatra_Install
{

    public static function install()
    {
        $yatra_version = get_option('yatra_plugin_version');

        if (empty($yatra_version)) {
            self::install_content_and_options();
        } else {
            update_option('yatra_plugin_version', YATRA_VERSION);
        }

    }

    private static function install_content_and_options()
    {
        $pages = array(

            array(
                'post_content' => '[yatra_checkout]',
                'post_title' => 'Yatra Checkout',
                'post_status' => 'publish',
                'post_type' => 'page',
            ), array(
                'post_content' => '[yatra_cart]',
                'post_title' => 'Yatra Cart',
                'post_status' => 'publish',
                'post_type' => 'page',
            ), array(
                'post_content' => 'Your booking has been confirmed. We will get back to you soon.',
                'post_title' => 'Yatra Thank You',
                'post_status' => 'publish',
                'post_type' => 'page',
            ),
        );

        foreach ($pages as $page) {

            $page_id = wp_insert_post($page);

            if ($page['post_title'] == 'Yatra Checkout') {
                update_option('yatra_checkout_page', $page_id);
            }
            if ($page['post_title'] == 'Yatra Cart') {
                update_option('yatra_cart_page', $page_id);
            }
            if ($page['post_title'] == 'Yatra Thank You') {
                update_option('yatra_thankyou_page', $page_id);
            }

        }

        $terms = array(
            array(
                'term' => 'Altitude',
                'taxonomy' => 'attributes',
                'slug' => 'altitude',
                'meta' => array(
                    'attribute_field_type' => 'text_field',
                    'yatra_attribute_meta' => array(
                        'content' => ''
                    )
                )
            ), array(
                'term' => 'Height',
                'taxonomy' => 'attributes',
                'slug' => 'height',
                'meta' => array(
                    'attribute_field_type' => 'text_field',
                    'yatra_attribute_meta' => array(
                        'content' => ''
                    )
                )
            ),
        );

        foreach ($terms as $term) {

            $term_id = wp_insert_term(
                $term['term'], // the term
                $term['taxonomy'], // the taxonomy
                array(
                    'slug' => $term['slug'],
                )
            );
            $meta = isset($term['meta']) ? $term['meta'] : array();

            foreach ($meta as $meta_key => $meta_value) {

                add_term_meta($term_id, $meta_key, $meta_value, true);

            }
        }

        $options = array(
            'yatra_currency' => 'USD',
            'yatra_booknow_button_text' => 'Book Now',
            'yatra_booknow_loading_text' => 'Loading....',
            'yatra_update_cart_text' => 'Update Cart',
            'yatra_proceed_to_checkout_text' => 'Proceed to Checkout',
            'yatra_order_booking_text' => 'Order Booking'
        );

        foreach ($options as $option_key => $option_value) {

            update_option($option_key, $option_value);
        }

    }

    public static function init()
    {

    }


}

Yatra_Install::init();