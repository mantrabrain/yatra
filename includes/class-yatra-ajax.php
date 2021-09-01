<?php
defined('ABSPATH') || exit;

class Yatra_Ajax
{


	private function admin_ajax_actions()
	{
		$actions = array(

			'change_tour_attribute',
			'import_content'
		);

		return $actions;

	}

	private function public_ajax_actions()
	{
		$actions = array(
			'tour_add_to_cart',
			'update_cart'
		);
		return $actions;
	}

	private function validate_nonce($nonce_action = '', $nonce_value = '')
	{
		$debug_backtrace = debug_backtrace();
		if (@isset($debug_backtrace[1]['function'])) {

			$nonce_action = 'wp_yatra_' . $debug_backtrace[1]['function'] . '_nonce';
		}
		if (empty($nonce_value)) {
			$nonce_value = isset($_REQUEST['yatra_nonce']) ? $_REQUEST['yatra_nonce'] : '';
		}

		return wp_verify_nonce($nonce_value, $nonce_action);

	}

	private function ajax_error()
	{
		return array('message' => __('Something wrong, please try again.', 'yatra'), 'status' => false);
	}

	public function __construct()
	{

		add_action('admin_init', array($this, 'import_content'), 15);

		$admin_actions = $this->admin_ajax_actions();
		$public_ajax_actions = $this->public_ajax_actions();
		$all_ajax_actions = array_unique(array_merge($admin_actions, $public_ajax_actions));

		foreach ($all_ajax_actions as $action) {
			add_action('wp_ajax_yatra_' . $action, array($this, $action));
			if (in_array($action, $public_ajax_actions)) {
				add_action('wp_ajax_nopriv_yatra_' . $action, array($this, $action));
			}

		}


	}

	public function tour_add_to_cart()
	{
		$status = $this->validate_nonce();

		if (!$status) {
			wp_send_json_error($this->ajax_error());
		}
		$tour_id = isset($_POST['tour_id']) ? absint($_POST['tour_id']) : 0;

		$number_of_persons = isset($_POST['yatra_number_of_person']) ? ($_POST['yatra_number_of_person']) : array();

		if ($tour_id < 1 || (!is_array($number_of_persons))) {
			wp_send_json_error($this->ajax_error());
		}
		if (count($number_of_persons) < 1) {
			wp_send_json_error($this->ajax_error());
		}
		if (!isset($number_of_persons['single_pricing']) && !isset($number_of_persons['multi_pricing'])) {
			wp_send_json_error();
		}

		$type = 'single';

		if (isset($number_of_persons['single_pricing'])) {

			$number_of_persons = $number_of_persons['single_pricing'];
			$type = 'single';

		} else if (isset($number_of_persons['multi_pricing'])) {

			$number_of_persons = $number_of_persons['multi_pricing'];
			$type = 'multi';

		} else {
			$number_of_persons = 0;
		}


		$tour = get_post($tour_id);

		if (!isset($tour->post_type) || $tour->post_type != 'tour') {
			wp_send_json_error($this->ajax_error());
		}
		$status = yatra()->cart->update_cart($tour_id, $number_of_persons, $type);

		if ($status) {

			$return_data = array(

				'cart_page_url' => yatra_get_cart_page(true)
			);
			wp_send_json_success($return_data);
		}

		wp_send_json_error();

	}

	public function change_tour_attribute()
	{
		$status = $this->validate_nonce();

		if (!$status) {
			wp_send_json_error($this->ajax_error());
		}
		$attribute_type = isset($_POST['attribute_type']) ? sanitize_text_field($_POST['attribute_type']) : '';

		$is_edit = isset($_POST['is_edit']) ? (boolean)($_POST['is_edit']) : false;


		$attribute_parser = new Yatra_Tour_Attribute_Parser($attribute_type);

		$parsed_html = $attribute_parser->parse(true, $is_edit);

		if (empty($attribute_type) || !$parsed_html) {
			wp_send_json_error($this->ajax_error());
		}

		wp_send_json_success($parsed_html);


	}

	public function update_cart()
	{
		$status = $this->validate_nonce();

		if (!$status) {
			wp_send_json_error($this->ajax_error());
		}

		$number_of_persons = isset($_POST['yatra_number_of_person']) ? $_POST['yatra_number_of_person'] : array();


		foreach ($number_of_persons as $tour_id => $number_of_person) {

			$tour_id = absint($tour_id);

			$type = 'single';

			if (isset($number_of_person['single_pricing'])) {

				$number_of_person = $number_of_person['single_pricing'];
				$type = 'single';

			} else if (isset($number_of_person['multi_pricing'])) {

				$number_of_person = $number_of_person['multi_pricing'];
				$type = 'multi';

			} else {
				$number_of_person = 0;
			}

			if ($tour_id > 0 && yatra()->cart->is_valid_tour_id_on_cart($tour_id)) {

				yatra()->cart->update_cart($tour_id, $number_of_person, $type);

			}

		}

		$cart_table = yatra()->cart->get_cart_table(true);

		wp_send_json_success($cart_table);

	}

	public function import_content()
	{
		//	return;

		$status = $this->validate_nonce();

		if (!$status) {
			return;
			//wp_send_json_error($this->ajax_error());
		}


		$target_dir = yatra()->get_upload_dir(true);

		$target_file = $target_dir . 'file.json';

		$status = yatra()->importer->import($target_file);

		var_dump($status);
		exit;
		unlink($target_file);

		if ($status) {
			wp_send_json_success();
		} else {
			wp_send_json_error();
		}
	}


}

new Yatra_Ajax();
