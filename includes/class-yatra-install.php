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
			if (empty($yatra_version) && apply_filters('yatra_enable_setup_wizard', true)) {
				set_transient('_yatra_activation_redirect', 1, 30);
			}
		}
		update_option('yatra_plugin_version', YATRA_VERSION);
		update_option('yatra_plugin_db_version', YATRA_VERSION);

		//save install date
		if (false == get_option('yatra_install_date')) {
			update_option('yatra_install_date', current_time('timestamp'));
		}

		self::setup_environment();

		do_action('yatra_flush_rewrite_rules');


	}

	public static function setup_environment()
	{

		$post_type = new Yatra_Custom_Post_Type();
		$post_type->load();
		$post_type->tour->register();

		$taxonomy = new Yatra_Taxonomy();
		$taxonomy->load();
		$taxonomy->destination_taxonomy->register();
		$taxonomy->attribute_taxonomy->register();
	}

	private static function install_content_and_options()
	{
		$pages = array(

			array(
				'post_content' => '[yatra_checkout]',
				'post_title' => 'Yatra Checkout',
				'post_status' => 'publish',
				'post_type' => 'page',
				'comment_status' => 'closed'

			), array(
				'post_content' => '[yatra_cart]',
				'post_title' => 'Yatra Cart',
				'post_status' => 'publish',
				'post_type' => 'page',
				'comment_status' => 'closed'

			), array(
				'post_content' => '[yatra_my_account]',
				'post_title' => 'Yatra My Account',
				'post_status' => 'publish',
				'post_type' => 'page',
				'comment_status' => 'closed'

			), array(
				'post_content' => 'Your booking has been confirmed. We will get back to you soon.',
				'post_title' => 'Yatra Thank You',
				'post_status' => 'publish',
				'post_type' => 'page',
				'comment_status' => 'closed'

			),
			array(
				'post_content' => 'Your transaction failed, please try again or contact site support.',
				'post_title' => 'Yatra Transaction Failed',
				'post_status' => 'publish',
				'post_type' => 'page',
				'comment_status' => 'closed'

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
			if ($page['post_title'] == 'Yatra My Account') {
				update_option('yatra_my_account_page', $page_id);
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

		$tour_tab_configs = yatra_tour_tab_default_configurations();

		$config_keys = array_keys($tour_tab_configs);

		$options = array(
			'yatra_currency' => 'USD',
			'yatra_booknow_button_text' => 'Book Now',
			'yatra_booknow_loading_text' => 'Loading....',
			'yatra_update_cart_text' => 'Update Cart',
			'yatra_proceed_to_checkout_text' => 'Proceed to Checkout',
			'yatra_order_booking_text' => 'Order Booking',
			'yatra_booking_notification_email_subject_for_customer' => Yatra_Admin_Emails_To_User::get_booking_completed_subject(),
			'yatra_booking_notification_email_content_for_customer' => Yatra_Admin_Emails_To_User::get_booking_completed_message(),
			'yatra_enable_booking_notification_email_for_customer' => 'yes',
			'yatra_enable_guest_checkout' => 'yes',
			'yatra_frontend_tabs_ordering_global' => implode(',', $config_keys)
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
