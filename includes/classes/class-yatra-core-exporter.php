<?php

class Yatra_Core_Exporter
{
	private $export_images = array();

	public function export($yatra_export_type_list_array = array())
	{
		$yatra_custom_post_type = isset($yatra_export_type_list_array['custom_post_type']) ? $yatra_export_type_list_array['custom_post_type'] : array();

		$yatra_taxonomy = isset($yatra_export_type_list_array['taxonomy']) ? $yatra_export_type_list_array['taxonomy'] : array();

		$all_terms = $this->get_taxonomy_hierarchy_multiple($yatra_taxonomy);

		$all_custom_post_types = $this->get_custom_post_type($yatra_custom_post_type);


		$export_content = array(
			'images' => $this->export_images,
			'terms' => $all_terms,
			'custom_post_types' => $all_custom_post_types
		);

		$all_export_content['yatra_all_content'] = $export_content;
		$args = array(
			'content' => $all_export_content
		);

		yatra_export($args);

	}

	function get_taxonomy_hierarchy($taxonomy, $parent = 0)
	{
		// only 1 taxonomy
		$taxonomy = is_array($taxonomy) ? array_shift($taxonomy) : $taxonomy;

		// get all direct decendants of the $parent

		$terms = get_terms(array(
			'taxonomy' => $taxonomy,
			'hide_empty' => false,
			'parent' => $parent,
		));

		///$terms = get_terms($taxonomy);		$terms = get_terms($taxonomy, array('parent' => $parent));


		// prepare a new array.  these are the children of $parent
		// we'll ultimately copy all the $terms into this new array, but only after they
		// find their own children
		$children = array();

		// go through all the direct decendants of $parent, and gather their children
		foreach ($terms as $term) {
			// recurse to get the direct decendants of "this" term
			$term->children = $this->get_taxonomy_hierarchy($taxonomy, $term->term_id);


			// add the term to our new array
			$term_id = $term->term_id;
			unset($term->term_id);
			unset($term->term_taxonomy_id);
			unset($term->parent);
			unset($term->count);
			unset($term->slug);
			unset($term->term_group);
			$meta = array();
			switch ($taxonomy) {
				case "destination":
					$destination_image_id = get_term_meta($term_id, 'destination_image_id', true);
					$meta['destination_image_id'] = $destination_image_id;
					$this->export_images($destination_image_id);
					break;
				case "activity":
					$activity_image_id = get_term_meta($term_id, 'activity_image_id', true);
					$meta['activity_image_id'] = $activity_image_id;
					$this->export_images($activity_image_id);
					break;
				case "attributes":
					$meta['attribute_field_type'] = get_term_meta($term_id, 'attribute_field_type', true);;
					$meta['yatra_attribute_meta'] = get_term_meta($term_id, 'yatra_attribute_meta', true);;
					break;
			}
			$term->meta = $meta;

			$children[$term_id] = $term;
		}

		// send the results back to the caller
		return $children;
	}

	function get_taxonomy_hierarchy_multiple($taxonomies, $parent = 0)
	{
		if (!is_array($taxonomies)) {
			$taxonomies = array($taxonomies);
		}

		$results = array();

		foreach ($taxonomies as $taxonomy) {
			$terms = $this->get_taxonomy_hierarchy($taxonomy, $parent);

			if ($terms) {
				$results[$taxonomy] = $terms;
			}
		}

		return $results;
	}

	public function get_custom_post_type($cpts = array())
	{
		$all_cpt_data = array();
		foreach ($cpts as $cpt) {
			$args = array(
				'numberposts' => -1,
				'post_type' => $cpt
			);

			$cpt_data = get_posts($args);

			foreach ($cpt_data as $cpt_data_index => $single_cpt_data) {
				$post_meta = get_post_meta($single_cpt_data->ID);
				if (isset($post_meta['_edit_last'])) {
					unset($post_meta['_edit_last']);
				}
				if (isset($post_meta['_edit_lock'])) {
					unset($post_meta['_edit_lock']);
				}
				if (isset($post_meta['_wp_old_date'])) {
					unset($post_meta['_wp_old_date']);
				}
				$post_meta_featured_image_array = isset($post_meta['_thumbnail_id']) ? $post_meta['_thumbnail_id'] : array();
				$post_meta_featured_image_id = isset($post_meta_featured_image_array[0]) ? $post_meta_featured_image_array[0] : null;
				$this->export_images($post_meta_featured_image_id);
				if (isset($post_meta['yatra_tour_meta_gallery'])) {
					$yatra_tour_meta_gallery_string = isset($post_meta['yatra_tour_meta_gallery'][0]) ? $post_meta['yatra_tour_meta_gallery'][0] : array();

					$yatra_tour_meta_gallery_array = explode(',', $yatra_tour_meta_gallery_string);


					foreach ($yatra_tour_meta_gallery_array as $yatra_tour_meta_gallery_image_id) {

						$this->export_images($yatra_tour_meta_gallery_image_id);
					}
				}

				$post_terms_list = wp_get_object_terms($single_cpt_data->ID, array('destination', 'activity'));

				$post_terms = array();

				if (is_array($post_terms_list) && @count($post_terms_list) > 0) {

					foreach ($post_terms_list as $single_term_item) {
						$post_terms[$single_term_item->taxonomy][] = $single_term_item->term_id;
					}
				}

				unset($cpt_data[$cpt_data_index]->ID);
				unset($cpt_data[$cpt_data_index]->post_author);
				unset($cpt_data[$cpt_data_index]->post_password);
				unset($cpt_data[$cpt_data_index]->post_name);
				unset($cpt_data[$cpt_data_index]->to_ping);
				unset($cpt_data[$cpt_data_index]->pinged);
				unset($cpt_data[$cpt_data_index]->post_content_filtered);
				unset($cpt_data[$cpt_data_index]->post_parent);
				unset($cpt_data[$cpt_data_index]->guid);
				unset($cpt_data[$cpt_data_index]->menu_order);
				unset($cpt_data[$cpt_data_index]->post_mime_type);
				unset($cpt_data[$cpt_data_index]->comment_count);
				unset($cpt_data[$cpt_data_index]->filter);

				$cpt_data[$cpt_data_index]->meta = $post_meta;
				$cpt_data[$cpt_data_index]->terms = $post_terms;
			}


			$all_cpt_data[$cpt] = $cpt_data;
		}
		return $all_cpt_data;
	}

	public function export_images($image_id = null)
	{
		if (absint($image_id) > 0) {
			$this->export_images[$image_id] = wp_get_attachment_image_url($image_id, 'full');
		}
	}
}
