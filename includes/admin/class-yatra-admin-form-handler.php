<?php

class Yatra_Admin_Form_Handler
{
	public function __construct()
	{
		add_action('admin_init', array($this, 'export'));


	}

	public function export()
	{

		$nonce_value = yatra_get_var($_REQUEST['yatra_nonce'], yatra_get_var($_REQUEST['_wpnonce'], '')); // @codingStandardsIgnoreLine.

		if (!wp_verify_nonce($nonce_value, 'wp_yatra_export_nonce')) {
			return;
		}


		if (empty($_POST['yatra_action']) || 'yatra_export' !== $_POST['yatra_action']) {
			return;
		}

		$yatra_export_type_list_array = isset($_POST['yatra_export_type_list_array']) ? $_POST['yatra_export_type_list_array'] : array();

		yatra()->exporter->export($yatra_export_type_list_array);
	}


}

new Yatra_Admin_Form_Handler();
