<?php

class Yatra_Core_Importer
{
	private $image_id_mapping = array();

	private $term_id_mapping = array();

	public function import($target_file)
	{
		if (!file_exists($target_file)) {
			return false;
		}
		try {

			$json_content = file_get_contents($target_file);

			$yatra_all_content_array = json_decode($json_content, true);

			$yatra_all_content_array = is_array($yatra_all_content_array) ? $yatra_all_content_array : array();

			if (!isset($yatra_all_content_array['yatra_all_content'])) {
				return false;
			}

			$yatra_content_array = is_array($yatra_all_content_array['yatra_all_content']) ? $yatra_all_content_array['yatra_all_content'] : array();


			$yatra_terms = isset($yatra_content_array['terms']) ? $yatra_content_array['terms'] : array();

			$yatra_custom_post_types = isset($yatra_content_array['custom_post_types']) ? $yatra_content_array['custom_post_types'] : array();

			$yatra_images = isset($yatra_content_array['images']) ? $yatra_content_array['images'] : array();

			$this->upload_images($yatra_images);

			foreach ($yatra_terms as $taxonomy => $terms) {

				$this->insert_term($terms);
			}

			/*echo '<pre>';
			print_r($this->image_id_mapping);
			print_r($this->term_id_mapping);
			exit;*/


			foreach ($yatra_custom_post_types as $custom_post_type => $custom_post_type_datas) {

				foreach ($custom_post_type_datas as $custom_post_type_single_data) {

					if ($custom_post_type == $custom_post_type_single_data['post_type']) {

						$custom_post_type_metas = $custom_post_type_single_data['meta'];

						$custom_post_type_terms = $custom_post_type_single_data['terms'];

						unset($custom_post_type_single_data['meta']);

						unset($custom_post_type_single_data['terms']);

						$cpt_inserted_id = wp_insert_post($custom_post_type_single_data);

						if (!is_wp_error($cpt_inserted_id)) {

							foreach ($custom_post_type_metas as $cpt_meta_id => $cpt_meta_value) {

								if ($cpt_meta_id == 'yatra_tour_meta_gallery') {

									$cpt_meta_values = explode(',', $cpt_meta_value);

									$cpt_meta_values_updated = array();

									foreach ($cpt_meta_values as $cpt_meta_value_image_id) {

										$cpt_meta_values_updated[] = $this->get_new_image_id($cpt_meta_value_image_id);
									}
									$cpt_meta_value = @implode(',', $cpt_meta_values_updated);

								}
								add_post_meta($cpt_inserted_id, $cpt_meta_id, $cpt_meta_value);

							}

							foreach ($custom_post_type_terms as $cpt_term_id => $cpt_term_taxonomy) {
								$cpt_term_id = $this->get_new_term_id($cpt_term_id);
								$term_taxonomy_ids = wp_set_object_terms($cpt_inserted_id, $cpt_term_id, $cpt_term_taxonomy);
							}
						}
					}
				}
			}
			return true;

		} catch (Exception $e) {
			return false;
		}

	}


	public function insert_term($terms = array(), $parent_term_id = 0)
	{

		foreach ($terms as $term_id => $term_data) {

			$inserted_term_id = $term_id;

			if (!term_exists($term_data['name'], $term_data['taxonomy'], $parent_term_id)) {

				$inserted_term_id = wp_insert_term(

					$term_data['name'],   // the term

					$term_data['taxonomy'], // the taxonomy

					array(
						'description' => $term_data['description'],

						'parent' => $parent_term_id,
					)
				);
			}

			$metas = isset($term_data['meta']) ? $term_data['meta'] : array();

			if (!is_wp_error($inserted_term_id)) {

				$this->term_id_mapping[$term_id] = $inserted_term_id;

				foreach ($metas as $meta_key => $meta_value) {


					if ($meta_key == 'destination_image_id' || $meta_key == 'activity_image_id') {

						$meta_value = $this->get_new_image_id($meta_value);
					}

					add_term_meta($inserted_term_id, $meta_key, $meta_value);

				}
			}

			$children = isset($term_data['children']) ? $term_data['children'] : array();

			if (count($children) > 0) {
				$this->insert_term($children, $inserted_term_id);
			}
		}

	}

	private function upload_images($images = array())
	{
		foreach ($images as $image_id => $image_url) {

			$imported_image_id = $this->import_image($image_url);

			$this->image_id_mapping[$image_id] = $imported_image_id;
		}
	}

	private function import_image($url = null)
	{
		if (is_null($url)) {
			return null;
		}
		$pathinfo = pathinfo($url);

		$filename = $pathinfo['filename'] . '.' . $pathinfo['extension'];

		$uploaddir = wp_upload_dir();

		$uploadfile = $uploaddir['path'] . '/' . $filename;

		$contents = @file_get_contents($url);

		$savefile = fopen($uploadfile, 'w');

		fwrite($savefile, $contents);

		fclose($savefile);

		$wp_filetype = wp_check_filetype(basename($filename), null);

		$attachment = array(
			'post_mime_type' => $wp_filetype['type'],
			'post_title' => $filename,
			'post_content' => '',
			'post_status' => 'inherit'
		);

		$attach_id = wp_insert_attachment($attachment, $uploadfile);

		$imagenew = get_post($attach_id);

		$fullsizepath = get_attached_file($imagenew->ID);

		$attach_data = wp_generate_attachment_metadata($attach_id, $fullsizepath);

		wp_update_attachment_metadata($attach_id, $attach_data);

		return $attach_id;


	}

	private function get_new_image_id($old_image_id = null)
	{
		if (is_null($old_image_id) || '' == $old_image_id) {
			return null;
		}
		if (isset($this->image_id_mapping[$old_image_id])) {
			return $this->image_id_mapping[$old_image_id];
		}
		return $old_image_id;

	}

	private function get_new_term_id($old_term_id = null)
	{
		if (is_null($old_term_id) || '' == $old_term_id) {
			return null;
		}
		if (isset($this->term_id_mapping[$old_term_id])) {
			return $this->term_id_mapping[$old_term_id];
		}
		return $old_term_id;
	}
}
