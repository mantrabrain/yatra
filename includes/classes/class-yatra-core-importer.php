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

			echo '<pre>';
			print_r($this->image_id_mapping);
			print_r($this->term_id_mapping);
			exit;
			$updated_post_ids_mapping = array();

			foreach ($yatra_content_array as $yatra_custom_posts) {


				$yatra_custom_post_arr = $yatra_custom_posts;

				unset($yatra_custom_post_arr['ID']);
				unset($yatra_custom_post_arr['term_taxonomy']);
				unset($yatra_custom_post_arr['meta']);
				unset($yatra_custom_post_arr['image_attributes']);

				$sik_post_id = wp_insert_post($yatra_custom_post_arr);


				$term_taxonomies = isset($yatra_custom_posts['term_taxonomy']) ? $yatra_custom_posts['term_taxonomy'] : array();


				$sik_post_taxonomy_datas = array();
				foreach ($term_taxonomies as $sik_term_taxonomy) {

					$sik_term_id = wp_insert_term(
						sanitize_text_field($sik_term_taxonomy['name']),   // the term
						sanitize_text_field($sik_term_taxonomy['taxonomy']),   // the term
						array(
							'description' => sanitize_text_field($sik_term_taxonomy['description']),
							'slug' => $sik_term_taxonomy['slug'],
							'parent' => $sik_term_taxonomy['parent'],
						)
					);
					if (is_wp_error($sik_term_id)) {
						$error_data = isset($sik_term_id->error_data) ? $sik_term_id->error_data : array();
						$sik_term_id = isset($error_data['term_exists']) ? absint($error_data['term_exists']) : 0;
					} else {
						$sik_term_id = isset($sik_term_id['term_id']) ? absint($sik_term_id['term_id']) : 0;

					}
					if (absint($sik_term_id) > 0) {
						$sik_post_taxonomy_datas[$sik_term_taxonomy['taxonomy']][] = $sik_term_id;
					}
				}


				foreach ($sik_post_taxonomy_datas as $sik_term_tax => $sik_term_ids) {
					$sik_uniq_term_ids = array_unique($sik_term_ids);
					wp_set_object_terms($sik_post_id, $sik_uniq_term_ids, $sik_term_tax);

				}


				$updated_post_ids_mapping[$yatra_custom_posts['ID']] = $sik_post_id;


				$image_attributes = isset($yatra_custom_posts['image_attributes']) ? $yatra_custom_posts['image_attributes'] : array();

				$this->import_image($sik_post_id, $image_attributes);
			}


			foreach ($yatra_content_array as $yatra_custom_posts1) {

				$sik_post_metas = isset($yatra_custom_posts1['meta']) ? $yatra_custom_posts1['meta'] : array();

				$sik_post_id_for_meta = isset($updated_post_ids_mapping[$yatra_custom_posts1['ID']]) ? $updated_post_ids_mapping[$yatra_custom_posts1['ID']] : 0;

				if (absint($sik_post_id_for_meta) > 0) {

					foreach ($sik_post_metas as $sik_post_meta) {

						$sik_meta_value = $sik_post_meta['meta_value'];

						switch ($sik_post_meta['meta_key']) {
							case "course_id":
							case "section_id":
							case "quiz_id":
								$sik_meta_value = absint($sik_meta_value);
								$sik_meta_value = isset($updated_post_ids_mapping[$sik_meta_value]) ? $updated_post_ids_mapping[$sik_meta_value] : '';
								break;
							default:
								$sik_meta_value = $sik_post_meta['meta_value'];
								break;
						}
						add_post_meta($sik_post_id_for_meta, sanitize_text_field($sik_post_meta['meta_key']), $sik_meta_value);

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
}
