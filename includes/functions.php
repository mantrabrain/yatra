<?php
defined('ABSPATH') || exit;

// Load Helpers

include_once YATRA_ABSPATH . 'includes/yatra-html-functions.php';
include_once YATRA_ABSPATH . 'includes/helpers/yatra-country-helper.php';
include_once YATRA_ABSPATH . 'includes/helpers/yatra-currency-helper.php';
include_once YATRA_ABSPATH . 'includes/helpers/yatra-font-helper.php';
include_once YATRA_ABSPATH . 'includes/template-tags.php';
include_once YATRA_ABSPATH . 'includes/yatra-destination-functions.php';
include_once YATRA_ABSPATH . 'includes/yatra-activity-functions.php';
include_once YATRA_ABSPATH . 'includes/yatra-misc-functions.php';


if (!function_exists('yatra_tour_tabs')) {
	function yatra_tour_tabs()
	{
		$tour_tabs_array = array(
			'options' => array(
				'title' => __('Options', 'yatra'),
				'icon' => '',
			),
			'itinerary' => array(
				'title' => __('Itinerary', 'yatra'),
				'icon' => '',
			),
			'cost_info' => array(
				'title' => __('Cost Info', 'yatra'),
				'icon' => '',
			),
			'facts' => array(
				'title' => __('Facts', 'yatra'),
				'icon' => '',
			),
			'faq' => array(
				'title' => __('FAQ', 'yatra'),
				'icon' => '',
			),
		);

		return apply_filters('yatra_tour_tabs', $tour_tabs_array);
	}
}

if (!function_exists('yatra_tour_metabox_tabs')) {

	function yatra_tour_metabox_tabs()
	{
		$metabox_tabs = array(

			'general' => array(
				'title' => esc_html__('General & Dates', 'yatra'),
				'is_active' => true,
				'settings' => yatra_tour_general_configurations()
			),
			'pricing' => array(
				'title' => esc_html__('Pricing', 'yatra'),
				'settings' => yatra_tour_pricing_configurations()
			),

			'attributes' => array(
				'title' => esc_html__('Attributes', 'yatra'),
				'settings' => yatra_tour_attributes()
			),
			'tour_tabs' => array(
				'title' => esc_html__('Tour Tabs', 'yatra'),
				'settings' => yatra_tour_tab_configurations()
			),
		);

		return apply_filters('yatra_tour_metabox_tabs', $metabox_tabs);
	}
}


if (!function_exists('yatra_set_session')) {

	function yatra_set_session($key = '', $value = '')
	{
		if (!session_id()) {
			session_start();
		}

		$yatra_session_id = "yatra_session";

		if (!empty($key) && !empty($value)) {

			$_SESSION[$yatra_session_id][$key] = $value;

			return true;
		}
		return false;

	}
}

if (!function_exists('yatra_get_session')) {

	function yatra_get_session($key = '')
	{

		$yatra_session_id = "yatra_session";

		if (!empty($key)) {

			if (isset($_SESSION[$yatra_session_id][$key])) {

				return $_SESSION[$yatra_session_id][$key];
			}

		}
		if (isset($_SESSION[$yatra_session_id])) {

			return $_SESSION[$yatra_session_id];
		}

		return array();

	}
}

if (!function_exists('yatra_clear_session')) {

	function yatra_clear_session($key = '')
	{
		if (!session_id()) {
			session_start();
		}


		$yatra_session_id = "yatra_session";

		if (!empty($key)) {

			if (isset($_SESSION[$yatra_session_id][$key])) {

				unset($_SESSION[$yatra_session_id][$key]);

				return true;
			}

		}
		if (isset($_SESSION[$yatra_session_id])) {

			unset($_SESSION[$yatra_session_id]);

			return true;
		}

		return false;

	}
}

if (!function_exists('yatra_get_template')) {

	function yatra_get_template($template_name, $args = array(), $template_path = '', $default_path = '')
	{
		$cache_key = sanitize_key(implode('-', array('template', $template_name, $template_path, $default_path)));
		$template = (string)wp_cache_get($cache_key, 'yatra');

		if (!$template) {
			$template = yatra_locate_template($template_name, $template_path, $default_path);
			wp_cache_set($cache_key, $template, 'yatra');
		}
		// Allow 3rd party plugin filter template file from their plugin.
		$filter_template = apply_filters('yatra_get_template', $template, $template_name, $args, $template_path, $default_path);

		if ($filter_template !== $template) {
			if (!file_exists($filter_template)) {
				/* translators: %s template */
				_doing_it_wrong(__FUNCTION__, sprintf(__('%s does not exist.', 'yatra'), '<code>' . $template . '</code>'), '1.0.1');
				return;
			}
			$template = $filter_template;
		}

		$action_args = array(
			'template_name' => $template_name,
			'template_path' => $template_path,
			'located' => $template,
			'args' => $args,
		);

		if (!empty($args) && is_array($args)) {
			if (isset($args['action_args'])) {
				_doing_it_wrong(
					__FUNCTION__,
					__('action_args should not be overwritten when calling yatra_get_template.', 'yatra'),
					'1.0.0'
				);
				unset($args['action_args']);
			}
			extract($args); // @codingStandardsIgnoreLine
		}

		do_action('yatra_before_template_part', $action_args['template_name'], $action_args['template_path'], $action_args['located'], $action_args['args']);

		include $action_args['located'];

		do_action('yatra_after_template_part', $action_args['template_name'], $action_args['template_path'], $action_args['located'], $action_args['args']);
	}
}

if (!function_exists('yatra_locate_template')) {
	function yatra_locate_template($template_name, $template_path = '', $default_path = '')
	{
		if (!$template_path) {
			$template_path = yatra()->template_path();
		}

		if (!$default_path) {
			$default_path = yatra()->plugin_template_path();
		}

		// Look within passed path within the theme - this is priority.
		$template = locate_template(
			array(
				trailingslashit($template_path) . $template_name,
				$template_name,
			)
		);

		// Get default template/.
		if (!$template) {
			$template = $default_path . $template_name;
		}
		// Return what we found.
		return apply_filters('yatra_locate_template', $template, $template_name, $template_path);
	}
}

if (!function_exists('yatra_single_tour_tabs')) {

	function yatra_single_tour_tabs()
	{
		global $post;


	}
}

if (!function_exists('yatra_get_checkout_page')) {

	function yatra_get_checkout_page($get_permalink = false)
	{

		$page_id = absint(get_option('yatra_checkout_page'));

		if ($page_id < 1) {

			global $wpdb;

			$page_id = $wpdb->get_var('SELECT ID FROM ' . $wpdb->prefix . 'posts WHERE post_content LIKE "%[yatra_checkout]%" AND post_parent = 0');
		}

		$page_permalink = get_permalink($page_id);

		if ($get_permalink) {

			return $page_permalink;
		}

		return $page_id;


	}
}


if (!function_exists('yatra_get_cart_page')) {

	function yatra_get_cart_page($get_permalink = false)
	{
		$page_id = absint(get_option('yatra_cart_page'));

		if ($page_id < 1) {

			global $wpdb;

			$page_id = $wpdb->get_var('SELECT ID FROM ' . $wpdb->prefix . 'posts WHERE post_content LIKE "%[yatra_cart]%" AND post_parent = 0');
		}

		$page_permalink = get_permalink($page_id);

		if ($get_permalink) {

			return $page_permalink;
		}

		return $page_id;


	}
}

if (!function_exists('yatra_get_booking_statuses')) {

	function yatra_get_booking_statuses($status_key = '')
	{
		$statuses = apply_filters(
			'yatra_booking_statuses', array(
				'yatra-pending' => __('Pending', 'yatra'),
				'yatra-processing' => __('Processing', 'yatra'),
				'yatra-on-hold' => __('On Hold', 'yatra'),
				'yatra-completed' => __('Completed', 'yatra'),
				'yatra-cancelled' => __('Cancelled', 'yatra')
			)
		);

		if (empty($status_key)) {

			return $statuses;
		}
		if (isset($statuses[$status_key])) {
			return $statuses[$status_key];
		}
		return $statuses;

	}
}

if (!function_exists('yatra_the_posts_navigation')) :
	/**
	 * Documentation for function.
	 */
	function yatra_the_posts_navigation()
	{
		the_post_navigation(array(
			'prev_text' => '<span class="screen-reader-text">' . esc_html__('Previous Post', 'yatra') . '</span><span class="nav-title">%title</span>',
			'next_text' => '<span class="screen-reader-text">' . esc_html__('Next Post', 'yatra') . '</span><span class="nav-title">%title</span>',
		));
	}
endif;

if (!function_exists('yatra_get_template_part')) {

	function yatra_get_template_part($slug, $name = '')
	{
		$path = "{$slug}.php";

		if ('' !== $name) {

			$path = "{$slug}-{$name}.php";
		}
		$template = yatra_locate_template($path, false, false);

		require $template;

	}

}
if (!function_exists('yatra_posted_by')) :
	/**
	 * Prints HTML with meta information about theme author.
	 */
	function yatra_posted_by()
	{
		printf(
		/* translators: 1: SVG icon. 2: post author, only visible to screen readers. 3: author link. */
			'<span class="byline"><span class="screen-reader-text">%1$s</span><span class="author vcard"><a class="url fn n" href="%2$s">%3$s</a></span></span>',
			__('Posted by', 'yatra'),
			esc_url(get_author_posts_url(get_the_author_meta('ID'))),
			esc_html(get_the_author())
		);
	}
endif;

if (!function_exists('yatra_posted_on')) :
	/**
	 * Prints HTML with meta information for the current post-date/time.
	 */
	function yatra_posted_on()
	{
		$time_string = '<time class="entry-date published updated" datetime="%1$s">%2$s</time>';
		if (get_the_time('U') !== get_the_modified_time('U')) {
			//$time_string = '<time class="entry-date published" datetime="%1$s">%2$s</time><time class="updated" datetime="%3$s">%4$s</time>';
		}

		$time_string = sprintf(
			$time_string,
			esc_attr(get_the_date(DATE_W3C)),
			esc_html(get_the_date()),
			esc_attr(get_the_modified_date(DATE_W3C)),
			esc_html(get_the_modified_date())
		);

		printf(
			'<span class="posted-on"><a href="%1$s" rel="bookmark">%2$s</a></span>',
			esc_url(get_permalink()),
			$time_string
		);
	}
endif;

if (!function_exists('yatra_entry_meta')) {

	function yatra_entry_meta()
	{
		?>
		<div class="entry-meta">
			<?php yatra_posted_by(); ?>
			<?php yatra_posted_on(); ?>
			<?php
			// Edit post link.
			edit_post_link(
				sprintf(
					wp_kses(
					/* translators: %s: Name of current post. Only visible to screen readers. */
						__('Edit <span class="screen-reader-text">%s</span>', 'yatra'),
						array(
							'span' => array(
								'class' => array(),
							),
						)
					),
					get_the_title()
				),
				'<span class="edit-link">',
				'</span>'
			);
			?>
		</div><!-- .meta-info -->
		<?php
	}

}


/**
 * Get permalink settings
 *
 * @return array
 * @since  1.0.0
 */
function yatra_get_permalink_structure()
{

	$permalinks = wp_parse_args(
		(array)get_option('yatra_permalinks', array()),
		array(
			'yatra_tour_base' => 'tour',
			'yatra_destination_base' => 'destination',
			'yatra_activity_base' => 'activity',
			'yatra_attributes_base' => 'attributes',
		)
	);

	// Ensure rewrite slugs are set.
	$permalinks['yatra_tour_base'] = untrailingslashit(empty($permalinks['yatra_tour_base']) ? 'tour' : $permalinks['yatra_tour_base']);
	$permalinks['yatra_destination_base'] = untrailingslashit(empty($permalinks['yatra_destination_base']) ? 'destination' : $permalinks['yatra_destination_base']);
	$permalinks['yatra_activity_base'] = untrailingslashit(empty($permalinks['yatra_activity_base']) ? 'activity' : $permalinks['yatra_activity_base']);
	return $permalinks;
}

if (!function_exists('yatra_tour_price')) {

	function yatra_tour_price($tour_id, $is_html = true)
	{
		$yatra_tour_meta_regular_price = get_post_meta($tour_id, 'yatra_tour_meta_regular_price', true);

		$yatra_tour_meta_sales_price = get_post_meta($tour_id, 'yatra_tour_meta_sales_price', true);

		$price_per_person = empty($yatra_tour_meta_sales_price) || $yatra_tour_meta_sales_price == 0 ? $yatra_tour_meta_regular_price : $yatra_tour_meta_sales_price;

		if (!$is_html) {

			return $price_per_person;
		}
		$price_string = '<span class="regular-price"><del>' . yatra_get_current_currency_symbol() . '' . $yatra_tour_meta_regular_price . '</del></span>';

		$price_string .= '<br/><span class="sales-price">' . yatra_get_current_currency_symbol() . '' . $yatra_tour_meta_sales_price . '</del></span>';

		if (empty($yatra_tour_meta_sales_price) || $yatra_tour_meta_sales_price == 0) {

			$price_string = '<span class="regular-price">' . yatra_get_current_currency_symbol() . '' . $yatra_tour_meta_regular_price . '</span>';


		}
		return $price_string;
	}

}

if (!function_exists('yatra_get_final_tour_price')) {

	function yatra_get_final_tour_price($tour_id, $number_of_people = 1, $type = 'single')
	{

		if (is_array($number_of_people) && $type == 'single') {
			$type = 'multi';
		}

		$yatra_tour_meta_regular_price = absint(get_post_meta($tour_id, 'yatra_tour_meta_regular_price', true));

		$yatra_tour_meta_sales_price = absint(get_post_meta($tour_id, 'yatra_tour_meta_sales_price', true));

		$yatra_tour_meta_price_per = get_post_meta($tour_id, 'yatra_tour_meta_price_per', true);

		$yatra_tour_meta_group_size = absint(get_post_meta($tour_id, 'yatra_tour_meta_group_size', true));

		if ($yatra_tour_meta_group_size == 0) {

			$yatra_tour_meta_group_size = 1;
		}
		if ($type == 'single') {

			$number_of_people = absint($number_of_people);

			$price_per_person = empty($yatra_tour_meta_sales_price) || $yatra_tour_meta_sales_price == 0 ? $yatra_tour_meta_regular_price : $yatra_tour_meta_sales_price;

			if ($yatra_tour_meta_price_per == 'person') {

				return $price_per_person * $number_of_people;
			}
			if ($yatra_tour_meta_price_per == 'group') {


				$number_of_group = ceil($number_of_people / $yatra_tour_meta_group_size);

				return $price_per_person * $number_of_group;
			}
			return $price_per_person;

		} else if ($type == "multi") {

			$total_price = 0;

			$yatra_multiple_pricing = get_post_meta($tour_id, 'yatra_multiple_pricing', true);

			foreach ($yatra_multiple_pricing as $pricing_key => $price_args) {
				$person = is_array($number_of_people) && isset($number_of_people[$pricing_key]) ? absint($number_of_people[$pricing_key]) : 0;
				$regular_price = isset($price_args['regular_price']) ? absint($price_args['regular_price']) : 0;
				$sales_price = isset($price_args['sales_price']) ? absint($price_args['sales_price']) : 0;
				$sales_price = isset($price_args['sales_price']) && '' != $price_args['sales_price'] ? $sales_price : $regular_price;
				switch ($yatra_tour_meta_price_per) {
					case "person":
						$total_price += ($sales_price * $person);
						break;
					case "group":
						$number_of_group = ceil($person / $yatra_tour_meta_group_size);
						$total_price += ($sales_price * $number_of_group);
						break;
				}
			}
			return $total_price;
		}
	}
}


if (!function_exists('yatra_update_booking_status')) {

	function yatra_update_booking_status($booking_id = 0, $status = 'yatra-pending')
	{
		$yatra_booking_statuses = yatra_get_booking_statuses();

		if ($booking_id < 1 || !isset($yatra_booking_statuses[$status])) {

			return false;
		}

		do_action('yatra_before_booking_status_change', array(
			'booking_id' => $booking_id,
			'status' => $status
		));

		$booking_array = array();
		$booking_array['ID'] = $booking_id;
		$booking_array['post_status'] = $status;

		// Update the post into the database
		wp_update_post($booking_array);

		do_action('yatra_after_booking_status_change', array(
			'booking_id' => $booking_id,
			'status' => $status
		));

		return true;
	}
}


if (!function_exists('yatra_global_smart_tags')) {

	function yatra_global_smart_tags()
	{
		return apply_filters(
			'yatra_global_smart_tags',
			array(
				'home_url' => get_home_url(),
				'blog_info' => get_bloginfo(),
			)
		);
	}
}

if (!function_exists('yatra_booking_smart_tags')) {

	function yatra_booking_smart_tags($booking_id = 0)
	{
		$smart_tags['booking_code'] = '';

		$smart_tags['booking_status'] = '';

		$smart_tags['tour_lists'] = '';

		if ($booking_id > 0) {

			$booking_post = get_post($booking_id);

			$booking_status = isset($booking_post->post_status) ? $booking_post->post_status : '';

			$all_post_statuses = yatra_get_booking_statuses();

			$booking_meta_params = get_post_meta($booking_id, 'yatra_booking_meta_params', true);

			$booking_meta = get_post_meta($booking_id, 'yatra_booking_meta', true);

			$smart_tags['booking_code'] = isset($booking_meta_params['booking_code']) ? $booking_meta_params['booking_code'] : '';

			$smart_tags['booking_status'] = isset($all_post_statuses[$booking_status]) ? $all_post_statuses[$booking_status] : '';

			foreach ($booking_meta as $tour_id => $meta) {

				$smart_tags['tour_lists'] .= '<a href="' . get_permalink($tour_id) . '" target="_blank">' . $meta['yatra_tour_name'] . '</a><br/>';

			}

		}

		return apply_filters(
			'yatra_booking_smart_tags',
			$smart_tags
		);
	}
}

if (!function_exists('yatra_customer_smart_tags')) {

	function yatra_customer_smart_tags($booking_id = 0)
	{
		$smart_tags['customer_name'] = '';

		$smart_tags['customer_email'] = '';

		if ($booking_id > 0) {

			$booking_meta_params = get_post_meta($booking_id, 'yatra_booking_meta_params', true);

			$customer_info = isset($booking_meta_params ['yatra_tour_customer_info']) ? $booking_meta_params ['yatra_tour_customer_info'] : array();

			$smart_tags['customer_name'] = isset($customer_info['fullname']) ? $customer_info['fullname'] : '';

			$smart_tags['customer_email'] = isset($customer_info['email']) ? $customer_info['email'] : '';
		}

		return apply_filters(
			'yatra_customer_smart_tags',
			$smart_tags
		);
	}
}
if (!function_exists('yatra_get_date')) {

	function yatra_get_date()
	{
		return date('Y-m-d H:i:s');
	}
}

if (!function_exists('yatra_all_smart_tags')) {

	function yatra_all_smart_tags($booking_id = 0)
	{
		$yatra_global_smart_tags = yatra_global_smart_tags();

		$yatra_booking_smart_tags = yatra_booking_smart_tags($booking_id);

		$yatra_customer_smart_tags = yatra_customer_smart_tags($booking_id);

		$all_tags = array_merge($yatra_global_smart_tags, $yatra_booking_smart_tags, $yatra_customer_smart_tags);

		return apply_filters('yatra_all_smart_tags', $all_tags);
	}
}


/**
 * Get data if set, otherwise return a default value or null. Prevents notices when data is not set.
 *
 * @param mixed $var Variable.
 * @param string $default Default value.
 * @return mixed
 * @since
 */
if (!function_exists(('yatra_get_var'))) {
	function yatra_get_var(&$var, $default = null)
	{
		return isset($var) ? $var : $default;
	}
}

if (!function_exists('is_yatra_error')) {

	function is_yatra_error($thing)
	{
		return ($thing instanceof WP_Error);
	}


}

if (!function_exists('yatra_logout_url')) {

	function yatra_logout_url()
	{

		return wp_logout_url(get_permalink());

	}


}

if (!function_exists('yatra_get_my_account_page')) {

	function yatra_get_my_account_page($get_permalink = false)
	{
		$page_id = absint(get_option('yatra_my_account_page'));

		if ($page_id < 1) {

			global $wpdb;

			$page_id = $wpdb->get_var('SELECT ID FROM ' . $wpdb->prefix . 'posts WHERE post_content LIKE "%[yatra_my_account]%" AND post_parent = 0');
		}

		$page_permalink = get_permalink($page_id);

		if ($get_permalink) {

			return $page_permalink;
		}

		return $page_id;


	}
}

if (!function_exists('yatra_enable_guest_checkout')) {

	function yatra_enable_guest_checkout()
	{
		if ('yes' === get_option('yatra_enable_guest_checkout', 'yes')) {

			return true;
		}
		return false;

	}
}

if (!function_exists('yatra_payment_gateway_fields')) {
	function yatra_payment_gateway_fields()
	{
		$yatra_get_active_payment_gateways = (yatra_get_active_payment_gateways());

		$yatra_get_payment_gateways = yatra_get_payment_gateways();

		if (count($yatra_get_active_payment_gateways) > 0) {

			echo '<h2 class="yatra-payment-gateway-title">' . __('Payment Gateways', 'yatra') . '</h2>';

			echo '<ul class="yatra-payment-gateway">';

			foreach ($yatra_get_payment_gateways as $gateway) {

				$gateway_id = isset($gateway['id']) ? $gateway['id'] : '';

				if (in_array($gateway_id, $yatra_get_active_payment_gateways)) {

					echo '<li>';

					echo '<label>';

					echo '<input type="radio" name="yatra-payment-gateway" value="' . esc_attr($gateway_id) . '"/>';

					echo '&nbsp;<span>' . $gateway['frontend_title'] . '</span>';

					echo '</label>';

					echo '</li>';
				}

			}
			echo '</ul>';
		}
	}
}


if (!function_exists('yatra_maybeintempty')) {
	function yatra_maybeintempty($var)
	{
		if ($var == '') {
			return '';
		}
		return absint($var);
	}
}

if (!function_exists('yatra_frontend_tour_tabs_ordering')) {

	function yatra_frontend_tour_tabs_ordering($type = 'array', $post_ID = null)
	{
		$ordering_string = '';

		if (!is_null($post_ID)) {

			$ordering_string = get_post_meta($post_ID, 'yatra_tour_meta_tour_tabs_ordering', true);
		}
		if (!$ordering_string) {

			$ordering_string = get_option('yatra_frontend_tabs_ordering_global');
		}

		if (!$ordering_string) {

			$tour_tab_configs = yatra_tour_tab_default_configurations();

			$config_keys = array_keys($tour_tab_configs);

			$ordering_string = implode(',', $config_keys);
		}
		return $type === 'array' ? explode(',', $ordering_string) : $ordering_string;

	}
}

